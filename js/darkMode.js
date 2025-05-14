
// Dark mode functionality
function initDarkMode() {
  const themeToggleBtn = document.getElementById('theme-toggle-btn');
  
  // Load saved dark mode preference
  const savedDarkMode = localStorage.getItem('darkMode');
  if (savedDarkMode !== null) {
    const isDark = savedDarkMode === 'true';
    document.body.classList.toggle('dark-theme', isDark);
    themeToggleBtn.textContent = isDark ? '🌙☀' : '☀️';
  }
  
  // Set up event listener for theme toggle
  themeToggleBtn.addEventListener('click', () => {
    const isDark = document.body.classList.toggle('dark-theme');
    localStorage.setItem('darkMode', isDark);
    themeToggleBtn.textContent = isDark ? '🌙' : '☀️';
  });
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initDarkMode);
