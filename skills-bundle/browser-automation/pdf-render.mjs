import { createCanvas, Image, DOMMatrix } from 'canvas';
import { readFileSync, mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';

// Polyfill browser globals that pdfjs needs in Node.js
global.Image = Image;
global.DOMMatrix = DOMMatrix;

const pdfjsLib = await import('./node_modules/pdfjs-dist/legacy/build/pdf.mjs');

const pdfPath = process.argv[2];
const startPage = parseInt(process.argv[3] || '1');
const numPages = parseInt(process.argv[4] || '3');
const outDir = process.argv[5] || '/tmp/pdf-shots';
const prefix = process.argv[6] || 'page';

if (!pdfPath) { console.error('Usage: node pdf-render.mjs <pdf> <start> <count> [outDir] [prefix]'); process.exit(1); }

mkdirSync(outDir, { recursive: true });

// Custom canvas factory for Node.js
class NodeCanvasFactory {
    create(width, height) {
        const canvas = createCanvas(width, height);
        return { canvas, context: canvas.getContext('2d') };
    }
    reset(canvasAndCtx, width, height) {
        canvasAndCtx.canvas.width = width;
        canvasAndCtx.canvas.height = height;
    }
    destroy(canvasAndCtx) {
        canvasAndCtx.canvas.width = 0;
        canvasAndCtx.canvas.height = 0;
    }
}

// Custom image decoder that uses node-canvas Image
class NodeImageDecoder {
    constructor() {}
    async decode({ data, width, height }) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = reject;
            const buf = Buffer.from(data);
            img.src = buf;
        });
    }
}

const data = new Uint8Array(readFileSync(pdfPath));
const canvasFactory = new NodeCanvasFactory();

const pdf = await pdfjsLib.getDocument({
    data,
    useSystemFonts: true,
    canvasFactory,
}).promise;

console.log(`PDF loaded: ${pdf.numPages} pages`);

for (let i = 0; i < numPages; i++) {
    const pgNum = startPage + i;
    if (pgNum > pdf.numPages) break;

    const page = await pdf.getPage(pgNum);
    const scale = 1.5;
    const viewport = page.getViewport({ scale });
    const canvasAndCtx = canvasFactory.create(viewport.width, viewport.height);

    await page.render({
        canvasContext: canvasAndCtx.context,
        viewport,
        canvasFactory,
    }).promise;

    const outPath = join(outDir, `${prefix}_${pgNum}.png`);
    writeFileSync(outPath, canvasAndCtx.canvas.toBuffer('image/png'));
    console.log(`Saved: ${outPath}`);
    page.cleanup();
}
