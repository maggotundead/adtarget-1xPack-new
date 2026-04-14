// Optional.
// For creatives using data feed.
// Required by data.js

// "team1image": "https://bannersvideo.com/upload/avatar/image_113.png",
// "team2image": "https://bannersvideo.com/upload/avatar/image_194.png",
// "home": "2.321",
// "away": "2.84",
// "draw": "4.12",
// "url": "line/Football/88637-England-Premier-League/228624935-Manchester-United-Tottenham-Hotspur/",
// "date": "29.09.2024 17:30",
// "dateCount": "29,09,2024,17,30",
// "team1name": "Manchester United",
// "team2name": "Tottenham Hotspur"

// paramXX -> readable variable conversion

const paramNameList = {
  param01: "team1Name",
  param02: "team2Name",
  param03: "team1LogoUrl",
  param04: "team2LogoUrl",
  param05: "dateTimeString",
  param06: "dateTimeCount",

  param07: "home",
  param08: "away",
  param09: "draw",

  param10: "link",
};


/* Custom Feed data processing
****************************************************/

function processFeedData(item, i, data) {

  // Parse date from unix timestamp
  //---------------------------------------------

  /*
  
  if (typeof (item.dateUnixtime) !== "number") {
    if (typeof (item.dateUnixtime) === "string" && item.dateUnixtime.trim().length > 0) { // not empty string
      item.dateUnixtime = isNaN(Number(item.dateUnixtime)) ? Date.now() / 1000 : Number(item.dateUnixtime).toFixed(0);
    } else {
      item.dateUnixtime = Date.now() / 1000;
    }
  }

  let date = new Date(item.dateUnixtime * 1000);

  let day = ("0" + date.getDate()).slice(-2);
  let month = ("0" + (date.getMonth() + 1)).slice(-2);
  // let year = ("" + (date.getFullYear())).slice(-2);
  let hours = ("0" + date.getHours()).slice(-2);
  let minutes = ("0" + date.getMinutes()).slice(-2);
  // let seconds = "0" + date.getSeconds();

  */

  if (typeof (item.dateTimeString) === "string" && item.dateTimeString.trim().length > 6) { // not empty string
    [item.date, item.time] = item.dateTimeString.trim().split(" ");
  } else {
    item.date = "&mdash;";
    item.time = "&mdash;";
  }

  // item.date = `${day}.${month}`;
  // item.time = `${hours}:${minutes}`;

  console.log(`${item.date} / ${item.time}`);
  // console.log("---");


  // Parse coefficients
  //---------------------------------------------
  ["home", "draw", "away"].forEach(k => {
    if (typeof (item[k]) === "number") {
      item[k] = item[k].toFixed(2);
    } else if (typeof (item[k]) === "string" && item[k].trim().length > 0) { // not empty string
      item[k] = isNaN(Number(item[k])) ? "&mdash;" : Number(item[k]).toFixed(2);
    } else {
      item[k] = "&mdash;";
    }
  });

  // Images
  //---------------------------------------------



  // Move link parsing to utils?
  // Link
  //---------------------------------------------
  if (item.link && typeof item.link === "string" && item.link.length > 5) {
    item.link = item.link.trim();
    try {
      // Пришёл валидный урл
      let linkUrl = new URL(item.link);
      item.link = window.clickTag ? window.clickTag + "&url=" + encodeURIComponent(linkUrl.href) : linkUrl.href;
    } catch (e) {
      // Пришло нечто. Считаем это частью урла без домена. Для обратной совместимости.
      item.link = window.clickTag ? window.clickTag + "&a=" + encodeURIComponent(item.link) : item.link;
    }
  } else {
    // Ничего не пришло
    item.link = window.clickTag || "";
  }

  // Modified item has to be returned!
  return item;
}


export {
  paramNameList,
  processFeedData
};