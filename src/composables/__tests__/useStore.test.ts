import { describe, it, expect, beforeEach } from 'vitest'
import { store } from '../useStore'
import type { ObrPlayer, RoomMeta } from '../../types'

describe('useStore', () => {
    beforeEach(() => {
        store.players = []
        store.meta = {}
        store.role = null
    })

    it('starts with empty players, empty meta and null role', () => {
        expect(store.players).toEqual([])
        expect(store.meta).toEqual({})
        expect(store.role).toBeNull()
    })

    it('can assign players', () => {
        const players: ObrPlayer[] = [
            { id: 'p1', name: 'Alice', color: '#f00', role: 'GM' },
            { id: 'p2', name: 'Bob', color: '#0f0', role: 'PLAYER' },
        ]
        store.players = players
        expect(store.players).toHaveLength(2)
        expect(store.players[0].name).toBe('Alice')
    })

    it('can update meta fields', () => {
        const meta: RoomMeta = { screen_id: 'screen-1', screen_follow: true }
        store.meta = meta
        expect(store.meta.screen_id).toBe('screen-1')
        expect(store.meta.screen_follow).toBe(true)
    })

    it('can set role to GM', () => {
        store.role = 'GM'
        expect(store.role).toBe('GM')
    })

    it('can set role to PLAYER', () => {
        store.role = 'PLAYER'
        expect(store.role).toBe('PLAYER')
    })

    it('meta partial update does not clobber unrelated fields', () => {
        store.meta = { screen_id: 'screen-1', screen_follow: true, refresh: 5 }
        store.meta = { ...store.meta, refresh: 10 }
        expect(store.meta.screen_id).toBe('screen-1')
        expect(store.meta.screen_follow).toBe(true)
        expect(store.meta.refresh).toBe(10)
    })
})
