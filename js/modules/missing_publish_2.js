(async function () {
    // 1. 從 Local Storage 讀取資料
    const rawData = localStorage.getItem('pendingPublishData');

    if (!rawData) {
        // alert("找不到填寫資料，將返回填寫頁面。");
        showCustomAlert("系統提示", "找不到填寫資料，將返回填寫頁面。", 0);
        window.location.href = '#missing_publish_1'; // 導回第一頁
        return;
    }

    const data = JSON.parse(rawData);
    console.log("Loaded Data:", data);

    // ---------------------------------------------------------
    // 2. 資料對照表 (Mapping) - 將代碼轉為中文顯示
    // ---------------------------------------------------------
    const mappings = {
        petGender: {
            'male': '公',
            'female': '母',
            'unknown': '未知'
        },
        petEarClip: {
            'yes': '有剪耳',
            'no': '無剪耳'
        },
        petType: {
            'cat': '貓',
            'dog': '狗',
            'other': '其他'
        },
        petChip: {
            'yes': '有',
            'no': '無'
        }

    };
    // ------------------------------------------

    let cityMap = {};   // 用來存 id -> name 的對照
    let regionMap = {}; // 用來存 id -> name 的對照

    try {
        const res = await fetch('/api/public/options');
        const apiJson = await res.json();

        if (apiJson.success) {
            // 建立 縣市 ID 對照表
            apiJson.data.cities.forEach(city => {
                cityMap[city.id] = city.name;
            });

            // 建立 地區 ID 對照表
            apiJson.data.regions.forEach(region => {
                regionMap[region.id] = region.name;
            });
        }
    } catch (e) {
        console.error("無法取得縣市地區選項:", e);
        // 若失敗，畫面可能僅會顯示 ID 或 undefined，可視需求做錯誤處理
    }

    // ---------------------------------------------------------
    // 3. 填入文字資料
    // ---------------------------------------------------------

    // 輔助函式：安全填入文字
    function setText(id, value) {
        const el = document.getElementById(id);
        if (el) el.textContent = value || '未填寫';
    }

    setText('show_petName', data.petName);
    setText('show_petGender', mappings.petGender[data.petGender] || data.petGender);
    setText('show_petBreed', data.petBreed);
    setText('show_petColor', data.petColor);
    setText('show_petFeature', data.petFeature);
    setText('show_petEarClip', mappings.petEarClip[data.petEarClip] || data.petEarClip);

    // 處理「種類」：如果是其他，顯示輸入的文字
    let typeDisplay = mappings.petType[data.petType] || data.petType;
    if (data.petType === '其他' && data.petTypeOther) {
        typeDisplay += `   (${data.petTypeOther})`;
    }
    setText('show_petType', typeDisplay);

    // 處理「晶片」：如果有，顯示號碼
    let chipDisplay = mappings.petChip[data.petChip] || data.petChip;
    if (data.petChip === 'yes' && data.petChipNumber) {
        chipDisplay += `   (${data.petChipNumber})`;
    }
    setText('show_petChip', chipDisplay);

    // 遺失資訊
    setText('show_missingDate', data.missingDate);
    setText('show_missingCity', cityMap[data.missingCity] || data.missingCity);
    setText('show_missingDistrict', regionMap[data.missingDistrict] || data.missingDistrict);
    setText('show_lostLocation', data.lostLocation);
    setText('show_missingStory', data.missingStory);
    setText('show_missingNotes', data.missingNotes);

    // 聯絡資訊
    setText('show_contactName', data.contactName);
    setText('show_contactPhone', data.contactPhone);
    setText('show_contactEmail', data.contactEmail);
    setText('show_contactOther', data.contactOther);


    // ---------------------------------------------------------
    // 4. 填入圖片
    // ---------------------------------------------------------
    for (let i = 1; i <= 4; i++) {
        const imgKey = `croppedPetImage_${i}`;
        const imgElement = document.getElementById(`show_img_${i}`);

        if (data[imgKey] && imgElement) {
            imgElement.src = data[imgKey]; // Base64 字串
            imgElement.style.display = "block";
        }
    }

    // ---------------------------------------------------------
    // 5. 初始化確認頁地圖 (唯讀)
    // ---------------------------------------------------------
    if (data.lostLocationLat && data.lostLocationLng) {
        const lat = parseFloat(data.lostLocationLat);
        const lng = parseFloat(data.lostLocationLng);

        // 確保 Leaflet 已經載入
        if (typeof L !== 'undefined') {
            const map = L.map('confirmMap', {
                center: [lat, lng],
                zoom: 15,
                zoomControl: true,
                dragging: false,
                scrollWheelZoom: false,
                doubleClickZoom: false,
                touchZoom: false
            });

            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; OpenStreetMap'
            }).addTo(map);

            L.marker([lat, lng], {
                interactive: false
            }).addTo(map);
        }
    } else {
        const mapDiv = document.getElementById('confirmMap');
        if (mapDiv) mapDiv.innerHTML = '<div style="padding:20px; text-align:center;">無地標資料</div>';
    }

    // ---------------------------------------------------------
    // 6. 按鈕功能
    // ---------------------------------------------------------

    // 返回修改
    const backToEditBtn = document.getElementById('backToEditBtn');
    if (backToEditBtn) {
        backToEditBtn.addEventListener('click', function () {
            window.location.href = '#missing_publish_1';
        });
    }

    const backToMissingPublish = document.getElementById('backto-missing-publish');
    if (backToMissingPublish) {
        backToMissingPublish.addEventListener('click', function () {
            window.location.href = '#missing_publish_1';
        });
    }

    // 送出審核
    const finalSubmitBtn = document.getElementById('finalSubmitBtn');
    if (finalSubmitBtn) {
        finalSubmitBtn.addEventListener('click', async function () {
            // 檢查勾選條款
            const rule = document.getElementById('agreeRule');
            const privacy = document.getElementById('agreePrivacy');
            const provide = document.getElementById('agreeData');

            if (!rule || !privacy || !provide) return; // 避免找不到元素報錯

            if (!rule.checked || !privacy.checked || !provide.checked) {
                showCustomAlert("系統提示", "請詳閱並勾選所有條款方可送出。", 1000);
                // alert('請詳閱並勾選所有條款方可送出。');
                return;
            }

            // 鎖定按鈕避免重複送出
            finalSubmitBtn.disabled = true;
            finalSubmitBtn.textContent = '資料傳送中...';
            const API_TOKEN_KEY = 'authToken';
            const token = localStorage.getItem(API_TOKEN_KEY);

            try {
                // 3. 發送 POST 請求
                const response = await fetch('/api/missing/', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        // 如果有 JWT Token，記得在這裡加上 Authorization header
                        'Authorization': 'Bearer ' + token 
                    },
                    body: JSON.stringify(data)
                });

                const apiResult = await response.json();

                if (response.ok && apiResult.success) {
                    // 4. 成功處理
                    const caseNo = apiResult.data.caseNumber;
                    // alert(`資料已送出！案件編號：${caseNo}\n即將進入審核流程。`);
                    showCustomAlert("系統提示", `資料已送出！案件編號：${caseNo}\n即將進入審核流程。`, 1000);


                    // 清除發佈過程的暫存資料
                    localStorage.removeItem('pendingPublishData');
                    localStorage.removeItem('lostPetLng');
                    localStorage.removeItem('lostPetLat');
                    for (let i = 1; i <= 4; i++) {
                        localStorage.removeItem(`croppedPetImage_${i}`);
                    }

                    // 跳轉頁面
                    window.location.href = `#missing_publish_result?casenumber=${caseNo}`;

                } else {
                    // 5. 失敗處理 (API 回傳 success: false 或 HTTP 錯誤)
                    throw new Error(apiResult.message || '伺服器發生未知的錯誤');
                }

            } catch (error) {
                console.error('發佈失敗:', error);
                // alert(error.message);
                showCustomAlert("系統提示", error.message, 1000);


                // 恢復按鈕狀態
                finalSubmitBtn.disabled = false;
                finalSubmitBtn.textContent = '送出審核';
            }

        });
    }

    // ---------------------------------------------------------
    // 7. 條款視窗邏輯
    // ---------------------------------------------------------

    const termsContentData = {
        'rule': {
            title: '上傳規範',
            content: `1. 使用者需保證走失資訊真實，包括走失時間、地點、外觀特徵與晶片資訊等。\n
2. 上傳照片需清晰、可辨識，且必須為走失寵物本人，不得使用非本人圖片或舊照誤導協尋。\n
3. 禁止上傳與案件無關、具攻擊性、違法或不當之內容。\n
4. 若資訊不完整、不清楚或不符事實，平台有權要求補件或拒絕刊登。\n
5. 若惡意刊登假協尋或散布不實資訊，平台將限制帳號使用權限。`,
            targetId: 'agreeRule'
        },
        'privacy': {
            title: '使用者隱私條款',
            content: `1. 協尋所需之聯絡方式將用於其他使用者、通報者或善心人士聯繫，不做其他用途。\n
2. 使用者可選擇公開或不公開聯絡方式；若不公開，平台將透過站內訊息轉達。\n
3. 平台不會將使用者個資提供給與協尋無關之第三方，也不會用於廣告用途。\n
4. 使用者可於會員中心查看、修改或刪除協尋案件資訊。\n
5. 平台僅會蒐集協尋必要資訊，不會揭露精確住址等敏感資料。`,
            targetId: 'agreePrivacy'
        },
        'data': {
            title: '使用者資料提供',
            content: `1. 使用者同意 ReHome 將協尋資訊展示於協尋列表、詳細頁與搜尋結果中。\n
2. 使用者需保證提供之資訊真實且可用，若造成誤導需自行負責。\n
3. 若寵物已尋獲，使用者有義務下架或更新資訊，以維持平台資訊正確性。\n
4. 協尋資訊可能被使用者分享至外部平台（如社群媒體），此部分不在 ReHome 控制範圍內。\n
5. 若刊登內容違規或不符事實，平台有權進行調整、移除或限制使用者使用權限。`,
            targetId: 'agreeData'
        }
    };

    let currentTargetId = '';

    // 將需要給 HTML 呼叫的函式掛載到 window 物件上
    window.openTermsModal = function (type) {
        const data = termsContentData[type];
        if (!data) return;

        document.getElementById('modalTitle').textContent = data.title;
        document.getElementById('modalContent').textContent = data.content;
        currentTargetId = data.targetId;

        const innerCheck = document.getElementById('modalInnerCheckbox');
        innerCheck.checked = false;

        const confirmBtn = document.querySelector('.btn-modal-confirm');
        confirmBtn.disabled = true;

        innerCheck.onchange = function () {
            confirmBtn.disabled = !this.checked;
        };

        document.getElementById('termsModal').style.display = 'flex';
    };

    window.closeTermsModal = function () {
        document.getElementById('termsModal').style.display = 'none';
    };

    window.confirmTerms = function () {
        if (currentTargetId) {
            const mainCheckbox = document.getElementById(currentTargetId);
            if (mainCheckbox) {
                mainCheckbox.checked = true;
            }
        }
        window.closeTermsModal();
    };

    const termsModal = document.getElementById('termsModal');
    if (termsModal) {
        termsModal.addEventListener('click', function (e) {
            if (e.target === this) {
                window.closeTermsModal();
            }
        });
    }

})();