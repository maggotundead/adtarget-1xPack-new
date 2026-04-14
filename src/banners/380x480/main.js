import { getConfig, listenForConfigChanges } from "@global/modules/config";
import getFeedData from "@global/modules/data";
import makeBrand from "@global/modules/brand";
import { makeClickable, setGlobalClickUrl, imagePreloader, applyRteStyles, utils } from "@global/modules/utils";
import * as configEvents from "@global/modules/pubsub.js";

import { timeline, animate, stagger } from "motion";

const imageLoader = imagePreloader('./img/no-logo.svg');

const configUrl = "config.json?" + Math.floor(Date.now() / 1000);

// Click URL for testing!
const localClickTag = "https://adtarget.me/";

let brand, config;
let feedData = [];

let isInited = false;
let isStarted = false;

// SLIDER holder
let SLIDER;
let autoPlayInterval = 3000;

let pauseOnHover = false;
let isHovered = false;

let msgPerItemsNum;
let msgPerLoop;
let startWithMessage;

let isDesignMode;

// Call init only once
window.init = async function (e) {

    if (isInited) return;
    isInited = true;

    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    isDesignMode = urlParams.has("designMode");

    /* 1. Load and process config
    =======================================================*/
    config = await getConfig(configUrl);
    if (!config) {
        console.warn("No config. Can not continue :(");
        return;
    }
    // console.log(config);


    /* 2. Get Data if required
    =======================================================*/
    if (config.data) {
        feedData = await getFeedData(config.data);
        // console.log(feedData);
    }

    /* 3. Create brand
    AND Subscribe to brand changes
    =======================================================*/

    brand = makeBrand(config.brand);

    /* 4. Build creative with initial or changed data
    =======================================================*/
    prepareStart();

    /* 5. Start listening for config changes
    =======================================================*/
    listenForConfigChanges();

    /* 6. Start
    =======================================================*/

    // If in design/composition environment...
    if (isDesignMode) {
        // ...wait for first post message.
        configEvents.subscribe("brand", (data) => {
            if (!isStarted) {
                startAd();
            }
        });
    } else {
        startAd();
    }

};

