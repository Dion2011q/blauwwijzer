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
  themeToggleBtn.addEventListener('click', toggleDarkMode);
  calendarSettingsBtn.addEventListener('click', openCalendarModal);
  closeModalBtn.addEventListener('click', closeCalendarModal);
  saveCalendarBtn.addEventListener('click', saveCalendarUrl);
  prevWeekBtn.addEventListener('click', goToPreviousWeek);
  nextWeekBtn.addEventListener('click', goToNextWeek);
  
  // Check system preference for dark mode
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    state.darkMode = true;
    document.body.classList.add('dark-theme');
  }
  
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
function toggleDarkMode() {
  state.darkMode = !state.darkMode;
  document.body.classList.toggle('dark-theme', state.darkMode);
}

function handleSystemThemeChange(e) {
  state.darkMode = e.matches;
  document.body.classList.toggle('dark-theme', state.darkMode);
}

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
  
  const end = new Date(start);
  end.setDate(start.getDate() + 4);
  end.setHours(23, 59, 59, 999);
  
  return { start, end };
}

function getPreviousWeek(startDate) {
  const start = new Date(startDate);
  start.setDate(start.getDate() - 7);
  
  const end = new Date(start);
  end.setDate(start.getDate() + 4);
  end.setHours(23, 59, 59, 999);
  
  return { start, end };
}

function goToNextWeek() {
  state.currentWeek = getNextWeek(state.currentWeek.start);
  updateWeekDisplay();
  loadScheduleData();
}

function goToPreviousWeek() {
  state.currentWeek = getPreviousWeek(state.currentWeek.start);
  updateWeekDisplay();
  loadScheduleData();
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
    
    const url = `/api/calendar?calendarUrl=${encodeURIComponent(state.calendarUrl)}&startDate=${startDateStr}&endDate=${endDateStr}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error('Failed to load schedule data');
    }
    
    state.scheduleData = await response.json();
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

function renderScheduleTable() {
  // Clear the table
  scheduleBody.innerHTML = '';
  
  // Get the days of the week
  const daysOfWeek = getDaysOfWeek();
  
  // Get time slots
  const timeSlots = getTimeSlots();
  
  // Organize schedule data by day and time slot
  const scheduleBySlot = organizeScheduleBySlot(timeSlots, daysOfWeek);
  
  // Render each time slot row
  timeSlots.forEach(timeSlot => {
    const row = document.createElement('tr');
    
    // Add the time cell
    const timeCell = document.createElement('td');
    timeCell.className = 'time-cell';
    timeCell.textContent = timeSlot;
    row.appendChild(timeCell);
    
    // Add cells for each day
    daysOfWeek.forEach(day => {
      const cell = document.createElement('td');
      const event = scheduleBySlot[timeSlot][day.name];
      
      if (event) {
        cell.classList.add('has-event');
        
        const eventBlock = document.createElement('div');
        eventBlock.className = 'schedule-block';
        eventBlock.textContent = `${event.subject} ${event.location} ${event.teacher}`;
        
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
    '08:30 - 09:15',
    '09:15 - 10:00',
    '10:00 - 10:45',
    '11:00 - 11:45',
    '11:45 - 12:30',
    '13:00 - 13:45',
    '13:45 - 14:30',
    '14:30 - 15:15',
    '15:30 - 16:15',
    '16:15 - 17:00'
  ];
}

function organizeScheduleBySlot(timeSlots, days) {
  const result = {};
  
  // Initialize the structure
  timeSlots.forEach(timeSlot => {
    result[timeSlot] = {};
    days.forEach(day => {
      result[timeSlot][day.name] = undefined;
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
      
      // Simple check if event falls in this slot (could be improved)
      if (eventTimeStart <= slotStart && eventTimeEnd >= slotEnd) {
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

// Initialize the app when the DOM is loaded
document.addEventListener('DOMContentLoaded', initApp);