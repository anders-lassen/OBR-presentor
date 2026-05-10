<script setup lang="ts">
import { computed } from 'vue'
import { store } from '../composables/useStore'
import { useObrMeta } from '../composables/useObrMeta'
import { useScreenControl } from '../composables/useScreenControl'

const { setRoomMeta } = useObrMeta()
const { updateCurrSelectedScreenEl } = useScreenControl()

const following = computed(() => store.meta.screen_follow ?? false)
async function toggleFollow() {
    const newFollow = !following.value
    await setRoomMeta({ screen_follow: newFollow })
    if (newFollow && store.meta?.screen_el?.items?.length) {
        await setRoomMeta({ refresh: Math.random() })
        await updateCurrSelectedScreenEl()
    }
}

</script>

<template>
    <div id="follow_control">
        <button id="toggle_follow" :class="following ? 'following' : 'not_following'" @click="toggleFollow">
            {{ following ? '👤 Following' : '👤 Not following' }}
        </button>
        <p></p>
    </div>
    <hr />

</template>

<style scoped>
button.following {
    background-color: var(--ok);
    border: none;
    color: #ffffff;
}

button.following:hover {
    background-color: #16a34a;
}

button.not_following {
    background-color: var(--danger);
    border: none;
    color: #ffffff;
}

button.not_following:hover {
    background-color: #dc2626;
}


</style>
