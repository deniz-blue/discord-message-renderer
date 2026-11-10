import { deepStrictEqual, strictEqual, throws } from "node:assert/strict";
import { test } from "node:test";
import { renderInputOf } from "./input.ts";

test("a lone message becomes the only message", () => {
	deepStrictEqual(renderInputOf({ content: "hi" }), { messages: [{ content: "hi" }] });
});

test("a messages list passes through and anything else is refused", () => {
	const input = { messages: [] };
	strictEqual(renderInputOf(input), input);
	throws(() => renderInputOf([]));
	throws(() => renderInputOf("hi"));
});
