// 全域變數
let currentPage = 1;
let totalPages = 1;
let totalRecords = 0;
const pageSize = 10;
let currentMemberId = '';
let allMembers = [];

// API 設定
const API_BASE_URL = 'http://localhost:8080';
const USE_MOCK = false; // 設為 false 使用真實 API

// 等待元件載入完成後初始化
document.addEventListener('DOMContentLoaded', function () {
    // 載入 header 和 sidebar 元件
    Promise.all([
        loadComponent('.header', 'components/header.html'),
        loadComponent('.sidebar', 'components/sidebar.html')
    ]).then(() => {
        // 初始化頁面
        initializePage();
    }).catch(error => {
        console.error('元件載入失敗:', error);
    });
});

// 初始化頁面
function initializePage() {
    // 檢查是否已登入
    const authToken = localStorage.getItem('authToken');
    if (!authToken) {
        alert('請先登入');
        window.location.href = 'login.html';
        return;
    }

    // 綁定事件
    bindEvents();

    // 載入第一頁會員資料
    loadMembers(1);
}

// 綁定所有事件
function bindEvents() {
    const modal = document.getElementById('memberModal');
    const closeBtn = document.querySelector('.close-btn');
    const cancelBtn = document.querySelector('.btn-cancel');
    const saveBtn = document.querySelector('.btn-save');
    const searchInput = document.getElementById('searchInput');
    const prevBtn = document.querySelector('.btn-page-prev');
    const nextBtn = document.querySelector('.btn-page-next');
    const checkAccountBox = document.getElementById('modalcheckaccount');

    // 關閉 Modal
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            modal.style.display = 'none';
        });
    }

    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
            modal.style.display = 'none';
        });
    }

    // 儲存按鈕
    if (saveBtn) {
        saveBtn.addEventListener('click', saveMemberData);
    }

    // 搜尋功能
    if (searchInput) {
        searchInput.addEventListener('input', debounce(function () {
            currentPage = 1;
            loadMembers(1, this.value.trim());
        }, 500));
    }

    // 分頁按鈕
    if (prevBtn) {
        prevBtn.addEventListener('click', previousPage);
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', nextPage);
    }

    // 凍結帳號 checkbox
    if (checkAccountBox) {
        checkAccountBox.addEventListener('change', function () {
        });
    }

    // 點擊 Modal 外部關閉
    window.addEventListener('click', function (event) {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });
}

// 從後端載入會員資料
async function loadMembers(page = 1, searchTerm = '') {
    // 如果使用模擬資料
    if (USE_MOCK) {
        loadMockData(page);
        return;
    }

    try {
        // 建構 API URL
        const params = new URLSearchParams({
            page: page,
            pageSize: pageSize
        });

        if (searchTerm) {
            params.append('search', searchTerm);
        }

        const authToken = localStorage.getItem('authToken');
        const headers = { 'Content-Type': 'application/json' };
        if (authToken) {
            headers['Authorization'] = `Bearer ${authToken}`;
        }

        const response = await fetch(`${API_BASE_URL}/api/members?${params.toString()}`, { headers });

        if (response.status === 401) {
            alert('登入已過期，請重新登入');
            localStorage.removeItem('authToken');
            window.location.href = 'login.html';
            return;
        }

        if (!response.ok) {
            throw new Error('載入會員資料失敗');
        }

        const apiResponse = await response.json();

        // 檢查 API 回應格式
        if (!apiResponse.success || !apiResponse.data) {
            throw new Error(apiResponse.message || '載入會員資料失敗');
        }

        const result = apiResponse.data;

        // 更新分頁資訊
        currentPage = result.pagination.currentPage;
        totalPages = result.pagination.totalPages;
        totalRecords = result.pagination.totalRecords;
        allMembers = result.data;

        // 渲染會員列表
        renderMembers(result.data);

        // 更新分頁顯示
        updatePageInfo();

    } catch (error) {
        console.error('載入會員資料失敗:', error);
        alert('載入會員資料失敗，請檢查後端服務是否啟動');
    }
}

// 模擬資料 (用於測試)
// function loadMockData(page) {
//     const mockMembers = [
//         {
//             id: 1,
//             email: 'omkardeshmane832@gmail.com',
//             name: 'omkar deshmane',
//             nickname: 'ReHome',
//             gender: '男',
//             birthday: '1990/01/15',
//             phone: '0912-345678',
//             address: '台中市公益路51號',
//             status: 'active'
//         },
//         {
//             id: 2,
//             email: 'user2@example.com',
//             name: 'User Two',
//             nickname: 'User2',
//             gender: '女',
//             birthday: '1995/05/20',
//             phone: '0923-456789',
//             address: '台北市信義路100號',
//             status: 'block'
//         }
//     ];

//     currentPage = page;
//     totalPages = 5;
//     totalRecords = 48;
//     allMembers = mockMembers;

//     renderMembers(mockMembers);
//     updatePageInfo();
// }

// 渲染會員列表
function renderMembers(members) {
    const tbody = document.getElementById('memberTableBody');

    if (!tbody) {
        console.error('找不到 memberTableBody 元素');
        return;
    }

    tbody.innerHTML = '';

    if (!members || members.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 40px;">無會員資料</td></tr>';
        return;
    }

    members.forEach((member, index) => {
        const row = document.createElement('tr');
        const memberNumber = (currentPage - 1) * pageSize + index + 1;
        const statusText = member.status === 'block' ? 'Block' : 'Active';
        const statusColor = member.status === 'block' ? '#DC3545' : '#28A745';

        row.innerHTML = `
            <td>${memberNumber}</td>
            <td>${member.email}</td>
            <td>${member.name}</td>
            <td style="text-align: center; color: ${statusColor}; font-weight: 600;">${statusText}</td>
            <td class="action-buttons">
                <button class="btn-edit" data-member-id="${member.id}">Edit</button>
            </td>
        `;

        tbody.appendChild(row);
    });

    // 重新綁定 Edit 按鈕事件
    bindEditButtons();
}

