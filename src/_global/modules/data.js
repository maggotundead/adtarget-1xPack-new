// paramXX -> readable var conversion and data processing

import { paramNameList, processFeedData } from "../js/feed";

export default async function getFeedData(dataSrc) {
  if (Array.isArray(dataSrc) && dataSrc.length > 0) {
    // No need to load
    return convertParams(dataSrc).map(processFeedData);
  } else if (typeof dataSrc === "string") {
    // Have to load
    let data = await loadFeedData(dataSrc.trim()).catch((error) => {
      console.error(error);
    });

    if (Array.isArray(data) && data.length > 0) {
      return convertParams(data).map(processFeedData);
    }
  }

  return []; // Have to be empty array!
}

// Load DATA
async function loadFeedData(dataURL) {
  const response = await fetch(dataURL);

  if (!response.ok) {
    throw new Error(`Data Request error: ${response.status} / ${response.statusText}`);
  }

  return await response.json().catch((e) => {
    throw new Error(`Data JSON error: ${e.message}`);
  });
}

// export default function parseData(data, translations, lang) {
//   return prepareData(convertParams(data), translations, lang);
// }

function convertParams(inArr) {
  if (Array.isArray(inArr)) {
    return inArr.map((itemObj) => {
      return Object.keys(itemObj).reduce((acc, key) => {
        if (paramNameList[key]) {
          acc[paramNameList[key]] = itemObj[key];
        }
        return acc;
      }, {});
    });
  } else {
    return [];
  }
}

// function prepareData(data, translations, lang) {
function prepareData(data) {
  // Some data transformation if needed

  if (Array.isArray(data)) {


    // data.forEach(processFeedData);

    return data.map(processFeedData);


    data.forEach((item) => {
      // Description
      /*if (item.description && typeof item.description == "string") {
        item.description = item.description.replace(/(<([^>]+)>)/gi, "").trim();
      } else {
        item.description = "no description";
      }*/

      // Sale price
      /*if (item.salePrice) {
        // leave only numbers .-
        item.salePrice = parseFloat(item.salePrice.replace(/[^\d.-]/g, ""));
        item.salePrice = moneyFormatter.format(item.salePrice);
        // or
        //item.salePrice = item.salePrice.formatMoney(2, 3, " ", ".") + " " + translations.priceUnit;
      } else {
        item.salePrice = "";
      }*/

      // Regular price
      /*if (item.regularPrice) {
        // leave only numbers .-
        item.regularPrice = parseFloat(item.regularPrice.replace(/[^\d.-]/g, ""));
        item.regularPrice = moneyFormatter.format(item.regularPrice);
        // or
        //item.price = item.price.formatMoney(2, 3, " ", ".") + " " + translations.priceUnit;
      } else {
        item.regularPrice = "";
      }*/

      // Discount
      /*if (item.discount) {
        item.discount = typeof item.discount === "string" ? item.discount.trim() : "";
      } else {
        // 2do option
        // Calculate if item.salePrice && item.regularPrice
        item.discount = "";
      }*/

      // Link
      // if (window.clickTag && typeof window.clickTag === "string" && window.clickTag.length > 5) {
      //   if (item.link && typeof item.link === "string" && item.link.length > 5) {
      //     item.link = item.link.trim();
      //     try {
      //       // Пришёл валидный урл
      //       let linkUrl = new URL(item.link);
      //       item.link = "&url=" + encodeURIComponent(linkUrl.href);
      //     } catch (e) {
      //       // Пришло нечто. Считаем это частью урла без домена. Для обратной совместимости.
      //       item.link = "&a=" + encodeURIComponent(item.link);
      //     } finally {
      //       item.link = window.clickTag + item.link;
      //     }
      //   } else {
      //     item.link = window.clickTag;
      //   }
      // } else {
      //   // Локальный тест или ошибка clickTag
      //   // console.warn("No clickTag present!")
      //   item.link = item.link.trim();
      // }


      // Link
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

    });
  }

  return data;
}

/**
 * Number.prototype.format(n, x, s, c)
 *
 * @param integer n: length of decimal
 * @param integer x: length of whole part
 * @param mixed   s: sections delimiter
 * @param mixed   c: decimal delimiter
 */
Number.prototype.formatMoney = function (n, x, s, c) {
  var re = "\\d(?=(\\d{" + (x || 3) + "})+" + (n > 0 ? "\\D" : "$") + ")",
    num = this.toFixed(Math.max(0, ~~n));

  return (c ? num.replace(".", c) : num).replace(new RegExp(re, "g"), "$&" + (s || ","));
};

// 12345678.9.format(2, 3, '.', ',');  // "12.345.678,90"
// 123456.789.format(4, 4, ' ', ':');  // "12 3456:7890"
// 12345678.9.format(0, 3, '-');       // "12-345-679"
