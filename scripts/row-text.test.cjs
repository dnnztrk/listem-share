/*
 * public/js/row-text.js'i uygulamanın KENDİSİYLE karşılaştırır.
 *
 *   node scripts/row-text.test.cjs --app "<List-em uygulama deposunun yolu>"
 *   Çıkış kodu: hepsi geçerse 0.
 *
 * Uygulama tarafı (beklenen değer): paylaşım verisinden ürün uygulamanın kendi
 * içe aktarma yoluyla kurulur (src/utils/importList.ts → buildShoppingListFromPayload)
 * ve uygulamanın GERÇEK satır bileşeni (src/components/GroceryItem.tsx) sahte bir
 * React ile çizdirilir; beklenen metin çizilen ağaçtaki iki Text'ten okunur:
 * ad satırı (16 pt) ve ikinci satır (11 pt, tek satır). Bileşenin metin dışı
 * bağımlılıkları (React Native, Reanimated, dokunsal geri bildirim, tema ve dil
 * bağlamı) sahtedir; metni üreten her şey (katalog, çeviri, kalori, sayı
 * biçimi, metinler) uygulamanın gerçek kaynağıdır.
 *
 * Modül tarafı: üretilmiş dosya `require` olmadan, boş bir bağlamda çalıştırılır
 * (bağımsız olduğunun kanıtı).
 *
 * Kapsam: katalogdaki her ürün × (boysuz + her boy) × (türsüz + her tür) ×
 * adet (yok, 2, 3) × iki dil; kataloğu olmayan ürünler (adla, bilinmeyen
 * kimlikle) × katalogdaki her boy metni ve çeviri kalıplarının örnekleri.
 * Ek olarak: modül uygulamanın bugünkü kaynağından yeniden üretildiğinde
 * aynı çıkıyor mu (güncellik).
 *
 * SINAMADIKLARI: satırın görünüşü (renk, ölçü), mevsim rozeti, işaret hâli —
 * yalnız metin. Metnin cihazda kesilmesi (numberOfLines={1}) ölçüme bağlıdır.
 */
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const vm = require('vm');
const Module = require('module');
const { execFileSync } = require('child_process');

function arg(name) {
  const i = process.argv.indexOf(name);
  return i > -1 ? process.argv[i + 1] : undefined;
}
const appRoot = arg('--app') || process.env.LISTEM_APP;
if (!appRoot) {
  console.error('Kullanım: node scripts/row-text.test.cjs --app "<uygulama deposu>"');
  process.exit(2);
}
const APP = path.resolve(appRoot);
const SRC = path.join(APP, 'src');
const MODULE_FILE = path.join(__dirname, '..', 'public', 'js', 'row-text.js');

let failures = 0;
function report(ok, name, detail) {
  console.log(`${ok ? 'GEÇTİ' : 'KALDI'}  ${name}${detail ? ' — ' + detail : ''}`);
  if (!ok) failures++;
}

// ── Modül: boş bağlamda, require'sız ─────────────────────────────────────────
const sandbox = { module: { exports: {} } };
sandbox.exports = sandbox.module.exports;
vm.runInNewContext(fs.readFileSync(MODULE_FILE, 'utf8'), sandbox, { filename: MODULE_FILE });
const mod = sandbox.module.exports;
report(typeof mod.rowText === 'function', 'modül require olmadan yükleniyor', `uygulama ${String(mod.appCommit).slice(0, 7)}`);

// ── Uygulama: gerçek kaynak, metin dışı bağımlılıklar sahte ─────────────────
const ts = require(path.join(APP, 'node_modules', 'typescript'));
const load = function (module, filename) {
  const out = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true, jsx: ts.JsxEmit.React },
    fileName: filename,
  });
  module._compile(out.outputText, filename);
};
require.extensions['.ts'] = load;
require.extensions['.tsx'] = load;

const FakeReact = {
  createElement(type, props, ...children) {
    return { type, props: { ...(props || {}), children: children.flat(Infinity) } };
  },
  memo: (component) => ({ $$memo: true, type: component }),
  useMemo: (f) => f(),
  useCallback: (f) => f,
  useEffect: () => {},
  useRef: (v) => ({ current: v }),
};

