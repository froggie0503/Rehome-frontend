import { logoutRedirectToLogin, fetchWithAuth } from "../utils/helper.js";
// 從 JWT Token 解析會員資料
// function parseJwt(token) {
//     try {
//         const base64Url = token.split('.')[1];
//         const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
//         const jsonPayload = decodeURIComponent(atob(base64).split('').map(function (c) {
//             return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
//         }).join(''));
//         return JSON.parse(jsonPayload);
//     } catch (error) {
//         console.error('JWT 解析錯誤:', error);
//         return null;
//     }
// }

// 從 JWT Token 解析會員資料（安全版）12/17修改
function parseJwt(token) {

    // ① 第一層防呆：token 必須存在
    if (!token || typeof token !== 'string') {
        console.warn('parseJwt：token 不存在或不是字串', token);
        return null;
    }

    // ② 第二層防呆：JWT 結構必須正確
    const parts = token.split('.');
    if (parts.length !== 3) {
        console.warn('parseJwt：JWT 格式錯誤', token);
        return null;
    }

    try {
        const base64Url = parts[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');

        const jsonPayload = decodeURIComponent(
            atob(base64)
                .split('')
                .map(c =>
                    '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
                )
                .join('')
        );

        return JSON.parse(jsonPayload);

    } catch (error) {
        console.error('JWT 解析錯誤:', error);
        return null;
    }
}

// 取得當前會員ID
function getCurrentMemberId() {
    const token = localStorage.getItem('authToken');
    if (!token) {
        // alert('尚未登入，請先登入會員');
        showCustomAlert("系統提示","尚未登入，請先登入會員",2000);
        window.location.href = '#login';
        return null;
    } 
    
    const payload = parseJwt(token);
    console.log(payload);
    
    return payload ? payload.sub : null;
}

/*------------------------------------------------------------
  會員頭像
------------------------------------------------------------*/
// 將 byte array 轉換成 Base64
function arrayBufferToBase64(buffer) {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}

// 載入會員頭像
async function loadMemAvatar() {
    try {
        const memberId = getCurrentMemberId();
        if (!memberId) return;

        // 加上時間戳記，避免瀏覽器快取
        const timestamp = new Date().getTime();
        const response = await fetch(`/api/mem/avatar?memberId=${memberId}&t=${timestamp}`);

        if (response.ok) {
            const result = await response.json();
            console.log('API 回傳完整資料:', result);
            console.log('avatar 資料型態:', typeof result.data?.avatar);
            console.log('avatar 是否為陣列:', Array.isArray(result.data?.avatar));
            console.log('avatar 長度:', result.data?.avatar?.length);
            
            if(result.success && result.data) {
                const memberAvatarImg = document.getElementById('memberAvatar');
                const nicknameElement = document.getElementById('nickname');
                
                // 如果有頭像資料
                if (result.data.avatar && result.data.avatar.length > 0) {
                    try {
                        // 檢查 avatar 是字串還是陣列
                        let base64String;
                        
                        if (typeof result.data.avatar === 'string') {
                            // 如果後端已經是 Base64 字串
                            base64String = result.data.avatar;
                            console.log('avatar 是字串，直接使用');
                        } else if (Array.isArray(result.data.avatar)) {
                            // 如果是 byte 陣列，轉換成 Base64
                            base64String = arrayBufferToBase64(result.data.avatar);
                            console.log('avatar 是陣列，已轉換成 Base64');
                        } else {
                            console.error('未知的 avatar 資料格式');
                            return;
                        }
                        
                        if (memberAvatarImg && base64String) {
                            // 如果 Base64 字串已經包含 data:image 前綴，直接使用
                            if (base64String.startsWith('data:image')) {
                                memberAvatarImg.src = base64String;
                            } else {
                                memberAvatarImg.src = `data:image/jpeg;base64,${base64String}`;
                            }
                            console.log('頭像載入成功');
                        }
                    } catch (err) {
                        console.error('Base64 轉換錯誤:', err);
                    }
                } else {
                    console.log('頭像資料為空，使用預設頭像');
                }
                
                // 同時更新暱稱
                if (result.data.nickName && nicknameElement) {
                    nicknameElement.textContent = result.data.nickName;
                    console.log('會員暱稱:', result.data.nickName);
                }
            } else {
                console.log('使用預設頭像');
            }
        } else {
            console.log('載入頭像失敗，使用預設頭像');
        }
    } catch (error) {
        console.error('載入頭像時發生錯誤:', error);
    }
}

// 上傳頭像
async function uploadAvatar(base64Data) {
    try {
        const memberId = getCurrentMemberId();
        if (!memberId) return;

        const response = await fetch('/api/mem/avatar', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                avatar: base64Data,
                memberId: memberId
            }),
            credentials: 'include'
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
            throw new Error(result.message || '上傳失敗');
        }

        console.log('上傳成功:', result);
        // alert('頭像上傳成功！');
        showCustomAlert("系統提示","頭像上傳成功！",2000);
        
        // 重新載入頭像
        loadMemAvatar();

    } catch (error) {
        console.error('上傳錯誤:', error);
        // alert('頭像上傳失敗：' + error.message);
        showCustomAlert("系統提示","頭像上傳失敗：" + error.message,2000);
    }
}

