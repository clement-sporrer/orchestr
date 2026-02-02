# Chrome Extension

> LinkedIn profile capture extension

---

## Overview

ORCHESTR includes a Chrome extension for capturing LinkedIn profiles directly into your talent database. The extension extracts profile data and optionally scores candidates against active missions.

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         CHROME EXTENSION FLOW                                    │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│   ┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐  │
│   │  LinkedIn   │────▶│   Chrome    │────▶│  ORCHESTR   │────▶│  Candidate  │  │
│   │   Profile   │     │  Extension  │     │    API      │     │  Database   │  │
│   └─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘  │
│                              │                   │                              │
│                              │                   ▼                              │
│                              │            ┌─────────────┐                       │
│                              │            │ AI Scoring  │                       │
│                              │            │ (Optional)  │                       │
│                              │            └─────────────┘                       │
│                              │                   │                              │
│                              ◀───────────────────┘                              │
│                        Score & Status                                           │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## Features

- **Profile Extraction** — Automatically captures name, headline, location, experiences, education, skills, and languages
- **Deduplication** — Existing candidates are updated, not duplicated
- **AI Scoring** — Optional scoring against mission requirements
- **Mission Assignment** — Add directly to a specific mission or general talent pool
- **Offline Detection** — Works when profile data is visible

---

## Installation

### Step 1: Download Extension

The extension files are located in the `chrome-extension/` directory.

#### From Repository

```bash
git clone https://github.com/your-org/orchestr.git
cd orchestr/chrome-extension
```

#### From ZIP

Download `orchestr-extension.zip` from the releases page and extract.

### Step 2: Load in Chrome

1. Open Chrome and navigate to: `chrome://extensions/`
2. Enable **Developer mode** (toggle in top-right)
3. Click **Load unpacked**
4. Select the `chrome-extension` folder
5. The ORCHESTR icon should appear in your toolbar

### Step 3: Configure

1. Click the ORCHESTR extension icon
2. Enter your settings:
   - **API URL**: Your ORCHESTR instance URL
     - Production: `https://your-domain.com`
     - Local: `http://localhost:3000`
     - ⚠️ No trailing slash
   - **API Key**: Your ORCHESTR login email
3. Click **Save**

---

## Usage

### Capturing a Profile

1. Navigate to a LinkedIn profile page (`linkedin.com/in/...`)
2. Click the ORCHESTR extension icon
3. You should see:
   - Profile name detected
   - "Profile detected" status
   - Mission dropdown (optional)
   - "Capture Profile" button
4. Select a mission (optional) or leave blank for talent pool
5. Click **Capture Profile**
6. Wait for confirmation with score (if mission selected)

### What Gets Captured

| Data | Source |
|------|--------|
| Name | Profile header |
| Headline | Profile header |
| Location | Profile header |
| Profile URL | Browser URL |
| Experiences | Experience section |
| Education | Education section |
| Skills | Skills section |
| Languages | Languages section |

### Deduplication Logic

Candidates are matched by:
1. LinkedIn profile URL (primary)
2. Email address (if available)
3. Name + organization combination

If a match is found, the candidate is **updated** with new data.

---

## Extension Structure

```
chrome-extension/
├── manifest.json        # Extension configuration
├── popup.html           # Popup UI
├── popup.js             # Popup logic
├── content.js           # LinkedIn page scraper
├── background.js        # Service worker
├── styles.css           # Popup styles
├── content.css          # Injected styles
└── icons/
    ├── icon16.png       # Toolbar icon (16x16)
    ├── icon48.png       # Extension page (48x48)
    └── icon128.png      # Store listing (128x128)
```

### Manifest V3

