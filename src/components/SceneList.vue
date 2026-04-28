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
            <button class="red" @click="clearWaypoints">Clear</button>
            <hr />
        </div>
    </div>
</template>
