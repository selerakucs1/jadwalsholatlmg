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

    const makeDate = (jam, addDay = 0) => {
      const d = new Date();
      d.setDate(d.getDate() + addDay);
      const [h, m] = jam.split(":");
      d.setHours(h, m, 0, 0);
      return d;
    };

    // ===== URUTAN WAKTU SHOLAT SEBENARNYA =====
    const waktu = [
      { nama: "Imsak", target: makeDate(currentJadwal.imsak) },
      { nama: "Subuh", target: makeDate(currentJadwal.subuh) },
      { nama: "Terbit", target: makeDate(currentJadwal.terbit) },
      { nama: "Dhuha", target: makeDate(currentJadwal.dhuha) },
      { nama: "Dzuhur", target: makeDate(currentJadwal.dzuhur) },
      { nama: "Ashar", target: makeDate(currentJadwal.ashar) },
      { nama: "Maghrib", target: makeDate(currentJadwal.maghrib) },
      { nama: "Isya", target: makeDate(currentJadwal.isya) }
    ];

    // ===== FIX LINTAS HARI =====
    // Kalau sekarang lewat Isya → tambahkan 1 hari untuk Imsak & Subuh
    if (now > waktu[waktu.length - 1].target) {
      waktu[0].target = makeDate(currentJadwal.imsak, 1);
      waktu[1].target = makeDate(currentJadwal.subuh, 1);
    }

    // ===== CARI NEXT =====
    let next = waktu.find(w => w.target > now);

    if (!next) {
      next = {
        nama: "Imsak",
        target: makeDate(currentJadwal.imsak, 1)
      };
    }

    // ===== COUNTDOWN =====
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

    updateActivePrayer(now, waktu);

  }, 1000);
}

function updateActivePrayer(now, waktu) {
  const items = document.querySelectorAll(".schedule-item");
  items.forEach(i => i.classList.remove("active"));

  const tampil = ["Subuh", "Dzuhur", "Ashar", "Maghrib", "Isya"];

  for (let i = 0; i < waktu.length; i++) {
    const current = waktu[i];
    const next = waktu[i + 1];

    if (next) {
      if (now >= current.target && now < next.target) {
        const index = tampil.indexOf(current.nama);
        if (index !== -1 && items[index]) {
          items[index].classList.add("active");
        }
        return;
      }
    } else {
      // Isya sampai Imsak besok tetap aktif
      if (now >= current.target) {
        const index = tampil.indexOf(current.nama);
        if (index !== -1 && items[index]) {
          items[index].classList.add("active");
        }
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
async function loadTanggal() {
  try {
    const res = await fetch("https://api.myquran.com/v3/cal/today?adj=0&tz=Asia%2FJakarta");
    const data = await res.json();

    if (!data?.data?.hijr || !data?.data?.ce) {
      ceDateEl.textContent = "-";
      hijrDateEl.textContent = "-";
      return;
    }

    // Gunakan field 'today' langsung supaya sesuai API
    ceDateEl.textContent = data.data.ce.today ?? "-";
    hijrDateEl.textContent = data.data.hijr.today ?? "-";

  } catch (err) {
    console.error("Error load tanggal:", err);
    ceDateEl.textContent = "-";
    hijrDateEl.textContent = "-";
  }
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

// ================= GPS =================
async function detectLocation() {
  if (!navigator.geolocation) return showToast("Geolokasi tidak didukung browser", "error");

  navigator.geolocation.getCurrentPosition(async (pos) => {
    const lat = pos.coords.latitude;
    const lon = pos.coords.longitude;

    try {
      const resGeo = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`,
        { headers: { "User-Agent": "AplikasiSholat/1.0", "Accept-Language": "id" } }
      );
      const geoData = await resGeo.json();

      const cityName =
        geoData.address.city ||
        geoData.address.town ||
        geoData.address.county ||
        geoData.address.village;

      if (!cityName) return showToast("Gagal mendeteksi kota", "error");

      const resKota = await fetch("https://api.myquran.com/v2/sholat/kota/semua");
      const kotaListData = await resKota.json();

      let match = kotaListData.data.find(k => k.lokasi.toLowerCase().includes(cityName.toLowerCase()));

      if (!match) {
        match = kotaListData.data.find(k => cityName.toLowerCase().includes(k.lokasi.toLowerCase()));
      }

      if (match) {
        kotaInput.value = match.lokasi;
        loadJadwal(match.id);
        showToast(`Lokasi terdeteksi: ${match.lokasi}`, "success");
      } else {
        showToast("Kota tidak ditemukan di database MyQuran", "info");
      }

    } catch (err) {
      console.error(err);
      showToast("Gagal memproses lokasi GPS, menggunakan kota default", "error");
      kotaInput.value = "Kab. Lamongan";
      loadJadwal("1610");
    }

  }, (err) => {
    console.error(err);
    showToast("Gagal mendapatkan koordinat GPS", "error");
  });
}

function showToast(message, type = "info", duration = 3000) {
  const toast = document.getElementById("toast");
  toast.textContent = message;

  toast.className = "toast show " + type;

  setTimeout(() => {
    toast.className = "toast";
  }, duration);
}

// ================= INIT =================
loadTanggal().then(() => loadKota());
loadRandomAyat();
setInterval(loadRandomAyat, 60000);
