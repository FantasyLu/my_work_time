let workTimeData = {};
let currentDisplayDate = new Date();
let currentlyEditingDate = null; // 用于跟踪正在编辑的日期

// DOM Elements for Modal
let modal, closeModal, saveTime, cancelEdit, modalDate, startTimeInput, endTimeInput;

// 加载存储的数据
async function loadData() {
  const result = await chrome.storage.local.get(['workTimeData']);
  workTimeData = result.workTimeData || {};
  await renderCalendar(currentDisplayDate);
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
async function recordTime(event) {
  const today = getTodayString();
  const now = new Date();
  const button = document.getElementById('timeButton');
  
  // 添加按钮按下效果
  button.classList.add('pushed');
  
  // 创建星星弹出效果，传递点击事件
  createStarEffect(button, event);
  
  // 创建涟漪效果，传递点击事件
  createRippleEffect(button, event);
  
  if (!workTimeData[today]) {
    workTimeData[today] = {
      firstClick: now.getTime(),
      lastClick: now.getTime()
    };
  } else {
    workTimeData[today].lastClick = now.getTime();
  }
  
  await saveData();
  await renderCalendar(currentDisplayDate);
  
  setTimeout(() => {
    button.classList.remove('pushed');
  }, 600);
}

// 创建主题化随机emoji弹出效果
function createStarEffect(button, event) {
  let centerX, centerY;
  
  if (event && event.clientX && event.clientY) {
    centerX = event.clientX;
    centerY = event.clientY;
  } else {
    const buttonRect = button.getBoundingClientRect();
    centerX = buttonRect.left + buttonRect.width / 2;
    centerY = buttonRect.top + buttonRect.height / 2;
  }
  
  const emojiThemes = {
    celebration: ['🎉', '🎊', '🥳', '🎈', '🎁', '🏆'],
    sparkle: ['⭐', '✨', '🌟', '💫', '⚡', '💥'],
    nature: ['🌸', '🌺', '🌻', '🍀', '🌈', '🦄'],
    energy: ['🔥', '💎', '🚀', '⚡', '💥', '🌟'],
    love: ['❤️', '💖', '💝', '💕', '💗', '💘']
  };
  
  const themeKeys = Object.keys(emojiThemes);
  const randomTheme = themeKeys[Math.floor(Math.random() * themeKeys.length)];
  const selectedEmojis = emojiThemes[randomTheme];
  
  // 创建多个同主题的emoji
  for (let i = 0; i < 6; i++) {
    const emojiElement = document.createElement('div');
    emojiElement.className = 'star';
    
    // 从选定主题中随机选择emoji
    const randomEmoji = selectedEmojis[Math.floor(Math.random() * selectedEmojis.length)];
    emojiElement.textContent = randomEmoji;
    
    // 随机方向和距离
    const angle = (i * 60) + Math.random() * 30 - 15;
    const distance = 40 + Math.random() * 20;
    const dx = Math.cos(angle * Math.PI / 180) * distance;
    const dy = Math.sin(angle * Math.PI / 180) * distance;
    
    emojiElement.style.position = 'fixed';
    emojiElement.style.left = centerX + 'px';
    emojiElement.style.top = centerY + 'px';
    emojiElement.style.setProperty('--dx', dx + 'px');
    emojiElement.style.setProperty('--dy', dy + 'px');
    emojiElement.style.pointerEvents = 'none';
    emojiElement.style.zIndex = '10000';
    
    document.body.appendChild(emojiElement);
    
    setTimeout(() => {
      emojiElement.classList.add('animate');
    }, i * 50);
    
    setTimeout(() => {
      if (emojiElement.parentNode) {
        emojiElement.parentNode.removeChild(emojiElement);
      }
    }, 1200 + i * 50);
  }
}

// 创建涟漪效果（跟随鼠标位置）
function createRippleEffect(button, event) {
  let centerX, centerY;
  
  if (event && event.clientX && event.clientY) {
    // 使用鼠标点击位置
    centerX = event.clientX;
    centerY = event.clientY;
  } else {
    // 回退到按钮中心位置
    const buttonRect = button.getBoundingClientRect();
    centerX = buttonRect.left + buttonRect.width / 2;
    centerY = buttonRect.top + buttonRect.height / 2;
  }
  
  const ripple = document.createElement('div');
  ripple.className = 'success-ripple';
  
  ripple.style.left = (centerX - 50) + 'px';
  ripple.style.top = (centerY - 50) + 'px';
  ripple.style.position = 'fixed';
  
  document.body.appendChild(ripple);
  
  // 动画结束后移除元素
  setTimeout(() => {
    if (ripple.parentNode) {
      ripple.parentNode.removeChild(ripple);
    }
  }, 800);
}

// 创建全局点击星星效果
function createGlobalStarEffect(event) {
  // 确保获取正确的鼠标位置
  const centerX = event.clientX;
  const centerY = event.clientY;
  
  // 定义适合全局使用的emoji
  const globalEmojis = [
    '✨', '⭐', '🌟', '💫'
  ];
  
  // 创建3-4个emoji
  const emojiCount = 3;
  
  for (let i = 0; i < emojiCount; i++) {
    const emojiElement = document.createElement('div');
    emojiElement.className = 'star global-star';
    
    // 随机选择emoji
    const randomEmoji = globalEmojis[Math.floor(Math.random() * globalEmojis.length)];
    emojiElement.textContent = randomEmoji;
    
    // 随机方向和距离
    const angle = Math.random() * 360;
    const distance = 20 + Math.random() * 15;
    const dx = Math.cos(angle * Math.PI / 180) * distance;
    const dy = Math.sin(angle * Math.PI / 180) * distance;
    
    // 设置初始位置（使用fixed定位确保位置正确）
    emojiElement.style.position = 'fixed';
    emojiElement.style.left = centerX + 'px';
    emojiElement.style.top = centerY + 'px';
    emojiElement.style.setProperty('--dx', dx + 'px');
    emojiElement.style.setProperty('--dy', dy + 'px');
    emojiElement.style.pointerEvents = 'none';
    emojiElement.style.zIndex = '10000';
    
    document.body.appendChild(emojiElement);
    
    // 立即启动动画（减少延迟）
    setTimeout(() => {
      emojiElement.classList.add('animate');
    }, i * 20);
    
    // 动画结束后移除元素
    setTimeout(() => {
      if (emojiElement.parentNode) {
        emojiElement.parentNode.removeChild(emojiElement);
      }
    }, 800 + i * 20);
  }
}

// 计算工作时间（小时）
function calculateWorkHours(firstClick, lastClick) {
  if (!firstClick || !lastClick) return 0;
  const hours = (lastClick - firstClick) / (1000 * 60 * 60);
  return Math.round(hours * 100) / 100;
}

// 渲染日历
async function renderCalendar(date) {
  const year = date.getFullYear();
  const month = date.getMonth();

  document.getElementById('monthYear').textContent = `${year}年 ${month + 1}月`;

  // 获取当年的节假日数据
  const holidayData = await fetchHolidays(year);

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
        
        // 检查是否是周末和节假日
        const dayOfWeek = new Date(year, month, dayCounter).getDay();
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
        const isHolidayDay = isHoliday(year, month + 1, dayCounter, holidayData);
        
        // 检查该日期在节假日API中的状态
        const dateStr2 = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayCounter).padStart(2, '0')}`;
        const holidayInfo = holidayData[dateStr2];
        
        // 标红逻辑：
        // 1. 如果是节假日（isOffDay=true），标红
        // 2. 如果是周末且没有节假日信息，标红
        // 3. 如果是周末但节假日API标记为isOffDay=false（调休补班），不标红
        if (isHolidayDay) {
          dayCell.classList.add('holiday');
        } else if (isWeekend && (!holidayInfo || holidayInfo.isOffDay !== false)) {
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

  // 更新汇总信息
  document.getElementById('monthlyTotalHours').textContent = monthlyTotal.toFixed(2);
  document.getElementById('workDays').textContent = workDaysCount;
  document.getElementById('avgHours').textContent = workDaysCount > 0 ? (monthlyTotal / workDaysCount).toFixed(2) : '0.00';
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

  // 将日期字符串转换为更友好的格式
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
  const weekday = weekdays[date.getDay()];
  const formattedDate = `${year}年${month}月${day}日（${weekday})`;

  modalDate.value = formattedDate;
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
  await renderCalendar(currentDisplayDate);
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

          // 更安全的CSV解析，处理可能的引号
          const columns = row.split(',').map(col => col.replace(/^"|"$/g, '').trim());
          
          if (columns.length < 4) return; // 确保有足够的列
          
          const [date, startTime, endTime, hours] = columns;

          // 验证日期格式
          if (!/^\d{4}-\d{1,2}-\d{1,2}$/.test(date)) {
            console.warn(`跳过无效日期格式: ${date}`);
            return;
          }

          // 验证时间格式
          if (!/^\d{1,2}:\d{2}$/.test(startTime) || !/^\d{1,2}:\d{2}$/.test(endTime)) {
            console.warn(`跳过无效时间格式: ${startTime} - ${endTime}`);
            return;
          }

          try {
            // 解析开始和结束时间
            const [year, month, day] = date.split('-').map(Number);
            const [startHour, startMinute] = startTime.split(':').map(Number);
            const [endHour, endMinute] = endTime.split(':').map(Number);

            // 验证数值范围
            if (startHour < 0 || startHour > 23 || startMinute < 0 || startMinute > 59 ||
                endHour < 0 || endHour > 23 || endMinute < 0 || endMinute > 59) {
              console.warn(`跳过无效时间值: ${startTime} - ${endTime}`);
              return;
            }

            const firstClickTs = new Date(year, month - 1, day, startHour, startMinute).getTime();
            const lastClickTs = new Date(year, month - 1, day, endHour, endMinute).getTime();

            // 验证时间戳是否有效
            if (isNaN(firstClickTs) || isNaN(lastClickTs)) {
              console.warn(`跳过无效时间戳: ${date}`);
              return;
            }

            workTimeData[date] = {
              firstClick: firstClickTs,
              lastClick: lastClickTs
            };
          } catch (error) {
            console.warn(`解析行时出错: ${row}`, error);
          }
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


// 节假日数据缓存
let holidayCache = {};

// 获取指定年份的节假日数据
async function fetchHolidays(year) {
  // 如果缓存中已有该年份数据，直接返回
  if (holidayCache[year]) {
    return holidayCache[year];
  }

  try {
    const response = await fetch(`https://api.jiejiariapi.com/v1/holidays/${year}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    
    // 缓存数据
    holidayCache[year] = data;
    return data;
  } catch (error) {
    console.warn(`获取${year}年节假日数据失败:`, error);
    return {};
  }
}

