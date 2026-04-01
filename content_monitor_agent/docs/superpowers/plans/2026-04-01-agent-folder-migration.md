# Agent Folder Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move the current Next.js content monitoring application into `content_monitor_agent/`, add a sibling `content_distribution_agent/`, and keep the migrated app fully runnable.

**Architecture:** Treat the current repository root as an agents container instead of an application root. Move the entire existing Next.js app, configs, tests, env examples, and data folder into `content_monitor_agent/`, then add a minimal placeholder structure for `content_distribution_agent/` so the repo can host multiple agents cleanly.

**Tech Stack:** Next.js 15, React 19, TypeScript, sqlite/sqlite3, npm scripts, Git worktrees

---

### Task 1: Prepare Safe Migration Workspace

**Files:**
- Modify: `.gitignore`
- Create: `.worktrees/` via `git worktree`
- Create: `docs/superpowers/plans/2026-04-01-agent-folder-migration.md`

- [ ] Confirm the working tree is clean before starting large file moves.
- [ ] Ensure `.worktrees/` is ignored by Git before creating a worktree.
- [ ] Create a dedicated worktree branch for the migration so the current workspace stays usable.

### Task 2: Move the Existing App into `content_monitor_agent`

**Files:**
- Move: `app/`
- Move: `components/`
- Move: `lib/`
- Move: `tests/`
- Move: `data/`
- Move: `docs/`
- Move: `.env.example`
- Move: `.eslintrc.json`
- Move: `next-env.d.ts`
- Move: `next.config.ts`
- Move: `package.json`
- Move: `package-lock.json`
- Move: `tsconfig.json`
- Move: `.gitignore`

- [ ] Create `content_monitor_agent/` as the new Next.js project root.
- [ ] Move every file needed to run, lint, test, build, and document the app into that folder.
- [ ] Leave `.git/` and `.worktrees/` at repository root so Git management stays at the top level.

### Task 3: Add `content_distribution_agent` Placeholder

**Files:**
- Create: `content_distribution_agent/README.md`

- [ ] Create `content_distribution_agent/` as an empty future agent workspace.
- [ ] Add a short README explaining it is reserved for future distribution-agent development.

### Task 4: Repair Root-to-Subproject Paths

**Files:**
- Modify: `content_monitor_agent/package.json`
- Modify: `content_monitor_agent/tsconfig.json`
- Modify: `content_monitor_agent/lib/db.ts` only if path assumptions break after the move
- Modify: `content_monitor_agent/.gitignore` if needed for nested paths

- [ ] Verify npm scripts still run from `content_monitor_agent/`.
- [ ] Verify TypeScript path aliases still resolve inside the nested project root.
- [ ] Verify SQLite still writes to `content_monitor_agent/data/monitor.db` and stays ignored.
- [ ] Verify `.env.local` remains local-only and excluded from Git.

### Task 5: Verify the Migrated App End-to-End

**Files:**
- Test: `content_monitor_agent/tests/wechat-monitor.test.ts`
- Test: `content_monitor_agent/tests/xiaohongshu-monitor.test.ts`
- Test: `content_monitor_agent/tests/search-history.test.ts`
- Test: `content_monitor_agent/tests/analysis-tasks.test.ts`
- Test: `content_monitor_agent/tests/search-feedback.test.ts`

- [ ] Run `npm test` from `content_monitor_agent/`.
- [ ] Run `npm run lint` from `content_monitor_agent/`.
- [ ] Run `npm run build` from `content_monitor_agent/`.
- [ ] Start `npm run dev` from `content_monitor_agent/` and verify the app listens on port 3000.
- [ ] Summarize any path or environment changes the user needs to know after the migration.
