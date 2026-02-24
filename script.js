// ===============================
// ELEMENT
// ===============================
const kotaSelect = document.getElementById("kotaSelect");
const kotaFilter = document.getElementById("kotaFilter");
const jadwalList = document.getElementById("jadwalList");
const countdownEl = document.getElementById("countdown");
const nextNameEl = document.getElementById("nextName");
const ceDateEl = document.getElementById("ceDate");
const hijrDateEl = document.getElementById("hijrDate");
const runningAyatEl = document.getElementById("runningAyat");
// ===============================
// ICON SHOLAT
// ===============================
const jadwalIcons = {
  "Subuh": "bi-moon",
  "Terbit": "bi-sunrise",
  "Dhuha": "bi-brightness-high",
  "Dzuhur": "bi-sun",             // ikon hari biasa
  "Jumat": "bi-journal-bookmark", // ikon Jumat
  "Ashar": "bi-sunset",
  "Maghrib": "bi-cloud-sun",
  "Isya": "bi-moon-stars"
};

let currentJadwal = null;
let countdownInterval = null;


// ===============================
// LOAD DAFTAR KOTA
// ===============================
async function loadKota() {
  try {
    const res = await fetch("https://api.myquran.com/v2/sholat/kota/semua");
    const data = await res.json();

    kotaSelect.innerHTML = "";

    data.data.forEach(kota => {
      const option = document.createElement("option");
      option.value = kota.id;
      option.textContent = kota.lokasi;
      kotaSelect.appendChild(option);
    });

    // Default Kab Lamongan (1610)
    kotaSelect.value = "1610";
    loadJadwal("1610");

  } catch (err) {
    console.error("Gagal load kota:", err);
  }
}


// ===============================
// FILTER KOTA
// ===============================
kotaFilter.addEventListener("input", function () {
  const keyword = this.value.toLowerCase();
  const options = kotaSelect.options;

  for (let i = 0; i < options.length; i++) {
    const text = options[i].text.toLowerCase();
    options[i].style.display = text.includes(keyword) ? "" : "none";
  }
});


// ===============================
// LOAD JADWAL SHOLAT
// ===============================
async function loadJadwal(kotaID) {
  try {
    const today = new Date();
    const tahun = today.getFullYear();
    const bulan = String(today.getMonth() + 1).padStart(2, "0");
    const tanggal = String(today.getDate()).padStart(2, "0");

    const url = `https://api.myquran.com/v2/sholat/jadwal/${kotaID}/${tahun}/${bulan}/${tanggal}`;
    const res = await fetch(url);
    const data = await res.json();

    currentJadwal = data.data.jadwal;

    ceDateEl.textContent = currentJadwal.tanggal;
    hijrDateEl.textContent = currentJadwal.hijriah;

    renderJadwal(currentJadwal);
    startCountdown();

  } catch (err) {
    console.error("Gagal load jadwal:", err);
  }
}


// ===============================
// RENDER JADWAL
// ===============================
function renderJadwal(jadwal) {

  const today = new Date();
  const isFriday = today.getDay() === 5; // 5 = Jumat

  const waktuSholat = [
    { nama: "Subuh", jam: jadwal.subuh },
    { nama: isFriday ? "Jumat" : "Dzuhur", jam: jadwal.dzuhur },
    { nama: "Ashar", jam: jadwal.ashar },
    { nama: "Maghrib", jam: jadwal.maghrib },
    { nama: "Isya", jam: jadwal.isya }
  ];

  jadwalList.innerHTML = "";

  waktuSholat.forEach(waktu => {

    const iconClass = jadwalIcons[waktu.nama] || "bi-clock";

    const div = document.createElement("div");
    div.className = "schedule-item";

    div.innerHTML = `
      <span>
        <i class="bi ${iconClass} me-2"></i>
        ${waktu.nama}
      </span>
      <span>${waktu.jam}</span>
    `;

    jadwalList.appendChild(div);
  });
}
// ===============================
// COUNTDOWN
// ===============================
function startCountdown() {
  if (!currentJadwal) return;

  if (countdownInterval) clearInterval(countdownInterval);

  countdownInterval = setInterval(() => {

    const now = new Date();
    const todayStr = now.toISOString().split("T")[0];

    const waktuSholat = [
      { nama: "Subuh", jam: currentJadwal.subuh },
      { nama: "Terbit", jam: currentJadwal.terbit},
      { nama: "Dhuha", jam: currentJadwal.dhuha},
      { nama: "Dzuhur", jam: currentJadwal.dzuhur },
      { nama: "Ashar", jam: currentJadwal.ashar },
      { nama: "Maghrib", jam: currentJadwal.maghrib },
      { nama: "Isya", jam: currentJadwal.isya }
    ];

    let nextWaktu = null;

    for (let waktu of waktuSholat) {
      const target = new Date(`${todayStr}T${waktu.jam}:00`);
      if (target > now) {
        nextWaktu = { ...waktu, target };
        break;
      }
    }

    if (!nextWaktu) {
      nextNameEl.textContent = "Menunggu Subuh Besok";
      countdownEl.textContent = "--:--:--";
      return;
    }

    const diff = nextWaktu.target - now;

    const jam = Math.floor(diff / 1000 / 60 / 60);
    const menit = Math.floor((diff / 1000 / 60) % 60);
    const detik = Math.floor((diff / 1000) % 60);

    countdownEl.textContent =
      `${String(jam).padStart(2, "0")}:` +
      `${String(menit).padStart(2, "0")}:` +
      `${String(detik).padStart(2, "0")}`;

    nextNameEl.textContent = `Menuju ${nextWaktu.nama}`;

    highlightActive(waktuSholat);

  }, 1000);
}


