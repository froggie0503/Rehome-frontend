// function minimizeChat(event) {
//         if (event) event.stopPropagation();

//         if (!chatContainer.classList.contains("minimized")) {
//           chatContainer.classList.add("minimized");
//           listChevron.classList.remove("fa-chevron-down");
//           listChevron.classList.add("fa-chevron-up");

//           listDiv.style.display = "flex";
//           singleDiv.style.display = "none";
//         }
//       }

//       // -------------------------
//       // 展開 / 縮小
//       // -------------------------
// function toggleChatWindow(event) {
//     if (event) event.stopPropagation();

//     if (chatContainer.classList.contains("minimized")) {
//         chatContainer.classList.remove("minimized");
//         listChevron.classList.remove("fa-chevron-up");
//         listChevron.classList.add("fa-chevron-down");
//         listDiv.style.display = "flex";
//     } else {
//         minimizeChat();
//     }
// }

//     const chatContainer = document.getElementById("chat-container");
//     const listDiv = document.getElementById("conversation-list-view");
//     const singleDiv = document.getElementById("single-chat-view");
//     const listChevron = document.getElementById("list-chevron");

//     // -------------------------
//     // 最小化 (縮小為一條槓)
//     // -------------------------
//     function minimizeChat(event) {
//         if (event) event.stopPropagation();

//         // 1. 確保容器加上 minimized class 來觸發 CSS 縮小樣式
//         if (!chatContainer.classList.contains("minimized")) {
//             chatContainer.classList.add("minimized");
//         }
        
//         // 2. 切換圖標為向上箭頭 (表示現在是收合狀態，點擊會展開)
//         listChevron.classList.remove("fa-chevron-down");
//         listChevron.classList.add("fa-chevron-up");

//         // 3. 確保顯示列表視圖 (因為標頭在列表視圖中)，隱藏單一聊天視圖
//         listDiv.style.display = "flex";
//         singleDiv.style.display = "none";
//     }
//     window.minimizeChat = minimizeChat; // 確保這個函數可以被外部（例如單一聊天視圖的標頭）呼叫

//     // -------------------------
//     // 展開 / 縮小
//     // -------------------------
//     function toggleChatWindow(event) {
//         if (event) event.stopPropagation();

//         if (chatContainer.classList.contains("minimized")) {
//             // 狀態：最小化 -> 展開
//             chatContainer.classList.remove("minimized");
//             listChevron.classList.remove("fa-chevron-up");
//             listChevron.classList.add("fa-chevron-down");
//             listDiv.style.display = "flex"; // 展開後預設顯示列表
//         } else {
//             // 狀態：展開 -> 最小化 (呼叫最小化函數)
//             minimizeChat();
//         }
//     }
//     window.toggleChatWindow = toggleChatWindow; // 確保這個函數可以被 HTML 呼叫
    
//     // ... (您的其他函數 goBack, createMessageHtml, sendMessage 等保持不變) ...


//     // -----------------------------------
//     // window.onload 確保初始最小化
//     // ------------------------------------
//     window.onload = function () {
//         minimizeChat(); // ⭐ 確保初始狀態是最小化 (只剩下一條槓)

//         const dataJson = { /* ... */ };
//         // ... (您的列表生成邏輯保持不變) ...
// }
    
//     script>
//       // -----------------------------------
//       // 輔助函數
//       // -----------------------------------
//       function gettime() {
//         const now = new Date();
//         const hours = String(now.getHours()).padStart(2, '0');
//         const minutes = String(now.getMinutes()).padStart(2, '0');
//         return `${hours}:${minutes}`;
//       }
      
//       // -----------------------------------
//       // ⭐ 核心函數：發送訊息
//       // -----------------------------------
//       function sendMessage() {
//         const msgBox = document.getElementById("messages");
//         const input = document.getElementById("message-input");
//         const text = input.value.trim();
//         if (!text) return;

//         // 客服發送訊息，isSent 應為 true
//         msgBox.innerHTML += createMessageHtml(text, false, gettime());

//         input.value = "";
//         msgBox.scrollTop = msgBox.scrollHeight;
//       }
//       window.sendMessage = sendMessage;


