import type { TimestampStyle } from "./timestamp.ts";

export type TextFormat = "bold" | "italic" | "underline" | "strike" | "spoiler";

export type Inline =
	| { kind: "text"; text: string }
	| { kind: "format"; format: TextFormat; children: Inline[] }
	| { kind: "code"; text: string }
	| { kind: "link"; url: string; children: Inline[] }
	| { kind: "user"; id: string }
	| { kind: "channel"; id: string }
	| { kind: "role"; id: string }
	| { kind: "everyone"; text: string }
	| { kind: "command"; name: string; id: string }
	| { kind: "timestamp"; seconds: number; style: TimestampStyle }
	| { kind: "customEmoji"; name: string; id: string; animated: boolean }
	| { kind: "emoji"; text: string };

type InlineRule = { pattern: RegExp; read: (match: RegExpExecArray) => Inline };

const formatted = (format: TextFormat) => (match: RegExpExecArray): Inline => ({
	kind: "format",
	format,
	children: parseInlineMarkdown(match[1] ?? ""),
});

const emojiPattern =
	/^(?:\p{RI}\p{RI}|\p{Extended_Pictographic}(?:️|\p{EMod})?(?:‍\p{Extended_Pictographic}(?:️|\p{EMod})?)*)/u;

const inlineRules: readonly InlineRule[] = [
	{ pattern: /^\\([^A-Za-z0-9\s])/, read: (match) => ({ kind: "text", text: match[1] ?? "" }) },
	{ pattern: /^(`+)([\s\S]*?[^`])\1(?!`)/, read: (match) => ({ kind: "code", text: (match[2] ?? "").trim() }) },
	{
		pattern: /^<(a?):(\w+):(\d+)>/,
		read: (match) => ({ kind: "customEmoji", animated: match[1] === "a", name: match[2] ?? "", id: match[3] ?? "" }),
	},
	{
		pattern: /^<t:(-?\d+)(?::([tTdDfFR]))?>/,
		read: (match) => ({ kind: "timestamp", seconds: Number(match[1]), style: (match[2] ?? "f") as TimestampStyle }),
	},
	{ pattern: /^<\/([\w -]+):(\d+)>/, read: (match) => ({ kind: "command", name: match[1] ?? "", id: match[2] ?? "" }) },
	{ pattern: /^<@&(\d+)>/, read: (match) => ({ kind: "role", id: match[1] ?? "" }) },
	{ pattern: /^<@!?(\d+)>/, read: (match) => ({ kind: "user", id: match[1] ?? "" }) },
	{ pattern: /^<#(\d+)>/, read: (match) => ({ kind: "channel", id: match[1] ?? "" }) },
	{ pattern: /^@(everyone|here)/, read: (match) => ({ kind: "everyone", text: match[0] }) },
	{ pattern: /^<(https?:\/\/[^\s>]+)>/, read: (match) => bareLink(match[1] ?? "") },
	{ pattern: /^\[([^\]]+)\]\(<?(https?:\/\/[^\s)>]+)>?\)/, read: (match) => ({ kind: "link", url: match[2] ?? "", children: parseInlineMarkdown(match[1] ?? "") }) },
	{ pattern: /^https?:\/\/[^\s<]*[^\s<.,:;"')\]]/, read: (match) => bareLink(match[0]) },
	{ pattern: /^\*\*([\s\S]+?)\*\*(?!\*)/, read: formatted("bold") },
	{ pattern: /^__([\s\S]+?)__(?!_)/, read: formatted("underline") },
	{ pattern: /^\*(?=\S)([\s\S]*?\S)\*(?!\*)/, read: formatted("italic") },
	{ pattern: /^_([^_\n]+?)_(?![A-Za-z0-9])/, read: formatted("italic") },
	{ pattern: /^~~([\s\S]+?)~~/, read: formatted("strike") },
	{ pattern: /^\|\|([\s\S]+?)\|\|/, read: formatted("spoiler") },
	{ pattern: emojiPattern, read: (match) => ({ kind: "emoji", text: match[0] }) },
	{ pattern: /^[\s\S][^\\`*_~|[<@h\p{Extended_Pictographic}\p{RI}]*/u, read: (match) => ({ kind: "text", text: match[0] }) },
];

const bareLink = (url: string): Inline => ({ kind: "link", url, children: [{ kind: "text", text: URL.parse(url)?.href ?? url }] });

const readOne = (rest: string): readonly [Inline, number] => {
	for (const rule of inlineRules) {
		const match = rule.pattern.exec(rest);
		if (match !== null && match[0].length > 0) return [rule.read(match), match[0].length];
	}
	return [{ kind: "text", text: rest.slice(0, 1) }, 1];
};

const readAll = (rest: string): Inline[] => {
	if (rest === "") return [];
	const [node, length] = readOne(rest);
	return [node, ...readAll(rest.slice(length))];
};

const joinText = (nodes: readonly Inline[]): Inline[] =>
	nodes.reduce<Inline[]>((joined, node) => {
		const last = joined.at(-1);
		return last?.kind === "text" && node.kind === "text"
			? [...joined.slice(0, -1), { kind: "text", text: last.text + node.text }]
			: [...joined, node];
	}, []);

export const parseInlineMarkdown = (text: string): Inline[] => joinText(readAll(text));
