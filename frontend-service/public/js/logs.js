    // frontend-service/public/js/logs.js
    document.addEventListener('DOMContentLoaded', () => {
        const logFiltersForm = document.getElementById('logFiltersForm');
        const logTypeFilter = document.getElementById('logTypeFilter');
        const serviceNameFilter = document.getElementById('serviceNameFilter');
        const flightNumberFilter = document.getElementById('flightNumberFilter');
        const startDateFilter = document.getElementById('startDateFilter');
        const endDateFilter = document.getElementById('endDateFilter');
        const applyFiltersBtn = document.getElementById('applyFiltersBtn');
        const resetFiltersBtn = document.getElementById('resetFiltersBtn');

        const logsTableBody = document.getElementById('logsTableBody');
        const logsPaginationDiv = document.getElementById('logsPagination');
        const prevLogsPageBtn = document.getElementById('prevLogsPageBtn');
        const nextLogsPageBtn = document.getElementById('nextLogsPageBtn');
        const logsPageInfo = document.getElementById('logsPageInfo');

        const logDetailsModal = document.getElementById('logDetailsModal');
        const logDetailsJson = document.getElementById('logDetailsJson');
        
        let currentPage = 1;
        const itemsPerPage = 15; // Number of logs per page

        const LOGS_API_URL = 'http://localhost:4025/api/logs'; // URL of your logs-service

        async function fetchLogs(page = 1) {
            if (!logsTableBody) return;
            if (window.showLoadingMessage) window.showLoadingMessage(logsTableBody, "Fetching logs...", 7);
            else logsTableBody.innerHTML = `<tr><td colspan="7" class="loading-text">Fetching logs...</td></tr>`;
            
            if(logsPaginationDiv) logsPaginationDiv.style.display = 'none';

            const params = new URLSearchParams({
                page: page,
                limit: itemsPerPage,
            });

            if (logTypeFilter.value) params.append('log_type', logTypeFilter.value);
            if (serviceNameFilter.value) params.append('service_name', serviceNameFilter.value);
            if (flightNumberFilter.value.trim()) params.append('flight_number', flightNumberFilter.value.trim());
            if (startDateFilter.value) params.append('startDate', startDateFilter.value);
            if (endDateFilter.value) params.append('endDate', endDateFilter.value);

            try {
                const response = await fetch(`${LOGS_API_URL}?${params.toString()}`);
                if (!response.ok) {
                    const errData = await response.json().catch(() => ({ message: "Unknown error fetching logs."}));
                    throw new Error(errData.message || `HTTP error ${response.status}`);
                }
                const data = await response.json(); // Expects { logs: [], currentPage, totalPages, totalLogs }

                renderLogs(data.logs);
                updateLogsPagination(data.currentPage, data.totalPages, data.totalLogs);

            } catch (error) {
                console.error("Error fetching logs:", error);
                if (window.showErrorMessage) window.showErrorMessage(logsTableBody, `Error fetching logs: ${error.message}`, 7);
                else logsTableBody.innerHTML = `<tr><td colspan="7" class="error-message">Error fetching logs.</td></tr>`;
            }
        }

        function renderLogs(logs) {
            logsTableBody.innerHTML = ""; // Clear previous logs or loading message
            if (!logs || logs.length === 0) {
                if (window.showInfoMessage) window.showInfoMessage(logsTableBody, "No logs found matching your criteria.", 7);
                else logsTableBody.innerHTML = `<tr><td colspan="7" class="no-data-text">No logs found.</td></tr>`;
                return;
            }

            logs.forEach(log => {
                const row = logsTableBody.insertRow();
                const timestamp = new Date(log.timestamp).toLocaleString(); // Format timestamp nicely
                
                row.insertCell().textContent = timestamp;
                row.insertCell().textContent = log.service_name || 'N/A';
                row.insertCell().textContent = log.log_type || 'N/A';
                row.insertCell().textContent = log.flight_number || '--';
                row.insertCell().textContent = log.language || '--';
                
                const messageCell = row.insertCell();
                messageCell.textContent = log.message.length > 100 ? log.message.substring(0, 97) + "..." : log.message;
                if(log.message.length > 100) messageCell.title = log.message; // Show full message on hover

                const detailsCell = row.insertCell();
                if (log.details && Object.keys(log.details).length > 0) {
                    const viewButton = document.createElement('button');
                    viewButton.innerHTML = '<i class="fas fa-eye"></i> View';
                    viewButton.classList.add('action-btn', 'view-details-btn');
                    viewButton.onclick = () => showLogDetails(log.details);
                    detailsCell.appendChild(viewButton);
                } else {
                    detailsCell.textContent = '--';
                }
            });
        }

        function updateLogsPagination(page, totalPages, totalLogs) {
            if (!logsPaginationDiv || !logsPageInfo || !prevLogsPageBtn || !nextLogsPageBtn) return;

            currentPage = parseInt(page, 10);
            logsPageInfo.textContent = `Page ${currentPage} of ${totalPages > 0 ? totalPages : 1} (${totalLogs} total)`;
            prevLogsPageBtn.disabled = currentPage === 1;
            nextLogsPageBtn.disabled = currentPage === totalPages || totalPages === 0;

            logsPaginationDiv.style.display = totalLogs > itemsPerPage ? 'flex' : 'none';
        }

        function showLogDetails(details) {
            if (logDetailsJson && logDetailsModal) {
                logDetailsJson.textContent = JSON.stringify(details, null, 2); // Pretty print JSON
                logDetailsModal.style.display = 'block';
            }
        }

        window.closeLogDetailsModal = () => { // Make it global for onclick in HTML
            if (logDetailsModal) logDetailsModal.style.display = 'none';
        }
        // Close modal if clicked outside of modal-content
        window.onclick = function(event) {
            if (event.target == logDetailsModal) {
                closeLogDetailsModal();
            }
        }


        // Event Listeners
        if (applyFiltersBtn) {
            applyFiltersBtn.addEventListener('click', () => fetchLogs(1)); // Fetch first page with new filters
        }
        if (resetFiltersBtn) {
            resetFiltersBtn.addEventListener('click', () => {
                if (logFiltersForm) logFiltersForm.reset();
                fetchLogs(1); // Fetch first page with no filters
            });
        }
        if (prevLogsPageBtn) {
            prevLogsPageBtn.addEventListener('click', () => {
                if (currentPage > 1) fetchLogs(currentPage - 1);
            });
        }
        if (nextLogsPageBtn) {
            nextLogsPageBtn.addEventListener('click', () => {
                // Check against totalPages which should be updated by fetchLogs
                const totalPages = Math.ceil(parseInt(logsPageInfo.textContent.split('(')[1]) / itemsPerPage); // A bit hacky, better to store totalPages
                if (currentPage < totalPages) fetchLogs(currentPage + 1);
            });
        }

        // Initial load
        fetchLogs();
    });
    