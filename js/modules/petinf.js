// 寵物資訊表單 - JavaScript 功能
// Pet Information Form - JavaScript Functions

(function() {
    'use strict';
    
    // 模組內部變數
    let petCropper = null;
    let currentTarget = null;

// 主要初始化函數
async function initPetInfoPage() {
    // console.log('Pet Information JS 載入完成');
    initializePhotoUpload();
    initializeTextareaCounters();
    initializeFormEnhancements();
    initializeAdoptAreaLimit();
    refreshAdoptAreaLimitUI(); // 把 checkbox 禁用/啟用狀態更新
    // await loadPetTypes();// 載入寵物種類選項
    // await loadCity(); // 載入縣市選項
    await Promise.all([loadPetTypes(), loadCity()]);

    // 載入保存的表單資料
    await loadSavedFormData();

    // console.log('所有功能初始化完成');
}

// 等待 DOM 載入完成後自動執行初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPetInfoPage);
} else {
    // DOM 已載入完成，直接執行
    initPetInfoPage();
}


/**
 * 初始化照片上傳功能
 */
function initializePhotoUpload() {
    // console.log('開始初始化照片上傳功能...');
    
    // // 檢查 Cropper.js 是否載入
    // if (typeof Cropper === 'undefined') {
    //     console.error('Cropper.js 未載入，照片上傳功能無法使用');
    //     return;
    // }
    // console.log('Cropper.js 已載入');
    
    // 綁定上傳按鈕事件
    const uploadButtons = document.querySelectorAll('.upload-btn');
    // console.log('找到上傳按鈕數量:', uploadButtons.length);
    
    uploadButtons.forEach((btn, index) => {
        // console.log(`綁定按鈕 ${index + 1}:`, btn);
        btn.addEventListener('click', function (e) {
            e.preventDefault();
            // console.log('上傳按鈕被點擊, target:', this.getAttribute('data-target'));
            
            const target = this.getAttribute('data-target');
            const fileInput = document.getElementById(`pet-photo-${target}`);
            
            if (fileInput) {
                currentTarget = target;
                // console.log('設定 currentTarget:', currentTarget);
                // console.log('觸發文件選擇器...');
                fileInput.click();
            } else {
                console.error('找不到文件輸入框:', `pet-photo-${target}`);
            }
        });
    });

    // 綁定檔案選擇事件
    const fileInputs = document.querySelectorAll('input[type="file"]');
    // console.log('找到文件輸入框數量:', fileInputs.length);
    
    fileInputs.forEach((input, index) => {
        // console.log(`綁定文件輸入框 ${index + 1}:`, input.id);
        input.addEventListener('change', function (e) {
            // console.log('文件被選擇:', e.target.files);
            const file = e.target.files[0];
            if (file) {
                // console.log('處理文件:', file.name, 'currentTarget:', currentTarget);
                showCropModal(file);
            } else {
                // console.log('沒有選擇文件');
            }
        });
    });
    
    // console.log('照片上傳功能初始化完成');
}

/**
 * 顯示照片裁剪模態框
 * @param {File} file - 選中的圖片檔案
 */
function showCropModal(file) {
    const reader = new FileReader();
    reader.onload = function (e) {
        const cropImage = document.getElementById('cropImage');
        cropImage.src = e.target.result;

        // 顯示模態框
        document.getElementById('cropModal').style.display = 'flex';

        // 初始化 Cropper.js
        setTimeout(() => {
            if (petCropper) {
                petCropper.destroy();
            }
            petCropper = new Cropper(cropImage, {
                aspectRatio: 1, // 1:1 比例 (正方形)
                viewMode: 2,
                dragMode: 'move',
                autoCropArea: 0.8,
                restore: false,
                guides: true,
                center: true,
                highlight: false,
                cropBoxMovable: true,
                cropBoxResizable: true,
                toggleDragModeOnDblclick: false,
                preview: '#cropPreview'
            });
        }, 300); // 延遲以確保圖片載入完成
    };
    reader.readAsDataURL(file);
}

/**
 * 關閉裁剪模態框
 */
function closeCropModal() {
    document.getElementById('cropModal').style.display = 'none';
    if (petCropper) {
        petCropper.destroy();
        petCropper = null;
    }
    currentTarget = null;
}

/**
 * 確認裁剪並顯示預覽
 */
function confirmCrop() {
    if (petCropper && currentTarget) {
        // 獲取裁剪後的畫布
        const canvas = petCropper.getCroppedCanvas({
            width: 300,
            height: 300
        });

        // 轉換為 base64 格式
        const croppedImage = canvas.toDataURL('image/jpeg', 0.8);

        // 顯示裁剪後的圖片
        updatePhotoPreview(currentTarget, croppedImage);

        // 關閉模態框
        closeCropModal();
    }
}

/**
 * 更新照片預覽區域
 * @param {string} target - 目標照片編號
 * @param {string} imageSrc - 圖片的 base64 數據
 */
function updatePhotoPreview(target, imageSrc) {
    const previewImg = document.getElementById(`preview-image-${target}`);
    const placeholder = previewImg.parentElement.querySelector('.preview-placeholder');

    previewImg.src = imageSrc;
    previewImg.style.display = 'block';
    placeholder.style.display = 'none';
}

/**
 * 驗證表單資料
 * @returns {Object} 驗證結果
 */
function validateForm() {
    const errors = [];
    const warnings = [];

    // 必填欄位檢查
    if (!document.getElementById('pet-nickname').value.trim()) {
        errors.push('請輸入寵物暱稱');
    }

    if (!document.getElementById('pet-gender').value) {
        errors.push('請選擇寵物性別');
    }

    if (!document.getElementById('pet-type').value || document.getElementById('pet-type').value === 'ch') {
        errors.push('請選擇寵物種類');
    }

    if (!document.getElementById('pet-age').value) {
        errors.push('請選擇寵物年齡');
    }

    if (!document.getElementById('pet-location').value) {
        errors.push('請選擇寵物所在地');
    }

    // 聯絡人資料必填檢查
    if (!document.getElementById('contact-name').value.trim()) {
        errors.push('請輸入聯絡人姓名');
    }

    if (!document.getElementById('contact-phone').value.trim() && !document.getElementById('contact-email').value.trim()) {
        errors.push('請至少提供聯絡電話或電子郵件其中一項');
    }

    // 電子郵件格式檢查
    const email = document.getElementById('contact-email').value.trim();
    if (email && !isValidEmail(email)) {
        errors.push('請輸入有效的電子郵件格式');
    }

    // 電話號碼格式檢查
    const phone = document.getElementById('contact-phone').value.trim();
    if (phone && !isValidPhone(phone)) {
        errors.push('請輸入有效的電話號碼格式');
    }

    // 可送養範圍檢查
    const adoptCity = document.querySelectorAll('input[name="adoptCity"]:checked');
    if (adoptCity.length === 0) {
        warnings.push('建議至少選擇一個可送養區域');
    }

    // 照片檢查
    const uploadedPhotos = [];
    for (let i = 1; i <= 4; i++) {
        const img = document.getElementById(`preview-image-${i}`);
        if (img.src && img.style.display !== 'none') {
            uploadedPhotos.push(i);
        }
    }

    if (uploadedPhotos.length === 0) {
        warnings.push('建議至少上傳一張寵物照片');
    }

    return {
        isValid: errors.length === 0,
        errors: errors,
        warnings: warnings
    };
}

/**
 * 提交表單
 */
function submitForm() {
    const validation = validateForm();

    if (!validation.isValid) {
        alert('請修正以下錯誤：\n' + validation.errors.join('\n'));
        return;
    }

    if (validation.warnings.length > 0) {
        if (!confirm('注意事項：\n' + validation.warnings.join('\n') + '\n\n是否繼續提交？')) {
            return;
        }
    }

    const formData = collectFormData();
    console.log('表單資料：', formData);
    localStorage.setItem('petFormData', JSON.stringify(formData));
    alert('表單提交成功！');
}

/**
 * 初始化文字框字數計算器
 */
function initializeTextareaCounters() {
    // 設定每個 textarea 的字數限制
    const textareas = [
        { id: 'additional-info', counterId: 'additional-info-counter', maxLength: 500 },
        { id: 'medical-info', counterId: 'medical-info-counter', maxLength: 500 },
        { id: 'adoption-requirements', counterId: 'adoption-requirements-counter', maxLength: 500 }
    ];

    textareas.forEach(config => {
        const textarea = document.getElementById(config.id);
        const counter = document.getElementById(config.counterId);

        if (textarea && counter) {
            // 初始化計數器 兩個標籤都要在
            updateCharCounter(textarea, counter, config.maxLength);

            // 監聽輸入事件
            textarea.addEventListener('input', function () {
                updateCharCounter(this, counter, config.maxLength);
            });

            // 監聽貼上事件
            textarea.addEventListener('paste', function () {
                setTimeout(() => {
                    updateCharCounter(this, counter, config.maxLength);
                }, 10);
            });
        }
    });
}

/**
 * 更新字數計算器顯示
 */
function updateCharCounter(textarea, counter, maxLength) {
    const currentLength = textarea.value.length;
    const remaining = maxLength - currentLength;

    // 更新顯示文字
    counter.textContent = `已輸入${currentLength}/${maxLength} 字`;

    // 根據剩餘字數更改樣式
    counter.classList.remove('warning', 'danger');

    if (remaining <= 20 && remaining > 0) {
        // 剩餘字數少於20字時顯示警告
        counter.classList.add('warning');
    } else if (remaining <= 0) {
        // 達到字數上限時顯示危險狀態
        counter.classList.add('danger');
    }

    // 如果超過字數限制
    if (currentLength > maxLength) {
        textarea.value = textarea.value.substring(0, maxLength);
        counter.textContent = `${maxLength}/${maxLength} 字`;
        counter.classList.add('danger');
    }
}

/**
 * 初始化表單增強功能
 */
function initializeFormEnhancements() {
    const petTypeSelect = document.getElementById('pet-type');
    const otherTypeInput = document.getElementById('pet-type-other');
    const microchipSelect = document.getElementById('pet-microchip');
    const microchipInput = document.getElementById('pet-microchip-number');

    // 寵物種類選擇鎖定
    if (petTypeSelect && otherTypeInput) {
        //初始 無法選擇
        otherTypeInput.disabled = true;


        petTypeSelect.addEventListener('change', function () {
            if (this.value === '10') {
                otherTypeInput.disabled = false;
                otherTypeInput.focus();
                otherTypeInput.placeholder = '請輸入具體的寵物種類';
            } else {
                otherTypeInput.disabled = true;
                otherTypeInput.placeholder = '此欄在選擇「其他」時開放填寫';
                otherTypeInput.value = '';

                if (this.value === '') {
                    otherTypeInput.disabled = true;
                    otherTypeInput.placeholder = '請先選擇寵物物種';
                }
            }
        });

    }

    // 晶片資訊選擇鎖定
    if (microchipSelect && microchipInput) {
        //初始 無法選擇
        microchipInput.disabled = true;


        microchipSelect.addEventListener('change', function () {
            if (this.value === 'true') {
                // 選擇「有」晶片時，啟用輸入框
                microchipInput.disabled = false;
                // microchipInput.style.backgroundColor = '#fff';
                // microchipInput.style.cursor = 'text';
                microchipInput.focus();
                microchipInput.placeholder = '請輸入晶片編號';
            } else {
                // 選擇「無」或未選擇時，禁用輸入框
                microchipInput.disabled = true;
                // microchipInput.style.backgroundColor = '#f5f5f5';
                // microchipInput.style.cursor = 'not-allowed';
                microchipInput.value = '';

                if (this.value === 'false') {
                    microchipInput.placeholder = '寵物無晶片，無法填寫';
                } else {
                    microchipInput.placeholder = '請先選擇是否有晶片';
                }
            }
        });
    }


}

/**
 * 初始化送養範圍選擇限制
 */
function initializeAdoptAreaLimit() {
    const adoptAreaCheckboxes = document.querySelectorAll('input[name="adoptCity"]');
    const maxSelections = 5;

    adoptAreaCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', function () {
            const checkedBoxes = document.querySelectorAll('input[name="adoptCity"]:checked');

            if (checkedBoxes.length > maxSelections) {
                // 如果超過限制，取消當前的選擇
                this.checked = false;
                alert(`最多只能選擇 ${maxSelections} 個送養範圍`);
                return;
            }
            // 更新UI狀態
            refreshAdoptAreaLimitUI();
        });
    });
}

