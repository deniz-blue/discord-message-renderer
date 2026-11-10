export type Theme = "dark" | "ash" | "onyx" | "light";

export type Platform = "desktop" | "mobile";

export type RenderOptions = {
	theme?: Theme;
	platform?: Platform;
	font?: string;
};

export const themes: readonly Theme[] = ["dark", "ash", "onyx", "light"];

export const platforms: readonly Platform[] = ["desktop", "mobile"];

export const defaultFont = "Noto Sans";

export const fontOf = (options: RenderOptions): string =>
	options.font !== undefined && /^[\w ]+$/.test(options.font) ? options.font : defaultFont;

const googleFontQuery = (family: string): string => `family=${family.replaceAll(" ", "+")}:wght@400;500;600;700`;

export const fontStylesheetUrl = (family: string): string =>
	`https://fonts.googleapis.com/css2?${[...new Set([family, defaultFont, "Source Code Pro"])].map(googleFontQuery).join("&")}&display=swap`;

const choiceOf = <T extends string>(choices: readonly T[], kind: string, value: string | undefined): T | undefined => {
	if (value === undefined) return undefined;
	const choice = choices.find((candidate) => candidate === value);
	if (choice === undefined) throw new Error(`unknown ${kind} ${value}, expected ${choices.join(", ")}`);
	return choice;
};

export const renderOptionsOf = (read: (name: keyof RenderOptions) => string | undefined): RenderOptions => {
	const theme = choiceOf(themes, "theme", read("theme"));
	const platform = choiceOf(platforms, "platform", read("platform"));
	const font = read("font");
	return {
		...(theme === undefined ? {} : { theme }),
		...(platform === undefined ? {} : { platform }),
		...(font === undefined ? {} : { font }),
	};
};
