import { sizeMap, fetchWithAuth } from '../../utils/helper.js';
import { getPetPhoto, getRandomClickHint, API_TOKEN_KEY } from './utils.js'; // 引入工具
import { index_initMarquee } from './marquee.js';
export async function loadAdoptionData() {
    try {
        const token = localStorage.getItem('authToken');

        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        };

        const response = await fetch('/api/cases/adoption/home', {
            method: 'GET', // 明確指定 GET
            headers: headers //帶入上面準備好的 headers
        });


        const result = await response.json();

        if (result.success) {
            const track = document.getElementById('index_marqueeTrack');
            let htmlContent = '';

            result.data.forEach(item => {
                const hintGif = getRandomClickHint();
                const photoSrc = item.photoUrl || getPetPhoto(item.photo);

                // 判斷公立/私有標籤
                const tagHtml = item.isPublic
                    ? `<div class="public-Adoption">公立 <i class="bi bi-building"></i></div>`
                    : `<div class="private-Adoption">個人 <i class="bi bi-house"></i></div>`;

                // 判斷是否已收藏 (影響愛心樣式)
                const heartClass = item.isFavorites
                    ? 'bi-heart-fill is-favorite'
                    : 'bi-heart';

                htmlContent += `
                    <div class="index-card">
                        <a class="index_card_herf" href="#pet-adoption-detail?casenumber=${item.caseNumber}">
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
                                    <p class="detail-item">物種: <span class="detail-value">${item.species}</span></p>
                                    <p class="detail-item">品種: <span class="detail-value">${item.breed}</span></p>
                                    <p class="detail-item">體型: <span class="detail-value">${sizeMap[item.size] || '未知'}</span></p>
                                    <p class="detail-item">所在地: <span class="detail-value">${item.region || '未知'}</span></p>
                                    <img src="${hintGif}" class="click-hint-gif" alt="click hint">
                                    ${tagHtml}
                                </div>
                            </div>
                        </a>
                    </div>
                `;
            });

            track.innerHTML = htmlContent;

            // 資料載入完成後，啟動跑馬燈 (呼叫 main_merge.js 中的函式)
            if (typeof index_initMarquee === 'function') {
                index_initMarquee();
            }
        }
    } catch (error) {
        console.error('領養資料載入失敗:', error);
    }
}