// ===============================
// HIGHLIGHT WAKTU AKTIF
// ===============================
function highlightActive(waktuSholat) {
  const items = document.querySelectorAll(".schedule-item");
  const now = new Date();
  const todayStr = now.toISOString().split("T")[0];

  items.forEach(item => item.classList.remove("active"));

  for (let i = 0; i < waktuSholat.length; i++) {
    const target = new Date(`${todayStr}T${waktuSholat[i].jam}:00`);
    if (target > now) {
      items[i].classList.add("active");
      break;
    }
  }
}

// ===============================
// LOAD RANDOM AYAT
// ===============================
async function loadRandomAyat() {
  try {
    const res = await fetch("https://api.myquran.com/v2/quran/ayat/acak");
    const d = await res.json();

    console.log("RESP AYAT:", d);

    if (!d?.data?.ayat) return;

    //const ayatArab = d.data.ayat.arab || "";
    const arti = d.data.ayat.text || "";
    const nomor = d.data.ayat.ayah || "";
    const surat = d.data?.info?.surat?.nama?.id ?? "Tidak diketahui";

    const ele = document.getElementById("runningAyat");

    ele.textContent =
      `${arti} (QS. ${surat}: ${nomor})`;

    const panjang = ele.textContent.length;
    const durasi = Math.max(20, panjang * 0.3); 

    ele.style.animation = "none";
    void ele.offsetWidth;
    ele.style.animation = `scrollText ${durasi}s linear infinite`;

  } catch (e) {
    console.error("Gagal ambil ayat:", e);
  }
}

// ===============================
// EVENT LISTENER
// ===============================
kotaSelect.addEventListener("change", function () {
  this.size = 0;
  kotaFilter.value = this.options[this.selectedIndex].text;
  loadJadwal(this.value);
});

kotaFilter.addEventListener("input", function () {
  const keyword = this.value.toLowerCase();
  const options = kotaSelect.options;
  let visibleCount = 0;

  for (let i = 0; i < options.length; i++) {
    const text = options[i].text.toLowerCase();
    const match = text.includes(keyword);
    options[i].style.display = match ? "" : "none";
    if (match) visibleCount++;
  }

  // Buka dropdown seperti list
  if (visibleCount > 0) {
    kotaSelect.size = Math.min(8, visibleCount); // max 8 item tampil
    kotaSelect.style.display = "block";
  } else {
    kotaSelect.size = 0;
  }
});

// ===============================
// LOAD TANGGAL (CE & HIJRI)
// ===============================
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
      hijrDateEl.textContent = `${dhijr} ${mhijr} ${yhijr} H`;
    })
    .catch(err => console.error("Error load tanggal:", err));
}

// ===============================
// REGISTER SERVICE WORKER (PWA)
// ===============================
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/service-worker.js")
      .then(reg => console.log("Service Worker registered"))
      .catch(err => console.log("SW failed", err));
  });
}

// ===============================
// INIT
// ===============================
loadKota();
loadTanggal();
loadRandomAyat();
setInterval(loadRandomAyat, 60000);
