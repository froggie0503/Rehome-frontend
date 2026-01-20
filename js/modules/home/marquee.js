
// ====================================================================
// index.js (毛孩領養) 內容
// ====================================================================

// ========== 全域變數 - index ==========
let index_isDragging = false;
let index_isHovering = false;
let index_startX = 0;
let index_currentX = 0;
let index_maxScroll = 0;
let index_autoScrollTimer = null;
let index_lastTime = 0;
const INDEX_SCROLL_SPEED = 0.6;

// ========== 初始化 - index_initMarquee ==========
export function index_initMarquee() {
    const wrapper = document.getElementById("index_marqueeWrapper");
    const track = document.getElementById("index_marqueeTrack");
    const scrollBar = document.getElementById("index_scrollBar");

    const originalContent = track.innerHTML;
    index_maxScroll = track.scrollWidth;

    track.innerHTML += originalContent;

    // --- ScrollBar Control ---
    scrollBar.addEventListener("input", function () {
        track.style.transition = "transform 0.15s ease-out";
        const percent = this.value / 100;
        const moveX = -percent * index_maxScroll;
        index_currentX = moveX;
        track.style.transform = `translateX(${moveX}px)`;
    });

    // --- Enable interactions ---
    index_enableDrag(wrapper, track);
    index_enableTouch(wrapper, track);

    // --- Auto scrolling ---
    index_startAutoScroll(track);

    // 🚀 Hover 控制
    wrapper.addEventListener("mouseenter", () => {
        index_isHovering = true;
        index_stopAutoScroll();
    });
    wrapper.addEventListener("mouseleave", () => {
        index_isHovering = false;
        index_startAutoScroll(track);
    });
}

// ========== 自動輪播 - index_startAutoScroll ==========
function index_startAutoScroll(track) {
    if (index_isDragging || index_isHovering) {
        return;
    }

    index_stopAutoScroll();

    track.style.transition = "";

    index_lastTime = performance.now();

    function animate(currentTime) {
        const dt = currentTime - index_lastTime;
        index_lastTime = currentTime;

        if (index_isDragging || index_isHovering) {
            index_stopAutoScroll();
            return;
        }

        if (dt > 0) {
            const movement = (INDEX_SCROLL_SPEED / 16) * dt;
            index_currentX -= movement;
        }

        if (Math.abs(index_currentX) >= index_maxScroll) {
            track.style.transition = "none";
            index_currentX = 0;
            track.style.transform = `translateX(${index_currentX}px)`;
            track.offsetWidth;
            track.style.transition = "";
        }

        track.style.transform = `translateX(${index_currentX}px)`;

        const percent = Math.abs(index_currentX) / index_maxScroll * 100;
        document.getElementById("index_scrollBar").value = percent;

        index_autoScrollTimer = requestAnimationFrame(animate);
    }

    index_autoScrollTimer = requestAnimationFrame(animate);
}

function index_stopAutoScroll() {
    cancelAnimationFrame(index_autoScrollTimer);
    index_autoScrollTimer = null;
    index_lastTime = 0;
}

// ========== 滑鼠拖動 - index_enableDrag ==========
function index_enableDrag(wrapper, track) {
    wrapper.addEventListener("mousedown", (e) => {
        index_isDragging = true;
        index_startX = e.pageX;
        track.style.transition = "none";
        index_stopAutoScroll();
    });

    document.addEventListener("mouseup", () => {
        index_isDragging = false;
        track.style.transition = "transform 0.3s ease-out";
    });

    document.addEventListener("mousemove", (e) => {
        if (!index_isDragging) return;
        let delta = e.pageX - index_startX;
        index_startX = e.pageX;

        index_updatePosition(track, delta);
    });
}

// ========== 手機觸控 - index_enableTouch ========== 
export function index_enableTouch(wrapper, track) {
    wrapper.addEventListener("touchstart", (e) => {
        index_isDragging = true;
        index_startX = e.touches[0].clientX;
        track.style.transition = "none";
        index_stopAutoScroll();
    });

    wrapper.addEventListener("touchend", () => {
        index_isDragging = false;
        track.style.transition = "transform 0.3s ease-out";
    });

    wrapper.addEventListener("touchmove", (e) => {
        if (!index_isDragging) return;
        let delta = e.touches[0].clientX - index_startX;
        index_startX = e.touches[0].clientX;

        index_updatePosition(track, delta);
    });
}

// ========== 通用位置更新 - index_updatePosition ==========
export function index_updatePosition(track, delta) {
    index_currentX += delta;
    let jumped = false;

    if (index_currentX <= -index_maxScroll) {
        track.style.transition = "none";
        index_currentX = 0;
        jumped = true;
    }
    if (index_currentX >= 0) {
        track.style.transition = "none";
        index_currentX = -index_maxScroll;
        jumped = true;
    }

    track.style.transform = `translateX(${index_currentX}px)`;

    const percent = Math.abs(index_currentX) / index_maxScroll * 100;
    document.getElementById("index_scrollBar").value = percent;

    if (jumped) {
        track.offsetWidth;
        track.style.transition = "transform 0.3s ease-out";
    }
}

// ====================================================================
// index_missing.js (走失協尋) 內容
// ====================================================================