function prepareStart() {

    // In case of restart
    // configEvents.clearAllSubscriptions();

    /* Background
    *****************************************************/

    handleBgImage(config.settings?.commonSettings?.bgImageUrl);
    function handleBgImage(url) {
        document.documentElement.style.setProperty("--bg-image-url", `url(${url})`); // Relative to style file
    }
    configEvents.subscribe("settings.commonSettings.bgImageUrl", handleBgImage);


    // OVERLAY
    // configEvents.subscribe("settings.commonSettings.bgOverlay", (show) => {
    //     document.querySelector("body > .layout").classList.toggle("overlay", show);
    // });
    // configEvents.publish("settings.commonSettings.bgOverlay", config.settings?.commonSettings?.bgOverlay);

    // configEvents.subscribe("settings.commonSettings.bgOverlayBlendMode", (mode) => {
    //     document.querySelector("body > .layout").style.setProperty("--bg-overlay-mode", mode);
    // });
    // configEvents.publish("settings.commonSettings.bgOverlayBlendMode", config.settings?.commonSettings?.bgOverlayBlendMode);


    // SLIDER

    // Slider swap interval
    configEvents.subscribe("settings.feedSettings.eventSwapInterval", (timeSec) => {
        autoPlayInterval = timeSec * 1000;
        console.log(`Event swap interval changed to ${autoPlayInterval}`);
    });
    configEvents.publish("settings.feedSettings.eventSwapInterval", config.settings?.feedSettings?.eventSwapInterval);

    //
    configEvents.subscribe("settings.feedSettings.msgPerItemsNum", (n) => {
        msgPerItemsNum = Number(n);
    });
    configEvents.publish("settings.feedSettings.msgPerItemsNum", config.settings?.feedSettings?.msgPerItemsNum);

    //
    configEvents.subscribe("settings.feedSettings.msgPerLoop", (flag) => {
        msgPerLoop = flag;
        if (flag) {
            msgPerItemsNum = feedData.length;
        }
        SLIDER?.reset();
    });
    configEvents.publish("settings.feedSettings.msgPerLoop", config.settings?.feedSettings?.msgPerLoop);

    //
    configEvents.subscribe("settings.feedSettings.startWithMessage", (flag) => {
        startWithMessage = flag;
        SLIDER?.reset();
    });
    configEvents.publish("settings.feedSettings.startWithMessage", config.settings?.feedSettings?.startWithMessage);

    // Slider pause on hover
    configEvents.subscribe("settings.feedSettings.pauseOnHover", (pause) => {
        pauseOnHover = pause;
        console.log(`Event slider should pause on hover: ${pause}`);
    });
    configEvents.publish("settings.feedSettings.pauseOnHover", config.settings?.feedSettings?.pauseOnHover);



    /* Replace texts...
    *****************************************************/

    // Primary Message
    handlePrimaryMessage(config.settings?.commonSettings?.primaryMessage);

    function handlePrimaryMessage(data) {

        const msg = document.querySelector(".message > .rte");

        if (data?.text) {
            msg.innerHTML = data.text;
        }

        if (data?.style) {
            applyRteStyles(msg, data.style);
        }
    }

    // Listen to change
    configEvents.subscribe("settings.commonSettings.primaryMessage", handlePrimaryMessage);


    // CTA Button(s)
    handleCtaButton(config.settings?.commonSettings?.ctaButton);

    function handleCtaButton(data) {
        if (!data?.text) return;

        const buttons = document.querySelectorAll(".cta-btn");
        buttons.forEach(btn => {
            btn.querySelector(".text").innerHTML = data.text;
        });
    }

    // Listen to change
    configEvents.subscribe("settings.commonSettings.ctaButton", handleCtaButton);


    //-----------------------------------------------------------------------

    // Legal settings
    manageLegalSettings(config.settings?.legalSettings);

    function manageLegalSettings(data) {

        const legalBlock = document.querySelector(".legal-block");

        if (data?.showLegal) {
            // Show legal block
            // legalBlock.classList.toggle("hidden", false);

            const legatTextBlock = legalBlock.querySelector(".legal-note");
            legatTextBlock.innerHTML = data.legalNote.text;

            const ageIcon = legalBlock.querySelector(".age-icon");

            if (data.minAge && parseInt(data.minAge) > 0) {
                ageIcon.removeAttribute("hidden");
                ageIcon.textContent = data.minAge;
            } else {
                // Hide Icon
                ageIcon.setAttribute("hidden", "");
            }
        } else {
            // Hide legal block
            // legalBlock.classList.toggle("hidden", true);
        }
        SLIDER?.reset();
    }
    configEvents.subscribe("settings.legalSettings", manageLegalSettings);


    /* FEED DATA Handling
    ==================================================================*/

    function handleFeedData(data) {
        console.log("~~~~ FEED data changed! ~~~~");

        getFeedData(data).then(data => {
            feedData = data; // Make a Copy?
            // console.log(feedData);
            if (msgPerLoop) {
                msgPerItemsNum = feedData.length;
            }

            SLIDER?.reset();
        });
    }
    configEvents.subscribe("data", handleFeedData);


    /* Screenshot mode
    ===========================================*/
    function handleShotModeChange(animate) {
        console.log("~~~~ Handle shot mode change! ~~~~");
        console.log("~~~~ Animation changed to " + animate);

        document.documentElement.classList.toggle("still", !animate);
        document.getElementById("animation_container").classList.remove("screenshot-ready", "last-item");

        SLIDER?.reset();
    }
    configEvents.subscribe("animation", handleShotModeChange);

    /* Some other preparation...
    =====================================================*/

    // Disabe context menu
    window.addEventListener(
        "contextmenu",
        (e) => {
            e.preventDefault();
            e.stopPropagation();
        },
        true
    );

    // Disable default browser dragability
    document.querySelectorAll("a, img").forEach((element) => {
        element.setAttribute("draggable", false);
    });

}


