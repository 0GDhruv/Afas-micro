async function fetchAnnouncementTypes() {
  const res = await fetch('/api/zones/types');
  const types = await res.json();
  const dropdown = document.getElementById('announcementDropdown');
  dropdown.innerHTML = types.map(t => `<option value="${t.type}">${t.type}</option>`).join('');
}

async function loadTable() {
  const res = await fetch('/api/zones/mappings');
  const mappings = await res.json();
  const tableBody = document.getElementById('zoneTableBody');
  const searchValue = document.getElementById('searchBox').value.toLowerCase();

  const filtered = mappings.filter(item =>
    item.announcement_type.toLowerCase().includes(searchValue) ||
    item.zone.toLowerCase().includes(searchValue)
  );

  tableBody.innerHTML = filtered.map((item, idx) => `
    <tr>
      <td>${idx + 1}</td>
      <td>${item.announcement_type}</td>
      <td>${item.zone}</td>
      <td><button onclick="deleteMapping(${item.id})">🗑</button></td>
    </tr>
  `).join('');
}

async function addZoneMapping() {
  const zone = document.getElementById('zoneInput').value.trim();
  const type = document.getElementById('announcementDropdown').value;

  if (!zone || !type) {
    alert("Both Zone and Announcement Type are required!");
    return;
  }

  await fetch('/api/zones/mappings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ zone, announcement_type: type })
  });

  document.getElementById('zoneInput').value = '';
  await loadTable();
}

async function deleteMapping(id) {
  if (confirm("Are you sure you want to delete this mapping?")) {
    await fetch(`/api/zones/mappings/${id}`, { method: 'DELETE' });
    await loadTable();
  }
}

window.onload = async () => {
  await fetchAnnouncementTypes();
  await loadTable();

  document.getElementById('searchBox').addEventListener('input', loadTable);
};
