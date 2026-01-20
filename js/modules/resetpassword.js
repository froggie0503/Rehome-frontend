/*------------------------------------------------------------
  重設密碼流程（含 token 驗證與表單驗證）
  - 支援直接開啟連結與 SPA 載入
------------------------------------------------------------*/

// function getResetToken() {
//   console.log(window.location.search);
  
//   const urlParams = new URLSearchParams(window.location.search);
//   return urlParams.get('token');
// }

// 解析 hash + query string 拿到案件編號 12/11更新
function getResetToken() {
    const hash = window.location.hash;
    const parts = hash.split('?');
    if (parts.length < 2) window.location.href = '';
    
    const queryString = parts[1];
    const params = new URLSearchParams(queryString);
    console.log(params);
    return params.get('token');
}

async function initResetPasswordPage() {
  console.log('[重設密碼] 開始初始化頁面');
  
  const resetForm = document.getElementById('repasswd_form');
  if (!resetForm) {
    console.error('[重設密碼] 找不到表單元素 #repasswd_form');
    return;
  }

  const token = getResetToken();
  console.log('[重設密碼] Token:', token);
  
  if (!token) {
    disableResetForm('缺少重設密碼連結 token');
    return;
  }

  console.log('[重設密碼] 開始驗證 Token...');
  const tokenValid = await verifyResetToken(token);
  console.log('[重設密碼] Token 驗證結果:', tokenValid);
  
  if (!tokenValid) {
    disableResetForm('重設連結已失效或不存在');
    return;
  }

  if (typeof genNewCaptcha === 'function') {
    console.log('[重設密碼] 產生驗證碼');
    genNewCaptcha(); // 確保 canvas 存在後刷新驗證碼
  } else {
    console.warn('[重設密碼] genNewCaptcha 函數不存在');
  }

  console.log('[重設密碼] 初始化表單送出事件');
  initResetPasswordSubmit();
  
  console.log('[重設密碼] 初始化密碼驗證');
  initPasswordValidation();
  
  console.log('[重設密碼] 頁面初始化完成');
}

/*------------------------------------------------------------
  向後端驗證 token
------------------------------------------------------------*/
async function verifyResetToken(token) {
  try {
    const response = await fetch(`/api/mem/verify-reset-token?token=${encodeURIComponent(token)}`);
    const result = await response.json();
    return result.success === true;
  } catch (error) {
    console.error('Verify reset token failed', error);
    return false;
  }
}

function disableResetForm(message) {
  const resetForm = document.getElementById('repasswd_form');
  if (!resetForm) return;
  resetForm.querySelectorAll('input, button').forEach(el => el.disabled = true);
  if (message) alert(message);
}

/*------------------------------------------------------------
  表單送出
------------------------------------------------------------*/
function initResetPasswordSubmit() {
  const resetForm = document.getElementById('repasswd_form');
  if (!resetForm) {
    console.error('[重設密碼] initResetPasswordSubmit: 找不到表單');
    return;
  }

  console.log('[重設密碼] 綁定表單送出事件');
  
  resetForm.addEventListener('submit', async function (e) {
    e.preventDefault();
    console.log('[重設密碼] 表單送出事件觸發');

    const newPassword = document.getElementById('passwd_NewPasswd').value;
    const confirmPassword = document.getElementById('passwd_againNewPasswd').value;
    const captcha = document.getElementById('repasswd_VerificationCode').value;
    const sessionId = window.getCaptchaSessionId ? window.getCaptchaSessionId() : null;

    console.log('[重設密碼] 表單資料:', {
      newPasswordLength: newPassword.length,
      confirmPasswordLength: confirmPassword.length,
      captchaLength: captcha.length,
      sessionId: sessionId
    });

    if (!validatePassword(newPassword)) {
      // alert('密碼格式不符合要求');
      showCustomAlert("系統提示","密碼格式不符合要求",2000);
      return;
    }

    if (newPassword !== confirmPassword) {
      document.getElementById('confirmPasswordError').textContent = '兩次密碼輸入不一致';
      return;
    } else {
      document.getElementById('confirmPasswordError').textContent = '';
    }

    if (!captcha) {
      // alert('請輸入驗證碼');
      showCustomAlert("系統提示","請輸入驗證碼",2000);
      return;
    }

    if (!sessionId) {
      // alert('驗證碼尚未準備好，請刷新頁面後再試');
      showCustomAlert("系統提示","驗證碼尚未準備好，請刷新頁面後再試",2000);
      console.error('[重設密碼] getCaptchaSessionId 函數不存在或未返回值');
      return;
    }

    const token = getResetToken();
    if (!token) {
      // alert('無效的重設密碼連結');
      showCustomAlert("系統提示","無效的重設密碼連結",2000);
      return;
    }

    console.log('[重設密碼] 準備送出請求');
    await sendResetPasswordRequest(token, newPassword, captcha, sessionId);
  });
}

