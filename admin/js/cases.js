// ========== 環境配置 ==========
const CASES_CONFIG = {
    USE_MOCK: false,  // 改為使用真實 API
    API_BASE_URL: 'http://localhost:8080/api',
    DEBUG: true
};

// ========== 狀態對應表 ==========
const STATUS_MAP = {
    'all': null,      // 全部:不傳 status
    'pending': 1,     // 等待審核
    'approved': 2,    // 審核成功
    'rejected': 3     // 審核失敗
};

// 反向對應:數字 -> 字串
const STATUS_TEXT_MAP = {
    1: 'pending',
    2: 'approved',
    3: 'rejected',
    4: 'closed'
};

// ========== 全域變數 ==========
let currentPage = 1;
let totalPages = 1;
let totalRecords = 0;
const pageSize = 10;
let currentCaseId = '';
let allCases = [];  // 儲存所有案件資料
let filteredCases = [];  // 儲存篩選後的案件資料
let currentFilter = 'all';  // 當前篩選狀態
let isDataLoaded = false;  // 資料是否已載入

// ========== 初始化 ==========
document.addEventListener('DOMContentLoaded', function () {
    Promise.all([
        loadComponent('.header', 'components/header.html'),
        loadComponent('.sidebar', 'components/sidebar.html')
    ]).then(() => {
        initializePage();
    }).catch(error => {
        casesLogger.error('元件載入失敗:', error);
    });
});

function initializePage() {
    bindEvents();
    loadAllCasesFromAPI();  // 一次性載入所有資料
}

// ========== 綁定事件 ==========
function bindEvents() {
    const statusFilter = document.getElementById('statusFilter');
    if (statusFilter) {
        statusFilter.addEventListener('change', function () {
            currentFilter = this.value;
            currentPage = 1;  // 重置到第一頁
            applyFilterAndRender();
        });
    }

    // 分頁按鈕
    const prevBtn = document.querySelector('.btn-page-prev');
    const nextBtn = document.querySelector('.btn-page-next');

    if (prevBtn) prevBtn.addEventListener('click', () => goToPage(currentPage - 1));
    if (nextBtn) nextBtn.addEventListener('click', () => goToPage(currentPage + 1));

    // Modal 關閉
    const rejectModal = document.getElementById('rejectModal');
    const closeBtn = rejectModal?.querySelector('.close-btn');
    const cancelBtn = rejectModal?.querySelector('.btn-cancel');

    if (closeBtn) closeBtn.addEventListener('click', closeRejectModal);
    if (cancelBtn) cancelBtn.addEventListener('click', closeRejectModal);

    // 送出不同意原因
    const submitBtn = rejectModal?.querySelector('.btn-submit');
    if (submitBtn) submitBtn.addEventListener('click', submitReject);

    // 點擊 Modal 外部關閉
    window.addEventListener('click', function (event) {
        if (event.target === rejectModal) {
            closeRejectModal();
        }
    });
}

// ========== 一次性載入所有案件資料 ==========
async function loadAllCasesFromAPI() {
    if (isDataLoaded) return;  // 如果已載入，不重複載入
    
    try {
        showNotification('載入案件資料中...', 'info');
        
        if (CASES_CONFIG.USE_MOCK) {
            await new Promise(resolve => setTimeout(resolve, 300));
            allCases = loadMockData(1).data;
        } else {
            // 取得 JWT token
            const authToken = localStorage.getItem('authToken');
            const headers = {
                'Content-Type': 'application/json'
            };
            
            if (authToken) {
                headers['Authorization'] = `Bearer ${authToken}`;
            }
            
            // 並行呼叫所有狀態的 API (1:待審核, 2:已通過, 3:已拒絕)
            const promises = [1, 2, 3].map(async (status) => {
                const url = `${CASES_CONFIG.API_BASE_URL}/review/${status}`;
                
                const response = await fetch(url, { headers });
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                const apiResponse = await response.json();
                return apiResponse.success ? apiResponse.data : [];
            });
            
            // 等待所有請求完成
            const results = await Promise.all(promises);
            
            // 合併所有結果並轉換格式
            const allData = results.flat();
            allCases = transformBackendData(allData);
        }
        
        isDataLoaded = true;
        currentPage = 1;
        
        // 套用篩選並渲染
        applyFilterAndRender();
        
    } catch (error) {
        casesLogger.error('載入案件資料失敗:', error);
        showNotification('載入案件資料失敗，請檢查網路連線或稍後再試', 'error');
        renderCases([]);
    }
}