// Tema: metni etkilemez; mevsim rozetinin renk hesabı geçerli bir hex ister.
const THEME = { colors: new Proxy({}, { get: () => '#EFEDE8' }), isDark: false };
const { strings } = require(path.join(SRC, 'i18n', 'strings.ts'));
let currentLang = 'tr';

const STUBS = {
  react: FakeReact,
  'react-native': {
    View: 'View', Text: 'Text', TouchableOpacity: 'TouchableOpacity',
    StyleSheet: { create: (o) => o, hairlineWidth: 0.5, absoluteFillObject: {} },
  },
  'react-native-gesture-handler/ReanimatedSwipeable': { __esModule: true, default: 'ReanimatedSwipeable' },
  'react-native-reanimated': {
    __esModule: true,
    default: { View: 'Animated.View' },
    useSharedValue: (v) => ({ value: v }),
    useAnimatedStyle: () => ({}),
    withTiming: (v) => v,
    cancelAnimation: () => {},
    interpolate: () => 0,
    Extrapolation: { CLAMP: 'clamp' },
    Easing: { inOut: () => 0, out: () => 0, ease: 0, cubic: 0 },
    runOnJS: (f) => f,
  },
  '@expo/vector-icons': { Ionicons: 'Ionicons' },
  'expo-haptics': {},
  './CheckCircle': { __esModule: true, default: 'CheckCircle' },
  '../context/ThemeContext': { useTheme: () => THEME },
  '../context/LanguageContext': { useLanguage: () => ({ lang: currentLang, s: strings[currentLang] }) },
};
const originalLoad = Module._load;
Module._load = function (request, parent, isMain) {
  if (parent && parent.filename && parent.filename.startsWith(SRC) && Object.prototype.hasOwnProperty.call(STUBS, request)) {
    return STUBS[request];
  }
  return originalLoad.call(this, request, parent, isMain);
};

const { buildShoppingListFromPayload } = require(path.join(SRC, 'utils', 'importList.ts'));
const GroceryRow = require(path.join(SRC, 'components', 'GroceryItem.tsx')).default;
const { CATALOG } = require(path.join(SRC, 'data', 'catalog.ts'));
if (!GroceryRow || !GroceryRow.$$memo) throw new Error('GroceryItem.tsx beklenen biçimde dışa vermiyor (React.memo)');

function flatStyle(style) {
  if (!style) return {};
  if (Array.isArray(style)) return Object.assign({}, ...style.map(flatStyle));
  return typeof style === 'object' ? style : {};
}
function collectTexts(node, out) {
  if (!node || typeof node !== 'object') return out;
  if (node.type === 'Text') out.push(node);
  for (const c of node.props.children || []) collectTexts(c, out);
  return out;
}
const textOf = (node) => node.props.children.filter((c) => typeof c === 'string' || typeof c === 'number').join('');

/** Uygulamanın ekranda gösterdiği: { title, second } */
function appRowText(shareItem, lang) {
  currentLang = lang;
  const payload = { v: 1, name: 'T', icon: '🛒', items: [{ done: false, ...shareItem }] };
  const item = buildShoppingListFromPayload(payload).items[0];
  const tree = GroceryRow.type({
    item, onPress() {}, onCheckPress() {}, activeSwipeRef: { current: null }, onDelete() {}, onToggle() {},
  });
  const texts = collectTexts(tree, []);
  const titles = texts.filter((t) => flatStyle(t.props.style).fontSize === 16 && t.props.numberOfLines === 1);
  const metas = texts.filter((t) => flatStyle(t.props.style).fontSize === 11 && t.props.numberOfLines === 1);
  if (titles.length !== 1 || metas.length > 1) throw new Error(`satır ağacı beklenmedik: ${titles.length} ad, ${metas.length} ikinci satır`);
  return { title: textOf(titles[0]), second: metas.length ? textOf(metas[0]) : null };
}

