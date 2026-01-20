// 條款彈窗管理 - 使用 IIFE 避免全域變數衝突
(function () {
    'use strict';

    let currentTermsType = '';

    // 頁面載入時立即載入資料並初始化
    loadFormDataAndDisplay();

    /**
     * 初始化預設照片   
     */
    function initializeDefaultPhotos() {
        const photoSections = document.querySelectorAll('.photo-section');
        const defaultImagePath = '../assets/img/logo/Logo.png';

        // console.log('初始化預設照片，找到區塊數量:', photoSections.length);

        photoSections.forEach((section, index) => {
            const img = section.querySelector('.pet-photo');
            const placeholder = section.querySelector('.preview-placeholder');

            if (img) {
                img.src = defaultImagePath;
                img.alt = '預設寵物圖片';
                img.style.display = 'block';
                img.classList.remove('pet-photo-hidden');
                // console.log(`設定預設照片 ${index + 1}`);
            }

            if (placeholder) {
                placeholder.style.display = 'none';
            }
        });
    }

    /**
     * 從 localStorage 載入資料並顯示
     */
    function loadFormDataAndDisplay() {
        try {
            const savedData = localStorage.getItem('petFormData');
            if (savedData) {
                const formData = JSON.parse(savedData);
                console.log('載入的完整資料:', formData);
                displayFormData(formData);
                console.log('成功載入並顯示表單資料');
            } else {
                console.log('沒有找到保存的表單資料，使用預設照片');
                // 只有在沒有保存資料時才使用預設照片
                initializeDefaultPhotos();
            }
        } catch (error) {
            console.error('載入表單資料時發生錯誤:', error);
            // 發生錯誤時也使用預設照片
            initializeDefaultPhotos();
        }
    }

    /**
     * 顯示表單資料到確認頁面
     */
    function displayFormData(data) {
        // 寵物基本資訊對應
        const mappings = {
            'petNickname': '.info-left .info-section:nth-child(1) .info-value',
            'petGender': '.info-left .info-section:nth-child(2) .info-value',
            'petSize': '.info-left .info-section:nth-child(3) .info-value',
            'petBreed': '.info-left .info-section:nth-child(4) .info-value',
            'petAge': '.info-left .info-section:nth-child(5) .info-value',

            'petMicrochip': '.info-right .info-section:nth-child(1) .info-value',

            'petType': '.info-right .info-section:nth-child(3) .info-value',

            'petNeutered': '.info-right .info-section:nth-child(5) .info-value'
        };

        // 更新基本資訊
        Object.keys(mappings).forEach(key => {
            const element = document.querySelector(mappings[key]);
            if (element && data[key] !== undefined && data[key] !== null) {
                element.textContent = formatValue(key, data[key]);
            }
        });
        const petTypeOtherElement = document.querySelector('.info-right .info-section:nth-child(4) .info-value');
        const petMicrochipNumberElement = document.querySelector('.info-right .info-section:nth-child(2) .info-value');

        if (petTypeOtherElement) {
            if (data.petTypeId === 10) {
                petTypeOtherElement.textContent = data.petTypeOther;
            } else {
                petTypeOtherElement.textContent = '無';
            }
        }
        if (petMicrochipNumberElement) {
            if (data.petMicrochip === false) {
                petMicrochipNumberElement.textContent = '無晶片';
            } else {
                petMicrochipNumberElement.textContent = data.petMicrochipNumber || '未填寫';
            }
        }

        // 更新地區資訊
        updateLocationInfo(data);

        // 更新說明資訊
        updateDescriptionInfo(data);

        // 更新聯絡人資訊
        updateContactInfo(data);

        // 更新照片
        updatePhotos(data.photos);

        // 更新領養要求
        updateRequirements(data);
    }

    /**
     * 格式化顯示值
     */
    function formatValue(key, value) {
        const formatMap = {
            'petGender': { 'male': '男', 'female': '女' },
            'petSize': { 'small': '小型', 'medium': '中型', 'big': '大型' },
            'petAge': { 'child': '幼年', 'adult': '成年', 'old': '老年' },
            'petNeutered': { 'true': '是', 'false': '否' },
            'petMicrochip': { 'true': '是', 'false': '否' }
        };


        // 將 boolean 轉成字串便於查表
        const normalizedValue = typeof value === 'boolean' ? String(value) : value;

        // 查表並返回
        return formatMap[key] && formatMap[key][normalizedValue] ? formatMap[key][normalizedValue] : value;
    }
    /**
     * 更新地區資訊
     */
    function updateLocationInfo(data) {
        // 更新寵物所在地
        const locationElement = document.querySelector('.area-content .area-row:nth-child(1) .area-value');
        if (locationElement) {
            const locationText = data.petLocation || '';
            const districtText = data.petDistrict ? ` ${data.petDistrict}` : '';
            locationElement.textContent = locationText + districtText;
        }

        // 更新可送養地點
        const CityElement = document.querySelector('.area-content .area-row:nth-child(2) .area-value');
        if (CityElement && data.adoptCity && data.adoptCity.length > 0) {
            CityElement.textContent = data.adoptCity.join(', ');
        }
    }

    /**
     * 更新說明資訊
     */
    function updateDescriptionInfo(data) {
        // 使用唯一的id選擇器
        const additionalElement = document.getElementById('additional-info-display');
        const medicalElement = document.getElementById('medical-info-display');
        const requirementsElement = document.getElementById('adoption-requirements-display');

        if (additionalElement) {
            additionalElement.textContent = data.additionalInfo || '尚無其他說明';
        }

        if (medicalElement) {
            medicalElement.textContent = data.medicalInfo || '尚無醫療說明';
        }

        if (requirementsElement) {
            requirementsElement.textContent = data.adoptionRequirements || '尚無其他要求';
        }


    }

    /**
     * 更新聯絡人資訊
     */
    function updateContactInfo(data) {
        // 聯絡人姓名
        const nameElement = document.querySelector('.info-section-user:nth-child(1) .info-value-user');
        if (nameElement) {
            nameElement.textContent = data.contactName || '';
        }

        // 聯絡電話 - 檢查是否公開
        const phoneElement = document.querySelector('.info-section-user:nth-child(2) .info-value-user');
        if (phoneElement) {
            phoneElement.textContent = data.phoneDisplay === false ? '不公開' : (data.contactPhone || '');
        }

        // 聯絡信箱 - 檢查是否公開
        const emailElement = document.querySelector('.info-section-user:nth-child(3) .info-value-user');
        if (emailElement) {
            emailElement.textContent = data.emailDisplay === false ? '不公開' : (data.contactEmail || '');
        }
    }

    /**
     * 更新照片
     */
    function updatePhotos(photos) {
        const photoSections = document.querySelectorAll('.photo-section');
        const defaultImagePath = '../assets/img/logo/Logo.png';

        // console.log('=== 照片更新開始 ===');
        // console.log('原始照片資料:', photos);

        if (!Array.isArray(photos)) {
            initializeDefaultPhotos();
            return;
        }

        const validPhotos = photos.filter(p => {
            const src = p?.src || p?.data;
            return src && (
                src.startsWith('data:image') ||     // base64 圖
                src.endsWith('.jpg') ||
                src.endsWith('.jpeg') ||
                src.endsWith('.png') ||
                src.endsWith('.webp')
            );

        });

        // console.log('✅ 有效照片數量:', validPhotos.length);

        photoSections.forEach((section, index) => {
            const img = section.querySelector('.pet-photo');
            const placeholder = section.querySelector('.preview-placeholder');
            if (!img) return;

            const photoData = validPhotos[index];   // 依「有效照片順序」填
            const imageSrc = photoData?.src || photoData?.data || null;

            if (imageSrc) {
                img.src = imageSrc;
                img.alt = '寵物照片';

            } else {
                img.src = defaultImagePath;
                img.alt = '預設寵物圖片';

            }

            img.classList.remove('pet-photo-hidden');
            img.style.display = 'block';
            if (placeholder) placeholder.style.display = 'none';
        });

        // console.log('=== 照片更新完成 ===');
    }



    /**
     * 更新領養要求
     */
    function updateRequirements(data) {
        const requirementItems = document.querySelectorAll('.requirement-item');

        // 根據資料更新要求項目
        const requirements = [
            { key: 'followUp', text: '須同意後續追蹤', value: data.followUp === 'agree' },
            { key: 'familyConsent', text: '需家人同意領養', value: data.familyConsent === 'required' },
            { key: 'ageLimit', text: '須滿20歲', value: data.ageLimit === 'required' }
        ];

        requirements.forEach((req, index) => {
            if (requirementItems[index]) {
                const icon = requirementItems[index].querySelector('i');
                const text = requirementItems[index];

                if (req.value) {
                    icon.className = 'bi bi-check2-circle icon-yes';
                    text.innerHTML = `<i class="bi bi-check2-circle icon-yes"></i> ${req.text}`;
                } else {
                    icon.className = 'bi bi-x-circle icon-no';
                    text.innerHTML = `<i class="bi bi-x-circle icon-no"></i> 不${req.text}`;
                }
            }
        });
    }

    // 條款內容
    const termsContent = {
        upload: {
            title: '上傳規範',
            content: `
                    <p>為確保 ReHome 平台上的動物資訊完整且真實，送養者於刊登前需遵守以下規範：</p>
                    <h4>1. 內容真實性</h4>
                    <p>• 送養者需保證所有提供之寵物資訊（如年齡、健康狀況、結紮資訊、醫療紀錄、生活習性等）皆為正確且未刻意隱瞞。</p>
                    <p>• 不得偽造、杜撰或使用非本人之寵物資訊刊登案件。</p>
                    <h4>2. 照片與影像</h4>
                    <p>• 上傳之照片需為寵物本人、清晰、無過度修圖，且不得使用網路下載或他人所有之圖片。</p>
                    <p>• 建議至少提供 2–4 張不同角度之清晰照片，以利領養者判斷。</p>
                    <h4>3. 禁止上傳內容</h4>
                    <p>• 含暴力、血腥、虐待、傷害動物之影像或文字。</p>
                    <p>• 帶有人身攻擊、歧視、政治性、色情或不當語言之內容。</p>
                    <p>• 任何包含個人敏感資訊（如身分證、住址等）的影像或文件。</p>
                    <h4>4. 聯絡方式規範</h4>
                    <p>• 若選擇公開聯絡方式，需確保資訊正確可聯繫。</p>
                    <p>• 若選擇不公開，本平台將透過站內聊天系統協助雙方溝通。</p>
                    <h4>5. 審核制度</h4>
                    <p>• 所有送養刊登將進入審核流程；若內容不完整、不正確或違反規範，平台有權請使用者補件、修正或拒絕刊登。</p>
                    `

        },
        privacy: {
            title: '使用者隱私條款',
            content: `
                    <h4>1. 個人資料使用目的</h4>
                    <p>•送養者提供之資料（聯絡方式、居住縣市、暱稱等）將用於：</p>
                    <p>• 送養案件審核</p>
                    <p>• 協助領養者聯繫</p>
                    <p>• 案件後續管理（如領養申請審核）</p>
                    <h4>2. 非公開資訊保護</h4>
                    <p>• 若送養者選擇不公開聯絡方式，系統將僅透過站內聊天工具傳遞訊息，不會向第三方揭露。</p>
                    <p>• 不會將送養者資料提供給任何非案件相關之第三方。</p>
                    <p>• 不用於商業目的</p>
                    <h4>3. 會員資料權益</h4>
                    <p>送養者可隨時於「會員中心」查看、修改或刪除個人資料。
                        刪除資料後，平台可能無法繼續提供部分功能後。</p>
                `
        },
        data: {
            title: '服務條款',
            content: `
                    <h4>1. 必須提供之資料</h4>
                    <p>送養刊登需提供下列必要資訊：</p>
                    <p>• 寵物基本資訊（種類、年齡、健康狀態等）</p>
                    <p>• 聯絡方式（可選公開或私密）</p>
                    <p>• 送養範圍與領養條件</p>
                    <p>• 醫療紀錄與備註</p>
                    <h4>2. 使用者責任</h4>
                    <p>• 保證提供資訊為本人所有之寵物資訊。</p>
                    <p>• 確保資料真實無誤，若資料不實導致爭議，使用者需自行負責。</p>
                    <h4>3. 平台使用範圍</h4>
                    <p>使用者同意 ReHome 得於以下用途展示資訊：</p>
                    <p>• 領養列表與詳細頁面</p>
                    <p>• 平台內搜尋與篩選結果</p>
                    <p>• 會員中心案件管理</p>
                    <h4>4. 刊登修改與下架</h4>
                    <p>送養者可：</p>
                    <p>• 隨時於會員中心編輯、更新資料</p>
                    <p>• 於寵物成功送養後自行下架案件</p>
                `
        }
    };

    function showTermsModal(type) {
        currentTermsType = type;
        const modal = document.getElementById('termsModal');
        const title = document.getElementById('modalTitle');
        const content = document.getElementById('modalContent');

        title.textContent = termsContent[type].title;
        content.innerHTML = termsContent[type].content;
        modal.style.display = 'flex';
    }

    function closeTermsModal() {
        document.getElementById('termsModal').style.display = 'none';
        currentTermsType = '';
    }

    function acceptTerms() {
        if (currentTermsType) {
            // 自動勾選對應的 checkbox
            const checkboxId = {
                'upload': 'upload-rules',
                'privacy': 'privacy-policy',
                'data': 'terms-data'
            };

            const checkbox = document.getElementById(checkboxId[currentTermsType]);
            if (checkbox) {
                checkbox.checked = true;
            }

            closeTermsModal();
        }
    }
    //確認驗證與提交表單
    function validateAndSubmit() {
        const checkboxes = document.querySelectorAll('input[name="agreements"]');
        const allChecked = Array.from(checkboxes).every(cb => cb.checked);

        if (!allChecked) {
            alert('請先閱讀並同意所有條款！');
            return false;
        }

        // 獲取表單資料
        const savedData = localStorage.getItem('petFormData');
        if (!savedData) {
            alert('找不到表單資料，請重新填寫');
            window.location.hash = '#pet-inf';
            return false;
        }

        const formData = JSON.parse(savedData);
        const token = localStorage.getItem('authToken');
        console.log('authToken =', token);


        // 提交到後端
        fetch('/api/se/submit-pet-adoption', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` 
            },
            body: JSON.stringify(formData)
        })
          .then(async (response) => {
            if (response.status === 401) {
                throw new Error('登入已失效，請重新登入');
            }

            if (!response.ok) {
                const text = await response.text().catch(() => '');
                throw new Error(text || `提交失敗（HTTP ${response.status}）`);
            }

            return response.json();
        })
        

            // .then(response => response.json())
            .then(data => {
                console.log('後端回傳 data：', data);
                if (data.success) {
                    // 提交成功，保存案件資料並導向審核頁面
                    const caseData = {
                        caseId: data.caseId,
                        caseNumber: data.caseNumber,
                        submitDate: data.caseDate,
                        petInfo: formData
                        
                    };
                   console.log('後端回傳資料:', caseData);
                    // 保存案件
                    localStorage.setItem('currentCaseData', JSON.stringify(caseData));

                    // 清除
                    localStorage.removeItem('petFormData');

                    // 審核頁面
                    window.location.hash = '#adoption-review';
                } else {
                    throw new Error(data.message || '提交失敗');
                }
            })
            .catch(error => {
                console.error('提交失敗:', error);
                alert('提交失敗：' + error.message + '，請稍後再試');
            });

    }

    /**
     * 返回編輯頁面
     */
    function goBackToEdit() {
        window.location.hash = '#pet-inf';
    }

    // 將函數綁定到全域作用域，讓 HTML 可以呼叫
    window.showTermsModal = showTermsModal;
    window.closeTermsModal = closeTermsModal;
    window.acceptTerms = acceptTerms;
    window.validateAndSubmit = validateAndSubmit;
    window.goBackToEdit = goBackToEdit;
})();