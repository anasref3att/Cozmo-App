const { chromium } = require('playwright');

const args = process.argv.slice(2);
const get = (flag) => { const i = args.indexOf(flag); return i !== -1 ? args[i + 1] : null; };

const action = get('--action');
const url = get('--url');
const selector = get('--selector');
const value = get('--value');
const script = get('--script');

if (!action) {
    console.error('Usage: node run.js --action <action> [--url <url>] [--selector <sel>] [--value <val>] [--script <js>]');
    process.exit(1);
}

(async () => {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    try {
        if (url) await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });

        if (action === 'snapshot') {
            const title = await page.title();
            const text = await page.evaluate(() => document.body.innerText);
            console.log(`Title: ${title}\n\n${text.trim()}`);

        } else if (action === 'script') {
            if (!script) { console.error('--script required'); process.exit(1); }
            const result = await page.evaluate(script);
            console.log(JSON.stringify(result, null, 2));

        } else if (action === 'click') {
            if (!selector) { console.error('--selector required'); process.exit(1); }
            await page.click(selector, { timeout: 8000 });
            console.log(`Clicked: ${selector}`);

        } else if (action === 'fill') {
            if (!selector || !value) { console.error('--selector and --value required'); process.exit(1); }
            await page.fill(selector, value);
            console.log(`Filled: ${selector}`);

        } else {
            console.error(`Unknown action: ${action}`);
            process.exit(1);
        }

    } catch (err) {
        console.error(`Error during action "${action}": ${err.message}`);
        process.exit(1);
    } finally {
        await browser.close();
    }
})();
