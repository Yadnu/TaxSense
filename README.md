# TaxSense — AI-Powered Tax Assistant

TaxSense is a production-ready, Phase 1 foundation for an AI-powered digital tax assistant focused on US federal and California state income taxes. It provides:

1. **RAG-grounded Tax Chatbot** — ask tax questions and get answers backed by curated IRS and FTB guidance
2. **Secure Authentication** — powered by Clerk; per-user document ownership enforced at every API layer
3. **Hybrid OCR Document Extraction** — upload W-2, 1040, 1040-NR, and 1099 forms; AI extracts structured fields automatically

> **Disclaimer:** TaxSense is an informational tool, not a licensed tax advisor or CPA. Always verify results before filing. See the in-app disclaimer for full details.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16 (App Router), React 19, Tailwind CSS v4, ShadCN UI |
| Backend | Next.js API Routes (Node.js) |
| LLM | Anthropic Claude 3.5 Sonnet via Vercel AI SDK |
| Embeddings | HuggingFace `sentence-transformers/all-MiniLM-L6-v2` (384-dim) |
| OCR | Tesseract.js (rasterized PDF pages + images) |
| PDF Rendering | pdfjs-dist + node-canvas |
| PDF Parsing | pdf-parse (used elsewhere) |
| Database | PostgreSQL + pgvector (via Prisma ORM) |
| Auth | Clerk |
| Storage | AWS S3 (AES-256 server-side encryption) |
| Rate Limiting | Arcjet |
| Background Jobs | Inngest (wired, reserved for Phase 2) |
| Email | Resend + React Email (reserved for Phase 2) |

---

## Prerequisites

- **Node.js** 20 or later
- **PostgreSQL** 15+ with the `pgvector` extension enabled
  ```sql
  CREATE EXTENSION IF NOT EXISTS vector;
  ```
- **AWS** account with S3 bucket for document storage
- **Clerk** account (free tier works)
- **Anthropic** API key
- **HuggingFace** account (free inference API key for embeddings)

---

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

```bash
cp .env.example .env
```

Open `.env` and fill in all values. See the annotated `.env.example` for details on each variable.

### 3. Set up the database

```bash
# Generate the Prisma client
npm run db:generate

# Apply all migrations (creates tables + pgvector HNSW index)
npm run db:migrate
```

### 4. Ingest the tax knowledge base

The chatbot uses a RAG pipeline backed by curated IRS and California FTB knowledge files in the `knowledge/` directory. Run the ingestion script once (or whenever you add new knowledge files):

```bash
npm run ingest
```

This chunks the Markdown files, generates embeddings via HuggingFace, and stores them in PostgreSQL with a pgvector index.

### 5. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

---

## Environment Variables

Copy `.env.example` and populate each value:

