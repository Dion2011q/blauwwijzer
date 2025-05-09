
const noteTitle = document.getElementById('note-title');
const noteContent = document.getElementById('note-content');
const saveNoteBtn = document.getElementById('save-note');
const notesList = document.getElementById('notes-list');

// Load notes from localStorage
let notes = JSON.parse(localStorage.getItem('notes')) || [];

function initApp() {
    saveNoteBtn.addEventListener('click', saveNote);
    renderNotes();
}

function saveNote() {
    const title = noteTitle.value.trim();
    const content = noteContent.value.trim();
    
    if (title && content) {
        const note = {
            id: Date.now(),
            title,
            content,
            date: new Date().toLocaleString()
        };
        
        notes.push(note);
        localStorage.setItem('notes', JSON.stringify(notes));
        
        noteTitle.value = '';
        noteContent.value = '';
        
        renderNotes();
    }
}

function deleteNote(id) {
    notes = notes.filter(note => note.id !== id);
    localStorage.setItem('notes', JSON.stringify(notes));
    renderNotes();
}

function renderNotes() {
    notesList.innerHTML = '';
    notes.forEach(note => {
        const noteElement = document.createElement('div');
        noteElement.className = 'note-item';
        noteElement.innerHTML = `
            <h3>${note.title}</h3>
            <p>${note.content}</p>
            <small>${note.date}</small>
            <button class="delete-btn" onclick="deleteNote(${note.id})">×</button>
        `;
        notesList.appendChild(noteElement);
    });
}

document.addEventListener('DOMContentLoaded', initApp);