async function startAd() {

    console.log("Starting... / ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~");

    if (isStarted) return;
    isStarted = true;


    /* Click handling
     *****************************************************/
    // makeClickable(".clickable", localClickTag);

    // setGlobalClickUrl();


    // Preload BG Image. Do it only once!
    await imageLoader.preload(config.settings.commonSettings.bgImageUrl);

    // document.documentElement.classList.add("ready");
    // return;

    // Prepare slider
    SLIDER = createFeedSlider();

    // SCREENSHOT Mode / Switch without animation
    //----------------------------------------------------------
    window.nextItem = function () {
        if (config.animation === false) {
            SLIDER?.nextItem();
        }
    };

    if (config.animation === false) {
        document.documentElement.classList.add("still");
    }

    let adWrapper = document.getElementById("animation_container");

    /* Autopay events
    **********************************/
    adWrapper.addEventListener("pointerenter", (e) => {

        if (config.animation === false) return;

        isHovered = true;

        if (pauseOnHover) {
            SLIDER?.stopAutoplay();
        }
    });

    adWrapper.addEventListener("pointerleave", (e) => {

        if (config.animation === false) return;

        isHovered = false;

        if (pauseOnHover) {
            SLIDER?.startAutoplay();
        }
    });


    document.documentElement.classList.add("ready");
}


