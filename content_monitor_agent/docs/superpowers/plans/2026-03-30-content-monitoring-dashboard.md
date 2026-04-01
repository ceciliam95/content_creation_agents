# Content Monitoring Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a lightweight Next.js prototype for a content monitoring dashboard with category management, content browsing, AI report review, and monitoring settings.

**Architecture:** Use a single App Router page backed by typed mock data. Split the UI into focused components for the category rail, overview header, content tab, report tab, and settings tab so the prototype reads like a real product dashboard while remaining easy to extend.

**Tech Stack:** Next.js, React, TypeScript, CSS Modules or global CSS

---

## File Structure

- Create: `package.json`
- Create: `tsconfig.json`
- Create: `next-env.d.ts`
- Create: `next.config.ts`
- Create: `.gitignore`
- Create: `app/layout.tsx`
- Create: `app/page.tsx`
- Create: `app/globals.css`
- Create: `components/dashboard.tsx`
- Create: `components/content-tab.tsx`
- Create: `components/reports-tab.tsx`
- Create: `components/settings-tab.tsx`
- Create: `components/mock-data.ts`

### Task 1: Scaffold the minimal Next.js prototype

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `next-env.d.ts`
- Create: `next.config.ts`
- Create: `.gitignore`
- Create: `app/layout.tsx`
- Create: `app/globals.css`

- [ ] **Step 1: Create the project manifest and TypeScript config**
- [ ] **Step 2: Add Next.js app shell files**
- [ ] **Step 3: Add global styling tokens and layout primitives**

### Task 2: Seed typed dashboard data

**Files:**
- Create: `components/mock-data.ts`

- [ ] **Step 1: Define types for categories, content items, reports, topics, and settings**
- [ ] **Step 2: Add 3 dashboard categories with realistic platform, keyword, creator, and daily report data**
- [ ] **Step 3: Export helper selectors for default category, default report date, and recent topic aggregation**

### Task 3: Build the dashboard shell

**Files:**
- Create: `components/dashboard.tsx`
- Create: `app/page.tsx`

- [ ] **Step 1: Build the left category rail and right detail workspace**
- [ ] **Step 2: Add top overview cards and the three requested tabs**
- [ ] **Step 3: Wire client state for category selection and tab selection**

### Task 4: Implement the content tab

**Files:**
- Create: `components/content-tab.tsx`
- Modify: `components/dashboard.tsx`

- [ ] **Step 1: Add flat platform filter buttons**
- [ ] **Step 2: Add horizontal date cards with content and breakout counts**
- [ ] **Step 3: Render a timeline-oriented content list with seeded mock entries**

### Task 5: Implement the reports tab

**Files:**
- Create: `components/reports-tab.tsx`
- Modify: `components/dashboard.tsx`

- [ ] **Step 1: Add report mode toggle for latest daily report vs recent topic summary**
- [ ] **Step 2: Add report date cards with preview summaries**
- [ ] **Step 3: Render AI insight sections and topic recommendation cards**

### Task 6: Implement the settings tab

**Files:**
- Create: `components/settings-tab.tsx`
- Modify: `components/dashboard.tsx`

- [ ] **Step 1: Render platform coverage and runtime status**
- [ ] **Step 2: Render keyword tags and benchmark creator lists**
- [ ] **Step 3: Present the daily scheduled run summary**

### Task 7: Verify prototype integrity

**Files:**
- Modify as needed: all created files

- [ ] **Step 1: Run `npm install` to install dependencies**
- [ ] **Step 2: Run `npm run lint` and resolve any issues**
- [ ] **Step 3: Run `npm run build` and resolve any issues**
- [ ] **Step 4: Summarize verification status and any remaining setup limitations**
