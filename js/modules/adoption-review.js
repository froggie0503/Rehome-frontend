// 審核頁面 - JavaScript 功能
// Adoption Review Page - JavaScript Functions


    
    // 區域變數
    let caseData = null;

// 主要初始化函數
export function init() {
  console.log('審核頁面 JS 載入完成');

  // ① 先從 URL 拿 caseId（只要有，就以它為準）
  const caseId = getCaseIdFromURL();
  console.log('caseId from URL =', caseId);

  if (caseId) {
    // ✅ 防止吃到上一筆舊資料
    localStorage.removeItem('currentCaseData');

    // ✅ 一律打 API 取最新
    fetchCaseDataFromAPI(caseId);
  } else {
    // ② 沒有 caseId 才用 localStorage
    loadCaseDataFromStorage();
    if (caseData) displayCaseData(caseData);
    else console.log('沒有案件ID，也沒有本地資料');
  }

  initializeButtons();
  initStampAnimation();
}


/**
 * 從 localStorage 載入案件資料
 */
function loadCaseDataFromStorage() {
    try {
        const savedCaseData = localStorage.getItem('currentCaseData');
        // console.log('讀取到的 localStorage 資料:', savedCaseData);
        
        if (savedCaseData) {
            caseData = JSON.parse(savedCaseData);
        } else {
            console.log('沒有找到 currentCaseData 在 localStorage 中');
        }
    } catch (error) {
        console.error('載入本地案件資料時發生錯誤:', error);
    }
}

/**
 * 從 URL 獲取案件ID
 */
function getCaseIdFromURL() {
    // ① 先抓 ?caseId=123
    const urlParams = new URLSearchParams(window.location.search);
    let caseId = urlParams.get('caseId');
    if (caseId) return caseId;

    // ② 再抓 #xxxx?caseId=123
    const hash = window.location.hash || '';
    const queryIndex = hash.indexOf('?');

    if (queryIndex !== -1) {
        const queryString = hash.substring(queryIndex + 1); // 只取 ? 後面
        const hashParams = new URLSearchParams(queryString);
        caseId = hashParams.get('caseId');
        if (caseId) return caseId;
    }

    return null;
}

/**
 * 從後端 API 獲取案件完整資料
 */
async function fetchCaseDataFromAPI(caseId) {
    try {
        console.log('正在獲取案件資料，案件ID:', caseId);

         const token = localStorage.getItem('token');
        if (!token) {
            alert('請先登入才能查看案件資料');
            return;
        }

        const response = await fetch(`/api/se/adoption-cases/${caseId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`   // ⭐ 關鍵
            }
        });

        if (response.status === 401) {
            alert('登入已失效，請重新登入');
            return;
        }

        if (response.status === 403) {
            alert('你沒有權限查看這個案件');
            return;
        }


        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const responseData = await response.json();
        
        if (responseData.success) {
            caseData = responseData.data;
            
            // 儲存到 localStorage
            localStorage.setItem('currentCaseData', JSON.stringify(caseData));
            
            // 顯示資料
            displayCaseData(caseData);
            
            console.log('成功獲取案件資料:', caseData);
        } else {
            throw new Error(responseData.message || '獲取案件資料失敗');
        }

    } catch (error) {
        console.error('獲取案件資料時發生錯誤:', error);
        alert('無法載入案件資料，請稍後再試');
    }
}

/**
 * 顯示案件資料到頁面
 */
function displayCaseData(data) {
    try {
        // console.log('=== 開始顯示案件資料 ===');
        // console.log('完整資料結構:', data);

        // 更新案件資訊
        console.log('步驟1: 更新案件資訊');
        updateCaseInfo(data);

        // 更新寵物資訊
        console.log('步驟2: 更新寵物資訊');
        const petInfo = data.petInfo || data;
        console.log('寵物資訊資料:', petInfo);
        updatePetInfo(petInfo);
        // 更新寵物照片
        console.log('步驟3: 更新寵物照片');
        updatePetImage(petInfo);

        console.log('✅ 案件資料顯示完成');

    } catch (error) {
        console.error('❌ 顯示案件資料時發生錯誤:', error);
    }
}