/*------------------------------------------------------------
  密碼格式檢查
------------------------------------------------------------*/
function validatePassword(password) {
  const lowercase = /[a-z]/.test(password);
  const uppercase = /[A-Z]/.test(password);
  const number = /[0-9]/.test(password);
  const length = password.length >= 8;

  return lowercase && uppercase && number && length;
}

/*------------------------------------------------------------
  呼叫後端重設密碼
------------------------------------------------------------*/
async function sendResetPasswordRequest(token, newPassword, captcha, sessionId) {
  try {
    console.log('[重設密碼] 發送請求到後端');
    
    const response = await fetch('/api/mem/reset-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        token: token,
        newPassword: newPassword,
        captcha: captcha,
        sessionId: sessionId
      })
    });

    console.log('[重設密碼] 後端回應狀態:', response.status);
    
    const result = await response.json();
    console.log('[重設密碼] 後端回應結果:', result);

    if (result.success) {
      // alert('密碼重設成功，請使用新密碼登入');
      showCustomAlert("系統提示","密碼重設成功，請使用新密碼登入",2000);
      // 跳轉回登入頁面
      window.location.href = '/index.html#login';
    } else {
      // alert('重設密碼失敗：' + result.message);
      showCustomAlert("系統提示","重設密碼失敗：" + result.message,2000);
      if (typeof genNewCaptcha === 'function') {
        genNewCaptcha();
      }
    }
  } catch (error) {
    console.error('Reset password request error:', error);
    // alert('系統發生錯誤，請稍後再試');
    showCustomAlert("系統提示","系統發生錯誤，請稍後再試",2000);
  }
}

/*------------------------------------------------------------
  密碼規則提示
------------------------------------------------------------*/
function initPasswordValidation() {
  const passwordInput = document.getElementById('passwd_NewPasswd');
  const confirmPasswordInput = document.getElementById('passwd_againNewPasswd');

  if (!passwordInput) return;

  passwordInput.addEventListener('input', function () {
    const password = this.value;
    updateValidationRule('lowercase', /[a-z]/.test(password));
    updateValidationRule('uppercase', /[A-Z]/.test(password));
    updateValidationRule('onenum', /[0-9]/.test(password));
    updateValidationRule('passwordlength', password.length >= 8);
  });

  if (confirmPasswordInput) {
    confirmPasswordInput.addEventListener('input', function () {
      const password = passwordInput.value;
      const confirmPassword = this.value;
      const errorDiv = document.getElementById('confirmPasswordError');

      if (confirmPassword && password !== confirmPassword) {
        errorDiv.textContent = '兩次密碼輸入不一致';
      } else {
        errorDiv.textContent = '';
      }
    });
  }
}

/*------------------------------------------------------------
  更新規則顯示
------------------------------------------------------------*/
function updateValidationRule(ruleId, isValid) {
  const element = document.getElementById(ruleId);
  if (element) {
    if (isValid) {
      element.classList.remove('invalid');
      element.classList.add('valid');
    } else {
      element.classList.remove('valid');
      element.classList.add('invalid');
    }
  }
}

// 啟動 - 確保 DOM 載入完成
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initResetPasswordPage);
} else {
  // DOM 已經載入完成
  initResetPasswordPage();
}
