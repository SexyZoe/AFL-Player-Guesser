const fs = require('fs');
const path = require('path');
const QRCode = require('qrcode');

/**
 * 生成二维码文件
 * 用法：
 *   node server/scripts/generateQr.js [url] [outfile]
 *   或使用环境变量：
 *   POSTER_SHORT_URL=https://your-domain/go npm run qr:poster
 */

async function main() {
  const argUrl = process.argv[2];
  const argOut = process.argv[3];

  const url = (argUrl || process.env.POSTER_SHORT_URL || '').trim();
  if (!url) {
    console.error('缺少 URL。请传入参数或设置环境变量 POSTER_SHORT_URL');
    process.exit(1);
  }

  // 默认输出到仓库根目录的 qr_poster.png
  const out = argOut || path.join(process.cwd(), 'qr_poster.png');

  try {
    await QRCode.toFile(out, url, {
      width: 1024,
      margin: 1,
      errorCorrectionLevel: 'H',
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });
    console.log(`二维码已保存: ${out}`);
    console.log(`内容: ${url}`);
  } catch (err) {
    console.error('生成二维码失败:', err);
    process.exit(1);
  }
}

main();

