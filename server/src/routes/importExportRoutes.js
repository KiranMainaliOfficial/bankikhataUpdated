import express from 'express';
import multer from 'multer';
import JSZip from 'jszip';
import PDFDocument from 'pdfkit';
import { XMLParser } from 'fast-xml-parser';
import { parse } from 'csv-parse/sync';
import { stringify } from 'csv-stringify/sync';
import Customer from '../models/Customer.js';
import Transaction from '../models/Transaction.js';
import { authorize, protect } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { recalculateCustomer } from '../utils/ledger.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });
router.use(protect);

const xmlParser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '' });

const asArray = (value) => (Array.isArray(value) ? value : value ? [value] : []);

function columnIndex(cellRef = '') {
  const letters = cellRef.replace(/[0-9]/g, '');
  return letters.split('').reduce((sum, letter) => sum * 26 + letter.charCodeAt(0) - 64, 0) - 1;
}

function escapeXml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function readCell(cell, sharedStrings) {
  if (!cell) return '';
  if (cell.t === 's') return sharedStrings[Number(cell.v)] || '';
  if (cell.t === 'inlineStr') return cell.is?.t || '';
  return cell.v ?? '';
}

async function readXlsxRows(buffer) {
  const zip = await JSZip.loadAsync(buffer);
  const sharedXml = await zip.file('xl/sharedStrings.xml')?.async('string');
  const sharedDoc = sharedXml ? xmlParser.parse(sharedXml) : null;
  const sharedStrings = asArray(sharedDoc?.sst?.si).map((item) => {
    if (typeof item.t === 'string') return item.t;
    return asArray(item.r).map((run) => run.t).join('');
  });

  const sheetXml = await zip.file('xl/worksheets/sheet1.xml')?.async('string');
  if (!sheetXml) return [];

  const sheetDoc = xmlParser.parse(sheetXml);
  const rows = asArray(sheetDoc.worksheet?.sheetData?.row).map((row) => {
    const values = [];
    asArray(row.c).forEach((cell) => {
      values[columnIndex(cell.r)] = readCell(cell, sharedStrings);
    });
    return values;
  });

  const headers = rows.shift()?.map((header) => String(header || '').trim()) || [];
  return rows
    .map((row) =>
      headers.reduce((item, header, index) => {
        if (header) item[header] = row[index] ?? '';
        return item;
      }, {})
    )
    .filter((row) => Object.values(row).some((value) => value !== ''));
}

async function createXlsxBuffer(rows, sheetName) {
  const columns = Object.keys(rows[0] || { message: 'No data' });
  const allRows = [columns, ...rows.map((row) => columns.map((column) => row[column] ?? ''))];
  const sheetData = allRows
    .map((row, rowIndex) => {
      const cells = row
        .map((value, columnIndexValue) => {
          const column = String.fromCharCode(65 + columnIndexValue);
          return `<c r="${column}${rowIndex + 1}" t="inlineStr"><is><t>${escapeXml(value)}</t></is></c>`;
        })
        .join('');
      return `<row r="${rowIndex + 1}">${cells}</row>`;
    })
    .join('');

  const zip = new JSZip();
  zip.file(
    '[Content_Types].xml',
    '<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>'
  );
  zip.folder('_rels').file(
    '.rels',
    '<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>'
  );
  zip.folder('xl').file(
    'workbook.xml',
    `<?xml version="1.0" encoding="UTF-8"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="${escapeXml(sheetName)}" sheetId="1" r:id="rId1"/></sheets></workbook>`
  );
  zip.folder('xl').folder('_rels').file(
    'workbook.xml.rels',
    '<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/></Relationships>'
  );
  zip.folder('xl').folder('worksheets').file(
    'sheet1.xml',
    `<?xml version="1.0" encoding="UTF-8"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>${sheetData}</sheetData></worksheet>`
  );

  return zip.generateAsync({ type: 'nodebuffer' });
}

async function normalizeRows(buffer, originalname) {
  if (originalname.endsWith('.csv')) {
    return parse(buffer.toString('utf8'), {
      columns: true,
      skip_empty_lines: true,
      trim: true
    });
  }

  return readXlsxRows(buffer);
}

router.post(
  '/customers',
  authorize('admin'),
  upload.single('file'),
  asyncHandler(async (req, res) => {
    const rows = await normalizeRows(req.file.buffer, req.file.originalname);
    const errors = [];
    const imported = [];

    for (const [index, row] of rows.entries()) {
      if (!row.fullName || !row.phone) {
        errors.push({ row: index + 2, message: 'fullName and phone are required' });
        continue;
      }
      const customer = await Customer.create({
        fullName: row.fullName,
        phone: String(row.phone),
        alternatePhone: row.alternatePhone,
        address: row.address,
        notes: row.notes,
        createdBy: req.user._id
      });
      imported.push(customer);
    }

    res.status(errors.length ? 207 : 201).json({ imported: imported.length, errors });
  })
);

router.post(
  '/transactions',
  authorize('admin'),
  upload.single('file'),
  asyncHandler(async (req, res) => {
    const rows = await normalizeRows(req.file.buffer, req.file.originalname);
    const errors = [];
    const imported = [];

    for (const [index, row] of rows.entries()) {
      const customer = await Customer.findOne({ $or: [{ customerId: row.customerId }, { phone: String(row.phone) }] });
      if (!customer || !['credit', 'payment'].includes(row.type) || !Number(row.amount)) {
        errors.push({ row: index + 2, message: 'customerId/phone, type and amount are required' });
        continue;
      }
      const tx = await Transaction.create({
        customer: customer._id,
        type: row.type,
        amount: Number(row.amount),
        date: row.date ? new Date(row.date) : new Date(),
        productOrReason: row.productOrReason,
        paymentMethod: row.type === 'payment' ? row.paymentMethod || 'cash' : null,
        notes: row.notes,
        createdBy: req.user._id
      });
      await recalculateCustomer(customer._id);
      imported.push(tx);
    }

    res.status(errors.length ? 207 : 201).json({ imported: imported.length, errors });
  })
);

router.get(
  '/:resource',
  asyncHandler(async (req, res) => {
    const { resource } = req.params;
    const format = req.query.format || 'xlsx';
    const data =
      resource === 'transactions'
        ? await Transaction.find().populate('customer', 'customerId fullName phone').lean()
        : await Customer.find().lean();

    const rows = data.map((item) =>
      resource === 'transactions'
        ? {
            customerId: item.customer?.customerId,
            customer: item.customer?.fullName,
            phone: item.customer?.phone,
            type: item.type,
            amount: item.amount,
            paymentMethod: item.paymentMethod,
            date: item.date,
            notes: item.notes
          }
        : {
            customerId: item.customerId,
            fullName: item.fullName,
            phone: item.phone,
            address: item.address,
            totalCredit: item.totals.credit,
            totalPaid: item.totals.paid,
            balance: item.totals.balance
          }
    );

    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${resource}.csv"`);
      return res.send(stringify(rows, { header: true }));
    }

    if (format === 'pdf') {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${resource}.pdf"`);
      const doc = new PDFDocument({ margin: 36 });
      doc.pipe(res);
      doc.fontSize(18).text(`BankiKhata ${resource} export`, { underline: true });
      rows.slice(0, 200).forEach((row) => doc.fontSize(9).text(JSON.stringify(row)));
      return doc.end();
    }

    const buffer = await createXlsxBuffer(rows, resource);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${resource}.xlsx"`);
    return res.send(buffer);
  })
);

export default router;
