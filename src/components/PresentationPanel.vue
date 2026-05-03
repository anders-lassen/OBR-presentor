<script setup lang="ts">
import { ref, onMounted } from 'vue'
import OBR from '@owlbear-rodeo/sdk'
import { store } from '../composables/useStore'

import { useObrMeta } from '../composables/useObrMeta'

declare const PresentationRequest: any

const { setRoomMeta } = useObrMeta()

const ROOM_PATTERN = /^https?:\/\/(www\.)?owlbear\.(app|rodeo)\/room\/[^/?#]+\/[^/?#]+/

const urlInputValue = ref('')
const isAvailable = ref(false)
const presentationEnabled = ref(false)
const connState = ref<'idle' | 'connected' | 'disconnected'>('idle')

let request: any = null
let connection: any = null
const presUrls = ref<string[]>(['/'])

function handleAvailabilityChange(available: boolean) {
    isAvailable.value = available
}

function checkAvailability() {
    if (typeof PresentationRequest === 'undefined') return
    request = new PresentationRequest(presUrls.value)
    request
        .getAvailability()
        .then((availability: any) => {
            handleAvailabilityChange(availability.value)
            availability.onchange = () => handleAvailabilityChange(availability.value)
        })
        .catch(() => handleAvailabilityChange(true))
}

async function saveUrl() {
    let val = urlInputValue.value.trim()

    if (/^[A-Za-z0-9]+\/[A-Za-z0-9-]+$/.test(val)) {
        val = 'https://www.owlbear.app/room/' + val
    }
    if (val.includes('owlbear.rodeo')) {
        val = val.replace('owlbear.rodeo', 'owlbear.app')
    }
    if (!val || !ROOM_PATTERN.test(val)) {
        await OBR.notification.show('Please input a valid URL for the room.', 'ERROR')
        return
    }

    val = `${val.split('?')[0]}?name=Mystic+Mirror&join=true&presentation=true`
    await setRoomMeta({ presUrl: val })
    presUrls.value = [val]
    checkAvailability()
    enablePresentation()
}

function enablePresentation() {
    presentationEnabled.value = true

    if (typeof navigator !== 'undefined' && (navigator as any).presentation && request) {
        ;(navigator as any).presentation.defaultRequest = new PresentationRequest(presUrls.value)
        ;(navigator as any).presentation.defaultRequest.onconnectionavailable = (evt: any) => {
            setConn(evt.connection)
        }
    }

    reconnect()
}

function reconnect() {
    const presId = store.meta.presId ?? null
    if (presId && request) {
        request.reconnect(presId).then(setConn)
    }
}

async function startPresentation() {
    if (request) request.start().then(setConn)
}

async function setConn(newConn: any) {
    if (connection && connection !== newConn && connection.state !== 'closed') {
        connection.onclose = undefined
        connection.close()
    }
    connection = newConn
    await setRoomMeta({ presId: connection.id })

    connection.onconnect = () => {
        connState.value = 'connected'
        connection.onmessage = (message: any) => console.log(`Received: ${message.data}`)
        connection.send('Say hello')
    }
    if (connection.state === 'connected') connection.onconnect()

    connection.onclose = () => {
        connection = null
        connState.value = 'disconnected'
    }
    connection.onterminate = async () => {
        await setRoomMeta({ presId: null })
        connection = null
        connState.value = 'idle'
    }
}

function stopPresentation() {
    connection?.terminate()
}

function disconnectPresentation() {
    connection?.close()
}

onMounted(() => {
    if (typeof PresentationRequest === 'undefined') return
    if (store.meta.presUrl) {
        presUrls.value = [store.meta.presUrl]
    }
    checkAvailability()
    if (store.meta.presUrl) {
        enablePresentation()
    }
})
</script>

<template>
    <div id="present_tool">
        <h3>Presentation</h3>
        <details class="help">
            <summary>Help</summary>
            <p>
                Use this panel to mirror an Owlbear Rodeo room onto a second screen (e.g. a TV or
                projector) via the browser's
                <a
                    href="https://developer.mozilla.org/en-US/docs/Web/API/Presentation_API"
                    target="_blank"
                    rel="noopener noreferrer"
                    >Presentation API</a
                >.
            </p>
            <ol>
                <li>
                    Paste the room URL or just the slug
                    (<code>RoomId/RoomName</code>) and click <strong>Save</strong>.
                </li>
                <li>
                    Click <strong>Present</strong> to open the room on the connected display.
                </li>
                <li>
                    Use <strong>Disconnect</strong> to detach without closing, or
                    <strong>Stop</strong> to terminate the presentation entirely.
                </li>
                <li>
                    If the display was previously connected you can click
                    <strong>Reconnect</strong> to restore the session.
                </li>
            </ol>
            <p>
                The "No presentation displays available" warning means the browser cannot detect a
                second screen. Make sure the display is connected and the browser supports the
                Presentation API (Chrome / Edge recommended).
            </p>
        </details>

        <span v-if="!isAvailable" id="nonAvailWarn">No presentation displays available.</span>

        <template v-if="!presentationEnabled">
            <div id="presUrl">
                <label for="presUrlInput">URL</label>
                <input
                    id="presUrlInput"
                    v-model="urlInputValue"
                    type="text"
                    placeholder="A7W0upefDl8r/TheMysticMirror"
                />
            </div>
            <button @click="saveUrl">Save</button>
        </template>

        <template v-else>
            <button
                v-if="connState === 'idle' || connState === 'disconnected'"
                @click="startPresentation"
            >
                Present
            </button>
            <button
                v-if="connState === 'disconnected' && store.meta.presId"
                @click="reconnect"
            >
                Reconnect
            </button>
            <button v-if="connState === 'connected'" @click="disconnectPresentation">
                Disconnect
            </button>
            <button v-if="connState === 'connected'" @click="stopPresentation">Stop</button>
        </template>
        <hr />
    </div>
</template>

<style scoped>
#present_tool {
    margin-bottom: 10px;
}

#presUrl {
    display: flex;
    gap: 8px;
    align-items: center;
    margin-bottom: 6px;
}

#urlBtn {
    width: fit-content;
    margin: 0;
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

.help ol {
    padding-left: 16px;
    margin: 6px 0;
}
</style>
