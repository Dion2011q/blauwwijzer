// DOM Elements
const themeToggleBtn = document.getElementById('theme-toggle-btn');
const calendarSettingsBtn = document.getElementById('calendar-settings-btn');
const closeModalBtn = document.getElementById('close-modal-btn');
const saveCalendarBtn = document.getElementById('save-calendar-btn');
const calendarModal = document.getElementById('calendar-modal');
const calendarUrlInput = document.getElementById('calendar-url-input');
const currentWeekDisplay = document.getElementById('current-week');
const prevWeekBtn = document.getElementById('prev-week-btn');
const nextWeekBtn = document.getElementById('next-week-btn');
const scheduleTable = document.getElementById('schedule-table');
const scheduleBody = document.getElementById('schedule-body');
const loadingIndicator = document.getElementById('loading-indicator');
const calendarError = document.getElementById('calendar-error');

// Application state
let state = {
  darkMode: false,
  calendarUrl: localStorage.getItem('calendarUrl') || '',
  currentWeek: getCurrentWeek(),
  scheduleData: [],
  isLoading: false,
  error: null
};

// Initialize the app
function initApp() {
  // Set up event listeners
  calendarSettingsBtn.addEventListener('click', openCalendarModal);

  closeModalBtn.addEventListener('click', closeCalendarModal);

  document.getElementById('calendar-url-form').addEventListener('submit', (e) => {
    e.preventDefault();
    saveCalendarUrl();
  });

  prevWeekBtn.addEventListener('click', goToPreviousWeek);
  nextWeekBtn.addEventListener('click', goToNextWeek);

  // Load saved dark mode preference or use system preference
  const savedDarkMode = localStorage.getItem('darkMode');
  if (savedDarkMode !== null) {
    state.darkMode = savedDarkMode === 'true';
  } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    state.darkMode = true;
  }
  document.body.classList.toggle('dark-theme', state.darkMode);
  themeToggleBtn.textContent = state.darkMode ? '☀️' : '🌙';

  // Set up media query listener for theme changes
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  mediaQuery.addEventListener('change', handleSystemThemeChange);

  // If we have a calendar URL, load the schedule
  if (state.calendarUrl) {
    calendarUrlInput.value = state.calendarUrl;
    loadScheduleData();
  } else {
    // Show calendar modal if no URL is set
    openCalendarModal();
  }

  // Update the week display
  updateWeekDisplay();
}

// Theme functions


// Calendar modal functions
function openCalendarModal() {
  calendarModal.classList.add('active');
}

function closeCalendarModal() {
  calendarModal.classList.remove('active');
}

function saveCalendarUrl() {
  const url = calendarUrlInput.value.trim();
  if (url) {
    state.calendarUrl = url;
    localStorage.setItem('calendarUrl', url);
    closeCalendarModal();
    loadScheduleData();
  }
}

// Load saved calendar URL on startup
const savedCalendarUrl = localStorage.getItem('calendarUrl');
if (savedCalendarUrl) {
  state.calendarUrl = savedCalendarUrl;
  calendarUrlInput.value = savedCalendarUrl;
  loadScheduleData(); // Direct laden van rooster data
}

// Week navigation functions
function getCurrentWeek() {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0 is Sunday, 1 is Monday

  // Calculate the start of the week (Monday)
  const start = new Date(now);
  start.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
  start.setHours(0, 0, 0, 0);

  // Calculate the end of the week (Friday)
  const end = new Date(start);
  end.setDate(start.getDate() + 4); // 5 days (Mon-Fri)
  end.setHours(23, 59, 59, 999);

  return { start, end };
}

function getNextWeek(startDate) {
  const start = new Date(startDate);
  start.setDate(start.getDate() + 7);
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(end.getDate() + 4);
  end.setHours(23, 59, 59, 999);

  return { start, end };
}

