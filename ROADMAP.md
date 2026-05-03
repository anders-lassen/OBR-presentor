# Roadmap — Mystic Mirror

## In Progress
- [ ] ...

## Planned
- [ ] **Waypoint fog & item toggles** — each waypoint can store a set of fog/item visibility rules applied automatically when the waypoint is activated
- [ ] **Mac compatibility** — investigate and fix Chrome/Safari issues on macOS (likely `Presentation API` unavailability + pointer event differences)
- [ ] **Fix player moves synced item bug** - player view flickers and lags
- [ ] ** ** -

## Backlog
- [ ] ...

## Completed
- [x] **In-app tour / docs** — guided walkthrough or help panel so new users can get started without reading a manual; include tip that an incognito window logged in as a player can serve as the dedicated screen/view; link to a video walkthrough
- [x] **Add link to github** - for issue and collaboration 
- [x] **GM follows waypoints** — option to also move the GM's own viewport when activating a waypoint, not just the designated screen player
- [x] **All-players follow** — GM can push their current view/waypoint to all connected players simultaneously
- [x] **Room url decoder** — decoder to strip the room id from the url, e.g. https://www.owlbear.rodeo/room/A7W0upefDl8r/The%20Dicey%20Three -> A7W0upefDl8r/The%20Dicey%20Three
- [x] **Node 24.x** — Update to Node 24.x
- [x] **Update to OBR 3.x**
- [x] Full Vue 3 + TypeScript migration, jQuery removed
- [x] Vite multi-page build (main action panel + shape tracker)
- [x] OBR-aligned UI styling (buttons, inputs, select)
- [x] Scene presets renamed to Waypoints with backward-compatible migration
- [x] `OBR.scene.isReady()` guards on all scene API call sites
- [x] Waypoint active state (`isScreen` class) via dedicated `screen_waypoint_id` metadata key

