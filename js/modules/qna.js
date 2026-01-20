/**
 * qna.js - 常見問題頁面邏輯 (包含初始化、分類展開、搜尋功能)
 */

function initQnAPage() {
    // 1. 定義容器與元件
    const submitBtn = document.getElementById('contect-form-submit');
    const container = document.getElementById('all-question-section');
    const searchInput = document.getElementById('faq-search-input');
    const deleteBtn = document.getElementById('faq-delete-btn');
    const searchBtn = document.querySelector('.faq-search-btn'); // 搜尋按鈕(選用)

    // 定義 API 路徑
    const API_URL = 'api/qna/all';

    // 安全檢查：如果路由切換後找不到容器，則不執行
    if (!container) return;

    // 全域變數 (在此閉包內有效)，用來儲存所有問題資料供搜尋使用
    let allQnaData = [];

    // ==========================================
    // 2. 初始化：抓取資料
    // ==========================================
    fetch(API_URL)
        .then(response => {
            if (!response.ok) throw new Error('Network response was not ok');
            return response.json();
        })
        .then(data => {
            allQnaData = data.data; // 存入變數
            renderCategories(allQnaData, container); // 預設顯示分類模式
        })
        .catch(error => {
            console.error('Error loading QnA:', error);
            container.innerHTML = `<div style="text-align:center; padding:20px; color: #756B61;">
                資料載入失敗，請確認您的網路狀態。
            </div>`;
        });

    // ==========================================
    // 3. 搜尋功能邏輯
    // ==========================================

    // A. 監聽搜尋框輸入事件 (即時搜尋)
    if (searchInput) {
        searchInput.addEventListener('input', function (e) {
            const keyword = e.target.value.trim().toLowerCase();
            handleSearch(keyword);
        });
    }

    // B. 監聽刪除按鈕 (X) 點擊事件
    if (deleteBtn) {
        deleteBtn.addEventListener('click', function () {
            searchInput.value = '';     // 清空輸入框
            handleSearch('');           // 執行空字串搜尋 (即還原)
            searchInput.focus();        // 游標回到輸入框
        });
    }

    // C. (選用) 搜尋按鈕點擊事件 - 雖然 input 已經即時搜尋，但按鈕也要能運作
    if (searchBtn && searchInput) {
        searchBtn.addEventListener('click', function () {
            const keyword = searchInput.value.trim().toLowerCase();
            handleSearch(keyword);
        });
    }

    /**
     * 處理搜尋邏輯的主控台
     * @param {string} keyword - 搜尋關鍵字
     */
    function handleSearch(keyword) {
        // 1. 控制刪除按鈕顯示/隱藏
        if (deleteBtn) {
            if (keyword.length > 0) {
                deleteBtn.classList.add('show'); // 顯示 X 按鈕 (需配合您的 CSS)
            } else {
                deleteBtn.classList.remove('show');
            }
        }

        // 2. 決定渲染模式
        if (keyword.length === 0) {
            // 無關鍵字 -> 還原分類模式
            renderCategories(allQnaData, container);
        } else {
            // 有關鍵字 -> 進入搜尋結果模式
            renderSearchResults(keyword, container);
        }
    }

// ==========================================
    // 4. 核心渲染邏輯 A: 分類模式 (緞帶按鈕版)
    // ==========================================
    function renderCategories(data, container) {
        container.innerHTML = ''; // 清空容器

        if (!data || data.length === 0) {
            container.innerHTML = '<div style="text-align:center; padding:20px;">目前沒有常見問題資料。</div>';
            return;
        }

        const groupedData = data.reduce((acc, item) => {
            const type = item.questionType || item.q_type || '其他問題';
            if (!acc[type]) acc[type] = [];
            acc[type].push(item);
            return acc;
        }, {});

        for (const [category, items] of Object.entries(groupedData)) {

            const uniqueId = Math.random().toString(36).substr(2, 9);
            const accordionId = `accordion-${uniqueId}`;

            // 1. 建立 Section
            const section = document.createElement('section');
            section.className = 'faq-section';

            // 2. 建立 Header 
            const header = document.createElement('div');
            header.className = 'faq-header';

            const title = document.createElement('h3');
            title.className = 'faq-category-title';
            title.textContent = category;

            header.appendChild(title);
            section.appendChild(header);

            // 3. 建立內容區塊
            const faqBlock = document.createElement('div');
            faqBlock.className = 'faq-block';

            if (items.length > 3) {
                faqBlock.classList.add('faq-gradient-mask');
            }

            const accordion = document.createElement('div');
            accordion.className = 'accordion';
            accordion.id = accordionId;

            const hiddenGroup = document.createElement('div');
            hiddenGroup.className = 'hidden-group';

            items.forEach((item, index) => {
                const itemEl = createAccordionItem(item, accordionId);
                if (index < 3) {
                    accordion.appendChild(itemEl);
                } else {
                    hiddenGroup.appendChild(itemEl);
                }
            });

            if (items.length > 3) {
                accordion.appendChild(hiddenGroup);
            }

            faqBlock.appendChild(accordion);

            // 4. 建立下方的緞帶按鈕 (Ribbon Button)
            let bottomBtn = null;
            if (items.length > 3) {
                bottomBtn = document.createElement('button');
                bottomBtn.className = 'qna_ribbon_btn'; // 使用新的緞帶樣式 class
                bottomBtn.innerHTML = `查看更多 <i class="bi bi-chevron-double-down"></i>`;
                
                // 加在 faqBlock 的最下方
                faqBlock.appendChild(bottomBtn); 
            }

            section.appendChild(faqBlock);
            container.appendChild(section);

            // 5. 按鈕點擊邏輯 (只控制這顆緞帶按鈕)
            if (bottomBtn) {
                bottomBtn.addEventListener('click', () => {
                    // 檢查目前狀態
                    const isExpanded = bottomBtn.getAttribute('data-expanded') === 'true';
                    const newState = !isExpanded;

                    if (newState) {
                        // --- 展開動作 ---
                        hiddenGroup.classList.add('show');
                        faqBlock.classList.remove('faq-gradient-mask'); // 移除漸層
                        faqBlock.classList.add('mask-off');
                        
                        // 按鈕變更
                        bottomBtn.innerHTML = `收起 <i class="bi bi-chevron-double-up"></i>`;
                        bottomBtn.classList.add('is-expanded');
                        bottomBtn.setAttribute('data-expanded', 'true');
                    } else {
                        // --- 收合動作 ---
                        hiddenGroup.classList.remove('show');
                        faqBlock.classList.add('faq-gradient-mask'); // 加回漸層
                        faqBlock.classList.remove('mask-off');
                        
                        // 按鈕變更
                        bottomBtn.innerHTML = `查看更多 <i class="bi bi-chevron-double-down"></i>`;
                        bottomBtn.classList.remove('is-expanded');
                        bottomBtn.setAttribute('data-expanded', 'false');
                        
                        // (選用) 點收起時，畫面稍微滾動回標題，體驗較好
                        // header.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                });
            }
        }
    }

    // ==========================================
    // 5. 核心渲染邏輯 B: 搜尋結果模式 (新功能)
    // ==========================================
    function renderSearchResults(keyword, container) {
        container.innerHTML = ''; // 清空容器 (移除原本的分類區塊)

        // 過濾資料：檢查問題標題 (question) 或 答案 (answer) 是否包含關鍵字
        const filteredData = allQnaData.filter(item =>
            (item.question && item.question.toLowerCase().includes(keyword)) ||
            (item.answer && item.answer.toLowerCase().includes(keyword))
        );

        // 如果找不到結果
        if (filteredData.length === 0) {
            container.innerHTML = `
                <div style="text-align:center; padding:40px; color:#756B61; font-weight:bold;">
                    找不到關於「${keyword}」的結果，請嘗試其他關鍵字。
                </div>`;
            return;
        }

        // 建立一個單一的 "搜尋結果" Section
        const section = document.createElement('section');
        section.className = 'faq-section';

        // Header
        const header = document.createElement('div');
        header.className = 'faq-header';

        const title = document.createElement('h3');
        title.className = 'faq-category-title';
        title.textContent = `搜尋結果 (${filteredData.length} 筆)`;

        header.appendChild(title);
        section.appendChild(header);

        // 內容區塊
        const faqBlock = document.createElement('div');
        faqBlock.className = 'faq-block'; // 維持原本的背景色樣式

        const accordionId = 'accordion-search-results';
        const accordion = document.createElement('div');
        accordion.className = 'accordion';
        accordion.id = accordionId;

        // 渲染所有符合的項目 (不分頁，不隱藏)
        filteredData.forEach(item => {
            const itemEl = createAccordionItem(item, accordionId);
            accordion.appendChild(itemEl);
        });

        faqBlock.appendChild(accordion);
        section.appendChild(faqBlock);
        container.appendChild(section);
    }

    // ==========================================
    // 輔助函式：產生 Accordion Item
    // ==========================================
    function createAccordionItem(item, parentId) {
        // 使用隨機字串確保 ID 唯一，避免與原本的 DOM 衝突
        const uniqueSuffix = Math.random().toString(36).substr(2, 5);
        const itemId = `heading-${item.id}-${uniqueSuffix}`;
        const collapseId = `collapse-${item.id}-${uniqueSuffix}`;

        const div = document.createElement('div');
        div.className = 'accordion-item';

        div.innerHTML = `
            <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse"
                data-bs-target="#${collapseId}" aria-expanded="false" aria-controls="${collapseId}">
                <span class="qna_question_text">${item.question}</span>
                <span class="qna_icon">
                    <i class="bi bi-plus-lg"></i>
                </span>
            </button>
            <div id="${collapseId}" class="accordion-collapse collapse" aria-labelledby="${itemId}"
                data-bs-parent="#${parentId}">
                <div class="accordion-body">
                    <i class="bi bi-arrow-return-right"></i> ${item.answer}
                </div>
            </div>
        `;
        return div;
    }

    // ==========================================
    // 聯絡表單邏輯 (保持不變)
    // ==========================================
    const contactForm = document.getElementById('contactForm');
    // const submitBtn = document.getElementById('contect-form-submit');
    const successModal = document.getElementById('contactSuccessModal');
    const closeModalBtn = document.getElementById('closeContactModalBtn');
    const confirmEmailDisplay = document.getElementById('confirmEmailDisplay');
    const emailInput = document.getElementById('contactEmail');

    // 只有當表單存在時才綁定監聽器，避免報錯
    if (contactForm) {
        contactForm.addEventListener('submit', function (e) {
            e.preventDefault(); // 1. 阻止表單原本的跳轉

            // 2. 收集資料
            const formData = {
                // 左邊 Key 對應 Java Entity 欄位，右邊抓取 HTML 輸入框的值
                questionTypeId: document.getElementById('issueType').value,
                questionTitle: document.getElementById('issueTitle').value,
                questionInfo: document.getElementById('issueDesc').value,
                cname: document.getElementById('contactName').value,
                cmail: document.getElementById('contactEmail').value
            };

            // 3. 使用 fetch 發送請求 


            const originalBtnText = submitBtn.innerText; // 記住原本按鈕文字
            submitBtn.disabled = true; // 鎖住按鈕防止重複點擊
            submitBtn.innerText = '傳送中...'; // 改變文字，讓使用者知道正在處理
            submitBtn.style.cursor = 'wait';   // 改變滑鼠游標

fetch('/api/csf/send', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            })
                .then(response => {
                    // 步驟 1: 先檢查 HTTP 網路狀態 (例如是否為 200 OK)
                    if (!response.ok) {
                        throw new Error('Network response was not ok');
                    }
                    // 步驟 2: 解析 JSON 內容
                    return response.json(); 
                })
                .then(apiResponse => {
                    // 步驟 3: 根據你的截圖格式，檢查邏輯是否成功
                    // 你的 API 回傳格式為: { success: true, message: "...", data: true }
                    if (apiResponse.success === true) {
                        // --- 成功後的動作 ---

                        // 設定 Modal 顯示文字
                        if (confirmEmailDisplay) {
                            confirmEmailDisplay.textContent = formData.cmail;
                        }

                        // 顯示 Modal
                        if (successModal) {
                            successModal.style.display = 'flex';
                        }

                        // 清空表單
                        contactForm.reset();
                    } else {
                        // 如果 apiResponse.success 為 false，代表後端處理失敗
                        // alert(apiResponse.message || '系統忙碌中，請稍後再試 (儲存失敗)');
                        showCustomAlert("系統提示", apiResponse.message || '系統忙碌中，請稍後再試 (儲存失敗)', 1000);

                    }
                })
                .catch(error => {
                    // console.error('Error:', error);
                    showCustomAlert("系統提示", '傳送失敗，請檢查網路或聯絡管理員', 1000);

                    // alert('傳送失敗，請檢查網路或聯絡管理員');
                })
                .finally(() => {
                    // 按鈕復原 (保持不變)
                    if (submitBtn) {
                        submitBtn.disabled = false;
                        submitBtn.innerText = originalBtnText;
                        submitBtn.style.cursor = 'pointer';
                    }
                });
        });
    }



    // Modal 關閉按鈕邏輯
    if (closeModalBtn && successModal) {
        closeModalBtn.addEventListener('click', function () {
            successModal.style.display = 'none'; // 隱藏 Modal
        });
    }


}

// 執行點
initQnAPage();
window.initQnAPage = initQnAPage;