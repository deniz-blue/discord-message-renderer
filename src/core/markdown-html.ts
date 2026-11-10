import { highlightCode } from "./highlight.ts";
import { formatDiscordTimestamp } from "./timestamp.ts";
import { customEmojiUrl, twemojiUrl } from "./emoji.ts";
import { type Html, html, safeColor, safeUrl } from "./html.ts";
import type { RenderSettings } from "./input.ts";
import { type Block, type ListMarker, parseMarkdownBlocks } from "./markdown-blocks.ts";
import type { Inline, TextFormat } from "./markdown-inline.ts";

const formatTags: Record<TextFormat, (inner: Html) => Html> = {
	bold: (inner) => html`<strong>${inner}</strong>`,
	italic: (inner) => html`<em>${inner}</em>`,
	underline: (inner) => html`<u>${inner}</u>`,
	strike: (inner) => html`<s>${inner}</s>`,
	spoiler: (inner) => html`<span class="spoiler">${inner}</span>`,
};

const mention = (text: string, color?: string): Html =>
	color === undefined
		? html`<span class="mention">${text}</span>`
		: html`<span class="mention colored" style="--mention-color:${color}">${text}</span>`;

// Discord's own text for a mention it cannot resolve.
const nameOrRaw = (name: string | undefined, prefix: string, unresolved: string): string =>
	name === undefined ? unresolved : `${prefix}${name}`;

const channelMention = (id: string, settings: RenderSettings): Html => {
	const name = settings.names.channels?.[id];
	return name === undefined ? html`<span class="mention unknown">#unknown</span>` : mention(`#${name}`);
};

const roleMention = (id: string, settings: RenderSettings): Html => {
	const role = settings.names.roles?.[id];
	return mention(nameOrRaw(role?.name, "@", "@deleted-role"), safeColor(role?.color));
};

const inlineToHtml = (node: Inline, settings: RenderSettings): Html => {
	switch (node.kind) {
		case "text": return html`${node.text}`;
		case "format": return formatTags[node.format](inlinesToHtml(node.children, settings));
		case "code": return html`<code class="inline-code">${node.text}</code>`;
		case "link": return html`<a class="link" href="${safeUrl(node.url)}">${inlinesToHtml(node.children, settings)}</a>`;
		case "user": return mention(nameOrRaw(settings.names.users?.[node.id], "@", `<@${node.id}>`));
		case "channel": return channelMention(node.id, settings);
		case "role": return roleMention(node.id, settings);
		case "everyone": return mention(node.text);
		case "command": return mention(`/${node.name}`);
		case "timestamp": {
			const text = formatDiscordTimestamp(new Date(node.seconds * 1000), node.style, settings);
			return html`<span class="timestamp">${text}</span>`;
		}
		case "customEmoji": return html`<img class="emoji" src="${customEmojiUrl(node.id, node.animated)}" alt=":${node.name}:">`;
		case "emoji": return html`<img class="emoji" src="${twemojiUrl(node.text)}" alt="${node.text}">`;
	}
};

export const inlinesToHtml = (nodes: readonly Inline[], settings: RenderSettings): Html =>
	html`${nodes.map((node) => inlineToHtml(node, settings))}`;

const lineContentToHtml = (children: readonly Inline[], settings: RenderSettings, suffix: Html | undefined): Html =>
	children.length === 0 && suffix === undefined ? html`<br>` : html`${inlinesToHtml(children, settings)}${suffix}`;

const listMarkerToHtml = (marker: ListMarker): Html =>
	marker.kind === "number"
		? html`<span class="list-marker">${marker.value}.</span>`
		: html`<span class="list-marker ${marker.kind}"></span>`;

const blockToHtml = (block: Block, settings: RenderSettings, suffix: Html | undefined): Html => {
	switch (block.kind) {
		case "line": return html`<div class="line">${lineContentToHtml(block.children, settings, suffix)}</div>`;
		case "heading": return html`<div class="heading h${block.level}">${inlinesToHtml(block.children, settings)}${suffix}</div>`;
		case "subtext": return html`<div class="subtext">${inlinesToHtml(block.children, settings)}${suffix}</div>`;
		case "listItem":
			return html`<div class="list-item" style="--depth:${block.depth}">${listMarkerToHtml(block.marker)}<span>${inlinesToHtml(block.children, settings)}${suffix}</span></div>`;
		case "quote": return html`<div class="quote"><div class="quote-text">${block.blocks.map((inner, index) => blockToHtml(inner, settings, index === block.blocks.length - 1 ? suffix : undefined))}</div></div>`;
		case "codeBlock": return html`<pre class="code-block"><code>${highlightCode(block.text, block.language)}</code></pre>${suffix}`;
	}
};

const isOnlyEmoji = (blocks: readonly Block[]): boolean =>
	blocks.length === 1 &&
	blocks[0]?.kind === "line" &&
	blocks[0].children.every((node) => node.kind === "emoji" || node.kind === "customEmoji" || (node.kind === "text" && node.text.trim() === "")) &&
	blocks[0].children.some((node) => node.kind !== "text");

export const markdownToHtml = (source: string, settings: RenderSettings, suffix?: Html): Html => {
	const blocks = parseMarkdownBlocks(source);
	const rendered = blocks.map((block, index) => blockToHtml(block, settings, index === blocks.length - 1 ? suffix : undefined));
	return html`<div class="markdown${isOnlyEmoji(blocks) ? " jumbo" : ""}">${rendered}</div>`;
};
