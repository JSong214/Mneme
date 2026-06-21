# Mneme - Product Spec and Technical Design

## 1. Product Concept

Project Memory Assistant is a single-user AI app that helps small teams preserve and query project context from scattered project materials.

The product is not a generic document chatbot. It builds a structured project memory from uploaded notes, requirements, decisions, tasks, and discussions, then uses that memory together with RAG to answer project questions with evidence.

The core promise:

> Upload project documents, then ask why decisions were made, what remains unresolved, who owns what, and where the evidence came from.

## 2. Target User

Primary user:

- Project manager
- Tech lead
- Founder
- Small-team operator

The user works in an environment where project context is scattered across meeting notes, planning docs, decision logs, task lists, and chat exports.

Main pain points:

- Decisions are made in meetings but forgotten later.
- New teammates struggle to understand why the project evolved a certain way.
- Open questions and action items get buried.
- Project context exists, but it is hard to retrieve precisely.

## 3. MVP Scope

The MVP is a single-user demo app with multiple projects.

Supported input:

- `.md`
- `.txt`

Core capabilities:

1. Create and view projects.
2. Upload project documents.
3. Ingest documents into chunks and structured memory.
4. Ask project questions and receive structured JSON-backed answers.
5. Browse extracted project memory.
6. Run lightweight evals for retrieval and groundedness.

## 4. Non-Goals

The MVP will not include:

- Authentication
- Organizations
- Team invites
- Role-based permissions
- Slack OAuth
- Notion integration
- Google Docs integration
- PDF parsing
- Graph RAG
- Agentic RAG
- Reranking
- Complex job queue infrastructure

These are possible V2 features, but they are intentionally excluded from the MVP to keep the project focused on RAG quality, structured memory, and product demonstration.

## 5. Demo Project

The built-in demo dataset will use a fictional project:

**Atlas Billing Revamp**

This is a SaaS team project focused on redesigning billing, pricing, and checkout.

Example source files:

- `project-brief.md`
- `meeting-2026-04-03-kickoff.md`
- `meeting-2026-04-10-pricing.md`
- `meeting-2026-04-17-checkout.md`
- `slack-export-billing-thread.md`
- `decision-log.md`
- `open-questions.md`
- `tasks.md`

This domain is useful because it naturally contains:

- Pricing decisions
- Billing risks
- Checkout implementation tasks
- Migration concerns
- Open questions
- Cross-functional tradeoffs

## 6. Core Workflows

### 6.1 Create Project

The user creates a project workspace.

Each project contains:

- Documents
- Chunks
- Extracted memories
- Ask history
- Eval runs

### 6.2 Upload Documents

The user uploads one or more `.md` or `.txt` files.

For each file, the system:

1. Creates a `Document` record with status `processing`.
2. Parses the text.
3. Splits the text into chunks.
4. Generates embeddings for chunks.
5. Extracts structured project memories.
6. Marks the document as `ready`.

If processing fails, the document is marked `failed` and stores an error message.

### 6.3 Ask Project Memory

The user asks a project question, such as:

- Why did we choose tiered pricing instead of usage-based pricing?
- What open questions remain for checkout migration?
- Who owns the pricing page update?
- What decisions were made about failed payment retries?

The system retrieves relevant chunks and structured memories, then generates a structured answer.

### 6.4 Browse Memory

The user can browse extracted project memory by type:

- Decisions
- Action items
- Open questions
- Risks

### 6.5 Run Evals

The user can run a fixed eval set against the demo project.

The eval checks:

- Whether expected sources were retrieved.
- Whether the generated answer is grounded in evidence.

## 7. Pages

### 7.1 Projects

Purpose:

- List projects.
- Create a new project.
- Open an existing project.

### 7.2 Project Overview

Purpose:

- Show high-level project state.

Suggested metrics:

- Document count
- Ready documents
- Failed documents
- Chunk count
- Decision count
- Action item count
- Open question count
- Risk count
- Last ingestion time

### 7.3 Documents

Purpose:

- Upload `.md` and `.txt` files.
- Show document processing status.
- Show extracted memory count per document.

Document statuses:

- `processing`
- `ready`
- `failed`

### 7.4 Ask

Purpose:

- Ask questions about project memory.
- Display structured answers with evidence.

Answer sections:

- Direct answer
- Evidence
- Confidence
- Missing information
- Related memories

### 7.5 Memory

Purpose:

- Browse extracted structured memory.

Tabs:

- Decisions timeline
- Action items
- Open questions
- Risks

### 7.6 Eval

Purpose:

- Demonstrate retrieval and answer quality.

Displays:

- Eval question
- Expected sources
- Retrieved sources
- Source match pass/fail
- Groundedness score
- Answer confidence
- Latency
- Token/cost estimate

## 8. Data Model

### 8.1 Project

Represents a project workspace.

Fields:

- `id`
- `name`
- `description`
- `createdAt`
- `updatedAt`

### 8.2 Document

Represents an uploaded source file.

Fields:

- `id`
- `projectId`
- `fileName`
- `mimeType`
- `rawText`
- `status`
- `errorMessage`
- `createdAt`
- `updatedAt`

### 8.3 Chunk

Represents a retrievable text chunk.

Fields:

