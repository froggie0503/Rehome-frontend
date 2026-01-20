// ==================== 配置 ====================
const CONFIG = {
    API_BASE_URL: 'http://localhost:8080/api/banners',
    MAX_BANNERS: 5,
    MAX_FILE_SIZE: 16 * 1024 * 1024, // 16MB
    USE_MOCK: false,  // 設為 false 使用真實 API
    STORAGE_KEY: 'rehome_banners',
    NETWORK_DELAY: 500
};

// ==================== 資料儲存 ====================
const bannersData = {};

// ==================== 初始化 ====================
document.addEventListener('DOMContentLoaded', async function() {
    await initializeBanners();
    setupEventListeners();
});

/**
 * 初始化輪播圖資料
 */
async function initializeBanners() {
    try {
        // 從後端載入資料
        await loadAllBanners();
    } catch (error) {
        console.error('初始化失敗:', error);
    }
}

/**
 * 設定事件監聽器
 */
function setupEventListeners() {
    // 處理所有上傳按鈕
    const uploadButtons = document.querySelectorAll('.upload-btn, .upload-btn-small');
    
    uploadButtons.forEach(button => {
        button.addEventListener('click', function() {
            const targetId = this.getAttribute('data-target');
            const fileInput = document.getElementById(targetId);
            fileInput.click();
        });
    });

    // 處理檔案選擇
    const fileInputs = document.querySelectorAll('input[type="file"]');
    
    fileInputs.forEach(input => {
        input.addEventListener('change', function(e) {
            handleFileSelect(e);
        });
    });

    // 處理更新按鈕
    const updateButtons = document.querySelectorAll('.update-banner-btn');
    
    updateButtons.forEach(button => {
        button.addEventListener('click', async function() {
            const bannerItem = this.closest('.banner-item');
            const bannerId = parseInt(bannerItem.dataset.bannerId);
            
            await handleUpdateBanner(bannerItem, bannerId, this);
        });
    });
}

// ==================== 檔案處理 ====================
/**
 * 處理檔案選擇
 */
function handleFileSelect(e) {
    const file = e.target.files[0];
    if (!file) return;

    // 檢查檔案大小
    if (file.size > CONFIG.MAX_FILE_SIZE) {
        alert('檔案大小超過 16 MB，請選擇較小的檔案');
        return;
    }

    // 檢查檔案類型
    if (!file.type.startsWith('image/')) {
        alert('請選擇圖片檔案');
        return;
    }

    // 讀取並預覽圖片
    const reader = new FileReader();
    reader.onload = function(event) {
        const previewContainer = e.target.closest('.banner-preview, .banner-thumbnail');
        
        // 移除 empty class
        previewContainer.classList.remove('empty');
        
        // 找到或建立 img 標籤
        let img = previewContainer.querySelector('img');
        if (!img) {
            img = document.createElement('img');
            previewContainer.insertBefore(img, previewContainer.firstChild);
        }
        
        img.src = event.target.result;
        img.alt = file.name;
    };
    reader.readAsDataURL(file);
}

/**
 * 將檔案轉換為 Base64
 */
function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

// ==================== 資料載入 ====================
/**
 * 從後端 API 載入所有輪播圖資料
 */
async function loadAllBanners() {
    if (CONFIG.USE_MOCK) {
        return; // 使用本地資料
    }

    try {
        const authToken = localStorage.getItem('authToken');
        const headers = { 'Content-Type': 'application/json' };
        if (authToken) {
            headers['Authorization'] = `Bearer ${authToken}`;
        }
        
        const response = await fetch(CONFIG.API_BASE_URL, { headers });
        if (!response.ok) throw new Error('載入資料失敗');
        
        const apiResponse = await response.json();
        
        if (!apiResponse.success || !apiResponse.data) {
            throw new Error(apiResponse.message || '載入資料失敗');
        }

        const banners = apiResponse.data.banners || [];
        
        banners.forEach(banner => {
            if (banner.id >= 1 && banner.id <= CONFIG.MAX_BANNERS) {
                bannersData[banner.id] = {
                    id: banner.id,
                    bannerLg: banner.bannerLg,
                    bannerSm: banner.bannerSm,
                    title: banner.title,
                    imageUrl: banner.imageUrl,
                    linkUrl: banner.linkUrl,
                    sortOrder: banner.sortOrder
                };
                displayBannerData(banner.id, bannersData[banner.id]);
            }
        });
        
    } catch (error) {
        console.error('載入輪播圖資料失敗:', error);
    }
}

// ==================== 資料顯示 ====================
/**
 * 顯示輪播圖資料到對應的 banner-item
 */
function displayBannerData(bannerId, data) {
    const bannerItem = getBannerItem(bannerId);
    if (!bannerItem) return;
    
    displayImage(bannerItem, '.banner-preview', data.bannerLg, data.title);
    displayImage(bannerItem, '.banner-thumbnail', data.bannerSm, data.title);
    fillFormFields(bannerItem, data);
}

/**
 * 顯示圖片
 */
