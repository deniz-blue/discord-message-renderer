# discord-message-renderer

Draws Discord message JSON the way Discord shows it, as HTML or a PNG.

The input is a list of Discord message objects, the shape the API returns, plus the context Discord would know:

```json
{
	"context": {
		"users": { "3": "Organizer" },
		"roles": { "5": { "name": "Testers", "color": "#eb459f", "position": 2 } },
		"channels": { "2": "events" },
		"now": "2026-11-10T09:50:00+02:00",
		"timeZone": "Europe/Vilnius",
		"locale": "en-US"
	},
	"messages": [
		{
			"id": "1",
			"author": { "id": "684259561846079524", "username": "ProtoCal", "avatar": "6a090d3694c90db98fd8fb805778daff", "bot": true },
			"timestamp": "2026-11-10T09:45:00+02:00",
			"content": "hi <@3>"
		}
	]
}
```

Only what is drawn is read, and every field may be left out. The name is `member.nick`, then `author.global_name`,
then `author.username`; its colour comes from the highest role in `member.roles` that has one in `context.roles`.
`bot` or `webhook_id` adds the APP tag, `edited_timestamp` adds "(edited)", and `message_reference` makes a reply to
`referenced_message` or an earlier message with that `id`. `avatar` is a hash as in the API, or any image URL. Users
named in `mentions` and as authors need no entry in `context.users`; a mention nobody names shows its id. Messages
from the same author within seven minutes are grouped. A single message without `messages` around it works too, and
one without an author is drawn as an app called Bot.

## Use

```sh
pnpm dev
```

The page: JSON on the left, the preview on the right. Theme, platform and width are picked there, as they are flags for
the command, not part of the JSON. Copy PNG and Download PNG draw the picture in the browser with modern-screenshot. The
JSON is kept in localStorage. `pnpm build` writes a static site to `dist/`.

## Embed

Copy embed code on the page puts an `<iframe>` and a few lines of script on the clipboard. The iframe opens
`embed.html`, which draws only the messages: the JSON travels compressed after `#`, which the browser never sends to the
server, so any static host works; theme and platform go in the query. The script sets the iframe's height from the
height the embed reports. Without it the iframe keeps the height it had when copied.

A site that makes its own messages can send them instead:

```js
frame.contentWindow.postMessage({
	type: "discord-message-renderer:render",
	input: { messages: [/* … */] },
	options: { theme: "ash", platform: "mobile" },
}, "*");
```

`input` takes anything the page does, and `options` override the query. The embed posts `discord-message-renderer:ready`
when it can take messages, `discord-message-renderer:height` with `height` after every change in size, and
`discord-message-renderer:error` with `message` when the input can't be drawn. It only listens to the page that embeds
it.

## Command

```sh
node src/cli.ts examples/protocal-review.json -o out.png [--html out.html] [--width 600] [--scale 2]
    [--theme dark|ash|onyx|light] [--platform desktop|mobile] [--font "Google font"] [--fonts dir]
```

Needs Node 26. The PNG is drawn by Takumi, which lays out the same HTML and CSS without a browser. Takumi reads no
system fonts: `--fonts` hands it every font file in a folder, such as gg sans and gg mono (Discord's, not included), and
Discord's own fallbacks, Noto Sans and Source Code Pro, come from Google Fonts. The HTML and the page use gg sans
wherever it is installed. Emoji are Twemoji, loaded from the web. Code blocks are highlighted with highlight.js, as
Discord does. `--theme` picks Dark (default), Ash, Onyx or Light; `src/core/themes.css` holds the colours, taken from
Discord's web client on 2026-11-10. `--platform` picks `desktop` (default) or `mobile`. Desktop follows Discord's web
CSS; the Android app has no CSS, so mobile was measured from phone screenshots (smaller text in containers, no "Today
at" in the header, stacked embed fields, a right-pointing chevron on selects).

`renderMessagesHtml(input, options)` in `src/core/render.ts` returns the HTML and `src/core/style.css` styles it. The
core does no I/O, so it runs in a browser or a Worker as well.

## Layout

- `src/core`: the markdown parser, HTML for messages, embeds and components, and the stylesheet
- `src/io`: files, and the PNG through Takumi
- `src/cli.ts`: the command
- `web`: the page and the embed (Vite)