//       // -----------------------------------
//       // 核心函數：生成訊息 HTML
//       // -----------------------------------
//       function createMessageHtml(text, isSent, timeString) {
//         // 假設客服頭像為 /img/耳環兔.jpg，對方頭像為 /img/米飛.jpg
//         const avatarUrl = isSent ? "/img/耳環兔.jpg" : "/img/米飛.jpg";
//         const userName = isSent ? "我 (客服)" : "送養人";

//         const timeDisplay = timeString ? timeString : '未提供時間';
//         const timestampHtml = `<div class="message-timestamp">${timeDisplay}</div>`;

//         const containerClass = isSent
//           ? "message-row sent"
//           : "message-row received";

//         const bubbleContent = `<div class="message-bubble ${
//           isSent ? "sent-bubble" : "received-bubble"
//         }">${text}</div>`;

//         let html = "";

//         if (isSent) {
//           // 自己的訊息 (客服, 靠右)：時間在氣泡左邊
//           html = `
//             <div class="${containerClass}">
//                 ${timestampHtml}
//                 <div class="message-content">
//                     ${bubbleContent}
//                 </div>
//                 <div class="avatar-area">
//                     <img src="${avatarUrl}" class="avatar-img" />
//                 </div>
//             </div>
//           `;
//         } else {
//           // 對方的訊息 (送養人, 靠左)：時間在氣泡右邊
//           html = `
//             <div class="${containerClass}">
//                 <div class="avatar-area">
//                     <img src="${avatarUrl}" class="avatar-img" />
//                 </div>
//                 <div class="message-content">
//                     <div class="message-header">${userName}</div>
//                     ${bubbleContent}
//                 </div>
//                 ${timestampHtml}
//             </div>
//           `;
//         }

//         return html;
//       }


//       // -----------------------------------
//       // 功能選單/貼圖控制邏輯
//       // -----------------------------------

//       // 輔助函數：功能選單開關
//       function toggleMenu(showOrHide) {
//         const plusMenuIcon = document.getElementById("plus-menu-icon");
//         const expandedMenu = document.getElementById("expanded-menu");
//         const stickerArea = document.getElementById("sticker-area");
//         const emojiKeyboardIcon = document.getElementById(
//           "emoji-keyboard-icon"
//         );

//         if (!expandedMenu || !plusMenuIcon) return;

//         const isHidden = expandedMenu.style.display === "none";
//         let shouldShow = typeof showOrHide === "boolean" ? showOrHide : isHidden;

//         expandedMenu.style.display = shouldShow ? "flex" : "none";

//         // 切換圖標 (+ <-> x)
//         plusMenuIcon.classList.toggle("fa-plus", !shouldShow);
//         plusMenuIcon.classList.toggle("fa-xmark", shouldShow);

//         // 如果打開選單，自動關閉貼圖區域
//         if (shouldShow && stickerArea && stickerArea.style.display === "flex") {
//           // 模擬點擊笑臉圖標來切換回鍵盤模式
//           if (emojiKeyboardIcon) emojiKeyboardIcon.click();
//         }
//       }
//       window.toggleMenu = toggleMenu;

//       // 功能選單按鈕點擊事件
//       function handleMenuClick(feature) {
//         console.log(`點擊了功能: ${feature}`);
//         alert(`點擊了 [${feature}] 功能，後續功能請在此處實作`);
//         toggleMenu(false); // 點擊功能後自動關閉選單
//       }
//       window.handleMenuClick = handleMenuClick;


//       // -----------------------------------
//       // 縮小/展開功能
//       // -----------------------------------
//       function toggleChatWindow() {
//           const chatContainer = document.getElementById("floating-chat");
//           const minimizeArrow = document.getElementById("minimize-arrow");
//           if (!chatContainer || !minimizeArrow) return;
          
//           chatContainer.classList.toggle("expanded");

//           if (chatContainer.classList.contains("expanded")) {
//             // 展開狀態：圖標改為向下箭頭 (收合)
//             minimizeArrow.classList.replace("fa-chevron-up", "fa-chevron-down");
//           } else {
//             // 收合狀態：圖標改為向上箭頭 (展開)
//             minimizeArrow.classList.replace("fa-chevron-down", "fa-chevron-up");
//           }
//       }
//       window.toggleChatWindow = toggleChatWindow;


