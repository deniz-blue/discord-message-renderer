const bytesToBase64Url = (bytes: Uint8Array): string =>
	btoa(Array.from(bytes, (byte) => String.fromCharCode(byte)).join(""))
		.replaceAll("+", "-")
		.replaceAll("/", "_")
		.replace(/=+$/, "");

const base64UrlToBytes = (text: string): Uint8Array<ArrayBuffer> =>
	Uint8Array.from(atob(text.replaceAll("-", "+").replaceAll("_", "/")), (char) => char.charCodeAt(0));

const transformBytes = async (bytes: Uint8Array<ArrayBuffer>, transform: CompressionStream | DecompressionStream): Promise<Uint8Array> =>
	new Uint8Array(await new Response(new Blob([bytes]).stream().pipeThrough(transform)).arrayBuffer());

export const textToFragment = async (text: string): Promise<string> =>
	bytesToBase64Url(await transformBytes(new TextEncoder().encode(text), new CompressionStream("deflate-raw")));

export const fragmentToText = async (fragment: string): Promise<string> =>
	new TextDecoder().decode(await transformBytes(base64UrlToBytes(fragment), new DecompressionStream("deflate-raw")));
