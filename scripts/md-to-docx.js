/* eslint-disable */
// Genera INFORME-ERP-CETOX.docx a partir del Markdown.
// Uso: node scripts/md-to-docx.js
const fs = require('fs')
const path = require('path')
const {
  Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType,
  Table, TableRow, TableCell, WidthType, BorderStyle, ShadingType,
} = require('docx')

const ARG = process.argv[2] || 'INFORME-ERP-CETOX.md'
const SRC = path.isAbsolute(ARG) ? ARG : path.join(__dirname, '..', ARG)
const OUT = SRC.replace(/\.md$/, '.docx')

const GREEN = '13602C'
const TEAL  = '4AC3B2'
const GREY  = 'F1F5F9'

const md = fs.readFileSync(SRC, 'utf8')
const lines = md.split('\n')

// ── Inline parser: **bold** ──────────────────────────────────────────────────
function runs(text, base = {}) {
  const out = []
  const parts = text.split(/(\*\*[^*]+\*\*)/g)
  for (const p of parts) {
    if (!p) continue
    if (p.startsWith('**') && p.endsWith('**')) {
      out.push(new TextRun({ text: p.slice(2, -2), bold: true, ...base }))
    } else {
      out.push(new TextRun({ text: p, ...base }))
    }
  }
  return out.length ? out : [new TextRun({ text: '', ...base })]
}

function cellShade(fill) {
  return { fill, type: ShadingType.CLEAR, color: 'auto' }
}

const children = []
let i = 0

function parseTable(start) {
  const rows = []
  let j = start
  while (j < lines.length && lines[j].trim().startsWith('|')) {
    rows.push(lines[j].trim())
    j++
  }
  // rows[1] is the --- separator
  const header = rows[0].split('|').slice(1, -1).map(s => s.trim())
  const body = rows.slice(2).map(r => r.split('|').slice(1, -1).map(s => s.trim()))

  const makeRow = (cells, isHeader) =>
    new TableRow({
      tableHeader: isHeader,
      children: cells.map(c =>
        new TableCell({
          shading: isHeader ? cellShade(GREEN) : cellShade('FFFFFF'),
          margins: { top: 60, bottom: 60, left: 100, right: 100 },
          children: [new Paragraph({
            children: runs(c, isHeader ? { color: 'FFFFFF', bold: true, size: 19 } : { size: 19 }),
          })],
        })
      ),
    })

  const table = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top:    { style: BorderStyle.SINGLE, size: 2, color: 'D9D9D9' },
      bottom: { style: BorderStyle.SINGLE, size: 2, color: 'D9D9D9' },
      left:   { style: BorderStyle.SINGLE, size: 2, color: 'D9D9D9' },
      right:  { style: BorderStyle.SINGLE, size: 2, color: 'D9D9D9' },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: 'E5E7EB' },
      insideVertical:   { style: BorderStyle.SINGLE, size: 1, color: 'E5E7EB' },
    },
    rows: [makeRow(header, true), ...body.map(r => makeRow(r, false))],
  })
  return { table, next: j }
}

while (i < lines.length) {
  const line = lines[i]
  const t = line.trim()

  if (t === '') { i++; continue }

  // Horizontal rule
  if (t === '---') {
    children.push(new Paragraph({
      border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: TEAL, space: 1 } },
      spacing: { before: 120, after: 120 },
      children: [],
    }))
    i++; continue
  }

  // Tables
  if (t.startsWith('|')) {
    const { table, next } = parseTable(i)
    children.push(table)
    children.push(new Paragraph({ spacing: { after: 120 }, children: [] }))
    i = next; continue
  }

  // Headings
  if (t.startsWith('#### ')) {
    children.push(new Paragraph({
      spacing: { before: 160, after: 60 },
      children: runs(t.slice(5), { bold: true, color: GREEN, size: 22 }),
    }))
    i++; continue
  }
  if (t.startsWith('### ')) {
    children.push(new Paragraph({
      heading: HeadingLevel.HEADING_3,
      spacing: { before: 200, after: 80 },
      children: runs(t.slice(4), { bold: true, color: GREEN, size: 24 }),
    }))
    i++; continue
  }
  if (t.startsWith('## ')) {
    children.push(new Paragraph({
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 280, after: 120 },
      border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: TEAL, space: 2 } },
      children: runs(t.slice(3), { bold: true, color: GREEN, size: 30 }),
    }))
    i++; continue
  }
  if (t.startsWith('# ')) {
    children.push(new Paragraph({
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.CENTER,
      spacing: { after: 120 },
      children: runs(t.slice(2), { bold: true, color: GREEN, size: 40 }),
    }))
    i++; continue
  }

  // Blockquote
  if (t.startsWith('> ')) {
    const text = t.slice(2).replace(/^\*|\*$/g, '')
    children.push(new Paragraph({
      indent: { left: 360 },
      spacing: { before: 80, after: 120 },
      border: { left: { style: BorderStyle.SINGLE, size: 18, color: TEAL, space: 8 } },
      children: runs(text, { italics: true, color: '475569', size: 21 }),
    }))
    i++; continue
  }

  // Bullet list
  if (t.startsWith('- ')) {
    children.push(new Paragraph({
      bullet: { level: 0 },
      spacing: { after: 40 },
      children: runs(t.slice(2)),
    }))
    i++; continue
  }

  // Numbered list
  const numMatch = t.match(/^(\d+)\.\s+(.*)$/)
  if (numMatch) {
    children.push(new Paragraph({
      numbering: { reference: 'num', level: 0 },
      spacing: { after: 40 },
      children: runs(numMatch[2]),
    }))
    i++; continue
  }

  // Normal paragraph
  children.push(new Paragraph({
    spacing: { after: 100 },
    children: runs(t),
  }))
  i++
}

const doc = new Document({
  numbering: {
    config: [{
      reference: 'num',
      levels: [{ level: 0, format: 'decimal', text: '%1.', alignment: AlignmentType.START }],
    }],
  },
  styles: {
    default: {
      document: { run: { font: 'Calibri', size: 21 } },
    },
  },
  sections: [{
    properties: { page: { margin: { top: 1000, bottom: 1000, left: 1100, right: 1100 } } },
    children,
  }],
})

Packer.toBuffer(doc).then(buf => {
  fs.writeFileSync(OUT, buf)
  console.log('OK ->', OUT, '(' + (buf.length / 1024).toFixed(0) + ' KB)')
})
