import { Plugin } from "obsidian";

export default class PinTabGuardPlugin extends Plugin {
	async onload() {
		this.addCommand({
			id: "close-current-tab-if-unpinned",
			name: "Close current tab (skip pinned)",
			callback: () => {
				const leaf = this.app.workspace.getMostRecentLeaf();
				if (!leaf) return;

				if (leaf.getViewState().pinned) return;

				leaf.detach();
			},
		});
	}
}
