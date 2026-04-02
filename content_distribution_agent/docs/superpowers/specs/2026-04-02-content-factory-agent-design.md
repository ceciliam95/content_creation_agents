# Content Factory Agent Design

## Goal

Build a multi-platform content creation AI Agent that accepts one user brief, creates a reusable master plan, and expands it into platform-specific drafts for:

- WeChat article
- Xiaohongshu note
- Twitter post and thread
- Video script

The product should feel like a content production workspace rather than a chat app. The core loop is:

1. User enters a creation request
2. System generates a master plan / mother draft
3. System derives platform-specific drafts
4. User edits, copies, and optionally publishes platform outputs

## Product Principles

### 1. Master-first workflow

The system should not generate each platform in isolation. It should first produce a unified strategy layer, then branch into platform outputs. This creates stronger cross-platform consistency and makes iteration easier.

### 2. Workspace over conversation

The UI should prioritize production and revision, not chat history. The experience can feel intelligent and conversational, but the primary interface should be a structured workspace with content panels, history, and settings.

### 3. Platform-native editing

Each platform has different output constraints and should have a tailored editor surface instead of reusing one generic text box.

### 4. Low-friction reuse

Users should be able to revisit previous creation sessions, reopen drafts, and continue editing or republishing without regenerating everything from scratch.

## Primary User Flow

### Step 1: Create request

The user lands on the main creation page and sees a large central input area. They enter a topic, audience, goal, angle, or creative request and choose one or more output platforms.

### Step 2: Generate master draft

The system first generates a structured "master plan / mother draft" that defines:

- topic direction
- target audience
- key arguments or story angle
- recommended content structure
- platform adaptation notes

### Step 3: Generate platform drafts

The system creates drafts for the selected platforms based on the master draft.

### Step 4: Review and edit

The UI switches into a two-column workspace. The left column shows history. The right column shows tabbed outputs, starting with the master draft.

### Step 5: Edit / copy / publish

Users can edit content, copy it, or publish it where publishing is supported.

## Information Architecture

The first version should have two top-level pages:

1. `创作工作台`
2. `平台提示词设置`

### Why this split

The working area should stay focused on creation and editing. Prompt configuration is important but lower-frequency, so it should live on a separate settings page instead of competing for attention on the main workflow.

## Page 1: 创作工作台

This page has two states:

1. pre-generation state
2. post-generation workspace state

### Pre-generation layout

The entry state should be simple and strongly centered around the creation request.

#### Main elements

- top navigation bar
- central title and supporting description
- large request input box
- multi-select platform chips
- optional generation controls
- primary generate button

#### Suggested fields

- creation request input
- selected platforms
- optional tone selector
- optional content length selector
- optional style / objective selector

### Pre-generation wireframe

