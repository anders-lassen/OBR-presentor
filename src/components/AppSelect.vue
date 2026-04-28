<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'

interface Option {
    value: string
    label: string
}

const props = defineProps<{
    modelValue: string
    options: Option[]
}>()

const emit = defineEmits<{
    'update:modelValue': [value: string]
    change: [value: string]
}>()

const open = ref(false)
const root = ref<HTMLElement | null>(null)

const selected = computed(
    () => props.options.find((o) => o.value === props.modelValue) ?? props.options[0]
)

function select(value: string) {
    emit('update:modelValue', value)
    emit('change', value)
    open.value = false
}

function toggle() {
    open.value = !open.value
}

function onOutsideClick(e: MouseEvent) {
    if (root.value && !root.value.contains(e.target as Node)) {
        open.value = false
    }
}

onMounted(() => document.addEventListener('mousedown', onOutsideClick))
onBeforeUnmount(() => document.removeEventListener('mousedown', onOutsideClick))
</script>

<template>
    <div class="app-select" :class="{ 'app-select--open': open }" ref="root">
        <button type="button" class="app-select__trigger" @click="toggle">
            <span class="app-select__label">{{ selected?.label }}</span>
            <svg
                class="app-select__arrow"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="currentColor"
            >
                <path d="M7 10l5 5 5-5z" />
            </svg>
        </button>

        <Transition name="dropdown">
            <div v-if="open" class="app-select__dropdown">
                <div
                    v-for="opt in options"
                    :key="opt.value"
                    class="app-select__option"
                    :class="{ 'app-select__option--selected': opt.value === modelValue }"
                    @mousedown.prevent="select(opt.value)"
                >
                    {{ opt.label }}
                </div>
            </div>
        </Transition>
    </div>
</template>

<style scoped>
.app-select {
    position: relative;
    width: 100%;
    user-select: none;
}

/* Trigger */
.app-select__trigger {
    all: unset;
    box-sizing: border-box;
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    padding: 8px 10px 8px 12px;
    background-color: var(--bg-input);
    border: 1px solid var(--input-border);
    border-radius: 8px;
    color: var(--text-primary);
    font-family: inherit;
    font-size: 13px;
    font-weight: 400;
    letter-spacing: 0.015em;
    cursor: pointer;
    transition: border-color 150ms ease, box-shadow 150ms ease;
    -webkit-font-smoothing: antialiased;
}

.app-select__trigger:focus-visible {
    border-color: var(--btn-outlined-border);
    box-shadow: 0 0 0 3px var(--focus-ring);
}

.app-select--open .app-select__trigger {
    border-color: var(--accent-dim);
    border-bottom-left-radius: 0;
    border-bottom-right-radius: 0;
}

.app-select__label {
    flex: 1;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.app-select__arrow {
    flex-shrink: 0;
    color: var(--accent-subtle);
    transition: transform 200ms cubic-bezier(0.4, 0, 0.2, 1);
}

.app-select--open .app-select__arrow {
    transform: rotate(180deg);
}

/* Dropdown */
.app-select__dropdown {
    position: absolute;
    left: 0;
    right: 0;
    top: 100%;
    z-index: 200;
    max-height: 220px;
    overflow-y: auto;
    background-color: rgba(30, 34, 49, 0.95);
    backdrop-filter: blur(30px);
    -webkit-backdrop-filter: blur(30px);
    background-color: var(--bg-input);
    border: 1px solid var(--accent-border);
    border-top: none;
    border-bottom-left-radius: 10px;
    border-bottom-right-radius: 10px;
    box-shadow:
        rgba(0, 0, 0, 0.2) 0px 2px 4px -1px,
        rgba(0, 0, 0, 0.14) 0px 4px 5px 0px,
        rgba(0, 0, 0, 0.12) 0px 1px 10px 0px;
    transform-origin: top center;
}

.app-select__dropdown::-webkit-scrollbar {
    width: 6px;
}
.app-select__dropdown::-webkit-scrollbar-track {
    background: transparent;
}
.app-select__dropdown::-webkit-scrollbar-thumb {
    background: var(--accent-border);
    border-radius: 999px;
}

/* Options */
.app-select__option {
    padding: 9px 12px;
    font-size: 13px;
    color: var(--text-primary);
    cursor: pointer;
    border-bottom: 1px solid var(--border-soft);
    transition: background-color 100ms ease, color 100ms ease;
    -webkit-font-smoothing: antialiased;
}

.app-select__option:last-child {
    border-bottom: none;
}

.app-select__option:hover {
    background-color: var(--btn-outlined-hover-bg);
    color: var(--option-hover-color);
}

.app-select__option--selected {
    color: var(--btn-outlined-color);
    background-color: var(--btn-outlined-hover-bg);
    font-weight: 500;
}

/* Transition */
.dropdown-enter-active {
    transition: opacity 150ms ease, transform 150ms cubic-bezier(0.4, 0, 0.2, 1);
}
.dropdown-leave-active {
    transition: opacity 120ms ease, transform 120ms cubic-bezier(0.4, 0, 0.2, 1);
}
.dropdown-enter-from,
.dropdown-leave-to {
    opacity: 0;
    transform: scaleY(0.92) translateY(-4px);
}
</style>
