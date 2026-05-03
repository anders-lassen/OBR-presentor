import v1Css from './style.css?inline'
import { util } from './util.js'
import OBR from "@owlbear-rodeo/sdk";

var version = localStorage.getItem('obr-version') || 'v2'
if (version !== 'v1') {
    throw new Error('version1/main.js loaded while version is not v1 — aborting.')
}

// Inject v1 styles only when v1 is actually running
const style = document.createElement('style')
style.textContent = v1Css
document.head.appendChild(style)


document.querySelector('#app').innerHTML = `
<a id="v2-switch" href="#" title="Switch to Version 2 (current)">Go back to Version 2</a>
<div id="container"></div>
  <style>
    #v2-switch {
      font-size: 14px;
    //   color: #6b748e;
      text-decoration: none;
      opacity: 0.5;
      z-index: 9999;
      transition: opacity 0.2s;
    }
    #v2-switch:hover { opacity: 1; color: #ee99ff; }
  </style>
`

document.getElementById('v2-switch').addEventListener('click', (e) => {
    e.preventDefault()
    localStorage.removeItem('obr-version')
    location.reload()
})

let initiated = false
function safeInit() {
    if (initiated) return
    initiated = true
    util.init()
}

OBR.onReady(safeInit)
