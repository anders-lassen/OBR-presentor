<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import OBR from '@owlbear-rodeo/sdk'
import { store } from '../composables/useStore'
import { useObrMeta } from '../composables/useObrMeta'
import { useScreenControl } from '../composables/useScreenControl'
import AppSelect from './AppSelect.vue'

const { setRoomMeta } = useObrMeta()
const { updateCurrSelectedScreenEl } = useScreenControl()

const SCREEN_SIZES: Record<string, { w: number; h: number }> = {
    '24': { w: 20.9, h: 11.7 },
    '27': { w: 23.5, h: 13.2 },
    '32': { w: 25.6, h: 19.2 },
    '40': { w: 32.0, h: 24.0 },
    '43': { w: 34.4, h: 25.8 },
    '48': { w: 38.4, h: 28.8 },
    '50': { w: 40.0, h: 30.0 },
    '55': { w: 44.0, h: 33.0 },
    '60': { w: 48.0, h: 36.0 },
    '65': { w: 52.0, h: 39.0 },
    '70': { w: 56.0, h: 42.0 },
    '75': { w: 60.0, h: 45.0 },
    '80': { w: 64.0, h: 48.0 },
    '85': { w: 68.0, h: 51.0 },
}

const width = ref(store.meta.screen_size?.width?.toString() ?? '')
const height = ref(store.meta.screen_size?.height?.toString() ?? '')
const selectedPreset = ref('0')
let saveTm: ReturnType<typeof setTimeout> | null = null

const PRESET_OPTIONS = [
    { value: '0', label: 'Manual' },
    { value: '24', label: '24" (20.9 x 11.7)' },
    { value: '27', label: '27" (23.5 x 13.2)' },
    { value: '32', label: '32" (25.6 x 19.2)' },
    { value: '40', label: '40" (32.0 x 24.0)' },
    { value: '43', label: '43" (34.4 x 25.8)' },
    { value: '48', label: '48" (38.4 x 28.8)' },
    { value: '50', label: '50" (40.0 x 30.0)' },
    { value: '55', label: '55" (44.0 x 33.0)' },
    { value: '60', label: '60" (48.0 x 36.0)' },
    { value: '65', label: '65" (52.0 x 39.0)' },
    { value: '70', label: '70" (56.0 x 42.0)' },
    { value: '75', label: '75" (60.0 x 45.0)' },
    { value: '80', label: '80" (64.0 x 48.0)' },
    { value: '85', label: '85" (68.0 x 51.0)' },
]

const screenSizeSet = computed(
    () => !!store.meta.screen_size && Number(store.meta.screen_size.width) !== 0
)

const collapsed = ref(false)

function onPresetChange() {
    const s = SCREEN_SIZES[selectedPreset.value]
    if (!s) return
    width.value = s.w.toString()
    height.value = s.h.toString()
    saveSizes()
}

function switchWH() {
    ;[width.value, height.value] = [height.value, width.value]
    saveSizes()
}

function onSizeInput() {
    if (saveTm) clearTimeout(saveTm)
    saveTm = setTimeout(saveSizes, 300)
}

async function saveSizes() {
    if (!width.value || !height.value) return
    const w = parseFloat(width.value)
    const h = parseFloat(height.value)
    if (isNaN(w) || isNaN(h) || w <= 0 || h <= 0) {
        await OBR.notification.show('Enter valid positive width/height values.', 'ERROR')
        return
    }
    await setRoomMeta({ screen_size: { width: width.value, height: height.value } })
    await OBR.notification.show('Sizes saved', 'SUCCESS')
    await updateCurrSelectedScreenEl()
}

onMounted(async () => {
    await OBR.contextMenu.create({
        id: 'dk.planeshifter.scrying',
        icons: [{ icon: '/icon.svg', label: 'Focus Item', filter: {} }],
        async onClick(_: any) {
            await setRoomMeta({ screen_el: _ })
            await OBR.notification.show('Moving screen to view', 'SUCCESS')
        },
    })

    await OBR.contextMenu.create({
        id: 'dk.planeshifter.scrying/resize',
        icons: [{ icon: '/resize.svg', label: 'Resize to Screen size', filter: {} }],
        async onClick(_: any) {
            if (!await OBR.scene.isReady()) return
            const _w = Number(store.meta.screen_size?.width ?? 0)
            const _h = Number(store.meta.screen_size?.height ?? 0)
            const dpi = await OBR.scene.grid.getDpi()
            OBR.scene.items.updateItems(_.items, (items: any[]) => {
                for (const item of items) {
                    item.width = (_w / item.scale.x) * dpi
                    item.height = (_h / item.scale.y) * dpi
                    item.visible = false
                }
            })
        },
    })
})
</script>

