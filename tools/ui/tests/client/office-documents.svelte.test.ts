import { AttachmentType } from '$lib/enums';
import { parseFilesToMessageExtras } from '$lib/utils/convert-files-to-extra';
import { extractOfficeDocumentText, getOfficeDocumentFormat } from '$lib/utils/office-documents';
import { strToU8, zipSync } from 'fflate';
import { describe, expect, it, vi } from 'vitest';

const fixtures = [
	[
		'sample.docx',
		{
			'[Content_Types].xml':
				'<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>',
			'_rels/.rels':
				'<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>',
			'word/document.xml':
				'<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:r><w:t>Quarterly document report</w:t></w:r></w:p></w:body></w:document>'
		}
	],
	[
		'sample.pptx',
		{
			'[Content_Types].xml':
				'<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/><Override PartName="/ppt/slides/slide1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/></Types>',
			'_rels/.rels':
				'<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="ppt/presentation.xml"/></Relationships>',
			'ppt/_rels/presentation.xml.rels':
				'<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide1.xml"/></Relationships>',
			'ppt/presentation.xml':
				'<p:presentation xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><p:sldIdLst><p:sldId id="256" r:id="rId1"/></p:sldIdLst></p:presentation>',
			'ppt/slides/slide1.xml':
				'<p:sld xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><p:cSld><p:spTree><p:sp><p:txBody><a:bodyPr/><a:p><a:r><a:t>Quarterly presentation slide</a:t></a:r></a:p></p:txBody></p:sp></p:spTree></p:cSld></p:sld>'
		}
	],
	[
		'sample.xlsx',
		{
			'[Content_Types].xml':
				'<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>',
			'_rels/.rels':
				'<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>',
			'xl/_rels/workbook.xml.rels':
				'<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/></Relationships>',
			'xl/workbook.xml':
				'<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Revenue" sheetId="1" r:id="rId1"/></sheets></workbook>',
			'xl/worksheets/sheet1.xml':
				'<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData><row r="1"><c r="A1" t="inlineStr"><is><t>Region</t></is></c><c r="B1" t="inlineStr"><is><t>Revenue</t></is></c></row><row r="2"><c r="A2" t="inlineStr"><is><t>North</t></is></c><c r="B2"><v>1234</v></c></row></sheetData></worksheet>'
		}
	]
] as const;

function createOfficeFile(name: string, entries: Record<string, string>): File {
	const zipped = zipSync(
		Object.fromEntries(Object.entries(entries).map(([path, content]) => [path, strToU8(content)]))
	);

	return new File([zipped], name);
}

describe('Office document parsing', () => {
	it.each(fixtures)('extracts meaningful Markdown from %s', async (name, entries) => {
		const markdown = await extractOfficeDocumentText(createOfficeFile(name, entries));

		expect(getOfficeDocumentFormat(name)).toBeDefined();
		expect(markdown.trim().length).toBeGreaterThan(10);
	});

	it('rejects a corrupted Office document', async () => {
		const file = new File([new Uint8Array([0, 1, 2, 3])], 'corrupted.docx');

		await expect(extractOfficeDocumentText(file)).rejects.toMatchObject({ code: 'malformed' });
	});

	it.each([
		['small', 10],
		['medium', 10_000],
		['large', 100_000]
	] as const)('parses a %s document without truncating it', async (_size, repetitions) => {
		const text = 'document text '.repeat(repetitions);
		const file = new File([`{\\rtf1\\ansi ${text}}`], 'performance.rtf', {
			type: 'application/rtf'
		});
		const markdown = await extractOfficeDocumentText(file);

		expect(markdown).toContain('document text');
		expect(markdown.length).toBeGreaterThanOrEqual(text.length - 1);
	});

	it('reuses extracted Markdown when converting the attachment for submission', async () => {
		const file = new File([new Uint8Array([0, 1, 2, 3])], 'cached.docx');
		const arrayBuffer = vi.spyOn(file, 'arrayBuffer');
		const result = await parseFilesToMessageExtras([
			{
				file,
				id: 'cached-office-document',
				name: file.name,
				size: file.size,
				textContent: '# Cached document',
				type: file.type
			}
		]);

		expect(arrayBuffer).not.toHaveBeenCalled();
		expect(result.extras).toEqual([
			{
				content: '# Cached document',
				name: 'cached.docx',
				size: 4,
				type: AttachmentType.TEXT
			}
		]);
	});
});
