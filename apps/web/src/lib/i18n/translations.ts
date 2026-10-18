export type Language = "id" | "en";

export interface Translations {
  nav: {
    beranda: string;
    stok: string;
    pesanan: string;
    profil: string;
  };
  common: {
    activeStock: string;
    loading: string;
    cancel: string;
    save: string;
    close: string;
    back: string;
    search: string;
    all: string;
    days: string;
    supplier: string;
    cost: string;
    unit: string;
    total: string;
    ordered: string;
    status: string;
  };
  briefing: {
    greeting: string;
    defaultHeadline: string;
    situationTitle: string;
    askHangaBtn: string;
    fastMovers: string;
    slowMovers: string;
    viewOrders: string;
  };
  scenarios: Record<
    string,
    {
      label: string;
      hint: string;
    }
  >;
  inventorySummary: {
    title: string;
    itemsCount: string;
    valueInShelf: string;
    seeAll: string;
    alertTitle: string;
    alertDesc: string;
    orderCta: string;
    mauHabis: string;
    risikoBasi: string;
    masihAman: string;
  };
  cashBudget: {
    title: string;
    cashLimit: string;
    draftOrders: string;
    remainingCash: string;
    editBudget: string;
    inputLabel: string;
    saveBtn: string;
    cancelBtn: string;
    noteSafe: string;
  };
  cards: {
    actionLabels: Record<string, string>;
    confidenceLabels: Record<string, string>;
    factorLabels: Record<string, string>;
    suggestedQty: string;
    range: string;
    estCost: string;
    orderWa: string;
    orderedLogged: string;
    askWhy: string;
    actionHints: Record<string, string>;
  };
  stok: {
    headerTitle: string;
    headerSubtitle: string;
    pageTitle: string;
    pageSubtitle: string;
    backBriefing: string;
    tabPerluBelanja: string;
    tabSemuaStok: string;
    priorityBannerTitle: string;
    priorityBannerDesc: string;
    searchPlaceholder: string;
    categories: Record<string, string>;
    statuses: Record<string, string>;
    sortLabel: string;
    sortUrgency: string;
    sortDays: string;
    sortCost: string;
    sortName: string;
    inShelf: string;
    coverage: string;
    shelfValue: string;
    supplier: string;
    wholesalePack: string;
    perishable: string;
    quickOrderWa: string;
    orderLogged: string;
    givePromo: string;
    contactBtn: string;
    viewAllLink: string;
    emptyTitle: string;
    emptyDesc: string;
    showAllBtn: string;
    displayCount: string;
    footerNote: string;
  };
  pesanan: {
    title: string;
    subtitle: string;
    tabAll: string;
    tabDraft: string;
    tabSent: string;
    summaryCount: string;
    supplier: string;
    totalModal: string;
    openWa: string;
    emptyTitle: string;
    emptyDesc: string;
    createRestockBtn: string;
    statusLabels: Record<string, string>;
  };
  profil: {
    title: string;
    demoBadge: string;
    demoSessionNote: string;
    realOwnerNote: string;
    supplierSectionTitle: string;
    activeBadge: string;
    contactBtn: string;
    langSectionTitle: string;
    langSectionDesc: string;
    idLabel: string;
    enLabel: string;
    competitionBadge: string;
    competitionDesc: string;
    coldStartBtn: string;
    signOutBtn: string;
  };
  askHanga: {
    title: string;
    subtitle: string;
    placeholder: string;
    sendBtn: string;
    voiceBtn: string;
    speaking: string;
    listening: string;
    thinking: string;
    popularQuestions: string;
    sample1: string;
    sample2: string;
    sample3: string;
    errorNote: string;
  };
  capture: {
    title: string;
    subtitle: string;
    tipsTitle: string;
    tips: string[];
    processingTitle: string;
    confirmTitle: string;
    confirmSubtitle: string;
    colName: string;
    colQty: string;
    colUnit: string;
    yellowWarning: string;
    confirmBtn: string;
    savingBtn: string;
    cardTitle: string;
    cardSubtitle: string;
    uploading: string;
    takePhotoBtn: string;
  };
  auth: {
    morningGreeting: string;
    afternoonGreeting: string;
    eveningGreeting: string;
    nightGreeting: string;
    loginSubtitle: string;
    tabLogin: string;
    tabRegister: string;
    nameLabel: string;
    namePlaceholder: string;
    nameHint: string;
    emailLabel: string;
    emailPlaceholder: string;
    emailHint: string;
    passwordLabel: string;
    passwordPlaceholder: string;
    showPassword: string;
    hidePassword: string;
    passwordTooShort: string;
    passwordSafe: string;
    loginBtn: string;
    registerBtn: string;
    checking: string;
    preparing: string;
    orDivider: string;
    googleBtn: string;
    demoBtn: string;
    demoSub: string;
    footnote: string;
    shutterText: string;
  };
}

