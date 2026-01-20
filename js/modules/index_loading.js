// src/main/resources/static/js/modules/index_loading.js

document.addEventListener('DOMContentLoaded', function () {
    const brandContainer = document.getElementById('brand-container');
    const loaderBg = document.getElementById('loader-bg');
    const brandNameBox = document.getElementById('brand-name-box');
    const slogan = document.getElementById('slogan');
    const logoBox = document.querySelector('.logo-box');

    // 1. 檢查是否已經看過動畫 (存在 sessionStorage 中)
    const hasSeenIntro = sessionStorage.getItem('rehome_intro_shown');

    // 2. 檢查目前是否為首頁 (空字串 或 #home 視為首頁)
    const currentHash = window.location.hash;
    const isHomePage = (currentHash === '' || currentHash === '#home');

    // 【情境 A：播放動畫】
    // 條件：(沒看過動畫) AND (是首頁)
    if (isHomePage) {

        setTimeout(() => {
            logoBox.classList.add('show');

            setTimeout(() => {
                const lightImg = document.querySelector('.logo-img.light');
                const glow = document.querySelector('.window-glow');

                if (lightImg) lightImg.classList.add('start-glow');
                if (glow) glow.classList.add('start-glow');
            }, 300);

        }, 100);

        // 2. 建議調整順序：名字先出，標語後出
        setTimeout(() => { brandNameBox.classList.add('show'); }, 600);
        setTimeout(() => { slogan.classList.add('show'); }, 900);
        // 停留後開始飛行
        setTimeout(() => {
            brandContainer.classList.add('move-to-header');

            setTimeout(() => {
                document.body.classList.add('animation-done');
                loaderBg.classList.add('fade-out');

                setTimeout(() => {
                    brandContainer.classList.add('mission-complete');
                }, 50);

                setTimeout(() => {
                    loaderBg.style.display = 'none';
                    brandContainer.style.display = 'none';
                }, 800);

            }, 1000);

        }, 2000);

    } else {
        // 【情境 B：不播放動畫】
        // (不是首頁，例如直接進入 #login)

        // 1. 直接隱藏載入遮罩與 Logo，不讓使用者看到閃爍
        if (loaderBg) loaderBg.style.display = 'none';
        if (brandContainer) brandContainer.style.display = 'none';

        // 2. 為了讓 main.js 知道動畫環節已結束 (雖然沒播)，確保 Header 正常顯示
        // 我們直接加上完成的 class
        document.body.classList.add('animation-done');
    }
});