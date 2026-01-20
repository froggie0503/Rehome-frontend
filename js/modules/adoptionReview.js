// /* adoptionReview.js
//    處理雙層風琴選單與狀態解鎖邏輯 
// */

// let currentAppId = null; // 記錄目前正在查看詳情的申請人 ID

// // 1. 第一層 Accordion: 案件卡片開關
// function togglePetAccordion(headerElement) {
//     const card = headerElement.parentElement;
//     card.classList.toggle('expanded');
// }

// // 2. 第二層 Accordion: 申請人列表開關
// function toggleApplicant(headerElement) {
//     const item = headerElement.parentElement;

//     // 如果想要「手風琴效果」(一次只能開一個)，可以加上這段：
//     const allItems = document.querySelectorAll('.applicant-item');
//     allItems.forEach(el => {
//         if(el !== item) el.classList.remove('active');
//     });

//     item.classList.toggle('active');
// }

// // 3. 開啟 Modal (詳細資料)
// function openDetailModal(appId) {
//     currentAppId = appId; // 記住現在是誰被點開
//     const modal = document.getElementById('detailModal');

//     // TODO: 在這裡可以透過 AJAX/Fetch 去後端抓取該 appId 的真實資料
//     // 範例：document.getElementById('modal-name').innerText = fetchedData.name;
//     document.getElementById('modal-name').innerText = (appId === 'app-001') ? "王小明" : "陳美美";

//     modal.classList.add('show');
// }

// // 4. 關閉 Modal 並觸發「解鎖按鈕」邏輯
// function closeModal() {
//     const modal = document.getElementById('detailModal');
//     modal.classList.remove('show');

//     // 使用者關閉視窗，代表「已閱讀完畢」
//     if (currentAppId) {
//         unlockActions(currentAppId);
//     }
// }

// // 5. 解鎖聊天室與接受按鈕 (模擬 API Call)
// function unlockActions(appId) {
//     console.log(`正在更新案件狀態 for ${appId} (模擬 Call API: 改成媒合期2)...`);

//     // 模擬網路延遲效果
//     setTimeout(() => {
//         const appItem = document.getElementById(appId);
//         if (!appItem) return;

//         // 找到該區塊內的按鈕
//         const btnChat = appItem.querySelector('.btn-chat');
//         const btnAccept = appItem.querySelector('.btn-accept');

//         // 1. 移除 disabled 屬性
//         btnChat.removeAttribute('disabled');
//         btnAccept.removeAttribute('disabled');

//         // 2. 加上 active 樣式 class (讓顏色變亮)
//         btnChat.classList.add('unlocked-chat');
//         btnAccept.classList.add('unlocked-accept');

//         // 3. 更改文字提示 (可選)
//         // btnChat.innerHTML = '前往聊天室 <i class="bi bi-chat-dots"></i>';

//         console.log("狀態更新完畢：按鈕已解鎖");

//         // 清空當前 ID
//         currentAppId = null; 

//     }, 300); // 300ms 延遲   
// }

// // 點擊 Modal 背景也可以關閉
// document.getElementById('detailModal').addEventListener('click', function(e) {
//     if (e.target === this) {
//         closeModal();
//     }
// });


// --- 初始化頁面內容 ---

    loadReviewPage(); // 啟動載入


