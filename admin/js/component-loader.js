function loadComponent(selector, url) {
    return fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.text();
        })
        .then(html => {
            const element = document.querySelector(selector);
            if (element) {
                element.innerHTML = html;
                
                // 執行載入的 HTML 中的 script 標籤
                const scripts = element.querySelectorAll('script');
                scripts.forEach(oldScript => {
                    const newScript = document.createElement('script');
                    
                    // 複製所有屬性
                    Array.from(oldScript.attributes).forEach(attr => {
                        newScript.setAttribute(attr.name, attr.value);
                    });
                    
                    // 複製 inline script 內容
                    if (!oldScript.src) {
                        newScript.textContent = oldScript.textContent;
                    }
                    
                    // 設定正確的 type
                    newScript.type = 'text/javascript';
                    
                    // 替換舊 script（觸發執行）
                    oldScript.parentNode.replaceChild(newScript, oldScript);
                });
            }
            return true;
        })
        .catch(error => {
            return false;
        });
}

// 先載入 header 和 sidebar HTML
Promise.all([
    loadComponent(".header", "components/header.html"),
    loadComponent(".sidebar", "components/sidebar.html")
]).then(() => {
    
    // 手動載入 sidebar.js（避免路徑問題）
    const sidebarScript = document.createElement('script');
    sidebarScript.src = '../js/sidebar.js';
    sidebarScript.type = 'text/javascript';
    document.body.appendChild(sidebarScript);
});