async function updateCaseStatusAPI(caseId, status, reason = '') {
    if (CASES_CONFIG.USE_MOCK) {
        await new Promise(resolve => setTimeout(resolve, 300));
        return { success: true, message: '更新成功' };
    } else {
        try {
            // 將前端狀態字串轉為後端需要的 statusId
            const statusId = STATUS_MAP[status];
            
            if (!statusId) {
                throw new Error(`無效的狀態: ${status}`);
            }
            
            const authToken = localStorage.getItem('authToken');
            const headers = { 'Content-Type': 'application/json' };
            if (authToken) {
                headers['Authorization'] = `Bearer ${authToken}`;
            }
            
            // 使用後端的 PATCH /api/review/{caseNumber}/status
            const response = await fetch(`${CASES_CONFIG.API_BASE_URL}/review/${caseId}/status`, {
                method: 'PATCH',
                headers: headers,
                body: JSON.stringify({ 
                    statusId: statusId,
                    rejectReason: reason || null
                })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const apiResponse = await response.json();
            
            return apiResponse;
        } catch (error) {
            throw error;
        }
    }
}

// ========== 套用篩選並渲染（前端分頁）==========
function applyFilterAndRender() {
    // 根據篩選條件過濾資料
    if (currentFilter === 'all') {
        filteredCases = [...allCases];
    } else {
        filteredCases = allCases.filter(c => c.status === currentFilter);
    }
    
    // 計算分頁資訊
    totalRecords = filteredCases.length;
    totalPages = Math.ceil(totalRecords / pageSize) || 1;
    
    // 確保當前頁碼在有效範圍內
    if (currentPage > totalPages) {
        currentPage = totalPages;
    }
    if (currentPage < 1) {
        currentPage = 1;
    }
    
    // 渲染當前頁的資料
    renderCurrentPage();
}

// ========== 渲染當前頁 ==========
function renderCurrentPage() {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const pagedData = filteredCases.slice(startIndex, endIndex);
    
    renderCases(pagedData);
    updatePageInfo();
}

// ========== 跳轉到指定頁 ==========
function goToPage(page) {
    if (page < 1 || page > totalPages) return;
    currentPage = page;
    renderCurrentPage();
}

// ========== 資料轉換函數 ==========
/**
 * 將後端 ReviewCaseResponse 轉換為前端需要的格式
 * 後端格式: { caseNumber, status, caseType, caseStartDate, account, description }
 * 前端格式: { id, type, member, memberId, status, detailUrl }
 */
function transformBackendData(backendData) {
    if (!Array.isArray(backendData)) {
        casesLogger.error('後端資料格式錯誤,預期為陣列:', backendData);
        return [];
    }
    
    return backendData.map(item => ({
        id: item.caseNumber,           // 案件編號
        type: item.caseType,           // 案件類型 (走失協尋/送養)
        member: item.account,          // 會員帳號 (email)
        memberId: item.memberId || null, // 會員 ID (如果後端有提供)
        status: STATUS_TEXT_MAP[item.status] || 'unknown', // 轉換狀態 ID 為字串
        statusId: item.status,         // 保留原始狀態 ID
        detailUrl: '',                 // 詳情頁 URL (暫時為空)
        description: item.description, // 案件描述
        caseStartDate: item.caseStartDate // 立案時間
    }));
}

// ========== Mock 資料 ==========
function loadMockData(page) {
    const mockCases = [
        {
            id: 'ZS202511121742Q1',
            type: '走失協尋',
            member: 'ReHome',
            memberId: 1,
            status: 'pending',  // pending, approved, rejected
            detailUrl: ''  // 後端可提供詳情頁 URL（選填）
        },
        {
            id: 'SY202511121742Q2',
            type: '送養',
            member: 'User01',
            memberId: 2,
            status: 'pending',
            detailUrl: ''
        },
        {
            id: 'SY202511121742Q3',
            type: '送養',
            member: 'User02',
            memberId: 3,
            status: 'approved',  // 已同意
            detailUrl: ''
        },
        {
            id: 'ZS202511121742Q4',
            type: '走失協尋',
            member: 'User03',
            memberId: 4,
            status: 'rejected',  // 已拒絕
            detailUrl: ''
        }
    ];

    // 計算實際的分頁資訊
    const totalRecords = mockCases.length;
    const totalPages = Math.ceil(totalRecords / pageSize);

    return {
        data: mockCases,
        pagination: {
            currentPage: page,
            totalPages: totalPages,  // 實際計算：4 筆 ÷ 10 = 1 頁
            totalRecords: totalRecords  // 實際筆數：4 筆
        }
    };
}

// ========== 渲染案件列表 ==========
function renderCases(cases) {
    const tbody = document.getElementById('casesTableBody');
    if (!tbody) return;

    tbody.innerHTML = '';

    if (!cases || cases.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 40px;">無案件資料</td></tr>';
        return;
    }

    cases.forEach(casesNumber => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><a href="/#pet-admin-adoption-detail?casenumber=${casesNumber.id}" target="_blank" class="case-id-link">${casesNumber.id}</a></td>
            <td>${casesNumber.type}</td>
            <td>${casesNumber.member}</td>
            <td class="status-cell">${getStatusDisplay(casesNumber.status)}</td>
            <td class="action-buttons">${getActionButtons(casesNumber)}</td>
        `;
        tbody.appendChild(row);
    });

    // 綁定按鈕事件
    bindActionButtons();
}



// ========== 取得狀態顯示 ==========
function getStatusDisplay(status) {
    const statusMap = {
        'pending': '<span style="color: #F59E0B; font-weight: 600;">待審核</span>',
        'approved': '<span style="color: #10B981; font-weight: 600;">已同意</span>',
        'rejected': '<span style="color: #EF4444; font-weight: 600;">不同意</span>'
    };
    return statusMap[status] || status;
}

// ========== 取得 Action 按鈕 ==========
function getActionButtons(casesNumber) {
    // 如果已審核，不顯示任何按鈕
    if (casesNumber.status === 'approved' || casesNumber.status === 'rejected') {
        return '-';
    }

    // 待審核：顯示同意/不同意按鈕
    return `
        <button class="btn-approve" data-case-id="${casesNumber.id}">同意</button>
        <button class="btn-reject" data-case-id="${casesNumber.id}">不同意</button>
    `;
    // <button class="btn-contact" data-case-id="${caseItem.id}">聯繫會員</button>
}

// ========== 綁定 Action 按鈕事件 ==========
function bindActionButtons() {
    // 同意按鈕
    document.querySelectorAll('.btn-approve').forEach(btn => {
        btn.addEventListener('click', function () {
            const caseId = this.getAttribute('data-case-id');
            approveCase(caseId);
        });
    });

    // 不同意按鈕
    document.querySelectorAll('.btn-reject').forEach(btn => {
        btn.addEventListener('click', function () {
            const caseId = this.getAttribute('data-case-id');
            openRejectModal(caseId);
        });
    });

    // 聯繫會員按鈕
    // document.querySelectorAll('.btn-contact').forEach(btn => {
    //     btn.addEventListener('click', function () {
    //         const caseId = this.getAttribute('data-case-id');
    //         contactMember(caseId);
    //     });
    // });
}

// ========== 同意案件 ==========
async function approveCase(caseId) {
    if (!confirm(`確定要同意案件 ${caseId} 嗎?`)) return;

    try {
        const result = await updateCaseStatusAPI(caseId, 'approved');

        if (result.success) {
            // 更新本地資料
            const casesNumber = allCases.find(c => c.id === caseId);
            if (casesNumber) {
                casesNumber.status = 'approved';
            }

            // 重新套用篩選並渲染
            applyFilterAndRender();

            showNotification(`案件 ${caseId} 已同意通過!`, 'success');
        } else {
            showNotification(result.message || '操作失敗', 'error');
        }

    } catch (error) {
        console.error('同意案件失敗:', error);
        showNotification('系統錯誤，請稍後再試', 'error');
    }
}

// ========== 開啟不同意 Modal ==========
function openRejectModal(caseId) {
    currentCaseId = caseId;
    document.getElementById('rejectCaseId').textContent = caseId;
    document.getElementById('rejectReason').value = '';
    document.getElementById('rejectModal').style.display = 'block';
}

// ========== 關閉不同意 Modal ==========
function closeRejectModal() {
    document.getElementById('rejectModal').style.display = 'none';
    currentCaseId = '';
}

// ========== 送出不同意原因 ==========
async function submitReject() {
    const reason = document.getElementById('rejectReason').value.trim();

    if (!reason) {
        showNotification('請輸入不同意的原因!', 'error');
        return;
    }

    try {
        const result = await updateCaseStatusAPI(currentCaseId, 'rejected', reason);

        if (result.success) {
            // 更新本地資料
            const casesNumber = allCases.find(c => c.id === currentCaseId);
            if (casesNumber) {
                casesNumber.status = 'rejected';
                casesNumber.rejectReason = reason;
            }

            // 重新套用篩選並渲染
            applyFilterAndRender();

            showNotification(`案件 ${currentCaseId} 已拒絕!`, 'success');
            closeRejectModal();
        } else {
            showNotification(result.message || '操作失敗', 'error');
        }

    } catch (error) {
        casesLogger.error('拒絕案件失敗:', error);
        showNotification('系統錯誤，請稍後再試', 'error');
    }
}

// ========== 聯繫會員 ==========
// function contactMember(caseId) {
//     const caseItem = allCases.find(c => c.id === caseId);
//     if (caseItem && caseItem.memberId) {
//         // 跳轉到會員頁面
//         window.location.href = `./member.html?memberId=${caseItem.memberId}`;
//     }
// }

// ========== 更新分頁資訊 ==========
function updatePageInfo() {
    const currentPageEl = document.getElementById('currentPage');
    const totalPagesEl = document.getElementById('totalPages');
    const prevBtn = document.querySelector('.btn-page-prev');
    const nextBtn = document.querySelector('.btn-page-next');

    if (currentPageEl) currentPageEl.textContent = currentPage;
    if (totalPagesEl) totalPagesEl.textContent = totalPages;

    // 控制按鈕啟用/停用狀態
    if (prevBtn) {
        prevBtn.disabled = currentPage <= 1;
        prevBtn.style.opacity = currentPage <= 1 ? '0.5' : '1';
        prevBtn.style.cursor = currentPage <= 1 ? 'not-allowed' : 'pointer';
    }

    if (nextBtn) {
        nextBtn.disabled = currentPage >= totalPages;
        nextBtn.style.opacity = currentPage >= totalPages ? '0.5' : '1';
        nextBtn.style.cursor = currentPage >= totalPages ? 'not-allowed' : 'pointer';
    }
}

// ========== 通知訊息 ==========
function showNotification(message, type = 'info') {
    const oldNotification = document.querySelector('.notification');
    if (oldNotification) oldNotification.remove();

    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;

    Object.assign(notification.style, {
        position: 'fixed',
        top: '20px',
        right: '20px',
        padding: '15px 25px',
        borderRadius: '10px',
        color: '#FFFFFF',
        fontSize: '16px',
        fontWeight: '600',
        zIndex: '99999',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
        backgroundColor: type === 'success' ? '#10B981' : '#EF4444'
    });

    document.body.appendChild(notification);

    setTimeout(() => notification.remove(), 3000);
}