
const themeToggleBtn = document.getElementById('theme-toggle-btn');

// Load saved dark mode preference
const savedDarkMode = localStorage.getItem('darkMode');
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

// Set initial dark mode state
let isDark = savedDarkMode !== null ? savedDarkMode === 'true' : prefersDark;
document.body.classList.toggle('dark-theme', isDark);
themeToggleBtn.textContent = isDark ? '🌙' : '☀️';

// Listen for theme toggle clicks
themeToggleBtn.addEventListener('click', () => {
  isDark = !isDark;
  document.body.classList.toggle('dark-theme', isDark);
  localStorage.setItem('darkMode', isDark);
  themeToggleBtn.textContent = isDark ? '🌙' : '☀️';
});

// Listen for system theme changes
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
  if (localStorage.getItem('darkMode') === null) {
    isDark = e.matches;
    document.body.classList.toggle('dark-theme', isDark);
    themeToggleBtn.textContent = isDark ? '🌙' : '☀️';
  }
});
