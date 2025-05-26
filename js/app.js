// DOM Elements
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
  schedules: JSON.parse(localStorage.getItem('schedules')) || [],
  activeScheduleIndex: parseInt(localStorage.getItem('activeScheduleIndex')) || 0,
  calendarUrl: localStorage.getItem('calendarUrl') || '', // Remove after schedules are implemented
  userName: localStorage.getItem('userName') || '', // Remove after schedules are implemented
  currentWeek: getCurrentWeek(),
  scheduleData: [],
  isLoading: false,
  error: null
};

// Initialize the app
function initApp() {
  // Update title with username if available
  const userName = localStorage.getItem('userName');
  if (userName) {
    document.getElementById('weekrooster-title').textContent = `${userName}'s weekrooster`;
  }

  // Show modal immediately if no calendar URL is set
  if (!state.schedules || state.schedules.length === 0) {
    openCalendarModal();
    closeModalBtn.style.display = 'none'; // Hide close button
  }

  // Set up event listeners
  calendarSettingsBtn.addEventListener('click', openCalendarModal);
  closeModalBtn.addEventListener('click', () => {
    calendarModal.classList.remove('active');
    closeModalBtn.style.display = 'block'; // Reset display of close button
  });

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
  mediaQuery.addEventListener('change', (e) => {
    if (localStorage.getItem('darkMode') === null) {
      state.darkMode = e.matches;
      document.body.classList.toggle('dark-theme', state.darkMode);
      themeToggleBtn.textContent = state.darkMode ? '🌙' : '☀️';
    }
  });

  // Load schedule data if we have schedules
  if (state.schedules && state.schedules.length > 0) {
    loadScheduleData();
  } else {
    // Show calendar modal if no schedules are set
    openCalendarModal();
  }
    // Initialize schedule switcher
    updateScheduleSwitcher();

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
  const name = document.getElementById('name-input').value.trim();
  if (url && name) {
    const newSchedule = { name, url };
    state.schedules.push(newSchedule);
    state.activeScheduleIndex = state.schedules.length - 1;
    localStorage.setItem('schedules', JSON.stringify(state.schedules));
    localStorage.setItem('activeScheduleIndex', state.activeScheduleIndex);
    updateScheduleSwitcher();
    closeCalendarModal();
    loadScheduleData();
  }
}

function updateScheduleSwitcher() {
  const switcher = document.getElementById('schedule-switcher');
  switcher.innerHTML = '';

  const addButton = document.createElement('button');
  addButton.innerHTML = '+ Voeg rooster toe';
  addButton.className = 'schedule-add-btn';
  addButton.onclick = openCalendarModal;
  switcher.appendChild(addButton);

  state.schedules.forEach((schedule, index) => {
    const scheduleContainer = document.createElement('div');
    scheduleContainer.className = 'schedule-container';

    const button = document.createElement('button');
    button.textContent = schedule.name;
    button.className = `schedule-switch-btn ${index === state.activeScheduleIndex ? 'active' : ''}`;
    button.onclick = () => switchSchedule(index);

    const deleteButton = document.createElement('button');
    deleteButton.innerHTML = '×';
    deleteButton.className = 'schedule-delete-btn';
    deleteButton.onclick = (e) => {
      e.stopPropagation();
      if (confirm(`Weet je zeker dat je het rooster van ${schedule.name} wilt verwijderen?`)) {
        state.schedules.splice(index, 1);
        if (state.activeScheduleIndex === index) {
          state.activeScheduleIndex = state.schedules.length > 0 ? 0 : -1;
        } else if (state.activeScheduleIndex > index) {
          state.activeScheduleIndex--;
        }
        localStorage.setItem('schedules', JSON.stringify(state.schedules));
        localStorage.setItem('activeScheduleIndex', state.activeScheduleIndex);
        updateScheduleSwitcher();
        loadScheduleData();
      }
    };

    scheduleContainer.appendChild(button);
    scheduleContainer.appendChild(deleteButton);
    switcher.appendChild(scheduleContainer);
  });
}

