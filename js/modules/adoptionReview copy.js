/* adoptionReview.js
   處理雙層風琴選單與狀態解鎖邏輯 
*/

let currentAppId = null; // 記錄目前正在查看詳情的申請人 ID

// 1. 第一層 Accordion: 案件卡片開關
function togglePetAccordion(headerElement) {
    const card = headerElement.parentElement;
    card.classList.toggle('expanded');
}

// 2. 第二層 Accordion: 申請人列表開關
function toggleApplicant(headerElement) {
    const item = headerElement.parentElement;
    
    // 如果想要「手風琴效果」(一次只能開一個)，可以加上這段：
    const allItems = document.querySelectorAll('.applicant-item');
    allItems.forEach(el => {
        if(el !== item) el.classList.remove('active');
    });

    item.classList.toggle('active');
}

// 3. 開啟 Modal (詳細資料)
function openDetailModal(appId) {
    currentAppId = appId; // 記住現在是誰被點開
    const modal = document.getElementById('detailModal');
    
    // TODO: 在這裡可以透過 AJAX/Fetch 去後端抓取該 appId 的真實資料
    // 範例：document.getElementById('modal-name').innerText = fetchedData.name;
    document.getElementById('modal-name').innerText = (appId === 'app-001') ? "王小明" : "陳美美";

    modal.classList.add('show');
}

// 4. 關閉 Modal 並觸發「解鎖按鈕」邏輯
function closeModal() {
    const modal = document.getElementById('detailModal');
    modal.classList.remove('show');

    // 使用者關閉視窗，代表「已閱讀完畢」
    if (currentAppId) {
        unlockActions(currentAppId);
    }
}

// 5. 解鎖聊天室與接受按鈕 (模擬 API Call)
function unlockActions(appId) {
    console.log(`正在更新案件狀態 for ${appId} (模擬 Call API: 改成媒合期2)...`);

    // 模擬網路延遲效果
    setTimeout(() => {
        const appItem = document.getElementById(appId);
        if (!appItem) return;

        // 找到該區塊內的按鈕
        const btnChat = appItem.querySelector('.btn-chat');
        const btnAccept = appItem.querySelector('.btn-accept');

        // 1. 移除 disabled 屬性
        btnChat.removeAttribute('disabled');
        btnAccept.removeAttribute('disabled');

        // 2. 加上 active 樣式 class (讓顏色變亮)
        btnChat.classList.add('unlocked-chat');
        btnAccept.classList.add('unlocked-accept');

        // 3. 更改文字提示 (可選)
        // btnChat.innerHTML = '前往聊天室 <i class="bi bi-chat-dots"></i>';

        console.log("狀態更新完畢：按鈕已解鎖");
        
        // 清空當前 ID
        currentAppId = null; 

    }, 300); // 300ms 延遲
}

// 點擊 Modal 背景也可以關閉
document.getElementById('detailModal').addEventListener('click', function(e) {
    if (e.target === this) {
        closeModal();
    }
});


async function loadReviewList() {
  const res = await fetch('/api/member/adoption-reviews', {
    headers: {
      Authorization: `Bearer ${localStorage.getItem('token')}`
    }
  });

  const json = await res.json();
  if (!json.success) return;

  renderCases(json.data);
}

function renderCases(cases) {
  const container = document.querySelector('.review-list');
  container.innerHTML = '';

  cases.forEach(item => {
    const { caseInfo, applications } = item;

    const card = document.createElement('div');
    card.className = 'pet-review-card';

    card.innerHTML = `
      <div class="pet-header">
        <img src="${caseInfo.photo ?? 'default.jpg'}">
        <span class="count-badge">${caseInfo.count}</span>
      </div>

      <div class="applicant-list">
        ${applications.map(app => renderApplicant(app)).join('')}
      </div>
    `;

    container.appendChild(card);
  });
}

function renderApplicant(app) {
  return `
    <div class="applicant-item" data-app-id="${app.applicationId}">
      <div class="applicant-info">
        <span class="name">${app.name}</span>
        <span class="date">${app.date}</span>
      </div>

      <div class="status-dot status-${app.statusId}"></div>

      <div class="actions">
        <button onclick="openDetailModal(${app.applicationId})">詳細資料</button>
        <button class="btn-chat" disabled>聊天室</button>
        <button class="btn-accept" disabled>接受</button>
        <button onclick="rejectApplication(${app.applicationId})">拒絕</button>
      </div>
    </div>
  `;
}
