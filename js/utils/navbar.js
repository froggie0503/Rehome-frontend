// module
export function init() {
    const toggler = document.querySelector(".custom-toggler");
    const navbarCollapse = document.getElementById("navbarNav"); // 確保這是您的選單 ID
    const navbar = document.getElementById("navbar");

    if (!toggler || !navbarCollapse) return;

    let lastScrollY = window.scrollY;

    // --- A. 漢堡圖標 X 動畫與 Bootstrap 狀態同步 ---
    toggler.addEventListener("click", () => {
        toggler.classList.toggle("open");
    });

    // 監聽 Bootstrap 的收合事件，確保 X 圖標與選單狀態完全同步
    if (navbarCollapse) {
        navbarCollapse.addEventListener('shown.bs.collapse', function () {
            toggler.classList.add("open");
        });

        navbarCollapse.addEventListener('hidden.bs.collapse', function () {
            toggler.classList.remove("open");
        });
    }

    // --- B. 導航列滾動隱藏/顯示邏輯 (已加入關鍵判斷) ---
    window.addEventListener("scroll", () => {
        const currentScroll = window.scrollY;

        if (!navbarCollapse.classList.contains('show')) {
            if (currentScroll > lastScrollY && currentScroll > 80) {
                // 往下捲 → 隱藏 navbar
                navbar.classList.add("hide");

            } else {
                // 往上捲 → 出現 navbar
                navbar.classList.remove("hide");

            }
        }


        lastScrollY = currentScroll;
    });

   const backToTopBtn = document.getElementById("backToTop");
    
    // 只有當按鈕真的存在時，才去綁定事件
    if (backToTopBtn) { 
        backToTopBtn.addEventListener("click", () => {
            window.scrollTo({
                top: 0,
                behavior: "smooth"
            });
            console.log("11");
        });
    }


}


export async function refreshNavbar() {
    const token = localStorage.getItem('authToken');
    const headerContainer = $('#header-placeholder');

    //情況 A: 沒有 Token -> 載入未登入 Header
    if (!token) {
        loadGuestNavbar(headerContainer);
        return;
    }

    //情況 B: 有 Token -> 呼叫後端驗證並拿資料
    try {
        const response = await fetch('/api/mem/navinfo', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const resJson = await response.json();
            if (resJson.success) {
                console.log(resJson);
                
                // Token 有效 -> 載入登入後 Header 並填資料
                loadUserNavbar(headerContainer, resJson.data);
            } else {
                // 後端回傳失敗 (雖然 status 是 200 但業務邏輯失敗) -> 視為未登入
                handleTokenInvalid();
            }
        } else {
            // Token 過期或無效 (401/403) -> 清除 Token 並轉回未登入
            handleTokenInvalid();
        }
    } catch (error) {
        console.error("驗證使用者失敗:", error);
        // 發生網路錯誤或其他問題，保險起見也切回未登入，或顯示錯誤
        handleTokenInvalid(); // 或是 loadGuestNavbar(headerContainer);
    }
}

// --- 3. 輔助函式：載入「未登入」Header ---
function loadGuestNavbar(container) {
    container.load('fragments/header.html', function() {
        // 載入完成後，綁定登入按鈕事件 (原本 navbar.js 可能有做，這邊確保重整後也有綁定)
        init();
       
    });
}

// --- 4. 輔助函式：載入「已登入」Header 並填充資料 ---
function loadUserNavbar(container, userData) {
    container.load('fragments/header_login.html', function() {
        // ★ 重點：HTML 載入完成後，把資料塞進去
        init();
        // 1. 設定名字
        $('#user-name').text(userData.username || '親愛的會員');
        let imgSrc;
        // 2. 設定大頭照 (假設後端回傳 base64 或 url)

        if(userData.photo == null){

        }
        if (userData.photo) {
            // 判斷是 base64 還是網址
            imgSrc = userData.photo.startsWith('http') 
                ? userData.photo 
                : `data:image/jpeg;base64,${userData.photo}`;
        }else{
            imgSrc = '../assets/img/member_emptyIcon.png';
        }
        $('.login_profile img').attr('src', imgSrc);

    });
}

// --- 5. 處理 Token 無效 ---
function handleTokenInvalid() {
    console.log("Token 失效，切換回訪客模式");
    localStorage.removeItem('authToken'); // 清除髒掉的 Token
    loadGuestNavbar($('#header-placeholder'));
}


function handleLogout() {
    // 1. 清除 Token
    localStorage.removeItem('authToken');
    localStorage.removeItem('userRole');

    window.location.hash = '#home';
    refreshNavbar();
     showCustomAlert("系統提示", "您已成功登出", 1000);
    
}

$(document).on("click", "#btn_login", function (e) {
    e.preventDefault(); // 防止連結原本的跳轉行為(如果有的話)
    window.location.href = '#login';
});

$(document).on("click", "#btn_logout", function (e) {
    e.preventDefault();
    
    localStorage.removeItem('authToken');
    localStorage.removeItem('userRole');
    window.location.hash = '#home';
    location.reload(); 
});


