import $ from "jquery";
import OBR from "@owlbear-rodeo/sdk";
import { isShape } from "@owlbear-rodeo/sdk";

import { c } from "./common.js";
// Presentation plugin
/* 
 * Presentaiton plugin
 * 
 * Because the document outside of the iframe, isn't accesible
 * This plugin is functions by selecting a player who acts as the viewer, and a controlling user (GM)
 * 
 * Todo:
 * 1. make list of selectable players
 * 2. make tool for creating a shape that acts the boundingbox/viewport for the player/screen
 * 3. eventlistner to listen for position changes of the shape and move the player
 * 4. 
 * 
 */


var util = {
    players: [],
    inited: {
        playerlist: false,
        screen_user_selected: false,
        screen_size_set: false,
        metadata_listner: false,
        item_listner: false,
        presentation_enabled: false
    },
    hooks: [],
    meta: {},
    setupTestStuff: async function () {
        if (location.toString().indexOf("localhost") == -1) return

        $("#container").append(`<br><br><br><button id="debugger">debug</button>`)
        $(document).on("click", "#debugger", function (e) {
            debugger
        })
        // OBR.contextMenu.create({
        //     id: "rodeo.owlbear.example",
        //     icons: [
        //         {
        //             icon: "/icon.svg",
        //             label: "Example",
        //             filter: {
        //             }
        //         },
        //     ],
        //     onClick(_, elementId) {
        //         OBR.popover.open({
        //             id: "rodeo.owlbear.example/",
        //             url: "/",
        //             height: 80,
        //             width: 200,
        //             anchorElementId: elementId,
        //         });
        //     },
        // });
    },
    init: async function () {
        util.winResize()
        await util.getRoomMeta();

        if (typeof util.meta.screen_id != "undefined" && util?.meta?.screen_id != 0) {
            util.inited.screen_user_selected = true
        }
        if (typeof util.meta.screen_size != "undefined" && util.meta.screen_size.width != 0) {
            util.inited.screen_size_set = true
        }

        if (!util.inited.metadata_listner) {
            util.inited.metadata_listner = true
            await OBR.room.onMetadataChange(async (metadata) => {
                // React to rooms metadata changes
                await util.getRoomMeta()
                console.log(util.meta)

                await util.metaChanged()
            })
        }
        if (!util.inited.item_listner) {
            util.inited.item_listner = true
            await OBR.scene.items.onChange(async (items) => {
                console.log("items changed", items)

                await util.itemsChanged(items)
            })
        }

        var role = await OBR.player.getRole()
        console.log("player has role: " + role)
        if (role == "PLAYER") {
            util.initPlayer();
            return
        }

        if (!util.inited.screen_user_selected) $("#container").append(`<div class="warning" id="screen_user_selected">Select a user to use as screen presentator`)
        if (!util.inited.screen_size_set) $("#container").append(`<div class="warning" id="screen_size_set">Input the size for the screen presentator`)
        if (!util.inited.presentation_enabled) $("#container").append(`<div class="warning" id="presentation_enabled">Input the url for the screen presentator`)

        // 0 - setup presentation tools
        await util.setupPresentationTools()

        // 1 - list of players
        await util.setupPlayerList()

        // 2 - setup controlpanel
        await util.setupScreenControl()



        await util.checkFollow()

        await util.setupClearMeta()
        util.setupTestStuff()
    },
    initPlayer: async function () {
        console.log("Initializing screen control")
        $("#container").append(`<div id="playerScreen"><img id="logo" style="width: 30vw;" src="./crystal-ball-white.png" /></div>`)
        await util.setupScreenControl()

        await util.setupTestStuff()

        if (await OBR.action.isOpen()) {
            await OBR.action.setHeight(1)
            await OBR.action.setWidth(1)
            $("body").css("min-width", "unset")
        }
    },
    isPlayer: async function () {
        var role = await OBR.player.getRole()

        if (role == "PLAYER")
            return true

        return false
    },
    setupPresentationTools: async function () {
        $("#container").append(`
        <div id="present_tool">
            <span id="nonAvailWarn" style="display: none;">No presentation displays available.</span>

            <div id="presUrl" style="display: none;">
                <input id="urlInput" type="text" placeholder="https://www.owlbear.app/room/xxxxxxxx/YyyyyYyyyy">
                <button id="urlBtn">Save</button>
            </div>

            <button id="presentBtn" style="display: none;">Present</button>

            <button id="reconnectBtn" style="display: none;">Reconnect</button>

            <button id="disconnectBtn" style="display: none;">Disconnect</button>
            <button id="stopBtn" style="display: none;">Stop</button>
        </div>
        `)

        const presUrls = [
            util.meta?.presUrl || "/",
            //     "https://www.owlbear.app/room/nUdv0VTqmoDJ/TheHuffySilly"
            //     "https://tracelink.dk/"
            //     "presentation.html",
            //     "alternate.html",
        ];

        const nonAvailWarn = document.getElementById("nonAvailWarn");
        const urlInput = document.getElementById("urlInput");
        const urlBtn = document.getElementById("urlBtn");
        const presUrl = document.getElementById("presUrl");

        // Monitor availability of presentation displays
        const presentBtn = document.getElementById("presentBtn");
        // The Disconnect and Stop buttons are visible if there is a connected presentation
        const stopBtn = document.querySelector("#stopBtn");
        const reconnectBtn = document.querySelector("#reconnectBtn");
        const disconnectBtn = document.querySelector("#disconnectBtn");

        var request;
        let connection;
        util.inited.presentation_enabled = false;

        // Show or hide present button depending on display availability
        const handleAvailabilityChange = (available) => {
            if (!util.inited.presentation_enabled) {
                urlInput.style.display = available ? "inline" : "none";
                urlBtn.style.display = available ? "inline" : "none";
            }
            nonAvailWarn.style.display = available ? "none" : "inline";

            presUrl.style.display = available ? "inline" : "none";
        };

        urlBtn.onclick = async () => {
            // check if urlInput is valid url
            if (urlInput.value == "" || !urlInput.value.match(/http(s)?:\/\/(www\.)?owlbear\.app\/room\/.*\/.*/)) {
                var err_str = "Please input a valid URL for the room."
                OBR.notification.show(err_str, "ERROR")
                return
            }

            await util.setRoomMeta({ "presUrl": urlInput.value })

            presUrls.pop()
            presUrls.push(urlInput.value);
            checkAvailability()

            enablePresentation();
        }

        // Promise is resolved as soon as the presentation display availability is known.
        const checkAvailability = () => {
            request = new PresentationRequest(presUrls);
            request
                .getAvailability()
                .then((availability) => {
                    handleAvailabilityChange(availability.value);
                    availability.onchange = () => {
                        handleAvailabilityChange(availability.value);
                    };
                })
                .catch(() => {
                    handleAvailabilityChange(true);
                });
        }

        checkAvailability()

        if (typeof util.meta?.presUrl != "undefined") {
            enablePresentation()
        }

        // Starting a new presentation
        presentBtn.onclick = () => {
            //     const presId = util.meta?.presId || null;

            //     if (presId) {
            //         request
            //             .reconnect(presId)
            //             // The new connection to the presentation will be passed to
            //             // setConnection on success.
            //             .then(setConnection);
            //         // No connection found for presUrl and presId, or an error occurred.
            //     } else {
            // Start new presentation.
            request
                .start()
                .then(setConnection);
            //     }
        };
        // ---

        async function enablePresentation() {
            urlInput.style.display = "none";
            urlBtn.style.display = "none";
            presUrl.style.display = "none";
            presentBtn.style.display = "inline";
            $("#presentation_enabled").remove()
            util.inited.presentation_enabled = true

            // Reconnect to a presentation --
            const reconnect = () => {
                // read presId from util.meta if exists
                // const presId = localStorage["presId"];
                const presId = util.meta?.presId || null;
                // presId is mandatory when reconnecting to a presentation.
                if (presId) {
                    request
                        .reconnect(presId)
                        // The new connection to the presentation will be passed to
                        // setConnection on success.
                        .then(setConnection);
                    // No connection found for presUrl and presId, or an error occurred.
                }
            };
            // On navigation of the controller, reconnect automatically.
            document.addEventListener("DOMContentLoaded", reconnect);
            // Or allow manual reconnection.
            reconnectBtn.onclick = reconnect

            reconnect()
            // -- Reconnect to a presentation

            // Presentation initiation by the controlling UA
            navigator.presentation.defaultRequest = new PresentationRequest(presUrls);
            navigator.presentation.defaultRequest.onconnectionavailable = (evt) => {
                setConnection(evt.connection);
            };


            stopBtn.onclick = () => {
                connection?.terminate();
            };

            disconnectBtn.onclick = () => {
                connection?.close();
            };

        }
        async function setConnection(newConnection) {
            // Disconnect from existing presentation, if not attempting to reconnect
            if (
                connection &&
                connection !== newConnection &&
                connection.state !== "closed"
            ) {
                connection.onclose = undefined;
                connection.close();
            }

            // Set the new connection and save the presentation ID
            connection = newConnection;
            //     localStorage["presId"] = connection.id;
            await util.setRoomMeta({ presId: connection.id });

            function showConnectedUI() {
                // Allow the user to disconnect from or terminate the presentation
                stopBtn.style.display = "inline";
                disconnectBtn.style.display = "inline";
                reconnectBtn.style.display = "none";
                presentBtn.style.display = "none";
            }

            function showDisconnectedUI() {
                disconnectBtn.style.display = "none";
                stopBtn.style.display = "none";
                reconnectBtn.style.display = util.meta?.presId ? "inline" : "none";
                presentBtn.style.display = util.meta?.presId ? "inline" : "none";
                // reconnectBtn.style.display = localStorage["presId"] ? "inline" : "none";
            }

            // Monitor the connection state
            connection.onconnect = () => {
                showConnectedUI();

                // Register message handler
                connection.onmessage = (message) => {
                    console.log(`Received message: ${message.data}`);
                };

                // Send initial message to presentation page
                connection.send("Say hello");
            };

            //     if already connected, show connected UI
            if (connection.state === "connected")
                connection.onconnect()

            connection.onclose = () => {
                connection = null;
                showDisconnectedUI();
            };

            connection.onterminate = async () => {
                // Remove presId from localStorage if exists
                // delete localStorage["presId"];
                await util.setRoomMeta({ presId: null });

                connection = null;
                showDisconnectedUI();
            };
        }
        //   connection.send('{"string": "你好，世界!", "lang": "zh-CN"}');
        //   connection.send('{"string": "こんにちは、世界!", "lang": "ja"}');
        //   connection.send('{"string": "안녕하세요, 세계!", "lang": "ko"}');
        //   connection.send('{"string": "Hello, world!", "lang": "en-US"}');
    },
    setupPlayerList: async function () {
        $("#container").append(`
        <div id="playerlist_cont">
            <h3>Players:</h3>
            <div id="playerlist"></div>
            <hr>
        </div>`)
        this.players = await OBR.party.getPlayers()
        util.updatePlayerlist()

        OBR.action.onOpenChange((isOpen) => {
            console.log("open changed")
        })

        if (!util.inited.playerlist) {
            OBR.party.onChange(async (party) => {
                console.log("party changed")
                // this.players = await OBR.party.getPlayers()
                util.players = party
                console.log(party)
                // update playerlist
                util.updatePlayerlist()
            })
            OBR.player.onChange((player) => {
                console.log("player changed")
                // debugger

                console.log(player)
                // update playerlist
                util.updatePlayerlist()
            }),
                util.inited.playerlist = true
        }

        $(document).on("click", "#playerlist button", async function (e) {
            var id = $(e.target).attr("id");
            console.log(`selected player ${id} as screen`)

            await util.setRoomMeta({
                screen_id: id
            })

            await util.updatePlayerlist()
        })
    },
    setupScreenControl: async function () {
        if (await util.isPlayer()) {
            // activate listner
            console.log(util.meta.screen_el)
            async function updatePos() {
                if (typeof util.meta.screen_el != "undefined") {
                    // var pos_el = await OBR.scene.items.getItems(util.meta.screen_el.items.map(function (a) {
                    //     return a.id
                    // }));
                    var _w = util.meta.screen_size.width // await prompt(`Width (width in grid)`)
                    var _h = util.meta.screen_size.height // await prompt(`Height (height in grid)`)
    
                    var dpi = await OBR.scene.grid.getDpi()
                    var scale = await OBR.scene.grid.getScale()
                    var min_width = (_w * dpi) // scale.parsed.multiplier
                    var min_height = (_h * dpi) // scale.parsed.multiplier

                    var sel_bounds = util.meta.screen_el.selectionBounds

                    if (sel_bounds.max.x - sel_bounds.min.x < min_width || sel_bounds.max.y - sel_bounds.min.y < min_height) {
                        sel_bounds.max = { y: sel_bounds.center.y + (min_height / 2), x: sel_bounds.center.x + (min_width / 2) }
                        sel_bounds.min = { y: sel_bounds.center.y - (min_height / 2), x: sel_bounds.center.x - (min_width / 2) }
                    }

                    await OBR.viewport.animateToBounds(sel_bounds)
                }
            }
            util.hooks.push({
                group: "metaChanged",
                role: "PLAYER",
                func: updatePos,
                args: []
            })
            updatePos()
            return
        }
        // setup controlPanel
        // btns:
        // start/stop - follow of boundingbox
        // refresh position
        // remove user as screen
        // move to specific x,y
        $("#container").append(`<div id="screen_control">
            <h3>Screen Control</h3>
            <table class="screen_wrap">
                <tr class="screen_inp_wrap">
                    <td><label for="width">Width: </label></td>
                    <td><input class="screen_size" id="width" placeholder="0.00" value="${util.meta?.screen_size?.width || ""}"/></td>

                    <td rowspan=2><button id="switch_wh">▴▾</button></td>
                </tr>
                <tr class="screen_inp_wrap">
                    <td><label for="height">Height: </label></td>
                    <td><input class="screen_size" id="height" placeholder="0.00" value="${util.meta?.screen_size?.height || ""}" /></td>
                </tr>
            </table>
            <button id="toggle_follow" class="following">Follow</button>
            <button id="refresh_pos" class="">Refresh</button><br>
            <button id="rm_screenuser" class="red">Remove</button>
            
            <hr>
        </div>`)
        // <label for="pos_x">X:</label><input id="pos_x" placeholder="0.00" /><br>
        // <label for="pos_y">Y:</label><input id="pos_y" placeholder="0.00" /><br><button id="animate_pos" class="red">Move user</button><br>

        $(document).on("click", "button#toggle_follow", async function (evt) {
            // debugger
            var following = !util.meta.screen_follow || false
            await util.setRoomMeta({
                screen_follow: following
            })

            await util.checkFollow()
        })
        $(document).on("click", "button#refresh_pos", async function (evt) {
            await util.setRoomMeta({ refresh: Math.random(10) })
            await util.updateCurrSelectedScreenEl()
        })
        // $(document).on("click", "button#animate_pos", async function (evt) {
        // })
        $(document).on("click", "button#switch_wh", async function (evt) {
            $("input#height").val(util.meta.screen_size.width)
            $("input#width").val(util.meta.screen_size.height)

            await saveSizes()
        })
        $(document).on("keyup", "input.screen_size", async function (evt) {
            if (util.save_tm)
                clearTimeout(util.save_tm)
            // save width and height
            util.save_tm = setTimeout(async () => {
                await saveSizes()
            }, 300)
        })

        async function saveSizes() {
            let ttt = $("input.screen_size")
            let new_sizes = {}
            ttt.map((i, e) => { return new_sizes[e.id] = e.value })
            // debugger

            if (new_sizes.width != "" || new_sizes.height != "")
                $("#screen_size_set").hide()


            await util.setRoomMeta({
                screen_size: new_sizes
            })

            await OBR.notification.show("Sizes saved", "SUCCESS")
            await util.updateCurrSelectedScreenEl()
        }
        $(document).on("click", "button#rm_screenuser", async function (evt) {
            await util.setRoomMeta({
                screen_id: 0
            })
            await OBR.notification.show("Screen user removed", "ERROR")
            await util.updatePlayerlist()
        })

        await OBR.contextMenu.create({
            id: "dk.planeshifter.scrying",
            icons: [
                {
                    icon: "/icon.svg",
                    label: "Sync2View",
                    filter: {}
                },
            ],
            async onClick(_, elementId) {
                // // debugger
                await util.setRoomMeta({
                    screen_el: _
                })

                await OBR.notification.show("Moving screen to view", "SUCCESS")
                // OBR.popover.open({
                //     id: "dk.planeshifter.scrying/shapeTracker",
                //     url: "/shapeTracker.html",
                //     height: 80,
                //     width: 200,
                //     anchorElementId: elementId,
                // });
            },
        });
        await OBR.contextMenu.create({
            id: "dk.planeshifter.scrying/resize",
            icons: [
                {
                    icon: "/resize.svg",
                    label: "Resize to Screen size",
                    filter: {}
                },
            ],
            async onClick(_, elementId) {
                // debugger
                // OBR.popover.open({
                //     id: "dk.planeshifter.scrying/shapeTracker",
                //     url: "/shapeTracker.html",
                //     height: 80,
                //     width: 200,
                //     anchorElementId: elementId,
                // });
                var _w = util.meta.screen_size.width // await prompt(`Width (width in grid)`)
                var _h = util.meta.screen_size.height // await prompt(`Height (height in grid)`)

                var dpi = await OBR.scene.grid.getDpi()
                var scale = await OBR.scene.grid.getScale()

                OBR.scene.items.updateItems(_.items, (items) => {
                    for (let item of items) {
                        // debugger
                        _h = _h / item.scale.y
                        _w = _w / item.scale.x

                        item.width = (_w * dpi) // scale.parsed.multiplier
                        item.height = (_h * dpi) // scale.parsed.multiplier
                        item.visible = false; // hide the item
                    }
                });
            },
        });
        // event listner for items
        util.hooks.push({
            group: "itemsChanged",
            role: "GM",
            func: async function (items) {
                // if screen follow is active move with shape
                if (!util.meta.screen_follow) return
                // if selected screen el has changed update pos

                var new_screen_itm = items.find((itm) => {
                    return util.meta.screen_el.items.arrayOfProp("id").includes(itm.id) ? itm : false
                })
                var old_screen_el = util.meta.screen_el.items.find((el) => {
                    return items.arrayOfProp("id").includes(el.id) ? el : false
                })

                var diff = util.getDifference(new_screen_itm, old_screen_el)

                if (typeof diff.position != "undefined") {
                    // save new pos
                    var new_selection_bounds = await OBR.scene.items.getItemBounds([new_screen_itm.id])
                    // debugger

                    await util.setRoomMeta({
                        screen_el: {
                            items: util.meta.screen_el.items,
                            selectionBounds: new_selection_bounds
                        }
                    })
                }

                // updatePos()

                // var screen_itm = items.map((itm) => {
                //     return util.meta.screen_el.items.arrayOfProp("id").includes(itm.id) ? itm : false
                // }).filter(Boolean)

                // // debugger
                // if (util.getDifference(screen_itm, util.meta.screen_el.find((el) => {
                //     return screen_itm.id == el.id ? true : false
                // })))
                //     updatePos()
            },
            args: []
        })
    },
    checkFollow: async function () {
        var following = util.meta.screen_follow || false
        if (following) {
            $("#toggle_follow").addClass("following")
            $("#toggle_follow").removeClass("not_following")

            $("#toggle_follow").text("Following")

            await util.setRoomMeta({ refresh: Math.random(10) })
            await util.updateCurrSelectedScreenEl()
        } else {
            $("#toggle_follow").removeClass("following")
            $("#toggle_follow").addClass("not_following")

            $("#toggle_follow").text("Not following")
        }
    },
    updateCurrSelectedScreenEl: async function () {
        var new_selection_bounds = await OBR.scene.items.getItemBounds(util.meta.screen_el.items.arrayOfProp("id"))
        // debugger

        await util.setRoomMeta({
            screen_el: {
                items: util.meta.screen_el.items,
                selectionBounds: new_selection_bounds
            }
        })
    },
    itemsChanged: async function (items) {
        console.log("itemsChanged")
        var role = await util.isPlayer() ? "PLAYER" : "GM"
        // common function to both PLAYER and GM
        var _hooks = util.hooks.map(function (el, idx) {
            if (el.group == "itemsChanged" && el.role == role) return el;
        }).filter(Boolean)

        console.log("running hooks: " + _hooks.length)
        _hooks.forEach(async function (hook) {
            await hook.func(items, ...hook.args)
        })
        return
        // is GM


    },
    metaChanged: async function () {
        console.log("metaChanged")
        // common function to both PLAYER and GM
        if (await util.isPlayer()) {
            var _hooks = util.hooks.map(function (el, idx) {
                if (el.group == "metaChanged" && el.role == "PLAYER") return el;
            }).filter(Boolean)

            console.log("running hooks: " + _hooks.length)
            _hooks.forEach(async function (hook) {
                await hook.func(...hook.args)
            })
            return
        }
        // is GM


    },
    // tracker: async function () {
    //     console.log(arguments)
    //     // debugger
    //     util.setRoomMeta({
    //         pos_x: 0,
    //         pos_y: 0
    //     })
    // },
    updatePlayerlist: async function () {
        $("#playerlist").empty()
        util.players.sort((a, b) => {
            return a < b
        }).forEach(function (p) {
            /* 
            color: "#519E00"
            connectionId: "3724933883"
            id: "f68080a1-f372-4cfe-871d-a1f0b18cc56a"
            metadata: {}
            name: "Gibbering Mouther"
            role: "PLAYER" 
            selection: undefined
            syncView: false */
            if (p.role != "PLAYER") return;

            var extra_cls = ""

            // // debugger
            if (util.meta.screen_id == p.id) {
                $("#screen_user_selected").hide()
                extra_cls = " isScreen"
            }

            var el_str = `<button id="${p.id}" class="${extra_cls}" style="background: ${p.color}">${p.name}</button>`

            $("#playerlist").append(el_str)
        })
    },
    setRoomMeta: async function (update) {
        // util.meta = await util.getRoomMeta()
        await OBR.room.setMetadata({
            "dk.planeshifter.scrying": Object.assign(util.meta, update)
        })
        util.meta = await util.getRoomMeta()
        return util.meta
    },
    getRoomMeta: async function () {
        util.meta = await OBR.room.getMetadata()
        util.meta = util.meta["dk.planeshifter.scrying"] || {}
        return util.meta
    },
    setupClearMeta: async function () {
        $("#container").append(`<button id="clear_meta" class="red">Clear Meta</button>`)
        $("#clear_meta").click(async function () {
            if (await confirm("Are you sure you want to clear all metadata?")) {

                await OBR.room.setMetadata({
                    "dk.planeshifter.scrying": {}
                })
                util.meta = await util.getRoomMeta()

                setTimeout(() => {
                    location.reload()
                }, 500);
            }
        })
    },
    getDifference: (a, b) =>
        Object.fromEntries(Object.entries(b).filter(([key, val]) => key in a && a[key] !== val))
    ,
    winResize: function () {
        $("#container").append(`<div id=leftbar><span id="resize">⠇</span></div>`)
        var isDragging = false;
        var curWidth = 0
        var clientCoor = {
            starting: 0,
            current: 0
        }
        // var resizeEl = "div#leftbar span#resize"
        var resizeEl = "div#leftbar"
        $(document)
            .on("mousedown", resizeEl, async function (e) {
                isDragging = true;
                clientCoor.starting = e.clientX
                curWidth = await OBR.action.getWidth()
                // debugger
                console.log("down")
            })
        $(document)
            .on("mousemove", /* resizeEl,  */async function (e) {
                // isDragging = true;
                if (isDragging) {
                    clientCoor.current = e.clientX

                    var w = curWidth + (clientCoor.current - clientCoor.starting)
                    console.log("move")
                    OBR.action.setWidth(w)
                    // debugger
                }
            })
        $(document)
            .on("mouseup", /* resizeEl,  */function (e) {
                var wasDragging = isDragging;
                isDragging = false;
                console.log("up")
                if (!wasDragging) {
                    // $("#throbble").toggle();
                }
            });
    },
}

export { util }