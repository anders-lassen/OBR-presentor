<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import OBR from '@owlbear-rodeo/sdk'
import { store } from '../composables/useStore'
import { useObrMeta } from '../composables/useObrMeta'
import type { Waypoint } from '../types'

const { setRoomMeta } = useObrMeta()
const editMode = ref(false)

const waypoints = computed<Waypoint[]>(() => store.meta.waypoints ?? [])

async function toggleEdit() {
    editMode.value = !editMode.value
    if (!editMode.value) {
        await setRoomMeta({ waypoints: store.meta.waypoints })
    }
}

async function selectWaypoint(waypoint: Waypoint) {
    if (editMode.value) return
    await setRoomMeta({ screen_el: waypoint._, screen_waypoint_id: waypoint.id })
    await OBR.notification.show('Waypoint selected', 'SUCCESS')
}

async function clearWaypoints() {
    if (!confirm('Are you sure you want to clear all waypoints?')) return
    store.meta.waypoints = []
    await setRoomMeta({ waypoints: [] })
}

function updateWaypointName(waypoint: Waypoint, event: Event) {
    waypoint.name = (event.target as HTMLElement).textContent ?? ''
}

onMounted(async () => {
    if (!store.meta.waypoints) store.meta.waypoints = []

    await OBR.contextMenu.create({
        id: 'dk.planeshifter.waypointAdd',
        icons: [{ icon: '/scene-add.svg', label: 'Add Waypoint', filter: {} }],
        async onClick(_: any) {
            if (!store.meta.waypoints) store.meta.waypoints = []
            store.meta.waypoints.push({ id: _.items[0].id, name: _.items[0].name, _ })
            await setRoomMeta({ waypoints: store.meta.waypoints })
            await OBR.notification.show('Waypoint added', 'SUCCESS')
        },
    })
})
</script>

<template>
    <div id="scene_control">
        <h3>Waypoints</h3>
        <div class="scene_wrap">
            <details class="help">
                <summary>Help</summary>
                <p>Waypoints let you save named positions on the map and jump the presentation screen to them with a single click.</p>
                <ul>
                    <li>Right-click any map object and choose <em>Add Waypoint</em> to save it.</li>
                    <li>Click a waypoint button to move the screen to that position.</li>
                    <li>Use <strong>Edit waypoints</strong> to rename waypoints inline.</li>
                </ul>
            </details>
            <div id="scenelist">
                <p v-if="!waypoints.length">Right-click an object and choose 'Add Waypoint'</p>
                <button
                    v-for="waypoint in waypoints"
                    :key="waypoint.id"
                    :class="{ isActiveWaypoint: store.meta?.screen_waypoint_id === waypoint.id, outlined: true }"
                    :disabled="editMode"
                    @click="selectWaypoint(waypoint)"
                >
                    <span
                        :contenteditable="editMode"
                        @blur="updateWaypointName(waypoint, $event)"
                        @keydown.enter.prevent="($event.target as HTMLElement).blur()"
                    >{{ waypoint.name }}</span>
                </button>
            </div>
            <button @click="toggleEdit">{{ editMode ? '🔓 Edit waypoints' : '🔒 Edit waypoints' }}</button>
            <button class="outlined dimmedBtn" @click="clearWaypoints">Clear</button>
            <hr />
        </div>
    </div>
</template>

<style scoped>
span[contenteditable=true] {
    border-bottom: 1px dashed rgba(187, 153, 255, 0.9);
    padding-bottom: 1px;
}

[data-theme="light"] span[contenteditable=true] {
    border-bottom-color: rgba(109, 40, 217, 0.7);
}

button.isActiveWaypoint::before {
    content: "📍 ";
}

button.outlined.isActiveWaypoint {
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
