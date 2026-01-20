// js/modules/home/utils.js
import { sizeMap, fetchWithAuth } from '../../utils/helper.js';

export const API_TOKEN_KEY = 'authToken';

export function getRandomClickHint() {
    const hints = [
        '../assets/img/material/click_red.gif',
        '../assets/img/material/click_yellow.gif'
    ];
    return hints[Math.floor(Math.random() * hints.length)];
}

export function getPetPhoto(base64Data) {
    if (base64Data) {
        return `data:image/jpeg;base64,${base64Data}`;
    }
    return 'assets/img/logo/Logo.png';
}

export function processImageSrc(imgData) {
    if (!imgData) return '';

    // 如果已經是 http 開頭 (網址)，直接回傳
    if (imgData.startsWith('http') || imgData.startsWith('/')) {
        // 特殊判斷：有些 API 回傳的路徑字串可能包含 Base64 特徵
        if(imgData.startsWith('/9j/')) return `data:image/jpeg;base64,${imgData}`;
        if(imgData.startsWith('iVBOR')) return `data:image/png;base64,${imgData}`;
        return imgData; 
    }

    // 判斷 Base64 類型
    if (imgData.startsWith('/9j/')) {
        return `data:image/jpeg;base64,${imgData}`;
    } else if (imgData.startsWith('iVBOR')) {
        return `data:image/png;base64,${imgData}`;
    }

    return imgData;
}

export async function handleApiFavorite(button, event, caseNumber) {
    // 1. 阻止冒泡
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }

    // 2. 檢查登入
    const token = localStorage.getItem(API_TOKEN_KEY);
    if (!token) {
        // alert('請先登入會員才能收藏案件！');
        showCustomAlert("系統提示", "請先登入會員才能收藏案件！", 1000);
        // window.location.href = '/login.html'; // 需要導向再開
        return;
    }

    // 3. 判斷目前狀態
    const heartIcon = button.querySelector('.card-heart-icon');
    const isCurrentlyFavorite = heartIcon.classList.contains('is-favorite');

    try {
        let url, method, body;

        // 4. 決定要呼叫新增還是刪除 API
        if (isCurrentlyFavorite) {
            url = `/api/members/favorites/${caseNumber}`;
            method = 'DELETE';
        } else {
            url = `/api/members/favorites/`;
            method = 'POST';
            body = JSON.stringify({ caseNumber: caseNumber });
        }

        // 5. 發送請求
        const response = await fetchWithAuth(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json'
            },
            body: body
        });

        const result = await response.json();

        // 6. 成功才變色 (UI 更新)
        if (result.success) {
            if (isCurrentlyFavorite) {
                // 變回空心
                heartIcon.classList.remove('is-favorite', 'bi-heart-fill');
                heartIcon.classList.add('bi-heart');
                // console.log(`取消收藏 ${caseNumber} 成功`);
                 showCustomAlert("系統提示", `取消收藏案號: ${caseNumber} 成功`, 1000);
            } else {
                // 變成實心
                heartIcon.classList.add('is-favorite', 'bi-heart-fill');
                heartIcon.classList.remove('bi-heart');
                // console.log(`收藏 ${caseNumber} 成功`);
                showCustomAlert("系統提示", `收藏案號: ${caseNumber} 成功`, 1000);
            }
        } else {
            console.error('收藏操作失敗:', result.message);
            showCustomAlert("系統提示", "操作失敗: " + result.message, 1000);
            // alert('操作失敗: ' + result.message);
        }

    } catch (error) {
        console.error('API 錯誤:', error);
        showCustomAlert("系統提示", "連線錯誤，請稍後再試", 1000);

        // alert('連線錯誤，請稍後再試');
    }
}

window.handleApiFavorite = handleApiFavorite;