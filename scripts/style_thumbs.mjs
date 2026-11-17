import {openBrowser} from '@remotion/renderer';
import fs from 'fs';
const Z = process.env.CATALOG_SRC || '/tmp/catalogo-fonte'; // pagina original (nao distribuida no kit)
const browser = await openBrowser('chrome', {chromiumOptions: {gl: 'swangle'}, chromeMode: 'headless-shell', logLevel: 'error'});
const page = await browser.newPage({context: undefined, logLevel: 'error', indent: false, pageIndex: 0, onBrowserLog: null, onLog: () => {}});
await page.setViewport({width: 1400, height: 900, deviceScaleFactor: 1});
await page.goto({url: 'file://' + Z + '/index.html', timeout: 60000});
await new Promise((r) => setTimeout(r, 30000));
const out = await page.evaluate(() => Array.from(document.querySelectorAll('canvas')).map((c) => { try { return c.toDataURL('image/jpeg', 0.88); } catch (e) { return 'ERR' + e; } }));
fs.mkdirSync(Z + '/th', {recursive: true});
out.forEach((d, i) => {
  if (d.startsWith('data:')) fs.writeFileSync(Z + '/th/' + String(i + 1).padStart(2, '0') + '.jpg', Buffer.from(d.split(',')[1], 'base64'));
  else console.log(i + 1, d.slice(0, 100));
});
console.log(out.length);
await browser.close(() => {}, false, 'error');
process.exit(0);
