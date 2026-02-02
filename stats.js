// 问卷问题映射
const questionMap = {
    'frequency': '1. 你日常购买鲜切水果或轻奢轻食的频率是？',
    'considerations': '2. 你选择鲜切水果/轻奢轻食的核心考量因素是？',
    'budget': '3. 你能接受的单次轻奢鲜切水果消费预算是？',
    'scenarios': '4. 你购买鲜切水果/轻奢轻食的主要场景是？',
    'interest': '5. 你对「法式鲜果花艺」这一轻奢生活概念的感兴趣程度是？',
    'selling_points': '6. 以下品牌卖点中，最能吸引你选择Fleur de Fruits的是？',
    'gift_scenarios': '7. 若推出「法式鲜果花束」伴手礼，你更倾向于在哪些场景选购？',
    'store_style': '8. 你更偏爱哪种法式门店风格？',
    'customization': '9. 你对法式鲜果花艺的定制化服务有哪些期待？',
    'channels': '10. 你更倾向于通过哪些渠道了解高端轻食品牌？',
    'online_services': '11. 若开通线上预订服务，你最关注的核心服务是？',
    'expectations': '12. 对于Fleur de Fruits法式鲜果花艺工作室，你还有哪些期待或个性化需求？'
};

// 初始化统计页面
function initStats() {
    const allData = getAllSurveyData();
    
    if (allData.length === 0) {
        showNoData();
        return;
    }
    
    // 显示统计信息
    displayStatsInfo(allData);
    
    // 显示各问题统计
    displayQuestionStats(allData);
}

// 显示无数据提示
function showNoData() {
    const statsInfo = document.getElementById('statsInfo');
    const statsContent = document.getElementById('statsContent');
    
    statsInfo.innerHTML = `
        <div class="stat-card">
            <span class="number">0</span>
            <span class="label">总提交数</span>
        </div>
    `;
    
    statsContent.innerHTML = `
        <div class="no-data">
            <div class="no-data-icon">📭</div>
            <h2>暂无数据</h2>
            <p>还没有人提交问卷，快去分享问卷链接吧！</p>
        </div>
    `;
}

// 显示统计信息
function displayStatsInfo(allData) {
    const statsInfo = document.getElementById('statsInfo');
    const totalCount = allData.length;
    const today = new Date().toISOString().split('T')[0];
    const todayCount = allData.filter(item => item.submitTime && item.submitTime.startsWith(today)).length;
    
    statsInfo.innerHTML = `
        <div class="stat-card">
            <span class="number">${totalCount}</span>
            <span class="label">总提交数</span>
        </div>
        <div class="stat-card">
            <span class="number">${todayCount}</span>
            <span class="label">今日提交</span>
        </div>
        <div class="stat-card">
            <span class="number">${getUniqueAnswers('budget', allData).length}</span>
            <span class="label">预算分布</span>
        </div>
    `;
}

// 显示各问题统计
function displayQuestionStats(allData) {
    const statsContent = document.getElementById('statsContent');
    let html = '';
    
    // 遍历每个问题
    Object.keys(questionMap).forEach(questionKey => {
        if (questionKey === 'expectations') {
            // 文本题特殊处理
            html += generateTextQuestionStats(questionKey, allData);
        } else {
            // 选择题统计
            html += generateChoiceQuestionStats(questionKey, allData);
        }
    });
    
    statsContent.innerHTML = html;
}

// 生成选择题统计
function generateChoiceQuestionStats(questionKey, allData) {
    const questionText = questionMap[questionKey];
    const answers = allData.map(item => item[questionKey]).filter(Boolean);
    
    if (answers.length === 0) return '';
    
    // 统计答案
    const stats = {};
    answers.forEach(answer => {
        if (Array.isArray(answer)) {
            // 多选
            answer.forEach(item => {
                stats[item] = (stats[item] || 0) + 1;
            });
        } else {
            // 单选
            stats[answer] = (stats[answer] || 0) + 1;
        }
    });
    
    // 排序
    const sortedStats = Object.entries(stats)
        .sort((a, b) => b[1] - a[1]);
    
    const total = answers.length;
    const maxCount = Math.max(...Object.values(stats));
    
    let html = `
        <div class="question-stats">
            <h3>${questionText}</h3>
    `;
    
    sortedStats.forEach(([answer, count]) => {
        const percentage = ((count / total) * 100).toFixed(1);
        const barWidth = maxCount > 0 ? (count / maxCount) * 100 : 0;
        
        html += `
            <div class="answer-item">
                <div class="answer-label">${answer}</div>
                <div class="answer-count">${count}票</div>
                <div class="answer-bar">
                    <div class="answer-bar-fill" style="width: ${barWidth}%">${count > 0 ? count : ''}</div>
                </div>
                <div class="answer-percentage">${percentage}%</div>
            </div>
        `;
    });
    
    html += `</div>`;
    return html;
}

// 生成文本题统计
function generateTextQuestionStats(questionKey, allData) {
    const questionText = questionMap[questionKey];
    const answers = allData
        .map(item => ({
            text: item[questionKey],
            time: item.submitTime
        }))
        .filter(item => item.text && item.text.trim());
    
    if (answers.length === 0) return '';
    
    let html = `
        <div class="question-stats">
            <h3>${questionText}</h3>
            <div class="text-answers">
    `;
    
    answers.forEach((item, index) => {
        const date = item.time ? new Date(item.time).toLocaleString('zh-CN') : '未知时间';
        html += `
            <div class="text-answer-item">
                <div><strong>回答 ${index + 1}:</strong></div>
                <div>${item.text}</div>
                <div class="time">提交时间: ${date}</div>
            </div>
        `;
    });
    
    html += `
            </div>
        </div>
    `;
    return html;
}

// 获取唯一答案
function getUniqueAnswers(questionKey, allData) {
    const answers = allData.map(item => item[questionKey]).filter(Boolean);
    const unique = new Set();
    answers.forEach(answer => {
        if (Array.isArray(answer)) {
            answer.forEach(item => unique.add(item));
        } else {
            unique.add(answer);
        }
    });
    return Array.from(unique);
}

// 导出数据
function exportData() {
    const allData = getAllSurveyData();
    
    if (allData.length === 0) {
        alert('暂无数据可导出！');
        return;
    }
    
    // 转换为CSV格式
    const headers = Object.keys(questionMap);
    let csv = '提交时间,' + headers.join(',') + '\n';
    
    allData.forEach(item => {
        const row = [
            item.submitTime || '',
            ...headers.map(key => {
                const value = item[key];
                if (Array.isArray(value)) {
                    return value.join('; ');
                }
                return value || '';
            })
        ];
        csv += row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',') + '\n';
    });
    
    // 创建下载链接
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `问卷统计_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    alert('数据导出成功！');
}

// 页面加载时初始化
document.addEventListener('DOMContentLoaded', function() {
    initStats();
});
