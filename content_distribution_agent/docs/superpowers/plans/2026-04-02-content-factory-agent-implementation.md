# Content Factory Agent Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first runnable Next.js prototype for the content factory creation agent inside `content_distribution_agent`.

**Architecture:** Create a self-contained Next.js app in `content_distribution_agent` with two primary routes: the creation workspace and the prompt settings page. Use local mock data and local component state first, with a visible master draft and platform-specific editors, so the product flow is validated before any real AI or publishing integration.

**Tech Stack:** Next.js 15, React 19, TypeScript, CSS, npm, local mock data

---

## File Structure

### App shell
- Create: `content_distribution_agent/package.json`
- Create: `content_distribution_agent/tsconfig.json`
- Create: `content_distribution_agent/next.config.ts`
- Create: `content_distribution_agent/next-env.d.ts`
- Create: `content_distribution_agent/.eslintrc.json`
- Create: `content_distribution_agent/.gitignore`
- Create: `content_distribution_agent/app/layout.tsx`
- Create: `content_distribution_agent/app/globals.css`
- Create: `content_distribution_agent/app/page.tsx`
- Create: `content_distribution_agent/app/settings/page.tsx`

### Components
- Create: `content_distribution_agent/components/content-factory-app.tsx`
- Create: `content_distribution_agent/components/home-composer.tsx`
- Create: `content_distribution_agent/components/history-sidebar.tsx`
- Create: `content_distribution_agent/components/workspace-shell.tsx`
- Create: `content_distribution_agent/components/master-tab.tsx`
- Create: `content_distribution_agent/components/wechat-editor.tsx`
- Create: `content_distribution_agent/components/xiaohongshu-editor.tsx`
- Create: `content_distribution_agent/components/twitter-editor.tsx`
- Create: `content_distribution_agent/components/video-script-editor.tsx`
- Create: `content_distribution_agent/components/prompt-settings-form.tsx`

### Data and tests
- Create: `content_distribution_agent/lib/types.ts`
- Create: `content_distribution_agent/lib/mock-data.ts`
- Create: `content_distribution_agent/tests/mock-data.test.ts`
- Create: `content_distribution_agent/tests/workspace-state.test.ts`

### Task 1: Scaffold the app

**Files:**
- Create: `content_distribution_agent/package.json`
- Create: `content_distribution_agent/tsconfig.json`
- Create: `content_distribution_agent/next.config.ts`
- Create: `content_distribution_agent/next-env.d.ts`
- Create: `content_distribution_agent/.eslintrc.json`
- Create: `content_distribution_agent/.gitignore`
- Create: `content_distribution_agent/app/layout.tsx`
- Create: `content_distribution_agent/app/globals.css`
- Create: `content_distribution_agent/app/page.tsx`

- [ ] **Step 1: Write a failing smoke test**

Create `content_distribution_agent/tests/mock-data.test.ts`:

```ts
import test from "node:test";
import assert from "node:assert/strict";

test("content distribution app scaffold exists", () => {
  assert.equal(true, true);
});
```

- [ ] **Step 2: Run the test to verify the project is not scaffolded yet**

Run:

```powershell
cd "C:\Users\Cecilia\Desktop\Her Strength Studio\dev\content_creation_agents\content_distribution_agent"
npm test
```

Expected:
- failure because `package.json` does not exist yet

- [ ] **Step 3: Create the minimal Next.js project**

Create:
- `content_distribution_agent/package.json` with `dev`, `build`, `start`, `lint`, `test`
- `content_distribution_agent/tsconfig.json` with `@/*` path alias to `./*`
- `content_distribution_agent/next.config.ts` exporting an empty config
- `content_distribution_agent/.eslintrc.json` with `"root": true` and `"extends": ["next/core-web-vitals"]`
- `content_distribution_agent/.gitignore` ignoring `.next`, `node_modules`, and `.env.local`
- `content_distribution_agent/next-env.d.ts`
- `content_distribution_agent/app/layout.tsx`
- `content_distribution_agent/app/page.tsx` returning a placeholder
- `content_distribution_agent/app/globals.css` with minimal page styles

- [ ] **Step 4: Install dependencies and create `package-lock.json`**

Run:

```powershell
npm install
```

Expected:
- install succeeds

- [ ] **Step 5: Verify scaffold**

Run:

```powershell
npm run lint
npm run build
```

Expected:
- both commands pass

- [ ] **Step 6: Commit scaffold**

Run:

```powershell
git add content_distribution_agent
git commit -m "feat: scaffold content distribution agent"
```

### Task 2: Add data model and realistic mock sessions

**Files:**
- Create: `content_distribution_agent/lib/types.ts`
- Create: `content_distribution_agent/lib/mock-data.ts`
- Modify: `content_distribution_agent/tests/mock-data.test.ts`

- [ ] **Step 1: Write the failing mock session test**

Replace `content_distribution_agent/tests/mock-data.test.ts` with:

