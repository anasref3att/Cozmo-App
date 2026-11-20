# extract-youtube-transcript

Pulls a plain-text transcript from a YouTube video URL.

## Invoke

```bash
node ~/Cozmo/skills/extract-youtube-transcript/run.js <youtube-url>
```

## Output

Prints the full transcript to stdout as plain text.

## Notes

- Uses `youtube-transcript` npm package — no API key needed
- Works on any video with auto-generated or manual captions
- If captions are disabled, it will say so and exit cleanly
