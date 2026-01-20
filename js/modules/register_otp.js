// Email OTP 驗證功能

(function() {
    'use strict';
    
    console.log('register_otp.js 執行中...');
    
    let otpVerified = false;
    let countdownTimer = null;
    
    // 初始化函數
    function initOTP() {
        console.log('initOTP 被調用');
        
        const sendBtn = document.getElementById('register_SendOtpbtn');
        const verifyBtn = document.getElementById('register_ConfirmEmailbtn');
        const emailInput = document.getElementById('register_Account');
        const otpInput = document.getElementById('register_VerifyCode');
        
        console.log('元素檢查:', {
            sendBtn: !!sendBtn,
            verifyBtn: !!verifyBtn,
            emailInput: !!emailInput,
            otpInput: !!otpInput
        });
        
        if (!sendBtn || !verifyBtn || !emailInput || !otpInput) {
            console.error('找不到必要的元素，500ms 後重試...');
            setTimeout(initOTP, 500);
            return;
        }
        
        console.log('所有元素已找到，開始綁定事件');
        
        // 移除舊的事件監聽器（如果有的話）
        const newSendBtn = sendBtn.cloneNode(true);
        const newVerifyBtn = verifyBtn.cloneNode(true);
        sendBtn.parentNode.replaceChild(newSendBtn, sendBtn);
        verifyBtn.parentNode.replaceChild(newVerifyBtn, verifyBtn);
        
        // 發送驗證碼
        newSendBtn.onclick = function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            console.log('>>> 發送按鈕被點擊 <<<');
            
            const email = emailInput.value.trim();
            console.log('Email:', email);
            
            if (!email || !email.includes('@')) {
                // alert('❌ 請輸入有效的 Email 地址');
                showCustomAlert("系統提示","請輸入有效的 Email 地址",2000);
                return false;
            }
            
            newSendBtn.disabled = true;
            newSendBtn.textContent = '發送中...';
            
            fetch('/api/mem/send-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: email })
            })
            .then(response => response.json())
            .then(data => {
                console.log('發送回應:', data);
                if (data.success) {
                    // alert('✅ ' + data.data);
                    showCustomAlert("系統提示","✅ " + data.data,2000);
                    newSendBtn.textContent = '已發送';
                    startCountdown(newSendBtn);
                } else {
                    // alert('❌ ' + (data.message || '發送失敗'));
                    showCustomAlert("系統提示","❌ " + (data.message || '發送失敗'),2000);
                    newSendBtn.disabled = false;
                    newSendBtn.textContent = '發送驗證碼';
                }
            })
            .catch(error => {
                console.error('發送錯誤:', error);
                // alert('❌ 網路錯誤，請稍後再試');
                showCustomAlert("系統提示","❌ 網路錯誤，請稍後再試",2000);
                newSendBtn.disabled = false;
                newSendBtn.textContent = '發送驗證碼';
            });
            
            return false;
        };
        
        // 驗證 OTP
        newVerifyBtn.onclick = function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            console.log('>>> 驗證按鈕被點擊 <<<');
            
            const email = emailInput.value.trim();
            const otpCode = otpInput.value.trim();
            
            console.log('Email:', email, 'OTP:', otpCode);
            
            if (!email || !email.includes('@')) {
                // alert('❌ 請輸入有效的 Email 地址');
                showCustomAlert("系統提示","請輸入有效的 Email 地址",2000);
                return false;
            }
            
            if (!otpCode || otpCode.length !== 6) {
                // alert('❌ 請輸入完整的 6 位數驗證碼');
                showCustomAlert("系統提示","請輸入完整的 6 位數驗證碼",2000);
                return false;
            }
            
            newVerifyBtn.disabled = true;
            newVerifyBtn.textContent = '驗證中...';
            
            fetch('/api/mem/verify-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: email, otpCode: otpCode })
            })
            .then(response => response.json())
            .then(data => {
                console.log('驗證回應:', data);
                if (data.success) {
                    // alert('✅ 驗證成功！');
                    showCustomAlert("系統提示","驗證成功！",2000);
                    newVerifyBtn.textContent = '✅ 已驗證';
                    newVerifyBtn.style.backgroundColor = '#28a745';
                    newVerifyBtn.style.color = 'white';
                    newVerifyBtn.style.borderColor = '#28a745';
                    otpVerified = true;
                    
                    if (countdownTimer) clearInterval(countdownTimer);
                    
                    emailInput.disabled = true;
                    emailInput.style.backgroundColor = '#e8f5e9';
                    otpInput.disabled = true;
                    otpInput.style.backgroundColor = '#e8f5e9';
                    newSendBtn.disabled = true;
                } else {
                    // alert('❌ ' + (data.message || '驗證失敗'));
                    showCustomAlert("系統提示","❌ " + (data.message || '驗證失敗'),2000);
                    newVerifyBtn.disabled = false;
                    newVerifyBtn.textContent = '驗證';
                }
            })
            .catch(error => {
                console.error('驗證錯誤:', error);
                // alert('❌ 網路錯誤，請稍後再試');
                showCustomAlert("系統提示","❌ 網路錯誤，請稍後再試",2000);
                newVerifyBtn.disabled = false;
                newVerifyBtn.textContent = '驗證';
            });
            
            return false;
        };
        
        console.log('✅ 事件綁定完成');
    }
    
    // 倒數計時
    function startCountdown(btn) {
        let seconds = 60;
        if (countdownTimer) clearInterval(countdownTimer);
        
        countdownTimer = setInterval(function() {
            seconds--;
            btn.textContent = seconds + '秒後可重發';
            
            if (seconds <= 0) {
                clearInterval(countdownTimer);
                btn.disabled = false;
                btn.textContent = '重新發送';
            }
        }, 1000);
    }
    
    // 立即執行初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initOTP);
    } else {
        setTimeout(initOTP, 100);
    }
    
    // 暴露到全域以便路由調用
    window.initRegisterOTP = initOTP;
    
})();


