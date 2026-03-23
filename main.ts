import { Plugin, WorkspaceLeaf } from "obsidian";

interface CommandEntry {
	callback?: () => void;
	checkCallback?: (checking: boolean) => boolean | void;
}

interface SavedPatch {
	commandId: string;
	type: "callback" | "checkCallback";
	original: (() => void) | ((checking: boolean) => boolean | void);
}

export default class PinTabGuardPlugin extends Plugin {
	private savedPatches: SavedPatch[] = [];

	onload() {
		this.app.workspace.onLayoutReady(() => {
			this.patchClose();
			this.patchCloseOthers();
			this.patchCloseTabGroup();
		});
	}

	onunload() {
		for (const patch of this.savedPatches) {
			const cmd = this.getCommand(patch.commandId);
			if (!cmd) continue;
			if (patch.type === "checkCallback") {
				cmd.checkCallback = patch.original as (checking: boolean) => boolean | void;
			} else {
				cmd.callback = patch.original as () => void;
			}
		}
		this.savedPatches = [];
	}

	private isLeafPinned(leaf: WorkspaceLeaf): boolean {
		return (
			leaf.getViewState().pinned ||
			(leaf as unknown as Record<string, unknown>).pinned === true
		);
	}

	private getCommand(id: string): CommandEntry | null {
		const commands = (this.app as unknown as Record<string, unknown>)
			.commands as { commands: Record<string, CommandEntry> } | undefined;
		return commands?.commands?.[id] ?? null;
	}

	private getSiblingLeaves(leaf: WorkspaceLeaf): WorkspaceLeaf[] | null {
		const parent = leaf.parent as unknown as { children?: WorkspaceLeaf[] } | undefined;
		if (!parent?.children) return null;
		return [...parent.children];
	}

	// ── workspace:close ──────────────────────────────────────────────
	// If the active tab is pinned, do nothing (consume the hotkey).
	private patchClose() {
		const cmd = this.getCommand("workspace:close");
		if (!cmd) return;

		if (cmd.checkCallback) {
			const orig = cmd.checkCallback;
			this.savedPatches.push({ commandId: "workspace:close", type: "checkCallback", original: orig });
			cmd.checkCallback = (checking: boolean) => {
				const leaf = this.app.workspace.activeLeaf;
				if (leaf && this.isLeafPinned(leaf)) {
					if (checking) return true;
					return;
				}
				return orig(checking);
			};
		} else if (cmd.callback) {
			const orig = cmd.callback;
			this.savedPatches.push({ commandId: "workspace:close", type: "callback", original: orig });
			cmd.callback = () => {
				const leaf = this.app.workspace.activeLeaf;
				if (leaf && this.isLeafPinned(leaf)) return;
				orig();
			};
		}
	}

	// ── workspace:close-others ───────────────────────────────────────
	// Close other tabs in the same group, but keep pinned ones.
	private patchCloseOthers() {
		const cmd = this.getCommand("workspace:close-others");
		if (!cmd) return;

		const closeOthersGuarded = (activeLeaf: WorkspaceLeaf) => {
			const siblings = this.getSiblingLeaves(activeLeaf);
			if (!siblings) return;
			for (const leaf of siblings) {
				if (leaf === activeLeaf) continue;
				if (this.isLeafPinned(leaf)) continue;
				leaf.detach();
			}
		};

		const hasCloseableOthers = (activeLeaf: WorkspaceLeaf): boolean => {
			const siblings = this.getSiblingLeaves(activeLeaf);
			if (!siblings) return false;
			return siblings.some((l) => l !== activeLeaf && !this.isLeafPinned(l));
		};

		if (cmd.checkCallback) {
			const orig = cmd.checkCallback;
			this.savedPatches.push({ commandId: "workspace:close-others", type: "checkCallback", original: orig });
			cmd.checkCallback = (checking: boolean) => {
				const activeLeaf = this.app.workspace.activeLeaf;
				if (!activeLeaf) return orig(checking);

				if (checking) return hasCloseableOthers(activeLeaf);
				closeOthersGuarded(activeLeaf);
			};
		} else if (cmd.callback) {
			const orig = cmd.callback;
			this.savedPatches.push({ commandId: "workspace:close-others", type: "callback", original: orig });
			cmd.callback = () => {
				const activeLeaf = this.app.workspace.activeLeaf;
				if (!activeLeaf) return orig();
				closeOthersGuarded(activeLeaf);
			};
		}
	}

	// ── workspace:close-tab-group ────────────────────────────────────
	// Close all tabs in the group, but keep pinned ones.
	// If no pinned tabs exist, fall through to original (removes the group entirely).
	// If all tabs are pinned, do nothing.
	private patchCloseTabGroup() {
		const cmd = this.getCommand("workspace:close-tab-group");
		if (!cmd) return;

		if (cmd.checkCallback) {
			const orig = cmd.checkCallback;
			this.savedPatches.push({ commandId: "workspace:close-tab-group", type: "checkCallback", original: orig });
			cmd.checkCallback = (checking: boolean) => {
				const activeLeaf = this.app.workspace.activeLeaf;
				if (!activeLeaf) return orig(checking);

				const siblings = this.getSiblingLeaves(activeLeaf);
				if (!siblings) return orig(checking);

				const hasPinned = siblings.some((l) => this.isLeafPinned(l));
				const hasUnpinned = siblings.some((l) => !this.isLeafPinned(l));

				if (!hasPinned) return orig(checking);
				if (checking) return hasUnpinned;

				for (const leaf of siblings) {
					if (this.isLeafPinned(leaf)) continue;
					leaf.detach();
				}
			};
		} else if (cmd.callback) {
			const orig = cmd.callback;
			this.savedPatches.push({ commandId: "workspace:close-tab-group", type: "callback", original: orig });
			cmd.callback = () => {
				const activeLeaf = this.app.workspace.activeLeaf;
				if (!activeLeaf) return orig();

				const siblings = this.getSiblingLeaves(activeLeaf);
				if (!siblings) return orig();

				const hasPinned = siblings.some((l) => this.isLeafPinned(l));
				if (!hasPinned) return orig();

				for (const leaf of siblings) {
					if (this.isLeafPinned(leaf)) continue;
					leaf.detach();
				}
			};
		}
	}
}
