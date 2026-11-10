import type { Platform } from "./options.ts";

export type TimestampStyle = "t" | "T" | "d" | "D" | "f" | "F" | "R";

export type Clock = { now: Date; timeZone: string; locale: string };

const shortTime: Intl.DateTimeFormatOptions = { hour: "numeric", minute: "2-digit" };
const longTime: Intl.DateTimeFormatOptions = { ...shortTime, second: "2-digit" };
const shortDate: Intl.DateTimeFormatOptions = { day: "2-digit", month: "2-digit", year: "numeric" };
const longDate: Intl.DateTimeFormatOptions = { day: "numeric", month: "long", year: "numeric" };
const weekday: Intl.DateTimeFormatOptions = { weekday: "long" };

const formatPart = (date: Date, clock: Clock, options: Intl.DateTimeFormatOptions): string =>
	new Intl.DateTimeFormat(clock.locale, { ...options, timeZone: clock.timeZone }).format(date);

// Discord picks a relative unit the way moment.js does: under 45 seconds, 45 minutes, 22 hours, 26 days, 11 months.
const relativeSteps: readonly (readonly [Intl.RelativeTimeFormatUnit, number, number])[] = [
	["second", 1, 45],
	["minute", 60, 45],
	["hour", 3_600, 22],
	["day", 86_400, 26],
	["month", 2_629_746, 11],
	["year", 31_556_952, Number.POSITIVE_INFINITY],
];

const formatRelative = (date: Date, clock: Clock): string => {
	const seconds = (date.getTime() - clock.now.getTime()) / 1000;
	const [unit, size] = relativeSteps.find(([, size, limit]) => Math.abs(seconds) / size < limit) ?? ["year", 31_556_952];
	return new Intl.RelativeTimeFormat(clock.locale).format(Math.round(seconds / size), unit);
};

const timestampStyles: Record<TimestampStyle, (date: Date, clock: Clock) => string> = {
	t: (date, clock) => formatPart(date, clock, shortTime),
	T: (date, clock) => formatPart(date, clock, longTime),
	d: (date, clock) => formatPart(date, clock, shortDate),
	D: (date, clock) => formatPart(date, clock, longDate),
	f: (date, clock) => `${formatPart(date, clock, longDate)} ${formatPart(date, clock, shortTime)}`,
	F: (date, clock) =>
		`${formatPart(date, clock, weekday)}, ${formatPart(date, clock, longDate)} ${formatPart(date, clock, shortTime)}`,
	R: formatRelative,
};

export const formatDiscordTimestamp = (date: Date, style: TimestampStyle, clock: Clock): string =>
	timestampStyles[style](date, clock);

const dayOf = (date: Date, timeZone: string): string => date.toLocaleDateString("en-CA", { timeZone });

const isToday = (date: Date, clock: Clock): boolean => dayOf(date, clock.timeZone) === dayOf(clock.now, clock.timeZone);

export const formatMessageTime = (date: Date, clock: Clock): string => {
	const time = formatPart(date, clock, shortTime);
	const yesterday = new Date(clock.now.getTime() - 86_400_000);
	if (isToday(date, clock)) return `Today at ${time}`;
	if (dayOf(date, clock.timeZone) === dayOf(yesterday, clock.timeZone)) return `Yesterday at ${time}`;
	return `${formatPart(date, clock, shortDate)} ${time}`;
};

export const formatMessageHeaderTime = (date: Date, clock: Clock & { platform: Platform }): string =>
	clock.platform === "mobile" && isToday(date, clock) ? formatPart(date, clock, shortTime) : formatMessageTime(date, clock);
