// 获取当前页面的URL
function getCurrentURL() {
    return window.location.href;
}

// 使用在线API生成二维码（备用方案）
function generateQRCodeWithAPI(url) {
    const qrContainer = document.getElementById('qrCode');
    const encodedURL = encodeURIComponent(url);
    
    // 使用在线二维码API服务
    const apiURL = `https://api.qrserver.com/v1/create-qr-code/?size=256x256&data=${encodedURL}&color=ffb6c1&bgcolor=ffffff&margin=2`;
    
    const img = document.createElement('img');
    img.src = apiURL;
    img.alt = '二维码';
    img.style.display = 'block';
    img.style.margin = '0 auto';
    img.style.borderRadius = '10px';
    img.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.1)';
    
    img.onload = function() {
        console.log('使用在线API生成二维码成功');
        qrContainer.innerHTML = '';
        qrContainer.appendChild(img);
        
        // 添加提示文字
        const tip = document.createElement('p');
        tip.style.marginTop = '15px';
        tip.style.color = '#6c757d';
        tip.style.fontSize = '14px';
        tip.textContent = '扫描二维码即可打开此问卷页面';
        qrContainer.appendChild(tip);
    };
    
    img.onerror = function() {
        console.error('在线API生成二维码失败');
        qrContainer.innerHTML = '<p style="color: red; padding: 20px;">二维码生成失败<br>请检查网络连接后重试</p>';
    };
}

// 检查并等待QRCode库加载
function waitForQRCode(callback, maxAttempts = 15) {
    if (typeof QRCode !== 'undefined') {
        callback();
        return;
    }
    
    if (maxAttempts <= 0) {
        console.warn('QRCode库加载超时，使用在线API备用方案');
        return 'fallback';
    }
    
    setTimeout(() => {
        const result = waitForQRCode(callback, maxAttempts - 1);
        if (result === 'fallback' && maxAttempts === 1) {
            return 'fallback';
        }
    }, 200);
}

// 生成二维码
function generateQRCode() {
    const qrContainer = document.getElementById('qrCode');
    if (!qrContainer) {
        console.error('二维码容器未找到');
        alert('二维码容器未找到，请刷新页面重试');
        return;
    }
    
    const currentURL = getCurrentURL();
    console.log('正在生成二维码，URL:', currentURL);
    
    // 显示加载提示
    qrContainer.innerHTML = '<p style="color: #667eea; padding: 20px;">正在生成二维码...</p>';
    qrContainer.classList.add('show');
    
    // 先尝试使用QRCode库，如果失败则使用在线API
    let useFallback = false;
    
    const tryGenerate = () => {
        if (typeof QRCode !== 'undefined' && !useFallback) {
            // 使用QRCode库生成
            qrContainer.innerHTML = '';
            const canvas = document.createElement('canvas');
            qrContainer.appendChild(canvas);
            
            try {
                QRCode.toCanvas(canvas, currentURL, {
                    width: 256,
                    height: 256,
                    margin: 2,
                    color: {
                        dark: '#ffb6c1',
                        light: '#ffffff'
                    },
                    errorCorrectionLevel: 'M'
                }, function (error) {
                    if (error) {
                        console.error('QRCode库生成失败，使用备用方案:', error);
                        useFallback = true;
                        generateQRCodeWithAPI(currentURL);
                    } else {
                        console.log('二维码生成成功（使用QRCode库）');
                        // 添加提示文字
                        const tip = document.createElement('p');
                        tip.style.marginTop = '15px';
                        tip.style.color = '#6c757d';
                        tip.style.fontSize = '14px';
                        tip.textContent = '扫描二维码即可打开此问卷页面';
                        qrContainer.appendChild(tip);
                    }
                });
            } catch (error) {
                console.error('生成二维码时发生错误，使用备用方案:', error);
                useFallback = true;
                generateQRCodeWithAPI(currentURL);
            }
        } else {
            // 直接使用在线API
            console.log('使用在线API生成二维码');
            generateQRCodeWithAPI(currentURL);
        }
    };
    
    // 等待QRCode库加载，最多等待3秒
    let attempts = 0;
    const maxAttempts = 15;
    
    const checkAndGenerate = () => {
        attempts++;
        if (typeof QRCode !== 'undefined') {
            tryGenerate();
        } else if (attempts >= maxAttempts) {
            console.log('QRCode库加载超时，使用在线API备用方案');
            useFallback = true;
            generateQRCodeWithAPI(currentURL);
        } else {
            setTimeout(checkAndGenerate, 200);
        }
    };
    
    checkAndGenerate();
}

