// var API_TOKEN_KEY = 'authToken'; // 假設 token key 與其他頁面一致
var token = localStorage.getItem("authToken");

window.initAdoptCollect = function () {
    // 1. 判斷目前是哪個頁面，以決定呼叫哪個 API
    const pageTitle = $('.containertitle').text().trim();

    if (pageTitle === '領養收藏') {
        // 呼叫領養收藏 API
        fetchFavoriteList('/api/members/favorites/adoption/list', 'adoption');
    } else if (pageTitle === '走失收藏') {
        // 呼叫走失收藏 API (這裡假設 URL，請自行修改)
        fetchFavoriteList('/api/members/favorites/missing/list', 'missing');
        // console.warn('走失收藏 API 尚未設定，請填入正確 URL');
    }
};

/**
 * 核心函式：獲取收藏列表
 * @param {string} apiUrl - API 路徑
 * @param {string} type - 'adoption' | 'missing' 用來區分渲染細節
 */
function fetchFavoriteList(apiUrl, type) {
    // 顯示 Loading (如果有的話)
    $('#loading-spinner').show();

    $.ajax({
        url: apiUrl,
        type: 'GET',
        headers: {
            'Authorization': 'Bearer ' + token
        },
        dataType: 'json',
        success: function (response) {
            if (response.success) {
                renderFavoriteCards(response.data, type);
            } else {
                console.error("載入失敗:", response.message);
                // 可以加入 showErrorState 顯示錯誤訊息
            }
        },
        error: function (xhr) {
            console.error("API 錯誤:", xhr);
            if (xhr.status === 401 || xhr.status === 403) {
                // alert("請重新登入");
                // window.location.href = '/#login';
            }
        }
    });

}

/**
 * 渲染卡片邏輯 (修正版)
 */
function renderFavoriteCards(dataList, type) {
    // 1. 定義容器
    const $activeContainer = $('.missing-publish:not(.closed-collect-case)'); // 已收藏區塊
    const $closedContainer = $('.closed-collect-case'); // 已結案區塊

    // 2. 清空現有卡片 (只移除 .pub-card-wrapper，保留 h4 標題)
    $activeContainer.find('.pub-card-wrapper').remove();
    $activeContainer.find('.no-data-msg').remove(); // 也要清除舊的提示文字
    
    $closedContainer.find('.pub-card-wrapper').remove();
    $closedContainer.find('.no-data-msg').remove();

    $('#loading-spinner').hide();

    // 3. 遍歷資料並渲染
    if (dataList && dataList.length > 0) {
        dataList.forEach(item => {
            const cardData = item.card;
            const collectDate = item.favoritesDate ? item.favoritesDate.split('T')[0] : '';
            
            // 根據 type 決定樣板
            let cardHtml = '';
            if (type === 'adoption') {
                cardHtml = createAdoptionCardHtml(cardData, collectDate, item.isRemove);
            } else {
                cardHtml = createMissingCardHtml(cardData, collectDate, item.isRemove);
            }

            // 分流：未移除(已收藏) vs 已移除(已結案)
            if (!item.isRemove) {
                $activeContainer.append(cardHtml);
            } else {
                // 處理已結案卡片
                const $closedCard = $(cardHtml);
                // 補上已結案印章
                if ($closedCard.find('.closed-stamp-img').length === 0) {
                    $closedCard.find('.pub-card').after('<img src="../../assets/img/material/closed.png" class="closed-stamp-img" alt="已結案印章">');
                }
                $closedContainer.append($closedCard);
            }
        });
    }

    // 4. 最終檢查：如果區塊內沒有卡片，就顯示提示文字
    
    // --- 檢查「已收藏」區塊 ---
    if ($activeContainer.find('.pub-card-wrapper').length === 0) {
        $activeContainer.append('<div class="text-center my-5 text-muted fw-bold no-data-msg">目前沒有收藏紀錄</div>');
    }
    // 確保區塊是顯示的 (避免被之前的邏輯隱藏)
    $activeContainer.show();


    // --- 檢查「已結案」區塊 ---
    // 通常已結案如果沒資料，我們選擇直接隱藏整個區塊，比較美觀
    if ($closedContainer.find('.pub-card-wrapper').length === 0) {
        $closedContainer.hide(); 
    } else {
        $closedContainer.show();
    }
}

/**
 * 產生領養收藏卡片 HTML
 */

