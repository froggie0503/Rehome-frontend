let selectedCard = null;

// 監聽下架按鈕點擊事件
document.addEventListener('click', function(e) {
  if (e.target.classList.contains('cardremove')) {
    const btn = e.target;
    // 往上查找最近的 .card 元素
    selectedCard = btn.closest('.card');
    
    const modalEl = document.getElementById('cardremove_modal');
    if (modalEl) {
      const modal = new bootstrap.Modal(modalEl);
      modal.show();
    }
  }
});

// 確定下架 - 使用委託方式監聽
document.addEventListener('click', function(e) {
  if (e.target.id === 'confirmRemoveBtn') {
    if (!selectedCard) {
      // alert('請選擇要下架的卡片');
      return;
    }

    const cardId = selectedCard.dataset.id;

    // 發送 API 請求給後端
    fetch(`/api/remove-card/${cardId}`, { method: 'DELETE' })
      .then(res => {
        // 檢查狀態碼
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then(data => {
        if (data.success) {
          // 直接對 selectedCard 操作，確保只影響這一張卡片
          const overlay = selectedCard.querySelector('.card-overlay');
          if (overlay) {
            overlay.style.display = 'block';
          }

          // 可選：按鈕改成「已下架」且禁用
          const removeBtn = selectedCard.querySelector('.cardremove');
          if (removeBtn) {
            removeBtn.textContent = '已下架';
            removeBtn.disabled = true;
          }
          alert('下架成功');
        } else {
          alert('下架失敗: ' + (data.message || '未知錯誤'));
        }
      })
      .catch(err => {
        console.error('下架失敗:', err);
        console.log('檢查：API 端點是否已實作？');
        
        // 暫時模擬成功（用於測試前端 UI）
        // 實際應用中應移除此段，改為顯示實際的後端錯誤
        console.log('目前使用模擬模式進行測試');
        
        // 直接對 selectedCard 操作，確保只影響這一張卡片
        const overlay = selectedCard.querySelector('.card-overlay');
        if (overlay) {
          overlay.style.display = 'block';
        }

        // 可選：按鈕改成「已下架」且禁用
        const removeBtn = selectedCard.querySelector('.cardremove');
        if (removeBtn) {
          removeBtn.textContent = '已下架';
          removeBtn.disabled = true;
        }

      })
      .finally(() => {
        // 關閉 Modal
        const modalEl = document.getElementById('cardremove_modal');
        const modal = bootstrap.Modal.getInstance(modalEl);
        if (modal) {
          modal.hide();
        }
      });
  }
});