//       // -----------------------------------
//       // DOM 內容載入完成後的事件監聽
//       // -----------------------------------

//       document.addEventListener("DOMContentLoaded", () => {
//         const chatContainer = document.getElementById("floating-chat");
//         const minimizeButton = document.getElementById("minimize-button");
//         const closeButton = document.getElementById("close-button");
//         const messageInput = document.getElementById("message-input");
//         const imageUploadIcon = document.getElementById("image-upload-icon");
//         const fileInput = document.getElementById("file-input");
//         const plusMenuIcon = document.getElementById("plus-menu-icon");
//         const expandedMenu = document.getElementById("expanded-menu");
//         const emojiKeyboardIcon = document.getElementById("emoji-keyboard-icon");
//         const stickerArea = document.getElementById("sticker-area");
        
//         // -------------------------
//         // 縮小/展開事件監聽
//         // -------------------------

//         // 1. 點擊縮小按鈕 (在展開狀態下)
//         if (minimizeButton) {
//           minimizeButton.addEventListener("click", (event) => {
//             event.stopPropagation();
//             toggleChatWindow();
//           });
//         }

//         // 2. 點擊球狀 ICON (在縮小狀態下)
//         if (chatContainer) {
//           chatContainer.addEventListener("click", (event) => {
//             const isExpanded = chatContainer.classList.contains("expanded");
//             if (!isExpanded) {
//               toggleChatWindow();
//             }
//           });
//         }
        
//         // 3. 點擊 X (關閉按鈕)
//         if (closeButton) {
//             closeButton.addEventListener("click", (event) => {
//                 event.stopPropagation();
//                 if (confirm("確定要關閉此客服介面嗎？")) {
//                     chatContainer.style.display = "none";
//                 }
//             });
//         }


//         // ------------------------------------
//         // 聊天輸入區功能邏輯
//         // ------------------------------------

//         // Enter 鍵發送
//         if (messageInput) {
//           messageInput.addEventListener("keydown", function (e) {
//             if (e.key === "Enter") {
//               e.preventDefault();
//               sendMessage();
//             }
//           });
//         }

//         // 檔案上傳
//         if (imageUploadIcon && fileInput) {
//           imageUploadIcon.addEventListener("click", function () {
//             fileInput.click();
//           });
//           fileInput.addEventListener("change", function (event) {
//             const files = event.target.files;
//             if (files.length > 0) {
//               alert(`已選擇檔案: ${files[0].name}`);
//             }
//           });
//         }

//         // 選單開關
//         if (plusMenuIcon && expandedMenu) {
//           expandedMenu.style.display = "none";
//           plusMenuIcon.addEventListener("click", () => toggleMenu());
//         }

//         // 笑臉/鍵盤切換邏輯
//         if (emojiKeyboardIcon && stickerArea && messageInput) {
//           stickerArea.style.display = "none";

//           emojiKeyboardIcon.addEventListener("click", function () {
//             const isHidden = stickerArea.style.display === "none";

//             if (isHidden) {
//               stickerArea.style.display = "flex";
//               emojiKeyboardIcon.classList.replace("fa-face-smile", "fa-keyboard");
//               emojiKeyboardIcon.classList.replace("fa-regular", "fa-solid");
//               toggleMenu(false);
//               messageInput.blur();
//             } else {
//               stickerArea.style.display = "none";
//               emojiKeyboardIcon.classList.replace("fa-keyboard", "fa-face-smile");
//               emojiKeyboardIcon.classList.replace("fa-solid", "fa-regular");
//               messageInput.focus();
//             }
//           });

//           // 當點擊輸入框時，自動切換回鍵盤模式
//           messageInput.addEventListener("focus", () => {
//             if (stickerArea.style.display === "flex") {
//               emojiKeyboardIcon.click();
//             }
//           });

//           // 貼圖點擊邏輯
//           const stickerItems = stickerArea.querySelectorAll(".sticker-item");
//           stickerItems.forEach((item) => {
//             item.addEventListener("click", () => {
//               const stickerHtml = createMessageHtml(
//                 `<img src="${item.src}" alt="${item.alt}" style="max-width: 100px; height: auto;">`,
//                 true, // 貼圖也視為客服發送
//                 gettime()
//               );
//               document.getElementById("messages").innerHTML += stickerHtml;
//               document.getElementById("messages").scrollTop =
//                 document.getElementById("messages").scrollHeight;

