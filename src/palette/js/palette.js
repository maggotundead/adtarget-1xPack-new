import { getConfig } from "@global/modules/config";
import makeBrand from "@global/modules/brand";

const configUrl = "config.json?" + Math.floor(Date.now() / 1000);

let brand, config;

// Call init only once
window.init = async function (e) {

  /* 1. Load and process config
  =======================================================*/
  config = await getConfig(configUrl);
  if (!config) {
    console.warn("No config. Can not continue :(");
    return;
  }

  brand = makeBrand(config.brand);

  document.documentElement.classList.add("ready");

};