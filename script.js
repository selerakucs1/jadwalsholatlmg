const kotaInput = document.getElementById("kotaInput");
const kotaList = document.getElementById("kotaList");
const jadwalList = document.getElementById("jadwalList");
const countdownEl = document.getElementById("countdown");
const nextNameEl = document.getElementById("nextName");
const ceDateEl = document.getElementById("ceDate");
const hijrDateEl = document.getElementById("hijrDate");
const runningAyatEl = document.getElementById("runningAyat");

let currentJadwal = null;
let countdownInterval = null;

const icons = {
  Subuh: "bi-moon",
  Dzuhur: "bi-sun",
  Jumat: "bi-journal-bookmark",
  Ashar: "bi-sunset",
  Maghrib: "bi-cloud-sun",
  Isya: "bi-moon-stars",
  Terbit: "bi-sunrise",
  Dhuha: "bi-brightness-high"
};

// ================= LOAD KOTA =================
async function loadKota() {
  const res = await fetch("https://api.myquran.com/v2/sholat/kota/semua");
  const data = await res.json();

  kotaList.innerHTML = "";

  data.data.forEach(kota => {
    const option = document.createElement("option");
    option.value = kota.lokasi;
    option.dataset.id = kota.id;
    kotaList.appendChild(option);
  });

  kotaInput.value = "Kab. Lamongan";
  loadJadwal("1610");
}

// ================= LOAD JADWAL =================
async function loadJadwal(id) {
  const now = new Date();
  const tahun = now.getFullYear();
  const bulan = String(now.getMonth() + 1).padStart(2, "0");
  const tanggal = String(now.getDate()).padStart(2, "0");

  const res = await fetch(
    `https://api.myquran.com/v2/sholat/jadwal/${id}/${tahun}/${bulan}/${tanggal}`
  );
  const data = await res.json();

  currentJadwal = data.data.jadwal;

  ceDateEl.textContent = currentJadwal.tanggal;
  hijrDateEl.textContent = currentJadwal.hijriah;

  renderJadwal();
  startCountdown();
}

// ================= RENDER =================
function renderJadwal() {
  const now = new Date();
  const isFriday = now.getDay() === 5;

  const list = [
    { nama: "Subuh", jam: currentJadwal.subuh },
    { nama: isFriday ? "Jumat" : "Dzuhur", jam: currentJadwal.dzuhur },
    { nama: "Ashar", jam: currentJadwal.ashar },
    { nama: "Maghrib", jam: currentJadwal.maghrib },
    { nama: "Isya", jam: currentJadwal.isya }
  ];

  jadwalList.innerHTML = "";

  list.forEach(w => {
    const div = document.createElement("div");
    div.className = "schedule-item";
    div.innerHTML = `
      <span><i class="bi ${icons[w.nama]}"></i> ${w.nama}</span>
      <span>${w.jam}</span>
    `;
    jadwalList.appendChild(div);
  });
}

// ================= COUNTDOWN =================
function startCountdown() {
  if (countdownInterval) clearInterval(countdownInterval);

  countdownInterval = setInterval(() => {
    const now = new Date();
    const todayStr =
      now.getFullYear() + "-" +
      String(now.getMonth() + 1).padStart(2, "0") + "-" +
      String(now.getDate()).padStart(2, "0");

    const waktu = [
      { nama: "Subuh", jam: currentJadwal.subuh },
      { nama: "Terbit", jam: currentJadwal.terbit },
      { nama: "Dhuha", jam: currentJadwal.dhuha },
      { nama: "Dzuhur", jam: currentJadwal.dzuhur },
      { nama: "Ashar", jam: currentJadwal.ashar },
      { nama: "Maghrib", jam: currentJadwal.maghrib },
      { nama: "Isya", jam: currentJadwal.isya }
    ];

    let next = null;

    for (let w of waktu) {
      const target = new Date(`${todayStr}T${w.jam}:00`);
      if (target > now) {
        next = { ...w, target };
        break;
      }
    }

    if (!next) return;

    const diff = next.target - now;
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);

    countdownEl.textContent =
      `${String(h).padStart(2, "0")}:` +
      `${String(m).padStart(2, "0")}:` +
      `${String(s).padStart(2, "0")}`;

    nextNameEl.textContent = `Menuju ${next.nama}`;
  }, 1000);
  updateActivePrayer(waktu);
}

