# Pin Tab Guard

An [Obsidian](https://obsidian.md) plugin that prevents `Cmd/Ctrl+W` from unpinning your pinned tabs.

## Problem

By default in Obsidian, pressing `Cmd/Ctrl+W` on a pinned tab **unpins** it instead of leaving it alone. This can be frustrating if you use pinned tabs to keep important notes always open.

## Solution

Just install and enable — no configuration needed.

This plugin patches the built-in "Close current tab" command so that:

- If the active tab is **not pinned** → closes it (same as default)
- If the active tab is **pinned** → does nothing (tab stays pinned)

Disabling the plugin restores the original behavior.

> **Note:** This plugin only guards the "Close current tab" **command** (triggered by `Cmd/Ctrl+W` or the command palette). Closing a pinned tab via the right-click context menu bypasses the command system and is not affected.

## Installation

### From Community Plugins

1. Open **Settings → Community plugins → Browse**
2. Search for "Pin Tab Guard"
3. Click **Install**, then **Enable**

### Manual

1. Download `main.js` and `manifest.json` from the [latest release](https://github.com/wildskyf/obsidian-pin-tab-guard/releases/latest)
2. Create a folder `pin-tab-guard` in your vault's `.obsidian/plugins/` directory
3. Copy the downloaded files into that folder
4. Enable the plugin in **Settings → Community plugins**
