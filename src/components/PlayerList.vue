<script setup lang="ts">
import { computed, onMounted } from 'vue'
import OBR from '@owlbear-rodeo/sdk'
import { store } from '../composables/useStore'
import { useObrMeta } from '../composables/useObrMeta'

const { setRoomMeta } = useObrMeta()

onMounted(async () => {
    store.players = (await OBR.party.getPlayers()) as any

    OBR.party.onChange((party) => {
        store.players = party as any
    })

    OBR.action.onOpenChange(() => {
        console.log('open changed')
    })
})

const sortedPlayers = computed(() =>
    [...store.players]
        .filter((p) => p.role === 'PLAYER')
        .sort((a, b) => a.name.localeCompare(b.name))
)

async function selectPlayer(id: string) {
    await setRoomMeta({ screen_id: id })
    await OBR.notification.show(
        'Screen user successfully added. Updates will now be exclusive to this player.',
        'SUCCESS'
    )
}

async function clearScreenUser() {
    await setRoomMeta({ screen_id: 0 })
    await OBR.notification.show('Screen user cleared!', 'ERROR')
}
</script>

<template>
    <div id="playerlist_cont">
        <h3>Players:</h3>
        <div id="playerlist">
            <button
                v-for="p in sortedPlayers"
                :key="p.id"
                :class="{ isScreen: store.meta.screen_id == p.id, outlined: true }"
                :style="{ color: p.color, borderColor: p.color }"
                @click="selectPlayer(p.id)"
            >
                {{ p.name }}
            </button>
        </div>
        <button class="red" @click="clearScreenUser">Clear</button>
        <hr />
    </div>
</template>
