// js/modules/home/index.js

// 匯入其他小弟
import { loadAdoptionData } from './adoption.js';
import { loadMissingData } from './missing.js'; 
import { loadQnaData } from './qna.js';           
import { fetchBanners } from './banner.js';           

// 定義一個主要的啟動函式
export async function init() {
    console.log("首頁模組初始化...");
    
    // await Promise.all([
    //     loadAdoptionData(),
    //     loadMissingData(),
    //     loadQnaData(),
    //     fetchBanners()
    // ]);
    try {
        // 1. 【關鍵路徑】只等待 Banner
        // 因為 Banner 佔據首頁最大視覺面積，它好了，使用者就會覺得「網頁好了」。
        await fetchBanners(); 
        
    } catch (e) {
        console.error("Banner 載入異常，但繼續執行後續", e);
    }

    // 2. 【背景執行】列表資料
    // 這些不需要 await，讓它們在背景去 fetch。
    // 這時候 main.js 已經會收到 init() 結束的訊號，開始淡入畫面。
    // 使用者會先看到 Banner，往下滑的時候，列表剛好載入完成。
    loadAdoptionData();
    loadMissingData();
    loadQnaData();

}

// === 關鍵點 ===
// 因為這是 ES Module，載入時會自動執行
// 但為了確保 HTML 已經載入，通常 Router 會處理好
// 這裡直接執行 initHome()
// init();