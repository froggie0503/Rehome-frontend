document.addEventListener('DOMContentLoaded', function() {
    const cancelBtn = document.querySelector('.btn-cancel');
    const saveBtn = document.querySelector('.btn-save');
    const addQuestionBtn = document.querySelector('.add-question-btn');
    const updateInfo = document.querySelector('.update-info');
    
    // 從 URL 參數取得問卷類型，預設為 'adoption'
    const urlParams = new URLSearchParams(window.location.search);
    const surveyType = urlParams.get('type') || 'adoption'; // 'adoption' 或 'surrender'
    
    let questions = []; // 當前問卷題目
    let lastUpdated = '2025/12/04 20:15:30';
    let hasUnsavedChanges = false; // 追蹤是否有未儲存的變更

    // 頁面載入時直接載入問卷
    loadSurveyData(surveyType);

    // 攔截頁面內的所有連結點擊，提示未儲存變更（自定義對話框）
    document.addEventListener('click', function(e) {
        const link = e.target.closest('a');
        if (link && hasUnsavedChanges && !link.classList.contains('no-warning')) {
            e.preventDefault();
            if (confirm('您有未儲存的變更，確定要離開此頁面嗎？\n未儲存的變更將會遺失。')) {
                hasUnsavedChanges = false;
                window.location.href = link.href;
            }
        }
    }, true);

    // 頁面離開前的提醒（關閉標籤、重新整理時）
    // 注意：由於瀏覽器安全限制，這裡只能使用瀏覽器原生對話框，無法自定義
    window.addEventListener('beforeunload', function(e) {
        if (hasUnsavedChanges) {
            e.preventDefault();
            e.returnValue = '';
            return '';
        }
    });

    // 手風琴展開/收合功能
    const accordionHeader = document.getElementById('defaultQuestionsHeader');
    const accordionContent = document.getElementById('defaultQuestionList');
    const accordionToggle = accordionHeader.querySelector('.accordion-toggle');
    
    accordionHeader.addEventListener('click', function() {
        accordionContent.classList.toggle('expanded');
        accordionToggle.textContent = accordionContent.classList.contains('expanded') ? '▼' : '▶';
    });

    // 取消按鈕 - 重新載入問卷
    cancelBtn.addEventListener('click', function() {
        if (confirm('確定要放棄所有變更嗎？')) {
            hasUnsavedChanges = false;
            loadSurveyData(surveyType);
        }
    });

    // 刪除題目（預設題目不可刪除）
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('delete-btn')) {
            const questionItem = e.target.closest('.question-item');
            const isDefault = questionItem.classList.contains('default-question');
            
            if (isDefault) {
                return;
            }
            
            questionItem.remove();
            updateQuestionNumbers();
            hasUnsavedChanges = true;
        }
    });

    // 向上移動題目（預設題目不可移動）
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('up-btn')) {
            const questionItem = e.target.closest('.question-item');
            const isDefault = questionItem.classList.contains('default-question');
            
            if (isDefault) {
                return; // 預設題目不可移動
            }
            
            const prevItem = questionItem.previousElementSibling;
            if (prevItem && !prevItem.classList.contains('default-question')) {
                questionItem.parentNode.insertBefore(questionItem, prevItem);
                updateQuestionNumbers();
                hasUnsavedChanges = true;
            }
        }
    });

    // 向下移動題目（預設題目不可移動）
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('down-btn')) {
            const questionItem = e.target.closest('.question-item');
            const isDefault = questionItem.classList.contains('default-question');
            
            if (isDefault) {
                return; // 預設題目不可移動
            }
            
            const nextItem = questionItem.nextElementSibling;
            if (nextItem && !nextItem.classList.contains('default-question')) {
                questionItem.parentNode.insertBefore(nextItem, questionItem);
                updateQuestionNumbers();
                hasUnsavedChanges = true;
            }
        }
    });

    // 監聽題目內容編輯（標記為有變更）
    document.addEventListener('input', function(e) {
        if (e.target.classList.contains('question-text') && 
            e.target.getAttribute('contenteditable') === 'true') {
            hasUnsavedChanges = true;
        }
    });

    // 處理預設提示文字的清除
    document.addEventListener('focus', function(e) {
        if (e.target.classList.contains('question-text') && 
            e.target.getAttribute('contenteditable') === 'true') {
            const text = e.target.textContent.trim();
            if (text === '請輸入新問題...') {
                e.target.textContent = '';
            }
        }
    }, true);

    // 如果失去焦點時仍是空的，恢復提示文字
    document.addEventListener('blur', function(e) {
        if (e.target.classList.contains('question-text') && 
            e.target.getAttribute('contenteditable') === 'true') {
            const text = e.target.textContent.trim();
            if (text === '') {
                e.target.textContent = '請輸入新問題...';
            }
        }
    }, true);

    // 更新題目編號和按鈕狀態
    function updateQuestionNumbers() {
        const questionItems = document.querySelectorAll('.question-item');
        const customQuestions = Array.from(questionItems).filter(item => !item.classList.contains('default-question'));
        
        questionItems.forEach((item, index) => {
            const isDefault = item.classList.contains('default-question');
            
            // 更新題號
            const numberSpan = item.querySelector('.question-number');
            if (numberSpan) {
                numberSpan.textContent = `${index + 1}.`;
            }
            
            // 預設題目：禁用所有操作按鈕
            if (isDefault) {
                const upBtn = item.querySelector('.up-btn');
                const downBtn = item.querySelector('.down-btn');
                if (upBtn) upBtn.disabled = true;
                if (downBtn) downBtn.disabled = true;
            } else {
                // 自訂題目：根據位置更新按鈕狀態
                const customIndex = customQuestions.indexOf(item);
                const upBtn = item.querySelector('.up-btn');
                const downBtn = item.querySelector('.down-btn');
                
                if (upBtn) {
                    // 檢查前一個是否為預設題目
                    const prevItem = item.previousElementSibling;
                    upBtn.disabled = !prevItem || prevItem.classList.contains('default-question');
                }
                
                if (downBtn) {
                    downBtn.disabled = customIndex === customQuestions.length - 1;
                }
            }
        });
    }



    // 新增題目
    addQuestionBtn.addEventListener('click', function() {
        const questionList = document.getElementById('customQuestionList');
        const allQuestions = document.querySelectorAll('.question-item');
        const currentCount = allQuestions.length;
        const newQuestion = document.createElement('div');
        newQuestion.className = 'question-item';
        newQuestion.innerHTML = `
            <div class="question-header">
                <div class="sort-buttons">
                    <button class="sort-btn up-btn" title="向上移動" ${currentCount === 0 ? 'disabled' : ''}>↑</button>
                    <button class="sort-btn down-btn" title="向下移動" disabled>↓</button>
                </div>
                <span class="question-number">${currentCount + 1}.</span>
                <span class="question-text" contenteditable="true">請輸入新問題...</span>
                <button class="delete-btn" title="刪除題目">×</button>
            </div>
        `;
        questionList.appendChild(newQuestion);
        
        // 更新所有題目的按鈕狀態
        updateQuestionNumbers();
        hasUnsavedChanges = true;
        
        // 自動聚焦到新題目
        newQuestion.querySelector('.question-text').focus();
    });

    // 儲存問卷
    saveBtn.addEventListener('click', function() {
        const questionsList = [];
        // 從預設題目和自訂題目區塊收集所有題目
        const defaultItems = document.querySelectorAll('#defaultQuestionList .question-item');
        const customItems = document.querySelectorAll('#customQuestionList .question-item');
        const questionItems = [...defaultItems, ...customItems];
        
        questionItems.forEach((item, index) => {
            const questionText = item.querySelector('.question-text').textContent;
            const questionId = item.getAttribute('data-question-id');
            
            // 注意：不需要傳送 default 欄位，後端會根據 question_category 自動判斷
            questionsList.push({
                id: questionId ? parseInt(questionId) : null,
                question: questionText,
                sortOrder: index + 1
            });
        });

        // 儲存到後端
        saveSurveyData(surveyType, questionsList);
    });

    // 載入問卷資料
    function loadSurveyData(type) {
        // 從後端 API 載入問卷資料
        const authToken = localStorage.getItem('authToken');
        const headers = { 'Content-Type': 'application/json' };
        if (authToken) {
            headers['Authorization'] = `Bearer ${authToken}`;
        }
        
        fetch(`/api/survey/${type}`, { 
            method: 'GET',
            headers: headers 
        })
            .then(response => {
                return response.json().then(data => ({
                    ok: response.ok,
                    status: response.status,
                    data: data
                }));
            })
            .then(result => {
                if (result.ok && result.data.success) {
                    questions = result.data.data.questions || [];
                    
                    // 更新最後更新時間
                    if (result.data.data.lastUpdated) {
                        lastUpdated = formatDateTime(result.data.data.lastUpdated);
                        updateInfo.textContent = `最近更新：${lastUpdated}`;
                    }
                    
                    renderQuestions(questions);
                } else {
                    renderQuestions([]);
                }
            })
            .catch(error => {
                console.error('載入問卷失敗:', error);
                renderQuestions([]);
            });
    }

    // 儲存問卷資料
    function saveSurveyData(type, questionsList) {
        const authToken = localStorage.getItem('authToken');
        const headers = { 'Content-Type': 'application/json' };
        if (authToken) {
            headers['Authorization'] = `Bearer ${authToken}`;
        }
        
        // 發送到後端 API
        fetch('/api/survey/save', {
            method: 'POST',
            headers: headers,
            body: JSON.stringify({ 
                type: type,
                questions: questionsList 
            })
        })
        .then(response => {
            if (!response.ok) {
                return response.json().then(err => {
                    throw new Error(err.message || `HTTP error! status: ${response.status}`);
                });
            }
            return response.json();
        })
        .then(data => {
            if (data.success) {
                questions = data.data.questions || [];
                
                // 更新最後更新時間
                if (data.data.lastUpdated) {
                    lastUpdated = formatDateTime(data.data.lastUpdated);
                    updateInfo.textContent = `最近更新：${lastUpdated}`;
                }
                
                hasUnsavedChanges = false;
                alert('問卷儲存成功!');
                // 重新載入以確保資料一致
                loadSurveyData(type);
            } else {
                alert('儲存失敗: ' + data.message);
            }
        })
        .catch(error => {
            console.error('儲存問卷失敗:', error);
            alert('儲存問卷失敗: ' + error.message);
        });
    }

    // 格式化日期時間（從後端 API 返回的格式）
    function formatDateTime(dateTimeString) {
        const date = new Date(dateTimeString);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');
        
        return `${year}/${month}/${day} ${hours}:${minutes}:${seconds}`;
    }

    // 渲染問卷題目
    function renderQuestions(questionsList) {
        const defaultQuestionList = document.getElementById('defaultQuestionList');
        const customQuestionList = document.getElementById('customQuestionList');
        defaultQuestionList.innerHTML = '';
        customQuestionList.innerHTML = '';
        
        // 分離預設題目和自訂題目
        const defaultQuestions = questionsList.filter(q => q.default === true);
        const customQuestions = questionsList.filter(q => q.default !== true);
        
        // 渲染預設題目
        defaultQuestions.forEach((q, index) => {
            const questionItem = document.createElement('div');
            questionItem.className = 'question-item default-question';
            questionItem.setAttribute('data-index', index);
            questionItem.setAttribute('data-question-id', q.id || '');
            
            questionItem.innerHTML = `
                <div class="question-header">
                    <span class="question-number">${index + 1}.</span>
                    <span class="default-badge" title="預設題目，不可修改">預設</span>
                    <span class="question-text" contenteditable="false" style="cursor: not-allowed; user-select: none;">${q.question}</span>
                </div>
            `;
            defaultQuestionList.appendChild(questionItem);
        });
        
        // 渲染自訂題目
        customQuestions.forEach((q, index) => {
            const globalIndex = defaultQuestions.length + index;
            const questionItem = document.createElement('div');
            questionItem.className = 'question-item';
            questionItem.setAttribute('data-index', globalIndex);
            questionItem.setAttribute('data-question-id', q.id || '');
            
            questionItem.innerHTML = `
                <div class="question-header">
                    <div class="sort-buttons">
                        <button class="sort-btn up-btn" title="向上移動" ${index === 0 ? 'disabled' : ''}>↑</button>
                        <button class="sort-btn down-btn" title="向下移動" ${index === customQuestions.length - 1 ? 'disabled' : ''}>↓</button>
                    </div>
                    <span class="question-number">${globalIndex + 1}.</span>
                    <span class="question-text" contenteditable="true">${q.question}</span>
                    <button class="delete-btn" title="刪除題目">×</button>
                </div>
            `;
            customQuestionList.appendChild(questionItem);
        });
    }
});
