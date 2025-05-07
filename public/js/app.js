// DOM Elements
const themeToggleBtn = document.getElementById('theme-toggle-btn');
const calendarSettingsBtn = document.getElementById('calendar-settings-btn');
const closeModalBtn = document.getElementById('close-modal-btn');
const saveCalendarBtn = document.getElementById('save-calendar-btn');
const calendarModal = document.getElementById('calendar-modal');
const calendarUrlInput = document.getElementById('calendar-url-input');
const usernameInput = document.getElementById('username-input');
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
  username: localStorage.getItem('username') || '',
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
  saveCalendarBtn.addEventListener('click', saveUserSettings);
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
  
  // Vul username in als deze is opgeslagen
  if (state.username) {
    usernameInput.value = state.username;
    
    // Laad gebruikersgegevens van database
    fetchUserFromDatabase(state.username);
  }
  
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

// Haal gebruikersgegevens op van de database
async function fetchUserFromDatabase(username) {
  try {
    // Maak een POST request naar de API
    const response = await fetch('/api/user', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username })
    });
    
    if (!response.ok) {
      throw new Error('Kon gebruiker niet ophalen');
    }
    
    const userData = await response.json();
    
    // Sla calendarUrl op in state en localStorage als die bestaat
    if (userData.calendar_url) {
      state.calendarUrl = userData.calendar_url;
      localStorage.setItem('calendarUrl', userData.calendar_url);
      calendarUrlInput.value = userData.calendar_url;
      
      // Laad het rooster als de URL beschikbaar is
      loadScheduleData();
      
      // Als het modal open is, toon een bericht dat de kalender URL automatisch is geladen
      if (calendarModal.classList.contains('active')) {
        const successMessage = document.createElement('div');
        successMessage.className = 'success-message';
        successMessage.textContent = `Kalender-URL automatisch geladen voor ${username}!`;
        
        // Voeg bericht toe aan modal en verwijder het na 3 seconden
        const modalBody = document.querySelector('.modal-body');
        modalBody.prepend(successMessage);
        
        setTimeout(() => {
          successMessage.remove();
        }, 3000);
      }
    }
    
    console.log('Gebruiker opgehaald:', userData);
  } catch (error) {
    console.error('Fout bij ophalen gebruiker:', error);
  }
}

