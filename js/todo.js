
// DOM-elementen
const todoForm = document.getElementById('todo-form');
const todoInput = document.getElementById('todo-input');
const todoList = document.getElementById('todo-list');

// Laad taken van localStorage
let todos = JSON.parse(localStorage.getItem('todos')) || [];

// Initialiseer de app
function initApp() {
    
  // Luisteraars van evenementen instellen
  todoForm.addEventListener('submit', addTodo);
  
  // Render bestaande taken
  renderTodos();
}



function addTodo(e) {
  e.preventDefault();
  const text = todoInput.value.trim();
  if (text) {
    const todo = {
      id: Date.now(),
      text,
      completed: false
    };
    todos.push(todo);
    localStorage.setItem('todos', JSON.stringify(todos));
    todoInput.value = '';
    renderTodos();
  }
}

function toggleTodo(id) {
  todos = todos.map(todo => 
    todo.id === id ? {...todo, completed: !todo.completed} : todo
  );
  localStorage.setItem('todos', JSON.stringify(todos));
  renderTodos();
}

function deleteTodo(id) {
  todos = todos.filter(todo => todo.id !== id);
  localStorage.setItem('todos', JSON.stringify(todos));
  renderTodos();
}

function renderTodos() {
  todoList.innerHTML = '';
  todos.forEach(todo => {
    const li = document.createElement('li');
    li.innerHTML = `
      <input type="checkbox" ${todo.completed ? 'checked' : ''}>
      <span class="${todo.completed ? 'completed' : ''}">${todo.text}</span>
      <button class="delete-btn">×</button>
    `;
    
    const checkbox = li.querySelector('input');
    checkbox.addEventListener('change', () => toggleTodo(todo.id));
    
    const deleteBtn = li.querySelector('.delete-btn');
    deleteBtn.addEventListener('click', () => deleteTodo(todo.id));
    
    todoList.appendChild(li);
  });
}

// Initialiseren wanneer DOM is geladen
document.addEventListener('DOMContentLoaded', initApp);
