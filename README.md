# Pin Tab Guard

An [Obsidian](https://obsidian.md) plugin that protects your pinned tabs from being accidentally closed or unpinned.

## Problem

By default in Obsidian, pinned tabs can be unpinned or closed by:

- Pressing `Cmd/Ctrl+W` on a pinned tab (unpins it)
- "Close all other tabs" (closes pinned tabs too)
- "Close tab group" (closes pinned tabs too)

This can be frustrating if you use pinned tabs to keep important notes always open.

## Solution

Just install and enable — no configuration needed.

This plugin guards the following built-in commands:

| Command | Guarded behavior |
|---------|-----------------|
| **Close current tab** (`Cmd/Ctrl+W`) | Pinned tab → does nothing |
| **Close all other tabs** | Only closes non-pinned tabs |
| **Close tab group** | Only closes non-pinned tabs; if all tabs are pinned, does nothing |

Disabling the plugin restores all original behaviors.

> **Note:** This plugin guards commands triggered by hotkeys and the command palette. Closing a tab via the right-click context menu bypasses the command system and is not affected.

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
