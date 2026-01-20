// ==========================================
// 全域彈窗功能 (Auto-Injected Modal)
// ==========================================

let alertTimeout = null;

/**
 * 內部函式：負責把 HTML 塞進 body (如果還沒塞過的話)
 */
function ensureAlertHtmlExists() {
    // 檢查是否已經有這個 ID 的元素
    if (document.getElementById('customAlertOverlay')) {
        return; // 已經有了，就不重複建立
    }

    // 建立 HTML 字串
    const alertHtml = `
        <div id="customAlertOverlay" class="custom-alert-overlay" style="display: none;">
            <div class="custom-alert-box">
                <div class="custom-alert-header">
                    <h3 id="customAlertTitle">提示</h3>
                </div>
                <div class="custom-alert-body">
                    <p id="customAlertMessage">內容文字</p>
                </div>
                <div class="custom-alert-footer">
                    <button id="customAlertBtn">確認</button>
                </div>
            </div>
        </div>
    `;

    // 把它插入到 body 的最後面
    document.body.insertAdjacentHTML('beforeend', alertHtml);

    // 綁定關閉事件 (因為是用字串生成的，要重新抓元素綁定)
    document.getElementById('customAlertBtn').addEventListener('click', closeCustomAlert);
}

/**
 * 顯示彈窗
 */
 function showCustomAlert(title, htmlContent, autoCloseDelay = 3000) {
    // 1. 先確保 HTML 存在 (這行是關鍵！)
    ensureAlertHtmlExists();

    const overlay = document.getElementById('customAlertOverlay');
    const titleEl = document.getElementById('customAlertTitle');
    const msgEl = document.getElementById('customAlertMessage');

    titleEl.textContent = title;
    msgEl.innerHTML = htmlContent;

    overlay.style.display = 'flex';

    // 清除舊的計時器
    if (alertTimeout) {
        clearTimeout(alertTimeout);
    }

    // 設定自動關閉
    if (autoCloseDelay > 0) {
        alertTimeout = setTimeout(() => {
            closeCustomAlert();
        }, autoCloseDelay);
    }
}

/**
 * 關閉彈窗
 */
 function closeCustomAlert() {
    const overlay = document.getElementById('customAlertOverlay');
    if (overlay) {
        overlay.style.display = 'none';
    }
    
    if (alertTimeout) {
        clearTimeout(alertTimeout);
        alertTimeout = null;
    }
}

// 掛載到 window 讓全域可用 (選用)
window.showCustomAlert = showCustomAlert;
window.closeCustomAlert = closeCustomAlert;