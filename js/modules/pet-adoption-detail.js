// -------------------------
import { ajaxApi, fetchWithAuth, AuthManager, calculateAgeUsingDiff } from '/js/utils/helper.js';
import petCard, {
    renderBanner,
    parseCaseDetail,
    renderDetail,
    updatePreviewMap,
    favoriteListener
} from './petCard/component.js';
import { uiOverlay } from '/js/utils/uiOverlay.js';

// ----------------------------------------------------------------
// 詳細單頁使用變數
let adoptionDetail_imgList = [];

async function loadModalQuestions() {
    const response = await fetchWithAuth(`/api/survey/adoption`, {
            method: 'GET'
        }
    );
    const result = await response.json();
    if (result.success) {
        console.log(result.message);

        adoptionDetail__renderModal(result.data.questions)
    } else {
        alert(result.message);
    }
}

async function loadModalBasicInfo() {
    const memberId = AuthManager.getPayload().sub;
    const response = await fetchWithAuth(`/api/mem/profile?memberId=` + memberId, {
        method: 'GET'
    });
    const result = await response.json();
    if (result.success) {
        console.log(result.message);

        $('#info_name').val(result.data.nickName || result.data.name);
        $('#info_gender').val(result.data.gender ? '男' : '女');
        $('#info_age').val(calculateAgeUsingDiff(result.data.birthDate));
        $('#info_phone').val(result.data.phone);
        // $('#info_address').val('');
    } else {
        alert(result.message);
    }
}

function adoptionDetail_adoptionModalListener() {
    // 監聽 Modal **開始顯示** 的事件 (動畫開始前)
    $('#adopt_question').on('show.bs.modal', function (e) {
        if (!AuthManager.getToken()) {
            e.preventDefault();
            showCustomAlert('系統提示', '此功能需要登入後才能使用，請先登入。', 1000);
            return false;
        }
        $(this).find('input, select').val('');
    });

    // 監聽 Modal **完全顯示** 的事件 (動畫結束 後，Modal 穩定)
    $('#adopt_question').on('shown.bs.modal', async function (event) {


        loadModalBasicInfo();
        loadModalQuestions();
        // 可以在這裡設定焦點
        // $('#info_marital').focus(); 
    });

    $('#adopt_question').on('click', '.question-btn', async function () {
        const marital = $('#info_marital').val();
        const employment = $('#info_employment').val();
        
        let questions = [];

        $('#adopt_question').find('.collapse > textarea').each((index, item) => {
            const text = $(item).val().trim();
            if (text) {
                questions.push({
                    questionId: $(item).data('id'),
                    answer: text
                });
            } else {
                questions = [];
                alert('請填寫完所有問卷');
                $(item).focus();
                return false;
            }
        });
        
        if (marital && employment && questions.length > 0) {   
            uiOverlay.loading();

            const response = await fetchWithAuth(`/api/members/adoption/applications`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        caseNumber: getCaseNumberFromHash(),
                        maritalStatus: $('#info_marital').val(),
                        employmentStatus: $('#info_employment').val(),
                        questions: questions
                    })
                }
            );
            const result = await response.json();
            if (result.success) {
                uiOverlay.success('送出成功', {
                    duration: 1200,
                    onClose: () => {
                        $('#adopt_question').modal('hide');
                    }
                });
            } else {
                uiOverlay.error("送出失敗");
            }
        } else if (!marital) {
            $('#info_marital').focus();
        } else if (!employment) {
            $('#info_employment').focus();
        }
    });
}

// 載入問卷
function adoptionDetail__renderModal(questionList) {
    $('#question_wrapper').empty();
    questionList.forEach(item => {
        $('#question_wrapper').append(`
            <div class="mb-2">
                <a href="#question_textarea_${item.id}" data-bs-toggle="collapse"
                    class="d-flex align-items-center justify-content-between p-3 fw-bold question-trigger"
                    aria-expanded="true" aria-controls="question_textarea_${item.id}" role="button">

                    <div class="question-text">${item.question}</div>

                    <i class="icon-toggle bi bi-chevron-up"></i>
                </a>

                <div id="question_textarea_${item.id}" class="collapse show">
                    <textarea class="form-control" rows="5" placeholder="範例：......" name="question_textarea_${item.id}" data-id="${item.id}" required></textarea>
                </div>
            </div>
        `);
    })
}

function adoptionDetail_missingPost() {
    $('#missing_post').on('click', '.missing-post-btn', async function (e) {
        uiOverlay.loading();

        if ($('#missing_post_textarea').val().trim()) {
            ajaxApi('members/missing/applications', 'POST', {
                caseNumber: getCaseNumberFromHash(),
                message: $('#missing_post_textarea').val().trim()
            }).done(result => {
                console.log(result);
                if (result.success) {
                    uiOverlay.success('送出成功', {
                        duration: 1200,
                        onClose: () => {
                            $('#missing_post').modal('hide');
                            $('#missing_post_textarea').val('');
                        }
                    });
                } else {
                    uiOverlay.error("送出失敗");
                }
            }).fail(err => {
                uiOverlay.error("送出失敗");
            });
        }
    });
}

