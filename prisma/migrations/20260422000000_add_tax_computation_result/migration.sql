-- CreateTable
CREATE TABLE "TaxComputationResult" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "summary" JSONB NOT NULL,
    "computedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TaxComputationResult_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TaxComputationResult_documentId_key" ON "TaxComputationResult"("documentId");

-- CreateIndex
CREATE INDEX "TaxComputationResult_documentId_idx" ON "TaxComputationResult"("documentId");

-- AddForeignKey
ALTER TABLE "TaxComputationResult" ADD CONSTRAINT "TaxComputationResult_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;
