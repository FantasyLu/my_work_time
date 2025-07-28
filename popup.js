let workTimeData = {};
let currentDisplayDate = new Date();
let currentlyEditingDate = null; // 用于跟踪正在编辑的日期

// DOM Elements for Modal
let modal, closeModal, saveTime, cancelEdit, modalDate, startTimeInput, endTimeInput;

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
  let workDaysCount = 0; // 添加工作天数计数器
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
        
        // 如果有工作时间记录，增加工作天数
        if (hours > 0) {
          workDaysCount++;
        }
        
        const dayCell = document.createElement('div');
        dayCell.classList.add('calendar-cell');
        
        // 创建单元格内容，移除编辑按钮
        const cellContent = document.createElement('div');
        cellContent.classList.add('cell-content');
        
        const dateDisplay = document.createElement('div');
        dateDisplay.classList.add('date-display');
        dateDisplay.textContent = dayCounter;
        
        const hoursDisplay = document.createElement('div');
        hoursDisplay.classList.add('hours-display');
        hoursDisplay.textContent = `${hours.toFixed(2)}h`;
        
        cellContent.appendChild(dateDisplay);
        cellContent.appendChild(hoursDisplay);
        dayCell.appendChild(cellContent);
        
        // 添加点击事件到整个单元格
        dayCell.addEventListener('click', function() {
          showEditModal(dateStr);
        });
        
        // 检查是否是今天
        const today = getTodayString();
        if (dateStr === today) {
          dayCell.classList.add('today');
        }
        
        // 检查是否是周末
        const dayOfWeek = new Date(year, month, dayCounter).getDay();
        if (dayOfWeek === 0 || dayOfWeek === 6) {
          dayCell.classList.add('weekend');
        }
        
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

  // 更新统计信息
  document.getElementById('monthlyTotalHours').textContent = `${monthlyTotal.toFixed(2)}h`;
  document.getElementById('workDays').textContent = workDaysCount;
  
  // 计算日均工时
  const avgHours = workDaysCount > 0 ? monthlyTotal / workDaysCount : 0;
  document.getElementById('avgHours').textContent = `${avgHours.toFixed(2)}h`;
}

// 将时间戳转换为 HH:mm 格式
function formatTime(timestamp) {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

// 显示编辑模态框
function showEditModal(dateStr) {
  currentlyEditingDate = dateStr;
  const dayData = workTimeData[dateStr];

  modalDate.textContent = `编辑 ${dateStr} 的时间`;
  startTimeInput.value = dayData ? formatTime(dayData.firstClick) : '';
  endTimeInput.value = dayData ? formatTime(dayData.lastClick) : '';

  modal.style.display = "block";
}

// 隐藏编辑模态框
function hideEditModal() {
  modal.style.display = "none";
  currentlyEditingDate = null;
}

// 保存手动输入的时间
async function saveManualTime() {
  if (!currentlyEditingDate) return;

  const [year, month, day] = currentlyEditingDate.split('-').map(Number);

  const startTime = startTimeInput.value;
  const endTime = endTimeInput.value;

  let firstClickTs = null;
  let lastClickTs = null;

  if (startTime) {
    const [startHour, startMinute] = startTime.split(':').map(Number);
    firstClickTs = new Date(year, month - 1, day, startHour, startMinute).getTime();
  }

  if (endTime) {
    const [endHour, endMinute] = endTime.split(':').map(Number);
    lastClickTs = new Date(year, month - 1, day, endHour, endMinute).getTime();
  }

  // 如果只有一个时间，则另一个时间也设为一样，以记录单个时间点
  if (firstClickTs && !lastClickTs) lastClickTs = firstClickTs;
  if (!firstClickTs && lastClickTs) firstClickTs = lastClickTs;

  if (firstClickTs && lastClickTs) {
      workTimeData[currentlyEditingDate] = {
        firstClick: firstClickTs,
        lastClick: lastClickTs
      };
  } else {
      // 如果两个时间都为空，则删除当天的记录
      delete workTimeData[currentlyEditingDate];
  }

  await saveData();
  renderCalendar(currentDisplayDate);
  hideEditModal();
}

// 导出数据到Excel（CSV格式）
function exportToExcel() {
    // 准备CSV内容
    const headers = ['日期', '开始时间', '结束时间', '工作时长(小时)'];
    let csvContent = '\uFEFF' + headers.join(',') + '\n'; // 添加BOM标记确保UTF-8编码

    // 将数据按日期排序
    const sortedDates = Object.keys(workTimeData).sort();

    // 添加每一天的数据
    sortedDates.forEach(date => {
        const dayData = workTimeData[date];
        const startTime = new Date(dayData.firstClick);
        const endTime = new Date(dayData.lastClick);
        const hours = calculateWorkHours(dayData.firstClick, dayData.lastClick);

        const row = [
            date,
            formatTime(dayData.firstClick),
            formatTime(dayData.lastClick),
            hours.toFixed(2)
        ];

        csvContent += row.join(',') + '\n';
    });

    // 创建Blob对象，明确指定UTF-8编码
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);

    // 创建下载链接并触发下载
    const link = document.createElement('a');
    const fileName = `工作时间记录_${new Date().toISOString().split('T')[0]}.csv`;
    
    link.setAttribute('href', url);
    link.setAttribute('download', fileName);
    link.style.display = 'none';
    
    document.body.appendChild(link);
    link.click();
    
    // 清理
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
}

