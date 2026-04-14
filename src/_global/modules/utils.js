/* Make Clickables
 ********************************/

function makeClickable(elements, localClickTag) {
    let clickURL = localClickTag ?? "/";

    // Do once?
    if (window.clickTag && typeof window.clickTag === "string" && window.clickTag.length > 5) {
        clickURL = window.clickTag;
    }

    let globalClickArea = document.querySelector("#global-click-area");

    if (!globalClickArea) {
        globalClickArea = document.createElement("a");
        globalClickArea.id = "global-click-area";
        globalClickArea.setAttribute("target", "_blank");
        globalClickArea.setAttribute("href", clickURL);
        globalClickArea.style.cssText = "position:absolute; left:0; top:0; right:0; bottom:0; z-index:-1;"; // pointer-events:none;
        globalClickArea.addEventListener("click", (e) => {
            e.stopPropagation();
        });
        document.querySelector("#animation_container").prepend(globalClickArea);
    } else {
        // Already added
        if (globalClickArea.getAttribute("href").toLowerCase() != clickURL.toLowerCase()) {
            // clickURL changed? Something strange...
            // NO WAY!
            return;
        }
    }

    let nodes2Process;

    if (typeof elements === "string") {
        nodes2Process = [...document.querySelectorAll(elements)];
    } else if (elements instanceof Element) {
        nodes2Process = [elements];
    } else if (elements instanceof NodeList) {
        nodes2Process = [...elements];
    } else {
        return;
    }

    nodes2Process.forEach((element) => {
        if (element.tagName.toLowerCase() === "a") {
            element.setAttribute("draggable", false);
            element.setAttribute("target", "_blank");
            element.setAttribute("href", clickURL);
        } else {
            element.classList.toggle("clickable", true);
            element.onclick = (e) => {
                e.stopPropagation();
                globalClickArea.click();
            };
        }
    });
}


function clearClickable(elements) {

    let nodes2Process;

    if (typeof elements === "string") {
        nodes2Process = [...document.querySelectorAll(elements)];
    } else if (elements instanceof Element) {
        nodes2Process = [elements];
    } else if (elements instanceof NodeList) {
        nodes2Process = [...elements];
    } else {
        return;
    }

    nodes2Process.forEach((element) => {
        if (element.tagName.toLowerCase() === "a") {
            element.removeAttribute("href");
        } else {
            element.classList.toggle("clickable", false);
            element.onclick = undefined;
        }
    });
}


function setGlobalClickUrl(clickURL) {

    clickURL ??= (window.clickTag && typeof window.clickTag === "string" && window.clickTag.length > 5) ? window.clickTag : "/";

    // console.log(clickURL);

    let globalClickArea = document.querySelector("#global-click-area");

    if (!globalClickArea) {
        globalClickArea = document.createElement("a");
        globalClickArea.id = "global-click-area";
        globalClickArea.setAttribute("target", "_blank");
        globalClickArea.setAttribute("href", clickURL);
        globalClickArea.style.cssText = "display:block; background:transparent; position:absolute; inset:0; z-index:10000;"; // pointer-events:none;
        globalClickArea.addEventListener("click", (e) => {
            e.stopPropagation();
        });
        document.querySelector("#animation_container").prepend(globalClickArea);
    } else {
        // Already added
        if (globalClickArea.getAttribute("href").toLowerCase() != clickURL.toLowerCase()) {
            // clickURL changed, replace...
            globalClickArea.setAttribute("href", clickURL);
            return;
        }
    }
}



function shuffle(array) {
    if (Array.isArray(array)) {
        for (let i = array.length - 1; i > 0; i--) {
            let j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }
}

function clamp(num, min, max) {
    return Math.min(Math.max(num, min), max);
}

// Sign matters
function modulo(num, div) {
    return ((num % div) + div) % div;
}

// Debounce
function debounce(callback, wait = 150) {
    let timeoutId = null;
    return (...args) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
            callback.apply(null, args);
        }, wait);
    };
}

