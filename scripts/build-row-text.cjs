/*
 * Ürün satırının metnini (ad satırı + ikinci satır: boy · kalori) uygulamanın
 * gösterdiği şekliyle üreten BAĞIMSIZ modülü yazar.
 *
 *   node scripts/build-row-text.cjs --app "<List-em uygulama deposunun yolu>"
 *   (--out verilmezse public/js/row-text.js)
 *
 * Elle yazılmış hesap yok. Modülün içindeki her satır uygulamanın kaynağından
 * gelir, uygulamanın kendi `typescript` paketiyle JS'e çevrilir:
 *   - src/utils/numberFormat.ts       → tamamı (sayı biçimi, "~123 kcal")
 *   - src/utils/calorieCalc.ts        → tamamı (boy → gram, satır kalorisi)
 *   - src/utils/variantTranslation.ts → tamamı (tür ve boy çevirisi)
 *   - src/data/catalog.ts             → CATALOG_BY_ID, CATALOG_BY_NAME,
 *                                       getItemDisplayName (katalog verisi
 *                                       CATALOG'dan, yalnız gereken alanlar)
 *   - src/utils/importList.ts         → buildShoppingListFromPayload (alınan
 *                                       listenin ürünü nasıl kurulduğu)
 *   - src/components/GroceryItem.tsx  → satırın metin ifadeleri (displayName,
 *                                       displayVariant, displaySize, title,
 *                                       subtitle) ve ikinci satırın koşulu ve
 *                                       birleşimi — JSX'ten olduğu gibi
 *   - src/i18n/strings.ts             → kcalUnit (iki dil)
 * Biri bulunamazsa (uygulamada yeri ya da adı değiştiyse) betik durur.
 *
 * Doğrulama: node scripts/row-text.test.cjs --app "<uygulama>"
 */
'use strict';
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

function arg(name) {
  const i = process.argv.indexOf(name);
  return i > -1 ? process.argv[i + 1] : undefined;
}

const appRoot = arg('--app') || process.env.LISTEM_APP;
if (!appRoot) {
  console.error('Kullanım: node scripts/build-row-text.cjs --app "<uygulama deposu>" [--out dosya.js]');
  process.exit(2);
}
const APP = path.resolve(appRoot);
const OUT = path.resolve(arg('--out') || path.join(__dirname, '..', 'public', 'js', 'row-text.js'));
const ts = require(path.join(APP, 'node_modules', 'typescript'));

// ── Uygulamanın .ts kaynağını Node'da yükle (yalnız derleme anındaki veri için) ─
const load = function (module, filename) {
  const out = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true, jsx: ts.JsxEmit.React },
    fileName: filename,
  });
  module._compile(out.outputText, filename);
};
require.extensions['.ts'] = load;
const appFile = (p) => path.join(APP, 'src', p);
const { CATALOG } = require(appFile('data/catalog.ts'));
const { strings } = require(appFile('i18n/strings.ts'));

// ── AST yardımcıları ─────────────────────────────────────────────────────────
function parse(rel) {
  const file = appFile(rel);
  const text = fs.readFileSync(file, 'utf8');
  return { file, text, sf: ts.createSourceFile(file, text, ts.ScriptTarget.ES2020, true, file.endsWith('x') ? ts.ScriptKind.TSX : ts.ScriptKind.TS) };
}
const nodeText = (src, node) => src.text.slice(node.getStart(src.sf), node.end);
function declName(st) {
  if (ts.isFunctionDeclaration(st) && st.name) return st.name.text;
  if (ts.isVariableStatement(st)) {
    const d = st.declarationList.declarations;
    if (d.length === 1 && ts.isIdentifier(d[0].name)) return d[0].name.text;
  }
  return null;
}
/** Dosyanın bütün import satırları + adı verilen üst düzey bildirimler. */
function pick(rel, names) {
  const src = parse(rel);
  const imports = [];
  const found = new Map();
  for (const st of src.sf.statements) {
    if (ts.isImportDeclaration(st)) imports.push(nodeText(src, st));
    const n = declName(st);
    if (n && names.includes(n)) found.set(n, nodeText(src, st));
  }
  for (const n of names) if (!found.has(n)) throw new Error(`${rel}: "${n}" bulunamadı`);
  return { file: src.file, imports, decls: names.map((n) => found.get(n)) };
}
function walk(node, fn) {
  fn(node);
  ts.forEachChild(node, (c) => walk(c, fn));
}