<template>
    <div id="screen_control">
        <div class="section-header">
            <h3 @click="collapsed = !collapsed">
                <span v-if="screenSizeSet" class="collapse-icon" :title="collapsed ? 'Expand' : 'Collapse'">{{ collapsed
                    ? '▸' : '▾' }}
                </span>
                Screen Control
            </h3>
        </div>
        <div v-if="!screenSizeSet" class="warning">Input the size for the screen presenter</div>
        <template v-if="!collapsed">
            <details class="help">
                <summary>Help</summary>
                <p>Enter the physical width and height of your presentation display in inches. This lets the scale overlay and any map objects line up with real-world measurements.</p>
                <ul>
                    <li>Pick a preset from the dropdown, or type your dimensions manually.</li>
                    <li>Use the <strong>↺</strong> button to swap width and height (e.g. for portrait orientation).</li>
                    <li>Right-click any map object and choose <em>Resize to Screen size</em> to resize it to exactly match your display.</li>
                    <li>Right-click any map object and choose <em>Focus Item</em> to jump the presentation screen to that object's position.</li>
                </ul>
            </details>
            <table class="screen_wrap">
                <tbody>
                    <tr class="screen_inp_wrap">
                        <td colspan="3">
                            <label for="selector">Screensizes:</label><br />
                            <AppSelect id="selector" v-model="selectedPreset" :options="PRESET_OPTIONS"
                                @change="onPresetChange" />
                        </td>
                    </tr>
                    <tr class="screen_inp_wrap">
                        <td><label for="width">Width:</label></td>
                        <td>
                            <input id="width" class="screen_size" placeholder="0.00" v-model="width"
                                @input="onSizeInput" />
                        </td>
                        <td rowspan="2">
                            <button @click="switchWH" class="icon">↺</button>
                        </td>
                    </tr>
                    <tr class="screen_inp_wrap">
                        <td><label for="height">Height:</label></td>
                        <td>
                            <input id="height" class="screen_size" placeholder="0.00" v-model="height"
                                @input="onSizeInput" />
                        </td>
                    </tr>
                </tbody>
            </table>
        </template>
        <div v-else class="collapsed-summary">{{ width }} × {{ height }} inches</div>
        <hr />
    </div>
</template>

<style scoped>
.screen_inp_wrap {
    text-align: left;
}

.screen_size {
    width: 140px;
}

table.screen_wrap {
    width: 100%;
    border-spacing: 0 6px;
}

.warning {
    font-size: 12.5px;
    border: 1px solid rgba(239, 68, 68, 0.4);
    color: #fca5a5;
    border-radius: 8px;
    margin: 0 0 10px;
    padding: 8px 12px;
    background: rgba(60, 10, 10, 0.6);
}

[data-theme="light"] .warning {
    background: rgba(254, 226, 226, 0.8);
    color: #991b1b;
    border-color: rgba(220, 38, 38, 0.5);
}

button.icon {
    padding: 6px;
    width: min-content;
    min-width: 48px;
    font-size: 18px;
    border-radius: 999px;
}

.section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 10px;
}

.section-header h3 {
    margin: 0;
}

.collapse-icon {
    font-size: 16px;
    /* color: var(--text-muted); */
    cursor: pointer;
    user-select: none;
    line-height: 1;
    transition: color 150ms ease;
}

.collapse-icon:hover {
    color: var(--accent);
}

.collapsed-summary {
    font-size: 12.5px;
    color: var(--text-muted);
    margin-bottom: 8px;
}

.help {
    font-size: 11.5px;
    color: var(--text-secondary);
    margin-bottom: 10px;
}

.help summary {
    cursor: pointer;
    font-size: 12px;
    font-weight: 600;
    color: var(--text-muted);
}

.help p,
.help li {
    line-height: 1.55;
    margin: 4px 0;
}

.help ul {
    padding-left: 16px;
    margin: 6px 0;
}
</style>
