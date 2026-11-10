import { deepStrictEqual } from "node:assert/strict";
import { test } from "node:test";
import { parseMarkdownBlocks } from "./markdown-blocks.ts";

const text = (value: string) => [{ kind: "text", text: value }];

test("a heading swallows the blank lines after it", () => {
	deepStrictEqual(parseMarkdownBlocks("a\n\n# Title\n\n \nb"), [
		{ kind: "line", children: text("a") },
		{ kind: "line", children: [] },
		{ kind: "heading", level: 1, children: text("Title") },
		{ kind: "line", children: text("b") },
	]);
});

test("closing hashes and extra spaces are not part of a heading", () => {
	deepStrictEqual(parseMarkdownBlocks("  ##   Title ##"), [{ kind: "heading", level: 2, children: text("Title") }]);
	deepStrictEqual(parseMarkdownBlocks("-#   small"), [{ kind: "subtext", children: text("small") }]);
});

test("a heading of only hashes stays text", () => {
	deepStrictEqual(parseMarkdownBlocks("# # a"), [{ kind: "line", children: text("# # a") }]);
});

test("a list keeps the kind of its first item and counts from its first number", () => {
	const markers = (source: string) =>
		parseMarkdownBlocks(source).map((block) =>
			block.kind !== "listItem" ? block.kind : block.marker.kind === "number" ? `${block.marker.value}.` : block.marker.kind,
		);
	deepStrictEqual(markers("- a\n  - b\n1. c"), ["disc", "circle", "disc"]);
	deepStrictEqual(markers("3. a\n1. b\n  - c\n9. d"), ["3.", "4.", "circle", "5."]);
	deepStrictEqual(markers("1. a\nx\n1. b"), ["1.", "line", "1."]);
});
