import { deepStrictEqual } from "node:assert/strict";
import { test } from "node:test";
import { parseInlineMarkdown } from "./markdown-inline.ts";

test("bold wraps italic in ***", () => {
	deepStrictEqual(parseInlineMarkdown("***hi***"), [
		{ kind: "format", format: "bold", children: [{ kind: "format", format: "italic", children: [{ kind: "text", text: "hi" }] }] },
	]);
});

test("mentions, commands and timestamps", () => {
	deepStrictEqual(parseInlineMarkdown("<@3> <#2> <@&5> </event register:1> <t:10:R>"), [
		{ kind: "user", id: "3" },
		{ kind: "text", text: " " },
		{ kind: "channel", id: "2" },
		{ kind: "text", text: " " },
		{ kind: "role", id: "5" },
		{ kind: "text", text: " " },
		{ kind: "command", name: "event register", id: "1" },
		{ kind: "text", text: " " },
		{ kind: "timestamp", seconds: 10, style: "R" },
	]);
});

test("code keeps markdown as text", () => {
	deepStrictEqual(parseInlineMarkdown("`**not bold**`"), [{ kind: "code", text: "**not bold**" }]);
});

test("escaped markers stay text", () => {
	deepStrictEqual(parseInlineMarkdown("\\*a\\*"), [{ kind: "text", text: "*a*" }]);
});

test("emoji and links split from text, a bare link shown the way Discord normalises it", () => {
	deepStrictEqual(parseInlineMarkdown("hi 👍🏽 https://deniz.blue."), [
		{ kind: "text", text: "hi " },
		{ kind: "emoji", text: "👍🏽" },
		{ kind: "text", text: " " },
		{ kind: "link", url: "https://deniz.blue", children: [{ kind: "text", text: "https://deniz.blue/" }] },
		{ kind: "text", text: "." },
	]);
});

test("snake_case stays text", () => {
	deepStrictEqual(parseInlineMarkdown("a_b_c"), [{ kind: "text", text: "a_b_c" }]);
});
