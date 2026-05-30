const STORAGE_KEY = "toilet-records";
const recordButton = document.getElementById("recordButton");
const painRecordButton = document.getElementById("painRecordButton");
const painModal = document.getElementById("painModal");
const modalCancelButton = document.getElementById("modalCancelButton");
const severityOptions = Array.from(document.querySelectorAll(".severity-option"));
const calendarTitle = document.getElementById("calendarTitle");
const prevMonthButton = document.getElementById("prevMonth");
const nextMonthButton = document.getElementById("nextMonth");
const calendar = document.getElementById("calendar");
const dayDetails = document.getElementById("dayDetails");
let selectedDate = null;

const today = new Date();
let displayYear = today.getFullYear();
let displayMonth = today.getMonth();

const PAIN_LEVELS = [
  { level: 1, label: "軽い", color: "#2ab7a9", symbol: "●" },
  { level: 2, label: "普通", color: "#f2c94c", symbol: "●" },
  { level: 3, label: "強い", color: "#f2994a", symbol: "●" },
  { level: 4, label: "非常に強い", color: "#eb5757", symbol: "●" },
];

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
  const year = displayYear;
  const month = displayMonth;
  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startWeekday = firstDay.getDay();

  for (let blank = 0; blank < startWeekday; blank += 1) {
    const emptyCell = document.createElement("div");
    emptyCell.className = "calendar-day";
    calendar.appendChild(emptyCell);
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const key = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const cell = document.createElement("div");
    const dayRecords = records.filter((item) => item.date === key);
    const hasToiletRecord = dayRecords.some((item) => item.type === "toilet");
    const isToday = key === getTodayKey();
    const isSelected = key === selectedDate;
    const classes = [
      "calendar-day",
      hasToiletRecord && "toilet-marked",
      isToday && "today",
      isSelected && "selected",
      "clickable",
    ].filter(Boolean).join(" ");
    cell.className = classes;
    cell.textContent = String(day);
    cell.dataset.date = key;

    const strongestPain = dayRecords
      .filter((item) => item.type === "pain")
      .sort((a, b) => b.level - a.level)[0];

    if (strongestPain) {
      const dot = document.createElement("span");
      dot.className = "severity-dot";
      dot.style.background = strongestPain.color;
      cell.appendChild(dot);
    }

    cell.addEventListener("click", () => selectDay(key, records));
    calendar.appendChild(cell);
  }
}

function updateStatus(records) {
  // No visible status text required in current UI.
  return;
}

function updateCalendarTitle() {
  const monthLabel = `${displayYear}年${displayMonth + 1}月`;
  calendarTitle.textContent = monthLabel;
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

  dayDetails.innerHTML = `<strong>${formatDayLabel(dateKey)} の記録</strong><p class="detail-note">タップで削除できます。</p>`;
  const list = document.createElement("ul");
  list.className = "detail-list";

  selectedRecords.sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1)).forEach((item) => {
    const itemLi = document.createElement("li");
    itemLi.className = "detail-item";
    itemLi.dataset.timestamp = item.timestamp;

    if (item.type === "pain") {
      itemLi.innerHTML = `${item.time} - 腹痛 <span class="detail-dot" style="background: ${item.color};"></span>`;
    } else {
      itemLi.textContent = `${item.time} - 🌱`;
    }

    itemLi.addEventListener("click", () => {
      if (window.confirm("この記録を削除しますか？")) {
        deleteRecord(item.timestamp);
        selectedDate = dateKey;
      }
    });

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
    type: "toilet",
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

function recordPain(level) {
  const records = loadRecords();
  const now = new Date();
  const levelInfo = PAIN_LEVELS.find((item) => item.level === Number(level));
  const newRecord = {
    type: "pain",
    date: getTodayKey(),
    displayDate: formatDate(now),
    time: formatTime(now),
    timestamp: now.toISOString(),
    level: levelInfo.level,
    levelLabel: levelInfo.label,
    color: levelInfo.color,
    symbol: levelInfo.symbol,
  };
  records.push(newRecord);
  saveRecords(records);
  return records;
}

function deleteRecord(timestamp) {
  const records = loadRecords().filter((item) => item.timestamp !== timestamp);
  saveRecords(records);
  refreshUI();
}

function refreshUI() {
  const records = loadRecords();
  updateCalendarTitle();
  buildCalendar(records);
  showDayDetails(records, selectedDate);
}

recordButton.addEventListener("click", () => {
  recordToday();
  refreshUI();
});

painRecordButton.addEventListener("click", () => {
  openPainModal();
});

prevMonthButton.addEventListener("click", () => {
  displayMonth -= 1;
  if (displayMonth < 0) {
    displayMonth = 11;
    displayYear -= 1;
  }
  refreshUI();
});

nextMonthButton.addEventListener("click", () => {
  displayMonth += 1;
  if (displayMonth > 11) {
    displayMonth = 0;
    displayYear += 1;
  }
  refreshUI();
});

severityOptions.forEach((button) => {
  button.addEventListener("click", () => {
    const selectedLevel = button.dataset.level;
    recordPain(selectedLevel);
    closePainModal();
    refreshUI();
  });
});

modalCancelButton.addEventListener("click", () => {
  closePainModal();
});

painModal.addEventListener("click", (event) => {
  if (event.target === painModal) {
    closePainModal();
  }
});

function openPainModal() {
  painModal.classList.remove("hidden");
  painModal.setAttribute("aria-hidden", "false");
}

function closePainModal() {
  painModal.classList.add("hidden");
  painModal.setAttribute("aria-hidden", "true");
}

let refreshing = false;

if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('service-worker.js');
      console.log('Service Worker registered:', registration.scope);

      if (registration.waiting) {
        registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      }

      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            console.log('Service Worker state:', newWorker.state);
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              newWorker.postMessage({ type: 'SKIP_WAITING' });
            }
          });
        }
      });

      await registration.update();
      console.log('Service Worker update check completed.');
    } catch (error) {
      console.warn('Service Worker registration failed:', error);
    }
  });

  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (refreshing) return;
    refreshing = true;
    window.location.reload();
  });
}

refreshUI();