//               // 發送後自動關閉貼圖區域
//               emojiKeyboardIcon.click();
//             });
//           });
//         }

//         // 點擊空白處自動關閉選單/貼圖區 (簡化邏輯，只處理選單和貼圖區關閉)
//         document.addEventListener("click", (event) => {
//           const target = event.target;
          
//           // 關閉功能選單
//           if (expandedMenu && expandedMenu.style.display === "flex" &&
//              !expandedMenu.contains(target) && !plusMenuIcon.contains(target)) {
//               toggleMenu(false);
//           }

//           // 關閉貼圖區域
//           if (stickerArea && stickerArea.style.display === "flex" &&
//              !stickerArea.contains(target) && !emojiKeyboardIcon.contains(target) &&
//              target !== messageInput) {
//                 // 如果點擊的地方不在貼圖區、不在笑臉ICON上、也不在輸入框上，則關閉貼圖區
//                 if (document.activeElement !== messageInput) {
//                     emojiKeyboardIcon.click();
//                 }
//           }
//         });
        
//       }); // DOMContentLoaded 結束


//       // -----------------------------------
//       // 模擬列表資料載入 (原本在 window.onload)
//       // -----------------------------------
//       window.onload = function () {
//           // 確保初始狀態是展開 (因為 HTML 中設置了 expanded class)
//           // 如果要確保是最小化，可以取消註解以下程式碼並移除 HTML 上的 class="expanded"
//           // const chatContainer = document.getElementById("floating-chat");
//           // if (chatContainer) chatContainer.classList.remove("expanded");
          
//           const dataJson = {
//             aaa: [
//               { title: "送養人 id-076" },
//               { title: "送養人 id-077" },
//               { title: "送養人 id-078" },
//               { title: "送養人 id-079" },
//               { title: "送養人 id-080" },
//               { title: "送養人 id-081" },
//               { title: "送養人 id-082" },
//               { title: "送養人 id-083" },
//             ],
//           };
          
//           const listBox = document.querySelector(".conversation-list");
//           if (listBox) {
//               let html = "";
//               for (let temp of dataJson.aaa) {
//                 // 這裡沒有定義 openChat 函數，點擊列表項目不會有反應，但結構是完整的
//                 html += `
//                 <div class="list-item" onclick="console.log('Open chat with: ${temp.title}')">
//                   <div class="avatar">
//                     <i class="fa-solid fa-user"></i>
//                   </div>
//                   <div class="list-content">
//                     <div class="list-header">
//                       <span class="list-title">${temp.title}</span>
//                       <span class="list-time">11/11 09:11</span>
//                     </div>
//                     <div class="list-preview">請客服人員幫我聯絡對方修改問卷...</div>
//                   </div>
//                 </div>`;
//               }
//               listBox.innerHTML = html;
//           }
// };
      
/**
 * 客服後台懸浮視窗版 JS
 * 特色：具備後台完整功能 (三欄)，但可縮小至角落
 */

/**
 * 針對您的 HTML 結構修正後的 JS
 * 功能：縮小/展開、選單切換、貼圖、圖片上傳、發送訊息
 */

// ==========================================
// 1. 全域變數定義
// ==========================================
// 為了配合您的 HTML onclick="sendMessage()"，這個函數必須放在全域
window.sendMessage = function() {
    const input = document.getElementById("message-input");
    const msgBox = document.getElementById("messages");
    
    if (!input || !msgBox) return;
    
    const text = input.value.trim();
    if (!text) return;

    // 取得當前時間
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;

    // 模擬發送 (顯示在畫面上)
    // 注意：這裡使用了您 CSS 中的 .message-row.sent 結構
    const html = `
    <div class="message-row sent">
        <div class="message-timestamp">${timeStr}</div>
        <div class="message-content">
            <div class="message-bubble sent-bubble">${text}</div>
        </div>
        <div class="avatar-area">
            <img src="/img/耳環兔.jpg" class="avatar-img" onerror="this.src='https://via.placeholder.com/30'"/>
        </div>
    </div>`;

    msgBox.insertAdjacentHTML('beforeend', html);
    msgBox.scrollTop = msgBox.scrollHeight; // 捲動到底部
    input.value = ""; // 清空輸入框
    
    console.log("訊息已發送:", text);
    //在此處加入 fetch 或 WebSocket 發送邏輯
};