/**
 * 收集表單數據
 */
function collectFormData() {
    const formData = {
        // 寵物基本資訊
        petNickname: document.getElementById('pet-nickname')?.value || '',
        petGender: document.getElementById('pet-gender')?.value || '',
        petBreed: document.getElementById('pet-breed')?.value || '',
        petSize: document.getElementById('pet-size')?.value || '',
        petAge: document.getElementById('pet-age')?.value || '',

        petNeutered: document.getElementById('pet-neutered')?.value === 'true',
        petMicrochip: document.getElementById('pet-microchip')?.value === 'true',

        petMicrochipNumber: document.getElementById('pet-microchip-number')?.value || '',
        petLocationId: parseInt(document.getElementById('pet-location')?.value) || null,
        petLocation: document.getElementById('pet-location')?.selectedOptions[0]?.text || '',//確認頁顯示用
        petDistrictId: parseInt(document.getElementById('pet-district')?.value) || null,
        petDistrict: document.getElementById('pet-district')?.selectedOptions[0]?.text || '',//確認頁顯示用
        petTypeId: parseInt(document.getElementById('pet-type')?.value) || null,
        petType: document.getElementById('pet-type')?.selectedOptions[0]?.text || '',//確認頁顯示用
        petTypeOther: document.getElementById('pet-type-other')?.value || '',

        // 可送養範圍（後端期望 adoptCityIds）
        adoptCityIds: Array.from(document.querySelectorAll('input[name="adoptCity"]:checked')).map(cb => parseInt(cb.value)),
        adoptCity: Array.from(document.querySelectorAll('input[name="adoptCity"]:checked')).map(cb => cb.closest('label')?.textContent.trim() || cb.value),
        // 補充說明
        additionalInfo: document.getElementById('additional-info')?.value || '',
        medicalInfo: document.getElementById('medical-info')?.value || '',

        // 聯絡人資料
        contactName: document.getElementById('contact-name')?.value || '',
        contactPhone: document.getElementById('contact-phone')?.value || '',
        phoneDisplay: document.getElementById('phone-display')?.value === 'true',
        contactEmail: document.getElementById('contact-email')?.value || '',
        emailDisplay: document.getElementById('email-display')?.value === 'true',

        // 領養要求
        followUp: document.getElementById('follow-up')?.value || '',
        familyConsent: document.getElementById('family-consent')?.value || '',
        ageLimit: document.getElementById('age-limit')?.value || '',
        adoptionRequirements: document.getElementById('adoption-requirements')?.value || '',

        // 照片資料
        photos: []
    };

    // 收集照片資料
    for (let i = 1; i <= 4; i++) {
        const previewImg = document.getElementById(`preview-image-${i}`);
        if (!previewImg) continue;

        const src = previewImg.src || '';
        const isVisible = getComputedStyle(previewImg).display !== 'none';

        // 只接受「有顯示」而且是真正圖片的 src
        const isRealImage =
            src.startsWith('data:image') ||        // 裁剪後的 base64
            src.endsWith('.jpg') ||
            src.endsWith('.jpeg') ||
            src.endsWith('.png') ||
            src.endsWith('.webp');

        if (isVisible && isRealImage) {
            formData.photos.push({
                id: i,
                src: src
            });
        }
    }

    return formData;
}


