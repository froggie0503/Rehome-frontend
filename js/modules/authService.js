/**
 * 認證服務 - 登入和註冊功能
 * 用於測試登入和註冊功能
 */

class AuthService {
  constructor() {
    this.mockData = null;
    this.currentUser = null;
  }

  /**
   * 步驟1: 初始化 - 載入Mock數據
   */
  async init() {
    try {
      const response = await fetch('./data/mock-data.json');
      if (!response.ok) throw new Error('無法載入Mock數據');
      this.mockData = await response.json();
      console.log('✓ Mock數據載入成功');
      return true;
    } catch (error) {
      console.error('✗ Mock數據載入失敗:', error);
      return false;
    }
  }

  /**
   * 步驟2: 登入 - 驗證Email和密碼
   * @param {string} email - Email帳號
   * @param {string} password - 密碼
   * @returns {object} 登入結果
   */
  login(email, password) {
    console.log('--- 開始登入流程 ---');
    console.log('Email:', email);

    // 驗證輸入
    if (!email || !password) {
      console.error('✗ Email或密碼不能為空');
      return {
        success: false,
        message: 'Email或密碼不能為空'
      };
    }

    // 查找使用者 - 使用Email查找
    const user = this.mockData.users.find(u => u.email === email);
    
    if (!user) {
      console.error('✗ Email帳號不存在');
      return {
        success: false,
        message: '此Email未被註冊'
      };
    }

    // 驗證密碼
    if (user.password !== password) {
      console.error('✗ 密碼錯誤');
      return {
        success: false,
        message: '密碼錯誤'
      };
    }

    // 登入成功
    this.currentUser = user;
    console.log('✓ 登入成功');
    console.log('使用者ID:', user.id);
    console.log('使用者名稱:', user.name);
    
    return {
      success: true,
      message: '登入成功',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        name: user.name
      }
    };
  }

  /**
   * 步驟3: 註冊 - 驗證並新增使用者
   * @param {object} formData - 註冊表單數據
   * @returns {object} 註冊結果
   */
  register(formData) {
    console.log('--- 開始註冊流程 ---');
    console.log('Email:', formData.email);

    // 驗證所有必填欄位
    const requiredFields = ['email', 'password', 'confirmPassword', 'name', 'phone'];
    for (let field of requiredFields) {
      if (!formData[field]) {
        console.error(`✗ ${field}不能為空`);
        return {
          success: false,
          message: `${field}不能為空`
        };
      }
    }

    // 驗證Email格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      console.error('✗ Email格式不正確');
      return {
        success: false,
        message: 'Email格式不正確'
      };
    }

    // 驗證密碼
    if (formData.password !== formData.confirmPassword) {
      console.error('✗ 密碼不符');
      return {
        success: false,
        message: '密碼不符'
      };
    }

    // 檢查Email是否已存在
    if (this.mockData.users.some(u => u.email === formData.email)) {
      console.error('✗ Email已被註冊');
      return {
        success: false,
        message: '此Email已被註冊'
      };
    }

    // 自動生成username（使用Email的本地部分）
    const username = formData.email.split('@')[0];
    
    // 確保username唯一
    let finalUsername = username;
    let counter = 1;
    while (this.mockData.users.some(u => u.username === finalUsername)) {
      finalUsername = username + counter;
      counter++;
    }

    // 建立新使用者
    const newUser = {
      id: this.mockData.users.length + 1,
      username: finalUsername,
      email: formData.email,
      password: formData.password,
      name: formData.name,
      phone: formData.phone,
      address: formData.address || '',
      birthday: formData.birthday || '',
      gender: formData.gender || 'M',
      createAt: new Date().toISOString().split('T')[0],
      updateAt: new Date().toISOString().split('T')[0]
    };

    // 新增到使用者列表
    this.mockData.users.push(newUser);
    
    console.log('✓ 註冊成功');
    console.log('新使用者ID:', newUser.id);
    console.log('Email:', newUser.email);
    
    return {
      success: true,
      message: '註冊成功',
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name
      }
    };
  }

  /**
   * 步驟4: 登出
   */
  logout() {
    console.log('--- 登出 ---');
    if (this.currentUser) {
      console.log('✓ ' + this.currentUser.name + ' 已登出');
      this.currentUser = null;
      return { success: true, message: '登出成功' };
    }
    return { success: false, message: '未有登入使用者' };
  }

  /**
   * 檢查是否已登入
   */
  isLoggedIn() {
    return this.currentUser !== null;
  }

  /**
   * 取得目前登入的使用者
   */
  getCurrentUser() {
    return this.currentUser;
  }
}

// 匯出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AuthService;
}
