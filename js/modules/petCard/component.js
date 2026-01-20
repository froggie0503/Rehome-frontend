import {
    sizeMap,
    ageMap,
    genderMap,
    dataTypeList,
    formatDate,
    fetchWithAuth,
    AuthManager
} from '../../utils/helper.js';

// 共用 petCard 元件模組
export function renderSelectors(isAdoption) {
    const selectorsDom = $('#adoption_search .dropdown-group #adoption_selectors');
    selectorsDom.empty();

    const visibleMainSelectors = ['region', 'species']; // 小屏幕顯示的
    const visibleTabletSelectors = isAdoption ? // 平板以上顯示的
        ['region', 'source', 'shelter', 'species', 'gender'] :
        ['region', 'species', 'gender', 'body_size'];

    // 判斷是否在平板以上（768px）
    const isTabletOrAbove = window.matchMedia('(min-width: 768px)').matches;

    let mainSelectorsHtml = '';
    let moreItemsHtml = '';

    Object.entries(dataTypeList).forEach(([key, label]) => {
        const selectorHtml = `
            <div class="dropdown d-inline-block me-1 selectors-dropdown" id="adoption_selectors_${key}" data-group="${key}">
                <button class="btn dropdown-toggle" type="button" id="adoption_selectors_${key}_btn"
                    data-bs-toggle="dropdown" aria-expanded="false" data-bs-auto-close="outside">
                    ${label}
                </button>
                <ul class="dropdown-menu" aria-labelledby="adoption_selectors_${key}_btn">
                    <div class="menu-scroll">
                        <!-- 動態生成 -->
                    </div>
                </ul>
            </div>
        `;

        // 判斷是主選擇器還是更多選擇器
        const isMainSelector = visibleMainSelectors.includes(key);
        const isTabletSelector = visibleTabletSelectors.includes(key) && !visibleMainSelectors.includes(key);

        if (isMainSelector) {
            mainSelectorsHtml += selectorHtml;
        } else if (isTabletSelector && isTabletOrAbove) {
            // 平板以上時，在主區域顯示
            mainSelectorsHtml += selectorHtml;
        } else {
            // 其他的放在更多下拉菜單
            const moreItemHtml = `
                <li class="dropdown-submenu ms-2 selectors-dropdown" id="adoption_selectors_${key}" data-group="${key}">
                    <button class="dropdown-item">${label}</button>
                    <ul class="dropdown-menu">
                        <div class="menu-scroll">
                            <!-- 動態生成 -->
                        </div>
                    </ul>
                </li>
            `;
            moreItemsHtml += moreItemHtml;
        }
    });

    // 構建更多...下拉菜單
    const moreSelectorsHtml = `
        <div class="dropdown d-inline-block me-1">
            <button class="btn dropdown-toggle" type="button" id="adoption_selectors_more_btn"
                data-bs-toggle="dropdown" aria-expanded="false" data-bs-auto-close="outside">
                更多...
            </button>
            <ul class="dropdown-menu" aria-labelledby="adoption_selectors_more_btn">
                <div class="menu-scroll text-center">
                    ${moreItemsHtml}
                </div>
            </ul>
        </div>
    `;

    selectorsDom.html(mainSelectorsHtml + moreSelectorsHtml);
}

// 填充 checkbox 選項
export function populateCheckboxSelectors(dropdownSelector, list, checkboxClass = "form-check-input me-1") {
    const dropdown = $(dropdownSelector + ' .menu-scroll');
    dropdown.empty();
    list.forEach(item => {
        dropdown.append(`
            <li class="ms-2">
                <label class="dropdown-item">
                    <input class="${checkboxClass}" type="checkbox" value="${item.id}">
                    ${item.name}
                </label>
            </li>
        `);
    });
}

// 填充 radio 選項
export function populateRadioSelectors(dropdownSelector, list, radioClass = "form-check-input me-2 ms-2") {
    const dropdown = $(dropdownSelector + ' .menu-scroll');
    dropdown.empty();
    list.forEach(item => {
        dropdown.append(`
            <li class="ms-2">
                <label class="dropdown-item">
                    <input class="${radioClass}" type="radio" name="${dropdownSelector + '_radio'}" value="${item.id}">
                    ${item.name}
                </label>
            </li>
        `);
    });
}

