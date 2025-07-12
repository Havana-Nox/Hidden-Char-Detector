document.addEventListener('DOMContentLoaded', () => {
    // 1. DOM Elements
    const inputText = document.getElementById('input-text');
    const visualizedOutput = document.getElementById('visualized-output');
    const cleanedOutput = document.getElementById('cleaned-output');
    const statsList = document.getElementById('stats-list');
    const optionsList = document.getElementById('options-list');
    const cleanAllBtn = document.getElementById('clean-all-btn');
    const copyBtn = document.getElementById('copy-btn');
    const downloadBtn = document.getElementById('download-btn');
    const themeSwitcher = document.getElementById('theme-switcher');
    const themeIcon = document.querySelector('.theme-icon');
    const toastMessage = document.getElementById('toast-message');

    // 2. Hidden Character Definitions
    const HIDDEN_CHARS = {
        'Zero-Width Space (ZWSP)': { pattern: /\u200B/g, symbol: '[ZWSP]', title: 'Zero-Width Space (U+200B)' },
        'Non-Breaking Space (NBSP)': { pattern: /\u00A0/g, symbol: '[NBSP]', title: 'Non-Breaking Space (U+00A0)' },
        'Zero-Width Non-Joiner (ZWNJ)': { pattern: /\u200C/g, symbol: '[ZWNJ]', title: 'Zero-Width Non-Joiner (U+200C)' },
        'Zero-Width Joiner (ZWJ)': { pattern: /\u200D/g, symbol: '[ZWJ]', title: 'Zero-Width Joiner (U+200D)' },
        'Soft Hyphen (SHY)': { pattern: /\u00AD/g, symbol: '[SHY]', title: 'Soft Hyphen (U+00AD)' },
        'Invisible Separator (IS)': { pattern: /\u2063/g, symbol: '[IS]', title: 'Invisible Separator (U+2063)' },
        'Word Joiner (WJ)': { pattern: /\u2060/g, symbol: '[WJ]', title: 'Word Joiner (U+2060)' },
        'Byte Order Mark (BOM)': { pattern: /\uFEFF/g, symbol: '[BOM]', title: 'Byte Order Mark (U+FEFF)' },
        'Line Separator': { pattern: /\u2028/g, symbol: '[LS]', title: 'Line Separator (U+2028)' },
        'Paragraph Separator': { pattern: /\u2029/g, symbol: '[PS]', title: 'Paragraph Separator (U+2029)' },
        'Bidi Markers': { pattern: /[\u202A-\u202E]/g, symbol: '[BIDI]', title: 'Bidirectional Text Marker' },
        'Mongolian Vowel Separator': { pattern: /\u180E/g, symbol: '[MVS]', title: 'Mongolian Vowel Separator (U+180E)' },
        'Zero-Width Controls': { pattern: /[\u200E\u200F]/g, symbol: '[ZWCTRL]', title: 'Zero-Width Direction Controls (U+200E-200F)' },
        'Function App/Invisible Times': { pattern: /[\u2061\u2062]/g, symbol: '[FUNC]', title: 'Function Application/Invisible Times (U+2061-2062)' },
        'Invisible Plus/Separator': { pattern: /[\u2064\u2065]/g, symbol: '[IPLUS]', title: 'Invisible Plus/Separator (U+2064-2065)' },
        'Bidi Format Controls': { pattern: /[\u2066-\u206F]/g, symbol: '[BIDICTL]', title: 'Bidi Format Controls (U+2066-206F)' },
        'Variation Selectors': { pattern: /[\uFE00-\uFE0F]/g, symbol: '[VS]', title: 'Variation Selectors (U+FE00-FE0F)' }
    };

    let detectedChars = {};

    // 3. Utility Functions
    const debounce = (func, delay) => {
        let timeoutId;
        return (...args) => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => func.apply(this, args), delay);
        };
    };

    const getSelectedOptions = () => {
        const checkboxes = optionsList.querySelectorAll('input[type="checkbox"]:checked');
        return Array.from(checkboxes).map(cb => cb.name);
    };

    // 4. Core Functions
    const analyzeText = () => {
        const text = inputText.value;
        detectedChars = {};
        let visualizedHtml = '';

        // Process character by character to handle hidden characters correctly
        for (let i = 0; i < text.length; i++) {
            const char = text[i];
            let isHidden = false;

            // Check each hidden character type
            for (const [name, { pattern, symbol, title }] of Object.entries(HIDDEN_CHARS)) {
                if (pattern.test(char)) {
                    // Count the detection
                    detectedChars[name] = (detectedChars[name] || 0) + 1;
                    
                    // Add visualized representation
                    visualizedHtml += `<span class="hidden-char" title="${title}">${symbol}</span>`;
                    isHidden = true;
                    break;
                }
            }

            // If not a hidden character, add normally without escaping
            if (!isHidden) {
                visualizedHtml += char;
            }
        }

        // If no text, show placeholder
        if (text.length === 0) {
            visualizedHtml = '<span class="placeholder">Paste or type your text here...</span>';
        }

        visualizedOutput.innerHTML = visualizedHtml;
        updateStatistics();
        updateCleanedText();
    };

    const updateStatistics = () => {
        statsList.innerHTML = '';
        if (Object.keys(detectedChars).length === 0) {
            statsList.innerHTML = '<li>No hidden characters found.</li>';
            return;
        }
        
        Object.entries(detectedChars).forEach(([name, count]) => {
            const li = document.createElement('li');
            li.innerHTML = `<span>${name}</span> <span class="stats-badge">${count}</span>`;
            statsList.appendChild(li);
        });
    };

    const updateCleanedText = () => {
        let text = inputText.value;
        const options = getSelectedOptions();
        
        // Only remove selected hidden character types
        options.forEach(name => {
            if (HIDDEN_CHARS[name]) {
                text = text.replace(HIDDEN_CHARS[name].pattern, '');
            }
        });
        
        cleanedOutput.textContent = text;
    };

    const showToast = (message) => {
        toastMessage.textContent = message;
        toastMessage.classList.add('show');
        setTimeout(() => {
            toastMessage.classList.remove('show');
        }, 3000);
    };

    // 5. Event Handlers
    inputText.addEventListener('input', debounce(analyzeText, 300));

    cleanAllBtn.addEventListener('click', () => {
        let cleanedText = inputText.value;
        Object.values(HIDDEN_CHARS).forEach(({ pattern }) => {
            cleanedText = cleanedText.replace(pattern, '');
        });
        inputText.value = cleanedText;
        analyzeText();
        showToast('All hidden characters removed!');
    });

    copyBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(cleanedOutput.textContent).then(() => {
            showToast('Cleaned text copied to clipboard!');
        }).catch(err => {
            showToast('Failed to copy text.');
            console.error('Copy failed', err);
        });
    });

    downloadBtn.addEventListener('click', () => {
        const blob = new Blob([cleanedOutput.textContent], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'cleaned_text.txt';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showToast('Text downloaded as cleaned_text.txt');
    });

    // 6. Drag and Drop
    const dropZone = document.querySelector('.drop-zone') || inputText.parentElement;
    
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('drag-over');
    });
    
    dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('drag-over');
    });
    
    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('drag-over');
        const file = e.dataTransfer.files[0];
        if (file && file.type === 'text/plain') {
            const reader = new FileReader();
            reader.onload = (event) => {
                inputText.value = event.target.result;
                analyzeText();
                showToast('File loaded successfully!');
            };
            reader.readAsText(file);
        } else {
            showToast('Please drop a .txt file.');
        }
    });

    // 7. Theme Management
    const applyTheme = (theme) => {
        if (theme === 'dark') {
            document.body.classList.add('dark-mode');
            if (themeIcon) themeIcon.textContent = '🌙';
        } else {
            document.body.classList.remove('dark-mode');
            if (themeIcon) themeIcon.textContent = '☀️';
        }
    };

    if (themeSwitcher) {
        themeSwitcher.addEventListener('click', () => {
            const isDarkMode = document.body.classList.contains('dark-mode');
            const newTheme = isDarkMode ? 'light' : 'dark';
            localStorage.setItem('theme', newTheme);
            applyTheme(newTheme);
        });
    }

    // 8. Initialization
    const init = () => {
        // Populate options
        Object.keys(HIDDEN_CHARS).forEach(name => {
            const li = document.createElement('li');
            li.innerHTML = `
                <label>
                    <input type="checkbox" name="${name}" checked>
                    ${name}
                </label>
            `;
            optionsList.appendChild(li);
        });
        
        // Listen for checkbox changes
        optionsList.addEventListener('change', updateCleanedText);

        // Set initial theme
        const savedTheme = localStorage.getItem('theme');
        const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        const initialTheme = savedTheme || (prefersDark ? 'dark' : 'light');
        applyTheme(initialTheme);

        // Initial analysis
        if (inputText.value) {
            analyzeText();
        } else {
            updateStatistics(); // Show "No hidden characters found"
            visualizedOutput.innerHTML = '<span class="placeholder">Paste or type your text here...</span>';
        }
    };

    init();
});