// ========== 全域變數 - missing ==========
let missing_isDragging = false;
let missing_isHovering = false;
let missing_startX = 0;
let missing_currentX = 0;
let missing_maxScroll = 0;
let missing_autoScrollTimer = null;
let missing_lastTime = 0;
const MISSING_SCROLL_SPEED = 0.6;

// ========== 初始化 - missing_initMarquee ==========
export function missing_initMarquee() {
    const wrapper = document.getElementById("index_marqueeWrapper_missing");
    const track = document.getElementById("index_marqueeTrack_missing");
    const scrollBar = document.getElementById("index_scrollBar_missing");

    const originalContent = track.innerHTML;
    missing_maxScroll = track.scrollWidth;

    track.innerHTML += originalContent;

    // --- ScrollBar Control ---
    scrollBar.addEventListener("input", function () {
        track.style.transition = "transform 0.15s ease-out";
        const percent = this.value / 100;
        const moveX = -percent * missing_maxScroll;
        missing_currentX = moveX;
        track.style.transform = `translateX(${moveX}px)`;
    });

    // --- Enable interactions ---
    missing_enableDrag(wrapper, track);
    missing_enableTouch(wrapper, track);

    // --- Auto scrolling ---
    missing_startAutoScroll(track);

    // 🚀 Hover 控制
    wrapper.addEventListener("mouseenter", () => {
        missing_isHovering = true;
        missing_stopAutoScroll();
    });
    wrapper.addEventListener("mouseleave", () => {
        missing_isHovering = false;
        missing_startAutoScroll(track);
    });
}

// ========== 自動輪播 - missing_startAutoScroll ==========
export function missing_startAutoScroll(track) {
    if (missing_isDragging || missing_isHovering) {
        return;
    }

    missing_stopAutoScroll();
    track.style.transition = "";
    missing_lastTime = performance.now();

    function animate(currentTime) {
        const dt = currentTime - missing_lastTime;
        missing_lastTime = currentTime;

        if (missing_isDragging || missing_isHovering) {
            missing_stopAutoScroll();
            return;
        }

        if (dt > 0) {
            const movement = (MISSING_SCROLL_SPEED / 16) * dt;
            missing_currentX -= movement;
        }

        if (Math.abs(missing_currentX) >= missing_maxScroll) {
            track.style.transition = "none";
            missing_currentX = 0;
            track.style.transform = `translateX(${missing_currentX}px)`;
            track.offsetWidth;
            track.style.transition = "";
        }

        track.style.transform = `translateX(${missing_currentX}px)`;

        const percent = Math.abs(missing_currentX) / missing_maxScroll * 100;
        document.getElementById("index_scrollBar_missing").value = percent;

        missing_autoScrollTimer = requestAnimationFrame(animate);
    }

    missing_autoScrollTimer = requestAnimationFrame(animate);
}

// ========== 停止自動輪播 - missing_stopAutoScroll ==========
export function missing_stopAutoScroll() {
    cancelAnimationFrame(missing_autoScrollTimer);
    missing_autoScrollTimer = null;
    missing_lastTime = 0;
}

// ========== 滑鼠拖動 - missing_enableDrag ==========
export function missing_enableDrag(wrapper, track) {
    wrapper.addEventListener("mousedown", (e) => {
        missing_isDragging = true;
        missing_startX = e.pageX;
        track.style.transition = "none";
        missing_stopAutoScroll();
    });

    document.addEventListener("mouseup", () => {
        missing_isDragging = false;
        track.style.transition = "transform 0.3s ease-out";
    });

    document.addEventListener("mousemove", (e) => {
        if (!missing_isDragging) return;
        let delta = e.pageX - missing_startX;
        missing_startX = e.pageX;

        missing_updatePosition(track, delta);
    });
}

// ========== 手機觸控 - missing_enableTouch ==========
export function missing_enableTouch(wrapper, track) {
    wrapper.addEventListener("touchstart", (e) => {
        missing_isDragging = true;
        missing_startX = e.touches[0].clientX;
        track.style.transition = "none";
        missing_stopAutoScroll();
    });

    wrapper.addEventListener("touchend", () => {
        missing_isDragging = false;
        track.style.transition = "transform 0.3s ease-out";
    });

    wrapper.addEventListener("touchmove", (e) => {
        if (!missing_isDragging) return;
        let delta = e.touches[0].clientX - missing_startX;
        missing_startX = e.touches[0].clientX;

        missing_updatePosition(track, delta);
    });
}

// ========== 通用位置更新 - missing_updatePosition ==========
export function missing_updatePosition(track, delta) {
    missing_currentX += delta;
    let jumped = false;

    if (missing_currentX <= -missing_maxScroll) {
        track.style.transition = "none";
        missing_currentX = 0;
        jumped = true;
    }
    if (missing_currentX >= 0) {
        track.style.transition = "none";
        missing_currentX = -missing_maxScroll;
        jumped = true;
    }

    track.style.transform = `translateX(${missing_currentX}px)`;

    const percent = Math.abs(missing_currentX) / missing_maxScroll * 100;
    document.getElementById("index_scrollBar_missing").value = percent;

    if (jumped) {
        track.offsetWidth;
        track.style.transition = "transform 0.3s ease-out";
    }
}


// ====================================================================
// Start - 確保兩個跑馬燈都在 DOM 載入完成後啟動
// ====================================================================
// 啟動 毛孩領養 (index) 跑馬燈
index_initMarquee();

// 啟動 走失協尋 (missing) 跑馬燈
missing_initMarquee();

