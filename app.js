// State
let currentSection = 'contents';
let showEnglish = false;
let showIndonesian = false;
let xmlData = null;

// Urutan semua section untuk navigasi
let sectionOrder = [];

// Bangun urutan section berdasarkan data XML
function buildSectionOrder() {
    sectionOrder = ['contents'];
    const data = parseXMLData();
    data.bab.forEach(bab => {
        sectionOrder.push(`bab-${bab.id}-header`);
        sectionOrder.push(`bab-${bab.id}-grammar`);
    });
    // Add can-do-list at the end
    sectionOrder.push('can-do-list');
}

// Generate HTML tombol navigasi
function getNavButtons(currentId) {
    if (sectionOrder.length === 0) buildSectionOrder();
    
    const idx = sectionOrder.indexOf(currentId);
    if (idx === -1) return '';
    
    const prevId = idx > 0 ? sectionOrder[idx - 1] : null;
    const nextId = idx < sectionOrder.length - 1 ? sectionOrder[idx + 1] : null;
    
    let html = '<div class="nav-buttons">';
    
    // Tombol 戻る (Prev)
    if (prevId) {
        let prevLabel = '戻る';
        if (prevId === 'contents') prevLabel = 'もくじへ';
        if (currentId === 'can-do-list') prevLabel = '戻る';
        html += `<button class="nav-btn prev-btn" onclick="showSection('${prevId}')">← ${prevLabel}</button>`;
    } else {
        html += '<span></span>'; // placeholder agar layout tetap rapi
    }
    
    // Tombol 次へ (Next)
    if (nextId) {
        let nextLabel = '次へ';
        // Dari Header → Grammar
        if (currentId.includes('-header') && nextId.includes('-grammar')) {
            nextLabel = '文法を学ぶ';
        }
        // Dari Grammar → Header Bab Berikutnya
        else if (currentId.includes('-grammar') && nextId.includes('-header')) {
            nextLabel = '次の本文へ';
        }
        // Dari Contents → Header Bab 1
        else if (currentId === 'contents') {
            nextLabel = '本文を読む';
        }
        // Dari Bab terakhir Grammar → Can Do List
        else if (currentId.includes('-grammar') && nextId === 'can-do-list') {
            nextLabel = 'できることリストへ';
        }
        // Dari Can Do List → Kembali ke Contents
        else if (currentId === 'can-do-list' && nextId === 'contents') {
            nextLabel = 'もくじへ';
        }
        html += `<button class="nav-btn next-btn" onclick="showSection('${nextId}')">${nextLabel} →</button>`;
    } else {
        html += '<span></span>'; // placeholder
    }
    
    html += '</div>';
    return html;
}

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    loadXMLData();
});

// Load XML Data
async function loadXMLData() {
    try {
        const response = await fetch('database.xml');
        const xmlText = await response.text();
        const parser = new DOMParser();
        xmlData = parser.parseFromString(xmlText, 'text/xml');
        
        renderDrawer('contents');
        renderAllContent();
        buildSectionOrder(); // ← Tambahkan ini
        
        // Apply saved translation states after all content is rendered
        const savedEn = localStorage.getItem('showEnglish');
        const savedId = localStorage.getItem('showIndonesian');
        if (savedEn === 'true') toggleEnglish();
        if (savedId === 'true') toggleIndonesian();
		} catch (error) {
        console.error('Error loading database.xml:', error);
        document.getElementById('main-container').innerHTML = 
            '<p class="text-red-500 p-4">Gagal memuat database. Pastikan file database.xml tersedia.</p>';
    }
}

