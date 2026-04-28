<script setup lang="ts">
import { watch, onMounted } from 'vue'
import OBR from '@owlbear-rodeo/sdk'
import { store } from '../composables/useStore'
import { useScreenControl } from '../composables/useScreenControl'

const { updatePos } = useScreenControl()

onMounted(async () => {
    if (await OBR.action.isOpen()) {
        await OBR.action.setHeight(1)
        await OBR.action.setWidth(1)
        document.body.style.minWidth = 'unset'
    }
    await updatePos()
})

watch(
    () => store.meta,
    async () => {
        await updatePos()
    },
    { deep: true }
)
</script>

<template>
    <div id="playerScreen">
        <img id="logo" style="width: 30vw" src="/crystal-ball-white.png" alt="Mystic Mirror" />
    </div>
</template>
