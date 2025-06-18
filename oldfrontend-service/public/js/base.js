function logout() {
  alert("Logging out... (implement actual logout logic)");
}

const contentDiv = document.getElementById("page-content");

async function loadPage(page) {
  try {
    const htmlRes = await fetch(`../html/${page}.html`);
    const html = await htmlRes.text();
    contentDiv.innerHTML = html;

    const script = document.createElement("script");
    script.src = `../js/${page}.js`;
    script.type = "text/javascript";

    // 👇 When script is loaded, call init if available
    script.onload = () => {
      if (typeof window[`init${capitalize(page)}`] === "function") {
        window[`init${capitalize(page)}`]();
      }
    };

    contentDiv.appendChild(script);
  } catch (err) {
    contentDiv.innerHTML = `<p style="color:red;">Failed to load page: ${page}</p>`;
    console.error(err);
  }
}

document.querySelectorAll(".side-nav a").forEach(link => {
  link.addEventListener("click", (e) => {
    e.preventDefault();
    const page = link.getAttribute("data-page");
    if (page) {
      document.querySelector(".side-nav .active")?.classList.remove("active");
      link.classList.add("active");
      loadPage(page);
    }
  });
});

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// Load default
loadPage("dashboard");
