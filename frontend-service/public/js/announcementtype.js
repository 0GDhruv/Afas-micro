// frontend-service/public/js/announcementtype.js
document.addEventListener('DOMContentLoaded', () => {
    const areaSelectElement = document.getElementById("areaSelect");
    const announcementTypeForm = document.getElementById("announcementtype-form");
    const newTypeNameInput = document.getElementById("newTypeName");
    const typesTableBody = document.getElementById("typesTableBody");
    const languageTabsContainer = document.getElementById("announcementTypeLanguageTabs");

    let currentSelectedLanguage = null; // To keep track of the active language

    // Use the global populateLanguageTabs function
    if (languageTabsContainer && window.populateLanguageTabs) {
        window.populateLanguageTabs(languageTabsContainer, (selectedLanguage) => {
            currentSelectedLanguage = selectedLanguage;
            if (selectedLanguage) {
                loadAnnouncementTypes(selectedLanguage);
            } else {
                if (typesTableBody) showInfoMessage(typesTableBody, "Please select a language to view types.", 5);
            }
        }, "Loading languages for tabs...");
    } else {
        console.error("Language tabs container or populateLanguageTabs function not found.");
    }

    async function loadAnnouncementTypes(language) {
        if (!areaSelectElement) {
            console.error("Area select element 'areaSelect' not found.");
            if (typesTableBody) showErrorMessage(typesTableBody, "Configuration error: Area selector missing.", 5);
            return;
        }
        const area = areaSelectElement.value;
        currentSelectedLanguage = language; // Update current language

        if (!language || !area) {
            if (typesTableBody) showInfoMessage(typesTableBody, "Please select an area and language.", 5);
            return;
        }
        if (!typesTableBody) { console.error("Table body 'typesTableBody' not found."); return; }
        
        showLoadingMessage(typesTableBody, `Loading types for ${language} in ${area}...`, 5);

        try {
            const res = await fetch(`http://localhost:4006/announcementtype/types?language=${encodeURIComponent(language)}&area=${encodeURIComponent(area)}`);
            if (!res.ok) {
                const errorData = await res.json().catch(() => ({ message: `HTTP error! Status: ${res.status}` }));
                throw new Error(errorData.message || `Failed to fetch announcement types.`);
            }
            const types = await res.json();
            typesTableBody.innerHTML = "";

            if (types.length === 0) {
                showInfoMessage(typesTableBody, `No announcement types found for ${language} in ${area}.`, 5);
                return;
            }

            types.forEach((typeData, i) => {
                const typeName = typeof typeData === 'string' ? typeData : typeData.type;
                if (typeName === undefined) { console.warn("Undefined type name from API:", typeData); return; }
                
                const row = typesTableBody.insertRow();
                row.insertCell().textContent = i + 1;
                row.insertCell().textContent = typeName;
                row.insertCell().textContent = language.charAt(0).toUpperCase() + language.slice(1);
                row.insertCell().textContent = area.charAt(0).toUpperCase() + area.slice(1);
                
                const actionCell = row.insertCell();
                const deleteButton = document.createElement("button");
                deleteButton.innerHTML = '<i class="fas fa-trash-alt"></i> Delete';
                deleteButton.classList.add("action-btn", "delete-btn");
                deleteButton.title = `Delete type: ${typeName}`;
                deleteButton.addEventListener('click', () => deleteType(typeName, language, area)); // Use event listener
                actionCell.appendChild(deleteButton);
            });
        } catch (err) {
            console.error("Error loading announcement types:", err);
            if (typesTableBody) showErrorMessage(typesTableBody, "Error loading types. Check console.", 5);
        }
    }

    if (announcementTypeForm) {
        announcementTypeForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            if (!newTypeNameInput || !areaSelectElement || !currentSelectedLanguage) {
                alert("Essential form elements are missing or no language selected. Cannot add type.");
                return;
            }
            const type = newTypeNameInput.value.trim();
            const area = areaSelectElement.value;
            if (!type) { alert("New Announcement Type Name is required."); newTypeNameInput.focus(); return; }
            if (!area) { alert("Area selection is required."); areaSelectElement.focus(); return; }

            try {
                const res = await fetch("http://localhost:4006/announcementtype/types", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ type, language: currentSelectedLanguage, area })
                });
                if (res.ok) {
                    alert("Announcement type added successfully!");
                    newTypeNameInput.value = "";
                    loadAnnouncementTypes(currentSelectedLanguage);
                } else {
                    const errorData = await res.json().catch(() => ({ message: "Failed to add type." }));
                    alert(`Failed to add type: ${errorData.message || res.statusText}`);
                }
            } catch (err) {
                console.error("Failed to add announcement type:", err);
                alert("An error occurred. Check console.");
            }
        });
    }

    async function deleteType(typeName, language, area) {
        if (!confirm(`Delete type "${typeName}" for ${language} in ${area}?`)) return;
        try {
            const res = await fetch(`http://localhost:4006/announcementtype/types/${encodeURIComponent(typeName)}?language=${encodeURIComponent(language)}&area=${encodeURIComponent(area)}`, {
                method: "DELETE"
            });
            if (res.ok) {
                alert("Type deleted successfully.");
                loadAnnouncementTypes(language);
            } else {
                const errorData = await res.json().catch(() => ({ message: "Failed to delete." }));
                alert(`Failed to delete type: ${errorData.message || res.statusText}`);
            }
        } catch (err) {
            console.error("Failed to delete type:", err);
            alert("An error occurred. Check console.");
        }
    }
    // window.deleteType = deleteType; // No longer needed if using addEventListener

    if (areaSelectElement) {
        areaSelectElement.addEventListener("change", () => {
            if (currentSelectedLanguage) {
                loadAnnouncementTypes(currentSelectedLanguage);
            } else {
                if (typesTableBody) showInfoMessage(typesTableBody, "Please select a language tab first.", 5);
            }
        });
    }
    // Initial load is handled by the populateLanguageTabs callback
});
