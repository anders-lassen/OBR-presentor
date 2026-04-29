import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useGmItemWatcher } from '../useGmItemWatcher'
import { store } from '../useStore'

vi.mock('@owlbear-rodeo/sdk', () => ({
    default: {
        scene: {
            isReady: vi.fn(),
            items: {
                getItemBounds: vi.fn(),
            },
        },
        room: {
            getMetadata: vi.fn(),
            setMetadata: vi.fn(),
        },
    },
}))

import OBR from '@owlbear-rodeo/sdk'

const META_KEY = 'dk.planeshifter.scrying'

function makeBounds(x: number, y: number) {
    return { min: { x, y }, max: { x: x + 100, y: y + 100 }, center: { x: x + 50, y: y + 50 }, width: 100, height: 100 }
}

describe('useGmItemWatcher', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        store.meta = {}
        store.players = []
    })

    describe('handleGmItems – early returns', () => {
        it('does nothing when scene is not ready', async () => {
            vi.mocked(OBR.scene.isReady).mockResolvedValue(false)
            store.meta = { screen_follow: true, screen_el: { id: 'el-1', items: [{ id: 'el-1', position: { x: 0, y: 0 } }], selectionBounds: null } }

            const { handleGmItems } = useGmItemWatcher()
            await handleGmItems([{ id: 'el-1', position: { x: 10, y: 10 }, lastModifiedUserId: 'u1' }])

            expect(OBR.room.setMetadata).not.toHaveBeenCalled()
        })

        it('does nothing when screen_follow is false', async () => {
            vi.mocked(OBR.scene.isReady).mockResolvedValue(true)
            store.meta = { screen_follow: false, screen_el: { id: 'el-1', items: [{ id: 'el-1' }], selectionBounds: null } }

            const { handleGmItems } = useGmItemWatcher()
            await handleGmItems([{ id: 'el-1', lastModifiedUserId: 'u1' }])

            expect(OBR.room.setMetadata).not.toHaveBeenCalled()
        })

        it('does nothing when screen_el has no items', async () => {
            vi.mocked(OBR.scene.isReady).mockResolvedValue(true)
            store.meta = { screen_follow: true, screen_el: { id: 'el-1', items: [], selectionBounds: null } }

            const { handleGmItems } = useGmItemWatcher()
            await handleGmItems([{ id: 'el-1', lastModifiedUserId: 'u1' }])

            expect(OBR.room.setMetadata).not.toHaveBeenCalled()
        })

        it('does nothing when the incoming item list has no matching screen item', async () => {
            vi.mocked(OBR.scene.isReady).mockResolvedValue(true)
            store.meta = {
                screen_follow: true,
                screen_el: { id: 'el-1', items: [{ id: 'el-1' }], selectionBounds: null },
            }

            const { handleGmItems } = useGmItemWatcher()
            await handleGmItems([{ id: 'other', lastModifiedUserId: 'u1' }])

            expect(OBR.room.setMetadata).not.toHaveBeenCalled()
        })
    })

    describe('handleGmItems – player moved', () => {
        it('sets player_moved flag when the modifier is a PLAYER', async () => {
            vi.mocked(OBR.scene.isReady).mockResolvedValue(true)
            store.players = [{ id: 'u1', name: 'Bob', color: '#fff', role: 'PLAYER' }]
            store.meta = {
                screen_follow: true,
                screen_el: { id: 'el-1', items: [{ id: 'el-1', position: { x: 0, y: 0 } }], selectionBounds: null },
            }
            const updatedMeta = { ...store.meta, screen_el: { ...store.meta.screen_el!, player_moved: true, selectionBounds: false } }
            vi.mocked(OBR.room.getMetadata).mockResolvedValue({ [META_KEY]: updatedMeta })
            vi.mocked(OBR.room.setMetadata).mockResolvedValue(undefined)

            const { handleGmItems } = useGmItemWatcher()
            await handleGmItems([{ id: 'el-1', position: { x: 10, y: 10 }, lastModifiedUserId: 'u1' }])

            expect(OBR.room.setMetadata).toHaveBeenCalledWith(
                expect.objectContaining({
                    [META_KEY]: expect.objectContaining({ screen_el: expect.objectContaining({ player_moved: true }) }),
                })
            )
        })
    })

    describe('handleGmItems – GM moved with position change', () => {
        it('updates selectionBounds when a GM changes the item position', async () => {
            vi.mocked(OBR.scene.isReady).mockResolvedValue(true)
            store.players = [{ id: 'gm1', name: 'GM', color: '#000', role: 'GM' }]
            const oldItem = { id: 'el-1', position: { x: 0, y: 0 } }
            store.meta = {
                screen_follow: true,
                screen_el: { id: 'el-1', items: [oldItem], selectionBounds: null },
            }
            const newBounds = makeBounds(50, 50)
            vi.mocked(OBR.scene.items.getItemBounds).mockResolvedValue(newBounds as any)
            const updatedMeta = { ...store.meta, screen_el: { ...store.meta.screen_el!, selectionBounds: newBounds, player_moved: false } }
            vi.mocked(OBR.room.getMetadata).mockResolvedValue({ [META_KEY]: updatedMeta })
            vi.mocked(OBR.room.setMetadata).mockResolvedValue(undefined)

            const { handleGmItems } = useGmItemWatcher()
            // Position changed from {x:0,y:0} → {x:50,y:50}
            await handleGmItems([{ id: 'el-1', position: { x: 50, y: 50 }, lastModifiedUserId: 'gm1' }])

            expect(OBR.scene.items.getItemBounds).toHaveBeenCalledWith(['el-1'])
            expect(OBR.room.setMetadata).toHaveBeenCalledWith(
                expect.objectContaining({
                    [META_KEY]: expect.objectContaining({
                        screen_el: expect.objectContaining({ selectionBounds: newBounds }),
                    }),
                })
            )
        })

        it('does not update bounds when old item has no position field', async () => {
            vi.mocked(OBR.scene.isReady).mockResolvedValue(true)
            store.players = [{ id: 'gm1', name: 'GM', color: '#000', role: 'GM' }]
            // Old item stored in meta has no position – getDifference will return {} for position
            const oldItem = { id: 'el-1' }
            store.meta = {
                screen_follow: true,
                screen_el: { id: 'el-1', items: [oldItem], selectionBounds: null },
            }

            const { handleGmItems } = useGmItemWatcher()
            // New item has a position, but since oldItem has none, diff.position === undefined
            await handleGmItems([{ id: 'el-1', position: { x: 10, y: 10 }, lastModifiedUserId: 'gm1' }])

            expect(OBR.scene.items.getItemBounds).not.toHaveBeenCalled()
            expect(OBR.room.setMetadata).not.toHaveBeenCalled()
        })
    })
})
