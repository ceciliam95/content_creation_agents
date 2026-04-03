# Mint Gray UI Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Apply the approved mint-gray visual direction across the homepage, workspace, and settings page while fixing the sidebar footer alignment and visible text corruption.

**Architecture:** Keep the implementation CSS-first and localized to the existing layout and visible UI components. Update the shared stylesheet and only the components that render user-facing labels or need spacing/structure tweaks for the new visual system.

**Tech Stack:** Next.js App Router, React 19, TypeScript, CSS

---

### Task 1: Refresh the shared visual system

**Files:**
- Modify: `C:\Users\Cecilia\Desktop\Her Strength Studio\dev\content_creation_agents\content_distribution_agent\app\globals.css`

- [ ] Replace the current blue-heavy palette with mint-gray CSS variables.
- [ ] Update outer surfaces, cards, controls, and buttons to use the new variables.
- [ ] Tighten sidebar footer alignment so the `设置` button matches the card grid.
- [ ] Re-run `npm run lint`.

### Task 2: Normalize visible labels in the main workspace flow

**Files:**
- Modify: `C:\Users\Cecilia\Desktop\Her Strength Studio\dev\content_creation_agents\content_distribution_agent\components\home-composer.tsx`
- Modify: `C:\Users\Cecilia\Desktop\Her Strength Studio\dev\content_creation_agents\content_distribution_agent\components\workspace-shell.tsx`
- Modify: `C:\Users\Cecilia\Desktop\Her Strength Studio\dev\content_creation_agents\content_distribution_agent\components\history-sidebar.tsx`
- Modify: `C:\Users\Cecilia\Desktop\Her Strength Studio\dev\content_creation_agents\content_distribution_agent\components\master-tab.tsx`
- Modify: `C:\Users\Cecilia\Desktop\Her Strength Studio\dev\content_creation_agents\content_distribution_agent\lib\workspace-config.ts`
- Modify: `C:\Users\Cecilia\Desktop\Her Strength Studio\dev\content_creation_agents\content_distribution_agent\components\twitter-editor.tsx`

- [ ] Replace garbled Chinese text with proper labels.
- [ ] Keep structure unchanged unless needed for alignment or hierarchy.
- [ ] Re-run `npm run lint`.

### Task 3: Bring the settings page into the same visual language

**Files:**
- Modify: `C:\Users\Cecilia\Desktop\Her Strength Studio\dev\content_creation_agents\content_distribution_agent\components\prompt-settings-form.tsx`

- [ ] Normalize visible Chinese copy.
- [ ] Adjust structural wrappers or helper text only where needed to fit the mint-gray design.
- [ ] Re-run `npm run build`.

### Task 4: Final verification

**Files:**
- No code changes required unless verification reveals issues

- [ ] Run `npm run lint`
- [ ] Run `npm run build`
- [ ] If needed, restart local preview and visually inspect the main workflow pages
