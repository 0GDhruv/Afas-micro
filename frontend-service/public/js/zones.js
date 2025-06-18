// frontend-service/public/js/zones.js
document.addEventListener('DOMContentLoaded', () => {
    const zoneMappingForm = document.getElementById('zoneMappingForm'); // Assuming this is the form ID
    const zoneNameInput = document.getElementById('zoneNameInput');
    const announcementTypeDropdown = document.getElementById('announcementTypeZoneDropdown'); // Corrected ID
    const addMappingBtn = document.getElementById('addZoneMappingBtn'); // Corrected ID
    const searchBox = document.getElementById('searchBox');
    const zoneTableBody = document.getElementById('zoneTableBody');

    const ZONE_API_BASE = "http://localhost:4013/api/zones"; // Zone service base URL

    let allZoneMappings = []; // To store all mappings for client-side search

    // Fetch Announcement Types for the dropdown
    async function fetchAnnouncementTypesForZones() {
        if (!announcementTypeDropdown) return;
        try {
            const response = await fetch(`${ZONE_API_BASE}/types`); // Fetches from Zone Service
            if (!response.ok) throw new Error('Failed to fetch announcement types');
            const types = await response.json(); // Expects array of objects like [{id, type}] or just [{type}]

            announcementTypeDropdown.innerHTML = '<option value="">-- Select Announcement Type --</option>';
            if (types.length > 0) {
                types.forEach(typeObj => {
                    // The API for /types in zone.controller.js returns [{id, type}]
                    // The API for /announcementtype/types in script-manager returns array of strings.
                    // Ensure consistency or handle both. Assuming zone service returns {id, type}.
                    const typeName = typeof typeObj === 'string' ? typeObj : typeObj.type;
                    const typeValue = typeof typeObj === 'string' ? typeObj : typeObj.type; // Or typeObj.id if backend expects ID
                    if(typeName) announcementTypeDropdown.add(new Option(typeName, typeValue));
                });
            } else {
                 announcementTypeDropdown.innerHTML = '<option value="">-- No Types Found --</option>';
            }
        } catch (err) {
            console.error("Error loading announcement types for zones:", err);
            if(announcementTypeDropdown) announcementTypeDropdown.innerHTML = '<option value="">-- Error Loading Types --</option>';
        }
    }

    // Load Zone Mappings into the table
    async function loadZoneMappings() {
        if (!zoneTableBody) return;
        showLoadingMessage(zoneTableBody, "Loading zone mappings...", 4);
        try {
            const response = await fetch(`${ZONE_API_BASE}/mappings`);
            if (!response.ok) throw new Error('Failed to fetch zone mappings');
            allZoneMappings = await response.json(); // Expects array like [{id, announcement_type, zone}]
            renderZoneMappings(); // Apply search and render
        } catch (err) {
            console.error("Error loading zone mappings:", err);
            if(zoneTableBody) showErrorMessage(zoneTableBody, "Error loading zone mappings.", 4);
        }
    }
    
    // Render table based on current `allZoneMappings` and search query
    function renderZoneMappings() {
        if (!zoneTableBody) return;
        const query = searchBox ? searchBox.value.toLowerCase().trim() : "";
        const filteredMappings = allZoneMappings.filter(mapping =>
            (mapping.zone_name || mapping.zone || "").toLowerCase().includes(query) ||
            (mapping.announcement_type || "").toLowerCase().includes(query)
        );

        zoneTableBody.innerHTML = "";
        if (filteredMappings.length === 0) {
            showInfoMessage(zoneTableBody, query ? "No mappings match your search." : "No zone mappings found.", 4);
            return;
        }

        filteredMappings.forEach((mapping, index) => {
            const row = zoneTableBody.insertRow();
            row.insertCell().textContent = index + 1;
            row.insertCell().textContent = mapping.zone_name || mapping.zone; // Backend might use 'zone' or 'zone_name'
            row.insertCell().textContent = mapping.announcement_type;
            
            const actionCell = row.insertCell();
            const deleteButton = document.createElement('button');
            deleteButton.innerHTML = '<i class="fas fa-trash-alt"></i> Delete';
            deleteButton.classList.add("action-btn", "delete-btn");
            deleteButton.title = `Delete mapping for zone ${mapping.zone_name || mapping.zone}`;
            deleteButton.addEventListener('click', () => deleteZoneMapping(mapping.id, mapping.zone_name || mapping.zone));
            actionCell.appendChild(deleteButton);
        });
    }


    // Add Zone Mapping
    if (addMappingBtn && zoneMappingForm) { // Check form as well
        addMappingBtn.addEventListener('click', async () => { // Changed from form submit to button click
            if (!zoneNameInput || !announcementTypeDropdown) return;
            const zoneName = zoneNameInput.value.trim();
            const announcementType = announcementTypeDropdown.value;

            if (!zoneName || !announcementType) {
                alert("Please enter a Zone Name and select an Announcement Type.");
                return;
            }

            try {
                const response = await fetch(`${ZONE_API_BASE}/mappings`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ zone: zoneName, announcement_type: announcementType })
                });
                if (!response.ok) {
                    const errorData = await response.json().catch(()=>({message: "Failed to add mapping."}));
                    throw new Error(errorData.message);
                }
                alert("Zone mapping added successfully!");
                zoneNameInput.value = ""; // Clear input
                if (announcementTypeDropdown.options.length > 0) announcementTypeDropdown.selectedIndex = 0;
                loadZoneMappings(); // Refresh table
            } catch (err) {
                console.error("Error adding zone mapping:", err);
                alert(`Error: ${err.message}`);
            }
        });
    }

    // Delete Zone Mapping
    async function deleteZoneMapping(mappingId, zoneName) {
        if (!confirm(`Are you sure you want to delete the mapping for zone "${zoneName}" (ID: ${mappingId})?`)) return;
        try {
            const response = await fetch(`${ZONE_API_BASE}/mappings/${mappingId}`, { method: "DELETE" });
            if (!response.ok) {
                const errorData = await response.json().catch(()=>({message: "Failed to delete mapping."}));
                throw new Error(errorData.message);
            }
            alert("Zone mapping deleted successfully.");
            loadZoneMappings(); // Refresh table
        } catch (err) {
            console.error("Error deleting zone mapping:", err);
            alert(`Error: ${err.message}`);
        }
    }
    // window.deleteZoneMapping = deleteZoneMapping; // Not needed if using addEventListener

    // Search functionality
    if(searchBox) searchBox.addEventListener('input', renderZoneMappings);

    // Initial Loads
    fetchAnnouncementTypesForZones();
    loadZoneMappings();
});
