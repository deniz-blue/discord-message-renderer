import type { APIEmbed, APIEmbedField } from "discord-api-types/v10";
import { formatMessageTime } from "./timestamp.ts";
import { type Html, html, safeColor, safeUrl } from "./html.ts";
import type { RenderSettings } from "./input.ts";
import { markdownToHtml } from "./markdown-html.ts";

const authorToHtml = (author: APIEmbed["author"]): Html =>
	author === undefined
		? html``
		: html`<div class="embed-author">${author.icon_url !== undefined ? html`<img src="${safeUrl(author.icon_url)}" alt="">` : false}<span>${author.name}</span></div>`;

const titleToHtml = (embed: APIEmbed, settings: RenderSettings): Html => {
	if (embed.title === undefined) return html``;
	const title = markdownToHtml(embed.title, settings);
	return embed.url === undefined
		? html`<div class="embed-title">${title}</div>`
		: html`<a class="embed-title link" href="${safeUrl(embed.url)}">${title}</a>`;
};

const fieldToHtml = (field: APIEmbedField, settings: RenderSettings): Html =>
	html`<div class="embed-field${field.inline === true ? " inline" : ""}"><div class="embed-field-name">${markdownToHtml(field.name, settings)}</div>${markdownToHtml(field.value, settings)}</div>`;

const footerToHtml = (embed: APIEmbed, settings: RenderSettings): Html => {
	const time = embed.timestamp === undefined ? undefined : formatMessageTime(new Date(embed.timestamp), settings);
	const parts = [embed.footer?.text, time].filter((part) => part !== undefined);
	if (parts.length === 0) return html``;
	const icon = embed.footer?.icon_url;
	return html`<div class="embed-footer">${icon !== undefined ? html`<img src="${safeUrl(icon)}" alt="">` : false}<span>${parts.join(settings.platform === "mobile" ? " | " : " • ")}</span></div>`;
};

export const embedToHtml = (embed: APIEmbed, settings: RenderSettings): Html => {
	const color = safeColor(embed.color);
	return html`<div class="embed"${color === undefined ? "" : html` style="--embed-color:${color}"`}>
		<div class="embed-body">
			${authorToHtml(embed.author)}${titleToHtml(embed, settings)}
			${embed.description !== undefined ? markdownToHtml(embed.description, settings) : false}
			${embed.fields !== undefined ? html`<div class="embed-fields">${embed.fields.map((field) => fieldToHtml(field, settings))}</div>` : false}
			${embed.image !== undefined ? html`<img class="embed-image" src="${safeUrl(embed.image.url)}" alt="">` : false}
			${footerToHtml(embed, settings)}
		</div>
		${embed.thumbnail !== undefined ? html`<img class="embed-thumbnail" src="${safeUrl(embed.thumbnail.url)}" alt="">` : false}
	</div>`;
};
