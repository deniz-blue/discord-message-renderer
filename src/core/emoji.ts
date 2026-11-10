const twemojiBase = "https://cdn.jsdelivr.net/npm/@twemoji/svg@15.0.0/";

const codePointsOf = (emoji: string): string[] => [...emoji].map((char) => (char.codePointAt(0) ?? 0).toString(16));

// Twemoji names a file without U+FE0F unless the sequence also holds a zero-width joiner.
export const twemojiUrl = (emoji: string): string => {
	const points = codePointsOf(emoji);
	const kept = points.includes("200d") ? points : points.filter((point) => point !== "fe0f");
	return `${twemojiBase}${kept.join("-")}.svg`;
};

export const customEmojiUrl = (id: string, animated: boolean): string =>
	`https://cdn.discordapp.com/emojis/${id}.${animated ? "gif" : "webp"}?size=48`;