function switchSchedule(index) {
  state.activeScheduleIndex = index;
  localStorage.setItem('activeScheduleIndex', index);
  updateScheduleSwitcher();
  loadScheduleData();
  const schedule = state.schedules[index];
  document.getElementById('weekrooster-title').textContent = `${schedule.name}'s weekrooster`;
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

// Gebruik de bestaande scheduleTable variabele
if (scheduleTable) {
  scheduleTable.addEventListener('touchstart', e => {
    touchStartX = e.changedTouches[0].screenX;
  });

  scheduleTable.addEventListener('touchend', e => {
    touchEndX = e.changedTouches[0].screenX;
    handleSwipe();
  });
}

function handleSwipe() {
  const swipeThreshold = 100; // Verhoog de drempelwaarde
  const swipeLength = touchEndX - touchStartX;

  // Controleer of de swipe lang genoeg is
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

  // Controleer of de huidige week overeenkomt met de week van vandaag
  const now = new Date();
  const isCurrentWeek = now >= state.currentWeek.start && now <= state.currentWeek.end;

  if (isCurrentWeek) {
    currentWeekDisplay.textContent = "Deze week";
  } else {
    currentWeekDisplay.textContent = `${startDate} - ${endDate}`;
  }
}

// Schedule data loading
async function loadScheduleData() {
  const activeSchedule = state.schedules[state.activeScheduleIndex];
  if (!activeSchedule) {
    state.error = "Geen rooster geselecteerd";
    state.isLoading = false;
    updateUIState();
    updateScheduleSwitcher();
    return;
  }

  // Update title with schedule name
  document.getElementById('weekrooster-title').textContent = `${activeSchedule.name}'s weekrooster`;

  state.isLoading = true;
  state.error = null;
  updateUIState();
  updateScheduleSwitcher();

  try {
    console.log('Attempting to load calendar from:', activeSchedule.url);

    let icalData;
    let url = activeSchedule.url;

    // Convert Google Calendar sharing URL to iCal format if needed
    if (url.includes('calendar.google.com/calendar/u/') && url.includes('cid=')) {
      const cidMatch = url.match(/cid=([^&]+)/);
      if (cidMatch) {
        const decodedCid = decodeURIComponent(cidMatch[1]);
        url = `https://calendar.google.com/calendar/ical/${decodedCid}/public/basic.ics`;
      }
    }

    try {
      // Probeer eerst direct te laden
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Direct fetch failed');
      }
      icalData = await response.text();
    } catch (directError) {
      console.log('Direct fetch failed, trying with CORS proxy:', directError.message);
      
      // Probeer met CORS proxy
      const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(url)}`;
      try {
        const proxyResponse = await fetch(proxyUrl);
        if (!proxyResponse.ok) {
          throw new Error('Proxy fetch failed');
        }
        icalData = await proxyResponse.text();
      } catch (proxyError) {
        // Laatste poging met allorigins
        const allOriginsUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
        const allOriginsResponse = await fetch(allOriginsUrl);
        if (!allOriginsResponse.ok) {
          throw new Error('Failed to load calendar data via any method');
        }
        const allOriginsData = await allOriginsResponse.json();
        icalData = allOriginsData.contents;
      }
    }

    const allEvents = parseICalData(icalData);

    // Filter events for current week
    state.scheduleData = allEvents.filter(event => {
      const eventDate = new Date(event.start);
      return eventDate >= state.currentWeek.start && eventDate <= state.currentWeek.end;
    });

    renderScheduleTable();
  } catch (error) {
    console.error('Error loading schedule data:', error);
    state.error = `Fout bij laden rooster: ${error.message}`;
  } finally {
    state.isLoading = false;
    updateUIState();
  }
}

// UI rendering functions
// This line sets up the application state.
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
  const currentTimeMinutes = now.getHours() * 60 + now.getMinutes();

  for (let i = 0; i < timeSlots.length; i++) {
    const [start, end] = timeSlots[i].split(' - ');
    const [startHour, startMin] = start.split(':').map(Number);
    const [endHour, endMin] = end.split(':').map(Number);
    
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;
    
    if (currentTimeMinutes >= startMinutes && currentTimeMinutes <= endMinutes) {
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

        // Highlight current time slot only for current day and current week
        const now = new Date();
        const isCurrentWeek = now >= state.currentWeek.start && now <= state.currentWeek.end;
        const currentDayName = now.toLocaleDateString('nl-NL', { weekday: 'long' });
        
        if (isCurrentWeek && day.name === currentDayName) {
          const currentTimeSlotIndex = getCurrentTimeSlot(timeSlots);
          const currentSlotIndex = timeSlots.indexOf(timeSlot);
          
          if (currentTimeSlotIndex === currentSlotIndex) {
            cell.classList.add('current-time-cell');
          }
        }

        const event = scheduleBySlot[timeSlot][day.name];

        if (event) {
          cell.classList.add('has-event');

          const eventBlock = document.createElement('div');
          const isBreak = event.isBreak || isDetectedBreak(timeSlot);
          eventBlock.className = `schedule-block${isBreak ? ' break' : ''}`;

          // Only add content for actual events, not breaks
          if (!isBreak) {
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
          }

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
  if (!state.scheduleData || state.scheduleData.length === 0) {
    // Fallback naar standaard tijdslots als er geen data is
    return [
      '08:30 - 09:00',
      '09:00 - 09:30',
      '09:30 - 10:00',
      '10:00 - 10:30',
      '10:30 - 10:50',
      '10:50 - 11:20',
      '11:20 - 11:50',
      '11:50 - 12:10',
      '12:10 - 12:40',
      '12:40 - 13:10',
      '13:10 - 13:30',
      '13:30 - 14:00',
      '14:00 - 14:30',
      '14:30 - 15:00'
    ];
  }

  // Verzamel alle tijdspunten (start en eind) van events
  const timePoints = new Set();
  
  state.scheduleData.forEach(event => {
    const startTime = formatTime(new Date(event.start));
    const endTime = formatTime(new Date(event.end));
    timePoints.add(startTime);
    timePoints.add(endTime);
  });

  // Sorteer tijdspunten
  const sortedTimes = Array.from(timePoints).sort((a, b) => {
    const [aHour, aMin] = a.split(':').map(Number);
    const [bHour, bMin] = b.split(':').map(Number);
    const aMinutes = aHour * 60 + aMin;
    const bMinutes = bHour * 60 + bMin;
    return aMinutes - bMinutes;
  });

  // Genereer tijdslots van elkaar opeenvolgende tijdspunten
  const timeSlots = [];
  for (let i = 0; i < sortedTimes.length - 1; i++) {
    const startTime = sortedTimes[i];
    const endTime = sortedTimes[i + 1];
    
    // Controleer of dit tijdslot minimaal 5 minuten is
    const gap = getTimeDifference(startTime, endTime);
    if (gap >= 5) {
      timeSlots.push(`${startTime} - ${endTime}`);
    }
  }

  return timeSlots;
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

  // Fill in the events - improved matching for lessons that span multiple slots
  state.scheduleData.forEach(event => {
    const eventDate = new Date(event.start);
    const eventEndDate = new Date(event.end);
    const dayName = eventDate.toLocaleDateString('nl-NL', { weekday: 'long' });

    const eventStartTime = formatTime(eventDate);
    const eventEndTime = formatTime(eventEndDate);
    
    // Convert to minutes for easier comparison
    const [eventStartHour, eventStartMin] = eventStartTime.split(':').map(Number);
    const [eventEndHour, eventEndMin] = eventEndTime.split(':').map(Number);
    const eventStartMinutes = eventStartHour * 60 + eventStartMin;
    const eventEndMinutes = eventEndHour * 60 + eventEndMin;

    // Check each time slot to see if this event overlaps with it
    timeSlots.forEach(timeSlot => {
      const [slotStart, slotEnd] = timeSlot.split(' - ');
      const [slotStartHour, slotStartMin] = slotStart.split(':').map(Number);
      const [slotEndHour, slotEndMin] = slotEnd.split(':').map(Number);
      const slotStartMinutes = slotStartHour * 60 + slotStartMin;
      const slotEndMinutes = slotEndHour * 60 + slotEndMin;

      // Check if event overlaps with this time slot
      const eventOverlapsSlot = (
        (eventStartMinutes <= slotStartMinutes && eventEndMinutes > slotStartMinutes) ||
        (eventStartMinutes < slotEndMinutes && eventEndMinutes >= slotEndMinutes) ||
        (eventStartMinutes >= slotStartMinutes && eventEndMinutes <= slotEndMinutes)
      );

      if (eventOverlapsSlot) {
        result[timeSlot][dayName] = event;
      }
    });
  });

  // Add breaks for detected break slots (per day basis)
  timeSlots.forEach(timeSlot => {
    days.forEach(day => {
      if (!result[timeSlot][day.name] && isDetectedBreakForDay(timeSlot, day.name)) {
        result[timeSlot][day.name] = {
          subject: '',
          location: '',
          teacher: '',
          start: new Date(),
          end: new Date(),
          isBreak: true
        };
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

function getTimeDifference(time1, time2) {
  const [h1, m1] = time1.split(':').map(Number);
  const [h2, m2] = time2.split(':').map(Number);
  
  const minutes1 = h1 * 60 + m1;
  const minutes2 = h2 * 60 + m2;
  
  return Math.abs(minutes2 - minutes1);
}

function isDetectedBreak(timeSlot) {
  // Check if this time slot has any overlapping events
  const [slotStart, slotEnd] = timeSlot.split(' - ');
  const [slotStartHour, slotStartMin] = slotStart.split(':').map(Number);
  const [slotEndHour, slotEndMin] = slotEnd.split(':').map(Number);
  const slotStartMinutes = slotStartHour * 60 + slotStartMin;
  const slotEndMinutes = slotEndHour * 60 + slotEndMin;

  const hasOverlappingEvent = state.scheduleData.some(event => {
    const eventStartTime = formatTime(new Date(event.start));
    const eventEndTime = formatTime(new Date(event.end));
    const [eventStartHour, eventStartMin] = eventStartTime.split(':').map(Number);
    const [eventEndHour, eventEndMin] = eventEndTime.split(':').map(Number);
    const eventStartMinutes = eventStartHour * 60 + eventStartMin;
    const eventEndMinutes = eventEndHour * 60 + eventEndMin;

    // Check if event overlaps with this time slot
    return (
      (eventStartMinutes <= slotStartMinutes && eventEndMinutes > slotStartMinutes) ||
      (eventStartMinutes < slotEndMinutes && eventEndMinutes >= slotEndMinutes) ||
      (eventStartMinutes >= slotStartMinutes && eventEndMinutes <= slotEndMinutes)
    );
  });
  
  // Als er geen overlappend event is voor dit tijdslot, is het waarschijnlijk een pauze
  return !hasOverlappingEvent;
}

function isDetectedBreakForDay(timeSlot, dayName) {
  // Check if this time slot has any overlapping events for this specific day
  const [slotStart, slotEnd] = timeSlot.split(' - ');
  const [slotStartHour, slotStartMin] = slotStart.split(':').map(Number);
  const [slotEndHour, slotEndMin] = slotEnd.split(':').map(Number);
  const slotStartMinutes = slotStartHour * 60 + slotStartMin;
  const slotEndMinutes = slotEndHour * 60 + slotEndMin;

  const hasOverlappingEventOnDay = state.scheduleData.some(event => {
    const eventDate = new Date(event.start);
    const eventDayName = eventDate.toLocaleDateString('nl-NL', { weekday: 'long' });
    
    // Only check events for this specific day
    if (eventDayName !== dayName) {
      return false;
    }

    const eventStartTime = formatTime(new Date(event.start));
    const eventEndTime = formatTime(new Date(event.end));
    const [eventStartHour, eventStartMin] = eventStartTime.split(':').map(Number);
    const [eventEndHour, eventEndMin] = eventEndTime.split(':').map(Number);
    const eventStartMinutes = eventStartHour * 60 + eventStartMin;
    const eventEndMinutes = eventEndHour * 60 + eventEndMin;

    // Check if event overlaps with this time slot
    return (
      (eventStartMinutes <= slotStartMinutes && eventEndMinutes > slotStartMinutes) ||
      (eventStartMinutes < slotEndMinutes && eventEndMinutes >= slotEndMinutes) ||
      (eventStartMinutes >= slotStartMinutes && eventEndMinutes <= slotEndMinutes)
    );
  });
  
  // Als er geen overlappend event is voor dit tijdslot op deze dag, is het waarschijnlijk een pauze
  return !hasOverlappingEventOnDay;
}


// Initialize the app when the DOM is loaded
document.addEventListener('DOMContentLoaded', initApp);