// 处理表单提交
function handleFormSubmit(event) {
    event.preventDefault();
    
    const form = event.target;
    const formData = new FormData(form);
    const data = {};
    
    // 收集表单数据
    for (let [key, value] of formData.entries()) {
        if (data[key]) {
            // 处理多选（checkbox）
            if (Array.isArray(data[key])) {
                data[key].push(value);
            } else {
                data[key] = [data[key], value];
            }
        } else {
            data[key] = value;
        }
    }
    
    // 处理多选框（需要单独处理，因为FormData可能不会正确处理多个同名值）
    const checkboxes = form.querySelectorAll('input[type="checkbox"]:checked');
    const multiSelectFields = ['channels', 'considerations', 'scenarios', 'selling_points', 
                               'gift_scenarios', 'customization', 'online_services'];
    
    checkboxes.forEach(checkbox => {
        const name = checkbox.name;
        if (multiSelectFields.includes(name)) {
            if (!data[name] || !Array.isArray(data[name])) {
                data[name] = [];
            }
            if (!data[name].includes(checkbox.value)) {
                data[name].push(checkbox.value);
            }
        }
    });
    
    // 验证必填字段
    const requiredFields = form.querySelectorAll('[required]');
    let isValid = true;
    requiredFields.forEach(field => {
        if (field.type === 'checkbox' || field.type === 'radio') {
            const group = form.querySelectorAll(`[name="${field.name}"]:checked`);
            if (group.length === 0) {
                isValid = false;
                field.closest('.form-group').style.border = '2px solid #e74c3c';
            } else {
                field.closest('.form-group').style.border = 'none';
            }
        } else {
            if (!field.value.trim()) {
                isValid = false;
                field.style.borderColor = '#e74c3c';
            } else {
                field.style.borderColor = '#e9ecef';
            }
        }
    });
    
    if (!isValid) {
        alert('请填写所有必填字段！');
        return;
    }
    
    // 添加提交时间戳
    data.submitTime = new Date().toISOString();
    
    // 存储数据到localStorage
    saveSurveyData(data);
    
    // 显示提交的数据（在实际应用中，这里应该发送到服务器）
    console.log('提交的数据:', data);
    
    // 这里可以添加发送到服务器的代码
    // fetch('/api/submit', {
    //     method: 'POST',
    //     headers: {
    //         'Content-Type': 'application/json',
    //     },
    //     body: JSON.stringify(data)
    // })
    // .then(response => response.json())
    // .then(result => {
    //     console.log('提交成功:', result);
    //     showSuccessMessage();
    // })
    // .catch(error => {
    //     console.error('提交失败:', error);
    //     alert('提交失败，请重试！');
    // });
    
    // 模拟提交成功
    showSuccessMessage();
    
    // 3秒后隐藏成功消息并重置表单
    setTimeout(() => {
        hideSuccessMessage();
        form.reset();
    }, 3000);
}

// 显示成功消息
function showSuccessMessage() {
    const successMessage = document.getElementById('successMessage');
    successMessage.classList.remove('hidden');
}

// 隐藏成功消息
function hideSuccessMessage() {
    const successMessage = document.getElementById('successMessage');
    successMessage.classList.add('hidden');
}

// JSONBin.io 配置（国内可用）
const JSONBIN_CONFIG = {
    binId: '69809e56ae596e708f0b707a',  // 替换为你的 Bin ID
    apiKey: '$2a$10$wZM8M2FLStDM/jOePGCaPujxbODc31Mj8iKM3dWy3lAoRNG0gfDbK', // 可选，如果注册了账号
    baseUrl: 'https://api.jsonbin.io/v3/b'
};