/**
 * 驗證電子郵件格式
 * @param {string} email - 電子郵件地址
 * @returns {boolean} 是否為有效格式
*/
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * 驗證電話號碼格式
 * @param {string} phone - 電話號碼
 * @returns {boolean} 是否為有效格式
*/
function isValidPhone(phone) {
    // 支援台灣手機和市話格式
    const phoneRegex = /^(\+886|0)?([2-8]\d{7,8}|9\d{8})$/;
    // 移除空格和連字號再驗證
    const cleanPhone = phone.replace(/[\s-]/g, '');
    return phoneRegex.test(cleanPhone);
}

/**
 * 儲存資料並導向確認頁面
 */
function saveDataAndNavigate() {
    try {
        const formData = collectFormData();

        // 驗證必填欄位
        const validation = validateForm();

        if (!validation.isValid) {
            alert('請修正以下錯誤：\n' + validation.errors.join('\n'));
            return false;
        }

        // 顯示警告訊息（如果有的話）
        if (validation.warnings.length > 0) {
            if (!confirm('注意事項：\n' + validation.warnings.join('\n') + '\n\n是否繼續送出？')) {
                return false;
            }
        }

        // 將資料存到 localStorage
        localStorage.setItem('petFormData', JSON.stringify(formData));

        // 導向確認頁面
        window.location.href  = '#pet-inf-con';

        return true;
    } catch (error) {
        console.error('保存資料時發生錯誤:', error);
        alert('保存資料時發生錯誤，請稍後再試');
        return false;
    }
}

