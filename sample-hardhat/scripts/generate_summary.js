// scripts/generate_summary.js
const fs = require('fs');
const path = require('path');

const REPORT_JSON = path.join(__dirname, '../reports/interaction-report.localhost.json');
const OUT_CSV = path.join(__dirname, '../reports/interaction-summary.csv');

function safeGet(obj, pathArray, fallback='') {
  try {
    let o = obj;
    for (const p of pathArray) {
      o = o?.[p];
      if (o === undefined) return fallback;
    }
    return o === null ? fallback : o;
  } catch(e) { return fallback; }
}

function normalizeVal(v) {
  if (v === undefined || v === null) return '';
  if (typeof v === 'string') {
    const s = v.trim();
    if (s.toUpperCase() === 'FAILED') return ''; // leave blank for numeric parsing later
    return s;
  }
  return String(v);
}

try {
  if (!fs.existsSync(REPORT_JSON)) {
    console.error("No JSON report found at", REPORT_JSON);
    process.exit(1);
  }
  const raw = fs.readFileSync(REPORT_JSON, 'utf8');
  const arr = JSON.parse(raw);
  const headers = [
    'timestamp','network','mode','contract','address',
    'transferGas','mintGas','ownershipGas',
    'ownerBalance','user1Balance','user2Balance',
    'totalSupplyBefore','totalSupplyAfter'
  ];

  const rows = arr.map(e => ([
    normalizeVal(safeGet(e, ['timestamp'])),
    normalizeVal(safeGet(e, ['network'])),
    normalizeVal(safeGet(e, ['mode'])),
    normalizeVal(safeGet(e, ['contract'])),
    normalizeVal(safeGet(e, ['address'])),
    normalizeVal(safeGet(e, ['gasUsage','transfer'])),
    normalizeVal(safeGet(e, ['gasUsage','mint'])),
    normalizeVal(safeGet(e, ['gasUsage','transferOwnership'])),
    normalizeVal(safeGet(e, ['balances','owner'])),
    normalizeVal(safeGet(e, ['balances','user1'])),
    normalizeVal(safeGet(e, ['balances','user2'])),
    normalizeVal(safeGet(e, ['totalSupplyBefore'])),
    normalizeVal(safeGet(e, ['totalSupplyAfter']))
  ]));

  const csv = [headers.join(','), ...rows.map(r => r.map(c => {
    // quote if contains comma
    if (c.includes(',')) return `"${c.replace(/"/g,'""')}"`;
    return c;
  }).join(','))].join('\n');

  fs.writeFileSync(OUT_CSV, csv, 'utf8');
  console.log("✅ CSV summary written to:", OUT_CSV);
} catch (err) {
  console.error("Error generating summary:", err);
  process.exit(1);
}
