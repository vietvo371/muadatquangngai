import { crc32 } from '@/lib/crc32';

/**
 * Sinh file Excel (.xlsx) không dùng thư viện ngoài (Notion 29/09 "Export Report – Phase 2").
 *
 * .xlsx là một file ZIP chứa vài file XML. Ở đây đóng gói theo kiểu "stored" (không nén) — Excel,
 * LibreOffice và Google Sheets đều mở được, đổi lại code ngắn và không phụ thuộc thư viện nào.
 *
 * Có hỗ trợ nhiều sheet; ô số giữ đúng kiểu số để Excel tính toán/sắp xếp được, ô chữ ghi thẳng
 * dạng inline string nên không cần bảng chuỗi dùng chung.
 */

export type CellValue = string | number | null;

export interface Sheet {
  /** Tên tab trong Excel — tự cắt còn 31 ký tự và bỏ ký tự Excel cấm. */
  name: string;
  /** Dòng đầu tiên nên là tiêu đề cột; hàm này tự in đậm dòng đầu. */
  rows: CellValue[][];
}

const escapeXml = (value: string) =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** Excel cấm : \ / ? * [ ] trong tên sheet và giới hạn 31 ký tự. */
const safeSheetName = (name: string, index: number) =>
  name.replace(/[:\\/?*[\]]/g, ' ').trim().slice(0, 31) || `Sheet${index + 1}`;

/** 0 → A, 25 → Z, 26 → AA. */
function columnName(index: number): string {
  let name = '';
  for (let n = index; n >= 0; n = Math.floor(n / 26) - 1) {
    name = String.fromCharCode(65 + (n % 26)) + name;
  }
  return name;
}

function sheetXml(sheet: Sheet): string {
  const rows = sheet.rows
    .map((cells, rowIndex) => {
      const rowNumber = rowIndex + 1;
      const isHeader = rowIndex === 0;
      const body = cells
        .map((cell, columnIndex) => {
          if (cell === null || cell === '') return '';
          const ref = `${columnName(columnIndex)}${rowNumber}`;
          const style = isHeader ? ' s="1"' : '';
          return typeof cell === 'number' && Number.isFinite(cell)
            ? `<c r="${ref}"${style}><v>${cell}</v></c>`
            : `<c r="${ref}"${style} t="inlineStr"><is><t xml:space="preserve">${escapeXml(String(cell))}</t></is></c>`;
        })
        .join('');
      return `<row r="${rowNumber}">${body}</row>`;
    })
    .join('');
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>${rows}</sheetData></worksheet>`;
}

function buildFiles(sheets: Sheet[]): Array<{ path: string; content: string }> {
  const names = sheets.map((sheet, i) => safeSheetName(sheet.name, i));

  const contentTypes =
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">` +
    `<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>` +
    `<Default Extension="xml" ContentType="application/xml"/>` +
    `<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>` +
    `<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>` +
    sheets
      .map((_, i) => `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`)
      .join('') +
    `</Types>`;

  const rootRels =
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">` +
    `<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`;

  const workbook =
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>` +
    names.map((name, i) => `<sheet name="${escapeXml(name)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`).join('') +
    `</sheets></workbook>`;

  const workbookRels =
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">` +
    sheets
      .map((_, i) => `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`)
      .join('') +
    `<Relationship Id="rId${sheets.length + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`;

  // Chỉ cần 2 kiểu: mặc định và in đậm (dòng tiêu đề).
  const styles =
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">` +
    `<fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts>` +
    `<fills count="1"><fill><patternFill patternType="none"/></fill></fills>` +
    `<borders count="1"><border/></borders>` +
    `<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>` +
    `<cellXfs count="2"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>` +
    `<xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/></cellXfs>` +
    `<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>`;

  return [
    { path: '[Content_Types].xml', content: contentTypes },
    { path: '_rels/.rels', content: rootRels },
    { path: 'xl/workbook.xml', content: workbook },
    { path: 'xl/_rels/workbook.xml.rels', content: workbookRels },
    { path: 'xl/styles.xml', content: styles },
    ...sheets.map((sheet, i) => ({ path: `xl/worksheets/sheet${i + 1}.xml`, content: sheetXml(sheet) })),
  ];
}

const u16 = (value: number) => Buffer.from([value & 0xff, (value >> 8) & 0xff]);
const u32 = (value: number) =>
  Buffer.from([value & 0xff, (value >>> 8) & 0xff, (value >>> 16) & 0xff, (value >>> 24) & 0xff]);

/** Đóng gói ZIP theo kiểu stored (method 0) — không nén nên không cần deflate. */
export function buildXlsx(sheets: Sheet[]): Buffer {
  const files = buildFiles(sheets);
  const localParts: Buffer[] = [];
  const centralParts: Buffer[] = [];
  let offset = 0;

  files.forEach((file) => {
    const name = Buffer.from(file.path, 'utf8');
    const data = Buffer.from(file.content, 'utf8');
    const checksum = crc32(data);

    const localHeader = Buffer.concat([
      u32(0x04034b50), u16(20), u16(0), u16(0), u16(0), u16(0),
      u32(checksum), u32(data.length), u32(data.length), u16(name.length), u16(0),
    ]);
    localParts.push(localHeader, name, data);

    centralParts.push(
      Buffer.concat([
        u32(0x02014b50), u16(20), u16(20), u16(0), u16(0), u16(0), u16(0),
        u32(checksum), u32(data.length), u32(data.length),
        u16(name.length), u16(0), u16(0), u16(0), u16(0), u32(0), u32(offset), name,
      ])
    );
    offset += localHeader.length + name.length + data.length;
  });

  const central = Buffer.concat(centralParts);
  const end = Buffer.concat([
    u32(0x06054b50), u16(0), u16(0), u16(files.length), u16(files.length),
    u32(central.length), u32(offset), u16(0),
  ]);
  return Buffer.concat([...localParts, central, end]);
}
