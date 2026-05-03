<script setup lang="ts">
import OBR, { isShape } from '@owlbear-rodeo/sdk'
import { useObrMeta } from './composables/useObrMeta'

const { setRoomMeta, getRoomMeta } = useObrMeta()

OBR.onReady(async () => {
    await getRoomMeta()
    const applyTheme = (theme: { mode: string }) => {
        document.documentElement.dataset.theme = theme.mode === 'LIGHT' ? 'light' : 'dark'
    }
    applyTheme(await OBR.theme.getTheme())
    OBR.theme.onChange(applyTheme)
})

async function setShapeAsTracker() {
    const selected = await OBR.player.getSelection()
    if (!selected?.length) {
        await OBR.notification.show('Select one shape first.', 'ERROR')
        return
    }

    const selectedItems = await OBR.scene.items.getItems(selected)
    const shapes = selectedItems.filter(isShape)
    if (!shapes.length) {
        await OBR.notification.show('Selection must include at least one shape.', 'ERROR')
        return
    }

    const firstShape = shapes[0]
    const bounds = await OBR.scene.items.getItemBounds([firstShape.id])

    await setRoomMeta({
        screen_el: {
            id: firstShape.id,
            items: shapes as any[],
            selectionBounds: bounds,
            player_moved: false,
        },
    })

    await OBR.notification.show('Screen follow shape updated.', 'SUCCESS')
}
</script>

<template>
    <main id="app">
        <button id="shapeToTrack" @click="setShapeAsTracker">
            Set Selected Shape As Screen Tracker
        </button>
    </main>
</template>
