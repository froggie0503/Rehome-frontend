// ========== 全域變數 ==========
/**
 * 儀表板資料物件
 * @type {Object|null}
 * @property {Object} cases - 案例統計 { lost, adoption, surrender }
 * @property {Object} adoptions - 送養統計 { thisMonth, lastMonth }
 * @property {Object} listings - 刊登統計 { thisMonth, lastMonth }
 * @property {Object} views - 瀏覽數統計 { labels: [], data: [] }
 */
let dashboardData = null;

/**
 * Chart.js 圖表實例
 * @type {Object}
 */
const charts = {
    casesChart: null,    // 案例圓餅圖
    viewsChart: null     // 瀏覽數折線圖
};

// ========== DOM 載入完成後初始化 ==========
document.addEventListener('DOMContentLoaded', function() {
    // 載入 Header 和 Sidebar 元件
    Promise.all([
        loadComponent('.header', 'components/header.html'),
        loadComponent('.sidebar', 'components/sidebar.html')
    ]).then(() => {
        initSidebarToggle();
        initializeDashboard();
    }).catch(error => {
        console.error('✗ 元件載入失敗:', error);
    });
});

// ========== 儀表板初始化 ==========
/**
 * 初始化儀表板
 * 執行順序：載入資料 → 更新統計數據 → 渲染圖表
 * 若後端 API 失敗則自動切換至模擬資料
 */
async function initializeDashboard() {
    try {
        // 步驟 1: 從後端 API 載入儀表板資料
        await loadDashboardData();
        
        // 步驟 2: 更新頁面上的統計數字
        updateStatistics();
        
        // 步驟 3: 渲染圖表
        renderCasesChart();
        renderViewsChart();
        
    } catch (error) {
        console.error('初始化儀表板失敗:', error);
        alert('載入儀表板資料失敗，請確認已登入並重新整理頁面');
    }
}

// ========== 資料載入：從後端 API ==========
/**
 * 從後端 API 載入儀表板資料
 * @async
 * @throws {Error} 當 API 回應失敗時拋出錯誤
 * 
 * API 端點: GET /api/dashboard/statistics
 * 預期回應格式:
 * {
 *   cases: { lost: number, adoption: number, surrender: number },
 *   adoptions: { thisMonth: number, lastMonth: number },
 *   listings: { thisMonth: number, lastMonth: number },
 *   views: { labels: string[], data: number[] }
 * }
 */