/**
 * 載入保存的表單資料
 */
    async function loadSavedFormData() {
    try {
        const savedData = localStorage.getItem('petFormData');
        if (savedData) {
            const formData = JSON.parse(savedData);
            await restoreFormData(formData);
            // console.log('成功載入保存的表單資料');
        }
    } catch (error) {
        console.error('載入保存資料時發生錯誤:', error);
    }
}

/**
 * 恢復表單資料到各個欄位
 */
    async function restoreFormData(data) {
    // 恢復基本寵物資訊
    if (data.petNickname) document.getElementById('pet-nickname').value = data.petNickname;
    if (data.petGender) document.getElementById('pet-gender').value = data.petGender;
    if (data.petBreed) document.getElementById('pet-breed').value = data.petBreed;
    if (data.petSize) document.getElementById('pet-size').value = data.petSize;
    if (data.petAge) document.getElementById('pet-age').value = data.petAge;
    if (typeof data.petNeutered === 'boolean') document.getElementById('pet-neutered').value = data.petNeutered ? 'true' : 'false';
    if (typeof data.petMicrochip === 'boolean') document.getElementById('pet-microchip').value = data.petMicrochip ? 'true' : 'false';
    if (data.petMicrochipNumber) document.getElementById('pet-microchip-number').value = data.petMicrochipNumber;

    // 恢復地區資訊（需要特殊處理聯動）
    if (data.petLocationId) {
        document.getElementById('pet-location').value = data.petLocationId;
        // 載入對應的區域選項
        if (data.petDistrictId) {
            await loadDistricts(Number(data.petLocationId), Number(data.petDistrictId));
        }
    }

    if (data.petTypeId) document.getElementById('pet-type').value = data.petTypeId;
    if (data.petTypeOther) document.getElementById('pet-type-other').value = data.petTypeOther;

    // 恢復可送養範圍
    if (data.adoptCityIds && data.adoptCityIds.length > 0) {
        data.adoptCityIds.forEach(area => {
            const checkbox = document.querySelector(`input[name="adoptCity"][value="${area}"]`);
            if (checkbox) checkbox.checked = true;
        });
    }

    // 恢復補充說明
    if (data.additionalInfo) document.getElementById('additional-info').value = data.additionalInfo;
    if (data.medicalInfo) document.getElementById('medical-info').value = data.medicalInfo;

    // 恢復聯絡人資料
    if (data.contactName) document.getElementById('contact-name').value = data.contactName;
    if (data.contactPhone) document.getElementById('contact-phone').value = data.contactPhone;
    if (typeof data.phoneDisplay === 'boolean') document.getElementById('phone-display').value = data.phoneDisplay ? 'true' : 'false';
    if (data.contactEmail) document.getElementById('contact-email').value = data.contactEmail;
    if (typeof data.emailDisplay === 'boolean') document.getElementById('email-display').value = data.emailDisplay ? 'true' : 'false';
    // 恢復領養要求
    if (data.followUp) document.getElementById('follow-up').value = data.followUp
    if (data.familyConsent) document.getElementById('family-consent').value = data.familyConsent;
    if (data.ageLimit) document.getElementById('age-limit').value = data.ageLimit;
    if (data.adoptionRequirements) document.getElementById('adoption-requirements').value = data.adoptionRequirements;

    // 恢復照片
    if (data.photos && data.photos.length > 0) {
        data.photos.forEach(photo => {
            updatePhotoPreview(photo.id, photo.src);
        });
    }

    // 更新字數計算器
    updateTextareaCounters();

    // 觸發表單增強功能的相關邏輯
    triggerFormEnhancements();

    // 恢復送養區域UI狀態
    refreshAdoptAreaLimitUI();
}

