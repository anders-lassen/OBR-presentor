import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useScreenControl } from '../useScreenControl'
import { store } from '../useStore'

vi.mock('@owlbear-rodeo/sdk', () => ({
    default: {
        scene: {
            isReady: vi.fn(),
            items: {
                getItemBounds: vi.fn(),
            },
            grid: {
                getDpi: vi.fn(),
            },
        },
        player: {
            getId: vi.fn(),
        },
        viewport: {
            animateToBounds: vi.fn(),
        },
        room: {
            getMetadata: vi.fn(),
            setMetadata: vi.fn(),
        },
    },
}))

import OBR from '@owlbear-rodeo/sdk'

const META_KEY = 'dk.planeshifter.scrying'

function makeBounds(minX: number, minY: number, maxX: number, maxY: number) {
    return {
        min: { x: minX, y: minY },
        max: { x: maxX, y: maxY },
        center: { x: (minX + maxX) / 2, y: (minY + maxY) / 2 },
        width: maxX - minX,
        height: maxY - minY,
    }
}

describe('useScreenControl', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        store.meta = {}
        store.players = []
    })

    describe('updateCurrSelectedScreenEl', () => {
        it('does nothing when scene is not ready', async () => {
            vi.mocked(OBR.scene.isReady).mockResolvedValue(false)
            store.meta = { screen_el: { id: 'el-1', items: [{ id: 'el-1' }], selectionBounds: null } }

            const { updateCurrSelectedScreenEl } = useScreenControl()
            await updateCurrSelectedScreenEl()

            expect(OBR.scene.items.getItemBounds).not.toHaveBeenCalled()
        })

        it('does nothing when screen_el has no items', async () => {
            vi.mocked(OBR.scene.isReady).mockResolvedValue(true)
            store.meta = { screen_el: { id: 'el-1', items: [], selectionBounds: null } }

            const { updateCurrSelectedScreenEl } = useScreenControl()
            await updateCurrSelectedScreenEl()

            expect(OBR.scene.items.getItemBounds).not.toHaveBeenCalled()
        })

        it('fetches bounds and writes meta when scene is ready and items exist', async () => {
            vi.mocked(OBR.scene.isReady).mockResolvedValue(true)
            const items = [{ id: 'el-1' }, { id: 'el-2' }]
            store.meta = { screen_el: { id: 'el-1', items, selectionBounds: null } }
            const newBounds = makeBounds(0, 0, 200, 200)
            vi.mocked(OBR.scene.items.getItemBounds).mockResolvedValue(newBounds as any)
            vi.mocked(OBR.room.getMetadata).mockResolvedValue({ [META_KEY]: { screen_el: { id: 'el-1', items, selectionBounds: newBounds } } })
            vi.mocked(OBR.room.setMetadata).mockResolvedValue(undefined)

            const { updateCurrSelectedScreenEl } = useScreenControl()
            await updateCurrSelectedScreenEl()

            expect(OBR.scene.items.getItemBounds).toHaveBeenCalledWith(['el-1', 'el-2'])
            expect(OBR.room.setMetadata).toHaveBeenCalledWith(
                expect.objectContaining({
                    [META_KEY]: expect.objectContaining({ screen_el: expect.objectContaining({ selectionBounds: newBounds }) }),
                })
            )
        })
    })

    describe('updatePos', () => {
        it('does nothing when scene is not ready', async () => {
            vi.mocked(OBR.scene.isReady).mockResolvedValue(false)

            const { updatePos } = useScreenControl()
            await updatePos()

            expect(OBR.viewport.animateToBounds).not.toHaveBeenCalled()
        })

        it('does nothing when current player is not the screen player', async () => {
            vi.mocked(OBR.scene.isReady).mockResolvedValue(true)
            store.meta = { screen_id: 'player-screen', screen_el: { id: 'el-1', items: [], selectionBounds: null } }
            vi.mocked(OBR.player.getId).mockResolvedValue('player-other')

            const { updatePos } = useScreenControl()
            await updatePos()

            expect(OBR.viewport.animateToBounds).not.toHaveBeenCalled()
        })

        it('does nothing when screen_el is undefined', async () => {
            vi.mocked(OBR.scene.isReady).mockResolvedValue(true)
            store.meta = { screen_id: 'player-screen' }
            vi.mocked(OBR.player.getId).mockResolvedValue('player-screen')

            const { updatePos } = useScreenControl()
            await updatePos()

            expect(OBR.viewport.animateToBounds).not.toHaveBeenCalled()
        })

        it('does nothing when selectionBounds is falsy and player_moved is false', async () => {
            vi.mocked(OBR.scene.isReady).mockResolvedValue(true)
            store.meta = {
                screen_id: 'player-screen',
                screen_size: { width: 10, height: 8 },
                screen_el: { id: 'el-1', items: [], selectionBounds: null, player_moved: false },
            }
            vi.mocked(OBR.player.getId).mockResolvedValue('player-screen')
            vi.mocked(OBR.scene.grid.getDpi).mockResolvedValue(150)

            const { updatePos } = useScreenControl()
            await updatePos()

            expect(OBR.viewport.animateToBounds).not.toHaveBeenCalled()
        })

        it('animates viewport to selectionBounds when all conditions are met', async () => {
            vi.mocked(OBR.scene.isReady).mockResolvedValue(true)
            const bounds = makeBounds(0, 0, 500, 400)
            store.meta = {
                screen_id: 'player-screen',
                screen_size: { width: 1, height: 1 },
                screen_el: { id: 'el-1', items: [], selectionBounds: bounds, player_moved: false },
            }
            vi.mocked(OBR.player.getId).mockResolvedValue('player-screen')
            vi.mocked(OBR.scene.grid.getDpi).mockResolvedValue(150)
            vi.mocked(OBR.viewport.animateToBounds).mockResolvedValue(undefined)

            const { updatePos } = useScreenControl()
            await updatePos()

            expect(OBR.viewport.animateToBounds).toHaveBeenCalled()
        })

        it('expands bounds to meet minimum screen size requirements', async () => {
            vi.mocked(OBR.scene.isReady).mockResolvedValue(true)
            // screen is 10x8 grid units, DPI = 100 → minimum 1000×800 pixels
            // selectionBounds is only 200×200, so it should be expanded
            const bounds = makeBounds(100, 100, 300, 300)
            store.meta = {
                screen_id: 'player-screen',
                screen_size: { width: 10, height: 8 },
                screen_el: { id: 'el-1', items: [], selectionBounds: bounds, player_moved: false },
            }
            vi.mocked(OBR.player.getId).mockResolvedValue('player-screen')
            vi.mocked(OBR.scene.grid.getDpi).mockResolvedValue(100)
            vi.mocked(OBR.viewport.animateToBounds).mockResolvedValue(undefined)

            const { updatePos } = useScreenControl()
            await updatePos()

            const callArg = vi.mocked(OBR.viewport.animateToBounds).mock.calls[0][0] as any
            // Expanded bounds should span at least 1000 units wide and 800 tall
            expect(callArg.max.x - callArg.min.x).toBeGreaterThanOrEqual(1000)
            expect(callArg.max.y - callArg.min.y).toBeGreaterThanOrEqual(800)
        })

        it('does not expand bounds when they already exceed the minimum screen size', async () => {
            vi.mocked(OBR.scene.isReady).mockResolvedValue(true)
            // screen is 2x2 grid units, DPI = 100 → minimum 200×200 pixels
            // bounds are 500×500, already big enough
            const bounds = makeBounds(0, 0, 500, 500)
            store.meta = {
                screen_id: 'player-screen',
                screen_size: { width: 2, height: 2 },
                screen_el: { id: 'el-1', items: [], selectionBounds: bounds, player_moved: false },
            }
            vi.mocked(OBR.player.getId).mockResolvedValue('player-screen')
            vi.mocked(OBR.scene.grid.getDpi).mockResolvedValue(100)
            vi.mocked(OBR.viewport.animateToBounds).mockResolvedValue(undefined)

            const { updatePos } = useScreenControl()
            await updatePos()

            const callArg = vi.mocked(OBR.viewport.animateToBounds).mock.calls[0][0] as any
            expect(callArg.min.x).toBe(0)
            expect(callArg.min.y).toBe(0)
            expect(callArg.max.x).toBe(500)
            expect(callArg.max.y).toBe(500)
        })

        it('handles player_moved by fetching fresh bounds', async () => {
            vi.mocked(OBR.scene.isReady).mockResolvedValue(true)
            const freshBounds = makeBounds(10, 10, 510, 410)
            store.meta = {
                screen_id: 'player-screen',
                screen_size: { width: 0, height: 0 },
                screen_el: { id: 'el-1', items: [], selectionBounds: null, player_moved: true },
            }
            vi.mocked(OBR.player.getId).mockResolvedValue('player-screen')
            vi.mocked(OBR.scene.grid.getDpi).mockResolvedValue(100)
            vi.mocked(OBR.scene.items.getItemBounds).mockResolvedValue(freshBounds as any)
            vi.mocked(OBR.room.getMetadata).mockResolvedValue({
                [META_KEY]: { ...store.meta, screen_el: { id: 'el-1', items: [], selectionBounds: freshBounds, player_moved: false } },
            })
            vi.mocked(OBR.room.setMetadata).mockResolvedValue(undefined)
            vi.mocked(OBR.viewport.animateToBounds).mockResolvedValue(undefined)

            const { updatePos } = useScreenControl()
            await updatePos()

            expect(OBR.scene.items.getItemBounds).toHaveBeenCalledWith(['el-1'])
            expect(OBR.viewport.animateToBounds).toHaveBeenCalled()
        })
    })
})
