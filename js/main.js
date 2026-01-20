// js/main.js
import { checkAuthBeforeRoute, AuthManager } from './utils/helper.js';
import { refreshNavbar } from './utils/navbar.js';

let currentRouteModule = null;

// ★ 工具函式：將 jQuery 的 load 轉為 Promise，讓我們可以用 await 等待它
function loadHtml(selector, url) {
    return new Promise((resolve, reject) => {
        $(selector).load(url, function (response, status, xhr) {
            if (status == "error") {
                console.error(`載入 ${url} 失敗`);
                // 失敗也 resolve，避免整個網站卡死
                resolve(); 
            } else {
                resolve();
            }
        });
    });
}

// --- 1. 載入靜態外殼 (Header, Footer...) ---
async function loadShells() {
    // 平行載入所有 HTML 片段
    await Promise.all([
        loadHtml('#header-placeholder', 'fragments/header.html'),
        loadHtml('#footer-placeholder', 'fragments/footer.html'),
        loadHtml('#floating-element', 'fragments/floatingelement.html'),
        loadHtml('#chatroom-element', 'fragments/ChatroomFinal.html'),
        loadHtml('#ui-overlay-element', 'fragments/uiOverlay.html')
    ]);
}

// --- 2. 路由處理 (回傳 Promise) ---
async function handleRouting() {
    const currentHash = window.location.hash.split('?')[0] || '';
    const route = ROUTE_MAP[currentHash];
    
    // 關閉手機版選單
    const $navbarCollapse = $('#navbarNav');
    if ($navbarCollapse.hasClass('show')) {
        $navbarCollapse.collapse('hide');
    }

    // 登入頁保護邏輯
    if (currentHash === '#login') {
        const authToken = localStorage.getItem('authToken');
        if (authToken) {
            window.location.hash = '#home';
            return;
        }
    }

    if (!route) {
        window.location.hash = '#home';
        return;
    }

    if (currentHash.indexOf('admin') != -1) {
        if (AuthManager.hasPermission(['admin'])) {
            loadRoute(route)
        } else {  
            window.location.hash = '#home';
        }
        return
    }

    // 權限檢查
    const canAccess = await checkAuthBeforeRoute(route);
    if (!canAccess) {
        window.location.hash = '#home';
        return;
    }

    // ==============================================
    // ★ 關鍵修改：區分「首次載入」與「頁面切換」
    // ==============================================

    if (isAppInitialized) {
        loadRoute(route);
    } else {
        // === 情境 B：首次進入網站 (由 initApp 控制全域淡入) ===
        // 這裡不需要做任何動畫控制，只要乖乖載入資料就好
        // initApp 會等到這裡 await 結束後，統一加上 body.app-loaded
        
        await loadHtml('#main-content-area', route.contentFile);
        window.scrollTo({ top: 0, behavior: "auto" });
        await runRouteModule(route.moduleJS);
    }
}

async function loadRoute(route) {
        // === 情境 A：已經在站內，正在切換頁面 ===
        // 我們不希望 Header/Footer 閃爍，只對 Main Content 做淡出淡入
    const $contentArea = $('#main-content-area');
    
    // 1. 先淡出舊內容 (加上 CSS class)
    $contentArea.addClass('fade-out');
    
    // 2. 稍微等待淡出動畫完成 (配合 CSS transition 0.3s)
    // 這能確保舊內容消失後，使用者才感覺到內容在切換
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // 3. 載入新 HTML
    await loadHtml('#main-content-area', route.contentFile);
    
    // 4. 滾動置頂 (在內容還是透明的時候滾動，使用者不會覺得突兀)
    window.scrollTo({ top: 0, behavior: "auto" });

    // 5. 載入新 JS (例如 Banner 初始化)
    await runRouteModule(route.moduleJS);

    // 6. 淡入新內容
    // 使用 requestAnimationFrame 確保 DOM 渲染後才移除 class，觸發 CSS transition
    requestAnimationFrame(() => {
        $contentArea.removeClass('fade-out');
    });
}

// --- 3. 載入模組 JS ---
async function runRouteModule(modulePath) {
    if (!modulePath) return;
    try {
        const module = await import(`/${modulePath}`);
        if (typeof module.init === 'function') {
            // 這邊會等待 index.js 的 init()，也就是等待 fetchBanners()
            await module.init(); 
        }
        currentRouteModule = module;
    } catch (err) {
        console.error('模組載入失敗:', modulePath, err);
    }
}

// ==========================================
// ★ 總指揮：初始化 App (Entry Point)
// ==========================================
let isAppInitialized = false;

async function initApp() {
    console.time("AppInit");

    // 1. 先載入 Header/Footer 的「HTML 殼」
    await loadShells();

    // 2. 「平行」執行最重要的兩個任務：
    //    A. refreshNavbar: 驗證 Token、拿使用者頭像 (決定 Nav 長怎樣)
    //    B. handleRouting: 拿首頁 HTML、拿 Banner 資料 (決定 Main 長怎樣)
    
    await Promise.all([
        refreshNavbar(), // 這是你 navbar.js 匯出的函式 (它是 async 的，會等 API)
        handleRouting()  // 這是上面的函式 (它會等 Banner)
    ]);

    // 3. 到了這裡，Header 有名字了，Main 也有 Banner 了
    //    終於可以「一起」淡入顯示！
    document.body.classList.add('app-loaded');
    
    isAppInitialized = true;
    console.timeEnd("AppInit");
}

// 啟動！
initApp();

// 監聽後續的路由變化
$(window).on('hashchange', handleRouting);