// ==========================================
// 2. DOM 載入後綁定事件 (UI 互動核心)
// ==========================================
document.addEventListener("DOMContentLoaded", function () {
    console.log("JS 載入成功，開始綁定事件...");

    // --- 元素選取 (對應您的 HTML ID) ---
    const els = {
        chatContainer: document.getElementById("floating-chat"), // 外層大框
        minimizeBtn: document.getElementById("minimize-button"), // 縮小按鈕 (X)
        ballIcon: document.getElementById("minimized-ball-icon"),// 球狀圖示
        
        plusIcon: document.getElementById("plus-menu-icon"),     // + 號
        menu: document.getElementById("expanded-menu"),          // 展開選單
        
        emojiIcon: document.getElementById("emoji-keyboard-icon"), // 笑臉/鍵盤
        stickerArea: document.getElementById("sticker-area"),      // 貼圖區
        
        cameraIcon: document.getElementById("image-upload-icon"),  // 相機
        fileInput: document.getElementById("file-input"),          // 檔案 Input
        
        msgInput: document.getElementById("message-input")         // 輸入框
    };

    // --- 1. 視窗縮放邏輯 ---
    
    // 點擊 X (縮小)
    if (els.minimizeBtn) {
        els.minimizeBtn.addEventListener("click", (e) => {
            e.stopPropagation(); // 防止冒泡
            // 移除 expanded class -> 觸發 CSS 變回球狀
            if (els.chatContainer) els.chatContainer.classList.remove("expanded");
        });
    }

    // 點擊球狀 (展開)
    if (els.ballIcon) {
        els.ballIcon.addEventListener("click", (e) => {
            e.stopPropagation();
            // 加上 expanded class -> 觸發 CSS 變回大視窗
            if (els.chatContainer) els.chatContainer.classList.add("expanded");
        });
    }

    // --- 2. 功能選單 (+號) ---
    if (els.plusIcon && els.menu) {
        els.plusIcon.addEventListener("click", (e) => {
            e.stopPropagation();
            const isHidden = els.menu.style.display === "none";
            
            // 切換顯示
            els.menu.style.display = isHidden ? "flex" : "none";
            
            // 圖示變更 (+ 變 X)
            if (isHidden) {
                els.plusIcon.classList.replace("fa-plus", "fa-xmark");
                // 如果開了選單，就關掉貼圖
                if(els.stickerArea) els.stickerArea.style.display = "none";
            } else {
                els.plusIcon.classList.replace("fa-xmark", "fa-plus");
            }
        });
    }

    // --- 3. 貼圖選單 (笑臉) ---
    if (els.emojiIcon && els.stickerArea) {
        els.emojiIcon.addEventListener("click", (e) => {
            e.stopPropagation();
            const isHidden = els.stickerArea.style.display === "none";

            // 切換顯示
            els.stickerArea.style.display = isHidden ? "flex" : "none"; // CSS設 flex
            
            // 圖示變更 (笑臉 變 鍵盤)
            if (isHidden) {
                els.emojiIcon.classList.replace("fa-face-smile", "fa-keyboard");
                els.emojiIcon.classList.replace("fa-regular", "fa-solid");
                // 如果開了貼圖，就關掉選單
                if(els.menu) els.menu.style.display = "none";
                if(els.plusIcon) els.plusIcon.classList.replace("fa-xmark", "fa-plus");
            } else {
                els.emojiIcon.classList.replace("fa-keyboard", "fa-face-smile");
                els.emojiIcon.classList.replace("fa-solid", "fa-regular");
                // 切回鍵盤模式讓輸入框取得焦點
                if(els.msgInput) els.msgInput.focus();
            }
        });

        // 綁定貼圖點擊發送
        els.stickerArea.querySelectorAll(".sticker-item").forEach(img => {
            img.addEventListener("click", () => {
                const stickerSrc = img.src;
                // 發送圖片訊息
                sendImageMessage(stickerSrc, true); // true 代表是貼圖
                // 關閉貼圖區
                els.stickerArea.style.display = "none";
                els.emojiIcon.classList.replace("fa-keyboard", "fa-face-smile");
                els.emojiIcon.classList.replace("fa-solid", "fa-regular");
            });
        });
    }

    // --- 4. 圖片上傳 (相機) ---
    if (els.cameraIcon && els.fileInput) {
        els.cameraIcon.addEventListener("click", () => {
            els.fileInput.click(); // 觸發隱藏的 input
        });

        els.fileInput.addEventListener("change", (e) => {
            const file = e.target.files[0];
            if (file) {
                // 這裡做簡單的預覽發送
                const reader = new FileReader();
                reader.onload = function(evt) {
                    sendImageMessage(evt.target.result, false); // false 代表是上傳的照片
                };
                reader.readAsDataURL(file);
                
                // 清空 input 讓下一張同樣的圖可以再觸發
                els.fileInput.value = "";
            }
        });
    }

    // --- 5. 點擊空白處關閉選單 ---
    document.addEventListener("click", (e) => {
        // 關閉 + 號選單
        if (els.menu && els.menu.style.display === "flex") {
            if (!els.menu.contains(e.target) && !els.plusIcon.contains(e.target)) {
                els.menu.style.display = "none";
                els.plusIcon.classList.replace("fa-xmark", "fa-plus");
            }
        }
        // 關閉貼圖選單
        if (els.stickerArea && els.stickerArea.style.display === "flex") {
            // 如果點的不是貼圖區，也不是笑臉按鈕，也不是輸入框
            if (!els.stickerArea.contains(e.target) && !els.emojiIcon.contains(e.target) && e.target !== els.msgInput) {
                els.stickerArea.style.display = "none";
                els.emojiIcon.classList.replace("fa-keyboard", "fa-face-smile");
                els.emojiIcon.classList.replace("fa-solid", "fa-regular");
            }
        }
    });

    // --- 6. 輸入框按 Enter 發送 ---
    if (els.msgInput) {
        els.msgInput.addEventListener("keydown", (e) => {
            if (e.key === "Enter") {
                window.sendMessage(); // 呼叫全域發送函數
            }
        });
        // 點擊輸入框時，自動關閉貼圖
        els.msgInput.addEventListener("focus", () => {
             if (els.stickerArea && els.stickerArea.style.display === "flex") {
                 els.stickerArea.style.display = "none";
                 els.emojiIcon.classList.replace("fa-keyboard", "fa-face-smile");
                 els.emojiIcon.classList.replace("fa-solid", "fa-regular");
             }
        });
    }
});

