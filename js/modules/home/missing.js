// ==========================================
// 2. 走失協尋 (Missing) 邏輯
// ==========================================
import { fetchApi } from '../../utils/helper.js';

import { getPetPhoto, getRandomClickHint, API_TOKEN_KEY } from './utils.js'; // 引入工具

import { missing_initMarquee } from './marquee.js';
export async function loadMissingData() {
    try {

        // ajaxApi(url, method = 'GET', data)
        const token = localStorage.getItem('authToken'); 

        const headers = {
            'Content-Type': 'application/json',
            'Authorization' : `Bearer ${token}`
        };

        // if (token) {
        //     headers['Authorization'] = `Bearer ${token}`;
        // }

        // 4. 發送請求
        const response = await fetch('/api/cases/missing/home', {
            method: 'GET', // 明確指定 GET
            headers: headers //帶入上面準備好的 headers
        });
        const result = await response.json();

        if (result.success) {
            const track = document.getElementById('index_marqueeTrack_missing');
            let htmlContent = '';

            result.data.forEach(item => {
                const hintGif = getRandomClickHint();
                const photoSrc = getPetPhoto(item.photo);

                // 處理日期格式 (取 YYYY-MM-DD)
                const lostDate = item.lostDate ? item.lostDate.split('T')[0] : '未知';

                // 判斷是否已收藏
                const heartClass = item.isFavorites
                    ? 'bi-heart-fill is-favorite'
                    : 'bi-heart';

                htmlContent += `
                    <div class="index-card">
                        <a class="index_card_herf" href="#pet-missing-detail?casenumber=${item.caseNumber}">
                            <div class="lost-pet-card">
                                <div class="card-image-wrapper">
                                    <img src="${photoSrc}" alt="${item.petName}" class="card-image">
                                    <div class="heart-icon-wrapper">
                                        <button class="btn p-0 border-0 bg-transparent js-api-favorite-toggle" 
                                                data-case="${item.caseNumber}"
                                                onclick="handleApiFavorite(this, event, '${item.caseNumber}')">
                                            <i class="bi card-heart-icon ${heartClass}"></i>
                                        </button>
                                    </div>
                                </div>
                                <div class="card-info">
                                    <h3 class="pet-name">${item.petName}</h3>
                                    <p class="detail-item">走失時間: <span class="detail-value">${lostDate}</span></p>
                                    <p class="detail-item">走失地: <span class="detail-value">${item.lostRegion || '未知'}</span></p>
                                    <p class="detail-item">物種: <span class="detail-value">${item.species || '未知'}</span></p>
                                    <p class="detail-item">品種: <span class="detail-value">${item.breed}</span></p>
                                    <img src="${hintGif}" class="click-hint-gif" alt="click hint">
                                </div>
                            </div>
                        </a>
                    </div>
                `;
            });

            track.innerHTML = htmlContent;

            // 資料載入完成後，啟動跑馬燈
            if (typeof missing_initMarquee === 'function') {
                missing_initMarquee();
            }
        }
        
    } catch (error) {
        console.error('走失資料載入失敗:', error);
    }
}