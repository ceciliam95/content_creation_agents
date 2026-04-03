# Mint Gray UI Polish Design

**Date:** 2026-04-03

## Goal

Refresh the content distribution agent UI to use a mint-green and light-gray visual system, improve alignment across the sidebar and settings entry, and make the homepage, workspace, and settings page feel like one coherent product.

## Scope

This polish pass covers:

- a new mint-gray color palette
- more consistent border, radius, spacing, and shadow rules
- sidebar footer alignment fixes for the `设置` entry
- improved visual hierarchy for:
  - homepage composer
  - workspace shell
  - settings page
- fixing visible Chinese text corruption in key UI surfaces touched by this polish

This pass does not change product behavior.

## Visual Direction

### Palette

- background: pale gray-green
- surface: soft white
- accent: mint
- active/highlight: deeper mint
- text: dark green-gray
- borders: cool light gray

The accent should be used sparingly:

- active tabs
- active history card
- primary call-to-action
- current state badges

### Shape Language

- larger radii on outer panels
- medium radii on controls
- slightly stronger inner alignment between cards, buttons, and separators

### Sidebar Alignment

The sidebar footer should feel anchored to the same grid as the history cards:

- the divider line and button width should align with card edges
- the `设置` button should not look narrower or offset from the cards above
- footer spacing should feel intentional rather than floating

## Component-Level Changes

### Homepage

- use a softer mint-tinted page background
- make the main composer panel feel premium but calm
- convert selected platform chips to mint active styling
- soften inputs and textarea fills

### Workspace

- mint active tabs instead of saturated blue
- softer action buttons
- cleaner panel backgrounds
- stronger distinction between selected and unselected history cards

### Settings Page

- make the page feel like part of the same product family as the workspace
- use consistent card and button styling
- clarify hierarchy between platform switcher, template list, and editor panel

## Text Cleanup

Visible labels that are currently garbled should be normalized to proper Chinese in the touched files, including:

- homepage labels
- workspace tab labels
- history sidebar labels
- settings page labels
- Twitter sub-tab labels

## Verification

Because this is a visual polish pass and there is no UI snapshot test setup in the repo, verification should rely on:

- `npm run lint`
- `npm run build`
- local page preview review