function displayImage(bannerItem, selector, imageData, title) {
    // 檢查是否有有效的圖片資料
    if (!imageData || imageData === 'null' || imageData === 'undefined') {
        // console.log(`跳過顯示 ${selector}：無圖片資料`);
        return;
    }
    
    const preview = bannerItem.querySelector(selector);
    let img = preview.querySelector('img');
    
    if (!img) {
        img = document.createElement('img');
        preview.insertBefore(img, preview.firstChild);
    }
    
    try {
        if (typeof imageData !== 'string') {
            // console.error('imageData 不是字串');
            return;
        }
        
        let imageSrc = '';
        
        // 處理不同格式的圖片資料
        if (imageData.startsWith('data:image/')) {
            // 完整的 data URI
            imageSrc = imageData;
        } else if (imageData.startsWith('http://') || imageData.startsWith('https://')) {
            // HTTP(S) URL
            imageSrc = imageData;
        } else if (imageData.startsWith('/') && imageData.indexOf('base64') === -1 && imageData.length < 500) {
            // 相對路徑（不是 Base64 且不太長）
            imageSrc = imageData;
        } else if (imageData.length > 50) {
            // 假設是純 Base64 字串（長度超過 50）
            imageSrc = 'data:image/jpeg;base64,' + imageData;
        } else {
            return;
        }
        
        if (imageSrc) {
            img.src = imageSrc;
            img.alt = title || '';
            preview.classList.remove('empty');
        }
    } catch (error) {
        console.error('顯示圖片失敗:', error);
    }
}

/**
 * 填充表單欄位
 */
function fillFormFields(bannerItem, data) {
    const titleInput = bannerItem.querySelector('input[type="text"]');
    const urlInput = bannerItem.querySelector('input[type="url"]');
    const orderInput = bannerItem.querySelector('input[type="number"]');
    
    if (titleInput && data.title) titleInput.value = data.title;
    if (urlInput && data.linkUrl) urlInput.value = data.linkUrl;
    if (orderInput && data.sortOrder) orderInput.value = data.sortOrder;
}

// ==================== 資料更新 ====================
/**
 * 處理更新輪播圖
 */
async function handleUpdateBanner(bannerItem, bannerId, button) {
    const formData = collectFormData(bannerItem, bannerId);
    
    if (formData.displayOrder && !validateOrderSelection(bannerId, formData.displayOrder)) {
        return;
    }
    
    setButtonLoading(button, true);
    
    try {
        const result = await saveBannerToBackend(bannerItem, bannerId, formData);
        
        bannersData[bannerId] = result;
        displayBannerData(bannerId, result);
        clearFileInputs(bannerItem);
        
        alert('更新成功!');
    } catch (error) {
        // console.error('更新輪播圖失敗:', error);
        alert('更新失敗: ' + error.message);
    } finally {
        setButtonLoading(button, false);
    }
}

/**
 * 收集表單資料
 */
function collectFormData(bannerItem, bannerId) {
    return {
        mainFileInput: bannerItem.querySelector('.banner-preview input[type="file"]'),
        thumbFileInput: bannerItem.querySelector('.banner-thumbnail input[type="file"]'),
        altText: bannerItem.querySelector('input[type="text"]').value.trim(),
        targetUrl: bannerItem.querySelector('input[type="url"]').value.trim(),
        displayOrder: bannerItem.querySelector('input[type="number"]').value.trim(),
        bannerId: bannerId
    };
}

/**
 * 儲存輪播圖到後端
 */
async function saveBannerToBackend(bannerItem, bannerId, formData) {
    const bannerLgBase64 = formData.mainFileInput?.files[0] 
        ? await fileToBase64(formData.mainFileInput.files[0])
        : null;
        
    const bannerSmBase64 = formData.thumbFileInput?.files[0]
        ? await fileToBase64(formData.thumbFileInput.files[0])
        : null;

    const requestBody = {
        title: formData.altText || '',
        imageUrl: '',
        linkUrl: formData.targetUrl || '',
        sortOrder: parseInt(formData.displayOrder) || 0,
        isActive: true
    };

    if (bannerLgBase64) {
        requestBody.bannerLg = bannerLgBase64;
    }
    if (bannerSmBase64) {
        requestBody.bannerSm = bannerSmBase64;
    }

    // console.log('發送更新請求 - Banner ID:', bannerId);

    const authToken = localStorage.getItem('authToken');
    const headers = { 'Content-Type': 'application/json' };
    if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
    }

    const response = await fetch(`${CONFIG.API_BASE_URL}/${bannerId}`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(requestBody)
    });

    // 先檢查狀態碼
    if (!response.ok) {
        let errorMsg = `更新失敗 (HTTP ${response.status})`;
        
        // 嘗試解析錯誤訊息
        try {
            const apiResponse = await response.json();
            errorMsg = apiResponse.message || errorMsg;
        } catch (e) {
            // JSON 解析失敗，使用預設錯誤訊息
            if (response.status === 403) {
                errorMsg = '權限不足，請確認已使用管理員帳號登入';
            }
        }
        
        throw new Error(errorMsg);
    }

    const apiResponse = await response.json();
    
    if (!apiResponse.success) {
        throw new Error(apiResponse.message || '更新失敗');
    }

    const banner = apiResponse.data;
    return {
        id: banner.id,
        bannerLg: banner.bannerLg,
        bannerSm: banner.bannerSm,
        title: banner.title,
        linkUrl: banner.linkUrl,
        sortOrder: banner.sortOrder
    };
}

// ==================== 驗證 ====================
function validateOrderSelection(currentBannerId, selectedOrder) {
    const orderNum = parseInt(selectedOrder);
    
    for (const [id, data] of Object.entries(bannersData)) {
        if (parseInt(id) !== currentBannerId && data.sortOrder === orderNum) {
            alert(`播放順序 ${orderNum} 已被使用，請選擇其他數字`);
            return false;
        }
    }
    
    return true;
}

// ==================== 輔助函數 ====================
function getBannerItem(bannerId) {
    return document.querySelector(`.banner-item[data-banner-id="${bannerId}"]`);
}

function setButtonLoading(button, isLoading) {
    button.disabled = isLoading;
    button.textContent = isLoading ? '更新中...' : '更新';
}

function clearFileInputs(bannerItem) {
    const fileInputs = bannerItem.querySelectorAll('input[type="file"]');
    fileInputs.forEach(input => input.value = '');
}