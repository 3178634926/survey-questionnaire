// 创建 JSONBin.io API headers
function createJSONBinHeaders(config) {
    const headers = { 'Content-Type': 'application/json' };
    if (config.apiKey && config.apiKey !== 'YOUR_API_KEY') {
        headers['X-Master-Key'] = config.apiKey;
    }
    return headers;
}

// 添加二维码提示文字
function addQRCodeTip(container) {
    const tip = document.createElement('p');
    tip.style.marginTop = '15px';
    tip.style.color = '#6c757d';
    tip.style.fontSize = '14px';
    tip.textContent = '扫描二维码即可打开此问卷页面';
    container.appendChild(tip);
}

// 使用在线API生成二维码（备用方案）
function generateQRCodeWithAPI(url) {
    const qrContainer = document.getElementById('qrCode');
    if (!qrContainer) {
        console.error('二维码容器未找到');
        return;
    }
    
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
        qrContainer.innerHTML = '';
        qrContainer.appendChild(img);
        addQRCodeTip(qrContainer);
    };
    
    img.onerror = function() {
        console.error('在线API生成二维码失败');
        qrContainer.innerHTML = '<p style="color: red; padding: 20px;">二维码生成失败<br>请检查网络连接后重试</p>';
    };
}

// 生成二维码
function generateQRCode() {
    const qrContainer = document.getElementById('qrCode');
    if (!qrContainer) {
        console.error('二维码容器未找到');
        alert('二维码容器未找到，请刷新页面重试');
        return;
    }
    
    // 如果是管理页，生成问卷页面的二维码；否则生成当前页面
    let targetURL;
    if (window.location.pathname.includes('admin.html')) {
        // 管理页：生成问卷页面的二维码
        targetURL = window.location.origin + window.location.pathname.replace('admin.html', 'index.html');
    } else {
        // 问卷页：生成当前页面二维码
        targetURL = window.location.href;
    }
    
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
                QRCode.toCanvas(canvas, targetURL, {
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
                        generateQRCodeWithAPI(targetURL);
                    } else {
                        addQRCodeTip(qrContainer);
                    }
                });
            } catch (error) {
                console.error('生成二维码时发生错误，使用备用方案:', error);
                useFallback = true;
                generateQRCodeWithAPI(targetURL);
            }
        } else {
            // 直接使用在线API
            generateQRCodeWithAPI(targetURL);
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
            generateQRCodeWithAPI(targetURL);
        } else {
            setTimeout(checkAndGenerate, 200);
        }
    };
    
    checkAndGenerate();
}

