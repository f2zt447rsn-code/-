const STORAGE_KEY = "toilet-records";
const recordButton = document.getElementById("recordButton");
const statusMessage = document.getElementById("statusMessage");
const calendar = document.getElementById("calendar");
const dayDetails = document.getElementById("dayDetails");
const historyList = document.getElementById("historyList");
let selectedDate = null;

function loadRecords() {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored ? JSON.parse(stored) : [];
}

function saveRecords(records) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

function formatDate(date) {
  return date.toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

function formatTime(date) {
  return date.toLocaleTimeString("ja-JP", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getTodayKey() {
  const today = new Date();
  const y = today.getFullYear();
  const m = String(today.getMonth() + 1).padStart(2, "0");
  const d = String(today.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function buildCalendar(records) {
  calendar.innerHTML = "";
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startWeekday = firstDay.getDay();
  const markedDates = new Set(records.map((item) => item.date));

  for (let blank = 0; blank < startWeekday; blank += 1) {
    const emptyCell = document.createElement("div");
    emptyCell.className = "calendar-day";
    calendar.appendChild(emptyCell);
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const key = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const cell = document.createElement("div");
    const isMarked = markedDates.has(key);
    const isToday = key === getTodayKey();
    const isSelected = key === selectedDate;
    const classes = ["calendar-day", isMarked && "marked", isToday && "today", isSelected && "selected", "clickable"].filter(Boolean).join(" ");
    cell.className = classes;
    cell.textContent = String(day);
    cell.dataset.date = key;
    cell.addEventListener("click", () => selectDay(key, records));
    calendar.appendChild(cell);
  }
}

function renderHistory(records) {
  historyList.innerHTML = "";
  const sorted = [...records].sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1));

  if (sorted.length === 0) {
    const emptyItem = document.createElement("li");
    emptyItem.textContent = "記録がまだありません。";
    historyList.appendChild(emptyItem);
    return;
  }

  sorted.slice(0, 10).forEach((item) => {
    const li = document.createElement("li");

    const left = document.createElement("div");
    const dateSpan = document.createElement("div");
    dateSpan.className = "history-date";
    dateSpan.textContent = item.displayDate;

    const timeSpan = document.createElement("div");
    timeSpan.className = "history-time";
    timeSpan.textContent = item.time;

    left.append(dateSpan, timeSpan);

    const symbolSpan = document.createElement("span");
    symbolSpan.className = "history-symbol";
    symbolSpan.textContent = item.symbol;

    const deleteButton = document.createElement("button");
    deleteButton.className = "history-delete";
    deleteButton.type = "button";
    deleteButton.textContent = "削除";
    deleteButton.addEventListener("click", () => {
      if (window.confirm("この記録を削除しますか？")) {
        deleteRecord(item.timestamp);
      }
    });

    li.append(left, symbolSpan, deleteButton);
    historyList.appendChild(li);
  });
}

function updateStatus(records) {
  const todayKey = getTodayKey();
  const todayCount = records.filter((item) => item.date === todayKey).length;

  if (todayCount > 0) {
    statusMessage.textContent = `本日の記録: ${todayCount} 回`;
  } else {
    statusMessage.textContent = "今日の記録はまだありません。記録ボタンを押してください。";
  }
}

function formatDayLabel(dateKey) {
  const date = new Date(dateKey);
  return date.toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

function showDayDetails(records, dateKey) {
  if (!dateKey) {
    dayDetails.textContent = "日付をタップしてその日の記録を確認できます。";
    return;
  }

  const selectedRecords = records.filter((item) => item.date === dateKey);
  if (selectedRecords.length === 0) {
    dayDetails.textContent = `${formatDayLabel(dateKey)} の記録はありません。`;
    return;
  }

  dayDetails.innerHTML = `<strong>${formatDayLabel(dateKey)} の記録</strong>`;
  const list = document.createElement("ul");
  list.className = "detail-list";

  selectedRecords.sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1)).forEach((item) => {
    const itemLi = document.createElement("li");
    itemLi.textContent = `${item.time} - ${item.symbol}`;
    list.appendChild(itemLi);
  });

  dayDetails.appendChild(list);
}

function selectDay(dateKey, records) {
  selectedDate = dateKey;
  buildCalendar(records);
  showDayDetails(records, dateKey);
}

function recordToday() {
  const records = loadRecords();
  const now = new Date();
  const newRecord = {
    date: getTodayKey(),
    displayDate: formatDate(now),
    time: formatTime(now),
    timestamp: now.toISOString(),
    symbol: "⚪",
  };
  records.push(newRecord);
  saveRecords(records);
  return records;
}

function deleteRecord(timestamp) {
  const records = loadRecords().filter((item) => item.timestamp !== timestamp);
  saveRecords(records);
  statusMessage.textContent = "記録を削除しました。";
  refreshUI();
}

function refreshUI() {
  const records = loadRecords();
  buildCalendar(records);
  renderHistory(records);
  updateStatus(records);
  showDayDetails(records, selectedDate);
}

recordButton.addEventListener("click", () => {
  recordToday();
  statusMessage.textContent = "記録しました。";
  refreshUI();
});

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('service-worker.js')
      .then((registration) => {
        console.log('Service Worker registered:', registration.scope);
      })
      .catch((error) => {
        console.warn('Service Worker registration failed:', error);
      });
  });
}

refreshUI();