export function renderSkeleton(targetSelector = '#adoption-list') {
    const adoptionList = $(targetSelector);
    adoptionList.empty();

    // 產生 6 個假卡片
    for (let i = 0; i < 12; i++) {
        adoptionList.append(`
            <div class="col-md-6 col-lg-4 col-xxl-3 mb-4">
                <div class="card shadow border-0">
                    <div class="card-header-customer px-3 pt-3 position-relative">
                        <div class="sk-tag skeleton-box"></div>
                        <div class="card-img-wrapper">
                            <div class="sk-img skeleton-box"></div>
                        </div>
                    </div>
                    <div class="card-body">
                        <div class="text-end mb-3">
                            <div class="sk-title skeleton-box"></div>
                        </div>
                        <div class="sk-text skeleton-box"></div>
                        <div class="sk-text skeleton-box"></div>
                        <div class="sk-text skeleton-box" style="width: 50%"></div>
                    </div>
                </div>
            </div>
        `);
    }
}

export function renderCardList(result, targetSelector = '#adoption-list', isAdoption = true) {
    const adoptionList = $(targetSelector);
    adoptionList.empty();

    if (!result || !result.data || !Array.isArray(result.data.content)) {
        adoptionList.html('<div class="text-center">無資料</div>');
        return;
    }

    result.data.content.forEach(data => {
        const hintGif = isAdoption && data.isPublic ? '../assets/img/material/click_red.gif' : '../assets/img/material/click_yellow.gif';
        const imageSrc = data.photo ? 'data:image/png;base64,' + data.photo 
            : (data.photoUrl || '../assets/img/logo/Logo.png');
        adoptionList.append(`
            <div class="col-md-6 col-lg-4 col-xxl-3 mb-4">
                <div class="card shadow" data-casenumber="${data.caseNumber}" data-id="${data.id}">
                    <div class="card-header-customer px-3 pt-3">
                        <div class="card-img-wrapper">
                            <img src="${imageSrc}" class="card-img-customer">
                        </div>
                        <div>
                            <button class="btn favorite-btn"><i class="bi bi-suit-heart${data.isFavorites ? '-fill text-danger' : ''}"></i></button>
                        </div>
                        ${isAdoption ?
                            (data.isPublic ? '<div class="public-Adoption">公立 <i class="bi bi-building"></i></div>' : '<div class="private-Adoption">個人 <i class="bi bi-house"></i></div>')
                            : ('')
                        }
                        <div>
                            ${isAdoption ? (data.isOpen ? '<div class="pet-status fw-bold">開放認養中</div>' : '<div class="pet-status fw-bold status-match">領養媒合中</div>') : ''}
                        </div>
                    </div>

                    <div class="card-body">
                        <div class="mb-3">
                            <div class="d-flex align-items-center">
                                <span class="card-title fw-bold d-inline-block text-truncate" title="${data.petName}">${data.petName}</span>
                            </div>
                        </div>


                        <div class="card-text position-relative mb-3">
                            ${
                                isAdoption ? 
                                    (
                                        '<div class="card-text-line"><i class="fa-solid fa-paw"></i><strong>' + data.species + ' | ' + data.breed + ' | ' + (sizeMap[data.size] || data.size) + '</strong></div>' +
                                        '<div class="card-text-line"><i class="bi bi-geo-alt"></i><strong>' + data.region + '</strong></div>'
                                    ) : (
                                        '<div class="card-text-line"><i class="bi bi-geo-alt"></i><strong>走失地: ' + data.lostRegion + '</strong></div>' +
                                        '<div class="card-text-line"><i class="bi bi-clock-history"></i><strong>' + formatDate(data.lostDate) + '</strong></div>' +
                                        '<div class="card-text-line"><i class="fa-solid fa-paw"></i><strong>' + data.species + ' | ' + data.breed + '</strong></div>'
                                    )
                            }
                        </div>
                        <div class="public-date">
                            <span>
                                刊登日期: ${formatDate(data.caseDateStart)}
                            </span>
                        </div>
                        <img src="${hintGif}" class="click-hint-gif" alt="click hint">
                    </div>
                </div>
            </div>
        `);
    });
}

