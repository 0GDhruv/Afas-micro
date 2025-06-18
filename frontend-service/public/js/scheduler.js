// frontend-service/public/js/scheduler.js
document.addEventListener('DOMContentLoaded', () => {
    const schedulerForm = document.getElementById('scheduler-form');
    const messageNameInput = document.getElementById('messageName');
    const languageSelect = document.getElementById('messageLanguage');
    const audioFileSelect = document.getElementById('audioFileMessage');
    const transcriptionInput = document.getElementById('transcriptionMessage'); // Corrected ID
    const startDateInput = document.getElementById('startDate'); // Corrected ID
    const endDateInput = document.getElementById('endDate'); // Corrected ID
    const timingContainer = document.getElementById('timing-container');
    const addTimingBtn = document.getElementById('add-timing-btn'); // Corrected ID
    const frequencySelect = document.getElementById('frequencyDays'); // Corrected ID
    const scheduleTableBody = document.getElementById('schedule-table-body'); // Corrected ID
    const searchBox = document.getElementById('search-box');
    const editIdInput = document.getElementById('edit-id'); // Hidden input for ID
    const scheduleSubmitBtn = document.getElementById('scheduleSubmitBtn');

    let allSchedules = [];
    let availableAudioFiles = []; // To store audio files for the selected language

    // Load languages for the dropdown
    async function loadLanguagesForScheduler() {
        if (!languageSelect) return;
        try {
            const response = await fetch("http://localhost:4003/languages"); // From Upload Service
            if (!response.ok) throw new Error('Failed to fetch languages');
            const languages = await response.json();
            languageSelect.innerHTML = '<option value="">-- Select Language --</option>';
            languages.forEach(lang => {
                languageSelect.add(new Option(lang.charAt(0).toUpperCase() + lang.slice(1), lang));
            });
        } catch (err) {
            console.error("Error loading languages for scheduler:", err);
            languageSelect.innerHTML = '<option value="">-- Error Loading --</option>';
        }
    }

    // Load audio files based on selected language (type: specialmessage)
    async function loadAudioFilesForLanguage(language) {
        if (!audioFileSelect || !language) {
            if(audioFileSelect) audioFileSelect.innerHTML = '<option value="">-- Select Language First --</option>';
            if(transcriptionInput) transcriptionInput.value = "";
            availableAudioFiles = [];
            return;
        }
        audioFileSelect.innerHTML = '<option value="">Loading audio files...</option>';
        try {
            // Fetching from upload-service, assuming it can filter by audioType
            // The endpoint should be like /upload?language=english&audioType=specialmessage
            const response = await fetch(`http://localhost:4003/upload?language=${encodeURIComponent(language)}&audioType=specialmessage`);
            if (!response.ok) throw new Error('Failed to fetch audio files');
            const audios = await response.json(); // Expects array of audio objects {id, filePath, transcription}
            
            availableAudioFiles = audios; // Store for transcription lookup
            audioFileSelect.innerHTML = '<option value="">-- Select Audio File --</option>';
            if (audios.length === 0) {
                audioFileSelect.innerHTML = '<option value="">-- No special messages found --</option>';
            } else {
                audios.forEach(audio => {
                    const fileName = audio.filePath.split(/[\\/]/).pop();
                    // Value should be something unique, like the audio ID or full filename if unique
                    // For simplicity, using filename. Backend will need to map this back.
                    // Ideally, value should be audio.id if the scheduler service can handle it.
                    // For now, let's assume the scheduler service expects filename.
                    audioFileSelect.add(new Option(fileName, audio.filePath)); // Using full relative path as value
                });
            }
             if(transcriptionInput) transcriptionInput.value = ""; // Clear transcription on language change
        } catch (err) {
            console.error("Error loading audio files:", err);
            audioFileSelect.innerHTML = '<option value="">-- Error Loading Audio --</option>';
             if(transcriptionInput) transcriptionInput.value = "";
        }
    }
    
    // Update transcription when audio file changes
    if(audioFileSelect && transcriptionInput) {
        audioFileSelect.addEventListener('change', () => {
            const selectedFilePath = audioFileSelect.value;
            const selectedAudio = availableAudioFiles.find(audio => audio.filePath === selectedFilePath);
            transcriptionInput.value = selectedAudio ? (selectedAudio.transcription || "N/A") : "";
        });
    }


    if(languageSelect) languageSelect.addEventListener('change', (e) => {
        loadAudioFilesForLanguage(e.target.value);
    });

    // Add more timing fields
    if(addTimingBtn && timingContainer) addTimingBtn.addEventListener('click', () => {
        const input = document.createElement('input');
        input.type = 'time';
        input.className = 'timing-field';
        input.required = true; // New timing fields should also be required
        timingContainer.appendChild(input);
    });

    // Form Submission
    if(schedulerForm) schedulerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = editIdInput.value; // Get ID for editing, if any

        const timings = Array.from(timingContainer.querySelectorAll('.timing-field'))
                             .map(input => input.value).filter(time => time); // Filter out empty time inputs
        if (timings.length === 0) {
            alert("Please add at least one valid timing.");
            return;
        }

        const selectedFrequencyOptions = Array.from(frequencySelect.selectedOptions).map(opt => opt.value);
         if (selectedFrequencyOptions.length === 0) {
            alert("Please select at least one day for frequency.");
            return;
        }


        const formData = {
            name: messageNameInput.value,
            language: languageSelect.value,
            // audioId: audioFileSelect.value, // This should be the ID or unique identifier of the audio file
            // For now, sending the filePath. Backend needs to handle this.
            // If your audioFileSelect stores audio IDs, use that.
            audioFilePath: audioFileSelect.value, // Example: /english/specialmessage/greeting.wav
            // transcription is not usually sent, it's derived from audio file
            start_date: startDateInput.value,
            end_date: endDateInput.value,
            timing: JSON.stringify(timings), // Send as JSON string
            frequency: JSON.stringify(selectedFrequencyOptions) // Send as JSON string
        };

        const url = id ? `http://localhost:4004/scheduler/${id}` : "http://localhost:4004/scheduler";
        const method = id ? "PUT" : "POST";

        try {
            const response = await fetch(url, {
                method: method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData)
            });
            if (!response.ok) {
                const errData = await response.json().catch(()=>({message: "Operation failed"}));
                throw new Error(errData.message);
            }
            alert(`Schedule ${id ? 'updated' : 'created'} successfully!`);
            schedulerForm.reset();
            editIdInput.value = ""; // Clear edit ID
            if(scheduleSubmitBtn) scheduleSubmitBtn.textContent = "📅 Schedule Message";
            // Reset timing container to one field
            timingContainer.innerHTML = '<input type="time" class="timing-field" required>';
            loadSchedules();
        } catch (err) {
            console.error("Error saving schedule:", err);
            alert(`Error: ${err.message}`);
        }
    });

    // Load and Display Schedules
    async function loadSchedules() {
        if (!scheduleTableBody) return;
        showLoadingMessage(scheduleTableBody, "Loading schedules...", 8);
        try {
            const response = await fetch("http://localhost:4004/scheduler");
            if (!response.ok) throw new Error('Failed to fetch schedules');
            allSchedules = await response.json();
            renderScheduleTable(allSchedules);
        } catch (err) {
            console.error("Error loading schedules:", err);
            showErrorMessage(scheduleTableBody, "Error loading schedules.", 8);
        }
    }

    function renderScheduleTable(schedulesToRender) {
        if (!scheduleTableBody) return;
        scheduleTableBody.innerHTML = "";
        if (schedulesToRender.length === 0) {
            showInfoMessage(scheduleTableBody, "No schedules found.", 8);
            return;
        }

        schedulesToRender.forEach((schedule, index) => {
            const row = scheduleTableBody.insertRow();
            row.insertCell().textContent = index + 1;
            row.insertCell().textContent = schedule.name;
            row.insertCell().textContent = schedule.language;
            // audioFilePath might be like /english/specialmessage/file.wav
            // Display just the filename
            const audioFileName = schedule.audioFilePath ? schedule.audioFilePath.split(/[\\/]/).pop() : (schedule.audioId || "N/A");
            row.insertCell().textContent = audioFileName;
            
            let timingsDisplay = "N/A";
            try {
                const parsedTimings = JSON.parse(schedule.timing); // Assuming 'timing' is a JSON string array
                if(Array.isArray(parsedTimings)) timingsDisplay = parsedTimings.join(', ');
            } catch(e) { console.warn("Could not parse timings for schedule:", schedule.id, schedule.timing); }
            row.insertCell().textContent = timingsDisplay;

            row.insertCell().textContent = `${schedule.start_date} to ${schedule.end_date}`;
            
            let frequencyDisplay = "N/A";
            try {
                const parsedFrequency = JSON.parse(schedule.frequency); // Assuming 'frequency' is a JSON string array
                if(Array.isArray(parsedFrequency)) frequencyDisplay = parsedFrequency.join(', ');
            } catch(e) { console.warn("Could not parse frequency for schedule:", schedule.id, schedule.frequency); }
            row.insertCell().textContent = frequencyDisplay;

            const actionCell = row.insertCell();
            const editButton = document.createElement('button');
            editButton.innerHTML = '<i class="fas fa-edit"></i> Edit';
            editButton.classList.add("action-btn", "edit-btn");
            editButton.addEventListener('click', () => populateFormForEdit(schedule));
            actionCell.appendChild(editButton);

            const deleteButton = document.createElement('button');
            deleteButton.innerHTML = '<i class="fas fa-trash-alt"></i> Delete';
            deleteButton.classList.add("action-btn", "delete-btn");
            deleteButton.addEventListener('click', () => deleteSchedule(schedule.id));
            actionCell.appendChild(deleteButton);
        });
    }
    
    // Populate form for editing
    function populateFormForEdit(schedule) {
        if(!schedulerForm || !editIdInput || !messageNameInput || !languageSelect || !audioFileSelect || !startDateInput || !endDateInput || !timingContainer || !frequencySelect || !scheduleSubmitBtn) return;
        
        editIdInput.value = schedule.id;
        messageNameInput.value = schedule.name;
        languageSelect.value = schedule.language;
        
        // Important: Load audio files for the language *before* trying to set audioFileSelect.value
        loadAudioFilesForLanguage(schedule.language).then(() => {
            audioFileSelect.value = schedule.audioFilePath; // Or schedule.audioId if that's what's stored/sent
            // Trigger change to update transcription if audioFileSelect has an event listener
            audioFileSelect.dispatchEvent(new Event('change'));
        });

        startDateInput.value = schedule.start_date;
        endDateInput.value = schedule.end_date;

        timingContainer.innerHTML = ""; // Clear existing timing fields
        try {
            const timings = JSON.parse(schedule.timing);
            if (Array.isArray(timings) && timings.length > 0) {
                timings.forEach(time => {
                    const input = document.createElement('input');
                    input.type = 'time';
                    input.className = 'timing-field';
                    input.value = time;
                    input.required = true;
                    timingContainer.appendChild(input);
                });
            } else { // Add one empty field if no timings or parsing failed
                const input = document.createElement('input');
                input.type = 'time'; input.className = 'timing-field'; input.required = true;
                timingContainer.appendChild(input);
            }
        } catch(e) {
            const input = document.createElement('input');
            input.type = 'time'; input.className = 'timing-field'; input.required = true;
            timingContainer.appendChild(input);
        }


        // Set selected options for frequency (multi-select)
        Array.from(frequencySelect.options).forEach(opt => opt.selected = false); // Deselect all first
        try {
            const frequencies = JSON.parse(schedule.frequency);
            if (Array.isArray(frequencies)) {
                frequencies.forEach(day => {
                    const option = Array.from(frequencySelect.options).find(opt => opt.value === day);
                    if (option) option.selected = true;
                });
            }
        } catch(e) { /* Leave as default if parsing fails */ }
        
        if(scheduleSubmitBtn) scheduleSubmitBtn.innerHTML = '<i class="fas fa-save"></i> Update Schedule';
        window.scrollTo({ top: schedulerForm.offsetTop - 20, behavior: 'smooth' });
    }

    // Delete Schedule
    async function deleteSchedule(id) {
        if (!confirm("Are you sure you want to delete this scheduled message?")) return;
        try {
            const response = await fetch(`http://localhost:4004/scheduler/${id}`, { method: "DELETE" });
            if (!response.ok) throw new Error('Failed to delete schedule');
            alert("Schedule deleted successfully.");
            loadSchedules(); // Refresh the table
        } catch (err) {
            console.error("Error deleting schedule:", err);
            alert("Error deleting schedule.");
        }
    }

    // Search functionality
    if(searchBox) searchBox.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();
        const filtered = allSchedules.filter(s => 
            s.name.toLowerCase().includes(query) ||
            (s.audioFilePath && s.audioFilePath.toLowerCase().includes(query))
        );
        renderScheduleTable(filtered);
    });

    // Initial Loads
    loadLanguagesForScheduler();
    loadSchedules();
});
