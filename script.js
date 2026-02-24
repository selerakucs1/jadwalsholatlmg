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
  Ashar: "bi-sunset",
  Maghrib: "bi-cloud-sun",
  Isya: "bi-moon-stars"
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
  if (!currentJadwal) return;

  const now = new Date();
  const isFriday = now.getDay() === 5;

  const list = [
    { nama: "Subuh", jam: currentJadwal.subuh },
    { nama: isFriday ? "Dzuhur" : "Dzuhur", jam: currentJadwal.dzuhur },
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

// ================= COUNTDOWN + HIGHLIGHT (FIX LINTAS HARI) =================
function startCountdown() {
  if (countdownInterval) clearInterval(countdownInterval);

  countdownInterval = setInterval(() => {
    if (!currentJadwal) return;

    const now = new Date();

    const todayStr =
      now.getFullYear() + "-" +
      String(now.getMonth() + 1).padStart(2, "0") + "-" +
      String(now.getDate()).padStart(2, "0");

    const tomorrow = new Date(now);
    tomorrow.setDate(now.getDate() + 1);

    const tomorrowStr =
      tomorrow.getFullYear() + "-" +
      String(tomorrow.getMonth() + 1).padStart(2, "0") + "-" +
      String(tomorrow.getDate()).padStart(2, "0");

    const waktu = [
      { nama: "Imsak", jam: currentJadwal.imsak },
      { nama: "Subuh", jam: currentJadwal.subuh },
      { nama: "Terbit", jam: currentJadwal.terbit },
      { nama: "Dhuha", jam: currentJadwal.dhuha },
      { nama: "Dzuhur", jam: currentJadwal.dzuhur },
      { nama: "Ashar", jam: currentJadwal.ashar },
      { nama: "Maghrib", jam: currentJadwal.maghrib },
      { nama: "Isya", jam: currentJadwal.isya }
    ];

    let jadwalDenganTanggal = [];

    waktu.forEach((w, i) => {
      let target = new Date(`${todayStr}T${w.jam}:00`);

      // Jika sudah lewat semua waktu dan ini Subuh, jadikan besok
      if (w.nama === "Subuh" && now > target) {
        target = new Date(`${tomorrowStr}T${w.jam}:00`);
      }

      jadwalDenganTanggal.push({
        ...w,
        target
      });
    });

    // Urutkan berdasarkan waktu target
    jadwalDenganTanggal.sort((a, b) => a.target - b.target);

    // ================= CARI NEXT =================
    let next = jadwalDenganTanggal.find(j => j.target > now);

    if (!next) {
      // fallback aman (tidak minus)
      next = jadwalDenganTanggal[0];
    }

    // ================= COUNTDOWN =================
    let diff = next.target - now;
    if (diff < 0) diff = 0;

    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);

    countdownEl.textContent =
      `${String(h).padStart(2, "0")}:` +
      `${String(m).padStart(2, "0")}:` +
      `${String(s).padStart(2, "0")}`;

    nextNameEl.textContent = `Menuju ${next.nama}`;

    // ================= HIGHLIGHT =================
    updateActiveByTime(now, jadwalDenganTanggal);

  }, 1000);
}

function updateActiveByTime(now, jadwal) {
  const items = document.querySelectorAll(".schedule-item");
  items.forEach(item => item.classList.remove("active"));

  for (let i = 0; i < jadwal.length; i++) {

    const current = jadwal[i];
    const next = jadwal[i + 1];

    if (next) {
      if (now >= current.target && now < next.target) {
        if (items[i]) items[i].classList.add("active");
        return;
      }
    } else {
      // Ini adalah Isya terakhir
      if (now >= current.target) {
        if (items[i]) items[i].classList.add("active");
        return;
      }
    }
  }
}

// ================= AYAT =================
async function loadRandomAyat() {
  try {
    const res = await fetch("https://api.myquran.com/v2/quran/ayat/acak");
    const d = await res.json();

    const arti = d.data.ayat.text.trim();
    const nomor = d.data.ayat.ayah;
    const surat = d.data.info.surat.nama.id;

    // Tambah spasi di awal & akhir biar loop mulus
    const teks = `  ${arti} — (QS. ${surat}:${nomor})  `;
    const panjang = teks.length;
    const durasi = Math.max(14, Math.min(38, panjang * 0.20));  
    runningAyatEl.textContent = teks;
    runningAyatEl.style.animation = "none";
    runningAyatEl.offsetHeight;
    runningAyatEl.style.animation = `scrollText ${durasi}s linear infinite`;

  } catch (err) {
    console.error("Gagal load ayat:", err);
    runningAyatEl.textContent = "Gagal memuat ayat...";
  }
}

// ================= LOAD TANGGAL =================
function loadTanggal() {
  fetch("https://api.myquran.com/v3/cal/today?adj=0&tz=Asia%2FJakarta")
    .then(r => r.json())
    .then(res => {
      if (!res?.data?.hijr || !res?.data?.ce) return;

      const { day, monthName, year } = res.data.hijr;
      const ce = res.data.ce.today;

      ceDateEl.textContent = ce ?? "-";
      hijrDateEl.textContent = `${day} ${monthName} ${year} H`;
    })
    .catch(err => {
      console.error("Error load tanggal:", err);
    });
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

// ================= INIT =================
loadKota();
loadTanggal();
loadRandomAyat();
setInterval(loadRandomAyat, 60000);