// 初始化頭像
function initAvatarUpload() {
    const avatarContainer = document.querySelector('.avatar-container');
    const avatarInput = document.getElementById('avatarInput');
    const memberAvatar = document.getElementById('memberAvatar');

    if (!avatarContainer || !avatarInput) {
        console.log('頭像尚未載入');
        return;
    }

    // 點擊頭像選擇檔案
    avatarContainer.addEventListener('click', function () {
        avatarInput.click();
    });

    // 選擇檔案後預覽並上傳
    avatarInput.addEventListener('change', function (e) {
        const file = e.target.files[0];

        if (!file) return;

        // 檢查檔案類型
        if (!file.type.startsWith('image/')) {
            // alert('請選擇圖片檔案！');
            showCustomAlert("系統提示","請選擇圖片檔案！",2000);
            return;
        }

        // 檢查檔案大小（2MB）
        if (file.size > 2 * 1024 * 1024) {
            // alert('圖片大小不能超過 2MB！');
            showCustomAlert("系統提示","圖片大小不能超過 2MB！",2000);
            return;
        }

        // 預覽頭像
        const reader = new FileReader();
        reader.onload = function (e) {
            memberAvatar.src = e.target.result;  // 顯示預覽
            uploadAvatar(e.target.result);  // 上傳 Base64 字串
        };
        reader.readAsDataURL(file);
    });
}
/*------------------------------------------------------------
  載入會員暱稱
------------------------------------------------------------*/
// 載入會員暱稱到側邊欄
window.loadMemberNickname = async function () {
    try {
        const memberId = getCurrentMemberId();
        if (!memberId) return;

        const response = await fetch(`/api/mem/profile?memberId=${memberId}`);
        const result = await response.json();

        if (result.success) {
            const data = result.data;
            const nickname = data.nickName || data.name; // 如果沒有暱稱就使用姓名
            document.getElementById('nickname').textContent = nickname;
            console.log('暱稱載入成功:', nickname);
        } else {
            console.error('載入暱稱失敗:', result.message);
        }

    } catch (error) {
        console.error('載入暱稱時發生錯誤:', error);
    }
}

