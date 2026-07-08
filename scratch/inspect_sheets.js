import XLSX from 'xlsx'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const XLS_PATH = path.join(__dirname, '..', 'Magic QP with paper no. 2023.xlsx')

const LEVEL_CONFIG = {
  l1: { addSheet: '1 ADD', abacusRange: [1, 40], visualRange: null,    mulSheet: null,   divSheet: null },
  l2: { addSheet: '2 ADD', abacusRange: [1, 40], visualRange: [41, 83], mulSheet: null,   divSheet: null },
  l3: { addSheet: '3 ADD', abacusRange: [1, 40], visualRange: [41, 83], mulSheet: null,   divSheet: null },
  l4: { addSheet: '4 ADD ', abacusRange: [1, 40], visualRange: [41, 80], mulSheet: '4 MUL', divSheet: '5 DIV' },
  l5: { addSheet: '5 ADD', abacusRange: [1, 47], visualRange: [48, 94], mulSheet: ' 5 MUL ', divSheet: '5 DIV' },
  l6: { addSheet: '6 ADD', abacusRange: [1, 46], visualRange: [47, 93], mulSheet: '6MUL',  divSheet: '6MUL' },
  l7: { addSheet: '7 ADD', abacusRange: [1, 45], visualRange: [46, 90], mulSheet: '7MUL',  divSheet: '7MUL' },
  l8: { addSheet: '8ADD',  abacusRange: [1, 30], visualRange: [31, 60], mulSheet: '8 MUL', divSheet: '8 MUL' },
}

function analyzeAddSheet(wb, sheetName, abacusRange, visualRange) {
  const ws = wb.Sheets[sheetName]
  if (!ws) return { error: 'Not found' }

  const range = XLSX.utils.decode_range(ws['!ref'] || 'A1:A1')
  const totalRows = range.e.r + 1
  const totalCols = range.e.c + 1

  const results = {
    abacus: { count: 0, rows: new Set(), min: Infinity, max: -Infinity, hasNegatives: false, totalQuestions: 0 },
    visual: { count: 0, rows: new Set(), min: Infinity, max: -Infinity, hasNegatives: false, totalQuestions: 0 }
  }

  // Question paper columns (0-19)
  const maxCols = Math.min(20, totalCols)

  for (let col = 0; col < maxCols; col++) {
    const qNumCell = ws[XLSX.utils.encode_cell({ r: 3, c: col })]
    const qNum = qNumCell ? Number(qNumCell.v) : null
    if (!qNum || isNaN(qNum)) continue

    const addends = []
    for (let row = 4; row < totalRows; row++) {
      const cell = ws[XLSX.utils.encode_cell({ r: row, c: col })]
      if (cell === undefined || cell === null || cell.v === undefined || cell.v === '') continue
      const val = Number(cell.v)
      if (!isNaN(val)) addends.push(val)
    }

    if (addends.length === 0) continue

    let target = null
    if (abacusRange && qNum >= abacusRange[0] && qNum <= abacusRange[1]) {
      target = results.abacus
    } else if (visualRange && qNum >= visualRange[0] && qNum <= visualRange[1]) {
      target = results.visual
    }

    if (target) {
      target.totalQuestions++
      target.rows.add(addends.length)
      addends.forEach(v => {
        if (v < target.min) target.min = v
        if (v > target.max) target.max = v
        if (v < 0) target.hasNegatives = true
      })
    }
  }

  // Format sets for printing
  const formatSec = (sec) => {
    if (sec.totalQuestions === 0) return 'N/A'
    return {
      totalQuestions: sec.totalQuestions,
      rowLengths: Array.from(sec.rows).sort((a,b)=>a-b),
      valueRange: `[${sec.min}, ${sec.max}]`,
      hasSubtraction: sec.hasNegatives
    }
  }

  return {
    abacus: formatSec(results.abacus),
    visual: formatSec(results.visual)
  }
}

function analyzeMulSheet(wb, sheetName) {
  const ws = wb.Sheets[sheetName]
  if (!ws) return { error: 'Not found' }

  const range = XLSX.utils.decode_range(ws['!ref'] || 'A1:A1')
  const totalRows = range.e.r + 1

  const mulStats = { count: 0, minOp1: Infinity, maxOp1: -Infinity, minOp2: Infinity, maxOp2: -Infinity }
  const divStats = { count: 0, minOp1: Infinity, maxOp1: -Infinity, minOp2: Infinity, maxOp2: -Infinity }

  for (let row = 0; row < totalRows; row++) {
    for (const startCol of [0, 7]) {
      const qNumCell = ws[XLSX.utils.encode_cell({ r: row, c: startCol })]
      const op1Cell  = ws[XLSX.utils.encode_cell({ r: row, c: startCol + 1 })]
      const opCell   = ws[XLSX.utils.encode_cell({ r: row, c: startCol + 2 })]
      const op2Cell  = ws[XLSX.utils.encode_cell({ r: row, c: startCol + 3 })]

      if (!qNumCell || !op1Cell || !opCell || !op2Cell) continue

      const qNum = Number(qNumCell.v)
      const op1  = Number(op1Cell.v)
      const opStr = String(opCell.v || '').trim()
      const op2  = Number(op2Cell.v)

      if (isNaN(qNum) || isNaN(op1) || isNaN(op2)) continue
      
      const isMul = opStr === 'x' || opStr === '×'
      const target = isMul ? mulStats : divStats

      target.count++
      if (op1 < target.minOp1) target.minOp1 = op1
      if (op1 > target.maxOp1) target.maxOp1 = op1
      if (op2 < target.minOp2) target.minOp2 = op2
      if (op2 > target.maxOp2) target.maxOp2 = op2
    }
  }

  const formatOp = (stat) => {
    if (stat.count === 0) return 'N/A'
    return {
      totalQuestions: stat.count,
      operand1Range: `[${stat.minOp1}, ${stat.maxOp1}]`,
      operand2Range: `[${stat.minOp2}, ${stat.maxOp2}]`
    }
  }

  return {
    multiplication: formatOp(mulStats),
    division: formatOp(divStats)
  }
}

function main() {
  const wb = XLSX.readFile(XLS_PATH)
  const report = {}

  for (const [level, cfg] of Object.entries(LEVEL_CONFIG)) {
    const addResults = analyzeAddSheet(wb, cfg.addSheet, cfg.abacusRange, cfg.visualRange)
    
    let mulResults = {}
    if (cfg.mulSheet) {
      mulResults = analyzeMulSheet(wb, cfg.mulSheet)
    }

    let divResults = {}
    if (cfg.divSheet && cfg.divSheet !== cfg.mulSheet) {
      const divOnly = analyzeMulSheet(wb, cfg.divSheet)
      divResults = { division: divOnly.division }
    }

    report[level] = {
      abacus: addResults.abacus,
      visual: addResults.visual,
      multiplication: mulResults.multiplication || 'N/A',
      division: divResults.division || mulResults.division || 'N/A'
    }
  }

  console.log(JSON.stringify(report, null, 2))
}

main()
