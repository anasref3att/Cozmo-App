const { YoutubeTranscript } = require('youtube-transcript');
const pdf = require('pdf-parse');
const fs = require('fs');
const path = require('path');

const input = process.argv[2];
if (!input) {
    console.error('Usage: node run.js <youtube-url|web-url|/path/to/file.pdf>');
    process.exit(1);
}

function isYouTube(url) {
    return /youtube\.com|youtu\.be/.test(url);
}

function isURL(str) {
    return /^https?:\/\//.test(str);
}

async function extractYouTube(url) {
    const entries = await YoutubeTranscript.fetchTranscript(url);
    return entries.map(e => e.text).join(' ');
}

async function extractWeb(url) {
    const fetch = (...args) => import('node-fetch').then(m => m.default(...args));
    const res = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Cozbra/1.0)' },
        timeout: 15000,
    });
    const html = await res.text();
    // Strip tags, collapse whitespace
    const text = html
        .replace(/<script[\s\S]*?<\/script>/gi, '')
        .replace(/<style[\s\S]*?<\/style>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    return text.slice(0, 20000);
}

async function extractPDF(filePath) {
    const buf = fs.readFileSync(filePath);
    const data = await pdf(buf);
    return data.text.slice(0, 20000);
}

(async () => {
    try {
        let content = '';
        let type = '';

        if (isYouTube(input)) {
            type = 'YouTube transcript';
            content = await extractYouTube(input);
        } else if (isURL(input)) {
            type = 'Web article';
            content = await extractWeb(input);
        } else if (fs.existsSync(input) && input.endsWith('.pdf')) {
            type = 'PDF';
            content = await extractPDF(input);
        } else {
            console.error('Input must be a YouTube URL, web URL, or PDF file path.');
            process.exit(1);
        }

        console.log(`[TYPE]: ${type}`);
        console.log(`[LENGTH]: ${content.split(' ').length} words`);
        console.log(`[CONTENT]:\n${content}`);
    } catch (err) {
        console.error('Error:', err.message);
        process.exit(1);
    }
})();
