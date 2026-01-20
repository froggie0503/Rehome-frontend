/**
 * missing_publish_1_main.js
 * 整合：
 * 1. missing_publish_1.js (表單邏輯、圖片還原)
 * 2. missing_publish_map.js (地圖選擇、搜尋)
 * 3. photo_cut.js (圖片裁切、上傳)
 */

// ============================================================
// 1. 全域變數定義 (Global Variables)
// ============================================================


(function () {
    // --- 地圖相關 (Map) ---
    let map = null; // 彈窗內的大地圖
    let previewMap = null; // 表單上的預覽小地圖
    let selectedMarker = null; // 彈窗內的標記
    let previewMarker = null; // 預覽地圖上的標記
    let currentLat = null; // 當前選定的緯度
    let currentLng = null; // 當前選定的經度
    const DEFAULT_LAT = 25.03;
    const DEFAULT_LNG = 121.55;

    // --- 圖片裁切相關 (Cropper) ---
    let cropper = null;
    let imageToCrop = null;
    let cropperModal = null;
    let modalFileInput = null;

    // 選項
    let allRegionsData = [];


    // ============================================================
    // 2. 地圖功能模組 (Map Functions)
    // ============================================================

    // 預覽地圖
    function updatePreviewMap(lat, lng) {

        if (typeof L === 'undefined') {
            console.warn("Leaflet (L) 尚未載入，稍後再試。");
            setTimeout(() => updatePreviewMap(lat, lng), 500);
            return;
        }
        const previewMapContainer = document.getElementById('previewMapContainer');
        if (!previewMapContainer) return;

        previewMapContainer.style.display = 'block';

        if (!previewMap) {
            previewMap = L.map('previewMap', {
                center: [lat, lng],
                zoom: 15,
                zoomControl: false,
                dragging: false,
                scrollWheelZoom: false,
                doubleClickZoom: false
            });

            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; OpenStreetMap'
            }).addTo(previewMap);
        } else {
            previewMap.setView([lat, lng], 15);
            previewMap.invalidateSize();
        }

        // 更新標記
        if (previewMarker) {
            previewMarker.setLatLng([lat, lng]);
        } else {
            previewMarker = L.marker([lat, lng], {
                interactive: false
            }).addTo(previewMap);
        }
    }

    // 同步 Local Storage 數據到地圖欄位
    function hydrateFormFromLocalStorage() {
        const savedLat = localStorage.getItem('lostPetLat');
        const savedLng = localStorage.getItem('lostPetLng');

        const lostLocationLat = document.getElementById('lostLocationLat');
        const lostLocationLng = document.getElementById('lostLocationLng');
        const lostLocationText = document.getElementById('lostLocationText');

        if (savedLat && savedLng) {
            const lat = parseFloat(savedLat);
            const lng = parseFloat(savedLng);

            if (lostLocationLat) lostLocationLat.value = lat;
            if (lostLocationLng) lostLocationLng.value = lng;

            // 設置當前選定的座標
            currentLat = lat;
            currentLng = lng;

            // 更新可見文字 (選填)
            if (lostLocationText) {
                lostLocationText.value = `您的地標 (Lng: ${lng.toFixed(4)}, Lat: ${lat.toFixed(4)})`;
            }

            // 預覽地圖更新
            updatePreviewMap(lat, lng);
        }
    }

    // 更新彈窗內的選定位置
    function updateSelectedLocation(lat, lng) {
        if (!map) return;

        currentLat = lat;
        currentLng = lng;

        const resultDisplay = document.getElementById('rs');

        if (selectedMarker) selectedMarker.remove();

        selectedMarker = L.marker([lat, lng]).addTo(map);
        selectedMarker.bindPopup(`座標: ${lat.toFixed(6)}, ${lng.toFixed(6)}`).openPopup();

        if (resultDisplay) {
            resultDisplay.textContent = `經度: ${lng.toFixed(6)}, 緯度: ${lat.toFixed(6)}`;
        }
    }
    // 工具：單純查詢座標，回傳 {lat, lon} 或 null
    async function fetchCoordinates(query) {
        if (!query) return null;
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`;
        try {
            const res = await fetch(url);
            const data = await res.json();
            if (data.length > 0) {
                return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
            }
        } catch (error) {
            console.error('座標查詢失敗:', error);
        }
        return null;
    }
    

    // 初始化彈窗地圖
    function initMap(customLat = null, customLng = null) {

        //新增防呆
        if (typeof L === 'undefined') {
            console.error("Leaflet (L) 尚未載入，無法初始化地圖。");
            return;
        }
        const lostLocationLat = document.getElementById('lostLocationLat');
        const lostLocationLng = document.getElementById('lostLocationLng');
        const mapContainer = document.getElementById('map');

        let startLat = customLat || ((lostLocationLat && lostLocationLat.value) ? parseFloat(lostLocationLat.value) : DEFAULT_LAT);
        let startLng = customLng || ((lostLocationLng && lostLocationLng.value) ? parseFloat(lostLocationLng.value) : DEFAULT_LNG);
        
        if (map) {
            map.off();
            map.remove();
            map = null;
        }

        if (mapContainer) {
            mapContainer.innerHTML = "";
        }

        map = L.map('map').setView([startLat, startLng], 15);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap'
        }).addTo(map);

        map.on('click', e => {
            const { lat, lng } = e.latlng;
            updateSelectedLocation(lat, lng);
        });

        updateSelectedLocation(startLat, startLng);

        if (map) map.invalidateSize();
    }

    // 搜尋地點
    async function searchPlace() {
        const searchInput = document.getElementById('search');

        if (!map) {
            // alert("地圖尚未準備就緒，請稍候再試。");
            return;
        }

        const query = searchInput.value.trim();
        if (!query) return;

        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`;

        try {
            const res = await fetch(url);
            const data = await res.json();

            if (data.length > 0) {
                const { lat, lon } = data[0];
                map.setView([lat, lon], 15);
                updateSelectedLocation(parseFloat(lat), parseFloat(lon));
            } else {
                alert('找不到地點，請嘗試更精確的關鍵字。');
            }
        } catch (error) {
            console.error('搜尋服務連線失敗:', error);
            // alert('搜尋服務連線失敗。');
        }
    }


    // ============================================================
    // 3. 圖片裁切模組 (Cropper Functions)
    // ============================================================

    function initializeCropper() {
        if (cropper) {
            cropper.destroy();
        }
        // 重新抓取元素確保存在
        imageToCrop = document.getElementById('imageToCrop');

        if (imageToCrop) {
            cropper = new Cropper(imageToCrop, {
                aspectRatio: 1,
                viewMode: 1,
                autoCropArea: 0.8,
            });
        }
    }

    function handleFileSelect(fileInputInstance, targetPreviewId) {
        const file = fileInputInstance.files[0];

        // 重新抓取 Modal 元素
        imageToCrop = document.getElementById('imageToCrop');
        cropperModal = document.getElementById('cropperModal');

        if (file && imageToCrop && cropperModal) {
            const reader = new FileReader();

            reader.onload = function (e) {
                const newSrc = e.target.result;

                imageToCrop.src = newSrc;
                cropperModal.dataset.targetPreviewId = targetPreviewId;
                cropperModal.style.display = 'flex';

                imageToCrop.onload = function () {
                    initializeCropper();
                };

                if (imageToCrop.complete) {
                    initializeCropper();
                }

                fileInputInstance.value = '';
            };
            reader.readAsDataURL(file);
        }
    }

    function clearPhotoSlot(index) {
        const previewImg = document.getElementById(`previewImage_${index}`);
        const fileInput = document.getElementById(`fileInput_${index}`);
        const deleteBtn = document.getElementById(`deleteBtn_${index}`);

        const photoItem = deleteBtn ? deleteBtn.closest('.photo-upload-item') : null;

        if (previewImg) previewImg.src = '../assets/img/emptyIcon.png';
        if (fileInput) fileInput.value = '';
        if (photoItem) photoItem.classList.remove('is-filled');

        localStorage.removeItem(`croppedPetImage_${index}`);
        console.log(`照片槽位 ${index} 已清除。`);
    }


    // ============================================================
    // 4. 表單與資料還原模組 (Form & Hydration Functions)
    // ============================================================

    function toggleInput(targetId, condition) {
        const targetElement = document.getElementById(targetId);
        if (targetElement) {
            targetElement.style.display = condition ? 'block' : 'none';
        }
    }

    function updateButtonState(index, hasImage) {
        const initialBtn = document.getElementById(`initialBtn_${index}`);
        const deleteBtn = document.getElementById(`deleteBtn_${index}`);

        if (hasImage) {
            if (initialBtn) initialBtn.style.setProperty('display', 'none', 'important');
            if (deleteBtn) {
                deleteBtn.style.setProperty('display', 'block', 'important');
                deleteBtn.classList.remove('d-none');
            }
        } else {
            if (initialBtn) initialBtn.style.setProperty('display', 'block', 'important');
            if (deleteBtn) deleteBtn.style.setProperty('display', 'none', 'important');
        }
    }

    function setupImageObservers() {
        for (let i = 1; i <= 4; i++) {
            const imgElement = document.getElementById(`previewImage_${i}`);
            if (!imgElement) continue;

            const observer = new MutationObserver(function (mutations) {
                mutations.forEach(function (mutation) {
                    if (mutation.type === "attributes" && mutation.attributeName === "src") {
                        const currentSrc = imgElement.src;
                        const hasImage = currentSrc.includes("base64") || (currentSrc.includes("http") && !currentSrc.includes("emptyIcon"));
                        updateButtonState(i, hasImage);
                    }
                });
            });
            observer.observe(imgElement, { attributes: true });
        }
    }

    function hydrateImages() {
        setTimeout(() => {
            setupImageObservers();
            for (let i = 1; i <= 4; i++) {
                const savedImageKey = `croppedPetImage_${i}`;
                const savedImageData = localStorage.getItem(savedImageKey);
                const previewImage = document.getElementById(`previewImage_${i}`);

                if (savedImageData && previewImage) {
                    previewImage.src = savedImageData;
                } else {
                    updateButtonState(i, false);
                }
            }
        }, 100);
    }

    function hydrateTextData() {
        const rawData = localStorage.getItem('pendingPublishData');
        if (!rawData) return;

        const data = JSON.parse(rawData);
        console.log("正在還原表單文字資料...", data);

        const simpleFields = [
            'petName', 'petGender', 'petBreed', 'petColor', 'petFeature',
            'petEarClip', 'petType', 'petChip',
            'petTypeOther', 'petChipNumber',
            'missingDate', 'lostLocation',
            'lostLocationText', 'lostLocationLat', 'lostLocationLng',
            'missingStory', 'missingNotes',
            'contactName', 'contactPhone', 'contactEmail', 'contactOther'
        ];

        simpleFields.forEach(id => {
            const element = document.getElementById(id);
            if (element && data[id] !== undefined) {
                element.value = data[id];
            }
        });

        if (data.petType === '其他') toggleInput('petTypeOther', true);
        if (data.petChip === 'yes') toggleInput('petChipNumber', true);

        if (data.missingCity) {
            const citySelect = document.getElementById('missingCity');
            if (citySelect) {
                citySelect.value = data.missingCity;
                const event = new Event('change', { bubbles: true });
                citySelect.dispatchEvent(event);

                setTimeout(() => {
                    const districtSelect = document.querySelector('[name="missingDistrict"]');
                    if (districtSelect && data.missingDistrict) {
                        districtSelect.value = data.missingDistrict;
                    }
                }, 500);
            }
        }

        // 呼叫地圖模組的函數更新預覽
        if (data.lostLocationLat && data.lostLocationLng) {
            localStorage.setItem('lostPetLat', data.lostLocationLat);
            localStorage.setItem('lostPetLng', data.lostLocationLng);
            updatePreviewMap(parseFloat(data.lostLocationLat), parseFloat(data.lostLocationLng));
        }
    }

    function setupFormSubmit() {
        const form = document.getElementById('publishForm');
        const submitBtn = document.getElementById('submitButton');

        if (!form || !submitBtn) {
            console.error("setupFormSubmit: 找不到表單或按鈕");
            return;
        }

        // 移除舊監聽器避免重複 (因為 setupFormSubmit 可能被多次呼叫)
        const newSubmitBtn = submitBtn.cloneNode(true);
        submitBtn.parentNode.replaceChild(newSubmitBtn, submitBtn);

        newSubmitBtn.addEventListener('click', function (e) {
            e.preventDefault();
            console.log("開始收集資料...");

            // 驗證
            if (!validateFormData(form)) {
                return;
            }

            const formData = new FormData(form);
            const allData = {};

            formData.forEach((value, key) => {
                allData[key] = value;
            });

            for (let i = 1; i <= 4; i++) {
                const imageKey = `croppedPetImage_${i}`;
                const imageData = localStorage.getItem(imageKey);
                if (imageData) {
                    allData[imageKey] = imageData;
                }
            }

            try {
                const dataString = JSON.stringify(allData);
                localStorage.setItem('pendingPublishData', dataString);
                console.log("資料已儲存，準備跳轉");
                window.location.href = '#missing_publish_2';
            } catch (error) {
                console.error("資料儲存失敗:", error);
                alert("資料儲存失敗，可能是圖片過大導致 LocalStorage 容量不足。");
            }
        });
    }


    // ============================================================
    // 5. 主初始化函數 (Main Initialization)
    // 取代原本分散的 document.addEventListener('DOMContentLoaded')
    // ============================================================

    async function initMissingPublishPage() {
        console.log("Missing Publish Main JS 初始化...");


        // 1. 初始化 DOM 元素變數
        cropperModal = document.getElementById('cropperModal');
        imageToCrop = document.getElementById('imageToCrop');
        modalFileInput = document.getElementById('modalFileInput');

        await fetchAndInitOptions();

        // 2. 還原資料 (順序很重要)
        hydrateImages();
        hydrateFormFromLocalStorage();
        hydrateTextData();
        setupFormSubmit();


        // --- 綁定地圖相關監聽器 ---
        const openMapModalBtn = document.getElementById('openMapModalBtn');
        const mapModal = document.getElementById('mapModal');
        const searchButton = document.getElementById('searchBtn');
        const searchInput = document.getElementById('search');
        const confirmMapBtn = document.getElementById('confirmMapSelect');
        const cancelMapBtn = document.getElementById('cancelMapSelect');
        const lostLocationLat = document.getElementById('lostLocationLat');
        const lostLocationLng = document.getElementById('lostLocationLng');
        const lostLocationText = document.getElementById('lostLocationText');

        // if (openMapModalBtn) {
        //     openMapModalBtn.addEventListener('click', () => {
        //         if (mapModal) mapModal.style.display = 'flex';
        //         setTimeout(() => {
        //             initMap();
        //             if (map) map.invalidateSize();
        //         }, 300);
        //     });
        // }


     if (openMapModalBtn) {
            openMapModalBtn.addEventListener('click', async () => { // 加上 async
                if (mapModal) mapModal.style.display = 'flex';

                // --- 自動定位邏輯 ---
                const citySelect = document.getElementById('missingCity');
                const districtSelect = document.getElementById('missingDistrict');
                let addressText = "";

                // 組出地址字串
                if (citySelect && citySelect.selectedIndex > 0) {
                    addressText += citySelect.options[citySelect.selectedIndex].text;
                }
                if (districtSelect && districtSelect.selectedIndex > 0) {
                    addressText += districtSelect.options[districtSelect.selectedIndex].text;
                }

                // 判斷是否變更過地點
                const currentSearchValue = searchInput ? searchInput.value : "";
                const isLocationChanged = addressText && (currentSearchValue !== addressText);
                const isFirstTime = !lostLocationLat.value;
                
                // 決定是否要自動搜尋
                const shouldAutoSearch = isLocationChanged || isFirstTime;

                if (shouldAutoSearch && searchInput) {
                    searchInput.value = addressText;
                }

                // --- ★ 核心差異 ★ ---
                
                // 預設座標 (如果 API 失敗或不需要搜尋，就用 null，讓 initMap 自己去抓舊的)
                let targetLat = null;
                let targetLng = null;

                // 如果需要自動搜尋，我們先去問 API (等待結果)
                if (shouldAutoSearch) {
                    console.log("正在預先查詢座標...", addressText);
                    const coords = await fetchCoordinates(addressText);
                    
                    if (coords) {
                        targetLat = coords.lat;
                        targetLng = coords.lng;
                    }
                }

                // 等到這一步，我們已經確定好目標座標了 (targetLat/targetLng)
                // 這時候才初始化地圖，地圖一出來就在正確位置
                setTimeout(() => {
                    initMap(targetLat, targetLng); 
                    if (map) map.invalidateSize();
                }, 100); 
            });
        }

        if (searchButton) {
            searchButton.addEventListener('click', searchPlace);
        }

        if (searchInput) {
            searchInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    searchPlace();
                }
            });
        }

        if (cancelMapBtn) {
            cancelMapBtn.addEventListener('click', () => {
                if (mapModal) mapModal.style.display = 'none';
            });
        }

        if (confirmMapBtn) {
            confirmMapBtn.addEventListener('click', () => {
                if (currentLat !== null && currentLng !== null) {
                    localStorage.setItem('lostPetLat', currentLat);
                    localStorage.setItem('lostPetLng', currentLng);

                    if (lostLocationLat) lostLocationLat.value = currentLat;
                    if (lostLocationLng) lostLocationLng.value = currentLng;
                    if (lostLocationText) {
                        lostLocationText.value = `您的地標 (Lng: ${currentLng.toFixed(4)}, Lat: ${currentLat.toFixed(4)})`;
                    }

                    updatePreviewMap(currentLat, currentLng);
                    if (mapModal) mapModal.style.display = 'none';
                } else {
                    alert('請在地圖上點擊或搜尋來選擇一個地標。');
                }
            });
        }


        // --- 綁定圖片裁切相關監聽器 ---
        const confirmCropBtn = document.getElementById('confirmCrop');
        const cancelCropBtn = document.getElementById('cancelCrop');
        const selectNewImageBtn = document.getElementById('selectNewImage');
        const uploadItems = document.querySelectorAll('.photo-upload-item');

        // 遍歷所有照片上傳組件
        uploadItems.forEach((item, index) => {
            const slotIndex = index + 1;
            const fileInput = document.getElementById(`fileInput_${slotIndex}`);
            const previewImg = document.getElementById(`previewImage_${slotIndex}`);
            const deleteBtn = document.getElementById(`deleteBtn_${slotIndex}`);
            const initialBtn = document.getElementById(`initialBtn_${slotIndex}`);

            if (fileInput && previewImg) {
                if (initialBtn) {
                    initialBtn.addEventListener('click', function () {
                        fileInput.click();
                    });
                }

                fileInput.addEventListener('change', function (event) {
                    handleFileSelect(event.target, previewImg.id);
                });

                // 修正：刪除按鈕邏輯改為個別綁定 (為了相容 photo_cut.js 邏輯)
                if (deleteBtn) {
                    deleteBtn.addEventListener('click', function (e) {
                        e.preventDefault();
                        e.stopPropagation(); // 防止冒泡
                        clearPhotoSlot(slotIndex);
                    });
                }

                const trigger = item.querySelector('.placeholder-box');
                if (trigger) {
                    trigger.addEventListener('click', function () {
                        if (item.classList.contains('is-filled')) {
                            return;
                        }
                    });
                }
            }
        });

        if (selectNewImageBtn) {
            selectNewImageBtn.addEventListener('click', function () {
                if (cropper) cropper.destroy();
                cropper = null;
                if (modalFileInput) modalFileInput.click();
            });
        }

        if (modalFileInput) {
            modalFileInput.addEventListener('change', function (event) {
                const targetPreviewId = cropperModal.dataset.targetPreviewId;
                if (targetPreviewId) {
                    handleFileSelect(event.target, targetPreviewId);
                }
            });
        }

        if (confirmCropBtn) {
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

                    if (photoItem) {
                        photoItem.classList.add('is-filled');
                    }

                    try {
                        localStorage.setItem(`croppedPetImage_${index}`, croppedImageBase64);
                    } catch (e) {
                        console.error("Local Storage 儲存失敗:", e);
                    }

                    cropper.destroy();
                    cropper = null;
                    cropperModal.style.display = 'none';
                }
            });
        }

        if (cancelCropBtn) {
            cancelCropBtn.addEventListener('click', function () {
                if (cropper) cropper.destroy();
                cropper = null;
                cropperModal.style.display = 'none';
                if (modalFileInput) modalFileInput.value = '';
            });
        }

        // ============================================================
        // (新增) 綁定表單欄位連動邏輯
        // ============================================================
        const petTypeSelect = document.getElementById('petType');
        const petChipSelect = document.getElementById('petChip');

        // 1. 寵物種類 (petType) 變更監聽
        if (petTypeSelect) {
            petTypeSelect.addEventListener('change', function () {
                // 判斷是否選擇 "other"
                const isOther = this.value === '其他';

                // 呼叫原本的 toggleInput 函式
                toggleInput('petTypeOther', isOther);

                // 如果選了其他，自動聚焦到輸入框
                if (isOther) {
                    setTimeout(() => {
                        const input = document.getElementById('petTypeOther');
                        if (input) input.focus();
                    }, 100);
                }
            });
        }

        // 2. 晶片狀態 (petChip) 變更監聽
        if (petChipSelect) {
            petChipSelect.addEventListener('change', function () {
                // 判斷是否選擇 "yes"
                const hasChip = this.value === 'yes';

                // 呼叫原本的 toggleInput 函式
                toggleInput('petChipNumber', hasChip);

                // 如果選了有晶片，自動聚焦到輸入框
                if (hasChip) {
                    setTimeout(() => {
                        const input = document.getElementById('petChipNumber');
                        if (input) input.focus();
                    }, 100);
                }
            });
        }

    }

    // ============================================================
    // 動態載入
    // ============================================================

    function createOption(value, text) {
        const option = document.createElement('option');
        option.value = value;
        option.textContent = text;
        return option;
    }

    // 根據選到的縣市 ID (cityId)，渲染對應的區域
    function renderDistricts(cityId) {
        const districtSelect = document.getElementById('missingDistrict');
        if (!districtSelect) return;

        // 清空現有選項 (保留"請選擇")
        districtSelect.innerHTML = '<option value="" disabled selected>請選擇</option>';

        if (!cityId) return;

        // 篩選出該縣市的所有區域 (注意: cityId 轉為字串比較，確保型別安全)
        const matchedRegions = allRegionsData.filter(r => r.cityId == cityId);

        matchedRegions.forEach(region => {
            districtSelect.appendChild(createOption(region.id, region.name));
        });
    }

    // 主函式：打 API 並初始化下拉選單
    async function fetchAndInitOptions() {
        try {
            const res = await fetch('/api/public/options');
            if (!res.ok) throw new Error('API 請求失敗');

            const root = await res.json();
            // 你的 API 結構是 root.data 裡面包著三個陣列
            const data = root.data;

            // 1. 渲染寵物種類 (Species)
            const petTypeSelect = document.getElementById('petType');
            if (petTypeSelect && data.species) {
                petTypeSelect.innerHTML = '<option value="" disabled selected>請選擇</option>';
                data.species.forEach(sp => {
                    petTypeSelect.appendChild(createOption(sp.name, sp.name));
                });
            }

            // 2. 渲染縣市 (Cities) 並暫存區域 (Regions)
            const citySelect = document.getElementById('missingCity');
            if (citySelect && data.cities) {
                // 儲存區域資料到全域變數
                allRegionsData = data.regions || [];

                citySelect.innerHTML = '<option value="" disabled selected>請選擇</option>';
                data.cities.forEach(city => {
                    citySelect.appendChild(createOption(city.id, city.name));
                });

                // 綁定連動：當縣市改變時，執行 renderDistricts
                // 移除舊的監聽器 (如果有的話) 並加入新的
                const newCitySelect = citySelect.cloneNode(true);
                citySelect.parentNode.replaceChild(newCitySelect, citySelect);

                newCitySelect.addEventListener('change', function () {
                    renderDistricts(this.value);
                });
            }

            console.log("API 選項載入完成");
            return true;

        } catch (error) {
            console.error("載入選項失敗:", error);
            return false;
        }
    }
    // ============================================================
    // 6. 立即執行初始化 (動態載入JS)
    // ============================================================
    fetchAndInitOptions();
    initMissingPublishPage();

    /**
 * 驗證表單資料的格式與正確性
 * @param {HTMLFormElement} form - 表單元素
 * @returns {boolean} - 驗證通過回傳 true，失敗回傳 false
 */
    function validateFormData(form) {

        // 1. 取得表單資料
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());
        const coverImage = document.getElementById('previewImage_1');

        // --- A. 必填檢查 (防止 HTML required 失效或被繞過) ---
        // 這裡列出你絕對不能是空的欄位
        const requiredFields = [
            { name: 'petName', label: '寵物姓名' },
            { name: 'petGender', label: '寵物性別' },
            { name: 'petBreed', label: '寵物品種' },
            { name: 'petColor', label: '寵物毛色' },
            { name: 'petFeature', label: '寵物外觀特徵' },
            { name: 'petEarClip', label: '寵物剪耳狀態' },
            { name: 'petType', label: '寵物種類' },

            { name: 'missingDate', label: '遺失日期' },
            { name: 'missingCity', label: '縣市' },
            { name: 'missingDistrict', label: '鄉鎮區' },
            { name: 'lostLocation', label: '街道地址/地標描述' },
            { name: 'lostLocationLat', label: '經度' },
            { name: 'lostLocationLng', label: '緯度' },

            { name: 'missingStory', label: '遺失經過' }
        ];
        for (const field of requiredFields) {
            const value = data[field.name];
            // 檢查是否為 null, undefined 或 空字串 (trim() 去除前後空白)
            if (!value || value.trim() === "") {
                // alert(`請填寫「${field.label}」！此欄位不可為空。`);
                showCustomAlert("系統提示", `請填寫「${field.label}」！此欄位不可為空。`, 0);
                // 幫使用者聚焦到沒填的那個欄位
                const inputElement = form.querySelector(`[name="${field.name}"]`);
                if (inputElement) inputElement.focus();
                return false;
            }
        }

        // --- B. 條件式必填 (邏輯驗證) ---
        if (coverImage.src.includes('emptyIcon.png')) {
            showCustomAlert("系統提示", "請上傳封面圖！這將是走失案件最重要的辨識圖片。", 0);
            // alert("請上傳封面圖！這將是走失案件最重要的辨識圖片。");

            // 捲動到上傳區塊
            document.querySelector('.pet-photo-block').scrollIntoView({ behavior: 'smooth' });
            return false;
        }

        // 如果晶片選 "有"，則晶片號碼必填
        const petChipSelect = form.querySelector('#petChip'); // 抓 DOM 比較準
        if (petChipSelect.value === 'yes') {
            const chipNum = form.querySelector('#petChipNumber').value;
            if (!chipNum || chipNum.trim() === "") {
                // alert("您選擇了有晶片，請輸入晶片號碼！");
                showCustomAlert("系統提示", "您選擇了有晶片，請輸入晶片號碼！", 0);
                return false;
            }
            // 驗證晶片號碼長度 (假設資料庫只開 20)
            if (chipNum.length > 20) {
                // alert("晶片號碼過長 (最多20碼)");
                showCustomAlert("系統提示", "晶片號碼過長 (最多20碼)", 0);

                return false;
            }
        }

        // --- C. 格式驗證 (Regex) ---

        // 驗證手機號碼 (台灣格式：09xxxxxxxx 或包含連字號)
        // Regex 解釋: 09開頭，後面接8個數字
        const phonePattern = /^09\d{8}$/;
        if (data.contactPhone && !phonePattern.test(data.contactPhone.replace(/-/g, ''))) {
            // 這裡做了一個小技巧：先把使用者輸入的 "-" 拿掉再檢查
            // alert("請輸入正確的手機號碼格式 (例如 0912345678)");
             showCustomAlert("系統提示", "請輸入正確的手機號碼格式 (例如 0912345678)", 0);
            return false;
        }

        // 驗證 Email 格式
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (data.contactEmail && !emailPattern.test(data.contactEmail)) {
            // alert("Email 格式不正確！");
            showCustomAlert("系統提示", "Email 格式不正確！", 0);

            return false;
        }

        // --- D. 日期邏輯驗證 ---

        // 走失時間不能是「未來」
        if (data.missingDate) {
            const selectedDate = new Date(data.missingDate);
            const today = new Date();
            // 把時間設為 00:00:00 做純日期比較
            today.setHours(0, 0, 0, 0);

            if (selectedDate > today) {
                // alert("走失日期不能是未來！難道您是時空旅人？");
                showCustomAlert("系統提示", "走失日期不能是未來", 0);

                return false;
            }
        } else {
            // alert("請選擇遺失日期！");
            showCustomAlert("系統提示", "請選擇遺失日期！", 0);

            return false;
        }

        // --- E. 資料庫上限檢查 (再次確認，防止暴力輸入) ---
        if (data.missingStory.length > 500) {
            // alert("遺失經過字數超過上限 (500字)！");
            showCustomAlert("系統提示", "遺失經過字數超過上限 (500字)", 0);

            return false;
        }

        // 全部通過
        return true;
    }

})();