import { generateColorScheme } from "./colors";
import { utils } from "./utils";
import * as configEvents from "@global/modules/pubsub.js";

export default function makeBrand(brand) {

  // Need complete reference object structure to correct control css custom properties 
  // Has to have all possible properties here

  const defaultFont = {
    styleUrl: null,
    body: {
      family: null,
      weight: null,
      style: null
    },
    heading: {
      family: null,
      weight: null,
      style: null
    }
  };

  for (let prop in defaultFont) {
    Object.prototype.toString.call(defaultFont[prop]) === '[object Object]' ?
      defaultFont[prop] = { ...defaultFont[prop], ...brand.font[prop] } :
      defaultFont[prop] = brand.font[prop];
  }


  function applyToCreative() {
    applyColorScheme();
    applyFontStyling();
    updateLogosInDom();
  }

  function applyColorScheme() {
    generateColorScheme(brand.color);
  }


  function applyFontStyling() {

    // console.log("~~~~~~~~~~~~ Default font OBJ ~~~~~~~~~~~~~~~~~~");
    // console.log(defaultFont);

    let fontCSS = document.head.querySelector("link[rel=stylesheet]#font");

    if (fontCSS) {

      // If font style already created

      if (brand.font?.styleUrl && (fontCSS.href != brand.font.styleUrl)) {
        // Update only if changed
        fontCSS.href = brand.font.styleUrl;
      } else if (defaultFont.styleUrl) {
        // No font URL -> revert to default
        fontCSS.href = defaultFont.styleUrl;
      } else {
        // remove font slyle link
        fontCSS.remove();
      }


    } else if (brand.font?.styleUrl || defaultFont.styleUrl) {

      // Create font style link

      fontCSS = document.createElement("link");
      fontCSS.type = "text/css";
      fontCSS.rel = "stylesheet";
      fontCSS.id = "font";

      fontCSS.href = brand.font.styleUrl || defaultFont.styleUrl;
      document.head.appendChild(fontCSS);

    }

    if (brand.font?.styleUrl) {
      // Got font from generator
    } else {
      // Generator can NOT set font porperties without styleUrl
      // So, revert to default
      brand.font = JSON.parse(JSON.stringify(defaultFont));
    }

    for (const fontArea in brand.font) {

      if (fontArea == "styleUrl") continue;

      for (const fontProp in brand.font[fontArea]) {
        if (brand.font[fontArea][fontProp] !== null) {
          document.documentElement.style.setProperty(`--brand-font-${fontArea}-${fontProp}`, brand.font[fontArea][fontProp]);
        } else {
          document.documentElement.style.removeProperty(`--brand-font-${fontArea}-${fontProp}`);
        }
      }
    }
  }



  // Automatic logo replacement in document
  function updateLogosInDom() {

    const logoWrapperSelector = ".brand-logo";
    const logoWrappers = document.querySelectorAll(logoWrapperSelector);

    logoWrappers.forEach((lw) => {
      // Remove current logo
      lw.querySelectorAll("img").forEach((img) => img.remove());

      // Get required logo type from data attributes
      let logoVariant = lw.dataset?.variant;
      let logoIsOnDark = lw.dataset?.surface == "dark" ? true : false;

      // Place new logo
      let logoImg = document.createElement("img");
      logoImg.src = getLogoUrl(logoVariant, logoIsOnDark);
      logoImg.onload = function () {
        logoImg.classList.add("loaded");
      };

      lw.appendChild(logoImg);
    });
  }

  // Get BRAND logo URL
  // To get required logo for generated content

  function getLogoUrl(variant = "landscape", isOnDark = false) {
    let logoVariants = ["portrait", "landscape", "brandmark"];

    if (!logoVariants.includes(variant)) {
      variant = "landscape";
      //throw new Error(`Invalid logo variant param: ${variant}. Accepts only ${logoVariants}`);
    }

    let on = isOnDark ? "onDark" : "onLight";
    let logoUrl = utils.getPropByPath(brand.logo, `${variant}.${on}`);

    // Got needed logo
    if (logoUrl) return logoUrl;

    // Fing nearest
    // 1. on same surface
    for (const v of logoVariants) {
      if (v == variant) continue;
      // console.log(`${v}.${on}`);
      logoUrl = utils.getPropByPath(brand.logo, `${v}.${on}`);
      if (logoUrl) return logoUrl;
    }

    // 2. On inverse surface
    on = on == "onDark" ? "onLight" : "onDark";
    // 2.1 same variant first
    logoUrl = utils.getPropByPath(brand.logo, `${variant}.${on}`);
    if (logoUrl) return logoUrl;

    // 2.2 other variants
    for (const v of logoVariants) {
      if (v == variant) continue;
      // console.log(`${v}.${on}`);
      logoUrl = utils.getPropByPath(brand.logo, `${v}.${on}`);
      if (logoUrl) return logoUrl;
    }

    // fall-back logo image
    // Has to be defined in some global scope
    return "no-image.svg";
  }

  applyToCreative();

  // Subscribe to brand changes
  configEvents.subscribe("brand.color", applyColorScheme);
  configEvents.subscribe("brand.font", applyFontStyling);
  configEvents.subscribe("brand.logo", updateLogosInDom);

  return {
    // applyToCreative,
    applyColorScheme,
    applyFontStyling,
    updateLogosInDom,
    // getLogoUrl
  };
}
