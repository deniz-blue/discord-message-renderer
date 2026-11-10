import { deepStrictEqual, throws } from "node:assert/strict";
import { test } from "node:test";
import { type RenderOptions, renderOptionsOf } from "./options.ts";

const given = (values: Partial<Record<keyof RenderOptions, string>>) => (name: keyof RenderOptions) => values[name];

test("options keep what was given and refuse unknown themes and platforms", () => {
	deepStrictEqual(renderOptionsOf(given({ theme: "ash", font: "Lexend" })), { theme: "ash", font: "Lexend" });
	throws(() => renderOptionsOf(given({ theme: "pink" })), /unknown theme pink/);
	throws(() => renderOptionsOf(given({ platform: "ios" })), /unknown platform ios/);
});
