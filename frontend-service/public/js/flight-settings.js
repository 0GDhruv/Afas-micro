// frontend-service/public/js/flight-settings.js
document.addEventListener('DOMContentLoaded', async () => {
    const flightNumberDisplay = document.getElementById('flightNumberDisplay');
    const flightSettingsForm = document.getElementById('flightSettingsForm');
    const langEnglishCheckbox = document.getElementById('flight_lang_english');
    const langHindiCheckbox = document.getElementById('flight_lang_hindi');
    const globalRegionalLanguageNameDisplay = document.getElementById('globalRegionalLanguageNameDisplay');
    const langRegionalActiveCheckbox = document.getElementById('flight_lang_regional_active');
    const fourthLanguageSelect = document.getElementById('fourthLanguageSelect');
    const langFourthActiveCheckbox = document.getElementById('flight_lang_fourth_active');
    const languageOrderList = document.getElementById('flightLanguageOrderList');
    const frequencyInput = document.getElementById('flight_frequency');
    const audioLagSelect = document.getElementById('flight_audioLag'); // This will be for minutes
    const saveButton = document.getElementById('saveFlightSettingsBtn');
    const loadingMessage = document.getElementById('flightLoadingMessage');
    const errorMessage = document.getElementById('flightErrorMessage');

    let currentFlightNumber = '';
    let availableSystemLanguages = [];
    let currentGlobalSettingsForFlightPage = {}; 
    let currentFlightSpecificSettings = {}; 

    if (audioLagSelect) {
        for (let i = 1; i <= 10; i++) { // Populate with 1-10 minutes
            audioLagSelect.add(new Option(`${i} minute${i > 1 ? 's' : ''}`, i));
        }
    }

    const params = new URLSearchParams(window.location.search);
    currentFlightNumber = params.get('flight_number');
    if (flightNumberDisplay) flightNumberDisplay.textContent = currentFlightNumber || 'N/A';

    if (!currentFlightNumber) {
        showErrorOnPage("Flight number missing from URL. Cannot load or save settings.");
        if(saveButton) saveButton.disabled = true;
        return;
    }

    async function fetchAllSystemLanguages() {
        try {
            const response = await fetch('http://localhost:4003/languages');
            if (!response.ok) throw new Error('Failed to fetch system languages.');
            availableSystemLanguages = await response.json();
        } catch (err) {
            showErrorOnPage('Could not load system languages for 4th language selection.');
            console.error(err);
        }
    }
    
    function populateFourthLanguageSelect() {
        if(!fourthLanguageSelect) return;
        fourthLanguageSelect.innerHTML = '<option value="">-- None --</option>';
        const globalRegNameLower = currentGlobalSettingsForFlightPage.regional_language_name?.toLowerCase();
        availableSystemLanguages.forEach(lang => {
            const langLower = lang.toLowerCase();
            if (langLower !== 'english' && langLower !== 'hindi' && langLower !== globalRegNameLower) {
                fourthLanguageSelect.add(new Option(lang.charAt(0).toUpperCase() + lang.slice(1), lang));
            }
        });
    }

    let draggedItemFlight = null;
    function updateFlightDraggableListOrder() {
        if(!languageOrderList || !langEnglishCheckbox || !langHindiCheckbox || !langRegionalActiveCheckbox || !fourthLanguageSelect || !langFourthActiveCheckbox) return;
        languageOrderList.innerHTML = '';
        const activeLangs = [];
        if (langEnglishCheckbox.checked) activeLangs.push({ id: 'english', name: 'English' });
        if (langHindiCheckbox.checked) activeLangs.push({ id: 'hindi', name: 'Hindi' });
        const globalRegName = currentGlobalSettingsForFlightPage.regional_language_name;
        if (globalRegName && langRegionalActiveCheckbox.checked) {
            activeLangs.push({ id: globalRegName, name: globalRegName.charAt(0).toUpperCase() + globalRegName.slice(1) });
        }
        const fourthLangName = fourthLanguageSelect.value;
        if (fourthLangName && langFourthActiveCheckbox.checked) {
            activeLangs.push({ id: fourthLangName, name: fourthLangName.charAt(0).toUpperCase() + fourthLangName.slice(1) });
        }
        let orderedElements = [];
        const currentOrderFromSettings = currentFlightSpecificSettings.language_order || [];
        currentOrderFromSettings.forEach(langId => {
            const lang = activeLangs.find(al => al.id === langId);
            if (lang && !orderedElements.find(ol => ol.id === lang.id)) orderedElements.push(lang);
        });
        activeLangs.forEach(lang => {
            if (!orderedElements.find(ol => ol.id === lang.id)) orderedElements.push(lang);
        });
        orderedElements = orderedElements.filter(lang => activeLangs.some(al => al.id === lang.id));
        orderedElements = orderedElements.slice(0, 4);
        orderedElements.forEach(lang => {
            const li = document.createElement('li');
            li.textContent = lang.name;
            li.dataset.langId = lang.id;
            li.draggable = true;
            addDragEventsToFlightListItem(li);
            languageOrderList.appendChild(li);
        });
    }

    function addDragEventsToFlightListItem(li) {
        li.addEventListener('dragstart', (e) => {
            draggedItemFlight = e.target;
            setTimeout(() => { if(draggedItemFlight) draggedItemFlight.style.opacity = '0.5'; }, 0);
        });
        li.addEventListener('dragend', () => {
            if(draggedItemFlight) draggedItemFlight.style.opacity = '1';
            draggedItemFlight = null;
        });
    }

    if(languageOrderList) languageOrderList.addEventListener('dragover', (e) => {
        e.preventDefault();
        const afterElement = getDragAfterElementFlight(languageOrderList, e.clientY);
        if (draggedItemFlight) {
            if (afterElement == null) languageOrderList.appendChild(draggedItemFlight);
            else languageOrderList.insertBefore(draggedItemFlight, afterElement);
        }
    });

    function getDragAfterElementFlight(container, y) {
        const draggableElements = [...container.querySelectorAll('li:not([style*="opacity: 0.5"])')];
        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;
            if (offset < 0 && offset > closest.offset) return { offset: offset, element: child };
            return closest;
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    }
    
    [langEnglishCheckbox, langHindiCheckbox, langRegionalActiveCheckbox, langFourthActiveCheckbox, fourthLanguageSelect].forEach(el => {
        if(el) el.addEventListener('change', updateFlightDraggableListOrder);
    });

    if(fourthLanguageSelect) fourthLanguageSelect.addEventListener('change', () => {
        if(langFourthActiveCheckbox){
            langFourthActiveCheckbox.disabled = !fourthLanguageSelect.value;
            if (!fourthLanguageSelect.value) {
                langFourthActiveCheckbox.checked = false;
                langFourthActiveCheckbox.dispatchEvent(new Event('change'));
            }
        }
    });

    async function loadSettingsForFlightPage() {
        showLoadingOnPage(true);
        try {
            await fetchAllSystemLanguages();
            const globalResponse = await fetch('http://localhost:4010/settings');
            if (!globalResponse.ok) throw new Error('Failed to load global settings context.');
            currentGlobalSettingsForFlightPage = await globalResponse.json();
            currentGlobalSettingsForFlightPage.audio_lag_minutes = currentGlobalSettingsForFlightPage.audio_lag_minutes || currentGlobalSettingsForFlightPage.audio_lag || 2;


            populateFourthLanguageSelect();
            if(globalRegionalLanguageNameDisplay) {
                const grn = currentGlobalSettingsForFlightPage.regional_language_name;
                globalRegionalLanguageNameDisplay.textContent = grn ? `(${grn.charAt(0).toUpperCase() + grn.slice(1)})` : '(None Set Globally)';
                globalRegionalLanguageNameDisplay.style.color = grn ? '#0f0' : '#aaa';
            }
            if(langRegionalActiveCheckbox) langRegionalActiveCheckbox.disabled = !currentGlobalSettingsForFlightPage.regional_language_name;

            const flightResponse = await fetch(`http://localhost:4010/settings/flight/${currentFlightNumber}`);
            if (flightResponse.ok) {
                currentFlightSpecificSettings = await flightResponse.json();
                // Ensure audio_lag_minutes is present or derived
                currentFlightSpecificSettings.audio_lag_minutes = currentFlightSpecificSettings.audio_lag_minutes || currentFlightSpecificSettings.audio_lag;
            } else if (flightResponse.status === 404) {
                currentFlightSpecificSettings = {}; 
                const data404 = await flightResponse.json().catch(() => ({}));
                if(data404.global_regional_language_name && !currentGlobalSettingsForFlightPage.regional_language_name){
                    currentGlobalSettingsForFlightPage.regional_language_name = data404.global_regional_language_name;
                     if(globalRegionalLanguageNameDisplay) globalRegionalLanguageNameDisplay.textContent = `(${data404.global_regional_language_name.charAt(0).toUpperCase() + data404.global_regional_language_name.slice(1)})`;
                     if(langRegionalActiveCheckbox) langRegionalActiveCheckbox.disabled = !data404.global_regional_language_name;
                }
            } else {
                throw new Error(`Failed to load flight settings: ${flightResponse.statusText}`);
            }
            applyFlightSettingsToForm(currentFlightSpecificSettings, currentGlobalSettingsForFlightPage);
        } catch (err) {
            showErrorOnPage(`Error loading settings: ${err.message}`);
            console.error(err);
            applyFlightSettingsToForm({}, { 
                languages: { english: true, hindi: false, regional_active_for_flight: false, fourth_lang_active: false },
                language_order: ['english'], frequency: 1, audio_lag_minutes: 2
            });
        } finally {
            showLoadingOnPage(false);
        }
    }

    function applyFlightSettingsToForm(flightSettings, globalDefaults) {
        const defaultLangs = globalDefaults.languages || {};
        const flightLangs = flightSettings.languages || {};

        if(langEnglishCheckbox) langEnglishCheckbox.checked = flightLangs.hasOwnProperty('english') ? flightLangs.english : (defaultLangs.english || false);
        if(langHindiCheckbox) langHindiCheckbox.checked = flightLangs.hasOwnProperty('hindi') ? flightLangs.hindi : (defaultLangs.hindi || false);
        if(langRegionalActiveCheckbox) {
            langRegionalActiveCheckbox.checked = globalDefaults.regional_language_name 
                ? (flightLangs.hasOwnProperty('regional_active_for_flight') ? flightLangs.regional_active_for_flight : (defaultLangs.regional_active || false))
                : false;
            langRegionalActiveCheckbox.disabled = !globalDefaults.regional_language_name;
        }
        if(langFourthActiveCheckbox) langFourthActiveCheckbox.checked = flightLangs.fourth_lang_active || false;
        if(fourthLanguageSelect) fourthLanguageSelect.value = flightSettings.fourth_language_name || "";
        if(langFourthActiveCheckbox) langFourthActiveCheckbox.disabled = !fourthLanguageSelect.value;

        if(frequencyInput) frequencyInput.value = flightSettings.frequency !== undefined && flightSettings.frequency !== null ? flightSettings.frequency : (globalDefaults.frequency || 1);
        if(audioLagSelect) audioLagSelect.value = flightSettings.audio_lag_minutes !== undefined && flightSettings.audio_lag_minutes !== null ? flightSettings.audio_lag_minutes : (globalDefaults.audio_lag_minutes || 2);
        
        currentFlightSpecificSettings = flightSettings; 
        updateFlightDraggableListOrder();
    }

    if(flightSettingsForm) flightSettingsForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        showLoadingOnPage(true);
        showErrorOnPage("");
        const selectedFourthLangName = fourthLanguageSelect.value;
        const isFourthEnabled = selectedFourthLangName ? langFourthActiveCheckbox.checked : false;
        const languagesData = {
            english: langEnglishCheckbox.checked,
            hindi: langHindiCheckbox.checked,
            regional_active_for_flight: currentGlobalSettingsForFlightPage.regional_language_name ? langRegionalActiveCheckbox.checked : false,
            fourth_lang_active: isFourthEnabled
        };
        const languageOrderData = Array.from(languageOrderList.querySelectorAll('li')).map(li => li.dataset.langId);
        let activeLangCount = 0;
        Object.values(languagesData).forEach(isActive => { if(isActive) activeLangCount++; });
        if (languageOrderData.length > 4 || languageOrderData.length !== activeLangCount) {
            showErrorOnPage("Language order must contain between 1 and 4 enabled languages and match the count of currently active languages.");
            showLoadingOnPage(false); return;
        }
        const flightSettingsPayload = {
            languages: languagesData,
            fourth_language_name: isFourthEnabled ? selectedFourthLangName : null,
            language_order: languageOrderData,
            frequency: parseInt(frequencyInput.value),
            audio_lag_minutes: parseInt(audioLagSelect.value) // Send as minutes
        };
        try {
            const response = await fetch(`http://localhost:4010/settings/flight/${currentFlightNumber}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(flightSettingsPayload)
            });
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({message: "Unknown server error"}));
                throw new Error(errorData.message || `Failed to save: ${response.statusText}`);
            }
            alert('Flight-specific settings saved successfully!');
            currentFlightSpecificSettings = flightSettingsPayload; 
            updateFlightDraggableListOrder(); 
        } catch (err) {
            showErrorOnPage(`Error saving flight settings: ${err.message}`);
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
    loadSettingsForFlightPage();
});