// ==========================================
// 3. 輔助功能：發送圖片/貼圖
// ==========================================
function sendImageMessage(src, isSticker) {
    const msgBox = document.getElementById("messages");
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
    
    // 貼圖稍微小一點，照片限制寬度
    const style = isSticker ? "width: 100px;" : "max-width: 200px; border-radius: 8px;";

    const html = `
    <div class="message-row sent">
        <div class="message-timestamp">${timeStr}</div>
        <div class="message-content">
            <div class="message-bubble sent-bubble" style="background: transparent; padding: 0;">
                <img src="${src}" style="${style}">
            </div>
        </div>
        <div class="avatar-area">
            <img src="/img/耳環兔.jpg" class="avatar-img" onerror="this.src='https://via.placeholder.com/30'"/>
        </div>
    </div>`;

    if(msgBox) {
        msgBox.insertAdjacentHTML('beforeend', html);
        msgBox.scrollTop = msgBox.scrollHeight;
    }
}

// ==========================================
// 4. 功能選單處理 (FAQ, Help...)
// ==========================================
function handleMenuClick(type) {
    alert("點擊了功能: " + type);
    // 點完後關閉選單
    const menu = document.getElementById("expanded-menu");
    const plusIcon = document.getElementById("plus-menu-icon");
    if(menu) menu.style.display = "none";
    if(plusIcon) plusIcon.classList.replace("fa-xmark", "fa-plus");
}
// 綁定到全域
window.handleMenuClick = handleMenuClick;



// ==========================================
// 客服專用功能
// ==========================================
// ==========================================
// 客服專用功能 (修正版)
// ==========================================

