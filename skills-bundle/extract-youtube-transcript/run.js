const { YoutubeTranscript } = require('youtube-transcript');

const url = process.argv[2];
if (!url) {
    console.error('Usage: node run.js <youtube-url>');
    process.exit(1);
}

YoutubeTranscript.fetchTranscript(url)
    .then(entries => {
        const text = entries.map(e => e.text).join(' ');
        console.log(text);
    })
    .catch(err => {
        console.error('Failed to fetch transcript:', err.message);
        process.exit(1);
    });
