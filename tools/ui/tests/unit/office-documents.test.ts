import { FileTypeCategory } from '$lib/enums';
import { getFileTypeCategoryByExtension } from '$lib/utils/file-type';
import { getOfficeDocumentFormat, isOfficeDocument } from '$lib/utils/office-documents';
import { describe, expect, it } from 'vitest';

describe('Office document detection', () => {
	it.each([
		['report.docx', 'docx'],
		['workbook.xlsx', 'xlsx'],
		['slides.pptx', 'pptx'],
		['legacy.doc', 'doc'],
		['macro.xlsm', 'xlsx'],
		['presentation.ppsx', 'pptx'],
		['document.odt', 'odt'],
		['document.rtf', 'rtf']
	] as const)('detects %s', (filename, format) => {
		expect(isOfficeDocument(filename)).toBe(true);
		expect(getOfficeDocumentFormat(filename)).toBe(format);
	});

	it('uses an Office MIME type when the filename has no extension', () => {
		expect(
			isOfficeDocument(
				'upload',
				'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
			)
		).toBe(true);
	});

	it('does not intercept existing attachment types', () => {
		expect(isOfficeDocument('notes.txt', 'text/plain')).toBe(false);
		expect(isOfficeDocument('manual.pdf', 'application/pdf')).toBe(false);
		expect(isOfficeDocument('photo.png', 'image/png')).toBe(false);
		expect(getFileTypeCategoryByExtension('notes.txt')).toBe(FileTypeCategory.TEXT);
		expect(getFileTypeCategoryByExtension('manual.pdf')).toBe(FileTypeCategory.PDF);
		expect(getFileTypeCategoryByExtension('photo.png')).toBe(FileTypeCategory.IMAGE);
	});
});
