import * as XLSX from 'xlsx';

/** Export rows to an Excel file (XLSX). */
export function exportExcel(rows: Record<string, unknown>[], filename: string, sheet = 'Sheet1') {
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheet);
  XLSX.writeFile(wb, filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`);
}

/** Open a print-friendly window and print (used for receipts, bulletins, reports). */
export function printHtml(title: string, bodyHtml: string) {
  const w = window.open('', '_blank', 'width=900,height=650');
  if (!w) return;
  w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${title}</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: 'Segoe UI', Arial, sans-serif; color: #111; margin: 32px; font-size: 13px; }
    .head { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #f97316; padding-bottom: 12px; margin-bottom: 18px; }
    .logo { display:flex; align-items:center; gap:10px; }
    .logo-badge { width:42px; height:42px; border-radius:10px; background:#f97316; color:#fff; display:flex; align-items:center; justify-content:center; font-weight:800; font-size:20px; }
    h1 { font-size: 18px; margin: 0; }
    h2 { font-size: 15px; margin: 18px 0 8px; }
    .muted { color: #666; font-size: 12px; }
    table { width: 100%; border-collapse: collapse; margin: 10px 0; }
    th, td { border: 1px solid #ddd; padding: 6px 8px; text-align: left; font-size: 12px; }
    th { background: #f6f6f7; text-transform: uppercase; font-size: 10px; letter-spacing: .04em; }
    .right { text-align: right; }
    .total-box { margin-top: 14px; border: 2px solid #f97316; border-radius: 10px; padding: 12px 16px; display: inline-block; font-size: 16px; font-weight: 700; }
    .grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 4px 24px; }
    .stamp { margin-top: 28px; display: flex; justify-content: space-between; }
    .sign { border-top: 1px dashed #999; padding-top: 6px; width: 200px; text-align: center; font-size: 11px; color: #444; }
    .badge { display:inline-block; border:1px solid #ddd; border-radius: 20px; padding: 2px 10px; font-size: 11px; font-weight: 600; }
    .footer { margin-top: 30px; border-top: 1px solid #eee; padding-top: 8px; color: #888; font-size: 10px; display:flex; justify-content:space-between; }
    @media print { body { margin: 12mm; } }
  </style></head><body>${bodyHtml}
  <script>window.onload = () => { setTimeout(() => { window.print(); }, 250); };</script>
  </body></html>`);
  w.document.close();
}

export function schoolHeaderHtml(school: { name: string; motto?: string; phone?: string; email?: string; address?: string }, rightHtml = ''): string {
  return `<div class="head">
    <div class="logo">
      <div class="logo-badge">E</div>
      <div>
        <h1>${school.name}</h1>
        <div class="muted">${school.motto || ''}</div>
        <div class="muted">${[school.address, school.phone, school.email].filter(Boolean).join(' · ')}</div>
      </div>
    </div>
    <div>${rightHtml}</div>
  </div>`;
}
