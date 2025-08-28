let hospitalData = [];


document.addEventListener("DOMContentLoaded", () => {
  // Fetch hospital data
  fetch("http://localhost:5000/api/hospitals")
    .then(res => res.json())
    .then(data => {
      hospitalData = data;
      renderHospitals(hospitalData);
      populateAdminSelect(hospitalData);
    });

  const loginForm = document.getElementById("loginForm");
  const adminForm = document.getElementById("adminForm");
  const search = document.getElementById("search");
  const filter = document.getElementById("filter-specialty");

  if (loginForm) loginForm.addEventListener("submit", handleLogin);
  if (adminForm) adminForm.addEventListener("submit", handleAdminUpdate);
  if (search) search.addEventListener("input", filterHospitals);
  if (filter) filter.addEventListener("change", filterHospitals);
});

// Filter Function
function filterHospitals() {
  const searchTerm = document.getElementById("search").value.toLowerCase().trim();
  const selectedSpecialty = document.getElementById("filter-specialty").value;

  // Split search term into words
  const keywords = searchTerm.split(" ").filter(word => word.length > 0);

  const filtered = hospitalData.filter(hospital => {
    const allText = `
      ${hospital.name} 
      ${hospital.city} 
      ${hospital.specialties?.join(" ")}
    `.toLowerCase();

    const matchesKeywords = keywords.every(keyword =>
      allText.includes(keyword)
    );

    const matchesSpecialty =
      !selectedSpecialty ||
      (selectedSpecialty === "ICU" && hospital.icu > 0) ||
      (selectedSpecialty === "Ventilator" && hospital.ventilators > 0) ||
      (selectedSpecialty === "Beds" && hospital.beds > 0) ||
      (selectedSpecialty === "Cardiology" && hospital.specialties?.includes("Cardiology"));

    return matchesKeywords && matchesSpecialty;
  });

  renderHospitals(filtered);
}


// Render Hospital Cards
function renderHospitals(hospitals) {
  const container = document.getElementById("hospitalList");
  if (!container) return;
  container.innerHTML = "";

  if (hospitals.length === 0) {
    container.innerHTML = "<p>No hospitals found.</p>";
    return;
  }

  hospitals.forEach((hospital, index) => {
    const card = document.createElement("div");
    card.className = "hospital-card";

    const imageUrl = hospital.image || `https://source.unsplash.com/400x200/?hospital,building,clinic&sig=${index}`;

    card.innerHTML = `
      <img src="${imageUrl}" alt="Hospital Image">
      <h3>${hospital.name}</h3>
      <p><strong>City:</strong> ${hospital.city}</p>
      <p><strong>Beds:</strong> ${hospital.beds}</p>
      <p><strong>ICU:</strong> ${hospital.icu}</p>
      <p><strong>Ventilators:</strong> ${hospital.ventilators}</p>
      <p><strong>Specialties:</strong> ${hospital.specialties?.join(", ") || "N/A"}</p>
      <button class="view-map-btn" data-url="${hospital.mapUrl}">View on Map</button>

      <button onclick="toggleBookingForm(this)">📝 Book Now</button>
    <form class="booking-form" style="display: none; margin-top: 1rem;" 
        onsubmit="sendBookingEmail(event, '${hospital.name}')">
    <input type="text" placeholder="Your Name" required />
    <input type="email" placeholder="Your Email" required />
    <select required>
      <option value="">Select Service</option>
      <option value="General">General Bed</option>
      <option value="ICU">ICU</option>
      <option value="Ventilator">Ventilator</option>
    </select>
    <input type="datetime-local" required />
    <button type="submit">Submit Booking</button>
  </form>
    `;
    container.appendChild(card);
  });

  // Re-bind map button after rendering
  document.querySelectorAll(".view-map-btn").forEach(btn => {
    btn.addEventListener("click", function () {
      const mapUrl = this.getAttribute("data-url");
      const mapFrame = document.getElementById("map");
      const mapSection = document.getElementById("mapSection");
      if (mapFrame && mapSection) {
        mapFrame.src = mapUrl;
        mapSection.scrollIntoView({ behavior: "smooth" });
      }
    });
  });
}

