// frontend-service/public/js/dashboard.js

document.addEventListener('DOMContentLoaded', async () => {
    // --- Variables for Active Announcements pagination ---
    let currentActivePage = 1;
    const itemsPerActivePage = 5; // Number of active announcements per page
    let activeAnnouncementsData = [];
    let globalSettings = {}; // To store global settings like playback frequency

    // --- Variables for Uploaded Audios pagination ---
    let currentAudiosPage = 1;
    const itemsPerAudiosPage = 4; // Show 4 languages per page in the summary
    let allUploadedAudioCounts = []; // Stores { lang: 'Name', count: X } objects

    // DOM Elements for Active Announcements
    const activeAnnouncementsTableBody = document.getElementById("activeAnnouncementsTableBody");
    const announcementsPaginationDiv = document.getElementById("announcementsPagination");
    const prevActivePageButton = document.getElementById("prevPageButton");
    const nextActivePageButton = document.getElementById("nextPageButton");
    const currentActivePageInfo = document.getElementById("currentPageInfo");
    
    // DOM Elements for Uploaded Audios
    const uploadedAudiosListElement = document.getElementById("uploadedAudiosList");
    const uploadedAudiosPaginationDiv = document.getElementById("uploadedAudiosPagination");
    const prevAudiosPageBtn = document.getElementById("prevAudiosPageBtn");
    const nextAudiosPageBtn = document.getElementById("nextAudiosPageBtn");
    const audiosPageInfo = document.getElementById("audiosPageInfo");

    // DOM Elements for Summaries
    const settingsPreviewListElement = document.getElementById("settingsPreviewList");
    const totalFlightsEl = document.getElementById("totalFlightsToday");
    const announcementsDoneEl = document.getElementById("announcementsDoneToday");
    const pendingAnnouncementsEl = document.getElementById("pendingAnnouncements");


    async function fetchGlobalSettings() {
        try {
            const response = await fetch("http://localhost:4010/settings");
            if (!response.ok) {
                console.error("Failed to fetch global settings:", response.status);
                return { frequency: 1, languages: {}, language_order: [], audio_lag: 0, advance_minutes: 0 };
            }
            globalSettings = await response.json();
            return globalSettings;
        } catch (error) {
            console.error("Error fetching global settings:", error);
            return { frequency: 1, languages: {}, language_order: [], audio_lag: 0, advance_minutes: 0 };
        }
    }

    async function loadActiveAnnouncements() {
        try {
            // Ensure global settings are loaded as they might be used for display (e.g., frequency)
            if (Object.keys(globalSettings).length === 0) {
                await fetchGlobalSettings();
            }

            const response = await fetch("http://localhost:4005/playlist/active");
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            activeAnnouncementsData = await response.json();
            renderActiveAnnouncementsTable();
        } catch (error) {
            console.error("Error fetching active announcements:", error);
            if (activeAnnouncementsTableBody) {
                const colspan = document.getElementById("activeAnnouncementsTable")?.querySelector("thead tr")?.cells.length || 8;
                activeAnnouncementsTableBody.innerHTML = `<tr><td colspan="${colspan}" class="error-message">Error loading announcements.</td></tr>`;
            }
            updateActiveAnnouncementsPaginationButtons();
        }
    }

    function renderActiveAnnouncementsTable() {
        if (!activeAnnouncementsTableBody) return;
        activeAnnouncementsTableBody.innerHTML = "";

        const paginatedItems = activeAnnouncementsData.slice(
            (currentActivePage - 1) * itemsPerActivePage,
            currentActivePage * itemsPerActivePage
        );
        
        const colspan = document.getElementById("activeAnnouncementsTable")?.querySelector("thead tr")?.cells.length || 8;

        if (paginatedItems.length === 0) {
            activeAnnouncementsTableBody.innerHTML = `<tr><td colspan="${colspan}" class="no-data-text">No active announcements.</td></tr>`;
            updateActiveAnnouncementsPaginationButtons();
            return;
        }

        paginatedItems.forEach((item, index) => {
            const row = activeAnnouncementsTableBody.insertRow();
            const serialNumber = (currentActivePage - 1) * itemsPerActivePage + index + 1;

            const name = item.announcement_name || "N/A";
            const type = item.status || "N/A";
            const flightNumber = item.flight_code || item.flight_number || "N/A";
            const time = item.time || "--:--";
            const duration = item.audio_duration || "--:--";
            const playbackFrequency = item.flight_specific_frequency || globalSettings.frequency || "N/A";

            row.insertCell().textContent = serialNumber;
            row.insertCell().textContent = name;
            row.insertCell().textContent = type;
            row.insertCell().textContent = flightNumber;
            row.insertCell().textContent = time;
            row.insertCell().textContent = duration;
            row.insertCell().textContent = playbackFrequency;

            const settingsCell = row.insertCell();
            const settingsButton = document.createElement("button");
            settingsButton.innerHTML = '<i class="fas fa-sliders-h"></i>';
            settingsButton.classList.add("action-btn", "settings-btn");
            settingsButton.title = `Configure settings for flight ${flightNumber}`;
            settingsButton.onclick = function() {
                const flightIdForSettings = item.flight_number || flightNumber;
                if (flightIdForSettings && flightIdForSettings !== "N/A") {
                     window.location.href = `/flight-settings?flight_number=${encodeURIComponent(flightIdForSettings)}`;
                } else {
                    alert("Flight number not available for individual settings.");
                }
            };
            settingsCell.appendChild(settingsButton);
        });
        updateActiveAnnouncementsPaginationButtons();
    }

    function updateActiveAnnouncementsPaginationButtons() {
        if (!currentActivePageInfo || !prevActivePageButton || !nextActivePageButton || !announcementsPaginationDiv) return;
        const totalPages = Math.ceil(activeAnnouncementsData.length / itemsPerActivePage);
        currentActivePageInfo.textContent = `Page ${currentActivePage} of ${totalPages > 0 ? totalPages : 1}`;
        prevActivePageButton.disabled = currentActivePage === 1;
        nextActivePageButton.disabled = currentActivePage === totalPages || totalPages === 0;
        announcementsPaginationDiv.style.display = totalPages > 1 ? "flex" : "none";
    }

    async function loadUploadedAudiosSummary() {
        if (!uploadedAudiosListElement || !uploadedAudiosPaginationDiv) return;
        showLoadingMessage(uploadedAudiosListElement, "Loading audio counts...");
        uploadedAudiosPaginationDiv.style.display = 'none';

        try {
            const langResponse = await fetch("http://localhost:4003/languages");
            if (!langResponse.ok) throw new Error(`Failed to fetch languages: ${langResponse.status}`);
            const languages = await langResponse.json();
            allUploadedAudioCounts = [];

            if (languages.length === 0) {
                showInfoMessage(uploadedAudiosListElement, "No languages configured.");
                return;
            }
            const languagesToFetch = [...new Set([...languages, 'temp'])];
            for (const lang of languagesToFetch) {
                try {
                    const audioFilesResponse = await fetch(`http://localhost:4003/upload?language=${lang}`);
                    let count = 0;
                    if (audioFilesResponse.ok) count = (await audioFilesResponse.json()).length;
                    allUploadedAudioCounts.push({ lang: lang.charAt(0).toUpperCase() + lang.slice(1), count: count });
                } catch (e) {
                    allUploadedAudioCounts.push({ lang: lang.charAt(0).toUpperCase() + lang.slice(1), count: 0 });
                }
            }
            currentAudiosPage = 1;
            renderUploadedAudiosPage();
        } catch (error) {
            console.error("Error fetching uploaded audios summary:", error);
            showErrorMessage(uploadedAudiosListElement, "Error loading audio counts.");
        }
    }

    function renderUploadedAudiosPage() {
        if (!uploadedAudiosListElement || !uploadedAudiosPaginationDiv) return;
        uploadedAudiosListElement.innerHTML = "";

        if (allUploadedAudioCounts.length === 0) {
            showInfoMessage(uploadedAudiosListElement, "No audio data available.");
            uploadedAudiosPaginationDiv.style.display = 'none';
            return;
        }
        const startIndex = (currentAudiosPage - 1) * itemsPerAudiosPage;
        const paginatedAudioCounts = allUploadedAudioCounts.slice(startIndex, startIndex + itemsPerAudiosPage);

        if (paginatedAudioCounts.length === 0 && currentAudiosPage > 1) {
            currentAudiosPage--; renderUploadedAudiosPage(); return;
        }
        if (paginatedAudioCounts.length === 0 && currentAudiosPage === 1) {
             showInfoMessage(uploadedAudiosListElement, "No audio data for this page.");
        }

        paginatedAudioCounts.forEach(item => {
            const listItem = document.createElement('li');
            listItem.innerHTML = `<strong>${item.lang}:</strong> <span>${item.count}</span>`;
            uploadedAudiosListElement.appendChild(listItem);
        });
        updateUploadedAudiosPagination();
        uploadedAudiosPaginationDiv.style.display = allUploadedAudioCounts.length > itemsPerAudiosPage ? 'flex' : 'none';
    }

    function updateUploadedAudiosPagination() {
        if (!audiosPageInfo || !prevAudiosPageBtn || !nextAudiosPageBtn) return;
        const totalPages = Math.ceil(allUploadedAudioCounts.length / itemsPerAudiosPage);
        audiosPageInfo.textContent = `Page ${currentAudiosPage} of ${totalPages > 0 ? totalPages : 1}`;
        prevAudiosPageBtn.disabled = currentAudiosPage === 1;
        nextAudiosPageBtn.disabled = currentAudiosPage === totalPages || totalPages === 0;
    }

    async function loadSettingsPreview() {
        if (!settingsPreviewListElement) return;
        try {
            if (Object.keys(globalSettings).length === 0) await fetchGlobalSettings();
            const settings = globalSettings;
            if (!settings || Object.keys(settings).length === 0 || !settings.languages) {
                 settingsPreviewListElement.innerHTML = "<li>Could not load global settings.</li>"; return;
            }
            const enabledGlobalLangs = [];
            if(settings.languages.english) enabledGlobalLangs.push("English");
            if(settings.languages.hindi) enabledGlobalLangs.push("Hindi");
            if(settings.languages.regional_active && settings.regional_language_name) {
                enabledGlobalLangs.push(settings.regional_language_name.charAt(0).toUpperCase() + settings.regional_language_name.slice(1));
            }
            settingsPreviewListElement.innerHTML = `
                <li><strong>Languages Order:</strong> <span>${(settings.language_order || []).join(', ') || 'N/A'}</span></li>
                <li><strong>Enabled Globally:</strong> <span>${enabledGlobalLangs.join(', ') || 'None'}</span></li>
                <li><strong>Regional Config:</strong> <span>${settings.regional_language_name || 'None'} (${settings.languages?.regional_active ? 'Active' : 'Inactive'})</span></li>
                <li><strong>Repetition:</strong> <span>${settings.frequency !== undefined ? settings.frequency : 'N/A'}</span></li>
                <li><strong>Audio Lag:</strong> <span>${settings.audio_lag !== undefined ? settings.audio_lag + 's' : 'N/A'}</span></li>
                <li><strong>Advance Time:</strong> <span>${settings.advance_minutes !== undefined ? settings.advance_minutes + ' mins' : 'N/A'}</span></li>
            `;
        } catch (error) {
            console.error("Error fetching global settings preview:", error);
            settingsPreviewListElement.innerHTML = "<li>Error loading global settings.</li>";
        }
    }

    async function loadAnnouncementSummary() {
        if (!totalFlightsEl || !announcementsDoneEl || !pendingAnnouncementsEl) return;
        try {
            const pendingResponse = await fetch("http://localhost:4008/audio/active");
            if (pendingResponse.ok) {
                pendingAnnouncementsEl.textContent = (await pendingResponse.json()).length;
            } else {
                pendingAnnouncementsEl.textContent = "Error";
            }
            // Placeholders - require backend implementation
            totalFlightsEl.textContent = "N/A";
            announcementsDoneEl.textContent = "N/A";
        } catch (error) {
            if(totalFlightsEl) totalFlightsEl.textContent = "Error";
            if(announcementsDoneEl) announcementsDoneEl.textContent = "Error";
            if(pendingAnnouncementsEl) pendingAnnouncementsEl.textContent = "Error";
        }
    }

    // Initial Load
    await Promise.all([
        loadActiveAnnouncements(),
        loadAnnouncementSummary(),
        loadUploadedAudiosSummary()
    ]);
    await loadSettingsPreview();

    // Event Listeners
    if (prevActivePageButton) prevActivePageButton.addEventListener("click", () => {
        if (currentActivePage > 1) { currentActivePage--; renderActiveAnnouncementsTable(); }
    });
    if (nextActivePageButton) nextActivePageButton.addEventListener("click", () => {
        if ((currentActivePage * itemsPerActivePage) < activeAnnouncementsData.length) {
            currentActivePage++; renderActiveAnnouncementsTable();
        }
    });
    if(prevAudiosPageBtn) prevAudiosPageBtn.addEventListener("click", () => {
        if (currentAudiosPage > 1) { currentAudiosPage--; renderUploadedAudiosPage(); }
    });
    if(nextAudiosPageBtn) nextAudiosPageBtn.addEventListener("click", () => {
        if ((currentAudiosPage * itemsPerAudiosPage) < allUploadedAudioCounts.length) {
            currentAudiosPage++; renderUploadedAudiosPage();
        }
    });
});