// 保存问卷数据到JSONBin.io和localStorage（双重备份）
async function saveSurveyData(data) {
    // 先保存到本地作为备份
    try {
        let allData = JSON.parse(localStorage.getItem('surveyData') || '[]');
        allData.push(data);
        localStorage.setItem('surveyData', JSON.stringify(allData));
        console.log('数据已保存到本地存储，共', allData.length, '条记录');
    } catch (error) {
        console.error('保存到本地存储失败:', error);
    }
    
    // 保存到 JSONBin.io（国内可用）
    if (JSONBIN_CONFIG.binId && JSONBIN_CONFIG.binId !== 'YOUR_BIN_ID') {
        try {
            // 先获取现有数据
            const headers = {
                'Content-Type': 'application/json'
            };
            if (JSONBIN_CONFIG.apiKey && JSONBIN_CONFIG.apiKey !== 'YOUR_API_KEY') {
                headers['X-Master-Key'] = JSONBIN_CONFIG.apiKey;
            }
            
            // 获取现有数据
            const getResponse = await fetch(`${JSONBIN_CONFIG.baseUrl}/${JSONBIN_CONFIG.binId}/latest`, {
                method: 'GET',
                headers: headers
            });
            
            let allData = [];
            if (getResponse.ok) {
                const result = await getResponse.json();
                allData = result.record || [];
            }
            
            // 添加新数据
            allData.push({
                ...data,
                submitTime: new Date().toISOString()
            });
            
            // 更新到服务器
            const updateResponse = await fetch(`${JSONBIN_CONFIG.baseUrl}/${JSONBIN_CONFIG.binId}`, {
                method: 'PUT',
                headers: headers,
                body: JSON.stringify(allData)
            });
            
            if (updateResponse.ok) {
                console.log('数据已保存到 JSONBin.io 服务器');
            } else {
                throw new Error('更新失败');
            }
        } catch (error) {
            console.error('保存到 JSONBin.io 失败:', error);
            console.warn('数据已保存到本地，但未同步到服务器');
        }
    } else {
        console.warn('JSONBin.io 未配置，数据仅保存到本地');
    }
    
    // 如果 Firebase 已初始化，也尝试保存到 Firebase（作为备用）
    if (window.firebaseDb && window.firebaseInitialized) {
        try {
            const { collection, addDoc, serverTimestamp } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
            await addDoc(collection(window.firebaseDb, 'survey_responses'), {
                data: data,
                timestamp: serverTimestamp(),
                createdAt: new Date().toISOString()
            });
            console.log('数据已保存到 Firebase 服务器');
        } catch (error) {
            // Firebase 失败不影响，因为已经有 JSONBin.io 了
            console.warn('Firebase 保存失败（可能国内无法访问）:', error);
        }
    }
}

// 获取所有问卷数据（优先从JSONBin.io获取，失败则从本地获取）
async function getAllSurveyData() {
    // 优先从 JSONBin.io 获取（国内可用）
    if (JSONBIN_CONFIG.binId && JSONBIN_CONFIG.binId !== 'YOUR_BIN_ID') {
        try {
            const headers = {
                'Content-Type': 'application/json'
            };
            if (JSONBIN_CONFIG.apiKey && JSONBIN_CONFIG.apiKey !== 'YOUR_API_KEY') {
                headers['X-Master-Key'] = JSONBIN_CONFIG.apiKey;
            }
            
            const response = await fetch(`${JSONBIN_CONFIG.baseUrl}/${JSONBIN_CONFIG.binId}/latest`, {
                method: 'GET',
                headers: headers
            });
            
            if (response.ok) {
                const result = await response.json();
                const allData = result.record || [];
                console.log('从 JSONBin.io 获取到', allData.length, '条记录');
                return allData;
            } else {
                throw new Error('获取数据失败');
            }
        } catch (error) {
            console.error('从 JSONBin.io 读取数据失败:', error);
            console.warn('尝试从本地存储读取数据');
        }
    }
    
    // 如果 JSONBin.io 未配置或读取失败，尝试从 Firebase 获取
    if (window.firebaseDb && window.firebaseInitialized) {
        try {
            const { collection, getDocs, query, orderBy } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
            const q = query(collection(window.firebaseDb, 'survey_responses'), orderBy('createdAt', 'desc'));
            const querySnapshot = await getDocs(q);
            const allData = [];
            querySnapshot.forEach((doc) => {
                const docData = doc.data();
                allData.push(docData.data);
            });
            console.log('从 Firebase 获取到', allData.length, '条记录');
            return allData;
        } catch (error) {
            console.warn('从 Firebase 读取数据失败（可能国内无法访问）:', error);
        }
    }
    
    // 最后从本地存储获取
    try {
        const localData = JSON.parse(localStorage.getItem('surveyData') || '[]');
        console.log('从本地存储获取到', localData.length, '条记录');
        return localData;
    } catch (error) {
        console.error('读取本地数据失败:', error);
        return [];
    }
}