/*------------------------------------------------------------
  初始化頁面
------------------------------------------------------------*/
// 初始化頁面
export function init() {

        const API_TOKEN_KEY = 'authToken';
        const token = localStorage.getItem(API_TOKEN_KEY);

        // 檢查 token 是否 "不存在" (null) 或 "為空字串" ("")
        if (!token) {
            // 這裡填寫你要導向的登入頁面路徑，例如 login.html
            window.location.href = "#login";
            // 導向後停止後續初始化，避免未登入時繼續執行造成閃爍或解析錯誤
            return;
        }

        const routeMap = {
        'account': 'account.html',
        'lostpublish': 'publicationStatus.html',
        'adoptcollect': 'adoptCollect.html',
        'lostcollect': 'lostCollection.html',
        'adoptionreview': 'adoptionReview.html',
        'toadopt': 'submittedAdoptionApplication.html',
        'adoptionpublish': 'adoptionAnnoun.html'
    };
    // 載入會員暱稱
    window.loadMemberNickname();

    // 載入會員頭像
    loadMemAvatar();

    // 初始化頭像上傳功能
    initAvatarUpload();

    // 路由


    function getPageFromHash() {
        const hash = window.location.hash; // 例如 "#member?page=missingpublish"
        const parts = hash.split('?'); // 切割成 ["#member", "page=missingpublish"]

        if (parts.length > 1) {
            const params = new URLSearchParams(parts[1]);
            return params.get('page'); // 回傳 "missingpublish"
        }
        return null;
    }

    function loadPageContent(fileName) {
        // 1. 處理側邊欄 Active 狀態
        $(".sidebarhref").removeClass("active");
        $(`.sidebarhref[data-file='${fileName}']`).addClass("active");

        // 2. 載入 HTML，並在完成後執行對應的初始化
        $("#memcontent").load("../../content/memcentercontent/" + fileName, function (response, status, xhr) {

            // 錯誤處理：如果 HTML 找不到或載入失敗
            if (status == "error") {
                console.error("頁面載入失敗: " + xhr.status + " " + xhr.statusText);
                $("#memcontent").html("<p>載入失敗，請稍後再試。</p>");
                return;
            }

            console.log(`頁面 ${fileName} HTML 載入完成，準備執行 JS 初始化...`);

            // ★★★ 重點修改：根據檔名，呼叫對應的初始化函式 ★★★
            switch (fileName) {
                case 'account.html':
                    // 確保函式存在才呼叫，避免報錯
                    if (typeof window.initAccountPage === 'function') {
                        window.initAccountPage();
                    }
                    break;

                case 'publicationStatus.html': // 對應 publicationCard.js
                    if (typeof window.initPublicationStatus === 'function') {
                        window.initPublicationStatus();
                    }
                    break;

                case 'adoptCollect.html':      // 對應 memfavor.js (領養)
                    if (typeof window.initAdoptCollect === 'function') {
                        window.initAdoptCollect();
                    }
                    break;

                case 'lostCollection.html':    // 對應 memfavor.js (走失)
                    if (typeof window.initAdoptCollect === 'function') {
                        window.initAdoptCollect();
                    }
                    break;

                case 'adoptionReview.html':
                    // 如果你有寫對應的 init 函式，就在這裡加
                    // if (typeof window.initAdoptionReview === 'function') window.initAdoptionReview();
                    break;
                case 'submittedAdoptionApplication.html': 
                    if (typeof window.initSubmittedAdoption === 'function') {
                        window.initSubmittedAdoption();
                    }
                    break;



                // ... 其他頁面依此類推
            }
        });

        // 3. 反查：更新 URL Hash (這段保持原本邏輯)
        const routeName = Object.keys(routeMap).find(key => routeMap[key] === fileName) || fileName.replace('.html', '');
        const newHash = `#member?page=${routeName}`;

        if (window.location.hash !== newHash) {
            history.pushState(null, null, newHash);
        }
    }
    // --- 修改：初始化時決定要載入哪一頁 ---
    // 1. 取得網址上的 page 參數名稱
    const pageName = getPageFromHash();

    // 2. 決定要開哪個檔案 (如果有對照到就用對照的，沒有就預設 account.html)
    let initialFile = 'account.html';

    if (pageName && routeMap[pageName]) {
        initialFile = routeMap[pageName];
    }

    // 3. 執行載入
    loadPageContent(initialFile);


    // 點擊側邊選單
    $(".sidebarhref").on("click", function (e) {
        e.preventDefault();
        const file = $(this).data("file");
        if (file) {
            loadPageContent(file); // 改用上面定義的函式
        }

        // 處理手機版收合邏輯 (原本的程式碼)
        if ($(window).width() < 1300) {
            $("#sidebar").addClass("closed");
            updateSidebarIcon(); // 如果您有這個函式請保留
        }
    });

    const $sidebar = $("#sidebar");
    const $toggleBtn = $("#toggleSidebarBtn");
    const $icon = $toggleBtn.find("i"); // 取得 icon 元素

    // --- 新增：統一更新 Icon 的函式 ---
    function updateSidebarIcon() {
        if ($sidebar.hasClass("closed")) {
            // 如果是關閉狀態 -> 顯示漢堡圖示 (bi-list)
            $icon.removeClass("bi-layout-sidebar").addClass("bi-list");
        } else {
            // 如果是展開狀態 -> 顯示側邊欄圖示 (bi-layout-sidebar)
            $icon.removeClass("bi-list").addClass("bi-layout-sidebar");
        }
    }
    // ------------------------------------

    // 1. 初始化檢查螢幕寬度
    function checkWidth() {
        if ($(window).width() < 1300) {
            $sidebar.addClass("closed");
        } else {
            $sidebar.removeClass("closed");
        }
        // ★ 初始化時就更新一次 icon
        updateSidebarIcon();
    }

    checkWidth();

    // 2. 收合按鈕點擊事件
    $toggleBtn.on("click", function () {
        $sidebar.toggleClass("closed");
        // ★ 切換後更新 icon
        updateSidebarIcon();
    });

    // 3. 點擊側邊選單項目
    $(".sidebarhref, #logoutBtn").on("click", function (e) {
        if ($(window).width() < 1700) {
            $sidebar.addClass("closed");
            // ★ 自動收合後更新 icon
            updateSidebarIcon();
        }
    });

    // 4. 點擊內容區域關閉側邊欄
    $("#memcontent").on("click", function () {
        if ($(window).width() < 1700 && !$sidebar.hasClass("closed")) {
            $sidebar.addClass("closed");
            // ★ 自動收合後更新 icon
            updateSidebarIcon();
        }
    });

    // 登出按鈕
    $("#logoutBtn").on("click", async function () {

        try {
            const response = await fetchWithAuth('/api/mem/logout', {
                method: "POST"
            });
            const data = await response.json();

            if (data.success) {
                logoutRedirectToLogin();
            }

        } catch (error) {
            console.error('Failed to load profile:', error);
        }
    })

    //   $("#memcontent").load("../../content/memcentercontent/account.html");
}
