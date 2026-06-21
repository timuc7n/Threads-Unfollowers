(async function () {
    'use strict';

    // --- 1. GÜVENLİK VE ORTAM KONTROLLERİ ---
    const HOST = window.location.hostname;
    if (!HOST.includes(atob('dGhyZWFkcw=='))) {
        alert(atob('4pqgIEJ1IHNpc3RlbSB5YWxuxLF6Y2EgdGhyZWFkcy5jb20gw7x6ZXJpbmRlIMOnYWzEscWfxLFyLg=='));
        return;
    }
    if (document.getElementById('tuf-root')) return;

    const CONFIG = Object.freeze({
        CREATOR: atob('dGltdWM3bg=='),
        APP_ID: atob('MjM4MjYwMTE4Njk3MzY3'),
        PIC: 'https://instagram.fesb4-1.fna.fbcdn.net/v/t51.82787-19/726575225_18108672700816001_5920886625820609540_n.jpg?stp=dst-jpg_s320x320_tt6&efg=eyJ2ZW5jb2RlX3RhZyI6InByb2ZpbGVfcGljLmRqYW5nby4xMDgwLmMyIn0&_nc_ht=instagram.fesb4-1.fna.fbcdn.net&_nc_cat=105&_nc_oc=Q6cZ2gEndHfxLvKN8PFwFpZxSNC-iSV8BMSac_c_nWmExKyJJwRiIloSFW2cE_ovJoT2fOU&_nc_ohc=zwmOGUKs9ykQ7kNvwFm4s9s&_nc_gid=w8R6R0d9a1zb1TEhw505jQ&edm=AAZTMJEBAAAA&ccb=7-5&oh=00_Af8Y-Or1MRr4veCf2-9J7T2aETGJnEd28E54nDBUQah78Q&oe=6A3C89E6&_nc_sid=49cb7f',
        BASE_URL: location.origin
    });

    if (btoa(CONFIG.CREATOR) !== 'dGltdWM3bg==') return;

    const safeStorage = {
        get: (k, d) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } },
        set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} }
    };

    const MODES = {
        safe: { name: 'Güvenli Mod', minDelay: 2.5, maxDelay: 5.0, minBatch: 8, maxBatch: 15, minBreak: 15, maxBreak: 30, limit: 100, color: '#4ade80' },
        normal: { name: 'Normal Mod', minDelay: 1.5, maxDelay: 3.0, minBatch: 12, maxBatch: 22, minBreak: 10, maxBreak: 20, limit: 150, color: '#60a5fa' },
        aggressive: { name: 'Agresif Mod', minDelay: 0.8, maxDelay: 1.5, minBatch: 20, maxBatch: 35, minBreak: 5, maxBreak: 10, limit: 300, color: '#f87171' }
    };

    const state = {
        unfollowedCount: 0,
        myId: null,
        myUsername: null,
        creatorId: null,
        isUnlocked: false,
        nonFollowers: [],
        filteredUsers: [],
        selectedIds: new Set(),
        searchQuery: '',
        isProcessing: false,
        isStopped: false,
        renderPage: 0, 
        RENDER_CHUNK: 50, 
        whitelist: new Set(safeStorage.get('tuf_whitelist', [])),
        settings: safeStorage.get('tuf_settings_v8', { mode: 'normal', ...MODES.normal })
    };

    const delay = ms => new Promise(r => setTimeout(r, ms));
    const randomDelay = (min, max) => delay(Math.floor(Math.random() * (max - min + 1) + min));
    const randFloat = (min, max) => (Math.random() * (max - min) + min);
    const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1) + min);
    
    const getCsrf = () => { const match = document.cookie.match(/(?:^|;)\s*csrftoken=([^;]+)/); return match ? match[1] : ''; };

    const getInitialsSvg = (t) => {
        const l = (t || '?').charAt(0).toUpperCase();
        const s = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="#2a2a2a"/><text x="50%" y="55%" font-family="Arial,sans-serif" font-size="45" font-weight="bold" fill="#ffffff" dominant-baseline="middle" text-anchor="middle">${l}</text></svg>`;
        return `data:image/svg+xml;base64,${btoa(s)}`;
    };

    const escapeHtml = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

    // --- 2. ARAYÜZ (UI) OLUŞTURMA ---
    const css = `.tuf-no-scroll{overflow:hidden!important;padding-right:0px!important;touch-action:none!important;}#tuf-root{all:initial;position:fixed;inset:0;z-index:2147483647;background:rgba(0,0,0,0.85);display:flex;align-items:center;justify-content:center;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);animation:tuf-fade 0.3s cubic-bezier(0.4,0,0.2,1);padding:15px;box-sizing:border-box;-webkit-tap-highlight-color:transparent;}#tuf-root *{box-sizing:border-box;-webkit-tap-highlight-color:transparent;}@keyframes tuf-fade{from{opacity:0;transform:scale(0.96);}to{opacity:1;transform:scale(1);}}#tuf-modal{width:100%;max-width:480px;height:86dvh;max-height:750px;background:#121212;border:1px solid rgba(255,255,255,0.1);border-radius:24px;display:flex;flex-direction:column;overflow:hidden;color:#f3f5f7;box-shadow:0 30px 80px rgba(0,0,0,0.9);position:relative;transform:translateZ(0);}#tuf-header{display:flex;align-items:center;justify-content:space-between;padding:20px 24px;border-bottom:1px solid rgba(255,255,255,0.05);flex-shrink:0;background:rgba(24,24,24,0.95);z-index:20;backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);}#tuf-header h2{margin:0;font-size:17px;font-weight:700;color:#fff;letter-spacing:-0.02em;display:flex;align-items:center;gap:10px;}.tuf-safe-badge{border:1px solid;font-size:10px;padding:3px 8px;border-radius:6px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;transition:all 0.3s;}#tuf-header-actions{display:flex;gap:10px;}.tuf-icon-btn{background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);color:#aaa;width:34px;height:34px;border-radius:50%;display:flex;align-items:center;justify-content:center;cursor:pointer;transition:all 0.2s;padding:0;}.tuf-icon-btn:hover{color:#fff;background:rgba(255,255,255,0.15);}#tuf-close:hover{background:#f87171;border-color:#f87171;color:#fff;transform:rotate(90deg);}#tuf-progress-bar{height:3px;background:rgba(255,255,255,0.05);width:100%;flex-shrink:0;z-index:20;}#tuf-progress-fill{height:100%;width:0%;background:linear-gradient(90deg,#0095f6,#4cb5f9);transition:width 0.4s cubic-bezier(0.4,0,0.2,1);}#tuf-start-screen, #tuf-screen-loading{display:flex;flex-direction:column;flex:1;align-items:center;justify-content:center;padding:30px;text-align:center;}#tuf-screen-loading{display:none;}.tuf-spinner{width:40px;height:40px;border:3px solid rgba(255,255,255,0.1);border-top-color:#f3f5f7;border-radius:50%;animation:tuf-spin 0.8s linear infinite;}@keyframes tuf-spin{to{transform:rotate(360deg);}}.tuf-text-main{margin-top:24px;color:#f3f5f7;font-size:16px;font-weight:600;line-height:1.5;text-align:center;width:100%;}.tuf-text-sub{margin-top:8px;color:#888;font-size:14px;line-height:1.6;text-align:center;width:100%;}#tuf-main-wrapper{display:none;flex-direction:column;flex:1;overflow:hidden;position:relative;}#tuf-main-content{display:flex;flex-direction:column;flex:1;overflow:hidden;transition:filter 0.4s ease;}#tuf-main-content.tuf-blurred{filter:blur(10px) brightness(0.4);pointer-events:none;user-select:none;}#tuf-overlay-force{position:absolute;inset:0;z-index:9999;display:none;flex-direction:column;align-items:center;justify-content:center;background:rgba(18,18,18,0.90);animation:tuf-fade 0.4s ease;padding:20px;box-sizing:border-box;}.tuf-force-content-wrap{display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;width:100%;max-width:320px;}.tuf-creator-link-wrap{display:flex;flex-direction:column;align-items:center;text-decoration:none;margin-bottom:8px;cursor:pointer;transition:transform 0.2s;}.tuf-creator-link-wrap:hover{transform:scale(1.05);}.tuf-creator-pic{width:76px;height:76px;border-radius:50%;object-fit:cover;border:3px solid #2a2a2a;background:#2a2a2a;box-shadow:0 10px 30px rgba(0,0,0,0.8);}.tuf-creator-name{color:#f3f5f7;font-weight:700;font-size:15px;margin-top:8px;}#tuf-force-error{display:none;background:rgba(248,113,113,0.1);color:#f87171;font-size:12.5px;padding:12px;border-radius:12px;margin-bottom:14px;line-height:1.5;width:100%;border:1px solid rgba(248,113,113,0.2);box-sizing:border-box;}.tuf-primary-btn{box-sizing:border-box;background:#f3f5f7;color:#000;border:none;padding:16px 24px;border-radius:14px;font-weight:700;font-size:15px;cursor:pointer;width:100%;transition:all 0.2s;display:flex;align-items:center;justify-content:center;gap:8px;margin-bottom:12px;}.tuf-primary-btn:hover:not(:disabled){background:#fff;transform:translateY(-2px);box-shadow:0 8px 20px rgba(255,255,255,0.15);}.tuf-primary-btn:active:not(:disabled){transform:scale(0.98);}.tuf-primary-btn:disabled{opacity:0.5;cursor:not-allowed;transform:none;box-shadow:none;}.tuf-secondary-btn{box-sizing:border-box;background:rgba(255,255,255,0.05);color:#fff;border:1px solid rgba(255,255,255,0.1);padding:16px 24px;border-radius:14px;font-weight:600;font-size:15px;cursor:pointer;width:100%;transition:all 0.2s;display:none;align-items:center;justify-content:center;gap:8px;backdrop-filter:blur(5px);-webkit-backdrop-filter:blur(5px);}.tuf-secondary-btn:hover{background:rgba(255,255,255,0.1);}#tuf-tools{padding:16px 24px;border-bottom:1px solid rgba(255,255,255,0.05);flex-shrink:0;background:#181818;}#tuf-status-top{display:flex;justify-content:space-between;font-size:13px;color:#aaa;margin-bottom:14px;font-weight:600;}#tuf-search-container{position:relative;margin-bottom:16px;}#tuf-search-icon{position:absolute;left:16px;top:50%;transform:translateY(-50%);width:18px;height:18px;color:#777;pointer-events:none;}#tuf-search{width:100%;background:#222;border:1px solid transparent;border-radius:14px;padding:14px 16px 14px 44px;color:#fff;font-size:14px;outline:none;transition:all 0.2s;box-sizing:border-box;}#tuf-search:focus{border-color:#555;background:#1a1a1a;}.tuf-actions{display:flex;justify-content:space-between;align-items:center;}.tuf-actions-left{display:flex;gap:16px;align-items:center;}.tuf-action-btn{background:none;border:none;color:#0095f6;font-size:14px;font-weight:600;cursor:pointer;padding:0;transition:color 0.2s;}.tuf-action-btn:hover:not(.disabled){color:#4cb5f9;}.tuf-action-btn.disabled{color:#555;cursor:not-allowed;}.tuf-export-btn{background:rgba(255,255,255,0.05);color:#fff;border:1px solid rgba(255,255,255,0.1);padding:8px 14px;border-radius:10px;font-size:13px;font-weight:600;cursor:pointer;transition:0.2s;display:flex;align-items:center;gap:6px;}.tuf-export-btn:hover{background:rgba(255,255,255,0.1);border-color:rgba(255,255,255,0.2);}#tuf-list{flex:1;overflow-y:auto;background:#121212;position:relative;-webkit-overflow-scrolling:touch;will-change:transform;}#tuf-list::-webkit-scrollbar{width:6px;}#tuf-list::-webkit-scrollbar-thumb{background:#333;border-radius:3px;}.tuf-row{display:flex;align-items:center;gap:14px;padding:14px 24px;border-bottom:1px solid rgba(255,255,255,0.03);cursor:pointer;transition:background 0.15s;}.tuf-row:hover{background:rgba(255,255,255,0.03);}.tuf-row.processing{opacity:0.5;pointer-events:none;background:#161616;}.tuf-avatar{width:46px;height:46px;border-radius:50%;object-fit:cover;background:#262626;flex-shrink:0;border:1px solid #2a2a2a;}.tuf-info{flex:1;min-width:0;display:flex;flex-direction:column;justify-content:center;gap:4px;}.tuf-username{font-size:14.5px;font-weight:600;color:#f3f5f7;text-decoration:none;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;display:inline-flex;align-items:center;gap:4px;}.tuf-username:hover{text-decoration:underline;}.tuf-verified-svg{width:13px;height:13px;color:#0095f6;flex-shrink:0;}.tuf-subtext{font-size:13px;color:#888;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;transition:color 0.2s;}.tuf-star-btn{background:none;border:none;cursor:pointer;color:#444;padding:6px;display:flex;align-items:center;justify-content:center;transition:all 0.2s;}.tuf-star-btn:hover{transform:scale(1.15);color:#aaa;}.tuf-star-btn.active{color:#eab308;}.tuf-cb-container{flex-shrink:0;width:24px;height:24px;border:2px solid #555;border-radius:50%;display:flex;align-items:center;justify-content:center;transition:all 0.2s;pointer-events:none;margin-left:6px;}.tuf-cb-container svg{width:13px;height:13px;stroke:#000;stroke-width:3;fill:none;opacity:0;transition:opacity 0.2s;}.tuf-row.selected .tuf-cb-container{background:#f3f5f7;border-color:#f3f5f7;}.tuf-row.selected .tuf-cb-container svg{opacity:1;}.tuf-empty{padding:80px 24px;text-align:center;color:#888;font-size:15px;line-height:1.6;}#tuf-footer{padding:20px 24px;border-top:1px solid rgba(255,255,255,0.05);background:#181818;flex-shrink:0;text-align:center;}#tuf-session-stats{font-size:13px;color:#666;margin-top:14px;font-weight:500;}#tuf-settings-overlay{position:absolute;inset:0;background:rgba(18,18,18,0.98);z-index:100;display:none;flex-direction:column;padding:24px;animation:tuf-fade 0.2s;}#tuf-settings-scroll-area{flex:1;overflow-y:auto;padding-right:10px;margin-bottom:15px;scrollbar-width:thin;scrollbar-color:#444 transparent;-webkit-overflow-scrolling:touch;}#tuf-settings-scroll-area::-webkit-scrollbar{width:6px;}#tuf-settings-scroll-area::-webkit-scrollbar-track{background:transparent;}#tuf-settings-scroll-area::-webkit-scrollbar-thumb{background:#444;border-radius:10px;}#tuf-settings-scroll-area::-webkit-scrollbar-thumb:hover{background:#666;}.tuf-set-label{color:#aaa;font-size:12px;font-weight:700;margin:16px 0 8px 0;display:block;text-transform:uppercase;letter-spacing:0.5px;}.tuf-mode-grid{display:flex;gap:10px;margin-bottom:10px;}.tuf-mode-btn{flex:1;padding:12px 8px;border-radius:12px;background:#222;border:1px solid #333;color:#888;cursor:pointer;font-weight:600;font-size:13px;transition:all 0.2s;text-align:center;}.tuf-mode-btn[data-mode="safe"].active{background:rgba(74,222,128,0.1);border-color:#4ade80;color:#4ade80;transform:scale(1.02);}.tuf-mode-btn[data-mode="normal"].active{background:rgba(96,165,250,0.1);border-color:#60a5fa;color:#60a5fa;transform:scale(1.02);}.tuf-mode-btn[data-mode="aggressive"].active{background:rgba(248,113,113,0.1);border-color:#f87171;color:#f87171;transform:scale(1.02);}.tuf-input-group{display:flex;gap:12px;margin-bottom:10px;}.tuf-input-wrap{flex:1;}.tuf-input-wrap span{font-size:11px;color:#777;margin-bottom:6px;display:block;}.tuf-input{width:100%;background:#1a1a1a;border:1px solid #333;color:#fff;padding:12px;border-radius:10px;outline:none;box-sizing:border-box;font-size:14px;transition:border 0.2s;}.tuf-input:focus{border-color:#0095f6;}.tuf-minimal-notice{font-size:11px;color:#777;margin-top:16px;line-height:1.4;max-width:280px;text-align:center;margin-left:auto;margin-right:auto;}.tuf-loading-more{text-align:center;padding:15px;color:#888;font-size:13px;}`;

    const styleEl = document.createElement('style');
    styleEl.id = 'tuf-style';
    styleEl.textContent = css;
    document.head.appendChild(styleEl);
    document.documentElement.classList.add('tuf-no-scroll');
    document.body.classList.add('tuf-no-scroll');

    const rootEl = document.createElement('div');
    rootEl.id = 'tuf-root';
    
    const getForceOverlayHTML = () => `
        <div class="tuf-force-content-wrap">
            <a href="https://www.threads.com/@${CONFIG.CREATOR}" target="_blank" class="tuf-creator-link-wrap"><img id="tuf-creator-img" class="tuf-creator-pic" src="${CONFIG.PIC}" onerror="this.src='${getInitialsSvg(CONFIG.CREATOR)}'"><span class="tuf-creator-name">@${CONFIG.CREATOR}</span></a>
            <div class="tuf-text-main" style="margin-top:4px; margin-bottom:6px; font-size:16px;">Sistemi Kullanmak İçin Son Adım</div>
            <div class="tuf-text-sub" style="margin-top:0px; margin-bottom:18px; font-size:13px; line-height:1.4;">Arkadaki listeyi görmek ve işlemlere başlamak için yapımcıyı takip etmelisin.</div>
            <div id="tuf-force-error"></div>
            <button id="tuf-btn-follow" class="tuf-primary-btn"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="8.5" cy="7" r="4"></circle><line x1="20" y1="8" x2="20" y2="14"></line><line x1="23" y1="11" x2="17" y2="11"></line></svg>Takip Et ve Kilidi Aç</button>
            <button id="tuf-btn-manual" class="tuf-secondary-btn" style="margin-top:-4px;"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>Manuel Takip Et</button>
        </div>`;

    rootEl.innerHTML = `
    <div id="tuf-modal">
        <div id="tuf-header">
            <h2>Takip Etmeyenler <span id="tuf-mode-badge" class="tuf-safe-badge"></span></h2>
            <div id="tuf-header-actions">
                <button id="tuf-settings-btn" class="tuf-icon-btn" title="Ayarlar">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
                </button>
                <button id="tuf-close" class="tuf-icon-btn" title="Kapat">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
            </div>
        </div>
        <div id="tuf-progress-bar"><div id="tuf-progress-fill"></div></div>
        
        <div id="tuf-settings-overlay">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px; flex-shrink:0;">
                <h3 style="margin:0; color:#fff; font-size:18px;">⚙️ Ayarlar & Limitler</h3>
                <button id="tuf-settings-close" class="tuf-icon-btn"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button>
            </div>
            
            <div style="background:rgba(255,255,255,0.03); color:#aaa; padding:10px 14px; border-radius:10px; font-size:12px; margin-bottom:15px; border:1px solid rgba(255,255,255,0.05); line-height:1.4; flex-shrink:0;">
                ⚠️ İşlemler insansı gecikmelerle optimize edilmiştir. API limitlerinden doğabilecek kısıtlamalarda sorumluluk kullanıcıya aittir.
            </div>
            
            <div id="tuf-settings-scroll-area">
                <span class="tuf-set-label">Çalışma Modu (Ön Ayarlar)</span>
                <div class="tuf-mode-grid">
                    <button class="tuf-mode-btn" data-mode="safe">Güvenli Mod</button>
                    <button class="tuf-mode-btn" data-mode="normal">Normal Mod</button>
                    <button class="tuf-mode-btn" data-mode="aggressive">Agresif Mod</button>
                </div>
                
                <span class="tuf-set-label">İşlem Arası Gecikme (Saniye)</span>
                <div class="tuf-input-group">
                    <div class="tuf-input-wrap"><span>Min Bekleme</span><input type="number" id="tuf-set-minD" class="tuf-input" min="0.1" step="0.1"></div>
                    <div class="tuf-input-wrap"><span>Max Bekleme</span><input type="number" id="tuf-set-maxD" class="tuf-input" min="0.5" step="0.1"></div>
                </div>
                
                <span class="tuf-set-label">Rastgele Mola Aralığı (Kaç İşlemde Bir?)</span>
                <div class="tuf-input-group">
                    <div class="tuf-input-wrap"><span>En Az (Kişi)</span><input type="number" id="tuf-set-minB" class="tuf-input" min="5" step="1"></div>
                    <div class="tuf-input-wrap"><span>En Fazla (Kişi)</span><input type="number" id="tuf-set-maxB" class="tuf-input" min="10" step="1"></div>
                </div>

                <span class="tuf-set-label">Mola Süresi Aralığı (Saniye)</span>
                <div class="tuf-input-group">
                    <div class="tuf-input-wrap"><span>Kısa Mola</span><input type="number" id="tuf-set-minBrk" class="tuf-input" min="1" step="1"></div>
                    <div class="tuf-input-wrap"><span>Uzun Mola</span><input type="number" id="tuf-set-maxBrk" class="tuf-input" min="3" step="1"></div>
                </div>
                
                <span class="tuf-set-label">Limit (Önemli)</span>
                <div class="tuf-input-group">
                    <div class="tuf-input-wrap"><span>Tek Seferde Max Çıkarma</span><input type="number" id="tuf-set-limit" class="tuf-input" min="10" step="10"></div>
                </div>
            </div>
            <button id="tuf-settings-save" class="tuf-primary-btn" style="margin-bottom:0; flex-shrink:0;">Ayarları Kaydet</button>
        </div>

        <div id="tuf-start-screen">
            <div style="font-size:54px;margin-bottom:15px;">🚀</div>
            <div class="tuf-text-main" style="font-size:19px;">Sistem Hazır</div>
            <div class="tuf-text-sub" style="margin-bottom:32px;">Seni takip etmeyenleri bulmak ve işlemlere başlamak için aşağıdaki butona tıkla.</div>
            <button id="tuf-btn-start-scan" class="tuf-primary-btn" style="max-width:240px;margin-bottom:0;margin-left:auto;margin-right:auto;">Taramayı Başlat</button>
            <div class="tuf-minimal-notice">⚠️ API limitlerinden kaynaklı hesap kısıtlamalarında tüm sorumluluk kullanıcıya aittir.</div>
        </div>
        
        <div id="tuf-screen-loading"><div class="tuf-spinner"></div><div id="tuf-loading-title" class="tuf-text-main">Sistem Başlatılıyor...</div><div id="tuf-loading-sub" class="tuf-text-sub">Lütfen bekleyin</div></div>
        
        <div id="tuf-main-wrapper">
            <div id="tuf-main-content">
                <div id="tuf-tools">
                    <div id="tuf-status-top"><span id="tuf-status-msg">Veriler hazır.</span><span id="tuf-status-count"></span></div>
                    <div id="tuf-search-container"><svg id="tuf-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg><input type="text" id="tuf-search" placeholder="Kullanıcı ara..."></div>
                    <div class="tuf-actions">
                        <div class="tuf-actions-left">
                            <button class="tuf-action-btn" id="tuf-sel-all">Tümünü Seç</button>
                            <button class="tuf-action-btn disabled" id="tuf-sel-none">Temizle</button>
                            <button class="tuf-export-btn" id="tuf-btn-export" title="Listeyi Excel(CSV) Olarak İndir"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg> CSV İndir</button>
                        </div>
                    </div>
                </div>
                <div id="tuf-list"></div>
                <div id="tuf-footer"><button id="tuf-btn-unfollow" class="tuf-primary-btn" disabled>Unfollow Et (0)</button><div id="tuf-session-stats">Bu oturumda çıkarılan: 0</div></div>
            </div>
            
            <div id="tuf-overlay-force">
                ${getForceOverlayHTML()}
            </div>
        </div>
    </div>`;
    document.body.appendChild(rootEl);

    const $ = id => document.getElementById(id);

    const updateBadgeUI = () => {
        const b = $('tuf-mode-badge');
        const s = state.settings;
        let modeData = MODES[s.mode] || { name: 'Özel Mod', color: '#a78bfa' };
        
        if (s.mode !== 'custom' && MODES[s.mode]) {
            const m = MODES[s.mode];
            if (s.minDelay !== m.minDelay || s.maxDelay !== m.maxDelay || s.minBatch !== m.minBatch || s.maxBatch !== m.maxBatch || s.minBreak !== m.minBreak || s.maxBreak !== m.maxBreak || s.limit !== m.limit) {
                s.mode = 'custom'; modeData = { name: 'Özel Mod', color: '#a78bfa' };
            }
        }
        
        b.textContent = modeData.name; b.style.color = modeData.color;
        b.style.backgroundColor = `${modeData.color}15`; b.style.borderColor = `${modeData.color}40`;
    };

    updateBadgeUI();

    $('tuf-settings-btn').onclick = () => {
        const s = state.settings;
        $('tuf-set-minD').value = s.minDelay; $('tuf-set-maxD').value = s.maxDelay;
        $('tuf-set-minB').value = s.minBatch; $('tuf-set-maxB').value = s.maxBatch;
        $('tuf-set-minBrk').value = s.minBreak; $('tuf-set-maxBrk').value = s.maxBreak;
        $('tuf-set-limit').value = s.limit;
        document.querySelectorAll('.tuf-mode-btn').forEach(btn => btn.classList.toggle('active', btn.dataset.mode === s.mode));
        $('tuf-settings-overlay').style.display = 'flex';
    };

    $('tuf-settings-close').onclick = () => $('tuf-settings-overlay').style.display = 'none';

    document.querySelectorAll('.tuf-input').forEach(inp => {
        inp.addEventListener('input', () => document.querySelectorAll('.tuf-mode-btn').forEach(b => b.classList.remove('active')));
    });

    document.querySelectorAll('.tuf-mode-btn').forEach(btn => {
        btn.onclick = (e) => {
            document.querySelectorAll('.tuf-mode-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            const m = MODES[e.target.dataset.mode];
            if(m) {
                $('tuf-set-minD').value = m.minDelay; $('tuf-set-maxD').value = m.maxDelay;
                $('tuf-set-minB').value = m.minBatch; $('tuf-set-maxB').value = m.maxBatch;
                $('tuf-set-minBrk').value = m.minBreak; $('tuf-set-maxBrk').value = m.maxBreak;
                $('tuf-set-limit').value = m.limit;
            }
        };
    });

    $('tuf-settings-save').onclick = () => {
        const minD = Math.max(0.1, parseFloat($('tuf-set-minD').value) || 1.2);
        const maxD = Math.max(minD, parseFloat($('tuf-set-maxD').value) || 2.5);
        const minB = Math.max(1, parseInt($('tuf-set-minB').value) || 10);
        const maxB = Math.max(minB, parseInt($('tuf-set-maxB').value) || 20);
        const minBrk = Math.max(1, parseInt($('tuf-set-minBrk').value) || 5);
        const maxBrk = Math.max(minBrk, parseInt($('tuf-set-maxBrk').value) || 10);
        const lim = Math.max(1, parseInt($('tuf-set-limit').value) || 150);

        let activeModeBtn = document.querySelector('.tuf-mode-btn.active');
        let mode = activeModeBtn ? activeModeBtn.dataset.mode : 'custom';

        state.settings = { mode, minDelay: minD, maxDelay: maxD, minBatch: minB, maxBatch: maxB, minBreak: minBrk, maxBreak: maxBrk, limit: lim };
        safeStorage.set('tuf_settings_v8', state.settings);
        
        updateBadgeUI(); $('tuf-settings-overlay').style.display = 'none'; UI.msg('Ayarlar başarıyla kaydedildi.');
    };

    const UI = {
        load: (m, s) => { $('tuf-loading-title').textContent = m; $('tuf-loading-sub').textContent = s || ''; },
        msg: t => { const e = $('tuf-status-msg'); if (e) e.textContent = t; },
        count: t => { const e = $('tuf-status-count'); if (e) e.textContent = t; },
        prog: p => { const e = $('tuf-progress-fill'); if (e) e.style.width = `${Math.min(100, p)}%`; },
        stat: () => { $('tuf-session-stats').textContent = `Bu oturumda çıkarılan: ${state.unfollowedCount}`; }
    };

    // YENİ: Hem normal çarpı hem de hata ekranı butonu (Event Delegation)
    document.addEventListener('click', (e) => {
        if (e.target.closest('#tuf-close') || e.target.closest('.tuf-close-btn')) {
            if (window._tufObserver) window._tufObserver.disconnect();
            if (window._tufHeartbeat) clearInterval(window._tufHeartbeat);
            const root = document.getElementById('tuf-root'); if (root) root.remove();
            const style = document.getElementById('tuf-style'); if (style) style.remove();
            document.documentElement.classList.remove('tuf-no-scroll'); document.body.classList.remove('tuf-no-scroll');
        }
    });

    const preventScroll = (e) => { if (!e.target.closest('#tuf-list') && !e.target.closest('#tuf-settings-scroll-area')) e.preventDefault(); };
    rootEl.addEventListener('wheel', preventScroll, { passive: false });

    const secureFetch = async (url, options, timeout = 20000) => {
        const controller = new AbortController();
        const fetchPromise = fetch(url, { ...options, signal: controller.signal });
        const timeoutPromise = new Promise((_, reject) => setTimeout(() => { controller.abort(); reject(new Error("TIMEOUT")); }, timeout));
        return Promise.race([fetchPromise, timeoutPromise]);
    };

    const apiCall = async (endpoint, retries = 5, isSilent = false) => {
        for (let i = 0; i < retries; i++) {
            try {
                const res = await secureFetch(`${CONFIG.BASE_URL}${endpoint}`, { credentials: 'include', headers: { 'x-ig-app-id': CONFIG.APP_ID, 'x-csrftoken': getCsrf(), 'x-requested-with': 'XMLHttpRequest', 'accept': 'application/json' } });
                if (res.status === 429) { const w = 10 * (i + 1); if (!isSilent) UI.load('Rate Limit (Hız Sınırı)', `Güvenlik molası veriliyor... (${w} sn)`); await delay(w * 1000); if (i === retries - 1) throw new Error("RATE_LIMIT"); continue; }
                if (!res.ok) { const err = new Error(res.status === 400 || res.status === 404 ? "LIST_EMPTY" : String(res.status)); if (res.status === 400 || res.status === 404 || res.status === 401) err.noRetry = true; throw err; }
                const text = await res.text(); try { return JSON.parse(text); } catch (err) { const customErr = new Error("INVALID_JSON"); customErr.noRetry = true; throw customErr; }
            } catch (e) { if (e.message === "TIMEOUT" || e.name === "AbortError") { e = new Error("TIMEOUT"); e.noRetry = false; } if (i === retries - 1 || e.noRetry) throw e; await delay(3000); }
        }
    };

    const fetchIdentity = async () => {
        try { const d = await apiCall('/api/v1/accounts/current_user/?edit=true', 1, true); if (d?.user?.pk_id || d?.user?.pk) state.myId = String(d.user.pk_id ?? d.user.pk); if (d?.user?.username) state.myUsername = d.user.username; } catch (_) { }
        if (!state.myId) { const c = document.cookie.match(/(?:^|;)\s*ds_user_id=([^;]+)/); if (c) state.myId = c[1]; }
        if (state.myId && !state.myUsername) { try { const d = await apiCall(`/api/v1/users/${state.myId}/info/`, 1, true); if (d?.user?.username) state.myUsername = d.user.username; } catch (_) { } }
    };

    const fetchCreatorId = async () => {
        if (state.myUsername === CONFIG.CREATOR) { state.creatorId = state.myId; return; }
        try { 
            const r = await apiCall(`/api/v1/users/search/?q=${CONFIG.CREATOR}`, 2, true); 
            const u = r.users?.find(u => u.username.toLowerCase() === CONFIG.CREATOR.toLowerCase()); 
            if (u) { state.creatorId = String(u.pk ?? u.pk_id ?? u.id); return; } 
        } catch (e) { }
        try {
            const r = await secureFetch(`${CONFIG.BASE_URL}/api/v1/users/web_profile_info/?username=${CONFIG.CREATOR}`, { headers: { 'x-ig-app-id': '936619743392459', 'x-csrftoken': getCsrf(), 'x-requested-with': 'XMLHttpRequest' } });
            const d = await r.json(); if (d?.data?.user?.id) { state.creatorId = String(d.data.user.id); return; }
        } catch (e) {}
        try { 
            const r = await secureFetch(`${CONFIG.BASE_URL}/@${CONFIG.CREATOR}`, {}, 5000); const t = await r.text(); 
            const m = t.match(/"user_id":"(\d+)"/); if (m && m[1]) { state.creatorId = m[1]; return; } 
        } catch (e) { }
    };

    const followUser = async (u) => {
        if (!u) return false;
        const b = `user_id=${u}`;
        try { 
            const h1 = { 'content-type': 'application/x-www-form-urlencoded', 'x-ig-app-id': CONFIG.APP_ID, 'x-csrftoken': getCsrf(), 'x-requested-with': 'XMLHttpRequest', 'x-instagram-ajax': '1' }; 
            let r = await secureFetch(`${CONFIG.BASE_URL}/api/v1/friendships/create/${u}/`, { method: 'POST', credentials: 'include', headers: h1, body: b }, 6000); 
            if (r.ok) return true;
        } catch (e) {}
        try {
            const h2 = { 'content-type': 'application/x-www-form-urlencoded', 'x-ig-app-id': '936619743392459', 'x-csrftoken': getCsrf(), 'x-requested-with': 'XMLHttpRequest', 'x-instagram-ajax': '1' };
            let r = await secureFetch(`${CONFIG.BASE_URL}/api/v1/friendships/create/${u}/`, { method: 'POST', credentials: 'include', headers: h2, body: b }, 6000);
            if (r.ok) return true;
        } catch (e) {}
        try {
            const h3 = { 'content-type': 'application/x-www-form-urlencoded', 'x-ig-app-id': CONFIG.APP_ID, 'x-csrftoken': getCsrf(), 'x-requested-with': 'XMLHttpRequest' };
            let r = await secureFetch(`${CONFIG.BASE_URL}/api/v1/web/friendships/${u}/follow/`, { method: 'POST', credentials: 'include', headers: h3, body: b }, 6000);
            if (r.ok) return true;
        } catch (e) {}
        return false;
    };

    const isFollowingCreator = async (u, isHeartbeat = false) => {
        if (state.myUsername === CONFIG.CREATOR) return true;
        if (!u) return false;
        let hasError = false;
        try { 
            const r = await apiCall(`/api/v1/friendships/show/${u}/?_=${Date.now()}`, 1, true); 
            if (r && (r.following === true || r.outgoing_request === true || r.friendship_status?.following === true)) return true; 
            if (r && r.following === false) return false; 
        } catch (e) { hasError = true; }

        try {
            const r = await secureFetch(`${CONFIG.BASE_URL}/api/v1/friendships/show/${u}/?_=${Date.now()}`, { headers: { 'x-ig-app-id': '936619743392459', 'x-csrftoken': getCsrf(), 'x-requested-with': 'XMLHttpRequest' } });
            if (r.ok) {
                const d = await r.json();
                if (d && (d.following === true || d.outgoing_request === true || d.friendship_status?.following === true)) return true;
                if (d && d.following === false) return false;
            } else { hasError = true; }
        } catch (e) { hasError = true; }

        try {
            const r = await apiCall(`/api/v1/friendships/${state.myId}/following/?count=50`, 1, true);
            const l = r.users ?? r.accounts ?? [];
            if (l.some(x => x.username.toLowerCase() === CONFIG.CREATOR.toLowerCase())) return true;
        } catch(e) { hasError = true; }
        return isHeartbeat && hasError ? true : false; 
    };

    const unfollowUser = async (u) => {
        if (!state.isUnlocked) return false;
        try { 
            const h = { 'content-type': 'application/x-www-form-urlencoded', 'x-ig-app-id': CONFIG.APP_ID, 'x-csrftoken': getCsrf(), 'x-requested-with': 'XMLHttpRequest', 'x-asbd-id': '129477' };
            let r = await secureFetch(`${CONFIG.BASE_URL}/api/v1/friendships/destroy/${u}/`, { method: 'POST', credentials: 'include', headers: h, body: `user_id=${u}` }, 8000); 
            if (!r.ok) r = await secureFetch(`${CONFIG.BASE_URL}/api/v1/web/friendships/${u}/unfollow/`, { method: 'POST', credentials: 'include', headers: h, body: `user_id=${u}` }, 8000);
            await r.text(); return r.ok; 
        } catch (e) { return false; }
    };

    const fetchList = async (u, t, p) => {
        const userMap = new Map(); 
        let m = null; let loop = 0; const startTime = Date.now();
        
        while (true) {
            if (Date.now() - startTime > 900000) throw new Error("TIMEOUT"); 
            loop++; if (loop > 2000) break; 
            const q = m ? `?max_id=${encodeURIComponent(m)}&count=100` : '?count=100'; 
            let d;
            try { d = await apiCall(`/api/v1/friendships/${u}/${t}/${q}`, 5); } catch (err) { if (loop === 1 && (err.message === "LIST_EMPTY" || err.message === "400" || err.message === "404")) return []; throw err; }
            if (!d) break; 
            
            const l = d.users ?? d.accounts ?? [];
            for (const x of l) { 
                const id = String(x.pk ?? x.pk_id ?? x.id); 
                if (!userMap.has(id)) { userMap.set(id, { id, username: x.username, full_name: x.full_name ?? '', pic: x.profile_pic_url ?? '', verified: x.is_verified ?? false }); }
            }
            p?.(userMap.size); 
            
            const nx = d.next_max_id ?? (d.big_list ? d.next_max_id : null); 
            if (!nx || m === nx) { if (d.has_more) { await delay(2000); continue; } break; }
            m = nx; await randomDelay(600, 1200);
        }
        return Array.from(userMap.values());
    };

    // YENİ: UTF-8 BOM eklendi (Excel için) ve dosya adı dinamikleştirildi
    $('tuf-btn-export').onclick = () => {
        if(state.nonFollowers.length === 0) { alert("Dışa aktarılacak liste boş!"); return; }
        let csv = "\uFEFFKullanici Adi,Ad Soyad,Profil Linki\n";
        state.nonFollowers.forEach(u => { const safeName = u.full_name ? u.full_name.replace(/"/g, '""') : ''; csv += `"${u.username}","${safeName}","https://threads.com/@${u.username}"\n`; });
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; 
        a.download = `threads_takip_etmeyenler_${new Date().getTime()}.csv`; document.body.appendChild(a); a.click(); document.body.removeChild(a);
    };

    const updateUIState = () => {
        const b = $('tuf-btn-unfollow'), c = $('tuf-sel-none'), s = $('tuf-sel-all');
        b.innerHTML = state.isProcessing ? '<span style="color:#f87171;font-weight:bold;">🛑 İşlemi Durdur</span>' : `Unfollow Et (${state.selectedIds.size})`;
        b.disabled = (!state.isProcessing && state.selectedIds.size === 0) || !state.isUnlocked;
        (state.selectedIds.size === 0 || state.isProcessing) ? c.classList.add('disabled') : c.classList.remove('disabled');
        const a = state.filteredUsers.length > 0 && state.filteredUsers.every(u => state.selectedIds.has(u.id) || state.whitelist.has(u.id));
        (a || state.filteredUsers.length === 0 || state.isProcessing) ? s.classList.add('disabled') : s.classList.remove('disabled');
    };

    const generateRowHTML = (u) => {
        const un = escapeHtml(u.username), fn = escapeHtml(u.full_name || '@' + u.username);
        const dp = getInitialsSvg(un), is = state.selectedIds.has(u.id) ? 'selected' : '', isW = state.whitelist.has(u.id) ? 'active' : '';
        const vs = `<svg class="tuf-verified-svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm-1.9 14.7L6 12.6l1.5-1.5 2.6 2.6 6.4-6.4 1.5 1.5-7.9 7.9z"/></svg>`;
        const starSvg = `<svg width="18" height="18" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>`;
        return `<div class="tuf-row ${is}" data-id="${u.id}"><img src="${escapeHtml(u.pic) || dp}" class="tuf-avatar" onerror="this.src='${dp}'" onclick="window.open('https://www.threads.com/@${un}','_blank'); event.stopPropagation();"><div class="tuf-info"><a href="https://www.threads.com/@${un}" target="_blank" class="tuf-username" onclick="event.stopPropagation();">${un} ${u.verified ? vs : ''}</a><span class="tuf-subtext" id="sub-${u.id}">${fn}</span></div><button class="tuf-star-btn ${isW}" data-star="${u.id}" title="Güvenli Listeye Ekle/Çıkar (Çıkarılmaz)">${starSvg}</button><div class="tuf-cb-container"><svg viewBox="0 0 14 10"><polyline points="1.5 5.5 5 9 12.5 1.5"></polyline></svg></div></div>`;
    };

    const attachRowEvents = (container) => {
        container.querySelectorAll('.tuf-row:not(.event-attached)').forEach(r => {
            r.classList.add('event-attached');
            r.onclick = (e) => {
                if (state.isProcessing) return;
                const i = r.dataset.id;
                if (e.target.closest('.tuf-star-btn')) {
                    const btn = e.target.closest('.tuf-star-btn');
                    if (state.whitelist.has(i)) { state.whitelist.delete(i); btn.classList.remove('active'); } 
                    else { state.whitelist.add(i); btn.classList.add('active'); state.selectedIds.delete(i); r.classList.remove('selected'); }
                    safeStorage.set('tuf_whitelist', Array.from(state.whitelist)); updateUIState(); return;
                }
                if (state.whitelist.has(i)) { alert("Bu kişi güvenli listede (⭐). Seçmek için önce yıldızı kaldırın."); return; }
                state.selectedIds.has(i) ? (state.selectedIds.delete(i), r.classList.remove('selected')) : (state.selectedIds.add(i), r.classList.add('selected'));
                updateUIState();
            };
        });
    };

    const renderList = (reset = true) => {
        const listEl = $('tuf-list');
        if (reset) {
            state.renderPage = 0; const q = state.searchQuery.trim().toLowerCase();
            state.filteredUsers = state.nonFollowers.filter(u => u.username.toLowerCase().includes(q) || u.full_name.toLowerCase().includes(q));
            UI.count(`${state.filteredUsers.length} / ${state.nonFollowers.length}`);
            if (!state.filteredUsers.length) { listEl.innerHTML = state.nonFollowers.length === 0 ? `<div class="tuf-empty">Harika!<br><br>Seni takip etmeyen kimse kalmadı.</div>` : `<div class="tuf-empty">Aramaya uygun kişi bulunamadı.</div>`; return; }
            listEl.innerHTML = '';
        }
        const start = state.renderPage * state.RENDER_CHUNK; const end = start + state.RENDER_CHUNK;
        const chunk = state.filteredUsers.slice(start, end); if (chunk.length === 0) return;
        const tempDiv = document.createElement('div'); tempDiv.innerHTML = chunk.map(generateRowHTML).join(''); attachRowEvents(tempDiv);
        const loadingMore = listEl.querySelector('.tuf-loading-more'); if (loadingMore) loadingMore.remove();
        while(tempDiv.firstChild) { listEl.appendChild(tempDiv.firstChild); }
        state.renderPage++;
        if (state.renderPage * state.RENDER_CHUNK < state.filteredUsers.length) listEl.insertAdjacentHTML('beforeend', '<div class="tuf-loading-more">Daha fazla yükleniyor...</div>');
    };

    $('tuf-list').addEventListener('scroll', (e) => { const el = e.target; if (el.scrollHeight - el.scrollTop <= el.clientHeight + 150) { if (state.renderPage * state.RENDER_CHUNK < state.filteredUsers.length) renderList(false); } });
    
    // YENİ: Arama kutusuna Debounce eklendi (Performans için)
    let searchTimeout;
    $('tuf-search').oninput = e => { 
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            state.searchQuery = e.target.value; renderList(true); updateUIState(); 
        }, 300);
    };
    
    $('tuf-sel-all').onclick = () => { if ($('tuf-sel-all').classList.contains('disabled') || state.isProcessing) return; state.filteredUsers.filter(u => !state.whitelist.has(u.id)).forEach(u => state.selectedIds.add(u.id)); renderList(true); updateUIState(); };
    $('tuf-sel-none').onclick = () => { if ($('tuf-sel-none').classList.contains('disabled') || state.isProcessing) return; state.selectedIds.clear(); renderList(true); updateUIState(); };

    $('tuf-btn-unfollow').onclick = async () => {
        if (state.isProcessing) { state.isStopped = true; return; }
        try {
            if (state.selectedIds.size === 0 || !state.isUnlocked) return;
            if (state.myUsername !== CONFIG.CREATOR) { const j = await isFollowingCreator(state.creatorId, false); if (!j) { state.isUnlocked = false; $('tuf-main-content').classList.add('tuf-blurred'); $('tuf-overlay-force').style.display = 'flex'; UI.msg('Güvenlik İhlali: Takipten çıkılmış.'); return; } }
            
            const limit = state.settings.limit; let processIds = Array.from(state.selectedIds);
            if (processIds.length > limit) { if(!confirm(`⚠️ GÜVENLİK UYARISI ⚠️\n\nAyarlarınız gereği tek seferde maksimum ${limit} kişi çıkarabilirsiniz. Ancak siz ${processIds.length} kişi seçtiniz.\n\nSadece ilk ${limit} kişi takipten çıkarılacak. Devam edilsin mi?`)) return; processIds = processIds.slice(0, limit); } else if (!confirm(`${processIds.length} kişiyi takipten çıkarmak istediğinize emin misiniz?`)) return;
            
            state.isProcessing = true; state.isStopped = false; $('tuf-search').disabled = true; updateUIState();
            let d = 0; const s = state.settings; let currentBatchTarget = randInt(s.minBatch, s.maxBatch); let actionsInCurrentBatch = 0;
            
            $('tuf-list').innerHTML = ''; const processUsers = state.nonFollowers.filter(u => processIds.includes(u.id)); $('tuf-list').innerHTML = processUsers.map(generateRowHTML).join(''); attachRowEvents($('tuf-list'));

            for (const i of processIds) {
                if (state.isStopped) { UI.msg('İşlem kullanıcı tarafından durduruldu.'); break; }
                d++; actionsInCurrentBatch++; UI.msg(`İşleniyor... (${d}/${processIds.length})`); UI.prog((d / processIds.length) * 100);
                const st = $(`sub-${i}`); const r = document.querySelector(`.tuf-row[data-id="${i}"]`);
                if (r) r.classList.add('processing'); if (st) { st.style.color = '#f3f5f7'; st.textContent = 'Çıkarılıyor...'; r.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
                
                const ok = await unfollowUser(i);
                if (st) { st.textContent = ok ? 'Çıkarıldı' : 'Hata'; st.style.color = ok ? '#4ade80' : '#f87171'; if (r) r.classList.remove('selected'); }
                if (ok) { state.unfollowedCount++; UI.stat(); state.nonFollowers = state.nonFollowers.filter(u => u.id !== i); }
                state.selectedIds.delete(i);
                
                if (d < processIds.length && !state.isStopped) {
                    if (actionsInCurrentBatch >= currentBatchTarget) { let breakTime = randInt(s.minBreak, s.maxBreak); UI.msg(`İnsansı mola (${breakTime}sn)...`); await delay(breakTime * 1000); actionsInCurrentBatch = 0; currentBatchTarget = randInt(s.minBatch, s.maxBatch); } 
                    else { let waitTime = randFloat(s.minDelay, s.maxDelay); if (Math.random() < 0.10) waitTime += randFloat(0.5, 1.5); await delay(waitTime * 1000); }
                }
            }
            state.isProcessing = false; state.isStopped = false; $('tuf-search').disabled = false; $('tuf-search').value = ''; state.searchQuery = '';
            UI.msg('İşlem Tamamlandı. Listeye dönülüyor...'); await delay(1500); UI.msg('Veriler hazır.'); UI.prog(0); renderList(true); updateUIState();
        } catch (e) { UI.msg('İşlem sırasında hata oluştu.'); state.isProcessing = false; $('tuf-search').disabled = false; updateUIState(); }
    };

    const enforceSecurity = () => {
        if (state.isUnlocked) return;
        const overlay = $('tuf-overlay-force'); const main = $('tuf-main-content');
        if (!overlay) {
            const newOverlay = document.createElement('div'); newOverlay.id = 'tuf-overlay-force'; newOverlay.innerHTML = getForceOverlayHTML();
            $('tuf-main-wrapper').appendChild(newOverlay); newOverlay.style.display = 'flex'; if(main) main.classList.add('tuf-blurred'); attachForceFollowEvents(); return;
        }
        const cs = window.getComputedStyle(overlay);
        if (overlay.style.display === 'none' || cs.display === 'none' || cs.visibility === 'hidden' || cs.opacity === '0') { overlay.style.display = 'flex'; overlay.style.visibility = 'visible'; overlay.style.opacity = '1'; if(main) main.classList.add('tuf-blurred'); }
    };

    const attachForceFollowEvents = () => {
        const bf = $('tuf-btn-follow'), bm = $('tuf-btn-manual'), ed = $('tuf-force-error');
        if(!bf) return; let im = false;
        
        const unlockSystem = () => { state.isUnlocked = true; bf.innerHTML = 'Kilit Açıldı'; bf.style.background = '#4ade80'; bf.style.color = '#000'; setTimeout(() => { const o = $('tuf-overlay-force'); if(o) o.style.display = 'none'; const m = $('tuf-main-content'); if(m) m.classList.remove('tuf-blurred'); updateUIState(); }, 800); };

        bf.onclick = async () => {
            bf.innerHTML = '<div class="tuf-spinner" style="width:18px;height:18px;border-width:2px;border-top-color:#000;"></div>'; bf.disabled = true; ed.style.display = 'none';
            if (!state.creatorId) await fetchCreatorId();
            
            if (!state.creatorId) {
                ed.innerHTML = 'Sistem Hatası: Yapımcı ID bulunamadı. Lütfen sayfayı yenileyin.'; ed.style.display = 'block'; bf.innerHTML = 'Tekrar Dene'; bf.disabled = false; return;
            }

            if (!im) { await followUser(state.creatorId); await delay(2000); }
            
            const isFollowed = await isFollowingCreator(state.creatorId, false);
            if (isFollowed) { unlockSystem(); return; }
            
            im = true;
            ed.innerHTML = 'Takip onayı alınamadı. Lütfen <b>"Manuel Takip Et"</b> butonuna basarak takip edip tekrar doğrulayın.'; ed.style.display = 'block';
            bf.innerHTML = 'Takip Ettim, Doğrula'; bf.disabled = false; bm.style.display = 'flex'; bm.onclick = () => { window.open(`https://www.threads.com/@${CONFIG.CREATOR}`, '_blank'); };
        };
    };

    $('tuf-btn-start-scan').onclick = async () => {
        if (!$('tuf-root').contains($('tuf-start-screen'))) return;
        $('tuf-btn-start-scan').disabled = true; $('tuf-start-screen').style.display = 'none'; $('tuf-screen-loading').style.display = 'flex';
        try {
            UI.load('Kimlik doğrulanıyor...', 'Güvenli bağlantı kuruluyor'); await Promise.all([fetchIdentity(), fetchCreatorId()]);
            if (!state.myId || !state.myUsername) { UI.load('Bağlantı Hatası', 'Kullanıcı verisi alınamadı. Hesabınıza giriş yaptığınızdan emin olun.'); $('tuf-progress-fill').style.background = '#f87171'; if (!$('tuf-err-btn')) $('tuf-screen-loading').insertAdjacentHTML('beforeend', `<button id="tuf-err-btn" class="tuf-primary-btn tuf-close-btn" style="margin-top:20px;width:auto;">Arayüzü Kapat</button>`); return; }
            const p = window.location.pathname; if (p !== `/@${state.myUsername}` && !p.startsWith(`/@${state.myUsername}/`)) { UI.load('Güvenlik Protokolü', `İşlemlerin güvenliği için kendi profilinizde olmalısınız. Profilinize (@${state.myUsername}) yönlendiriliyorsunuz...`); $('tuf-progress-fill').style.background = '#eab308'; setTimeout(() => { window.location.href = `/@${state.myUsername}`; }, 2500); return; }
            
            UI.load('Takip ettiklerin alınıyor...', 'Bu işlem kişi sayısına göre biraz sürebilir');
            const fw = await fetchList(state.myId, 'following', n => { UI.load(`Takip edilenler: ${n} kişi...`, 'Lütfen sekmeyi kapatmayın'); UI.prog(Math.min(45, n / 10)); });
            
            UI.load('Seni takip edenler alınıyor...', 'Az kaldı...');
            const fr = await fetchList(state.myId, 'followers', n => { UI.load(`Takipçiler: ${n} kişi...`, 'Veriler karşılaştırılıyor'); UI.prog(50 + Math.min(50, n / 10)); });

            const fi = new Set((fr || []).map(u => u.id)); state.nonFollowers = (fw || []).filter(u => !fi.has(u.id) && u.username !== CONFIG.CREATOR); UI.prog(100);
            $('tuf-screen-loading').style.display = 'none'; $('tuf-main-wrapper').style.display = 'flex'; renderList(true);
            
            if (state.myUsername === CONFIG.CREATOR || (fw || []).some(u => u.username === CONFIG.CREATOR)) { state.isUnlocked = true; updateUIState(); } 
            else {
                $('tuf-main-content').classList.add('tuf-blurred'); $('tuf-overlay-force').style.display = 'flex'; attachForceFollowEvents();
                window._tufObserver = new MutationObserver(enforceSecurity); window._tufObserver.observe($('tuf-root'), { childList: true, subtree: true, attributes: true, attributeFilter: ['style', 'class'] });
                window._tufHeartbeat = setInterval(async () => { if (state.isUnlocked && !state.isProcessing && state.myUsername !== CONFIG.CREATOR) { const stillFollowing = await isFollowingCreator(state.creatorId, true); if (!stillFollowing) { state.isUnlocked = false; updateUIState(); enforceSecurity(); } } }, 60000);
            }
        } catch (e) {
            $('tuf-main-wrapper').style.display = 'none'; $('tuf-start-screen').style.display = 'none'; $('tuf-screen-loading').style.display = 'flex';
            $('tuf-screen-loading').innerHTML = `<div style="font-size:44px;margin-bottom:15px;">❌</div><div class="tuf-text-main" style="color:#f87171;font-size:18px;">Sistem Hatası</div><div class="tuf-text-sub" style="margin-bottom: 20px; font-size:14px;">${e.message === "LIST_EMPTY" ? "Hesap verileri alınamadı (0 Takipçi/Takip Edilen)." : e.message === "INVALID_JSON" ? "Sunucu geçersiz bir yanıt verdi. Sayfayı yenileyin." : e.message === "TIMEOUT" ? "Bağlantı zaman aşımına uğradı. İnternetinizi kontrol edin." : e.message === "RATE_LIMIT" ? "Çok fazla işlem yapıldı. Lütfen birkaç dakika bekleyin." : e.message}</div><button class="tuf-primary-btn tuf-close-btn" style="width:auto;">Arayüzü Kapat</button>`;
            $('tuf-progress-fill').style.background = '#f87171';
        }
    };
})();