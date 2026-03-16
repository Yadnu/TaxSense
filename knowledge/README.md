# TaxSense Knowledge Base

This folder contains curated tax knowledge documents that are ingested into the RAG (Retrieval-Augmented Generation) vector database to ground the TaxSense AI chatbot's responses.

## Files

| File | Description | Coverage |
|---|---|---|
| `irs-pub-17-income.md` | IRS Publication 17 excerpts | Income types, filing requirements, standard deductions, tax credits |
| `irs-form-instructions-1040.md` | Form 1040 filing guide | How to complete Form 1040, line-by-line instructions, tax brackets |
| `irs-form-instructions-w2.md` | Form W-2 guide | W-2 box definitions, employee vs contractor, multiple employers |
| `california-ftb-540.md` | California state income tax | CA tax brackets, residency rules, FTB 540 instructions, CA-specific credits |
| `tax-filing-faqs.md` | Common filing questions | Deadlines, extensions, deductions, self-employment, crypto, audits |

## How to Ingest

After adding or updating knowledge files, run the ingestion script to update the vector database:

```bash
npm run ingest
```

This script:
1. Reads all `.md` and `.txt` files in this folder (except `README.md`)
2. Splits content into 512-token chunks with 64-token overlap
3. Generates embeddings using OpenAI `text-embedding-3-small`
4. Upserts the chunks into the `KnowledgeChunk` table in PostgreSQL with pgvector

## How to Add New Knowledge

1. Create a new `.md` file in this folder with a clear `# Title` heading.
2. Write content as structured Markdown. Use headers, bullet points, and tables for clarity.
3. Cite the source (IRS publication, FTB form, etc.) at the top.
4. Keep content accurate and current for the relevant tax year.
5. Run `npm run ingest` to add the new content to the vector store.

## Content Guidelines

- **Be specific:** Include exact dollar amounts, percentages, dates, and form numbers.
- **Be current:** Tag each document with the applicable tax year.
- **Be structured:** Use markdown headers to break content into logical sections — the chunker splits on paragraph boundaries, so well-structured documents produce better chunks.
- **Cite sources:** Always reference the IRS publication, FTB form, or tax code section at the top of the file.
- **Avoid opinions:** Stick to factual tax law and IRS/FTB guidance.

## Scope (Phase 1)

Phase 1 covers US federal income taxes and California state income taxes only. Do not add content about other states or international tax regimes in Phase 1.
