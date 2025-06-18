// frontend-service/public/js/base.js

/**
 * Basic logout functionality.
 * In a real application, this would clear tokens/session and redirect to a login page.
 */
function logout() {
  console.log("Logout button clicked. Implement actual logout logic.");
  // Example: Clear local storage, session storage, cookies
  // localStorage.removeItem('authToken');
  // sessionStorage.removeItem('userData');
  alert("Logout functionality placeholder. Redirecting to a hypothetical login page.");
  // window.location.href = '/login.html'; // Or your actual login page route
}

/**
 * Helper function to show a loading message.
 * @param {HTMLElement} element - The DOM element where the loading message should be shown.
 * @param {string} message - The message to display.
 */
function showLoadingMessage(element, message = "Loading...") {
  if (element) {
    element.innerHTML = `<p class="loading-text">${message}</p>`;
  }
}

/**
 * Helper function to show an error message.
 * @param {HTMLElement} element - The DOM element where the error message should be shown.
 * @param {string} message - The error message to display.
 */
function showErrorMessage(element, message = "An error occurred.") {
  if (element) {
    element.innerHTML = `<p class="error-message">${message}</p>`; // Ensure .error-message is styled
  }
}

/**
 * Helper function to show an informational message.
 * @param {HTMLElement} element - The DOM element where the info message should be shown.
 * @param {string} message - The message to display.
 */
function showInfoMessage(element, message) {
  if (element) {
    element.innerHTML = `<p class="info-message">${message}</p>`; // Ensure .info-message is styled
  }
}

/**
 * Common function to fetch languages from the Upload Service and populate tab-like buttons.
 * @param {HTMLElement} tabsContainerElement - The container element for the language tabs.
 * @param {function} onTabClickCallback - Callback function to execute when a language tab is clicked. It receives the selected language string.
 * @param {string} initialLoadingText - Text to show while languages are loading.
 */
async function populateLanguageTabs(tabsContainerElement, onTabClickCallback, initialLoadingText = "Loading languages...") {
    if (!tabsContainerElement) {
        console.error("Language tabs container not provided or not found.");
        return;
    }
    showLoadingMessage(tabsContainerElement, initialLoadingText);

    try {
        const response = await fetch("http://localhost:4003/languages"); // Centralized languages endpoint
        if (!response.ok) {
            throw new Error(`Failed to fetch languages: ${response.status} ${response.statusText}`);
        }
        const languages = await response.json();

        tabsContainerElement.innerHTML = ""; // Clear loading message

        if (!languages || languages.length === 0) {
            showInfoMessage(tabsContainerElement, "No languages found. Configure languages or upload audio to create them.");
            // Optionally call the callback with null or an empty state
            if (typeof onTabClickCallback === 'function') {
                onTabClickCallback(null);
            }
            return;
        }

        languages.forEach((lang, index) => {
            const button = document.createElement("button");
            button.textContent = lang.charAt(0).toUpperCase() + lang.slice(1);
            button.classList.add("lang-btn"); // Consistent class for all language buttons
            if (index === 0) {
                button.classList.add("active");
            }
            button.setAttribute("data-lang", lang);

            button.addEventListener("click", () => {
                tabsContainerElement.querySelectorAll(".lang-btn.active").forEach(b => b.classList.remove("active"));
                button.classList.add("active");
                if (typeof onTabClickCallback === 'function') {
                    onTabClickCallback(lang);
                }
            });
            tabsContainerElement.appendChild(button);
        });

        // Trigger callback for the initially active language
        if (languages.length > 0 && typeof onTabClickCallback === 'function') {
            onTabClickCallback(languages[0]);
        }

    } catch (err) {
        console.error("Error populating language tabs:", err);
        showErrorMessage(tabsContainerElement, "Could not load languages.");
         if (typeof onTabClickCallback === 'function') {
            onTabClickCallback(null); // Indicate failure or empty state
        }
    }
}

// Make functions available globally if needed, or use ES6 modules if your setup supports it.
// For simplicity in this multi-file context without a bundler, attaching to window.
window.logout = logout;
window.populateLanguageTabs = populateLanguageTabs;
window.showLoadingMessage = showLoadingMessage;
window.showErrorMessage = showErrorMessage;
window.showInfoMessage = showInfoMessage;
