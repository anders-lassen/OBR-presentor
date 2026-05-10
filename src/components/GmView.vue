<script setup lang="ts">
import { onMounted } from 'vue'
import OBR from '@owlbear-rodeo/sdk'
import PresentationPanel from './PresentationPanel.vue'
import PlayerList from './PlayerList.vue'
import ScreenControl from './ScreenControl.vue'
import FollowControl from './FollowControl.vue'
import WaypointList from './SceneList.vue'
import { useObrMeta } from '../composables/useObrMeta'
import { useGmItemWatcher } from '../composables/useGmItemWatcher'
import { useResize } from '../composables/useResize'
import ScreenElControl from './ScreenElControl.vue'

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
        <ScreenControl />
        <PlayerList />
        <FollowControl /> 
        <ScreenElControl />

        <WaypointList />
        <button class="red" @click="clearMeta">Clear Meta</button>
        <template v-if="isDev">
            <br /><br /><br />
            <button @click="() => { debugger }" class="outlined">debug</button>
        </template>
        <div id="leftbar" @mousedown="onMousedown">
            <span id="resize">↔</span>
        </div>
    </div>
</template>

<style scoped>
div#leftbar {
    position: fixed;
    top: 0;
    right: 0;
    cursor: col-resize;
    z-index: 999999;
    height: 100vh;
    padding: 50vh 0;
    user-select: none;
}

div#leftbar span#resize {
    font-weight: 700;
    font-size: 19px;
    color: rgba(187, 153, 255, 0.8);
}

[data-theme="light"] div#leftbar span#resize {
    color: rgba(109, 40, 217, 0.65);
}
</style>