async function loadReviewPage() {
    showPageLoading();

    try {
        const token = localStorage.getItem('authToken');

        if (!token) {
            alert('請先登入才能查看領養審核列表');
            return;
        }
        console.log("正在請求 API..."); // 加個 log 確認有執行到這
        const res = await fetch('/api/ado/adoption-cases', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (res.status === 401) {
            alert('登入已失效或尚未登入，請重新登入');
            return;
        }

        if (res.status === 403) {
            alert('你沒有權限查看這個頁面');
            return;
        }

        if (!res.ok) {
            throw new Error(`HTTP 錯誤：${res.status}`);
        }

        const data = await res.json();
        renderCases(data);

    } catch (err) {
        console.error("載入失敗", err);
        alert('載入失敗，請稍後再試');
    } finally {
        hidePageLoading();
    }
}
// 3. 渲染所有案件卡片
function renderCases(data) {
    const container = document.getElementById('reviewContainer');

    container.innerHTML = data.map(renderCaseCard).join('');
}

function renderCaseCard(wrapper) {
    const { caseInfo, applications } = wrapper;

    return `
    <div class="count-badge">
      目前領養申請已有 ${applications.length} 筆
    </div>

    <div class="pet-review-card">
      <div class="pet-info-header">
        <div class="pet-img-box">
          <img src="${caseInfo.photo || 'https://placedog.net/500/500'}" alt="Pet">
        </div>

        <div class="pet-text-info">
          <div class="pet-id">案件編號 : ${caseInfo.caseNumber}</div>
          <div class="pet-time">刊登時間 : ${caseInfo.submitDate}</div>
        </div>

        <i class="bi bi-chevron-down header-arrow"></i>
      </div>

      <div class="applicant-list-container">
        ${applications.length === 0
            ? `<div class="empty-app">目前尚無申請</div>`
            : applications.map(renderApplicantItem).join('')
        }
      </div>
    </div>
  `;
}

function getStatusMeta(statusId) {
    switch (Number(statusId)) {
        case 1: // 等待審核 / 尚未檢視
            return {
                dotClass: 'step1',
                canReadFinished: true,
                icon: 'bi-file-earmark-text',
                canChat: false,
                canAccept: false,
                isFinal: false
            };

        case 2: // 審核中 / 媒合一期
            return {
                dotClass: 'step2',
                canReadFinished: false,
                icon: 'bi-clock',
                canChat: true,
                canAccept: false,
                isFinal: false
            };

        case 3: // 聊天室已開 / 媒合二期
            return {
                dotClass: 'step3',
                canReadFinished: false,
                icon: 'bi-chat',
                canChat: true,
                canAccept: true,
                isFinal: false
            };

        case 4: // 媒合成功
            return {
                dotClass: 'success',
                canReadFinished: false,
                icon: 'bi-heart-fill',
                canChat: false,
                canAccept: false,
                isFinal: true
            };

        case 5: // 媒合失敗
            return {
                dotClass: 'fail',
                canReadFinished: false,
                icon: 'bi-x-circle-fill',
                canChat: false,
                canAccept: false,
                isFinal: true
            };

        default:
            return {
                dotClass: 'step1',
                icon: 'bi-file-earmark-text',
                canChat: false,
                canAccept: false,
                isFinal: false
            };
    }
}
// 4. 渲染單一申請人項目
function renderApplicantItem(app) {
    // console.log(app);
    const meta = getStatusMeta(app.statusId);

    return `
    <div class="applicant-item"
         data-application-id="${app.applicationId}">

      <div class="applicant-header">
        <div class="applicant-left-group">
          <div class="mini-status-dot ${meta.dotClass}">
            <i class="bi ${meta.icon}"></i>
          </div>

          <div class="app-info">
            <span class="app-name">${app.name}</span>
            <span class="app-id">申請日期：${app.date}</span>
          </div>
        </div>

        <button class="btn-reject"
                data-action="reject"
                ${meta.isFinal ? 'disabled' : ''}>
          不接受申請
        </button>

        <i class="bi bi-chevron-down inner-arrow"></i>
      </div>

      <div class="applicant-actions-body">
        <button class="action-btn btn-detail"
                data-action="detail">
          詳細資料
        </button>

       <button class="action-btn btn-chat ${meta.canChat ? 'unlocked-chat' : ''}"
        data-action="chat"
        ${meta.canChat ? '' : 'disabled'}>
        開啟聊天室
        </button>

      <button class="action-btn btn-accept ${meta.canAccept ? 'unlocked-accept' : ''}"
        data-action="accept"
        ${meta.canAccept ? '' : 'disabled'}>
        接受申請
    </button>
    
      </div>
    </div>
  `;
}

// 全域點擊監聽器
document.addEventListener('click', (e) => {

    /* ===== 第一層 Accordion：案件卡 ===== */
    const petHeader = e.target.closest('.pet-info-header');
    if (petHeader) {
        const card = petHeader.closest('.pet-review-card');
        card.classList.toggle('expanded');
        console.log("切換案件卡摺疊");
        return;
    }

    /* ===== 第二層 Accordion：申請人 ===== */
    const applicantHeader = e.target.closest('.applicant-header');
    if (applicantHeader) {

        // 避免點到按鈕時觸發 accordion
        if (e.target.closest('button')) return;

        const item = applicantHeader.closest('.applicant-item');

        // 手風琴效果（一次只開一個）
        document.querySelectorAll('.applicant-item.active')
            .forEach(el => {
                if (el !== item) el.classList.remove('active');
            });

        item.classList.toggle('active');
    }
});

// 處理詳細資料按鈕點擊
let currentApplicationId = null;
let detailModal = null;              // 先宣告，等 DOM ready 再賦值
const ownerMemberId = 1; // 先暫時寫死，之後換 JWT

document.addEventListener('DOMContentLoaded', () => {
    detailModal = document.getElementById('detailModal');

    // 關閉按鈕
    document.querySelector('.btn-close-modal')?.addEventListener('click', () => {
        closeModal();
    });

    // 點擊遮罩關閉
    detailModal?.addEventListener('click', (e) => {
        if (e.target === detailModal) {
            closeModal();
        }
    });
});

function closeModal() {
    if (!detailModal) {
        detailModal = document.getElementById('detailModal');
        if (!detailModal) return;
    }
    detailModal.classList.remove('show');
    currentApplicationId = null;
}


document.addEventListener('click', async (e) => {
    const btn = e.target.closest('.btn-detail');
    if (!btn) return;
    e.stopPropagation();
    const item = btn.closest('.applicant-item');
    const applicationId = item?.dataset.applicationId;
    if (!applicationId) return;

    currentApplicationId = applicationId;
    await openDetailModal(applicationId);
});

async function openDetailModal(applicationId) {
    currentApplicationId = applicationId;

    if (!detailModal) {
        detailModal = document.getElementById('detailModal');
        if (!detailModal) {
            console.error('detailModal not found');
            return;
        }
    }

    detailModal.classList.add('show');

    document.getElementById('modal-name').innerText = '載入中...';
    document.getElementById('modal-qaList').innerHTML = '';

    const token = localStorage.getItem('authToken');
    if (!token) {
        document.getElementById('modal-name').innerText = '請先登入後再查看詳細資料';
        return;
    }

    try {
        const res = await fetch(`/api/ado/${applicationId}/detail`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (res.status === 401) {
            document.getElementById('modal-name').innerText = '登入已失效，請重新登入';
            return;
        }

        if (res.status === 403) {
            document.getElementById('modal-name').innerText = '你沒有權限查看這筆申請';
            return;
        }

        if (!res.ok) {
            document.getElementById('modal-name').innerText = `載入失敗（${res.status}）`;
            return;
        }


        const dto = await res.json();
        // console.log('dto=', dto);
        // console.log('dto.qa=', dto.qa);
        // console.log('qa length=', dto.qa?.length);

        // 基本資料
        document.getElementById('modal-name').innerText = dto.contactName ?? '—';
        document.getElementById('modal-phone').innerText = dto.contactPhone ?? '—';
        document.getElementById('modal-email').innerText = dto.contactEmail ?? '—';
        document.getElementById('modal-applicationDate').innerText = dto.applicationDate ?? '—';

        // 婚姻/工作

        document.getElementById('modal-maritalStatus').innerText =
            dto.maritalStatus === 'married' ? '已婚' :
                dto.maritalStatus === 'single' ? '未婚' :
                    (dto.maritalStatus ?? '—');

        const employment = dto.employmentStatus;
        document.getElementById('modal-employmentStatus').innerText =
            employment === 'student' ? '學生' :
                employment === 'employed' ? '在職' :
                    employment === 'unemployed' ? '待業' :
                        '—';


        renderQaList(dto.qa);
    } catch (err) {
        console.error('載入詳細資料失敗', err);
        document.getElementById('modal-name').innerText = '載入失敗，請稍後再試';
    }
}
// // 塞問卷
// console.log('qa container:', document.getElementById('modal-qaList'));
// console.log('qa data:', qaList);
function renderQaList(qaList) {
    const el = document.getElementById('modal-qaList');
    if (!el) return;

    const list = Array.isArray(qaList) ? qaList : [];

    el.innerHTML = list.length === 0
        ? '<div class="empty-qa">尚無問卷資料</div>'
        : list.map((q, idx) => `
        <div class="qa-block">
          <div class="qa-question">${idx + 1}. ${q.question ?? '—'}</div>
          <div class="qa-answer">${q.answer ?? '—'}</div>
        </div>
      `).join('');
}


document.addEventListener('click', async (e) => {
    const btn = e.target.closest('button[data-action]');
    if (!btn) return;

    const action = btn.dataset.action;

    // ✅ 1) 最高優先：modal 內的「已閱讀完畢」
    if (action === 'read-finished') {
        console.log('[read-finished] clicked', currentApplicationId);

        if (!currentApplicationId) {
            alert('找不到 currentApplicationId，請重新開一次詳細資料');
            return;
        }
        const token = localStorage.getItem('authToken');
        if (!token) {
            alert('請先登入才能更新狀態');
            return;
        }

        try {
            const res = await fetch(
                `/api/process/${currentApplicationId}/view-detail`,
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                }
            );

            console.log('[read-finished] status=', res.status);
            if (res.status === 401) {
                alert('登入已失效，請重新登入');
                return;
            }

            if (res.status === 403) {
                alert('你沒有權限操作這筆申請');
                return;
            }


            if (!res.ok) {
                const text = await res.text().catch(() => '');
                alert(`更新狀態失敗：HTTP ${res.status}\n${text}`);
                return;
            }

            // console.log('[read-finished] SUCCESS - db should be updated to 2');
            detailModal.classList.remove('show');
            await loadReviewPage();
            currentApplicationId = null;

        } catch (err) {
            console.error(err);
            alert('網路錯誤，請稍後再試');
        }
        return; // ⭐ 一定要 return，避免往下走
    }

    // ✅ 2) 其他 action 必須在 applicant-item 內
    if (btn.disabled) return;

    const item = btn.closest('.applicant-item');
    if (!item) return;

    e.stopPropagation();
    const applicationId = item.dataset.applicationId;
    if (!applicationId) return;

    try {
        if (action === 'chat') {
            const res = await postAction(`/api/process/${applicationId}/open-chat`);
            // 成功 → 後端改 3
        } else if (action === 'reject') {
            await postAction(`/api/process/${applicationId}/reject`);
        } else if (action === 'accept') {
            await postAction(`/api/process/${applicationId}/approve`);
        } else {
            return;
        }
        await loadReviewPage();   // ⭐ 以後端狀態為準
    } catch (err) {
        console.error(err);
        alert('操作失敗，請稍後再試');
    }
});

async function postAction(url) {
    const token = localStorage.getItem('authToken');

    if (!token) {
        throw new Error('請先登入才能操作');
    }

    const res = await fetch(url, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });
    if (res.status === 401) {
        throw new Error('登入已失效，請重新登入');
    }

    if (res.status === 403) {
        throw new Error('你沒有權限操作這筆申請');
    }

    if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(`操作失敗：HTTP ${res.status}\n${text}`);
    }

    return res;
}
// 頁面載入動畫控制
function showPageLoading() {
    document.querySelector(".loading-overlay").classList.remove("hidden");
}

function hidePageLoading() {
    document.querySelector(".loading-overlay").classList.add("hidden");
}