// Sla gebruikersinstellingen op
async function saveUserSettings() {
  const username = usernameInput.value.trim();
  const url = calendarUrlInput.value.trim();
  
  if (!username) {
    alert('Vul alsjeblieft je naam in');
    return;
  }
  
  try {
    // Sla op in localStorage
    state.username = username;
    localStorage.setItem('username', username);
    
    if (url) {
      state.calendarUrl = url;
      localStorage.setItem('calendarUrl', url);
    }
    
    // Stuur naar de database
    const response = await fetch('/api/user', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: username,
        calendarUrl: url || null
      })
    });
    
    if (!response.ok) {
      throw new Error('Kon gebruiker niet opslaan');
    }
    
    const userData = await response.json();
    console.log('Gebruiker opgeslagen:', userData);
    
    // Sluit modal en laad het rooster
    closeCalendarModal();
    loadScheduleData();
  } catch (error) {
    console.error('Fout bij opslaan gebruiker:', error);
    alert('Er ging iets mis bij het opslaan van je gegevens. Probeer het opnieuw.');
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
  timeSlots.forEach(timeSlotObj => {
    const timeSlot = timeSlotObj.time;
    const slotType = timeSlotObj.type;
    const slotData = scheduleBySlot[timeSlot];
    
    // Voor pauzes altijd de rij tonen
    // Voor lessen alleen tonen als er events zijn
    let hasAnyEvents = false;
    
    if (slotType === 'lesson') {
      daysOfWeek.forEach(day => {
        if (slotData.days[day.name]) {
          hasAnyEvents = true;
        }
      });
    }
    
    // Toon alle pauzes en lessen met events
    if (slotType === 'break' || hasAnyEvents) {
      const row = document.createElement('tr');
      
      if (slotType === 'break') {
        row.classList.add('break-row');
      }
      
      // Add the time cell
      const timeCell = document.createElement('td');
      timeCell.className = 'time-cell';
      
      if (slotType === 'break') {
        const timeText = document.createElement('span');
        timeText.textContent = timeSlot;
        
        const breakLabel = document.createElement('span');
        breakLabel.className = 'break-label';
        breakLabel.textContent = slotData.label || 'Pauze';
        
        timeCell.appendChild(timeText);
        timeCell.appendChild(document.createElement('br'));
        timeCell.appendChild(breakLabel);
      } else {
        timeCell.textContent = timeSlot;
      }
      
      row.appendChild(timeCell);
      
      // Add cells for each day
      daysOfWeek.forEach(day => {
        const cell = document.createElement('td');
        
        if (slotType === 'break') {
          cell.classList.add('break-cell');
        } else {
          const event = slotData.days[day.name];
          
          if (event) {
            cell.classList.add('has-event');
            
            const eventBlock = document.createElement('div');
            eventBlock.className = 'schedule-block';
            
            // Format nicer display with details
            const startTime = formatTime(new Date(event.start));
            const endTime = formatTime(new Date(event.end));
            eventBlock.textContent = `${event.subject} - ${event.location} - ${event.teacher}`;
            
            // Voeg title toe voor hover info
            eventBlock.title = `${event.subject}\nLocatie: ${event.location}\nDocent: ${event.teacher}\nTijd: ${startTime} - ${endTime}`;
            
            cell.appendChild(eventBlock);
          }
        }
        
        row.appendChild(cell);
      });
      
      scheduleBody.appendChild(row);
    }
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
  // Voor lesroosters met half-uurs intervallen inclusief pauzes van 20 minuten
  return [
    { time: '08:00 - 08:30', type: 'lesson' },
    { time: '08:30 - 09:00', type: 'lesson' },
    { time: '09:00 - 09:30', type: 'lesson' },
    { time: '09:30 - 10:00', type: 'lesson' },
    { time: '10:00 - 10:30', type: 'lesson' },
    { time: '10:30 - 10:50', type: 'break', label: 'Pauze' },
    { time: '10:50 - 11:20', type: 'lesson' },
    { time: '11:20 - 11:50', type: 'lesson' },
    { time: '11:50 - 12:10', type: 'break', label: 'Pauze' },
    { time: '12:10 - 12:40', type: 'lesson' },
    { time: '12:40 - 13:10', type: 'lesson' },
    { time: '13:10 - 13:30', type: 'break', label: 'Pauze' },
    { time: '13:30 - 14:00', type: 'lesson' },
    { time: '14:00 - 14:30', type: 'lesson' },
    { time: '14:30 - 15:00', type: 'lesson' },
    { time: '15:00 - 15:30', type: 'lesson' },
    { time: '15:30 - 16:00', type: 'lesson' },
    { time: '16:00 - 16:30', type: 'lesson' },
    { time: '16:30 - 17:00', type: 'lesson' }
  ];
}

function organizeScheduleBySlot(timeSlots, days) {
  const result = {};
  
  // Initialize the structure
  timeSlots.forEach(timeSlot => {
    result[timeSlot.time] = {
      type: timeSlot.type,
      label: timeSlot.label,
      days: {}
    };
    
    days.forEach(day => {
      result[timeSlot.time].days[day.name] = undefined;
    });
  });
  
  // Fill in the events
  if (state.scheduleData && state.scheduleData.length) {
    state.scheduleData.forEach(event => {
      const eventDate = new Date(event.start);
      const eventEndDate = new Date(event.end);
      const dayName = eventDate.toLocaleDateString('nl-NL', { weekday: 'long' });
      
      // Tijdstippen vergelijken als getallen voor makkelijkere vergelijking
      const eventStartTime = eventDate.getHours() * 60 + eventDate.getMinutes();
      const eventEndTime = eventEndDate.getHours() * 60 + eventEndDate.getMinutes();
      
      // Loop door timeslots om te zien of ze overlappen met het event
      // Alleen lesperiodes (geen pauzes) kunnen events bevatten
      timeSlots.filter(slot => slot.type === 'lesson').forEach(timeSlot => {
        const [slotStartStr, slotEndStr] = timeSlot.time.split(' - ');
        
        // Sla slot tijd op in minuten sinds middernacht
        const [slotStartHour, slotStartMin] = slotStartStr.split(':').map(Number);
        const [slotEndHour, slotEndMin] = slotEndStr.split(':').map(Number);
        
        const slotStartTime = slotStartHour * 60 + slotStartMin;
        const slotEndTime = slotEndHour * 60 + slotEndMin;
        
        // Als het event en de tijdslot elkaar overlappen
        const overlap = 
          // Event begint in de slot
          (eventStartTime >= slotStartTime && eventStartTime < slotEndTime) ||
          // Event eindigt in de slot
          (eventEndTime > slotStartTime && eventEndTime <= slotEndTime) ||
          // Event omvat de hele slot
          (eventStartTime <= slotStartTime && eventEndTime >= slotEndTime);
          
        if (overlap) {
          result[timeSlot.time].days[dayName] = event;
        }
      });
    });
  }
  
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