async function loadActiveAnnouncements() {
    try {
      const response = await fetch("/playlist/active");
  
      if (!response.ok) {
        throw new Error("Failed to fetch active announcements");
      }
  
      const textResponse = await response.text(); // Get raw response as text
      console.log("Raw response from /playlist/active:", textResponse);
  
      const announcements = JSON.parse(textResponse); // Parse JSON
      console.log("Parsed active announcements:", announcements);
  
      const tableBody = document.getElementById("active-announcements");
      tableBody.innerHTML = ""; // Clear the table before populating
  
      announcements.forEach((announcement, index) => {
        const row = `<tr>
          <td>${index + 1}</td>
          <td>${announcement.name}</td>
          <td>${announcement.time}</td>
          <td>${announcement.sequence}</td>
        </tr>`;
        tableBody.innerHTML += row;
      });
    } catch (error) {
      console.error("Error loading active announcements:", error.message);
    }
  }
  
  
  // Load active announcements on page load
  window.onload = loadActiveAnnouncements;
  