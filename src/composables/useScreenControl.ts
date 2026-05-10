import OBR from '@owlbear-rodeo/sdk'
import { store } from './useStore'
import { useObrMeta } from './useObrMeta'

export function useScreenControl() {
    const { setRoomMeta } = useObrMeta()

    async function updateCurrSelectedScreenEl() {
        if (!await OBR.scene.isReady()) return
        if (!store.meta?.screen_el?.items?.length) return
        const ids = store.meta.screen_el.items.map((i: any) => i.id)
        const newBounds = await OBR.scene.items.getItemBounds(ids)
        if (!newBounds) return
        await setRoomMeta({
            screen_el: {
                id: store.meta.screen_el.id,
                items: store.meta.screen_el.items,
                selectionBounds: newBounds,
            },
        })
    }

    async function updatePos() {
        if (!await OBR.scene.isReady()) return
        const screenId = store.meta.screen_id
        if (screenId && (await OBR.player.getId()) !== String(screenId)) return
        if (store.meta.screen_el === undefined) return

        const _w = Number(store.meta.screen_size?.width ?? 0)
        const _h = Number(store.meta.screen_size?.height ?? 0)
        const dpi = await OBR.scene.grid.getDpi()
        const minWidth = _w * dpi
        const minHeight = _h * dpi

        let selBounds: any

        if (store.meta.screen_el.player_moved) {
            const newBounds = await OBR.scene.items.getItemBounds([store.meta.screen_el.id])
            selBounds = newBounds
            await setRoomMeta({
                screen_el: {
                    ...store.meta.screen_el,
                    selectionBounds: newBounds,
                    player_moved: false,
                },
            })
        } else {
            selBounds = store.meta.screen_el.selectionBounds
        }

        if (!selBounds) return

        // Strip Vue Proxy wrappers before structured-clone boundary
        selBounds = JSON.parse(JSON.stringify(selBounds))

        if (
            selBounds.max.x - selBounds.min.x < minWidth ||
            selBounds.max.y - selBounds.min.y < minHeight
        ) {
            selBounds = {
                ...selBounds,
                max: { y: selBounds.center.y + minHeight / 2, x: selBounds.center.x + minWidth / 2 },
                min: { y: selBounds.center.y - minHeight / 2, x: selBounds.center.x - minWidth / 2 },
            }
        }

        await OBR.viewport.animateToBounds(selBounds)
    }

    return { updateCurrSelectedScreenEl, updatePos }
}
