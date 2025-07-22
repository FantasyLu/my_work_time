let workTimeData = {};

// 加载存储的数据
async function loadData() {
  const result = await chrome.storage.local.get(['workTimeData']);
  workTimeData = result.workTimeData || {};
  updateUI();
}

// 保存数据
async function saveData() {
  await chrome.storage.local.set({ workTimeData });
}

// 获取今天的日期字符串 (YYYY-MM-DD)
function getTodayString() {
  return new Date().toISOString().split('T')[0];
}

// 记录时间
async function recordTime() {
  const today = getTodayString();
  const now = new Date();
  
  if (!workTimeData[today]) {
    workTimeData[today] = {
      firstClick: now.getTime(),
      lastClick: now.getTime()
    };
  } else {
    workTimeData[today].lastClick = now.getTime();
  }
  
  await saveData();
  updateUI();
}

// 计算工作时间（小时）
function calculateWorkHours(firstClick, lastClick) {
  const hours = (lastClick - firstClick) / (1000 * 60 * 60);
  return Math.round(hours * 100) / 100;
}

// 更新UI显示
function updateUI() {
  // 更新历史记录
  const historyList = document.getElementById('historyList');
  historyList.innerHTML = '';
  
  Object.entries(workTimeData)
    .sort((a, b) => b[0].localeCompare(a[0]))
    .forEach(([date, data]) => {
      const hours = calculateWorkHours(data.firstClick, data.lastClick);
      const div = document.createElement('div');
      div.textContent = `${date}: ${hours.toFixed(2)}小时`;
      historyList.appendChild(div);
    });

  // 更新统计数据
  updateStats();
}

// 更新统计数据
function updateStats() {
  const today = new Date();
  let weeklyHours = 0;
  let monthlyHours = 0;

  Object.entries(workTimeData).forEach(([date, data]) => {
    const workDate = new Date(date);
    const hours = calculateWorkHours(data.firstClick, data.lastClick);
    
    // 计算本周工作时间
    const daysDiff = Math.floor((today - workDate) / (1000 * 60 * 60 * 24));
    if (daysDiff < 7) {
      weeklyHours += hours;
    }
    
    // 计算本月工作时间
    if (workDate.getMonth() === today.getMonth() && 
        workDate.getFullYear() === today.getFullYear()) {
      monthlyHours += hours;
    }
  });

  document.getElementById('weeklyHours').textContent = weeklyHours.toFixed(2);
  document.getElementById('monthlyHours').textContent = monthlyHours.toFixed(2);
}

// 初始化
document.addEventListener('DOMContentLoaded', () => {
  loadData();
  document.getElementById('timeButton').addEventListener('click', recordTime);
});