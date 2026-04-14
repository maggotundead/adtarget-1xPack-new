import { defineConfig } from "vite";
import path from "path";
import fs from "fs";
import autoprefixer from "autoprefixer";

import fg from "fast-glob";
import strip from "@rollup/plugin-strip";

const htmlPlugin = (data) => {
  return {
    name: 'html-transform',
    async transformIndexHtml(html, ctx) {
      console.log(ctx.path);

      const relPath = ctx.path.split("/").slice(1);
      const typeDir = relPath[0].toLowerCase();
      const adType = typeDir === "banners" ? "banner" : relPath[0].toLowerCase();

      const adSize = adType === "banner" ? relPath[1].split("x").map((s) => s.includes("--") ? "100%" : s) : [];
      const pageTitle = adType === "banner" ? "Banner " + adSize.join("x") : adType[0].toUpperCase() + adType.slice(1);

      // <meta name="ad.vars" content="auto_button=0" />;

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

        // Add units.
        const adSizeWithUnits = adSize.map(s => s.includes("%") ? s : `${s}px`);

        adStyle.push({
          tag: "style",
          children: `:root { --ad-width: ${adSizeWithUnits[0]}; --ad-height: ${adSizeWithUnits[1]}; }`,
          /**
           * injectTo: 'head' | 'body' | 'head-prepend' | 'body-prepend'
           * default: 'head-prepend'
           */
          injectTo: 'head'
        });
      }

      // return html;
      return {
        html: html.replace(
          /<title>(.*?)<\/title>/,
          `<title>${pageTitle}</title>`,
        ),
        tags: [
          ...adMeta,
          ...adStyle
        ]
      };
    },
  };
};

// config.json redirect plugin
const configRedirectPlugin = () => ({

  name: 'config-redirect-plugin',

  configureServer(server) {
    server.middlewares.use((req, res, next) => {
      // Check extensionless URLs but ignore the `/` root path
      if (req._parsedUrl.pathname.length > 1 && req._parsedUrl.pathname.includes("config.json")) {
        if (!fs.existsSync(path.resolve(__dirname, "src", req._parsedUrl.pathname.slice(1)))) {
          req.url = "/_global/config.json" + (req._parsedUrl.search || "");
        }
      }
      else if (req._parsedUrl.pathname.length > 1 && req._parsedUrl.pathname.includes("demo-data/")) {
        // console.log(path.resolve(__dirname, "src", ...req._parsedUrl.pathname.split("/")));
        if (!fs.existsSync(path.resolve(__dirname, "src", req._parsedUrl.pathname.slice(1)))) {
          req.url = "/_public/demo-data" + req._parsedUrl.pathname.split("demo-data").slice(-1)[0] + (req._parsedUrl.search || "");
        }
      }
      else if (req._parsedUrl.pathname.length > 1 && req._parsedUrl.pathname.includes("img/")) {
        // console.log(req._parsedUrl.pathname.slice(1));
        if (!fs.existsSync(path.resolve(__dirname, "src", req._parsedUrl.pathname.slice(1)))) {
          req.url = "/_public/img" + req._parsedUrl.pathname.split("img").slice(-1)[0] + (req._parsedUrl.search || "");
        }
      }
      next();
    });
  },

  configurePreviewServer(server) {
    // return a post hook that is called after other middlewares are
    // installed
    // return () => {
    server.middlewares.use((req, res, next) => {
      // custom handle request...
      // Check extensionless URLs but ignore the `/` root path
      if (req._parsedUrl.pathname.length > 1 && req._parsedUrl.pathname.includes("config.json")) {
        if (!fs.existsSync(path.resolve(__dirname, "./dist", req._parsedUrl.pathname))) {
          req.url = "/config.json" + (req._parsedUrl.search || "");
        }
      }
      next();
    });
    // }
  },
});


export default defineConfig(
  ({ command, mode, isSsrBuild, isPreview }) => {

    // let rootDir = isPreview ? "./" : "./src";

    return {
      root: "./src",
      base: "./",
      publicDir: "./_public",
      server: {
        // open: "/index.html",
        host: true,
      },

      plugins: [
        configRedirectPlugin(),
        htmlPlugin(),
      ],

      resolve: {
        alias: {
          '@global': path.resolve(__dirname, './src/_global'),
          // '@assets': path.resolve(__dirname, './src/assets'),
        }
      },

      css: {
        devSourcemap: true,
        css: {
          postcss: {
            plugins: [
              autoprefixer({}) // add options if needed
            ],
          }
        }
      },

      build: {
        outDir: "../dist"
      }
    };
  });