/* SLIDER
*********************************************************************/
function createFeedSlider() {

    const feedItemsContainer = document.querySelector("main");

    // const feedItemContainer = document.querySelector(".feed-item");
    // const matchWrapper = document.querySelector(".match-wrapper");

    let currentItemId,
        nextItemId;

    let autoPlayTimeoutId;

    let showedOnce = false;
    let isNextReady = false;
    let isAnimating = false;

    let msgPerItemsCount = 0;
    let have2ShowMessage = false;
    let isMessageShowed = false;

    let loopCount = 0;
    let have2ShowLegal = false;
    let isLegalShowed = false;

    let showAnimationControl,
        hideAnimationControl;

    function _reset() {

        clearTimeout(autoPlayTimeoutId);

        showAnimationControl?.playState && showAnimationControl.cancel();
        hideAnimationControl?.playState && hideAnimationControl.cancel();

        showedOnce = false;
        isNextReady = false;
        isAnimating = false;

        msgPerItemsCount = startWithMessage ? msgPerItemsNum : 0;
        have2ShowMessage = false;
        isMessageShowed = false;
        document.querySelectorAll(".message").forEach(msg => {
            msg.classList.toggle("hidden", true);
            msg.classList.toggle("active", false);
        });


        loopCount = 0;
        have2ShowLegal = false;
        isLegalShowed = false;
        document.querySelectorAll(".legal-block").forEach(legal => legal.classList.toggle("hidden", true));


        // Remove ALL nodes
        feedItemsContainer.querySelectorAll(".feed-item").forEach(i => i.remove()); // Nodelist is iterable
        // Array.from(matchWrapper.children).forEach(i => i.remove()); // htmlCollection is NOT


        if (feedData.length < 1) {
            // No FEED data, show message
            // feedItemsContainer.innerHTML = '<h1 class="error">NO FEED ITEMS</h1>';
            return;
        } else {
            currentItemId = feedData.length - 1;
            nextItemId = 0;

            if (config.animation === false) {
                nextItem();
            } else {
                startAutoplay(0);
            }
        }

    }

    _reset();

    const reset = utils.debounce(_reset);


    // SHOW Sequence
    const showSequence = [
        [
            "[data-is-next='true'] .date-time",
            { opacity: [0, 1] },
            { duration: 0.25 }
        ],
        [
            "[data-is-next='true'] .date-time > .date",
            {
                // opacity: [0, 1],
                x: [-50, 0]
            },
            {
                duration: 0.25,
                easing: "ease-out",
                at: "<"
            }
        ],
        [
            "[data-is-next='true'] .date-time > .time",
            {
                // opacity: [0, 1],
                x: [50, 0]
            },
            {
                duration: 0.25,
                easing: "ease-out",
                at: "<"
            }
        ],

        [
            "[data-is-next='true'] .team.team1",
            {
                opacity: [0, 1],
                x: ["100%", 0]
            },
            {
                duration: 0.5,
                easing: [0.33, 1, 0.68, 1],
                at: "-0.2"
            }
        ],
        [
            "[data-is-next='true'] .team.team2",
            {
                opacity: [0, 1],
                x: ["-100%", 0]
            },
            {
                duration: 0.5,
                easing: [0.33, 1, 0.68, 1],
                at: "<"
            }
        ],

        [
            "[data-is-next='true'] .odds > span",
            {
                opacity: [0, 1],
                // y: ["1em", 0]
            },
            {
                at: "-0.25",
                duration: 0.3,
                delay: stagger(0.1),
                easing: "ease-in",
                // y: {
                //     easing: [0.34, 1.56, 0.64, 1]
                // }
            }
        ],

        [
            ".cta-btn",
            {
                scale: [1, 1.3, 0.9, 1.05, 1]
            },
            {
                duration: 0.8,
                times: [0, 0.3, 0.5, 0.8, 1],
                easing: "ease-out",
                delay: 0.5
            }
        ]
    ];

    // HIDE Sequence
    const hideSequence = [
        [
            "[data-is-next='false'] .date-time",
            { opacity: [1, 0] },
            {
                duration: 0.3,
                easing: "ease-in"
            }
        ],
        [
            "[data-is-next='false'] .odds",
            {
                opacity: [1, 0],
            },
            {
                at: "-0.2",
                duration: 0.3,
                easing: "ease-in",
            }
        ],

        [
            "[data-is-next='false'] .team.team1",
            {
                opacity: [1, 0],
                x: [0, "-100%"]
            },
            {
                duration: 0.5,
                easing: [0.32, 0, 0.67, 0],
                at: "-0.2"
            }
        ],
        [
            "[data-is-next='false'] .team.team2",
            {
                opacity: [1, 0],
                x: [0, "100%"]
            },
            {
                duration: 0.5,
                easing: [0.32, 0, 0.67, 0],
                at: "<"
            }
        ],
    ];

    // Message sequences
    const msgShowSequence = [
        [
            '.coin',
            {
                y: [-250, 0, -20, 0, -10, 0],
                opacity: [0, 1, 1, 1, 1, 1],
            }, {
                duration: 0.4,
                delay: stagger(0.2, { from: "last" }),
                easing: "ease-in",
            }
        ],
        [
            ".message",
            {
                opacity: [0, 1],
                x: ["100%", 0]
            },
            {
                duration: 0.5,
                easing: [0.33, 1, 0.68, 1],
                at: "-0.5"
            }
        ],
        [
            ".cta-btn",
            {
                scale: [1, 1.3, 0.9, 1.05, 1]
            },
            {
                duration: 0.8,
                times: [0, 0.3, 0.5, 0.8, 1],
                easing: "ease-out",
                delay: 0.5
            }
        ],
    ];

    const msgHideSequence = [
        [
            '.coin',
            {
                opacity: [1, 0],
                y: [0, 250]
            },
            {
                duration: 0.2,
                delay: stagger(0.05, { from: "last" }),
                easing: "ease-in"
            }
        ],

        [
            ".message",
            {
                opacity: [1, 0],
                x: [0, "-100%"]
            },
            {
                duration: 0.5,
                easing: [0.32, 0, 0.67, 0],
            }
        ]
    ];

    // Legal sequences
    const legalShowSequence = [
        [
            ".legal-block",
            {
                opacity: [0, 1],
                // x: ["100%", 0]
            },
            {
                duration: 0.5,
                easing: [0.33, 1, 0.68, 1],
            }
        ]
    ];

    const legalHideSequence = [
        [
            ".legal-block",
            {
                opacity: [1, 0],
                // x: [0, "-100%"]
            },
            {
                duration: 0.5,
                easing: [0.32, 0, 0.67, 0],
            }
        ]
    ];


    async function prepareNextItem(itemId) {

        if (feedData.length < 1) return;

        console.log("Prepare next Item...");

        nextItemId = itemId ?? currentItemId < feedData.length - 1 ? currentItemId + 1 : 0;

        let startTime = performance.now();

        await mountNewItem(feedData[nextItemId]);

        // Calc loadind time
        return performance.now() - startTime;
    }

    async function mountNewItem(item) {

        // Item node
        const feedItemNode = document.createElement("div");
        feedItemNode.className = "feed-item hidden";
        feedItemNode.dataset.isNext = true;

        // preload images
        const teamsLogos = await imageLoader.preload(item.team1LogoUrl, item.team2LogoUrl);

        const team1Logo = document.createElement("div");
        team1Logo.className = "team-logo team1";
        teamsLogos[0].value.setAttribute("draggable", false);
        teamsLogos[0].value.setAttribute("alt", item.team1Name);
        team1Logo.append(teamsLogos[0].value);

        const team2Logo = document.createElement("div");
        team2Logo.className = "team-logo team2";
        teamsLogos[1].value.setAttribute("draggable", false);
        teamsLogos[1].value.setAttribute("alt", item.team2Name);
        team2Logo.append(teamsLogos[1].value);

        // Data (date, odds)
        const dataNode = document.createElement("div");
        dataNode.className = "data heading";
        dataNode.innerHTML =
            `<div class="date-time">
                <span class="date">${item.date}</span>
                <span class="time">${item.time}</span>
            </div>
            <div class="odds">
                <span class="home">${item.home}</span>
                <span class="draw">${item.draw}</span>
                <span class="away">${item.away}</span>
            </div>`;

        // Teams
        const team1Node = document.createElement("div");
        team1Node.className = "team team1";
        team1Node.innerHTML =
            `<div class="team-name"><h2>${item.team1Name}</h2></div>`;
        team1Node.append(team1Logo);

        const team2Node = document.createElement("div");
        team2Node.className = "team team2";
        team2Node.innerHTML =
            `<div class="team-name"><h2>${item.team2Name}</h2></div>`;
        team2Node.prepend(team2Logo);

        feedItemNode.append(team1Node, dataNode, team2Node);

        feedItemsContainer.append(feedItemNode);
    }


    function startAutoplay(timeout) {

        clearTimeout(autoPlayTimeoutId);

        if (feedData.length < 1) {
            return;
        }

        if (!isAnimating) {

            if (!isNextReady) {
                autoplay(timeout ?? autoPlayInterval);
            } else {
                autoPlayTimeoutId = setTimeout(() => {
                    showNextItem();
                }, timeout ?? autoPlayInterval / 2);
            }
        }
    }

    async function autoplay(timeout) { // timeout msec

        clearTimeout(autoPlayTimeoutId);

        let interval = timeout ?? autoPlayInterval;
        let nextTimeout = interval;

        if (!isNextReady) {

            let prepTime = await prepareNextItem();
            nextTimeout = prepTime >= interval ? 0 : interval - prepTime;
            isNextReady = true;

        }

        console.log("Next Item ready!");

        if (!showedOnce) {

            console.log("First show after feed update...");
            showNextItem();
            showedOnce = true;

        } else if ((!pauseOnHover || !isHovered)) {

            console.log(`Will show in ${nextTimeout} msec...`);
            autoPlayTimeoutId = setTimeout(() => {
                showNextItem();
            }, nextTimeout);

        } else {
            console.log(`Slider is paused`);
        }
    }

    function stopAutoplay() {
        clearTimeout(autoPlayTimeoutId);
    }


    function showNextItem() {

        if (isAnimating) return;


        if (config.settings?.legalSettings?.showLegal && config.animation && !have2ShowLegal && loopCount >= feedData.length) {
            // Legal
            console.log("Time to show Legal");
            have2ShowLegal = true;
        }

        if (config.animation && !have2ShowMessage && msgPerItemsCount >= msgPerItemsNum) {
            // Message
            console.log("Time to show MESSAGEEEEEEEE!!!");
            have2ShowMessage = true;
        }

        // Priority. If startWithMessage - legal, else - message

        if (have2ShowLegal || have2ShowMessage) {

            if (have2ShowLegal && have2ShowMessage && startWithMessage) {
                // Legal Win!
                have2ShowMessage = false;
                loopCount = 0;
                document.querySelectorAll('.legal-block').forEach(e => e.classList.remove("hidden"));
            } else if (have2ShowMessage) {
                // Message Win!
                have2ShowLegal = false;
                msgPerItemsCount = 0;
                document.querySelectorAll('.message').forEach(e => e.classList.remove("hidden"));
            } else {
                // Legal
                have2ShowMessage = false;
                loopCount = 0;
                document.querySelectorAll('.legal-block').forEach(e => e.classList.remove("hidden"));
            }

        } else {
            // Feed item
            // remove .hidden class
            document.querySelectorAll('[data-is-next="true"]').forEach(e => e.classList.remove("hidden"));

            // Count...
            msgPerItemsCount++;
            loopCount++;
        }

        if (config.animation === false) {
            // Just delete prev nodes
            document.querySelectorAll('[data-is-next="false"]').forEach(e => e.remove());
            currentItemId = nextItemId;

        } else {

            isAnimating = true;

            console.log("----------------------------------------------");
            console.log(`Loop count: ${loopCount}`);
            console.log(`Msg per item count: ${msgPerItemsCount}`);
            console.log("----------------------------------------------");


            document.querySelectorAll(".cta-btn").forEach(btn => {
                btn.classList.remove("active");
            });

            // hideAnimationControl = isMessageShowed ? timeline(msgHideSequence) : timeline(hideSequence);
            hideAnimationControl = isLegalShowed ? timeline(legalHideSequence) : isMessageShowed ? timeline(msgHideSequence) : timeline(hideSequence);

            if (isMessageShowed) {
                document.querySelectorAll('.message').forEach(msg => msg.classList.toggle("active", false));
            }

            hideAnimationControl.finished.then((animationData) => {
                if (animationData) {

                    // animation has really finished this time
                    console.log("Hide finished");

                    if (isLegalShowed) {
                        isLegalShowed = false;
                        document.querySelectorAll('.legal-block').forEach(legal => legal.classList.toggle("hidden", true));
                    } else if (isMessageShowed) {
                        isMessageShowed = false;
                        document.querySelectorAll('.message').forEach(msg => msg.classList.toggle("hidden", true));
                    } else {
                        // Change current
                        currentItemId = nextItemId;
                        // Delete prev nodes
                        document.querySelectorAll('[data-is-next="false"]').forEach(e => e.remove());
                    }

                    // Set click URL
                    if ((have2ShowMessage && !isMessageShowed) || (have2ShowLegal && !isLegalShowed)) {
                        setGlobalClickUrl();
                    } else {
                        setGlobalClickUrl(feedData[currentItemId].link);
                    }
                }
            });

            showAnimationControl =
                (have2ShowLegal && !isLegalShowed) ?
                    timeline(legalShowSequence, {
                        delay: hideAnimationControl.duration * 0.75
                    }) :
                    (have2ShowMessage && !isMessageShowed) ?
                        timeline(msgShowSequence, {
                            delay: hideAnimationControl.duration * 0.75
                        }) :
                        timeline(showSequence, {
                            delay: hideAnimationControl.duration * 0.75
                        });

            showAnimationControl.finished.then((animationData) => {
                if (animationData) {
                    // animation has really finished this time
                    console.log("Show Finished!");

                    if (have2ShowLegal && !isLegalShowed) {
                        isLegalShowed = true;
                        have2ShowLegal = false;
                    }

                    if (have2ShowMessage && !isMessageShowed) {
                        isMessageShowed = true;
                        have2ShowMessage = false;
                        document.querySelectorAll('.message').forEach(msg => msg.classList.toggle("active", true));
                    }

                    if (!isMessageShowed && !isLegalShowed) {
                        // Showed. Not next now.
                        document.querySelectorAll('[data-is-next="true"]').forEach(e => e.dataset.isNext = false);
                        isNextReady = false;
                    }

                    isAnimating = false;

                    if (!isLegalShowed) {
                        document.querySelectorAll(".cta-btn").forEach(btn => {
                            btn.classList.add("active");
                        });
                    }

                    // Next Turn...
                    if (!pauseOnHover || !isHovered) {
                        // Show legal only for 1 second
                        isLegalShowed ? autoplay(1000) : autoplay();
                    }
                }
            });
        }
    }

    // SCREENSHOT Mode / Switch without animation
    //----------------------------------------------------------
    async function nextItem() {

        document.getElementById("animation_container").classList.remove("screenshot-ready", "last-item");

        // Prepare for delete...
        document.querySelectorAll('[data-is-next="true"]').forEach(e => e.dataset.isNext = false);

        await prepareNextItem();
        showNextItem();

        console.log("Ready for screenshot. Say cheeeeeeese :)");

        setTimeout(() => document.getElementById("animation_container").classList.add("screenshot-ready"), 500);
    };


    return {
        reset,
        startAutoplay,
        stopAutoplay,
        showNextItem,
        nextItem
    };

}

