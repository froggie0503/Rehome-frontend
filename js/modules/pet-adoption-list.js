// -------------------------
import { 
    sizeMap,
    ageMap,
    genderMap,
    dataTypeList,
    fetchWithAuth
} from '/js/utils/helper.js';
import petCard, {
    renderSelectors,
    populateCheckboxSelectors,
    populateRadioSelectors,
    renderCardList,
    getSearchFormAndParse,
    setupPaginationFromMetadata,
    renderBanner,
    bindSearchResetAndTagHandlers,
    favoriteListener,
    renderSkeleton
} from './petCard/component.js';

// 動態生成 selectors
function adoption_loadSelectors(data, isAdoption) {
    data['bodySizes'] = [
        {id: 'big', name: '大型'},
        {id: 'medium', name: '中型'},
        {id: 'small', name: '小型'}
    ];
    data['ages'] = [
        {id: 'child', name: '幼年'},
        {id: 'adult', name: '成年'},
        {id: 'old', name: '老年'}
    ];
    data['neuteredStatus'] = [
        {id: 1, name: '已結紮'},
        {id: 2, name: '未結紮'}
    ];
    data['hasChip'] = [
        {id: 1, name: '有晶片'},
        {id: 2, name: '無晶片'}
    ];
    data['sources'] = [
        {id: 2, name: '公立'},
        {id: 1, name: '個人'}
    ];
    data['genders'] = [
        {id: 'male', name: '男'},
        {id: 'female', name: '女'}
    ];
    data['status'] = [
        {id: 1, name: '開放領養中'},
        {id: 2, name: '領養媒合中'}
    ];
    
    // 先渲染所有 selector 元件框架
    renderSelectors(isAdoption);
    
    // 填充 checkbox 選項
    populateCheckboxSelectors('#adoption_selectors_region', data.citys);
    populateCheckboxSelectors('#adoption_selectors_species', data.species);
    populateCheckboxSelectors('#adoption_selectors_body_size', data.bodySizes || []);
    populateCheckboxSelectors('#adoption_selectors_age', data.ages || []);
    
    // 填充 radio 選項
    populateRadioSelectors('#adoption_selectors_gender', data.genders || []);
    populateRadioSelectors('#adoption_selectors_neutered_status', data.neuteredStatus || []);
    populateRadioSelectors('#adoption_selectors_has_chip', data.hasChip || []);
    
    if (isAdoption) {
        // 來源
        populateRadioSelectors('#adoption_selectors_source', data.sources || []);
        // 寵物狀態
        populateRadioSelectors('#adoption_selectors_status', data.status || []);
        // 收容所
        populateCheckboxSelectors('#adoption_selectors_shelter', data.shelters);
        $('#adoption_selectors_shelter').addClass('d-none');
        
        // 可送養範圍
        populateCheckboxSelectors('#adoption_selectors_adoption_area', data.citys);
    } else {
        $('#adoption_selectors_source').remove();
        $('#adoption_selectors_status').remove();
        $('#adoption_selectors_shelter').remove();
        $('#adoption_selectors_adoption_area').remove();
    }
    
    console.log('搜尋選項填入成功');
}

// card list (use petCard 共用渲染)
function adoption_renderCardList(result, isAdoption) {
    renderCardList(result, '#adoption-list', isAdoption);
}

async function adoption_searchCardList(pageNumber, isAdoption) {    
    renderSkeleton();

    const postData = getSearchFormAndParse(pageNumber, isAdoption);

    const response = await fetchWithAuth(`/api/cases/${isAdoption ? 'adoption' : 'missing'}/search`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(postData)
        }
    );
    const result = await response.json();
    
    if (result.success) {
        adoption_renderCardList(result, isAdoption);
    }
}

// 初始化卡片列表 & 監聽 分頁碼點擊事件
async function adoption_initPagination(isInit = true, isAdoption = true) {
    renderSkeleton();

    // 第一次要先抓一次資料 → 拿到 total + pageSize
    const firstQuery = getSearchFormAndParse(1, isAdoption);

    const response = await fetchWithAuth(`/api/cases/${isAdoption ? 'adoption' : 'missing'}/search`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(firstQuery)
        }
    );
    const result = await response.json();

    if (result.success) {
        // 渲染第一次卡片
        adoption_renderCardList(result, isAdoption);

        const metadata = result.data;

        // 使用 petCard 的分頁初始化
        setupPaginationFromMetadata(metadata, '#adoption_pagination', function (pageNumber) {            
            adoption_searchCardList(pageNumber, isAdoption);
        }, isInit);
    }
}

// 監聽卡片點擊事件 跳轉至 #pet-adoption-detail/{案件編號}
function adoption_cardClickListener() {
    $('#adoption-list').on('click', '.card', function (e) {
        e.preventDefault();

        window.location.href = `#pet-adoption-detail?casenumber=${$(this).data('casenumber')}`;
    });
}

async function initOptionsSearch(isAdoption) {
    const response = await fetchWithAuth(`/api/cases/options`, {
        method: 'GET'
    });
    const result = await response.json();

    if (result.success)  {
        adoption_loadSelectors(
            result.data,
            isAdoption
        );

        // bind shared search/reset/tag handlers
        bindSearchResetAndTagHandlers(dataTypeList, {
            onSearch: () => adoption_initPagination(false, isAdoption),
            onReset: () => adoption_initPagination(false, isAdoption),
            onLimitChange: () => adoption_initPagination(false, isAdoption),
            onSortChange: () => adoption_searchCardList(1, isAdoption)
        });
    }
}

export function init() {
    const currentHash = window.location.hash.split('?')[0] || '';
    const isAdoption = currentHash.includes('adoption');

    // render banner (shared)
    renderBanner('#adoption .custom-title-wrapper', isAdoption);

    initOptionsSearch(isAdoption);

    // 仔入資料&頁碼
    adoption_initPagination(true, isAdoption);

    favoriteListener('#adoption-list');
    adoption_cardClickListener();
}