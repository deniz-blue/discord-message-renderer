import { ComponentType, MessageFlags, type APIMessageComponent } from "discord-api-types/v10";
import { attachmentsToHtml } from "./attachments-html.ts";
import { componentToHtml } from "./components-html.ts";
import { embedToHtml } from "./embed-html.ts";
import { type Author, authorOf } from "./author.ts";
import { type Html, html } from "./html.ts";
import type { InteractionInput, MessageInput, RenderSettings } from "./input.ts";
import { inlinesToHtml, markdownToHtml } from "./markdown-html.ts";
import { parseInlineMarkdown } from "./markdown-inline.ts";
import { pollToHtml } from "./poll-html.ts";
import { reactionsToHtml } from "./reactions-html.ts";
import { stickersToHtml } from "./stickers-html.ts";
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
	message.interaction === undefined &&
	authorOf(message, settings.resolved).key === authorOf(neighbours.previous, settings.resolved).key &&
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
	const author = authorOf(replied, settings.resolved);
	return html`<div class="reply"><img class="reply-avatar" src="${author.avatarUrl}" alt="">${nameToHtml(author)}<span class="reply-text">${inlinesToHtml(parseInlineMarkdown(previewLineOf(replied)), settings)}</span></div>`;
};

const commandToHtml = (interaction: InteractionInput, name: string, settings: RenderSettings): Html => {
	const user = authorOf({ author: interaction.user ?? {}, ...(interaction.member === undefined ? {} : { member: interaction.member }) }, settings.resolved);
	return html`<div class="reply"><img class="reply-avatar" src="${user.avatarUrl}" alt="">${nameToHtml(user)}<span class="reply-text">used <span class="command-name">/${name}</span></span></div>`;
};

const headerLineToHtml = (message: MessageInput, replied: MessageInput | undefined, settings: RenderSettings): Html | false => {
	if (replied !== undefined) return replyToHtml(replied, settings);
	const name = message.interaction?.name;
	return message.interaction === undefined || name === undefined ? false : commandToHtml(message.interaction, name, settings);
};

const eyeIcon = html`<svg class="ephemeral-icon" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 5C5.65 5 2 12 2 12s3.65 7 10 7 10-7 10-7-3.65-7-10-7Zm0 11a4 4 0 1 1 0-8 4 4 0 0 1 0 8Zm0-2a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z"/></svg>`;

const ephemeralNote = html`<div class="ephemeral-note">${eyeIcon}<span>Only you can see this</span><span class="link">Dismiss message</span></div>`;

const isEphemeral = (message: MessageInput): boolean => ((message.flags ?? 0) & MessageFlags.Ephemeral) !== 0;

const listToHtml = <T>(items: readonly T[] | undefined, toHtml: (items: readonly T[]) => Html): Html | false =>
	items === undefined || items.length === 0 ? false : toHtml(items);

const bodyToHtml = (message: MessageInput, settings: RenderSettings): Html => {
	const { content, embeds, components, attachments, sticker_items: stickers, poll, reactions } = message;
	const edited = (message.edited_timestamp ?? undefined) === undefined ? undefined : html`<span class="edited">(edited)</span>`;
	const hasContent = content !== undefined && content !== "";
	return html`${hasContent ? markdownToHtml(content, settings, edited) : edited}${listToHtml(attachments, attachmentsToHtml)}${(embeds ?? []).map((embed) => embedToHtml(embed, settings))}${poll === undefined ? false : pollToHtml(poll, settings)}${listToHtml(components, (parts) => html`<div class="components">${parts.map((component) => componentToHtml(component, settings))}</div>`)}${listToHtml(stickers, stickersToHtml)}${listToHtml(reactions, reactionsToHtml)}${isEphemeral(message) ? ephemeralNote : false}`;
};

export const messageToHtml = (message: MessageInput, neighbours: MessageNeighbours, settings: RenderSettings): Html => {
	if (continuesPrevious(message, neighbours, settings)) {
		return html`<div class="message grouped">${bodyToHtml(message, settings)}</div>`;
	}
	const author = authorOf(message, settings.resolved);
	return html`<div class="message">
		${headerLineToHtml(message, neighbours.replied, settings)}
		<img class="avatar" src="${author.avatarUrl}" alt="">
		<div class="message-header">${nameToHtml(author)}<span class="message-time">${formatMessageHeaderTime(timeOf(message, settings), settings)}</span></div>
		${bodyToHtml(message, settings)}
	</div>`;
};