```text
┌─────────────────────────────────────────────────────────────────────┐
│ 顶部栏                                                   设置       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│                         内容工厂创作 Agent                           │
│                 一次输入，生成适配多平台的内容初稿                  │
│                                                                     │
│   ┌───────────────────────────────────────────────────────────────┐  │
│   │ 在这里输入创作需求 / 主题 / 目标受众 / 想要的内容方向         │  │
│   │ 例：围绕“AI 出海工具”生成一套内容，面向独立开发者和内容创业者 │  │
│   └───────────────────────────────────────────────────────────────┘  │
│                                                                     │
│   选择生成平台：                                                    │
│   [公众号文章] [小红书笔记] [Twitter] [视频脚本]                    │
│                                                                     │
│   可选控制：                                                        │
│   调性 [专业]  篇幅 [标准]  风格 [增长导向]                         │
│                                                                     │
│                         [ 生成内容 ]                                │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Post-generation workspace layout

After generation, the page should transition into a Claude Artifacts-like workspace, but adapted for production use.

#### Left column

- creation history list
- searchable or scannable generation records
- click to reopen previous session

#### Right column

- tabbed content workspace
- first tab is always `总策划/母稿`
- additional tabs depend on selected platforms
- action buttons in top-right

### Recommended tab order

1. `总策划/母稿`
2. `公众号`
3. `小红书`
4. `Twitter`
5. `视频脚本`

### Workspace wireframe

```text
┌───────────────────────┬──────────────────────────────────────────────────────┐
│ 左侧历史栏            │ 右侧内容区                                           │
│                       │                                                      │
│ 搜索历史              │ Tabs: [总策划/母稿] [公众号] [小红书] [Twitter] [视频脚本] │
│ ┌───────────────────┐ │                                                      │
│ │ AI 出海工具内容包 │ │ 右上角操作： [编辑] [复制] [发布]                    │
│ │ 04/02 10:20       │ │ 说明：视频脚本页不显示“发布”                         │
│ └───────────────────┘ │                                                      │
│ ┌───────────────────┐ │ ┌──────────────────────────────────────────────────┐ │
│ │ 网文出海选题内容  │ │ │ 当前标签内容区域                                 │ │
│ │ 04/01 18:42       │ │ │                                                  │ │
│ └───────────────────┘ │ │ 如果是“总策划/母稿”：                             │ │
│ ┌───────────────────┐ │ │ - 主题定位                                        │ │
│ │ AI 工具增长内容   │ │ │ - 核心观点                                        │ │
│ │ 03/31 22:03       │ │ │ - 内容框架                                        │ │
│ └───────────────────┘ │ │ - 平台拆分建议                                    │ │
│                       │ │                                                  │ │
│                       │ │ 如果是平台页：显示对应专属编辑器                  │ │
│                       │ └──────────────────────────────────────────────────┘ │
└───────────────────────┴──────────────────────────────────────────────────────┘
```

## Content Model

Each creation session should contain:

- one user request
- one master draft
- zero or more platform outputs
- metadata for time, title, and selected platforms

### Master draft structure

The master draft should be the strategic source of truth and include:

- direction title
- audience
- purpose
- core argument or theme
- high-level structure
- platform adaptation notes

This should be visible and editable, not hidden in the background.

## Platform-specific UI Design

### 1. 总策划/母稿

This tab should present the strategy layer clearly.

#### Sections

- content title
- audience and scenario
- key message
- structure outline
- platform breakdown notes

#### Why it matters

This tab is the bridge between the input request and every downstream draft. It gives the user a way to inspect the planning quality before refining channel output.

### 2. 公众号文章

This should use a standard long-form rich text editor.

#### Layout

- title input
- optional abstract / lead-in
- rich text body editor
- image suggestion block
- CTA block

#### Why

WeChat articles are long-form, editorial, and often need structured sections and formatting.

### 公众号 wireframe

```text
[标题输入框]
[摘要输入框]

[富文本编辑器正文区域]

[配图建议]
[结尾 CTA]
```

### 3. 小红书笔记

This should feel visually distinct from the article editor.

#### Layout

- image carousel area at the top
- up to 9 images
- concise title / opening hook
- short-form note body
- suggested tags
- interaction prompt

#### Why

Xiaohongshu content is image-led and compact. The UI should reinforce that it is not just a short article.

### 小红书 wireframe

```text
┌ 图片1 ┐ ┌ 图片2 ┐ ┌ 图片3 ┐ ... 最多 9 张
────────────────────────────────────────
[标题/开头钩子]
[正文文案编辑区]
[推荐标签]
[互动引导句]
```

### 4. Twitter

Twitter should have a platform tab with two internal modes:

- 单条推文
- Thread

The system should generate both by default.

#### Single tweet

- compact editor
- visible character count
- designed around 280-character constraint

#### Thread

- multi-block editor
- each tweet shown as a separate unit
- should preserve logical progression across tweets

### Twitter wireframe

```text
Twitter
[单条推文] [Thread]

如果是单条推文：
[字符计数 0/280]
[单条推文编辑区]

