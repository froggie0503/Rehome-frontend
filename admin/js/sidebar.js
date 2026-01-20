// ========== Session 管理 (整合到 Sidebar) ==========
(function () {
    'use strict';

    const CONFIG = {
        API_BASE_URL: 'http://localhost:8080/api'
    };

    // ========== JWT 工具函數 ==========
    function getCurrentUser() {
        try {
            const authToken = localStorage.getItem('authToken');
            const userRole = localStorage.getItem('userRole');
            
            if (!authToken) return null;
            
            return {
                authToken,
                userRole
            };
        } catch (error) {
            console.error('讀取使用者資料失敗:', error);
            return null;
        }
    }

    function saveCurrentUser(userData) {
        try {
            localStorage.setItem('authToken', userData.accessToken || userData.authToken);
            localStorage.setItem('userRole', userData.role || userData.userRole);
        } catch (error) {
            console.error('儲存使用者資料失敗:', error);
        }
    }

    function clearCurrentUser() {
        localStorage.removeItem('authToken');
        localStorage.removeItem('userRole');
    }

    function getAccessToken() {
        return localStorage.getItem('authToken');
    }

    function setAccessToken(token) {
        localStorage.setItem('authToken', token);
    }

    function getUserRole() {
        return localStorage.getItem('userRole');
    }

    function isLoggedIn() {
        const user = getCurrentUser();
        return user !== null && user.authToken;
    }

    function isTokenExpired() {
        // Token 過期由後端 JWT 驗證處理，前端不再檢查
        return false;
    }

    // ========== 後端 API 呼叫 ==========
    async function logoutAPI() {
        const user = getCurrentUser();
        if (!user || !user.authToken) return;

        try {
            const response = await fetch(`${CONFIG.API_BASE_URL}/auth/logout`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user.authToken}`
                }
            });

            if (response.ok) {
            }
        } catch (error) {
            console.error('登出 API 呼叫失敗:', error);
        }
    }

    // ========== 登出功能 ==========
    async function logout(showMessage = true) {
        await logoutAPI();
        clearCurrentUser();

        if (showMessage) {
            alert('已登出');
        }

        window.location.href = 'login.html';
    }

    // ========== 登入檢查 ==========
    function requireLogin() {
        if (!isLoggedIn()) {
            alert('請先登入');
            window.location.href = 'login.html';
            return false;
        }

        if (isTokenExpired()) {
            alert('登入已過期，請重新登入');
            clearCurrentUser();
            window.location.href = 'login.html';
            return false;
        }

        return true;
    }

    // ========== 初始化 ==========
    function bindLogoutEvent() {
        const logoutBtn = document.getElementById('logoutBtn');

        if (logoutBtn && !logoutBtn.dataset.bound) {

            // 綁定點擊事件
            logoutBtn.addEventListener('click', async function (e) {
                e.preventDefault();
                e.stopPropagation();

                if (confirm('確定要登出嗎？')) {
                    await logout();
                } else {

                }
            }, { capture: true });

            logoutBtn.dataset.bound = 'true';
            return true;
        }
        return false;
    }

    function initSidebar() {

        if (!requireLogin()) return;

        if (bindLogoutEvent()) {
            return;
        }

        const observer = new MutationObserver((mutations) => {
            if (bindLogoutEvent()) {
                observer.disconnect();
            }
        });

        // 監聽整個 document 的子節點變化
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });

        // 設定 timeout 重試
        let attempts = 0;
        const maxAttempts = 20;
        const retryInterval = setInterval(() => {
            attempts++;
            if (bindLogoutEvent()) {
                clearInterval(retryInterval);
            } else if (attempts >= maxAttempts) {
                clearInterval(retryInterval);
            }
        }, 100);
    }

    // 立即執行
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initSidebar);
    } else {
        initSidebar();
    }

    // 暴露到全域 (供其他頁面使用)
    window.authManager = {
        getCurrentUser,
        getAuthToken: getAccessToken,
        getUserRole,
        setAccessToken,
        isLoggedIn,
        isTokenExpired,
        logout,
        clearCurrentUser,
        saveCurrentUser
    };
})();