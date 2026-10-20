// Drives the page in Chromium at phone size: the first tap on a card brings it forward,
// the second opens its link, the bank card turns over to copy buttons, and Copy copies.
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
  await card.click({ position: { x: 120, y: 24 } });
  await page.waitForTimeout(800);
  assert.equal(page.url(), url, 'first tap should bring the card forward, not open it');
  await Promise.all([page.waitForURL(href, { timeout: 3000 }), card.click()]);
  console.log('ok  first tap brings a card forward, second opens', href);

  await page.goto(url);
  await page.waitForTimeout(1500);
  await page.locator('.bank .front').click();
  await page.waitForTimeout(1200);
  console.log('ok  bank card turns over');

  await page.locator('.row button').nth(1).click();
  assert.match(await page.evaluate(() => navigator.clipboard.readText()), /^\d{6}$/, 'sort code copy should be 6 bare digits');
  await page.locator('.all').click();
  assert.match(await page.evaluate(() => navigator.clipboard.readText()), /^Name: .+\nSort code: \d\d-\d\d-\d\d\nAccount number: \d{8}$/);
  console.log('ok  copy buttons');

  await page.goto(url + '?amount=12.5');
  const hrefs = await page.$$eval('a.card', as => as.map(a => a.href));
  assert.deepEqual(hrefs.map(h => h.match(/12\.50GBP$|\/12\.50$|amount=1250&currency=GBP$|amount=12\.50$/)?.[0]), ['12.50GBP', 'amount=1250&currency=GBP', '/12.50', 'amount=12.50']);
  console.log('ok  ?amount= pre-fills every link');

  await browser.close();
  server.close();
})().catch(e => { console.error('FAIL', e.message); process.exit(1); });