The extension uses Manifest V3 (Chrome's latest extension format):

```json
{
  "manifest_version": 3,
  "name": "ORCHESTR",
  "version": "1.0.0",
  "permissions": ["storage", "activeTab"],
  "host_permissions": ["https://www.linkedin.com/*"],
  "action": {
    "default_popup": "popup.html",
    "default_icon": {
      "16": "icons/icon16.png",
      "48": "icons/icon48.png",
      "128": "icons/icon128.png"
    }
  },
  "content_scripts": [{
    "matches": ["https://www.linkedin.com/in/*"],
    "js": ["content.js"],
    "css": ["content.css"]
  }],
  "background": {
    "service_worker": "background.js"
  }
}
```

---

## API Integration

### Endpoint

```
POST /api/extension/capture
```

### Headers

```
Content-Type: application/json
X-User-Email: user@example.com
```

### Request Body

```json
{
  "profile": {
    "firstName": "John",
    "lastName": "Doe",
    "headline": "Senior Software Engineer at TechCorp",
    "location": "Paris, France",
    "profileUrl": "https://www.linkedin.com/in/johndoe",
    "experiences": [
      {
        "company": "TechCorp",
        "title": "Senior Software Engineer",
        "startDate": "2022-01",
        "endDate": null,
        "description": "..."
      }
    ],
    "education": [
      {
        "school": "MIT",
        "degree": "BS Computer Science",
        "year": "2018"
      }
    ],
    "skills": ["JavaScript", "TypeScript", "React", "Node.js"],
    "languages": ["English", "French"]
  },
  "missionId": "clx123..." // Optional
}
```

### Response

```json
{
  "success": true,
  "candidateId": "clx456...",
  "isNew": true,
  "score": 85,
  "scoreReasons": [
    "Strong technical background",
    "Relevant experience",
    "Location compatible"
  ]
}
```

---

## Troubleshooting

### Extension Not Appearing

1. Verify Developer mode is enabled in `chrome://extensions/`
2. Check the extension is enabled (toggle is on)
3. Click the reload button on the extension card

### "No Profile Detected"

1. Ensure you're on a LinkedIn profile page (`/in/...`)
2. Refresh the LinkedIn page
3. Wait for the page to fully load
4. Re-open the extension popup

### "Connection Error"

1. Check the API URL is correct (no trailing slash)
2. Verify you're logged into ORCHESTR in another tab
3. Check your email (API key) is correct
4. Open browser DevTools (F12) → Console for error details

### "Unauthorized" / 401 Error

1. Verify your email matches your ORCHESTR account
2. Ensure you're logged into ORCHESTR
3. Try logging out and back into ORCHESTR

### Missions Not Loading

1. Check you have active missions in ORCHESTR
2. Verify API URL is correct
3. Check network tab for errors

---

## Security

### Data Handling

- No data sent to third parties
- Data only sent to your ORCHESTR instance
- API key (email) stored locally in Chrome storage
- No OAuth or password storage

### Permissions

The extension only requests minimal permissions:

| Permission | Purpose |
|------------|---------|
| `storage` | Save API URL and key locally |
| `activeTab` | Access current LinkedIn page |
| `linkedin.com` | Run content script on LinkedIn |

---

## Updating

### From Repository

```bash
cd orchestr/chrome-extension
git pull
```

Then in Chrome:
1. Go to `chrome://extensions/`
2. Click reload (↻) on ORCHESTR extension

### Settings Preserved

Your API URL and key are preserved across updates.

---

## Customization

### Icons

Replace files in `icons/` directory:
- `icon16.png` — 16×16 pixels (toolbar)
- `icon48.png` — 48×48 pixels (extensions page)
- `icon128.png` — 128×128 pixels (store)

### Styling

Edit `styles.css` for popup appearance.
Edit `content.css` for injected LinkedIn styles.

---

## Uninstalling

1. Go to `chrome://extensions/`
2. Find ORCHESTR
3. Click **Remove**

This removes the extension and all stored settings.

---

## Development

### Local Development

1. Make changes to extension files
2. Go to `chrome://extensions/`
3. Click reload on ORCHESTR extension
4. Test changes

### Debugging

- **Popup**: Right-click extension icon → Inspect popup
- **Content Script**: Open DevTools on LinkedIn page → Console
- **Background**: `chrome://extensions/` → Click "service worker" link

### Testing with Local API

Set API URL to `http://localhost:3000` for local development.

---

## Future Improvements

- [ ] Auto-capture mode (detect profile visit)
- [ ] Bulk capture from search results
- [ ] Notes input before capture
- [ ] Tag selection
- [ ] Pool selection
- [ ] Offline queue for later sync