/**
 * 更新所有文字區域的字數計算器
 */
function updateTextareaCounters() {
    const textareas = [
        { id: 'additional-info', counterId: 'additional-info-counter', maxLength: 500 },
        { id: 'medical-info', counterId: 'medical-info-counter', maxLength: 500 },
        { id: 'adoption-requirements', counterId: 'adoption-requirements-counter', maxLength: 500 }
    ];

    textareas.forEach(config => {
        const textarea = document.getElementById(config.id);
        const counter = document.getElementById(config.counterId);
        if (textarea && counter) {
            updateCharCounter(textarea, counter, config.maxLength);
        }
    });
}

/**
 * 觸發表單增強功能
 */
function triggerFormEnhancements() {
    // 觸發寵物種類選擇邏輯
    const petTypeSelect = document.getElementById('pet-type');
    if (petTypeSelect && petTypeSelect.value) {
        petTypeSelect.dispatchEvent(new Event('change'));
    }

    // 觸發晶片選擇邏輯
    const microchipSelect = document.getElementById('pet-microchip');
    if (microchipSelect && microchipSelect.value) {
        microchipSelect.dispatchEvent(new Event('change'));
    }
}

/**
 * 刷新送養區域UI狀態
 */
function refreshAdoptAreaLimitUI() {
    const adoptAreaCheckboxes = document.querySelectorAll('input[name="adoptCity"]');
    const maxSelections = 5;
    const checkedBoxes = document.querySelectorAll('input[name="adoptCity"]:checked');

    adoptAreaCheckboxes.forEach(box => {
        if (checkedBoxes.length >= maxSelections) {
            if (!box.checked) {
                // 已達上限：未選中的禁用
                box.disabled = true;
                box.parentElement.style.opacity = '0.5';
                box.parentElement.style.cursor = 'not-allowed';
            } else {
                // 已選中的保持可用，方便取消
                box.disabled = false;
                box.parentElement.style.opacity = '1';
                box.parentElement.style.cursor = 'pointer';
            }
        } else {
            // 未達上限：全部啟用
            box.disabled = false;
            box.parentElement.style.opacity = '1';
            box.parentElement.style.cursor = 'pointer';
        }
    });
}


