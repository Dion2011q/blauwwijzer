function importLocalData(file) {
    const reader = new FileReader();
    
    reader.onload = function(event) {
        try {
            const data = JSON.parse(event.target.result);
            
            // Clear old localStorage data
            localStorage.clear();
            
            // Import new data
            for (const key in data) {
                if (data.hasOwnProperty(key)) {
                    localStorage.setItem(key, data[key]);
                }
            }
            
            alert('Data successfully imported!');
        } catch (error) {
            alert('Error importing file: ' + error.message);
        }
    };
    
    reader.readAsText(file);
}

// Usage: attach to file input element
// document.getElementById('fileInput').addEventListener('change', (e) => importLocalData(e.target.files[0]));