- `id`
- `projectId`
- `documentId`
- `content`
- `chunkIndex`
- `tokenCount`
- `embedding`
- `createdAt`

### 8.4 Decision

Represents an extracted project decision.

Fields:

- `id`
- `projectId`
- `documentId`
- `title`
- `summary`
- `rationale`
- `date`
- `participants`
- `sourceQuote`
- `createdAt`

### 8.5 ActionItem

Represents an extracted task or follow-up.

Fields:

- `id`
- `projectId`
- `documentId`
- `title`
- `description`
- `owner`
- `dueDate`
- `status`
- `sourceQuote`
- `createdAt`

### 8.6 OpenQuestion

Represents an unresolved question.

Fields:

- `id`
- `projectId`
- `documentId`
- `question`
- `context`
- `owner`
- `sourceQuote`
- `createdAt`

### 8.7 Risk

Represents an extracted project risk or blocker.

Fields:

- `id`
- `projectId`
- `documentId`
- `title`
- `description`
- `severity`
- `mitigation`
- `sourceQuote`
- `createdAt`

### 8.8 AskRun

Stores a user question and structured answer.

Fields:

- `id`
- `projectId`
- `question`
- `answerJson`
- `latencyMs`
- `tokenUsage`
- `createdAt`

### 8.9 EvalCase

Represents a fixed eval question.

Fields:

- `id`
- `projectId`
- `question`
- `expectedSources`
- `expectedFacts`
- `createdAt`

### 8.10 EvalRun

Stores eval results.

Fields:

- `id`
- `projectId`
- `evalCaseId`
- `answerJson`
- `retrievedSources`
- `sourceMatch`
- `groundednessScore`
- `latencyMs`
- `createdAt`

## 9. Ingestion Pipeline

The ingestion pipeline runs when a document is uploaded.

MVP implementation:

- The database and UI model processing as asynchronous.
- The first implementation may run synchronously inside the upload API route.
- A real queue can be added later without changing the user-facing model.

Pipeline steps:

1. Validate file type.
2. Read text.
3. Save `Document` with status `processing`.
4. Split text into chunks.
5. Generate embeddings for each chunk.
6. Save `Chunk` records.
7. Use an LLM to extract structured memories.
8. Validate extracted JSON with Zod.
9. Save `Decision`, `ActionItem`, `OpenQuestion`, and `Risk` records.
10. Mark document as `ready`.

Failure handling:

- Mark document as `failed`.
- Store a concise `errorMessage`.
- Do not delete the original document record.

## 10. Retrieval and Answer Pipeline

The MVP uses hybrid context assembly:

- Vector search over chunks.
- Structured memory lookup across decisions, action items, open questions, and risks.

Pipeline steps:

1. Receive user question.
2. Generate query embedding.
3. Retrieve top-k relevant chunks using pgvector.
4. Query structured memories related to the question.
5. Assemble context from chunks and memories.
6. Ask the LLM to produce a structured JSON answer.
7. Validate the JSON output with Zod.
8. Store the answer in `AskRun`.
9. Render the JSON in the UI.

The MVP will not use:

- Reranking
- Graph traversal
- Agent planning loops
- Query rewriting

These can be added later and measured through the eval dashboard.

## 11. Answer Schema

The LLM should return structured JSON.

Example:

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

Confidence values:

- `high`
- `medium`
- `low`

Rules:

- If evidence is weak, confidence must not be `high`.
- If the answer is not supported by retrieved context, the model must say what is missing.
- Every answer should include evidence when possible.

## 12. Eval Design

The MVP eval focuses on two metrics.

### 12.1 Evidence Recall

Checks whether expected source files appear in retrieved evidence.

Example eval case:

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

### 12.2 Answer Groundedness

Checks whether the generated answer is supported by retrieved evidence.

MVP approach:

- Use deterministic checks for source matching.
- Use LLM-as-judge for groundedness scoring.

Groundedness score:

- 1: Unsupported or hallucinated
- 2: Weakly supported
- 3: Partially supported
- 4: Mostly supported
- 5: Fully supported

## 13. Tech Stack

Implemented MVP stack:

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
- Local JSON eval dataset

Not currently implemented: `Langfuse` observability and a full component library integration.

Deployment target:

- Vercel for the app
- Neon or Supabase for PostgreSQL with pgvector

## 14. Suggested Repository Structure

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

## 15. V2 Roadmap

Potential next steps after MVP:

1. Upgrade reranking beyond the current baseline vs lightweight rerank eval comparison.
2. Add PDF support.
3. Add Slack or Notion import.
4. Add auth and multi-user workspaces.
5. Add background jobs with Inngest, Trigger.dev, or BullMQ.
6. Add graph visualization for relationships between people, decisions, tasks, and risks.
7. Add agentic retrieval for complex multi-step questions.
8. Add source-level annotation UI for correcting extracted memories.
9. Add exportable project brief or onboarding report.

## 16. Success Criteria

The MVP is successful if:

- A user can create a project and upload demo documents.
- The system extracts useful decisions, action items, open questions, and risks.
- The Ask page returns answers with evidence and confidence.
- The Memory page makes extracted project context easy to browse.
- The Eval page demonstrates retrieval quality and groundedness.
- The README clearly explains the architecture, RAG pipeline, memory model, and eval strategy.
