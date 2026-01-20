// 從 JWT Token 解析會員資料
function parseJwt(token) {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        return JSON.parse(jsonPayload);
    } catch (error) {
        console.error('JWT 解析錯誤:', error);
        return null;
    }
}

// 取得當前會員ID
function getCurrentMemberId() {
    const token = localStorage.getItem('authToken');
    // if (!token) {
    //     alert('尚未登入，請先登入會員');
    //     window.location.href = '#login';
    //     return null;
    // } 
        
    const payload = parseJwt(token);
    return payload ? payload.sub : null;
}

// 基本資料
async function loadMemberData() {

    try {
        // 先寫死
        // const memberId = 8;

        // 從 Token 取得會員 ID
        const memberId = getCurrentMemberId();
        if (!memberId) return;

        const response = await fetch(`/api/mem/profile?memberId=${memberId}`);
        const result = await response.json();

        if (result.success) {
            const data = result.data;

            // 表單資料
            document.getElementById('account_Account').value = data.email;
            document.getElementById('account_Name').value = data.name;
            document.getElementById('account_nickName').value = data.nickName || data.name; // 預設暱稱為姓名
            document.getElementById('account_Phonenumber').value = data.phone;

            // 生日
            if (data.birthDate) {
                const date = new Date(data.birthDate);
                const formatDate = date.toISOString().split('T')[0]; // 格式: 2024-12-06
                document.getElementById('account_Birthday').value = formatDate;
            }

            // 性別
            if (data.gender === true) {
                document.getElementById('account_Male').checked = true;
            } else if (data.gender === false) {
                document.getElementById('account_Female').checked = true;
            }

            console.log('會員資料載入成功', data);
        } else {
            // alert('載入會員資料失敗' + result.message);
            // showCustomAlert("系統提示","載入會員資料失敗",2000);
            
        }

    } catch (error) {
        console.error('載入會員資料時發生錯誤', error);
        // alert('載入會員資料失敗，請稍後再試');
        showCustomAlert("系統提示","載入會員資料失敗，請稍後再試",2000);
    }

}

// 修改暱稱
function setupEditableField(buttonId, inputId) {
    const editBtn = document.getElementById(buttonId);
    const input = document.getElementById(inputId);

    if (!editBtn || !input) return;

    // 紀錄原始值
    let originalValue = input.value;

    editBtn.addEventListener("click", toggleEdit);
    input.addEventListener("keydown", handleEnter);

    async function toggleEdit() {        
        if (input.readOnly) {
            // 啟用編輯模式
            input.readOnly = false;
            input.focus();
            // 紀錄原始值
            originalValue = input.value;
            editBtn.textContent = "完成";
        } else {
            // 結束編輯模式，儲存資料
            const newNickName = input.value.trim();

            if (newNickName === originalValue) {
                input.readOnly = true;
                editBtn.textContent = "修改暱稱";
            }

            await updateNickName(newNickName);

            input.readOnly = true;
            editBtn.textContent = "修改暱稱";

        }
    }

    async function handleEnter(e) {
        if (e.key === "Enter") {

            const newNickName = input.value.trim();

            // 按下 Enter 鍵後，結束編輯並儲存資料
            if (newNickName === originalValue) {
                input.readOnly = true;
                editBtn.textContent = "修改暱稱";
            }

            // 儲存資料
            await updateNickName(newNickName);

            input.readOnly = true;
            editBtn.textContent = "修改暱稱";
        }
    }
}

// 更新暱稱到資料表
async function updateNickName(nickName) {
    try {
        // 先寫死
        // const memberId = 8;

        // 從 Token 取得會員 ID
        const memberId = getCurrentMemberId();
        if (!memberId) return;

        const response = await fetch(`/api/mem/update/nickName?memberId=${memberId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ nickName: nickName })
        });

        const result = await response.json();

        if (result.success) {
            console.log('暱稱更新成功 : ', result.data);
            // alert('暱稱更新成功');
            showCustomAlert("系統提示","暱稱更新成功",2000);
            // 同步更新側邊欄的暱稱顯示
            if (typeof window.loadMemberNickname === 'function') {
                window.loadMemberNickname();
            }
        } else {
            console.error('暱稱更新失敗 : ', result.message);
        }
    } catch (error) {
        console.error('更新暱稱時發生錯誤', error);
        // alert('更新暱稱失敗，請稍後再試');
        showCustomAlert("系統提示","更新暱稱失敗，請稍後再試",2000);
    }
}

// 更新密碼到後端
async function updatePassword(oldPassword, newPassword) {

    try {
        // 先寫死
        // const memberId = 8; 
        
        // 從 Token 取得會員 ID
        const memberId = getCurrentMemberId();
        if (!memberId) return;

        const response = await fetch(`/api/mem/update/password?memberId=${memberId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                oldPassword: oldPassword,
                newPassword: newPassword
            })
        });

        const result = await response.json();

        if (result.success) {
            // alert('密碼修改成功');
            showCustomAlert("系統提示","密碼修改成功",2000);
            // 關閉Modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('account_repasswd_modal'));
            if (modal) modal.hide();
            // 清空輸入欄位
            document.getElementById('account_oldpasswd').value = '';
            document.getElementById('account_newpasswd').value = '';
            document.getElementById('account_againnewpasswd').value = '';
        } else {
            // alert('修改失敗 : ' + result.message);
            showCustomAlert("系統提示","修改密碼失敗 : " + result.message,2000);
        }

    } catch (error) {
        console.log('修改密碼時發生錯誤 : ' + error);
        // alert('修改密碼失敗，請稍後再試');
        showCustomAlert("系統提示","修改密碼失敗，請稍後再試",2000);
    }
}

// 初始化帳號頁面
function initAccountPage() {

    // 載入會員資料
    loadMemberData();

    // 修改暱稱
    setupEditableField("account_renickName", "account_nickName");

    // 初始化密碼確認驗證
    try {
        initConfirmPasswordValidation('account_newpasswd', 'account_againnewpasswd', 'confirmPasswordError');
    } catch (error) {
        console.log('密碼驗證初始化失敗 : ' + error);
    }

    // 修改密碼
    const confirmBtn = document.getElementById('account_confirmBtn');
    if (confirmBtn) {
        confirmBtn.addEventListener('click', async function () {
            const oldPassword = document.getElementById('account_oldpasswd').value;
            const newPassword = document.getElementById('account_newpasswd').value;
            const confirmPassword = document.getElementById('account_againnewpasswd').value;

            // 驗證
            if (!oldPassword) {
                // alert('請輸入舊密碼');
                showCustomAlert("系統提示","請輸入舊密碼",2000);
                return;
            }

            if (!isPasswordValid('account_newpasswd')) {
                // alert('新密碼格式不正確');
                showCustomAlert("系統提示","新密碼格式不正確",2000);
                return;
            }

            if (newPassword !== confirmPassword) {
                // alert('新密碼與確認密碼不一致');
                showCustomAlert("系統提示","新密碼與確認密碼不一致",2000);
                return;
            }

            await updatePassword(oldPassword, newPassword);
        });
    }
}

// initAccountPage();

window.initAccountPage = initAccountPage;