// 監聽 按鈕切換圖片
function adoptionDetail_carouselImgListener() {
    $('#detail_carousel_img').on('click', '#carousel_img_prev', function (e) {
        e.preventDefault;

        let lastImg = adoptionDetail_imgList.shift();
        adoptionDetail_imgList.push(lastImg);

        $('#detail_main_img').prop('src', adoptionDetail_imgList[0]);
        $('#detail_carousel_img').find('.img-customer').each(function (index, value) {
            $(value).prop('src', adoptionDetail_imgList[index + 1]);
        });
    });

    $('#detail_carousel_img').on('click', '#carousel_img_next', function (e) {
        e.preventDefault;

        let lastImg = adoptionDetail_imgList.pop();
        adoptionDetail_imgList.unshift(lastImg);

        $('#detail_main_img').prop('src', adoptionDetail_imgList[0]);
        $('#detail_carousel_img').find('.img-customer').each(function (index, value) {
            $(value).prop('src', adoptionDetail_imgList[index + 1]);
        });
    });
}

function adoptionDetail_scrollToMapListener() {
    $('.scroll-to-map-btn').on('click', function (e) {
        e.preventDefault();

        // 獲取目標區塊距離頂部的距離 (offset().top)
        const targetPosition = $('#previewMapContainer').offset().top;

        // 使用 $('html, body').animate() 執行平滑捲動
        // 捲動目標：$('html, body')
        // 捲動參數：scrollTop: targetPosition (捲到目標位置)
        // 捲動時間：1000 毫秒 (1 秒)
        $('html, body').animate({
            scrollTop: targetPosition
        }, 100); // 您可以調整這個數值來控制捲動速度
    });
}

// 解析 hash + query string 拿到案件編號
function getCaseNumberFromHash() {
    // #pet-adoption-detail?casenumber=SY202511010021
    const hash = window.location.hash;
    const parts = hash.split('?');
    if (parts.length < 2) window.location.href = '';

    const queryString = parts[1];
    const params = new URLSearchParams(queryString);
    return params.get('casenumber');
}

function setShareBtnUrl(target) {
    const currentUrl = window.location.href;
    const encodedUrl = encodeURIComponent(currentUrl);    // 進行編碼
    let shareUrl = '';

    switch (target) {
        case 'facebook':
            shareUrl = 'https://www.facebook.com/sharer/sharer.php?u=' + encodedUrl;
            break;
        case 'line':
            shareUrl = 'https://social-plugins.line.me/lineit/share?url=' + encodedUrl;
            break;
        case 'twitter-x':
            shareUrl = 'https://twitter.com/intent/tweet?url=' + encodedUrl;
            break;

        default:
            break;
    }

    const targetBtn = '.' + target + '-btn';
    $('#adoption_detail_main .share-btn-wrapper ' + targetBtn).prop('href', shareUrl);

}

async function loadCasePage(isAdoption, isAdmin) {
    const response = await fetchWithAuth(`/api/cases/${isAdmin ? 'admin/' : ''}` + getCaseNumberFromHash(), {
            method: 'GET'
        }
    );
    const result = await response.json();
    if (result.success) {
        // render banner (shared)
        renderBanner(
            '#adoption_detail .custom-title-wrapper',
            isAdoption,
            true,
            result.data.caseInfo.isMissing
                ? 'missing'
                : (result.data.caseInfo.isPublic ? 'shelter' : 'private')
        );

        // 設定分享網址
        setShareBtnUrl('facebook');
        setShareBtnUrl('line');
        setShareBtnUrl('twitter-x');

        // 使用 petCard 的解析與渲染
        const parsed = parseCaseDetail(result.data);
        console.log(parsed);

        const images = renderDetail(parsed);
        adoptionDetail_imgList = images;

        $('#skeleton').remove();
        $('#adoption_detail .title-container').removeClass('d-none');
        $('#adoption_detail_main .share-btn-wrapper').removeClass('d-none');
        $('#adoption_detail_main .publish-date').removeClass('d-none');
        $('#adoption_detail_main .detail-content').removeClass('d-none');

        // 如果回傳有座標，更新預覽地圖（lat,lng）
        if (parsed && parsed.isMissing && parsed.lostDetail) {
            updatePreviewMap(parsed.lostDetail.lat, parsed.lostDetail.lng);
            adoptionDetail_scrollToMapListener();
            adoptionDetail_missingPost();
        }

        if (parsed && !parsed.isMissing && !parsed.isPublic) {
            adoptionDetail_adoptionModalListener();
        }
    }
}

// 初始化葉面
export function init() {    
    const currentHash = window.location.hash.split('?')[0] || '';
    const isAdmin = currentHash.includes('admin');
    const isAdoption = currentHash.includes('adoption');

    loadCasePage(isAdoption, isAdmin);
    favoriteListener('#detail_content_favorite', getCaseNumberFromHash());
    adoptionDetail_carouselImgListener();
}
