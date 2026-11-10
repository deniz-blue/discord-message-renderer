import { strictEqual } from "node:assert/strict";
import { test } from "node:test";
import { highlightCode } from "./highlight.ts";

test("a known language is highlighted", () => {
	strictEqual(highlightCode("const a = 1;", "js").html, '<span class="hljs-keyword">const</span> a = <span class="hljs-number">1</span>;');
});

test("an unknown language stays escaped text", () => {
	strictEqual(highlightCode("<b>", "nope").html, "&lt;b&gt;");
	strictEqual(highlightCode("<b>", undefined).html, "&lt;b&gt;");
});
