$(function () {
    loadMyAdoptions();
});
// ================= 事件處理邏輯 =================
// 1. 卡片互動邏輯：點擊切換 "固定展開" 狀態
$(document).on('click', '.pub-card-wrapper', function (e) {
    if ($(e.target).closest('button, a, .right-action-tab').length) {
        return;
    }
    $('.pub-card-wrapper').not(this).removeClass('is-expanded');
    $(this).toggleClass('is-expanded');
});



// 2. 結案按鈕邏輯 (開啟 Modal) ★★★
$(document).on('click', '.btn-close-case', function (e) {
    e.stopPropagation(); // 阻止卡片展開/收合

    // 1. 抓取案件編號
    const wrapper = $(this).closest('.pub-card-wrapper');
    const caseId = wrapper.data('id');

    // 2. 將案件編號「暫存」到 Modal 的【確定按鈕】身上
    // 使用 .data() 存入，這樣等下點確定的時候才知道要刪哪一筆
    $('#confirmRemoveBtn').data('case-id', caseId);

    // 3. (選用) 更新 Modal 標題，讓使用者知道現在要刪哪一筆
    // $('#cardremove_modal .modal-title').text(`您是否確定將案件 ${caseId} 結案?案件結案後將無法更改回未結案`);
    // 注意這裡改成 .html()，並且中間插入了 <br> 標籤
    $('#cardremove_modal .modal-title').html(`
    您是否確定將案件 ${caseId} 結案?
    <br>
    <span style="display: block; font-size: 0.8em; color: #9C4332; text-align: center;">
        (案件結案後將無法更改回未結案)
    </span>
`);
    // 4. 顯示 Bootstrap Modal
    // 這裡使用 Bootstrap 5 的標準寫法
    const modalElement = document.getElementById('cardremove_modal');
    const modal = new bootstrap.Modal(modalElement);
    modal.show();
});

// 3. 詳細單頁跳轉（判斷一次後導頁）
$(document).on('click', '.top-link-tab', async function (e) {
    e.preventDefault();     // 阻止 <a> 預設跳轉
    e.stopPropagation();    // 不要觸發卡片展開

    const wrapper = $(this).closest('.pub-card-wrapper');
    const caseId = wrapper.data('id');

    if (!caseId) {
        console.error('找不到 caseId');
        return;
    }

    try {
        const token = localStorage.getItem('authToken');

        const resp = await fetch(`/api/se/pet-cases/${caseId}/review-result`, {
            method: 'GET',
            cache: 'no-store',
            headers: {
                ...(token ? { Authorization: `Bearer ${token}` } : {})
            }
        });

        const data = await resp.json().catch(() => ({}));
        // console.log('準備前往的 caseId =', caseId);


        if (!resp.ok) {
            throw new Error(data.message || `查詢失敗（HTTP ${resp.status}）`);
        }

        if (data.approved === true) {
            window.location.hash = `#review-successful?caseId=${caseId}`;
        } else if (data.rejected === true) {
            window.location.hash = `#review-failed?caseId=${caseId}`;
        } else {

            localStorage.removeItem('currentCaseData');
            window.location.hash = `#adoption-review?caseId=${caseId}`;

        }

    } catch (err) {
        console.error(err);
        alert('系統忙碌中，請稍後再試');
    }
});


// 3. Modal 內的「確定」按鈕邏輯 ★★★
// 注意：這個監聽要在外層，不要寫在 btn-close-case 裡面，避免重複綁定
$(document).off('click', '#confirmRemoveBtn')
    .on('click', '#confirmRemoveBtn', async function () {
        // 1. 從按鈕身上取出剛剛暫存的案件編號
        const caseId = $(this).data('case-id');

        if (caseId) {
            // 2. 執行原本的結案 API 函式
            await performCloseCase(caseId);

            // 3. 關閉 Modal
            const modalElement = document.getElementById('cardremove_modal');
            const modal = bootstrap.Modal.getOrCreateInstance(modalElement);
            modal.hide();
        }


    });

// 執行結案 API
async function performCloseCase(caseId) {
    try {
        const token = localStorage.getItem('authToken');
        if (!token) {
            alert('請先登入才能結案');
            return;
        }

        const res = await fetch(`/api/pu/member/adoptions/${caseId}/terminate`, {
            method: 'PATCH',
            headers: {
                ...(token ? { Authorization: `Bearer ${token}` } : {}) //另一版本寫法
            }
        });

        const data = await res.json().catch(() => ({}));

        if (!res.ok || data.success === false) {
            throw new Error(data.message || `結案失敗（HTTP ${res.status}）`);
        }

        //結案成功後：把卡片移到已結案區塊 
        moveCardToClosed(caseId);

    } catch (err) {
        console.error(err);
        alert(err.message || '結案失敗');
    }
}

// document.addEventListener('DOMContentLoaded', () => {
//     console.log('DOM 內容已載入，開始取得我的送養刊登列表');
//     loadMyAdoptions();
// });

// 載入我的送養刊登列表


