// build.mjs (ESM)
import { fileURLToPath } from "node:url";
import path from "node:path";
import fs from "node:fs/promises";
import { existsSync } from "node:fs";
import { build as esbuild } from "esbuild";
import { minify } from "html-minifier-terser";


import { spawn } from "node:child_process";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);

const newImagePath = "/minio/claps/actions/welcome-champ/img/"; // <— шлях до картинок в проді
// const newImagePath = "/minio/claps/actions/welcome-champ/img/"; // <— шлях до картинок на сайті пісочниці

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// === Налаштування ============================================================
const HTML_ENTRY = path.join(__dirname, "index.html"); // кореневий HTML
const CSS_ENTRY = path.join(__dirname, "css", "style.css");
const JS_ENTRY = path.join(__dirname, "js", "script.js");
const DIST_DIR = path.join(__dirname, "dist");

// >>> ДОДАЙ: шлях dev-виходу (біля script.js)
const DEV_OUT_JS = path.join(__dirname, "js", "main.js");
// ============================================================================

async function ensureCleanDist() {
  if (existsSync(DIST_DIR)) {
    await fs.rm(DIST_DIR, { recursive: true, force: true });
  }
  await fs.mkdir(DIST_DIR, { recursive: true });
}

// Замінюємо саме префікс /img/ на newImagePath у різних контекстах
function rewriteImgPaths(input) {
  if (!input) return input;
  let out = input;

  // 1) srcset="…": замінюємо ВСІ /img/ усередині значення атрибута (1x, 2x тощо)
  out = out.replace(
    /(\bsrcset\s*=\s*["'`])([\s\S]*?)(["'`])/gi,
    (m, open, content, close) => {
      const replaced = content.replace(/\/img\//g, newImagePath);
      return `${open}${replaced}${close}`;
    }
  );

  // 2) src= або data-src=: замінюємо префікс /img/
  out = out.replace(
    /(\b(?:src|data-src)\s*=\s*["'`])\/img\//gi,
    `$1${newImagePath}`
  );

  // 3) CSS: url(/img/…), url('/img/…'), url("/img/…")
  out = out.replace(
    /url\(\s*(['"`]?)\/img\//gi,
    (m, q) => `url(${q}${newImagePath}`
  );

  // 4) CSS: image-set(url(/img/...) 1x, url(/img/...) 2x)
  out = out.replace(/image-set\(\s*([^)]*)\)/gi, (m, content) => {
    const replaced = content.replace(
      /url\(\s*(['"`]?)\/img\//gi,
      (m2, q) => `url(${q}${newImagePath}`
    );
    return `image-set(${replaced})`;
  });

  // 5) Підстраховка: будь-які рядки в лапках/бектіках, що починаються з /img/
  out = out.replace(/(["'`])\/img\//g, `$1${newImagePath}`);

  return out;
}

function extractBodyInner(html) {
  // 1️⃣ Знаходимо позицію початку <div class="mainContainer">
  const startMatch = html.match(/<div\s+class=["']mainContainer["']>/i);
  // 2️⃣ Знаходимо позицію кінця (тега <script type="module" src="/js/script.js"></script>)
  const endMatch = html.match(
    /<script\s+type=["']module["']\s+src=["']\/js\/main\.js["']><\/script>/i
  );

  if (!startMatch) {
    console.warn('⚠️ Тег <div class="mainContainer"> не знайдено');
    return "";
  }

  const startIndex = startMatch.index;
  const endIndex = endMatch ? endMatch.index : html.length;
  const content = html.slice(startIndex, endIndex);
  return content.trim();
}

async function processHtml() {
  const html = await fs.readFile(HTML_ENTRY, "utf8");
  const bodyInner = extractBodyInner(html);

  // спершу мінімізуємо
  const minified = await minify(bodyInner, {
    collapseWhitespace: true,
    removeComments: true,
    removeRedundantAttributes: true,
    removeEmptyAttributes: true,
    removeOptionalTags: true,
    minifyCSS: true,
    minifyJS: true,
    caseSensitive: true,
  });

  // потім робимо підміну шляхів /img/ → newImagePath
  const htmlRewritten = rewriteImgPaths(minified);

  const outHtmlPath = path.join(DIST_DIR, path.basename(HTML_ENTRY)); // dist/index.html
  await fs.writeFile(outHtmlPath, htmlRewritten, "utf8");
  return { outHtmlPath, bodyInner: htmlRewritten };
}

async function buildCss() {
  const outCssPath = path.join(DIST_DIR, "style.css");
  await esbuild({
    entryPoints: [CSS_ENTRY],
    outfile: outCssPath,
    bundle: false,
    minify: true,
    legalComments: "none",
    logLevel: "info",
    loader: { ".css": "css" },
  });

  // читаємо готовий CSS, робимо підміну й перезаписуємо
  let css = await fs.readFile(outCssPath, "utf8");
  css = rewriteImgPaths(css);
  await fs.writeFile(outCssPath, css, "utf8");
  return { outCssPath, css };
}

async function buildJs() {
  const outJsPath = path.join(DIST_DIR, "script.js");
  await esbuild({
    entryPoints: [JS_ENTRY],
    outfile: outJsPath,
    bundle: true,
    format: "iife",
    platform: "browser",
    target: ["es2018"],
    sourcemap: false,
    minify: true,
    legalComments: "none",
    logLevel: "info",
  });

  // читаємо готовий JS, робимо підміну й перезаписуємо
  let js = await fs.readFile(outJsPath, "utf8");
  js = rewriteImgPaths(js);
  await fs.writeFile(outJsPath, js, "utf8");
  return { outJsPath, js };
}

async function createAllHtml({ css, bodyInner, js }) {
  const allHtmlPath = path.join(DIST_DIR, "all.html");
  const all = [
    `<style>${css}</style>`,
    bodyInner,
    `<script>${js}</script>`,
    "",
  ].join("\n");
  await fs.writeFile(allHtmlPath, all, "utf8");
  return allHtmlPath;
}

async function buildDevJs() {
  // шлях до нативного бінарника esbuild
  const esbuildBin = require.resolve("esbuild/bin/esbuild");

  const args = [
    JS_ENTRY,
    "--bundle",
    "--format=esm",
    "--platform=browser",
    "--target=es2018",
    "--sourcemap=inline",
    `--outfile=${DEV_OUT_JS}`,
    "--watch"
  ];

  // ✅ запускаємо бінарник напряму (без process.execPath)
  const child = spawn(esbuildBin, args, { stdio: "inherit" });
  console.log("👀 dev: watching JS → js/main.js (CLI mode)");

  const cleanup = () => {
    try { child.kill(); } catch {}
    process.exit(0);
  };
  process.on("SIGINT", cleanup);
  process.on("SIGTERM", cleanup);
}


// >>> ЗАМІНИ лише тіло main() (умовна гілка для --dev додана; прод — без змін)
async function main() {
  const isDev = process.argv.includes("--dev");
  if (isDev) {
    await buildDevJs();           // тільки JS → js/main.js
    return;
  }

  console.log("🧹 cleaning dist…");
  await ensureCleanDist();

  console.log("📄 processing HTML…");
  const { bodyInner } = await processHtml();

  console.log("🎨 building CSS…");
  const { css } = await buildCss();

  console.log("🧠 bundling JS…");
  const { js } = await buildJs();

  console.log("🧩 composing all.html…");
  const allHtmlPath = await createAllHtml({ css, bodyInner, js });

  console.log("✅ build complete");
  console.log(`   ├─ dist/style.css`);
  console.log(`   ├─ dist/${path.basename(HTML_ENTRY)} (тільки вміст <body>)`);
  console.log(`   ├─ dist/script.js`);
  console.log(`   └─ dist/${path.basename(allHtmlPath)}`);
}

main().catch((err) => {
  console.error("❌ build failed", err);
  process.exit(1);
});