function createAdoptionCardHtml(card, date, isRemove) {
    // 處理圖片
    let imgSrc = '../../assets/img/adoption/lost1.png';
    if (card.photoUrl) {
        imgSrc = card.photoUrl;
    } else if (card.photo) {
        if (card.photo.startsWith('http') || card.photo.startsWith('data:image')) {
            imgSrc = card.photo;
        } else {
            imgSrc = `data:image/jpeg;base64,${card.photo}`;
        }
    }

    // 處理公立/個人圖示
    const sourceBadge = card.isPublic
        ? `<div class="public-Adoption memeber-center">公立 <i class="bi bi-building"></i></div>`
        : `<div class="private-Adoption memeber-center">個人 <i class="bi bi-house"></i></div>`;
    // 結案取消按鈕
    const iscloseCase = isRemove
        ? `<button class="center-floating-btn btn-close-collect" onclick="handleRemoveFavoriteClick(this, '${card.caseNumber}')"><i class="bi bi-trash3-fill"></i> 取消收藏 </button>`
        : "";

    // 詳情頁連結
    const detailLink = `/#pet-adoption-detail?casenumber=${card.caseNumber}`;

    // 定義愛心樣式 (收藏頁面預設為實心且有顏色)
    const heartClass = 'bi-heart-fill is-favorite';

    $('#loading-spinner').hide();

    // 渲染 HTML
    return `
    <div class="pub-card-wrapper" data-id="${card.caseNumber}">

        <a href="${detailLink}" class="top-link-tab favorite-page" target="_blank">
            <i class="bi bi-box-arrow-up-right"></i> 點擊前往詳細單頁
        </a>
        ${iscloseCase}
        <button class="border-0 right-heart-tab js-api-favorite-toggle" 
                data-case="${card.caseNumber}"
                onclick="handleRemoveFavoriteClick(this, '${card.caseNumber}')">
            <i class="bi bi-heart-fill card-heart-icon"></i>
        </button>

        <div class="right-action-tab btn-close-collect" onclick="handleRemoveFavoriteClick(this, '${card.caseNumber}')">
            我要取消收藏
        </div>

        <div class="pub-card">
            <div class="row g-0 h-100">
                <div class="col-md-5 img-container">
                    <img src="${imgSrc}" class="pet-img" alt="${card.petName}">
                </div>

                <div class="col-md-7 info-container">
                    <div class="case-number">
                        案件編號：<span class="highlight-text">${card.caseNumber}</span>
                    </div>

                    <div class="pet-details">
                        ${sourceBadge}

                        <p>寵物姓名：<span>${card.petName}</span></p>
                        <p>寵物種類：<span>${card.species}</span></p>
                        <p>寵物品種：<span>${card.breed}</span></p>
                        <p>飼主地點：<span>${card.region}</span></p>
                        <p>收藏日期：<span>${date}</span></p>
                    </div>
                </div>

                <button class="btn p-0 border-0 bg-transparent js-api-favorite-toggle"
                    data-case="${card.caseNumber}" 
                    onclick="handleApiFavorite(this, event, '${card.caseNumber}')">
                    
                </button>
                </div>
        </div>
    </div>
    `;
}
function createMissingCardHtml(card, date, isRemove) {
    // 處理圖片
    let imgSrc = '../../assets/img/adoption/lost1.png';
    if (card.photoUrl) {
        imgSrc = card.photoUrl;
    } else if (card.photo) {
        if (card.photo.startsWith('http') || card.photo.startsWith('data:image')) {
            imgSrc = card.photo;
        } else {
            imgSrc = `data:image/jpeg;base64,${card.photo}`;
        }
    }

    // 詳情頁連結
    const detailLink = `/#pet-missing-detail?casenumber=${card.caseNumber}`;


    // 結案取消按鈕
    const iscloseCase = isRemove
        ? `<button class="center-floating-btn btn-close-collect"  onclick="handleRemoveFavoriteClick(this, '${card.caseNumber}')"><i class="bi bi-trash3-fill"></i> 取消收藏 </button>`
        : "";



    // 定義愛心樣式 (收藏頁面預設為實心且有顏色)

    $('#loading-spinner').hide();

    // 渲染 HTML
    return `
    <div class="pub-card-wrapper" data-id="${card.caseNumber}">

        <a href="${detailLink}" class="top-link-tab favorite-page" target="_blank">
            <i class="bi bi-box-arrow-up-right"></i> 點擊前往詳細單頁
        </a>
        ${iscloseCase}
           <button class="border-0 right-heart-tab js-api-favorite-toggle" 
                data-case="${card.caseNumber}"
                onclick="handleRemoveFavoriteClick(this, '${card.caseNumber}')">
            <i class="bi bi-heart-fill card-heart-icon"></i>
        </button>

        <div class="right-action-tab btn-close-collect" onclick="handleRemoveFavoriteClick(this, '${card.caseNumber}')">
            我要取消收藏
        </div>

        <div class="pub-card">
            <div class="row g-0 h-100">
                <div class="col-md-5 img-container">
                    <img src="${imgSrc}" class="pet-img" alt="${card.petName}">
                </div>

                <div class="col-md-7 info-container">
                    <div class="case-number">
                        案件編號：<span class="highlight-text">${card.caseNumber}</span>
                    </div>

                    <div class="pet-details">

                        <p>寵物姓名：<span>${card.petName}</span></p>
                        <p>寵物種類：<span>${card.species}</span></p>
                        <p>寵物品種：<span>${card.breed}</span></p>
                        <p>走失地點：<span>${card.lostRegion}</span></p>
                        <p>收藏日期：<span>${date}</span></p>
                    </div>
                </div>

                <button class="btn p-0 border-0 bg-transparent js-api-favorite-toggle"
                    data-case="${card.caseNumber}" 
                    onclick="handleApiFavorite(this, event, '${card.caseNumber}')">
                    
                </button>
                </div>
        </div>
    </div>
    `;
}
// ================= 互動事件邏輯 =================