// ── GroceryItem.tsx: satırın metni ───────────────────────────────────────────
function groceryRowText() {
  const src = parse('components/GroceryItem.tsx');
  let fnBody = null;
  walk(src.sf, (n) => {
    if (ts.isFunctionDeclaration(n) && n.name && n.name.text === 'SwipeableGroceryItem') fnBody = n.body;
  });
  if (!fnBody) throw new Error('GroceryItem.tsx: SwipeableGroceryItem bulunamadı');

  const wanted = ['displayName', 'displayVariant', 'displaySize', 'title', 'subtitle'];
  const vars = new Map();
  for (const st of fnBody.statements) {
    const n = declName(st);
    if (n && wanted.includes(n)) vars.set(n, nodeText(src, st));
  }
  for (const n of wanted) if (!vars.has(n)) throw new Error(`GroceryItem.tsx: "${n}" bulunamadı`);

  // İkinci satır: `{(koşul) ? (<Text …>{birleşim}</Text>) : null}` — koşulun
  // doğru kolu, stilinde styles.meta taşıyan Text.
  const metas = [];
  walk(fnBody, (n) => {
    if (!ts.isConditionalExpression(n)) return;
    let w = n.whenTrue;
    while (ts.isParenthesizedExpression(w)) w = w.expression;
    if (!ts.isJsxElement(w) || w.openingElement.tagName.getText(src.sf) !== 'Text') return;
    const style = w.openingElement.attributes.properties.find((p) => p.name && p.name.getText(src.sf) === 'style');
    if (!style || !/styles\.meta\b/.test(style.getText(src.sf))) return;
    const exprs = w.children.filter((c) => ts.isJsxExpression(c) && c.expression);
    if (exprs.length !== 1) throw new Error('GroceryItem.tsx: ikinci satırın Text\'i tek ifade taşımıyor');
    metas.push({ cond: nodeText(src, n.condition), join: nodeText(src, exprs[0].expression) });
  });
  if (metas.length !== 1) throw new Error(`GroceryItem.tsx: ikinci satır ${metas.length} kez bulundu (1 bekleniyordu)`);
  return { file: src.file, imports: [], vars: wanted.map((n) => vars.get(n)), meta: metas[0] };
}

// ── Modüller ─────────────────────────────────────────────────────────────────
// Her modül bir uygulama dosyasının yolunu taşır; içindeki göreli import'lar o
// yoldan çözülür. Kullanılmayan import'ları TypeScript'in kendisi atar.
const rel = (file) => path.relative(path.join(APP, 'src'), file).replace(/\\/g, '/').replace(/\.tsx?$/, '');

const CATALOG_FIELDS = ['id', 'name', 'nameEn', 'emoji', 'category', 'kcal', 'protein', 'fat', 'fiber', 'variantNutrition'];
const compactCatalog = CATALOG.map((p) => {
  const o = {};
  for (const k of CATALOG_FIELDS) if (p[k] !== undefined) o[k] = p[k];
  return o;
});

const catalogPick = pick('data/catalog.ts', ['CATALOG_BY_ID', 'CATALOG_BY_NAME', 'getItemDisplayName']);
const importPick = pick('utils/importList.ts', ['_idCounter', 'makeId', 'buildShoppingListFromPayload']);
const row = groceryRowText();
const KCAL_UNIT = { tr: strings.tr.kcalUnit, en: strings.en.kcalUnit };

