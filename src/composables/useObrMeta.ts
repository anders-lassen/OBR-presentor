import OBR from '@owlbear-rodeo/sdk'
import { store } from './useStore'
import type { RoomMeta } from '../types'

const META_KEY = 'dk.planeshifter.scrying'

export function useObrMeta() {
    async function getRoomMeta(): Promise<RoomMeta> {
        const raw = await OBR.room.getMetadata()
        const meta: RoomMeta = (raw[META_KEY] as RoomMeta) || {}

        // Migrate legacy keys from v1.2 and earlier
        if (!meta.waypoints && meta.scenes) {
            meta.waypoints = meta.scenes
            delete meta.scenes
        }
        if (!meta.screen_waypoint_id && meta.screen_scene_id) {
            meta.screen_waypoint_id = meta.screen_scene_id
            delete meta.screen_scene_id
        }

        store.meta = meta
        return store.meta
    }

    async function setRoomMeta(update: Partial<RoomMeta>): Promise<RoomMeta> {
        const metadata = JSON.parse(JSON.stringify({ ...store.meta, ...update }))
        await OBR.room.setMetadata({ [META_KEY]: metadata })
        store.meta = await getRoomMeta()
        return store.meta
    }

    return { getRoomMeta, setRoomMeta }
}
