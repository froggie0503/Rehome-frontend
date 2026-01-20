// ==========================================
// 3. 常見問題 (QnA) 邏輯
// ==========================================


export async function loadQnaData() {

    try {
        const response = await fetch('/api/qna/random/6');
        const result = await response.json();

        if (result.success) {
            const container = document.getElementById('indexFaqAccordionInput');
            let htmlContent = '';

            result.data.forEach((item, index) => {
                // 產生唯一的 ID，例如 collapseQ1, collapseQ2
                const questionId = `collapseQ${index + 1}`;
                
                htmlContent += `
                    <div class="qna_item">
                        <button class="qna_header collapsed" type="button" data-bs-toggle="collapse"
                            data-bs-target="#${questionId}" aria-expanded="false" aria-controls="${questionId}">
                            <span class="qna_question">${item.question}</span>
                            <span class="qna_icon"><i class="bi bi-plus-lg"></i></span>
                        </button>
                        <div id="${questionId}" class="collapse qna_body">
                            <div class="qna_answer">
                                <p><i class="bi bi-arrow-return-right"></i> ${item.answer}</p>
                            </div>
                        </div>
                    </div>
                `;
            });

            container.innerHTML = htmlContent;
        }
    } catch (error) {
        console.error('QnA 資料載入失敗:', error);
    }
}