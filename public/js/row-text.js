/*
 * List-em — ürün satırının metni (ÜRETİLMİŞ DOSYA, elle düzenlenmez).
 *
 * Üreten: scripts/build-row-text.cjs · uygulama 13ba8e3
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
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.ListemRowText = factory();
})(typeof self !== 'undefined' ? self : this, function () {
'use strict';
var __defs = {
  "utils/numberFormat": function (exports, __require) {
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.formatInteger = formatInteger;
    exports.formatNumber = formatNumber;
    exports.formatMeasure = formatMeasure;
    exports.formatPercent = formatPercent;
    /**
     * SAYI BİÇİMİ — uygulamanın TEK biçimlendiricisi. Ekrana yazılan her kalori,
     * gram ve yüzde buradan geçer; başka bir yol yazılmaz (düzenek
     * scripts/sim/number-format.sim.js `src` içinde `toLocaleString` / `toFixed`
     * arar, StoryViewer hariç — Wrap-im madde 20'yle izole).
     *
     * AYRAÇLAR UYGULAMANIN DİLİNİ İZLER, cihazı değil: TR "15.859" ve "3,1",
     * EN "15,859" ve "3.1". Bir dönem üç ayrı yol vardı — iki biçimleyici
     * (biri ondalıkta hep noktalı: Detay'da "3.1g"), argümansız toLocaleString
     * (cihazın dili: EN telefonda TR uygulama "15,859") ve hiç biçimlenmemiş ham
     * sayı (ürün satırı, arama önerisi).
     *
     * ELLE YAZILDI, Intl'e bırakılmadı: Hermes'in Intl desteği platformdan
     * platforma değişiyor ve düzenek Node'da koşuyor — Intl'e bırakılsaydı düzenek
     * cihazdakinden başka bir motoru sınardı. Burada iki motor aynı kodu çalıştırır.
     *
     * KURAL (formatNumber): 10'un altında tek ondalık, sondaki sıfır atılır
     * ("3,1", "0,8", "3"); 10 ve üstü tamsayı, binlik ayraçlı ("85", "15.859").
     * Yuvarlama onda birlere yapılır ve sonra karar verilir: 9,96 → "10".
     *
     * BİRİM ÖNÜNDE HER ZAMAN BOŞLUK (formatMeasure): "3,1 g", "14 g",
     * "~15.859 kcal". Başlık "23 g" diyordu, öne çıkanlar "14g" — ikisi aynı
     * sayıydı. Boşluk bölünmez (NBSP): dar bir satırda sayı ile birimi iki satıra
     * ayrılmaz. Birimin kendisi çağırandan gelir (strings.ts → kcalUnit, gramUnit):
     * burada kullanıcıya görünen hiçbir kelime yok.
     *
     * YÜZDE (formatPercent): tamsayı; TR işaret önde ("%45", TDK), EN arkada
     * ("45%").
     */
    const SEPARATORS = {
        tr: { group: '.', decimal: ',' },
        en: { group: ',', decimal: '.' },
    };
    /** Sayı ile birim arası — bölünmez boşluk. */
    const UNIT_GAP = '\u00A0';
    /** Tahmin işareti — toplamlar ve katalogdan gelen değerler bir tahmindir. */
    const APPROX = '~';
    /** Sonlu olmayan değerin yeri — ekranların "—"su. Hesap hatası "NaN" yazmaz. */
    const NOT_A_NUMBER = '—';
    function groupDigits(n, sep) {
        const digits = String(n);
        let out = '';
        for (let i = 0; i < digits.length; i++) {
            if (i > 0 && (digits.length - i) % 3 === 0)
                out += sep;
            out += digits[i];
        }
        return out;
    }
    /** Tamsayı, binlik ayraçlı ("15.859" / "15,859"). */
    function formatInteger(value, lang) {
        if (!Number.isFinite(value))
            return NOT_A_NUMBER;
        const n = Math.round(Math.abs(value));
        const sign = value < 0 && n > 0 ? '-' : '';
        return sign + groupDigits(n, SEPARATORS[lang].group);
    }
    /** Uygulamanın gösterim kuralı — dosyanın başındaki KURAL. */
    function formatNumber(value, lang) {
        if (!Number.isFinite(value))
            return NOT_A_NUMBER;
        const abs = Math.abs(value);
        // Onda birlik tamsayı: kayan noktanın 0,1 artığı buradan geçmez.
        const tenths = Math.round(abs * 10);
        if (tenths >= 100)
            return formatInteger(value, lang);
        const sign = value < 0 && tenths > 0 ? '-' : '';
        const whole = Math.floor(tenths / 10);
        const decimal = tenths % 10;
        return sign + String(whole) + (decimal === 0 ? '' : SEPARATORS[lang].decimal + String(decimal));
    }
    /** Sayı + birim: "3,1 g", "~15.859 kcal". `approx` tahmin işaretini ekler. */
    function formatMeasure(value, unit, lang, opts = {}) {
        return `${opts.approx ? APPROX : ''}${formatNumber(value, lang)}${UNIT_GAP}${unit}`;
    }
    /** Yüzde, tamsayı: TR "%45", EN "45%". */
    function formatPercent(value, lang) {
        if (!Number.isFinite(value))
            return NOT_A_NUMBER;
        const n = Math.round(Math.abs(value));
        const sign = value < 0 && n > 0 ? '-' : '';
        const digits = groupDigits(n, SEPARATORS[lang].group);
        return lang === 'tr' ? `${sign}%${digits}` : `${sign}${digits}%`;
    }
    
  },
  "utils/calorieCalc": function (exports, __require) {
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NON_FOOD_CATEGORIES = void 0;
    exports.isNonFoodCategory = isNonFoodCategory;
    exports.shouldHideCalories = shouldHideCalories;
    exports.isMeasuredLine = isMeasuredLine;
    exports.getProductNutrition = getProductNutrition;
    exports.catalogMacros = catalogMacros;
    exports.parseSizeToGrams = parseSizeToGrams;
    exports.computeItemKcal = computeItemKcal;
    exports.computeListKcal = computeListKcal;
    exports.hasFoodItems = hasFoodItems;
    exports.computeItemNutrition = computeItemNutrition;
    // ── Non-food category detection ───────────────────────────────────────────────
    /** Categories that never show calorie info */
    exports.NON_FOOD_CATEGORIES = new Set([
        'Cleaning',
        'PersonalCare',
        'HomeAndKitchen',
        // Legacy (PaperProducts merged into Cleaning, Health merged into PersonalCare)
        'PaperProducts',
        'Health',
    ]);
    /**
     * Returns true if this item's category is a non-food category.
     * Baby and Pets items are considered food if they have a kcal value set.
     */
    function isNonFoodCategory(category) {
        return exports.NON_FOOD_CATEGORIES.has(category);
    }
    /**
     * Returns true if calorie info should be hidden for this item.
     * Hides when: non-food category, OR kcal is null/undefined.
     * Baby/Pets: show calories only when kcal is set (food items like mama/wet food).
     */
    function shouldHideCalories(category, kcal) {
        if (isNonFoodCategory(category))
            return true;
        if (kcal == null)
            return true;
        return false;
    }
    /**
     * ÖLÇÜLEN SATIR — "ölçülen fiş" tanımının satır yarısı (fiş yarısı:
     * calorieAnalytics → isMeasuredTrip). Gıda satırı ve kalori verisi var.
     * Yiyecek dışı kategorideki kcal bir ölçüm DEĞİLDİR: eklenirken katalogda
     * kcal'i olmayan ürün `0` alıyor (getProductNutrition), yani bir temizlik
     * ürününün `0`'ı "ölçüldü, sıfır" değil "hiç ölçülmedi" demektir. Gıdanın
     * `0`'ı (su) ise ölçümdür.
     */
    function isMeasuredLine(item) {
        return item.kcal != null && !exports.NON_FOOD_CATEGORIES.has(item.category);
    }
    // ── Product nutrition lookup ─────────────────────────────────────────────────
    /**
     * Resolves full nutrition (kcal, protein, fat, fiber) for a catalog item.
     * If a variant is given and exists in variantNutrition, returns that.
     * Otherwise falls back to top-level values.
     */
    function getProductNutrition(item, variant) {
        var _a, _b, _c, _d, _e;
        if (variant && ((_a = item.variantNutrition) === null || _a === void 0 ? void 0 : _a[variant])) {
            return item.variantNutrition[variant];
        }
        return {
            kcal: (_b = item.kcal) !== null && _b !== void 0 ? _b : 0,
            protein: (_c = item.protein) !== null && _c !== void 0 ? _c : 0,
            fat: (_d = item.fat) !== null && _d !== void 0 ? _d : 0,
            fiber: (_e = item.fiber) !== null && _e !== void 0 ? _e : 0,
        };
    }
    /**
     * Katalogdan ürüne kopyalanacak MAKRO alanları (g / 100 g). Tek okuma yeri:
     * ürün eklenirken, türü değişirken ve eski ürünlerin hydrate doldurmasında.
     * Kataloğu olmayan ya da besin verisi taşımayan üründe boş nesne döner —
     * yayıldığında hiçbir alanı yazmaz, `0` üretmez. kcal'e dokunmaz: kcal'in
     * kendi yolu var ve o yol değişmedi.
     */
    function catalogMacros(entry, variant) {
        var _a;
        if (!entry)
            return {};
        const hasVariantNutrition = !!(variant && ((_a = entry.variantNutrition) === null || _a === void 0 ? void 0 : _a[variant]));
        if (!hasVariantNutrition && entry.kcal == null)
            return {};
        const n = getProductNutrition(entry, variant);
        return { protein: n.protein, fat: n.fat, fiber: n.fiber };
    }
    // ── Size parsing ──────────────────────────────────────────────────────────────
    /**
     * Parses a size string into grams (or ml, treated equivalently for kcal).
     * Returns null for non-parseable sizes (adet-based, 'Yarım'/'Bütün', etc.).
     *
     * Examples:
     *   '500g'  → 500
     *   '1kg'   → 1000
     *   '1.5kg' → 1500
     *   '200ml' → 200
     *   '1L'    → 1000
     *   '1.5L'  → 1500
     */
    function parseSizeToGrams(size) {
        if (!size)
            return null;
        const s = size.trim();
        // Grams: '500g', '250g'
        const gMatch = s.match(/^(\d+(?:\.\d+)?)\s*g$/i);
        if (gMatch)
            return parseFloat(gMatch[1]);
        // Kilograms: '1kg', '1.5kg', '2kg'
        const kgMatch = s.match(/^(\d+(?:\.\d+)?)\s*kg$/i);
        if (kgMatch)
            return parseFloat(kgMatch[1]) * 1000;
        // Millilitres: '200ml', '330ml', '500ml'
        const mlMatch = s.match(/^(\d+(?:\.\d+)?)\s*ml$/i);
        if (mlMatch)
            return parseFloat(mlMatch[1]);
        // Litres: '1L', '1.5L', '2L'
        const lMatch = s.match(/^(\d+(?:\.\d+)?)\s*[Ll]$/);
        if (lMatch)
            return parseFloat(lMatch[1]) * 1000;
        return null;
    }
    // ── Satır kalorisi — TEK HESAP ────────────────────────────────────────────────
    //
    // Bir satırın kalorisi ve makroları YALNIZ computeItemNutrition'dan çıkar;
    // computeItemKcal onun kcal'idir, liste toplamları (computeListKcal,
    // calorieAnalytics → computeListNutrition) satırların bu değerlerinin
    // toplamıdır. Bir dönem üç ayrı yerde üç ayrı çarpım vardı ve aynı satır
    // canlı ekranda ile fişte 1 kcal farklı çıkıyordu: 330 ml × 3 hard seltzer
    // (35 kcal/100 ml) → `35 × 330 / 100 × 3` = 346,5 → 347, ama
    // `35 × (330 / 100 × 3)` = 346,4999… → 346 (kayan nokta). Çarpım artık tek
    // sırada: değer × gram × adet ÖNCE, 100'e bölme SONRA — tamsayılar kesin
    // kalır, yuvarlama gerçek değere uygulanır.
    /**
     * Satırın 100 g başına değerini boy × adete ölçekler. Boy çözülüyorsa
     * değer × gram × adet / 100; çözülmüyorsa (adet, 'Yarım', boy yok) değer × adet
     * ("adet × 100 g başına değer").
     */
    function scaleLine(per100g, grams, qty) {
        return grams !== null ? (per100g * grams * qty) / 100 : per100g * qty;
    }
    /**
     * Computes total kcal for a grocery item — computeItemNutrition'ın kcal'i.
     * Returns null when kcal is not set.
     */
    function computeItemKcal(item) {
        if (item.kcal == null)
            return null;
        return computeItemNutrition(item).total.kcal;
    }
    // ── List-level calorie calculation ────────────────────────────────────────────
    /** Returns total kcal of ALL food items in the list (checked + unchecked).
     *  Checked = "bought/in cart", not "removed". User deletes items they don't want.
     *  Satırların computeItemKcal toplamı — fişin toplamıyla (computeListNutrition)
     *  aynı toplama. */
    function computeListKcal(items) {
        return items
            .filter((item) => item.kcal != null)
            .reduce((sum, item) => { var _a; return sum + ((_a = computeItemKcal(item)) !== null && _a !== void 0 ? _a : 0); }, 0);
    }
    /**
     * Listede ÖLÇÜLEN satır var mı (checked or unchecked) — isMeasuredLine, yani
     * "ölçülen fiş"in satır kuralı. Özet kartın ve liste kartının kapısı; Detay'ın
     * canlı hâli aynı kuralla karar verir. Bir dönem `kcal != null` idi: yalnız
     * temizlik ürünü olan bir liste (eklenirken 0 kcal alırlar) "~0 kcal" kartı
     * gösterip Detay'ın boş durumuna götürüyordu.
     */
    function hasFoodItems(items) {
        return items.some(isMeasuredLine);
    }
    /**
     * Computes full nutrition for a grocery item, applying size and quantity multipliers.
     * Unlike getProductNutrition (which returns per-100g), this returns both total and per-100g
     * for all 4 metrics (kcal, protein, fat, fiber). SATIR KALORİSİNİN TEK HESABI.
     *
     * Kaynak ürünün KENDİ alanları, katalog değil: kcal ve makrolar ekleme anında
     * kopyalanmıştır (bkz. catalogMacros). Katalog burada okunmaz.
     */
    function computeItemNutrition(item) {
        var _a, _b, _c, _d, _e, _f;
        const per100g = {
            kcal: (_a = item.kcal) !== null && _a !== void 0 ? _a : 0,
            protein: (_b = item.protein) !== null && _b !== void 0 ? _b : 0,
            fat: (_c = item.fat) !== null && _c !== void 0 ? _c : 0,
            fiber: (_d = item.fiber) !== null && _d !== void 0 ? _d : 0,
        };
        const grams = item.size ? parseSizeToGrams(item.size) : null;
        const qty = (_e = item.qty) !== null && _e !== void 0 ? _e : 1;
        const hasMultiplier = grams !== null;
        // Boy yokken de adet çarpılır: bir dönem çarpılmıyordu ve makro liderleri /
        // kategori dağılımı 3 yumurtayı 1 yumurta sayarken kcal toplamı 3 sayıyordu.
        const total = {
            kcal: Math.round(scaleLine(per100g.kcal, grams, qty)),
            protein: Math.round(scaleLine(per100g.protein, grams, qty) * 10) / 10,
            fat: Math.round(scaleLine(per100g.fat, grams, qty) * 10) / 10,
            fiber: Math.round(scaleLine(per100g.fiber, grams, qty) * 10) / 10,
        };
        return {
            total,
            per100g,
            sizeLabel: hasMultiplier ? ((_f = item.size) !== null && _f !== void 0 ? _f : null) : null,
            hasMultiplier,
        };
    }
    // Gösterim biçimi burada değil: utils/numberFormat.ts (formatNumber,
    // formatMeasure, formatPercent) — uygulamanın tek sayı biçimlendiricisi.
    
  },
  "utils/variantTranslation": function (exports, __require) {
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.translateVariant = translateVariant;
    exports.translateSize = translateSize;
    exports.itemLabelOf = itemLabelOf;
    const catalog_1 = __require("data/catalog");
    /**
     * Maps Turkish variant display names → descriptive English equivalents.
     *
     * Philosophy: an expat/tourist in Turkey should be able to RECOGNISE the
     * product from the English label. International terms stay as-is; regional
     * Turkish names get a descriptive English counterpart.
     *
     * INVARIANT — a variant value NEVER repeats the product's own name.
     * The list row is rendered as "<variant> <product>", so a value that carries
     * the product noun stutters: variant 'Erzincan Tulum' on 'Tulum Cheese' printed
     * "Erzincan Tulum Tulum Cheese". A variant only QUALIFIES; the noun belongs to
     * the product. Hence 'Erzincan', 'Wildflower', 'Vine', 'Extra Virgin' — never
     * 'Erzincan Tulum', 'Wildflower Honey', 'Vine Tomato', 'Extra Virgin Olive Oil'.
     *
     * Corollary — proper names (places and cultivars) stand BARE: no parenthetical
     * gloss, no appended qualifier. 'Ezine', not 'Ezine (Protected Origin)';
     * 'Golden', not 'Golden Delicious'; '0900 Ziraat', not 'Sweet Cherry'. A proper
     * name is neither translated nor explained inside the chip.
     *
     * Two values under the same product must also stay distinct: 'Can' →
     * 'Early Green' (not 'Green') because Erik already carries 'Yeşil' → 'Green',
     * and 'Bursa siyahı' → 'Bursa' (not 'Black') because İncir already has 'Siyah'.
     * Same reason 'Pudra' → 'Icing' rather than 'Powdered': Şeker already carries
     * 'Toz' → 'Powder', and the two must not collapse to the same English word.
     *
     * Where no English term is both accurate and unambiguous, the Turkish name
     * stands untranslated — 'Su böreği' and 'Sigara böreği' are dish names, not
     * descriptions, and "Water Pastry" / "Cigar Pastry" named nothing a shopper
     * could find.
     *
     * Keys are shared across products, so a value must fit EVERY product that uses
     * it — TR_EN is a flat map and translateVariant() takes no product context, so
     * a value tuned for one product lands on all of them. 'Toz' reaches Şeker,
     * Tarçın, Vanilya and Çamaşır deterjanı; 'Powder' is what fits all four, so
     * Şeker's disambiguation from 'Pudra' has to happen on 'Pudra' instead.
     */
    const TR_EN = {
        // ── Fruit varieties ──────────────────────────────────────────────────────
        'Starking': 'Starking',
        'Golden': 'Golden',
        'Granny Smith': 'Granny Smith',
        'Amasya': 'Amasya',
        'Fuji': 'Fuji',
        'Deveci': 'Deveci',
        'Santa Maria': 'Santa Maria',
        'Meyer': 'Meyer',
        'Satsuma': 'Satsuma',
        'Nova': 'Nova',
        'İnce kabuk': 'Thin Skin',
        'Kalın kabuk': 'Thick Skin',
        'Hicaz': 'Hicaz',
        'Ekşi': 'Sour',
        'Çekirdekli': 'With Seeds',
        'Çekirdeksiz': 'Seedless',
        '0900 Ziraat': '0900 Ziraat',
        'Napolyon': 'Napoleon',
        'Stella': 'Stella',
        'Yassı': 'Flat',
        'Can': 'Early Green',
        'Mürdüm': 'Damson',
        'Kırkağaç': 'Kırkağaç',
        'Yuva': 'Yuva',
        'Çekirge': 'Çekirge',
        'Kent': 'Kent',
        'Tommy Atkins': 'Tommy Atkins',
        'Bursa siyahı': 'Bursa',
        'Kan portakalı': 'Blood',
        'Sıkmalık': 'Juicing',
        'Sofralık': 'Eating',
        // ── Vegetables ───────────────────────────────────────────────────────────
        'Salkım': 'Vine',
        'Cherry': 'Cherry',
        'Kokteyl': 'Cocktail',
        'Çarliston': 'Long Green',
        'Sivri': 'Pointed',
        'Kapya': 'Red Bell',
        'Dolmalık': 'Stuffing',
        'Kemer': 'Long',
        'Topan': 'Round',
        'Yemeklik': 'Cooking',
        'Kızartmalık': 'Frying',
        'Arpacık': 'Shallot',
        'Kıvırcık': 'Curly Lettuce',
        'Göbek': 'Romaine Lettuce',
        'Kök': 'Root',
        'Sap': 'Stalk',
        'Kültür': 'Button',
        'İstiridye': 'Oyster',
        'Ayşe kadın': 'Ayşe kadın',
        'Çalı': 'Bush',
        'Bal kabağı': 'Butternut',
        'Sakız': 'Sakız',
        // ── Colors (context-independent) ─────────────────────────────────────────
        'Kırmızı': 'Red',
        'Beyaz': 'White',
        'Siyah': 'Black',
        'Yeşil': 'Green',
        'Sarı': 'Yellow',
        // ── Generic / quality ────────────────────────────────────────────────────
        'Sade': 'Plain',
        'Klasik': 'Classic',
        'Orijinal': 'Original',
        'Karışık': 'Mixed',
        'Normal': 'Regular',
        'Taze': 'Fresh',
        'Kuru': 'Dry',
        'Olgun': 'Mature',
        'Yerli': 'Local',
        'İthal': 'Imported',
        'Organik': 'Organic',
        'Light': 'Light',
        'Dilim': 'Sliced',
        'Bütün': 'Whole',
        'Yarım': 'Half',
        'Fileto': 'Fillet',
        // ── Dairy / Cheese / Eggs ────────────────────────────────────────────────
        'Tam yağlı': 'Full Fat',
        'Yarım yağlı': 'Semi-Skimmed',
        'Az yağlı': 'Lean',
        'Orta yağlı': 'Medium Fat',
        'Laktozsuz': 'Lactose-Free',
        'Şekersiz': 'Sugar-Free',
        'Çikolatalı': 'Chocolate',
        'Çilekli': 'Strawberry',
        'Muzlu': 'Banana',
        'Vanilyalı': 'Vanilla',
        'Barista': 'Barista',
        'Meyveli': 'Fruit',
        'İnek': 'Cow',
        'Koyun': 'Sheep',
        'Keçi': 'Goat',
        'Ezine': 'Ezine',
        'Çanakkale': 'Çanakkale',
        'Erzincan': 'Erzincan',
        'Divle': 'Divle',
        'İzmir': 'İzmir',
        'Bergama': 'Bergama',
        'Eski': 'Aged',
        'Top': 'Ball',
        'Rende': 'Grated',
        'Füme': 'Smoked',
        'İsli': 'Smoked',
        'Tuzlu': 'Salted',
        'Tuzsuz': 'Unsalted',
        'Kahverengi': 'Brown',
        'Gezen tavuk': 'Free-Range',
        'Sıvı krema': 'Heavy',
        'Krem şanti': 'Whipped',
        'Sele': 'Dry-Cured',
        'Salamura': 'Brined',
        'Kırma': 'Cracked',
        'Dolgulu': 'Stuffed',
        // ── Honey / Jam / Spreads ────────────────────────────────────────────────
        'Çiçek': 'Wildflower',
        'Çam': 'Pine',
        'Kestane': 'Chestnut',
        'Çilek': 'Strawberry',
        'Vişne': 'Sour Cherry',
        'Kayısı': 'Apricot',
        'Böğürtlen': 'Blackberry',
        'Üzüm': 'Grape',
        'Dut': 'Mulberry',
        'Kakaolu': 'Cocoa',
        'Parçacıklı': 'Crunchy',
        // ── Meat / Poultry / Charcuterie ─────────────────────────────────────────
        'Bütün but': 'Whole Leg',
        'Baget': 'Drumstick',
        'Fermente': 'Fermented',
        'Isıl işlem': 'Heat-Treated',
        'Kangal': 'Coil',
        'Dana': 'Beef',
        'Hindi': 'Turkey',
        'Kuzu': 'Lamb',
        'Tavuk': 'Chicken',
        'Piliç': 'Poultry',
        'Çemenli': 'Coated',
        'Çemensiz': 'Uncoated',
        'Uzun': 'Long',
        // ── Bakery / Snacks ──────────────────────────────────────────────────────
        'Peynirli': 'Cheese',
        'Zeytinli': 'Olive',
        'Bademli': 'Almond',
        'Tereyağlı': 'Butter',
        'Yer fıstığı': 'Peanut',
        'Havuçlu': 'Carrot',
        'Damla çikolatalı': 'Chocolate Chip',
        'Baharatlı': 'Spicy',
        'Acı': 'Hot',
        'Barbecue': 'Barbecue',
        'Yoğurtlu': 'Yogurt',
        'Fırınlanmış': 'Baked',
        'Sütlü': 'Milk',
        'Bitter': 'Dark',
        'Fındıklı': 'Hazelnut',
        'Fıstıklı': 'Pistachio',
        'Karamelli': 'Caramel',
        'Fındık': 'Hazelnut',
        'Çikolata': 'Chocolate',
        'Karamel': 'Caramel',
        'Yulaflı': 'Oat',
        'Susamlı': 'Sesame',
        'Jöle şeker': 'Jelly',
        'Yumuşak şeker': 'Soft',
        'Naneli': 'Mint',
        'Badem': 'Almond',
        'Kaju': 'Cashew',
        'Antep fıstığı': 'Pistachio',
        'Ay çekirdeği': 'Sunflower Seed',
        'Kabak çekirdeği': 'Pumpkin Seed',
        'Kuru kayısı': 'Apricot',
        'Kuru incir': 'Fig',
        'Kuru üzüm': 'Raisin',
        // ── Frozen ───────────────────────────────────────────────────────────────
        'Sucuklu': 'Sausage',
        'Ispanaklı': 'Spinach',
        'Sorbe': 'Sorbet',
        'Vegan': 'Vegan',
        'Su böreği': 'Su böreği',
        'Sigara böreği': 'Sigara böreği',
        'Limonlu': 'Lemon',
        'Çikolata kaplı': 'Chocolate Coated',
        'Vanilya': 'Vanilla',
        // ── Pantry / Spices / Baking ─────────────────────────────────────────────
        'Tane': 'Whole',
        'Öğütülmüş': 'Ground',
        'Tatlı': 'Sweet',
        'Çubuk': 'Stick',
        'Toz': 'Powder',
        'Sıvı özüt': 'Liquid Extract',
        'Yaş': 'Fresh',
        'Pilavlık': 'Pilaf',
        'Köftelik': 'Fine',
        'Baldo': 'Baldo',
        'Osmancık': 'Osmancık',
        'Jasmin': 'Jasmine',
        'Burgu': 'Fusilli',
        'Fiyonk': 'Farfalle (Bowtie)',
        'Penne': 'Penne',
        'Tam buğday': 'Whole Wheat',
        'Glutensiz': 'Gluten-Free',
        'Çok amaçlı': 'All-Purpose',
        'Baklavalık': 'Pastry',
        'Küp': 'Cube',
        'Esmer': 'Brown',
        'Pudra': 'Icing',
        'İyotlu': 'Iodized',
        'Kaya tuzu': 'Rock',
        'Himalaya': 'Himalayan',
        'Deniz tuzu': 'Sea',
        'Riviera': 'Riviera',
        'Natürel sızma': 'Extra Virgin',
        'Erken hasat': 'Early Harvest',
        'Elma sirkesi': 'Apple Cider',
        'Üzüm sirkesi': 'Grape',
        'Nar ekşisi': 'Pomegranate Molasses',
        'Mercimek': 'Lentil',
        'Ezogelin': 'Ezogelin',
        'Tavuklu': 'Chicken',
        'Salatalık': 'Cucumber',
        'Lahana': 'Cabbage',
        // ── Beverages ────────────────────────────────────────────────────────────
        'Elmalı': 'Apple',
        'Portakallı': 'Orange',
        'Karpuz-çilek': 'Watermelon-Strawberry',
        'Zero': 'Zero',
        'Max': 'Max',
        'Limon': 'Lemon',
        'Elma': 'Apple',
        'Portakal': 'Orange',
        'Şeftali': 'Peach',
        'Bitki': 'Herbal',
        'Ihlamur': 'Linden',
        'Papatya': 'Chamomile',
        'Adaçayı': 'Sage',
        'Kuşburnu': 'Rosehip',
        'Acısız': 'Mild',
        'Türk': 'Turkish',
        'Filtre': 'Filter',
        'Espresso': 'Espresso',
        'Granül': 'Instant',
        // ── Alcoholic Beverages ──────────────────────────────────────────────────
        'Lager': 'Lager',
        'Buğday': 'Wheat',
        'IPA': 'IPA',
        'Stout': 'Stout',
        'Aromalı': 'Flavored',
        'Alkolsüz': 'Alcohol-Free',
        'Roze': 'Rosé',
        'Köpüklü': 'Sparkling',
        'Kahve': 'Coffee',
        'Kremalı': 'Cream',
        // ── Personal Care ────────────────────────────────────────────────────────
        'SPF 30': 'SPF 30',
        'SPF 50': 'SPF 50',
        'SPF 50+': 'SPF 50+',
        'Çocuk': 'Kids',
        'Yumuşak': 'Soft',
        'Orta': 'Medium',
        'Sert': 'Hard',
        'Elektrikli': 'Electric',
        'Sprey': 'Spray',
        'Roll-on': 'Roll-On',
        'Stick': 'Stick',
        'Beyazlatıcı': 'Whitening',
        'Hassas Dişler': 'Sensitive',
        'Kepek': 'Anti-Dandruff',
        'Dökülme': 'Anti-Hair Loss',
        'Boyalı Saç': 'Color-Treated',
        'Kuru Saç': 'Dry Hair',
        'Onarıcı': 'Repair',
        'Nemlendirici': 'Moisturizing',
        'Ferahlatıcı': 'Refreshing',
        'Hassas Cilt': 'Sensitive Skin',
        // ── Cleaning ─────────────────────────────────────────────────────────────
        'Sıvı': 'Liquid',
        'Kapsül': 'Capsule',
        'Bebek': 'Baby',
        'Konsantre': 'Concentrated',
        'Elde Yıkama': 'Hand Wash',
        'Makine': 'Dishwasher',
        'Mutfak': 'Kitchen',
        'Banyo': 'Bathroom',
        'Genel': 'General',
        // ── Home & Kitchen ───────────────────────────────────────────────────────
        'AA': 'AA',
        'AAA': 'AAA',
        // ── Breakfast ────────────────────────────────────────────────────────────
        'Ballı': 'Honey',
        'Protein': 'Protein',
        // ── Eggs ─────────────────────────────────────────────────────────────────
        "10'lu": '10-pack',
        "15'li": '15-pack',
        "30'lu": '30-pack',
    };
    /** Translate a Turkish variant name to the current language */
    function translateVariant(trVariant, lang) {
        var _a;
        if (lang !== 'en')
            return trVariant;
        return (_a = TR_EN[trVariant]) !== null && _a !== void 0 ? _a : trVariant;
    }
    /** Translate a Turkish size string to the current language */
    function translateSize(trSize, lang) {
        if (lang !== 'en')
            return trSize;
        return trSize
            // Turkish group suffix (N'lı/N'li/N'lu/N'lü) → "N-pack".
            // The compound form MUST run before the plain `paket` → `pack` swap below,
            // otherwise "6'lı paket" would become "6-pack pack".
            .replace(/(\d+)['’]l[ıiuü]\s+paket/g, '$1-pack')
            .replace(/(\d+)['’]l[ıiuü]/g, '$1-pack')
            .replace(/(\d+)\s+poşet/g, '$1 bags')
            .replace(/(\d+)\s+rulo/g, '$1 roll')
            .replace(/(\d+)\s+tablet/g, '$1 tablets')
            .replace(/\badet\b/gi, 'pc')
            .replace(/\bbağ\b/gi, 'bunch')
            .replace(/\bpaket\b/gi, 'pack')
            .replace(/\bsomun\b/gi, 'loaf')
            .replace(/\bkapsül\b/gi, 'caps')
            .replace(/\bkafa\b/gi, 'head')
            .replace(/\bdemet\b/gi, 'bunch')
            .replace(/\bbaş\b/gi, 'head')
            .replace(/\bYarım\b/g, 'Half')
            .replace(/\bBütün\b/g, 'Whole');
    }
    /**
     * Bir satırın ekrandaki adı: (çevrilmiş tür) + katalog adı — "Yarım yağlı Süt".
     * Detay ve Geçmiş'in öne çıkanlar satırları, fişin ürün satırı aynı yolu
     * okur; ad ve tür EN'de katalogdan çözülür, TR'de kayıtlı hâliyle.
     */
    function itemLabelOf(item, lang) {
        const base = (0, catalog_1.getItemDisplayName)(item.name, item.catalogId, lang);
        const v = item.variant ? translateVariant(item.variant, lang) : undefined;
        return v ? `${v} ${base}` : base;
    }
    
  },
  "data/catalog": function (exports, __require) {
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CATALOG_BY_NAME = exports.CATALOG_BY_ID = void 0;
    exports.getItemDisplayName = getItemDisplayName;
    // CATALOG: uygulamanın kataloğu, yalnız metnin okuduğu alanlar (id, name, nameEn, emoji, category, kcal, protein, fat, fiber, variantNutrition).
    const CATALOG = [{ "id": "elma", "name": "Elma", "nameEn": "Apple", "emoji": "🍎", "category": "Fruit", "kcal": 52, "protein": 0.3, "fat": 0.2, "fiber": 2.4, "variantNutrition": { "Starking": { "kcal": 52, "protein": 0.3, "fat": 0.2, "fiber": 2.4 }, "Golden": { "kcal": 57, "protein": 0.3, "fat": 0.2, "fiber": 2.1 }, "Granny Smith": { "kcal": 58, "protein": 0.4, "fat": 0.2, "fiber": 2.8 }, "Amasya": { "kcal": 54, "protein": 0.3, "fat": 0.2, "fiber": 2.3 }, "Fuji": { "kcal": 63, "protein": 0.2, "fat": 0.2, "fiber": 2.1 } } }, { "id": "armut", "name": "Armut", "nameEn": "Pear", "emoji": "🍐", "category": "Fruit", "kcal": 57, "protein": 0.4, "fat": 0.1, "fiber": 3.1, "variantNutrition": { "Deveci": { "kcal": 58, "protein": 0.4, "fat": 0.1, "fiber": 3.1 }, "Santa Maria": { "kcal": 58, "protein": 0.4, "fat": 0.1, "fiber": 3.1 }, "Meyer": { "kcal": 60, "protein": 0.4, "fat": 0.1, "fiber": 3 } } }, { "id": "muz", "name": "Muz", "nameEn": "Banana", "emoji": "🍌", "category": "Fruit", "kcal": 89, "protein": 1.1, "fat": 0.3, "fiber": 2.6, "variantNutrition": { "Yerli": { "kcal": 89, "protein": 1.1, "fat": 0.3, "fiber": 2.6 }, "İthal": { "kcal": 89, "protein": 1.1, "fat": 0.3, "fiber": 2.6 } } }, { "id": "portakal", "name": "Portakal", "nameEn": "Orange", "emoji": "🍊", "category": "Fruit", "kcal": 47, "protein": 0.9, "fat": 0.1, "fiber": 2.4, "variantNutrition": { "Sıkmalık": { "kcal": 47, "protein": 0.9, "fat": 0.1, "fiber": 2.4 }, "Sofralık": { "kcal": 49, "protein": 0.9, "fat": 0.1, "fiber": 2.4 }, "Kan portakalı": { "kcal": 50, "protein": 0.9, "fat": 0.1, "fiber": 2.4 } } }, { "id": "mandalina", "name": "Mandalina", "nameEn": "Tangerine", "emoji": "🍊", "category": "Fruit", "kcal": 53, "protein": 0.8, "fat": 0.3, "fiber": 1.8, "variantNutrition": { "Satsuma": { "kcal": 47, "protein": 0.7, "fat": 0.2, "fiber": 1.8 }, "Nova": { "kcal": 53, "protein": 0.8, "fat": 0.3, "fiber": 1.8 } } }, { "id": "limon", "name": "Limon", "nameEn": "Lemon", "emoji": "🍋", "category": "Fruit", "kcal": 29, "protein": 1.1, "fat": 0.3, "fiber": 2.8, "variantNutrition": { "İnce kabuk": { "kcal": 29, "protein": 1.1, "fat": 0.3, "fiber": 2.8 }, "Kalın kabuk": { "kcal": 29, "protein": 1.1, "fat": 0.3, "fiber": 2.8 } } }, { "id": "greyfurt", "name": "Greyfurt", "nameEn": "Grapefruit", "emoji": "🍊", "category": "Fruit", "kcal": 42, "protein": 0.8, "fat": 0.1, "fiber": 1.6 }, { "id": "nar", "name": "Nar", "nameEn": "Pomegranate", "emoji": "🍎", "category": "Fruit", "kcal": 83, "protein": 1.7, "fat": 1.2, "fiber": 4, "variantNutrition": { "Hicaz": { "kcal": 83, "protein": 1.7, "fat": 1.2, "fiber": 4 }, "Ekşi": { "kcal": 78, "protein": 1.6, "fat": 1, "fiber": 4 } } }, { "id": "uzum", "name": "Üzüm", "nameEn": "Grapes", "emoji": "🍇", "category": "Fruit", "kcal": 69, "protein": 0.7, "fat": 0.2, "fiber": 0.9, "variantNutrition": { "Çekirdekli": { "kcal": 69, "protein": 0.7, "fat": 0.2, "fiber": 1.1 }, "Çekirdeksiz": { "kcal": 69, "protein": 0.7, "fat": 0.2, "fiber": 0.9 } } }, { "id": "cilek", "name": "Çilek", "nameEn": "Strawberry", "emoji": "🍓", "category": "Fruit", "kcal": 32, "protein": 0.7, "fat": 0.3, "fiber": 2 }, { "id": "kiraz", "name": "Kiraz", "nameEn": "Cherry", "emoji": "🍒", "category": "Fruit", "kcal": 63, "protein": 1.1, "fat": 0.2, "fiber": 2.1, "variantNutrition": { "0900 Ziraat": { "kcal": 63, "protein": 1.1, "fat": 0.2, "fiber": 2.1 }, "Napolyon": { "kcal": 63, "protein": 1.1, "fat": 0.2, "fiber": 2.1 }, "Stella": { "kcal": 63, "protein": 1.1, "fat": 0.2, "fiber": 2.1 } } }, { "id": "visne", "name": "Vişne", "nameEn": "Sour Cherry", "emoji": "🍒", "category": "Fruit", "kcal": 50, "protein": 1, "fat": 0.3, "fiber": 1.6 }, { "id": "seftali", "name": "Şeftali", "nameEn": "Peach", "emoji": "🍑", "category": "Fruit", "kcal": 39, "protein": 0.9, "fat": 0.3, "fiber": 1.5, "variantNutrition": { "Sarı": { "kcal": 39, "protein": 0.9, "fat": 0.3, "fiber": 1.5 }, "Beyaz": { "kcal": 42, "protein": 1, "fat": 0.3, "fiber": 1.5 }, "Yassı": { "kcal": 39, "protein": 0.9, "fat": 0.3, "fiber": 1.5 } } }, { "id": "nektarin", "name": "Nektarin", "nameEn": "Nectarine", "emoji": "🍑", "category": "Fruit", "kcal": 44, "protein": 1.1, "fat": 0.3, "fiber": 1.7, "variantNutrition": { "Sarı": { "kcal": 44, "protein": 1.1, "fat": 0.3, "fiber": 1.7 }, "Beyaz": { "kcal": 46, "protein": 1.1, "fat": 0.3, "fiber": 1.7 } } }, { "id": "kayisi", "name": "Kayısı", "nameEn": "Apricot", "emoji": "🍑", "category": "Fruit", "kcal": 48, "protein": 1.4, "fat": 0.4, "fiber": 2 }, { "id": "erik", "name": "Erik", "nameEn": "Plum", "emoji": "🫐", "category": "Fruit", "kcal": 46, "protein": 0.7, "fat": 0.3, "fiber": 1.4, "variantNutrition": { "Can": { "kcal": 41, "protein": 0.8, "fat": 0.1, "fiber": 2.1 }, "Mürdüm": { "kcal": 46, "protein": 0.7, "fat": 0.3, "fiber": 1.4 }, "Yeşil": { "kcal": 41, "protein": 0.8, "fat": 0.1, "fiber": 2.1 } } }, { "id": "karpuz", "name": "Karpuz", "nameEn": "Watermelon", "emoji": "🍉", "category": "Fruit", "kcal": 30, "protein": 0.6, "fat": 0.2, "fiber": 0.4, "variantNutrition": { "Dilim": { "kcal": 30, "protein": 0.6, "fat": 0.2, "fiber": 0.4 }, "Bütün": { "kcal": 30, "protein": 0.6, "fat": 0.2, "fiber": 0.4 } } }, { "id": "kavun", "name": "Kavun", "nameEn": "Melon", "emoji": "🍈", "category": "Fruit", "kcal": 34, "protein": 0.8, "fat": 0.2, "fiber": 0.9, "variantNutrition": { "Kırkağaç": { "kcal": 34, "protein": 0.8, "fat": 0.2, "fiber": 0.9 }, "Yuva": { "kcal": 34, "protein": 0.8, "fat": 0.2, "fiber": 0.9 }, "Çekirge": { "kcal": 36, "protein": 0.8, "fat": 0.2, "fiber": 0.9 } } }, { "id": "kivi", "name": "Kivi", "nameEn": "Kiwi", "emoji": "🥝", "category": "Fruit", "kcal": 61, "protein": 1.1, "fat": 0.5, "fiber": 3 }, { "id": "avokado", "name": "Avokado", "nameEn": "Avocado", "emoji": "🥑", "category": "Fruit", "kcal": 160, "protein": 2, "fat": 14.7, "fiber": 6.7 }, { "id": "mango", "name": "Mango", "nameEn": "Mango", "emoji": "🥭", "category": "Fruit", "kcal": 60, "protein": 0.8, "fat": 0.4, "fiber": 1.6, "variantNutrition": { "Kent": { "kcal": 60, "protein": 0.8, "fat": 0.4, "fiber": 1.6 }, "Tommy Atkins": { "kcal": 60, "protein": 0.8, "fat": 0.4, "fiber": 1.6 } } }, { "id": "ananas", "name": "Ananas", "nameEn": "Pineapple", "emoji": "🍍", "category": "Fruit", "kcal": 50, "protein": 0.5, "fat": 0.1, "fiber": 1.4 }, { "id": "hurma", "name": "Hurma (taze)", "nameEn": "Fresh Date", "emoji": "🌴", "category": "Fruit", "kcal": 145, "protein": 1, "fat": 0.2, "fiber": 3.7 }, { "id": "trabzon-hurmasi", "name": "Trabzon hurması", "nameEn": "Persimmon", "emoji": "🍊", "category": "Fruit", "kcal": 70, "protein": 0.6, "fat": 0.2, "fiber": 3.6 }, { "id": "yaban-mersini", "name": "Yaban mersini", "nameEn": "Blueberry", "emoji": "🫐", "category": "Fruit", "kcal": 57, "protein": 0.7, "fat": 0.3, "fiber": 2.4 }, { "id": "ahududu", "name": "Ahududu", "nameEn": "Raspberry", "emoji": "🍓", "category": "Fruit", "kcal": 52, "protein": 1.2, "fat": 0.7, "fiber": 6.5 }, { "id": "bogurtlen", "name": "Böğürtlen", "nameEn": "Blackberry", "emoji": "🫐", "category": "Fruit", "kcal": 43, "protein": 1.4, "fat": 0.5, "fiber": 5.3 }, { "id": "incir", "name": "İncir", "nameEn": "Fig", "emoji": "🍑", "category": "Fruit", "kcal": 74, "protein": 0.8, "fat": 0.3, "fiber": 2.9, "variantNutrition": { "Sarı": { "kcal": 74, "protein": 0.8, "fat": 0.3, "fiber": 2.9 }, "Siyah": { "kcal": 79, "protein": 0.8, "fat": 0.3, "fiber": 3 }, "Bursa siyahı": { "kcal": 79, "protein": 0.8, "fat": 0.3, "fiber": 3 } } }, { "id": "ayva", "name": "Ayva", "nameEn": "Quince", "emoji": "🍐", "category": "Fruit", "kcal": 57, "protein": 0.4, "fat": 0.1, "fiber": 1.9 }, { "id": "dut", "name": "Dut", "nameEn": "Mulberry", "emoji": "🫐", "category": "Fruit", "kcal": 43, "protein": 1.4, "fat": 0.4, "fiber": 1.7 }, { "id": "domates", "name": "Domates", "nameEn": "Tomato", "emoji": "🍅", "category": "Vegetables", "kcal": 18, "protein": 0.9, "fat": 0.2, "fiber": 1.2, "variantNutrition": { "Salkım": { "kcal": 18, "protein": 0.9, "fat": 0.2, "fiber": 1.2 }, "Cherry": { "kcal": 18, "protein": 0.9, "fat": 0.2, "fiber": 1.2 }, "Kokteyl": { "kcal": 18, "protein": 0.9, "fat": 0.2, "fiber": 1.2 } } }, { "id": "salatalik", "name": "Salatalık", "nameEn": "Cucumber", "emoji": "🥒", "category": "Vegetables", "kcal": 15, "protein": 0.7, "fat": 0.1, "fiber": 0.5 }, { "id": "biber", "name": "Biber", "nameEn": "Pepper", "emoji": "🌶️", "category": "Vegetables", "kcal": 26, "protein": 1, "fat": 0.3, "fiber": 1.7, "variantNutrition": { "Çarliston": { "kcal": 23, "protein": 0.9, "fat": 0.2, "fiber": 1.6 }, "Sivri": { "kcal": 26, "protein": 1, "fat": 0.3, "fiber": 1.7 }, "Kapya": { "kcal": 31, "protein": 1, "fat": 0.3, "fiber": 2.1 }, "Dolmalık": { "kcal": 20, "protein": 0.9, "fat": 0.2, "fiber": 1.7 } } }, { "id": "patlican", "name": "Patlıcan", "nameEn": "Eggplant", "emoji": "🍆", "category": "Vegetables", "kcal": 25, "protein": 1, "fat": 0.2, "fiber": 3, "variantNutrition": { "Kemer": { "kcal": 25, "protein": 1, "fat": 0.2, "fiber": 3 }, "Topan": { "kcal": 25, "protein": 1, "fat": 0.2, "fiber": 3 } } }, { "id": "kabak", "name": "Kabak", "nameEn": "Zucchini", "emoji": "🥒", "category": "Vegetables", "kcal": 17, "protein": 1.2, "fat": 0.3, "fiber": 1 }, { "id": "bal-kabagi", "name": "Bal kabağı", "nameEn": "Pumpkin", "emoji": "🎃", "category": "Vegetables", "kcal": 26, "protein": 1, "fat": 0.1, "fiber": 0.5 }, { "id": "patates", "name": "Patates", "nameEn": "Potato", "emoji": "🥔", "category": "Vegetables", "kcal": 77, "protein": 2, "fat": 0.1, "fiber": 2.2, "variantNutrition": { "Yemeklik": { "kcal": 77, "protein": 2, "fat": 0.1, "fiber": 2.2 }, "Kızartmalık": { "kcal": 80, "protein": 2, "fat": 0.1, "fiber": 2.2 } } }, { "id": "tatli-patates", "name": "Tatlı patates", "nameEn": "Sweet Potato", "emoji": "🍠", "category": "Vegetables", "kcal": 86, "protein": 1.6, "fat": 0.1, "fiber": 3 }, { "id": "sogan", "name": "Soğan", "nameEn": "Onion", "emoji": "🧅", "category": "Vegetables", "kcal": 40, "protein": 1.1, "fat": 0.1, "fiber": 1.7, "variantNutrition": { "Kuru": { "kcal": 40, "protein": 1.1, "fat": 0.1, "fiber": 1.7 }, "Arpacık": { "kcal": 72, "protein": 2.5, "fat": 0.1, "fiber": 3.2 } } }, { "id": "kirmizi-sogan", "name": "Kırmızı soğan", "nameEn": "Red Onion", "emoji": "🧅", "category": "Vegetables", "kcal": 40, "protein": 1.1, "fat": 0.1, "fiber": 1.7 }, { "id": "sarimsak", "name": "Sarımsak", "nameEn": "Garlic", "emoji": "🧄", "category": "Vegetables", "kcal": 149, "protein": 6.4, "fat": 0.5, "fiber": 2.1, "variantNutrition": { "Taze": { "kcal": 30, "protein": 1.3, "fat": 0.2, "fiber": 1.2 }, "Kuru": { "kcal": 149, "protein": 6.4, "fat": 0.5, "fiber": 2.1 } } }, { "id": "havuc", "name": "Havuç", "nameEn": "Carrot", "emoji": "🥕", "category": "Vegetables", "kcal": 41, "protein": 0.9, "fat": 0.2, "fiber": 2.8 }, { "id": "pirasa", "name": "Pırasa", "nameEn": "Leek", "emoji": "🥬", "category": "Vegetables", "kcal": 61, "protein": 1.5, "fat": 0.3, "fiber": 1.8 }, { "id": "ispanak", "name": "Ispanak", "nameEn": "Spinach", "emoji": "🥬", "category": "Vegetables", "kcal": 23, "protein": 2.9, "fat": 0.4, "fiber": 2.2 }, { "id": "pazi", "name": "Pazı", "nameEn": "Swiss Chard", "emoji": "🥬", "category": "Vegetables", "kcal": 19, "protein": 1.8, "fat": 0.2, "fiber": 1.6 }, { "id": "lahana", "name": "Lahana", "nameEn": "Cabbage", "emoji": "🥬", "category": "Vegetables", "kcal": 25, "protein": 1.3, "fat": 0.1, "fiber": 2.5 }, { "id": "kirmizi-lahana", "name": "Kırmızı lahana", "nameEn": "Red Cabbage", "emoji": "🥬", "category": "Vegetables", "kcal": 31, "protein": 1.4, "fat": 0.2, "fiber": 2.1 }, { "id": "karnabahar", "name": "Karnabahar", "nameEn": "Cauliflower", "emoji": "🥦", "category": "Vegetables", "kcal": 25, "protein": 1.9, "fat": 0.3, "fiber": 2 }, { "id": "brokoli", "name": "Brokoli", "nameEn": "Broccoli", "emoji": "🥦", "category": "Vegetables", "kcal": 34, "protein": 2.8, "fat": 0.4, "fiber": 2.6 }, { "id": "marul", "name": "Marul", "nameEn": "Lettuce", "emoji": "🥬", "category": "Vegetables", "kcal": 15, "protein": 1.4, "fat": 0.2, "fiber": 1.3 }, { "id": "aysberg", "name": "Aysberg", "nameEn": "Iceberg Lettuce", "emoji": "🥬", "category": "Vegetables", "kcal": 14, "protein": 0.9, "fat": 0.1, "fiber": 1.2 }, { "id": "kivircik", "name": "Kıvırcık", "nameEn": "Curly Lettuce", "emoji": "🥬", "category": "Vegetables", "kcal": 15, "protein": 1.4, "fat": 0.2, "fiber": 1.3 }, { "id": "roka", "name": "Roka", "nameEn": "Arugula", "emoji": "🥬", "category": "Vegetables", "kcal": 25, "protein": 2.6, "fat": 0.7, "fiber": 1.6 }, { "id": "tere", "name": "Tere", "nameEn": "Watercress", "emoji": "🥬", "category": "Vegetables", "kcal": 32, "protein": 2.6, "fat": 0.7, "fiber": 1.1 }, { "id": "semizotu", "name": "Semizotu", "nameEn": "Purslane", "emoji": "🥬", "category": "Vegetables", "kcal": 20, "protein": 1.3, "fat": 0.4, "fiber": 1.3 }, { "id": "maydanoz", "name": "Maydanoz", "nameEn": "Parsley", "emoji": "🌿", "category": "Vegetables", "kcal": 36, "protein": 3, "fat": 0.8, "fiber": 3.3 }, { "id": "dereotu", "name": "Dereotu", "nameEn": "Dill", "emoji": "🌿", "category": "Vegetables", "kcal": 43, "protein": 3.5, "fat": 1.1, "fiber": 2.1 }, { "id": "nane", "name": "Nane", "nameEn": "Mint", "emoji": "🌿", "category": "Vegetables", "kcal": 44, "protein": 3.3, "fat": 0.7, "fiber": 6.8 }, { "id": "taze-sogan", "name": "Taze soğan", "nameEn": "Spring Onion", "emoji": "🧅", "category": "Vegetables", "kcal": 32, "protein": 1.8, "fat": 0.2, "fiber": 2.6 }, { "id": "kereviz", "name": "Kereviz", "nameEn": "Celery", "emoji": "🌿", "category": "Vegetables", "kcal": 42, "protein": 1.5, "fat": 0.3, "fiber": 1.8, "variantNutrition": { "Kök": { "kcal": 42, "protein": 1.5, "fat": 0.3, "fiber": 1.8 }, "Sap": { "kcal": 16, "protein": 0.7, "fat": 0.2, "fiber": 1.6 } } }, { "id": "pancar", "name": "Pancar", "nameEn": "Beetroot", "emoji": "🫜", "category": "Vegetables", "kcal": 43, "protein": 1.6, "fat": 0.2, "fiber": 2.8 }, { "id": "turp", "name": "Turp", "nameEn": "Radish", "emoji": "🫜", "category": "Vegetables", "kcal": 16, "protein": 0.7, "fat": 0.1, "fiber": 1.6, "variantNutrition": { "Kırmızı": { "kcal": 16, "protein": 0.7, "fat": 0.1, "fiber": 1.6 }, "Siyah": { "kcal": 20, "protein": 1, "fat": 0.1, "fiber": 2 } } }, { "id": "mantar", "name": "Mantar", "nameEn": "Mushroom", "emoji": "🍄", "category": "Vegetables", "kcal": 22, "protein": 3.1, "fat": 0.3, "fiber": 1, "variantNutrition": { "Kültür": { "kcal": 22, "protein": 3.1, "fat": 0.3, "fiber": 1 }, "İstiridye": { "kcal": 33, "protein": 3.3, "fat": 0.4, "fiber": 2.3 } } }, { "id": "taze-fasulye", "name": "Taze fasulye", "nameEn": "Green Beans", "emoji": "🫘", "category": "Vegetables", "kcal": 31, "protein": 1.8, "fat": 0.2, "fiber": 2.7, "variantNutrition": { "Ayşe kadın": { "kcal": 31, "protein": 1.8, "fat": 0.2, "fiber": 2.7 }, "Çalı": { "kcal": 31, "protein": 1.8, "fat": 0.2, "fiber": 2.7 } } }, { "id": "bezelye-taze", "name": "Bezelye (taze)", "nameEn": "Fresh Peas", "emoji": "🫘", "category": "Vegetables", "kcal": 81, "protein": 5.4, "fat": 0.4, "fiber": 5.1 }, { "id": "bakla", "name": "Bakla (taze)", "nameEn": "Fava Beans", "emoji": "🫘", "category": "Vegetables", "kcal": 88, "protein": 7.9, "fat": 0.7, "fiber": 7.5 }, { "id": "misir-taze", "name": "Mısır (taze)", "nameEn": "Sweet Corn", "emoji": "🌽", "category": "Vegetables", "kcal": 86, "protein": 3.3, "fat": 1.4, "fiber": 2.7 }, { "id": "bamya", "name": "Bamya", "nameEn": "Okra", "emoji": "🥬", "category": "Vegetables", "kcal": 33, "protein": 1.9, "fat": 0.2, "fiber": 3.2 }, { "id": "enginar", "name": "Enginar", "nameEn": "Artichoke", "emoji": "🌿", "category": "Vegetables", "kcal": 47, "protein": 3.3, "fat": 0.2, "fiber": 5.4 }, { "id": "paketli-roka", "name": "Paketli roka", "nameEn": "Arugula (Bag)", "emoji": "🥬", "category": "Vegetables", "kcal": 25, "protein": 2.6, "fat": 0.7, "fiber": 1.6 }, { "id": "paketli-ispanak", "name": "Paketli ıspanak", "nameEn": "Spinach (Bag)", "emoji": "🥬", "category": "Vegetables", "kcal": 23, "protein": 2.9, "fat": 0.4, "fiber": 2.2 }, { "id": "karisik-salata", "name": "Karışık yeşillik", "nameEn": "Mixed Greens", "emoji": "🥗", "category": "Vegetables", "kcal": 20, "protein": 1.5, "fat": 0.3, "fiber": 1.8 }, { "id": "hazir-salata", "name": "Hazır salata", "nameEn": "Ready Salad", "emoji": "🥗", "category": "Vegetables", "kcal": 30, "protein": 1.8, "fat": 1.5, "fiber": 2 }, { "id": "hazir-sebze", "name": "Hazır kesim sebze", "nameEn": "Pre-cut Vegetables", "emoji": "🥦", "category": "Vegetables", "kcal": 35, "protein": 2, "fat": 0.3, "fiber": 2.5 }, { "id": "paketli-marul", "name": "Paketli marul", "nameEn": "Lettuce (Bag)", "emoji": "🥬", "category": "Vegetables", "kcal": 15, "protein": 1.4, "fat": 0.2, "fiber": 1.3 }, { "id": "kuskonmaz", "name": "Kuşkonmaz", "nameEn": "Asparagus", "emoji": "🌿", "category": "Vegetables", "kcal": 20, "protein": 2.2, "fat": 0.1, "fiber": 2.1 }, { "id": "taze-zencefil", "name": "Taze zencefil", "nameEn": "Fresh Ginger", "emoji": "🫚", "category": "Vegetables", "kcal": 80, "protein": 1.8, "fat": 0.75, "fiber": 2 }, { "id": "bruksel-lahanasi", "name": "Brüksel lahanası", "nameEn": "Brussels Sprouts", "emoji": "🥬", "category": "Vegetables", "kcal": 43, "protein": 3.4, "fat": 0.3, "fiber": 3.8 }, { "id": "ekmek-beyaz", "name": "Beyaz ekmek", "nameEn": "White Bread", "emoji": "🍞", "category": "Bakery", "kcal": 265, "protein": 8.5, "fat": 3.2, "fiber": 2.4 }, { "id": "ekmek-tam", "name": "Tam buğday ekmeği", "nameEn": "Whole Wheat Bread", "emoji": "🍞", "category": "Bakery", "kcal": 247, "protein": 13, "fat": 3.4, "fiber": 7 }, { "id": "ekmek-cavdar", "name": "Çavdar ekmeği", "nameEn": "Rye Bread", "emoji": "🍞", "category": "Bakery", "kcal": 259, "protein": 8.5, "fat": 3.3, "fiber": 5.8 }, { "id": "ekmek-kepekli", "name": "Kepekli ekmek", "nameEn": "Bran Bread", "emoji": "🍞", "category": "Bakery", "kcal": 240, "protein": 10, "fat": 3.5, "fiber": 7.5 }, { "id": "baget-ekmek", "name": "Baget", "nameEn": "Baguette", "emoji": "🥖", "category": "Bakery", "kcal": 270, "protein": 9, "fat": 2.8, "fiber": 2.7 }, { "id": "sandvic-ekmegi", "name": "Sandviç ekmeği", "nameEn": "Sandwich Bread", "emoji": "🍞", "category": "Bakery", "kcal": 260, "protein": 9, "fat": 3.5, "fiber": 2.3 }, { "id": "hamburger-ekmegi", "name": "Hamburger ekmeği", "nameEn": "Burger Buns", "emoji": "🍔", "category": "Bakery", "kcal": 280, "protein": 9, "fat": 5, "fiber": 2.5 }, { "id": "lavas", "name": "Lavaş", "nameEn": "Lavash", "emoji": "🫓", "category": "Bakery", "kcal": 300, "protein": 8.5, "fat": 1, "fiber": 2.4 }, { "id": "tortilla", "name": "Tortilla", "nameEn": "Tortilla", "emoji": "🫓", "category": "Bakery", "kcal": 310, "protein": 8.5, "fat": 8, "fiber": 3 }, { "id": "simit", "name": "Simit", "nameEn": "Simit", "emoji": "🥨", "category": "Bakery", "kcal": 290, "protein": 9, "fat": 4.5, "fiber": 2.5 }, { "id": "pogaca", "name": "Poğaça", "nameEn": "Pogaca", "emoji": "🥐", "category": "Bakery", "kcal": 340, "protein": 7.5, "fat": 14, "fiber": 2, "variantNutrition": { "Sade": { "kcal": 320, "protein": 7.5, "fat": 13, "fiber": 2 }, "Peynirli": { "kcal": 360, "protein": 10, "fat": 16, "fiber": 1.8 }, "Zeytinli": { "kcal": 340, "protein": 7.5, "fat": 15, "fiber": 2.2 } } }, { "id": "acma", "name": "Açma", "nameEn": "Acma", "emoji": "🥐", "category": "Bakery", "kcal": 380, "protein": 8, "fat": 16, "fiber": 2 }, { "id": "bazlama", "name": "Bazlama", "nameEn": "Bazlama", "emoji": "🫓", "category": "Bakery", "kcal": 280, "protein": 8, "fat": 3, "fiber": 2.3 }, { "id": "pide-ekmegi", "name": "Pide ekmeği", "nameEn": "Pide Bread", "emoji": "🫓", "category": "Bakery", "kcal": 275, "protein": 9, "fat": 2.8, "fiber": 2.3 }, { "id": "yufka", "name": "Yufka", "nameEn": "Yufka", "emoji": "🫓", "category": "Bakery", "kcal": 320, "protein": 9.5, "fat": 3.5, "fiber": 2.5 }, { "id": "kek", "name": "Kek", "nameEn": "Cake", "emoji": "🎂", "category": "Bakery", "kcal": 360, "protein": 5.5, "fat": 15, "fiber": 1, "variantNutrition": { "Sade": { "kcal": 350, "protein": 5.5, "fat": 14, "fiber": 0.8 }, "Kakaolu": { "kcal": 370, "protein": 5.5, "fat": 16, "fiber": 1.5 }, "Havuçlu": { "kcal": 360, "protein": 4.5, "fat": 17, "fiber": 1.8 } } }, { "id": "kurabiye", "name": "Kurabiye", "nameEn": "Cookie", "emoji": "🍪", "category": "Bakery", "kcal": 480, "protein": 6, "fat": 21, "fiber": 2, "variantNutrition": { "Sade": { "kcal": 470, "protein": 6, "fat": 20, "fiber": 1.5 }, "Kakaolu": { "kcal": 485, "protein": 5.5, "fat": 22, "fiber": 2.5 }, "Damla çikolatalı": { "kcal": 490, "protein": 5.5, "fat": 23, "fiber": 2 } } }, { "id": "sutlu-tatli", "name": "Sütlü tatlı", "nameEn": "Milk Dessert", "emoji": "🍮", "category": "Bakery", "kcal": 150, "protein": 3.5, "fat": 3, "fiber": 0.3 }, { "id": "serbetli-tatli", "name": "Şerbetli tatlı", "nameEn": "Syrup Dessert", "emoji": "🍯", "category": "Bakery", "kcal": 400, "protein": 5.5, "fat": 18, "fiber": 2.5 }, { "id": "tost-ekmegi", "name": "Tost ekmeği", "nameEn": "Toast Bread", "emoji": "🍞", "category": "Bakery", "kcal": 265, "protein": 8.5, "fat": 3.5, "fiber": 2.4 }, { "id": "galeta", "name": "Galeta", "nameEn": "Rusk", "emoji": "🥖", "category": "Bakery", "kcal": 407, "protein": 11, "fat": 5, "fiber": 4 }, { "id": "kruvasan", "name": "Kruvasan", "nameEn": "Croissant", "emoji": "🥐", "category": "Bakery", "kcal": 406, "protein": 8.2, "fat": 21, "fiber": 2.6, "variantNutrition": { "Sade": { "kcal": 406, "protein": 8.2, "fat": 21, "fiber": 2.6 }, "Çikolatalı": { "kcal": 440, "protein": 7, "fat": 25, "fiber": 2.4 }, "Bademli": { "kcal": 458, "protein": 8.5, "fat": 27, "fiber": 3 }, "Peynirli": { "kcal": 440, "protein": 11, "fat": 26, "fiber": 1.8 } } }, { "id": "vakfikebir-ekmegi", "name": "Vakfıkebir ekmeği", "nameEn": "Vakfıkebir Bread", "emoji": "🍞", "category": "Bakery", "kcal": 235, "protein": 9, "fat": 2, "fiber": 5 }, { "id": "misir-ekmegi", "name": "Mısır ekmeği", "nameEn": "Cornbread", "emoji": "🍞", "category": "Bakery", "kcal": 220, "protein": 6, "fat": 4, "fiber": 4 }, { "id": "ramazan-pidesi", "name": "Ramazan pidesi", "nameEn": "Ramadan Pita", "emoji": "🍞", "category": "Bakery", "kcal": 258, "protein": 8, "fat": 2.5, "fiber": 2 }, { "id": "gozleme", "name": "Gözleme", "nameEn": "Gözleme", "emoji": "🫓", "category": "Bakery", "kcal": 270, "protein": 8, "fat": 9, "fiber": 2 }, { "id": "koy-ekmegi", "name": "Köy ekmeği", "nameEn": "Village Bread", "emoji": "🍞", "category": "Bakery", "kcal": 235, "protein": 9.4, "fat": 1.9, "fiber": 5.7 }, { "id": "tandir-ekmegi", "name": "Tandır ekmeği", "nameEn": "Tandır Bread", "emoji": "🫓", "category": "Bakery", "kcal": 282, "protein": 8, "fat": 2, "fiber": 2 }, { "id": "dana-kiyma", "name": "Dana kıyma", "nameEn": "Ground Beef", "emoji": "🥩", "category": "MeatPoultry", "kcal": 250, "protein": 17, "fat": 20, "fiber": 0, "variantNutrition": { "Az yağlı": { "kcal": 185, "protein": 21, "fat": 11, "fiber": 0 }, "Orta yağlı": { "kcal": 250, "protein": 17, "fat": 20, "fiber": 0 } } }, { "id": "dana-kusbasi", "name": "Dana kuşbaşı", "nameEn": "Beef Cubes", "emoji": "🥩", "category": "MeatPoultry", "kcal": 200, "protein": 22, "fat": 12, "fiber": 0 }, { "id": "dana-haslamalik", "name": "Dana haşlamalık", "nameEn": "Stewing Beef", "emoji": "🥩", "category": "MeatPoultry", "kcal": 220, "protein": 20, "fat": 15, "fiber": 0 }, { "id": "dana-biftek", "name": "Dana biftek", "nameEn": "Beef Steak", "emoji": "🥩", "category": "MeatPoultry", "kcal": 250, "protein": 22, "fat": 18, "fiber": 0 }, { "id": "dana-antrikot", "name": "Dana antrikot", "nameEn": "Entrecôte", "emoji": "🥩", "category": "MeatPoultry", "kcal": 275, "protein": 20, "fat": 21, "fiber": 0 }, { "id": "dana-bonfile", "name": "Dana bonfile", "nameEn": "Beef Tenderloin", "emoji": "🥩", "category": "MeatPoultry", "kcal": 200, "protein": 23, "fat": 12, "fiber": 0 }, { "id": "koftelik", "name": "Köftelik", "nameEn": "Meatball Mix", "emoji": "🧆", "category": "MeatPoultry", "kcal": 250, "protein": 17, "fat": 20, "fiber": 0 }, { "id": "kuzu-kiyma", "name": "Kuzu kıyma", "nameEn": "Ground Lamb", "emoji": "🥩", "category": "MeatPoultry", "kcal": 270, "protein": 17, "fat": 23, "fiber": 0 }, { "id": "kuzu-pirzola", "name": "Kuzu pirzola", "nameEn": "Lamb Chops", "emoji": "🥩", "category": "MeatPoultry", "kcal": 220, "protein": 19, "fat": 16, "fiber": 0 }, { "id": "tavuk-gogus", "name": "Tavuk göğsü", "nameEn": "Chicken Breast", "emoji": "🍗", "category": "MeatPoultry", "kcal": 120, "protein": 23, "fat": 2.6, "fiber": 0 }, { "id": "tavuk-but", "name": "Tavuk but", "nameEn": "Chicken Thigh", "emoji": "🍗", "category": "MeatPoultry", "kcal": 180, "protein": 18, "fat": 11, "fiber": 0, "variantNutrition": { "Bütün but": { "kcal": 180, "protein": 18, "fat": 11, "fiber": 0 }, "Baget": { "kcal": 172, "protein": 17, "fat": 11, "fiber": 0 } } }, { "id": "tavuk-kanat", "name": "Tavuk kanat", "nameEn": "Chicken Wings", "emoji": "🍗", "category": "MeatPoultry", "kcal": 203, "protein": 18, "fat": 14, "fiber": 0 }, { "id": "tavuk-kiyma", "name": "Tavuk kıyma", "nameEn": "Ground Chicken", "emoji": "🍗", "category": "MeatPoultry", "kcal": 150, "protein": 20, "fat": 7.4, "fiber": 0 }, { "id": "tavuk-sinitzel", "name": "Tavuk şinitzel", "nameEn": "Chicken Schnitzel", "emoji": "🍗", "category": "MeatPoultry", "kcal": 230, "protein": 18, "fat": 12, "fiber": 1 }, { "id": "tavuk-nugget", "name": "Tavuk nugget", "nameEn": "Chicken Nuggets", "emoji": "🍗", "category": "MeatPoultry", "kcal": 260, "protein": 14, "fat": 16, "fiber": 1.2 }, { "id": "hindi-gogus", "name": "Hindi göğsü", "nameEn": "Turkey Breast", "emoji": "🦃", "category": "MeatPoultry", "kcal": 135, "protein": 22, "fat": 5, "fiber": 0 }, { "id": "hindi-but", "name": "Hindi but", "nameEn": "Turkey Thigh", "emoji": "🦃", "category": "MeatPoultry", "kcal": 144, "protein": 20, "fat": 7, "fiber": 0 }, { "id": "kuzu-but", "name": "Kuzu but", "nameEn": "Lamb Leg", "emoji": "🥩", "category": "MeatPoultry", "kcal": 282, "protein": 17, "fat": 23, "fiber": 0 }, { "id": "ciger", "name": "Ciğer", "nameEn": "Liver", "emoji": "🥩", "category": "MeatPoultry", "kcal": 135, "protein": 20.4, "fat": 3.6, "fiber": 0, "variantNutrition": { "Dana": { "kcal": 135, "protein": 20.4, "fat": 3.6, "fiber": 0 }, "Kuzu": { "kcal": 139, "protein": 20.4, "fat": 5, "fiber": 0 }, "Tavuk": { "kcal": 119, "protein": 16.9, "fat": 4.8, "fiber": 0 } } }, { "id": "iskembe", "name": "İşkembe", "nameEn": "Tripe", "emoji": "🥩", "category": "MeatPoultry", "kcal": 85, "protein": 12.1, "fat": 3.7, "fiber": 0 }, { "id": "paca", "name": "Paça", "nameEn": "Trotters", "emoji": "🥩", "category": "MeatPoultry", "kcal": 200, "protein": 19, "fat": 14, "fiber": 0 }, { "id": "kelle-paca", "name": "Kelle paça", "nameEn": "Head & Trotter", "emoji": "🥩", "category": "MeatPoultry", "kcal": 200, "protein": 19, "fat": 14, "fiber": 0 }, { "id": "dil-sakatat", "name": "Dil", "nameEn": "Tongue", "emoji": "🥩", "category": "MeatPoultry", "kcal": 224, "protein": 14.9, "fat": 16.1, "fiber": 0, "variantNutrition": { "Dana": { "kcal": 224, "protein": 14.9, "fat": 16.1, "fiber": 0 }, "Kuzu": { "kcal": 199, "protein": 15.7, "fat": 14.6, "fiber": 0 } } }, { "id": "bobrek", "name": "Böbrek", "nameEn": "Kidney", "emoji": "🥩", "category": "MeatPoultry", "kcal": 99, "protein": 17.4, "fat": 3.1, "fiber": 0 }, { "id": "yurek", "name": "Yürek", "nameEn": "Heart", "emoji": "🫀", "category": "MeatPoultry", "kcal": 112, "protein": 17.7, "fat": 3.9, "fiber": 0 }, { "id": "dalak", "name": "Dalak", "nameEn": "Spleen", "emoji": "🥩", "category": "MeatPoultry", "kcal": 105, "protein": 18.3, "fat": 3, "fiber": 0 }, { "id": "mumbar", "name": "Mumbar", "nameEn": "Beef Casing", "emoji": "🥩", "category": "MeatPoultry", "kcal": 85, "protein": 12.1, "fat": 3.7, "fiber": 0 }, { "id": "dana-kaburga", "name": "Dana kaburga", "nameEn": "Beef Ribs", "emoji": "🥩", "category": "MeatPoultry", "kcal": 250, "protein": 18, "fat": 20, "fiber": 0 }, { "id": "dana-rosto", "name": "Dana rosto", "nameEn": "Beef Roast", "emoji": "🥩", "category": "MeatPoultry", "kcal": 180, "protein": 20, "fat": 11, "fiber": 0 }, { "id": "dana-gerdan", "name": "Dana gerdan", "nameEn": "Beef Chuck", "emoji": "🥩", "category": "MeatPoultry", "kcal": 200, "protein": 18, "fat": 14, "fiber": 0 }, { "id": "kuzu-kusbasi", "name": "Kuzu kuşbaşı", "nameEn": "Lamb Cubes", "emoji": "🥩", "category": "MeatPoultry", "kcal": 200, "protein": 18, "fat": 14, "fiber": 0 }, { "id": "kuzu-gerdan", "name": "Kuzu gerdan", "nameEn": "Lamb Neck", "emoji": "🥩", "category": "MeatPoultry", "kcal": 260, "protein": 16, "fat": 21, "fiber": 0 }, { "id": "kuzu-kaburga", "name": "Kuzu kaburga", "nameEn": "Lamb Ribs", "emoji": "🥩", "category": "MeatPoultry", "kcal": 350, "protein": 17, "fat": 30, "fiber": 0 }, { "id": "tavuk-bonfile", "name": "Tavuk bonfile", "nameEn": "Chicken Tenders", "emoji": "🍗", "category": "MeatPoultry", "kcal": 110, "protein": 23, "fat": 1.5, "fiber": 0 }, { "id": "tavuk-pirzola", "name": "Tavuk pirzola", "nameEn": "Chicken Chops", "emoji": "🍗", "category": "MeatPoultry", "kcal": 170, "protein": 20, "fat": 10, "fiber": 0 }, { "id": "butun-tavuk", "name": "Bütün tavuk (piliç)", "nameEn": "Whole Chicken", "emoji": "🍗", "category": "MeatPoultry", "kcal": 215, "protein": 18, "fat": 15, "fiber": 0 }, { "id": "hamsi", "name": "Hamsi", "nameEn": "Anchovy", "emoji": "🐟", "category": "Fish", "kcal": 131, "protein": 20, "fat": 4.8, "fiber": 0 }, { "id": "palamut", "name": "Palamut", "nameEn": "Bonito", "emoji": "🐟", "category": "Fish", "kcal": 125, "protein": 22, "fat": 4.5, "fiber": 0 }, { "id": "lufer", "name": "Lüfer", "nameEn": "Bluefish", "emoji": "🐟", "category": "Fish", "kcal": 128, "protein": 20, "fat": 4.2, "fiber": 0 }, { "id": "istavrit", "name": "İstavrit", "nameEn": "Horse Mackerel", "emoji": "🐟", "category": "Fish", "kcal": 127, "protein": 19, "fat": 4.8, "fiber": 0 }, { "id": "levrek", "name": "Levrek", "nameEn": "Sea Bass", "emoji": "🐟", "category": "Fish", "kcal": 97, "protein": 18.4, "fat": 2, "fiber": 0 }, { "id": "cipura", "name": "Çipura", "nameEn": "Sea Bream", "emoji": "🐟", "category": "Fish", "kcal": 134, "protein": 20, "fat": 5.5, "fiber": 0 }, { "id": "alabalik", "name": "Alabalık", "nameEn": "Trout", "emoji": "🐟", "category": "Fish", "kcal": 141, "protein": 20, "fat": 6.6, "fiber": 0 }, { "id": "somon", "name": "Somon", "nameEn": "Salmon", "emoji": "🐟", "category": "Fish", "kcal": 208, "protein": 20, "fat": 13, "fiber": 0, "variantNutrition": { "Fileto": { "kcal": 208, "protein": 20, "fat": 13, "fiber": 0 }, "Dilim": { "kcal": 208, "protein": 20, "fat": 13, "fiber": 0 } } }, { "id": "fume-somon", "name": "Füme somon", "nameEn": "Smoked Salmon", "emoji": "🐟", "category": "Fish", "kcal": 117, "protein": 18.3, "fat": 4.3, "fiber": 0 }, { "id": "mezgit", "name": "Mezgit", "nameEn": "Whiting", "emoji": "🐟", "category": "Fish", "kcal": 82, "protein": 18, "fat": 0.8, "fiber": 0 }, { "id": "sardalya", "name": "Sardalya", "nameEn": "Sardine", "emoji": "🐟", "category": "Fish", "kcal": 105, "protein": 20, "fat": 3, "fiber": 0 }, { "id": "uskumru", "name": "Uskumru", "nameEn": "Mackerel", "emoji": "🐟", "category": "Fish", "kcal": 205, "protein": 19, "fat": 14, "fiber": 0 }, { "id": "ton-taze", "name": "Ton balığı (taze)", "nameEn": "Fresh Tuna", "emoji": "🐟", "category": "Fish", "kcal": 132, "protein": 28, "fat": 1.3, "fiber": 0 }, { "id": "karides", "name": "Karides", "nameEn": "Shrimp", "emoji": "🦐", "category": "Fish", "kcal": 85, "protein": 20, "fat": 0.5, "fiber": 0 }, { "id": "kalamar", "name": "Kalamar", "nameEn": "Squid", "emoji": "🦑", "category": "Fish", "kcal": 92, "protein": 16, "fat": 1.4, "fiber": 0 }, { "id": "midye", "name": "Midye", "nameEn": "Mussels", "emoji": "🦪", "category": "Fish", "kcal": 86, "protein": 12, "fat": 2.3, "fiber": 0 }, { "id": "barbun", "name": "Barbun", "nameEn": "Red Mullet", "emoji": "🐟", "category": "Fish", "kcal": 117, "protein": 20.3, "fat": 3.7, "fiber": 0 }, { "id": "tekir", "name": "Tekir", "nameEn": "Striped Mullet", "emoji": "🐟", "category": "Fish", "kcal": 117, "protein": 19.4, "fat": 3.8, "fiber": 0 }, { "id": "kefal", "name": "Kefal", "nameEn": "Grey Mullet", "emoji": "🐟", "category": "Fish", "kcal": 115, "protein": 20, "fat": 4, "fiber": 0 }, { "id": "sazan", "name": "Sazan", "nameEn": "Carp", "emoji": "🐟", "category": "Fish", "kcal": 127, "protein": 17.8, "fat": 5.6, "fiber": 0 }, { "id": "ahtapot", "name": "Ahtapot", "nameEn": "Octopus", "emoji": "🐙", "category": "Fish", "kcal": 82, "protein": 14.9, "fat": 1, "fiber": 0 }, { "id": "dil-baligi", "name": "Dil balığı", "nameEn": "Sole", "emoji": "🐟", "category": "Fish", "kcal": 70, "protein": 12.4, "fat": 1.9, "fiber": 0 }, { "id": "kupes", "name": "Kupes", "nameEn": "Bogue", "emoji": "🐟", "category": "Fish", "kcal": 100, "protein": 18, "fat": 3, "fiber": 0 }, { "id": "subye", "name": "Sübye", "nameEn": "Cuttlefish", "emoji": "🦑", "category": "Fish", "kcal": 79, "protein": 16.2, "fat": 0.7, "fiber": 0 }, { "id": "sucuk", "name": "Sucuk", "nameEn": "Beef Sausage", "emoji": "🥩", "category": "Charcuterie", "kcal": 380, "protein": 18, "fat": 34, "fiber": 0, "variantNutrition": { "Fermente": { "kcal": 380, "protein": 18, "fat": 34, "fiber": 0 }, "Isıl işlem": { "kcal": 300, "protein": 17, "fat": 25, "fiber": 0 }, "Kangal": { "kcal": 380, "protein": 18, "fat": 34, "fiber": 0 } } }, { "id": "salam", "name": "Salam", "nameEn": "Salami", "emoji": "🥩", "category": "Charcuterie", "kcal": 330, "protein": 16, "fat": 28, "fiber": 0, "variantNutrition": { "Dana": { "kcal": 330, "protein": 16, "fat": 28, "fiber": 0 }, "Hindi": { "kcal": 200, "protein": 17, "fat": 13, "fiber": 0 } } }, { "id": "sosis", "name": "Sosis", "nameEn": "Sausage", "emoji": "🌭", "category": "Charcuterie", "kcal": 300, "protein": 12, "fat": 27, "fiber": 0, "variantNutrition": { "Kokteyl": { "kcal": 300, "protein": 12, "fat": 27, "fiber": 0 }, "Uzun": { "kcal": 300, "protein": 12, "fat": 27, "fiber": 0 }, "Dana": { "kcal": 290, "protein": 11, "fat": 26, "fiber": 0 }, "Tavuk": { "kcal": 180, "protein": 10, "fat": 13, "fiber": 0 }, "Piliç": { "kcal": 198, "protein": 11, "fat": 14, "fiber": 0 } } }, { "id": "jambon", "name": "Jambon", "nameEn": "Ham", "emoji": "🥩", "category": "Charcuterie", "kcal": 145, "protein": 20, "fat": 6, "fiber": 0, "variantNutrition": { "Dana": { "kcal": 145, "protein": 20, "fat": 6, "fiber": 0 }, "Hindi": { "kcal": 110, "protein": 18, "fat": 4, "fiber": 0 } } }, { "id": "fume-et", "name": "Füme et", "nameEn": "Smoked Meat", "emoji": "🥩", "category": "Charcuterie", "kcal": 150, "protein": 22, "fat": 6, "fiber": 0 }, { "id": "pastirma", "name": "Pastırma", "nameEn": "Pastirma", "emoji": "🥩", "category": "Charcuterie", "kcal": 230, "protein": 39, "fat": 8, "fiber": 0, "variantNutrition": { "Çemenli": { "kcal": 250, "protein": 29.5, "fat": 14, "fiber": 0 }, "Çemensiz": { "kcal": 260, "protein": 30.5, "fat": 15, "fiber": 0 } } }, { "id": "kavurma", "name": "Kavurma", "nameEn": "Kavurma", "emoji": "🥩", "category": "Charcuterie", "kcal": 280, "protein": 25, "fat": 20, "fiber": 0, "variantNutrition": { "Kuzu": { "kcal": 325, "protein": 19, "fat": 28, "fiber": 0 }, "Dana": { "kcal": 250, "protein": 22, "fat": 18, "fiber": 0 } } }, { "id": "hindi-fume", "name": "Hindi füme", "nameEn": "Smoked Turkey", "emoji": "🥩", "category": "Charcuterie", "kcal": 115, "protein": 22, "fat": 3, "fiber": 0 }, { "id": "dil-fume", "name": "Dil füme", "nameEn": "Smoked Tongue", "emoji": "🥩", "category": "Charcuterie", "kcal": 240, "protein": 16, "fat": 19, "fiber": 0 }, { "id": "sut", "name": "Süt", "nameEn": "Milk", "emoji": "🥛", "category": "Dairy", "kcal": 61, "protein": 3.2, "fat": 3.3, "fiber": 0, "variantNutrition": { "Tam yağlı": { "kcal": 61, "protein": 3.2, "fat": 3.3, "fiber": 0 }, "Yarım yağlı": { "kcal": 50, "protein": 3.3, "fat": 2, "fiber": 0 }, "Light": { "kcal": 34, "protein": 3.4, "fat": 0.2, "fiber": 0 } } }, { "id": "uht-sut", "name": "UHT Süt", "nameEn": "UHT Milk", "emoji": "🥛", "category": "Dairy", "kcal": 61, "protein": 3.2, "fat": 3.3, "fiber": 0, "variantNutrition": { "Tam yağlı": { "kcal": 61, "protein": 3.2, "fat": 3.3, "fiber": 0 }, "Yarım yağlı": { "kcal": 50, "protein": 3.3, "fat": 2, "fiber": 0 }, "Light": { "kcal": 34, "protein": 3.4, "fat": 0.2, "fiber": 0 }, "Laktozsuz": { "kcal": 61, "protein": 3.2, "fat": 3.3, "fiber": 0 } } }, { "id": "laktozsuz-sut", "name": "Laktozsuz süt", "nameEn": "Lactose-Free Milk", "emoji": "🥛", "category": "Dairy", "kcal": 61, "protein": 3.2, "fat": 3.3, "fiber": 0 }, { "id": "proteinli-sut", "name": "Proteinli süt", "nameEn": "High-Protein Milk", "emoji": "🥛", "category": "Dairy", "kcal": 60, "protein": 6.5, "fat": 1.8, "fiber": 0 }, { "id": "keci-sutu", "name": "Keçi sütü", "nameEn": "Goat Milk", "emoji": "🐐", "category": "Dairy", "kcal": 69, "protein": 3.6, "fat": 4.1, "fiber": 0 }, { "id": "manda-sutu", "name": "Manda sütü", "nameEn": "Buffalo Milk", "emoji": "🥛", "category": "Dairy", "kcal": 97, "protein": 4, "fat": 6.9, "fiber": 0 }, { "id": "aromali-sut", "name": "Aromalı süt", "nameEn": "Flavored Milk", "emoji": "🥛", "category": "Dairy", "kcal": 78, "protein": 3.1, "fat": 1.9, "fiber": 0.2, "variantNutrition": { "Çikolatalı": { "kcal": 83, "protein": 3.2, "fat": 2.5, "fiber": 0.5 }, "Çilekli": { "kcal": 75, "protein": 3.1, "fat": 1.5, "fiber": 0 }, "Muzlu": { "kcal": 78, "protein": 3.1, "fat": 1.8, "fiber": 0 } } }, { "id": "yulaf-icecegi", "name": "Yulaf içeceği", "nameEn": "Oat Milk", "emoji": "🌾", "category": "Dairy", "kcal": 46, "protein": 1, "fat": 1.5, "fiber": 0.8, "variantNutrition": { "Şekersiz": { "kcal": 38, "protein": 1, "fat": 1.5, "fiber": 0.8 }, "Barista": { "kcal": 70, "protein": 1, "fat": 3, "fiber": 0.8 }, "Çikolatalı": { "kcal": 92, "protein": 1.1, "fat": 1.5, "fiber": 0.9 } } }, { "id": "badem-icecegi", "name": "Badem içeceği", "nameEn": "Almond Milk", "emoji": "🌰", "category": "Dairy", "kcal": 13, "protein": 0.4, "fat": 1.1, "fiber": 0.3, "variantNutrition": { "Şekersiz": { "kcal": 13, "protein": 0.4, "fat": 1.1, "fiber": 0.3 }, "Vanilyalı": { "kcal": 30, "protein": 0.4, "fat": 1.1, "fiber": 0.3 } } }, { "id": "soya-icecegi", "name": "Soya içeceği", "nameEn": "Soy Milk", "emoji": "🌱", "category": "Dairy", "kcal": 33, "protein": 3.3, "fat": 1.8, "fiber": 0.6 }, { "id": "hindistan-icecegi", "name": "Hindistan cevizi içeceği", "nameEn": "Coconut Milk", "emoji": "🥥", "category": "Dairy", "kcal": 20, "protein": 0.2, "fat": 2.1, "fiber": 0 }, { "id": "yogurt", "name": "Yoğurt", "nameEn": "Yogurt", "emoji": "🥣", "category": "Dairy", "kcal": 61, "protein": 3.5, "fat": 3.3, "fiber": 0, "variantNutrition": { "Tam yağlı": { "kcal": 61, "protein": 3.5, "fat": 3.3, "fiber": 0 }, "Yarım yağlı": { "kcal": 50, "protein": 3.5, "fat": 1.8, "fiber": 0 }, "Light": { "kcal": 36, "protein": 3.5, "fat": 0.2, "fiber": 0 }, "Laktozsuz": { "kcal": 61, "protein": 3.5, "fat": 3.3, "fiber": 0 } } }, { "id": "suzme-yogurt", "name": "Süzme yoğurt", "nameEn": "Strained Yogurt", "emoji": "🥣", "category": "Dairy", "kcal": 124, "protein": 9.5, "fat": 8.5, "fiber": 0, "variantNutrition": { "Tam yağlı": { "kcal": 124, "protein": 9.5, "fat": 8.5, "fiber": 0 }, "Light": { "kcal": 59, "protein": 10.2, "fat": 0.4, "fiber": 0 } } }, { "id": "kaymakli-yogurt", "name": "Kaymaklı yoğurt", "nameEn": "Creamy Yogurt", "emoji": "🥣", "category": "Dairy", "kcal": 130, "protein": 4.5, "fat": 10, "fiber": 0 }, { "id": "probiyotik-yogurt", "name": "Probiyotik yoğurt", "nameEn": "Probiotic Yogurt", "emoji": "🥣", "category": "Dairy", "kcal": 65, "protein": 3.8, "fat": 3.5, "fiber": 0 }, { "id": "meyveli-yogurt", "name": "Meyveli yoğurt", "nameEn": "Fruit Yogurt", "emoji": "🥛", "category": "Dairy", "kcal": 100, "protein": 3.5, "fat": 3, "fiber": 0, "variantNutrition": { "Çilek": { "kcal": 100, "protein": 3.5, "fat": 3, "fiber": 0 }, "Şeftali": { "kcal": 100, "protein": 3.5, "fat": 3, "fiber": 0 }, "Karışık": { "kcal": 100, "protein": 3.5, "fat": 3, "fiber": 0 } } }, { "id": "ayran", "name": "Ayran", "nameEn": "Ayran", "emoji": "🥛", "category": "Dairy", "kcal": 37, "protein": 2, "fat": 2, "fiber": 0, "variantNutrition": { "Klasik": { "kcal": 37, "protein": 2, "fat": 2, "fiber": 0 }, "Light": { "kcal": 20, "protein": 2, "fat": 0.5, "fiber": 0 } } }, { "id": "kefir", "name": "Kefir", "nameEn": "Kefir", "emoji": "🥛", "category": "Dairy", "kcal": 65, "protein": 3.3, "fat": 3.5, "fiber": 0, "variantNutrition": { "Sade": { "kcal": 65, "protein": 3.3, "fat": 3.5, "fiber": 0 }, "Meyveli": { "kcal": 80, "protein": 3, "fat": 2, "fiber": 0.5 } } }, { "id": "krema", "name": "Krema", "nameEn": "Cream", "emoji": "🥛", "category": "Dairy", "kcal": 200, "protein": 2.5, "fat": 20, "fiber": 0, "variantNutrition": { "Sıvı krema": { "kcal": 200, "protein": 2.5, "fat": 20, "fiber": 0 }, "Krem şanti": { "kcal": 260, "protein": 2.2, "fat": 25, "fiber": 0.5 } } }, { "id": "beyaz-peynir", "name": "Beyaz peynir", "nameEn": "White Cheese", "emoji": "🧀", "category": "Dairy", "kcal": 260, "protein": 17, "fat": 21, "fiber": 0, "variantNutrition": { "Tam yağlı": { "kcal": 260, "protein": 17, "fat": 21, "fiber": 0 }, "Az yağlı": { "kcal": 184, "protein": 20, "fat": 10, "fiber": 0 }, "Ezine": { "kcal": 300, "protein": 18, "fat": 25, "fiber": 0 }, "Çanakkale": { "kcal": 275, "protein": 17, "fat": 22, "fiber": 0 } } }, { "id": "kasar", "name": "Kaşar", "nameEn": "Kashar Cheese", "emoji": "🧀", "category": "Dairy", "kcal": 350, "protein": 25, "fat": 28, "fiber": 0, "variantNutrition": { "Taze": { "kcal": 300, "protein": 22, "fat": 24, "fiber": 0 }, "Eski": { "kcal": 400, "protein": 27, "fat": 32, "fiber": 0 } } }, { "id": "dil-peyniri", "name": "Dil peyniri", "nameEn": "String Cheese", "emoji": "🧀", "category": "Dairy", "kcal": 290, "protein": 24, "fat": 21, "fiber": 0, "variantNutrition": { "Taze": { "kcal": 280, "protein": 24, "fat": 19, "fiber": 0 }, "Tuzlu": { "kcal": 290, "protein": 24, "fat": 21, "fiber": 0 } } }, { "id": "orgu-peyniri", "name": "Örgü peyniri", "nameEn": "Braided Cheese", "emoji": "🧀", "category": "Dairy", "kcal": 300, "protein": 24, "fat": 22, "fiber": 0, "variantNutrition": { "Taze": { "kcal": 320, "protein": 24, "fat": 24, "fiber": 0 }, "Tuzlu": { "kcal": 330, "protein": 24, "fat": 25, "fiber": 0 } } }, { "id": "lor-peyniri", "name": "Lor peyniri", "nameEn": "Lor (Curd Cheese)", "emoji": "🧀", "category": "Dairy", "kcal": 98, "protein": 14, "fat": 4.5, "fiber": 0, "variantNutrition": { "Tam yağlı": { "kcal": 98, "protein": 14, "fat": 4.5, "fiber": 0 }, "Light": { "kcal": 65, "protein": 16, "fat": 0.5, "fiber": 0 } } }, { "id": "tulum-peyniri", "name": "Tulum peyniri", "nameEn": "Tulum Cheese", "emoji": "🧀", "category": "Dairy", "kcal": 330, "protein": 21, "fat": 26, "fiber": 0, "variantNutrition": { "Erzincan": { "kcal": 330, "protein": 22, "fat": 26, "fiber": 0 }, "Divle": { "kcal": 340, "protein": 21, "fat": 27, "fiber": 0 }, "İzmir": { "kcal": 320, "protein": 22, "fat": 25, "fiber": 0 }, "Bergama": { "kcal": 325, "protein": 22, "fat": 26, "fiber": 0 } } }, { "id": "labne", "name": "Labne", "nameEn": "Labneh", "emoji": "🧀", "category": "Dairy", "kcal": 200, "protein": 6, "fat": 18, "fiber": 0 }, { "id": "krem-peynir", "name": "Krem peynir", "nameEn": "Cream Cheese", "emoji": "🧀", "category": "Dairy", "kcal": 230, "protein": 8, "fat": 22, "fiber": 2 }, { "id": "cheddar", "name": "Cheddar", "nameEn": "Cheddar", "emoji": "🧀", "category": "Dairy", "kcal": 405, "protein": 24.7, "fat": 34, "fiber": 0 }, { "id": "mozzarella", "name": "Mozzarella", "nameEn": "Mozzarella", "emoji": "🧀", "category": "Dairy", "kcal": 295, "protein": 22, "fat": 22, "fiber": 0, "variantNutrition": { "Top": { "kcal": 280, "protein": 22, "fat": 17, "fiber": 0 }, "Rende": { "kcal": 300, "protein": 22, "fat": 22, "fiber": 0 } } }, { "id": "mihalic-peyniri", "name": "Mihaliç peyniri", "nameEn": "Mihalic Cheese", "emoji": "🧀", "category": "Dairy", "kcal": 370, "protein": 26, "fat": 29, "fiber": 0 }, { "id": "hellim-peyniri", "name": "Hellim", "nameEn": "Halloumi", "emoji": "🧀", "category": "Dairy", "kcal": 325, "protein": 21, "fat": 26, "fiber": 0 }, { "id": "cokelek", "name": "Çökelek", "nameEn": "Cokelek", "emoji": "🧀", "category": "Dairy", "kcal": 171, "protein": 27, "fat": 6, "fiber": 0 }, { "id": "cerkez-peyniri", "name": "Çerkez peyniri", "nameEn": "Circassian Cheese", "emoji": "🧀", "category": "Dairy", "kcal": 220, "protein": 18, "fat": 16, "fiber": 0, "variantNutrition": { "Sade": { "kcal": 220, "protein": 18, "fat": 16, "fiber": 0 }, "İsli": { "kcal": 240, "protein": 19, "fat": 18, "fiber": 0 } } }, { "id": "cecil-peyniri", "name": "Çeçil peyniri", "nameEn": "Çeçil (String)", "emoji": "🧀", "category": "Dairy", "kcal": 280, "protein": 22, "fat": 18, "fiber": 0, "variantNutrition": { "Klasik": { "kcal": 280, "protein": 22, "fat": 18, "fiber": 0 }, "Füme": { "kcal": 290, "protein": 22, "fat": 19, "fiber": 0 } } }, { "id": "sepet-peyniri", "name": "Sepet peyniri", "nameEn": "Basket Cheese", "emoji": "🧀", "category": "Dairy", "kcal": 280, "protein": 18, "fat": 22, "fiber": 0 }, { "id": "otlu-peynir", "name": "Otlu peynir", "nameEn": "Herbed Cheese (Van)", "emoji": "🧀", "category": "Dairy", "kcal": 326, "protein": 22, "fat": 26, "fiber": 0 }, { "id": "parmesan", "name": "Parmesan", "nameEn": "Parmesan", "emoji": "🧀", "category": "Dairy", "kcal": 392, "protein": 35.75, "fat": 29, "fiber": 0 }, { "id": "feta", "name": "Feta", "nameEn": "Feta", "emoji": "🧀", "category": "Dairy", "kcal": 264, "protein": 14.2, "fat": 21.3, "fiber": 0 }, { "id": "gouda", "name": "Gouda", "nameEn": "Gouda", "emoji": "🧀", "category": "Dairy", "kcal": 356, "protein": 25, "fat": 27, "fiber": 0 }, { "id": "brie", "name": "Brie", "nameEn": "Brie", "emoji": "🧀", "category": "Dairy", "kcal": 334, "protein": 20.75, "fat": 27.7, "fiber": 0 }, { "id": "camembert", "name": "Camembert", "nameEn": "Camembert", "emoji": "🧀", "category": "Dairy", "kcal": 300, "protein": 19.8, "fat": 24.3, "fiber": 0 }, { "id": "ricotta", "name": "Ricotta", "nameEn": "Ricotta", "emoji": "🧀", "category": "Dairy", "kcal": 174, "protein": 11.3, "fat": 13, "fiber": 0 }, { "id": "tereyagi", "name": "Tereyağı", "nameEn": "Butter", "emoji": "🧈", "category": "Dairy", "kcal": 717, "protein": 0.8, "fat": 81, "fiber": 0, "variantNutrition": { "Tuzlu": { "kcal": 717, "protein": 0.8, "fat": 81, "fiber": 0 }, "Tuzsuz": { "kcal": 717, "protein": 0.8, "fat": 81, "fiber": 0 } } }, { "id": "margarin", "name": "Margarin", "nameEn": "Margarine", "emoji": "🧈", "category": "Dairy", "kcal": 720, "protein": 0.2, "fat": 80, "fiber": 0 }, { "id": "kaymak", "name": "Kaymak", "nameEn": "Clotted Cream", "emoji": "🥣", "category": "Dairy", "kcal": 585, "protein": 1, "fat": 63, "fiber": 0 }, { "id": "dondurma", "name": "Dondurma", "nameEn": "Ice Cream", "emoji": "🍦", "category": "Frozen", "kcal": 207, "protein": 3.5, "fat": 11, "fiber": 0.7, "variantNutrition": { "Vanilya": { "kcal": 207, "protein": 3.5, "fat": 11, "fiber": 0.7 }, "Çikolatalı": { "kcal": 216, "protein": 3.8, "fat": 11, "fiber": 1.2 }, "Çilekli": { "kcal": 192, "protein": 3.2, "fat": 8, "fiber": 0.5 }, "Limonlu": { "kcal": 120, "protein": 1, "fat": 0.5, "fiber": 0.2 }, "Karamelli": { "kcal": 220, "protein": 3.5, "fat": 11, "fiber": 0.3 }, "Fıstıklı": { "kcal": 240, "protein": 4.5, "fat": 14, "fiber": 1.2 }, "Muzlu": { "kcal": 195, "protein": 3.5, "fat": 9, "fiber": 0.5 }, "Sorbe": { "kcal": 110, "protein": 0.4, "fat": 0.1, "fiber": 0.5 }, "Light": { "kcal": 130, "protein": 4, "fat": 3, "fiber": 0.3 }, "Vegan": { "kcal": 175, "protein": 2, "fat": 8, "fiber": 0.8 } } }, { "id": "dondurma-cubuk", "name": "Dondurma çubuğu", "nameEn": "Ice Cream Bar", "emoji": "🍡", "category": "Frozen", "kcal": 220, "protein": 3, "fat": 13, "fiber": 0.5, "variantNutrition": { "Çikolata kaplı": { "kcal": 245, "protein": 3.5, "fat": 15, "fiber": 0.8 }, "Çilekli": { "kcal": 192, "protein": 2.5, "fat": 8, "fiber": 0.4 }, "Limonlu": { "kcal": 120, "protein": 0.8, "fat": 0.3, "fiber": 0.2 }, "Karamelli": { "kcal": 230, "protein": 3.2, "fat": 12, "fiber": 0.3 } } }, { "id": "donuk-bezelye", "name": "Donuk bezelye", "nameEn": "Frozen Peas", "emoji": "🫘", "category": "Frozen", "kcal": 81, "protein": 5.4, "fat": 0.4, "fiber": 5.1 }, { "id": "donuk-misir", "name": "Donuk mısır", "nameEn": "Frozen Corn", "emoji": "🌽", "category": "Frozen", "kcal": 86, "protein": 3.3, "fat": 1.4, "fiber": 2.7 }, { "id": "donuk-brokoli", "name": "Donuk brokoli", "nameEn": "Frozen Broccoli", "emoji": "🥦", "category": "Frozen", "kcal": 34, "protein": 2.8, "fat": 0.4, "fiber": 2.6 }, { "id": "donuk-ispanak", "name": "Donuk ıspanak", "nameEn": "Frozen Spinach", "emoji": "🥬", "category": "Frozen", "kcal": 23, "protein": 2.9, "fat": 0.4, "fiber": 2.2 }, { "id": "donuk-sebze", "name": "Donuk karışık sebze", "nameEn": "Frozen Mixed Veg", "emoji": "🥦", "category": "Frozen", "kcal": 40, "protein": 2.2, "fat": 0.3, "fiber": 3 }, { "id": "parmak-patates", "name": "Parmak patates", "nameEn": "French Fries", "emoji": "🍟", "category": "Frozen", "kcal": 150, "protein": 2.4, "fat": 5, "fiber": 2.5 }, { "id": "kroket", "name": "Kroket", "nameEn": "Croquettes", "emoji": "🥔", "category": "Frozen", "kcal": 200, "protein": 4, "fat": 10, "fiber": 2.5 }, { "id": "donuk-pizza", "name": "Dondurulmuş pizza", "nameEn": "Frozen Pizza", "emoji": "🍕", "category": "Frozen", "kcal": 250, "protein": 11, "fat": 10, "fiber": 2.5, "variantNutrition": { "Peynirli": { "kcal": 250, "protein": 11, "fat": 10, "fiber": 2.5 }, "Karışık": { "kcal": 265, "protein": 12, "fat": 11, "fiber": 2.5 }, "Sucuklu": { "kcal": 290, "protein": 13, "fat": 14, "fiber": 2.5 } } }, { "id": "donuk-lahmacun", "name": "Dondurulmuş lahmacun", "nameEn": "Frozen Lahmacun", "emoji": "🫓", "category": "Frozen", "kcal": 250, "protein": 9, "fat": 8, "fiber": 2 }, { "id": "donuk-borek", "name": "Dondurulmuş börek", "nameEn": "Frozen Pastry", "emoji": "🥐", "category": "Frozen", "kcal": 260, "protein": 8, "fat": 12, "fiber": 1.5, "variantNutrition": { "Su böreği": { "kcal": 210, "protein": 9, "fat": 8, "fiber": 1.5 }, "Ispanaklı": { "kcal": 240, "protein": 8.5, "fat": 11, "fiber": 2 }, "Sigara böreği": { "kcal": 280, "protein": 8.5, "fat": 14, "fiber": 1.5 } } }, { "id": "milfoy", "name": "Milföy", "nameEn": "Puff Pastry", "emoji": "🥐", "category": "Frozen", "kcal": 300, "protein": 6, "fat": 17, "fiber": 1.5 }, { "id": "donuk-nugget", "name": "Dondurulmuş nugget", "nameEn": "Frozen Nuggets", "emoji": "🍗", "category": "Frozen", "kcal": 260, "protein": 14, "fat": 16, "fiber": 1.2 }, { "id": "donuk-sinitzel", "name": "Dondurulmuş şinitzel", "nameEn": "Frozen Schnitzel", "emoji": "🍗", "category": "Frozen", "kcal": 230, "protein": 18, "fat": 12, "fiber": 1 }, { "id": "donuk-kofte", "name": "Dondurulmuş köfte", "nameEn": "Frozen Meatballs", "emoji": "🧆", "category": "Frozen", "kcal": 250, "protein": 15, "fat": 18, "fiber": 0.8 }, { "id": "yumurta", "name": "Yumurta", "nameEn": "Eggs", "emoji": "🥚", "category": "Breakfast", "kcal": 143, "protein": 13, "fat": 10, "fiber": 0, "variantNutrition": { "Beyaz": { "kcal": 143, "protein": 13, "fat": 10, "fiber": 0 }, "Kahverengi": { "kcal": 143, "protein": 13, "fat": 10, "fiber": 0 }, "Gezen tavuk": { "kcal": 143, "protein": 13, "fat": 10, "fiber": 0 }, "Organik": { "kcal": 143, "protein": 13, "fat": 10, "fiber": 0 } } }, { "id": "siyah-zeytin", "name": "Siyah zeytin", "nameEn": "Black Olives", "emoji": "🫒", "category": "Breakfast", "kcal": 115, "protein": 0.8, "fat": 11, "fiber": 3.3, "variantNutrition": { "Sele": { "kcal": 115, "protein": 0.8, "fat": 11, "fiber": 3.3 }, "Salamura": { "kcal": 115, "protein": 0.8, "fat": 11, "fiber": 3.3 } } }, { "id": "yesil-zeytin", "name": "Yeşil zeytin", "nameEn": "Green Olives", "emoji": "🫒", "category": "Breakfast", "kcal": 145, "protein": 1, "fat": 15, "fiber": 3.3, "variantNutrition": { "Kırma": { "kcal": 145, "protein": 1, "fat": 15, "fiber": 3.3 }, "Dolgulu": { "kcal": 145, "protein": 1, "fat": 13, "fiber": 2.5 } } }, { "id": "zeytin-ezmesi", "name": "Zeytin ezmesi", "nameEn": "Olive Paste", "emoji": "🫒", "category": "Breakfast", "kcal": 350, "protein": 3, "fat": 35, "fiber": 4 }, { "id": "bal", "name": "Bal", "nameEn": "Honey", "emoji": "🍯", "category": "Breakfast", "kcal": 304, "protein": 0.3, "fat": 0, "fiber": 0.2, "variantNutrition": { "Çiçek": { "kcal": 304, "protein": 0.3, "fat": 0, "fiber": 0.2 }, "Çam": { "kcal": 320, "protein": 0.4, "fat": 0, "fiber": 0.2 }, "Kestane": { "kcal": 310, "protein": 0.4, "fat": 0, "fiber": 0.2 } } }, { "id": "recel", "name": "Reçel", "nameEn": "Jam", "emoji": "🍓", "category": "Breakfast", "kcal": 250, "protein": 0.4, "fat": 0.1, "fiber": 1, "variantNutrition": { "Çilek": { "kcal": 250, "protein": 0.4, "fat": 0.1, "fiber": 1 }, "Vişne": { "kcal": 255, "protein": 0.4, "fat": 0.1, "fiber": 1 }, "Kayısı": { "kcal": 265, "protein": 0.4, "fat": 0.1, "fiber": 1 }, "Böğürtlen": { "kcal": 250, "protein": 0.4, "fat": 0.1, "fiber": 1.4 } } }, { "id": "pekmez", "name": "Pekmez", "nameEn": "Molasses", "emoji": "🍯", "category": "Breakfast", "kcal": 290, "protein": 1.7, "fat": 0, "fiber": 0, "variantNutrition": { "Üzüm": { "kcal": 290, "protein": 1.7, "fat": 0, "fiber": 0 }, "Dut": { "kcal": 293, "protein": 2, "fat": 0, "fiber": 0 } } }, { "id": "tahin", "name": "Tahin", "nameEn": "Tahini", "emoji": "🥜", "category": "Breakfast", "kcal": 595, "protein": 17, "fat": 54, "fiber": 9.3 }, { "id": "helva", "name": "Helva", "nameEn": "Halva", "emoji": "🍬", "category": "Breakfast", "kcal": 520, "protein": 12, "fat": 26, "fiber": 3, "variantNutrition": { "Sade": { "kcal": 520, "protein": 12, "fat": 26, "fiber": 3 }, "Kakaolu": { "kcal": 560, "protein": 11, "fat": 30, "fiber": 3.5 } } }, { "id": "findik-kremasi", "name": "Fındık kreması", "nameEn": "Hazelnut Spread", "emoji": "🌰", "category": "Breakfast", "kcal": 540, "protein": 6, "fat": 30, "fiber": 4 }, { "id": "yer-fistigi", "name": "Yer fıstığı ezmesi", "nameEn": "Peanut Butter", "emoji": "🥜", "category": "Breakfast", "kcal": 588, "protein": 25, "fat": 50, "fiber": 6, "variantNutrition": { "Şekersiz": { "kcal": 588, "protein": 25, "fat": 50, "fiber": 6 }, "Parçacıklı": { "kcal": 588, "protein": 25, "fat": 50, "fiber": 6 } } }, { "id": "musli", "name": "Müsli", "nameEn": "Muesli", "emoji": "🥣", "category": "Breakfast", "kcal": 370, "protein": 10, "fat": 6, "fiber": 7.5, "variantNutrition": { "Meyveli": { "kcal": 370, "protein": 10, "fat": 6, "fiber": 7.5 }, "Çikolatalı": { "kcal": 410, "protein": 9, "fat": 12, "fiber": 6 }, "Sade": { "kcal": 365, "protein": 11, "fat": 6, "fiber": 8 } } }, { "id": "granola", "name": "Granola", "nameEn": "Granola", "emoji": "🥣", "category": "Breakfast", "kcal": 450, "protein": 10, "fat": 20, "fiber": 7, "variantNutrition": { "Ballı": { "kcal": 450, "protein": 10, "fat": 20, "fiber": 7 }, "Fındıklı": { "kcal": 470, "protein": 11, "fat": 22, "fiber": 7 }, "Protein": { "kcal": 430, "protein": 18, "fat": 15, "fiber": 7.5 } } }, { "id": "misir-gevregi", "name": "Mısır gevreği", "nameEn": "Corn Flakes", "emoji": "🥣", "category": "Breakfast", "kcal": 357, "protein": 7, "fat": 1, "fiber": 3 }, { "id": "yulaf-ezmesi", "name": "Yulaf ezmesi", "nameEn": "Oatmeal", "emoji": "🥣", "category": "Breakfast", "kcal": 379, "protein": 13, "fat": 6.5, "fiber": 10 }, { "id": "protein-bar", "name": "Protein bar", "nameEn": "Protein Bar", "emoji": "🍫", "category": "Breakfast", "kcal": 380, "protein": 30, "fat": 15, "fiber": 5, "variantNutrition": { "Çikolata": { "kcal": 380, "protein": 30, "fat": 15, "fiber": 5 }, "Fındık": { "kcal": 400, "protein": 28, "fat": 18, "fiber": 4 }, "Yer fıstığı": { "kcal": 395, "protein": 32, "fat": 16, "fiber": 4 } } }, { "id": "nohut", "name": "Nohut", "nameEn": "Chickpeas", "emoji": "🫘", "category": "PantryStaples", "kcal": 364, "protein": 19, "fat": 6, "fiber": 17 }, { "id": "kuru-fasulye", "name": "Kuru fasulye", "nameEn": "Dried Beans", "emoji": "🫘", "category": "PantryStaples", "kcal": 333, "protein": 23, "fat": 1.2, "fiber": 15 }, { "id": "barbunya", "name": "Barbunya", "nameEn": "Borlotti Beans", "emoji": "🫘", "category": "PantryStaples", "kcal": 333, "protein": 23, "fat": 1.2, "fiber": 25 }, { "id": "mercimek", "name": "Mercimek", "nameEn": "Lentils", "emoji": "🫘", "category": "PantryStaples", "kcal": 352, "protein": 25, "fat": 1.1, "fiber": 10.7, "variantNutrition": { "Kırmızı": { "kcal": 358, "protein": 24, "fat": 1.1, "fiber": 10.8 }, "Yeşil": { "kcal": 352, "protein": 25, "fat": 1.1, "fiber": 10.7 } } }, { "id": "pirinc", "name": "Pirinç", "nameEn": "Rice", "emoji": "🍚", "category": "PantryStaples", "kcal": 365, "protein": 7.1, "fat": 0.7, "fiber": 1.3, "variantNutrition": { "Baldo": { "kcal": 365, "protein": 7.1, "fat": 0.7, "fiber": 1.3 }, "Osmancık": { "kcal": 365, "protein": 7.1, "fat": 0.7, "fiber": 1.3 }, "Jasmin": { "kcal": 365, "protein": 7.1, "fat": 0.7, "fiber": 1.3 }, "Pilavlık": { "kcal": 365, "protein": 7.1, "fat": 0.7, "fiber": 1.3 } } }, { "id": "bulgur", "name": "Bulgur", "nameEn": "Bulgur", "emoji": "🌾", "category": "PantryStaples", "kcal": 342, "protein": 12, "fat": 1.3, "fiber": 18, "variantNutrition": { "Pilavlık": { "kcal": 342, "protein": 12, "fat": 1.3, "fiber": 18 }, "Köftelik": { "kcal": 342, "protein": 12, "fat": 1.3, "fiber": 18 } } }, { "id": "spagetti", "name": "Spagetti", "nameEn": "Spaghetti", "emoji": "🍝", "category": "PantryStaples", "kcal": 371, "protein": 13, "fat": 1.5, "fiber": 2.5 }, { "id": "makarna", "name": "Makarna", "nameEn": "Pasta", "emoji": "🍝", "category": "PantryStaples", "kcal": 371, "protein": 13, "fat": 1.5, "fiber": 2.5, "variantNutrition": { "Burgu": { "kcal": 371, "protein": 13, "fat": 1.5, "fiber": 2.5 }, "Fiyonk": { "kcal": 371, "protein": 13, "fat": 1.5, "fiber": 2.5 }, "Penne": { "kcal": 371, "protein": 13, "fat": 1.5, "fiber": 2.5 }, "Tam buğday": { "kcal": 348, "protein": 14, "fat": 2.5, "fiber": 7 }, "Glutensiz": { "kcal": 378, "protein": 7, "fat": 1.5, "fiber": 2.5 } } }, { "id": "sehriye", "name": "Şehriye", "nameEn": "Orzo/Vermicelli", "emoji": "🌾", "category": "PantryStaples", "kcal": 371, "protein": 13, "fat": 1.5, "fiber": 2.5 }, { "id": "un", "name": "Un", "nameEn": "Flour", "emoji": "🌾", "category": "PantryStaples", "kcal": 364, "protein": 10, "fat": 1, "fiber": 2.7, "variantNutrition": { "Çok amaçlı": { "kcal": 364, "protein": 10, "fat": 1, "fiber": 2.7 }, "Baklavalık": { "kcal": 361, "protein": 12, "fat": 1.2, "fiber": 2.4 }, "Tam buğday": { "kcal": 340, "protein": 13, "fat": 2.5, "fiber": 10.7 } } }, { "id": "irmik", "name": "İrmik", "nameEn": "Semolina", "emoji": "🌾", "category": "PantryStaples", "kcal": 360, "protein": 12.7, "fat": 1.1, "fiber": 3.9 }, { "id": "seker", "name": "Şeker", "nameEn": "Sugar", "emoji": "🍬", "category": "PantryStaples", "kcal": 387, "protein": 0, "fat": 0, "fiber": 0, "variantNutrition": { "Toz": { "kcal": 387, "protein": 0, "fat": 0, "fiber": 0 }, "Küp": { "kcal": 387, "protein": 0, "fat": 0, "fiber": 0 }, "Esmer": { "kcal": 380, "protein": 0.1, "fat": 0, "fiber": 0 }, "Pudra": { "kcal": 389, "protein": 0, "fat": 0, "fiber": 0 } } }, { "id": "tuz", "name": "Tuz", "nameEn": "Salt", "emoji": "🧂", "category": "PantryStaples", "kcal": 0, "protein": 0, "fat": 0, "fiber": 0, "variantNutrition": { "İyotlu": { "kcal": 0, "protein": 0, "fat": 0, "fiber": 0 }, "Kaya tuzu": { "kcal": 0, "protein": 0, "fat": 0, "fiber": 0 }, "Himalaya": { "kcal": 0, "protein": 0, "fat": 0, "fiber": 0 }, "Deniz tuzu": { "kcal": 0, "protein": 0, "fat": 0, "fiber": 0 } } }, { "id": "aycicek-yagi", "name": "Ayçiçek yağı", "nameEn": "Sunflower Oil", "emoji": "🫙", "category": "PantryStaples", "kcal": 884, "protein": 0, "fat": 100, "fiber": 0 }, { "id": "misirozi-yagi", "name": "Mısırözü yağı", "nameEn": "Corn Oil", "emoji": "🫙", "category": "PantryStaples", "kcal": 884, "protein": 0, "fat": 100, "fiber": 0 }, { "id": "zeytinyagi", "name": "Zeytinyağı", "nameEn": "Olive Oil", "emoji": "🫒", "category": "PantryStaples", "kcal": 884, "protein": 0, "fat": 100, "fiber": 0, "variantNutrition": { "Riviera": { "kcal": 884, "protein": 0, "fat": 100, "fiber": 0 }, "Natürel sızma": { "kcal": 884, "protein": 0, "fat": 100, "fiber": 0 }, "Erken hasat": { "kcal": 884, "protein": 0, "fat": 100, "fiber": 0 } } }, { "id": "sirke", "name": "Sirke", "nameEn": "Vinegar", "emoji": "🫙", "category": "PantryStaples", "kcal": 20, "protein": 0.1, "fat": 0, "fiber": 0, "variantNutrition": { "Elma sirkesi": { "kcal": 22, "protein": 0, "fat": 0, "fiber": 0 }, "Üzüm sirkesi": { "kcal": 20, "protein": 0.1, "fat": 0, "fiber": 0 }, "Nar ekşisi": { "kcal": 305, "protein": 1.3, "fat": 0.1, "fiber": 0.5 } } }, { "id": "nisasta", "name": "Nişasta", "nameEn": "Cornstarch", "emoji": "🫙", "category": "PantryStaples", "kcal": 381, "protein": 0.3, "fat": 0, "fiber": 0.9 }, { "id": "domates-salcasi", "name": "Domates salçası", "nameEn": "Tomato Paste", "emoji": "🥫", "category": "PantryStaples", "kcal": 82, "protein": 4.3, "fat": 0.5, "fiber": 4.1 }, { "id": "biber-salcasi", "name": "Biber salçası", "nameEn": "Pepper Paste", "emoji": "🥫", "category": "PantryStaples", "kcal": 105, "protein": 4.5, "fat": 2, "fiber": 5 }, { "id": "konserve-misir", "name": "Konserve mısır", "nameEn": "Canned Corn", "emoji": "🥫", "category": "PantryStaples", "kcal": 81, "protein": 2.5, "fat": 0.8, "fiber": 2.5 }, { "id": "konserve-bezelye", "name": "Konserve bezelye", "nameEn": "Canned Peas", "emoji": "🥫", "category": "PantryStaples", "kcal": 66, "protein": 4.4, "fat": 0.3, "fiber": 3.9 }, { "id": "garnitur", "name": "Garnitür", "nameEn": "Canned Mixed Veg", "emoji": "🥫", "category": "PantryStaples", "kcal": 50, "protein": 2, "fat": 0.3, "fiber": 3 }, { "id": "ton-suda", "name": "Ton balığı (suda)", "nameEn": "Tuna in Water", "emoji": "🥫", "category": "PantryStaples", "kcal": 116, "protein": 26, "fat": 1, "fiber": 0 }, { "id": "ton-yagda", "name": "Ton balığı (yağda)", "nameEn": "Tuna in Oil", "emoji": "🥫", "category": "PantryStaples", "kcal": 198, "protein": 29, "fat": 8, "fiber": 0 }, { "id": "konserve-fasulye", "name": "Konserve fasulye", "nameEn": "Canned Beans", "emoji": "🥫", "category": "PantryStaples", "kcal": 81, "protein": 5.2, "fat": 0.3, "fiber": 5.5 }, { "id": "ketchup", "name": "Ketçap", "nameEn": "Ketchup", "emoji": "🥫", "category": "PantryStaples", "kcal": 112, "protein": 1.3, "fat": 0.4, "fiber": 0.3 }, { "id": "mayonez", "name": "Mayonez", "nameEn": "Mayonnaise", "emoji": "🥫", "category": "PantryStaples", "kcal": 680, "protein": 1, "fat": 75, "fiber": 0 }, { "id": "hardal", "name": "Hardal", "nameEn": "Mustard", "emoji": "🥫", "category": "PantryStaples", "kcal": 66, "protein": 4.4, "fat": 4, "fiber": 3.3 }, { "id": "bbq-sos", "name": "BBQ sos", "nameEn": "BBQ Sauce", "emoji": "🥫", "category": "PantryStaples", "kcal": 170, "protein": 1, "fat": 0.5, "fiber": 1 }, { "id": "aci-sos", "name": "Acı sos", "nameEn": "Hot Sauce", "emoji": "🌶️", "category": "PantryStaples", "kcal": 30, "protein": 1.3, "fat": 0.3, "fiber": 1 }, { "id": "soya-sosu", "name": "Soya sosu", "nameEn": "Soy Sauce", "emoji": "🥣", "category": "PantryStaples", "kcal": 53, "protein": 8.1, "fat": 0.6, "fiber": 0.8 }, { "id": "tursu", "name": "Turşu", "nameEn": "Pickles", "emoji": "🫙", "category": "PantryStaples", "kcal": 12, "protein": 0.6, "fat": 0.2, "fiber": 1.2, "variantNutrition": { "Salatalık": { "kcal": 11, "protein": 0.3, "fat": 0.1, "fiber": 1.2 }, "Karışık": { "kcal": 15, "protein": 0.7, "fat": 0.2, "fiber": 1.3 }, "Lahana": { "kcal": 19, "protein": 0.9, "fat": 0.1, "fiber": 3 } } }, { "id": "humus", "name": "Humus", "nameEn": "Hummus", "emoji": "🧆", "category": "PantryStaples", "kcal": 166, "protein": 7.9, "fat": 10, "fiber": 6 }, { "id": "haydari", "name": "Haydari", "nameEn": "Haydari (Yogurt Dip)", "emoji": "🥣", "category": "PantryStaples", "kcal": 150, "protein": 5, "fat": 13, "fiber": 0.5 }, { "id": "acuka", "name": "Acuka", "nameEn": "Acuka (Red Pepper Spread)", "emoji": "🌶️", "category": "PantryStaples", "kcal": 200, "protein": 3.5, "fat": 15, "fiber": 3 }, { "id": "ezme", "name": "Ezme", "nameEn": "Ezme (Spicy Tomato Dip)", "emoji": "🍅", "category": "PantryStaples", "kcal": 50, "protein": 1.5, "fat": 2, "fiber": 2.5 }, { "id": "hazir-corba", "name": "Hazır çorba (toz)", "nameEn": "Instant Soup", "emoji": "🍲", "category": "PantryStaples", "kcal": 350, "protein": 11, "fat": 5, "fiber": 4.5, "variantNutrition": { "Mercimek": { "kcal": 350, "protein": 15, "fat": 5, "fiber": 6 }, "Ezogelin": { "kcal": 355, "protein": 14, "fat": 5, "fiber": 5.5 }, "Tavuklu": { "kcal": 345, "protein": 12, "fat": 8, "fiber": 2.5 } } }, { "id": "tarhana", "name": "Tarhana", "nameEn": "Tarhana", "emoji": "🍲", "category": "PantryStaples", "kcal": 345, "protein": 12, "fat": 3, "fiber": 5 }, { "id": "noodle", "name": "Noodle", "nameEn": "Noodles", "emoji": "🍜", "category": "PantryStaples", "kcal": 460, "protein": 10, "fat": 20, "fiber": 2 }, { "id": "hazir-yemek", "name": "Hazır yemek", "nameEn": "Ready Meal", "emoji": "🍱", "category": "PantryStaples", "kcal": 150, "protein": 6, "fat": 6, "fiber": 2 }, { "id": "corba-konserve", "name": "Konserve çorba", "nameEn": "Canned Soup", "emoji": "🥫", "category": "PantryStaples", "kcal": 60, "protein": 2.5, "fat": 1.5, "fiber": 1.2 }, { "id": "karabiber", "name": "Karabiber", "nameEn": "Black Pepper", "emoji": "🌶️", "category": "PantryStaples", "kcal": 251, "protein": 10, "fat": 3.3, "fiber": 25.3, "variantNutrition": { "Tane": { "kcal": 251, "protein": 10, "fat": 3.3, "fiber": 25.3 }, "Öğütülmüş": { "kcal": 251, "protein": 10, "fat": 3.3, "fiber": 25.3 } } }, { "id": "pul-biber", "name": "Pul biber", "nameEn": "Red Pepper Flakes", "emoji": "🌶️", "category": "PantryStaples", "kcal": 282, "protein": 13, "fat": 14, "fiber": 34 }, { "id": "kekik", "name": "Kekik", "nameEn": "Thyme", "emoji": "🌿", "category": "PantryStaples", "kcal": 276, "protein": 9.1, "fat": 7.4, "fiber": 37 }, { "id": "kuru-nane", "name": "Kuru nane", "nameEn": "Dried Mint", "emoji": "🌿", "category": "PantryStaples", "kcal": 285, "protein": 20, "fat": 6, "fiber": 32 }, { "id": "kimyon", "name": "Kimyon", "nameEn": "Cumin", "emoji": "🌿", "category": "PantryStaples", "kcal": 375, "protein": 18, "fat": 22, "fiber": 11, "variantNutrition": { "Tane": { "kcal": 375, "protein": 18, "fat": 22, "fiber": 11 }, "Öğütülmüş": { "kcal": 375, "protein": 18, "fat": 22, "fiber": 11 } } }, { "id": "sumak", "name": "Sumak", "nameEn": "Sumac", "emoji": "🌶️", "category": "PantryStaples", "kcal": 265, "protein": 4, "fat": 5, "fiber": 25 }, { "id": "susam", "name": "Susam", "nameEn": "Sesame Seeds", "emoji": "🌾", "category": "PantryStaples", "kcal": 573, "protein": 17.7, "fat": 49.7, "fiber": 11.8 }, { "id": "toz-biber", "name": "Toz biber", "nameEn": "Paprika", "emoji": "🌶️", "category": "PantryStaples", "kcal": 282, "protein": 14, "fat": 13, "fiber": 35, "variantNutrition": { "Tatlı": { "kcal": 282, "protein": 14, "fat": 13, "fiber": 35 }, "Acı": { "kcal": 282, "protein": 14, "fat": 13, "fiber": 35 } } }, { "id": "tarcin", "name": "Tarçın", "nameEn": "Cinnamon", "emoji": "🪵", "category": "PantryStaples", "kcal": 247, "protein": 4, "fat": 1.2, "fiber": 53, "variantNutrition": { "Çubuk": { "kcal": 247, "protein": 4, "fat": 1.2, "fiber": 53 }, "Toz": { "kcal": 247, "protein": 4, "fat": 1.2, "fiber": 53 } } }, { "id": "maya", "name": "Maya", "nameEn": "Yeast", "emoji": "🫙", "category": "PantryStaples", "kcal": 325, "protein": 40, "fat": 7.6, "fiber": 27, "variantNutrition": { "Kuru": { "kcal": 325, "protein": 40, "fat": 7.6, "fiber": 27 }, "Yaş": { "kcal": 105, "protein": 12, "fat": 2, "fiber": 8 } } }, { "id": "kabartma-tozu", "name": "Kabartma tozu", "nameEn": "Baking Powder", "emoji": "🫙", "category": "PantryStaples", "kcal": 53, "protein": 0, "fat": 0, "fiber": 0 }, { "id": "vanilya", "name": "Vanilya", "nameEn": "Vanilla", "emoji": "🫙", "category": "PantryStaples", "kcal": 288, "protein": 0.1, "fat": 0.1, "fiber": 0, "variantNutrition": { "Toz": { "kcal": 288, "protein": 0.1, "fat": 0.1, "fiber": 0 }, "Sıvı özüt": { "kcal": 288, "protein": 0.1, "fat": 0.1, "fiber": 0 } } }, { "id": "kakao", "name": "Kakao", "nameEn": "Cocoa Powder", "emoji": "🍫", "category": "PantryStaples", "kcal": 228, "protein": 19.6, "fat": 13.7, "fiber": 37 }, { "id": "puding", "name": "Puding (toz)", "nameEn": "Pudding Mix", "emoji": "🍮", "category": "PantryStaples", "kcal": 380, "protein": 2, "fat": 3, "fiber": 1 }, { "id": "limon-tuzu", "name": "Limon tuzu", "nameEn": "Citric Acid", "emoji": "🍋", "category": "PantryStaples", "kcal": 0, "protein": 0, "fat": 0, "fiber": 0 }, { "id": "kinoa", "name": "Kinoa", "nameEn": "Quinoa", "emoji": "🌾", "category": "PantryStaples", "kcal": 368, "protein": 14, "fat": 6, "fiber": 7 }, { "id": "kuskus", "name": "Kuskus", "nameEn": "Couscous", "emoji": "🌾", "category": "PantryStaples", "kcal": 376, "protein": 13, "fat": 0.6, "fiber": 5 }, { "id": "tofu", "name": "Tofu", "nameEn": "Tofu", "emoji": "🌱", "category": "PantryStaples", "kcal": 137, "protein": 12, "fat": 9, "fiber": 2 }, { "id": "cips", "name": "Cips", "nameEn": "Chips", "emoji": "🍟", "category": "Snacks", "kcal": 540, "protein": 6.5, "fat": 33, "fiber": 4, "variantNutrition": { "Klasik": { "kcal": 540, "protein": 6.5, "fat": 33, "fiber": 4 }, "Baharatlı": { "kcal": 540, "protein": 6.5, "fat": 33, "fiber": 4 }, "Acı": { "kcal": 540, "protein": 6.5, "fat": 33, "fiber": 4 }, "Barbecue": { "kcal": 540, "protein": 6.5, "fat": 33, "fiber": 4 }, "Yoğurtlu": { "kcal": 540, "protein": 6.5, "fat": 33, "fiber": 4 }, "Fırınlanmış": { "kcal": 470, "protein": 7, "fat": 22, "fiber": 4.5 } } }, { "id": "cikolata", "name": "Çikolata", "nameEn": "Chocolate", "emoji": "🍫", "category": "Snacks", "kcal": 535, "protein": 7, "fat": 30, "fiber": 3.5, "variantNutrition": { "Sütlü": { "kcal": 535, "protein": 7, "fat": 30, "fiber": 3.5 }, "Bitter": { "kcal": 595, "protein": 7.8, "fat": 43, "fiber": 10.9 }, "Beyaz": { "kcal": 539, "protein": 5.9, "fat": 32, "fiber": 0.2 }, "Fındıklı": { "kcal": 557, "protein": 8.5, "fat": 35, "fiber": 4.5 }, "Fıstıklı": { "kcal": 565, "protein": 10, "fat": 36, "fiber": 4.5 }, "Karamelli": { "kcal": 520, "protein": 6, "fat": 26, "fiber": 2 } } }, { "id": "biskuvi", "name": "Bisküvi", "nameEn": "Biscuits", "emoji": "🍪", "category": "Snacks", "kcal": 480, "protein": 7, "fat": 20, "fiber": 2.5, "variantNutrition": { "Sade": { "kcal": 475, "protein": 7, "fat": 17, "fiber": 2.5 }, "Kakaolu": { "kcal": 480, "protein": 6.5, "fat": 20, "fiber": 3 }, "Kremalı": { "kcal": 500, "protein": 6, "fat": 23, "fiber": 1.5 }, "Yulaflı": { "kcal": 450, "protein": 7.5, "fat": 18, "fiber": 5 } } }, { "id": "gofret", "name": "Gofret", "nameEn": "Wafer", "emoji": "🧇", "category": "Snacks", "kcal": 520, "protein": 6, "fat": 28, "fiber": 2, "variantNutrition": { "Fındık": { "kcal": 540, "protein": 7, "fat": 30, "fiber": 3 }, "Çikolata": { "kcal": 525, "protein": 6.5, "fat": 28, "fiber": 2.5 }, "Karamel": { "kcal": 510, "protein": 5.5, "fat": 26, "fiber": 1.5 } } }, { "id": "kraker", "name": "Kraker", "nameEn": "Crackers", "emoji": "🧂", "category": "Snacks", "kcal": 450, "protein": 10, "fat": 17, "fiber": 3, "variantNutrition": { "Tuzlu": { "kcal": 450, "protein": 10, "fat": 17, "fiber": 3 }, "Susamlı": { "kcal": 470, "protein": 11, "fat": 20, "fiber": 3.5 }, "Peynirli": { "kcal": 480, "protein": 11, "fat": 20, "fiber": 2.5 } } }, { "id": "sekerleme", "name": "Şekerleme", "nameEn": "Candy", "emoji": "🍬", "category": "Snacks", "kcal": 340, "protein": 2, "fat": 0.5, "fiber": 0, "variantNutrition": { "Jöle şeker": { "kcal": 340, "protein": 6.9, "fat": 0.2, "fiber": 0 }, "Yumuşak şeker": { "kcal": 400, "protein": 0.2, "fat": 8, "fiber": 0 }, "Naneli": { "kcal": 390, "protein": 0, "fat": 0, "fiber": 0 } } }, { "id": "lokum", "name": "Lokum", "nameEn": "Turkish Delight", "emoji": "🍬", "category": "Snacks", "kcal": 351, "protein": 0.3, "fat": 0.1, "fiber": 0.6 }, { "id": "sakiz", "name": "Sakız", "nameEn": "Chewing Gum", "emoji": "🍬", "category": "Snacks", "kcal": 375, "protein": 0, "fat": 0.2, "fiber": 0 }, { "id": "kuruyemis", "name": "Kuruyemiş", "nameEn": "Nuts", "emoji": "🥜", "category": "Snacks", "kcal": 580, "protein": 20, "fat": 50, "fiber": 7, "variantNutrition": { "Kaju": { "kcal": 553, "protein": 18, "fat": 44, "fiber": 3.3 }, "Kabak çekirdeği": { "kcal": 446, "protein": 19, "fat": 19, "fiber": 18 } } }, { "id": "findik", "name": "Fındık", "nameEn": "Hazelnut", "emoji": "🌰", "category": "Snacks", "kcal": 628, "protein": 15, "fat": 61, "fiber": 10 }, { "id": "antep-fistigi", "name": "Antep fıstığı", "nameEn": "Pistachio", "emoji": "🥜", "category": "Snacks", "kcal": 562, "protein": 20, "fat": 46, "fiber": 10 }, { "id": "badem", "name": "Badem", "nameEn": "Almond", "emoji": "🌰", "category": "Snacks", "kcal": 579, "protein": 21, "fat": 50, "fiber": 13 }, { "id": "ceviz", "name": "Ceviz", "nameEn": "Walnut", "emoji": "🌰", "category": "Snacks", "kcal": 654, "protein": 15.2, "fat": 65.2, "fiber": 6.7 }, { "id": "leblebi", "name": "Leblebi", "nameEn": "Roasted Chickpea", "emoji": "🥜", "category": "Snacks", "kcal": 366, "protein": 20.1, "fat": 6, "fiber": 10.7 }, { "id": "ay-cekirdegi", "name": "Ay çekirdeği", "nameEn": "Sunflower Seeds", "emoji": "🌻", "category": "Snacks", "kcal": 584, "protein": 21, "fat": 51, "fiber": 8.6 }, { "id": "kuru-meyve", "name": "Kuru meyve", "nameEn": "Dried Fruit", "emoji": "🍑", "category": "Snacks", "kcal": 280, "protein": 3, "fat": 0.5, "fiber": 8, "variantNutrition": { "Kuru kayısı": { "kcal": 241, "protein": 3.4, "fat": 0.5, "fiber": 7.3 }, "Kuru incir": { "kcal": 249, "protein": 3.3, "fat": 0.9, "fiber": 9.8 }, "Kuru üzüm": { "kcal": 299, "protein": 3.1, "fat": 0.5, "fiber": 3.7 } } }, { "id": "patlamis-misir", "name": "Patlamış mısır", "nameEn": "Popcorn", "emoji": "🍿", "category": "Snacks", "kcal": 387, "protein": 13, "fat": 4.5, "fiber": 15, "variantNutrition": { "Sade": { "kcal": 387, "protein": 13, "fat": 4.5, "fiber": 15 }, "Tuzlu": { "kcal": 400, "protein": 12, "fat": 5, "fiber": 14 }, "Tereyağlı": { "kcal": 500, "protein": 9, "fat": 28, "fiber": 10 }, "Karamel": { "kcal": 430, "protein": 5, "fat": 12, "fiber": 4 } } }, { "id": "su", "name": "Su", "nameEn": "Water", "emoji": "💧", "category": "Beverages", "kcal": 0, "protein": 0, "fat": 0, "fiber": 0 }, { "id": "damacana", "name": "Damacana", "nameEn": "Water Jug", "emoji": "🫙", "category": "Beverages", "kcal": 0, "protein": 0, "fat": 0, "fiber": 0 }, { "id": "maden-suyu", "name": "Maden suyu", "nameEn": "Sparkling Water", "emoji": "🫧", "category": "Beverages", "kcal": 0, "protein": 0, "fat": 0, "fiber": 0 }, { "id": "aromali-maden", "name": "Aromalı maden suyu", "nameEn": "Flavored Sparkling Water", "emoji": "🍋", "category": "Beverages", "kcal": 3, "protein": 0, "fat": 0, "fiber": 0, "variantNutrition": { "Limonlu": { "kcal": 3, "protein": 0, "fat": 0, "fiber": 0 }, "Elmalı": { "kcal": 3, "protein": 0, "fat": 0, "fiber": 0 }, "Karpuz-çilek": { "kcal": 3, "protein": 0, "fat": 0, "fiber": 0 } } }, { "id": "kola", "name": "Kola", "nameEn": "Cola", "emoji": "🥤", "category": "Beverages", "kcal": 42, "protein": 0, "fat": 0, "fiber": 0, "variantNutrition": { "Klasik": { "kcal": 42, "protein": 0, "fat": 0, "fiber": 0 }, "Şekersiz": { "kcal": 0, "protein": 0, "fat": 0, "fiber": 0 } } }, { "id": "meyveli-gazoz", "name": "Meyveli gazoz", "nameEn": "Fruit Soda", "emoji": "🥤", "category": "Beverages", "kcal": 50, "protein": 0, "fat": 0, "fiber": 0, "variantNutrition": { "Portakallı": { "kcal": 50, "protein": 0, "fat": 0, "fiber": 0 }, "Limonlu": { "kcal": 42, "protein": 0, "fat": 0, "fiber": 0 } } }, { "id": "gazoz", "name": "Gazoz", "nameEn": "Soda", "emoji": "🥤", "category": "Beverages", "kcal": 42, "protein": 0, "fat": 0, "fiber": 0, "variantNutrition": { "Sade": { "kcal": 42, "protein": 0, "fat": 0, "fiber": 0 }, "Limonlu": { "kcal": 42, "protein": 0, "fat": 0, "fiber": 0 } } }, { "id": "tonik", "name": "Tonik", "nameEn": "Tonic Water", "emoji": "🥤", "category": "Beverages", "kcal": 38, "protein": 0, "fat": 0, "fiber": 0 }, { "id": "ginger-ale", "name": "Ginger ale", "nameEn": "Ginger Ale", "emoji": "🫗", "category": "Beverages", "kcal": 34, "protein": 0, "fat": 0, "fiber": 0 }, { "id": "meyve-suyu", "name": "Meyve suyu %100", "nameEn": "100% Juice", "emoji": "🧃", "category": "Beverages", "kcal": 45, "protein": 0.3, "fat": 0.1, "fiber": 0.2, "variantNutrition": { "Portakal": { "kcal": 45, "protein": 0.7, "fat": 0.2, "fiber": 0.2 }, "Elma": { "kcal": 46, "protein": 0.1, "fat": 0.1, "fiber": 0.2 }, "Karışık": { "kcal": 48, "protein": 0.4, "fat": 0.1, "fiber": 0.3 } } }, { "id": "limonata", "name": "Limonata", "nameEn": "Lemonade", "emoji": "🍋", "category": "Beverages", "kcal": 40, "protein": 0.1, "fat": 0, "fiber": 0.1 }, { "id": "nektar", "name": "Nektar", "nameEn": "Nectar", "emoji": "🧃", "category": "Beverages", "kcal": 50, "protein": 0.3, "fat": 0.1, "fiber": 0.3, "variantNutrition": { "Şeftali": { "kcal": 50, "protein": 0.3, "fat": 0.1, "fiber": 0.4 }, "Kayısı": { "kcal": 52, "protein": 0.4, "fat": 0.1, "fiber": 0.4 }, "Vişne": { "kcal": 53, "protein": 0.3, "fat": 0.1, "fiber": 0.3 } } }, { "id": "soguk-cay", "name": "Soğuk çay (Ice tea)", "nameEn": "Iced Tea", "emoji": "🧃", "category": "Beverages", "kcal": 28, "protein": 0, "fat": 0, "fiber": 0, "variantNutrition": { "Limon": { "kcal": 28, "protein": 0, "fat": 0, "fiber": 0 }, "Şeftali": { "kcal": 32, "protein": 0, "fat": 0, "fiber": 0 } } }, { "id": "cay", "name": "Çay", "nameEn": "Tea", "emoji": "🍵", "category": "Beverages", "kcal": 1, "protein": 0, "fat": 0, "fiber": 0, "variantNutrition": { "Siyah": { "kcal": 1, "protein": 0, "fat": 0, "fiber": 0 }, "Yeşil": { "kcal": 1, "protein": 0, "fat": 0, "fiber": 0 } } }, { "id": "bitki-cayi", "name": "Bitki çayı", "nameEn": "Herbal Tea", "emoji": "🍵", "category": "Beverages", "kcal": 1, "protein": 0, "fat": 0, "fiber": 0, "variantNutrition": { "Ihlamur": { "kcal": 1, "protein": 0, "fat": 0, "fiber": 0 }, "Papatya": { "kcal": 1, "protein": 0, "fat": 0, "fiber": 0 }, "Adaçayı": { "kcal": 2, "protein": 0, "fat": 0, "fiber": 0 }, "Kuşburnu": { "kcal": 2, "protein": 0.1, "fat": 0, "fiber": 0.1 } } }, { "id": "kahve", "name": "Kahve", "nameEn": "Coffee", "emoji": "☕", "category": "Beverages", "kcal": 2, "protein": 0.1, "fat": 0, "fiber": 0, "variantNutrition": { "Türk": { "kcal": 2, "protein": 0.1, "fat": 0, "fiber": 0 }, "Filtre": { "kcal": 1, "protein": 0.1, "fat": 0, "fiber": 0 }, "Espresso": { "kcal": 2, "protein": 0.1, "fat": 0, "fiber": 0 }, "Granül": { "kcal": 2, "protein": 0.1, "fat": 0, "fiber": 0 } } }, { "id": "2si-1-arada", "name": "2'si 1 arada", "nameEn": "2-in-1 Coffee", "emoji": "☕", "category": "Beverages", "kcal": 45, "protein": 0.8, "fat": 2, "fiber": 0 }, { "id": "3u-1-arada", "name": "3'ü 1 arada", "nameEn": "3-in-1 Coffee", "emoji": "☕", "category": "Beverages", "kcal": 80, "protein": 1, "fat": 3, "fiber": 0 }, { "id": "soguk-kahve", "name": "Soğuk kahve", "nameEn": "Iced Coffee", "emoji": "🧋", "category": "Beverages", "kcal": 50, "protein": 1, "fat": 2, "fiber": 0 }, { "id": "enerji-icecegi", "name": "Enerji içeceği", "nameEn": "Energy Drink", "emoji": "⚡", "category": "Beverages", "kcal": 45, "protein": 0.3, "fat": 0, "fiber": 0, "variantNutrition": { "Normal": { "kcal": 45, "protein": 0.3, "fat": 0, "fiber": 0 }, "Şekersiz": { "kcal": 3, "protein": 0.3, "fat": 0, "fiber": 0 } } }, { "id": "salgam-suyu", "name": "Şalgam suyu", "nameEn": "Şalgam (Turnip Juice)", "emoji": "🥤", "category": "Beverages", "kcal": 16, "protein": 0.5, "fat": 0.1, "fiber": 0, "variantNutrition": { "Acısız": { "kcal": 16, "protein": 0.5, "fat": 0.1, "fiber": 0 }, "Acı": { "kcal": 15, "protein": 0.5, "fat": 0.1, "fiber": 0 } } }, { "id": "bira", "name": "Bira", "nameEn": "Beer", "emoji": "🍺", "category": "AlcoholicBeverages", "kcal": 43, "protein": 0.5, "fat": 0, "fiber": 0, "variantNutrition": { "Lager": { "kcal": 43, "protein": 0.5, "fat": 0, "fiber": 0 }, "Buğday": { "kcal": 45, "protein": 0.6, "fat": 0, "fiber": 0 }, "IPA": { "kcal": 65, "protein": 0.6, "fat": 0, "fiber": 0 }, "Stout": { "kcal": 65, "protein": 0.8, "fat": 0, "fiber": 0 }, "Aromalı": { "kcal": 45, "protein": 0.3, "fat": 0, "fiber": 0 }, "Alkolsüz": { "kcal": 25, "protein": 0.4, "fat": 0, "fiber": 0 } } }, { "id": "cider", "name": "Cider", "nameEn": "Cider", "emoji": "🍎", "category": "AlcoholicBeverages", "kcal": 50, "protein": 0.1, "fat": 0, "fiber": 0, "variantNutrition": { "Elma": { "kcal": 50, "protein": 0.1, "fat": 0, "fiber": 0 }, "Aromalı": { "kcal": 55, "protein": 0.1, "fat": 0, "fiber": 0 } } }, { "id": "sarap", "name": "Şarap", "nameEn": "Wine", "emoji": "🍷", "category": "AlcoholicBeverages", "kcal": 85, "protein": 0.1, "fat": 0, "fiber": 0, "variantNutrition": { "Kırmızı": { "kcal": 85, "protein": 0.1, "fat": 0, "fiber": 0 }, "Beyaz": { "kcal": 82, "protein": 0.1, "fat": 0, "fiber": 0 }, "Roze": { "kcal": 83, "protein": 0.1, "fat": 0, "fiber": 0 }, "Köpüklü": { "kcal": 80, "protein": 0.2, "fat": 0, "fiber": 0 }, "Tatlı": { "kcal": 120, "protein": 0.2, "fat": 0, "fiber": 0 } } }, { "id": "raki", "name": "Rakı", "nameEn": "Raki", "emoji": "🥃", "category": "AlcoholicBeverages", "kcal": 231, "protein": 0, "fat": 0, "fiber": 0 }, { "id": "votka", "name": "Votka", "nameEn": "Vodka", "emoji": "🥃", "category": "AlcoholicBeverages", "kcal": 231, "protein": 0, "fat": 0, "fiber": 0 }, { "id": "viski", "name": "Viski", "nameEn": "Whisky", "emoji": "🥃", "category": "AlcoholicBeverages", "kcal": 250, "protein": 0, "fat": 0, "fiber": 0 }, { "id": "likor", "name": "Likör", "nameEn": "Liqueur", "emoji": "🍹", "category": "AlcoholicBeverages", "kcal": 300, "protein": 0.3, "fat": 1, "fiber": 0, "variantNutrition": { "Kahve": { "kcal": 330, "protein": 0.3, "fat": 0, "fiber": 0 }, "Kremalı": { "kcal": 325, "protein": 3, "fat": 15, "fiber": 0 }, "Portakal": { "kcal": 280, "protein": 0, "fat": 0, "fiber": 0 } } }, { "id": "hazir-kokteyl", "name": "Hazır kokteyl (RTD)", "nameEn": "RTD Cocktail", "emoji": "🍹", "category": "AlcoholicBeverages", "kcal": 85, "protein": 0.1, "fat": 0, "fiber": 0 }, { "id": "hard-seltzer", "name": "Hard seltzer", "nameEn": "Hard Seltzer", "emoji": "🫧", "category": "AlcoholicBeverages", "kcal": 35, "protein": 0, "fat": 0, "fiber": 0 }, { "id": "cin", "name": "Cin", "nameEn": "Gin", "emoji": "🍸", "category": "AlcoholicBeverages", "kcal": 263, "protein": 0, "fat": 0, "fiber": 0 }, { "id": "camasir-deterjani", "name": "Çamaşır deterjanı", "nameEn": "Laundry Detergent", "emoji": "🧼", "category": "Cleaning" }, { "id": "yumusatici", "name": "Yumuşatıcı", "nameEn": "Fabric Softener", "emoji": "🧼", "category": "Cleaning" }, { "id": "bulasik-deterjani", "name": "Bulaşık deterjanı", "nameEn": "Dish Soap", "emoji": "🧽", "category": "Cleaning" }, { "id": "bulasik-tableti", "name": "Bulaşık tableti", "nameEn": "Dishwasher Tabs", "emoji": "🧼", "category": "Cleaning" }, { "id": "yuzey-temizleyici", "name": "Yüzey temizleyici", "nameEn": "Surface Cleaner", "emoji": "🧴", "category": "Cleaning" }, { "id": "camasir-suyu", "name": "Çamaşır suyu", "nameEn": "Bleach", "emoji": "🧴", "category": "Cleaning" }, { "id": "cop-poseti", "name": "Çöp poşeti", "nameEn": "Garbage Bags", "emoji": "🗑️", "category": "Cleaning" }, { "id": "sunger", "name": "Sünger / bez", "nameEn": "Sponge", "emoji": "🧽", "category": "Cleaning" }, { "id": "tuvalet-kagidi", "name": "Tuvalet kağıdı", "nameEn": "Toilet Paper", "emoji": "🧻", "category": "Cleaning" }, { "id": "kagit-havlu", "name": "Kağıt havlu", "nameEn": "Paper Towel", "emoji": "🧻", "category": "Cleaning" }, { "id": "pecete", "name": "Peçete", "nameEn": "Napkins", "emoji": "🧻", "category": "Cleaning" }, { "id": "mendil", "name": "Mendil", "nameEn": "Tissues", "emoji": "🤧", "category": "Cleaning" }, { "id": "islak-mendil", "name": "Islak mendil", "nameEn": "Wet Wipes", "emoji": "🧻", "category": "Cleaning" }, { "id": "sampuan", "name": "Şampuan", "nameEn": "Shampoo", "emoji": "🧴", "category": "PersonalCare" }, { "id": "sac-kremi", "name": "Saç kremi", "nameEn": "Conditioner", "emoji": "🧴", "category": "PersonalCare" }, { "id": "dus-jeli", "name": "Duş jeli", "nameEn": "Shower Gel", "emoji": "🧼", "category": "PersonalCare" }, { "id": "dis-macunu", "name": "Diş macunu", "nameEn": "Toothpaste", "emoji": "🪥", "category": "PersonalCare" }, { "id": "dis-fircasi", "name": "Diş fırçası", "nameEn": "Toothbrush", "emoji": "🪥", "category": "PersonalCare" }, { "id": "deodorant", "name": "Deodorant", "nameEn": "Deodorant", "emoji": "🧴", "category": "PersonalCare" }, { "id": "el-kremi", "name": "El kremi", "nameEn": "Hand Cream", "emoji": "🧴", "category": "PersonalCare" }, { "id": "gunes-kremi", "name": "Güneş kremi", "nameEn": "Sunscreen", "emoji": "🧴", "category": "PersonalCare" }, { "id": "hijyenik-ped", "name": "Hijyenik ped", "nameEn": "Sanitary Pads", "emoji": "🌸", "category": "PersonalCare" }, { "id": "tiras-bicagi", "name": "Tıraş bıçağı", "nameEn": "Razor", "emoji": "🪒", "category": "PersonalCare" }, { "id": "vitamin", "name": "Vitamin / takviye", "nameEn": "Vitamins", "emoji": "💊", "category": "PersonalCare" }, { "id": "agri-kesici", "name": "Ağrı kesici", "nameEn": "Pain Reliever", "emoji": "💊", "category": "PersonalCare" }, { "id": "yara-bandi", "name": "Yara bandı", "nameEn": "Bandages", "emoji": "🩹", "category": "PersonalCare" }, { "id": "antiseptik", "name": "Antiseptik", "nameEn": "Antiseptic", "emoji": "🩺", "category": "PersonalCare" }, { "id": "bebek-bezi", "name": "Bebek bezi", "nameEn": "Diapers", "emoji": "👶", "category": "Baby" }, { "id": "bebek-mamasi", "name": "Bebek maması", "nameEn": "Baby Formula", "emoji": "🍼", "category": "Baby", "kcal": 450, "protein": 13, "fat": 22, "fiber": 3 }, { "id": "bebek-puresi", "name": "Bebek püresi", "nameEn": "Baby Puree", "emoji": "🥣", "category": "Baby", "kcal": 60, "protein": 1, "fat": 0.5, "fiber": 1.5 }, { "id": "bebek-sampuan", "name": "Bebek şampuanı", "nameEn": "Baby Shampoo", "emoji": "🧴", "category": "Baby" }, { "id": "islak-mendil-bebek", "name": "Bebek ıslak mendil", "nameEn": "Baby Wipes", "emoji": "🧻", "category": "Baby" }, { "id": "strecfolyo", "name": "Streç / folyo", "nameEn": "Cling Film", "emoji": "🍽️", "category": "HomeAndKitchen" }, { "id": "kilitli-poset", "name": "Kilitli poşet", "nameEn": "Zip Bags", "emoji": "🧺", "category": "HomeAndKitchen" }, { "id": "pil", "name": "Pil", "nameEn": "Batteries", "emoji": "🔋", "category": "HomeAndKitchen" }, { "id": "aliminyum-folyo", "name": "Alüminyum folyo", "nameEn": "Aluminum Foil", "emoji": "🍽️", "category": "HomeAndKitchen" }, { "id": "firin-kagidi", "name": "Fırın kağıdı", "nameEn": "Baking Paper", "emoji": "🍽️", "category": "HomeAndKitchen" }, { "id": "kedi-mama-kuru", "name": "Kedi kuru mama", "nameEn": "Cat Dry Food", "emoji": "🐱", "category": "Pets", "kcal": 380, "protein": 30, "fat": 15, "fiber": 2.5 }, { "id": "kedi-mama-yas", "name": "Kedi yaş mama", "nameEn": "Cat Wet Food", "emoji": "🐱", "category": "Pets", "kcal": 90, "protein": 8, "fat": 5, "fiber": 0.5 }, { "id": "kedi-kumu", "name": "Kedi kumu", "nameEn": "Cat Litter", "emoji": "🐱", "category": "Pets" }, { "id": "kopek-mama-kuru", "name": "Köpek kuru mama", "nameEn": "Dog Dry Food", "emoji": "🐶", "category": "Pets", "kcal": 360, "protein": 26, "fat": 14, "fiber": 3 }, { "id": "kopek-mama-yas", "name": "Köpek yaş mama", "nameEn": "Dog Wet Food", "emoji": "🐶", "category": "Pets", "kcal": 95, "protein": 7.5, "fat": 5.5, "fiber": 0.8 }];
    exports.CATALOG_BY_ID = new Map(CATALOG.map((item) => [item.id, item]));
    exports.CATALOG_BY_NAME = new Map(CATALOG.map((item) => [item.name.toLowerCase(), item]));
    function getItemDisplayName(storedName, catalogId, lang) {
        var _a, _b;
        if (catalogId) {
            const entry = exports.CATALOG_BY_ID.get(catalogId);
            if (entry) {
                return lang === 'en' ? ((_a = entry.nameEn) !== null && _a !== void 0 ? _a : entry.name) : entry.name;
            }
        }
        // Try reverse lookup by stored name (handles items added without catalogId)
        const byName = exports.CATALOG_BY_NAME.get(storedName.toLowerCase());
        if (byName) {
            return lang === 'en' ? ((_b = byName.nameEn) !== null && _b !== void 0 ? _b : byName.name) : byName.name;
        }
        return storedName;
    }
    
  },
  "utils/importList": function (exports, __require) {
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.buildShoppingListFromPayload = buildShoppingListFromPayload;
    const catalog_1 = __require("data/catalog");
    const calorieCalc_1 = __require("utils/calorieCalc");
    let _idCounter = 0;
    function makeId() {
        return `imp_${Date.now()}_${++_idCounter}`;
    }
    function buildShoppingListFromPayload(payload) {
        const items = payload.items.map((shareItem) => {
            var _a, _b, _c, _d;
            const catalogEntry = shareItem.productId ? catalog_1.CATALOG_BY_ID.get(shareItem.productId) : undefined;
            if (catalogEntry) {
                // Catalog item — full data
                const { kcal } = (0, calorieCalc_1.getProductNutrition)(catalogEntry, (_a = shareItem.variety) !== null && _a !== void 0 ? _a : undefined);
                return {
                    id: makeId(),
                    name: catalogEntry.name,
                    category: catalogEntry.category,
                    emoji: catalogEntry.emoji,
                    kcal,
                    ...(0, calorieCalc_1.catalogMacros)(catalogEntry, (_b = shareItem.variety) !== null && _b !== void 0 ? _b : undefined),
                    catalogId: catalogEntry.id,
                    variant: shareItem.variety,
                    size: shareItem.quantity,
                    qty: shareItem.qty,
                    checked: shareItem.done,
                    createdAt: Date.now(),
                };
            }
            // Custom item — basic info only
            return {
                id: makeId(),
                name: (_d = (_c = shareItem.name) !== null && _c !== void 0 ? _c : shareItem.productId) !== null && _d !== void 0 ? _d : '?',
                category: 'Other',
                checked: shareItem.done,
                variant: shareItem.variety,
                size: shareItem.quantity,
                qty: shareItem.qty,
                createdAt: Date.now(),
            };
        });
        return {
            id: makeId(),
            name: payload.name,
            icon: payload.icon,
            createdAt: Date.now(),
            items,
            isShared: true,
        };
    }
    
  },
  "components/GroceryItem": function (exports, __require) {
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.rowText = rowText;
    const catalog_1 = __require("data/catalog");
    const variantTranslation_1 = __require("utils/variantTranslation");
    const calorieCalc_1 = __require("utils/calorieCalc");
    const numberFormat_1 = __require("utils/numberFormat");
    const importList_1 = __require("utils/importList");
    const KCAL_UNIT = { "tr": "kcal", "en": "kcal" };
    /**
     * Paylaşım verisindeki bir ürünün liste satırındaki metni.
     * shareItem: { productId?, name?, variety?, quantity?, qty?, done? } — paylaşımdaki alanlar aynen.
     * lang: sayfanın dili ('tr' | 'en').
     * Döner: { title, second } — title ad satırı ("<tür> <ad>"), second ikinci satır ya da null (satır çizilmez).
     */
    function rowText(shareItem, lang) {
        var _a;
        // Alınan listenin ürünü uygulamada bu yoldan kurulur (utils/importList).
        const item = (0, importList_1.buildShoppingListFromPayload)({ v: 1, name: '', icon: '', items: [{ done: false, ...shareItem }] }).items[0];
        const s = { kcalUnit: KCAL_UNIT[lang] };
        // ── GroceryItem.tsx (SwipeableGroceryItem) — olduğu gibi ──
        const displayName = (0, catalog_1.getItemDisplayName)(item.name, item.catalogId, lang);
        const displayVariant = item.variant ? (0, variantTranslation_1.translateVariant)(item.variant, lang) : undefined;
        const displaySize = item.size ? (0, variantTranslation_1.translateSize)(item.size, lang) : undefined;
        const title = displayVariant ? `${displayVariant} ${displayName}` : displayName;
        const subtitle = [displaySize, item.note].filter(Boolean).join(' · ') || null;
        const second = ((subtitle || (item.kcal != null && !(0, calorieCalc_1.shouldHideCalories)(item.category, item.kcal)))) ? ([subtitle, (item.kcal != null && !(0, calorieCalc_1.shouldHideCalories)(item.category, item.kcal)) ? (0, numberFormat_1.formatMeasure)((_a = (0, calorieCalc_1.computeItemKcal)(item)) !== null && _a !== void 0 ? _a : item.kcal, s.kcalUnit, lang, { approx: true }) : null].filter(Boolean).join(' · ')) : null;
        return { title, second };
    }
    
  },
};
var __cache = {};
function __require(id) {
  if (__cache[id]) return __cache[id];
  var exports = {};
  __cache[id] = exports;
  __defs[id](exports, __require);
  return exports;
}
var row = __require("components/GroceryItem");
return {
  rowText: row.rowText,
  appCommit: "13ba8e39241837d34b87fe076f299c2bea91a138",
};
});
