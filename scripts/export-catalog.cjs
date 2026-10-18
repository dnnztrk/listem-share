/*
 * Uygulamanın ürün kataloğunu sitenin kullanacağı tek bir JSON dosyasına döker.
 *
 *   node scripts/export-catalog.cjs --app "<List-em uygulama deposunun yolu>"
 *   (--out verilmezse public/data/catalog.json)
 *
 * Elle değer yazılmaz: katalog, reyon sırası, mevsimler, ad çevirileri ve kalori
 * hesabı uygulamanın GERÇEK kaynağından (src/data, src/utils/calorieCalc, src/i18n)
 * ve kendi fonksiyonlarından gelir. Kaynak, uygulamanın kendi `typescript`
 * paketiyle bellekte JS'e çevrilip yüklenir; uygulama deposunda hiçbir şey
 * yazılmaz, paket eklenmez. Katalog değişince aynı komut dosyayı yeniden üretir.
 *
 * Çıktı belirlenimcidir (yalnız meta.generatedAt değişir).
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
  console.error('Kullanım: node scripts/export-catalog.cjs --app "<uygulama deposu>" [--out dosya.json]');
  process.exit(2);
}
const APP = path.resolve(appRoot);
const OUT = path.resolve(arg('--out') || path.join(__dirname, '..', 'public', 'data', 'catalog.json'));

// ── Uygulamanın .ts kaynağını yükle (tip denetimi yok, yalnız çeviri) ────────
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

const src = (p) => require(path.join(APP, 'src', p));
const { CATALOG } = src('data/catalog.ts');
const { CATEGORIES } = src('data/categories.ts');
const { CATEGORY_EMOJIS } = src('data/categories.ts');
const { SEASONAL_DATA, getSeasonalBadge } = src('data/seasonal.ts');
const { strings } = src('i18n/strings.ts');
const calc = src('utils/calorieCalc.ts');

const git = (...a) => execFileSync('git', ['-C', APP, ...a], { encoding: 'utf8' }).trim();

// ── Yardımcılar ──────────────────────────────────────────────────────────────
const nutritionOf = (n) => ({ kcal: n.kcal, protein: n.protein, fat: n.fat, fiber: n.fiber });

/** Uygulamanın hesabıyla: bu ürün + (varyant) + boy, adet 1. */
function lineNutrition(item, variant, size) {
  const base = calc.getProductNutrition(item, variant);
  return calc.computeItemNutrition({
    id: 'x', name: item.name, category: item.category, checked: false,
    catalogId: item.id, variant, size, qty: 1, ...base,
  });
}

// ── Reyonlar ─────────────────────────────────────────────────────────────────
const categories = CATEGORIES.map((id, order) => ({
  id,
  order,
  nameTr: strings.tr.categories[id],
  nameEn: strings.en.categories[id],
  emoji: CATEGORY_EMOJIS[id],
  // Legacy: yalnız eski kayıtlar için; katalogda ürünü yok.
  legacy: !CATALOG.some((p) => p.category === id),
  food: !calc.isNonFoodCategory(id),
}));
const aisleOf = new Map(categories.map((c) => [c.id, c.order]));

