// frontend-service/public/js/settings.js (for Global Settings Page)
document.addEventListener('DOMContentLoaded', async () => {
    // DOM Elements
    const globalSettingsForm = document.getElementById('globalSettingsForm');
    const langEnglishCheckbox = document.getElementById('lang_english');
    const langHindiCheckbox = document.getElementById('lang_hindi');
    const regionalLanguageSelect = document.getElementById('regionalLanguageSelect');
    const langRegionalActiveCheckbox = document.getElementById('lang_regional_active');
    const languageOrderList = document.getElementById('languageOrderList');
    const frequencyInput = document.getElementById('frequency');
    const audioLagSelect = document.getElementById('audioLag'); // This will now be for minutes
    const advanceTimeInput = document.getElementById('advanceTime');
    const saveButton = document.getElementById('saveGlobalSettingsBtn');
    const loadingMessage = document.getElementById('loadingMessage');
    const errorMessage = document.getElementById('errorMessage');

    let availableSystemLanguages = [];
    let currentGlobalSettings = {};

    // Populate Audio Lag dropdown (1-10 minutes)
    if (audioLagSelect) {
        for (let i = 1; i <= 10; i++) {
            audioLagSelect.add(new Option(`${i} minute${i > 1 ? 's' : ''}`, i));
        }
    }

    async function fetchAvailableLanguagesForRegionalSelect() {
        try {
            const response = await fetch('http://localhost:4003/languages');
            if (!response.ok) throw new Error('Failed to fetch system languages');
            availableSystemLanguages = await response.json();
            if(regionalLanguageSelect) regionalLanguageSelect.innerHTML = '<option value="">-- None --</option>';
            availableSystemLanguages.forEach(lang => {
                const langLower = lang.toLowerCase();
                if (langLower !== 'english' && langLower !== 'hindi') {
                    if(regionalLanguageSelect) regionalLanguageSelect.add(new Option(lang.charAt(0).toUpperCase() + lang.slice(1), lang));
                }
            });
        } catch (err) {
            if (window.showErrorMessage && errorMessage) window.showErrorMessage(errorMessage, 'Could not load available languages for regional selection.');
            else if(errorMessage) errorMessage.textContent = 'Could not load available languages.';
            console.error('Could not load available languages.', err);
        }
    }

    let draggedItem = null;
    function updateDraggableListOrder() {
        if (!languageOrderList || !langEnglishCheckbox || !langHindiCheckbox || !regionalLanguageSelect || !langRegionalActiveCheckbox) return;
        languageOrderList.innerHTML = '';
        const activeLangsForOrder = [];
        if (langEnglishCheckbox.checked) activeLangsForOrder.push({ id: 'english', name: 'English' });
        if (langHindiCheckbox.checked) activeLangsForOrder.push({ id: 'hindi', name: 'Hindi' });
        const selectedRegionalValue = regionalLanguageSelect.value;
        if (selectedRegionalValue && langRegionalActiveCheckbox.checked) {
            activeLangsForOrder.push({ id: selectedRegionalValue, name: selectedRegionalValue.charAt(0).toUpperCase() + selectedRegionalValue.slice(1) });
        }

        let orderedElements = [];
        const currentOrderFromSettings = currentGlobalSettings.language_order || [];
        currentOrderFromSettings.forEach(langId => {
            const lang = activeLangsForOrder.find(al => al.id === langId);
            if (lang && !orderedElements.find(ol => ol.id === lang.id)) orderedElements.push(lang);
        });
        activeLangsForOrder.forEach(lang => {
            if (!orderedElements.find(ol => ol.id === lang.id)) orderedElements.push(lang);
        });
        orderedElements = orderedElements.filter(lang => activeLangsForOrder.some(al => al.id === lang.id));
        orderedElements.forEach(lang => {
            const li = document.createElement('li');
            li.textContent = lang.name;
            li.dataset.langId = lang.id; 
            li.draggable = true;
            addDragEventsToListItem(li);
            languageOrderList.appendChild(li);
        });
    }

    function addDragEventsToListItem(li) {
        li.addEventListener('dragstart', (e) => {
            draggedItem = e.target;
            setTimeout(() => { if(draggedItem) draggedItem.style.opacity = '0.5'; }, 0);
        });
        li.addEventListener('dragend', () => {
            if(draggedItem) draggedItem.style.opacity = '1';
            draggedItem = null;
        });
    }

    if (languageOrderList) {
        languageOrderList.addEventListener('dragover', (e) => {
            e.preventDefault();
            const afterElement = getDragAfterElement(languageOrderList, e.clientY);
            if (draggedItem) {
                if (afterElement == null) languageOrderList.appendChild(draggedItem);
                else languageOrderList.insertBefore(draggedItem, afterElement);
            }
        });
    }

    function getDragAfterElement(container, y) {
        const draggableElements = [...container.querySelectorAll('li:not([style*="opacity: 0.5"])')];
        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;
            if (offset < 0 && offset > closest.offset) return { offset: offset, element: child };
            return closest;
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    }

    [langEnglishCheckbox, langHindiCheckbox, langRegionalActiveCheckbox, regionalLanguageSelect].forEach(el => {
        if(el) el.addEventListener('change', updateDraggableListOrder);
    });
    
    if(regionalLanguageSelect) regionalLanguageSelect.addEventListener('change', () => {
        if(langRegionalActiveCheckbox) {
            langRegionalActiveCheckbox.disabled = !regionalLanguageSelect.value;
            if (!regionalLanguageSelect.value) {
                langRegionalActiveCheckbox.checked = false;
                langRegionalActiveCheckbox.dispatchEvent(new Event('change')); 
            }
        }
    });

    async function loadGlobalSettings() {
        showLoadingOnPage(true);
        try {
            await fetchAvailableLanguagesForRegionalSelect(); 
            const response = await fetch('http://localhost:4010/settings');
            if (!response.ok) {
                console.warn(`Global settings fetch failed (Status: ${response.status}). Using defaults.`);
                currentGlobalSettings = {
                    languages: { english: true, hindi: false, regional_active: false },
                    regional_language_name: null, language_order: ['english'],
                    frequency: 1, audio_lag_minutes: 2, advance_minutes: 15 // Default audio_lag_minutes
                };
            } else {
                currentGlobalSettings = await response.json();
                // Ensure new fields have defaults if loading older settings
                currentGlobalSettings.audio_lag_minutes = currentGlobalSettings.audio_lag_minutes || currentGlobalSettings.audio_lag || 2; // Prioritize new, fallback to old, then default
                currentGlobalSettings.advance_minutes = currentGlobalSettings.advance_minutes || currentGlobalSettings.advanceTime || 15;
            }
            applySettingsToForm(currentGlobalSettings);
        } catch (err) {
            showErrorOnPage(`Error loading global settings: ${err.message}. Defaults applied.`);
            console.error(err);
            currentGlobalSettings = { 
                languages: { english: true, hindi: false, regional_active: false },
                regional_language_name: null, language_order: ['english'],
                frequency: 1, audio_lag_minutes: 2, advance_minutes: 15
            };
            applySettingsToForm(currentGlobalSettings);
        } finally {
            showLoadingOnPage(false);
        }
    }

    function applySettingsToForm(settings) {
        if(langEnglishCheckbox) langEnglishCheckbox.checked = settings.languages?.english || false;
        if(langHindiCheckbox) langHindiCheckbox.checked = settings.languages?.hindi || false;
        if(regionalLanguageSelect) regionalLanguageSelect.value = settings.regional_language_name || "";
        if(langRegionalActiveCheckbox) {
            langRegionalActiveCheckbox.disabled = !regionalLanguageSelect.value; 
            langRegionalActiveCheckbox.checked = regionalLanguageSelect.value ? (settings.languages?.regional_active || false) : false;
        }
        if(frequencyInput) frequencyInput.value = settings.frequency !== undefined ? settings.frequency : 1;
        if(audioLagSelect) audioLagSelect.value = settings.audio_lag_minutes !== undefined ? settings.audio_lag_minutes : 2; // Use audio_lag_minutes
        if(advanceTimeInput) advanceTimeInput.value = settings.advance_minutes !== undefined ? settings.advance_minutes : 15;
        updateDraggableListOrder(); 
    }
    
    if(globalSettingsForm) globalSettingsForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        showLoadingOnPage(true);
        showErrorOnPage(""); 
        const selectedRegionalName = regionalLanguageSelect.value;
        const isRegionalEnabled = selectedRegionalName ? langRegionalActiveCheckbox.checked : false;
        const languagesData = {
            english: langEnglishCheckbox.checked,
            hindi: langHindiCheckbox.checked,
            regional_active: isRegionalEnabled
        };
        const languageOrderData = Array.from(languageOrderList.querySelectorAll('li')).map(li => li.dataset.langId);
        const settingsPayload = {
            languages: languagesData,
            regional_language_name: selectedRegionalName || null,
            language_order: languageOrderData,
            frequency: parseInt(frequencyInput.value),
            audio_lag_minutes: parseInt(audioLagSelect.value), // Send as minutes
            advance_minutes: parseInt(advanceTimeInput.value)
        };
        const activeLangCount = (languagesData.english ? 1:0) + (languagesData.hindi ? 1:0) + (languagesData.regional_active ? 1:0);
        if (languageOrderData.length !== activeLangCount) {
            showErrorOnPage("Language order must match the count of enabled languages.");
            showLoadingOnPage(false); return;
        }
        try {
            const response = await fetch('http://localhost:4010/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(settingsPayload)
            });
            if (!response.ok) {
                const errorData = await response.json().catch(()=>({message:"Unknown server error."}));
                throw new Error(errorData.message || `Failed to save: ${response.statusText}`);
            }
            alert('Global settings saved successfully!');
            currentGlobalSettings = settingsPayload; 
            updateDraggableListOrder(); 
        } catch (err) {
            showErrorOnPage(`Error saving global settings: ${err.message}`);
            console.error(err);
        } finally {
            showLoadingOnPage(false);
        }
    });

    function showLoadingOnPage(isLoading) {
        if (loadingMessage) loadingMessage.style.display = isLoading ? 'block' : 'none';
        if (saveButton) saveButton.disabled = isLoading;
    }
    function showErrorOnPage(message) {
        if (errorMessage) {
            errorMessage.textContent = message;
            errorMessage.style.display = message ? 'block' : 'none';
        }
    }
    loadGlobalSettings();
});