// 初始化和事件监听
document.addEventListener('DOMContentLoaded', () => {
  // 初始化模态框相关的DOM元素
  modal = document.getElementById('editModal');
  closeModal = document.querySelector('.close-button');
  saveTime = document.getElementById('saveTime');
  cancelEdit = document.getElementById('cancelEdit');
  modalDate = document.getElementById('modalDate');
  startTimeInput = document.getElementById('startTime');
  endTimeInput = document.getElementById('endTime');

  loadData();
  document.getElementById('timeButton').addEventListener('click', recordTime);

  document.getElementById('importButton').addEventListener('click', () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv';
    input.style.display = 'none';

    input.addEventListener('change', async () => {
      if (!input.files.length) return;

      const file = input.files[0];
      const reader = new FileReader();

      reader.onload = async (e) => {
        let csv = e.target.result;
        
        // 移除BOM标记（如果存在）
        if (csv.charCodeAt(0) === 0xFEFF) {
          csv = csv.slice(1);
        }
        
        const rows = csv.split('\n').slice(1); // 跳过表头

        // 清空现有数据
        workTimeData = {};

        rows.forEach(row => {
          if (!row.trim()) return;

          const [date, startTime, endTime, hours] = row.split(',');

          // 解析开始和结束时间
          const [year, month, day] = date.split('-').map(Number);
          const [startHour, startMinute] = startTime.split(':').map(Number);
          const [endHour, endMinute] = endTime.split(':').map(Number);

          const firstClickTs = new Date(year, month - 1, day, startHour, startMinute).getTime();
          const lastClickTs = new Date(year, month - 1, day, endHour, endMinute).getTime();

          workTimeData[date] = {
            firstClick: firstClickTs,
            lastClick: lastClickTs
          };
        });

        await saveData();
        renderCalendar(currentDisplayDate);
      };

      // 明确指定使用UTF-8编码读取文件
      reader.readAsText(file, 'UTF-8');
    });

    document.body.appendChild(input);
    input.click();
    document.body.removeChild(input);
  });

  document.getElementById('exportButton').addEventListener('click', exportToExcel);

  document.getElementById('prevMonth').addEventListener('click', () => {
    currentDisplayDate.setMonth(currentDisplayDate.getMonth() - 1);
    renderCalendar(currentDisplayDate);
  });

  document.getElementById('nextMonth').addEventListener('click', () => {
    currentDisplayDate.setMonth(currentDisplayDate.getMonth() + 1);
    renderCalendar(currentDisplayDate);
  });

  // 模态框事件
  closeModal.addEventListener('click', hideEditModal);
  cancelEdit.addEventListener('click', hideEditModal);
  saveTime.addEventListener('click', saveManualTime);
  window.addEventListener('click', (event) => {
    if (event.target === modal) {
      hideEditModal();
    }
  });
});