// ── Durumlar ────────────────────────────────────────────────────────────────
const cases = [];
for (const p of CATALOG) {
  const sizes = [undefined, ...(p.sizes || [])];
  const variants = [undefined, ...(p.variants || [])];
  for (const quantity of sizes) for (const variety of variants) for (const qty of [undefined, 2, 3]) {
    const it = { productId: p.id, name: p.name };
    if (variety !== undefined) it.variety = variety;
    if (quantity !== undefined) it.quantity = quantity;
    if (qty !== undefined) it.qty = qty;
    cases.push(it);
  }
}
const productCases = cases.length;
// Kataloğu olmayan ürünler: paylaşımın adı (gönderenin dilinde), bilinmeyen kimlik.
const allSizes = [...new Set(CATALOG.flatMap((p) => p.sizes || []))];
const extraSizes = ["6'lı paket", "12'li", '3 poşet', '4 rulo', '30 tablet', '2 adet', '1 bağ', 'bağ', '2 demet', '1 baş', 'Yarım', 'Bütün', '1 somun', '20 kapsül', '1 kafa'];
for (const quantity of [undefined, ...allSizes, ...extraSizes]) {
  for (const base of [{ name: 'Annemin reçeli' }, { name: 'süt' }, { name: 'Milk' }, { productId: 'yok-boyle-bir-urun', name: 'Bilinmeyen' }]) {
    for (const qty of [undefined, 2]) {
      const it = { ...base };
      if (quantity !== undefined) it.quantity = quantity;
      if (qty !== undefined) it.qty = qty;
      cases.push(it);
    }
  }
}
// İşaretli ürün (done) metni değiştirmez — yarısı işaretli.
cases.forEach((c, i) => { if (i % 2) c.done = true; });

let compared = 0;
let mismatches = 0;
const samples = [];
for (const lang of ['tr', 'en']) {
  for (const c of cases) {
    const want = appRowText(c, lang);
    const got = mod.rowText(c, lang);
    compared++;
    if (want.title !== got.title || want.second !== got.second) {
      mismatches++;
      if (samples.length < 10) samples.push(`${lang} ${JSON.stringify(c)}: uygulama ${JSON.stringify(want)}, modül ${JSON.stringify(got)}`);
    }
  }
}
report(mismatches === 0, 'modül = uygulamanın satırı',
  `${compared} karşılaştırma (${productCases} katalog durumu + ${cases.length - productCases} kataloğu olmayan, × 2 dil, ${CATALOG.length} ürün), ${mismatches} fark`);
for (const s of samples) console.log('       ' + s);

// ── Elle bilinen birkaç değer (karşılaştırmanın kendisi bozuksa yakalasın) ──
const NB = ' ';
const sut = CATALOG.find((p) => p.id === 'sut');
const anchors = [
  [{ productId: 'sut', quantity: '1L' }, 'en', { title: 'Milk', second: `1L · ~${sut.kcal * 10}${NB}kcal` }],
  [{ productId: 'sut', quantity: '1L', qty: 2 }, 'tr', { title: 'Süt', second: `1L · ~${(sut.kcal * 20).toLocaleString('de-DE')}${NB}kcal` }],
  [{ name: 'Annemin reçeli', quantity: '2 adet' }, 'en', { title: 'Annemin reçeli', second: '2 pc' }],
  [{ name: 'Annemin reçeli' }, 'tr', { title: 'Annemin reçeli', second: null }],
];
for (const [it, lang, want] of anchors) {
  const got = mod.rowText(it, lang);
  report(got.title === want.title && got.second === want.second, `elle bilinen: ${lang} ${JSON.stringify(it)}`, JSON.stringify(got));
}

// ── Güncellik: bugünkü kaynaktan yeniden üretilen modül aynı mı ─────────────
const tmp = path.join(os.tmpdir(), `row-text-${process.pid}.js`);
execFileSync(process.execPath, [path.join(__dirname, 'build-row-text.cjs'), '--app', APP, '--out', tmp], { stdio: 'pipe' });
const strip = (t) => t.split('\n').filter((l) => !/uygulama [0-9a-f]{7}|appCommit:/.test(l)).join('\n');
const fresh = strip(fs.readFileSync(tmp, 'utf8'));
fs.unlinkSync(tmp);
report(fresh === strip(fs.readFileSync(MODULE_FILE, 'utf8')), 'modül uygulamanın bugünkü kaynağıyla güncel',
  'değilse: node scripts/build-row-text.cjs --app <uygulama>');

console.log(failures === 0 ? '\nHepsi geçti.' : `\n${failures} denetim kaldı.`);
process.exit(failures === 0 ? 0 : 1);