// Populate Admin Dropdown
function populateAdminSelect(hospitals) {
  const select = document.getElementById("adminHospitalSelect");
  if (!select) return;

  select.innerHTML = "";
  hospitals.forEach((h, i) => {
    const opt = document.createElement("option");
    opt.value = i;
    opt.textContent = h.name;
    select.appendChild(opt);
  });
}

// Admin Update Handler
function handleAdminUpdate(e) {
  e.preventDefault();
  const index = document.getElementById("adminHospitalSelect").value;
  const beds = parseInt(document.getElementById("bedsInput").value);
  const icu = parseInt(document.getElementById("icuInput").value);
  const ventilators = parseInt(document.getElementById("ventilatorInput").value);

  if (!isNaN(index) && hospitalData[index]) {
    hospitalData[index].beds = beds;
    hospitalData[index].icu = icu;
    hospitalData[index].ventilators = ventilators;
    renderHospitals(hospitalData);

    // Save to backend
    fetch("http://localhost:5000/api/update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(hospitalData)
    }).then(res => res.json()).then(msg => {
      alert(msg.message || "Updated successfully!");
    }).catch(err => console.error("Update error:", err));
  }
}

// Admin Login Logic
const ADMIN_USERNAME = "admin";
const ADMIN_PASSWORD = "1234";

function handleLogin(e) {
  e.preventDefault();
  const username = document.getElementById("username")?.value.trim();
  const password = document.getElementById("password")?.value.trim();
  const errorDisplay = document.getElementById("loginError");

    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    document.getElementById("adminPanel").classList.remove("hidden");
    document.getElementById("loginPanel").classList.add("hidden");
    console.log("Login successful, showing admin panel");

    if (errorDisplay) errorDisplay.textContent = "";
  } else {
    if (errorDisplay) errorDisplay.textContent = "Invalid username or password.";
  }
}
const addForm = document.getElementById("addHospitalForm");

if (addForm) {
  addForm.addEventListener("submit", handleAddHospital);
}
// Hospital add from admin panel
function handleAddHospital(e) {
  e.preventDefault();

  const newHospital = {
    name: document.getElementById("newName").value,
    city: document.getElementById("newCity").value,
    beds: parseInt(document.getElementById("newBeds").value),
    icu: parseInt(document.getElementById("newICU").value),
    ventilators: parseInt(document.getElementById("newVentilators").value),
    specialties: document.getElementById("newSpecialties").value
                    .split(",")
                    .map(s => s.trim()),
    mapUrl: document.getElementById("newMapUrl").value,
    image: document.getElementById("newImageUrl").value || null
  };

  hospitalData.push(newHospital);
  renderHospitals(hospitalData);
  populateAdminSelect(hospitalData);

  fetch("http://localhost:5000/api/update", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(hospitalData)
  })
  .then(res => res.json())
  .then(msg => {
    alert(msg.message || "Hospital added successfully!");
    document.getElementById("addHospitalForm").reset();
  })
  .catch(err => console.error("Error adding hospital:", err));
}

// Dark Mode Toggle

    const toggleBtn = document.getElementById("toggleDarkMode");

  if (localStorage.getItem("theme") === "dark") {
    document.body.classList.add("dark");
    toggleBtn.textContent = "☀️ Light Mode";
  }

  toggleBtn.addEventListener("click", () => {
    document.body.classList.toggle("dark");

    // Update button text
    if (document.body.classList.contains("dark")) {
      toggleBtn.textContent = "☀️ Light Mode";
      localStorage.setItem("theme", "dark"); // Save preference
    } else {
      toggleBtn.textContent = "🌙 Dark Mode";
      localStorage.setItem("theme", "light");
    }
  });
function toggleBookingForm(button) {
  const form = button.nextElementSibling;
  form.style.display = form.style.display === "none" ? "block" : "none";
}
function sendBookingEmail(event, hospitalName) {
  event.preventDefault();

  const form = event.target;
  const bookingData = {
    name: form.name.value,
    email: form.email.value,
    service: form.service.value,
    datetime: form.datetime.value,
    hospital: hospitalName
  };

  fetch("http://localhost:5000/api/book", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(bookingData)
  })
  .then(res => res.json())
  .then(data => {
    alert(data.message || "Booking sent successfully!");
    form.reset();
    form.style.display = "none";
  })
  .catch(err => {
    console.error("Booking error:", err);
    alert("Error sending booking.");
  });
}
