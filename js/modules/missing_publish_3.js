(function() {
    const magnifier = document.getElementById('magnifier');
    
    // 透過 function 包起來後，這裡的 return 就合法了（代表結束這個函式）
    if (!magnifier) return;

    let startTime = null;
    const duration = 10000; // 循環時間
    const amplitudeX = 40; // X 軸移動幅度
    const amplitudeY = 40; // Y 軸移動幅度 (弧形)

    // 初始位置設定 (讓它從右上方開始)
    const initialX = 80;
    const initialY = 120;

    function animate(timestamp) {
        if (!startTime) startTime = timestamp;
        const elapsed = timestamp - startTime;
        
        // 計算時間在循環中的比例 (0 到 1)
        // const progress = (elapsed % duration) / duration; 
        const progress = elapsed / duration;

        // 1. X 軸: 簡單的來回移動 (Z字或圓弧的基礎)
        const x = initialX + Math.sin(progress * 4.5 * Math.PI) * amplitudeX;

        // 2. Y 軸: 模擬弧形運動 (使用 Cos 函數模擬上下擺動)
        // Math.cos 讓它在 X 軸來回移動時，Y 軸有拋物線的效果
        const y = initialY + Math.cos(progress * 1.5 * Math.PI) * amplitudeY;

        // 套用變換
        magnifier.style.transform = `translate(${x}px, ${y}px)`;

        requestAnimationFrame(animate);
    }

    // 啟動動畫
    requestAnimationFrame(animate);
    
    // 按鈕導航 (建議加上檢查，避免按鈕不存在時報錯)
    const manageBtn = document.getElementById('manageCaseBtn');
    if (manageBtn) {
        manageBtn.addEventListener('click', function() {
            alert("導航至會員中心/案件管理頁面");
            // window.location.href = '/member/casemanagement';
        });
    }

})();