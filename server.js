// Import required modules
const express = require('express');
const path = require('path');
const ical = require('node-ical');
const axios = require('axios');
const { initializeDatabase, getUserByName, createUser, updateUserCalendarUrl } = require('./server/db');

// Create Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Serve static files from 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Parse JSON request bodies
app.use(express.json());

// Initialiseer de database bij opstarten
initializeDatabase();

// API endpoint to fetch and parse calendar data
app.get('/api/calendar', async (req, res) => {
  try {
    const { calendarUrl, startDate, endDate } = req.query;
    
    if (!calendarUrl) {
      return res.status(400).json({ error: 'Calendar URL is required' });
    }
    
    // Fetch iCalendar data
    const response = await axios.get(calendarUrl);
    
    if (response.status !== 200) {
      return res.status(response.status).json({ 
        error: `Failed to fetch calendar data: ${response.statusText}` 
      });
    }
    
    const icalData = response.data;
    
    // Parse the iCalendar data and filter by date range
    const events = parseICalendar(icalData, startDate, endDate);
    
    res.json(events);
  } catch (error) {
    console.error('Error in /api/calendar:', error);
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
});

// Function to parse iCalendar data and filter by date range
function parseICalendar(icalData, startDate, endDate) {
  try {
    const startDateTime = startDate ? new Date(startDate) : null;
    const endDateTime = endDate ? new Date(endDate) : null;
    
    // Parse iCalendar data
    const parsedData = ical.parseICS(icalData);
    
    // Extract relevant event data
    const events = [];
    
    for (const key in parsedData) {
      const event = parsedData[key];
      
      // Skip non-events
      if (event.type !== 'VEVENT') continue;
      
      const eventStart = parseICalDate(event.start);
      const eventEnd = parseICalDate(event.end);
      
      // Skip events outside the requested date range
      if (startDateTime && eventEnd < startDateTime) continue;
      if (endDateTime && eventStart > endDateTime) continue;
      
      // Extract relevant information
      const teacher = extractTeacherInfo(event.description || '');
      const subject = formatSubject(event.summary || '');
      const location = formatLocation(event.location || '');
      
      events.push({
        id: key,
        subject,
        location,
        teacher,
        start: eventStart,
        end: eventEnd
      });
    }
    
    return events;
  } catch (error) {
    console.error('Error parsing iCalendar data:', error);
    throw new Error('Failed to parse calendar data');
  }
}

// Helper function to parse iCal date format
function parseICalDate(dateStr) {
  if (!dateStr) return null;
  
  // Handle both Date and String formats
  const date = dateStr instanceof Date ? dateStr : new Date(dateStr);
  return date;
}

// Extract teacher information from description
function extractTeacherInfo(description) {
  const teacherMatch = description.match(/Docent: ([^,]+)/i);
  return teacherMatch ? teacherMatch[1].trim() : '';
}

// Format subject name
function formatSubject(summary) {
  // Remove any extraneous information in parentheses
  return summary.replace(/\([^)]*\)/g, '').trim();
}

// Format location
function formatLocation(location) {
  return location.trim();
}

// API endpoint om een gebruiker op te halen of aan te maken
app.post('/api/user', async (req, res) => {
  try {
    const { username, calendarUrl } = req.body;
    
    if (!username) {
      return res.status(400).json({ error: 'Gebruikersnaam is verplicht' });
    }
    
    // Haal gebruiker op of maak nieuwe aan
    let user = await getUserByName(username);
    
    if (!user) {
      // Gebruiker bestaat niet, maak een nieuwe aan
      user = await createUser(username, calendarUrl || null);
      return res.status(201).json(user);
    } else if (calendarUrl && user.calendar_url !== calendarUrl) {
      // Update kalender URL als deze is opgegeven en verschilt van huidige URL
      user = await updateUserCalendarUrl(username, calendarUrl);
    }
    
    res.json(user);
  } catch (error) {
    console.error('Error in /api/user:', error);
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
});

// Fallback route for all other requests
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start the server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server draait op poort ${PORT}`);
});