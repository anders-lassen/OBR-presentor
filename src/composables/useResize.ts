import OBR from '@owlbear-rodeo/sdk'

export function useResize() {
    let isDragging = false
    let curWidth = 0
    let startX = 0

    async function onMousedown(e: MouseEvent) {
        isDragging = true
        startX = e.clientX
        curWidth = (await OBR.action.getWidth()) ?? 0
    }

    function onMousemove(e: MouseEvent) {
        if (!isDragging) return
        OBR.action.setWidth(curWidth + (e.clientX - startX))
    }

    function onMouseup() {
        isDragging = false
    }

    return { onMousedown, onMousemove, onMouseup }
}