```ts
import test from "node:test";
import assert from "node:assert/strict";
import { getMockSessions } from "@/lib/mock-data";

test("mock sessions include a master draft and platform outputs", () => {
  const session = getMockSessions()[0];

  assert.equal(Boolean(session), true);
  assert.equal(Boolean(session.masterDraft), true);
  assert.equal(Boolean(session.outputs.wechat), true);
  assert.equal(Boolean(session.outputs.xiaohongshu), true);
  assert.equal(Boolean(session.outputs.twitter), true);
  assert.equal(Boolean(session.outputs.videoScript), true);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```powershell
npm test
```

Expected:
- fail because `@/lib/mock-data` does not exist

- [ ] **Step 3: Create shared types**

Create `content_distribution_agent/lib/types.ts` with:
- `PlatformKey`
- `TwitterVariant`
- `MasterDraft`
- `SessionRecord`

The `SessionRecord` shape must include:
- request
- title
- createdAt
- selectedPlatforms
- masterDraft
- outputs for wechat, xiaohongshu, twitter, and videoScript

- [ ] **Step 4: Create realistic mock data**

Create `content_distribution_agent/lib/mock-data.ts` exporting `getMockSessions()`.

Seed at least one session named `AI 出海工具内容包` containing:
- a structured master draft
- a WeChat article object
- a Xiaohongshu note object with up to 3 placeholder images
- a Twitter object with both `single` and `thread`
- a video script object

- [ ] **Step 5: Run tests to verify the data layer**

Run:

```powershell
npm test
```

Expected:
- tests pass

- [ ] **Step 6: Commit data model**

Run:

```powershell
git add content_distribution_agent/lib content_distribution_agent/tests/mock-data.test.ts
git commit -m "feat: add content factory mock data"
```

### Task 3: Build the creation homepage and top-level app state

**Files:**
- Create: `content_distribution_agent/components/home-composer.tsx`
- Create: `content_distribution_agent/components/content-factory-app.tsx`
- Create: `content_distribution_agent/tests/workspace-state.test.ts`
- Modify: `content_distribution_agent/app/page.tsx`
- Modify: `content_distribution_agent/app/globals.css`

- [ ] **Step 1: Write a workspace seed test**

Create `content_distribution_agent/tests/workspace-state.test.ts`:

```ts
import test from "node:test";
import assert from "node:assert/strict";
import { getMockSessions } from "@/lib/mock-data";