async function loadMyAdoptions() {
    console.log("--- 開始執行 loadMyAdoptions ---");
    try {
        showLoading();
        clearSections();

        const token = localStorage.getItem('authToken');
        console.log("1. 取得的 Token:", token ? "Token 存在" : "Token 缺失");

        // 注意：fetch 的路徑必須確保開頭有 / 或是完整的 URL
        const res = await fetch('/api/pu/member/adoptions', {
            method: 'GET',
            headers: {
                'Authorization': token ? `Bearer ${token}` : '',
                'Content-Type': 'application/json'
            }
        });

        console.log("2. API HTTP 狀態碼:", res.status);

        if (res.status === 401) {
            console.error("錯誤：401 權限不足，請檢查 JWT Filter 是否正確解析 Token");
            alert("登入逾時，請重新登入");
            return;
        }

        const json = await res.json().catch(() => ({}));
        console.log("3. API 回傳完整內容:", json);

        if (!res.ok || json.success === false) {
            throw new Error(json.message || `載入失敗（HTTP ${res.status}）`);
        }

        if (json.data && Array.isArray(json.data)) {
            console.log(`4. 準備渲染卡片，共 ${json.data.length} 筆資料`);
            renderAdoptionCards(json.data);
        } else {
            console.warn("警告：後端回傳的 data 不是陣列或不存在", json.data);
        }

    } catch (e) {
        console.error("--- 執行過程中發生錯誤 ---");
        console.error("錯誤訊息:", e.message);
        console.error("錯誤堆疊:", e.stack);
        alert(e.message || '載入失敗');
    } finally {
        hideLoading();
        console.log("--- loadMyAdoptions 執行結束 ---");
    }
}


function clearSections() {
    // 你四區塊目前 class 都是 .missing-publish，裡面有 .pub-card-wrapper
    document.querySelectorAll('.missing-publish .pub-card-wrapper').forEach(el => el.remove());
}
// 性別轉換（英文轉中文）
function getGenderText(gender) {
    if (gender === 'male' || gender === '男') return '男';
    if (gender === 'female' || gender === '女') return '女';
    if (gender === '未知' || gender === 'unknown' || gender === undefined || gender === null || gender === '') return '未知';
    return gender;
}
function buildCardHtml(item) {

    return `
    <div class="pub-card-wrapper" data-id="${item.caseId}">
      <a href="" class="top-link-tab" target="_blank">
        <i class="bi bi-box-arrow-up-right"></i> 點擊前往詳細單頁
      </a>
      
      <div class="right-action-tab btn-close-case">我要結案</div>

      <div class="pub-card">
      <div class="row g-0 h-100">
          <div class="col-md-5 img-container">
          <img src="${item.photo || '../../assets/img/material/carousel_1.jpg'}"
                 class="pet-img" alt="寵物照片">
          </div>

          <div class="col-md-7 info-container">
            <div class="case-number">
              案件編號：<span class="highlight-text">${item.caseNumber || ''}</span>
            </div>
            
            <div class="pet-details">
              <p>寵物姓名：<span>${item.petName || ''}</span></p>
              <p>寵物性別：<span>${getGenderText(item.petGender)}</span></p>
              
              <p>寵物種類：<span>${item.petType || ''}</span></p>
              <p>寵物品種：<span>${item.petBreed || ''}</span></p>
              <p>刊登日期：<span>${item.submitDate || ''}</span></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderAdoptionCards(list) {
    if (!list || list.length === 0) return;

    list.forEach(item => {
        const html = buildCardHtml(item);
        const status = Number(item.caseStatusId);

        // 1. 必須在 if 外部先宣告變數
        let targetSelector = '';

        if (status === 1) {
            targetSelector = '#sec-waiting';
        } else if (status === 2) {
            targetSelector = '#sec-on-shelf';
        } else if (status === 3) {
            targetSelector = '#sec-failed';
        } else if (status === 4) {
            targetSelector = '#closed-case';
        } else {
            targetSelector = '#sec-on-shelf';
        }

        // 2. 現在在這裡使用 targetSelector 就不會報錯了
        const container = document.querySelector(targetSelector);

        if (container) {
            container.insertAdjacentHTML('beforeend', html);
            // 因為你的 CSS 預設隱藏了 .missing-publish，所以要手動顯示
            container.style.display = 'block';
            console.log(`已將案件 ${item.caseId} 放入 ${targetSelector}`);
        } else {
            console.error(`找不到 HTML 容器：${targetSelector}`);
        }
    });
}

function moveCardToClosed(caseId) {
    const $card = $(`.pub-card-wrapper[data-id="${caseId}"]`);
    if ($card.length === 0) return;

    // 移除「我要結案」按鈕
    $card.find('.btn-close-case').remove();

    // 加上印章
    if ($card.find('.closed-stamp-img').length === 0) {
        $card.prepend(`<img src="../../assets/img/material/closed.png" class="closed-stamp-img" alt="已結案印章">`);
    }

    // 移到「已結案」
    $('#closed-case').append($card);
}

// 顯示動畫
function showLoading() {
    const loader = document.getElementById('global-loading');
    if (loader) loader.classList.remove('hidden');
}

// 隱藏動畫
function hideLoading() {
    const loader = document.getElementById('global-loading');
    if (loader) loader.classList.add('hidden');
}