// 綁定 Edit 按鈕事件
function bindEditButtons() {
    const editBtns = document.querySelectorAll('.btn-edit');

    editBtns.forEach(btn => {
        btn.addEventListener('click', function () {
            const memberId = parseInt(this.getAttribute('data-member-id'));
            openMemberModal(memberId);
        });
    });
}

// 開啟會員詳細資料 Modal
function openMemberModal(memberId) {
    const member = allMembers.find(m => m.id === memberId);

    if (!member) {
        console.error('找不到會員資料');
        return;
    }

    currentMemberId = memberId;

    // 填入會員資料
    // 設置會員頭像
    const avatarImg = document.getElementById('modalAvatar');
    if (avatarImg) {
        // 如果會員有頭像，使用會員頭像；否則使用預設圖片
        if (member.icon) {
            // 如果是 Base64 Data URL 或完整 URL (http/https 開頭) 就直接使用
            if (member.icon.startsWith('data:') || 
                member.icon.startsWith('http://') || 
                member.icon.startsWith('https://')) {
                avatarImg.src = member.icon;
            } else {
                // 如果是相對路徑，則加上 API_BASE_URL
                avatarImg.src = `${API_BASE_URL}${member.icon.startsWith('/') ? '' : '/'}${member.icon}`;
            }
        } else {
            // 使用預設頭像或 Logo
            avatarImg.src = '../../assets/img/logo/Logo.png';
        }
    }
    
    document.getElementById('modalEmail').textContent = member.email || '';
    document.getElementById('modalName').textContent = member.name || '';
    document.getElementById('modalNickname').textContent = member.nickname || '';
    document.getElementById('modalGender').textContent = member.gender || '';
    document.getElementById('modalBirthday').textContent = member.birthday || '';
    document.getElementById('modalPhone').textContent = member.phone || '';
    document.getElementById('modalAddress').textContent = member.address || '';

    // 設定凍結帳號 checkbox
    // checked = true 表示 Block (凍結)
    // checked = false 表示 Active (正常)
    const checkBox = document.getElementById('modalcheckaccount');
    checkBox.checked = member.status === 'block';

    // 顯示 Modal
    document.getElementById('memberModal').style.display = 'block';
}

// 儲存會員資料
async function saveMemberData() {
    const checkBox = document.getElementById('modalcheckaccount');
    const newStatus = checkBox.checked ? 'block' : 'active';

    // 如果使用模擬資料
    if (USE_MOCK) {
        const member = allMembers.find(m => m.id === currentMemberId);
        if (member) {
            member.status = newStatus;
            renderMembers(allMembers);
            document.getElementById('memberModal').style.display = 'none';
            setTimeout(() => {
                alert(`會員帳號已${newStatus === 'block' ? '凍結' : '啟用'}!`);
            }, 100);
        }
        return;
    }

    try {
        // 發送到後端更新
        const authToken = localStorage.getItem('authToken');
        const headers = { 'Content-Type': 'application/json' };
        if (authToken) {
            headers['Authorization'] = `Bearer ${authToken}`;
        }

        const response = await fetch(`${API_BASE_URL}/api/members/${currentMemberId}`, {
            method: 'PUT',
            headers: headers,
            body: JSON.stringify({
                status: newStatus
            })
        });

        if (!response.ok) {
            throw new Error('更新失敗');
        }

        const apiResponse = await response.json();

        if (!apiResponse.success) {
            throw new Error(apiResponse.message || '更新失敗');
        }

        // 更新本地資料
        const member = allMembers.find(m => m.id === currentMemberId);
        if (member) {
            member.status = newStatus;
        }

        // 重新渲染表格
        renderMembers(allMembers);

        // 關閉 Modal
        document.getElementById('memberModal').style.display = 'none';

        // 顯示成功訊息
        setTimeout(() => {
            alert(apiResponse.message || `會員帳號已${newStatus === 'block' ? '凍結' : '啟用'}!`);
        }, 100);

    } catch (error) {
        alert('更新會員狀態失敗: ' + error.message);
    }
}

// 更新分頁顯示
function updatePageInfo() {
    const currentPageEl = document.getElementById('currentPage');
    const totalPagesEl = document.getElementById('totalPages');
    const prevBtn = document.querySelector('.btn-page-prev');
    const nextBtn = document.querySelector('.btn-page-next');

    if (currentPageEl) {
        currentPageEl.textContent = currentPage;
    }

    if (totalPagesEl) {
        totalPagesEl.textContent = totalPages;
    }

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

// 上一頁
function previousPage() {
    if (currentPage > 1) {
        const searchTerm = document.getElementById('searchInput').value.trim();
        loadMembers(currentPage - 1, searchTerm);
    }
}

// 下一頁
function nextPage() {
    if (currentPage < totalPages) {
        const searchTerm = document.getElementById('searchInput').value.trim();
        loadMembers(currentPage + 1, searchTerm);
    }
}

// 防抖函數
function debounce(func, wait) {
    let timeout; // 計時器
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout); // 清除計時器
            func.apply(this, args); // 執行函數
        };
        clearTimeout(timeout); // 清除之前的計時器
        timeout = setTimeout(later, wait); // 重新設定計時器
    };
}