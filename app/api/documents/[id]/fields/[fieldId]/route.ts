import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";

const PatchFieldSchema = z.object({
  fieldValue: z.string().min(1),
});

// ─── PATCH /api/documents/[id]/fields/[fieldId] ───────────────────────────────
// Updates a single extracted field value. Sets source to USER_PROVIDED and
// confidence to 1.0 to indicate a verified human correction.

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; fieldId: string }> }
) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: documentId, fieldId } = await params;

  // Verify the field belongs to a document owned by this user
  const field = await prisma.extractedField.findFirst({
    where: {
      id: fieldId,
      documentId,
      document: { userId },
    },
  });

  if (!field) {
    return NextResponse.json({ error: "Field not found" }, { status: 404 });
  }

  const body = await req.json().catch(() => ({}));
  const parsed = PatchFieldSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request body", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const updated = await prisma.extractedField.update({
    where: { id: fieldId },
    data: {
      fieldValue: parsed.data.fieldValue,
      confidence: 1.0,
      source: "USER_PROVIDED",
    },
  });

  return NextResponse.json({ field: updated });
}