// ================= GPS =================
function detectLocation() {
  navigator.geolocation.getCurrentPosition(async pos => {
    const lat = pos.coords.latitude;
    const lon = pos.coords.longitude;

    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`
    );
    const data = await res.json();

    const city =
      data.address.city ||
      data.address.county ||
      data.address.state;

    matchCity(city);
  });
}

async function matchCity(city) {
  const res = await fetch("https://api.myquran.com/v2/sholat/kota/semua");
  const data = await res.json();

  const found = data.data.find(k =>
    k.lokasi.toLowerCase().includes(city.toLowerCase())
  );

  if (found) {
    kotaInput.value = found.lokasi;
    loadJadwal(found.id);
  }
}

// ================= AYAT =================
async function loadRandomAyat() {
  const res = await fetch("https://api.myquran.com/v2/quran/ayat/acak");
  const d = await res.json();

  const arti = d.data.ayat.text;
  const nomor = d.data.ayat.ayah;
  const surat = d.data.info.surat.nama.id;

  runningAyatEl.textContent =
    `${arti} (QS. ${surat}: ${nomor})`;

  const panjang = runningAyatEl.textContent.length;
  const durasi = Math.max(25, panjang * 0.4);

  runningAyatEl.style.animation = "none";
  void runningAyatEl.offsetWidth;
  runningAyatEl.style.animation = `scrollText ${durasi}s linear infinite`;
}

// ================= EVENT =================
kotaInput.addEventListener("change", function () {
  const value = this.value;
  const options = kotaList.options;

  for (let i = 0; i < options.length; i++) {
    if (options[i].value === value) {
      loadJadwal(options[i].dataset.id);
      break;
    }
  }
});

function updateActivePrayer(waktuSholat) {
  const items = document.querySelectorAll(".schedule-item");
  const now = new Date();

  const todayStr =
    now.getFullYear() + "-" +
    String(now.getMonth() + 1).padStart(2, "0") + "-" +
    String(now.getDate()).padStart(2, "0");

  items.forEach(item => item.classList.remove("active"));
  document.querySelector(".countdown-box")?.classList.remove("active-time");

  for (let i = 0; i < waktuSholat.length; i++) {
    const start = new Date(`${todayStr}T${waktuSholat[i].jam}:00`);

    const next =
      i < waktuSholat.length - 1
        ? new Date(`${todayStr}T${waktuSholat[i + 1].jam}:00`)
        : null;

    if (now >= start && (!next || now < next)) {
      items[i].classList.add("active");
      document.querySelector(".countdown-box")
        .classList.add("active-time");
      break;
    }
  }
}

// =============================== // LOAD TANGGAL (CE & HIJRI) // =============================== 
function loadTanggal() { 
  fetch("https://api.myquran.com/v3/cal/today?adj=0&tz=Asia%2FJakarta") 
    .then(r => r.json()) 
    .then(res => { 
      if (!res?.data) return; 
      const dhijr = res.data.hijr.day; 
      const mhijr = res.data.hijr.monthName; 
      const yhijr = res.data.hijr.year; 
      const ce = res.data.ce.today; 
      ceDateEl.textContent = ce; 
      hijrDateEl.textContent = ${dhijr} ${mhijr} ${yhijr} H; }) 
    .catch(
      err => console.error("Error load tanggal:", err)); 
}

// ================= INIT =================
loadKota();
loadTanggal();
loadRandomAyat();
setInterval(loadRandomAyat, 60000);
