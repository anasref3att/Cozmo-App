# browser-automation

Playwright-based browser control. Use for logins, scraping, and multi-step web flows.

## Invoke

```bash
# Navigate to a URL and get page content
node ~/Cozmo/skills/browser-automation/run.js --action snapshot --url <url>

# Run a custom script string
node ~/Cozmo/skills/browser-automation/run.js --action script --url <url> --script "<js>"

# Click an element by text
node ~/Cozmo/skills/browser-automation/run.js --action click --url <url> --selector "<text-or-selector>"

# Fill a form field
node ~/Cozmo/skills/browser-automation/run.js --action fill --url <url> --selector "<selector>" --value "<value>"
```

## Actions

| Action     | What it does                              |
|------------|-------------------------------------------|
| `snapshot` | Returns page title + visible text content |
| `script`   | Runs arbitrary JS in the page context     |
| `click`    | Clicks element matching selector/text     |
| `fill`     | Types value into an input field           |

## Notes

- Runs headless Chromium via Playwright
- For multi-step flows, chain multiple calls
- If login/captcha/2FA is needed, it will report and stop — won't guess
