<script setup lang="ts">
import { computed } from 'vue'
import OBR from '@owlbear-rodeo/sdk'
import { store } from '../composables/useStore'
import { useObrMeta } from '../composables/useObrMeta'
import { useScreenControl } from '../composables/useScreenControl'

const { setRoomMeta } = useObrMeta()
const { updateCurrSelectedScreenEl } = useScreenControl()

const hasScreenEl = computed(() => (store.meta?.screen_el?.items?.length ?? 0) > 0)
const screenElLabel = computed(() => {
    const el = store.meta?.screen_el
    if (!el) return null
    if (el.id === 'viewport-sync') return 'GM viewport'
    const names = el.items.map((i: any) => i.name).filter(Boolean)
    return names.length ? names.join(', ') : el.id
})

async function refreshPos() {
    await setRoomMeta({ refresh: Math.random() })
    await updateCurrSelectedScreenEl()
}

async function syncCurrentView() {
    const [position, scale, width, height] = await Promise.all([
        OBR.viewport.getPosition(),
        OBR.viewport.getScale(),
        OBR.viewport.getWidth(),
        OBR.viewport.getHeight(),
    ])
    const minX = -position.x / scale
    const minY = -position.y / scale
    const maxX = (width - position.x) / scale
    const maxY = (height - position.y) / scale
    const bounds = {
        min: { x: minX, y: minY },
        max: { x: maxX, y: maxY },
        center: { x: (minX + maxX) / 2, y: (minY + maxY) / 2 },
        width: maxX - minX,
        height: maxY - minY,
    }
    await setRoomMeta({
        screen_el: { id: 'viewport-sync', items: [], selectionBounds: bounds, player_moved: false },
        refresh: Math.random(),
    })
    await OBR.notification.show('View synced to all players', 'SUCCESS')
}
</script>

<template>
    <h3>Current selection</h3>
    <span v-if="screenElLabel" class="screen-el-label">📌 {{ screenElLabel }}</span>
    <button v-if="hasScreenEl" id="refresh_pos" @click="refreshPos">🔄 Resync position</button>
    <p></p>
    <button id="sync_view" @click="syncCurrentView">🧙 Sync GM view</button>
    <hr>
</template>

<style scoped>
.screen-el-label {
    font-size: 0.85em;
    opacity: 0.75;
    display: block;
    margin-bottom: 4px;
}
</style>
