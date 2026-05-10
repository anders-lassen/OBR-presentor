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

const allPlayersActive = computed(() => !store.meta.screen_id)

async function selectPlayer(id: string) {
    await setRoomMeta({ screen_id: id })
    await OBR.notification.show(
        'Screen user successfully added. Updates will now be exclusive to this player.',
        'SUCCESS'
    )
}

async function toggleAllPlayers() {
    if (allPlayersActive.value) {
        await setRoomMeta({ screen_id: 'none' })
        await OBR.notification.show('No players will be updated.', 'WARNING')
    } else {
        await setRoomMeta({ screen_id: 0 })
        await OBR.notification.show('All players are now the screen target.', 'SUCCESS')
    }
}
async function selectAllPlayers() {
    await setRoomMeta({ screen_id: 0 })
    await OBR.notification.show('All players are now the screen target.', 'SUCCESS')
}
async function selectNoPlayers() {
    await setRoomMeta({ screen_id: 'none' })
    await OBR.notification.show('No players will be updated.', 'WARNING')
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
                <li>When <strong>All Players</strong> is active, all players are considered the screen target. Click it
                    again to deselect and pause updates for all players.</li>
                <li>The player will follow the active map object.</li>
                <li>
                    Turn on Follow to automatically sync to the currently selected screen element. Turn it off to stop
                    syncing. Re-sync happens automatically when Follow is enabled, or the screen element changes.
                </li>
            </ul>
        </details>
        <div id="playerlist">
            <p v-if="store.meta.screen_id === 'none'" class="no-target-hint">⚠ No players will be updated</p>
            <div class="generic-selection">
                <button :class="{ isScreen: store.meta.screen_id === 0, outlined: true, allPlayersBtn: true }"
                    @click="selectAllPlayers">
                    👥 All Players
                </button>
                <button :class="{ isScreen: store.meta.screen_id === 'none', outlined: true, allPlayersBtn: true }"
                    @click="selectNoPlayers">
                    🚫 No Players
                </button>
            </div>
            <button v-for="p in sortedPlayers" :key="p.id"
                :class="{ isScreen: store.meta.screen_id == p.id, outlined: true }"
                :style="{ color: p.color, borderColor: p.color }" @click="selectPlayer(p.id)">
                {{ p.name }}
            </button>
        </div>
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

button.allPlayersBtn.isScreen::before {
    content: "";
}

button.outlined.isScreen {
    background-color: var(--btn-active-bg);
    border-color: var(--accent);
    color: var(--btn-active-color);
}

button.allPlayersBtn {
    border-color: var(--accent);
    margin-bottom: 6px;
}

button.allPlayersBtn:not(.isScreen) {
    opacity: 0.6;
}

.no-target-hint {
    font-size: 11.5px;
    color: var(--danger, #dc2626);
    margin: 4px 0 6px;
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

.generic-selection {
    display: flex;
    gap: 8px;
    margin-bottom: 8px;
}
</style>
