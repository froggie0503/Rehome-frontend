// member_toadopt.js

// 全域 Token
var token = localStorage.getItem("authToken");

// 初始化函式 (給 memcenter.js 呼叫用)
window.initSubmittedAdoption = function () {
    console.log("初始化：已申請領養頁面");
    fetchAdoptionApplications();
};

// ================= 1. 資料獲取邏輯 =================

function fetchAdoptionApplications() {
    // 定義容器
    const $container = $('.missing-publish'); // 卡片列表容器

    // 如果 HTML 裡沒有 loading spinner，動態加一個，或者預設隱藏容器
    // 這裡假設你有類似 publicationStatus 的 loading 結構，如果沒有可自行加入
    $('#loading-spinner').show();
    $container.hide();

    $.ajax({
        url: '/api/members/adoption/applications',
        type: 'GET',
        dataType: 'json',
        headers: {
            'Authorization': 'Bearer ' + token
        },
        success: function (response) {
            // 模擬延遲讓動畫順暢
            setTimeout(() => {
                $('#loading-spinner').hide();

                if (response.success) {
                    renderAdoptionCards(response.data);
                } else {
                    $container.html(`<div class="text-center my-5 text-muted">${response.message || '尚無申請資料'}</div>`).show();
                }
            }, 300);
        },
        error: function (xhr, status, error) {
            $('#loading-spinner').hide();
            console.error("API 錯誤:", error);

            if (xhr.status === 401 || xhr.status === 403) {
                // 這裡可以呼叫全域的錯誤處理或導向登入
                alert("登入逾時，請重新登入");
            } else {
                $container.html(`<div class="text-center my-5 text-danger">系統發生錯誤，無法載入資料</div>`).show();
            }
        }
    });
}

// ================= 2. 渲染卡片邏輯 =================

function renderAdoptionCards(dataList) {
    const $container = $('.missing-publish');
    $container.empty(); // 清空現有靜態內容

    if (!dataList || dataList.length === 0) {
        $container.html('<div class="text-center my-5 text-muted fw-bold">目前沒有正在進行的領養申請</div>').fadeIn();
        return;
    }

    dataList.forEach(item => {
        // 排除已刪除 (isRemove) 的資料，或者根據需求顯示
        // if (item.isRemove) return; 

        const cardHtml = createAdoptionCardHtml(item);
        $container.append(cardHtml);
    });

    $container.fadeIn();
}

/**
 * 產生單張卡片 HTML
 */
function createAdoptionCardHtml(item) {
    const cardData = item.card;

    // 1. 處理日期 (格式化 TimeStamp)
    const applyDate = item.createdAt ? item.createdAt.split('T')[0] : '未知';

    // 2. 處理圖片 (Base64 或 URL)
    let imgSrc = '../../assets/img/default-pet.png';
    if (cardData.photo) {
        if (cardData.photo.startsWith('http') || cardData.photo.startsWith('data:image')) {
            imgSrc = cardData.photo;
        } else {
            imgSrc = `data:image/jpeg;base64,${cardData.photo}`;
        }
    }

    // 3. 取得狀態設定 (文字、Icon、CSS Class、是否可聊天)
    const statusConfig = getStatusConfig(item.adoptionStatusId);

    // 4. 決定聊天按鈕樣式
    let chatButtonHtml = '';
    if (statusConfig.canChat) {
        // 開啟狀態
        chatButtonHtml = `
            <button class="btn chat-btn-pill" onclick="openMessageModal('${cardData.caseNumber}')">
                聊天室 <i class="bi bi-chat-dots-fill"></i>
            </button>`;
    } else {
        // 鎖定狀態
        chatButtonHtml = `
            <span title="需等待審核通過至 Step 3 才能開啟聊天室">
                <button class="btn chat-btn-pill btn-locked" onclick="handleLockedChat()">
                    聊天室 <i class="bi bi-chat-dots-fill"></i>
                </button>
            </span>`;
    }

    // 5. 組裝 HTML (參考 submittedAdoptionApplication.html 的 .submitted-type 結構)
    return `
    <div class="pub-card-wrapper submitted-type" data-id="${cardData.caseNumber}">

        <div class="right-action-tab btn-close-case">
            取消申請
        </div>
        
        <a href="/#pet-adoption-detail?casenumber=${cardData.caseNumber}" class="top-link-tab" target="_blank">
            <i class="bi bi-box-arrow-up-right"></i> 點擊查看案件詳細
        </a>

        <div class="pub-card">
            <div class="row g-0 h-100 align-items-center">

                <div class="col-auto img-container">
                    <img src="${imgSrc}" class="pet-img" alt="${cardData.petName}">
                </div>

                <div class="col info-container">

                    <div class="case-number-badge">
                        案件編號：<span class="highlight-text">${cardData.caseNumber}</span>
                    </div>

                    <div class="pet-details mt-2">
                        <div class="status-row">
                            <span class="status-label">目前狀態：</span>
                            <span class="status-value">
                                <span class="mini-status-dot ${statusConfig.cssClass}">
                                    <i class="bi ${statusConfig.icon}"></i>
                                </span>
                                ${statusConfig.message}
                            </span>
                        </div>
                        <p class="time">申請時間：${applyDate}</p>
                        <p class="pet-name">寵物姓名：${cardData.petName} (${cardData.breed})</p>
                    </div>

                    ${chatButtonHtml}
                </div>
            </div>
        </div>
    </div>
    `;
}

