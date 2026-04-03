# Platform Prompt Config Design

**Date:** 2026-04-03

## Goal

Add a global prompt configuration system so the app can manage reusable prompt templates per platform and use the active template as the model `system` prompt during content generation.

## Scope

This milestone covers:

- one global config shared by the whole app
- prompt template management for four platforms:
  - `wechat`
  - `xiaohongshu`
  - `twitter`
  - `videoScript`
- full template actions:
  - create
  - edit
  - delete
  - set as active
- a real settings navigation entry from the main workspace
- WeChat generation updated to read the active WeChat template and send it as a `system` prompt

This milestone does not cover:

- per-user prompt settings
- database persistence
- real generation for non-WeChat platforms

## Product Behavior

### Settings Entry

The main workspace should expose a visible settings entry in the left sidebar footer. Clicking it should navigate to `/settings`.

### Settings Page

The settings page should present one platform at a time:

- left column: platform switcher
- right column: template management area

For the selected platform, the user can:

- see all templates
- identify the active template
- create a new template
- edit an existing template
- delete a template
- set any template as active

The changes should be written to a shared config file and persist across reloads.

### Generation Behavior

For WeChat generation:

- the client only sends the user request
- the server loads the active WeChat template from config
- the active WeChat template is sent as the `system` message
- the user request plus output-format instructions are sent as the `user` message

If no active template exists for WeChat, the generation route should fail with a clear error.

## Data Model

Store prompt configuration in a JSON file under `content_distribution_agent/config/`.

Recommended shape:

```json
{
  "wechat": {
    "activeTemplateId": "wechat-default",
    "templates": [
      {
        "id": "wechat-default",
        "name": "默认深度稿",
        "prompt": "你是一名专业的公众号内容策划...",
        "updatedAt": "2026-04-03T09:00:00.000Z"
      }
    ]
  }
}
```

The same structure should exist for all four platforms.

## Technical Design

### Config Layer

Add one focused server-side module to:

- resolve the config path
- read the config file
- seed defaults if the file does not exist
- update templates
- set the active template
- delete templates safely

This module should be the only place that directly reads and writes the JSON file.

### API Layer

Add a settings API route for prompt templates. It should support:

- reading the full prompt config
- saving a template
- deleting a template
- setting an active template

The first version can use one route with an `action` field in the request body to keep the implementation small.

### UI Layer

The settings page should stop using component-local defaults and instead:

- fetch prompt config from the API
- edit templates through API writes
- refresh local state after each successful save

### Generation Layer

Update the WeChat generation helper so the actual model request looks like:

- `system`: active WeChat prompt template
- `user`: content request and JSON output instructions

This keeps platform writing rules separate from the user’s topic request.

## Error Handling

Handle these cases clearly:

- config file missing or malformed
- template delete request tries to delete the last remaining template for a platform
- active template id becomes invalid
- generation is requested without an active WeChat template

## Testing Strategy

Use TDD.

Minimum coverage:

- config store seeds defaults and persists edits
- setting active template updates the config correctly
- deleting templates protects required invariants
- settings API returns config and applies mutations
- WeChat generation request uses the active template as `system` prompt

## Risks and Mitigations

### Risk: direct file writes become brittle

Mitigation:

- keep all reads/writes in one config module
- write the full validated object each time

### Risk: UI and server drift

Mitigation:

- make the server config API the single source of truth
- avoid hardcoded prompt defaults in the settings component after this change

### Risk: later platform generation needs richer config

Mitigation:

- keep the template structure generic
- do not hardcode WeChat-only fields into the config schema
