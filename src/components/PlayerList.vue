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
        <details class="help">
            <summary>Help</summary>
            <p>Lock the presentation screen to a specific player's perspective instead of your own.</p>
            <ul>
                <li>Click a player to set them as the screen target. The 📺 icon marks the active selection.</li>
                <li>If no player is selected, all players will be considered the screen target.</li>
                <li>The player will follow the active map object.</li>
                <li>Click <strong>Clear selection</strong> to clear the screen target.</li>
                <li>
                    Turn on Follow to automatically sync to the currently selected screen element. Turn it off to stop
                    syncing. Re-sync happens automatically when Follow is enabled, or the screen element changes.
                </li>
            </ul>
        </details>
        <div id="playerlist">
            <button v-for="p in sortedPlayers" :key="p.id"
                :class="{ isScreen: store.meta.screen_id == p.id, outlined: true }"
                :style="{ color: p.color, borderColor: p.color }" @click="selectPlayer(p.id)">
                {{ p.name }}
            </button>
        </div>
        <button class="outlined dimmedBtn" @click="clearScreenUser">Clear selection</button>
        <hr />
    </div>
</template>

<style scoped>
#playerlist button {
    display: block;
    text-align: left;
}

button.isScreen::before {
    content: "📺 ";
}

button.outlined.isScreen {
    background-color: var(--btn-active-bg);
    border-color: var(--accent);
    color: var(--btn-active-color);
}

.help {
    font-size: 11.5px;
    color: var(--text-secondary);
    margin-bottom: 10px;
}

.help summary {
    cursor: pointer;
    font-size: 12px;
    font-weight: 600;
    color: var(--text-muted);
}

.help p,
.help li {
    line-height: 1.55;
    margin: 4px 0;
}

.help ul {
    padding-left: 16px;
    margin: 6px 0;
}
</style>