export const TRANSLATIONS: Record<Language, Translations> = {
  id: {
    nav: {
      beranda: "Beranda",
      stok: "Stok",
      pesanan: "Pesanan",
      profil: "Profil",
    },
    common: {
      activeStock: "Stok Aktif",
      loading: "Memuat data...",
      cancel: "Batal",
      save: "Simpan",
      close: "Tutup",
      back: "Kembali",
      search: "Cari",
      all: "Semua",
      days: "hari",
      supplier: "Pemasok",
      cost: "Modal",
      unit: "satuan",
      total: "Total",
      ordered: "Dipesan",
      status: "Status",
    },
    briefing: {
      greeting: "Selamat pagi, Bu Sari 👋",
      defaultHeadline: "Briefing Hari Ini",
      situationTitle: "Situasi Warung Hari Ini:",
      askHangaBtn: "🎤 Tanya Hanga — tanya apa saja soal briefing ini",
      fastMovers: "📈 Barang Laris",
      slowMovers: "📉 Barang Lambat",
      viewOrders: "Lihat Pesanan",
    },
    scenarios: {
      BASELINE: {
        label: "Normal",
        hint: "Hari biasa: Keseimbangan stok normal, amankan bahan pokok yang menipis.",
      },
      LEBARAN_T14: {
        label: "Lebaran +14 hr",
        hint: "Simulasi H-14 Lebaran: Lonjakan pembelian sirup, biskuit kaleng, dan bahan kue parcel.",
      },
      PAYDAY_T3: {
        label: "Gajian",
        hint: "Simulasi Musim Gajian: Daya beli warga meningkat, prioritas tambah beras, minyak, dan susu.",
      },
      RAIN_TOMORROW: {
        label: "Hujan Besok",
        hint: "Simulasi Hujan Besok: Pengunjung berkurang, kurangi stok basah & perbanyak mie/kopi seduh.",
      },
    },
    inventorySummary: {
      title: "Stok & Dagangan Warung",
      itemsCount: "18 macam barang",
      valueInShelf: "Uang di rak: Rp 2.354.500",
      seeAll: "Semua Stok →",
      alertTitle: "Ada 3 barang yang mau habis!",
      alertDesc: "Telur, Gula, Indomie sisa di bawah 2 hari penjualan.",
      orderCta: "Lihat & Pesan (3) →",
      mauHabis: "3 Mau Habis",
      risikoBasi: "2 Risiko Basi",
      masihAman: "12 Masih Aman",
    },
    cashBudget: {
      title: "Uang Kas Belanja Hari Ini",
      cashLimit: "Plafon Kas",
      draftOrders: "Draf Pesanan",
      remainingCash: "Sisa Kas",
      editBudget: "Ubah Plafon Kas",
      inputLabel: "Masukkan jumlah kas belanja (Rp):",
      saveBtn: "Simpan Plafon Kas",
      cancelBtn: "Batal",
      noteSafe: "Semua pesanan prioritas muat di kas hari ini. Sisa kas aman untuk belanja besok.",
    },
    cards: {
      actionLabels: {
        REORDER: "Pesan Ulang",
        PROMO: "Promo",
        HOLD: "Tahan",
        SKIP: "Lewati",
      },
      confidenceLabels: {
        HIGH: "Yakin",
        MEDIUM: "Cukup yakin",
        LOW: "Perlu cek",
      },
      factorLabels: {
        PAYDAY: "Gajian",
        WEEKEND: "Akhir pekan",
        RAIN: "Hujan",
        RAIN_TOMORROW: "Hujan besok",
        LEBARAN_T14: "Lebaran +14hr",
        LEBARAN_WEEK: "Minggu Lebaran",
        EVENT_KONDANGAN: "Kondangan",
        EVENT_PASAR: "Hari pasar",
        SCHOOL_TERM: "Musim sekolah",
        TREND_UP: "Tren naik",
        TREND_DOWN: "Tren turun",
        WASTE_RISK: "Risiko buang",
        LOW_DATA: "Data sedikit",
        CASH_TIGHT: "Kas terbatas",
      },
      suggestedQty: "Saran Pesan:",
      range: "Rentang:",
      estCost: "Estimasi Biaya:",
      orderWa: "Pesan via WhatsApp",
      orderedLogged: "✓ Tercatat di Pesanan",
      askWhy: "Tanya Kenapa",
      actionHints: {
        REORDER: "Stok menipis atau perputaran cepat — disarankan pesan ke grosir hari ini",
        PROMO: "Beri potongan diskon atau paket hemat sebelum kualitas menurun / kadaluarsa",
        HOLD: "Stok di rak masih cukup banyak — tahan belanja untuk menghemat modal kas",
        SKIP: "Penjualan melambat — lewati pemesanan untuk menghindari penumpukan modal",
      },
    },
    stok: {
      headerTitle: "Stok & Dagangan",
      headerSubtitle: "Warung Bu Sari · Terpantau Otomatis",
      pageTitle: "Stok & Dagangan Warung",
      pageSubtitle: "Pantau barang yang mau habis dan pesan langsung ke toko grosir lewat WhatsApp.",
      backBriefing: "← Briefing",
      tabPerluBelanja: "🚨 Perlu Belanja",
      tabSemuaStok: "📦 Semua Stok",
      priorityBannerTitle: "Daftar Belanja Prioritas Pagi Ini",
      priorityBannerDesc: "Ada {count} barang yang stoknya hampir habis. Pesan pagi ini agar langganan tidak kecewa.",
      searchPlaceholder: "Cari barang (Telur, Gula, Kopi, Indomie)...",
      categories: {
        ALL: "Semua",
        BAHAN_POKOK: "Bahan Pokok",
        MINUMAN: "Kopi & Minuman",
        SNACK: "Camilan & Roti",
        LAINNYA: "Rokok & Lainnya",
        PERAWATAN: "Sabun & Rumah",
      },
      statuses: {
        ALL: "Semua",
        CRITICAL: "Mau Habis",
        EXPIRED_RISK: "Risiko Basi",
        LOW: "Menipis",
        SAFE: "Aman",
        OVERSTOCK: "Menumpuk",
      },
      sortLabel: "Urut:",
      sortUrgency: "Perlu Belanja Dulu",
      sortDays: "Paling Cepat Habis",
      sortCost: "Modal Terbesar",
      sortName: "Nama (A-Z)",
      inShelf: "Sisa di Rak",
      coverage: "Cukup Buat",
      shelfValue: "Uang di Rak",
      supplier: "Pemasok",
      wholesalePack: "Kemasan grosir",
      perishable: "Mudah Basi",
      quickOrderWa: "Pesan {name} via WhatsApp",
      orderLogged: "✓ Dicatat di Hanga!",
      givePromo: "Beri Promo",
      contactBtn: "Kontak",
      viewAllLink: "Lihat Semua ({count}) Barang Dagangan Lainnya →",
      emptyTitle: "Barang tidak ditemukan",
      emptyDesc: "Coba kata kunci lain atau bersihkan pilihan filter.",
      showAllBtn: "Tampilkan Semua Barang",
      displayCount: "Menampilkan {count} barang",
      footerNote: "Data stok dihitung otomatis dari foto buku catatan warung dan perputaran kas harian.",
    },
    pesanan: {
      title: "Pesanan Grosir",
      subtitle: "Daftar pesanan ke toko grosir. Dicatat otomatis saat Anda memesan via WhatsApp.",
      tabAll: "Semua",
      tabDraft: "Draf",
      tabSent: "Terkirim",
      summaryCount: "Total {count} pesanan tercatat",
      supplier: "Pemasok",
      totalModal: "Total Modal",
      openWa: "Buka Chat WhatsApp",
      emptyTitle: "Belum Ada Pesanan",
      emptyDesc: "Pesanan yang Anda buat dari halaman Stok atau Rekomendasi akan muncul di sini.",
      createRestockBtn: "Lihat Rekomendasi Belanja",
      statusLabels: {
        DRAFTED: "Draf",
        SENT: "Terkirim via WA",
        RECEIVED: "Selesai Diterima",
        CANCELLED: "Dibatalkan",
      },
    },
    profil: {
      title: "Profil Warung",
      demoBadge: "v1.1 Demo",
      demoSessionNote: "Sesi Mode Demo — data contoh Warung Bu Sari",
      realOwnerNote: "Pemilik Warung Kelontong",
      supplierSectionTitle: "Pemasok Utama (Grosir)",
      activeBadge: "Aktif",
      contactBtn: "Hubungi",
      langSectionTitle: "Bahasa Aplikasi (Language)",
      langSectionDesc: "Pilih bahasa tampilan sistem Hanga. Gunakan Bahasa Indonesia untuk operasional nyata warung, atau English untuk presentasi hackathon internasional.",
      idLabel: "🇮🇩 Bahasa Indonesia (Implementasi Warung)",
      enLabel: "🇬🇧 English (International Hackathon Demo)",
      competitionBadge: "Google Cloud AI Builder Cup 2026",
      competitionDesc: "Didukung oleh Gemma 3 (Reasoning & Penjelasan Bahasa) & Gemini Flash (Ekstraksi Buku Catatan Manual) di atas Google Cloud Run & Firestore.",
      coldStartBtn: "Ulangi Interview Awal (Cold Start)",
      signOutBtn: "Keluar dari Sesi",
    },
    askHanga: {
      title: "Tanya Hanga",
      subtitle: "Asisten cerdas tanya-jawab stok warung & keuangan berbasis Gemma 3.",
      placeholder: "Ketik pertanyaan Anda (contoh: Kenapa perlu pesan telur sekarang?)...",
      sendBtn: "Kirim",
      voiceBtn: "Bicara",
      speaking: "Hanga sedang menjawab...",
      listening: "Mendengarkan suara Anda...",
      thinking: "Menganalisis data warung...",
      popularQuestions: "Pertanyaan Populer:",
      sample1: "Kenapa disarankan pesan telur 12 kg hari ini?",
      sample2: "Apakah uang kas cukup untuk semua pesanan prioritas?",
      sample3: "Apa saran terbaik untuk susu UHT yang mendekati kadaluarsa?",
      errorNote: "Tanya Hanga belum bisa menjawab saat ini. Coba pertanyaan lain ya, Bu.",
    },
    capture: {
      title: "Catat Penjualan",
      subtitle: "Foto halaman buku catatan harian Anda. AI akan membaca dan mengekstrak transaksi otomatis.",
      tipsTitle: "💡 Tips foto buku yang baik",
      tips: [
        "Cahaya cukup terang, tanpa bayangan gelap",
        "Foto satu halaman penuh secara tegak lurus",
        "Tulisan tangan terlihat jelas dan fokus",
        "Letakkan buku di atas meja datar",
      ],
      processingTitle: "Gemini sedang membaca catatan warung...",
      confirmTitle: "Konfirmasi Catatan",
      confirmSubtitle: "Periksa dan perbaiki hasil baca AI. Baris kuning perlu dicek ulang.",
      colName: "Nama Barang",
      colQty: "Jumlah",
      colUnit: "Satuan",
      yellowWarning: "⚠️ Baris kuning: kepercayaan AI rendah, mohon dicek ulang.",
      confirmBtn: "✅ Konfirmasi Catatan",
      savingBtn: "Menyimpan...",
      cardTitle: "Foto buku catatan",
      cardSubtitle: "Cukup foto, kami yang baca.",
      uploading: "Hanga sedang membaca catatan… ✨",
      takePhotoBtn: "Ambil Foto Catatan",
    },
    auth: {
      morningGreeting: "Selamat pagi, Bu 👋",
      afternoonGreeting: "Selamat siang, Bu 👋",
      eveningGreeting: "Selamat sore, Bu 👋",
      nightGreeting: "Selamat malam, Bu 👋",
      loginSubtitle: "Masuk untuk membuka briefing hari ini.",
      tabLogin: "Masuk",
      tabRegister: "Daftar",
      nameLabel: "Nama pemilik warung",
      namePlaceholder: "contoh: Bu Sari atau Pak Joko",
      nameHint: "Sapaan hangat di briefing pagi dan pesan belanja.",
      emailLabel: "Email warung",
      emailPlaceholder: "contoh: busari@warung.com",
      emailHint: "Digunakan sebagai tanda pengenal toko Anda.",
      passwordLabel: "Kata sandi",
      passwordPlaceholder: "Minimal 8 karakter",
      showPassword: "👁️ Tampilkan",
      hidePassword: "🙈 Sembunyikan",
      passwordTooShort: "Minimal 8 karakter — panjang lebih baik daripada rumit.",
      passwordSafe: "Gunakan kata yang mudah Anda ingat.",
      loginBtn: "Masuk ke Warung 🚪",
      registerBtn: "Buat Akun Warung ✨",
      checking: "Memeriksa…",
      preparing: "Menyiapkan…",
      orDivider: "atau",
      googleBtn: "Lanjut dengan Google",
      demoBtn: "🧪 Coba Mode Demo",
      demoSub: "Jelajahi sebagai Bu Sari, tanpa akun",
      footnote: "Warung Anda, data Anda. Kami hanya membacanya untuk membantu Anda.",
      shutterText: "Warung buka — selamat bekerja, Bu. 🌅",
    },
  },
  en: {
    nav: {
      beranda: "Home",
      stok: "Stock",
      pesanan: "Orders",
      profil: "Profile",
    },
    common: {
      activeStock: "Live Stock",
      loading: "Loading data...",
      cancel: "Cancel",
      save: "Save",
      close: "Close",
      back: "Back",
      search: "Search",
      all: "All",
      days: "days",
      supplier: "Supplier",
      cost: "Cost",
      unit: "unit",
      total: "Total",
      ordered: "Ordered",
      status: "Status",
    },
    briefing: {
      greeting: "Good morning, Bu Sari 👋",
      defaultHeadline: "Today's Briefing",
      situationTitle: "Today's Store Scenario:",
      askHangaBtn: "🎤 Ask Hanga — voice Q&A grounded in this briefing",
      fastMovers: "📈 Fast Movers",
      slowMovers: "📉 Slow Movers",
      viewOrders: "View Orders",
    },
    scenarios: {
      BASELINE: {
        label: "Normal",
        hint: "Regular day: Steady inventory balance, secure staples with low coverage.",
      },
      LEBARAN_T14: {
        label: "Eid +14d",
        hint: "Eid T-14 Simulation: Tripled demand for syrup, cookies, and baking ingredients.",
      },
      PAYDAY_T3: {
        label: "Payday",
        hint: "Payday Simulation: Increased purchasing power; stock up on rice, cooking oil, and milk.",
      },
      RAIN_TOMORROW: {
        label: "Rain Tomorrow",
        hint: "Rain Forecast Tomorrow: Lower foot traffic; reduce perishables & stock instant noodles/coffee.",
      },
    },
    inventorySummary: {
      title: "Store Inventory & Working Capital",
      itemsCount: "18 total SKUs",
      valueInShelf: "Shelf capital: Rp 2,354,500",
      seeAll: "All Stock →",
      alertTitle: "3 items running out soon!",
      alertDesc: "Eggs, Sugar, Noodles have under 2 days of sales coverage.",
      orderCta: "Review & Order (3) →",
      mauHabis: "3 Stockout Risk",
      risikoBasi: "2 Perish Risk",
      masihAman: "12 Safe",
    },
    cashBudget: {
      title: "Today's Purchasing Cash Budget",
      cashLimit: "Cash Budget",
      draftOrders: "Draft Orders",
      remainingCash: "Remaining Cash",
      editBudget: "Edit Cash Limit",
      inputLabel: "Enter purchasing cash budget (IDR):",
      saveBtn: "Save Cash Limit",
      cancelBtn: "Cancel",
      noteSafe: "All priority orders fit within today's cash. Surplus is safe for tomorrow's restock.",
    },
    cards: {
      actionLabels: {
        REORDER: "Reorder",
        PROMO: "Promo",
        HOLD: "Hold",
        SKIP: "Skip",
      },
      confidenceLabels: {
        HIGH: "High Confidence",
        MEDIUM: "Medium Confidence",
        LOW: "Needs Review",
      },
      factorLabels: {
        PAYDAY: "Payday",
        WEEKEND: "Weekend",
        RAIN: "Rain",
        RAIN_TOMORROW: "Rain tomorrow",
        LEBARAN_T14: "Eid +14d",
        LEBARAN_WEEK: "Eid Week",
        EVENT_KONDANGAN: "Wedding event",
        EVENT_PASAR: "Market day",
        SCHOOL_TERM: "School term",
        TREND_UP: "Upward trend",
        TREND_DOWN: "Downward trend",
        WASTE_RISK: "Spoilage risk",
        LOW_DATA: "Limited data",
        CASH_TIGHT: "Tight cash",
      },
      suggestedQty: "Suggested Order:",
      range: "Range:",
      estCost: "Estimated Cost:",
      orderWa: "Order via WhatsApp",
      orderedLogged: "✓ Logged in Orders",
      askWhy: "Ask AI Why",
      actionHints: {
        REORDER: "Running low or high turnover — wholesale restock recommended today",
        PROMO: "Apply bundle discount before perishable goods expire or degrade",
        HOLD: "Adequate shelf stock — pause reordering to preserve working cash",
        SKIP: "Slowing velocity — skip ordering to prevent dead capital buildup",
      },
    },
    stok: {
      headerTitle: "Stock & Goods",
      headerSubtitle: "Warung Bu Sari · Automated Monitoring",
      pageTitle: "Store Inventory & Stock",
      pageSubtitle: "Monitor stockout risks and reorder directly to wholesalers via WhatsApp.",
      backBriefing: "← Briefing",
      tabPerluBelanja: "🚨 Restock Needed",
      tabSemuaStok: "📦 All Inventory",
      priorityBannerTitle: "Morning Priority Restock List",
      priorityBannerDesc: "There are {count} items almost out of stock. Reorder this morning to keep regular customers satisfied.",
      searchPlaceholder: "Search products (Eggs, Sugar, Coffee, Noodles)...",
      categories: {
        ALL: "All",
        BAHAN_POKOK: "Staples",
        MINUMAN: "Coffee & Drinks",
        SNACK: "Snacks & Bread",
        LAINNYA: "General & Tobacco",
        PERAWATAN: "Household & Care",
      },
      statuses: {
        ALL: "All",
        CRITICAL: "Stockout Risk",
        EXPIRED_RISK: "Perish Risk",
        LOW: "Running Low",
        SAFE: "Safe",
        OVERSTOCK: "Overstocked",
      },
      sortLabel: "Sort:",
      sortUrgency: "Urgency First",
      sortDays: "Shortest Coverage",
      sortCost: "Highest Cost",
      sortName: "Name (A-Z)",
      inShelf: "In Stock",
      coverage: "Coverage",
      shelfValue: "Shelf Value",
      supplier: "Supplier",
      wholesalePack: "Wholesale pack",
      perishable: "Perishable",
      quickOrderWa: "Order {name} via WhatsApp",
      orderLogged: "✓ Logged in Hanga!",
      givePromo: "Add Promo",
      contactBtn: "Contact",
      viewAllLink: "View All ({count}) Other Store Inventory →",
      emptyTitle: "No products found",
      emptyDesc: "Try a different search keyword or clear active filters.",
      showAllBtn: "Show All Products",
      displayCount: "Showing {count} items",
      footerNote: "Inventory data computed automatically from handwritten ledger snapshots and daily cash flow.",
    },
    pesanan: {
      title: "Wholesale Orders",
      subtitle: "Orders sent to wholesalers. Automatically tracked when reordering via WhatsApp.",
      tabAll: "All",
      tabDraft: "Draft",
      tabSent: "Sent",
      summaryCount: "Total {count} logged orders",
      supplier: "Wholesaler",
      totalModal: "Total Capital",
      openWa: "Open WhatsApp Chat",
      emptyTitle: "No Orders Yet",
      emptyDesc: "Orders placed from the Stock or Recommendation screens will appear here.",
      createRestockBtn: "View Restock Recommendations",
      statusLabels: {
        DRAFTED: "Draft",
        SENT: "Sent via WA",
        RECEIVED: "Received",
        CANCELLED: "Cancelled",
      },
    },
    profil: {
      title: "Store Profile",
      demoBadge: "v1.1 Demo",
      demoSessionNote: "Demo Mode Session — Warung Bu Sari sample data",
      realOwnerNote: "Traditional Warung Merchant",
      supplierSectionTitle: "Primary Wholesalers",
      activeBadge: "Active",
      contactBtn: "Contact",
      langSectionTitle: "App Language (Bahasa)",
      langSectionDesc: "Select system display language. Use Indonesian for real daily store operations, or English for international hackathon evaluation.",
      idLabel: "🇮🇩 Bahasa Indonesia (Real Warung Implementation)",
      enLabel: "🇬🇧 English (International Hackathon Demo)",
      competitionBadge: "Google Cloud AI Builder Cup 2026",
      competitionDesc: "Powered by Gemma 3 (Reasoning & Explanations) & Gemini Flash (Vision Notebook Extraction) on Google Cloud Run & Firestore.",
      coldStartBtn: "Redo Initial Onboarding (Cold Start)",
      signOutBtn: "Sign Out",
    },
    askHanga: {
      title: "Ask Hanga",
      subtitle: "AI store intelligence assistant powered by Gemma 3.",
      placeholder: "Type your question (e.g., Why is ordering 12 kg eggs recommended today?)...",
      sendBtn: "Send",
      voiceBtn: "Voice",
      speaking: "Hanga is speaking...",
      listening: "Listening to your voice...",
      thinking: "Analyzing store telemetry...",
      popularQuestions: "Popular Inquiries:",
      sample1: "Why is reordering 12 kg eggs recommended today?",
      sample2: "Does today's cash budget cover all priority orders?",
      sample3: "What is the best action for UHT milk near expiration?",
      errorNote: "Ask Hanga cannot answer right now. Please try another question.",
    },
    capture: {
      title: "Log Daily Sales",
      subtitle: "Snap a photo of your handwritten ledger. AI reads and extracts transactions automatically.",
      tipsTitle: "💡 Tips for clear photo capture",
      tips: [
        "Ensure bright, even lighting without dark shadows",
        "Capture the entire page perpendicular to camera",
        "Keep handwriting clear and in sharp focus",
        "Place notebook on a flat, stable surface",
      ],
      processingTitle: "Gemini is parsing the handwritten notebook...",
      confirmTitle: "Confirm Extracted Sales",
      confirmSubtitle: "Review and edit AI extracted items. Yellow rows need verification.",
      colName: "Item Name",
      colQty: "Quantity",
      colUnit: "Unit",
      yellowWarning: "⚠️ Yellow rows: low AI confidence, please double check.",
      confirmBtn: "✅ Confirm Extracted Sales",
      savingBtn: "Saving...",
      cardTitle: "Snap notebook ledger",
      cardSubtitle: "Just snap, AI does the rest.",
      uploading: "Hanga is parsing the ledger… ✨",
      takePhotoBtn: "Take Photo of Ledger",
    },
    auth: {
      morningGreeting: "Good morning 👋",
      afternoonGreeting: "Good afternoon 👋",
      eveningGreeting: "Good evening 👋",
      nightGreeting: "Good evening 👋",
      loginSubtitle: "Sign in to view today's morning briefing.",
      tabLogin: "Sign In",
      tabRegister: "Sign Up",
      nameLabel: "Merchant name",
      namePlaceholder: "e.g. Bu Sari or John",
      nameHint: "Warm greeting in morning briefings and supplier orders.",
      emailLabel: "Store email",
      emailPlaceholder: "e.g. busari@warung.com",
      emailHint: "Used as your store identifier.",
      passwordLabel: "Password",
      passwordPlaceholder: "Minimum 8 characters",
      showPassword: "👁️ Show",
      hidePassword: "🙈 Hide",
      passwordTooShort: "Minimum 8 characters — length beats complexity.",
      passwordSafe: "Use a phrase easy for you to remember.",
      loginBtn: "Open Store & Sign In 🚪",
      registerBtn: "Create Store Account ✨",
      checking: "Checking…",
      preparing: "Preparing…",
      orDivider: "or",
      googleBtn: "Continue with Google",
      demoBtn: "🧪 Try Demo Mode",
      demoSub: "Explore as Bu Sari without signing up",
      footnote: "Your store, your data. Hanga AI only reads it to help you optimize.",
      shutterText: "Store is open — have a fruitful day! 🌅",
    },
  },
};

