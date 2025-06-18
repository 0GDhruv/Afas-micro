// dashboard.js

async function loadActiveAnnouncements() {
  try {
    const response = await fetch("http://localhost:4005/playlist/active");

    if (!response.ok) {
      throw new Error("Failed to fetch active announcements");
    }

    const announcements = await response.json();
    const tableBody = document.getElementById("announcementTableBody");
    if (!tableBody) return;

    tableBody.innerHTML = announcements.map((a, i) => `
      <tr>
        <td>${i + 1}</td>
        <td>${a.announcement_name}</td>
        <td>${a.status}</td>
        <td>${a.flight_code}</td>
        <td>${a.airline_name}</td>
        <td>${a.city_name}</td>
        <td>${a.gate_number}</td>
        <td>${a.time}</td>
        <td>${a.sequence}</td>
      </tr>
    `).join('');
  } catch (error) {
    console.error("Error loading active announcements:", error.message);
  }
}

// ✅ This gets called from base.js after script is loaded
function initDashboard() {
  loadActiveAnnouncements();
  setInterval(loadActiveAnnouncements, 30000);
}
