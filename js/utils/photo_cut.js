/* photo_cut.js - 修正按鈕切換與多重上傳邏輯 */

// 全域變數定義
let cropper = null;
const modalFileInput = document.getElementById('modalFileInput');
const imageToCrop = document.getElementById('imageToCrop');
const cropperModal = document.getElementById('cropperModal');
const confirmCropBtn = document.getElementById('confirmCrop');
const cancelCropBtn = document.getElementById('cancelCrop');
const selectNewImageBtn = document.getElementById('selectNewImage');

// --- 核心函數：初始化 Cropper 實例 ---
function initializeCropper() {
    if (cropper) {
        cropper.destroy();
    }
    cropper = new Cropper(imageToCrop, {
        aspectRatio: 1, 
        viewMode: 1,    
        autoCropArea: 0.8,
    });
}

// --- 核心函數：處理檔案讀取和 Cropper 啟動 ---
function handleFileSelect(fileInputInstance, targetPreviewId) {
    const file = fileInputInstance.files[0];
    if (file) {
        const reader = new FileReader();

        reader.onload = function (e) {
            const newSrc = e.target.result;

            imageToCrop.src = newSrc;
            cropperModal.dataset.targetPreviewId = targetPreviewId;
            cropperModal.style.display = 'flex';

            imageToCrop.onload = function () {
                initializeCropper();
            };

            // 處理快取
            if (imageToCrop.complete) {
                initializeCropper();
            }

            fileInputInstance.value = '';
        };
        reader.readAsDataURL(file);
    }
}

// --- 核心函數：清除照片槽位狀態 ---
function clearPhotoSlot(index) {
    const previewImg = document.getElementById(`previewImage_${index}`);
    const fileInput = document.getElementById(`fileInput_${index}`);
    const deleteBtn = document.getElementById(`deleteBtn_${index}`);
    
    // 獲取父元素以便移除狀態類別
    const photoItem = deleteBtn ? deleteBtn.closest('.photo-upload-item') : null;

    // 1. 清除預覽圖片 (回到預設圖)
    if (previewImg) {
        previewImg.src = '../assets/img/emptyIcon.png'; 
    }

    // 2. 清空檔案輸入框的值
    if (fileInput) {
        fileInput.value = '';
    }

    // 3. 【狀態切換】移除 is-filled 類別 (顯示「選擇照片」按鈕)
    if (photoItem) {
        photoItem.classList.remove('is-filled');
    }

    // 4. 清除 Local Storage 數據
    localStorage.removeItem(`croppedPetImage_${index}`);
    console.log(`照片槽位 ${index} 已清除。`);
}


document.addEventListener('DOMContentLoaded', function () {
    // 檢查全域必要元素
    if (!cropperModal || !imageToCrop || !confirmCropBtn || !cancelCropBtn || !modalFileInput) {
        console.error("CropperJS: Necessary Modal elements not found.");
        return;
    }

    // --- 1. 遍歷所有照片上傳組件並設定監聽器 ---
    const uploadItems = document.querySelectorAll('.photo-upload-item');
    uploadItems.forEach((item, index) => {
        const slotIndex = index + 1;
        // 獲取所有按鈕/輸入框
        const fileInput = document.getElementById(`fileInput_${slotIndex}`);
        const previewImg = document.getElementById(`previewImage_${slotIndex}`);
        const deleteBtn = document.getElementById(`deleteBtn_${slotIndex}`);
        const initialBtn = document.getElementById(`initialBtn_${slotIndex}`); // 新增的初始按鈕

        if (fileInput && previewImg) {
            
            // A. 點擊「選擇照片」按鈕時，觸發檔案選擇
            if (initialBtn) {
                 initialBtn.addEventListener('click', function() {
                    fileInput.click();
                });
            }

            // B. 監聽該槽位檔案輸入框的 change 事件
            fileInput.addEventListener('change', function (event) {
                handleFileSelect(event.target, previewImg.id); 
            });

            // C. 設定刪除按鈕監聽器
            if (deleteBtn) {
                deleteBtn.addEventListener('click', function () {
                    clearPhotoSlot(slotIndex);
                });
            }
            
            // D. 點擊 previewImg (placeholder-box) 時，如果已上傳，則不觸發 fileInput
            const trigger = item.querySelector('.placeholder-box');
            if(trigger) {
                trigger.addEventListener('click', function() {
                    // 如果已上傳，則點擊 preview area 不會觸發選擇器
                    if (item.classList.contains('is-filled')) {
                        return; 
                    }
                    // 如果是初始狀態，則 initialBtn 會處理點擊，這裡可以避免重複觸發
                });
            }
        }
    });
    
    // --- 2. 監聽彈窗內部的「選擇圖片」按鈕 (selectNewImageBtn) ---
    selectNewImageBtn.addEventListener('click', function () {
        if (cropper) cropper.destroy();
        cropper = null;
        
        // 觸發 modalFileInput
        modalFileInput.click();
    });

    // --- 3. 監聽彈窗檔案輸入框的 change 事件 ---
    modalFileInput.addEventListener('change', function (event) {
        const targetPreviewId = cropperModal.dataset.targetPreviewId;

        if (targetPreviewId) {
            handleFileSelect(event.target, targetPreviewId);
        } else {
            console.error("Target Preview ID is missing for modalFileInput.");
        }
    });

    // --- 4. 處理「確認」按鈕 (新增狀態切換) ---
    confirmCropBtn.addEventListener('click', function () {
        const targetPreviewId = cropperModal.dataset.targetPreviewId;
        const index = targetPreviewId ? targetPreviewId.split('_').pop() : null;

        if (cropper && targetPreviewId && index) {
            const croppedImageBase64 = cropper.getCroppedCanvas({
                width: 600, height: 600,
            }).toDataURL('image/jpeg');

            const targetPreview = document.getElementById(targetPreviewId);
            const photoItem = targetPreview ? targetPreview.closest('.photo-upload-item') : null;

            if (targetPreview) {
                targetPreview.src = croppedImageBase64;
            }
            
            // 【狀態切換】成功後添加 is-filled 類
            if (photoItem) {
                photoItem.classList.add('is-filled'); 
               
                
            }

            // 儲存 Local Storage
            try {
                localStorage.setItem(`croppedPetImage_${index}`, croppedImageBase64);
                 console.log("添加Local Storage "+`croppedPetImage_${index}`);
            } catch (e) {
                console.error("Local Storage 儲存失敗:", e);
            }

            // 關閉
            cropper.destroy();
            cropper = null;
            cropperModal.style.display = 'none';
        } else {
            console.error("Cropper 實例未準備好或目標 ID 遺失。");
        }
    });

    // --- 5. 處理「取消」按鈕 ---
    cancelCropBtn.addEventListener('click', function () {
        if (cropper) cropper.destroy();
        cropper = null;
        cropperModal.style.display = 'none';
        modalFileInput.value = ''; 
    });
});