// 動態後端物種選項
async function loadPetTypes() {
    const resp = await fetch('/api/se/animal-species');
    const result = await resp.json();
    const petTypeSelect = document.getElementById('pet-type');
    petTypeSelect.innerHTML = '<option value="">請選擇寵物物種</option>';
    result.data.forEach(species => {
        const option = document.createElement('option');
        option.value = species.id;
        option.textContent = species.name;
        petTypeSelect.appendChild(option);
    });
}
//動態縣市選項
async function loadCity(selectedCityId) {
    const resp = await fetch('/api/se/cities');
    const result = await resp.json();

    if (!result.success) return;

    const citySelect = document.getElementById('pet-location');
    citySelect.innerHTML = '<option value="">請選擇縣市</option>';

    result.data.forEach(city => {
        const option = document.createElement('option');
        option.value = city.id;
        option.textContent = city.name;

        if (selectedCityId && selectedCityId === city.id) {
            option.selected = true;
        }
        citySelect.appendChild(option);
    });
}
//動態區域選項
async function loadDistricts(cityId, selectedDistrictId) {
    const districtSelect = document.getElementById('pet-district');
    if (!cityId) {
        districtSelect.innerHTML = '<option value="">請先選擇縣市</option>';
        return;
    }
    const resp = await fetch(`/api/se/regions?cityId=${Number(cityId)}`);
    const result = await resp.json();

    if (!result.success) return;
    districtSelect.innerHTML = '<option value="">請選擇區域</option>';
    result.data.forEach(district => {
        const option = document.createElement('option');
        option.value = district.id;
        option.textContent = district.name;

        if (selectedDistrictId && selectedDistrictId === district.id) {
            option.selected = true;
        }
        districtSelect.appendChild(option);
    });
}

// 設定縣市變更監聽器
document.getElementById('pet-location').addEventListener('change', function () {
    const cityId = this.value ? Number(this.value) : null;
    loadDistricts(cityId, null);
});


// 將函數暴露到全域範圍，供HTML中的onclick使用
window.closeCropModal = closeCropModal;
window.confirmCrop = confirmCrop;
window.saveDataAndNavigate = saveDataAndNavigate;

})();