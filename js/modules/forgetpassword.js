/*------------------------------------------------------------
  忘記密碼 - 送出重設密碼連結（事件委派避免 SPA 重複綁定問題）
------------------------------------------------------------*/
function handleForgetPasswordClick(e) {
  const submitBtn = e.target.closest('#login_forgetpassword_submit');
  if (!submitBtn) return;

  e.preventDefault();

  const emailInput = document.getElementById('login_Account2');
  const captchaInput = document.getElementById('login_VerificationCode');

  if (!emailInput || !captchaInput) return;

  const email = emailInput.value.trim();
  const captcha = captchaInput.value.trim();

  if (!email) {
    // alert('請輸入 Email 帳號');
    showCustomAlert("系統提示","請輸入 Email 帳號",2000);
    return;
  }

  if (!captcha) {
    // alert('請輸入驗證碼');
    showCustomAlert("系統提示","請輸入驗證碼",2000);
    return;
  }

  sendForgetPasswordRequest(email, captcha);
}

// 事件委派，且只綁一次（避免 SPA 重複載入）
if (!window.__forgetPasswordListenerAttached) {
  document.addEventListener('click', handleForgetPasswordClick);
  window.__forgetPasswordListenerAttached = true;
}

/*------------------------------------------------------------
  送出重設密碼連結請求
------------------------------------------------------------*/
async function sendForgetPasswordRequest(email, captcha) {
  try {
    const response = await fetch('http://localhost:8080/api/mem/forgot-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: email,
        captcha: captcha,
        sessionId: window.getCaptchaSessionId()
      })
    });

    const result = await response.json();

    if (result.success) {
      // alert('重設密碼連結已寄出，請查收 Email');
      showCustomAlert("系統提示","重設密碼連結已寄出，請查收 Email",2000);

      const modalEl = document.getElementById('login_forgetpassword_modal');
      const modal = modalEl ? bootstrap.Modal.getInstance(modalEl) : null;
      if (modal) modal.hide();

      const emailField = document.getElementById('login_Account2');
      const captchaField = document.getElementById('login_VerificationCode');
      if (emailField) emailField.value = '';
      if (captchaField) captchaField.value = '';

      genNewCaptcha();
    } else {
      // alert('寄送失敗：' + result.message);
      showCustomAlert("系統提示","寄送失敗：" + result.message,2000);
      genNewCaptcha();
    }

  } catch (error) {
    console.error('送出重設密碼連結請求錯誤', error);
    // alert('系統錯誤，請稍後再試');
    showCustomAlert("系統提示","系統錯誤，請稍後再試",2000);
  }
}
