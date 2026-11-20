const { createCanvas, Image } = require('canvas');
const pdfjsLib = require('pdfjs-dist/legacy/build/pdf.js');
const fs = require('fs');
const path = require('path');

// Polyfill browser globals pdfjs needs
global.Image = Image;

const pdfPath = process.argv[2];
const startPage = parseInt(process.argv[3] || '1');
const numPages = parseInt(process.argv[4] || '3');
const outDir = process.argv[5] || '/tmp/pdf-shots';
const prefix = process.argv[6] || 'page';

if (!pdfPath) { console.error('Usage: node pdf-render.js <pdf> <start> <count> [outDir] [prefix]'); process.exit(1); }

fs.mkdirSync(outDir, { recursive: true });

class NodeCanvasFactory {
    create(width, height) {
        const canvas = createCanvas(width, height);
        return { canvas, context: canvas.getContext('2d') };
    }
    reset(c, w, h) { c.canvas.width = w; c.canvas.height = h; }
    destroy(c) { c.canvas.width = 0; c.canvas.height = 0; }
}

(async () => {
    const data = new Uint8Array(fs.readFileSync(pdfPath));
    const canvasFactory = new NodeCanvasFactory();
    const pdf = await pdfjsLib.getDocument({ data, canvasFactory }).promise;
    console.log(`PDF: ${pdf.numPages} pages`);

    for (let i = 0; i < numPages; i++) {
        const pgNum = startPage + i;
        if (pgNum > pdf.numPages) break;
        const page = await pdf.getPage(pgNum);
        const viewport = page.getViewport({ scale: 1.5 });
        const c = canvasFactory.create(viewport.width, viewport.height);
        await page.render({ canvasContext: c.context, viewport, canvasFactory }).promise;
        const outPath = path.join(outDir, `${prefix}_${pgNum}.png`);
        fs.writeFileSync(outPath, c.canvas.toBuffer('image/png'));
        console.log(`Saved: ${outPath}`);
        page.cleanup();
    }
})().catch(e => { console.error(e.message); process.exit(1); });
