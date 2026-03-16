import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { getServerConfig } from "@/lib/config";

let _s3: S3Client | null = null;

function getClient(): S3Client {
  if (!_s3) {
    const cfg = getServerConfig();
    _s3 = new S3Client({
      region: cfg.AWS_REGION,
      credentials: {
        accessKeyId: cfg.AWS_ACCESS_KEY_ID,
        secretAccessKey: cfg.AWS_SECRET_ACCESS_KEY,
      },
    });
  }
  return _s3;
}

/**
 * Constructs a scoped S3 key for a user document upload.
 * Format: documents/<userId>/<timestamp>_<sanitized-filename>
 */
export function buildS3Key(userId: string, originalFilename: string): string {
  const timestamp = Date.now();
  const sanitized = originalFilename.replace(/[^a-zA-Z0-9._\-]/g, "_");
  return `documents/${userId}/${timestamp}_${sanitized}`;
}

/**
 * Uploads a file buffer to S3 with AES-256 server-side encryption.
 * Returns the key and bucket name for storage in the database.
 */
export async function uploadToS3(params: {
  key: string;
  body: Buffer | Uint8Array;
  contentType: string;
  bucket?: string;
}): Promise<{ key: string; bucket: string }> {
  const cfg = getServerConfig();
  const bucket = params.bucket ?? cfg.AWS_S3_BUCKET_NAME;

  await getClient().send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: params.key,
      Body: params.body,
      ContentType: params.contentType,
      ServerSideEncryption: "AES256",
    })
  );

  return { key: params.key, bucket };
}

/**
 * Downloads a file from S3 and returns it as a Buffer.
 */
export async function downloadFromS3(params: {
  key: string;
  bucket?: string;
}): Promise<Buffer> {
  const cfg = getServerConfig();
  const bucket = params.bucket ?? cfg.AWS_S3_BUCKET_NAME;

  const response = await getClient().send(
    new GetObjectCommand({ Bucket: bucket, Key: params.key })
  );

  if (!response.Body) {
    throw new Error(`S3 object "${params.key}" has no body`);
  }

  const chunks: Uint8Array[] = [];
  for await (const chunk of response.Body as AsyncIterable<Uint8Array>) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

/**
 * Generates a pre-signed URL for direct S3 object download.
 * Default expiry is 15 minutes (900 seconds).
 */
export async function getSignedDownloadUrl(params: {
  key: string;
  bucket?: string;
  expiresInSeconds?: number;
}): Promise<string> {
  const cfg = getServerConfig();
  const bucket = params.bucket ?? cfg.AWS_S3_BUCKET_NAME;

  return getSignedUrl(
    getClient(),
    new GetObjectCommand({ Bucket: bucket, Key: params.key }),
    { expiresIn: params.expiresInSeconds ?? 900 }
  );
}

/**
 * Deletes an object from S3. Errors are non-fatal — caller should log but continue.
 */
export async function deleteFromS3(params: {
  key: string;
  bucket?: string;
}): Promise<void> {
  const cfg = getServerConfig();
  const bucket = params.bucket ?? cfg.AWS_S3_BUCKET_NAME;

  await getClient().send(
    new DeleteObjectCommand({ Bucket: bucket, Key: params.key })
  );
}
