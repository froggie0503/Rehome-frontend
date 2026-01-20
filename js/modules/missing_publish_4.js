// 使用 (function(){ ... })(); 把程式碼包起來
(function() {
    const stamp = document.getElementById('stamp');
    const mark = document.getElementById('stamp-mark'); 
    
    // 這裡的 return 現在是在函式裡面，所以是合法的！
    // 如果找不到元素，就直接結束這個函式，不執行後面的動畫
    if (!stamp || !mark) return; 

    let startTime = null;
    const duration = 3000; 
    
    const centerX = 110;   
    const centerY = 170;   
    const radius = 10;    
    
    const startAngle = -Math.PI / 4; 
    const endAngle = 0;              

    function animate(timestamp) {
        if (!startTime) startTime = timestamp;
        const elapsed = timestamp - startTime;
        
        const totalLoopTime = duration + 1000; 
        const progress = (elapsed % totalLoopTime) / duration;

        if (progress > 1) {
            requestAnimationFrame(animate);
            return;
        }

        if (progress < 0.5) {
            const t = progress * 2; 
            const currentAngle = startAngle + (endAngle - startAngle) * t;

            const offsetX = radius * Math.cos(currentAngle);
            const offsetY = radius * Math.sin(currentAngle);
            
            const x = centerX + 100 * (1 - t); 
            const y = centerY - 100 * Math.sin((1-t) * Math.PI/2); 

            const rotation = 30 * (1 - t);
            
            stamp.style.transform = `translate(${x}px, ${y}px) rotate(${rotation}deg)`;
            mark.style.opacity = 0;

        } else {
            const t = (progress - 0.5) * 2; 

            if (t < 0.2) {
                stamp.style.transform = `translate(${centerX}px, ${centerY}px) rotate(0deg)`;
                mark.style.opacity = 1; 
            } else {
                const liftT = (t - 0.2) / 0.8; 
                
                const x = centerX + 100 * liftT; 
                const y = centerY - 100 * Math.sin(liftT * Math.PI/2);
                const rotation = 30 * liftT;

                stamp.style.transform = `translate(${x}px, ${y}px) rotate(${rotation}deg)`;
                mark.style.opacity = 1 - liftT; 
            }
        }

        requestAnimationFrame(animate);
    }

    requestAnimationFrame(animate);

    // 按鈕監聽也要放在裡面，避免全域汙染
    const viewCaseBtn = document.getElementById('viewCaseBtn');
    if (viewCaseBtn) {
        viewCaseBtn.addEventListener('click', function() {
            alert("導航至案件連結頁面");
        });
    }

    const manageCaseBtn = document.getElementById('manageCaseBtn');
    if (manageCaseBtn) {
        manageCaseBtn.addEventListener('click', function() {
            alert("導航至會員中心/案件管理頁面");
        });
    }

})(); // 結尾這裡一定要有一對小括號 () 讓它立即執行