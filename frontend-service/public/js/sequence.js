// frontend-service/public/js/sequence.js
document.addEventListener('DOMContentLoaded', () => {
    const areaSelect = document.getElementById("areaSequenceSelect");
    const languageTabsContainer = document.getElementById("sequenceLanguageTabs");
    const announcementTypeSelect = document.getElementById("announcementTypeSelect");
    const sequenceForm = document.getElementById("scriptmanager-form");
    const scriptIdInput = document.getElementById("script-id");
    const sequenceInput = document.getElementById("sequenceInput");
    const transcriptionOutput = document.getElementById("transcriptionOutput");
    const getTranscriptionBtn = document.getElementById("getTranscriptionBtn");
    const addScriptBtn = document.getElementById("addScriptBtn"); // Assuming this is the submit button
    const scriptsTableBody = document.getElementById("scriptsTableBody");

    let currentSelectedLanguageForSequence = null;
    let currentSelectedAreaForSequence = areaSelect ? areaSelect.value : null;

    // Populate Language Tabs
    if (languageTabsContainer && window.populateLanguageTabs) {
        window.populateLanguageTabs(languageTabsContainer, (selectedLanguage) => {
            currentSelectedLanguageForSequence = selectedLanguage;
            if (selectedLanguage && currentSelectedAreaForSequence) {
                loadAnnouncementTypesForSequence(selectedLanguage, currentSelectedAreaForSequence);
                loadScripts(selectedLanguage, currentSelectedAreaForSequence);
            } else {
                if(announcementTypeSelect) announcementTypeSelect.innerHTML = '<option value="">-- Select Language & Area --</option>';
                if(scriptsTableBody) showInfoMessage(scriptsTableBody, "Please select language and area.", 5);
            }
        }, "Loading languages...");
    }

    // Load Announcement Types based on Language and Area
    async function loadAnnouncementTypesForSequence(language, area) {
        if (!announcementTypeSelect) return;
        announcementTypeSelect.innerHTML = '<option value="">Loading types...</option>';
        try {
            const response = await fetch(`http://localhost:4006/announcementtype/types?language=${encodeURIComponent(language)}&area=${encodeURIComponent(area)}`);
            if (!response.ok) throw new Error('Failed to fetch announcement types');
            const types = await response.json(); // Expecting array of strings

            announcementTypeSelect.innerHTML = '<option value="">-- Select Announcement Type --</option>';
            if (types.length === 0) {
                announcementTypeSelect.innerHTML = '<option value="">-- No types found for selection --</option>';
            } else {
                types.forEach(type => {
                    announcementTypeSelect.add(new Option(type, type));
                });
            }
        } catch (err) {
            console.error("Error loading announcement types for sequence:", err);
            announcementTypeSelect.innerHTML = '<option value="">-- Error loading types --</option>';
        }
    }

    // Load Scripts into table
    async function loadScripts(language, area) {
        if (!scriptsTableBody) return;
        showLoadingMessage(scriptsTableBody, `Loading scripts for ${language} in ${area}...`, 5);

        try {
            const response = await fetch(`http://localhost:4006/scriptmanager/scripts?language=${encodeURIComponent(language)}&area=${encodeURIComponent(area)}`);
            if (!response.ok) throw new Error('Failed to fetch scripts');
            const scripts = await response.json();
            scriptsTableBody.innerHTML = "";

            if (scripts.length === 0) {
                showInfoMessage(scriptsTableBody, `No scripts found for ${language} in ${area}.`, 5);
                return;
            }
            scripts.forEach((script, index) => {
                const row = scriptsTableBody.insertRow();
                row.insertCell().textContent = index + 1;
                row.insertCell().textContent = script.announcement_type;
                // Sequence might be JSON string, parse it for display if needed, or display as is
                let sequenceDisplay = script.sequence;
                try {
                    const parsedSequence = JSON.parse(script.sequence);
                    if (Array.isArray(parsedSequence)) {
                        sequenceDisplay = parsedSequence.join(', ');
                    }
                } catch (e) { /* Keep as string if not valid JSON array */ }
                row.insertCell().textContent = sequenceDisplay;
                row.insertCell().textContent = script.transcription || "N/A";
                
                const actionCell = row.insertCell();
                const editButton = document.createElement('button');
                editButton.innerHTML = '<i class="fas fa-edit"></i> Edit';
                editButton.classList.add("action-btn", "edit-btn");
                editButton.addEventListener('click', () => populateFormForEdit(script));
                actionCell.appendChild(editButton);

                const deleteButton = document.createElement('button');
                deleteButton.innerHTML = '<i class="fas fa-trash-alt"></i> Delete';
                deleteButton.classList.add("action-btn", "delete-btn");
                deleteButton.addEventListener('click', () => deleteScript(script.id, language, area));
                actionCell.appendChild(deleteButton);
            });
        } catch (err) {
            console.error("Error loading scripts:", err);
            showErrorMessage(scriptsTableBody, "Error loading scripts.", 5);
        }
    }
    
    // Populate form for editing a script
    function populateFormForEdit(script) {
        if (!scriptIdInput || !announcementTypeSelect || !sequenceInput || !transcriptionOutput || !addScriptBtn) return;
        scriptIdInput.value = script.id;
        // Area and Language are already selected in the UI
        announcementTypeSelect.value = script.announcement_type;
        
        let sequenceDisplay = script.sequence;
        try {
            const parsedSequence = JSON.parse(script.sequence);
            if (Array.isArray(parsedSequence)) {
                sequenceDisplay = parsedSequence.join(', ');
            }
        } catch (e) { /* Keep as string */ }
        sequenceInput.value = sequenceDisplay;
        transcriptionOutput.value = script.transcription || "";
        addScriptBtn.innerHTML = '<i class="fas fa-save"></i> Update Sequence';
        addScriptBtn.classList.add("update-btn"); // Optional: for different styling
        window.scrollTo({ top: sequenceForm.offsetTop - 20, behavior: 'smooth' }); // Scroll to form
    }

    // Reset form
    function resetSequenceForm() {
        if (!scriptIdInput || !sequenceInput || !transcriptionOutput || !addScriptBtn || !announcementTypeSelect) return;
        scriptIdInput.value = "";
        if(announcementTypeSelect.options.length > 0) announcementTypeSelect.selectedIndex = 0;
        sequenceInput.value = "";
        transcriptionOutput.value = "";
        addScriptBtn.innerHTML = '<i class="fas fa-plus-circle"></i> Add Sequence';
        addScriptBtn.classList.remove("update-btn");
    }

    // Get Transcription
    if(getTranscriptionBtn) getTranscriptionBtn.addEventListener('click', async () => {
        if (!sequenceInput || !transcriptionOutput || !currentSelectedLanguageForSequence) {
            alert("Sequence input or language selection is missing.");
            return;
        }
        const sequence = sequenceInput.value.trim();
        if (!sequence) {
            alert("Please enter a sequence first.");
            return;
        }
        transcriptionOutput.value = "Fetching transcription...";
        try {
            // The API expects sequence as a comma-separated string
            const response = await fetch(`http://localhost:4006/scriptmanager/transcriptions?sequence=${encodeURIComponent(sequence)}&language=${encodeURIComponent(currentSelectedLanguageForSequence)}`);
            if (!response.ok) throw new Error('Failed to get transcription');
            const data = await response.json();
            transcriptionOutput.value = data.transcriptions ? data.transcriptions.join(' ') : "No transcription available or error.";
        } catch (err) {
            console.error("Error getting transcription:", err);
            transcriptionOutput.value = "Error fetching transcription.";
        }
    });

    // Form Submission (Add/Update Script)
    if(sequenceForm) sequenceForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!currentSelectedLanguageForSequence || !currentSelectedAreaForSequence || !announcementTypeSelect.value || !sequenceInput.value) {
            alert("Please ensure Area, Language, Announcement Type, and Sequence are filled.");
            return;
        }

        const scriptId = scriptIdInput.value;
        const payload = {
            language: currentSelectedLanguageForSequence,
            area: currentSelectedAreaForSequence,
            announcementType: announcementTypeSelect.value,
            sequence: sequenceInput.value.trim(), // API expects comma-separated string
            transcription: transcriptionOutput.value.trim()
        };

        const method = scriptId ? "PUT" : "POST";
        const url = `http://localhost:4006/scriptmanager/scripts${scriptId ? `/${scriptId}` : ""}`;

        try {
            const response = await fetch(url, {
                method: method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });
            if (!response.ok) {
                const errorData = await response.json().catch(()=>({message: "Operation failed."}));
                throw new Error(errorData.message);
            }
            alert(`Script ${scriptId ? 'updated' : 'added'} successfully!`);
            resetSequenceForm();
            loadScripts(currentSelectedLanguageForSequence, currentSelectedAreaForSequence);
        } catch (err) {
            console.error("Error saving script:", err);
            alert(`Error saving script: ${err.message}`);
        }
    });
    
    // Delete Script
    async function deleteScript(id, language, area) {
        if (!confirm("Are you sure you want to delete this script sequence?")) return;
        try {
            const response = await fetch(`http://localhost:4006/scriptmanager/scripts/${id}`, { method: "DELETE" });
            if (!response.ok) throw new Error('Failed to delete script');
            alert("Script deleted successfully.");
            loadScripts(language, area); // Refresh
        } catch (err) {
            console.error("Error deleting script:", err);
            alert("Error deleting script.");
        }
    }
    // window.deleteScript = deleteScript; // Not needed if using event listeners

    // Event listener for Area select change
    if(areaSelect) areaSelect.addEventListener('change', (e) => {
        currentSelectedAreaForSequence = e.target.value;
        resetSequenceForm(); // Reset form when area changes
        if (currentSelectedLanguageForSequence && currentSelectedAreaForSequence) {
            loadAnnouncementTypesForSequence(currentSelectedLanguageForSequence, currentSelectedAreaForSequence);
            loadScripts(currentSelectedLanguageForSequence, currentSelectedAreaForSequence);
        } else {
            if(announcementTypeSelect) announcementTypeSelect.innerHTML = '<option value="">-- Select Language & Area --</option>';
            if(scriptsTableBody) showInfoMessage(scriptsTableBody, "Please select language and area.", 5);
        }
    });

    // Initial load (triggered by populateLanguageTabs callback)
});
