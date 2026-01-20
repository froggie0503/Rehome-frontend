/*------------------------------------------------------------
  密碼顯示/隱藏切換
------------------------------------------------------------*/
function initPasswordToggle(toggleButtonId, passwordFieldId) {
  const togglePassword = document.querySelector('#' + toggleButtonId);
  const password = document.querySelector('#' + passwordFieldId);

  if (!togglePassword || !password) return;

  togglePassword.addEventListener('click', function () {
    const type = password.getAttribute('type') === 'password' ? 'text' : 'password';
    password.setAttribute('type', type);
    this.classList.toggle('bi-eye');
    this.classList.toggle('bi-eye-slash');
  });
}

// login
initPasswordToggle('togglePassword', 'login_Password');
// register
initPasswordToggle('togglePassword', 'register_Password');
// repasswd
initPasswordToggle('togglePassword', 'passwd_NewPasswd');
// oldpasswd
initPasswordToggle('togglePassword', 'account_oldpasswd');
// newpasswd
initPasswordToggle('togglenewPassword', 'account_newpasswd');

/*------------------------------------------------------------
  密碼規則提示
------------------------------------------------------------*/
function initPasswordRuleValidation(passwordInputId, ruleContainerId) {
  const passwordInput = document.getElementById(passwordInputId);
  const lowercase = document.getElementById('lowercase');
  const uppercase = document.getElementById('uppercase');
  const onenum = document.getElementById('onenum');
  const length = document.getElementById('passwordlength');
  const ruleContainer = document.getElementById(ruleContainerId);

  if (!passwordInput || !ruleContainer || !lowercase || !uppercase || !onenum || !length) return;

  passwordInput.onfocus = function () {
    ruleContainer.style.display = 'block';
  };

  passwordInput.onblur = function () {
    ruleContainer.style.display = 'none';
  };

  passwordInput.onkeyup = function () {
    const hasLowerCase = /[a-z]/g.test(this.value);
    lowercase.classList.toggle('valid', hasLowerCase);
    lowercase.classList.toggle('invalid', !hasLowerCase);

    const hasUpperCase = /[A-Z]/g.test(this.value);
    uppercase.classList.toggle('valid', hasUpperCase);
    uppercase.classList.toggle('invalid', !hasUpperCase);

    const hasNumber = /[0-9]/g.test(this.value);
    onenum.classList.toggle('valid', hasNumber);
    onenum.classList.toggle('invalid', !hasNumber);

    const hasValidLength = this.value.length >= 8;
    length.classList.toggle('valid', hasValidLength);
    length.classList.toggle('invalid', !hasValidLength);
  };
}

// register
initPasswordRuleValidation('register_Password', 'passwordRule');
// repasswd
initPasswordRuleValidation('passwd_NewPasswd', 'passwordRule');
// newpasswd
initPasswordRuleValidation('account_newpasswd', 'passwordRule');

/*------------------------------------------------------------
  密碼格式驗證
------------------------------------------------------------*/
function isPasswordValid(passwordInputId) {
  const passwordInput = document.getElementById(passwordInputId);
  if (!passwordInput) return false;

  const password = passwordInput.value;
  const hasLowerCase = /[a-z]/g.test(password);
  const hasUpperCase = /[A-Z]/g.test(password);
  const hasNumber = /[0-9]/g.test(password);
  const hasValidLength = password.length >= 8;

  return hasLowerCase && hasUpperCase && hasNumber && hasValidLength;
}

/*------------------------------------------------------------
  確認密碼驗證
------------------------------------------------------------*/
function initConfirmPasswordValidation(passwordInputId, confirmPasswordInputId, errorDivId) {
  const confirmPasswordInput = document.getElementById(confirmPasswordInputId);
  const confirmPasswordError = document.getElementById(errorDivId);

  if (!confirmPasswordInput || !confirmPasswordError) return;

  confirmPasswordInput.addEventListener('input', function () {
    const passwordInput = document.getElementById(passwordInputId);
    if (!passwordInput) return;

    const password = passwordInput.value;
    const confirmPassword = this.value;

    if (confirmPassword === '') {
      confirmPasswordError.innerHTML = '';
      this.classList.remove('is-invalid', 'is-valid');
    } else if (password !== confirmPassword) {
      confirmPasswordError.innerHTML = '兩次密碼不一致';
      this.classList.add('is-invalid');
      this.classList.remove('is-valid');
    } else {
      confirmPasswordError.innerHTML = '<span class="text-success">兩次密碼一致</span>';
      this.classList.remove('is-invalid');
      this.classList.add('is-valid');
    }
  });
}

