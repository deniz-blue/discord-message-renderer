import { MessageReferenceType } from "discord-api-types/v10";
import { html } from "./html.ts";
import { type MessageInput, type Platform, type RenderInput, type RenderOptions, type Theme, settingsOf } from "./input.ts";
import { messageToHtml } from "./message-html.ts";

export type {
	MentionNames,
	MemberInput,
	MessageInput,
	Platform,
	RenderContext,
	RenderInput,
	RenderOptions,
	RoleInput,
	Theme,
	UserInput,
} from "./input.ts";

export const defaultFont = "Noto Sans";

export const themes: readonly Theme[] = ["dark", "ash", "onyx", "light"];

export const platforms: readonly Platform[] = ["desktop", "mobile"];

export const matchingOption = <T extends string>(options: readonly T[], name: string | undefined): T | undefined =>
	options.find((option) => option === name);

export const fontOf = (options: RenderOptions): string =>
	options.font !== undefined && /^[\w ]+$/.test(options.font) ? options.font : defaultFont;

const googleFontQuery = (family: string): string => `family=${family.replaceAll(" ", "+")}:wght@400;500;600;700`;

export const fontStylesheetUrl = (family: string): string =>
	`https://fonts.googleapis.com/css2?${[...new Set([family, defaultFont, "Source Code Pro"])].map(googleFontQuery).join("&")}&display=swap`;

const repliedMessageOf = (message: MessageInput, earlier: readonly MessageInput[]): MessageInput | undefined => {
	const reference = message.message_reference;
	if (reference === undefined || reference.type === MessageReferenceType.Forward) return undefined;
	return message.referenced_message ?? earlier.find((candidate) => candidate.id !== undefined && candidate.id === reference.message_id);
};

export const renderMessagesHtml = (input: RenderInput, options: RenderOptions): string => {
	const settings = settingsOf(input, options);
	const theme = matchingOption(themes, options.theme) ?? "dark";
	const messages = input.messages.map((message, index) =>
		messageToHtml(
			message,
			{
				previous: input.messages[index - 1],
				replied: repliedMessageOf(message, input.messages.slice(0, index)),
			},
			settings,
		),
	);
	return html`<div class="messages theme-${theme} platform-${settings.platform}" style="--font:'${fontOf(options)}'">${messages}</div>`.html;
};