test("workspace seeds from the latest mock session", () => {
  const session = getMockSessions()[0];

  assert.equal(session.title, "AI 出海工具内容包");
  assert.deepEqual(session.selectedPlatforms, [
    "wechat",
    "xiaohongshu",
    "twitter",
    "videoScript"
  ]);
});
```

- [ ] **Step 2: Run tests to keep baseline green**

Run:

```powershell
npm test
```

Expected:
- PASS

- [ ] **Step 3: Create the homepage composer**

Create `content_distribution_agent/components/home-composer.tsx` with:
- a large request textarea
- multi-select platform chips for `公众号文章`、`小红书笔记`、`Twitter`、`视频脚本`
- a primary `生成内容` button

- [ ] **Step 4: Create top-level app state**

Create `content_distribution_agent/components/content-factory-app.tsx` with local state for:
- `request`
- `selectedPlatforms`
- `activeSessionId`

Behavior:
- initial screen shows the homepage composer
- clicking `生成内容` activates the first mock session and switches to workspace mode

- [ ] **Step 5: Mount the app**

Replace `content_distribution_agent/app/page.tsx` to render `ContentFactoryApp`.

- [ ] **Step 6: Add homepage styles**

Extend `content_distribution_agent/app/globals.css` to include:
- centered hero card
- large request box
- selectable platform chips
- primary action button

- [ ] **Step 7: Verify homepage**

Run:

```powershell
npm test
npm run lint
npm run build
```

Expected:
- all commands pass

- [ ] **Step 8: Commit homepage**

Run:

```powershell
git add content_distribution_agent/app content_distribution_agent/components content_distribution_agent/tests/workspace-state.test.ts
git commit -m "feat: add content factory homepage"
```

### Task 4: Build the post-generation workspace shell

**Files:**
- Create: `content_distribution_agent/components/history-sidebar.tsx`
- Create: `content_distribution_agent/components/workspace-shell.tsx`
- Create: `content_distribution_agent/components/master-tab.tsx`
- Modify: `content_distribution_agent/components/content-factory-app.tsx`
- Modify: `content_distribution_agent/app/globals.css`

- [ ] **Step 1: Keep the suite green**

Run:

```powershell
npm test
```

Expected:
- PASS

- [ ] **Step 2: Create the history sidebar**

Create `content_distribution_agent/components/history-sidebar.tsx`.

Each history item must show:
- session title
- generation time
- `母稿 + N 平台`

- [ ] **Step 3: Create the master draft tab**

Create `content_distribution_agent/components/master-tab.tsx` to render:
- title
- audience
- objective
- key message
- outline list
- platform notes list

- [ ] **Step 4: Create the workspace shell**

Create `content_distribution_agent/components/workspace-shell.tsx`.

Requirements:
- left history sidebar
- right main workspace
- fixed top tab row
- tabs in this order:
  - `总策划/母稿`
  - `公众号`
  - `小红书`
  - `Twitter`
  - `视频脚本`
- top-right actions:
  - `编辑`
  - `复制`
  - `发布`
- `发布` hidden for `总策划/母稿` and `视频脚本`

- [ ] **Step 5: Connect workspace mode**

Modify `content_distribution_agent/components/content-factory-app.tsx` so that:
- when `activeSessionId` exists, it renders `WorkspaceShell`
- clicking a history item updates the active session

- [ ] **Step 6: Add workspace styles**

Extend `content_distribution_agent/app/globals.css` to include:
- left sidebar layout
- history cards
- tab row
- action row
- editor surface panels

- [ ] **Step 7: Verify workspace shell**

Run:

```powershell
npm test
npm run lint
npm run build
```

Expected:
- all commands pass

- [ ] **Step 8: Commit workspace shell**

Run:

```powershell
git add content_distribution_agent/components content_distribution_agent/app/globals.css
git commit -m "feat: add content factory workspace shell"
```

### Task 5: Implement platform-specific editors

**Files:**
- Create: `content_distribution_agent/components/wechat-editor.tsx`
- Create: `content_distribution_agent/components/xiaohongshu-editor.tsx`
- Create: `content_distribution_agent/components/twitter-editor.tsx`
- Create: `content_distribution_agent/components/video-script-editor.tsx`
- Modify: `content_distribution_agent/components/workspace-shell.tsx`
- Modify: `content_distribution_agent/app/globals.css`

- [ ] **Step 1: Keep current tests passing**

Run:

```powershell
npm test
```

Expected:
- PASS

- [ ] **Step 2: Create the WeChat editor**

Create `content_distribution_agent/components/wechat-editor.tsx`.

It should display:
- title input
- abstract area
- long body area
- CTA area

- [ ] **Step 3: Create the Xiaohongshu editor**

Create `content_distribution_agent/components/xiaohongshu-editor.tsx`.

It should display:
- top image strip with placeholder image cards
- hook field
- body field
- tag pills
- interaction prompt field

- [ ] **Step 4: Create the Twitter editor**

Create `content_distribution_agent/components/twitter-editor.tsx`.

Requirements:
- internal mode switch between `单条推文` and `Thread`
- show character count for the single tweet
- show each thread tweet as a separate block

- [ ] **Step 5: Create the video script editor**

Create `content_distribution_agent/components/video-script-editor.tsx`.

It should display:
- title
- opening hook
- section list
- closing CTA

- [ ] **Step 6: Wire editors into the workspace**

Modify `content_distribution_agent/components/workspace-shell.tsx` so each tab renders:
- `MasterTab`
- `WechatEditor`
- `XiaohongshuEditor`
- `TwitterEditor`
- `VideoScriptEditor`

- [ ] **Step 7: Add editor-specific styles**

Extend `content_distribution_agent/app/globals.css` to include:
- field inputs and textareas
- image strip
- tag pills
- thread list

- [ ] **Step 8: Verify platform editors**

Run:

```powershell
npm test
npm run lint
npm run build
```

Expected:
- all commands pass

- [ ] **Step 9: Commit platform editors**

Run:

```powershell
git add content_distribution_agent/components content_distribution_agent/app/globals.css
git commit -m "feat: add platform-specific content editors"
```

### Task 6: Add the prompt settings page

**Files:**
- Create: `content_distribution_agent/components/prompt-settings-form.tsx`
- Create: `content_distribution_agent/app/settings/page.tsx`
- Modify: `content_distribution_agent/app/globals.css`

- [ ] **Step 1: Keep baseline green**

Run:

```powershell
npm test
```

Expected:
- PASS

- [ ] **Step 2: Create the settings form**

Create `content_distribution_agent/components/prompt-settings-form.tsx`.

Requirements:
- separate prompt textarea for:
  - WeChat
  - Xiaohongshu
  - Twitter
  - Video script
- `保存`
- `重置`
- reset restores local defaults

- [ ] **Step 3: Add the settings route**

Create `content_distribution_agent/app/settings/page.tsx` to render the settings form.

- [ ] **Step 4: Add settings page styles**

Extend `content_distribution_agent/app/globals.css` with a centered settings page layout.

- [ ] **Step 5: Final verification**

Run:

```powershell
npm test
npm run lint
npm run build
```

Expected:
- all commands pass

- [ ] **Step 6: Commit settings page**

Run:

```powershell
git add content_distribution_agent/app/settings content_distribution_agent/components/prompt-settings-form.tsx
git commit -m "feat: add platform prompt settings page"
```
