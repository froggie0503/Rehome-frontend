let overlay, spinner, successIcon, errorIcon, messageEl;
let timer = null;

function init() {
    if (overlay) return;

    overlay = document.getElementById('ui-overlay');
    if (!overlay) {
        console.error('[uiOverlay] #ui-overlay not found');
        return;
    }

    spinner = overlay.querySelector('.spinner');
    successIcon = overlay.querySelector('.icon.success');
    errorIcon = overlay.querySelector('.icon.error');
    messageEl = overlay.querySelector('.message');
}

function reset() {
    clearTimeout(timer);
    overlay.querySelector('.overlay-box').className = 'overlay-box';
    spinner.style.display = 'none';
    successIcon.style.display = 'none';
    errorIcon.style.display = 'none';
    messageEl.textContent = '';
}

function show() {
    overlay.classList.remove('hidden');
}

function hide() {
    overlay.classList.add('hidden');
}

export const uiOverlay = {

    loading(message = '處理中...') {
        init();
        if (!overlay) return;

        reset();
        overlay.querySelector('.overlay-box').classList.add('loading');
        spinner.style.display = 'block';
        messageEl.textContent = message;
        show();
    },

    success(message = '成功', { duration = 1200, onClose } = {}) {
        init();
        if (!overlay) return;

        reset();
        const box = overlay.querySelector('.overlay-box');
        box.classList.add('success');

        successIcon.style.display = 'block';
        messageEl.textContent = message;
        show();

        timer = setTimeout(() => {
            hide();
            if (typeof onClose === 'function') onClose();
        }, duration);
    },

    error(message = '失敗', { duration = 1500 } = {}) {
        init();
        if (!overlay) return;

        reset();
        const box = overlay.querySelector('.overlay-box');
        box.classList.add('error');

        errorIcon.style.display = 'block';
        messageEl.textContent = message;
        show();

        timer = setTimeout(hide, duration);
    },

    close() {
        if (!overlay) return;
        reset();
        hide();
    }
};
