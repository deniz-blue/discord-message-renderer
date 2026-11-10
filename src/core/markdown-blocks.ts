import { type Inline, parseInlineMarkdown } from "./markdown-inline.ts";

export type ListMarker = { kind: "number"; value: number } | { kind: "disc" } | { kind: "circle" };

export type Block =
	| { kind: "line"; children: Inline[] }
	| { kind: "heading"; level: 1 | 2 | 3; children: Inline[] }
	| { kind: "subtext"; children: Inline[] }
	| { kind: "listItem"; marker: ListMarker; depth: number; children: Inline[] }
	| { kind: "quote"; blocks: Block[] }
	| { kind: "codeBlock"; language: string | undefined; text: string };

type Part = { kind: "text"; text: string } | { kind: "code"; block: Block };

const codeFence = /```(?:([\w+#-]+)\n)?([\s\S]*?)```/g;

const splitCodeBlocks = (source: string): Part[] => {
	const matches = [...source.matchAll(codeFence)];
	const ends = [0, ...matches.map((match) => match.index + match[0].length)];
	const parts = matches.flatMap((match, index): Part[] => [
		{ kind: "text", text: source.slice(ends[index], match.index).replace(/\n$/, "") },
		{ kind: "code", block: { kind: "codeBlock", language: match[1], text: (match[2] ?? "").replace(/\n$/, "") } },
	]);
	const tail: Part = { kind: "text", text: source.slice(ends.at(-1)).replace(/^\n/, "") };
	return [...parts, tail].filter((part) => part.kind === "code" || part.text !== "");
};

const headingPattern = /^ *(#{1,3})\s+((?!\s*#{1,3}\s).+?)#*\s*$/;
const subtextPattern = /^ *-# +((?!-#).+)$/;
const listPattern = /^( *)([-*]|\d+\.) (.+)$/;

const markerWrittenAs = (bullet: string): ListMarker =>
	/^\d/.test(bullet) ? { kind: "number", value: Number.parseInt(bullet, 10) } : { kind: "disc" };

const parseLine = (line: string): Block => {
	const heading = headingPattern.exec(line);
	if (heading !== null) {
		const level = (heading[1]?.length ?? 1) as 1 | 2 | 3;
		return { kind: "heading", level, children: parseInlineMarkdown((heading[2] ?? "").trim()) };
	}
	const subtext = subtextPattern.exec(line);
	if (subtext !== null) return { kind: "subtext", children: parseInlineMarkdown(subtext[1] ?? "") };
	const item = listPattern.exec(line);
	if (item !== null) {
		const depth = Math.floor((item[1]?.length ?? 0) / 2);
		return { kind: "listItem", marker: markerWrittenAs(item[2] ?? "-"), depth, children: parseInlineMarkdown(item[3] ?? "") };
	}
	return { kind: "line", children: parseInlineMarkdown(line) };
};

const isQuoteLine = (line: string): boolean => line.startsWith("> ") || line === ">";
const isBlankLine = (line: string): boolean => line.trim() === "";

const countLeading = (lines: readonly string[], test: (line: string) => boolean): number => {
	const index = lines.findIndex((line) => !test(line));
	return index === -1 ? lines.length : index;
};

const parseLines = (lines: readonly string[]): Block[] => {
	const [first, ...rest] = lines;
	if (first === undefined) return [];
	if (first.startsWith(">>> ")) return [{ kind: "quote", blocks: parseLines([first.slice(4), ...rest]) }];
	if (isQuoteLine(first)) {
		const quoted = lines.slice(0, countLeading(lines, isQuoteLine)).map((line) => line.slice(2));
		return [{ kind: "quote", blocks: parseLines(quoted) }, ...parseLines(lines.slice(quoted.length))];
	}
	const block = parseLine(first);
	const next = block.kind === "heading" ? rest.slice(countLeading(rest, isBlankLine)) : rest;
	return [block, ...parseLines(next)];
};

type OpenList = { ordered: boolean; next: number };

const listStartedBy = (marker: ListMarker): OpenList =>
	marker.kind === "number" ? { ordered: true, next: marker.value } : { ordered: false, next: 1 };

const markerOf = (list: OpenList, depth: number): ListMarker =>
	list.ordered ? { kind: "number", value: list.next } : { kind: depth === 0 ? "disc" : "circle" };

const numberListItems = (blocks: readonly Block[], open: readonly OpenList[] = []): Block[] => {
	const [block, ...rest] = blocks;
	if (block === undefined) return [];
	if (block.kind === "quote") return [{ ...block, blocks: numberListItems(block.blocks) }, ...numberListItems(rest)];
	if (block.kind !== "listItem") return [block, ...numberListItems(rest)];
	const list = open[block.depth] ?? listStartedBy(block.marker);
	const stillOpen = open.slice(0, block.depth);
	stillOpen[block.depth] = { ...list, next: list.next + 1 };
	return [{ ...block, marker: markerOf(list, block.depth) }, ...numberListItems(rest, stillOpen)];
};

export const parseMarkdownBlocks = (source: string): Block[] =>
	numberListItems(
		splitCodeBlocks(source).flatMap((part) => (part.kind === "code" ? [part.block] : parseLines(part.text.split("\n")))),
	);
