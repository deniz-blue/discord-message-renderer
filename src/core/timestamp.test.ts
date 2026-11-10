import { strictEqual } from "node:assert/strict";
import { test } from "node:test";
import { formatMessageHeaderTime } from "./timestamp.ts";

const clock = { now: new Date("2026-11-10T12:00:00Z"), timeZone: "UTC", locale: "en-US" };

test("the mobile header drops Today at, other days read the same on both", () => {
	const today = new Date("2026-11-10T09:44:00Z");
	strictEqual(formatMessageHeaderTime(today, { ...clock, platform: "desktop" }), "Today at 9:44 AM");
	strictEqual(formatMessageHeaderTime(today, { ...clock, platform: "mobile" }), "9:44 AM");
	strictEqual(formatMessageHeaderTime(new Date("2026-11-09T09:44:00Z"), { ...clock, platform: "mobile" }), "Yesterday at 9:44 AM");
});
