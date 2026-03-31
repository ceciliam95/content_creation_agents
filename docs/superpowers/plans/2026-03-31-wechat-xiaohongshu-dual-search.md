# WeChat Xiaohongshu Dual Search Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Xiaohongshu keyword collection alongside WeChat, with a shared keyword search bar that can target WeChat, Xiaohongshu, or both.

**Architecture:** Keep a unified `keyword_searches` table as the root history record, but persist source-specific content into separate tables for WeChat and Xiaohongshu. The homepage will expose one global keyword search control with a source selector, and the history rail will render one record per keyword/source combination.

**Tech Stack:** Next.js App Router, TypeScript, SQLite, server route handlers, React client state

---

## File Structure

- Create: `lib/xiaohongshu-monitor.ts`
- Create: `app/api/xiaohongshu-notes/route.ts`
- Modify: `lib/db.ts`
- Modify: `lib/search-history.ts`
- Modify: `components/mock-data.ts`
- Modify: `components/dashboard.tsx`
- Modify: `components/content-tab.tsx`
- Modify: `components/reports-tab.tsx`
- Modify: `components/settings-tab.tsx`
- Modify: `app/globals.css`
- Modify: `package.json`
- Modify: `tests/search-history.test.ts`
- Create: `tests/xiaohongshu-monitor.test.ts`

### Task 1: Add failing Xiaohongshu tests

**Files:**
- Create: `tests/xiaohongshu-monitor.test.ts`
- Modify: `tests/search-history.test.ts`
- Modify: `package.json`

- [ ] **Step 1: Write a failing test for building the Xiaohongshu request payload**
- [ ] **Step 2: Run `npm test` and verify it fails because the Xiaohongshu mapping module does not exist**
- [ ] **Step 3: Write a failing persistence test for saving a Xiaohongshu search and notes**
- [ ] **Step 4: Run `npm test` and verify the new persistence assertion fails for the expected reason**

### Task 2: Add Xiaohongshu mapping and persistence

**Files:**
- Create: `lib/xiaohongshu-monitor.ts`
- Modify: `lib/db.ts`
- Modify: `lib/search-history.ts`

- [ ] **Step 1: Add the `xiaohongshu_notes` table to the SQLite schema**
- [ ] **Step 2: Implement request builder and response-to-content mapping for Xiaohongshu notes**
- [ ] **Step 3: Implement save helpers for a Xiaohongshu keyword search and its returned notes**
- [ ] **Step 4: Update history detail reading so it can return WeChat or Xiaohongshu content by source**
- [ ] **Step 5: Run `npm test` and verify both WeChat and Xiaohongshu persistence tests pass**

### Task 3: Add the Xiaohongshu API route

**Files:**
- Create: `app/api/xiaohongshu-notes/route.ts`

- [ ] **Step 1: Add the Xiaohongshu server route with environment-key auth**
- [ ] **Step 2: Persist the returned notes using the shared history layer**
- [ ] **Step 3: Return the unified response shape used by the homepage**

### Task 4: Update homepage search controls and source-aware history

**Files:**
- Modify: `components/dashboard.tsx`
- Modify: `components/mock-data.ts`
- Modify: `app/globals.css`

- [ ] **Step 1: Replace the second sidebar category with “小红书监控”**
- [ ] **Step 2: Add a platform selector with `微信` / `小红书` / `全选` to the keyword search bar**
- [ ] **Step 3: Trigger WeChat, Xiaohongshu, or both requests on submit based on the selector**
- [ ] **Step 4: Refresh the history rail and display one record per keyword/source pair**
- [ ] **Step 5: Ensure clicking a history item loads the matching source detail**

### Task 5: Show source-specific content and pending analysis

**Files:**
- Modify: `components/content-tab.tsx`
- Modify: `components/reports-tab.tsx`
- Modify: `components/settings-tab.tsx`
- Modify: `components/dashboard.tsx`

- [ ] **Step 1: Ensure the content tab can render Xiaohongshu notes using the shared card layout**
- [ ] **Step 2: Show source-aware pending analysis state in the reports tab**
- [ ] **Step 3: Add source-aware persistence hints in settings**

### Task 6: Verify the dual-platform feature

**Files:**
- Modify as needed: all touched files

- [ ] **Step 1: Run `npm test`**
- [ ] **Step 2: Run `npm run lint`**
- [ ] **Step 3: Run `npm run build`**
- [ ] **Step 4: Confirm the homepage can still load with the dual-source search controls**
