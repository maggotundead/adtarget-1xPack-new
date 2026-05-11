// vite.config.js
import { defineConfig } from "file:///D:/Projects/adtarget/spf3/node_modules/vite/dist/node/index.js";
import path from "path";
import fs from "fs";
import autoprefixer from "file:///D:/Projects/adtarget/spf3/node_modules/autoprefixer/lib/autoprefixer.js";
import fg from "file:///D:/Projects/adtarget/spf3/node_modules/fast-glob/out/index.js";
import strip from "file:///D:/Projects/adtarget/spf3/node_modules/@rollup/plugin-strip/dist/es/index.js";
var __vite_injected_original_dirname = "D:\\Projects\\adtarget\\spf3";
var htmlPlugin = (data) => {
  return {
    name: "html-transform",
    async transformIndexHtml(html, ctx) {
      console.log(ctx.path);
      const relPath = ctx.path.split("/").slice(1);
      const typeDir = relPath[0].toLowerCase();
      const adType = typeDir === "banners" ? "banner" : relPath[0].toLowerCase();
      const adSize = adType === "banner" ? relPath[1].split("x").map((s) => s.includes("--") ? "100%" : s) : [];
      const pageTitle = adType === "banner" ? "Banner " + adSize.join("x") : adType[0].toUpperCase() + adType.slice(1);
      const adStyle = [];
      const adMeta = [
        {
          tag: "meta",
          attrs: {
            name: "ad.type",
            content: adType
          }
        }
      ];
      if (adType === "banner") {
        adMeta.push({
          tag: "meta",
          attrs: {
            name: "ad.size",
            content: `width=${adSize[0]},height=${adSize[1]}`
          }
        });
        const adSizeWithUnits = adSize.map((s) => s.includes("%") ? s : `${s}px`);
        adStyle.push({
          tag: "style",
          children: `:root { --ad-width: ${adSizeWithUnits[0]}; --ad-height: ${adSizeWithUnits[1]}; }`,
          /**
           * injectTo: 'head' | 'body' | 'head-prepend' | 'body-prepend'
           * default: 'head-prepend'
           */
          injectTo: "head"
        });
      }
      return {
        html: html.replace(
          /<title>(.*?)<\/title>/,
          `<title>${pageTitle}</title>`
        ),
        tags: [
          ...adMeta,
          ...adStyle
        ]
      };
    }
  };
};
var configRedirectPlugin = () => ({
  name: "config-redirect-plugin",
  configureServer(server) {
    server.middlewares.use((req, res, next) => {
      if (req._parsedUrl.pathname.length > 1 && req._parsedUrl.pathname.includes("config.json")) {
        if (!fs.existsSync(path.resolve(__vite_injected_original_dirname, "src", req._parsedUrl.pathname.slice(1)))) {
          req.url = "/_global/config.json" + (req._parsedUrl.search || "");
        }
      } else if (req._parsedUrl.pathname.length > 1 && req._parsedUrl.pathname.includes("demo-data/")) {
        if (!fs.existsSync(path.resolve(__vite_injected_original_dirname, "src", req._parsedUrl.pathname.slice(1)))) {
          req.url = "/_public/demo-data" + req._parsedUrl.pathname.split("demo-data").slice(-1)[0] + (req._parsedUrl.search || "");
        }
      } else if (req._parsedUrl.pathname.length > 1 && req._parsedUrl.pathname.includes("img/")) {
        if (!fs.existsSync(path.resolve(__vite_injected_original_dirname, "src", req._parsedUrl.pathname.slice(1)))) {
          req.url = "/_public/img" + req._parsedUrl.pathname.split("img").slice(-1)[0] + (req._parsedUrl.search || "");
        }
      }
      next();
    });
  },
  configurePreviewServer(server) {
    server.middlewares.use((req, res, next) => {
      if (req._parsedUrl.pathname.length > 1 && req._parsedUrl.pathname.includes("config.json")) {
        if (!fs.existsSync(path.resolve(__vite_injected_original_dirname, "./dist", req._parsedUrl.pathname))) {
          req.url = "/config.json" + (req._parsedUrl.search || "");
        }
      }
      next();
    });
  }
});
var vite_config_default = defineConfig(
  ({ command, mode, isSsrBuild, isPreview }) => {
    return {
      root: "./src",
      base: "./",
      publicDir: "./_public",
      server: {
        // open: "/index.html",
        host: true
      },
      plugins: [
        configRedirectPlugin(),
        htmlPlugin()
      ],
      resolve: {
        alias: {
          "@global": path.resolve(__vite_injected_original_dirname, "./src/_global")
          // '@assets': path.resolve(__dirname, './src/assets'),
        }
      },
      css: {
        devSourcemap: true,
        css: {
          postcss: {
            plugins: [
              autoprefixer({})
              // add options if needed
            ]
          }
        }
      },
      build: {
        outDir: "../dist"
      }
    };
  }
);
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcuanMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJEOlxcXFxQcm9qZWN0c1xcXFxhZHRhcmdldFxcXFxzcGYzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCJEOlxcXFxQcm9qZWN0c1xcXFxhZHRhcmdldFxcXFxzcGYzXFxcXHZpdGUuY29uZmlnLmpzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9EOi9Qcm9qZWN0cy9hZHRhcmdldC9zcGYzL3ZpdGUuY29uZmlnLmpzXCI7aW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSBcInZpdGVcIjtcclxuaW1wb3J0IHBhdGggZnJvbSBcInBhdGhcIjtcclxuaW1wb3J0IGZzIGZyb20gXCJmc1wiO1xyXG5pbXBvcnQgYXV0b3ByZWZpeGVyIGZyb20gXCJhdXRvcHJlZml4ZXJcIjtcclxuXHJcbmltcG9ydCBmZyBmcm9tIFwiZmFzdC1nbG9iXCI7XHJcbmltcG9ydCBzdHJpcCBmcm9tIFwiQHJvbGx1cC9wbHVnaW4tc3RyaXBcIjtcclxuXHJcbmNvbnN0IGh0bWxQbHVnaW4gPSAoZGF0YSkgPT4ge1xyXG4gIHJldHVybiB7XHJcbiAgICBuYW1lOiAnaHRtbC10cmFuc2Zvcm0nLFxyXG4gICAgYXN5bmMgdHJhbnNmb3JtSW5kZXhIdG1sKGh0bWwsIGN0eCkge1xyXG4gICAgICBjb25zb2xlLmxvZyhjdHgucGF0aCk7XHJcblxyXG4gICAgICBjb25zdCByZWxQYXRoID0gY3R4LnBhdGguc3BsaXQoXCIvXCIpLnNsaWNlKDEpO1xyXG4gICAgICBjb25zdCB0eXBlRGlyID0gcmVsUGF0aFswXS50b0xvd2VyQ2FzZSgpO1xyXG4gICAgICBjb25zdCBhZFR5cGUgPSB0eXBlRGlyID09PSBcImJhbm5lcnNcIiA/IFwiYmFubmVyXCIgOiByZWxQYXRoWzBdLnRvTG93ZXJDYXNlKCk7XHJcblxyXG4gICAgICBjb25zdCBhZFNpemUgPSBhZFR5cGUgPT09IFwiYmFubmVyXCIgPyByZWxQYXRoWzFdLnNwbGl0KFwieFwiKS5tYXAoKHMpID0+IHMuaW5jbHVkZXMoXCItLVwiKSA/IFwiMTAwJVwiIDogcykgOiBbXTtcclxuICAgICAgY29uc3QgcGFnZVRpdGxlID0gYWRUeXBlID09PSBcImJhbm5lclwiID8gXCJCYW5uZXIgXCIgKyBhZFNpemUuam9pbihcInhcIikgOiBhZFR5cGVbMF0udG9VcHBlckNhc2UoKSArIGFkVHlwZS5zbGljZSgxKTtcclxuXHJcbiAgICAgIC8vIDxtZXRhIG5hbWU9XCJhZC52YXJzXCIgY29udGVudD1cImF1dG9fYnV0dG9uPTBcIiAvPjtcclxuXHJcbiAgICAgIGNvbnN0IGFkU3R5bGUgPSBbXTtcclxuICAgICAgY29uc3QgYWRNZXRhID0gW1xyXG4gICAgICAgIHtcclxuICAgICAgICAgIHRhZzogXCJtZXRhXCIsXHJcbiAgICAgICAgICBhdHRyczoge1xyXG4gICAgICAgICAgICBuYW1lOiBcImFkLnR5cGVcIixcclxuICAgICAgICAgICAgY29udGVudDogYWRUeXBlXHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICBdO1xyXG5cclxuICAgICAgaWYgKGFkVHlwZSA9PT0gXCJiYW5uZXJcIikge1xyXG5cclxuICAgICAgICBhZE1ldGEucHVzaCh7XHJcbiAgICAgICAgICB0YWc6IFwibWV0YVwiLFxyXG4gICAgICAgICAgYXR0cnM6IHtcclxuICAgICAgICAgICAgbmFtZTogXCJhZC5zaXplXCIsXHJcbiAgICAgICAgICAgIGNvbnRlbnQ6IGB3aWR0aD0ke2FkU2l6ZVswXX0saGVpZ2h0PSR7YWRTaXplWzFdfWBcclxuICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgLy8gQWRkIHVuaXRzLlxyXG4gICAgICAgIGNvbnN0IGFkU2l6ZVdpdGhVbml0cyA9IGFkU2l6ZS5tYXAocyA9PiBzLmluY2x1ZGVzKFwiJVwiKSA/IHMgOiBgJHtzfXB4YCk7XHJcblxyXG4gICAgICAgIGFkU3R5bGUucHVzaCh7XHJcbiAgICAgICAgICB0YWc6IFwic3R5bGVcIixcclxuICAgICAgICAgIGNoaWxkcmVuOiBgOnJvb3QgeyAtLWFkLXdpZHRoOiAke2FkU2l6ZVdpdGhVbml0c1swXX07IC0tYWQtaGVpZ2h0OiAke2FkU2l6ZVdpdGhVbml0c1sxXX07IH1gLFxyXG4gICAgICAgICAgLyoqXHJcbiAgICAgICAgICAgKiBpbmplY3RUbzogJ2hlYWQnIHwgJ2JvZHknIHwgJ2hlYWQtcHJlcGVuZCcgfCAnYm9keS1wcmVwZW5kJ1xyXG4gICAgICAgICAgICogZGVmYXVsdDogJ2hlYWQtcHJlcGVuZCdcclxuICAgICAgICAgICAqL1xyXG4gICAgICAgICAgaW5qZWN0VG86ICdoZWFkJ1xyXG4gICAgICAgIH0pO1xyXG4gICAgICB9XHJcblxyXG4gICAgICAvLyByZXR1cm4gaHRtbDtcclxuICAgICAgcmV0dXJuIHtcclxuICAgICAgICBodG1sOiBodG1sLnJlcGxhY2UoXHJcbiAgICAgICAgICAvPHRpdGxlPiguKj8pPFxcL3RpdGxlPi8sXHJcbiAgICAgICAgICBgPHRpdGxlPiR7cGFnZVRpdGxlfTwvdGl0bGU+YCxcclxuICAgICAgICApLFxyXG4gICAgICAgIHRhZ3M6IFtcclxuICAgICAgICAgIC4uLmFkTWV0YSxcclxuICAgICAgICAgIC4uLmFkU3R5bGVcclxuICAgICAgICBdXHJcbiAgICAgIH07XHJcbiAgICB9LFxyXG4gIH07XHJcbn07XHJcblxyXG4vLyBjb25maWcuanNvbiByZWRpcmVjdCBwbHVnaW5cclxuY29uc3QgY29uZmlnUmVkaXJlY3RQbHVnaW4gPSAoKSA9PiAoe1xyXG5cclxuICBuYW1lOiAnY29uZmlnLXJlZGlyZWN0LXBsdWdpbicsXHJcblxyXG4gIGNvbmZpZ3VyZVNlcnZlcihzZXJ2ZXIpIHtcclxuICAgIHNlcnZlci5taWRkbGV3YXJlcy51c2UoKHJlcSwgcmVzLCBuZXh0KSA9PiB7XHJcbiAgICAgIC8vIENoZWNrIGV4dGVuc2lvbmxlc3MgVVJMcyBidXQgaWdub3JlIHRoZSBgL2Agcm9vdCBwYXRoXHJcbiAgICAgIGlmIChyZXEuX3BhcnNlZFVybC5wYXRobmFtZS5sZW5ndGggPiAxICYmIHJlcS5fcGFyc2VkVXJsLnBhdGhuYW1lLmluY2x1ZGVzKFwiY29uZmlnLmpzb25cIikpIHtcclxuICAgICAgICBpZiAoIWZzLmV4aXN0c1N5bmMocGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgXCJzcmNcIiwgcmVxLl9wYXJzZWRVcmwucGF0aG5hbWUuc2xpY2UoMSkpKSkge1xyXG4gICAgICAgICAgcmVxLnVybCA9IFwiL19nbG9iYWwvY29uZmlnLmpzb25cIiArIChyZXEuX3BhcnNlZFVybC5zZWFyY2ggfHwgXCJcIik7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICAgIGVsc2UgaWYgKHJlcS5fcGFyc2VkVXJsLnBhdGhuYW1lLmxlbmd0aCA+IDEgJiYgcmVxLl9wYXJzZWRVcmwucGF0aG5hbWUuaW5jbHVkZXMoXCJkZW1vLWRhdGEvXCIpKSB7XHJcbiAgICAgICAgLy8gY29uc29sZS5sb2cocGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgXCJzcmNcIiwgLi4ucmVxLl9wYXJzZWRVcmwucGF0aG5hbWUuc3BsaXQoXCIvXCIpKSk7XHJcbiAgICAgICAgaWYgKCFmcy5leGlzdHNTeW5jKHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsIFwic3JjXCIsIHJlcS5fcGFyc2VkVXJsLnBhdGhuYW1lLnNsaWNlKDEpKSkpIHtcclxuICAgICAgICAgIHJlcS51cmwgPSBcIi9fcHVibGljL2RlbW8tZGF0YVwiICsgcmVxLl9wYXJzZWRVcmwucGF0aG5hbWUuc3BsaXQoXCJkZW1vLWRhdGFcIikuc2xpY2UoLTEpWzBdICsgKHJlcS5fcGFyc2VkVXJsLnNlYXJjaCB8fCBcIlwiKTtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgICAgZWxzZSBpZiAocmVxLl9wYXJzZWRVcmwucGF0aG5hbWUubGVuZ3RoID4gMSAmJiByZXEuX3BhcnNlZFVybC5wYXRobmFtZS5pbmNsdWRlcyhcImltZy9cIikpIHtcclxuICAgICAgICAvLyBjb25zb2xlLmxvZyhyZXEuX3BhcnNlZFVybC5wYXRobmFtZS5zbGljZSgxKSk7XHJcbiAgICAgICAgaWYgKCFmcy5leGlzdHNTeW5jKHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsIFwic3JjXCIsIHJlcS5fcGFyc2VkVXJsLnBhdGhuYW1lLnNsaWNlKDEpKSkpIHtcclxuICAgICAgICAgIHJlcS51cmwgPSBcIi9fcHVibGljL2ltZ1wiICsgcmVxLl9wYXJzZWRVcmwucGF0aG5hbWUuc3BsaXQoXCJpbWdcIikuc2xpY2UoLTEpWzBdICsgKHJlcS5fcGFyc2VkVXJsLnNlYXJjaCB8fCBcIlwiKTtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgICAgbmV4dCgpO1xyXG4gICAgfSk7XHJcbiAgfSxcclxuXHJcbiAgY29uZmlndXJlUHJldmlld1NlcnZlcihzZXJ2ZXIpIHtcclxuICAgIC8vIHJldHVybiBhIHBvc3QgaG9vayB0aGF0IGlzIGNhbGxlZCBhZnRlciBvdGhlciBtaWRkbGV3YXJlcyBhcmVcclxuICAgIC8vIGluc3RhbGxlZFxyXG4gICAgLy8gcmV0dXJuICgpID0+IHtcclxuICAgIHNlcnZlci5taWRkbGV3YXJlcy51c2UoKHJlcSwgcmVzLCBuZXh0KSA9PiB7XHJcbiAgICAgIC8vIGN1c3RvbSBoYW5kbGUgcmVxdWVzdC4uLlxyXG4gICAgICAvLyBDaGVjayBleHRlbnNpb25sZXNzIFVSTHMgYnV0IGlnbm9yZSB0aGUgYC9gIHJvb3QgcGF0aFxyXG4gICAgICBpZiAocmVxLl9wYXJzZWRVcmwucGF0aG5hbWUubGVuZ3RoID4gMSAmJiByZXEuX3BhcnNlZFVybC5wYXRobmFtZS5pbmNsdWRlcyhcImNvbmZpZy5qc29uXCIpKSB7XHJcbiAgICAgICAgaWYgKCFmcy5leGlzdHNTeW5jKHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsIFwiLi9kaXN0XCIsIHJlcS5fcGFyc2VkVXJsLnBhdGhuYW1lKSkpIHtcclxuICAgICAgICAgIHJlcS51cmwgPSBcIi9jb25maWcuanNvblwiICsgKHJlcS5fcGFyc2VkVXJsLnNlYXJjaCB8fCBcIlwiKTtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgICAgbmV4dCgpO1xyXG4gICAgfSk7XHJcbiAgICAvLyB9XHJcbiAgfSxcclxufSk7XHJcblxyXG5cclxuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKFxyXG4gICh7IGNvbW1hbmQsIG1vZGUsIGlzU3NyQnVpbGQsIGlzUHJldmlldyB9KSA9PiB7XHJcblxyXG4gICAgLy8gbGV0IHJvb3REaXIgPSBpc1ByZXZpZXcgPyBcIi4vXCIgOiBcIi4vc3JjXCI7XHJcblxyXG4gICAgcmV0dXJuIHtcclxuICAgICAgcm9vdDogXCIuL3NyY1wiLFxyXG4gICAgICBiYXNlOiBcIi4vXCIsXHJcbiAgICAgIHB1YmxpY0RpcjogXCIuL19wdWJsaWNcIixcclxuICAgICAgc2VydmVyOiB7XHJcbiAgICAgICAgLy8gb3BlbjogXCIvaW5kZXguaHRtbFwiLFxyXG4gICAgICAgIGhvc3Q6IHRydWUsXHJcbiAgICAgIH0sXHJcblxyXG4gICAgICBwbHVnaW5zOiBbXHJcbiAgICAgICAgY29uZmlnUmVkaXJlY3RQbHVnaW4oKSxcclxuICAgICAgICBodG1sUGx1Z2luKCksXHJcbiAgICAgIF0sXHJcblxyXG4gICAgICByZXNvbHZlOiB7XHJcbiAgICAgICAgYWxpYXM6IHtcclxuICAgICAgICAgICdAZ2xvYmFsJzogcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgJy4vc3JjL19nbG9iYWwnKSxcclxuICAgICAgICAgIC8vICdAYXNzZXRzJzogcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgJy4vc3JjL2Fzc2V0cycpLFxyXG4gICAgICAgIH1cclxuICAgICAgfSxcclxuXHJcbiAgICAgIGNzczoge1xyXG4gICAgICAgIGRldlNvdXJjZW1hcDogdHJ1ZSxcclxuICAgICAgICBjc3M6IHtcclxuICAgICAgICAgIHBvc3Rjc3M6IHtcclxuICAgICAgICAgICAgcGx1Z2luczogW1xyXG4gICAgICAgICAgICAgIGF1dG9wcmVmaXhlcih7fSkgLy8gYWRkIG9wdGlvbnMgaWYgbmVlZGVkXHJcbiAgICAgICAgICAgIF0sXHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICB9LFxyXG5cclxuICAgICAgYnVpbGQ6IHtcclxuICAgICAgICBvdXREaXI6IFwiLi4vZGlzdFwiXHJcbiAgICAgIH1cclxuICAgIH07XHJcbiAgfSk7Il0sCiAgIm1hcHBpbmdzIjogIjtBQUFxUSxTQUFTLG9CQUFvQjtBQUNsUyxPQUFPLFVBQVU7QUFDakIsT0FBTyxRQUFRO0FBQ2YsT0FBTyxrQkFBa0I7QUFFekIsT0FBTyxRQUFRO0FBQ2YsT0FBTyxXQUFXO0FBTmxCLElBQU0sbUNBQW1DO0FBUXpDLElBQU0sYUFBYSxDQUFDLFNBQVM7QUFDM0IsU0FBTztBQUFBLElBQ0wsTUFBTTtBQUFBLElBQ04sTUFBTSxtQkFBbUIsTUFBTSxLQUFLO0FBQ2xDLGNBQVEsSUFBSSxJQUFJLElBQUk7QUFFcEIsWUFBTSxVQUFVLElBQUksS0FBSyxNQUFNLEdBQUcsRUFBRSxNQUFNLENBQUM7QUFDM0MsWUFBTSxVQUFVLFFBQVEsQ0FBQyxFQUFFLFlBQVk7QUFDdkMsWUFBTSxTQUFTLFlBQVksWUFBWSxXQUFXLFFBQVEsQ0FBQyxFQUFFLFlBQVk7QUFFekUsWUFBTSxTQUFTLFdBQVcsV0FBVyxRQUFRLENBQUMsRUFBRSxNQUFNLEdBQUcsRUFBRSxJQUFJLENBQUMsTUFBTSxFQUFFLFNBQVMsSUFBSSxJQUFJLFNBQVMsQ0FBQyxJQUFJLENBQUM7QUFDeEcsWUFBTSxZQUFZLFdBQVcsV0FBVyxZQUFZLE9BQU8sS0FBSyxHQUFHLElBQUksT0FBTyxDQUFDLEVBQUUsWUFBWSxJQUFJLE9BQU8sTUFBTSxDQUFDO0FBSS9HLFlBQU0sVUFBVSxDQUFDO0FBQ2pCLFlBQU0sU0FBUztBQUFBLFFBQ2I7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
