<script setup lang="ts">
import { ref } from 'vue'
import OBR from '@owlbear-rodeo/sdk'

function switchToV1() {
    localStorage.setItem('obr-version', 'v1')
    location.reload()
}
import { store } from './composables/useStore'
import { useObrMeta } from './composables/useObrMeta'
import GmView from './components/GmView.vue'
import PlayerView from './components/PlayerView.vue'

const ready = ref(false)
const { getRoomMeta } = useObrMeta()

OBR.onReady(async () => {
    await getRoomMeta()
    store.role = (await OBR.player.getRole()) as 'GM' | 'PLAYER'

    OBR.room.onMetadataChange(async () => {
        await getRoomMeta()
    })

    ready.value = true
})
</script>

<template>

    <main class="app-shell" aria-live="polite">
        <a href="#" class="version-switch-link" title="Switch to Version 1 (legacy)" @click.prevent="switchToV1">I want
            to
            switch to Version 1</a>
        <section class="hero-panel">
            <div class="hero-eyebrow">Owlbear Rodeo Extension</div>
            <h1>Mystic Mirror</h1>
            <p>
                Broadcast your table view to a dedicated screen by binding the viewport to a
                selected waypoint object.
            </p>
            <div class="hero-meta">
                <span>Live room metadata sync</span>
                <span>Player-aware controls</span>
            </div>
        </section>

        <section class="control-panel" v-if="ready">
            <div class="panel-header">
                <h2>Session Controls</h2>
                <p>Pick a presenter, size a screen, and navigate via waypoints.</p>
            </div>
            <GmView v-if="store.role === 'GM'" />
            <PlayerView v-else />
        </section>
    </main>
</template>

<style scoped>
.version-switch-link {
    font-size: 12px;
    text-align: center;
    padding-top: 1rem;
    width: 100%;
    color: var(--text-muted);
    text-decoration: none;
    opacity: 0.5;
    z-index: 9999;
    transition: opacity 0.2s;
}

.version-switch-link:hover {
    opacity: 1;
    color: var(--accent);
}
</style>