// 清空所有数据（用于测试）
async function clearAllData() {
    if (confirm('确定要清空所有问卷数据吗？此操作不可恢复！\n\n注意：这将清空本地数据，Firebase 服务器上的数据需要手动删除。')) {
        // 清空本地数据
        localStorage.removeItem('surveyData');
        
        // 如果 Firebase 已初始化，提示用户手动删除服务器数据
        if (window.firebaseDb && window.firebaseInitialized) {
            alert('本地数据已清空。\n\nFirebase 服务器上的数据需要在 Firebase 控制台中手动删除。');
        } else {
            alert('数据已清空');
        }
        
        if (window.location.pathname.includes('stats.html')) {
            location.reload();
        }
    }
}

// 处理多选框的必填验证
function handleCheckboxRequired() {
    const checkboxGroups = document.querySelectorAll('.checkbox-group');
    checkboxGroups.forEach(group => {
        const checkboxes = group.querySelectorAll('input[type="checkbox"]');
        const hasRequired = Array.from(checkboxes).some(cb => cb.hasAttribute('required'));
        
        if (hasRequired) {
            checkboxes.forEach(checkbox => {
                checkbox.addEventListener('change', function() {
                    const checked = group.querySelectorAll('input[type="checkbox"]:checked');
                    if (checked.length > 0) {
                        checkboxes.forEach(cb => cb.removeAttribute('required'));
                    } else {
                        checkboxes.forEach(cb => cb.setAttribute('required', 'required'));
                    }
                });
            });
        }
    });
    
    // 处理"其他"选项的显示/隐藏（多选框）
    const otherCheckboxes = document.querySelectorAll('input[type="checkbox"][value="其他"]');
    otherCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            const name = this.name;
            const otherInput = document.querySelector(`input[name="${name}_other"]`);
            if (otherInput) {
                if (this.checked) {
                    otherInput.style.display = 'block';
                    otherInput.setAttribute('required', 'required');
                } else {
                    otherInput.style.display = 'none';
                    otherInput.removeAttribute('required');
                    otherInput.value = '';
                }
            }
        });
    });
    
    // 处理"其他"选项的显示/隐藏（单选框）
    const otherRadios = document.querySelectorAll('input[type="radio"][value="其他"]');
    otherRadios.forEach(radio => {
        radio.addEventListener('change', function() {
            const name = this.name;
            const otherInput = document.querySelector(`input[name="${name}_other"]`);
            if (otherInput) {
                if (this.checked) {
                    otherInput.style.display = 'block';
                    otherInput.setAttribute('required', 'required');
                } else {
                    otherInput.style.display = 'none';
                    otherInput.removeAttribute('required');
                    otherInput.value = '';
                }
            }
        });
    });
    
    // 初始化"其他"输入框的显示状态（多选框）
    otherCheckboxes.forEach(checkbox => {
        const name = checkbox.name;
        const otherInput = document.querySelector(`input[name="${name}_other"]`);
        if (otherInput) {
            otherInput.style.display = checkbox.checked ? 'block' : 'none';
        }
    });
    
    // 初始化"其他"输入框的显示状态（单选框）
    otherRadios.forEach(radio => {
        const name = radio.name;
        const otherInput = document.querySelector(`input[name="${name}_other"]`);
        if (otherInput) {
            otherInput.style.display = radio.checked ? 'block' : 'none';
            // 检查同组其他单选框是否被选中
            const groupRadios = document.querySelectorAll(`input[type="radio"][name="${name}"]`);
            const isOtherSelected = Array.from(groupRadios).some(r => r.value === '其他' && r.checked);
            if (!isOtherSelected) {
                otherInput.style.display = 'none';
            }
        }
    });
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    // 绑定生成二维码按钮
    const generateQRBtn = document.getElementById('generateQR');
    if (generateQRBtn) {
        generateQRBtn.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('二维码按钮被点击');
            generateQRCode();
        });
        console.log('二维码按钮绑定成功');
    } else {
        console.error('生成二维码按钮未找到');
    }
    
    // 检查QRCode库是否加载（延迟检查，给库一些加载时间）
    setTimeout(() => {
        if (typeof QRCode === 'undefined') {
            console.warn('QRCode库可能未加载，如果使用file://协议打开，请使用本地服务器运行');
        } else {
            console.log('QRCode库已加载');
        }
    }, 1000);
    
    // 绑定表单提交事件
    const surveyForm = document.getElementById('surveyForm');
    if (surveyForm) {
        surveyForm.addEventListener('submit', handleFormSubmit);
    }
    
    // 处理多选框必填验证
    handleCheckboxRequired();
    
    // 点击成功消息外部区域关闭
    const successMessage = document.getElementById('successMessage');
    if (successMessage) {
        successMessage.addEventListener('click', function(e) {
            if (e.target === successMessage) {
                hideSuccessMessage();
            }
        });
    }
    
    // 输入框焦点事件，清除错误样式
    const inputs = document.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
        input.addEventListener('focus', function() {
            this.style.borderColor = '';
            if (this.closest('.form-group')) {
                this.closest('.form-group').style.border = 'none';
            }
        });
    });
});

