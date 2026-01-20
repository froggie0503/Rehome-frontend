// const API_TOKEN_KEY = 'authToken';
var token = localStorage.getItem("authToken");


window.initPublicationStatus = function() {
    fetchMissingCases(); // 你的主邏輯
};

// 1. 獲取走失案件資料
function fetchMissingCases() {

    // --- 狀態初始化 ---
    // 隱藏所有內容與錯誤訊息
    $('.missing-publish').hide();
    $('hr').hide();
    $('#error-message').hide();
    
    // 顯示 Loading 動畫
    $('#loading-spinner').show();



    $.ajax({
        url: '/api/missing/cases',
        type: 'GET',
        dataType: 'json',
        headers: {
            'Authorization': 'Bearer ' + token
        },
       success: function (response) {
            // 延遲一點點讓動畫不要閃太快 (可選，這裡設 300ms)
            setTimeout(() => {
                // 1. 隱藏 Loading
                $('#loading-spinner').hide();

                if (response.success) {
                    renderAllCards(response.data);
                } else {
                    showErrorState(response.message || "查詢失敗，請稍後再試");
                }
            }, 300);
        },
        error: function (xhr, status, error) {
            $('#loading-spinner').hide();
            
            // --- 針對閒置過久 (Token 過期) 的處理 ---
            if (xhr.status === 401 || xhr.status === 403) {
                showErrorState("閒置過久，請重新登入", true);
            } else {
                // 其他伺服器錯誤 (500, 404 等)
                console.error("API 錯誤:", error);
                showErrorState("系統發生錯誤，無法載入資料");
            }
        }
    });
}
// 顯示錯誤狀態的輔助函式
function showErrorState(message, showLoginBtn = false) {
    // 隱藏內容
    $('.missing-publish').hide();
    $('hr').hide();
    
    // 設定錯誤文字
    $('#error-text').text(message);
    
    // 是否顯示登入按鈕
    if (showLoginBtn) {
        $('#relogin-btn').show();
    } else {
        $('#relogin-btn').hide();
    }
    
    // 顯示錯誤區塊
    $('#error-message').fadeIn();
}


// 2. 渲染所有卡片
function renderAllCards(dataList) {
    // 定義所有容器的 ID
    const containers = {
        '已上架': '#published-list',
        '等待審核': '#pending-list',
        '審核失敗': '#rejected-list',
        '已結案': '#closed-list'
    };

    // 清空現有內容
    Object.values(containers).forEach(id => $(id).empty());

        const $container = $('.memcenter-container');

    if (!dataList || dataList.length === 0) {
        $container.html('<div class="text-center my-5 text-muted fw-bold">您目前沒有上傳走失案件</div>').fadeIn();
        return;
    }

    // 遍歷資料並分類塞入
    dataList.forEach(item => {
        const displayDate = item.missingDate ? item.missingDate.split('T')[0] : '未知';

        switch (item.caseStatus) {
            case '審核成功':
                $(containers['已上架']).append(createPublishedCard(item, displayDate));
                break;
            case '等待審核':
                $(containers['等待審核']).append(createReviewCard(item, displayDate));
                break;
            case '審核失敗':
                $(containers['審核失敗']).append(createFailedCard(item, displayDate));
                break;
            case '案件結束':
                $(containers['已結案']).append(createClosedCard(item, displayDate));
                break;
        }
    });

    // ★ 重點：資料塞完後，執行檢查隱藏邏輯
    updateSectionVisibility();
}

