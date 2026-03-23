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

const GUARDED_COMMANDS = [
	"workspace:close",
	"workspace:close-others",
	"workspace:close-tab-group",
];

export default class PinTabGuardPlugin extends Plugin {
	private savedPatches: SavedPatch[] = [];

	onload() {
		this.app.workspace.onLayoutReady(() => {
			for (const id of GUARDED_COMMANDS) {
				this.patchCommand(id);
			}
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

	/**
	 * Execute a function while temporarily preventing pinned leaves
	 * from being detached or unpinned.
	 */
	private executeWithGuard(fn: () => void): void {
		const origDetach = WorkspaceLeaf.prototype.detach;
		const origSetPinned = WorkspaceLeaf.prototype.setPinned;
		const self = this;

		WorkspaceLeaf.prototype.detach = function (this: WorkspaceLeaf) {
			if (self.isLeafPinned(this)) return;
			origDetach.call(this);
		};

		WorkspaceLeaf.prototype.setPinned = function (this: WorkspaceLeaf, pinned: boolean) {
			if (!pinned && self.isLeafPinned(this)) return;
			origSetPinned.call(this, pinned);
		};

		try {
			fn();
		} finally {
			WorkspaceLeaf.prototype.detach = origDetach;
			WorkspaceLeaf.prototype.setPinned = origSetPinned;
		}
	}

	private patchCommand(commandId: string): void {
		const cmd = this.getCommand(commandId);
		if (!cmd) return;

		if (cmd.checkCallback) {
			const orig = cmd.checkCallback;
			this.savedPatches.push({ commandId, type: "checkCallback", original: orig });
			cmd.checkCallback = (checking: boolean) => {
				if (checking) return orig(true);
				this.executeWithGuard(() => orig(false));
			};
		} else if (cmd.callback) {
			const orig = cmd.callback;
			this.savedPatches.push({ commandId, type: "callback", original: orig });
			cmd.callback = () => {
				this.executeWithGuard(orig);
			};
		}
	}
}