const VISIT_BIN_CONFIG = {
    binId: '69809e56ae596e708f0b707a',  // 替换为你的 Bin ID
    apiKey: '$2a$10$wZM8M2FLStDM/jOePGCaPujxbODc31Mj8iKM3dWy3lAoRNG0gfDbK', // 可选，如果注册了账号
    baseUrl: 'https://api.jsonbin.io/v3/b'
  };
  
  async function updateVisitCount() {
    const el = document.getElementById('adminVisitCount');
    if (!el || !VISIT_BIN_CONFIG.binId || VISIT_BIN_CONFIG.binId === 'YOUR_VISIT_BIN_ID') {
      return;
    }
  
    try {
      const headers = { 'Content-Type': 'application/json' };
      if (VISIT_BIN_CONFIG.apiKey && VISIT_BIN_CONFIG.apiKey !== 'YOUR_API_KEY') {
        headers['X-Master-Key'] = VISIT_BIN_CONFIG.apiKey;
      }
  
      // 先读出原来的 count
      const getRes = await fetch(`${VISIT_BIN_CONFIG.baseUrl}/${VISIT_BIN_CONFIG.binId}/latest`, {
        method: 'GET',
        headers
      });
      let count = 0;
      if (getRes.ok) {
        const data = await getRes.json();
        count = (data.record && typeof data.record.count === 'number') ? data.record.count : 0;
      }
  
      // +1 后写回去
      const newCount = count + 1;
      const putRes = await fetch(`${VISIT_BIN_CONFIG.baseUrl}/${VISIT_BIN_CONFIG.binId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ count: newCount })
      });
  
      if (putRes.ok) {
        el.textContent = newCount;
      } else {
        el.textContent = count; // 写回失败就至少显示旧值
      }
    } catch (e) {
      console.error('更新访问数失败', e);
    }
  }
