const fs = require('fs');
const path = require('path');
const { QR_STATS_FILE, aggregateScans } = require('../utils/qrStats');

/**
 * 导出二维码统计为 JSON 或 CSV
 * 用法：
 *   node server/scripts/exportQrStats.js json [days]
 *   node server/scripts/exportQrStats.js csv [days] [outfile]
 */

function toCsv(rows) {
  const header = 'date,count,unique\n';
  const body = rows.map(r => `${r.date},${r.count},${r.unique}`).join('\n');
  return header + body + '\n';
}

async function main() {
  const fmt = (process.argv[2] || 'json').toLowerCase();
  const days = Number(process.argv[3]) || 30;
  const out = process.argv[4];

  const stats = aggregateScans({ days });

  if (fmt === 'csv') {
    const csv = toCsv(stats.byDay);
    if (out) {
      fs.writeFileSync(out, csv, 'utf8');
      console.log(`已导出 CSV: ${out}`);
    } else {
      process.stdout.write(csv);
    }
  } else {
    const json = JSON.stringify(stats, null, 2);
    if (out) {
      fs.writeFileSync(out, json, 'utf8');
      console.log(`已导出 JSON: ${out}`);
    } else {
      process.stdout.write(json + '\n');
    }
  }

  console.log(`数据文件: ${QR_STATS_FILE}`);
}

main();

