import { html } from "../src/core/html.ts";
import type { RenderOptions } from "../src/core/options.ts";

export const renderRequestType = "discord-message-renderer:render";

export const embedEventTypes = {
	ready: "discord-message-renderer:ready",
	height: "discord-message-renderer:height",
	error: "discord-message-renderer:error",
} as const;

export type RenderRequest = { type: typeof renderRequestType; input: unknown; options?: RenderOptions };

export type EmbedEvent =
	| { type: typeof embedEventTypes.ready }
	| { type: typeof embedEventTypes.height; height: number }
	| { type: typeof embedEventTypes.error; message: string };

export const embedCodeOf = (url: string, width: number, height: number): string =>
	html`<iframe src="${url}" title="Discord messages" loading="lazy" style="width: ${width}px; max-width: 100%; height: ${height}px; border: 0"></iframe>
<script>
addEventListener("message", (event) => {
	if (event.data?.type !== "${embedEventTypes.height}") return;
	for (const frame of document.querySelectorAll("iframe")) if (frame.contentWindow === event.source) frame.style.height = event.data.height + "px";
});
</script>`.html;