// 解析 detail API 回傳結構為前端使用的格式
export function parseCaseDetail(apiData) {
    const { caseInfo, caseContact, petInfo, detail } = apiData;

    return {
        caseNumber: caseInfo.caseNumber,
        postDate: formatDate(caseInfo.caseDateStart),
        isMissing: caseInfo.isMissing,
        isFavorites: caseInfo.isFavorites,
        isPublic: caseInfo.isPublic,
        isOpen: caseInfo.isOpen,
        photo: caseInfo.photo,
        // 預設 images fallback（detail API 可能包含多張圖）
        images: (caseInfo.photo && Array.isArray(caseInfo.photo)) ? caseInfo.photo : [caseInfo.photo || 'assets/img/adoption/private.png'],

        contact: {
            name: caseContact.name,
            tel: caseContact.tel,
            mail: caseContact.mail,
            addr: caseContact.addr
        },

        pet: {
            name: petInfo.petName,
            species: petInfo.species,
            breed: petInfo.breed,
            gender: genderMap[petInfo.gender],
            size: sizeMap[petInfo.size],
            age: ageMap[petInfo.age],
            color: petInfo.color,
            feature: petInfo.feature,
            isEarTipping: petInfo.isEarTipping ? '已結紮' : '未結紮',
            isChip: petInfo.isChip ? '有' : '無',
            chipNumber: petInfo.chipNumber,
            region: petInfo.region
        },

        description: detail.description || '無',
        adoptionDetail: detail.adoptionDetail || null,
        lostDetail: detail.lostDetail || null,
        shelterDetail: detail.shelterDetail || null
    };
}

