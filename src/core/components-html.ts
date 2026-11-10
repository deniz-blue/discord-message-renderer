import {
	type APIButtonComponent,
	type APIContainerComponent,
	type APIMediaGalleryComponent,
	type APIMessageComponent,
	type APIMessageComponentEmoji,
	type APISectionComponent,
	type APISelectMenuComponent,
	type APISeparatorComponent,
	ButtonStyle,
	ComponentType,
	SeparatorSpacingSize,
} from "discord-api-types/v10";
import { customEmojiUrl, twemojiUrl } from "./emoji.ts";
import { type Html, html, safeColor, safeUrl } from "./html.ts";
import type { RenderSettings } from "./input.ts";
import { markdownToHtml } from "./markdown-html.ts";

const buttonClasses: Record<ButtonStyle, string> = {
	[ButtonStyle.Primary]: "primary",
	[ButtonStyle.Secondary]: "secondary",
	[ButtonStyle.Success]: "success",
	[ButtonStyle.Danger]: "danger",
	[ButtonStyle.Link]: "secondary",
	[ButtonStyle.Premium]: "primary",
};

const linkIcon = html`<svg class="link-icon" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M15 2a1 1 0 1 0 0 2h3.59l-7.3 7.3a1 1 0 0 0 1.42 1.4L20 5.42V9a1 1 0 1 0 2 0V3a1 1 0 0 0-1-1h-6ZM5 3a3 3 0 0 0-3 3v13a3 3 0 0 0 3 3h13a3 3 0 0 0 3-3v-6a1 1 0 1 0-2 0v6a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h6a1 1 0 1 0 0-2H5Z"/></svg>`;

const chevron = html`<svg class="chevron" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M5.3 9.3a1 1 0 0 1 1.4 0l5.3 5.29 5.3-5.3a1 1 0 1 1 1.4 1.42l-6 6a1 1 0 0 1-1.4 0l-6-6a1 1 0 0 1 0-1.42Z"/></svg>`;

const componentEmoji = (emoji: APIMessageComponentEmoji | undefined): Html => {
	if (emoji?.id !== undefined) return html`<img class="emoji" src="${customEmojiUrl(emoji.id, emoji.animated ?? false)}" alt=":${emoji.name}:">`;
	if (emoji?.name !== undefined) return html`<img class="emoji" src="${twemojiUrl(emoji.name)}" alt="${emoji.name}">`;
	return html``;
};

const buttonToHtml = (button: APIButtonComponent): Html => {
	const label = "label" in button ? button.label : undefined;
	const emoji = "emoji" in button ? button.emoji : undefined;
	const classes = `button ${buttonClasses[button.style]}${button.disabled === true ? " disabled" : ""}`;
	return html`<span class="${classes}">${componentEmoji(emoji)}${label !== undefined ? html`<span>${label}</span>` : false}${button.style === ButtonStyle.Link ? linkIcon : false}</span>`;
};

const selectToHtml = (select: APISelectMenuComponent): Html => {
	const chosen = select.type === ComponentType.StringSelect ? select.options.filter((option) => option.default === true) : [];
	const text = chosen.length > 0 ? chosen.map((option) => option.label).join(", ") : (select.placeholder ?? "Make a selection");
	return html`<div class="select${chosen.length > 0 ? " chosen" : ""}${select.disabled === true ? " disabled" : ""}"><span>${text}</span>${chevron}</div>`;
};

const sectionToHtml = (section: APISectionComponent, settings: RenderSettings): Html =>
	html`<div class="section"><div class="section-text">${section.components.map((part) => componentToHtml(part, settings))}</div><div class="section-accessory">${componentToHtml(section.accessory, settings)}</div></div>`;

// Discord's mosaic for two to ten items, measured from its app: rows of one, two or three, three items as one big and two stacked.
const galleryRows: Record<number, readonly number[]> = {
	2: [2],
	4: [2, 2],
	5: [2, 3],
	6: [3, 3],
	7: [1, 3, 3],
	8: [2, 3, 3],
	9: [3, 3, 3],
	10: [1, 3, 3, 3],
};

const cellStyle = (perRow: number, count: number): string => {
	const aspect = perRow === 3 ? "1" : perRow === 1 || count === 4 ? "3 / 2" : "3 / 4";
	return `grid-column: span ${6 / perRow}; aspect-ratio: ${aspect}`;
};

const galleryLayout = (count: number): { kind: string; cells: readonly string[] } => {
	if (count <= 1) return { kind: "single", cells: [""] };
	if (count === 3) return { kind: "three", cells: ["", "", ""] };
	const rows = galleryRows[count] ?? galleryRows[10] ?? [];
	return { kind: "mosaic", cells: rows.flatMap((perRow) => Array.from({ length: perRow }, () => cellStyle(perRow, count))) };
};

const galleryToHtml = (gallery: APIMediaGalleryComponent): Html => {
	const items = gallery.items.slice(0, 10);
	const layout = galleryLayout(items.length);
	return html`<div class="gallery ${layout.kind}">${items.map((item, index) => html`<img class="${item.spoiler === true ? "spoiler-media" : ""}" style="${layout.cells[index]}" src="${safeUrl(item.media.url)}" alt="${item.description ?? ""}">`)}</div>`;
};

const separatorToHtml = (separator: APISeparatorComponent): Html => {
	const large = separator.spacing === SeparatorSpacingSize.Large;
	return html`<div class="separator${large ? " large" : ""}${separator.divider === false ? "" : " divider"}"></div>`;
};

const containerToHtml = (container: APIContainerComponent, settings: RenderSettings): Html => {
	const accent = safeColor(container.accent_color ?? undefined);
	const style = accent === undefined ? "" : `--accent:${accent}`;
	return html`<div class="container${accent === undefined ? "" : " accented"}" style="${style}">${container.components.map((part) => componentToHtml(part, settings))}</div>`;
};

export const componentToHtml = (component: APIMessageComponent, settings: RenderSettings): Html => {
	switch (component.type) {
		case ComponentType.ActionRow: return html`<div class="action-row">${component.components.map((part) => componentToHtml(part, settings))}</div>`;
		case ComponentType.Button: return buttonToHtml(component);
		case ComponentType.StringSelect:
		case ComponentType.UserSelect:
		case ComponentType.RoleSelect:
		case ComponentType.MentionableSelect:
		case ComponentType.ChannelSelect: return selectToHtml(component);
		case ComponentType.TextDisplay: return markdownToHtml(component.content, settings);
		case ComponentType.Section: return sectionToHtml(component, settings);
		case ComponentType.Thumbnail: return html`<img class="thumbnail" src="${safeUrl(component.media.url)}" alt="${component.description ?? ""}">`;
		case ComponentType.MediaGallery: return galleryToHtml(component);
		case ComponentType.File: return html`<div class="file">${component.file.url.replace(/^attachment:\/\//, "")}</div>`;
		case ComponentType.Separator: return separatorToHtml(component);
		case ComponentType.Container: return containerToHtml(component, settings);
		default: return html`<div class="unsupported">component type ${(component as { type: number }).type}</div>`;
	}
};
