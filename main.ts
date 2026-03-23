import { Plugin, WorkspaceLeaf } from "obsidian";

interface CommandEntry {
	callback?: () => void;
	checkCallback?: (checking: boolean) => boolean | void;
}

export default class PinTabGuardPlugin extends Plugin {
	private originalCheckCallback: ((checking: boolean) => boolean | void) | null = null;
	private originalCallback: (() => void) | null = null;

	async onload() {
		this.app.workspace.onLayoutReady(() => {
			this.patchCloseCommand();
		});
	}

	onunload() {
		this.unpatchCloseCommand();
	}

	private isLeafPinned(leaf: WorkspaceLeaf): boolean {
		return (
			leaf.getViewState().pinned ||
			(leaf as unknown as Record<string, unknown>).pinned === true
		);
	}

	private patchCloseCommand() {
		const closeCmd = this.getCloseCommand();
		if (!closeCmd) return;

		if (closeCmd.checkCallback) {
			this.originalCheckCallback = closeCmd.checkCallback;
			closeCmd.checkCallback = (checking: boolean) => {
				const leaf = this.app.workspace.getMostRecentLeaf();
				if (leaf && this.isLeafPinned(leaf)) {
					// Return true when checking to consume the hotkey; do nothing when executing
					if (checking) return true;
					return;
				}
				return this.originalCheckCallback!(checking);
			};
		} else if (closeCmd.callback) {
			this.originalCallback = closeCmd.callback;
			closeCmd.callback = () => {
				const leaf = this.app.workspace.getMostRecentLeaf();
				if (leaf && this.isLeafPinned(leaf)) return;
				this.originalCallback!();
			};
		}
	}

	private unpatchCloseCommand() {
		const closeCmd = this.getCloseCommand();
		if (!closeCmd) return;

		if (this.originalCheckCallback) {
			closeCmd.checkCallback = this.originalCheckCallback;
		} else if (this.originalCallback) {
			closeCmd.callback = this.originalCallback;
		}
	}

	private getCloseCommand(): CommandEntry | null {
		const commands = (this.app as unknown as Record<string, unknown>).commands as
			| { commands: Record<string, CommandEntry> }
			| undefined;
		return commands?.commands?.["workspace:close"] ?? null;
	}
}