// ── Ürünler ──────────────────────────────────────────────────────────────────
const products = CATALOG.map((p, catalogIndex) => {
  const hasNutrition = p.kcal != null || !!p.variantNutrition;
  const basis = hasNutrition ? calc.getProductNutrition(p) : null;

  const sizes = (p.sizes ?? []).map((label) => {
    const grams = calc.parseSizeToGrams(label);
    const line = hasNutrition ? lineNutrition(p, undefined, label) : null;
    return {
      label,
      // gram (ml sıvıda gramla eşdeğer sayılır — uygulamanın kuralı); çözülmüyorsa null
      grams,
      kcal: line && p.kcal != null ? line.total.kcal : null,
    };
  });

  let variantNutrition = null;
  if (p.variantNutrition) {
    variantNutrition = {};
    for (const v of p.variants ?? Object.keys(p.variantNutrition)) {
      if (p.variantNutrition[v]) variantNutrition[v] = nutritionOf(calc.getProductNutrition(p, v));
    }
  }

  const season = SEASONAL_DATA[p.id];
  const badge = getSeasonalBadge(p.category, 'tr');

  return {
    id: p.id,
    nameTr: p.name,
    nameEn: p.nameEn ?? null,
    emoji: p.emoji,
    category: p.category,
    aisle: aisleOf.get(p.category),
    catalogIndex,
    purchaseType: p.purchaseType ?? 'weight', // uygulamanın varsayılanı
    variants: [...(p.variants ?? [])],
    sizes,
    defaultSize: p.defaultSize ?? null,
    nutrition: hasNutrition
      ? {
          basis: 'per100g',
          ...nutritionOf(basis),
          variants: variantNutrition,
          // false → uygulama bu üründe kaloriyi göstermez (yiyecek dışı / kcal yok)
          shown: !calc.shouldHideCalories(p.category, p.kcal),
        }
      : null,
    season: season
      ? {
          months: [...season.months],
          yearRound: !!season.yearRound,
          labelTr: season.label_tr,
          labelEn: season.label_en,
          kind: badge.type, // 'land' | 'sea' (balık: sea)
        }
      : null,
  };
});

// ── Ek denetimler: kaynakta tutarsızlık varsa üretme ─────────────────────────
const ids = new Set();
for (const p of products) {
  if (ids.has(p.id)) throw new Error(`Yinelenen kimlik: ${p.id}`);
  ids.add(p.id);
  if (p.aisle === undefined) throw new Error(`Reyonu sıralamada yok: ${p.id} (${p.category})`);
}
for (const k of Object.keys(SEASONAL_DATA)) {
  if (!ids.has(k)) throw new Error(`Mevsim kaydının ürünü yok: ${k}`);
}

// ── Dosya ────────────────────────────────────────────────────────────────────
const doc = {
  meta: {
    schema: 1,
    generatedAt: new Date().toISOString(),
    app: {
      commit: git('rev-parse', 'HEAD'),
      commitDate: git('show', '-s', '--format=%cI', 'HEAD'),
      // true → üretim anında uygulamada işlenmemiş değişiklik vardı
      dirty: git('status', '--porcelain', '--', 'src').length > 0,
    },
    counts: {
      products: products.length,
      categories: categories.length,
      activeCategories: categories.filter((c) => !c.legacy).length,
      seasonal: products.filter((p) => p.season).length,
    },
    notes: {
      id: 'Ürün kimliği kalıcıdır: uygulamanın catalogId\'si, paylaşım verisindeki productId.',
      aisleOrder: 'categories[].order uygulamanın Sanal Reyon sırasıdır; ürünler katalog sırasındadır (catalogIndex).',
      nutrition: 'Değerler 100 g (ml sıvıda gramla eşdeğer) başınadır. Satır kalorisi = değer × gram × adet / 100; boy gram olarak çözülmüyorsa (adet, paket, "Yarım") değer × adet. nutrition.variants varsa o varyantın değeri kullanılır. nutrition null → besin verisi yok (0 değil). sizes[].kcal tek adetin uygulama hesabıyla kalorisi (varyantsız).',
      sizes: 'sizes[].label uygulamadaki seçenek metnidir ve paylaşımda quantity olarak aynen gider; grams çözülmüyorsa null.',
      purchaseType: '"weight": aynı ürün listeye bir kez eklenir; "unit": adet artırılabilir (×2, ×3).',
      season: 'season null → mevsim kaydı yok. yearRound true → yıl boyu (uygulama rozet göstermez). months 1=Ocak … 12=Aralık.',
    },
  },
  categories,
  products,
};

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(doc, null, 1) + '\n', 'utf8');
const bytes = fs.statSync(OUT).size;
console.log(`${path.relative(process.cwd(), OUT)}: ${products.length} ürün, ${categories.length} reyon, ${bytes} bayt, app ${doc.meta.app.commit.slice(0, 7)}${doc.meta.app.dirty ? ' (dirty)' : ''}`);
