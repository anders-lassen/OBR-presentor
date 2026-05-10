<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import OBR from '@owlbear-rodeo/sdk'
import { store } from '../composables/useStore'
import { useObrMeta } from '../composables/useObrMeta'
import type { Waypoint } from '../types'
import { useGmItemWatcher } from '../composables/useGmItemWatcher'

const { setRoomMeta } = useObrMeta()
const { handleGmItems } = useGmItemWatcher()

const editMode = ref(false)

const waypoints = computed<Waypoint[]>(() => store.meta.waypoints ?? [])
const activeWaypointId = computed(() => store.meta.screen_waypoint_id)
const waypointFollow = computed(() => store.meta.screen_waypoint_follow ?? false)
const waypointFollowGm = computed(() => store.meta.screen_waypoint_follow_gm ?? false)

async function toggleWaypointFollowGm() {
    const newVal = !waypointFollowGm.value
    await setRoomMeta({ screen_waypoint_follow_gm: newVal })
    if (newVal && activeWaypointId.value) {
        const activeWaypoint = waypoints.value.find(w => w.id === activeWaypointId.value)
        if (activeWaypoint?._) {
            await handleGmItems([activeWaypoint._] as any[])
        }
    }
}

async function toggleWaypointFollow() {
    const newVal = !waypointFollow.value
    if (newVal && activeWaypointId.value) {
        const activeWaypoint = waypoints.value.find(w => w.id === activeWaypointId.value)
        if (activeWaypoint) {
            const freshBounds = await OBR.scene.items.getItemBounds([activeWaypoint.id])
            await setRoomMeta({
                screen_el: { ...activeWaypoint._, selectionBounds: freshBounds ?? activeWaypoint._?.selectionBounds },
                screen_waypoint_follow: true,
            })
            return
        }
    }
    await setRoomMeta({ screen_waypoint_follow: newVal })
}

// Turn off waypoint follow when no waypoint is active
watch(activeWaypointId, async (id) => {
    if (!id && waypointFollow.value) {
        await setRoomMeta({ screen_waypoint_follow: false, screen_waypoint_follow_gm: false })
    }
})

async function toggleEdit() {
    editMode.value = !editMode.value
    if (!editMode.value) {
        await setRoomMeta({ waypoints: store.meta.waypoints })
    }
}

async function selectWaypoint(waypoint: Waypoint, event?: MouseEvent) {
    if (editMode.value) {
        const span = (event?.currentTarget as HTMLElement)?.querySelector('span[contenteditable]') as HTMLElement
        span?.focus()
        return
    }
    if (store.meta?.screen_waypoint_id === waypoint.id) {
        await setRoomMeta({ screen_waypoint_id: undefined, screen_waypoint_follow: false, screen_waypoint_follow_gm: false })
        await OBR.notification.show('Waypoint deselected', 'DEFAULT')
    } else {
        const freshBounds = await OBR.scene.items.getItemBounds([waypoint.id])
        const screenEl = {
            ...waypoint._,
            selectionBounds: freshBounds ?? waypoint._?.selectionBounds,
        }
        await setRoomMeta({ screen_el: screenEl, screen_waypoint_id: waypoint.id })
        if (waypointFollowGm.value && freshBounds) {
            let gmBounds = JSON.parse(JSON.stringify(freshBounds))
            const _w = Number(store.meta.screen_size?.width ?? 0)
            const _h = Number(store.meta.screen_size?.height ?? 0)
            if (_w > 0 && _h > 0) {
                const dpi = await OBR.scene.grid.getDpi()
                const minWidth = _w * dpi
                const minHeight = _h * dpi
                if (
                    gmBounds.max.x - gmBounds.min.x < minWidth ||
                    gmBounds.max.y - gmBounds.min.y < minHeight
                ) {
                    gmBounds = {
                        ...gmBounds,
                        max: { y: gmBounds.center.y + minHeight / 2, x: gmBounds.center.x + minWidth / 2 },
                        min: { y: gmBounds.center.y - minHeight / 2, x: gmBounds.center.x - minWidth / 2 },
                    }
                }
            }
            await OBR.viewport.animateToBounds(gmBounds)
        }
        await OBR.notification.show('Waypoint selected', 'SUCCESS')
    }
}

async function clearWaypoints() {
    if (!confirm('Are you sure you want to clear all waypoints?')) return
    store.meta.waypoints = []
    await setRoomMeta({ waypoints: [] })
}

function updateWaypointName(waypoint: Waypoint, event: Event) {
    waypoint.name = (event.target as HTMLElement).textContent ?? ''
}

async function deleteWaypoint(waypoint: Waypoint) {
    store.meta.waypoints = store.meta.waypoints?.filter(w => w.id !== waypoint.id) ?? []
    await setRoomMeta({ waypoints: store.meta.waypoints })
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
                <p>Waypoints let you save named positions on the map and jump the presentation screen to them with a
                    single click.</p>
                <ul>
                    <li>Right-click any map object and choose <em>Add Waypoint</em> to save it.</li>
                    <li>Click a waypoint button to move the screen to that position.</li>
                    <li>Use <strong>Edit waypoints</strong> to rename waypoints inline.</li>
                </ul>
            </details>
            <div id="scenelist">
                <p v-if="!waypoints.length">Right-click an object and choose 'Add Waypoint'</p>
                <div v-for="waypoint in waypoints" :key="waypoint.id" class="waypoint-row">
                    <button
                        :class="{ isActiveWaypoint: store.meta?.screen_waypoint_id === waypoint.id, outlined: true }"
                        @click="selectWaypoint(waypoint, $event)">
                        <span :contenteditable="editMode" @blur="updateWaypointName(waypoint, $event)"
                            @keydown.enter.prevent="($event.target as HTMLElement).blur()">{{ waypoint.name }}</span>
                    </button>
                    <button v-if="editMode" class="delete-waypoint" @click="deleteWaypoint(waypoint)" title="Delete waypoint">✕</button>
                </div>
            </div>
            <button @click="toggleEdit">{{ editMode ? '🔓 Edit waypoints' : '🔒 Edit waypoints' }}</button>
            <p></p>
            <button v-if="activeWaypointId" :class="waypointFollow ? 'waypointFollowing' : 'waypointNotFollowing'"
                @click="toggleWaypointFollow">
                {{ waypointFollow ? '👤 Player Following' : '👤 Player Follow' }}
            </button>
            <button v-if="activeWaypointId" :class="waypointFollowGm ? 'waypointFollowing' : 'waypointNotFollowing'"
                @click="toggleWaypointFollowGm">
                {{ waypointFollowGm ? '🧙 GM following' : '🧙 GM follow' }}
            </button>
            <p></p>
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

button.waypointFollowing {
    background-color: var(--ok);
    border: none;
    color: #ffffff;
}

button.waypointFollowing:hover {
    background-color: #16a34a;
}

button.waypointNotFollowing {
    background-color: var(--surface-2, #444);
    border: none;
    color: var(--text-secondary);
}

.waypoint-row {
    display: flex;
    align-items: center;
    gap: 4px;
}

.waypoint-row button:first-child {
    flex-grow: 1;
}

button.delete-waypoint {
    flex-shrink: 0;
    background: transparent;
    border: 1px solid rgba(200, 80, 80, 0.5);
    color: rgba(200, 80, 80, 0.8);
    width: fit-content;
    min-width: 24px;
}

button.delete-waypoint:hover {
    background-color: rgba(200, 80, 80, 0.15);
}
</style>
