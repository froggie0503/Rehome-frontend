(function () {
    // ==========================================
    // 1. 初始化與 API 查詢
    // ==========================================

    // 從網址 Hash 取得 caseNumber
    const hash = window.location.hash;
    let caseNo = null;
    if (hash.includes('?')) {
        const params = new URLSearchParams(hash.split('?')[1]);
        caseNo = params.get('casenumber');
    }

    if (!caseNo) {
        // alert("無效的案件編號，將返回首頁");
        showCustomAlert("系統提示", "無效的案件編號，將返回首頁", 0);
        window.location.href = '#index';
        return;
    }

    // 呼叫後端查詢狀態
    checkStatus(caseNo);




    async function checkStatus(caseNumber) {

        const API_TOKEN_KEY = 'authToken';
        const token = localStorage.getItem(API_TOKEN_KEY);
        if (!token) {
            // console.warn("尚未登入，無法取得 Token");
            // 這裡可以做導向登入頁的動作
            showCustomAlert("系統提示", "請重新登入", 1000);

        }
        try {
            const res = await fetch(`/api/missing/${caseNumber}/status`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + token
                }
            });
            const json = await res.json();

            if (json.success) {
                renderView(json.data);
            } else {
                // 顯示錯誤，讓使用者可以手動重整
                document.getElementById('pageTitle').innerHTML = '查詢失敗';
                const container = document.getElementById('progressBarContainer');
                if (container) container.innerHTML = `<div style="text-align:center; padding:20px; color:red;">
                找不到案件資料 (${caseNumber})<br>
                請稍後重新整理頁面，或至會員中心查看。
            </div>`;
            }
        } catch (e) {
            console.error("連線錯誤:", e);
            // alert("連線發生錯誤，請檢查網路狀態");
            showCustomAlert("系統提示", "連線發生錯誤，請檢查網路狀態", 1000);

        }
    }

    // ==========================================
    // 2. 畫面渲染 (Render Logic)
    // ==========================================
    function renderView(data) {
        const status = data.status; // 1:審核中, 2:成功, 3:失敗
        const caseNumber = data.caseNumber;
        const reason = data.rejectReason;

        // 取得 DOM 元素
        const viewPending = document.getElementById('view-pending');
        const viewSuccess = document.getElementById('view-success');
        const viewFailed = document.getElementById('view-failed');

        // 進度條相關元素
        const pageTitle = document.getElementById('pageTitle');
        const progressBarContainer = document.getElementById('progressBarContainer');
        const step3Div = document.getElementById('step3Div');
        const step4Div = document.getElementById('step4Div');
        const step4Label = document.getElementById('step4Label');

        // 先隱藏所有區塊
        viewPending.style.display = 'none';
        viewSuccess.style.display = 'none';
        viewFailed.style.display = 'none';

        // 填入案號 (三個區塊都有可能用到)
        setTextIfFound('caseNumber-pending', caseNumber);
        setTextIfFound('caseNumber-success', caseNumber);
        setTextIfFound('caseNumber-failed', caseNumber);

        // 根據狀態切換
        switch (status) {
            case 1: // === 等待審核 (Step 3) ===
                viewPending.style.display = 'block';

                // 設定標題
                pageTitle.innerHTML = '填寫<span class="highlight-text">走失</span>表單';

                // 設定進度條 (Step 3 active)
                progressBarContainer.className = 'steps-progress steps-complete2';
                step3Div.className = 'step current';
                step4Div.className = 'step';
                step4Label.textContent = '審查結果';

                // 啟動放大鏡動畫
                startMagnifierAnimation('magnifier-img');
                break;

            case 2: // === 審核成功 (Step 4 Success) ===
                viewSuccess.style.display = 'block';

                // 設定標題
                pageTitle.innerHTML = '審查<span class="highlight-text">走失</span>案件';

                // 設定進度條 (Step 4 active, 綠線變長)
                progressBarContainer.className = 'steps-progress steps-complete3';
                step3Div.className = 'step complete';
                step4Div.className = 'step current';
                step4Label.textContent = '上傳成功';

                // 綁定「查看詳情」按鈕
                const viewBtn = document.getElementById('viewCaseBtn');
                if (viewBtn) {
                    viewBtn.onclick = () => {
                        window.location.href = `#missing_detail?id=${caseNumber}`;
                    };
                }

                // 啟動蓋章動畫 (Success版)
                startStampAnimation('stamp-success', 'stamp-mark-success');
                break;

            case 3: // === 審核失敗 (Step 4 Failed) ===
                viewFailed.style.display = 'block';

                // 設定標題
                pageTitle.innerHTML = '審查<span class="highlight-text">走失</span>案件';

                // 設定進度條
                progressBarContainer.className = 'steps-progress steps-complete3';
                step3Div.className = 'step complete';
                step4Div.className = 'step current';
                step4Label.textContent = '審查失敗';

                // 填入失敗原因
                const reasonEl = document.getElementById('rejectReason');
                if (reasonEl) reasonEl.textContent = reason || "未提供詳細原因";

                // 啟動蓋章動畫 (Failed版)
                startStampAnimation('stamp-failed', 'stamp-mark-failed');
                break;
        }

        // 綁定所有「返回管理案件」按鈕
        const backBtns = ['manageBtn-pending', 'manageBtn-success', 'manageBtn-failed'];
        backBtns.forEach(btnId => {
            const btn = document.getElementById(btnId);
            if (btn) {
                btn.onclick = () => {
                    // alert('導航至會員中心/案件管理');
                    window.location.href = '#member?page=lostpublish';
                };
            }
        });
    }

    // 輔助函式：安全填入文字
    function setTextIfFound(id, text) {
        const el = document.getElementById(id);
        if (el) el.textContent = text;
    }

    // ==========================================
    // 3. 動畫邏輯 (整合版)
    // ==========================================

    // --- 放大鏡動畫 (從 missing_publish_3.js 移植) ---
    function startMagnifierAnimation(elementId) {
        const magnifier = document.getElementById(elementId);
        if (!magnifier) return;

        let startTime = null;
        const duration = 10000;
        const amplitudeX = 40;
        const amplitudeY = 40;
        const initialX = 80;
        const initialY = 120;

        function animate(timestamp) {
            // 檢查元素是否還可見，不可見則停止動畫 (節省效能)
            if (magnifier.offsetParent === null) return;

            if (!startTime) startTime = timestamp;
            const elapsed = timestamp - startTime;
            const progress = elapsed / duration;
            const x = initialX + Math.sin(progress * 4.5 * Math.PI) * amplitudeX;
            const y = initialY + Math.cos(progress * 1.5 * Math.PI) * amplitudeY;
            magnifier.style.transform = `translate(${x}px, ${y}px)`;
            requestAnimationFrame(animate);
        }
        requestAnimationFrame(animate);
    }

    // --- 蓋章動畫 (從 missing_publish_4.js 移植) ---
    function startStampAnimation(stampId, markId) {
        const stamp = document.getElementById(stampId);
        const mark = document.getElementById(markId);
        if (!stamp || !mark) return;

        let startTime = null;
        const duration = 3000;
        const centerX = 110;
        const centerY = 170;
        const radius = 10;
        const startAngle = -Math.PI / 4;
        const endAngle = 0;

        function animate(timestamp) {
            if (stamp.offsetParent === null) return; // 停止動畫若不可見

            if (!startTime) startTime = timestamp;
            const elapsed = timestamp - startTime;
            const totalLoopTime = duration + 1000;
            const progress = (elapsed % totalLoopTime) / duration;

            if (progress > 1) {
                requestAnimationFrame(animate);
                return;
            }

            if (progress < 0.5) {
                const t = progress * 2;
                const currentAngle = startAngle + (endAngle - startAngle) * t;
                const offsetX = radius * Math.cos(currentAngle);
                const offsetY = radius * Math.sin(currentAngle);
                const x = centerX + 100 * (1 - t);
                const y = centerY - 100 * Math.sin((1 - t) * Math.PI / 2);
                const rotation = 30 * (1 - t);

                stamp.style.transform = `translate(${x}px, ${y}px) rotate(${rotation}deg)`;
                mark.style.opacity = 0;
            } else {
                const t = (progress - 0.5) * 2;
                if (t < 0.2) {
                    stamp.style.transform = `translate(${centerX}px, ${centerY}px) rotate(0deg)`;
                    mark.style.opacity = 1;
                } else {
                    const liftT = (t - 0.2) / 0.8;
                    const x = centerX + 100 * liftT;
                    const y = centerY - 100 * Math.sin(liftT * Math.PI / 2);
                    const rotation = 30 * liftT;
                    stamp.style.transform = `translate(${x}px, ${y}px) rotate(${rotation}deg)`;
                    mark.style.opacity = 1 - liftT;
                }
            }
            requestAnimationFrame(animate);
        }
        requestAnimationFrame(animate);
    }

})();