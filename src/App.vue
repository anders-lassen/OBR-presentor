<script setup lang="ts">
import { ref } from 'vue'

const HIDE_KEY = 'mystic-mirror:hide-intro'
const hideIntro = ref(localStorage.getItem(HIDE_KEY) === '1')

function toggleIntro() {
    hideIntro.value = !hideIntro.value
    localStorage.setItem(HIDE_KEY, hideIntro.value ? '1' : '0')
}
import OBR from '@owlbear-rodeo/sdk'
import { store } from './composables/useStore'
import { useObrMeta } from './composables/useObrMeta'
import GmView from './components/GmView.vue'
import PlayerView from './components/PlayerView.vue'

// Apply browser preference immediately before OBR resolves
document.documentElement.dataset.theme = 'light'

const ready = ref(false)
const { getRoomMeta } = useObrMeta()

OBR.onReady(async () => {
    await getRoomMeta()
    store.role = (await OBR.player.getRole()) as 'GM' | 'PLAYER'

    const applyTheme = (theme: { mode: string }) => {
        document.documentElement.dataset.theme = theme.mode === 'LIGHT' ? 'light' : 'dark'
    }

    applyTheme(await OBR.theme.getTheme())
    OBR.theme.onChange(applyTheme)

    OBR.room.onMetadataChange(async () => {
        await getRoomMeta()
    })

    ready.value = true
})
</script>

<template>
    <main class="app-shell" aria-live="polite">
        <section class="hero-panel">
            <div class="hero-eyebrow">Owlbear Rodeo Extension</div>
            <div class="hero-title-row">
                <h1>Mystic Mirror</h1>
            </div>
            <span type="button" class="hide-toggle" @click="toggleIntro"
                :title="hideIntro ? '▶ Show description' : '▼ Hide description'"
                :aria-expanded="!hideIntro">
                <template v-if="hideIntro">
                    <span class="toggle-icon">▶</span> Show description
                </template>
                <template v-else>
                    <span class="toggle-icon">▼</span> Hide description
                </template>
            </span>
            <template v-if="!hideIntro">
                <p>
                    Display your battle map on a second screen — a TV, monitor, projector, or a user's device — while
                    you keep full GM controls on your own device. The screen follows your view
                    automatically or snaps to any waypoint you place on the map.
                </p>
                <div class="hero-meta">
                    <span>Live room view sync</span>
                    <span>GM controls player view</span>
                    <span>Waypoint navigation</span>
                </div>
            </template>

            <details class="hero-howto">
                <summary>How to use</summary>
                <p>Our awesome Community Manager <strong>Andrew</strong> made this video of the old Mystic Mirror
                    extension in
                    action. <a
                        href="//www.reddit.com/r/OwlbearRodeo/comments/1904569/this_has_been_a_long_time_coming_a_video_setup/"
                        target="_blank" rel="noopener noreferrer">Watch it here</a>.</p>
                <ol>
                    <li>
                        In <strong>Presentation</strong> panel and enter your room URL, then
                        click <strong>Present</strong> to open the room on the second screen.
                    </li>
                    <li>
                        In <strong>Screen Control</strong>, set the physical size of your display so
                        the scale overlay lines up correctly. You can also right-click any map object
                        and choose <em>Resize to Screen size</em> to match it exactly.
                    </li>
                    <li>
                        Right-click any map object and choose <em>Add Waypoint</em> to save it as a
                        named view. Click a waypoint in the list to jump the screen to that position.
                    </li>
                    <li>
                        Right-click any map object and choose <em>Focus Item</em> to focus the second screen on that
                        object. This is
                        especially useful for teleportation effects or just scene transitions.
                    </li>
                    <li>
                        Use the <strong>Following</strong> toggle to have the second screen mirror
                        your viewport in real time. Hit <strong>Refresh</strong> to re-sync the
                        position if it drifts.
                    </li>
                    <li>
                        Select a player from the <strong>Players</strong> list to lock that player's perspective to the
                        second screen instead.
                    </li>
                </ol>
            </details>
            <div class="hero-github">
                <a href="https://github.com/anders-lassen/OBR-presentor" target="_blank" rel="noopener noreferrer">
                    <svg class="github-icon" viewBox="0 0 16 16" aria-hidden="true" fill="currentColor"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82a7.66 7.66 0 0 1 2-.27c.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8z"/></svg>
                </a>
            </div>
            <hr>
        </section>

        <section class="control-panel" v-if="ready">
            <GmView v-if="store.role === 'GM'" />
            <PlayerView v-else />
        </section>
        <section v-else>
            <p>Loading...</p>
        </section>
    </main>
</template>

<style scoped>
.hero-title-row {
    display: flex;
    align-items: center;
    gap: 8px;
}

.hero-title-row h1 {
    margin: 0;
}

.hide-toggle {
    font-size: 12px;
    color: var(--text-muted);
    cursor: pointer;
    user-select: none;
    line-height: 1;
    transition: color 150ms ease;
    margin-top: 8px;
}

.hide-toggle:hover {
    color: var(--accent);
}

.toggle-icon {
    font-size: 11px;
    transition: transform 150ms ease;
}

.hero-howto {
    margin: 12px 0;
    font-size: 12px;
    color: var(--text-secondary);
}

.hero-howto summary {
    cursor: pointer;
    font-size: 12.5px;
    font-weight: 600;
    color: var(--text-muted);
    margin-bottom: 6px;
}

.hero-howto ol {
    margin: 6px 0 0;
    padding-left: 18px;
    display: flex;
    flex-direction: column;
    gap: 5px;
}

.hero-howto li {
    line-height: 1.55;
}

.hero-howto a {
    color: var(--accent);
    text-decoration: underline;
}

.hero-panel p {
    margin: 10px 0 0;
    color: var(--text-secondary);
    font-size: 13.5px;
    line-height: 1.6;
}

.hero-meta {
    margin-top: 18px;
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
}

.hero-meta span {
    font-size: 11.5px;
    font-weight: 500;
    color: var(--accent);
    border: 1px solid var(--accent-dim);
    border-radius: 999px;
    padding: 4px 12px;
    background: rgba(192, 132, 252, 0.1);
}

.hero-github {
    margin-top: 12px;
    font-size: 15px;
    position: absolute;
    top: 6px;
    right: 12px;
}

.hero-github a {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    color: var(--text-muted);
    text-decoration: none;
    transition: color 150ms ease;
}

.hero-github a:hover {
    color: var(--accent);
}

.github-icon {
    width: 18px;
    height: 18px;
    flex-shrink: 0;
}
</style>
