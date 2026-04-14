import { utils } from "./utils.js";
import * as configEvents from "@global/modules/pubsub.js";

let config;


// Config.json loading
async function loadConfig(configURL) {
  const response = await fetch(configURL);

  if (!response.ok) {
    throw new Error(`Config Request error: ${response.status} / ${response.statusText}`);
  }

  return await response.json().catch((e) => {
    throw new Error(`Config JSON error: ${e.message}`);
  });
}

async function getConfig(configURL) {
  config = await loadConfig(configURL).catch((error) => {
    console.error(error);
  });

  if (typeof config !== "undefined") {

    // Slim Settings. Remove items and value from obj
    config.settings = slimSettings(config.settings);
    console.log(config.settings);

    // FEED or Data list ?
    if (typeof config.data !== "undefined") {
      if (typeof config.data.list !== "undefined" && Array.isArray(config.data.list) && config.data.list.length > 0) {
        console.log(`Got DATA LIST from ${configURL}`);
        config.data = config.data.list.splice(0);
      } else if (typeof config.data.url !== "undefined" && typeof config.data.url === "string") {
        config.data = config.data.url.trim();
        console.log(`Got FEED URL: ${config.data}`);
      } else {
        config.data = undefined;
      }
    }
  }

  return config;
}

function slimSettings(s) {

  const sObj = {};

  for (let key in s) {
    // Settings Groups
    if (s[key].hasOwnProperty("items")) {
      // Subgroup
      sObj[key] = slimSettings(s[key].items);

    } else if (s[key].hasOwnProperty("value")) {
      // Field
      sObj[key] = s[key].value;
    } else {
      // UI settings
    }
  }
  return sObj;
}


/* Start listening for config changes
 =======================================================*/
function listenForConfigChanges() {

  window.addEventListener("message", (event) => {


    // settings.teaser.items.showSubHeader.value": false
    // settings.teaser.items.subHeader.items.primaryMsg.value.text: "Valentine’s day..."

    // One message
    // settings.teaser.items.subHeader.items.primaryMsg.value.style.font: "heading"
    // settings.teaser.items.subHeader.items.primaryMsg.value.style.style: null
    // settings.teaser.items.subHeader.items.primaryMsg.value.style.weight: null

    // console.log("~~~~ GOT MESSAGE: ", event.data);

    const groupedChanges = {};

    let keyPath, valPath;

    const excludePathSegments = [
      'items',
      'value'
    ];

    for (const prop in event.data) {

      const newValue = event.data[prop];
      const slimProp = prop.split(".").filter(segment => !excludePathSegments.includes(segment)).join(".");
      const previousValue = utils.getPropByPath(config, slimProp);

      // Branding specific
      // "desktop_height": 200,
      // "desktop_width": 1000,
      // "desktop_margin": 0 || "desktop_header": 0

      if (prop.startsWith("desktop_")) {

        console.log("~~~ // Branding layout changed");

        if (JSON.stringify(newValue) !== JSON.stringify(previousValue)) {
          // Set corresponding custom properties.

        }
        continue;
      }

      // JSON - for safety.
      // If value changed ...

      if (JSON.stringify(newValue) !== JSON.stringify(previousValue)) {

        let path = slimProp.split(".");
        let currentPath = path.shift();

        switch (currentPath) {

          case "brand":
            // Brand changed

            // ADD BRAND MUTATION HERE?

            // Set new value
            utils.setPropByPath(config, slimProp, newValue);

            currentPath += `.${path.shift()}`;
            groupedChanges[currentPath] ??= {};
            utils.setPropByPath(groupedChanges[currentPath], path.join("."), newValue);

            break;

          case "settings":

            // Set new value
            utils.setPropByPath(config, slimProp, newValue);

            // Collect and Group mutations. 
            [keyPath, valPath] = prop.split(/\.value\.?/); // Split by ".value"
            // remove .items segments
            keyPath = keyPath.split(".").filter(segment => segment != "items").join(".");

            if (valPath !== undefined) {
              if (valPath.length > 0) {
                groupedChanges[keyPath] ??= {};
                utils.setPropByPath(groupedChanges[keyPath], valPath, newValue);
              } else {
                groupedChanges[keyPath] = newValue;
              }
            }

            break;

          case "data":
            console.log("~~~~ Feed data changed");
            groupedChanges.data = newValue;
            break;

          case "animation":
            console.log(`~~~~ Animation switched to ${newValue}`);
            config.animation = newValue;
            groupedChanges.animation = newValue;
            // document.location.reload();
            break;
        }
      }
    }

    // Handle collected mutations
    handleConfigMutation(groupedChanges);
  });

}

function handleConfigMutation(mutations) {

  // console.log("~~~~ Collected Mutations: ", mutations);

  let eventsArray = [];

  for (const prop in mutations) {

    let event = prop;
    let topics = prop.split(".");

    do {
      eventsArray.push(event);
      topics.pop();
      event = topics.join(".");
    } while (topics.length > 0);
  }

  // console.log("~~~~ Collected Events");
  // console.log(eventsArray);

  let uniqueEvents = [...new Set(eventsArray)];
  uniqueEvents.sort().reverse();

  // console.log("~~~~ Collected UNIQUE Events");
  // console.log(uniqueEvents);
  // console.log("====================================");

  // Publish
  uniqueEvents.forEach(e => {

    let path = e.split(".");
    let topLevelPath = path.shift();
    let propPath = e;

    if (topLevelPath == "settings") {

      if (path.length > 0) {
        configEvents.publish(e, mutations[e] ?? utils.getPropByPath(config, propPath));
      } else {
        // Don't publish "settings" event
      }

    } else {
      configEvents.publish(e, mutations[e] ?? utils.getPropByPath(config, propPath));
    }

  });

}

export {
  getConfig,
  listenForConfigChanges
};