/**
 * 更新案件資訊區域
 */
function updateCaseInfo(data) {
    console.log('更新案件資訊，收到的資料:', data);
    
    // 更新案件編號
    const caseNumberElement = document.querySelector('.case-number');
    // console.log('案件編號元素:', caseNumberElement);
    // console.log('案件ID:', data.caseNumber);

    const idText = data.caseNumber;
    
    if (caseNumberElement && idText) {
        caseNumberElement.textContent = `案件編號: ${idText}`;
    } else {
        console.log('無法更新案件編號 - 元素或資料缺失');
    }
    
    // 更新審核狀態（預計完成日期）
    const caseStatusElement = document.querySelector('.case-status');
    if (caseStatusElement && data.submitDate) {
        const estimateDate = calcReviewDate(data.submitDate, 3);
        caseStatusElement.textContent = `預計審核完成日：${estimateDate}`;
    } else {
        console.log('無法更新審核日期 - 元素或提交日期缺失');
    }
}

/**
 * 計算審核到期日
 */
function calcReviewDate(submitDate, days = 3) {
    const date = new Date(submitDate);
    date.setDate(date.getDate() + days);
    return date.toISOString().split('T')[0];
}

/**
 * 更新寵物資訊區域
 */
function updatePetInfo(petInfo) {
    // console.log('開始更新寵物資訊，接收到的資料:', petInfo);
    
    const infoMappings = [
        { selector: '.pet-details-left .info-item:nth-child(1) .info-text', value: petInfo.petNickname || petInfo.name, label: '寵物名稱' },
        { selector: '.pet-details-left .info-item:nth-child(2) .info-text', value: petInfo.petType, label: '寵物種類' },
        { selector: '.pet-details-left .info-item:nth-child(3) .info-text', value: formatGender(petInfo.petGender), label: '寵物性別' },
        { selector: '.pet-details-right .info-item:nth-child(1) .info-text', value:formatAge(petInfo.petAge) , label: '寵物年齡' },
        { selector: '.pet-details-right .info-item:nth-child(2) .info-text', value: formatSize(petInfo.petSize), label: '寵物體型' },
        { selector: '.pet-details-right .info-item:nth-child(3) .info-text', value: petInfo.petBreed, label: '寵物品種' }
    ];

    infoMappings.forEach((mapping, index) => {
        const element = document.querySelector(mapping.selector);
        // console.log(`檢查元素 ${index + 1} (${mapping.label}):`, {
        //     selector: mapping.selector,
        //     element: element,
        //     value: mapping.value
        // });
        
        if (element && mapping.value) {
            element.textContent = mapping.value;
            // console.log(`✅ 已更新 ${mapping.label}: ${mapping.value}`);
        } else {
            console.log(` 無法更新 ${mapping.label}:`, {
                hasElement: !!element,
                hasValue: !!mapping.value
            });
        }
    });
}

/**
 * 更新寵物照片
 */
function updatePetImage(petInfoOrCaseData) {
    const petImageElement = document.querySelector('.pet-inf-img img');

    if(!petImageElement){
        console.log('找不到寵物圖片元素 .pet-inf-img img');
        return;
    }

    if(petInfoOrCaseData.photoBase64){
        petImageElement.src = petInfoOrCaseData.photoBase64;
        petImageElement.alt = petInfoOrCaseData.petNickname || '寵物照片';
        console.log('已使用 photoBase64 更新寵物圖片');
        return;
    }

    if(petInfoOrCaseData.photos && petInfoOrCaseData.photos.length > 0){
        const mainPhoto = petInfoOrCaseData.photos[0];
        if(mainPhoto.src){
            petImageElement.src = mainPhoto.src;
            petImageElement.alt = mainPhoto.alt || '寵物照片';
            console.log('已使用 photos 陣列更新寵物圖片');
            return;
        }
    }
    console.log('沒有可用的寵物圖片資料');
}


