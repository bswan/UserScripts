// ==UserScript==
// @name         OGame Exp Data
// @namespace    http://tampermonkey.net/
// @version      2025-05-26-2
// @description  Toolkit to gather Exp data from OGame messages
// @author       Vladyslav *BlackSwan* Aksonov
// @match        https://s262-en.ogame.gameforge.com/game/index.php*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=gameforge.com
// @grant        none
// @updateURL    https://raw.githubusercontent.com/bswan/UserScripts/refs/heads/main/OGameExpeditionStats.js
// @downloadURL  https://raw.githubusercontent.com/bswan/UserScripts/refs/heads/main/OGameExpeditionStats.js
// ==/UserScript==

(function() {
    'use strict';

    let exposMode = "waiting";
    let battlesMode = "waiting";

    const depletionStats = JSON.parse(localStorage.getItem("depletionStats"))||{};

    switch(window.location.search) {
        case "?page=ingame&component=messages":
            {
                const exposIntervalId = setInterval(ExposPageTracker, 1000);
                const battlesIntervalId = setInterval(BattlesPageTracker, 1000);

                function ExposPageTracker() {
                    let targetElement = document.querySelector(`div[data-subtab-id="22"]`);

                    if (targetElement) {
                        if (exposMode == "waiting" && targetElement.classList.contains('active')) {
                            setupExpos();
                            exposMode = "setup";
                        } else if (exposMode == "setup" && !targetElement.classList.contains('active')) {
                            cleanupExpos();
                            exposMode = "waiting";
                        }
                    }

                    targetElement = document.querySelector(`div[data-subtab-id="13"]`);

                    if (targetElement) {
                        if (exposMode == "waiting" && targetElement.classList.contains('active')) {
                            setupExpos();
                            exposMode = "setup";
                        } else if (exposMode == "setup" && !targetElement.classList.contains('active')) {
                            cleanupExpos();
                            exposMode = "waiting";
                        }
                    }
                }

                function BattlesPageTracker() {
                    let targetElement = document.querySelector(`div[data-subtab-id="21"]`);

                    if (targetElement) {
                        if (battlesMode == "waiting" && targetElement.classList.contains('active')) {
                            setupBattles();
                            battlesMode = "setup";
                        } else if (battlesMode == "setup" && !targetElement.classList.contains('active')) {
                            cleanupExpos();
                            battlesMode = "waiting";
                        }
                    }

                    targetElement = document.querySelector(`div[data-subtab-id="12"]`);

                    if (targetElement) {
                        if (battlesMode == "waiting" && targetElement.classList.contains('active')) {
                            setupBattles();
                            battlesMode = "setup";
                        } else if (battlesMode == "setup" && !targetElement.classList.contains('active')) {
                            cleanupExpos();
                            battlesMode = "waiting";
                        }
                    }
                }

                function setupExpos() {
                    const btnNext = document.querySelector(`.custom_btn.next`);
                    btnNext.onclick = () => {
                        ogame.messages.paginatorNext();
                        exposMode = "waiting";
                    };
                    const btnLast = document.querySelector(`.custom_btn.last`);
                    btnLast.onclick = () => {
                        ogame.messages.paginatorLast();
                        exposMode = "waiting";
                    };
                    const btnPrevious = document.querySelector(`.custom_btn.previous`);
                    btnPrevious.onclick = () => {
                        ogame.messages.paginatorPrevious();
                        exposMode = "waiting";
                    };
                    const btnFirst = document.querySelector(`.custom_btn.first`);
                    btnFirst.onclick = () => {
                        ogame.messages.paginatorFirst();
                        exposMode = "waiting";
                    };

                    processExpos();
                }

                function setupBattles() {
                    const btnNext = document.querySelector(`.custom_btn.next`);
                    btnNext.onclick = () => {
                        ogame.messages.paginatorNext();
                        battlesMode = "waiting";
                    };
                    const btnLast = document.querySelector(`.custom_btn.last`);
                    btnLast.onclick = () => {
                        ogame.messages.paginatorLast();
                        battlesMode = "waiting";
                    };
                    const btnPrevious = document.querySelector(`.custom_btn.previous`);
                    btnPrevious.onclick = () => {
                        ogame.messages.paginatorPrevious();
                        battlesMode = "waiting";
                    };
                    const btnFirst = document.querySelector(`.custom_btn.first`);
                    btnFirst.onclick = () => {
                        ogame.messages.paginatorFirst();
                        battlesMode = "waiting";
                    };

                    processBattles();
                }

                function processExpos() {
                    const dict = {
                        combatAliens: "Aliens",
                        combatPirates: "Pirates",
                        darkmatter: "Dark Matter",
                        early: "Early",
                        late: "Late",
                        nothing: "Nothing",
                        ressources: "Resources",
                        shipwrecks: "Fleet"
                    };
                    const messages = document.querySelectorAll(`.msg`);

                    messages.forEach((msg) => {
                        const id = msg.dataset.msgId;
                        const rawData = msg.querySelector(`.rawMessageData`);
                        if (rawData.dataset.rawMessagetype != "41") return;
                        const content = msg.querySelector(`.msgContent`);
                        const date = new Date(rawData.dataset.rawTimestamp * 1000);
                        const dtFormat = new Intl.DateTimeFormat('en-GB', {
                            year: "numeric",
                            month: "numeric",
                            day: "numeric",
                            timeZone: 'Europe/Kyiv'
                        });
                        const timeFormat = new Intl.DateTimeFormat('en-GB', {
                            hour: "numeric",
                            minute: "numeric",
                            second: "numeric",
                            hour12: false,
                            timeZone: 'Europe/Kyiv'
                        });
                        let data = {
                            id: id,
                            coords: rawData.dataset.rawCoords,
                            date: dtFormat.format(date),
                            time: timeFormat.format(date),
                            depletion: rawData.dataset.rawDepletion,
                            result: rawData.dataset.rawExpeditionresult,
                            size: rawData.dataset.rawSize,
                            timestamp: rawData.dataset.rawTimestamp,
                        };
                        if(rawData.dataset.rawNavigation) {
                            const navData = JSON.parse(rawData.dataset.rawNavigation);
                            data.returnIncrease = navData.returnTimeAbsoluteIncreaseHours;
                            data.returnMultiplier = navData.returnTimeMultiplier;
                            if (data.returnIncrease > 0) {
                                data.result = "late";
                            } else if(data.returnMultiplier > 0 && data.returnMultiplier < 1) {
                                data.result = "early";
                            }
                        }
                        if(rawData.dataset.rawResourcesgained) {
                            const resourcesData = JSON.parse(rawData.dataset.rawResourcesgained);
                            data = { ...data, ...resourcesData };
                        }
                        if(rawData.dataset.rawTechnologiesgained) {
                            const fleetData = JSON.parse(rawData.dataset.rawTechnologiesgained);
                            Object.keys(fleetData).forEach((ship_id)=>{
                                const ship = fleetData[ship_id];
                                data[ship.name] = ship.amount;
                            });
                        }
                        if(depletionStats[data.coords] === undefined || depletionStats[data.coords].timestamp < data.timestamp) {
                            depletionStats[data.coords] = {
                                timestamp: data.timestamp,
                                depletion: data.depletion
                            }
                            localStorage.setItem("depletionStats",JSON.stringify(depletionStats));
                        }
                        const text_bits = [];
                        text_bits.push(data.id??'');
                        text_bits.push(data.timestamp??'');
                        text_bits.push(data.date??'');
                        text_bits.push('');
                        text_bits.push(data.coords??'');
                        text_bits.push(data.size??'');
                        text_bits.push(data.depletion??'');
                        text_bits.push(dict[data.result??'']);
                        text_bits.push(data.returnIncrease??'');
                        text_bits.push(data.returnMultiplier??'');
                        text_bits.push(data.darkMatter??'');
                        text_bits.push('');
                        text_bits.push(data.metal??'');
                        text_bits.push(data.crystal??'');
                        text_bits.push(data.deuterium??'');
                        text_bits.push(data.Battlecruiser??'');
                        text_bits.push(data.Battleship??'');
                        text_bits.push(data.Bomber??'');
                        text_bits.push(data.Cruiser??'');
                        text_bits.push(data.Destroyer??'');
                        text_bits.push(data["Espionage Probe"]??'');
                        text_bits.push(data["Heavy Fighter"]??'');
                        text_bits.push(data["Large Cargo"]??'');
                        text_bits.push(data["Light Fighter"]??'');
                        text_bits.push(data.Pathfinder??'');
                        text_bits.push(data.Reaper??'');
                        text_bits.push(data["Small Cargo"]??'');

                        let button = "<gradient-button sq28=\"\"> \
<button class=\"custom_btn overlay tooltip msgCopyBtn\" \
data-message-id=\""+(data.id??"")+"\" \
data-overlay-title=\"copy data\" \
data-tooltip-title=\"copy message data\" \
onclick=\"navigator.clipboard.writeText('"+text_bits.join("\t")+"');this.querySelector('img').src='https://gf3.geo.gfsrv.net/cdn55/04be50e8afc747846a55a646381a16.png';\" \
> \
<img src=\"/cdn/img/icons/basic/edit.png\" style=\"width:20px;height:20px;\"> \
</button> \
</gradient-button>";
                        const buttons_holder = msg.querySelector(`message-footer-actions`);
                        buttons_holder.innerHTML+=button;
                    });
                }

                function processBattles() {
                    const dict = {
                        "202": "Small Cargo",
                        "203": "Large Cargo",
                        "204": "Light Fighter",
                        "205": "Heavy Fighter",
                        "206": "Cruiser",
                        "207": "Battleship",
                        "208": "Colony Ship",
                        "209": "Recycler",
                        "210": "Espionage Probe",
                        "211": "Bomber",
                        "212": "Solar Satellite",
                        "213": "Destroyer",
                        "214": "Deathstar",
                        "215": "Battlecruiser",
                        "217": "Crawler",
                        "218": "Reaper",
                        "219": "Pathfinder",
                        "401": "Rocket Launcher",
                        "402": "Light Laser",
                        "403": "Heavy Laser",
                        "404": "Gauss Cannon",
                        "405": "Ion Cannon",
                        "406": "Plasma Turret",
                        "407": "Small Shield Dome",
                        "408": "Large Shield Dome",
                        "502": "Anti-Ballistic Missiles",
                        "503": "Interplanetary Missiles"
                    };
                    const messages = document.querySelectorAll(`.msg`);
                    messages.forEach((msg) => {
                        const id = msg.dataset.msgId;
                        const rawData = msg.querySelector(`.rawMessageData`);
                        if (rawData.dataset.rawMessagetype != "25") return;
                        const result = JSON.parse(rawData.dataset.rawResult??"false");
                        const combat = JSON.parse(rawData.dataset.rawCombatrounds??"false");
                        if(result) {
                            const debris = result.debris;
                            const resources = debris.resources;

                            const data = {
                            };

                            resources.forEach(resource=>{
                                data[resource.resource] = resource.total;
                            });

                            if(combat && combat.length>0) {
                                let lastRound = combat.pop();
                                let fleets = lastRound.fleets;
                                fleets.forEach(fleet=>{
                                    if(fleet.side === "defender") {
                                        const technologies = fleet.technologies??[];
                                        technologies.forEach(tech=>{
                                            if(tech.destroyedTotal>0) {
                                                data[dict[tech.technologyId]] = -1*tech.destroyedTotal;
                                            }
                                        });
                                    }
                                });
                            }

                            const text_bits = [];
                            text_bits.push(data.metal??'');
                            text_bits.push(data.crystal??'');
                            text_bits.push(data.deuterium??'');
                            text_bits.push(data.Battlecruiser??'');
                            text_bits.push(data.Battleship??'');
                            text_bits.push(data.Bomber??'');
                            text_bits.push(data.Cruiser??'');
                            text_bits.push(data.Destroyer??'');
                            text_bits.push(data["Espionage Probe"]??'');
                            text_bits.push(data["Heavy Fighter"]??'');
                            text_bits.push(data["Large Cargo"]??'');
                            text_bits.push(data["Light Fighter"]??'');
                            text_bits.push(data.Pathfinder??'');
                            text_bits.push(data.Reaper??'');
                            text_bits.push(data["Small Cargo"]??'');

                            let button = "<gradient-button sq28=\"\"> \
<button class=\"custom_btn overlay tooltip msgCopyBtn\" \
data-message-id=\""+(data.id??"")+"\" \
data-overlay-title=\"copy data\" \
data-tooltip-title=\"copy message data\" \
onclick=\"navigator.clipboard.writeText('"+text_bits.join("\t")+"');this.querySelector('img').src='https://gf3.geo.gfsrv.net/cdn55/04be50e8afc747846a55a646381a16.png';\" \
> \
<img src=\"/cdn/img/icons/basic/edit.png\" style=\"width:20px;height:20px;\"> \
</button> \
</gradient-button>";
                            const buttons_holder = msg.querySelector(`message-footer-actions`);
                            buttons_holder.innerHTML+=button;
                        }
                    });
                }

                function cleanupExpos() {

                }

                function cleanupBattles() {

                }
            }
            break;
        case "?page=ingame&component=galaxy":
            {
                const galaxyIntervalId = setInterval(GalaxyPageTracker, 1000);

                function timeDifference(timestamp) {
                    const now = Date.now(); // Get current timestamp in milliseconds
                    const diffInMs = now - timestamp*1000;

                    const seconds = Math.floor(diffInMs / 1000);
                    const minutes = Math.floor(seconds / 60);
                    const hours = Math.floor(minutes / 60);

                    if (hours < 1) {
                        return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
                    } else if (hours < 24) {
                        return `${hours} hour${hours > 1 ? 's' : ''} ago`;
                    } else {
                        // Format for days, weeks, etc. as needed
                        return new Date(timestamp).toLocaleDateString(); // Or format based on your preference
                    }
                }

                function GalaxyPageTracker() {
                    const galaxy = document.getElementById('galaxy_input').value;
                    const system = document.getElementById('system_input').value;
                    const address = galaxy+":"+system+":16";
                    const wildernessRow = document.getElementById('galaxyRow16');
                    let depletionInfo = wildernessRow.querySelector(`#depletionInfo`);
                    if(!depletionInfo) {
                        let holder = wildernessRow.querySelector(`h3.title.float_left`).parentNode;
                        holder.style.flexDirection = 'column';
                        holder.style.alignItems = 'stretch';
                        holder.style.flex
                        depletionInfo = document.createElement('p');
                        depletionInfo.id = "depletionInfo";
                        depletionInfo.classList.add("float_left");
                        depletionInfo.style.marginLeft = '10px';
                        holder.appendChild(depletionInfo);
                    }
                    let depletionData = depletionStats[address];
                    depletionInfo.innerHTML = "<b>Depletion:"+(depletionData?depletionData.depletion+" ("+timeDifference(depletionData.timestamp)+")":"Unknown")+"</b>";
                }
            }
            break;
    }
})();