// 检查指定日期是否为节假日
function isHoliday(year, month, day, holidayData) {
  const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  const holiday = holidayData[dateStr];
  
  // 返回是否为休息日（放假日）
  return holiday && holiday.isOffDay === true;
}

let globalStarEffectEnabled = true;

// 修改全局点击事件
document.addEventListener('click', function(event) {
  if (!globalStarEffectEnabled) return;
  
  const clickedElement = event.target;
  const isButton = clickedElement.id === 'timeButton' || clickedElement.closest('#timeButton');
  const isModal = clickedElement.closest('.modal');
  const isInteractive = clickedElement.tagName === 'BUTTON' || clickedElement.closest('button');
  
  if (!isButton && !isModal && !isInteractive) {
    createGlobalStarEffect(event);
  }
});

// 简单的提示信息函数
function showToast(message) {
  const toast = document.createElement('div');
  toast.textContent = message;
  toast.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: rgba(0,0,0,0.8);
    color: white;
    padding: 8px 12px;
    border-radius: 4px;
    font-size: 12px;
    z-index: 10000;
    opacity: 0;
    transition: opacity 0.3s;
  `;
  
  document.body.appendChild(toast);
  
  setTimeout(() => toast.style.opacity = '1', 10);
  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => document.body.removeChild(toast), 300);
  }, 2000);
}