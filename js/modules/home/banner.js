
import { processImageSrc } from './utils.js';

export async function fetchBanners() {
    try {
        const response = await fetch('/api/banners/active');
        const result = await response.json();

        // 確認 API 回傳成功且有資料
        if (result.success && result.data && result.data.length > 0) {
            renderCarousel(result.data);
            return true;
        } else {
            console.warn('API 回傳成功但無 Banner 資料');
        }
    } catch (error) {
        console.error('取得 Banner 失敗:', error);
        return false;
    }
}

// function renderCarousel(banners) {
//     const carouselElement = document.querySelector('#index_carousel');
//     const indicatorsContainer = document.querySelector('#index_carousel .carousel-indicators');
//     const innerContainer = document.querySelector('#index_carousel .carousel-inner');


//     if (!carouselElement) return;

//     // 1. 先清空目前的靜態內容 (Loading 或 Placeholder)
//     indicatorsContainer.innerHTML = '';
//     innerContainer.innerHTML = '';

//     banners.forEach((banner, index) => {
//         const isActive = index === 0 ? 'active' : '';

//         // --- 建立下方指示點 (Indicators) ---
//         const button = document.createElement('button');
//         button.type = 'button';
//         button.dataset.bsTarget = '#index_carousel';
//         button.dataset.bsSlideTo = index;
//         button.className = isActive; // 第一個加上 active
//         button.ariaLabel = `Slide ${index + 1}`;
//         if (index === 0) button.setAttribute('aria-current', 'true');

//         indicatorsContainer.appendChild(button);

//         // --- 處理圖片來源 (Base64 自動補全前綴) ---
//         const imgSrcLg = processImageSrc(banner.bannerLg);
//         const imgSrcSm = processImageSrc(banner.bannerSm);

//         // --- 建立輪播項目 (Carousel Item) ---
//         const itemDiv = document.createElement('div');
//         itemDiv.className = `carousel-item ${isActive}`;

//         // 判斷是否有連結，如果有就包一層 <a>
//         let contentHtml = '';

//         // 桌面版圖片 (lg)
//         const imgLg = `<img src="${imgSrcLg}" class="d-none d-lg-block w-100 index_carousel_img" alt="${banner.title || 'Banner'}">`;

//         // 手機版圖片 (sm) - 如果沒傳手機版圖，為了避免破圖，可以 fallback 用桌面版圖
//         const imgSm = `<img src="${imgSrcSm || imgSrcLg}" class="d-block d-lg-none w-100 index_carousel_img" alt="${banner.title || 'Banner'}">`;

//         if (banner.linkUrl) {
//             contentHtml = `
//                 <a href="${banner.linkUrl}" target="_blank">
//                     ${imgSm}
//                     ${imgLg}
//                 </a>
//             `;
//         } else {
//             contentHtml = imgSm + imgLg;
//         }

//         itemDiv.innerHTML = contentHtml;
//         innerContainer.appendChild(itemDiv);

        
//     });

//     if (window.bootstrap) {
//             // 1. 先嘗試抓取現有的實體
//             const oldInstance = bootstrap.Carousel.getInstance(carouselElement);

//             // 2. 如果舊的還在，先把它「殺掉 (dispose)」，清除舊的事件綁定
//             if (oldInstance) {
//                 oldInstance.dispose();
//             }

//             // 3. 建立一個全新的實體 (手動設定參數，不依賴 HTML)
//             const newInstance = new bootstrap.Carousel(carouselElement, {
//                 interval: 4000,   // 秒數
//                 ride: 'carousel', // 告訴它這是一個輪播
//                 pause: 'hover',   // 滑鼠指上去暫停
//                 wrap: true        // 是否循環
//             });

//             // 4. 強制踢它一腳，叫它開始跑
//             newInstance.cycle();

//             // 額外保險：如果它還是偷懶，手動跳轉到第一張並開始
//             newInstance.to(0);
//         }
// }



function renderCarousel(banners) {
    // 1. ★ 變數宣告一定要在函式最上方，確保全域都抓得到 ★
    const carouselElement = document.querySelector('#index_carousel');
    const indicatorsContainer = document.querySelector('#index_carousel .carousel-indicators');
    const innerContainer = document.querySelector('#index_carousel .carousel-inner');

    // 防呆：如果 DOM 元素不存在就停止
    if (!carouselElement || !indicatorsContainer || !innerContainer) return;

    // 清空舊內容
    indicatorsContainer.innerHTML = '';
    innerContainer.innerHTML = '';

    banners.forEach((banner, index) => {
        const isActive = index === 0 ? 'active' : '';

        // 建立指示點
        const button = document.createElement('button');
        button.type = 'button';
        button.dataset.bsTarget = '#index_carousel';
        button.dataset.bsSlideTo = index;
        button.className = isActive;
        button.ariaLabel = `Slide ${index + 1}`;
        if (index === 0) button.setAttribute('aria-current', 'true');
        indicatorsContainer.appendChild(button);

        // 處理圖片
        const imgSrcLg = processImageSrc(banner.bannerLg);
        const imgSrcSm = processImageSrc(banner.bannerSm);
        
        // 建立 Item
        const itemDiv = document.createElement('div');
        itemDiv.className = `carousel-item ${isActive}`;
        // ★ 建議加上 style 設定背景色，避免圖片載入前是全白的
        itemDiv.style.backgroundColor = "#f0f0f0"; 

        const imgLg = `<img src="${imgSrcLg}" class="d-none d-lg-block w-100 index_carousel_img" alt="${banner.title || 'Banner'}">`;
        const imgSm = `<img src="${imgSrcSm || imgSrcLg}" class="d-block d-lg-none w-100 index_carousel_img" alt="${banner.title || 'Banner'}">`;

        let contentHtml = banner.linkUrl ? 
            `<a href="${banner.linkUrl}" target="_blank">${imgSm}${imgLg}</a>` : 
            (imgSm + imgLg);

        itemDiv.innerHTML = contentHtml;
        innerContainer.appendChild(itemDiv);
    });

    // 啟動 Bootstrap 輪播
    if (window.bootstrap) {
        const oldInstance = bootstrap.Carousel.getInstance(carouselElement);
        if (oldInstance) oldInstance.dispose();

        const newInstance = new bootstrap.Carousel(carouselElement, {
            interval: 4000,
            ride: 'carousel',
            pause: 'hover',
            wrap: true
        });
        newInstance.cycle();
    }
}
