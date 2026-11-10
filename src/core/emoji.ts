import { type Html, html } from "./html.ts";

const twemojiBase = "https://cdn.jsdelivr.net/npm/@twemoji/svg@15.0.0/";

const codePointsOf = (emoji: string): string[] => [...emoji].map((char) => (char.codePointAt(0) ?? 0).toString(16));

// Twemoji names a file without U+FE0F unless the sequence also holds a zero-width joiner.
const twemojiUrl = (emoji: string): string => {
	const points = codePointsOf(emoji);
	const kept = points.includes("200d") ? points : points.filter((point) => point !== "fe0f");
	return `${twemojiBase}${kept.join("-")}.svg`;
};

const customEmojiUrl = (id: string, animated: boolean): string =>
	`https://cdn.discordapp.com/emojis/${id}.${animated ? "gif" : "webp"}?size=48`;

export type EmojiInput = { id?: string | null; name?: string | null; animated?: boolean };

export const emojiToHtml = (emoji: EmojiInput | undefined): Html => {
	const id = emoji?.id ?? undefined;
	const name = emoji?.name ?? undefined;
	if (id !== undefined) return html`<img class="emoji" src="${customEmojiUrl(id, emoji?.animated ?? false)}" alt=":${name ?? ""}:">`;
	if (name !== undefined) return html`<img class="emoji" src="${twemojiUrl(name)}" alt="${name}">`;
	return html``;
};
