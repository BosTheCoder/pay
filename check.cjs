// Drives the page in Chromium at phone size: a tapped card still opens its link
// after the pull-out animation, the bank card turns over, and Copy copies.
// Run: NODE_PATH=~/projects/personal/buildwithbos.com/node_modules node check.cjs
const { chromium } = require('playwright');
const assert = require('assert');
const fs = require('fs');
const http = require('http');
const os = require('os');
const path = require('path');

const CHROME = process.env.CHROME || path.join(os.homedir(), '.cache/ms-playwright/chromium-1247/chrome-linux64/chrome');

(async () => {
  const html = fs.readFileSync(path.join(__dirname, 'index.html'));
  const server = http.createServer((_, res) => res.end(html)).listen(0);
  const url = `http://localhost:${server.address().port}/`;
  const browser = await chromium.launch({ executablePath: CHROME });
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, permissions: ['clipboard-read', 'clipboard-write'] });
  const page = await ctx.newPage();
  await page.route(url => !url.href.startsWith('http://localhost'), r => r.fulfill({ body: 'left the page' }));

  await page.goto(url);
  await page.waitForTimeout(1500);
  const card = page.locator('.card.monzo');
  const href = await card.getAttribute('href');
  await Promise.all([page.waitForURL(href, { timeout: 3000 }), card.click({ position: { x: 120, y: 24 } })]);
  console.log('ok  tapped card opens', href);

  await page.goto(url);
  await page.locator('.flip').scrollIntoViewIfNeeded();
  await page.waitForTimeout(1500);
  assert.equal(await page.locator('.flip.face-up').count(), 0, 'bank card never turned over');
  console.log('ok  bank card turns over');

  await page.locator('.row button').nth(1).click();
  assert.match(await page.evaluate(() => navigator.clipboard.readText()), /^\d{6}$/, 'sort code copy should be 6 bare digits');
  await page.locator('.all').click();
  assert.match(await page.evaluate(() => navigator.clipboard.readText()), /^Name: .+\nSort code: \d\d-\d\d-\d\d\nAccount number: \d{8}$/);
  console.log('ok  copy buttons');

  await browser.close();
  server.close();
})().catch(e => { console.error('FAIL', e.message); process.exit(1); });
