export interface ScreenEl {
    id: string
    items: any[]
    selectionBounds: any
    player_moved?: boolean
}

export interface Waypoint {
    id: string
    name: string
    _: any
}

export interface ScreenSize {
    width: string | number
    height: string | number
}

export interface RoomMeta {
    screen_id?: string | number
    screen_size?: ScreenSize
    screen_el?: ScreenEl
    screen_waypoint_id?: string
    screen_follow?: boolean
    screen_waypoint_follow?: boolean
    screen_waypoint_follow_gm?: boolean
    presUrl?: string
    presId?: string | null
    waypoints?: Waypoint[]
    refresh?: number
    // Legacy keys (v1.2 and earlier) — migrated on read
    scenes?: Waypoint[]
    screen_scene_id?: string
}

export interface ObrPlayer {
    id: string
    name: string
    color: string
    role: 'GM' | 'PLAYER'
    lastModifiedUserId?: string
}