如果是 Thread：
Tweet 1
Tweet 2
Tweet 3
...
```

### 5. 视频脚本

This should use a standard structured text editor rather than rich text.

#### Sections

- video title
- opening hook
- section-by-section script
- ending CTA
- optional shot or scene notes

#### Why

It shares some traits with long-form writing, but the internal structure is more performance and pacing oriented than editorial.

## Action Buttons

The top-right action cluster should contain:

- `编辑`
- `复制`
- `发布`

### Publishing rules

`发布` only appears for:

- 公众号
- 小红书
- Twitter

It does not appear for:

- 视频脚本
- 总策划/母稿

### Why this rule

The master draft is an internal planning object, and the video script is a production asset rather than a direct publishing target.

## History Design

The history sidebar should act as a reusable production log.

### Each history item should show

- session title
- generation time
- selected platform count or summary
- current completion status

### Suggested compact format

- title
- timestamp
- `母稿 + N 平台`

This helps the user quickly scan which sessions are complete and worth reopening.

## Page 2: 平台提示词设置

This page should let users maintain independent prompting rules for each platform.

### Structure

- one settings card per platform
- each card contains a prompt textarea
- page-level actions for save and reset

### Why separate platform prompts

Platform writing rules differ too much to force them into one universal prompt. Users will likely want different constraints for:

- WeChat article depth
- Xiaohongshu tone and image logic
- Twitter brevity and thread rhythm
- Video script pacing

### Settings wireframe

```text
┌─────────────────────────────────────────────────────────────────────┐
│ 设置                                                                │
├─────────────────────────────────────────────────────────────────────┤
│ [公众号提示词]                                                      │
│ ┌───────────────────────────────────────────────────────────────┐  │
│ │ textarea                                                      │  │
│ └───────────────────────────────────────────────────────────────┘  │
│                                                                     │
│ [小红书提示词]                                                      │
│ ┌───────────────────────────────────────────────────────────────┐  │
│ │ textarea                                                      │  │
│ └───────────────────────────────────────────────────────────────┘  │
│                                                                     │
│ [Twitter 提示词]                                                    │
│ ┌───────────────────────────────────────────────────────────────┐  │
│ │ textarea                                                      │  │
│ └───────────────────────────────────────────────────────────────┘  │
│                                                                     │
│ [视频脚本提示词]                                                    │
│ ┌───────────────────────────────────────────────────────────────┐  │
│ │ textarea                                                      │  │
│ └───────────────────────────────────────────────────────────────┘  │
│                                                                     │
│                                            [重置] [保存]            │
└─────────────────────────────────────────────────────────────────────┘
```

## UX Notes

### 1. Homepage should stay simple

Do not preload history, settings, or complex controls into the first-screen experience. The first interaction should be obvious: enter a request and select platforms.

### 2. Master draft should always be visible

The master draft is not an implementation detail. It is a user-facing artifact and should always be accessible as the first tab in the workspace.

### 3. Platform pages should feel different

The UI should not present each platform as the same blank editor with different labels. Visual distinction reinforces mental models and reduces editing mistakes.

### 4. History should support reuse

Users should feel like they are building a library of content packages, not just generating isolated outputs.

## Recommended First Version Scope

For the first prototype:

- support one request -> one master draft -> multiple platform drafts
- include history sidebar
- include platform-specific editors
- include prompt settings page
- include edit / copy / publish actions in UI

For later versions:

- versioning for regenerated drafts
- collaborative review states
- richer publishing integrations
- image generation or asset attachment for Xiaohongshu
- advanced prompt templates and presets

## Recommended Direction

The recommended product direction is:

- a clean creation-first homepage
- a production workspace with persistent history
- a visible master draft as the center of the system
- distinct per-platform editing surfaces
- a separate settings page for platform prompts

This structure best matches the “content factory” concept because it turns one idea into a repeatable multi-channel content package rather than a set of disconnected generations.