// English overrides for author-curated demo scenarios (hackathon evaluation)
export const SCENARIO_ENGLISH_OVERRIDES: Record<
  string,
  {
    headline: string;
    budgetNote: string;
    rationales: Record<string, string>;
    hints: Record<string, string>;
    factorNotes: Record<string, string>;
  }
> = {
  BASELINE: {
    headline: "Saturday normal: sugar and eggs are running low, secure stock this morning.",
    budgetNote: "All priority orders fit within today's cash. Surplus is safe for tomorrow's restock.",
    rationales: {
      "GULA-1KG": "Reorder 15 kg sugar: 4 kg left on shelf, weekend rush for baking ingredients.",
      "TELUR-1KG": "Reorder 12 kg eggs: fast weekend turnover, prevent stockouts before midday.",
      "SUSU-UHT-1L": "Run bundle promo: 3 boxes expiring in 4 days, sales slowed down 31%.",
      "SABUN-COLEK": "Hold detergent reorder: 8 tubs remaining on shelf with slow velocity.",
    },
    hints: {
      "GULA-1KG": "Bundled to 3 sacks (15 kg) to secure the best wholesale tier price.",
      "TELUR-1KG": "Egg velocity peaks on weekends. Reorder early before the supplier runs out.",
      "SUSU-UHT-1L": "Bundle discount with morning coffee sachet to liquidate shelf stock quickly.",
    },
    factorNotes: {
      WEEKEND: "busy weekend traffic",
      TREND_UP: "stable upward sales trend",
      TREND_DOWN: "sales velocity down 31%",
      LOW_DATA: "4 days until expiration",
    },
  },
  LEBARAN_T14: {
    headline: "Eid H-14 surge: syrup & canned biscuits demand triples, secure wholesale early.",
    budgetNote: "Cash budget allocated to high-turnover parcel items. Secondary staples deferred.",
    rationales: {
      "SIRUP-MARJAN": "Restock 24 bottles of syrup: pre-Eid family gathering demand surges 300%.",
      "BISKUIT-KALENG": "Order 12 tins of butter cookies: prime seasonal Eid gift demand.",
    },
    hints: {
      "SIRUP-MARJAN": "Lock wholesale wholesale pricing now before distributor seasonal price hike.",
    },
    factorNotes: {
      LEBARAN_T14: "Eid H-14 seasonal wave",
      TREND_UP: "exponential demand surge",
    },
  },
  PAYDAY_T3: {
    headline: "Payday peak: neighborhood purchasing power is up, prioritize rice, oil, and milk.",
    budgetNote: "Sufficient cash on hand to capture high-margin staple basket demand.",
    rationales: {
      "BERAS-5KG": "Stock 10 sacks of premium rice: neighborhood payday shopping basket peaks.",
      "MINYAK-GORENG-2L": "Reorder 15 pouches of cooking oil: consistent month-end bulk purchase.",
    },
    hints: {
      "BERAS-5KG": "Payday staples turn over within 48 hours. Maximize cash allocation.",
    },
    factorNotes: {
      PAYDAY: "month-end payday surge",
      TREND_UP: "increased basket size",
    },
  },
  RAIN_TOMORROW: {
    headline: "Rain forecast tomorrow: foot traffic down, hold fresh stock & prep instant noodles.",
    budgetNote: "Preserve cash by skipping wet goods; double shelf supply of hot beverage sachets.",
    rationales: {
      "INDOMIE-SOTO": "Stock 2 boxes of soup noodles: rainy weather spikes comfort food consumption.",
      "KOPI-KAPALAPI": "Restock 5 packs of hot mix coffee: local residents buy sachets to drink at home.",
    },
    hints: {
      "INDOMIE-SOTO": "Customers stay nearby and buy comfort meals during prolonged rain.",
    },
    factorNotes: {
      RAIN_TOMORROW: "heavy rain forecasted",
      TREND_UP: "instant comfort food surge",
    },
  },
};
