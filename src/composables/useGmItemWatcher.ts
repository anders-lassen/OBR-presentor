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
        if (!store.meta.screen_follow) return
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