// https://stackoverflow.com/a/69459511

const getPropByPath = (obj, path) =>
    path.split(".").reduce((r, k) => r?.[k], obj);

// const setPropByPath = (obj, path, value) => {
//   if (path == "") return value;

//   const [k, next] = path.split({
//     [Symbol.split](s) {
//       const i = s.indexOf(".")
//       return i == -1 ? [s, ""] : [s.slice(0, i), s.slice(i + 1)]
//     }
//   });

//   if (obj !== undefined && typeof obj !== "object")
//     throw Error(`cannot set property ${k} of ${typeof obj}`);

//   return Object.assign(
//     obj ?? (/^\d+$/.test(k) ? [] : {}),
//     { [k]: setPropByPath(obj?.[k], next, value) }
//   );
// }

/*
// build data from previous example
const mydata = set({}, "a.b", [
  0,
  set({}, "c.d", ["hello", "world"])
])

// print checkpoint
console.log(JSON.stringify(mydata, null, 2))

// set additional fields
set(mydata, "a.b.1.c.d.1", "moon")
set(mydata, "a.b.1.w", "x.y.z")

// ensure changes
console.log(JSON.stringify(mydata, null, 2))
*/

function setPropByPath(obj = {}, key, val) {
    const keys = key.split('.');
    const last = keys.pop();
    keys.reduce((o, k) => o[k] ??= {}, obj)[last] = val;
}

const capitalize = s => (s && s[0].toUpperCase() + s.slice(1)) || "";

function applyRteStyles(container, styles) {
    if (!container || !styles) return;
    // clear all
    // textContainer.removeAttribute("style");
    console.log("applyRteStyles / ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~");
    for (const prop in styles) {
        console.log(prop);

        if (prop == "font") {
            // Clear font face classes (.heading, .body, .other)
            container.classList.toggle("heading", styles[prop] == "heading");
            container.style.setProperty(`--rte-font-family`, `var(--brand-font-${styles[prop]}-family)`); // fallback -> --brand-font-heading-family
        } else {
            // if data.style[prop] ?
            // color, weight, transform and style
            container.style.setProperty(`--rte-font-${prop}`, styles[prop]);
        }
    }
    console.log("applyRteStyles / End ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~");
}


function imagePreloader(fallbackImage) {

    const preloadImg = (imageSource) =>
        new Promise((resolve, reject) => {

            let img;

            if (imageSource instanceof HTMLImageElement) {
                img = imageSource;

                if (!img.complete) {
                    img.onload = resolve.bind(null, img);
                    img.onerror = img.onabort = reject.bind(null, img);
                } else if (img.naturalHeight) {
                    resolve(img);
                } else {
                    reject(img);
                }

            } else if (typeof imageSource === 'string') {
                img = new Image();
                img.onload = resolve.bind(null, img);
                img.onerror = img.onabort = reject.bind(null, img);
                img.src = imageSource;
            }
        });


    const preload = (...srcs) => Promise.allSettled(
        srcs.flat().map(
            imageSource =>
                preloadImg(imageSource).catch(
                    brokenImage => {
                        if (fallbackImage) {
                            return preloadImg(fallbackImage)
                                .then(
                                    fallbackImage => {
                                        // brokenImage.setAttribute('data-fail-src', brokenImage.src);
                                        // brokenImage.src = fallbackImage.src;
                                        brokenImage.remove();
                                        return fallbackImage;
                                    },
                                    () => Promise.reject(brokenImage)
                                );
                        }

                        return Promise.reject(brokenImage);
                    }
                )
        )
    );

    const cancel = (x) => {
        //
    };

    return {
        preload
    };

}

const utils = {
    shuffle,
    clamp,
    modulo,
    debounce,
    getPropByPath,
    setPropByPath,
    capitalize,
    applyRteStyles
};

export {
    makeClickable,
    clearClickable,
    setGlobalClickUrl,
    imagePreloader,
    applyRteStyles,
    utils
};
