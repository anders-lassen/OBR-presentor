import OBR from '@owlbear-rodeo/sdk'
import { store } from './useStore'
import { useObrMeta } from './useObrMeta'

function getDifference(a: Record<string, any>, b: Record<string, any>): Record<string, any> {
    return Object.fromEntries(
        Object.entries(b).filter(([key, val]) => key in a && a[key] !== val)
    )
}

export function useGmItemWatcher() {
    const { setRoomMeta } = useObrMeta()

    async function handleGmItems(items: any[]) {
        if (!await OBR.scene.isReady()) return

        // Animate GM's own viewport when following a waypoint token
        const waypointId = store.meta.screen_waypoint_id
        if (store.meta.screen_waypoint_follow_gm && waypointId) {
            const movedItem = items.find((i: any) => i.id === waypointId)
            if (movedItem) {
                const newBounds = await OBR.scene.items.getItemBounds([waypointId])
                if (newBounds) {
                    let bounds: any = JSON.parse(JSON.stringify(newBounds))
                    const _w = Number(store.meta.screen_size?.width ?? 0)
                    const _h = Number(store.meta.screen_size?.height ?? 0)
                    if (_w > 0 && _h > 0) {
                        const dpi = await OBR.scene.grid.getDpi()
                        const bw = _w * dpi
                        const bh = _h * dpi
                        bounds = {
                            ...bounds,
                            min: { x: bounds.center.x - bw / 2, y: bounds.center.y - bh / 2 },
                            max: { x: bounds.center.x + bw / 2, y: bounds.center.y + bh / 2 },
                            width: bw,
                            height: bh,
                        }
                    }
                    await OBR.viewport.animateToBounds(bounds)
                }
            }
        }

        if (!store.meta.screen_follow && !store.meta.screen_waypoint_follow) return
        if (!store.meta?.screen_el?.items?.length) return

        const screenItemIds = store.meta.screen_el.items.map((i: any) => i.id)
        const itemIds = items.map((i: any) => i.id)

        const newScreenItem = items.find((itm: any) => screenItemIds.includes(itm.id))
        const oldScreenEl = store.meta.screen_el.items.find((el: any) => itemIds.includes(el.id))

        if (!newScreenItem || !oldScreenEl) return

        const updateUser = store.players.find((a) => a.id === newScreenItem.lastModifiedUserId)

        if (updateUser?.role === 'PLAYER') {
            await setRoomMeta({
                screen_el: {
                    id: newScreenItem.id,
                    items: store.meta.screen_el.items,
                    selectionBounds: false,
                    player_moved: true,
                },
            })
        } else {
            const diff = getDifference(newScreenItem, oldScreenEl)
            if (diff.position !== undefined) {
                const newBounds = await OBR.scene.items.getItemBounds([newScreenItem.id])
                await setRoomMeta({
                    screen_el: {
                        id: newScreenItem.id,
                        items: store.meta.screen_el.items,
                        selectionBounds: newBounds,
                        player_moved: false,
                    },
                })
            }
        }
    }

    return { handleGmItems }
}
