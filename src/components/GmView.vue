<script setup lang="ts">
import { onMounted } from 'vue'
import OBR from '@owlbear-rodeo/sdk'
import PresentationPanel from './PresentationPanel.vue'
import PlayerList from './PlayerList.vue'
import ScreenControl from './ScreenControl.vue'
import WaypointList from './SceneList.vue'
import { useObrMeta } from '../composables/useObrMeta'
import { useGmItemWatcher } from '../composables/useGmItemWatcher'
import { useResize } from '../composables/useResize'

const { getRoomMeta } = useObrMeta()
const { handleGmItems } = useGmItemWatcher()
const { onMousedown, onMousemove, onMouseup } = useResize()

onMounted(() => {
    OBR.scene.items.onChange(async (items) => {
        await handleGmItems(items as any[])
    })
})

async function clearMeta() {
    if (!confirm('Are you sure you want to clear all metadata?')) return
    await OBR.room.setMetadata({ 'dk.planeshifter.scrying': {} })
    await getRoomMeta()
    setTimeout(() => location.reload(), 500)
}

const isDev = location.toString().includes('localhost')
</script>

<template>
    <div
        id="container"
        @mousemove="onMousemove"
        @mouseup="onMouseup"
    >
        <PresentationPanel />
        <PlayerList />
        <ScreenControl />
        <WaypointList />
        <button class="red" @click="clearMeta">Clear Meta</button>
        <template v-if="isDev">
            <br /><br /><br />
            <button @click="() => { debugger }" class="outlined">debug</button>
        </template>
        <div id="leftbar" @mousedown="onMousedown">
            <span id="resize">⠇</span>
        </div>
    </div>
</template>
