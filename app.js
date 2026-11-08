(() => {
  "use strict";

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const categoryNames = ["All tools", "PDF", "Image", "Video", "Audio", "Document", "Archive", "Developer", "Utilities"];
  const words = {
    en: {
      home: "Home", allTools: "All tools", how: "How it works", about: "About", aboutLabel: "About FILELAB", getStarted: "Get started",
      skipTools: "Skip to tools", mainNav: "Main navigation", languageLabel: "Language", filterTools: "Filter tools by category", heroBrowseLabel: "Drop a file here or browse", navOpen: "Open navigation", navClose: "Close navigation", themeLight: "Switch to light theme", themeDark: "Switch to dark theme",
      localBadge: "PRIVATE BY DESIGN · RUNS LOCALLY", heroLine1: "Drop Any File.", heroLine2: "Get It Done.",
      heroDescription: "Convert, compress, edit and manage your files instantly. Drop one in and get on with your day.",
      localProcessing: "Processed on this computer", noAccount: "No account needed", dropTitle: "Drop a file. We'll take it from here.",
      browserPrivacy: "No upload. Results stay in this tab until you close or refresh it.", browserFooter: "Browser mode · Results are kept in this tab only",
      dropSubtitle: "Smart pick chooses the closest available tool.", browse: "Browse files", upTo: "Up to", perFile: "per file",
      filesGoNowhere: "Files never leave this device", privacyCaption: "No cloud upload. Temporary outputs clear after 1 hour.",
      toolbox: "THE TOOLBOX", toolsTitle: "The right tool,", toolsTitleAccent: "right here.",
      toolsIntro: "One click to choose a tool. Drop your file on any card to start.", searchPlaceholder: "Search a tool or format…",
      noMatches: "No tools found", tryDifferent: "Try another format or search term.", downloadAll: "Download all as ZIP",
      simple: "NO DETOURS", howTitleStart: "Three steps.", howTitleAccent: "Done.", howCopy: "No account, no maze of settings. Your original file stays untouched.",
      stepOne: "Choose your tool", stepOneCopy: "Find the operation in the toolbox, or let Smart pick one.",
      stepTwo: "Drop your file", stepTwoCopy: "We check the file itself before the selected job begins.",
      stepThree: "Download the result", stepThreeCopy: "See the real output size, then download or run another.",
      footerPromise: "A small, honest toolbox for everyday file work.", supported: "Supported formats", privacy: "Privacy", contact: "Contact",
      footerNote: "Local mode · Files auto-delete after 1 hour", recent: "RECENT", history: "Your history", clearHistory: "Clear history",
      dropHere: "Drop here or browse", selectFile: "Select file", chooseFiles: "Choose files", advanced: "Advanced settings",
      output: "Output", validating: "Checking file signature…", submitting: "Uploading and validating…", queued: "Queued for processing…",
      processing: "Processing on this computer…", completed: "Finished", failed: "Could not process file", cancelled: "Cancelled",
      download: "Download", cancel: "Cancel", processAgain: "Process another", smartPicked: "Smart pick chose", noBackend: "Start the local engine to process files.",
      noTools: "Tool catalog unavailable. Start FILELAB with start.sh.", processingAll: "Bundling finished files…", bundleReady: "Download bundle",
      clearConfirm: "Clear your local processing history?", nothingToBundle: "No finished results are available to bundle.",
      editedBundleLimit: "Edited bundles are limited to 80 MB. Download larger results individually.",
      filterAll: "All tools", supportedCount: "tools available", localMode: "Local engine ready · up to",
      original: "Original", result: "Result", duration: "Processing", smaller: "smaller", larger: "larger", sameSize: "size unchanged",
      queuedCount: "finished result(s)", historyEmpty: "Completed file details are saved in this browser only.", maxFiles: "Choose no more than 10 files.",
      compareCount: "Choose exactly two files to compare.", wrongExt: "This file extension is not accepted for this tool.", tooLarge: "This file is over the size limit.",
      cancelFailed: "Could not cancel this job.", downloadExpired: "This temporary result may have expired.", noCompatible: "No matching operation was found; showing file information instead.",
      favorites: "Favorites", recentTools: "Recent tools", favoriteAdd: "Add to favorites", favoriteRemove: "Remove from favorites",
      ready: "Available", toolGuide: "How to use this tool", purpose: "What it does", useWhen: "Useful when", howUse: "How to use",
      inputFormats: "Supported inputs", outputFormat: "Output", example: "Example flow", limitInfo: "Limits",
      helpHowCopy: "Choose files or drop them on this card. Set advanced options first when shown; the original stays unchanged.", fileLimitHelp: "Maximum size per file:",
      dropAnywhere: "Drop files anywhere to find a tool", dropAnywhereAr: "Or paste a file from your clipboard",
      resultLabel: "RESULT WORKSPACE", previewTitle: "Preview and finish", filename: "File name",
      editText: "Edit text output", saveEdits: "Save text edits", openResult: "Preview / edit", deleteResult: "Delete result",
      close: "Close", unsupportedPreview: "This format has no in-page preview yet. You can still rename and download it.",
      textSaved: "Text edits saved to this result.", resultDeleted: "Result deleted.", invalidJsonEdit: "The edited JSON is not valid.",
      deleteFailed: "Could not delete this temporary result.", pasteFiles: "Pasted file added to the workspace.", invalidOption: "This setting is outside its allowed range."
    },
    ar: {
      home: "الرئيسية", allTools: "كل الأدوات", how: "كيف يعمل", about: "حول", aboutLabel: "حول FILELAB", getStarted: "ابدأ الآن",
      skipTools: "انتقل إلى الأدوات", mainNav: "القائمة الرئيسية", languageLabel: "اللغة", filterTools: "تصفية الأدوات حسب الفئة", heroBrowseLabel: "أفلت ملفاً هنا أو استعرض الملفات", navOpen: "افتح القائمة", navClose: "أغلق القائمة", themeLight: "التبديل إلى الوضع الفاتح", themeDark: "التبديل إلى الوضع الداكن",
      localBadge: "خصوصيتك أولاً · معالجة محلية", heroLine1: "أفلت أي ملف.", heroLine2: "أنجزه الآن.",
      heroDescription: "حوّل ملفاتك واضغطها وعدّلها وأدرها فوراً. أفلت الملف وتابع يومك.",
      localProcessing: "تُعالج على هذا الجهاز", noAccount: "لا حاجة لحساب", dropTitle: "أفلت الملف هنا، وسنتولى الباقي.",
      browserPrivacy: "لا رفع إلى الخادم. تبقى النتائج في هذا التبويب حتى إغلاقه أو تحديثه.", browserFooter: "وضع المتصفح · تبقى النتائج في هذا التبويب فقط",
      dropSubtitle: "سيختار الاقتراح الذكي الأداة الأنسب.", browse: "استعراض الملفات", upTo: "حتى", perFile: "لكل ملف",
      filesGoNowhere: "الملفات لا تغادر هذا الجهاز", privacyCaption: "لا رفع إلى السحابة. تُحذف النتائج المؤقتة بعد ساعة.",
      toolbox: "صندوق الأدوات", toolsTitle: "الأداة المناسبة،", toolsTitleAccent: "في مكان واحد.",
      toolsIntro: "اختر أداة بنقرة واحدة، ثم أفلت الملف على البطاقة.", searchPlaceholder: "ابحث عن أداة أو صيغة…",
      noMatches: "لم يتم العثور على أدوات", tryDifferent: "جرّب صيغة أو كلمة بحث أخرى.", downloadAll: "تنزيل الكل كملف ZIP",
      simple: "خطوات بسيطة", howTitleStart: "ثلاث خطوات.", howTitleAccent: "وانتهى.", howCopy: "لا حساب ولا إعدادات معقدة. يبقى ملفك الأصلي كما هو.",
      stepOne: "اختر الأداة", stepOneCopy: "اختر العملية أو دع الاقتراح الذكي يختارها.",
      stepTwo: "أفلت ملفك", stepTwoCopy: "نتحقق من محتوى الملف قبل بدء المعالجة.",
      stepThree: "نزّل النتيجة", stepThreeCopy: "راجع حجم النتيجة الفعلي ثم نزّلها أو عالج ملفاً آخر.",
      footerPromise: "أدوات بسيطة وصادقة لأعمال الملفات اليومية.", supported: "الصيغ المدعومة", privacy: "الخصوصية", contact: "تواصل",
      footerNote: "وضع محلي · تُحذف الملفات تلقائياً بعد ساعة", recent: "الأخيرة", history: "سجلّك", clearHistory: "مسح السجل",
      dropHere: "أفلت هنا أو استعرض", selectFile: "اختر ملفاً", chooseFiles: "اختر ملفات", advanced: "إعدادات متقدمة",
      output: "الناتج", validating: "التحقق من توقيع الملف…", submitting: "الرفع والتحقق…", queued: "في قائمة الانتظار…",
      processing: "جارٍ المعالجة على هذا الجهاز…", completed: "اكتملت المعالجة", failed: "تعذّرت معالجة الملف", cancelled: "أُلغيت العملية",
      download: "تنزيل", cancel: "إلغاء", processAgain: "معالجة ملف آخر", smartPicked: "اختيرت الأداة الذكية", noBackend: "شغّل المحرك المحلي لمعالجة الملفات.",
      noTools: "تعذر تحميل الأدوات. شغّل FILELAB باستخدام start.sh.", processingAll: "تجميع الملفات المكتملة…", bundleReady: "تنزيل المجموعة",
      clearConfirm: "هل تريد مسح سجل المعالجة المحلي؟", nothingToBundle: "لا توجد نتائج مكتملة للتجميع.",
      editedBundleLimit: "حجم مجموعة النتائج المعدلة محدود بـ80 ميغابايت. نزّل النتائج الأكبر منفردة.",
      filterAll: "كل الأدوات", supportedCount: "أداة متاحة", localMode: "المحرك المحلي جاهز · حتى",
      original: "الأصل", result: "الناتج", duration: "المدة", smaller: "أصغر", larger: "أكبر", sameSize: "الحجم دون تغيير",
      queuedCount: "نتيجة مكتملة", historyEmpty: "تُحفظ تفاصيل الملفات المكتملة في هذا المتصفح فقط.", maxFiles: "اختر 10 ملفات كحد أقصى.",
      compareCount: "اختر ملفين بالضبط للمقارنة.", wrongExt: "امتداد هذا الملف غير مدعوم لهذه الأداة.", tooLarge: "حجم الملف يتجاوز الحد المسموح.",
      cancelFailed: "تعذر إلغاء هذه العملية.", downloadExpired: "ربما انتهت صلاحية هذه النتيجة المؤقتة.", noCompatible: "لم يتم العثور على عملية مطابقة؛ ستُعرض معلومات الملف بدلاً منها.",
      favorites: "المفضلة", recentTools: "الأدوات الأخيرة", favoriteAdd: "أضف إلى المفضلة", favoriteRemove: "أزل من المفضلة",
      ready: "متاحة", toolGuide: "طريقة استخدام الأداة", purpose: "وظيفتها", useWhen: "متى تستخدمها", howUse: "طريقة الاستخدام",
      inputFormats: "الملفات المدعومة", outputFormat: "الناتج", example: "مثال للعملية", limitInfo: "القيود",
      helpHowCopy: "اختر الملفات أو أفلتها على البطاقة. اضبط الخيارات المتقدمة إن ظهرت؛ يبقى الأصل دون تغيير.", fileLimitHelp: "الحد الأقصى لكل ملف:",
      dropAnywhere: "أفلت الملفات في أي مكان لاختيار أداة", dropAnywhereAr: "أو الصق ملفاً من الحافظة",
      resultLabel: "مساحة النتيجة", previewTitle: "عاين النتيجة وأكملها", filename: "اسم الملف",
      editText: "تعديل النص الناتج", saveEdits: "حفظ تعديلات النص", openResult: "معاينة / تعديل", deleteResult: "حذف النتيجة",
      close: "إغلاق", unsupportedPreview: "لا تتوفر معاينة داخل الصفحة لهذه الصيغة بعد. يمكنك تغيير الاسم أو تنزيلها.",
      textSaved: "حُفظت تعديلات النص في هذه النتيجة.", resultDeleted: "حُذفت النتيجة.", invalidJsonEdit: "صيغة JSON المعدلة غير صالحة.",
      deleteFailed: "تعذر حذف النتيجة المؤقتة.", pasteFiles: "أُضيف الملف الملصوق إلى مساحة العمل.", invalidOption: "هذه القيمة خارج النطاق المسموح."
    }
  };
  const toolNamesAr = {
    "pdf-compress":"ضغط PDF", "pdf-merge":"دمج ملفات PDF", "pdf-split":"تقسيم PDF", "pdf-extract":"استخراج صفحات PDF",
    "pdf-rotate":"تدوير صفحات PDF", "pdf-page-numbers":"إضافة أرقام الصفحات", "pdf-text":"PDF إلى نص", "pdf-docx":"PDF إلى Word",
    "pdf-strip-metadata":"إزالة بيانات PDF", "images-to-pdf":"صور إلى PDF", "image-jpg-png":"JPG إلى PNG", "image-png-jpg":"PNG إلى JPG",
    "image-png-webp":"PNG إلى WEBP", "image-jpg-webp":"JPG إلى WEBP", "image-webp-png":"WEBP إلى PNG",
    "image-compress":"ضغط صورة", "image-resize":"تغيير حجم الصورة", "image-rotate":"تدوير صورة", "image-flip":"قلب صورة",
    "image-strip-metadata":"إزالة بيانات الصورة", "image-info":"أبعاد الصورة", "docx-text":"Word إلى نص", "docx-pdf":"Word إلى PDF",
    "xlsx-csv":"Excel إلى CSV", "csv-xlsx":"CSV إلى Excel", "text-pdf":"نص إلى PDF", "create-zip":"إنشاء ZIP",
    "extract-zip":"استخراج ZIP", "archive-list":"معاينة محتويات ZIP", "json-format":"تنسيق / تحقق JSON", "json-csv":"JSON إلى CSV",
    "csv-json":"CSV إلى JSON", "yaml-json":"YAML إلى JSON", "json-yaml":"JSON إلى YAML", "xml-format":"تنسيق / تحقق XML",
    "base64-encode":"ترميز Base64", "base64-decode":"فك ترميز Base64", "sha256":"بصمة SHA-256", "md5":"بصمة MD5",
    "compare-text":"مقارنة ملفات نصية", "file-info":"معلومات الملف"
  };
  const toolDescriptionsAr = {
    "pdf-compress":"تحسين تدفقات الصفحات وتخزين العناصر.", "pdf-merge":"ضم المستندات حسب ترتيب اختيارها.", "pdf-split":"حفظ كل صفحة كملف PDF مستقل داخل ZIP.",
    "pdf-extract":"الاحتفاظ بصفحات محددة؛ الصفحة الافتراضية هي الأولى.", "pdf-rotate":"تدوير كل صفحة بربع دورة.", "pdf-page-numbers":"إضافة رقم بسيط أسفل كل صفحة.",
    "pdf-text":"استخراج النص القابل للتحديد. تحتاج الصفحات الممسوحة ضوئياً إلى OCR.", "pdf-docx":"إعادة إنشاء النص المستخرج كمستند بسيط.",
    "pdf-strip-metadata":"إنشاء نسخة من دون بيانات المستند الوصفية.", "images-to-pdf":"وضع كل صورة في صفحة PDF مناسبة.",
    "image-jpg-png":"تحويل الصورة إلى PNG دون فقدان الجودة.", "image-png-jpg":"تسطيح الشفافية على خلفية بيضاء.", "image-png-webp":"تحويل الصورة إلى صيغة WEBP الحديثة.",
    "image-jpg-webp":"تحويل صورة JPEG إلى WEBP.", "image-webp-png":"إنشاء نسخة PNG دون فقدان الجودة.",
    "image-compress":"إعادة ترميز الصورة وقياس فرق الحجم الفعلي.", "image-resize":"تصغير الصورة مع الحفاظ على تناسب الأبعاد.",
    "image-rotate":"تدوير 90 درجة مع إبقاء الأصل دون تغيير.", "image-flip":"عكس الصورة أفقياً.", "image-strip-metadata":"إعادة الترميز دون بيانات EXIF.",
    "image-info":"عرض الأبعاد بالبكسل ونمط الألوان والصيغة.", "docx-text":"استخراج الفقرات ونص الجداول من DOCX.",
    "docx-pdf":"إنشاء PDF نصي؛ قد يُبسّط التنسيق المعقد.", "xlsx-csv":"تصدير ورقة العمل الأولى بصيغة CSV.",
    "csv-xlsx":"استيراد CSV UTF-8 إلى مصنف جديد.", "text-pdf":"تنسيق النص العادي على صفحات قياسية.",
    "create-zip":"جمع الملفات المحددة في أرشيف مضغوط.", "extract-zip":"إعادة تجميع المحتويات بأمان من دون كتابة المسارات الأصلية.",
    "archive-list":"عرض أسماء الملفات وأحجامها دون استخراج.", "json-format":"التحقق من JSON وتنسيقه مع توضيح الأخطاء.",
    "json-csv":"تحويل مصفوفة كائنات JSON إلى جدول CSV.", "csv-json":"تحويل جدول CSV إلى مصفوفة JSON.",
    "yaml-json":"قراءة YAML بأمان وتصديره كـ JSON.", "json-yaml":"تحويل JSON صالح إلى YAML مقروء.",
    "xml-format":"تنسيق XML والتحقق منه؛ تُرفض تعريفات DTD والكيانات.", "base64-encode":"ترميز الملف المحدد إلى نص Base64.",
    "base64-decode":"فك Base64 إلى تنزيل ثنائي.", "sha256":"حساب بصمة تشفيرية للملف.", "md5":"حساب قيمة تحقق MD5؛ لا تستخدم للأمان.",
    "compare-text":"إنشاء فروق موحدة لملفين نصيين UTF-8.", "file-info":"عرض الصيغة والحجم وبصمة SHA-256."
  };
  const configLabelsAr = { "Pages to keep": "الصفحات المطلوب الاحتفاظ بها", "Degrees clockwise": "درجة باتجاه عقارب الساعة", "Quality (1–95)": "الجودة (1–95)", "Maximum width (px)": "أقصى عرض (بكسل)" };
  const iconPaths = {
    compress: '<path d="M8 3H5v3M16 3h3v3M8 21H5v-3M16 21h3v-3M8 8 5 5m11 3 3-3M8 16l-3 3m11-3 3 3"/><path d="M9 12h6"/>',
    merge: '<path d="M8 3H5a2 2 0 0 0-2 2v3m13-5h3a2 2 0 0 1 2 2v3M8 21H5a2 2 0 0 1-2-2v-3m13 5h3a2 2 0 0 0 2-2v-3M12 7v10m-4-4 4 4 4-4"/>',
    split: '<path d="M6 3v5a4 4 0 0 0 4 4h8m0 0-4-4m4 4-4 4M6 21v-5a4 4 0 0 1 4-4"/>',
    pages: '<path d="M7 3h8l4 4v13H7zM15 3v5h4M4 7v14h12M10 12h6m-6 4h6"/>',
    rotate: '<path d="M20 7v5h-5M4 17v-5h5"/><path d="M5.6 9A7 7 0 0 1 18 6l2 6M4 12l2 6a7 7 0 0 0 12.4-3"/>',
    text: '<path d="M5 4h14M12 4v16M8 20h8M8 9h8"/>', file: '<path d="M6 3h8l4 4v14H6zM14 3v5h4M9 13h6m-6 4h6"/>',
    shield: '<path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z"/><path d="m9 12 2 2 4-4"/>',
    image: '<rect x="3" y="4" width="18" height="16" rx="3"/><circle cx="9" cy="10" r="1.5"/><path d="m21 15-5-5L5 20"/>',
    resize: '<path d="M4 9V4h5M20 9V4h-5M4 15v5h5m11-5v5h-5M9 9l-5-5m11 11 5 5"/>',
    flip: '<path d="M12 3v18M5 6H3v12h2m14-12h2v12h-2M8 9l3 3-3 3"/>',
    table: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 10h18M9 4v16m6-16v16"/>',
    archive: '<path d="M4 7h16v13H4zM3 4h18v3H3zM10 11h4m-4 3h4"/>',
    list: '<path d="M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01"/>',
    braces: '<path d="M9 5c-2 0-2 1-2 3v1c0 2-1 3-3 3 2 0 3 1 3 3v1c0 2 0 3 2 3m6-14c2 0 2 1 2 3v1c0 2 1 3 3 3-2 0-3 1-3 3v1c0 2 0 3-2 3"/>',
    code: '<path d="m8 7-5 5 5 5m8-10 5 5-5 5m-2-12-4 14"/>',
    hash: '<path d="M5 9h14M4 15h14M10 3 8 21m8-18-2 18"/>',
    compare: '<path d="M7 4H4v16h3m10-16h3v16h-3M9 9h6m-6 6h6"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5m0-8h.01"/>'
  };

  const state = { tools: [], category: "All tools", search: "", language: localStorage.getItem("filelab-language") || "en", theme: localStorage.getItem("filelab-theme") || "light", activities: new Map(), config: new Map(), favorites: readFavorites(), browserResults: new Map(), resultSources: new Map(), editedResults: new Map(), activeResult: null, previewUrls: [], maxFileBytes: 40 * 1024 * 1024, history: readHistory(), toastTimer: 0 };
  const copy = (key) => words[state.language][key] || words.en[key] || key;
  const esc = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
  const formatSize = (size) => {
    if (!Number.isFinite(size) || size < 0) return "—";
    if (size < 1024) return `${size} B`;
    const unit = size < 1024 * 1024 ? "KB" : "MB";
    return `${(size / (unit === "KB" ? 1024 : 1024 * 1024)).toFixed(1)} ${unit}`;
  };
  const formatName = (tool) => state.language === "ar" ? (toolNamesAr[tool.id] || tool.name) : tool.name;
  const descriptionFor = (tool) => state.language === "ar" ? (toolDescriptionsAr[tool.id] || tool.description) : tool.description;
  function readHistory() {
    try { return JSON.parse(localStorage.getItem("filelab-history") || "[]").slice(0, 40); } catch { return []; }
  }

  function readFavorites() {
    try { return new Set(JSON.parse(localStorage.getItem("filelab-favorites") || "[]")); } catch { return new Set(); }
  }

  function toast(message, isError = false) {
    const node = $("#toast");
    node.textContent = message;
    node.classList.toggle("error", isError);
    node.classList.add("visible");
    clearTimeout(state.toastTimer);
    state.toastTimer = setTimeout(() => node.classList.remove("visible"), 3300);
  }

  function setLanguage(language) {
    state.language = language;
    localStorage.setItem("filelab-language", language);
    document.documentElement.lang = language;
    document.documentElement.dir = language === "ar" ? "rtl" : "ltr";
    for (const node of $$('[data-i18n]')) {
      const staticCopy = window.FILELAB_STATIC_MODE && node.dataset.i18n === "privacyCaption" ? "browserPrivacy" : window.FILELAB_STATIC_MODE && node.dataset.i18n === "footerNote" ? "browserFooter" : node.dataset.i18n;
      node.textContent = copy(staticCopy);
    }
    for (const node of $$('[data-i18n-placeholder]')) node.placeholder = copy(node.dataset.i18nPlaceholder);
    for (const node of $$('[data-i18n-aria]')) node.setAttribute("aria-label", copy(node.dataset.i18nAria));
    const menuOpen = $(".main-nav").classList.contains("open");
    $("#menu-toggle").setAttribute("aria-label", copy(menuOpen ? "navClose" : "navOpen"));
    setTheme(state.theme);
    $("#language").value = language;
    renderFilters();
    renderGrid();
    renderHistory();
    renderBundleBar();
    $("#max-size-label").textContent = formatSize(state.maxFileBytes);
  }

  function setTheme(theme) {
    state.theme = theme;
    localStorage.setItem("filelab-theme", theme);
    document.documentElement.dataset.theme = theme;
    const button = $("#theme-toggle");
    const label = copy(theme === "dark" ? "themeLight" : "themeDark");
    button.setAttribute("aria-label", label);
    button.title = label;
  }

  function renderFilters() {
    const categories = ["All tools", "Favorites", "Recent tools", ...new Set(state.tools.map((tool) => tool.category))];
    $("#category-filters").innerHTML = categories.map((category) => {
      const label = category === "All tools" ? copy("filterAll") : category === "Favorites" ? copy("favorites") : category === "Recent tools" ? copy("recentTools") : category === "Image" && state.language === "ar" ? "الصور" : category === "PDF" && state.language === "ar" ? "PDF" : category === "Document" && state.language === "ar" ? "المستندات" : category === "Archive" && state.language === "ar" ? "الأرشيف" : category === "Developer" && state.language === "ar" ? "للمطورين" : category === "Utilities" && state.language === "ar" ? "الأدوات المساعدة" : category;
      return `<button class="filter-chip${state.category === category ? " selected" : ""}" type="button" data-category="${esc(category)}" aria-pressed="${state.category === category}">${esc(label)}</button>`;
    }).join("");
    $$(".filter-chip").forEach((button) => button.addEventListener("click", () => {
      state.category = button.dataset.category;
      renderFilters();
      renderGrid();
    }));
  }

  function matchingTools() {
    const query = state.search.trim().toLocaleLowerCase();
    const recent = new Set(state.history.map((entry) => entry.tool_id));
    return state.tools.filter((tool) => {
      if (state.category === "Favorites" && !state.favorites.has(tool.id)) return false;
      if (state.category === "Recent tools" && !recent.has(tool.id)) return false;
      if (!["All tools", "Favorites", "Recent tools"].includes(state.category) && tool.category !== state.category) return false;
      if (!query) return true;
      const searchText = [tool.name, formatName(tool), tool.description, descriptionFor(tool), tool.output, tool.category, ...tool.extensions].join(" ").toLocaleLowerCase();
      return searchText.includes(query) || searchText.includes(`.${query.replace(/^\./, "")}`);
    }).sort((a, b) => Number(state.favorites.has(b.id)) - Number(state.favorites.has(a.id)));
  }

  const exampleExtension = (tool) => {
    const extension = tool.extensions.find((item) => item !== "*") || ".txt";
    return extension === ".jpeg" ? ".jpg" : extension;
  };

  const useWhenText = (tool) => state.language === "ar" ? `عندما تحتاج إلى ناتج ${tool.output}.` : `Choose it when you need a ${tool.output} result.`;

  function configMarkup(tool) {
    if (!tool.config?.length) return "";
    const values = state.config.get(tool.id) || {};
    const controls = tool.config.map((field) => {
      const value = values[field.key] ?? field.default ?? "";
      let control;
      if (field.type === "select") {
        control = `<select data-option="${esc(field.key)}">${field.choices.map((choice) => `<option value="${esc(choice)}" ${String(value) === String(choice) ? "selected" : ""}>${esc(choice)}</option>`).join("")}</select>`;
      } else {
        control = `<input data-option="${esc(field.key)}" type="${field.type === "number" ? "number" : "text"}" value="${esc(value)}" ${field.min ? `min="${field.min}"` : ""} ${field.max ? `max="${field.max}"` : ""} placeholder="${esc(field.placeholder || "")}">`;
      }
      return `<label>${esc(state.language === "ar" ? configLabelsAr[field.label] || field.label : field.label)}${control}</label>`;
    }).join("");
    return `<div class="advanced-panel" hidden>${controls}</div>`;
  }

  function cardMarkup(tool) {
    const multi = tool.multi || tool.id === "compare-text";
    const accept = tool.extensions.includes("*") ? "" : `accept="${esc(tool.extensions.join(","))}"`;
    const tags = tool.extensions.includes("*") ? "Any file" : tool.extensions.map((ext) => `<span class="format-tag">${esc(ext.replace(".", "").toUpperCase())}</span>`).join("");
    const desc = descriptionFor(tool);
    const favorite = state.favorites.has(tool.id);
    const exampleInput = `sample${exampleExtension(tool)}`;
    const guide = `<details class="tool-help"><summary>${esc(copy("toolGuide"))}</summary><p><strong>${esc(copy("purpose"))}:</strong> ${esc(desc)}</p><p><strong>${esc(copy("useWhen"))}:</strong> ${esc(useWhenText(tool))}</p><p><strong>${esc(copy("howUse"))}:</strong> ${esc(copy("helpHowCopy"))}</p><p><strong>${esc(copy("inputFormats"))}:</strong> ${esc(tool.extensions.join(", "))}</p><p><strong>${esc(copy("outputFormat"))}:</strong> ${esc(tool.output)}</p><p><strong>${esc(copy("example"))}:</strong> ${esc(exampleInput)} → ${esc(formatName(tool))} → ${esc(tool.output)}</p><p><strong>${esc(copy("limitInfo"))}:</strong> ${esc(copy("fileLimitHelp"))} ${esc(formatSize(state.maxFileBytes))}</p></details>`;
    const advanced = tool.config?.length ? `<button class="advanced-button" type="button" data-action="advanced" aria-label="${esc(copy("advanced"))}" aria-expanded="false" title="${esc(copy("advanced"))}"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-1.7 3- .2-.1a1.8 1.8 0 0 0-1.8.1l-.2.1h-3.5l-.1-.2a1.8 1.8 0 0 0-1.5-1 1.7 1.7 0 0 0-.8.2l-.2.1-3-1.7.1-.2a1.7 1.7 0 0 0-.1-1.8l-.1-.2v-3.5l.2-.1a1.8 1.8 0 0 0 .8-1.5 1.7 1.7 0 0 0-.2-.8l-.1-.2 1.7-3 .2.1a1.8 1.8 0 0 0 1.8-.1l.2-.1h3.5l.1.2a1.8 1.8 0 0 0 1.5 1 1.7 1.7 0 0 0 .8-.2l.2-.1 3 1.7-.1.2a1.7 1.7 0 0 0 .1 1.8l.1.2v3.5z"/></svg></button>` : "";
    const stateText = state.activities.get(tool.id)?.message || "";
    return `<article class="tool-card" data-tool="${esc(tool.id)}" data-category="${esc(tool.category)}">
      <div class="tool-card-head"><span class="tool-icon" aria-hidden="true"><svg viewBox="0 0 24 24">${iconPaths[tool.icon] || iconPaths.file}</svg></span><h3 class="tool-title">${esc(formatName(tool))}</h3><span class="tool-output">${esc(tool.output)}</span></div>
      <div class="tool-card-tools"><span class="tool-availability">${esc(copy("ready"))}</span><button class="favorite-button" data-action="favorite" type="button" aria-pressed="${favorite}" aria-label="${esc(copy(favorite ? "favoriteRemove" : "favoriteAdd"))}" title="${esc(copy(favorite ? "favoriteRemove" : "favoriteAdd"))}">${favorite ? "★" : "☆"}</button></div>
      <p class="tool-description" title="${esc(desc)}">${esc(desc)}</p>
      <div class="tool-formats">${tags}<span class="format-arrow" aria-hidden="true">→</span><span class="format-tag">${esc(tool.output)}</span></div>
      <div class="tool-card-actions"><button class="tool-drop-button" data-action="browse" type="button"><span class="button-plus" aria-hidden="true">＋</span><span>${esc(multi ? copy("chooseFiles") : copy("selectFile"))}</span></button>${advanced}</div>
      ${configMarkup(tool)}
      ${guide}
      <input class="file-input" data-file-input type="file" ${accept} ${multi ? "multiple" : ""} aria-label="${esc(formatName(tool))} file input">
      <div class="tool-state" data-state aria-live="polite">${stateText ? `<span class="state-dot"></span><span>${esc(stateText)}</span>` : ""}</div>
      <div class="result-list" data-results></div>
    </article>`;
  }

  function renderGrid() {
    const tools = matchingTools();
    $("#tool-grid").innerHTML = tools.map(cardMarkup).join("");
    $("#empty-state").hidden = tools.length !== 0;
    $("#catalog-status").textContent = `${tools.length} ${copy("supportedCount")}`;
    $$(".tool-card").forEach((card) => {
      const tool = state.tools.find((item) => item.id === card.dataset.tool);
      const input = $("[data-file-input]", card);
      $("[data-action='browse']", card).addEventListener("click", () => input.click());
      input.addEventListener("change", () => {
        if (input.files?.length) startTool(tool, [...input.files], card);
        input.value = "";
      });
      card.addEventListener("dragover", (event) => { event.preventDefault(); card.classList.add("dragover"); });
      card.addEventListener("dragleave", (event) => { if (!card.contains(event.relatedTarget)) card.classList.remove("dragover"); });
      card.addEventListener("drop", (event) => {
        event.preventDefault();
        card.classList.remove("dragover");
        if (event.dataTransfer?.files.length) startTool(tool, [...event.dataTransfer.files], card);
      });
      const settings = $("[data-action='advanced']", card);
      if (settings) settings.addEventListener("click", () => {
        const panel = $(".advanced-panel", card);
        panel.hidden = !panel.hidden;
        settings.setAttribute("aria-expanded", String(!panel.hidden));
      });
      for (const control of $$('[data-option]', card)) control.addEventListener("change", () => {
        const values = { ...(state.config.get(tool.id) || {}) };
        values[control.dataset.option] = control.value;
        state.config.set(tool.id, values);
      });
      $(`[data-action="favorite"]`, card).addEventListener("click", () => {
        if (state.favorites.has(tool.id)) state.favorites.delete(tool.id);
        else state.favorites.add(tool.id);
        localStorage.setItem("filelab-favorites", JSON.stringify([...state.favorites]));
        renderFilters();
        renderGrid();
      });
      restoreActivity(tool.id, card);
    });
  }

  function setCardState(card, text, mode = "") {
    const node = $("[data-state]", card);
    node.innerHTML = `<span class="state-dot ${mode === "loading" ? "loading" : mode}"></span><span>${esc(text)}</span>`;
  }

  function restoreActivity(toolId, card) {
    const activity = state.activities.get(toolId);
    if (!activity) return;
    if (activity.message) setCardState(card, activity.message, activity.mode || "");
    for (const result of activity.results || []) addResultRow(card, result);
  }

  function addResultRow(card, result) {
    const rows = $("[data-results]", card);
    const row = document.createElement("div");
    row.className = "result-row";
    row.dataset.resultId = result.job_id;
    row.innerHTML = `<div class="result-meta"><input class="result-name-input" data-result-name value="${esc(result.output_name)}" aria-label="${esc(copy("filename"))}"><div class="result-detail">${esc(result.detail)}</div></div><div class="result-actions"><button class="result-action" data-result-open type="button">${esc(copy("openResult"))}</button><button class="result-action" data-result-download type="button">${esc(copy("download"))}</button><button class="result-action danger-button" data-result-delete type="button" aria-label="${esc(copy("deleteResult"))}">×</button></div>`;
    $(`[data-result-name]`, row).addEventListener("change", (event) => updateResultName(result, event.currentTarget.value));
    $(`[data-result-open]`, row).addEventListener("click", () => openResult(result));
    $(`[data-result-download]`, row).addEventListener("click", () => downloadResult(result));
    $(`[data-result-delete]`, row).addEventListener("click", () => deleteResult(result, row));
    rows.prepend(row);
  }

  function normalizedResultName(value, existingName) {
    const extension = existingName.match(/\.[A-Za-z0-9]{1,10}$/)?.[0] || "";
    let stem = String(value || "").trim().replace(/[<>:"/\\|?*\u0000-\u001f]/g, "_").replace(/[. ]+$/g, "");
    if (extension && stem.toLowerCase().endsWith(extension.toLowerCase())) stem = stem.slice(0, -extension.length);
    else stem = stem.replace(/\.[^.]*$/, "");
    stem = stem.replace(/^[. ]+|[. ]+$/g, "").slice(0, Math.max(1, 150 - extension.length)) || "file";
    if (/^(con|prn|aux|nul|com[1-9]|lpt[1-9])$/i.test(stem)) stem = `_${stem}`;
    return `${stem}${extension}`;
  }

  function updateResultName(result, value) {
    result.output_name = normalizedResultName(value, result.output_name);
    const field = $(`[data-result-id="${CSS.escape(result.job_id)}"] [data-result-name]`);
    if (field) field.value = result.output_name;
    if (state.activeResult?.job_id === result.job_id) $("#result-filename").value = result.output_name;
    const browserResult = state.browserResults.get(result.job_id);
    if (browserResult) state.browserResults.set(result.job_id, { ...browserResult, name: result.output_name });
    state.history = state.history.map((entry) => entry.job_id === result.job_id ? { ...entry, output_name: result.output_name } : entry);
    localStorage.setItem("filelab-history", JSON.stringify(state.history));
    renderHistory();
  }

  async function resultBlob(result) {
    if (state.editedResults.has(result.job_id)) return state.editedResults.get(result.job_id);
    const browserResult = state.browserResults.get(result.job_id);
    if (browserResult) return browserResult.blob;
    const response = await fetch(result.download_url);
    if (!response.ok) throw new Error(copy("downloadExpired"));
    return response.blob();
  }

  async function downloadResult(result) {
    try { downloadBlob(result.output_name, await resultBlob(result)); }
    catch (error) { toast(error.message || copy("downloadExpired"), true); }
  }

  function clearPreviewUrls() {
    for (const url of state.previewUrls) URL.revokeObjectURL(url);
    state.previewUrls = [];
  }

  function previewUrl(blob) {
    const url = URL.createObjectURL(blob);
    state.previewUrls.push(url);
    return url;
  }

  async function openResult(result) {
    state.activeResult = result;
    clearPreviewUrls();
    $("#result-filename").value = result.output_name;
    $("#result-dialog-note").textContent = result.detail;
    $("#result-preview-body").replaceChildren();
    $("#result-comparison").replaceChildren();
    $("#result-comparison").hidden = true;
    $("#result-editor-wrap").hidden = true;
    $("#save-result-edit").hidden = true;
    try {
      const blob = await resultBlob(result);
      const type = blob.type || "application/octet-stream";
      const body = $("#result-preview-body");
      const source = state.resultSources.get(result.job_id)?.[0];
      if (type.startsWith("image/")) {
        const outputUrl = previewUrl(blob);
        const image = document.createElement("img");
        image.src = outputUrl;
        image.alt = result.output_name;
        body.append(image);
        if (source?.type.startsWith("image/")) {
          const compare = $("#result-comparison");
          compare.hidden = false;
          compare.innerHTML = `<figure class="comparison-panel"><figcaption>${esc(copy("original"))}</figcaption><img src="${esc(previewUrl(source))}" alt="${esc(source.name)}"></figure><figure class="comparison-panel"><figcaption>${esc(copy("result"))}</figcaption><img src="${esc(outputUrl)}" alt="${esc(result.output_name)}"></figure>`;
        }
      } else if (type === "application/pdf") {
        const frame = document.createElement("iframe");
        frame.src = previewUrl(blob);
        frame.title = result.output_name;
        body.append(frame);
      } else if (type.startsWith("audio/") || type.startsWith("video/")) {
        const player = document.createElement(type.startsWith("audio/") ? "audio" : "video");
        player.controls = true;
        player.src = previewUrl(blob);
        body.append(player);
      } else if (type.startsWith("text/") || ["application/json", "application/xml"].includes(type)) {
        const text = await blob.text();
        const preview = document.createElement("pre");
        preview.className = "preview-text";
        preview.textContent = text;
        body.append(preview);
        $("#result-editor").value = text;
        $("#result-editor-wrap").hidden = false;
        $("#save-result-edit").hidden = false;
      } else if (type === "application/zip" && window.FilelabNetlifyEngine) {
        try {
          const listing = await window.FilelabNetlifyEngine.process("archive-list", [new File([blob], result.output_name, { type })]);
          const preview = document.createElement("pre");
          preview.className = "preview-text";
          preview.textContent = await listing.blob.text();
          body.append(preview);
        } catch { body.textContent = copy("unsupportedPreview"); }
      } else {
        body.textContent = copy("unsupportedPreview");
      }
      $("#result-dialog").showModal();
    } catch (error) { toast(error.message || copy("downloadExpired"), true); }
  }

  async function saveTextEdit() {
    const result = state.activeResult;
    if (!result) return;
    const text = $("#result-editor").value;
    const current = await resultBlob(result);
    if (current.type === "application/json") {
      try { JSON.parse(text); } catch { toast(copy("invalidJsonEdit"), true); return; }
    }
    const blob = new Blob([text], { type: current.type || "text/plain;charset=utf-8" });
    state.editedResults.set(result.job_id, blob);
    if (window.FILELAB_STATIC_MODE) state.browserResults.set(result.job_id, { name: result.output_name, blob });
    result.output_size = blob.size;
    const delta = result.source_size ? Math.round((result.source_size - blob.size) * 1000 / result.source_size) / 10 : 0;
    result.detail = `${copy("original")} ${formatSize(result.source_size || 0)} → ${copy("result")} ${formatSize(blob.size)} · ${result.duration_seconds || 0}s · ${delta > 0 ? `${delta}% ${copy("smaller")}` : delta < 0 ? `${Math.abs(delta)}% ${copy("larger")}` : copy("sameSize")}`;
    const preview = $(".preview-text", $("#result-preview-body"));
    if (preview) preview.textContent = text;
    $("#result-dialog-note").textContent = result.detail;
    const detail = $(`[data-result-id="${CSS.escape(result.job_id)}"] .result-detail`);
    if (detail) detail.textContent = result.detail;
    state.history = state.history.map((entry) => entry.job_id === result.job_id ? { ...entry, detail: result.detail } : entry);
    localStorage.setItem("filelab-history", JSON.stringify(state.history));
    renderHistory();
    toast(copy("textSaved"));
  }

  async function deleteResult(result, row) {
    if (!window.FILELAB_STATIC_MODE) {
      try {
        const response = await fetch("/api/cleanup", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ job_ids: [result.job_id] }) });
        if (!response.ok) throw new Error();
      } catch { toast(copy("deleteFailed"), true); return; }
    }
    for (const activity of state.activities.values()) activity.results = (activity.results || []).filter((item) => item.job_id !== result.job_id);
    if (result.download_url?.startsWith("blob:")) URL.revokeObjectURL(result.download_url);
    state.browserResults.delete(result.job_id);
    state.resultSources.delete(result.job_id);
    state.editedResults.delete(result.job_id);
    state.history = state.history.filter((item) => item.job_id !== result.job_id);
    localStorage.setItem("filelab-history", JSON.stringify(state.history));
    row?.remove();
    renderHistory();
    renderBundleBar();
    if (state.activeResult?.job_id === result.job_id) $("#result-dialog").close();
    toast(copy("resultDeleted"));
  }

  function filesAccepted(tool, files) {
    if (!files.length) throw new Error(copy("selectFile"));
    if (files.length > 10) throw new Error(copy("maxFiles"));
    if (tool.id === "compare-text" && files.length !== 2) throw new Error(copy("compareCount"));
    if (!tool.multi && tool.id !== "compare-text" && files.length > 10) throw new Error(copy("maxFiles"));
    if (window.FILELAB_STATIC_MODE && files.reduce((sum, file) => sum + file.size, 0) > window.FilelabNetlifyEngine.MAX_TOTAL_BYTES) throw new Error("Combined files exceed the browser processing limit.");
    for (const file of files) {
      if (file.size > state.maxFileBytes) throw new Error(`${file.name}: ${copy("tooLarge")} (${formatSize(state.maxFileBytes)}).`);
      const ext = `.${file.name.split(".").pop().toLocaleLowerCase()}`;
      if (!tool.extensions.includes("*") && !tool.extensions.includes(ext)) throw new Error(`${file.name}: ${copy("wrongExt")}`);
    }
  }

  async function checkSignature(tool, file) {
    if (tool.extensions.includes("*") || !file.size) return;
    const buffer = new Uint8Array(await file.slice(0, 12).arrayBuffer());
    const starts = (...bytes) => bytes.every((value, index) => buffer[index] === value);
    const ext = `.${file.name.split(".").pop().toLocaleLowerCase()}`;
    if (ext === ".pdf" && !starts(37, 80, 68, 70, 45)) throw new Error(`${file.name}: content does not match PDF.`);
    if ([".jpg", ".jpeg"].includes(ext) && !starts(255, 216, 255)) throw new Error(`${file.name}: content does not match JPEG.`);
    if (ext === ".png" && !starts(137, 80, 78, 71, 13, 10, 26, 10)) throw new Error(`${file.name}: content does not match PNG.`);
    if (ext === ".webp" && !(starts(82, 73, 70, 70) && buffer[8] === 87 && buffer[9] === 69 && buffer[10] === 66 && buffer[11] === 80)) throw new Error(`${file.name}: content does not match WEBP.`);
    if ([".docx", ".xlsx", ".zip"].includes(ext) && !(starts(80, 75, 3, 4) || starts(80, 75, 5, 6))) throw new Error(`${file.name}: content does not match a ZIP-based file.`);
  }

  function optionsFor(tool, card) {
    const data = {};
    for (const field of tool.config || []) {
      const input = $(`[data-option="${CSS.escape(field.key)}"]`, card);
      data[field.key] = input ? input.value : field.default;
    }
    return data;
  }

  function validateOptions(card) {
    const input = $("[data-option]:invalid", card);
    if (!input) return;
    const panel = input.closest(".advanced-panel");
    if (panel?.hidden) {
      panel.hidden = false;
      $("[data-action='advanced']", card)?.setAttribute("aria-expanded", "true");
    }
    input.focus();
    const label = input.closest("label")?.firstChild?.textContent.trim();
    throw new Error(`${label ? `${label}: ` : ""}${copy("invalidOption")}`);
  }

  async function startTool(tool, files, card) {
    try { filesAccepted(tool, files); validateOptions(card); }
    catch (error) { setCardState(card, error.message, "error"); toast(error.message, true); return; }
    const current = state.activities.get(tool.id) || { results: [], running: new Set() };
    current.results = current.results || [];
    current.running = current.running || new Set();
    state.activities.set(tool.id, current);
    current.message = copy("validating");
    current.mode = "loading";
    card.classList.add("is-busy");
    setCardState(card, current.message, "loading");
    try {
      for (const file of files) await checkSignature(tool, file);
      const groups = tool.multi || tool.id === "compare-text" ? [files] : files.map((file) => [file]);
      const outcomes = await Promise.allSettled(groups.map((group) => window.FILELAB_STATIC_MODE
        ? processBrowserGroup(tool, group, card, optionsFor(tool, card), current)
        : submitGroup(tool, group, card, optionsFor(tool, card), current)));
      const failures = outcomes.filter((outcome) => outcome.status === "rejected");
      if (failures.length) throw new Error(`${failures.length} file(s) failed. ${failures[0].reason?.message || copy("failed")}`);
    } catch (error) {
      current.message = error.message || copy("failed");
      current.mode = "error";
      setCardState(card, current.message, "error");
      toast(current.message, true);
    } finally {
      card.classList.remove("is-busy");
      renderBundleBar();
    }
  }

  async function processBrowserGroup(tool, files, card, options, activity) {
    activity.message = state.language === "ar" ? "جارٍ المعالجة في هذا المتصفح…" : "Processing in this browser…";
    activity.mode = "loading";
    setCardState(card, activity.message, "loading");
    const output = await window.FilelabNetlifyEngine.process(tool.id, files, options);
    const originalSize = files.reduce((sum, file) => sum + file.size, 0);
    const reduction = originalSize ? Math.round((originalSize - output.blob.size) * 1000 / originalSize) / 10 : 0;
    const sizeDetail = reduction > 0 ? `${reduction}% ${copy("smaller")}` : reduction < 0 ? `${Math.abs(reduction)}% ${copy("larger")}` : copy("sameSize");
    const duration = output.duration_seconds;
    const detail = `${copy("original")} ${formatSize(originalSize)} → ${copy("result")} ${formatSize(output.blob.size)} · ${duration}s · ${sizeDetail}`;
    const resultId = crypto.randomUUID();
    const downloadUrl = URL.createObjectURL(output.blob);
    const item = { job_id: resultId, output_name: output.name, download_url: downloadUrl, detail, source_size: originalSize, output_size: output.blob.size, duration_seconds: duration };
    state.browserResults.set(resultId, { name: output.name, blob: output.blob });
    state.resultSources.set(resultId, files);
    activity.results.unshift(item);
    activity.message = `${copy("completed")}: ${files.map((file) => file.name).join(", ")}`;
    activity.mode = "success";
    addResultRow(card, item);
    setCardState(card, activity.message, "success");
    state.history.unshift({ job_id: resultId, tool_id: tool.id, output_name: output.name, source: files.map((file) => file.name).join(", "), time: Date.now(), detail });
    state.history = state.history.slice(0, 40);
    localStorage.setItem("filelab-history", JSON.stringify(state.history));
    renderHistory();
  }

  async function submitGroup(tool, files, card, options, activity) {
    const form = new FormData();
    form.append("tool_id", tool.id);
    form.append("options", JSON.stringify(options));
    for (const file of files) form.append("files", file, file.name);
    activity.message = copy("submitting");
    activity.mode = "loading";
    setCardState(card, activity.message, "loading");
    const response = await fetch("/api/jobs", { method: "POST", body: form });
    if (!response.ok) {
      const detail = await response.json().catch(() => ({}));
      throw new Error(detail.detail || copy("failed"));
    }
    const { job_id: jobId } = await response.json();
    activity.running.add(jobId);
    const cancelButton = document.createElement("button");
    cancelButton.type = "button";
    cancelButton.className = "cancel-job";
    cancelButton.textContent = copy("cancel");
    cancelButton.addEventListener("click", () => cancelJob(jobId, card, activity));
    $("[data-state]", card).append(cancelButton);
    await pollJob(jobId, tool, files, card, activity);
    activity.running.delete(jobId);
    cancelButton.remove();
  }

  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  async function pollJob(jobId, tool, files, card, activity) {
    for (let attempt = 0; attempt < 3600; attempt++) {
      const response = await fetch(`/api/jobs/${encodeURIComponent(jobId)}`, { cache: "no-store" });
      if (!response.ok) throw new Error(copy("failed"));
      const job = await response.json();
      if (job.status === "queued") {
        activity.message = copy("queued");
        activity.mode = "loading";
        setCardState(card, activity.message, "loading");
      } else if (job.status === "processing") {
        activity.message = copy("processing");
        activity.mode = "loading";
        setCardState(card, activity.message, "loading");
      } else if (job.status === "completed") {
        const original = formatSize(job.original_size);
        const result = formatSize(job.output_size);
        const delta = job.reduction_percent;
        const sizeDetail = delta > 0 ? `${delta}% ${copy("smaller")}` : delta < 0 ? `${Math.abs(delta)}% ${copy("larger")}` : copy("sameSize");
        const detail = `${copy("original")} ${original} → ${copy("result")} ${result} · ${job.duration_seconds}s · ${sizeDetail}`;
        const item = { job_id: jobId, output_name: job.output_name, download_url: job.download_url, detail, source_size: job.original_size, output_size: job.output_size, duration_seconds: job.duration_seconds };
        activity.results.unshift(item);
        state.resultSources.set(jobId, files);
        activity.message = `${copy("completed")}: ${files.map((file) => file.name).join(", ")}`;
        activity.mode = "success";
        addResultRow(card, item);
        setCardState(card, activity.message, "success");
        state.history.unshift({ job_id: jobId, tool_id: tool.id, output_name: job.output_name, source: files.map((file) => file.name).join(", "), time: Date.now(), detail });
        state.history = state.history.slice(0, 40);
        localStorage.setItem("filelab-history", JSON.stringify(state.history));
        renderHistory();
        return;
      } else if (job.status === "failed") {
        throw new Error(job.error || copy("failed"));
      } else if (job.status === "cancelled") {
        activity.message = copy("cancelled");
        activity.mode = "";
        setCardState(card, activity.message);
        return;
      }
      await wait(650);
    }
    throw new Error("Processing took too long. The temporary job was not retained.");
  }

  async function cancelJob(jobId, card, activity) {
    try {
      const response = await fetch(`/api/jobs/${encodeURIComponent(jobId)}/cancel`, { method: "POST" });
      if (!response.ok) throw new Error();
      activity.message = copy("cancelled");
      setCardState(card, activity.message);
    } catch { toast(copy("cancelFailed"), true); }
  }

  function renderHistory() {
    const panel = $("#history-panel");
    panel.hidden = state.history.length === 0;
    $("#history-list").innerHTML = state.history.slice(0, 8).map((entry) => {
      const canDownload = entry.job_id && (!window.FILELAB_STATIC_MODE || state.browserResults.has(entry.job_id));
      return `<div class="history-row"><div class="history-main"><span class="history-check">✓</span><span class="history-name" title="${esc(entry.source)}">${esc(entry.source)}</span><span class="history-arrow">→</span><span class="history-name history-output" title="${esc(entry.output_name)}">${esc(entry.output_name)}</span></div><span class="history-time">${new Date(entry.time).toLocaleString(state.language === "ar" ? "ar" : "en", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span>${canDownload ? `<button class="history-download" type="button" data-job="${esc(entry.job_id)}" aria-label="${esc(copy("download"))} ${esc(entry.output_name)}">↓</button>` : ""}</div>`;
    }).join("");
    $$(".history-download").forEach((button) => button.addEventListener("click", async () => {
      const entry = state.history.find((item) => item.job_id === button.dataset.job);
      const result = [...state.activities.values()].flatMap((activity) => activity.results || []).find((item) => item.job_id === button.dataset.job);
      if (entry && result) { await downloadResult(result); return; }
      if (window.FILELAB_STATIC_MODE) {
        const result = state.browserResults.get(button.dataset.job);
        const edited = state.editedResults.get(button.dataset.job);
        if (result || edited) downloadBlob(entry?.output_name || result.name, edited || result.blob);
        return;
      }
      const response = await fetch(`/api/jobs/${encodeURIComponent(button.dataset.job)}`);
      if (!response.ok) { toast(copy("downloadExpired"), true); return; }
      const job = await response.json();
      if (job.download_url) {
        try {
          const file = await fetch(job.download_url);
          if (!file.ok) throw new Error();
          downloadBlob(entry?.output_name || job.output_name, await file.blob());
        } catch { toast(copy("downloadExpired"), true); }
      }
    }));
  }

  function renderBundleBar() {
    const ids = window.FILELAB_STATIC_MODE
      ? [...state.browserResults.keys()]
      : state.history.map((item) => item.job_id).filter(Boolean);
    $("#bundle-count").textContent = `${ids.length} ${copy("queuedCount")}`;
    $("#bundle-bar").hidden = ids.length === 0;
  }

  async function downloadBundle() {
    if (window.FILELAB_STATIC_MODE) {
      const results = [...state.browserResults.values()];
      if (!results.length) { toast(copy("nothingToBundle")); return; }
      try {
        const blob = await window.FilelabNetlifyEngine.bundle(results);
        downloadBlob("filelab-results.zip", blob);
      } catch (error) { toast(error.message || copy("downloadExpired"), true); }
      return;
    }
    const ids = state.history.map((item) => item.job_id).filter(Boolean);
    if (!ids.length) { toast(copy("nothingToBundle")); return; }
    const button = $("#bundle-download");
    button.disabled = true;
    button.querySelector("span:last-child").textContent = copy("processingAll");
    try {
      let blob;
      if (state.editedResults.size) {
        const items = [...state.activities.values()].flatMap((activity) => activity.results || []);
        const results = [];
        let totalSize = 0;
        for (const entry of state.history.filter((item) => ids.includes(item.job_id))) {
          let data = state.editedResults.get(entry.job_id);
          const item = items.find((result) => result.job_id === entry.job_id);
          if (!data && item) data = await resultBlob(item);
          if (!data) {
            const job = await fetch(`/api/jobs/${encodeURIComponent(entry.job_id)}`).then((response) => response.json());
            const response = await fetch(job.download_url);
            if (!response.ok) throw new Error(copy("downloadExpired"));
            data = await response.blob();
          }
          totalSize += data.size;
          if (totalSize > 80 * 1024 * 1024) throw new Error(copy("editedBundleLimit"));
          results.push({ name: entry.output_name, blob: data });
        }
        blob = await window.FilelabNetlifyEngine.bundle(results);
      } else {
        const outputNames = Object.fromEntries(state.history.filter((item) => ids.includes(item.job_id)).map((item) => [item.job_id, item.output_name]));
        const response = await fetch("/api/bundle", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ job_ids: ids, output_names: outputNames }) });
        if (!response.ok) {
          const detail = await response.json().catch(() => ({}));
          throw new Error(detail.detail || copy("downloadExpired"));
        }
        blob = await response.blob();
      }
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "filelab-results.zip";
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) { toast(error.message, true); }
    finally { button.disabled = false; button.querySelector("span:last-child").textContent = copy("downloadAll"); }
  }

  function downloadBlob(filename, blob) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function smartTool(files) {
    const ext = `.${files[0].name.split(".").pop().toLocaleLowerCase()}`;
    const allImages = files.every((file) => [".jpg", ".jpeg", ".png", ".webp", ".bmp", ".tif", ".tiff"].includes(`.${file.name.split(".").pop().toLocaleLowerCase()}`));
    const preferred = files.length > 1 && allImages ? "images-to-pdf" : files.length > 1 && files.every((file) => file.name.toLocaleLowerCase().endsWith(".pdf")) ? "pdf-merge" : ({ ".pdf": "pdf-text", ".jpg": "image-compress", ".jpeg": "image-compress", ".png": "image-compress", ".webp": "image-compress", ".docx": "docx-text", ".xlsx": "xlsx-csv", ".csv": "csv-json", ".json": "json-format", ".xml": "xml-format", ".yaml": "yaml-json", ".yml": "yaml-json", ".zip": "archive-list", ".txt": "file-info" })[ext] || "file-info";
    const tool = state.tools.find((item) => item.id === preferred) || state.tools.find((item) => item.id === "file-info");
    return tool;
  }

  function dropGlobal(files) {
    const tool = smartTool(files);
    if (!tool) { toast(copy("noTools"), true); return; }
    const card = $(`[data-tool="${CSS.escape(tool.id)}"]`);
    if (!card) { state.category = "All tools"; state.search = ""; $("#tool-search").value = ""; renderFilters(); renderGrid(); return dropGlobal(files); }
    toast(`${copy("smartPicked")}: ${formatName(tool)}`);
    startTool(tool, files, card);
  }

  function bindShell() {
    $("#language").addEventListener("change", (event) => setLanguage(event.target.value));
    $("#theme-toggle").addEventListener("click", () => setTheme(state.theme === "dark" ? "light" : "dark"));
    $("#tool-search").addEventListener("input", (event) => { state.search = event.target.value; renderGrid(); });
    $("#browse-button").addEventListener("click", (event) => { event.stopPropagation(); $("#global-file").click(); });
    $("#global-file").addEventListener("change", (event) => {
      if (event.target.files?.length) dropGlobal([...event.target.files]);
      event.target.value = "";
    });
    const heroDrop = $("#hero-drop");
    heroDrop.addEventListener("click", (event) => { if (!event.target.closest("button")) $("#global-file").click(); });
    heroDrop.addEventListener("keydown", (event) => { if (["Enter", " "].includes(event.key)) { event.preventDefault(); $("#global-file").click(); } });
    heroDrop.addEventListener("dragover", (event) => { event.preventDefault(); heroDrop.classList.add("dragover"); });
    heroDrop.addEventListener("dragleave", () => heroDrop.classList.remove("dragover"));
    heroDrop.addEventListener("drop", (event) => { event.preventDefault(); heroDrop.classList.remove("dragover"); if (event.dataTransfer?.files.length) dropGlobal([...event.dataTransfer.files]); });
    const hasFiles = (event) => Array.from(event.dataTransfer?.types || []).includes("Files");
    const specificDropZone = (target) => target instanceof Element && target.closest(".tool-card, #hero-drop");
    document.addEventListener("dragenter", (event) => {
      if (!hasFiles(event)) return;
      event.preventDefault();
      document.body.classList.toggle("dragging-files", !specificDropZone(event.target));
    });
    document.addEventListener("dragover", (event) => {
      if (!hasFiles(event)) return;
      event.preventDefault();
      document.body.classList.toggle("dragging-files", !specificDropZone(event.target));
    });
    document.addEventListener("dragleave", (event) => {
      if (event.target === document.documentElement && !event.relatedTarget) document.body.classList.remove("dragging-files");
    });
    document.addEventListener("drop", (event) => {
      document.body.classList.remove("dragging-files");
      if (!hasFiles(event)) return;
      event.preventDefault();
      if (!specificDropZone(event.target) && event.dataTransfer?.files.length) dropGlobal([...event.dataTransfer.files]);
    });
    document.addEventListener("paste", (event) => {
      const files = [...(event.clipboardData?.items || [])].filter((item) => item.kind === "file").map((item) => item.getAsFile()).filter(Boolean);
      if (!files.length) return;
      event.preventDefault();
      toast(copy("pasteFiles"));
      dropGlobal(files);
    });
    $("#menu-toggle").addEventListener("click", (event) => {
      const open = $(".main-nav").classList.toggle("open");
      event.currentTarget.setAttribute("aria-expanded", String(open));
      event.currentTarget.setAttribute("aria-label", copy(open ? "navClose" : "navOpen"));
    });
    $$(".main-nav a").forEach((link) => link.addEventListener("click", () => { $(".main-nav").classList.remove("open"); $("#menu-toggle").setAttribute("aria-expanded", "false"); $("#menu-toggle").setAttribute("aria-label", copy("navOpen")); }));
    $("#close-result-dialog").addEventListener("click", () => $("#result-dialog").close());
    $("#result-dialog").addEventListener("close", () => { clearPreviewUrls(); state.activeResult = null; });
    $("#result-filename").addEventListener("change", (event) => { if (state.activeResult) updateResultName(state.activeResult, event.currentTarget.value); });
    $("#download-result").addEventListener("click", async () => {
      if (!state.activeResult) return;
      updateResultName(state.activeResult, $("#result-filename").value);
      await downloadResult(state.activeResult);
    });
    $("#save-result-edit").addEventListener("click", saveTextEdit);
    $("#delete-result").addEventListener("click", () => {
      const result = state.activeResult;
      if (!result) return;
      const row = $(`[data-result-id="${CSS.escape(result.job_id)}"]`);
      deleteResult(result, row);
    });
    $("#clear-history").addEventListener("click", async () => {
      if (!window.confirm(copy("clearConfirm"))) return;
      const ids = state.history.map((entry) => entry.job_id).filter(Boolean);
      if (!window.FILELAB_STATIC_MODE) {
        try {
          const response = await fetch("/api/cleanup", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ job_ids: ids }) });
          if (!response.ok) throw new Error();
        } catch { toast(copy("downloadExpired"), true); }
      }
      for (const activity of state.activities.values()) for (const result of activity.results || []) URL.revokeObjectURL(result.download_url);
      clearPreviewUrls();
      state.browserResults.clear();
      state.resultSources.clear();
      state.editedResults.clear();
      state.activities.clear();
      state.history = [];
      localStorage.removeItem("filelab-history");
      renderGrid();
      renderHistory();
      renderBundleBar();
    });
    $("#bundle-download").addEventListener("click", downloadBundle);
    document.addEventListener("keydown", (event) => {
      if (event.key === "/" && !["INPUT", "TEXTAREA"].includes(document.activeElement.tagName)) { event.preventDefault(); $("#tool-search").focus(); }
    });
  }

  async function initialize() {
    setTheme(state.theme);
    bindShell();
    setLanguage(state.language);
    renderHistory();
    renderBundleBar();
    try {
      const [healthResponse, toolsResponse] = await Promise.all([fetch("/api/health"), fetch("/api/tools")]);
      if (!healthResponse.ok || !toolsResponse.ok) throw new Error();
      const health = await healthResponse.json();
      const catalog = await toolsResponse.json();
      window.FILELAB_STATIC_MODE = false;
      state.tools = catalog.tools;
      state.maxFileBytes = catalog.max_file_bytes;
      $("#max-size-label").textContent = formatSize(state.maxFileBytes);
      $("#engine-label").textContent = `${copy("localMode")} ${formatSize(state.maxFileBytes)}`;
      renderFilters();
      renderGrid();
      setLanguage(state.language);
      if (health.status !== "ok") throw new Error();
    } catch {
      try {
        const response = await fetch("/registry.json");
        if (!response.ok || !window.FilelabNetlifyEngine) throw new Error();
        const catalog = await response.json();
        const tools = Array.isArray(catalog) ? catalog : catalog.tools;
        if (!Array.isArray(tools)) throw new Error();
        window.FILELAB_STATIC_MODE = true;
        state.tools = tools.filter((tool) => window.FilelabNetlifyEngine.supportedIds.includes(tool.id));
        state.maxFileBytes = window.FilelabNetlifyEngine.MAX_FILE_BYTES;
        $("#max-size-label").textContent = formatSize(state.maxFileBytes);
        $("#engine-label").textContent = state.language === "ar" ? "معالجة محلية في المتصفح · الملفات لا تُرفع" : "In-browser processing · files are not uploaded";
        $("[data-i18n='privacyCaption']").textContent = copy("browserPrivacy");
        renderFilters();
        renderGrid();
        setLanguage(state.language);
      } catch {
        $("#engine-label").textContent = copy("noBackend");
        $("#catalog-status").textContent = copy("noTools");
        $("#tool-grid").innerHTML = "";
        toast(copy("noBackend"), true);
      }
    }
  }

  initialize();
})();