// 在頁面上渲染 detail 資料（只負責 DOM 填值與回傳 images 陣列）
export function renderDetail(parsedData) {
    const images = parsedData.images && parsedData.images.length ? parsedData.images : ['assets/img/adoption/private.png'];

    // caseInfo
    if (parsedData.isMissing) {
        $('.publish-date-wrapper').html(`<span>走失日 ${formatDate(parsedData.lostDetail.lostDate)}</span>`);
    } else {
        $('.publish-date-wrapper').html(`<span>刊登日期 ${parsedData.postDate}</span>`);
    }

    // main image
    $('#detail_main_img').prop('src', images[0]);
    if (images.length > 1) {
        // 如果有 carousel，填入其餘圖片
        let imgHtml = '';
        for (let i = 1; i < images.length; i++) {
            imgHtml += `
                <li class="page-item col m-1">
                    <div class="img-wrapper my-4">
                        <img src="${images[i]}" class="img-customer">
                    </div>
                </li>
            `;
        }

        $('#detail_carousel_img').html(`
            <nav aria-label="page navigation">
                <ul class="pagination row justify-content-center align-items-center">
                    <li class="page-item col px-0 d-flex justify-content-center align-items-center">
                        <button class="page-link" aria-label="上一頁" id="carousel_img_prev">
                            <i class="bi bi-chevron-compact-left"></i>
                        </button>
                    </li>
                    ${imgHtml}
                    <li class="page-item col px-0 d-flex justify-content-center align-items-center">
                        <button class="page-link" aria-label="下一頁" id="carousel_img_next">
                            <i class="bi bi-chevron-compact-right"></i>
                        </button>
                    </li>
                </ul>
            </nav>
        `);

    } else {
        $('#detail_carousel_img').remove();
    }

    $('#detail_content_favorite').html(`
        <button class="btn favorite-btn"><i class="bi bi-suit-heart${parsedData.isFavorites ? '-fill text-danger' : ''}"></i></button>
    `);

    // 寵物資訊區塊
    if (parsedData.pet) {
        let contentHeaderHtml = '';
        let contentBodyHtml = '';
        // pet title
        contentHeaderHtml = `
            <div class="mb-3">
                <span class="content-title fw-bold">${parsedData.pet.name}</span>
            </div>
        `;
        // pet status
        if (!parsedData.isMissing) {
            contentHeaderHtml += `
                <div class="content-status">
                    <span class="pet-status fw-bold my-auto detail-status ${parsedData.isOpen ? '' : 'status-match'}">${parsedData.isOpen ? '開放認養中' : '領養媒合中'}</span>
                </div>
            `;
        } else {
            contentBodyHtml += `
                <div class="content-region p-3 mt-3 row">
                    <div class="col-10">
                        <div data-type="region">
                            <strong>走失地:</strong>
                            <span>${parsedData.lostDetail.lostRegion}</span>
                        </div>
                        <div data-type="adoptionAreas">
                            <strong>走失地標/街道:</strong>
                            <span>${parsedData.lostDetail.lostAddr}</span>
                        </div>
                    </div>

                    <div class="col d-flex justify-content-center align-items-center">
                        <button class="btn scroll-to-map-btn">
                            <i class="bi bi-geo-alt"></i>
                        </button>
                    </div>
                </div>
                <br>
            `;
        }
        // pet content
        contentBodyHtml += `
            <div>
                <strong>寵物物種:</strong>
                <span>${parsedData.pet.species}</span>
            </div>
            <div>
                <strong>寵物品種:</strong>
                <span>${parsedData.pet.breed}</span>
            </div>
            <div>
                <strong>寵物性別:</strong>
                <span>${parsedData.pet.gender}</span>
            </div>
        `;
        if (!parsedData.isMissing) {
            contentBodyHtml += `
                <div>
                    <strong>寵物體型:</strong>
                    <span>${parsedData.pet.size}</span>
                </div>
                <div>
                    <strong>寵物年紀:</strong>
                    <span>${parsedData.pet.age}</span>
                </div>
            `;
        }
        if (parsedData.isMissing || parsedData.isPublic) {
            contentBodyHtml += `
                <div>
                    <strong>外觀毛色:</strong>
                    <span>${parsedData.pet.color}</span>
                </div>  
        `;
        }
        if (parsedData.isMissing) {
            contentBodyHtml += `
                <div>
                    <strong>外觀特徵:</strong>
                    <span>${parsedData.pet.feature}</span>
                </div>
            `;
        }
        contentBodyHtml += `
            <br>
            <div>
                <strong>剪耳狀態:</strong>
                <span>${parsedData.pet.isEarTipping}</span>
            </div>
            <div>
                <strong>有無晶片:</strong>
                <span>${parsedData.pet.isChip}</span>
            </div>
        `;
        if (parsedData.pet.chipNumber) {
            contentBodyHtml += `
                <div>
                    <strong>晶片號碼:</strong>
                    <span>${parsedData.pet.chipNumber}</span>
                </div>
            `;
        }
        if (parsedData.isMissing) {
            contentBodyHtml += `
                <br><br>
                <div>
                    <strong>刊登日期:</strong>
                    <span>${parsedData.postDate}</span>
                </div>
            `;
        } else if (parsedData.isPublic) {
            contentBodyHtml += `
                <br>
                <div>
                    <strong>收容編號:</strong>
                    <span>${parsedData.caseNumber}</span>
                </div>
                <div>
                    <strong>入所日期:</strong>
                    <span>${parsedData.shelterDetail.entryDates}</span>
                </div>
                <div>
                    <strong>入所天數:</strong>
                    <span>${parsedData.shelterDetail.entryDays}</span>
                </div>
                <div>
                    <strong>來源行政區:</strong>
                    <span>${parsedData.shelterDetail.foundPlace || '無資訊'}</span>
                </div>
            `;
        } else {
            contentBodyHtml += `
                <div class="content-region p-3 mt-3 row">
                    <div class="col-12">
                        <div data-type="region">
                            <strong>所在地:</strong>
                            <span>${parsedData.pet.region}</span>
                        </div>
                        <div data-type="adoptionAreas">
                            <strong>可送養範圍:</strong>
                            <span>${parsedData.adoptionDetail.cityList.join(', ')}</span>
                        </div>
                    </div>
                </div>
            `;
        }

        $('#detail_content').html(`
            ${contentHeaderHtml}

            <div class="mt-3 content-body">
                ${contentBodyHtml}
            </div>    
        `);
    }

    // 聯絡人區塊
    if (parsedData.contact) {
        let contactHtml = '';
        let contactBtnHtml = '';
        if (parsedData.isMissing || !parsedData.isPublic) {
            contactHtml += parsedData.contact.name ? `
                <strong>
                    聯絡人：
                    <span>${parsedData.contact.name}</span>
                </strong>
            ` : '';
            contactHtml += parsedData.contact.tel ? `
                <br>
                <strong>
                    聯絡電話：
                    <span>${parsedData.contact.tel}</span>
                </strong>
            ` : '';
            contactHtml += parsedData.contact.mail ? `
                <br>
                <strong>
                    EMail：
                    <span>${parsedData.contact.mail}</span>
                </strong>
            ` : '';

            contactBtnHtml += parsedData.isMissing ? `
                <!-- Button trigger modal -->
                <button type="button" class="btn action-btn " data-bs-toggle="modal"
                    data-bs-target="#missing_post">
                    站內通報
                </button>` : `
                <!-- Button trigger modal -->
                <button type="button" class="btn action-btn" data-bs-toggle="modal"
                    data-bs-target="#adopt_question">
                    我要領養
                </button>
            `;
        } else {
            contactHtml += parsedData.contact.name ? `
                <strong>
                    收容所名稱：
                    <span>${parsedData.contact.name}</span>
                </strong>
            ` : '';
            contactHtml += parsedData.contact.addr ? `
                <br>
                <strong>
                    收容所地址：
                    <span>${parsedData.contact.addr}</span>
                </strong>
            ` : '';
            contactHtml += parsedData.contact.tel ? `
                <br>
                <strong>
                    聯絡電話：
                    <span>${parsedData.contact.tel}</span>
                </strong>
            ` : '';

            contactBtnHtml = `
                <button type="button" class="btn action-btn">
                    聯絡收容所
                </button>
            `
        }

        $('#detail_contact .contact').html(`
            <div class="col-lg-8">
                ${contactHtml}
            </div>

            <div class="col-lg-4 d-flex justify-content-end">
                ${contactBtnHtml}
            </div>
        `);

    }

    // 描述區塊
    let descriptionHtml = `
        <div class="description-body">
            <div class="description-title">
                <div class="px-4 py-1 text-center fw-bold description-title-wrapper">
                    <span>${parsedData.isMissing ? '遺失經過' : '領養說明'}</span>
                </div>
            </div>
            <div class="description-content p-4">
                <span>${parsedData.isMissing ? parsedData.lostDetail.lostProcess : parsedData.description}</span>
            </div>
        </div>
    `;

    if (parsedData.isMissing) {
        descriptionHtml += `
            <div class="description-body">
                <div class="description-title">
                    <div class="px-4 py-1 text-center fw-bold description-title-wrapper">
                        <span>其他備註事項</span>
                    </div>
                </div>
                <div class="description-content p-4">
                    <span>${parsedData.description}</span>
                </div>
            </div>
            <div class="description-body" data-type="lostLocation">
                <div class="description-title">
                    <div class="px-4 py-1 text-center fw-bold description-title-wrapper">
                        <span>詳細走失地點</span>
                    </div>
                </div>
                <div class="description-content p-4">
                    <div class="form-group full" id="previewMapContainer">
                        <div id="previewMap"
                            style="width: 100%; height: 50vh; border-radius: 10px; border: 2px solid #D5C8B8; margin: 0 auto;">
                        </div>
                    </div>
                </div>
            </div>
        `;
    } else if (!parsedData.isPublic && parsedData.adoptionDetail) {
        descriptionHtml += `
            <div class="description-body">
                <div class="description-title">
                    <div class="px-4 py-1 text-center fw-bold description-title-wrapper">
                        <span>醫療狀態說明</span>
                    </div>
                </div>
                <div class="description-content p-4">
                    <span>${parsedData.adoptionDetail.medicalInfo}</span>
                </div>
            </div>
            <div class="description-body">
                <div class="description-title">
                    <div class="px-4 py-1 text-center fw-bold description-title-wrapper">
                        <span>領養條件</span>
                    </div>
                </div>
                <div class="description-content p-4">
                    <div class="mb-3">
                        <span><i class="bi bi-${parsedData.adoptionDetail.isFollowAger ? 'check' : 'x'}-circle me-2"></i>需要同意接受後續追蹤</span><br>
                        <span><i class="bi bi-${parsedData.adoptionDetail.isFamilyAger ? 'check' : 'x'}-circle me-2"></i>需要家人同意</span><br>
                        <span><i class="bi bi-${parsedData.adoptionDetail.isAgeLimit ? 'check' : 'x'}-circle me-2"></i>需要年滿20歲</span>
                    </div>
                    <span>${parsedData.adoptionDetail.adoptionRequ}</span>
                </div>
            </div>
        `;
    }

    $('#detail_description').html(descriptionHtml);

    return images;
}

