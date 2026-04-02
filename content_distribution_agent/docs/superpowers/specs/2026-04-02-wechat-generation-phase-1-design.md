# WeChat Generation Phase 1 Design

**Date:** 2026-04-02

## Goal

Implement the first real generation flow for the content factory so that a user can enter a request, generate a real `总策划/母稿` plus a real `公众号文章`, and then review both in the existing workspace UI.

## Scope

This phase covers only:

- real model-backed generation for `总策划/母稿`
- real model-backed generation for `公众号文章`
- wiring the homepage generate action to a Next.js server route
- basic loading and error states in the main workspace flow
- keeping the API key in a gitignored local environment file

This phase does not cover:

- real generation for 小红书, Twitter, or 视频脚本
- publishing integrations
- database persistence
- user-editable prompt persistence on the server

## Product Behavior

### Homepage

The user enters a creation request and clicks `生成内容`.

If `公众号文章` is not selected, the page should block generation with a clear message because phase 1 only supports the WeChat path.

If `公众号文章` is selected:

- the app sends the request to a server API
- the server calls SiliconFlow using the configured model
- the response is parsed into one generated session
- the UI switches from the composer to the workspace

### Workspace

The workspace shows:

- a real `总策划/母稿`
- a real `公众号` tab

The other platform tabs can remain visible, but their content should stay in placeholder/mock form only if needed by the current type model. They are out of scope for this phase and must not call the model.

### Error Handling

If generation fails, the user stays on the homepage and sees a clear error surface. Errors to handle explicitly:

- missing AI config
- upstream 4xx/5xx from SiliconFlow
- malformed model output
- unsupported platform selection for this phase

## Technical Design

### AI Configuration

Read model config from `.env.local`:

- `AI_BASE_URL`
- `AI_API_KEY`
- `AI_MODEL`

These values are used only on the server.

### Server API

Add one route:

- `app/api/generate-wechat/route.ts`

Request body:

- `request: string`
- `wechatPrompt: string`

Response body:

- `session: SessionRecord`

The route is responsible for:

- validating input
- loading server config
- building the generation prompt
- calling SiliconFlow's OpenAI-compatible `/chat/completions`
- validating and normalizing the returned JSON

### Prompting Strategy

Phase 1 uses one model call that returns both artifacts together:

- `masterDraft`
- `wechat`

The prompt should ask for strict JSON only, with a schema matching the app types. This keeps the first implementation simple and reduces client-side orchestration.

### Type Changes

The current `SessionRecord` is mock-oriented and requires outputs for every platform. For this phase, the type should support partial platform output so that one real WeChat session does not need fake generated content for the other tabs.

Recommended shape:

- keep `masterDraft`
- make `outputs` platform keys optional except for `wechat` in this flow

### Frontend State Flow

Replace the current mock-only `handleGenerate` flow in `components/content-factory-app.tsx` with:

1. validate request and platform choice
2. show loading state
3. call `/api/generate-wechat`
4. prepend the returned session into local session state
5. switch into the workspace with that session active

### Settings Integration

The settings page already exposes editable prompts in UI state. Phase 1 should reuse the default WeChat prompt in generation. Persisting customized settings beyond the current browser session is deferred.

## Testing Strategy

Use TDD for all new behavior.

Minimum coverage:

- config helper throws when required env vars are missing
- response normalizer rejects malformed AI JSON
- route returns a normalized session for valid AI output
- route returns a user-safe error for upstream failure
- workspace state uses the generated session rather than only mock data

## Risks and Mitigations

### Risk: model returns non-JSON text

Mitigation:

- request strict JSON
- add a small parsing/validation layer
- fail with a clear message instead of rendering broken state

### Risk: future platforms need different flow

Mitigation:

- isolate WeChat generation in dedicated helper files
- keep the API route focused on one flow

### Risk: prompt settings are not persisted yet

Mitigation:

- keep phase 1 scoped to reliable generation first
- defer settings persistence to the next milestone
