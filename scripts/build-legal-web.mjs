/**
 * Generates deploy/web/privacy and deploy/web/terms from app source text.
 * Run: node scripts/build-legal-web.mjs
 */
import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const webRoot = join(root, "deploy/web");

function normalizeText(s) {
  return s.replace(/\\n/g, "\n");
}

function escapeHtml(s) {
  return normalizeText(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const GOOGLE_AW_ID = "AW-18199669116";
const GOOGLE_TAG_SNIPPET = `  <!-- Google tag (gtag.js) -->
  <script async src="https://www.googletagmanager.com/gtag/js?id=${GOOGLE_AW_ID}"></script>
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', '${GOOGLE_AW_ID}');
  </script>`;

function header(active) {
  const privacyClass = active === "privacy" ? ' aria-current="page"' : "";
  const termsClass = active === "terms" ? ' aria-current="page"' : "";
  return `<!DOCTYPE html>
<html lang="zh-Hant">
<head>
${GOOGLE_TAG_SNIPPET}
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>{{TITLE}} | Hyphen自由職</title>
  <meta name="description" content="{{DESC}}" />
  <link rel="stylesheet" href="/assets/site.css" />
</head>
<body>
  <header class="site-header">
    <div class="site-header-inner">
      <a class="brand" href="/">Hyphen<span>自由職</span></a>
      <nav class="nav" aria-label="法律文件">
        <a href="/privacy/"${privacyClass}>私隱政策</a>
        <a href="/terms/"${termsClass}>使用條款</a>
      </nav>
    </div>
  </header>
  <main>`;
}

function footer() {
  return `
    <footer class="site-footer">© Hyphen — All Rights Reserved</footer>
  </main>
</body>
</html>`;
}

function extractConst(name, filePath) {
  const src = readFileSync(join(root, filePath), "utf8");
  const re = new RegExp(`const ${name} = \`([\\s\\S]*?)\`;`);
  const m = src.match(re);
  if (!m) throw new Error(`Could not extract ${name} from ${filePath}`);
  return m[1];
}

function extractPrivacySections() {
  const src = readFileSync(join(root, "app/privacy.tsx"), "utf8");
  const vars = {
    PRIVACY_POLICY_TEXT: extractConst("PRIVACY_POLICY_TEXT", "app/privacy.tsx"),
    DATA_COLLECTION_TEXT: extractConst("DATA_COLLECTION_TEXT", "app/privacy.tsx"),
  };

  const sectionsStart = src.indexOf("const SECTIONS");
  const sectionsEnd = src.indexOf("];", sectionsStart);
  const block = src.slice(sectionsStart, sectionsEnd);

  const re =
    /\{\s*title:\s*"([^"]+)",\s*body:\s*(?:`([\s\S]*?)`|"((?:\\.|[^"\\])*)"|(PRIVACY_POLICY_TEXT|DATA_COLLECTION_TEXT))\s*,?\s*\}/g;
  const sections = [];
  let m;
  while ((m = re.exec(block)) !== null) {
    const title = m[1];
    const body = m[2] ?? m[3]?.replace(/\\n/g, "\n").replace(/\\"/g, '"') ?? vars[m[4]];
    if (!body) throw new Error(`Unknown body ref for section: ${title}`);
    sections.push({ title, body });
  }

  if (sections.length < 14) {
    throw new Error(`Expected 14 privacy sections, got ${sections.length}`);
  }
  return sections;
}

// Privacy page
const sections = extractPrivacySections();
const privacySections = sections
  .map(
    (s) =>
      `    <section>\n      <h2>${escapeHtml(s.title)}</h2>\n      <p>${escapeHtml(s.body)}</p>\n    </section>`,
  )
  .join("\n");

const privacyHtml =
  header("privacy")
    .replace("{{TITLE}}", "私隱政策")
    .replace("{{DESC}}", "Hyphen自由職私隱政策聲明及個人資料收集聲明") +
  `
    <h1>私隱政策</h1>
    <p class="subtitle">私隱政策聲明 / 個人資料收集聲明</p>
${privacySections}
` +
  footer();

mkdirSync(join(webRoot, "privacy"), { recursive: true });
writeFileSync(join(webRoot, "privacy/index.html"), privacyHtml, "utf8");

// Terms page
const termsText = extractConst("TERMS_TEXT", "app/terms.tsx");
const termsHtml =
  header("terms")
    .replace("{{TITLE}}", "使用條款")
    .replace("{{DESC}}", "Hyphen自由職使用條款及細則") +
  `
    <h1>使用條款</h1>
    <p class="subtitle">使用本平台前請細閱以下條款</p>
    <p class="legal-pre">${escapeHtml(termsText)}</p>
` +
  footer();

mkdirSync(join(webRoot, "terms"), { recursive: true });
writeFileSync(join(webRoot, "terms/index.html"), termsHtml, "utf8");

console.log(`Generated deploy/web/privacy/index.html (${sections.length} sections)`);
console.log("Generated deploy/web/terms/index.html");
