// 寵物審核完成頁面動畫效果
(function () {
    'use strict';

    // 主要初始化函數
    function initStampAnimation() {
        const starIcon = document.querySelector('.star-icon');
        const checkIcon = document.querySelector('.check-icon');


        if (!starIcon) {
            console.log('找不到 .star-icon 元素，動畫無法執行');
            return;
        }

        if (!checkIcon) {
            console.log('找不到 .check-icon 元素');
        }

        // 確保元素有正確的定位
        starIcon.style.position = 'absolute';
        if (checkIcon) {
            checkIcon.style.position = 'absolute';
        }

        // 勾勾一開始隱藏 + 縮小
        if (checkIcon) {
            checkIcon.style.opacity = '0';
            checkIcon.style.transform = 'scale(0.6)';
        }

        // 動畫關鍵位置與設定（單位：百分比 or px）
        const steps = [
            // 0. 起始：在稍微下面一點，縮小一點
            {
                top: 65,
                left: 78,
                scale: 0.9,
                rotate: -8,
                duration: 600,
                easing: 'cubic-bezier(0.33, 1, 0.68, 1)', // 慢進快出（滑入）
                pause: 150
            },
            // 1. 往上移動，像是準備蓋章
            {
                top: 30,
                left: 78,
                scale: 1.1,
                rotate: 0,
                duration: 550,
                easing: 'cubic-bezier(0.22, 0.61, 0.36, 1)', // 平順上移
                pause: 120
            },
            // 2. 停在上方，做一點小旋轉
            {
                top: 26,
                left: 78,
                scale: 1.15,
                rotate: 12,
                duration: 350,
                easing: 'ease-in-out',
                pause: 80
            },
            // 3. 快速往下「蓋章」，略放大
            {
                top: 42,
                left: 78,
                scale: 1.35,
                rotate: 0,
                duration: 500,
                easing: 'cubic-bezier(0.4, 0, 0.2, 1)', // 快速下墜感
                pause: 50,
                onReach() {
                    // 星星蓋下去瞬間，勾勾跳出
                    // console.log('觸發 onReach - 顯示勾勾');
                    if (checkIcon) {
                        checkIcon.style.transition = 'opacity 350ms ease-out, transform 350ms ease-out';
                        checkIcon.style.opacity = '1';
                        checkIcon.style.transform = 'scale(1)';
                    }
                }
            },
            // 4. 略微回彈，恢復到穩定大小
            {
                top: 40,
                left: 78,
                scale: 1.1,
                rotate: 0,
                duration: 380,
                easing: 'cubic-bezier(0.17, 0.89, 0.32, 1.28)', // 回彈感
                pause: 600
            }
        ];

        let currentStep = 0;
        let playing = false;

        function applyStep(step) {
            starIcon.style.transition = `
                top ${step.duration}ms ${step.easing},
                left ${step.duration}ms ${step.easing},
                transform ${step.duration}ms ${step.easing}
            `;
            starIcon.style.top = step.top + '%';
            starIcon.style.left = step.left + '%';
            starIcon.style.transform = `rotate(${step.rotate}deg) scale(${step.scale})`;
        }

        function playSequence() {
            if (playing) return;
            playing = true;
            currentStep = 0;

            // 每次重播前，把星星跟勾勾重置
            resetState();

            function next() {
                const step = steps[currentStep];
                applyStep(step);

                // 若這個 step 有 onReach，就執行
                if (typeof step.onReach === 'function') {
                    setTimeout(step.onReach, step.duration * 0.6);
                }

                const totalTime = step.duration + (step.pause || 0);

                currentStep++;

                if (currentStep < steps.length) {
                    setTimeout(next, totalTime);
                } else {
                    // 一輪結束，稍微停一下再重播
                    setTimeout(() => {
                        playing = false;
                        playSequence();
                    }, 1200);
                }
            }

            next();
        }

        function resetState() {
            // 星星回到起始位置（先關掉 transition 再設位置）
            starIcon.style.transition = 'none';
            starIcon.style.top = steps[0].top + '%';
            starIcon.style.left = steps[0].left + '%';
            starIcon.style.transform = `rotate(${steps[0].rotate}deg) scale(${steps[0].scale})`;

            // 勾勾淡出並縮小，像是準備下一輪
            if (checkIcon) {
                checkIcon.style.transition = 'opacity 250ms ease-out, transform 250ms ease-out';
                checkIcon.style.opacity = '0';
                checkIcon.style.transform = 'scale(0.6)';
            }
        }

        // 啟動動畫
        playSequence();
    }

    // DOM 載入完成後初始化
    function initReviewComPage() {
        console.log('審核完成頁面 JS 載入');

        // 延遲一秒後開始動畫，確保頁面完全載入
        setTimeout(() => {
            initStampAnimation();
        }, 1000);
    }

    // 頁面載入時自動執行
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initReviewComPage);
    } else {
        // DOM 已經載入完成，立即執行
        initReviewComPage();
    }

    document.addEventListener('DOMContentLoaded', () => {
        initReviewSuccessPage();
    });

    // 解析 URL hash 以取得參數
    function parseHash(hash) {
        if (!hash) {
            return { page: '', caseId: null };
        }
        const raw = hash.startsWith('#') ? hash.substring(1) : hash;
        const [page, query] = raw.split('?');
        const params = new URLSearchParams(query || '');
        const caseId = params.get('caseId');
        return { page, caseId };
    }

    async function initReviewSuccessPage() {
        const { caseId } = parseHash(location.hash);
        const { page } = parseHash(location.hash);

        console.log('目前 hash =', window.location.hash);
        console.log('解析結果 page =', page, 'caseId =', caseId);


        if (!caseId) {
            alert('找不到案件編號');
            window.location.href = '../html/member-center.html';//會員中心網址 要改
            return;
        }
        const resp = await fetch(`/api/se/pet-cases/${caseId}/review-result`,{
             method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}` // ⭐ 一定要帶
            }
        });
         if (resp.status === 401) {
            alert('登入已失效，請重新登入');
            // window.location.href = '../html/login.html';
            return;
        }

        if (resp.status === 403) {
            alert('你沒有權限查看這個案件');
            window.location.href = '../html/member-center.html';
            return;
        }

        const data = await resp.json();
        const caseNumber = data.caseNumber;
        console.log('取得的案件編號 caseNumber =', caseNumber);

        // 顯示案件編號 



        const el = document.getElementById('case-number');
        if (!el) {
            console.log('找不到 #case-number，代表成功頁 HTML 還沒被渲染進 DOM');
            return;
        }
        el.textContent = `案件編號：${caseNumber}`;

    }


    // 將函數暴露到全域，供調試使用
    window.initStampAnimation = initStampAnimation;

})();