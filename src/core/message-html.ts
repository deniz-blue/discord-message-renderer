import { ComponentType, type APIMessageComponent } from "discord-api-types/v10";
import { componentToHtml } from "./components-html.ts";
import { embedToHtml } from "./embed-html.ts";
import { type Author, authorOf } from "./author.ts";
import { type Html, html } from "./html.ts";
import type { MessageInput, RenderSettings } from "./input.ts";
import { inlinesToHtml, markdownToHtml } from "./markdown-html.ts";
import { parseInlineMarkdown } from "./markdown-inline.ts";
import { formatMessageHeaderTime } from "./timestamp.ts";

export type MessageNeighbours = {
	previous: MessageInput | undefined;
	replied: MessageInput | undefined;
};

// Discord starts a new header when the same author writes again more than seven minutes later.
const groupWindowMs = 7 * 60 * 1000;

const timeOf = (message: MessageInput, settings: RenderSettings): Date =>
	message.timestamp === undefined ? settings.now : new Date(message.timestamp);

const continuesPrevious = (message: MessageInput, neighbours: MessageNeighbours, settings: RenderSettings): boolean =>
	neighbours.previous !== undefined &&
	neighbours.replied === undefined &&
	authorOf(message, settings.names).key === authorOf(neighbours.previous, settings.names).key &&
	timeOf(message, settings).getTime() - timeOf(neighbours.previous, settings).getTime() < groupWindowMs;

const nameToHtml = (author: Author): Html =>
	html`<span class="author-name" style="${author.color === undefined ? "" : `color:${author.color}`}">${author.name}</span>${author.app ? html`<span class="app-tag">APP</span>` : false}`;

const textComponentsOf = (components: readonly APIMessageComponent[]): string[] =>
	components.flatMap((component): string[] => {
		if (component.type === ComponentType.TextDisplay) return [component.content];
		if ("components" in component) return textComponentsOf(component.components);
		return [];
	});

const previewLineOf = (message: MessageInput): string => {
	const texts = [message.content, ...textComponentsOf(message.components ?? []), message.embeds?.[0]?.description];
	const lines = texts.flatMap((text) => text?.split("\n") ?? []).map((line) => line.replace(/^(#{1,3}|-#|>|>>>) /, "").trim());
	return lines.find((line) => line !== "") ?? "Click to see attachment";
};

const replyToHtml = (replied: MessageInput, settings: RenderSettings): Html => {
	const author = authorOf(replied, settings.names);
	return html`<div class="reply"><img class="reply-avatar" src="${author.avatarUrl}" alt="">${nameToHtml(author)}<span class="reply-text">${inlinesToHtml(parseInlineMarkdown(previewLineOf(replied)), settings)}</span></div>`;
};

const bodyToHtml = (message: MessageInput, settings: RenderSettings): Html => {
	const { content, embeds, components } = message;
	const edited = (message.edited_timestamp ?? undefined) === undefined ? undefined : html`<span class="edited">(edited)</span>`;
	const hasContent = content !== undefined && content !== "";
	const componentsHtml = components === undefined || components.length === 0
		? false
		: html`<div class="components">${components.map((component) => componentToHtml(component, settings))}</div>`;
	return html`${hasContent ? markdownToHtml(content, settings, edited) : edited}${(embeds ?? []).map((embed) => embedToHtml(embed, settings))}${componentsHtml}`;
};

export const messageToHtml = (message: MessageInput, neighbours: MessageNeighbours, settings: RenderSettings): Html => {
	if (continuesPrevious(message, neighbours, settings)) {
		return html`<div class="message grouped">${bodyToHtml(message, settings)}</div>`;
	}
	const author = authorOf(message, settings.names);
	return html`<div class="message">
		${neighbours.replied !== undefined ? replyToHtml(neighbours.replied, settings) : false}
		<img class="avatar" src="${author.avatarUrl}" alt="">
		<div class="message-header">${nameToHtml(author)}<span class="message-time">${formatMessageHeaderTime(timeOf(message, settings), settings)}</span></div>
		${bodyToHtml(message, settings)}
	</div>`;
};
