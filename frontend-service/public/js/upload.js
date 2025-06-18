// frontend-service/public/js/upload.js
document.addEventListener("DOMContentLoaded", () => {
    const uploadForm = document.getElementById("upload-form");
    const tabsContainer = document.querySelector(".language-tabs"); // Assuming only one on this page
    const languageTabsLoading = document.getElementById("languageTabsLoading");
    const tableBody = document.getElementById("audio-table-body");
    const searchBox = document.getElementById("searchBox");
    const uploadButton = document.getElementById("uploadButton");
    const uploadStatus = document.getElementById("uploadStatus");

    // Pagination elements
    const paginationControls = document.getElementById("audioTablePagination");
    const prevPageBtn = document.getElementById("prevPageBtn");
    const nextPageBtn = document.getElementById("nextPageBtn");
    const pageInfo = document.getElementById("pageInfo");

    let allAudiosForCurrentLanguage = [];
    let filteredAudios = [];
    let currentPage = 1;
    const itemsPerPage = 5; // Or 10, as you prefer

    // Use the global populateLanguageTabs function from base.js
    if (tabsContainer && window.populateLanguageTabs) {
        window.populateLanguageTabs(tabsContainer, (selectedLanguage) => {
            currentPage = 1; // Reset page on language change
            if (selectedLanguage) {
                loadAudios(selectedLanguage);
            } else {
                // Handle case where no language is selected or loading failed
                if (tableBody && window.showInfoMessage) window.showInfoMessage(tableBody, "Please select a language to view audio files.", 6);
                else if (tableBody) tableBody.innerHTML = `<tr><td colspan="6" class="no-data-text">Please select a language to view audio files.</td></tr>`;
                if (paginationControls) paginationControls.style.display = 'none';
            }
        }, "Loading language tabs...");
    } else {
        console.error("Language tabs container or populateLanguageTabs function not found.");
        if (languageTabsLoading) languageTabsLoading.textContent = "Error: UI setup failed.";
    }


    async function loadAudios(language) {
        if (!language) {
            if (tableBody && window.showInfoMessage) window.showInfoMessage(tableBody, "No language selected.", 6);
            else if (tableBody) tableBody.innerHTML = `<tr><td colspan="6" class="no-data-text">No language selected.</td></tr>`;
            if (paginationControls) paginationControls.style.display = 'none';
            return;
        }
        if (tableBody && window.showLoadingMessage) window.showLoadingMessage(tableBody, `Loading audio files for ${language}...`, 6);
        else if (tableBody) tableBody.innerHTML = `<tr><td colspan="6" class="loading-text">Loading audio files for ${language}...</td></tr>`;
        
        if (paginationControls) paginationControls.style.display = 'none';

        try {
            const response = await fetch(`http://localhost:4003/upload?language=${encodeURIComponent(language)}`);
            if (!response.ok) throw new Error(`Failed to fetch audios. Status: ${response.status}`);
            allAudiosForCurrentLanguage = await response.json();
            applySearchAndRender();
        } catch (err) {
            console.error("❌ Error loading audios:", err.message);
            if (tableBody && window.showErrorMessage) window.showErrorMessage(tableBody, "Error loading audio files.", 6);
            else if (tableBody) tableBody.innerHTML = `<tr><td colspan="6" class="error-message">Error loading audio files.</td></tr>`;
        }
    }

    function applySearchAndRender() {
        const query = searchBox ? searchBox.value.toLowerCase().trim() : "";
        if (query) {
            filteredAudios = allAudiosForCurrentLanguage.filter(audio =>
                (audio.filePath || "").toLowerCase().includes(query) ||
                (audio.transcription || "").toLowerCase().includes(query) ||
                (audio.remarks || "").toLowerCase().includes(query) ||
                (audio.audioType || "").toLowerCase().includes(query)
            );
        } else {
            filteredAudios = [...allAudiosForCurrentLanguage];
        }
        currentPage = 1;
        renderAudiosPage();
    }
    
    if(searchBox) searchBox.addEventListener("input", applySearchAndRender);

    function renderAudiosPage() {
        if (!tableBody) return;
        tableBody.innerHTML = "";
        
        const colspan = document.getElementById("audio-table")?.querySelector("thead tr")?.cells.length || 6;

        if (filteredAudios.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="${colspan}" class="no-data-text">No audio files found.</td></tr>`;
            if (paginationControls) paginationControls.style.display = 'none';
            return;
        }

        const startIndex = (currentPage - 1) * itemsPerPage;
        const paginatedAudios = filteredAudios.slice(startIndex, startIndex + itemsPerPage);

        paginatedAudios.forEach((audio, index) => {
            const actualIndex = startIndex + index + 1;
            const fileName = audio.filePath.split(/[\\/]/).pop();
            const audioURL = `http://localhost:4003/uploads${audio.filePath}`;

            const row = tableBody.insertRow();
            row.insertCell().textContent = actualIndex;
            const fileNameCell = row.insertCell();
            const link = document.createElement('a');
            link.href = audioURL;
            link.textContent = fileName;
            link.target = "_blank";
            fileNameCell.appendChild(link);
            row.insertCell().textContent = audio.audioType || "N/A";
            row.insertCell().textContent = audio.transcription || "N/A";
            row.insertCell().textContent = audio.remarks || "N/A";
            const actionCell = row.insertCell();
            const deleteButton = document.createElement("button");
            deleteButton.innerHTML = '<i class="fas fa-trash-alt"></i> Delete';
            deleteButton.classList.add("action-btn", "delete-btn");
            deleteButton.addEventListener('click', () => deleteAudio(audio.id)); // Use event listener
            actionCell.appendChild(deleteButton);
        });
        
        updatePaginationInfo();
        if (paginationControls) {
            paginationControls.style.display = filteredAudios.length > itemsPerPage ? 'flex' : 'none';
        }
    }

    function updatePaginationInfo() {
        if (!pageInfo || !prevPageBtn || !nextPageBtn) return;
        const totalPages = Math.ceil(filteredAudios.length / itemsPerPage);
        pageInfo.textContent = `Page ${currentPage} of ${totalPages > 0 ? totalPages : 1}`;
        prevPageBtn.disabled = currentPage === 1;
        nextPageBtn.disabled = currentPage === totalPages || totalPages === 0;
    }

    if(prevPageBtn) prevPageBtn.addEventListener("click", () => {
        if (currentPage > 1) { currentPage--; renderAudiosPage(); }
    });
    if(nextPageBtn) nextPageBtn.addEventListener("click", () => {
        if ((currentPage * itemsPerPage) < filteredAudios.length) {
            currentPage++; renderAudiosPage();
        }
    });

    if(uploadForm) uploadForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        if (uploadButton) uploadButton.disabled = true;
        if (uploadStatus) {
            uploadStatus.textContent = "Uploading...";
            uploadStatus.className = 'info-message';
            uploadStatus.style.display = 'block';
        }

        // CORRECTED SELECTOR HERE:
        const activeLangTab = document.querySelector(".language-tabs .lang-btn.active"); 
        const language = activeLangTab ? activeLangTab.getAttribute("data-lang") : null;
        
        const audioType = document.getElementById("audioType").value;
        const fileInput = document.getElementById("audioFile");
        const transcription = document.getElementById("transcription").value.trim();
        const remarks = document.getElementById("remarks").value.trim();

        if (!language) {
            alert("⚠️ Please select a language tab first.");
            if (uploadButton) uploadButton.disabled = false;
            if (uploadStatus) uploadStatus.style.display = 'none';
            return;
        }
        if (!fileInput.files.length) {
            alert("⚠️ Please select an audio file.");
            if (uploadButton) uploadButton.disabled = false;
            if (uploadStatus) uploadStatus.style.display = 'none';
            return;
        }

        const formData = new FormData();
        formData.append("audio", fileInput.files[0]);
        formData.append("language", language);
        formData.append("audioType", audioType);
        formData.append("transcription", transcription);
        formData.append("remarks", remarks);

        try {
            const response = await fetch("http://localhost:4003/upload", { method: "POST", body: formData });
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: `Upload failed. Status: ${response.status}` }));
                throw new Error(errorData.message);
            }
            if (uploadStatus) {
                uploadStatus.textContent = "✅ Audio uploaded successfully!";
                uploadStatus.className = 'success-message';
            }
            uploadForm.reset();
            if(language) loadAudios(language); // Refresh list for the current language
        } catch (err) {
            console.error("❌ Error uploading audio:", err.message);
            if (uploadStatus) {
                uploadStatus.textContent = `❌ Failed to upload: ${err.message}`;
                uploadStatus.className = 'error-message';
            }
        } finally {
            if (uploadButton) uploadButton.disabled = false;
            setTimeout(() => { if (uploadStatus) uploadStatus.style.display = 'none'; }, 5000);
        }
    });

    async function deleteAudio(id) {
        if (!confirm("Are you sure you want to delete this audio file?")) return;
        try {
            const response = await fetch(`http://localhost:4003/upload/${id}`, { method: "DELETE" });
            if (response.ok) {
                alert("Audio deleted successfully.");
                const selectedLang = document.querySelector(".language-tabs .lang-btn.active")?.getAttribute("data-lang");
                if (selectedLang) loadAudios(selectedLang);
            } else {
                const errorData = await response.json().catch(() => ({ message: "Failed to delete audio."}));
                alert(`❌ Failed to delete audio: ${errorData.message}`);
            }
        } catch (err) {
            console.error("❌ Error deleting audio:", err.message);
            alert("❌ An error occurred while deleting the audio.");
        }
    }
    // window.deleteAudio = deleteAudio; // Not strictly needed due to addEventListener

    // Initial load is handled by the populateLanguageTabs callback
});