async function loadDashboardData() {
    try {
        // 從 localStorage 取得使用者資料和 JWT token
        const authToken = localStorage.getItem('authToken');
        
        if (!authToken) {
            throw new Error('未登入或 Token 不存在');
        }
        
        const response = await fetch('/api/dashboard/statistics', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP Error: ${response.status}`);
        }
        
        dashboardData = await response.json();
        
    } catch (error) {
        console.error('從後端載入資料失敗:', error);
        // 拋出錯誤由 initializeDashboard 處理
        throw error;
    }
}

// ========== 資料載入：模擬資料 (開發/測試用) ==========
/**
 * 載入模擬資料
 * 用途：開發階段測試、後端 API 尚未完成、或 API 失敗時的備用方案
 * 
 * 注意：正式環境應確保後端 API 正常運作，避免使用模擬資料
 */
// function loadMockData() {
//     dashboardData = {
//         // 案例統計
//         cases: {
//             lost: 30,       // 走失協尋案例數
//             adoption: 50,   // 領養案例數
//             surrender: 20   // 送養案例數
//         },
//         // 本月 vs 上月送養統計
//         adoptions: {
//             thisMonth: 20,  // 本月成功送養數量
//             lastMonth: 10   // 上月成功送養數量
//         },
//         // 本月 vs 上月刊登統計
//         listings: {
//             thisMonth: 30,  // 本月新增刊登數
//             lastMonth: 15   // 上月新增刊登數
//         },
//         // 全年度瀏覽數趨勢
//         views: {
//             labels: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
//             data: [90000, 80000, 15000, 160000, 190000, 60000, 55000, 90000, 85000, 90000, 150000, 120000]
//         }
//     };
    
//     console.log('⚠ 使用模擬資料 (Mock Data)');
    
//     // 載入完成後更新統計與圖表
//     updateStatistics();
//     renderCasesChart();
//     renderViewsChart();
// }

// ========== 統計數據更新 ==========
/**
 * 更新頁面上所有統計數字
 * 包含：總案例數、本月/上月送養數、變化量、刊登數等
 * 
 * DOM 元素對應：
 * - totalCasesText: 圓餅圖中央的總案例數
 * - thisMonthAdoptions: 本月送養大數字
 * - lastMonthAdoptions: 上月送養數值
 * - adoptionsChange: 送養變化量 (增加/減少)
 * - lastMonthListings: 上月刊登數值
 * - listingsChange: 刊登變化量 (增加/減少)
 */
function updateStatistics() {
    // 資料未載入時不執行
    if (!dashboardData) {
        console.warn('dashboardData 尚未載入，無法更新統計數據');
        return;
    }
    
    // 計算總案例數 (走失 + 領養 + 送養)
    const totalCases = dashboardData.cases.lost + 
                       dashboardData.cases.adoption + 
                       dashboardData.cases.surrender;
    
    // 計算本月與上月的變化量
    const adoptionsDiff = dashboardData.adoptions.thisMonth - 
                         dashboardData.adoptions.lastMonth;
    const listingsDiff = dashboardData.listings.thisMonth - 
                        dashboardData.listings.lastMonth;
    
    // 更新 DOM 元素的文字內容
    updateElement('totalCasesText', totalCases);
    updateElement('thisMonthAdoptions', dashboardData.adoptions.thisMonth);
    updateElement('lastMonthAdoptions', dashboardData.adoptions.lastMonth);
    updateElement('adoptionsChange', formatChange(adoptionsDiff, '筆'));
    updateElement('lastMonthListings', dashboardData.listings.lastMonth);
    updateElement('listingsChange', formatChange(listingsDiff, '案例', '筆'));
}

// ========== 工具函數 ==========

/**
 * 更新指定 ID 的 DOM 元素文字內容
 * @param {string} id - DOM 元素的 ID
 * @param {string|number} value - 要設定的文字內容
 */
function updateElement(id, value) {
    const element = document.getElementById(id);
    if (element) {
        element.textContent = value;
    } else {
        console.warn(`找不到 ID 為 "${id}" 的元素`);
    }
}

/**
 * 格式化變化量文字
 * @param {number} diff - 差異值 (正數表示增加，負數表示減少)
 * @param {string} label1 - 第一個標籤文字 (可選)
 * @param {string} label2 - 第二個標籤文字 (可選)
 * @returns {string} 格式化後的文字，例如："(+ 增加 10 筆)" 或 "(- 減少 5 案例)"
 * 
 * 使用範例：
 * formatChange(10, '筆') → "(+ 增加 10 筆)"
 * formatChange(-5, '案例', '筆') → "(- 減少 案例 5 筆)"
 */
function formatChange(diff, label1 = '', label2 = '') {
    const sign = diff >= 0 ? '+' : '-';
    const action = diff >= 0 ? '增加' : '減少';
    const absValue = Math.abs(diff);
    const text = label2 ? `${label1} ${absValue} ${label2}` : `${absValue} ${label1}`;
    return `(${sign} ${action} ${text})`;
}

// ========== 圖表渲染：案例統計圓餅圖 (Doughnut Chart) ==========
/**
 * 渲染案例統計圓餅圖
 * 顯示走失協尋、領養、送養三種案例的分布比例
 * 
 * 圖表特性：
 * - 類型：甜甜圈圖 (Doughnut)
 * - 中央空洞：70% (cutout)
 * - 顏色配置：橘色 (#F59E0B)、黑色 (#000000)、灰色 (#a7a9ae)
 * - Tooltip：顯示數量和百分比
 * 
 * 注意：如果已存在圖表實例，應先銷毀再重新渲染以避免記憶體洩漏
 */
function renderCasesChart() {
    // 檢查資料是否已載入
    if (!dashboardData) {
        // console.warn('⚠ dashboardData 尚未載入，無法渲染案例圖表');
        return;
    }
    
    // 取得 Canvas 元素
    const ctx = document.getElementById('casesChart');
    if (!ctx) {
        // console.error('✗ 找不到 casesChart 元素');
        return;
    }
    
    // 如果已存在圖表，先銷毀
    if (charts.casesChart) {
        charts.casesChart.destroy();
    }
    
    // 建立新的圓餅圖實例
    charts.casesChart = new Chart(ctx.getContext('2d'), {
        type: 'doughnut',
        data: {
            labels: ['走失協尋', '領養', '送養'],
            datasets: [{
                data: [
                    dashboardData.cases.lost,
                    dashboardData.cases.adoption,
                    dashboardData.cases.surrender
                ],
                backgroundColor: ['#F59E0B', '#000000', '#a7a9ae'],
                borderWidth: 0,
                cutout: '70%'  // 中央空洞大小
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { 
                    display: false  // 隱藏預設圖例，使用自訂 HTML 圖例
                },
                tooltip: {
                    callbacks: {
                        // 自訂 Tooltip 格式：顯示「標籤: 數量 (百分比%)」
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.parsed || 0;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                            return `${label}: ${value} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
    
    // console.log('✓ 案例圓餅圖渲染完成');
}

// ========== 圖表渲染：瀏覽數折線圖 (Line Chart) ==========
/**
 * 渲染登入瀏覽數折線圖
 * 顯示全年度 (或指定期間) 的瀏覽數趨勢
 * 
 * 圖表特性：
 * - 類型：折線圖 (Line)
 * - 曲線：平滑曲線 (tension: 0.3)
 * - 填充：底部漸層填充
 * - 顏色：主色調 #8D7058
 * - Y軸：自動轉換為 k (千) 單位顯示
 * - Tooltip：顯示完整數字並加入千分位逗號
 * 
 * 注意：如果已存在圖表實例，應先銷毀再重新渲染以避免記憶體洩漏
 */
function renderViewsChart() {
    // 檢查資料是否已載入
    if (!dashboardData) {
        // console.warn('⚠ dashboardData 尚未載入，無法渲染瀏覽數圖表');
        return;
    }
    
    // 取得 Canvas 元素
    const ctx = document.getElementById('viewsChart');
    if (!ctx) {
        // console.error('✗ 找不到 viewsChart 元素');
        return;
    }
    
    // 如果已存在圖表，先銷毀
    if (charts.viewsChart) {
        charts.viewsChart.destroy();
    }
    
    // 建立新的折線圖實例
    charts.viewsChart = new Chart(ctx.getContext('2d'), {
        type: 'line',
        data: {
            labels: dashboardData.views.labels,
            datasets: [{
                label: '登入瀏覽數',
                data: dashboardData.views.data,
                borderColor: '#8D7058',              // 線條顏色
                backgroundColor: 'rgba(141, 112, 88, 0.1)',  // 填充顏色 (半透明)
                tension: 0.3,                        // 曲線平滑度 (0=直線, 1=最平滑)
                fill: true,                          // 啟用底部填充
                pointBackgroundColor: '#FFFFFF',     // 資料點背景色
                pointBorderColor: '#8D7058',         // 資料點邊框色
                pointBorderWidth: 2,                 // 資料點邊框寬度
                pointRadius: 4,                      // 資料點半徑
                pointHoverRadius: 6                  // 滑鼠懸停時資料點半徑
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { 
                    display: false  // 隱藏圖例
                },
                tooltip: {
                    callbacks: {
                        // 自訂 Tooltip 格式：顯示千分位逗號
                        label: function(context) {
                            const value = context.parsed.y.toLocaleString('zh-TW');
                            return `瀏覽數: ${value}`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,  // Y軸從 0 開始
                    ticks: {
                        // Y軸數字格式化：1000 以上顯示為 "1k"
                        callback: function(value) {
                            return value >= 1000 ? (value / 1000) + 'k' : value;
                        }
                    }
                },
                x: {
                    grid: {
                        display: false  // 隱藏 X軸網格線
                    }
                }
            }
        }
    });
    
    // console.log('✓ 瀏覽數折線圖渲染完成');
}

// ========== Sidebar 側邊欄切換功能 (手機版) ==========

/**
 * 初始化側邊欄切換功能
 * 綁定事件：漢堡選單按鈕、遮罩層點擊、連結點擊、視窗 resize
 * 
 * 功能說明：
 * 1. 點擊漢堡按鈕：開啟/關閉側邊欄
 * 2. 點擊遮罩層：關閉側邊欄
 * 3. 點擊側邊欄連結：自動關閉側邊欄
 * 4. 視窗寬度 > 768px：自動關閉側邊欄 (切換至桌面版)
 */
function initSidebarToggle() {
    const sidebarToggle = document.getElementById('sidebarToggle');
    const sidebar = document.querySelector('.sidebar');
    const sidebarOverlay = document.getElementById('sidebarOverlay');
    
    // 檢查必要元素是否存在
    if (!sidebarToggle || !sidebar || !sidebarOverlay) {
        // console.warn('⚠ Sidebar 相關元素不完整，無法初始化切換功能');
        return;
    }
    
    // 事件 1: 點擊漢堡按鈕切換側邊欄
    sidebarToggle.addEventListener('click', function(e) {
        e.stopPropagation();  // 防止事件冒泡
        toggleSidebar();
        
        // 更新 ARIA 屬性 (無障礙)
        const isExpanded = sidebar.classList.contains('active');
        sidebarToggle.setAttribute('aria-expanded', isExpanded);
    });
    
    // 事件 2: 點擊遮罩層關閉側邊欄
    sidebarOverlay.addEventListener('click', closeSidebar);
    
    // 事件 3: 點擊側邊欄內的連結自動關閉
    sidebar.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', closeSidebar);
    });
    
    // 事件 4: 視窗大小改變時，桌面版自動關閉側邊欄
    window.addEventListener('resize', function() {
        if (window.innerWidth > 768) {
            closeSidebar();
        }
    });
}

/**
 * 切換側邊欄顯示狀態
 * 同時切換：側邊欄、遮罩層、漢堡按鈕的 'active' class
 */
function toggleSidebar() {
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    const toggle = document.getElementById('sidebarToggle');
    
    sidebar?.classList.toggle('active');
    overlay?.classList.toggle('active');
    toggle?.classList.toggle('active');
    
    // 更新遮罩層的 ARIA 屬性
    const isActive = overlay?.classList.contains('active');
    overlay?.setAttribute('aria-hidden', !isActive);
}

/**
 * 關閉側邊欄
 * 移除所有 'active' class，恢復初始狀態
 */
function closeSidebar() {
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    const toggle = document.getElementById('sidebarToggle');
    
    sidebar?.classList.remove('active');
    overlay?.classList.remove('active');
    toggle?.classList.remove('active');
    
    // 更新 ARIA 屬性
    toggle?.setAttribute('aria-expanded', 'false');
    overlay?.setAttribute('aria-hidden', 'true');
}

// ========== 自動更新資料功能 (可選) ==========

/**
 * 啟動儀表板資料自動更新
 * @param {number} intervalMinutes - 更新間隔 (分鐘)，預設 5 分鐘
 * 
 * 功能說明：
 * - 定期從後端重新載入最新資料
 * - 自動更新統計數字
 * - 圖表會保持原樣 (不重新渲染，避免閃爍)
 * 
 * 使用時機：
 * - 需要即時監控資料變化
 * - 儀表板長時間開啟
 * 
 * 注意事項：
 * - 會增加後端 API 負載，建議間隔不要太短
 * - 如需更新圖表，可在函數內加上 renderCasesChart() 和 renderViewsChart()
 * 
 * 啟用方式：取消註解最下方的 startAutoRefresh(5)
 */
function startAutoRefresh(intervalMinutes = 5) {
    const intervalMs = intervalMinutes * 60 * 1000;
    
    setInterval(async () => {
        // console.log(`⟳ 自動更新儀表板資料... (每 ${intervalMinutes} 分鐘)`);
        
        try {
            await loadDashboardData();
            updateStatistics();
            
            // 如果需要重新渲染圖表，取消註解下面兩行
            // renderCasesChart();
            // renderViewsChart();
            
        } catch (error) {
            console.error('✗ 自動更新失敗:', error);
        }
    }, intervalMs);
}

// ========== 啟用自動更新 (預設關閉) ==========
// 如需啟用自動更新功能，請取消註解下面這行
startAutoRefresh(5);  // 每 5 分鐘更新一次