// 1. 卡片點擊展開/收合 (共用)
$(document).on('click', '.pub-card-wrapper', function (e) {
    if ($(e.target).closest('button, a, .right-action-tab').length) {
        return;
    }
    $('.pub-card-wrapper').not(this).removeClass('is-expanded');
    $(this).toggleClass('is-expanded');
});

// 2. 處理取消收藏點擊 (呼叫 Modal)
window.handleRemoveFavoriteClick = function (element, caseNumber) {
    // 阻止冒泡
    if (event) event.stopPropagation();

    // 將案件編號存入 Modal 的確認按鈕
    $('#confirmRemoveBtn').data('case-id', caseNumber);

    // 更新 Modal 文字
    $('#cardremove_modal .modal-title').html(`
        您是否確定取消收藏案件 ${caseNumber}?
    `);

    // 顯示 Modal
    // const modal = new bootstrap.Modal(document.getElementById('cardremove_modal'));
    // modal.show();

     const modalElement = document.getElementById('cardremove_modal');
    let modal = bootstrap.Modal.getInstance(modalElement);
    
    if (!modal) {
        modal = new bootstrap.Modal(modalElement);
    }
    
    modal.show();
};

// 3. Modal 內的「確定」按鈕監聽
// 確保只綁定一次，避免重複觸發
$('#confirmRemoveBtn').off('click').on('click', function () {
    const caseNum = $(this).data('case-id');
    if (caseNum) {
        performRemoveFavorite(caseNum);

        // 關閉 Modal
        const modalEl = document.getElementById('cardremove_modal');
        const modal = bootstrap.Modal.getInstance(modalEl);
        modal.hide();
    }
});

// 4. 實際執行取消收藏 API
function performRemoveFavorite(caseNumber) {
    // TODO: 請填寫正確的取消收藏 API URL
    // 通常是 DELETE 方法，或者是 POST/PATCH 帶狀態
    const apiUrl = `/api/members/favorites/${caseNumber}`;

    // 如果你的取消收藏邏輯是跟 "加入收藏" 同一支 API (Toggle)，請改用那一支

    $.ajax({
        url: apiUrl,
        type: 'DELETE', // 或 POST
        headers: {
            'Authorization': 'Bearer ' + token
        },
        success: function (response) {
            // 假設後端回傳 success: true
            showCustomAlert("系統提示", "已取消收藏", 1000);
            // alert("已取消收藏");

            // 重新整理列表 (最簡單的做法)
            // location.reload(); 
            // 或者用 JS 移除該卡片 DOM 元素 (效能較好)
            $(`div[data-id="${caseNumber}"]`).remove();
        },
        error: function (xhr) {
            console.error(xhr);
            showCustomAlert("系統提示", "取消收藏失敗，請稍後再試", 1000);

            // alert("取消失敗，請稍後再試");
        }
    });
}