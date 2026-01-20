import { refreshNavbar } from '../utils/navbar.js';



/*------------------------------------------------------------
    登入表單送出
------------------------------------------------------------*/
function initLoginFormSubmit() {
    console.log("initLoginFormSubmit()");
    const loginForm = document.getElementById('login_form');
    console.log("loginForm: " + loginForm);
    
    if (!loginForm) return;
    
    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault(); // 阻止表單預設送出行為
        
        // 收集登入表單資料
        const loginData = collectLoginFormData();
        
        console.log("loginData:", loginData);
        
        // 發送登入請求
        await sendLoginRequest(loginData);
    });
}

/*------------------------------------------------------------
    收集登入表單資料
------------------------------------------------------------*/
function collectLoginFormData() {
    console.log("collectLoginFormData()");
    
    const email = document.getElementById("login_Account").value;
    const password = document.getElementById("login_Password").value;
    const captcha = document.querySelector('input[name="confirmcode"]').value;
    
    return {
        email: email,
        password: password,
        captcha: captcha,  // 暫時先送，後端目前跳過驗證
        sessionId: window.getCaptchaSessionId()  // 取得驗證碼 Session ID
    };
}

/*------------------------------------------------------------
    發送登入請求到後端
------------------------------------------------------------*/
async function sendLoginRequest(loginData) {
    console.log("sendLoginRequest()", loginData);
    try {
        // 發送 POST 請求到後端
        const response = await fetch('/api/mem/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(loginData)
        });
        
        // 處理回應
        const result = await response.json();
        
        if (result.success) {
            // 登入成功
            // alert('登入成功！');
            showCustomAlert("系統提示","登入成功！",2000);
            console.log('登入成功', result);
            
            // 儲存 Token 到 localStorage (data 包含 token 和 role)
            localStorage.setItem('authToken', result.data.accessToken);  // JWT Token
            localStorage.setItem('userRole', result.data.role);    // 使用者角色
            localStorage.setItem('userEmail', loginData.email);    // 使用者 Email
            
            // 記住帳號功能
            const rememberAccount = document.getElementById('login_rememberAccount').checked;
            if (rememberAccount) {
                localStorage.setItem('rememberedEmail', loginData.email);
            } else {
                localStorage.removeItem('rememberedEmail');
            }
            
            // 成功登入後導向首頁
            window.location.href = '#home';
            await refreshNavbar();
            
        } else {
            // 登入失敗
            // alert('登入失敗：' + result.message);
            showCustomAlert("系統提示","登入失敗：" + result.message,2000);
            console.log('登入失敗', result);
        }
        
    } catch (error) {
        // 錯誤處理
        console.error('登入錯誤:', error);
        // alert('連線失敗，請稍後再試');
        showCustomAlert("系統提示","連線失敗，請稍後再試",2000);
    }
}

/*------------------------------------------------------------
    頁面載入時，自動填入記住的帳號
------------------------------------------------------------*/
function initRememberAccount() {
    const loginAccountInput = document.getElementById('login_Account');
    const rememberCheckbox = document.getElementById('login_rememberAccount');
    
    if (!loginAccountInput) return;
    
    // 檢查是否有記住的帳號
    const rememberedEmail = localStorage.getItem('rememberedEmail');
    if (rememberedEmail) {
        loginAccountInput.value = rememberedEmail;
        if (rememberCheckbox) {
            rememberCheckbox.checked = true;
        }
    }
}

// 匯出統一的初始化入口，讓路由在每次載入該頁面時呼叫
export function init() {
    initRememberAccount();
    initLoginFormSubmit();
}