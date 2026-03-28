# badbunny.studio

A personal creative website with a chaotic villain-bunny aesthetic. Built as a pure static site — no build step, no framework, no nonsense. Deployed via GitHub Pages.

## Site Structure

```
bad-bunny-studio/
├── index.html              # Splash / gate page ("STAY AWAY!!!")
├── home.html               # Main hub — links to all sections
├── profile.html            # The Mastermind's profile page
│
├── plans/
│   ├── index.html          # Master Plans — villain scheme gallery
│   └── chaos.html          # Chaos detail page
│
├── classifieds/
│   ├── index.html          # Classifieds index — case file dossiers
│   ├── case001.html        # Case File 001: The Rabbit Hole Incident
│   └── case002.html        # Case File 002: Carrot Heist #44
│
└── labs/
    ├── index.html          # Secret Lab hub — encoder/decoder directory
    ├── encoders/
    │   ├── braille.html
    │   ├── hexadecimal.html
    │   ├── morse-code.html
    │   ├── pigpen.html
    │   ├── semaphore.html
    │   ├── spectrogram.html
    │   └── steganography.html
    └── decoders/
        ├── braille.html
        ├── hexadecimal.html
        ├── morse-code.html
        ├── pigpen.html
        ├── semaphore.html
        ├── spectrogram.html
        └── steganography.html
```

## Sections

### 🚪 Splash (`index.html`)
The gate page. Warns visitors away and redirects to `home.html`.

### 🗺️ Home (`home.html`)
The central navigation hub. Links to the three main sections: Secret Lab, Master Plans, and Classifieds.

### 👤 Profile (`profile.html`)
The villain's self-portrait page. Stats, to-do list, and a gallery of chaos.

### 📋 Master Plans (`plans/`)
A scrapbook-style gallery of villain schemes. Includes `chaos.html` as a detail page.

### 🔒 Classifieds (`classifieds/`)
Dossier-style case files with a redacted/top-secret aesthetic. Contains two open case files.

### 🧪 Secret Lab (`labs/`)
A hub for encoding and decoding tools, organized into two categories:

| Tool | Encoder | Decoder |
|---|---|---|
| Steganography | ✅ | ✅ |
| Spectrogram | ✅ | ✅ |
| Morse Code | ✅ | ✅ |
| Braille | ✅ | ✅ |
| Hexadecimal | ✅ | ✅ |
| Pigpen Cipher | ✅ | ✅ |
| Semaphore | ✅ | ✅ |

## Tech Stack

| Layer | Technology |
|---|---|
| Markup | HTML5 |
| Styling | [Tailwind CSS](https://tailwindcss.com/) via CDN (no build step) |
| Typography | [Spline Sans](https://fonts.google.com/specimen/Spline+Sans) + [Plus Jakarta Sans](https://fonts.google.com/specimen/Plus+Jakarta+Sans) via Google Fonts |
| Icons | [Material Symbols](https://fonts.google.com/icons) via Google Fonts CDN |
| Hosting | GitHub Pages |

All dependencies are loaded from external CDNs. There is no `package.json`, no bundler, and no server-side code.

## GitHub Pages

This site is configured for GitHub Pages with a `.nojekyll` file at the root, which disables Jekyll processing and ensures all files are served as raw static content.

**To deploy:**
1. Push this repository to GitHub
2. Go to **Settings → Pages**
3. Set source to `Deploy from a branch` → `main` → `/ (root)`
4. The site will be live at `https://<username>.github.io/<repo-name>/`

> If using a custom domain (e.g. `badbunny.studio`), add a `CNAME` file to the repo root containing just the domain name, and point a DNS `CNAME` record to `<username>.github.io`.

## Design System

The site uses a consistent Material Design 3-inspired color token system defined inline via `tailwind.config` on each page.

| Token | Value | Role |
|---|---|---|
| `primary` | `#c00014` | Villain red — CTAs, accents |
| `secondary` | `#00668a` | Cool blue — secondary actions |
| `tertiary` | `#705d00` | Mustard gold — highlights |
| `surface` | `#fbfaee` | Off-white paper background |
| `tertiary-fixed` | `#ffe16d` | Bright yellow — selection, tags |

Each page also includes hand-crafted CSS for texture effects: paper grain, blueprint grids, coffee stains, crayon strokes, and rough clip-path edges.