const modules = [
  { file: appFile('utils/numberFormat.ts'), source: fs.readFileSync(appFile('utils/numberFormat.ts'), 'utf8') },
  { file: appFile('utils/calorieCalc.ts'), source: fs.readFileSync(appFile('utils/calorieCalc.ts'), 'utf8') },
  { file: appFile('utils/variantTranslation.ts'), source: fs.readFileSync(appFile('utils/variantTranslation.ts'), 'utf8') },
  {
    file: catalogPick.file,
    source: [
      '// CATALOG: uygulamanın kataloğu, yalnız metnin okuduğu alanlar (' + CATALOG_FIELDS.join(', ') + ').',
      'const CATALOG = ' + JSON.stringify(compactCatalog) + ';',
      ...catalogPick.decls,
    ].join('\n'),
  },
  { file: importPick.file, source: [...importPick.imports, ...importPick.decls].join('\n') },
  {
    file: row.file,
    source: [
      ...parse('components/GroceryItem.tsx').sf.statements.filter(ts.isImportDeclaration).map((st) => st.getText()),
      "import { buildShoppingListFromPayload } from '../utils/importList';",
      'const KCAL_UNIT = ' + JSON.stringify(KCAL_UNIT) + ';',
      '',
      '/**',
      ' * Paylaşım verisindeki bir ürünün liste satırındaki metni.',
      ' * shareItem: { productId?, name?, variety?, quantity?, qty?, done? } — paylaşımdaki alanlar aynen.',
      ' * lang: sayfanın dili (\'tr\' | \'en\').',
      ' * Döner: { title, second } — title ad satırı ("<tür> <ad>"), second ikinci satır ya da null (satır çizilmez).',
      ' */',
      'export function rowText(shareItem: any, lang: \'tr\' | \'en\') {',
      '  // Alınan listenin ürünü uygulamada bu yoldan kurulur (utils/importList).',
      "  const item = buildShoppingListFromPayload({ v: 1, name: '', icon: '', items: [{ done: false, ...shareItem }] } as any).items[0];",
      '  const s = { kcalUnit: KCAL_UNIT[lang] };',
      '  // ── GroceryItem.tsx (SwipeableGroceryItem) — olduğu gibi ──',
      ...row.vars.map((v) => '  ' + v),
      '  const second = (' + row.meta.cond + ') ? (' + row.meta.join + ') : null;',
      '  return { title, second };',
      '}',
    ].join('\n'),
  },
];

function compile(m) {
  const out = ts.transpileModule(m.source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2018, esModuleInterop: false, removeComments: false },
    fileName: m.file,
  });
  return out.outputText.replace(/^"use strict";\n?/, '');
}

const ids = modules.map((m) => rel(m.file));
const bodies = modules.map((m, i) => {
  // Göreli import'u modül kimliğine çevir (derleme anında; çalışırken yol hesabı yok).
  const code = compile(m).replace(/require\("([^"]+)"\)/g, (all, spec) => {
    if (!spec.startsWith('.')) throw new Error(`${ids[i]}: dış paket import'u modüle giremez: ${spec}`);
    const target = path.posix.normalize(path.posix.join(path.posix.dirname(ids[i]), spec));
    if (!ids.includes(target)) throw new Error(`${ids[i]}: "${spec}" (${target}) modülde yok`);
    return `__require(${JSON.stringify(target)})`;
  });
  return `  ${JSON.stringify(ids[i])}: function (exports, __require) {\n${code.replace(/^/gm, '    ')}\n  },`;
});

const git = (...a) => execFileSync('git', ['-C', APP, ...a], { encoding: 'utf8' }).trim();
const commit = git('rev-parse', 'HEAD');
const dirty = git('status', '--porcelain', '--', 'src').length > 0;

const header = `/*
 * List-em — ürün satırının metni (ÜRETİLMİŞ DOSYA, elle düzenlenmez).
 *
 * Üreten: scripts/build-row-text.cjs · uygulama ${commit.slice(0, 7)}${dirty ? ' (işlenmemiş değişiklikle)' : ''}
 * Doğrulayan: scripts/row-text.test.cjs
 *
 * Kullanım (tarayıcı):  <script src="/js/row-text.js"></script> → ListemRowText.rowText(item, lang)
 * Kullanım (Node):      const { rowText } = require('../public/js/row-text.js')
 *
 *   rowText({ productId: 'sut', variety: 'Yarım yağlı', quantity: '1L', qty: 2 }, 'tr')
 *   → { title: 'Yarım yağlı Süt', second: '1L · ~1.000 kcal' }   (sayı ile birim arası bölünmez boşluk)
 *
 * Bağımlılık yok. İçindeki her şey uygulamanın kaynağından gelir (dosya adları
 * aşağıda modül kimliği olarak duruyor).
 */
`;

const bundle = `${header}(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.ListemRowText = factory();
})(typeof self !== 'undefined' ? self : this, function () {
'use strict';
var __defs = {
${bodies.join('\n')}
};
var __cache = {};
function __require(id) {
  if (__cache[id]) return __cache[id];
  var exports = {};
  __cache[id] = exports;
  __defs[id](exports, __require);
  return exports;
}
var row = __require(${JSON.stringify(rel(row.file))});
return {
  rowText: row.rowText,
  appCommit: ${JSON.stringify(commit)},
};
});
`;

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, bundle, 'utf8');
console.log(`${path.relative(process.cwd(), OUT)}: ${Buffer.byteLength(bundle)} bayt, ${modules.length} modül, app ${commit.slice(0, 7)}${dirty ? ' (dirty)' : ''}`);