// 3. (新增) 檢查並隱藏空區塊的函式
function updateSectionVisibility() {
    // 這裡列出所有的 list 容器 ID
    const listIds = ['#published-list', '#pending-list', '#rejected-list', '#closed-list'];

    listIds.forEach(id => {
        const list = $(id);
        // 找到這個 list 外層的 .missing-publish 區塊
        const sectionContainer = list.closest('.missing-publish');

        // 找到緊接在這個區塊後面的 <hr> (如果有)
        const nextHr = sectionContainer.next('hr');

        if (list.children().length === 0) {
            // 如果裡面沒東西，隱藏整個區塊
            sectionContainer.hide();
            // 為了美觀，通常也要把下面的分隔線隱藏
            if (nextHr.length) nextHr.hide();
        } else {
            // 如果有東西，顯示區塊
            sectionContainer.show();
            // 顯示分隔線
            if (nextHr.length) nextHr.show();
        }
    });
}

// ================= 樣板生成函數 =================

// 樣板 A: 已上架 (連結到詳細頁)pet-missing-detail
function createPublishedCard(item, date) {
    return `
    <div class="pub-card-wrapper" data-id="${item.caseNumber}">
        <a href="#pet-missing-detail?casenumber=${item.caseNumber}" class="top-link-tab" target="_blank">
            <i class="bi bi-box-arrow-up-right"></i> 點擊前往詳細單頁
        </a>
        <div class="right-action-tab btn-close-case">我要結案</div>
        
        ${getCommonCardContent(item, date, true)}
    </div>`;
}

// 樣板 B: 等待審核  (連結到審核狀態頁)
function createReviewCard(item, date) {
    return `
    <div class="pub-card-wrapper" data-id="${item.caseNumber}">
        <a href="#missing_publish_result?casenumber=${item.caseNumber}" class="top-link-tab" target="_blank">
            <i class="bi bi-box-arrow-up-right"></i> 點擊查看審核狀態
        </a>
        <div class="right-action-tab btn-close-case">我要結案</div>

        ${getCommonCardContent(item, date, false)}
    </div>`;
}

// 樣板 B2:審核失敗 (連結到狀態頁 + 失敗印章)
function createFailedCard(item, date) {
    return `
    <div class="pub-card-wrapper" data-id="${item.caseNumber}">
          <a href="#missing_publish_result?casenumber=${item.caseNumber}" class="top-link-tab" target="_blank">
            <i class="bi bi-box-arrow-up-right"></i> 點擊查看審核結果
        </a>
        <div class="right-action-tab btn-close-case">我要結案</div>
        
        <img src="../../assets/img/material/failed.png" class="failed-stamp-img" alt="失敗印章">

        ${getCommonCardContent(item, date, false)}
    </div>`;
}
// 樣板 C: 已結案 (連結到詳細頁 + 結案印章)
function createClosedCard(item, date) {
    return `
    <div class="pub-card-wrapper" data-id="${item.caseNumber}">
        <a href="#missing_detail?id=${item.caseNumber}" class="top-link-tab" target="_blank">
            <i class="bi bi-box-arrow-up-right"></i> 點擊前往詳細單頁
        </a>
        <div class="right-action-tab btn-close-case">我要結案</div>
        
        <img src="../../assets/img/material/closed.png" class="closed-stamp-img" alt="已結案印章">

        ${getCommonCardContent(item, date, false)}
    </div>`;
}

