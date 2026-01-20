// --- 1. 路由對應表 (ROUTE_MAP) ---
// 將 URL hash 對應到 HTML 內容檔案和對應的 JS 模組檔案
const ROUTE_MAP = {
    '': { contentFile: 'content/home.html', moduleJS: 'js/modules/home/index.js', requiresAuth: false }, // 預設首頁
    '#home': { contentFile: 'content/home.html', moduleJS: 'js/modules/home/index.js', requiresAuth: false },
    '#pet-adoption-list': { contentFile: 'content/pet-adoption-list.html', moduleJS: 'js/modules/pet-adoption-list.js', requiresAuth: false },
    '#pet-adoption-detail': { contentFile: 'content/pet-adoption-detail.html', moduleJS: 'js/modules/pet-adoption-detail.js', requiresAuth: false },
    '#pet-missing-list': { contentFile: 'content/pet-adoption-list.html', moduleJS: 'js/modules/pet-adoption-list.js', requiresAuth: false },
    '#pet-missing-detail': { contentFile: 'content/pet-adoption-detail.html', moduleJS: 'js/modules/pet-adoption-detail.js', requiresAuth: false },
    '#pet-admin-adoption-detail': { contentFile: 'content/pet-adoption-detail.html', moduleJS: 'js/modules/pet-adoption-detail.js', requiresAuth: true },
    '#pet-admin-missing-detail': { contentFile: 'content/pet-adoption-detail.html', moduleJS: 'js/modules/pet-adoption-detail.js', requiresAuth: true },
    '#missing_publish_1': { contentFile: 'content/missing_publish_1.html', moduleJS: 'js/modules/missing_publish_1_main.js', requiresAuth: true },
    '#missing_publish_2': { contentFile: 'content/missing_publish_2.html', moduleJS: 'js/modules/missing_publish_2.js', requiresAuth: true },
    '#missing_publish_result': { contentFile: 'content/missing_publish_result.html', moduleJS: 'js/modules/missing_publish_result.js', requiresAuth: true },
    '#qna': { contentFile: 'content/qna.html', moduleJS: 'js/modules/qna.js', requiresAuth: false },
    '#register': { contentFile: 'content/register.html', moduleJS: null, requiresAuth: false },
    '#login': { contentFile: 'content/login_form.html', moduleJS: 'js/modules/memlogin.js', requiresAuth: false },
    '#resetpassword': { contentFile: 'content/repasswd.html', moduleJS: 'js/modules/resetpassword.js', requiresAuth: false },
    '#member': { contentFile: 'content/memcenter.html', moduleJS: 'js/modules/memcenter.js', requiresAuth: true }, 
    '#adoption-review': { contentFile: 'content/adoption-review.html', moduleJS: 'js/modules/adoption-review.js', requiresAuth: true },
    '#pet-inf': { contentFile: 'content/pet-Inf.html', moduleJS: 'js/modules/petinf.js', requiresAuth: true },
    '#pet-inf-con': { contentFile: 'content/pet-inf-con.html', moduleJS: 'js/modules/petinfcon.js', requiresAuth: true },
    '#review-successful': { contentFile: 'content/review-successful.html', moduleJS: 'js/modules/review-successful.js', requiresAuth: true },
    '#review-failed': { contentFile: 'content/review-failed.html', moduleJS: 'js/modules/review-failed.js', requiresAuth: true }
};
