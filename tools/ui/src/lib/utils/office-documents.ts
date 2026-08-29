import type { Format } from '@firecrawl/anydoc-wasm';
import anydocWasmUrl from '@firecrawl/anydoc-wasm/anydoc_wasm_bg.wasm?url';

const OFFICE_FORMAT_BY_EXTENSION = {
	'.doc': 'doc',
	'.docm': 'docx',
	'.docx': 'docx',
	'.odp': 'odp',
	'.ods': 'ods',
	'.odt': 'odt',
	'.pot': 'ppt',
	'.pps': 'ppt',
	'.ppsm': 'pptx',
	'.ppsx': 'pptx',
	'.ppt': 'ppt',
	'.pptm': 'pptx',
	'.pptx': 'pptx',
	'.rtf': 'rtf',
	'.xls': 'xlsx',
	'.xlsb': 'xlsx',
	'.xlsm': 'xlsx',
	'.xlsx': 'xlsx'
} as const satisfies Record<string, Format>;
const OFFICE_MIME_TYPES = new Set([
	'application/msword',
	'application/rtf',
	'application/vnd.ms-excel',
	'application/vnd.ms-excel.sheet.binary.macroenabled.12',
	'application/vnd.ms-powerpoint',
	'application/vnd.oasis.opendocument.presentation',
	'application/vnd.oasis.opendocument.spreadsheet',
	'application/vnd.oasis.opendocument.text',
	'application/vnd.openxmlformats-officedocument.presentationml.presentation',
	'application/vnd.openxmlformats-officedocument.presentationml.slideshow',
	'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
	'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
	'application/vnd.ms-excel.sheet.macroenabled.12',
	'application/vnd.ms-powerpoint.presentation.macroenabled.12',
	'application/vnd.ms-powerpoint.slideshow.macroenabled.12',
	'application/vnd.ms-word.document.macroenabled.12',
	'text/rtf'
]);

let initPromise: Promise<void> | null = null;

function getExtension(filename: string): string {
	const dot = filename.lastIndexOf('.');

	return dot === -1 ? '' : filename.slice(dot).toLowerCase();
}

export function getOfficeDocumentFormat(filename: string): Format | undefined {
	return OFFICE_FORMAT_BY_EXTENSION[
		getExtension(filename) as keyof typeof OFFICE_FORMAT_BY_EXTENSION
	];
}

export function isOfficeDocument(filename: string, mimeType?: string): boolean {
	return (
		getOfficeDocumentFormat(filename) !== undefined ||
		OFFICE_MIME_TYPES.has(mimeType?.toLowerCase() ?? '')
	);
}

async function ensureAnyDocInitialized(): Promise<typeof import('@firecrawl/anydoc-wasm')> {
	const anydoc = await import('@firecrawl/anydoc-wasm');

	if (!initPromise) {
		initPromise = anydoc.default({ module_or_path: anydocWasmUrl }).then(() => undefined);
	}

	await initPromise;

	return anydoc;
}

export async function extractOfficeDocumentText(file: File): Promise<string> {
	const format = getOfficeDocumentFormat(file.name);
	const [anydoc, buffer] = await Promise.all([ensureAnyDocInitialized(), file.arrayBuffer()]);
	const markdown = anydoc.toMarkdownBytes(new Uint8Array(buffer), format ?? null);

	if (!markdown.trim()) {
		throw new Error('The document did not contain extractable text');
	}

	return markdown;
}