// 更新預覽地圖（若 Leaflet 尚未載入會重試）
export function updatePreviewMap(lat, lng) {
    if (typeof L === 'undefined') {
        console.warn("Leaflet (L) 尚未載入，稍後再試。");
        setTimeout(() => updatePreviewMap(lat, lng), 500);
        return;
    }

    const previewMapContainer = document.getElementById('previewMapContainer');
    if (!previewMapContainer) return;

    previewMapContainer.style.display = 'block';
    // 關鍵修改：檢查舊的地圖實例是否存在，並呼叫 remove() 方法
    if (window._petCard_previewMap) {
        // 銷毀舊的地圖實例，釋放資源並清除 DOM 中的地圖痕跡
        window._petCard_previewMap.remove();
        window._petCard_previewMap = null; // 清除引用
    }

    // 由於我們剛剛銷毀了舊的地圖，這裡會執行新的初始化
    if (!window._petCard_previewMap) {
        // 確保 'previewMap' 是您地圖容器的 ID
        window._petCard_previewMap = L.map('previewMap', {
            center: [lat, lng],
            zoom: 15,
            // 啟用地圖時如果容器隱藏，需要強制 Leaflet 重新計算大小
            // 不過通常在 map.remove() 之後重新 L.map() 就不需要
        });

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap'
        }).addTo(window._petCard_previewMap);

        // Marker 也應在每次重新初始化時重新建立
        window._petCard_previewMarker = L.marker([lat, lng], { interactive: false }).addTo(window._petCard_previewMap);
    }
}

