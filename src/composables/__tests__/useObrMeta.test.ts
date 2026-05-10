import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useObrMeta } from '../useObrMeta'
import { store } from '../useStore'

// Mock the OBR SDK
vi.mock('@owlbear-rodeo/sdk', () => ({
    default: {
        room: {
            getMetadata: vi.fn(),
            setMetadata: vi.fn(),
        },
    },
}))

import OBR from '@owlbear-rodeo/sdk'

const META_KEY = 'dk.planeshifter.scrying'

describe('useObrMeta', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        store.meta = {}
    })

    describe('getRoomMeta', () => {
        it('returns empty meta when no data in room', async () => {
            vi.mocked(OBR.room.getMetadata).mockResolvedValue({})
            const { getRoomMeta } = useObrMeta()
            const result = await getRoomMeta()
            expect(result).toEqual({})
        })

        it('reads and stores meta from room', async () => {
            const fakeMeta = { screen_id: 'player-1', screen_follow: true }
            vi.mocked(OBR.room.getMetadata).mockResolvedValue({ [META_KEY]: fakeMeta })
            const { getRoomMeta } = useObrMeta()
            const result = await getRoomMeta()
            expect(result).toEqual(fakeMeta)
            expect(store.meta).toEqual(fakeMeta)
        })

        it('migrates legacy "scenes" key to "waypoints"', async () => {
            const scenes = [{ id: 'wp-1', name: 'Scene 1', _: null }]
            const legacyMeta = { scenes: [...scenes] }
            vi.mocked(OBR.room.getMetadata).mockResolvedValue({ [META_KEY]: legacyMeta })
            const { getRoomMeta } = useObrMeta()
            const result = await getRoomMeta()
            expect(result.waypoints).toEqual(scenes)
            expect(result.scenes).toBeUndefined()
        })

        it('does not overwrite existing "waypoints" with legacy "scenes"', async () => {
            const metaWithBoth = {
                waypoints: [{ id: 'wp-new', name: 'New', _: null }],
                scenes: [{ id: 'wp-old', name: 'Old', _: null }],
            }
            vi.mocked(OBR.room.getMetadata).mockResolvedValue({ [META_KEY]: metaWithBoth })
            const { getRoomMeta } = useObrMeta()
            const result = await getRoomMeta()
            expect(result.waypoints).toEqual(metaWithBoth.waypoints)
        })

        it('migrates legacy "screen_scene_id" key to "screen_waypoint_id"', async () => {
            const legacyMeta = { screen_scene_id: 'scene-42' }
            vi.mocked(OBR.room.getMetadata).mockResolvedValue({ [META_KEY]: legacyMeta })
            const { getRoomMeta } = useObrMeta()
            const result = await getRoomMeta()
            expect(result.screen_waypoint_id).toBe('scene-42')
            expect(result.screen_scene_id).toBeUndefined()
        })

        it('does not overwrite existing "screen_waypoint_id" with legacy key', async () => {
            const meta = { screen_waypoint_id: 'wp-10', screen_scene_id: 'old-scene' }
            vi.mocked(OBR.room.getMetadata).mockResolvedValue({ [META_KEY]: meta })
            const { getRoomMeta } = useObrMeta()
            const result = await getRoomMeta()
            expect(result.screen_waypoint_id).toBe('wp-10')
        })
    })

    describe('setRoomMeta', () => {
        it('merges update with existing store meta and writes to room', async () => {
            store.meta = { screen_id: 'player-1', screen_follow: false }
            vi.mocked(OBR.room.getMetadata).mockResolvedValue({
                [META_KEY]: { screen_id: 'player-1', screen_follow: true },
            })
            vi.mocked(OBR.room.setMetadata).mockResolvedValue(undefined)

            const { setRoomMeta } = useObrMeta()
            await setRoomMeta({ screen_follow: true })

            expect(OBR.room.setMetadata).toHaveBeenCalledWith({
                [META_KEY]: { screen_id: 'player-1', screen_follow: true },
            })
        })

        it('returns the updated meta after setting', async () => {
            store.meta = { screen_id: 'player-1' }
            const updatedMeta = { screen_id: 'player-2' }
            vi.mocked(OBR.room.getMetadata).mockResolvedValue({ [META_KEY]: updatedMeta })
            vi.mocked(OBR.room.setMetadata).mockResolvedValue(undefined)

            const { setRoomMeta } = useObrMeta()
            const result = await setRoomMeta({ screen_id: 'player-2' })

            expect(result.screen_id).toBe('player-2')
        })
    })
})
