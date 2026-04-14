import * as fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { build } from 'vite';
import autoprefixer from "autoprefixer";
import strip from "@rollup/plugin-strip";
import fg from "fast-glob";

import zipPack from "vite-plugin-zip-pack";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const srcPath = path.resolve(__dirname, "./src");
const bundlePath = path.resolve(__dirname, "./dist");


const htmlPlugin = (data) => {
  return {
    name: 'html-transform',
    async transformIndexHtml(html, ctx) {
      const adStyle = [];
      const adMeta = [
        {
          tag: "meta",
          attrs: {
            name: "ad.type",
            content: data.adType
          }
        }
      ];

      if (data.adType === "banner") {

        adMeta.push({
          tag: "meta",
          attrs: {
            name: "ad.size",
            content: `width=${data.adSize[0]},height=${data.adSize[1]}`
          }
        });

        // Add units.
        const adSizeWithUnits = data.adSize.map(s => s.includes("%") ? s : `${s}px`);

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
          `<title>${data.pageTitle}</title>`,
        ),
        tags: [
          ...adMeta,
          ...adStyle
        ]
      };
    },
  };
};


try {
  await fs.rm(bundlePath, { recursive: true, force: true });
  await fs.mkdir(bundlePath, { recursive: true });
  await fs.copyFile(path.resolve(__dirname, './src/_global/config.json'), path.resolve(bundlePath, './config.json'));
  await fs.copyFile(path.resolve(__dirname, './src/_global/icon.jpg'), path.resolve(bundlePath, './icon.jpg'));
} catch (error) {
  console.error('There was an error:', error.message);
}

// Collect entry-points for each folder

const entryPoints = fg.sync([
  "src/banners/*/*.html",
  // "src/branding/*.html",
  "src/landing/*.html",
]).map((entry) => path.resolve(__dirname, entry));

const branding = fg.sync([
  "src/branding/*.html"
]).map((entry) => path.resolve(__dirname, entry));

if (branding.length > 0) {
  entryPoints.push(branding.length > 1 ? branding : branding[0]);
}

// console.log(entryPoints);


// Building
entryPoints.forEach(async (input) => {

  let inputFile = Array.isArray(input) ? input[0] : input;

  const relPath = path.relative(srcPath, path.dirname(inputFile)).split(path.sep);
  const typeDir = relPath[0].toLowerCase();
  const adType = typeDir === "banners" ? "banner" : relPath[0].toLowerCase();

  const adSize = adType === "banner" ? relPath[1].split("x").map((s) => s.includes("--") ? "100%" : s) : [];

  let sizeSuffix = adSize.length ? `_${adSize.join("x")}` : "";
  if (adSize[0] == "100%" && adSize[1] == "100%") {
    sizeSuffix = "_100%";
  }

  const outDir = path.resolve(__dirname, "./dist", adType + sizeSuffix);

  const pageTitle = adType === "banner" ? "Banner " + adSize.join("x") : adType[0].toUpperCase() + adType.slice(1);


  await build({
    root: path.resolve(__dirname, path.dirname(inputFile)),
    base: "./",
    publicDir: path.resolve(__dirname, "./src/_public"),

    resolve: {
      alias: {
        '@global': path.resolve(__dirname, './src/_global'),
      }
    },

    css: {
      css: {
        postcss: {
          plugins: [
            autoprefixer({}) // add options if needed
          ],
        }
      }
    },

    build: {
      outDir: outDir,
      assetsDir: "./",
      emptyOutDir: false,
      modulePreload: false,

      rollupOptions: {
        input: input,

        output: {
          assetFileNames: ({ name }) => {
            // console.log(name);
            if (/\.(gif|jpe?g|png|svg)$/.test(name ?? "")) {
              return `img/[name][extname]`;
            }

            // if (/\.css$/.test(name ?? "")) {
            //   //return "assets/css/[name]-[hash][extname]";
            //   return `css/[name]-[hash][extname]`;
            // }

            // // default value
            // // ref: https://rollupjs.org/guide/en/#outputassetfilenames
            return "[name]-[hash][extname]";
          },

          // chunkFileNames: 'js/[name]-[hash].js',
          // entryFileNames: 'js/[name]-[hash].js',
        },

        plugins: [
          strip()
        ],
      },
    },

    plugins: [
      htmlPlugin({
        pageTitle: pageTitle,
        adType: adType,
        adSize: adSize,
      }),

      zipPack({
        inDir: outDir,
        outDir: bundlePath,
        outFileName: outDir.split(path.sep).pop() + ".zip"
      })
    ],
  });

});

// process.exit();