// Banner rendering
export function renderBanner(targetSelector = '#adoption .custom-title-wrapper', isAdoption = true, isDetail = false, type) {
    const banner = $(targetSelector);
    if (!banner || banner.length === 0) return;
    let title = '';
    if (!isDetail) {
        title = isAdoption
            ? '給這些<span class="highlight-text" style="font-size: 48px">毛孩</span>一個家吧!'
            : '來幫助<span class="highlight-text" style="font-size: 48px">走失</span>的動物們回家吧!';
    } else {
        switch (type) {
            case 'missing':
                title = '聯絡<span class="highlight-text" style="font-size: 48px">失主</span>讓它回家!';
                break;
            case 'private':
                title = '聯絡<span class="highlight-text" style="font-size: 48px">個人</span>讓它回家!';
                break;
            case 'shelter':
                title = '聯絡<span class="highlight-text" style="font-size: 48px">收容所</span>讓它回家!';
                break;
        }
    }


    banner.html(`
        <img class=" title-left-img" src="../assets/img/page_hint/${isAdoption ? "bow" : "yarm_ball"}.png"></img>
        <h3 class="mx-3">
            ${title}
        </h3>
        <img class=" title-right-img" src="../assets/img/page_hint/house.png"></img>
        <img class=" title-right-img" src="../assets/img/page_hint/exclamation.png"></img>
    `);
}