// Drawer Functions
function openDrawer() {
    document.getElementById('sidebar-drawer').classList.add('active');
    document.getElementById('drawer-overlay').classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeDrawer() {
    document.getElementById('sidebar-drawer').classList.remove('active');
    document.getElementById('drawer-overlay').classList.remove('active');
    document.body.style.overflow = '';
}

function toggleDrawer() {
    const drawer = document.getElementById('sidebar-drawer');
    if (drawer.classList.contains('active')) {
        closeDrawer();
    } else {
        openDrawer();
    }
}

function toggleSubmenu(babId) {
    const submenu = document.getElementById(`submenu-${babId}`);
    const icon = document.getElementById(`expand-icon-${babId}`);
    if (submenu.classList.contains('expanded')) {
        submenu.classList.remove('expanded');
        icon.classList.remove('expanded');
        icon.textContent = '▶';
    } else {
        submenu.classList.add('expanded');
        icon.classList.add('expanded');
        icon.textContent = '▼';
    }
}

// Translation Functions
function toggleEnglish() {
    showEnglish = !showEnglish;
    const btn = document.getElementById('translate-en-btn');
    const text = btn.querySelector('.translate-text');
    
    if (showEnglish) {
        btn.classList.add('en-active');
        text.textContent = 'ON';
    } else {
        btn.classList.remove('en-active');
        text.textContent = 'EN';
    }
    
    document.querySelectorAll('.translation-en').forEach(el => {
        el.classList.toggle('visible', showEnglish);
    });
    
    localStorage.setItem('showEnglish', showEnglish);
}

function toggleIndonesian() {
    showIndonesian = !showIndonesian;
    const btn = document.getElementById('translate-id-btn');
    const text = btn.querySelector('.translate-text');
    
    if (showIndonesian) {
        btn.classList.add('id-active');
        text.textContent = 'ON';
    } else {
        btn.classList.remove('id-active');
        text.textContent = 'ID';
    }
    
    document.querySelectorAll('.translation-id').forEach(el => {
        el.classList.toggle('visible', showIndonesian);
    });
    
    localStorage.setItem('showIndonesian', showIndonesian);
}

// Parse XML Data
function parseXMLData() {
    if (!xmlData) return { pengantar: [], bab: [], bagianAkhir: [], canDoList: [] };
    
    const data = { pengantar: [], bab: [], bagianAkhir: [], canDoList: [] };
    
    // Parse pengantar
    const pengantarItems = xmlData.querySelectorAll('pengantar > item');
    pengantarItems.forEach(item => {
        data.pengantar.push({
            id: item.getAttribute('id'),
            page: item.getAttribute('halaman'),
            title: item.querySelector('judul_jp')?.textContent || '',
            titleEn: item.querySelector('judul_en')?.textContent || '',
            titleId: item.querySelector('judul_id')?.textContent || ''
        });
    });
    
    // Parse bab
    const babElements = xmlData.querySelectorAll('daftar_isi > bab');
    babElements.forEach(bab => {
        const grammarPoints = [];
        const points = bab.querySelectorAll('grammar_points > point');
        points.forEach(point => {
            grammarPoints.push({
                id: point.getAttribute('id'),
                page: point.getAttribute('halaman'),
                text: point.textContent
            });
        });
        
        data.bab.push({
            id: bab.getAttribute('id'),
            page: bab.getAttribute('halaman'),
            category: bab.querySelector('kategori')?.textContent || '',
            categoryEn: bab.querySelector('kategori_en')?.textContent || '',
            categoryId: bab.querySelector('kategori_id')?.textContent || '',
            number: bab.querySelector('nomor')?.textContent || '',
            title: bab.querySelector('judul_jp')?.textContent || '',
            titleEn: bab.querySelector('judul_en')?.textContent || '',
            titleId: bab.querySelector('judul_id')?.textContent || '',
            grammarPoints: grammarPoints,
            matomePage: bab.querySelector('matome')?.getAttribute('halaman') || null
        });
    });
    
    // Parse bagian akhir
    const bagianAkhir = xmlData.querySelector('bagian_akhir');
    if (bagianAkhir) {
        const items = bagianAkhir.querySelectorAll('item');
        items.forEach(item => {
            data.bagianAkhir.push({
                id: item.getAttribute('id'),
                page: item.getAttribute('halaman'),
                title: item.querySelector('judul_jp')?.textContent || '',
                titleEn: item.querySelector('judul_en')?.textContent || '',
                titleId: item.querySelector('judul_id')?.textContent || ''
            });
        });
    }
    
    
    // Parse can_do_list
    const canDoList = xmlData.querySelector('can_do_list');
    if (canDoList) {
        const groups = canDoList.querySelectorAll('bab_group');
        groups.forEach(group => {
            const dekiruItems = [];
            const dekiruEls = group.querySelectorAll('dekiru > item');
            dekiruEls.forEach(item => {
                dekiruItems.push({
                    jp: item.querySelector('jp')?.textContent || '',
                    en: item.querySelector('en')?.textContent || '',
                    id: item.querySelector('id')?.textContent || ''
                });
            });

            data.canDoList.push({
                id: group.getAttribute('id'),
                nomor: group.querySelector('nomor')?.textContent || '',
                kategori: group.querySelector('kategori')?.textContent || '',
                kategoriEn: group.querySelector('kategori_en')?.textContent || '',
                kategoriId: group.querySelector('kategori_id')?.textContent || '',
                judul: group.querySelector('judul')?.textContent || '',
                judulEn: group.querySelector('judul_en')?.textContent || '',
                judulId: group.querySelector('judul_id')?.textContent || '',
                dekiru: dekiruItems
            });
        });
    }

    return data;
}

// Render Functions
function renderDrawer(currentSection = 'contents') {
    const data = parseXMLData();
    const container = document.getElementById('drawer-content');
    
    let html = '<div class="drawer-section"><div class="drawer-section-title">Pengantar</div><div class="drawer-list">';
    
    // Pengantar items all link to contents
    const pengantarActive = currentSection === 'contents';
    data.pengantar.forEach(item => {
        html += `
            <div class="drawer-item ${pengantarActive ? 'active' : ''}" onclick="showSection('contents'); closeDrawer();">
                <div class="drawer-item-info" style="margin-left: 0;">
                    <span class="drawer-item-title">${item.title}</span>
                    <span class="drawer-item-sub">p.${item.page}</span>
                </div>
            </div>
        `;
    });
    
    html += '</div></div><div class="drawer-section"><div class="drawer-section-title">Daftar Isi (Bab 1-20)</div><div class="drawer-list">';
    
    let currentCategory = '';
    data.bab.forEach((bab) => {
        if (bab.category !== currentCategory) {
            currentCategory = bab.category;
            html += `<div style="padding: 0.5rem 1rem; font-size: 0.75rem; color: #be123c; font-weight: 600; margin-top: 0.5rem;">${currentCategory}</div>`;
        }
        
        // Check if this bab is active
        const isBabActive = currentSection === `bab-${bab.id}-header` || currentSection === `bab-${bab.id}-grammar`;
        const isHeaderActive = currentSection === `bab-${bab.id}-header`;
        const isGrammarActive = currentSection === `bab-${bab.id}-grammar`;
        
        // Ambil detail grammar points dari content XML
        const babContent = getBabContent(bab.id);
        const grammarList = babContent.grammar || [];
        
        html += `
            <div class="drawer-bab-group">
                <div class="drawer-item-expandable ${isBabActive ? 'active' : ''}" onclick="toggleSubmenu(${bab.id})">
                    <div class="drawer-item-number">${bab.number}</div>
                    <div class="drawer-item-info">
                        <span class="drawer-item-title">${bab.title}</span>
                        <span class="drawer-item-sub">${bab.category} · p.${bab.page}</span>
                    </div>
                    <span class="drawer-expand-icon ${isBabActive ? 'expanded' : ''}" id="expand-icon-${bab.id}">▶</span>
                </div>
                <div class="drawer-submenu ${isBabActive ? 'expanded' : ''}" id="submenu-${bab.id}">
                    
                    <!-- Link ke Konten Utama / Header Bab -->
                    <div class="drawer-submenu-item ${isHeaderActive ? 'active' : ''}" onclick="showSection('bab-${bab.id}-header'); closeDrawer();">
                        <span class="drawer-submenu-text">📖 本文</span>
                    </div>
        `;
        
        // List Grammar Points dengan nomor, judul, dan halaman
        if (grammarList.length > 0) {
            grammarList.forEach((g, idx) => {
                html += `
                    <div class="drawer-submenu-item ${isGrammarActive ? 'active' : ''}" 
                         style="display: flex; justify-content: space-between; align-items: center; padding: 0.4rem 0.75rem; cursor: pointer;"
                         onclick="showSection('bab-${bab.id}-grammar'); setTimeout(() => { const el = document.getElementById('grammar-${bab.id}-${idx}'); if(el) el.scrollIntoView({behavior:'smooth', block:'start'}); }, 150); closeDrawer();">
                        <div style="display: flex; align-items: center; gap: 0.5rem; overflow: hidden; flex: 1;">
                            <span style="font-weight: 700; color: #be123c; font-size: 0.875rem; min-width: 1.25rem;">${g.num}</span>
                            <span style="font-size: 0.8rem; color: #374151; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${g.title}</span>
                        </div>
                        <span style="font-size: 0.75rem; color: #9ca3af; margin-left: 0.5rem; white-space: nowrap;">p.${g.page}</span>
                    </div>
                `;
            });
        }
        
        // Matome / まとめの問題
        if (bab.matomePage) {
            html += `
                    <div class="drawer-submenu-item" onclick="alert('Matome Bab ${bab.number} - Halaman ${bab.matomePage}'); closeDrawer();">
                        <span class="drawer-submenu-text">📝 まとめの問題</span>
                    </div>
            `;
        }
        
        html += `
                </div>
            </div>
        `;
    });
    
    html += '</div></div><div class="drawer-section"><div class="drawer-section-title">Bagian Akhir</div><div class="drawer-list">';
    
    data.bagianAkhir.forEach(item => {
        const sectionTarget = item.id === 'can_do_list' ? 'can-do-list' : 'contents';
        const isActive = currentSection === sectionTarget;
        html += `
            <div class="drawer-item ${isActive ? 'active' : ''}" onclick="showSection('${sectionTarget}'); closeDrawer();">
                <div class="drawer-item-info" style="margin-left: 0;">
                    <span class="drawer-item-title">${item.title}</span>
                    <span class="drawer-item-sub">p.${item.page}</span>
                </div>
            </div>
        `;
    });
    
    html += '</div></div>';
    container.innerHTML = html;
}

function renderAllContent() {
    const container = document.getElementById('main-container');
    let html = renderContentsSection();
    
    const data = parseXMLData();
    data.bab.forEach(bab => {
        html += renderBabHeader(bab);
        html += renderBabGrammar(bab);
    });

    // Add Can Do List section
    html += renderCanDoList();

    container.innerHTML = html;
}

function renderContentsSection() {
    const data = parseXMLData();
    
    let html = `
        <section id="contents">
            <div class="home-header">
                <h1 class="home-title">TRY! N5</h1>
                <p class="home-subtitle">文法から伸ばす日本語</p>
                <p class="translation-en">Learning Japanese from Grammar</p>
                <p class="translation-id">Belajar Bahasa Jepang dari Tata Bahasa</p>
                <p class="home-desc">改訂版 | JLPT Preparation</p>
                <p class="translation-id">Edisi Revisi | Persiapan Ujian JLPT</p>
            </div>
            
            <div class="quick-access">
                <h2 class="quick-access-title">
                    <span class="sentence-jp">もくじ</span> 
                    <span class="translation-en">Table of Contents</span>
                    <span class="translation-id">Daftar Isi</span>
                </h2>
    `;
    
    html += '<div class="quick-section-title">Pengantar</div>';
    data.pengantar.forEach(item => {
        html += `
            <div class="quick-item" onclick="showSection('contents')">
                <span class="quick-item-title"><span class="sentence-jp">${item.title}</span></span>
                <span class="translation-en">${item.titleEn}</span>
                <span class="translation-id">${item.titleId}</span>
                <span class="quick-item-page">p.${item.page}</span>
            </div>
        `;
    });
    
    html += '<div class="quick-section-title">Bab 1-22</div>';
    data.bab.forEach(bab => {
        html += `
            <div class="bab-card-home" onclick="showSection('bab-${bab.id}-header')">
                <div class="bab-number-home">${bab.number}</div>
                <div class="bab-info-home">
                    <div class="bab-category-home">
                        <span class="sentence-jp">${bab.category}</span>
                        <span class="translation-en">${bab.categoryEn}</span>
                        <span class="translation-id">${bab.categoryId}</span>
                    </div>
                    <div class="bab-title-home">
                        <span class="sentence-jp">${bab.title}</span>
                        <span class="translation-en">${bab.titleEn}</span>
                        <span class="translation-id">${bab.titleId}</span>
                    </div>
                </div>
                <span class="bab-page-home">p.${bab.page}</span>
            </div>
        `;
    });
    
    
    // Can Do List Quick Access
    html += '<div class="quick-section-title" style="margin-top: 2rem;">N5「できること」リスト</div>';
    html += `
        <div class="bab-card-home" onclick="showSection('can-do-list')" style="border-left-color: #059669;">
            <div class="bab-number-home" style="background: #059669;">✓</div>
            <div class="bab-info-home">
                <div class="bab-category-home">
                    <span class="sentence-jp">できることリスト</span>
                    <span class="translation-en">Can Do List</span>
                    <span class="translation-id">Daftar Kemampuan</span>
                </div>
                <div class="bab-title-home">
                    <span class="sentence-jp">N5「できること」リスト</span>
                    <span class="translation-en">N5 Can Do List</span>
                    <span class="translation-id">Daftar Kemampuan N5</span>
                </div>
            </div>
            <span class="bab-page-home">p.227-231</span>
        </div>
    `;

    html += '</div>';
    html += getNavButtons('contents');
    html += '</section>';
    return html;
}

function renderBabHeader(bab) {
    // Get content from XML
    const contentData = getBabContent(bab.id);
    
    let html = `
        <section id="bab-${bab.id}-header" class="hidden">
            <div class="section-header">
                <div class="bab-header-category">
                    <span class="sentence-jp">${bab.category}</span>
                    <span class="translation-en">${bab.categoryEn}</span>
                    <span class="translation-id">${bab.categoryId}</span>
                </div>
                <div class="bab-header-title">
                    <span class="bab-header-number">${bab.number}</span>
                    <h1 class="bab-header-text"><span class="sentence-jp">${bab.title}</span></h1>
                    <span class="bab-header-en">${bab.titleEn}</span>
                    <span class="translation-id">${bab.titleId}</span>
                </div>
            </div>
    `;
    
    // Dekiru box
    if (contentData.dekiru && contentData.dekiru.length > 0) {
        html += `
            <div class="dekiru-box">
                <h3 class="dekiru-title">
                    <span class="sentence-jp">できること</span>
                    <span class="translation-en">Dekiru Koto</span>
                    <span class="translation-id">Dapat Melakukan</span>
                </h3>
                <ul>
        `;
        contentData.dekiru.forEach(item => {
            html += `
                <li class="dekiru-item">
                    <span class="dekiru-bullet">●</span>
                    <div>
                        <p><span class="sentence-jp">${item.jp}</span></p>
                        <span class="translation-en">${item.en}</span>
                        <span class="translation-id">${item.id}</span>
                    </div>
                </li>
            `;
        });
        html += '</ul></div>';
    }
    
    // Render content based on type
    if (contentData.contentType === 'job_ad') {
        html += renderJobAd(contentData.content);
    } else if (contentData.contentType === 'speech') {
        html += renderSpeech(contentData.content);
    } else if (contentData.contentType === 'essay') {
        html += renderEssay(contentData.content);
    } else if (contentData.contentType === 'article') {
        html += renderArticle(contentData.content);
    } else if (contentData.contentType === 'conversation') {
        html += renderConversation(contentData.content);
    } else if (contentData.contentType === 'story') {
        html += renderStory(contentData.content);
    } else if (contentData.contentType === 'editorial') {
        html += renderEditorial(contentData.content);
    }
    
    html += `<p class="page-number">p.${bab.page}</p>`;
    html += getNavButtons(`bab-${bab.id}-header`);
    html += `</section>`;
    return html;
}

function renderBabGrammar(bab) {
    const contentData = getBabContent(bab.id);
    
    let html = `<section id="bab-${bab.id}-grammar" class="hidden space-y-6">`;
    
    // Header Grammar
    html += `
        <div class="section-header">
            <div class="bab-header-category">Grammar Points</div>
            <div class="bab-header-title">
                <span class="bab-header-number">${bab.number}</span>
                <h1 class="bab-header-text">${bab.title}</h1>
            </div>
        </div>
    `;
    
    // Render each grammar point
    if (contentData.grammar) {
        contentData.grammar.forEach((g, idx) => {
            html += `
                <article class="grammar-article" id="grammar-${bab.id}-${idx}">
                    <div class="grammar-header">
                        <h2 class="grammar-title">${g.num} ${g.title}</h2>
                        <div style="display: flex; align-items: center; gap: 0.5rem;">
                            ${g.plus ? '<span class="plus-badge">+Plus</span>' : ''}
                            <span class="star">${'★'.repeat(g.stars)}</span>
                        </div>
                    </div>
                    <div class="grammar-content">
                        
                        <!-- Dou Tsukau Section -->
                        <div class="dou-tsukau">
                            <h3 class="dou-tsukau-title">
                                どう使う？
                                <span class="translation-en">How to use?</span>
                                <span class="translation-id">Bagaimana Menggunakannya?</span>
                            </h3>
                            <p class="dou-tsukau-text">
                                <span class="sentence-jp">${g.desc}</span>
                            </p>
                            <span class="translation-en">${g.descEn}</span>
                            <span class="translation-id">${g.descId}</span>
                        </div>
                        
                        <!-- Pattern Section -->
                        <div class="grammar-pattern">
                            <p class="grammar-pattern-text">
                                <span class="sentence-jp">${g.pattern}</span>
                            </p>
                            <span class="translation-id">${g.patternId}</span>
                        </div>
                        
                        <!-- Example List - STRUKTUR BARU -->
                        <div class="example-list">
            `;
            
            // Examples dengan sentence-jp wrapper
            g.examples.forEach((ex, exIdx) => {
                html += `
                            <div class="example-item">
                                <p>
                                    <span class="example-num">${String.fromCharCode(9312 + exIdx)}</span> 
                                    <span class="sentence-jp">${ex.jp}</span>
                                </p>
                                ${ex.id ? `<span class="translation-id">${ex.id}</span>` : ''}
                            </div>
                `;
            });
            
            html += `
                        </div>
            `;
            
            // Yatte Miyou section if exists
            if (g.yatteMiyou) {
                html += renderYatteMiyou(g.yatteMiyou);
            }
            
            // Plus section if exists
            if (g.plus) {
                html += `
                    <div class="plus-section">
                        <div class="plus-header">
                            <span class="plus-badge">+Plus</span>
                            <span class="plus-title">${g.plus}</span>
                        </div>
                    </div>
                `;
            }
            
            // Page reference
            html += `
                        <p class="page-ref">p.${g.page}</p>
                    </div>
                </article>
            `;
        });
    }
    
    // Check section if exists
    if (contentData.check) {
        html += renderCheck(contentData.check);
    }
    
    html += getNavButtons(`bab-${bab.id}-grammar`);
    html += '</section>';
    return html;
}

// Helper function for Yatte Miyou section
function renderYatteMiyou(yatteMiyou) {
    let html = `
        <div class="yatte-miyou">
            <h3 class="yatte-miyou-title">
                やってみよう！
                <span class="yatte-miyou-ref">${yatteMiyou.ref}</span>
            </h3>
            <div class="quiz-grid">
    `;
    
    if (yatteMiyou.soal) {
        yatteMiyou.soal.forEach(soal => {
            html += `
                <div class="quiz-item">
                    <p>
                        <span class="sentence-jp">${soal.teks}</span>
                    </p>
                </div>
            `;
        });
    }
    
    html += `
            </div>
        </div>
    `;
    return html;
}

// Content Type Renderers

function renderJobAd(jobAd) {
    let html = `
        <div class="job-ad">
            <div class="job-ad-title">
                <h2><span class="sentence-jp">${jobAd.title}</span></h2>
                <span class="translation-en">${jobAd.titleEn}</span>
                <span class="translation-id">${jobAd.titleId}</span>
            </div>
            <p class="job-ad-subtitle">
                <span class="highlight">${jobAd.highlight}</span><span class="sentence-jp">${jobAd.subtitle}</span>
                <span class="translation-en">${jobAd.subtitleEn}</span>
                <span class="translation-id">${jobAd.subtitleId}</span>
            </p>
            <div style="margin-top: 1rem;">
    `;
    
    jobAd.sections.forEach(section => {
        html += `
            <div class="job-section">
                <span class="job-section-label">
                    <span class="sentence-jp">${section.label}</span>▶
                    <span class="translation-en">${section.labelEn}▶</span>
                    <span class="translation-id">${section.labelId}▶</span>
                </span>
                <div class="job-section-content">
                    <p>${section.content}</p>
                    ${section.note ? `<p class="job-note">${section.note}</p>` : ''}
                </div>
            </div>
        `;
    });
    
    html += `
            </div>
            <div class="job-contact">
                <p style="font-weight: 700;">${jobAd.contact.name}</p>
                <p>☎ ${jobAd.contact.tel}</p>
                <p>${jobAd.contact.web}</p>
                <p>E-mail ${jobAd.contact.email}</p>
            </div>
        </div>
    `;
    return html;
}

function renderSpeech(speechData) {
    let html = '<div class="speech-box">';
    
    if (speechData.type === 'simple') {
        // Simple speech with teks and teks_id
        html += `<p><span class="sentence-jp">${highlightGrammar(speechData.teks)}</span></p>`;
        if (speechData.teksId) {
            html += `<span class="translation-id">${speechData.teksId}</span>`;
        }
    } else if (speechData.type === 'dialogue') {
        // Speech with karakter/dialogue
        speechData.characters.forEach(char => {
            html += `
                <div class="speech-character">
                    <span class="character-name">${char.nama}</span>
                    <p class="character-jp"><span class="sentence-jp">${char.jp}</span></p>
                    ${char.id ? `<span class="translation-id">${char.id}</span>` : ''}
                </div>
            `;
        });
    }
    
    html += '</div>';
    return html;
}

function renderEssay(essayData) {
    let html = '<div class="essay-box">';
    
    essayData.paragraphs.forEach((para) => {
        // Wrapper per paragraf
        html += '<div class="essay-item">';
        
        // Teks Jepang
        html += '<p class="essay-paragraph">';
        html += `<span class="sentence-jp">${highlightGrammar(para.jp)}</span>`;
        html += '</p>';
        
        // Terjemahan - dipisahkan sebagai block baru dengan class untuk toggle
        if (para.id) {
            html += `<div class="translation-id indonesian-translation">${para.id}</div>`;
        }
        
        html += '</div>'; // tutup essay-item
    });
    
    html += '</div>';
    return html;
}

function renderArticle(articleData) {
    let html = '<div class="article-box">';
    
    articleData.paragraphs.forEach((para, idx) => {
        html += `
            <p class="article-paragraph">
                <span class="sentence-jp">${highlightGrammar(para.jp)}</span></p>
                ${para.id ? `<span class="translation-id">${para.id}</span>` : ''}
        `;
    });
    
    html += '</div>';
    return html;
}

function renderConversation(convData) {
    let html = '<div class="conversation-box">';
    
    convData.dialogs.forEach((dialog, idx) => {
        html += `
            <div class="dialog-item">
                <span class="dialog-speaker">${dialog.speaker}</span>
                <p class="dialog-jp"><span class="sentence-jp">${dialog.jp}</span></p>
                ${dialog.id ? `<span class="translation-id">${dialog.id}</span>` : ''}
            </div>
        `;
    });
    
    html += '</div>';
    return html;
}

function renderStory(storyData) {
    let html = '<div class="story-box">';
    
    storyData.paragraphs.forEach((para, idx) => {
        html += `
            <p class="story-paragraph">
                <span class="sentence-jp">${highlightGrammar(para.jp)}</span>
                ${para.id ? `<span class="translation-id">${para.id}</span>` : ''}
            </p>
        `;
    });
    
    html += '</div>';
    return html;
}

function renderEditorial(editorialData) {
    let html = '<div class="editorial-box">';
    
    editorialData.paragraphs.forEach((para, idx) => {
        html += `
            <p class="editorial-paragraph">
                <span class="sentence-jp">${highlightGrammar(para.jp)}</span>
                ${para.id ? `<span class="translation-id">${para.id}</span>` : ''}
            </p>
        `;
    });
    
    html += '</div>';
    return html;
}

function renderCheck(check) {
    let html = `
        <div class="check-box" style="margin-top: 2rem;">
            <div class="check-header">
                <span class="check-icon">📖</span>
                <h2 class="check-title">Check</h2>
                <span class="check-ref">▶答え 別冊P. ${check.page}</span>
            </div>
            <div class="check-grid">
                <div>
    `;
    
    check.questions.forEach(q => {
        html += `
            <p class="check-question">
                ${q.num}）<span class="sentence-jp">${q.text}</span></p>
                ${q.en ? `<span class="translation-en">${q.en}</span>` : ''}
        `;
    });
    
    html += `
                    <div class="check-options">
                        ${check.options.map(o => `<span>${o}</span>`).join('')}
                    </div>
                </div>
                <div>
    `;
    
    check.questions2.forEach(q => {
        html += `
            <p class="check-question">
                ${q.num}）<span class="sentence-jp">${q.text}</span></p>
                ${q.en ? `<span class="translation-en">${q.en}</span>` : ''}
        `;
    });
    
    html += `
                    <div class="check-options">
                        ${check.options2.map(o => `<span>${o}</span>`).join('')}
                    </div>
                </div>
            </div>
            <p class="page-number">p.${check.page}</p>
        </div>
    `;
    
    return html;
}

function highlightGrammar(text) {
    const patterns = [
        '入社して以来', 'において', '部長をはじめ', '先輩方のご指導のもとで',
        '仕事の進め方はもとより', '人は失敗から学ぶものだ', '仕事をする上で', '残念ながら'
    ];
    
    let result = text;
    patterns.forEach(pattern => {
        result = result.replace(new RegExp(pattern, 'g'), `<span class="highlight-text">${pattern}</span>`);
    });
    
    return result;
}

// Get content from XML for specific bab
function getBabContent(babId) {
    if (!xmlData) return {};
    
    const content = xmlData.querySelector(`bab${babId}_content`);
    if (!content) return {};
    
    const result = {
        dekiru: [],
        grammar: [],
        check: null,
        contentType: null,
        content: null
    };
    
    // Parse dekiru
    const dekiruItems = content.querySelectorAll('dekiru_koto > item');
    dekiruItems.forEach(item => {
        result.dekiru.push({
            jp: item.querySelector('jp')?.textContent || '',
            en: item.querySelector('en')?.textContent || '',
            id: item.querySelector('id')?.textContent || ''
        });
    });
    
    // Parse content based on type
    const contentEl = content.querySelector('content');
    if (contentEl) {
        const type = contentEl.getAttribute('type');
        result.contentType = type;
        
        switch(type) {
            case 'job_ad':
                result.content = parseJobAd(contentEl);
                break;
            case 'speech':
                result.content = parseSpeech(contentEl);
                break;
            case 'essay':
                result.content = parseEssay(contentEl);
                break;
            case 'article':
                result.content = parseArticle(contentEl);
                break;
            case 'conversation':
                result.content = parseConversation(contentEl);
                break;
            case 'story':
                result.content = parseStory(contentEl);
                break;
            case 'editorial':
                result.content = parseEditorial(contentEl);
                break;
        }
    }
    
    // Parse grammar points
    const subBabs = content.querySelectorAll('sub_bab');
    subBabs.forEach((subBab, idx) => {
        const grammar = {
            num: subBab.querySelector('nomor')?.textContent || (idx + 1),
            page: subBab.getAttribute('halaman'),
            title: subBab.querySelector('judul')?.textContent || '',
            stars: (subBab.querySelector('bintang')?.textContent || '').length,
            pattern: subBab.querySelector('pola')?.textContent || '',
            patternId: subBab.querySelector('pola_id')?.textContent || '',
            desc: subBab.querySelector('dou_tsukau > penjelasan > jp')?.textContent || '',
            descEn: subBab.querySelector('dou_tsukau > penjelasan > en')?.textContent || '',
            descId: subBab.querySelector('dou_tsukau > penjelasan > id')?.textContent || '',
            plus: subBab.querySelector('plus')?.textContent || null,
            examples: []
        };
        
        const examples = subBab.querySelectorAll('contoh > item');
        examples.forEach(ex => {
            grammar.examples.push({
                jp: ex.querySelector('jp')?.textContent || '',
                id: ex.querySelector('id')?.textContent || ''
            });
        });
        
        result.grammar.push(grammar);
    });
    
    // Parse check
    const check = content.querySelector('check');
    if (check) {
        result.check = parseCheck(check);
    }
    
    return result;
}

// Content Parsers

function parseJobAd(jobAdEl) {
    const sections = [];
    const sectionElements = jobAdEl.querySelectorAll('section');
    
    sectionElements.forEach(sec => {
        const type = sec.getAttribute('type');
        sections.push({
            label: type,
            labelEn: getLabelEn(type),
            labelId: getLabelId(type),
            content: sec.querySelector('isi')?.textContent || '',
            note: sec.querySelector('catatan')?.textContent || ''
        });
    });
    
    return {
        title: jobAdEl.querySelector('judul')?.textContent || '',
        titleEn: jobAdEl.querySelector('judul_en')?.textContent || '',
        titleId: jobAdEl.querySelector('judul_id')?.textContent || '',
        highlight: jobAdEl.querySelector('subjudul > highlight')?.textContent || '',
        subtitle: jobAdEl.querySelector('subjudul')?.childNodes[2]?.textContent || '',
        subtitleEn: jobAdEl.querySelector('subjudul_en')?.textContent || '',
        subtitleId: jobAdEl.querySelector('subjudul_id')?.textContent || '',
        sections: sections,
        contact: {
            name: jobAdEl.querySelector('kontak > nama')?.textContent || '',
            tel: jobAdEl.querySelector('kontak > tel')?.textContent || '',
            web: jobAdEl.querySelector('kontak > web')?.textContent || '',
            email: jobAdEl.querySelector('kontak > email')?.textContent || ''
        }
    };
}

function parseSpeech(speechEl) {
    // Check if it has karakter elements (dialogue format)
    const karakterElements = speechEl.querySelectorAll('karakter');
    
    if (karakterElements.length > 0) {
        // Dialogue format with characters
        const characters = [];
        karakterElements.forEach(char => {
            characters.push({
                nama: char.getAttribute('nama') || '',
                jp: char.querySelector('jp')?.textContent || '',
                id: char.querySelector('id')?.textContent || ''
            });
        });
        return {
            type: 'dialogue',
            characters: characters
        };
    } else {
        // Simple format with teks
        return {
            type: 'simple',
            teks: speechEl.querySelector('teks')?.textContent || '',
            teksId: speechEl.querySelector('teks_id')?.textContent || ''
        };
    }
}

function parseEssay(essayEl) {
    const paragraphs = [];
    
    // Cari elemen <teks> (bukan <paragraph>)
    const teksElements = essayEl.querySelectorAll('teks');
    
    if (teksElements.length > 0) {
        teksElements.forEach(teks => {
            paragraphs.push({
                jp: teks.querySelector('jp')?.textContent || '',
                id: teks.querySelector('id')?.textContent || ''
            });
        });
    } else {
        // Fallback: treat entire content as one paragraph
        paragraphs.push({
            jp: essayEl.textContent || '',
            id: ''
        });
    }
    
    return { paragraphs };
}

function parseArticle(articleEl) {
    const paragraphs = [];
    
    const teksElements = articleEl.querySelectorAll('teks');
    
    if (teksElements.length > 0) {
        teksElements.forEach(teks => {
            paragraphs.push({
                jp: teks.querySelector('jp')?.textContent || '',
                id: teks.querySelector('id')?.textContent || ''
            });
        });
    } else {
        paragraphs.push({
            jp: articleEl.textContent || '',
            id: ''
        });
    }
    
    return { paragraphs };
}

function parseConversation(convEl) {
    const dialogs = [];
    
    const dialogElements = convEl.querySelectorAll('dialog');
    
    if (dialogElements.length > 0) {
        dialogElements.forEach(dialog => {
            dialogs.push({
                speaker: dialog.querySelector('speaker')?.textContent || '',
                jp: dialog.querySelector('jp')?.textContent || '',
                id: dialog.querySelector('id')?.textContent || ''
            });
        });
    } else {
        // Fallback: try karakter format (backward compatibility)
        const karakterElements = convEl.querySelectorAll('karakter');
        karakterElements.forEach(char => {
            dialogs.push({
                speaker: char.getAttribute('nama') || '',
                jp: char.querySelector('jp')?.textContent || '',
                id: char.querySelector('id')?.textContent || ''
            });
        });
    }
    
    return { dialogs };
}

function parseStory(storyEl) {
    const paragraphs = [];
    
    const paraElements = storyEl.querySelectorAll('paragraph');
    
    if (paraElements.length > 0) {
        paraElements.forEach(para => {
            paragraphs.push({
                jp: para.querySelector('jp')?.textContent || '',
                id: para.querySelector('id')?.textContent || ''
            });
        });
    } else {
        paragraphs.push({
            jp: storyEl.textContent || '',
            id: ''
        });
    }
    
    return { paragraphs };
}

function parseEditorial(editorialEl) {
    const paragraphs = [];
    
    const paraElements = editorialEl.querySelectorAll('paragraph');
    
    if (paraElements.length > 0) {
        paraElements.forEach(para => {
            paragraphs.push({
                jp: para.querySelector('jp')?.textContent || '',
                id: para.querySelector('id')?.textContent || ''
            });
        });
    } else {
        paragraphs.push({
            jp: editorialEl.textContent || '',
            id: ''
        });
    }
    
    return { paragraphs };
}

function parseCheck(check) {
    const result = {
        page: check.getAttribute('halaman'),
        questions: [],
        options: [],
        questions2: [],
        options2: []
    };
    
    const bagian1 = check.querySelector('bagian1');
    if (bagian1) {
        const soalElements = bagian1.querySelectorAll('soal');
        soalElements.forEach(soal => {
            result.questions.push({
                num: soal.getAttribute('id'),
                text: soal.querySelector('teks')?.textContent || '',
                en: soal.querySelector('teks_en')?.textContent || ''
            });
        });
        
        const pilihanElements = bagian1.querySelectorAll('pilihan_bagian1 > item');
        pilihanElements.forEach(p => {
            result.options.push(p.textContent);
        });
    }
    
    const bagian2 = check.querySelector('bagian2');
    if (bagian2) {
        const soalElements = bagian2.querySelectorAll('soal');
        soalElements.forEach(soal => {
            result.questions2.push({
                num: soal.getAttribute('id'),
                text: soal.querySelector('teks')?.textContent || '',
                en: soal.querySelector('teks_en')?.textContent || ''
            });
        });
        
        const pilihanElements = bagian2.querySelectorAll('pilihan_bagian2 > item');
        pilihanElements.forEach(p => {
            result.options2.push(p.textContent);
        });
    }
    
    return result;
}

function getLabelEn(type) {
    const labels = {
        '仕事': 'Work',
        '資格': 'Requirements',
        '給与': 'Salary',
        '交通費': 'Transportation',
        '応募': 'Application'
    };
    return labels[type] || type;
}

function getLabelId(type) {
    const labels = {
        '仕事': 'Pekerjaan',
        '資格': 'Kualifikasi',
        '給与': 'Gaji',
        '交通費': 'Transportasi',
        '応募': 'Cara Melamar'
    };
    return labels[type] || type;
}


// Can Do List Renderer
function renderCanDoList() {
    const data = parseXMLData();
    const canDoList = data.canDoList || [];

    let html = `
        <section id="can-do-list" class="hidden">
            <div class="section-header">
                <div class="bab-header-category">
                    <span class="sentence-jp">N5「できること」リスト</span>
                    <span class="translation-en">N5 Can Do List</span>
                    <span class="translation-id">Daftar Kemampuan N5</span>
                </div>
                <div class="bab-header-title">
                    <h1 class="bab-header-text"><span class="sentence-jp">できることリスト</span></h1>
                    <span class="bab-header-en">What You Can Do with N5 Grammar</span>
                    <span class="translation-id">Apa yang Dapat Anda Lakukan dengan Tata Bahasa N5</span>
                </div>
                <p class="page-number" style="text-align: center; color: #6b7280; margin-top: 0.5rem;">p.205-207</p>
            </div>

            <div class="can-do-intro">
                <p class="sentence-jp" style="text-align: center; color: #374151; font-size: 0.9375rem; line-height: 1.7;">
                    各ユニットで学んだ文法を使うと、どんなことができるようになったか確認してみましょう。
                </p>
                <span class="translation-en" style="text-align: center; display: block; color: #6b7280; font-size: 0.875rem; margin-top: 0.5rem;">
                    Let's check what you can do using the grammar learned in each unit.
                </span>
                <span class="translation-id" style="text-align: center; display: block; color: #6b7280; font-size: 0.875rem; margin-top: 0.25rem;">
                    Mari periksa apa yang dapat Anda lakukan menggunakan tata bahasa yang dipelajari di setiap unit.
                </span>
            </div>
    `;

    // Render each bab group
    canDoList.forEach(group => {
        const babContent = getBabContent(group.id);
        const grammarList = babContent.grammar || [];

        html += `
            <div class="can-do-group">
                <div class="can-do-group-header" onclick="toggleCanDoGroup('can-do-body-${group.id}')">
                    <div class="can-do-group-main">
                        <div class="can-do-bab-num">${group.nomor}</div>
                        <div class="can-do-bab-info">
                            <div class="can-do-bab-category">
                                <span class="sentence-jp">${group.kategori}</span>
                                <span class="translation-en">${group.kategoriEn}</span>
                                <span class="translation-id">${group.kategoriId}</span>
                            </div>
                            <div class="can-do-bab-title">
                                <span class="sentence-jp">${group.judul}</span>
                                <span class="translation-en">${group.judulEn}</span>
                                <span class="translation-id">${group.judulId}</span>
                            </div>
                        </div>
                    </div>
                    <span class="can-do-toggle-icon" id="can-do-icon-${group.id}">▼</span>
                </div>

                <div class="can-do-body" id="can-do-body-${group.id}">
                    <!-- Dekiru Koto -->
                    <div class="can-do-dekiru-box">
                        <h4 class="can-do-dekiru-title">
                            <span class="sentence-jp">できること</span>
                            <span class="translation-en">What you can do</span>
                            <span class="translation-id">Yang dapat dilakukan</span>
                        </h4>
                        <ul class="can-do-dekiru-list">
        `;

        group.dekiru.forEach(item => {
            html += `
                            <li class="can-do-dekiru-item">
                                <span class="can-do-bullet">●</span>
                                <div>
                                    <p class="sentence-jp">${item.jp}</p>
                                    <span class="translation-en">${item.en}</span>
                                    <span class="translation-id">${item.id}</span>
                                </div>
                            </li>
            `;
        });

        html += `
                        </ul>
                    </div>

                    <!-- Grammar Points with Example Sentences -->
                    <div class="can-do-grammar-section">
                        <h4 class="can-do-grammar-title">
                            <span class="sentence-jp">学んだ文法・例文</span>
                            <span class="translation-en">Grammar learned &amp; Examples</span>
                            <span class="translation-id">Tata bahasa &amp; Contoh Kalimat</span>
                        </h4>
                        <div class="can-do-grammar-list">
        `;

        if (grammarList.length > 0) {
            grammarList.forEach((gp, idx) => {
                const firstEx = gp.examples && gp.examples.length > 0 ? gp.examples[0] : null;
                const displayTitle = gp.pattern || gp.title;
                const hasExample = firstEx && firstEx.jp;

                html += `
                            <div class="can-do-grammar-card">
                                <div class="can-do-grammar-card-header" onclick="showSection('bab-${group.id}-grammar'); setTimeout(() => { const el = document.getElementById('grammar-${group.id}-${idx}'); if(el) el.scrollIntoView({behavior:'smooth', block:'start'}); }, 150);">
                                    <span class="can-do-grammar-num">${gp.num}</span>
                                    <div class="can-do-grammar-meta">
                                        <span class="can-do-grammar-pattern">${displayTitle}</span>
                                        ${gp.patternId ? `<span class="can-do-grammar-pattern-id">${gp.patternId}</span>` : ''}
                                    </div>
                                    <span class="can-do-grammar-page">p.${gp.page}</span>
                                </div>
                                ${hasExample ? `
                                <div class="can-do-grammar-example">
                                    <p class="can-do-ex-line">
                                        <span class="example-num">${String.fromCharCode(9312)}</span>
                                        <span class="sentence-jp">${firstEx.jp}</span>
                                    </p>
                                    <span class="translation-id">${firstEx.id}</span>
                                    ${firstEx.en ? `<span class="translation-en">${firstEx.en}</span>` : ''}
                                </div>
                                ` : ''}
                            </div>
                `;
            });
        }

        html += `
                        </div>
                    </div>

                    <!-- Link to bab -->
                    <div class="can-do-link-row">
                        <button class="can-do-link-btn" onclick="showSection('bab-${group.id}-header')">
                            <span>📖</span>
                            <span class="sentence-jp">本文を読む</span>
                            <span class="translation-en">Read Text</span>
                            <span class="translation-id">Baca Teks</span>
                        </button>
                        <button class="can-do-link-btn" onclick="showSection('bab-${group.id}-grammar')">
                            <span>📝</span>
                            <span class="sentence-jp">文法を復習</span>
                            <span class="translation-en">Review Grammar</span>
                            <span class="translation-id">Ulangi Tata Bahasa</span>
                        </button>
                    </div>
                </div>
            </div>
        `;
    });

    html += getNavButtons('can-do-list');
    html += '</section>';
    console.log('renderCanDoList returning HTML, length:', html.length);
    return html;
}

function toggleCanDoGroup(bodyId) {
    const body = document.getElementById(bodyId);
    const iconId = bodyId.replace('can-do-body-', 'can-do-icon-');
    const icon = document.getElementById(iconId);

    if (body.classList.contains('collapsed')) {
        body.classList.remove('collapsed');
        if (icon) icon.textContent = '▼';
    } else {
        body.classList.add('collapsed');
        if (icon) icon.textContent = '▶';
    }
}

function showSection(sectionId) {
    document.querySelectorAll('section').forEach(sec => {
        sec.classList.add('hidden');
    });
    
    const target = document.getElementById(sectionId);
    if (target) {
        target.classList.remove('hidden');
        currentSection = sectionId;
        
        // Update drawer active state
        renderDrawer(sectionId);
        
        const navTitle = document.getElementById('current-section-title');
        if (sectionId === 'contents') {
            navTitle.textContent = 'TRY! N5';
        } else if (sectionId === 'can-do-list') {
            navTitle.textContent = 'できることリスト';
        } else {
            const match = sectionId.match(/bab-(\d+)-/);
            if (match) {
                const babId = parseInt(match[1]);
                const data = parseXMLData();
                const bab = data.bab.find(b => b.id == babId);
                if (bab) navTitle.textContent = `Bab ${bab.number}`;
            }
        }
        
        window.scrollTo(0, 0);
        
        // Re-attach TTS for newly visible content
        setTimeout(attachTTS, 300);
    }
}

function speakJapanese(text) {
    if (!('speechSynthesis' in window)) return;
    
    // Hentikan suara yang sedang berjalan
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text.replace(/<[^>]*>/g, '').trim());
    utterance.lang = 'ja-JP';
    utterance.rate = 0.8;
    window.speechSynthesis.speak(utterance);
}

function attachTTS() {
    document.querySelectorAll('.sentence-jp').forEach(el => {
        if (el.dataset.ttsAttached) return;
        el.dataset.ttsAttached = 'true';
        el.style.cursor = 'pointer';
        el.addEventListener('click', function(e) {
            if (e.target.closest('a')) return;
            speakJapanese(this.textContent);
        });
    });
}

setTimeout(attachTTS, 1000);
