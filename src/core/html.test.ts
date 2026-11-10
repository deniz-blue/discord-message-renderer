import { strictEqual } from "node:assert/strict";
import { test } from "node:test";
import { html, safeUrl } from "./html.ts";

test("interpolated text is escaped", () => {
	strictEqual(html`<b>${"<script>alert(1)</script>"}</b>`.html, "<b>&lt;script&gt;alert(1)&lt;/script&gt;</b>");
});

test("only web and image data urls pass", () => {
	strictEqual(safeUrl("javascript:alert(1)"), undefined);
	strictEqual(safeUrl("https://deniz.blue"), "https://deniz.blue");
});
