# summarize

Extracts content from a YouTube URL, web article, or PDF — then Cozbra summarizes it directly.

## Invoke

```bash
node ~/Cozmo/skills/summarize/run.js <youtube-url|web-url|/path/to/file.pdf>
```

## Examples

```bash
node ~/Cozmo/skills/summarize/run.js "https://youtu.be/dQw4w9WgXcQ"
node ~/Cozmo/skills/summarize/run.js "https://some-article.com"
node ~/Cozmo/skills/summarize/run.js "~/Documents/notes.pdf"
```

## Output

Prints extracted text to stdout. Cozbra reads it and summarizes in the response.

## Notes

- No API key needed — summarization is done by Cozbra directly
- YouTube: uses caption/transcript extraction
- Web: strips HTML, returns visible text (up to 20k words)
- PDF: extracts text (up to 20k words)
