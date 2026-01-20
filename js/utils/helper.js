// 共用元件模組
// -------------- 變數對應表 ----------------
export const sizeMap = {
    small: '小型',
    medium: '中型',
    big: '大型'
};

export const ageMap = {
    child: '幼年',
    adult: '成年',
    old: '老年'
};

export const genderMap = {
    male: '男',
    female: '女'
};

export const dataTypeList = {
    'region': '所在地',
    'source': '來源',
    'shelter': '收容所',
    'species': '物種',
    'gender': '性別',
    'body_size': '體型',
    'age': '年齡',
    'status': '寵物狀態',
    'neutered_status': '結紮狀態',
    'has_chip': '有無晶片',
    'adoption_area': '可送養範圍'
};

// -------------- 通用方法 ----------------
// ----------------------------
// 全域刷新 Promise，用於多請求同時刷新
// ----------------------------
let refreshingTokenPromise = null;

// ----------------------------
// Token 管理
// ----------------------------
function getAuthToken() {
    return localStorage.getItem('authToken'); 
}

function setAuthToken(token) {
    localStorage.setItem('authToken', token);
}

function clearAuthLocalStorage() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userRole');
}

export function logoutRedirectToLogin() {
    clearAuthLocalStorage();
    window.location.href = '#home';
}

function getAccessToken() {
    return localStorage.getItem('authToken'); 
}

function setAccessToken(token) {
    localStorage.setItem('authToken', token);
}

// ----------------------------
// 登入導向
// ----------------------------
function redirectToLogin() {
    clearAuthLocalStorage();
    console.error('Session expired. Redirecting to login...');
    window.location.href = '#login';
}

// ----------------------------
// Refresh Token
// ----------------------------
async function refreshAccessToken() {
    const refreshTokenUrl = '/api/mem/refresh';

    const response = await fetch(refreshTokenUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
        // Refresh Token 在 HttpOnly Cookie 中，無需手動帶
    });
        
    if (!response.ok) {
        throw new Error('Refresh Token is invalid or expired');
    }

    const result = await response.json();      
    return result.data.accessToken;
}
    

// ----------------------------
// fetchWithAuth 封裝
// ----------------------------
export async function fetchWithAuth(url, options = {}) {
    const config = { ...options };

    const executeFetch = async (currentOptions) => {
        const token = getAccessToken();
        if (token) {
            currentOptions.headers = {
                ...currentOptions.headers,
                'Authorization': `Bearer ${token}`,
            };
        }
        return fetch(url, currentOptions);
    };

    let response = await executeFetch({ ...config });    
    if (response.status === 401) {
        // 如果已有刷新正在進行，等待它完成
        if (!refreshingTokenPromise) {
            refreshingTokenPromise = refreshAccessToken()
                .then(newToken => {
                    console.log(newToken);
                    
                    setAccessToken(newToken);
                    return newToken;
                })
                .catch(error => {
                    redirectToLogin();
                    throw error;
                })
                .finally(() => {
                    refreshingTokenPromise = null;
                });
        }

        try {
            // 等待刷新完成，拿到新 token
            const newAccessToken = await refreshingTokenPromise;            

            // 重試原始請求
            const retryConfig = { ...config, headers: { ...config.headers } };
            retryConfig.headers['Authorization'] = `Bearer ${newAccessToken}`;
            response = await fetch(url, retryConfig);

        } catch (error) {
            return Promise.reject(new Error('Session has expired. Please login again.'));
        }
    }

    if (!response.ok) {
        return Promise.reject(new Error(`API failed with status ${response.status}`));
    }

    return response;
}

export async function checkAuthBeforeRoute(route) {
    let loggedIn = false;

    const token = getAccessToken();
    if (token) {

        if (!AuthManager.isExpired()) {
            loggedIn = true;
        } else {
            // token 過期 → 嘗試刷新
            try {
                const newToken = await refreshAccessToken();  // 這裡會帶 HttpOnly Cookie
                setAccessToken(newToken)
                loggedIn = true;
            } catch (err) {
                // refresh 失敗才跳登入
                loggedIn = false;
                clearAuthLocalStorage(); // 清理失效的 Token
            }
        }
    }

    // route 需要登入，但 refresh 也失敗
    if (route.requiresAuth && !loggedIn) {
        // redirectToLogin();
        showCustomAlert('系統提示', '此功能需要登入後才能使用，請先登入。');
        return false;
    }

    return true;
}

