# WeChat History SQLite Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add SQLite-backed keyword history persistence for the WeChat monitor and surface that history in the homepage sidebar.

**Architecture:** Keep the third-party WeChat fetch on the server, but move the source of truth into a local SQLite database. The homepage will read and write through API routes so recent searches, historical article snapshots, and future topic-analysis placeholders all stay linked by search record IDs.

**Tech Stack:** Next.js App Router, TypeScript, SQLite, server route handlers, React client state

---

## File Structure

- Create: `data/.gitkeep`
- Create: `lib/db.ts`
- Create: `lib/search-history.ts`
- Create: `app/api/search-history/route.ts`
- Modify: `app/api/wechat-articles/route.ts`
- Modify: `lib/wechat-monitor.ts`
- Modify: `components/dashboard.tsx`
- Modify: `components/content-tab.tsx`
- Modify: `components/reports-tab.tsx`
- Modify: `components/settings-tab.tsx`
- Modify: `app/globals.css`
- Modify: `.gitignore`
- Modify: `package.json`
- Modify: `tests/wechat-monitor.test.ts`
- Create: `tests/search-history.test.ts`

### Task 1: Add database contract tests

**Files:**
- Create: `tests/search-history.test.ts`
- Modify: `package.json`

- [ ] **Step 1: Write a failing test for initializing the SQLite schema**
- [ ] **Step 2: Run `npm test` and verify the schema test fails because the DB layer does not exist**
- [ ] **Step 3: Write a failing test for saving a keyword search with linked articles**
- [ ] **Step 4: Run `npm test` and verify the persistence test fails for the expected reason**

### Task 2: Build the SQLite layer

**Files:**
- Create: `lib/db.ts`
- Create: `lib/search-history.ts`
- Create: `data/.gitkeep`
- Modify: `.gitignore`

- [ ] **Step 1: Implement database initialization with tables for searches, articles, reports, and suggestions**
- [ ] **Step 2: Implement save helpers for a completed search and its returned article set**
- [ ] **Step 3: Implement read helpers for recent search history and search detail by ID**
- [ ] **Step 4: Run `npm test` and verify the new DB tests pass**

### Task 3: Persist searches from the WeChat API route

**Files:**
- Modify: `app/api/wechat-articles/route.ts`
- Modify: `lib/wechat-monitor.ts`
- Modify: `tests/wechat-monitor.test.ts`

- [ ] **Step 1: Write a failing test for the saved search response shape if needed**
- [ ] **Step 2: Update the route to save the keyword search, articles, and pending topic report**
- [ ] **Step 3: Return `searchId` and persisted metadata from the route**
- [ ] **Step 4: Run `npm test` and verify the WeChat route helpers still pass**

### Task 4: Add the search-history API

**Files:**
- Create: `app/api/search-history/route.ts`
- Modify: `lib/search-history.ts`

- [ ] **Step 1: Write the minimal handler for recent history retrieval**
- [ ] **Step 2: Extend the handler to return one search detail when `id` is provided**
- [ ] **Step 3: Verify both list and detail use the same persistence layer**

### Task 5: Surface history in the homepage sidebar

**Files:**
- Modify: `components/dashboard.tsx`
- Modify: `app/globals.css`

- [ ] **Step 1: Write the failing UI/state test if practical, otherwise lock the behavior in helper tests**
- [ ] **Step 2: Add a left-sidebar history section under the category list**
- [ ] **Step 3: Load recent history on page load and refresh it after every new search**
- [ ] **Step 4: Allow clicking a history item to switch the main area into historical detail mode**

### Task 6: Show persisted history details in the tabs

**Files:**
- Modify: `components/content-tab.tsx`
- Modify: `components/reports-tab.tsx`
- Modify: `components/settings-tab.tsx`
- Modify: `components/dashboard.tsx`

- [ ] **Step 1: Drive the content tab from the active persisted search when available**
- [ ] **Step 2: Show a pending report placeholder tied to the selected historical search**
- [ ] **Step 3: Add settings copy that explains the current keyword and SQLite persistence**

### Task 7: Verify the full feature

**Files:**
- Modify as needed: all touched files

- [ ] **Step 1: Run `npm test`**
- [ ] **Step 2: Run `npm run lint`**
- [ ] **Step 3: Run `npm run build`**
- [ ] **Step 4: Confirm the database file is ignored and the homepage still loads**
