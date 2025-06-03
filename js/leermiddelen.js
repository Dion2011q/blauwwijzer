
// Learning resources functionality
document.addEventListener('DOMContentLoaded', function() {
    const apiLink = document.getElementById('api-link');
    const addLinkBtn = document.getElementById('add-link-btn');
    const linkNameInput = document.getElementById('link-name');
    const linkUrlInput = document.getElementById('link-url');
    const customLinksContainer = document.getElementById('custom-links');

    // Load API URL from localStorage
    function loadApiUrl() {
        const apiUrl = localStorage.getItem('api-url');
        if (apiUrl) {
            apiLink.href = apiUrl;
            apiLink.style.display = 'inline-block';
        } else {
            apiLink.style.display = 'none';
        }
    }

    // Load custom links from localStorage
    function loadCustomLinks() {
        const customLinks = JSON.parse(localStorage.getItem('custom-links') || '[]');
        customLinksContainer.innerHTML = '';
        
        customLinks.forEach((link, index) => {
            const linkElement = createLinkElement(link.name, link.url, index);
            customLinksContainer.appendChild(linkElement);
        });
    }

    // Create a link element with delete functionality
    function createLinkElement(name, url, index) {
        const linkDiv = document.createElement('div');
        linkDiv.className = 'custom-link-item';
        
        linkDiv.innerHTML = `
            <a href="${url}" target="_blank" class="resource-link" style="position: relative; display: block; padding-right: 40px;">${name}</a>
            <button class="delete-link-btn" data-index="${index}">×</button>
        `;
        
        // Add delete functionality
        const deleteBtn = linkDiv.querySelector('.delete-link-btn');
        deleteBtn.addEventListener('click', () => deleteCustomLink(index));
        
        return linkDiv;
    }

    // Add custom link
    function addCustomLink() {
        const name = linkNameInput.value.trim();
        const url = linkUrlInput.value.trim();
        
        if (!name || !url) {
            alert('Vul zowel de naam als de URL in.');
            return;
        }
        
        const customLinks = JSON.parse(localStorage.getItem('custom-links') || '[]');
        customLinks.push({ name, url });
        localStorage.setItem('custom-links', JSON.stringify(customLinks));
        
        linkNameInput.value = '';
        linkUrlInput.value = '';
        loadCustomLinks();
    }

    // Delete custom link
    function deleteCustomLink(index) {
        const customLinks = JSON.parse(localStorage.getItem('custom-links') || '[]');
        customLinks.splice(index, 1);
        localStorage.setItem('custom-links', JSON.stringify(customLinks));
        loadCustomLinks();
    }

    // Event listeners
    if (addLinkBtn) {
        addLinkBtn.addEventListener('click', addCustomLink);
    }

    // Handle Enter key in input fields
    if (linkNameInput && linkUrlInput) {
        [linkNameInput, linkUrlInput].forEach(input => {
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    addCustomLink();
                }
            });
        });
    }

    // Initialize
    loadApiUrl();
    loadCustomLinks();
});