/**
 * 狀態對照表 Helper
 * 輸入: adoptionStatusId (1~5)
 * 輸出: 設定物件
 */
function getStatusConfig(statusId) {
    switch (statusId) {
        case 1:
            return {
                cssClass: 'step1',
                icon: 'bi-file-earmark-text',
                message: '等待審核中，資料已成功送出',
                canChat: false
            };
        case 2:
            return {
                cssClass: 'step2',
                icon: 'bi-clock',
                message: '審核進行中，送養者正在查看您的資訊…',
                canChat: false
            };
        case 3:
            return {
                cssClass: 'step3',
                icon: 'bi-chat',
                message: '審核通過！聊天室功能已開啟',
                canChat: true
            };
        case 4:
            return {
                cssClass: 'step4success',
                icon: 'bi-heart-fill',
                message: '媒合成功，恭喜您！祝一切順利',
                canChat: true // 通常成功後還是可以看聊天紀錄
            };
        case 5:
            return {
                cssClass: 'step4fail',
                icon: 'bi-x-circle-fill',
                message: '媒合未成功，別氣餒，下一次會更順利!',
                canChat: true // 失敗後是否允許聊天視需求而定，這裡設為 true (或 false)
            };
        default:
            return {
                cssClass: 'step1',
                icon: 'bi-question-circle',
                message: '狀態未知',
                canChat: false
            };
    }
}

// ================= 3. 互動事件邏輯 (保留你原本的程式碼並微調) =================

// 卡片點擊展開/收合
$(document).on('click', '.pub-card-wrapper', function (e) {
    if ($(e.target).closest('button, a, .right-action-tab').length) {
        return;
    }
    $('.pub-card-wrapper').not(this).removeClass('is-expanded');
    $(this).toggleClass('is-expanded');
});

// 鎖定聊天室的提示
window.handleLockedChat = function () {
    // 這裡使用你習慣的 showCustomAlert，如果沒有定義，就用 alert
    if (typeof showCustomAlert === "function") {
        showCustomAlert("系統提示", "需等待審核通過至 Step 3 才能開啟聊天室", 2000);
    } else {
        alert("需等待審核通過至 Step 3 才能開啟聊天室");
    }
};

// --- 取消申請相關 Modal 邏輯 ---

// 1. 點擊「取消申請」滑出按鈕
$(document).on('click', '.btn-close-case', function (e) {
    e.stopPropagation();

    // 抓取案件編號
    const wrapper = $(this).closest('.pub-card-wrapper');
    const caseNum = wrapper.data('id');

    // 暫存編號到確認按鈕
    $('#confirmRemoveBtn').data('case-id', caseNum);

    // 更新 Modal 文字
    $('#cardremove_modal .modal-title').html(`
    是否確定刪除對送養案號：${caseNum} 的領養申請?
        <br>
        <span style="display: block; font-size: 0.8em; color: #9C4332; text-align: center; margin-top:5px;">
           (刪除後將無法復原)
        </span>
    `);

    // 顯示 Modal
    // const modalElement = document.getElementById('cardremove_modal');
    // const modal = new bootstrap.Modal(modalElement);
    // modal.show();
    const modalElement = document.getElementById('cardremove_modal');
    let modal = bootstrap.Modal.getInstance(modalElement);

    if (!modal) {
        modal = new bootstrap.Modal(modalElement);
    }

    modal.show();
});

// 2. Modal 確認按鈕
$('#confirmRemoveBtn').off('click').on('click', function () {
    const caseNum = $(this).data('case-id');

    if (caseNum) {
        performCancelApplication(caseNum);

        // 關閉 Modal
        const modalElement = document.getElementById('cardremove_modal');
        const modal = bootstrap.Modal.getInstance(modalElement);
        modal.hide();
    }
});

// 3. 執行取消申請 API
function performCancelApplication(caseNumber) {
    // ★★★ 注意：這裡需要確認後端「取消申請」的正確 API ★★★
    // 假設是 DELETE /api/members/adoption/applications/{caseNumber}
    // 或是 PATCH 更改狀態

    $.ajax({
        url: `/api/members/adoption/applications/${caseNumber}`, // 請確認此路徑
        type: 'DELETE', // 或是 PATCH，視後端設計而定
        headers: {
            'Authorization': 'Bearer ' + token
        },
        success: function (response) {
            if (response.success) {
                if (typeof showCustomAlert === "function") {
                    showCustomAlert("系統提示", "申請已取消！", 1000);
                } else {
                    alert("申請已取消！");
                }
                // 重新載入列表
                fetchAdoptionApplications();
            } else {
                showCustomAlert("系統提示", "取消失敗：" + response.message, 0);
            }
        },
        error: function (xhr) {
            alert("系統錯誤，請稍後再試");
            console.error(xhr);
        }
    });
}