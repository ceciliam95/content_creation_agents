# Topic Analysis Task Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add task-based multi-select AI topic analysis so users can choose content items, run two-stage analysis, and review structured topic insights in the report tab.

**Architecture:** Store analysis as explicit tasks under an existing keyword search record. Each task keeps its selected source items, per-item structured summaries, and one aggregated report with structured topic suggestions. The UI will connect the content tab selection state to a server-side analysis route that uses backend-only AI configuration.

**Tech Stack:** Next.js App Router, TypeScript, SQLite, server route handlers, React client state, OpenAI-compatible HTTP API

---

## File Structure

- Create: `lib/ai-config.ts`
- Create: `lib/analysis-tasks.ts`
- Create: `app/api/analysis-tasks/route.ts`
- Modify: `lib/db.ts`
- Modify: `lib/search-history.ts`
- Modify: `components/content-tab.tsx`
- Modify: `components/reports-tab.tsx`
- Modify: `components/dashboard.tsx`
- Modify: `app/globals.css`
- Modify: `tests/search-history.test.ts`
- Create: `tests/analysis-tasks.test.ts`
- Modify: `.env.example`

### Task 1: Add failing tests for analysis task persistence

**Files:**
- Create: `tests/analysis-tasks.test.ts`
- Modify: `package.json`

- [ ] **Step 1: Write a failing test for creating an analysis task under an existing search history record**
- [ ] **Step 2: Run `npm test` and verify it fails because the analysis task module does not exist**
- [ ] **Step 3: Write a failing test for storing per-item structured summaries and at least five topic suggestions**
- [ ] **Step 4: Run `npm test` and verify the expected persistence assertions fail**

### Task 2: Extend the SQLite schema for task-based analysis

**Files:**
- Modify: `lib/db.ts`
- Create: `lib/analysis-tasks.ts`
- Modify: `tests/search-history.test.ts`

- [ ] **Step 1: Add tables for `analysis_tasks`, `analysis_task_items`, and `analysis_item_summaries`**
- [ ] **Step 2: Extend `topic_reports` linkage so a report can belong to an analysis task**
- [ ] **Step 3: Implement persistence helpers for creating and reading analysis tasks**
- [ ] **Step 4: Run `npm test` and verify the analysis persistence tests pass**

### Task 3: Add AI workflow helpers

**Files:**
- Create: `lib/ai-config.ts`
- Create: `lib/analysis-tasks.ts`
- Modify: `.env.example`

- [ ] **Step 1: Add backend-only AI config helpers for base URL, API key, and model**
- [ ] **Step 2: Implement prompt-building helpers for stage-one item analysis**
- [ ] **Step 3: Implement prompt-building helpers for stage-two aggregated topic insight generation**
- [ ] **Step 4: Keep AI response parsing constrained to the structured fields defined in the spec**

### Task 4: Add the analysis task API route

**Files:**
- Create: `app/api/analysis-tasks/route.ts`
- Modify: `lib/search-history.ts`
- Modify: `lib/analysis-tasks.ts`

- [ ] **Step 1: Add a POST route that accepts `searchId` and selected content item IDs**
- [ ] **Step 2: Load the selected content, attempt full-text enrichment when possible, and fall back to stored summaries**
- [ ] **Step 3: Run stage-one per-item analysis and persist structured summaries**
- [ ] **Step 4: Run stage-two aggregated insight generation and persist the topic report plus at least five suggestions**
- [ ] **Step 5: Return task metadata for the updated reports tab**

### Task 5: Add content selection UI

**Files:**
- Modify: `components/content-tab.tsx`
- Modify: `components/dashboard.tsx`
- Modify: `app/globals.css`

- [ ] **Step 1: Add per-card checkboxes for selectable content items**
- [ ] **Step 2: Add a sticky bottom action bar that shows selected count, clear selection, and analyze**
- [ ] **Step 3: Submit the selected IDs to the analysis task API**
- [ ] **Step 4: Switch to the report tab and show task progress after submission**

### Task 6: Upgrade the reports tab for task review

**Files:**
- Modify: `components/reports-tab.tsx`
- Modify: `components/dashboard.tsx`
- Modify: `lib/analysis-tasks.ts`

- [ ] **Step 1: Show a task list for the current keyword/source history record**
- [ ] **Step 2: Show per-item structured summaries in the task detail view**
- [ ] **Step 3: Show aggregated report sections and at least five structured topic suggestions**
- [ ] **Step 4: Preserve the existing placeholder behavior for records without tasks**

### Task 7: Verify the feature

**Files:**
- Modify as needed: all touched files

- [ ] **Step 1: Run `npm test`**
- [ ] **Step 2: Run `npm run lint`**
- [ ] **Step 3: Run `npm run build`**
- [ ] **Step 4: Note any remaining AI runtime requirements such as env vars or unsupported source full-text fetches**