// 处理表单提交
async function handleFormSubmit(event) {
    event.preventDefault();
    
    const form = event.target;
    const formData = new FormData(form);
    const data = {};
    
    // 收集表单数据
    // FormData 会为每个选中的 checkbox 创建一个条目，需要手动合并多选框的值
    const multiSelectFields = ['channels', 'considerations', 'scenarios', 'selling_points', 
                               'gift_scenarios', 'customization', 'online_services'];
    
    for (let [key, value] of formData.entries()) {
        if (multiSelectFields.includes(key)) {
            // 多选框：收集所有选中的值
            if (!data[key]) {
                data[key] = [];
            }
            if (!data[key].includes(value)) {
                data[key].push(value);
            }
        } else {
            // 单选或其他字段：直接赋值（后面的值会覆盖前面的，但通常只有一个）
            data[key] = value;
        }
    }
    
    // 验证必填字段
    const requiredFields = form.querySelectorAll('[required]');
    let isValid = true;
    requiredFields.forEach(field => {
        if (field.type === 'checkbox' || field.type === 'radio') {
            const group = form.querySelectorAll(`[name="${field.name}"]:checked`);
            const formGroup = field.closest('.form-group');
            if (group.length === 0) {
                isValid = false;
                if (formGroup) {
                    formGroup.style.border = '2px solid #e74c3c';
                }
            } else {
                if (formGroup) {
                    formGroup.style.border = 'none';
                }
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
    
    // 存储数据到localStorage和服务器
    await saveSurveyData(data);
    
    // 显示成功消息
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
    if (successMessage) {
        successMessage.classList.remove('hidden');
    }
}

// 隐藏成功消息
function hideSuccessMessage() {
    const successMessage = document.getElementById('successMessage');
    if (successMessage) {
        successMessage.classList.add('hidden');
    }
}

// 生成本地访客ID（用于UV统计）
function getOrCreateVisitorId() {
    const key = 'survey_visitor_id';
    let id = localStorage.getItem(key);
    if (!id) {
        id = 'v_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
        localStorage.setItem(key, id);
    }
    return id;
}

// JSONBin.io 配置
const JSONBIN_CONFIG = {
    binId: '69809e56ae596e708f0b707a',  // 替换为你的 Bin ID
    apiKey: '$2a$10$wZM8M2FLStDM/jOePGCaPujxbODc31Mj8iKM3dWy3lAoRNG0gfDbK', // 可选，如果注册了账号
    baseUrl: 'https://api.jsonbin.io/v3/b'
};

// 访问统计 Bin 配置（PV/UV）
const VISIT_BIN_CONFIG = {
    binId: '6980b674d0ea881f409b417e',  // 访问统计 Bin ID
    apiKey: '$2a$10$wZM8M2FLStDM/jOePGCaPujxbODc31Mj8iKM3dWy3lAoRNG0gfDbK', // 完整的 API Key
    baseUrl: 'https://api.jsonbin.io/v3/b'
};

// 保存问卷数据到JSONBin.io和localStorage（双重备份）
async function saveSurveyData(data) {
    // 先保存到本地作为备份
    try {
        let allData = JSON.parse(localStorage.getItem('surveyData') || '[]');
        allData.push(data);
        localStorage.setItem('surveyData', JSON.stringify(allData));
    } catch (error) {
        console.error('保存到本地存储失败:', error);
    }
    
    // 保存到 JSONBin.io
    if (JSONBIN_CONFIG.binId && JSONBIN_CONFIG.binId !== 'YOUR_BIN_ID') {
        try {
            const headers = createJSONBinHeaders(JSONBIN_CONFIG);
            
            // 获取现有数据
            const getResponse = await fetch(`${JSONBIN_CONFIG.baseUrl}/${JSONBIN_CONFIG.binId}/latest`, {
                method: 'GET',
                headers: headers
            });
            
            let allData = [];
            if (getResponse.ok) {
                const result = await getResponse.json();
                const record = result.record || [];
                // 确保是数组
                allData = Array.isArray(record) ? record : [];
            } else {
                // 如果获取失败，从空数组开始
                console.warn('获取现有数据失败，从空数组开始');
                allData = [];
            }
            
            // 添加新数据（data中已包含submitTime，直接push）
            allData.push(data);
            
            // 更新到服务器
            const updateResponse = await fetch(`${JSONBIN_CONFIG.baseUrl}/${JSONBIN_CONFIG.binId}`, {
                method: 'PUT',
                headers: headers,
                body: JSON.stringify(allData)
            });
            
            if (updateResponse.ok) {
                // 数据已保存成功
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
}

// 获取所有问卷数据（优先从JSONBin.io获取，失败则从本地获取）
async function getAllSurveyData() {
    // 优先从 JSONBin.io 获取
    if (JSONBIN_CONFIG.binId && JSONBIN_CONFIG.binId !== 'YOUR_BIN_ID') {
        try {
            const headers = createJSONBinHeaders(JSONBIN_CONFIG);
            
            const response = await fetch(`${JSONBIN_CONFIG.baseUrl}/${JSONBIN_CONFIG.binId}/latest`, {
                method: 'GET',
                headers: headers
            });
            
            if (response.ok) {
                const result = await response.json();
                let allData = result.record || [];
                // 确保返回的是数组
                if (!Array.isArray(allData)) {
                    console.warn('JSONBin.io 返回的数据不是数组，重置为空数组');
                    allData = [];
                }
                return allData;
            } else {
                const errorText = await response.text().catch(() => '');
                console.error('JSONBin.io API 错误:', response.status, errorText);
                throw new Error(`获取数据失败: ${response.status}`);
            }
        } catch (error) {
            console.error('从 JSONBin.io 读取数据失败:', error);
            console.warn('尝试从本地存储读取数据');
        }
    }
    
    // 从本地存储获取
    try {
        const localData = JSON.parse(localStorage.getItem('surveyData') || '[]');
        return localData;
    } catch (error) {
        console.error('读取本地数据失败:', error);
        return [];
    }
}

// 清空所有数据
async function clearAllData() {
    if (confirm('确定要清空所有问卷数据吗？此操作不可恢复！\n\n注意：这将清空本地数据，JSONBin.io 服务器上的数据需要手动删除。')) {
        // 清空本地数据
        localStorage.removeItem('surveyData');
        alert('本地数据已清空。\n\nJSONBin.io 服务器上的数据需要在 JSONBin.io 控制台中手动删除。');
        
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
            generateQRCode();
        });
    }
    
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

    // 记录问卷页面访问（PV/UV）- 只在问卷页面调用
    if (document.getElementById('surveyForm')) {
        trackPageVisit();
    }
});

// 在问卷页面调用：更新 PV / UV
async function trackPageVisit() {
    if (!VISIT_BIN_CONFIG.binId || VISIT_BIN_CONFIG.binId === 'YOUR_VISIT_BIN_ID') return;

    const headers = createJSONBinHeaders(VISIT_BIN_CONFIG);

    const visitorId = getOrCreateVisitorId();
    const uvKey = 'survey_uv_recorded'; // 记录这个浏览器是否已经记过一次UV
    const isNewVisitor = !localStorage.getItem(uvKey);

    try {
        // 先读取当前 pv/uv
        const getRes = await fetch(`${VISIT_BIN_CONFIG.baseUrl}/${VISIT_BIN_CONFIG.binId}/latest`, {
            method: 'GET',
            headers
        });

        let pv = 0, uv = 0;
        if (getRes.ok) {
            try {
                const data = await getRes.json();
                const record = data.record || {};
                pv = typeof record.pv === 'number' ? record.pv : 0;
                uv = typeof record.uv === 'number' ? record.uv : 0;
            } catch (parseError) {
                console.error('解析访问统计数据失败:', parseError);
                pv = 0;
                uv = 0;
            }
        } else {
            // 如果获取失败，从0开始
            console.warn('获取访问统计失败，从0开始');
            pv = 0;
            uv = 0;
        }

        // 更新计数
        pv += 1;
        if (isNewVisitor) {
            uv += 1;
            localStorage.setItem(uvKey, visitorId);
        }

        // 写回 JSONBin
        const putRes = await fetch(`${VISIT_BIN_CONFIG.baseUrl}/${VISIT_BIN_CONFIG.binId}`, {
            method: 'PUT',
            headers,
            body: JSON.stringify({ pv, uv })
        });

        if (!putRes.ok) {
            console.warn('更新访问统计失败');
        }
    } catch (e) {
        console.error('trackPageVisit 出错:', e);
    }
}

// 在管理页调用：只读取 PV / UV，不增加
async function fetchVisitStats() {
    const elPv = document.getElementById('adminPV');
    const elUv = document.getElementById('adminUV');
    if (!elPv || !elUv || !VISIT_BIN_CONFIG.binId || VISIT_BIN_CONFIG.binId === 'YOUR_VISIT_BIN_ID') return;

    const headers = createJSONBinHeaders(VISIT_BIN_CONFIG);

    try {
        const res = await fetch(`${VISIT_BIN_CONFIG.baseUrl}/${VISIT_BIN_CONFIG.binId}/latest`, {
            method: 'GET',
            headers
        });
        if (!res.ok) return;

        const data = await res.json();
        const record = data.record || {};
        const pv = typeof record.pv === 'number' ? record.pv : 0;
        const uv = typeof record.uv === 'number' ? record.uv : 0;

        elPv.textContent = pv;
        elUv.textContent = uv;
    } catch (e) {
        console.error('fetchVisitStats 出错:', e);
    }
}
