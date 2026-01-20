// missing_publish_map.js - 修正 'Map is null' 與 Local Storage 同步錯誤 + 新增預覽地圖
let map = null; // 彈窗內的地圖
let previewMap = null; // 🌟 新增：表單上的預覽地圖
let selectedMarker = null; // 彈窗內的標記
let previewMarker = null; // 🌟 新增：預覽地圖上的標記


    // 獲取所有元素
    const openMapModalBtn = document.getElementById('openMapModalBtn');
    const mapModal = document.getElementById('mapModal');
    const mapContainer = document.getElementById('map');
    const previewMapContainer = document.getElementById('previewMapContainer'); // 🌟 新增容器

    const searchInput = document.getElementById('search');
    const searchButton = document.getElementById('searchBtn');
    const confirmButton = document.getElementById('confirmMapSelect');
    const cancelButton = document.getElementById('cancelMapSelect');
    const resultDisplay = document.getElementById('rs');
    const lostLocationText = document.getElementById('lostLocationText');
    const lostLocationLat = document.getElementById('lostLocationLat');
    const lostLocationLng = document.getElementById('lostLocationLng');

    // 重新宣告避免全域污染，但保留上面的 let 以防萬一，這裡主要使用閉包內的變數
    let currentLat = null;
    let currentLng = null;
    const DEFAULT_LAT = 25.03;
    const DEFAULT_LNG = 121.55;

    // ------------------------------------------------------------------
    // 🌟 新增功能：更新表單上的小預覽地圖
    // ------------------------------------------------------------------
    function updatePreviewMap(lat, lng) {
        if (!previewMapContainer) return;

        // 顯示預覽容器
        previewMapContainer.style.display = 'block';

        // 如果預覽地圖尚未初始化
        if (!previewMap) {
            previewMap = L.map('previewMap', {
                center: [lat, lng],
                zoom: 30,
                zoomControl: true, // 小地圖通常不需要縮放控制項，保持簡潔
                dragging: false,     // 禁止拖動，避免誤觸
                scrollWheelZoom: false,
                doubleClickZoom: false
            });

            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; OpenStreetMap'
            }).addTo(previewMap);
        } else {
            // 如果已經存在，直接移動視角
            previewMap.setView([lat, lng], 15);
            previewMap.invalidateSize(); // 確保尺寸正確
        }

        // 更新小地圖上的標記
        if (previewMarker) {
            previewMarker.setLatLng([lat, lng]);
        } else {
            previewMarker = L.marker([lat, lng], {
                interactive: false // 標記不可點擊
            }).addTo(previewMap);
        }
    }

    // --- 1. 資料同步函數：頁面載入時同步 Local Storage 數據到表單 ---
    function hydrateFormFromLocalStorage() {
        const savedLat = localStorage.getItem('lostPetLat');
        const savedLng = localStorage.getItem('lostPetLng');

        if (savedLat && savedLng) {
            const lat = parseFloat(savedLat);
            const lng = parseFloat(savedLng);

            if (lostLocationLat) lostLocationLat.value = lat;
            if (lostLocationLng) lostLocationLng.value = lng;
            
            // 更新可見的文字欄位
            // if (lostLocationText) {
            //     lostLocationText.value = `已選定地標 (Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)})`;
            // }
            
            // 設置當前選定的座標 (用於地圖打開時)
            currentLat = lat;
            currentLng = lng;

            // 🌟 呼叫預覽地圖更新
            updatePreviewMap(lat, lng);
        }
    }

    // --- 輔助函數：更新彈窗內的選定位置 ---
    function updateSelectedLocation(lat, lng) {
        if (!map) return; 

        currentLat = lat;
        currentLng = lng;

        if (selectedMarker) selectedMarker.remove();

        selectedMarker = L.marker([lat, lng]).addTo(map);
        selectedMarker.bindPopup(`座標: ${lat.toFixed(6)}, ${lng.toFixed(6)}`).openPopup();

        resultDisplay.textContent = `經度: ${lng.toFixed(6)}, 緯度: ${lat.toFixed(6)}`;
    }

    // --- 地圖核心功能：初始化 (彈窗地圖) ---
    function initMap() {
        let startLat = lostLocationLat.value ? parseFloat(lostLocationLat.value) : DEFAULT_LAT;
        let startLng = lostLocationLng.value ? parseFloat(lostLocationLng.value) : DEFAULT_LNG;

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

    // --- 3. 搜尋地點功能 ---
    async function searchPlace() {
        if (!map) {
            alert("地圖尚未準備就緒，請稍候再試。");
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
            alert('搜尋服務連線失敗。');
        }
    }

    // ------------------------------------------------------------------
    // --- 頁面啟動與事件監聽器設定 ---
    // ------------------------------------------------------------------

    hydrateFormFromLocalStorage();

    // 1. 開啟彈窗按鈕
    openMapModalBtn.addEventListener('click', () => {
        mapModal.style.display = 'flex';
        setTimeout(() => {
            initMap();
            if (map) map.invalidateSize();
        }, 300);
    });

    // 2. 搜尋按鈕
    searchButton.addEventListener('click', searchPlace);
    searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            searchPlace();
        }
    });

    // 3. 取消按鈕
    cancelButton.addEventListener('click', () => {
        mapModal.style.display = 'none';
    });

    // 4. 確認選定按鈕
    confirmButton.addEventListener('click', () => {
        if (currentLat !== null && currentLng !== null) {

            // A. 儲存到 Local Storage
            localStorage.setItem('lostPetLat', currentLat);
            localStorage.setItem('lostPetLng', currentLng);

            // B. 更新表單中的欄位
            if (lostLocationLat) lostLocationLat.value = currentLat;
            if (lostLocationLng) lostLocationLng.value = currentLng;

            // C. 更新顯示欄位的文字
            if (lostLocationText) {
                lostLocationText.value = `您的地標 (Lng: ${currentLng.toFixed(4)}, Lat: ${currentLat.toFixed(4)})`;
            }

            // 🌟 D. 更新表單上的預覽小地圖
            updatePreviewMap(currentLat, currentLng);

            // E. 關閉彈窗
            mapModal.style.display = 'none';

        } else {
            alert('請在地圖上點擊或搜尋來選擇一個地標。');
        }
    });
