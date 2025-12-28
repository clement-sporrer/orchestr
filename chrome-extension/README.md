# ORCHESTR Chrome Extension

> Capture LinkedIn profiles directly into your ORCHESTR talent database

## Quick Start

1. **Install**: Load the extension in Chrome (see [Installation Guide](../docs/chrome-extension.md))
2. **Configure**: Enter your ORCHESTR URL and email
3. **Capture**: Click the extension icon on any LinkedIn profile

## Features

- ✅ **Free** — No OAuth or paid API required
- ✅ **Auto-extraction** — Name, headline, experiences, education, skills, languages
- ✅ **Deduplication** — Existing candidates are updated, not duplicated
- ✅ **AI Scoring** — Optional scoring against mission requirements
- ✅ **Privacy** — Data only sent to your ORCHESTR instance

## Files

```
chrome-extension/
├── manifest.json    # Extension configuration (Manifest V3)
├── popup.html/js    # User interface
├── content.js       # LinkedIn page scraper
├── background.js    # Service worker
├── styles.css       # Popup styling
└── icons/           # Extension icons
```

## Configuration

| Setting | Description |
|---------|-------------|
| **API URL** | Your ORCHESTR instance (no trailing slash) |
| **API Key** | Your ORCHESTR login email |

## Documentation

See the full [Chrome Extension Guide](../docs/chrome-extension.md) for:
- Detailed installation steps
- Troubleshooting
- API integration details
- Development guide

## Security

- No data sent to third parties
- Credentials stored locally in Chrome
- Minimal permissions required

---

**Version**: 1.0.0
