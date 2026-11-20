// Renders a PDF page by opening it in Chromium and taking a screenshot
const { chromium } = require('playwright');
const path = require('path');

const pdfPath = process.argv[2];
const startPage = parseInt(process.argv[3] || '1');
const numPages = parseInt(process.argv[4] || '3');

if (!pdfPath) {
    console.error('Usage: node pdf-screenshot.js <pdf-path> [start-page] [num-pages]');
    process.exit(1);
}

const outDir = '/tmp/pdf-shots';
const fs = require('fs');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir);

(async () => {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({ viewport: { width: 1200, height: 1600 } });
    const page = await context.newPage();

    const fileUrl = `file://${path.resolve(pdfPath)}#page=${startPage}`;
    await page.goto(fileUrl, { waitUntil: 'networkidle', timeout: 15000 });
    // Wait for PDF to render
    await page.waitForTimeout(2000);

    for (let i = 0; i < numPages; i++) {
        const outPath = path.join(outDir, `page_${startPage + i}.png`);
        await page.screenshot({ path: outPath, fullPage: false });
        console.log(`Screenshot: ${outPath}`);
        if (i < numPages - 1) {
            // Try to navigate to next page via keyboard
            await page.keyboard.press('ArrowRight');
            await page.waitForTimeout(800);
        }
    }

    await browser.close();
})();
