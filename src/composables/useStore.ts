import { reactive } from 'vue'
import type { RoomMeta, ObrPlayer } from '../types'

interface AppStore {
    players: ObrPlayer[]
    meta: RoomMeta
    role: 'GM' | 'PLAYER' | null
}

export const store = reactive<AppStore>({
    players: [],
    meta: {},
    role: null,
})