function getPreviousWeek(startDate) {
  const start = new Date(startDate);
  start.setDate(start.getDate() - 7);

  const end = new Date(start);
  end.setDate(end.getDate() + 4);
  end.setHours(23, 59, 59, 999);

  return { start, end };
}

function animateWeekTransition(direction) {
  const table = document.getElementById('schedule-table');
  if (!table) return;

  // Reset transitie
  table.style.transition = 'none';
  table.style.transform = 'translateX(0)';
  table.offsetHeight;

  // Stel start positie in
  table.style.transform = `translateX(${direction === 'next' ? '-' : ''}100%)`;

  // Start animatie
  setTimeout(() => {
    table.style.transition = 'transform 0.3s ease-in-out';
    table.style.transform = 'translateX(0)';
  }, 50);
}

function goToNextWeek() {
  animateWeekTransition('next');
  state.currentWeek = getNextWeek(state.currentWeek.start);
  updateWeekDisplay();
  loadScheduleData();
}

function goToPreviousWeek() {
  animateWeekTransition('prev');
  state.currentWeek = getPreviousWeek(state.currentWeek.start);
  updateWeekDisplay();
  loadScheduleData();
}

// Touch swipe support
let touchStartX = 0;
let touchEndX = 0;

document.addEventListener('touchstart', e => {
  touchStartX = e.changedTouches[0].screenX;
});

document.addEventListener('touchend', e => {
  touchEndX = e.changedTouches[0].screenX;
  handleSwipe();
});

function handleSwipe() {
  const swipeThreshold = 50;
  const swipeLength = touchEndX - touchStartX;

  if (Math.abs(swipeLength) > swipeThreshold) {
    if (swipeLength > 0) {
      goToPreviousWeek();
    } else {
      goToNextWeek();
    }
  }
}

function updateWeekDisplay() {
  const startDate = state.currentWeek.start.toLocaleDateString('nl-NL', { 
    day: 'numeric', 
    month: 'long' 
  });

  const endDate = state.currentWeek.end.toLocaleDateString('nl-NL', { 
    day: 'numeric', 
    month: 'long',
    year: 'numeric'
  });

  currentWeekDisplay.textContent = `${startDate} - ${endDate}`;
}

// Schedule data loading
async function loadScheduleData() {
  if (!state.calendarUrl) return;

  state.isLoading = true;
  state.error = null;
  updateUIState();

  try {
    const startDateStr = state.currentWeek.start.toISOString();
    const endDateStr = state.currentWeek.end.toISOString();

    const url = state.calendarUrl; // Fetch directly from the URL

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error('Failed to load schedule data');
    }

    const icalData = await response.text();
    const allEvents = parseICalData(icalData);

    // Filter events for current week
    state.scheduleData = allEvents.filter(event => {
      const eventDate = new Date(event.start);
      return eventDate >= state.currentWeek.start && eventDate <= state.currentWeek.end;
    });

    renderScheduleTable();
  } catch (error) {
    console.error('Error loading schedule data:', error);
    state.error = error.message;
  } finally {
    state.isLoading = false;
    updateUIState();
  }
}

// UI rendering functions
function updateUIState() {
  if (state.isLoading) {
    loadingIndicator.classList.remove('hidden');
    scheduleTable.classList.add('hidden');
    calendarError.classList.add('hidden');
  } else if (state.error) {
    loadingIndicator.classList.add('hidden');
    scheduleTable.classList.add('hidden');
    calendarError.classList.remove('hidden');
  } else {
    loadingIndicator.classList.add('hidden');
    scheduleTable.classList.remove('hidden');
    calendarError.classList.add('hidden');
  }
}

function getCurrentTimeSlot(timeSlots) {
  const now = new Date();
  const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

  for (let i = 0; i < timeSlots.length; i++) {
    const [start, end] = timeSlots[i].split(' - ');
    if (currentTime >= start && currentTime <= end) {
      return i;
    }
  }
  return -1;
}

