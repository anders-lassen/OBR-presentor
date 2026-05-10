# Mystic Mirror

Mystic Mirror is an Owlbear Rodeo extension for in-person and display-table play.
It lets a GM bind one or more scene shapes to a dedicated screen player, so that player viewport follows shape movement and scene presets.

## Highlights

- Presenter URL flow for browser Presentation API sessions
- Player picker for selecting a dedicated display account
- Screen size presets and manual dimensions
- Follow mode that syncs viewport bounds from tracked scene shapes
- Scene presets via context menu actions
- Metadata reset tools for fast troubleshooting

## Development

Requirements:

- Node.js 24+

Install:

```bash
npm install
```

Run in development:

```bash
npm run dev
```

Build:

```bash
npm run build
```

Preview build output:

```bash
npm run preview
```

## Extension Manifest

The runtime manifest is in `public/manifest.json`.

To test in Owlbear Rodeo:

1. Host this Vite app on an HTTPS URL.
2. Use the hosted `manifest.json` URL when adding a custom extension in Owlbear Rodeo.

## Notes

- Room metadata key: `dk.planeshifter.scrying`
- Main control panel entry: `/src/main.ts`
- Tracker helper entry: `shapeTracker.html` + `/src/tracker.ts`
