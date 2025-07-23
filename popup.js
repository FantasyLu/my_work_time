let workTimeData = {};
let currentDisplayDate = new Date();

// 加载存储的数据
async function loadData() {
  const result = await chrome.storage.local.get(['workTimeData']);
  workTimeData = result.workTimeData || {};
  renderCalendar(currentDisplayDate);
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
  renderCalendar(currentDisplayDate);
}

// 计算工作时间（小时）
function calculateWorkHours(firstClick, lastClick) {
  if (!firstClick || !lastClick) return 0;
  const hours = (lastClick - firstClick) / (1000 * 60 * 60);
  return Math.round(hours * 100) / 100;
}

// 渲染日历
function renderCalendar(date) {
  const year = date.getFullYear();
  const month = date.getMonth();

  document.getElementById('monthYear').textContent = `${year}年 ${month + 1}月`;

  const calendarGrid = document.getElementById('calendarGrid');
  calendarGrid.innerHTML = '';

  // 添加表头
  const days = ['日', '一', '二', '三', '四', '五', '六', '周总计'];
  days.forEach(day => {
    const headerCell = document.createElement('div');
    headerCell.classList.add('calendar-cell', 'day-header');
    headerCell.textContent = day;
    calendarGrid.appendChild(headerCell);
  });

  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  
  let monthlyTotal = 0;
  let weeklyTotal = 0;
  let dayCounter = 1;

  // 填充日历网格
  for (let i = 0; i < 6; i++) { // 最多6行
    if (dayCounter > daysInMonth) break;

    for (let j = 0; j < 7; j++) {
      if (i === 0 && j < firstDayOfMonth) {
        const emptyCell = document.createElement('div');
        emptyCell.classList.add('calendar-cell');
        calendarGrid.appendChild(emptyCell);
      } else if (dayCounter <= daysInMonth) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayCounter).padStart(2, '0')}`;
        const dayData = workTimeData[dateStr];
        const hours = dayData ? calculateWorkHours(dayData.firstClick, dayData.lastClick) : 0;
        
        const dayCell = document.createElement('div');
        dayCell.classList.add('calendar-cell');
        dayCell.innerHTML = `<strong>${dayCounter}</strong><br>${hours.toFixed(2)}h`;
        calendarGrid.appendChild(dayCell);

        weeklyTotal += hours;
        monthlyTotal += hours;
        dayCounter++;
      } else {
        const emptyCell = document.createElement('div');
        emptyCell.classList.add('calendar-cell');
        calendarGrid.appendChild(emptyCell);
      }
    }
    // 添加周总计
    const weekTotalCell = document.createElement('div');
    weekTotalCell.classList.add('calendar-cell', 'week-total');
    weekTotalCell.textContent = `${weeklyTotal.toFixed(2)}h`;
    calendarGrid.appendChild(weekTotalCell);
    weeklyTotal = 0;
  }

  document.getElementById('monthlyTotalHours').textContent = `${monthlyTotal.toFixed(2)}h`;
}

// 初始化和事件监听
document.addEventListener('DOMContentLoaded', () => {
  loadData();
  document.getElementById('timeButton').addEventListener('click', recordTime);

  document.getElementById('prevMonth').addEventListener('click', () => {
    currentDisplayDate.setMonth(currentDisplayDate.getMonth() - 1);
    renderCalendar(currentDisplayDate);
  });

  document.getElementById('nextMonth').addEventListener('click', () => {
    currentDisplayDate.setMonth(currentDisplayDate.getMonth() + 1);
    renderCalendar(currentDisplayDate);
  });
});