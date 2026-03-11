import { z } from "zod";

const serverEnvSchema = z.object({
  // Database
  DATABASE_URL: z.string().url("DATABASE_URL must be a valid PostgreSQL connection URL"),

  // Clerk Auth (server-side)
  CLERK_SECRET_KEY: z.string().min(1, "CLERK_SECRET_KEY is required"),
  CLERK_WEBHOOK_SECRET: z.string().min(1, "CLERK_WEBHOOK_SECRET is required"),

  // Anthropic
  ANTHROPIC_API_KEY: z.string().min(1, "ANTHROPIC_API_KEY is required"),

  // OpenAI (embeddings only)
  OPENAI_API_KEY: z.string().min(1, "OPENAI_API_KEY is required"),

  // AWS
  AWS_ACCESS_KEY_ID: z.string().min(1, "AWS_ACCESS_KEY_ID is required"),
  AWS_SECRET_ACCESS_KEY: z.string().min(1, "AWS_SECRET_ACCESS_KEY is required"),
  AWS_REGION: z.string().min(1, "AWS_REGION is required").default("us-east-1"),
  AWS_S3_BUCKET_NAME: z.string().min(1, "AWS_S3_BUCKET_NAME is required"),

  // Arcjet (rate limiting)
  ARCJET_KEY: z.string().min(1, "ARCJET_KEY is required"),

  // Resend (email)
  RESEND_API_KEY: z.string().min(1, "RESEND_API_KEY is required"),

  // Inngest
  INNGEST_EVENT_KEY: z.string().min(1, "INNGEST_EVENT_KEY is required"),
  INNGEST_SIGNING_KEY: z.string().min(1, "INNGEST_SIGNING_KEY is required"),

  // Node environment
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
});

const clientEnvSchema = z.object({
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z
    .string()
    .min(1, "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is required"),
  NEXT_PUBLIC_CLERK_SIGN_IN_URL: z.string().default("/sign-in"),
  NEXT_PUBLIC_CLERK_SIGN_UP_URL: z.string().default("/sign-up"),
  NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL: z.string().default("/dashboard"),
  NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL: z.string().default("/dashboard"),
  NEXT_PUBLIC_APP_URL: z.string().url("NEXT_PUBLIC_APP_URL must be a valid URL"),
});

function validateServerEnv(): z.infer<typeof serverEnvSchema> {
  const parsed = serverEnvSchema.safeParse(process.env);
  if (!parsed.success) {
    console.error(
      "❌ Invalid server environment variables:\n",
      JSON.stringify(parsed.error.flatten().fieldErrors, null, 2)
    );
    throw new Error("Invalid server environment variables. Check your .env file.");
  }
  return parsed.data;
}

function validateClientEnv(): z.infer<typeof clientEnvSchema> {
  // Next.js inlines NEXT_PUBLIC_* at build time for client bundles.
  // Reference each variable explicitly so the compiler can inline them;
  // do NOT spread process.env, which would be empty on the server.
  const parsed = clientEnvSchema.safeParse({
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
    NEXT_PUBLIC_CLERK_SIGN_IN_URL: process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL,
    NEXT_PUBLIC_CLERK_SIGN_UP_URL: process.env.NEXT_PUBLIC_CLERK_SIGN_UP_URL,
    NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL: process.env.NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL,
    NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL: process.env.NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  });
  if (!parsed.success) {
    console.error(
      "❌ Invalid client environment variables:\n",
      JSON.stringify(parsed.error.flatten().fieldErrors, null, 2)
    );
    throw new Error("Invalid client environment variables. Check your .env file.");
  }
  return parsed.data;
}

export type ServerEnv = z.infer<typeof serverEnvSchema>;
export type ClientEnv = z.infer<typeof clientEnvSchema>;
export type Env = ServerEnv & ClientEnv;

// Lazily validated caches — each path validates only what it owns.
let _serverEnv: ServerEnv | null = null;
let _clientEnv: ClientEnv | null = null;

/**
 * Returns validated server-only env vars. Call only from server-side code
 * (API routes, Server Components, server actions). Throws on misconfiguration.
 */
export function getServerConfig(): ServerEnv {
  if (!_serverEnv) {
    _serverEnv = validateServerEnv();
  }
  return _serverEnv;
}

/**
 * Returns validated public (NEXT_PUBLIC_*) env vars. Safe to call from both
 * server and client code. Throws on misconfiguration.
 */
export function getClientConfig(): ClientEnv {
  if (!_clientEnv) {
    _clientEnv = validateClientEnv();
  }
  return _clientEnv;
}

/**
 * Proxy that lazily resolves env vars from the correct validated cache based
 * on whether the key is a public (NEXT_PUBLIC_*) or server-only variable.
 * Use in functions/hooks rather than at module level to preserve lazy init.
 */
export const env = new Proxy({} as Env, {
  get(_target, prop: string) {
    if (prop.startsWith("NEXT_PUBLIC_")) {
      return getClientConfig()[prop as keyof ClientEnv];
    }
    return getServerConfig()[prop as keyof ServerEnv];
  },
});
