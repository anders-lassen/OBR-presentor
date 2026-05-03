const version = localStorage.getItem('obr-version')

if (version === 'v1') {
        console.warn('OBR version is set to v1. Please note that this version is deprecated and may not receive updates or support in the future. It is recommended to switch to v2 for the latest features and improvements.')
        throw new Error('OBR version v1 is deprecated. Please switch to v2 for the latest features and improvements.')
}

console.log('Current OBR version:', version || 'v2 (default)')

import './style.css'
import { createApp } from 'vue'
import App from './App.vue'


createApp(App).mount('#app')