// 共用的卡片內部結構 (圖片與文字資訊)
function getCommonCardContent(item, date, showChatBtn = false) {
    // 處理圖片，如果沒有 petImg 則使用預設圖
    const imgSrc = item.petImg ? item.petImg : '../../assets/img/default-pet.png';
    const chatBtnHtml = showChatBtn ? `
        <div class="bottom-btn-group">
            <button class="btn chat-btn" onclick="openMessageModal('${item.caseNumber}')">
                查看站內信 <i class="bi bi-chat-dots"></i>
            </button>
        </div>` : '';
    return `
    <div class="pub-card">
        <div class="row g-0 h-100">
            <div class="col-md-5 img-container">
                <img src="${imgSrc}" class="pet-img" alt="寵物照片" data-field="petImg">
            </div>

            <div class="col-md-7 info-container">
                <div class="case-number">
                    案件編號：<span data-field="caseNumber" class="highlight-text">${item.caseNumber}</span>
                </div>

                <div class="pet-details">
                    <p>寵物姓名：<span data-field="petName">${item.petName}</span></p>
                    <p>寵物性別：<span data-field="petGender">${item.petGender === 'male' ? '公' : '母'}</span></p>
                    <p>寵物種類：<span data-field="species">${item.species}</span></p>
                    <p>寵物品種：<span data-field="petBreed">${item.petBreed}</span></p>
                    <p>走失日期：<span data-field="missingDate">${date}</span></p>
                    <p>走失地點：<span data-field="missingDistrict">${item.missingDistrict}</span></p>
                </div>

                ${chatBtnHtml}
            </div>
        </div>
    </div>`;
}



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
    const caseNum = wrapper.data('id');

    // 2. 將案件編號「暫存」到 Modal 的【確定按鈕】身上
    // 使用 .data() 存入，這樣等下點確定的時候才知道要刪哪一筆
    $('#confirmRemoveBtn').data('case-id', caseNum);

    // 3. (選用) 更新 Modal 標題，讓使用者知道現在要刪哪一筆
    // $('#cardremove_modal .modal-title').text(`您是否確定將案件 ${caseNum} 結案?案件結案後將無法更改回未結案`);
    // 注意這裡改成 .html()，並且中間插入了 <br> 標籤
$('#cardremove_modal .modal-title').html(`
    您是否確定將案件 ${caseNum} 結案?
    <br>
    <span style="display: block; font-size: 0.8em; color: #9C4332; text-align: center;">
        (案件結案後將無法更改回未結案)
    </span>
`);
    // 4. 顯示 Bootstrap Modal
    // 這裡使用 Bootstrap 5 的標準寫法
    const modalElement = document.getElementById('cardremove_modal');
    let modal = bootstrap.Modal.getInstance(modalElement);
    
    if (!modal) {
        modal = new bootstrap.Modal(modalElement);
    }
    
    modal.show();
});

$(document).on('click', '#confirmRemoveBtn', function () {
// 3. Modal 內的「確定」按鈕邏輯 ★★★
// 注意：這個監聽要在外層，不要寫在 btn-close-case 裡面，避免重複綁定
    // 1. 從按鈕身上取出剛剛暫存的案件編號
    const caseNum = $(this).data('case-id');

    if (caseNum) {
        // 2. 執行原本的結案 API 函式
        performCloseCase(caseNum);

        // 3. 關閉 Modal
        const modalElement = document.getElementById('cardremove_modal');
        const modal = bootstrap.Modal.getInstance(modalElement); // 取得已開啟的實例
        modal.hide();
    }
});


// 執行結案 API
function performCloseCase(caseNumber) {
    $.ajax({
        url: `/api/missing/founded/${caseNumber}`,
        type: 'PATCH',
        headers: {
            'Authorization': 'Bearer ' + token
        },
        success: function (response) {
            if (response.success) {
                showCustomAlert("系統提示", "結案成功！", 1000);
                // 重新載入列表以更新狀態
                // fetchMissingCases();
                const $targetCard = $(`.pub-card-wrapper[data-id="${caseNumber}"]`);

                // 2. 使用淡出動畫移除卡片
                $targetCard.fadeOut(300, function() {
                    // 動畫結束後，從 HTML 結構中移除
                    $(this).remove();

                    // 3. 重要：移除後，檢查該區塊是否變空了 (如果是空的，要連標題一起隱藏)
                    updateSectionVisibility();
                    });
            } else {
                showCustomAlert("系統提示", "結案失敗：" + response.message, 0);
            }
        },
        error: function (xhr) {
            showCustomAlert("系統錯誤，請稍後再試", 1000);
            console.error(xhr);
        }
    });
}


// 全域變數，用來記錄目前狀態
let currentCaseNumber = '';
let currentPage = 0;
let isLoading = false;
let hasMoreData = true; // 是否還有下一頁
const pageSize = 10;    // 一頁幾筆

