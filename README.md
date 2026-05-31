# Project Memory Assistant

Project Memory Assistant 是一个用于保存和查询项目上下文的 AI app。

它的目标不是做一个泛用的 document chatbot，而是做一个更像真实产品的 structured project memory system：把零散的项目资料转成可检索的文本片段和结构化项目记忆，再通过 RAG、来源引用、结构化答案和轻量 eval 来回答项目问题。

## 为什么做这个项目

小团队的重要决策经常散落在会议纪要、PRD、任务列表、decision log 和聊天记录里。几周之后，真正难回答的问题通常是：

- 当时为什么选了这个方案？
- 这个 follow-up 谁负责？
- 哪些风险已经讨论过？
- 还有哪些问题没解决？
- 这个决策的来源在哪里？

Project Memory Assistant 会把上传的项目资料变成一个可查询、可浏览、可验证的项目记忆层。

## 核心思路

用户上传 `.md` 或 `.txt` 项目资料后，系统会提取两类信息：

- 可检索的 source chunks
- 结构化项目记忆，包括 decisions、action items、open questions 和 risks

当用户提问时，系统会同时检索相关 source chunks 和 structured memories，然后返回一个 JSON-backed answer，包含 evidence、confidence、missing information 和 related memories。

## MVP 功能

- 创建和浏览 projects
- 上传 `.md` 和 `.txt` documents
- 跟踪 document ingestion status
- 为 source chunks 生成 embeddings
- 使用 LLM 抽取 structured project memories
- 基于项目资料提问，并返回带 evidence 的答案
- 浏览 decisions、action items、open questions 和 risks
- 运行轻量 eval，评估 evidence recall 和 groundedness

## Demo 数据集

内置 demo project：

**Atlas Billing Revamp**

这是一个虚构的 SaaS 团队项目，主题是重做 billing、pricing 和 checkout。

示例 documents：

- `project-brief.md`
- `meeting-2026-04-03-kickoff.md`
- `meeting-2026-04-10-pricing.md`
- `meeting-2026-04-17-checkout.md`
- `slack-export-billing-thread.md`
- `decision-log.md`
- `open-questions.md`
- `tasks.md`

这个 demo 方向适合作品集展示，因为它天然包含定价策略、checkout migration、tax handling、旧套餐迁移、payment retry、任务归属和未解决问题。

## 产品页面

### Projects

创建 projects，并打开已有 project workspace。

### Project Overview

展示项目整体状态：

- document count
- ready documents
- failed documents
- chunk count
- decision count
- action item count
- open question count
- risk count
- last ingestion time

### Documents

上传 source files，并查看 ingestion status。

Document states：

- `processing`
- `ready`
- `failed`

### Ask

向 project memory 提问。

示例问题：

- Why did we choose tiered pricing over usage-based pricing?
- What open questions remain for checkout migration?
- Who owns the pricing page update?
- What decisions were made about failed payment retries?

### Memory

按类型浏览抽取出的 structured memories：

- decisions timeline
- action items
- open questions
- risks

### Eval

针对 demo project 运行 evaluation cases。

MVP 重点评估：

- evidence recall
- answer groundedness

## Answer Format

系统使用 structured JSON output，这样前端可以稳定渲染答案，而不是依赖模型生成一段自由文本。

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

MVP 使用 hybrid context assembly：

- 对 document chunks 做 vector search
- 对 decisions、action items、open questions 和 risks 做 structured lookup

第一版暂不使用：

- Graph RAG
- agentic RAG
- reranking
- query rewriting

这些能力适合作为后续迭代，并且应该先通过 eval 和 MVP baseline 对比后再加入。

## Evaluation

每个 eval case 包含：

- question
- expected source files
- expected facts

示例：

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

Eval page 展示：

- retrieved sources
- expected sources
- source match result
- groundedness score
- answer confidence
- latency
- token and cost estimate

## Tech Stack

- `Next.js`
- `React`
- `TypeScript`
- `Tailwind CSS`
- `shadcn/ui`
- `PostgreSQL`
- `pgvector`
- `Prisma`
- `OpenAI SDK`
- `Zod`
- `Langfuse`
- local JSON eval dataset

目标部署方式：

- Vercel 部署 app
- Neon 或 Supabase 提供带 `pgvector` 的 PostgreSQL

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

预计使用：

```text
DATABASE_URL=
OPENAI_API_KEY=
LANGFUSE_SECRET_KEY=
LANGFUSE_PUBLIC_KEY=
LANGFUSE_BASEURL=
```

不要提交真实 secrets。

## Local Development

这一节会在 app scaffold 完成后补全。

预期流程：

```bash
npm install
npx prisma migrate dev
npm run dev
```

然后打开：

```text
http://localhost:3000
```

## MVP Success Criteria

MVP 成功标准：

- 用户可以创建 project。
- 用户可以上传 Atlas Billing Revamp demo documents。
- 系统可以抽取 decisions、action items、open questions 和 risks。
- Ask page 可以返回带 evidence 和 confidence 的答案。
- Memory page 可以清楚展示抽取出的项目上下文。
- Eval page 可以展示 evidence recall 和 groundedness。
- 代码结构能清晰体现 ingestion、retrieval、structured output 和 eval pipeline。

## Roadmap

V2 方向：

1. 加入 reranking，并与 MVP baseline 对比 eval 结果。
2. 支持 PDF。
3. 支持 Slack 或 Notion import。
4. 加入 authentication 和 multi-user workspaces。
5. 将 ingestion 移到 background job queue。
6. 增加 people、decisions、tasks、risks 和 documents 的 graph visualization。
7. 为复杂多步骤问题加入 agentic retrieval。
8. 增加修正 extracted memories 的 UI。
9. 支持导出 onboarding briefs 和 project summaries。

## Project Spec

完整 product spec 和 technical design 见 [PROJECT_SPEC.md](./PROJECT_SPEC.md)。