function renderScheduleTable() {
  // Clear the table
  scheduleBody.innerHTML = '';

  // Get the days of the week
  const daysOfWeek = getDaysOfWeek();

  // Get current day name
  const currentDay = new Date().toLocaleDateString('nl-NL', { weekday: 'long' });

  // Get time slots
  const timeSlots = getTimeSlots();

  // Organize schedule data by day and time slot
  const scheduleBySlot = organizeScheduleBySlot(timeSlots, daysOfWeek);

  // Render each time slot row
    timeSlots.forEach(timeSlot => {
    const row = document.createElement('tr');
    const currentTimeSlot = getCurrentTimeSlot(timeSlots);
    const currentDayName = new Date().toLocaleDateString('nl-NL', { weekday: 'long' });

    // Add the time cell
    const timeCell = document.createElement('td');
    timeCell.className = 'time-cell';
    timeCell.textContent = timeSlot;
    row.appendChild(timeCell);

    // Add cells for each day
    daysOfWeek.forEach(day => {
      const cell = document.createElement('td');
      if (day.name === currentDay) {
        cell.classList.add('current-day-cell');
      }

      // Highlight only the current time slot cell for the current day in current week
      const now = new Date();
      const currentTimeStr = now.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' });
      const [slotStart, slotEnd] = timeSlot.split(' - ');
      
      // Check if we're in the current week
      const isCurrentWeek = now >= state.currentWeek.start && now <= state.currentWeek.end;
      
      if (isCurrentWeek && currentTimeStr >= slotStart && currentTimeStr <= slotEnd) {
        const currentDayName = now.toLocaleDateString('nl-NL', { weekday: 'long' });
        if (day.name === currentDayName) {
          cell.classList.add('current-time-cell');
        }
      }

      const event = scheduleBySlot[timeSlot][day.name];

      if (event) {
        cell.classList.add('has-event');

        const eventBlock = document.createElement('div');
        const isPause = timeSlot === '10:30 - 10:50' || timeSlot === '11:50 - 12:10' || timeSlot === '13:10 - 13:30';
        eventBlock.className = `schedule-block${isPause ? ' break' : ''}`;

        if (isPause) {
          event.subject = 'Pauze';
        }

        const eventInfo = document.createElement('div');
        eventInfo.className = 'event-info';
        const displayText = [
          event.subject,
          event.location !== 'Geen locatie' ? event.location : '',
          event.teacher !== 'Onbekend' ? event.teacher : ''
        ].filter(Boolean).join(' ');
        eventInfo.textContent = displayText;

        const noteToggle = document.createElement('button');
        noteToggle.className = 'note-toggle';
        noteToggle.innerHTML = '📝';
        noteToggle.title = 'Toggle notities';

        const noteArea = document.createElement('textarea');
        noteArea.className = 'note-area hidden';
        noteArea.placeholder = 'Voeg notities toe...';

        // Load saved note if exists
        const eventDateTime = event.start.toISOString();
        const noteKey = `note_${eventDateTime}_${event.subject}`;
        const toggleKey = `noteToggle_${eventDateTime}_${event.subject}`;
        noteArea.value = localStorage.getItem(noteKey) || '';

        // Load saved toggle state
        const isVisible = localStorage.getItem(toggleKey) === 'true';
        if (isVisible) {
          noteArea.classList.remove('hidden');
        }

        noteToggle.addEventListener('click', () => {
          const isNowVisible = noteArea.classList.toggle('hidden');
          localStorage.setItem(toggleKey, !isNowVisible);
        });

        noteArea.addEventListener('input', () => {
          localStorage.setItem(noteKey, noteArea.value);
        });

        eventBlock.appendChild(eventInfo);
        eventBlock.appendChild(noteToggle);
        eventBlock.appendChild(noteArea);

        cell.appendChild(eventBlock);
      }

      row.appendChild(cell);
    });

    scheduleBody.appendChild(row);
  });
}