// Bind search/reset/tags/limit/sort behaviors for list pages
export function bindSearchResetAndTagHandlers(dataTypeList, callbacks = {}) {
    const tagsDom = $('#search_criteria_tags');
    const selectorItemDom = $('#adoption_search .dropdown-group .dropdown .dropdown-menu');

    function tagCollapseBtnToggleClass(type = true) {
        if (type) {
            $('#search_criteria .tag-collapse-btn').removeClass('d-none');
        } else {
            $('#search_criteria .tag-collapse-btn').addClass('d-none');
        }
    }

    // selectors item change -> rebuild tags
    $(selectorItemDom).on('change', 'input[type="radio"], input[type="checkbox"]', function (e) {
        e.preventDefault();
        let data_type = $(this).closest('.selectors-dropdown').data('group');

        // 如果來源 選到公立 顯示收容所選項
        if (data_type == 'source') {
            if ($(this).parent().text().trim() == '公立') {
                $('#adoption_selectors_shelter').removeClass('d-none');
            } else if ($(this).parent().text().trim() == '個人') {
                $('#adoption_selectors_shelter').addClass('d-none');

                // 刪除公立收容所選項
                $(selectorItemDom).find('.form-check-input:checked').each(function (index, element) {
                    let text = $(element).parent().text().trim();

                    $(tagsDom).find('.tag-group[data-group="shelter"]').children().each(function (ind, ele) {
                        if (text == $(ele).text().trim()) {
                            $(element).prop('checked', false);
                            $(ele).remove();
                        }
                    });
                });
            }
        }

        let tagGroups = {};
        $(selectorItemDom).find('.form-check-input:checked').each(function (index, element) {
            let text = $(element).parent().text().trim();
            let type = $(element).closest('.selectors-dropdown').data('group');
            if (!tagGroups[type]) tagGroups[type] = [];
            tagGroups[type].push(text);
        });
        console.log(tagGroups);


        tagsDom.empty();
        $.each(tagGroups, function (index, value) {
            let tagsHtml = value.map(t => `<button class="btn search-tag-btn fw-bold my-1">${t} <i class="bi bi-x-lg"></i></button>`).join(' ');
            tagsDom.append(`
                <div class="tag-group" data-group="${index}">
                    <span class="tag-group-title fw-bold me-3">${dataTypeList[index]}:</span>
                    ${tagsHtml}
                </div>
            `);
        });

        if ($(tagsDom).innerHeight() > 135) {
            tagCollapseBtnToggleClass();
        } else {
            tagCollapseBtnToggleClass(false);
        }
    });

    // tag cancel
    $(tagsDom).on('click', '.search-tag-btn', function (e) {
        e.preventDefault();
        let tagText = $(e.currentTarget).text().trim();

        let tagGroupDom = $(e.currentTarget).closest('.tag-group');
        if ($(tagGroupDom).data('group') == 'source' && tagText == '公立') {
            $('#adoption_selectors_shelter').addClass('d-none');
            $(selectorItemDom).closest('.selectors-dropdown[data-group="shelter"]').find('.form-check-input:checked').each(function (index, element) {
                $(element).prop('checked', false);
            });
            $(tagsDom).find('.tag-group[data-group="shelter"]').remove();
        }

        $(selectorItemDom).find('.form-check-input').each(function (index, element) {
            let text = $(element).parent().text().trim();
            if (text === tagText) {
                $(element).prop('checked', false);
            }
        });
        $(e.currentTarget).remove();

        if ($(tagGroupDom).children().length < 2) {
            $(tagGroupDom).remove();
        }

        if ($(tagsDom).innerHeight() > 135) {
            tagCollapseBtnToggleClass();
        } else {
            tagCollapseBtnToggleClass(false);
        }
    });

    // reset
    $('#adoption_search .dropdown-group').on('click', '.reset-btn', function (e) {
        e.preventDefault();
        $('#adoption_search .search-keyword').val('');

        $(selectorItemDom).find('.form-check-input:checked').each(function (index, element) {
            $(element).prop('checked', false);
        });

        $(tagsDom).empty();

        tagCollapseBtnToggleClass(false);

        if (typeof callbacks.onReset === 'function') callbacks.onReset();
    });

    // search
    $('#adoption_search .dropdown-group').on('click', '.search-btn', function (e) {
        e.preventDefault();
        if (typeof callbacks.onSearch === 'function') callbacks.onSearch();
    });

    // limit / sort change
    $('#search_criteria_page_limit').on('change', 'input[type="radio"]', function (e) {
        e.preventDefault();
        $('#search_criteria_page_limit #search_criteria_page_limit_btn').text($(this).parent().text().trim());
        if (typeof callbacks.onLimitChange === 'function') callbacks.onLimitChange();
    });

    $('#search_criteria_sort').on('change', 'input[type="radio"]', function (e) {
        e.preventDefault();
        $('#search_criteria_sort #search_criteria_sort_btn').text($(this).parent().text().trim());
        if (typeof callbacks.onSortChange === 'function') callbacks.onSortChange();
    });
}

// 取得多選值
export function getMultiSelect(dropdownSelector) {
    return $(dropdownSelector + ' .dropdown-menu').find('.form-check-input:checked')
        .map(function () {
            return $(this).val();
        }).get();
}

// 取得單一值（radio 或 single checkbox）
export function getSingleSelect(dropdownSelector, defaultValue = '0') {
    return $(dropdownSelector + ' .dropdown-menu').find('.form-check-input:checked').val() || defaultValue;
}

