import { MessageReferenceType } from "discord-api-types/v10";
import { html } from "./html.ts";
import { type MessageInput, type RenderInput, settingsOf } from "./input.ts";
import { messageToHtml } from "./message-html.ts";
import { type RenderOptions, fontOf } from "./options.ts";

const repliedMessageOf = (message: MessageInput, earlier: readonly MessageInput[]): MessageInput | undefined => {
	const reference = message.message_reference;
	if (reference === undefined || reference.type === MessageReferenceType.Forward) return undefined;
	return message.referenced_message ?? earlier.find((candidate) => candidate.id !== undefined && candidate.id === reference.message_id);
};

export const renderMessagesHtml = (input: RenderInput, options: RenderOptions): string => {
	const settings = settingsOf(input, options.platform ?? "desktop");
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
	return html`<div class="messages theme-${options.theme ?? "dark"} platform-${settings.platform}" style="--font:'${fontOf(options)}'">${messages}</div>`.html;
};