// 1. 開啟 Modal 的入口函數 (請在你的按鈕 onclick 呼叫這個)
function openMessageModal(caseNumber) {
    const modal = document.getElementById('messageModal');
    const listBody = document.getElementById('messageListBody');
    
    // 重置狀態
    currentCaseNumber = caseNumber;
    currentPage = 0;
    hasMoreData = true;
    listBody.innerHTML = ''; // 清空舊內容
    
    modal.classList.add('active'); // 顯示視窗

    // 立即載入第一頁
    loadMessages();
}

// 2. 關閉 Modal
function closeModal() {
    document.getElementById('messageModal').classList.remove('active');
}

// 3. 載入訊息的核心功能
async function loadMessages() {
    // 檢查是否正在載入或已經沒有更多資料
    if (isLoading || !hasMoreData) return;
    
    isLoading = true;
    document.getElementById('loadingIndicator').style.display = 'block';

    try {
        // --- 建構 URL 與分頁參數 ---
        // 假設後端分頁是從 0 開始 (page=0 代表第一頁)
        const url = `/api/members/missing/applications/${currentCaseNumber}?page=${currentPage}&size=${pageSize}`;

        // --- 發送請求 (帶上 Token) ---
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': 'Bearer ' + token, // 全域變數 token
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }

        const resJson = await response.json();

        // --- 處理 API 回傳資料 ---
        // 根據你的 API 結構: resJson.success 為 true 且 resJson.data 存在
        if (resJson.success && resJson.data) {
            const apiPageData = resJson.data;      // 分頁資訊物件
            const msgList = apiPageData.content;   // 實際的留言陣列

            if (msgList && msgList.length > 0) {
                
                // ★ 資料轉換：將 API 欄位轉為 renderMessages 看得懂的格式
                const mappedMessages = msgList.map(item => ({
                    // API 的 'message' -> 前端的 'content'
                    content: item.message, 
                    // API 的 'sendDate' -> 前端的 'time' (把 'T' 換成 空白，比較好讀)
                    time: item.sendDate.replace('T', ' ') 
                }));

                // 渲染畫面
                renderMessages(mappedMessages);
                
                // 頁數 +1
                currentPage++; 

                // ★ 判斷是否還有下一頁
                // 你的 API 有回傳 'last': true/false，這是最準確的判斷方式
                if (apiPageData.last === true) {
                    hasMoreData = false;
                }
            } else {
                // 如果 content 是空的
                hasMoreData = false;
            }
        } else {
            // success 為 false 或其他狀況
            console.error('API 回傳失敗:', resJson.message);
            hasMoreData = false;
        }

    } catch (error) {
        console.error('載入留言失敗:', error);
        // 如果是 401/403 通常代表 Token 過期，可以考慮導回登入頁或顯示提示
        if(error.message.includes('401') || error.message.includes('403')){
             showCustomAlert("驗證失效，請重新登入", 2000);
        } else {
             showCustomAlert("讀取留言發生錯誤", 1000);
        }
    } finally {
        isLoading = false;
        document.getElementById('loadingIndicator').style.display = 'none';
    }
}

// 4. 將資料渲染到畫面上
function renderMessages(messages) {
    const listBody = document.getElementById('messageListBody');
    
    messages.forEach(msg => {
        // 建立卡片 HTML
        const card = document.createElement('div');
        card.className = 'message-item';
        card.innerHTML = `
            <p class="msg-content">${msg.content}</p>
            <span class="msg-time">${msg.time}</span>
        `;
        listBody.appendChild(card);
    });
}

// 5. 監聽捲動事件 (無限捲動邏輯)
const listBody = document.getElementById('messageListBody');
listBody.addEventListener('scroll', () => {
    // 判斷是否捲動到底部 (scrollTop + clientHeight 接近 scrollHeight)
    if (listBody.scrollTop + listBody.clientHeight >= listBody.scrollHeight - 50) {
        loadMessages();
    }
});