// 解析搜尋表單（以 pet-adoption-list.html 的 selector 命名為基準）
export function getSearchFormAndParse(pageNumber = 1, isAdoption = true) {
    const keywords = $('#adoption_search .search-keyword').val().trim();
    const cities = getMultiSelect('#adoption_selectors_region');
    const source = getSingleSelect('#adoption_selectors_source');
    const shelters = getMultiSelect('#adoption_selectors_shelter');
    const species = getMultiSelect('#adoption_selectors_species');
    const gender = getSingleSelect('#adoption_selectors_gender', '');
    const bodySize = getMultiSelect('#adoption_selectors_body_size');
    const ages = getMultiSelect('#adoption_selectors_age');
    const status = getSingleSelect('#adoption_selectors_status');
    const neuteredStatus = getSingleSelect('#adoption_selectors_neutered_status');
    const hasChip = getSingleSelect('#adoption_selectors_has_chip');
    const adoptionAreas = getMultiSelect('#adoption_selectors_adoption_area');
    const limit = getSingleSelect('#search_criteria_page_limit', '12');
    const sortOrder = getSingleSelect('#search_criteria_sort', 'desc');

    return {
        "filters": {
            "keyword": keywords,
            "cities": cities,
            "source": isAdoption ? source : null,
            "shelters": isAdoption ? shelters : null,
            "species": species,
            "gender": gender,
            "sizes": bodySize,
            "ages": ages,
            "status": isAdoption ? status : null,
            "neuteredStatus": neuteredStatus,
            "hasChip": hasChip,
            "adoptionAreas": isAdoption ? adoptionAreas : null
        },
        "pagination": {
            "page": pageNumber,
            "limit": limit,
            "sortOrder": sortOrder
        }
    };
}

// 建立分頁元件（從 metadata 初始化）
export function setupPaginationFromMetadata(metadata, paginationSelector = '#adoption_pagination', onPageCallback, isInit = true) {
    // 如果 plugin 已經初始化，先 destroy
    if (!isInit) {
        try { $(paginationSelector).pagination('destroy'); } catch (e) { /* ignore */ }
    }

    $(paginationSelector).pagination({
        dataSource: function (done) {
            const pages = [];
            for (let i = 1; i <= metadata.total; i++) {
                pages.push(i);
            }
            done(pages);
        },
        pageSize: metadata.limit,
        showPrevious: true,
        showNext: true,
        prevText: '‹ Prev',
        nextText: 'Next ›',
        ulClassName: 'pagination justify-content-center',
        callback: function (pageData, pagination) {
            if (pagination.pageNumber === 1 && pagination.isFirstLoad === undefined) {
                pagination.isFirstLoad = false;
                return;
            }

            if (typeof onPageCallback === 'function') {
                onPageCallback(pagination.pageNumber);
            }
        }
    });
}

// 監聽 收藏點擊事件
export function favoriteListener(targetId, caseNumber) {
    $(targetId).on('click', '.favorite-btn', async function (e) {
        e.preventDefault();
        e.stopPropagation();

        if (!AuthManager.getToken()) {
            showCustomAlert("系統提示", "請先登入會員才能收藏案件！", 1000);
            return;
        }

        caseNumber = $(this).closest('.card').data('casenumber') || caseNumber;
        
        const icon = $(this).find('i');
        const isFavorites = icon.hasClass('bi-suit-heart-fill');

        // ---- UI 先切換（樂觀更新）----
        icon.toggleClass('bi-suit-heart bi-suit-heart-fill text-danger');

        let apiUrl = '';
        let method = '';
        let body = {};
        if (isFavorites) {
            // ⭐ DELETE (取消收藏)
            apiUrl = '/api/members/favorites/' + caseNumber;
            method = 'DELETE';
        } else {
            // ⭐ POST (新增收藏)
            apiUrl = '/api/members/favorites/';
            method = 'POST';
            body = { caseNumber: caseNumber };
        }

        const response = await fetchWithAuth(apiUrl, {
            method: method,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        }
        );
        const result = await response.json();

        if (result.success) {
            const actionText = isFavorites ? "已取消收藏" : "成功收藏";
            showCustomAlert("系統提示", `${actionText} 案號: ${caseNumber}`, 1000);
        } else {
            // ❌ 還原 UI
            icon.toggleClass('bi-suit-heart-fill text-danger bi-suit-heart');
            alert(result.message);
        }
    });
}


export default {
    renderCardList,
    parseCaseDetail,
    renderDetail,
    updatePreviewMap
};