/**
 * 初始化按鈕功能
 */
function initializeButtons() {
    // 案件管理按鈕
    const backButton = document.querySelector('.btn-back');
    if (backButton) {
        backButton.onclick = function () {
            goToCaseManagement();
        };
    }

    // 回到首頁按鈕
    const homeButton = document.querySelector('.btn-home');
    if (homeButton) {
        homeButton.onclick = function () {
            goToHomePage();
        };
    }
}

/**
 * 導向案件管理頁面
 */
function goToCaseManagement() {
    // 導向案件管理頁面
    window.location.hash = '#case-management';
    // 或使用: window.location.href = '../admin/pages/case-management.html';
}

/**
 * 導向首頁
 */
function goToHomePage() {
    // 導向首頁
    window.location.hash = '#home';
    // 或使用: window.location.href = '../index.html';
}

// 格式化函數
function formatGender(gender) {
    const genderMap = {
        'male': '男',
        'female': '女'
    };
    return genderMap[gender] || gender || '未指定';
}

function formatAge(age) {
    const ageMap = {
        'child': '幼年',
        'adult': '成年',
        'old': '老年'
    };
    return ageMap[age] || age || '未指定';
}

function formatSize(size) {
    const sizeMap = {
        'small': '小型',
        'medium': '中型',
        'big': '大型'
    };
    return sizeMap[size] || size || '未指定';
}
// 印章移動動畫
function initStampAnimation() {
    const stampIcon = document.querySelector('.search-icon');
    const checkIcon = document.querySelector('.check-icon'); // 先保留，如果之後要用

    if (!stampIcon) {
        console.log('找不到 .search-icon 元素');
        return;
    }

    // 圓心位置（百分比，依你的容器大小）
    const centerTop = 50;   // 圓心在容器中間
    const centerLeft = 50;

    const radius = 12;      // 圓的半徑：12px = 小圓
    let angle = 0;          // 起始角度
    const speed = 0.02;     // 旋轉速度（越小越慢，0.02 是慢慢轉）

    function animateCircle() {
        const offsetX = Math.cos(angle) * radius;
        const offsetY = Math.sin(angle) * radius;

        // 不要補間，會比較順
        stampIcon.style.transition = 'none';
        stampIcon.style.top = `calc(${centerTop}% + ${offsetY}px)`;
        stampIcon.style.left = `calc(${centerLeft}% + ${offsetX}px)`;
        // 如果不想轉放大鏡本身，可以註解這一行
        stampIcon.style.transform = `rotate(${angle * 57.3}deg)`; 

        angle += speed;
        requestAnimationFrame(animateCircle);
    }

    animateCircle();
}


// 立即初始化
// initAdoptionReviewPage();


// // 手動輸入 caseId 並載入資料

// document.getElementById('load-case-btn').addEventListener('click', async () => {
//     const caseId = document.getElementById('case-id-input').value.trim();

//     if (!caseId) {
//         alert('請輸入案件ID');
//         return;
//     }

//     console.log('✅ 手動輸入 caseId =', caseId);

//     try {
//         const response = await fetch(`/api/se/adoption-cases/${caseId}`);

//         console.log('✅ HTTP Status:', response.status);

//         const result = await response.json();
//         console.log('✅ API 回傳資料:', result);

//         if (result.success) {
//             displayCaseData(result.data); // 這一行會直接決定「畫面顯不顯示」
//         } else {
//             alert(result.message);
//         }

//     } catch (err) {
//         console.error('❌ 取得案件失敗:', err);
//         alert('連線失敗');
//     }
// });

// 將需要的函數暴露到全域
// window.initAdoptionReviewPage = initAdoptionReviewPage;
window.fetchCaseDataFromAPI = fetchCaseDataFromAPI;
window.goToCaseManagement = goToCaseManagement;
window.goToHomePage = goToHomePage;
