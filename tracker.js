import './style.css'
import { util } from './util.js'
import OBR from "@owlbear-rodeo/sdk";

// document.querySelector('#app').innerHTML = `
//   <div id="container">

//   </div>
// `
OBR.onReady(() => {
    util.tracker()
})