// 1. 定義罐頭訊息內容 (這裡是純文字版，如果您想要圖示，要改回物件格式)
const cannedMessages = [
    "👋 嗨嗨～ReHome 狗狗小編來啦！有什麼可以為您效勞的嗎？🥰",
    "🙏 稍等我一下下喔，我正努力幫您查資料中～🐾",
    "📄 想跟您確認一下，領養申請表上的資訊都有填寫正確嗎？🌟",
    "📸 麻煩您再補傳一張居家環境的小照片給我們看看可以嗎？謝謝您～💕",
    "✅ 好的沒問題！我已經幫您記錄下來囉，接下來會有專人再和您聯繫～🐶✨",
    "👋 感謝您的詢問！祝您今天也被幸福包圍～汪汪陪您度過美好的一天！🌈💛"
];

// 2. 切換常用語選單開關
function toggleQuickReplies(event) {
    // ★ 防止冒泡 (重要)
    if (event) {
        event.stopPropagation();
    }

    const menu = document.getElementById("quick-reply-menu");
    const listContainer = menu.querySelector(".quick-reply-list");
    
    // 如果是開啟狀態，就關閉
    if (menu.style.display === "block") {
        menu.style.display = "none";
        // 移除 show class 以重置動畫 (如果有寫 CSS 動畫的話)
        menu.classList.remove("show");
        return;
    }

    // 產生選單內容
    let html = "";
    cannedMessages.forEach(msg => {
        // ★ 注意：這裡改成呼叫 sendQuickReply (直接發送)
        // 使用 replace 把單引號跳脫，避免 JS 報錯
        const safeMsg = msg.replace(/'/g, "\\'");
        
        html += `
            <div class="quick-reply-item" 
                 onclick="sendQuickReply('${safeMsg}')"
                 style="padding: 10px; cursor: pointer; border-bottom: 1px solid #f0f0f0; font-size: 13px; transition: background 0.2s;">
                ${msg}
            </div>
        `;
    });
    listContainer.innerHTML = html;

    // 顯示選單
    menu.style.display = "block";
    // 稍微延遲加入 show class 讓 CSS transition 生效
    setTimeout(() => { menu.classList.add("show"); }, 10);
    
    // 關閉原本的圓形選單
    if (window.toggleMenu) window.toggleMenu(false);
}

// 3. ★新功能：點擊後直接發送 (取代原本的 insertMessage)
function sendQuickReply(text) {
    // 呼叫主要的發送函式 (請確認您的 sendMessage 有支援參數)
    if (window.sendMessage) {
        window.sendMessage(text);
    } else {
        console.error("找不到 sendMessage 函式");
    }
    
    // 發送完關閉選單
    const menu = document.getElementById("quick-reply-menu");
    menu.style.display = "none";
    menu.classList.remove("show");
}

// 4. 備忘錄功能 (維持不變)
function openPrivateNote() {
    if (!currentReceiverId) {
        alert("請先選擇一位用戶！");
        return;
    }
    const note = prompt(`請輸入關於用戶 ${currentReceiverId} 的備註：`, "此用戶很有誠意，建議優先處理");
    if (note) {
        console.log(`已儲存備註：${note}`);
        alert("✅ 備註已儲存 (僅內部可見)");
        if (window.toggleMenu) window.toggleMenu(false);
    }
}

// 5. 結束對話功能 (維持不變)
function archiveChat() {
    if (!currentReceiverId) return;

    if (confirm("確定要結束此對話並封存嗎？")) {
        const userItem = document.getElementById(`user-item-${currentReceiverId}`);
        if (userItem) {
            userItem.style.transition = "all 0.5s";
            userItem.style.opacity = "0";
            userItem.style.transform = "translateX(-20px)";
            
            setTimeout(() => {
                userItem.remove(); 
                document.getElementById("messages").innerHTML = '<div style="text-align:center; padding:20px; color:#ccc;">對話已結束</div>';
                // document.getElementById("current-chat-title").innerText = ""; // 這裡看您的 HTML 有沒有這個 ID
                currentReceiverId = null;
            }, 500);
        }
        
        if (window.toggleMenu) window.toggleMenu(false);
    }
}