# Mneme

Mneme(Project Memory Assistant) is an AI app for preserving and querying project context from scattered team documents.

It is designed as a portfolio-grade AI engineering project: not a generic document chatbot, but a structured project memory system that combines RAG, extracted memories, source-grounded answers, and lightweight evals.

## Why This Exists

Small teams make important decisions across meeting notes, planning docs, task lists, and chat threads. A few weeks later, the hard questions become painful:

- Why did we choose this approach?
- Who owns the follow-up?
- What risks were already discussed?
- Which questions are still unresolved?
- Where is the source for that decision?

Project Memory Assistant turns uploaded project documents into a searchable, structured memory layer.

## Core Idea

Upload `.md` or `.txt` project documents. The app ingests them into:

- retrievable text chunks
- extracted decisions
- action items
- open questions
- risks

When the user asks a question, the app retrieves relevant source chunks and structured memories, then returns a JSON-backed answer with evidence, confidence, missing information, and related memories.

## MVP Features

- Create and browse projects
- Upload `.md` and `.txt` documents
- Track document ingestion status
- Generate embeddings for source chunks
- Extract structured project memories with an LLM
- Ask project questions with source-grounded answers
- Browse decisions, action items, open questions, and risks
- Run lightweight evals for evidence recall and groundedness

## Demo Dataset

The built-in demo project is:

**Atlas Billing Revamp**

A fictional SaaS team project focused on redesigning billing, pricing, and checkout.

Example documents:

- `project-brief.md`
- `meeting-2026-04-03-kickoff.md`
- `meeting-2026-04-10-pricing.md`
- `meeting-2026-04-17-checkout.md`
- `slack-export-billing-thread.md`
- `decision-log.md`
- `open-questions.md`
- `tasks.md`

This demo is intentionally decision-heavy: pricing strategy, checkout migration, tax handling, old-plan migration, payment retry behavior, and ownership gaps all create useful retrieval and evaluation cases.

## Product Pages

### Projects

Create projects and open existing project workspaces.

### Project Overview

Show project health at a glance:

- document count
- ready and failed documents
- chunk count
- decision count
- action item count
- open question count
- risk count
- last ingestion time

### Documents

Upload source files and inspect ingestion status.

Document states:

- `processing`
- `ready`
- `failed`

### Ask

Ask questions about project memory.

Example questions:

- Why did we choose tiered pricing over usage-based pricing?
- What open questions remain for checkout migration?
- Who owns the pricing page update?
- What decisions were made about failed payment retries?

### Memory

Browse extracted memories by type:

- decisions timeline
- action items
- open questions
- risks

### Eval

Run evaluation cases against the demo project.

The MVP focuses on:

- evidence recall
- answer groundedness

## Answer Format

The app uses structured JSON output so the UI can render answers reliably.

```json
{
  "answer": "The team chose tiered pricing because it was easier for customers to predict and simpler for sales to explain.",
  "confidence": "high",
  "evidence": [
    {
      "file": "meeting-2026-04-10-pricing.md",
      "date": "2026-04-10",
      "quote": "Usage-based pricing made monthly bills harder for customers to forecast.",
      "relevance": "Explains why usage-based pricing was rejected."
    }
  ],
  "missingInfo": [
    "No final owner was recorded for updating the public pricing page."
  ],
  "related": {
    "decisions": ["Adopt tiered pricing for launch"],
    "actionItems": ["Update pricing page copy"],
    "openQuestions": ["Should annual plans receive a discount?"],
    "risks": ["Existing customers may object to pricing migration"]
  }
}
```

## Architecture

```text
Upload documents
      |
      v
Parse and chunk text
      |
      v
Generate embeddings ------------+
      |                         |
      v                         |
Store chunks in PostgreSQL      |
      |                         |
      v                         |
Extract structured memories     |
      |                         |
      v                         |
Store decisions, tasks,         |
open questions, and risks       |
                                |
User question                   |
      |                         |
      v                         |
Query embedding                 |
      |                         |
      v                         |
Vector search over chunks <-----+
      |
      v
Fetch related structured memories
      |
      v
Generate validated JSON answer
      |
      v
Render answer, evidence, confidence, and related memories
```

## Retrieval Strategy

The MVP uses hybrid context assembly:

- vector search over document chunks
- structured lookup across decisions, action items, open questions, and risks

The first version intentionally does not use:

- Graph RAG
- agentic RAG
- reranking
- query rewriting

Those are reserved for later iterations and should be evaluated against the baseline before being added.

## Evaluation

Each eval case contains:

- a question
- expected source files
- expected facts

Example:

```json
{
  "question": "Why did the team choose tiered pricing over usage-based pricing?",
  "expectedSources": [
    "meeting-2026-04-10-pricing.md",
    "decision-log.md"
  ],
  "expectedFacts": [
    "usage-based pricing was harder for customers to predict",
    "tiered pricing simplified sales conversations"
  ]
}
```

The eval page reports:

- retrieved sources
- expected sources
- source match result
- groundedness score
- answer confidence
- latency
- token and cost estimate

## Tech Stack

Currently implemented stack:

- `Next.js`
- `React`
- `TypeScript`
- `Tailwind CSS`
- `lucide-react`
- `PostgreSQL`
- `pgvector`
- `Prisma`
- Direct HTTP integration with OpenAI `Responses API` and `Embeddings API`
- `Zod`
- local JSON eval dataset

Not currently implemented, but suitable for future work: `Langfuse` observability and a full component library integration.

Target deployment:

- Vercel for the app
- Neon or Supabase for PostgreSQL with `pgvector`

## Planned Repository Structure

```text
project-memory-assistant/
  app/
    projects/
    api/
  components/
  lib/
    ai/
    ingestion/
    retrieval/
    eval/
    db/
  prisma/
    schema.prisma
  demo-data/
    atlas-billing-revamp/
  evals/
    atlas-billing-revamp.json
  README.md
```

## Environment Variables

The app currently uses:

```text
DATABASE_URL=
OPENAI_API_KEY=
OPENAI_API_BASE_URL= # optional, defaults to https://api.openai.com/v1
```

Do not commit real secrets.

## Local Development

This section will be finalized after the app is scaffolded.

Expected flow:

```bash
npm install
npx prisma migrate dev
npm run dev
```

Then open:

```text
http://localhost:3000
```

## MVP Success Criteria

The MVP is successful when:

- A user can create a project.
- A user can upload the Atlas Billing Revamp demo documents.
- The app extracts decisions, action items, open questions, and risks.
- The Ask page returns answers with evidence and confidence.
- The Memory page makes extracted project context easy to inspect.
- The Eval page demonstrates evidence recall and groundedness.
- The codebase clearly shows the ingestion, retrieval, structured output, and eval pipelines.

## Roadmap

Planned V2 improvements:

1. Upgrade reranking; the app now supports baseline vs lightweight rerank eval comparison, and a model reranker can be added later.
2. Add PDF support.
3. Add Slack or Notion import.
4. Add authentication and multi-user workspaces.
5. Move ingestion into a background job queue.
6. Add graph visualization for people, decisions, tasks, risks, and documents.
7. Add agentic retrieval for complex multi-step questions.
8. Add UI for correcting extracted memories.
9. Add exportable onboarding briefs and project summaries.

## Project Spec

See [PROJECT_SPEC.md](./PROJECT_SPEC.md) for the full product spec and technical design.