// register
initConfirmPasswordValidation('register_Password', 'register_ConfirmPassword', 'confirmPasswordError');
// repasswd
initConfirmPasswordValidation('passwd_NewPasswd', 'passwd_againNewPasswd', 'confirmPasswordError');
// newpasswd
initConfirmPasswordValidation('account_newpasswd', 'account_againnewpasswd', 'confirmPasswordError');

/*------------------------------------------------------------
  手機號碼驗證
------------------------------------------------------------*/
function initPhoneNumberValidation(phoneInputId, errorDivId) {
  const phoneInput = document.getElementById(phoneInputId);
  const phoneError = document.getElementById(errorDivId);

  if (!phoneInput || !phoneError) return;

  phoneInput.addEventListener('input', function () {
    const phonePattern = /^09\d{8}$/;
    const phoneNumber = this.value;

    if (phoneNumber === '') {
      phoneError.innerHTML = '';
      this.classList.remove('is-invalid', 'is-valid');
    } else if (!phonePattern.test(phoneNumber)) {
      phoneError.innerHTML = '手機號碼格式錯誤，請輸入09開頭10位數字';
      this.classList.add('is-invalid');
      this.classList.remove('is-valid');
    } else {
      phoneError.innerHTML = '<span class="text-success">手機號碼格式正確</span>';
      this.classList.remove('is-invalid');
      this.classList.add('is-valid');
    }
  });
}

// register
initPhoneNumberValidation('register_Phonenumber', 'phoneNumberError');

/*------------------------------------------------------------
  表單送出驗證（註冊、重設密碼表單）
------------------------------------------------------------*/
function initFormValidation(formId, passwordInputId, confirmPasswordInputId) {
  const form = document.getElementById(formId);
  if (!form) return;

  form.addEventListener('submit', function (e) {
    e.preventDefault();

    if (!isPasswordValid(passwordInputId)) {
      // alert('請確認密碼符合規則');
      showCustomAlert("系統提示","請確認密碼符合規則",2000);
      const pwd = document.getElementById(passwordInputId);
      if (pwd) pwd.focus();
      return false;
    }

    const password = document.getElementById(passwordInputId).value;
    const confirmPassword = document.getElementById(confirmPasswordInputId).value;

    if (password !== confirmPassword) {
      // alert('兩次輸入的新密碼不一致');
      showCustomAlert("系統提示","兩次輸入的新密碼不一致",2000);
      const confirm = document.getElementById(confirmPasswordInputId);
      if (confirm) confirm.focus();
      return false;
    }

    const formData = collectRegisterFormData();
    console.log('註冊資料', formData);
    sendRegisterRequest(formData);
  });
}

// register
initFormValidation('register_form', 'register_Password', 'register_ConfirmPassword');
// repasswd
initFormValidation('repasswd_form', 'passwd_NewPasswd', 'passwd_againNewPasswd');

/*------------------------------------------------------------
  收集註冊表單資料
------------------------------------------------------------*/
function collectRegisterFormData() {
  const email = document.getElementById('register_Account').value;
  const password = document.getElementById('register_Password').value;
  const name = document.getElementById('register_Name').value;
  const selectedGender = document.querySelector('input[name="gender"]:checked');
  const gender = selectedGender ? selectedGender.id === 'register_Male' : true;
  const birthday = document.getElementById('register_Birthday').value;
  const phone = document.getElementById('register_Phonenumber').value;

  return {
    email: email,
    password: password,
    name: name,
    gender: gender,
    birthDate: birthday,
    phone: phone
  };
}

/*------------------------------------------------------------
  送出註冊請求
------------------------------------------------------------*/
async function sendRegisterRequest(formData) {
  try {
    const response = await fetch('/api/mem/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(formData)
    });

    const result = await response.json();

    if (response.ok) {
      // alert('註冊成功');
      showCustomAlert("系統提示","註冊成功",2000);
      console.log('註冊成功', result);
      // 註冊成功後跳轉到登入頁面
      window.location.href = '/index.html#login';
    } else {
      // alert('註冊失敗 ' + result.message);
      showCustomAlert("系統提示","註冊失敗 " + result.message,2000);
      console.log('註冊失敗', result);
    }
  } catch (error) {
    // alert('發生錯誤 ' + error.message);
    showCustomAlert("系統提示","發生錯誤 " + error.message,2000);
  }
}

/*------------------------------------------------------------
  第三方登入 - Gmail
------------------------------------------------------------*/
// const gmailBtn = document.getElementById('register_gmailbtn');
// if (gmailBtn) {
//   gmailBtn.addEventListener('click', function () {
//     window.location.href = 'http://localhost:8080/oauth2/authorization/google';
//   });
// }

function gmailBtnListener() {
  const gmailBtn = document.getElementById('register_gmailbtn');
  if (!gmailBtn) return;

  gmailBtn.addEventListener('click', function () {
    window.location.href = '/oauth2/authorization/google';
  });
}

gmailBtnListener();