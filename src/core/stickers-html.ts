import { StickerFormatType } from "discord-api-types/v10";
import { type Html, html } from "./html.ts";
import type { StickerInput } from "./input.ts";

const stickerUrlOf = (sticker: StickerInput): string | undefined => {
	if (sticker.id === undefined || sticker.format_type === StickerFormatType.Lottie) return undefined;
	const extension = sticker.format_type === StickerFormatType.GIF ? "gif" : "png";
	return `https://media.discordapp.net/stickers/${sticker.id}.${extension}?size=160`;
};

const stickerToHtml = (sticker: StickerInput): Html => {
	const url = stickerUrlOf(sticker);
	return url === undefined
		? html`<div class="unsupported">sticker ${sticker.name ?? ""} (Lottie stickers are not drawn)</div>`
		: html`<img class="sticker" src="${url}" alt="${sticker.name ?? ""}">`;
};

export const stickersToHtml = (stickers: readonly StickerInput[]): Html =>
	html`<div class="stickers">${stickers.map(stickerToHtml)}</div>`;