```env
# PostgreSQL connection string
DATABASE_URL="postgresql://user:password@localhost:5432/taxsense?schema=public"

# Clerk — Auth
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_..."
CLERK_SECRET_KEY="sk_test_..."
CLERK_WEBHOOK_SECRET="whsec_..."        # From Clerk Dashboard > Webhooks

# Anthropic — LLM (chat + field extraction)
ANTHROPIC_API_KEY="sk-ant-..."

# Groq — optional faster LLM (set to prefer Groq over Anthropic)
GROQ_API_KEY=""

# HuggingFace — embeddings (for RAG)
HUGGINGFACE_API_KEY="hf_..."

# AWS — S3 document storage
AWS_ACCESS_KEY_ID="..."
AWS_SECRET_ACCESS_KEY="..."
AWS_S3_BUCKET_NAME="taxsense-documents"
AWS_REGION="us-east-1"

# Arcjet — rate limiting (optional; limits are skipped when blank)
ARCJET_KEY="ajkey_..."

# Resend — transactional email (reserved for Phase 2)
RESEND_API_KEY="re_..."

# Inngest — background jobs (reserved for Phase 2)
INNGEST_EVENT_KEY="..."
INNGEST_SIGNING_KEY="..."

# App URL
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

---

## Project Structure

```
TaxSense/
├── app/
│   ├── layout.tsx                     Root layout (Clerk, fonts, theme)
│   ├── page.tsx                       Landing page
│   ├── error.tsx                      Root error boundary
│   ├── global-error.tsx               Last-resort global error boundary
│   ├── (auth)/                        Clerk sign-in / sign-up pages
│   ├── (dashboard)/                   Protected pages (sidebar + header)
│   │   ├── layout.tsx
│   │   ├── error.tsx                  Dashboard error boundary
│   │   ├── loading.tsx                Dashboard loading skeleton
│   │   ├── dashboard/page.tsx         Overview + filing progress
│   │   ├── chat/page.tsx              RAG tax chatbot
│   │   ├── documents/page.tsx         Document list + upload
│   │   └── documents/[id]/page.tsx    Document detail + extracted fields
│   └── api/
│       ├── chat/route.ts              Streaming chat (Arcjet rate-limited)
│       ├── documents/route.ts         List + upload documents
│       ├── documents/[id]/route.ts    Get + delete document
│       ├── documents/[id]/extract/    Trigger OCR + field extraction
│       ├── knowledge/ingest/          Admin knowledge ingestion endpoint
│       └── webhooks/clerk/            Clerk user sync webhook
├── components/
│   ├── ui/                            ShadCN primitives
│   ├── chat/                          Chat interface, messages, input, history
│   ├── documents/                     Upload zone, document card, field table
│   ├── layout/                        Sidebar, header, mobile nav
│   └── shared/                        Disclaimer banner, page header
├── lib/
│   ├── ai/                            LLM client, embeddings, prompt templates
│   ├── ocr/                           pdfjs rasterize, Tesseract, field parsing
│   ├── rag/                           Chunker, ingest, retrieve, generate
│   ├── storage/                       S3 upload / download / signed URLs
│   ├── validators/                    Zod schemas for document + chat inputs
│   ├── config.ts                      Validated env vars (Zod)
│   ├── db.ts                          Prisma client singleton
│   └── utils.ts                       cn(), PII masking, formatters
├── prisma/
│   ├── schema.prisma                  Database schema
│   └── migrations/                    SQL migrations (incl. pgvector HNSW index)
├── types/
│   └── extraction.ts                  Zod schemas for extracted field types
├── knowledge/                         Curated IRS + FTB Markdown source files
├── scripts/
│   └── ingest-knowledge.ts            CLI: chunk + embed knowledge files
└── middleware.ts                      Clerk auth middleware
```

---

## OCR Pipeline

1. Download the file from S3.
2. **PDF** — each page is rasterized with pdfjs-dist + `canvas`, then **Tesseract.js** reads text.
3. **Images** — Tesseract.js runs on the uploaded image bytes.
4. **Fields** — regex heuristics per form type; if too few fields are found, **Claude Haiku** fills in from the OCR text.

Extracted fields are stored on the document and shown in the UI with confidence and source (`OCR` vs `LLM_INFERENCE`).

---

## RAG Knowledge Base

The chatbot retrieves relevant passages before generating answers:

1. **Ingestion** (`npm run ingest`): Markdown files in `knowledge/` are chunked (512 tokens, 64-token overlap), embedded with HuggingFace sentence-transformers, and stored in PostgreSQL with a pgvector HNSW index.
2. **Retrieval**: On each query the question is embedded and cosine-similarity search returns the top-5 most relevant chunks.
3. **Generation**: Claude receives the retrieved chunks as grounding context and is instructed to cite sources and decline to answer when context is insufficient.

---

## Database Scripts

```bash
npm run db:generate   # Regenerate Prisma client after schema changes
npm run db:migrate    # Apply pending migrations
npm run db:push       # Push schema directly (dev only, skips migration files)
npm run db:studio     # Open Prisma Studio in browser
npm run ingest        # Re-ingest all knowledge files into vector DB
```

---

## Security

- All routes except `/`, `/sign-in`, `/sign-up`, and webhooks require a valid Clerk session.
- Every database query is scoped to the authenticated user's ID — users cannot access each other's data.
- Documents are stored in a private S3 bucket with AES-256 server-side encryption.
- File access uses short-lived pre-signed URLs (15-minute expiry).
- PII patterns (SSN, EIN, phone, email) are redacted from all server-side log output via `maskPII()`.
- Chat and document upload endpoints are rate-limited via Arcjet.
- All environment variables are validated at startup using Zod — the server fails fast on misconfiguration.

---

## Roadmap

**Phase 1 (current):** Chatbot, authentication, OCR document extraction.

**Phase 2 (planned):** Rule-based tax calculation engine; estimated tax liability; federal + California breakdown; deduction discovery.

**Phase 3 (planned):** Agentic AI with MCP tools; automated form filling; IRS-compliant PDF generation.

**Phase 4 (planned):** Filing integration; compliance checks; audit risk scoring; multi-year support.

---

## License

ISC
