import { utils } from "../modules/utils";
import { animate } from "motion";

const config = {
    isShotMode: false,
    startCardId: 0,
    autoPlayInterval: 3000,
};

export default function createFeedSlider(sliderContainer, items, options = {}) {



    function bindPointerEvents() {

        slider.addEventListener("pointercancel", (e) => {
            console.log("Pointer cancel event fired!!!");
            console.log(e);
        });

        /* Autopay events
        **********************************/
        slider.addEventListener("pointerenter", (e) => {
            // console.log("pointerEnter");
            stopAutoplay();
        });

        slider.addEventListener("pointerleave", (e) => {
            // console.log("pointerLeave");
            if (e.pointerType === "touch") {
                startAutoplay(config.autoPlayInterval * 2);
            } else {
                startAutoplay();
            }
        });


        /* Document visibility change
        **********************************/
        document.addEventListener("visibilitychange", (e) => {
            console.log(document.visibilityState);
            if (document.visibilityState === "visible") {
                startAutoplay(config.autoPlayInterval / 2);
            } else {
                stopAutoplay();
            }
        });
    }

    ///

    if (document.visibilityState === "visible") {
        // Autoplay
        startAutoplay();
    }

}


function startAutoplay(timeout) {
    clearTimeout(autoPlayTimeoutId);

    if (config.autoPlay && cards.length > 1) {
        autoplay(timeout || config.autoPlayInterval);
    }
}

function autoplay(timeout) {
    clearTimeout(autoPlayTimeoutId);

    autoPlayTimeoutId = setTimeout(() => {
        nextCard(true);
        autoplay();
    }, timeout || config.autoPlayInterval);
}

function stopAutoplay() {
    clearTimeout(autoPlayTimeoutId);
}