function getDaysOfWeek() {
  const days = [];
  const startDate = new Date(state.currentWeek.start);

  for (let i = 0; i < 5; i++) {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + i);

    days.push({
      name: date.toLocaleDateString('nl-NL', { weekday: 'long' }),
      date: date
    });
  }

  return days;
}

function getTimeSlots() {
  return [
    '08:30 - 08:59',
    '09:00 - 09:29',
    '09:30 - 09:59',
    '10:00 - 10:29',
    '10:50 - 11:19',
    '11:20 - 11:49',
    '12:10 - 12:39',
    '12:40 - 13:09',
    '13:30 - 13:59',
    '14:00 - 14:29',
    '14:30 - 14:59'
  ];
}

function organizeScheduleBySlot(timeSlots, days) {
  const result = {};
  const pauseTijden = ['10:30 - 10:49', '11:50 - 12:09', '13:10 - 13:29'];

  days.forEach(day => {
    result[day] = { slots: [...timeSlots], pauses: [...pauseTijden] };
  });

  return result;
}
  // Initialize the structure
  timeSlots.forEach(timeSlot => {
    result[timeSlot] = {};
    days.forEach(day => {
      if (pauseTijden.includes(timeSlot)) {
        // Voeg pauze toe voor alle dagen op pauzetijden
        result[timeSlot][day.name] = {
          subject: 'Pauze',
          location: '',
          teacher: '',
          start: new Date(),
          end: new Date()
        };
      } else {
        result[timeSlot][day.name] = undefined;
      }
    });
  });

  // Fill in the events
  state.scheduleData.forEach(event => {
    const eventDate = new Date(event.start);
    const dayName = eventDate.toLocaleDateString('nl-NL', { weekday: 'long' });

    // Format the time to match our time slots
    const eventTimeStart = formatTime(eventDate);
    const eventTimeEnd = formatTime(new Date(event.end));

    // Find the matching time slot
    timeSlots.forEach(timeSlot => {
      const [slotStart, slotEnd] = timeSlot.split(' - ');

      const [slotStartTime, slotEndTime] = timeSlot.split(' - ');
      const eventStartTime = eventTimeStart;
      const eventEndTime = eventTimeEnd;

      // Check if event overlaps with this time slot
      if (eventStartTime < slotEndTime && eventEndTime > slotStartTime) {
        result[timeSlot][dayName] = event;
      }
    });
  });

  return result;
}

function formatTime(date) {
  return date.toLocaleTimeString('nl-NL', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: false
  });
}

function parseICalData(icalData) {
  const events = [];
  const lines = icalData.split('\n');
  let currentEvent = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (line === 'BEGIN:VEVENT') {
      currentEvent = {};
    } else if (line === 'END:VEVENT' && currentEvent) {
      events.push(currentEvent);
      currentEvent = null;
    } else if (currentEvent) {
      if (line.startsWith('SUMMARY:')) {
        currentEvent.subject = line.substring(8);
      } else if (line.startsWith('LOCATION:')) {
        currentEvent.location = line.substring(9) || 'Geen locatie';
      } else if (line.startsWith('DESCRIPTION:')) {
        const desc = line.substring(12);
        const teacherMatch = desc.match(/Docent: ([^,]+)/i);
        currentEvent.teacher = teacherMatch ? teacherMatch[1].trim() : 'Onbekend';
      } else if (line.startsWith('DTSTART:')) {
        currentEvent.start = new Date(line.substring(8).replace(/(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z/, '$1-$2-$3T$4:$5:$6Z'));
      } else if (line.startsWith('DTEND:')) {
        currentEvent.end = new Date(line.substring(6).replace(/(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z/, '$1-$2-$3T$4:$5:$6Z'));
      }
    }
  }

  return events;
}


// Initialize the app when the DOM is loaded
document.addEventListener('DOMContentLoaded', initApp);