/**
 * Auth 權限管理工具
 */
export const AuthManager = {
    getToken() {
        const token = getAccessToken();
        if (!token) return null;
        return token;
    },

    /**
     * 解析 Token 獲取 Payload 內容
     */
    getPayload() {
        const token = getAccessToken();
        if (!token) return null;

        try {
            // 您提供的核心代碼：解析 JWT 第二段 (Payload)
            // atob() 將 Base64 編碼解碼為字串
            const payload = JSON.parse(atob(token.split('.')[1]));
            return payload;
        } catch (e) {
            console.error("Token 解析失敗", e);
            return null;
        }
    },

    /**
     * 判斷 Token 是否過期
     */
    isExpired() {
        const payload = this.getPayload();
        if (!payload || !payload.exp) return true;

        // 您提供的過期檢查邏輯
        return payload.exp * 1000 < Date.now();
    },

    /**
     * 核心判斷方法：判斷當前角色是否有權限執行某項功能
     * @param {string|string[]} requiredRoles - 允許存取的角色名稱 (例如 'ADMIN')
     */
    hasPermission(requiredRoles) {
        const payload = this.getPayload();
        const userRole = payload ? payload.role : null; // 這是您 Token 裡面包的 'role'

        if (!userRole) return false;

        // 角色比對
        const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
        return roles.includes(userRole);
    }
};

export function ajaxApi(url, method = 'GET', data) {
    const token = getAuthToken(); // 取得 Token

    // 檢查是否有 Token，若無則不新增 Authorization Header
    const headers = token ? {
        // 使用 Bearer scheme 是業界最常見的 JWT 傳輸方式
        'Authorization': 'Bearer ' + token 
    } : {};

    return $.ajax({
        url: '/api/' + url,
        method: method,
        contentType: 'application/json',
        dataType: 'json',
        data: JSON.stringify(data)
        // headers: headers    // ** <-- Auth Token 放置處**
    }).fail((xhr, status, error) => {
        console.log(status);
        console.error('載入資料失敗:', error);
    });
}

export async function fetchApi(url, method = 'GET', data = null, useToken = true) {
    // 取得 Token
    const token = useToken ? getAuthToken() : null;

    // 組合 fetch 選項
    const options = {
        method,
        headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': 'Bearer ' + token })
        }
    };

    // GET/HEAD 不需要 body，其餘方法才加
    if (data && method !== 'GET' && method !== 'HEAD') {
        options.body = JSON.stringify(data);
    }

    try {
        const response = await fetch('/api/' + url, options);

        // 非 2xx 回傳錯誤
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw errorData;
        }

        // 嘗試解析 JSON
        return await response.json().catch(() => ({}));
    } catch (error) {
        console.error('API 請求失敗:', error);
        alert('API 請求失敗：' + (error.message || JSON.stringify(error)));
        throw error; // 讓外部也能捕獲
    }
}

export function formatDate(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d)) return dateStr;
    return d.toLocaleDateString();
}

export function calculateAgeUsingDiff(birthdateString) {
    const birthDate = new Date(birthdateString);
    const today = new Date();
    
    // 計算兩個時間點之間的毫秒數差異
    const diff_ms = today.getTime() - birthDate.getTime(); 

    // 將毫秒轉換為年。使用 1000 毫秒/秒 * 60 秒/分 * 60 分/時 * 24 時/日 * 365.25 日/年 (考慮閏年)
    const ms_per_year = 1000 * 60 * 60 * 24 * 365.25;

    // 將結果向下取整，得到滿歲的年齡
    return Math.floor(diff_ms / ms_per_year);
}

export default {
    sizeMap,
    ageMap,
    genderMap,
    ajaxApi,
    fetchApi,
    formatDate,
    calculateAgeUsingDiff
};