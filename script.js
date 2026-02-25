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
let kotaId = "0266e33d3f546cb5436a10798e657d97";
let cacheKey = "jadwal_" + kotaId;

// Simpan cache default jika belum ada
if (!localStorage.getItem(cacheKey)) {
  localStorage.setItem(cacheKey, JSON.stringify({ id: kotaId, lokasi: "Kab. Lamongan" }));
}

const icons = {
  Subuh: "bi-moon",
  Dzuhur: "bi-sun",
  Ashar: "bi-sunset",
  Maghrib: "bi-cloud-sun",
  Isya: "bi-moon-stars"
};

// ================= LOAD KOTA =================
async function loadKota() {
  try {
    const res = await fetch("https://api.myquran.com/v3/sholat/kota/semua");
    const data = await res.json();

    kotaList.innerHTML = "";
    data.data.forEach(kota => {
      const option = document.createElement("option");
      option.value = kota.lokasi;
      option.dataset.id = kota.id;
      kotaList.appendChild(option);
    });

    // Pakai cache jika ada
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      const c = JSON.parse(cached);
      kotaInput.value = c.lokasi;
      loadJadwal(c.id);
    } else {
      kotaInput.value = "Kab. Lamongan";
      loadJadwal(kotaId);
    }
  } catch (err) {
    console.error(err);
    showToast("Gagal load kota, pakai default", "error");
    kotaInput.value = "Kab. Lamongan";
    loadJadwal(kotaId);
  }
}

// ================= LOAD JADWAL =================
async function loadJadwal(id) {
  try {
    const now = new Date();
    const tahun = now.getFullYear();
    const bulan = String(now.getMonth() + 1).padStart(2, "0");
    const tanggal = String(now.getDate()).padStart(2, "0");
    const todayKey = `${tahun}-${bulan}-${tanggal}`;

    const res = await fetch(
      `https://api.myquran.com/v3/sholat/jadwal/${id}/${todayKey}`
    );
    const data = await res.json();
    currentJadwal = data.data.jadwal[todayKey];

    renderJadwal();
    startCountdown();
  } catch (err) {
    console.error(err);
    showToast("Gagal load jadwal, pakai default", "error");
  }
}

// ================= RENDER JADWAL =================
function renderJadwal() {
  if (!currentJadwal) return;

  const now = new Date();
  const isFriday = now.getDay() === 5;

  const list = [
    { nama: "Subuh", jam: currentJadwal.subuh },
    { nama: "Dzuhur", jam: currentJadwal.dzuhur },
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
    if (!currentJadwal) return;

    const now = new Date();

    const makeDate = (jam, addDay = 0) => {
      const d = new Date();
      d.setDate(d.getDate() + addDay);
      const [h, m] = jam.split(":");
      d.setHours(h, m, 0, 0);
      return d;
    };

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

    if (now > waktu[waktu.length - 1].target) {
      waktu[0].target = makeDate(currentJadwal.imsak, 1);
      waktu[1].target = makeDate(currentJadwal.subuh, 1);
    }

    let next = waktu.find(w => w.target > now);
    if (!next) next = { nama: "Imsak", target: makeDate(currentJadwal.imsak, 1) };

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

// ================= HIGHLIGHT =================
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
        if (index !== -1 && items[index]) items[index].classList.add("active");
        return;
      }
    } else {
      if (now >= current.target) {
        const index = tampil.indexOf(current.nama);
        if (index !== -1 && items[index]) items[index].classList.add("active");
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

    const teks = `  ${arti} — (QS. ${surat}:${nomor})  `;
    const panjang = teks.length;
    const durasi = Math.max(14, Math.min(38, panjang * 0.2));

    runningAyatEl.textContent = teks;
    runningAyatEl.style.animation = "none";
    runningAyatEl.offsetHeight;
    runningAyatEl.style.animation = `scrollText ${durasi}s linear infinite`;
  } catch (err) {
    console.error("Gagal load ayat:", err);
    runningAyatEl.textContent = "Gagal memuat ayat...";
  }
}

// ================= TANGGAL =================
async function loadTanggal() {
  try {
    const res = await fetch("https://api.myquran.com/v3/cal/today?adj=0&tz=Asia%2FJakarta");
    const data = await res.json();

    ceDateEl.textContent = data?.data?.ce?.today ? `${data.data.ce.today} M` : "-";
    hijrDateEl.textContent = data?.data?.hijr?.day ? `${data.data.hijr.day} ${data.data.hijr.monthName} ${data.data.hijr.year} H` : "-";
  } catch (err) {
    console.error(err);
    ceDateEl.textContent = "-";
    hijrDateEl.textContent = "-";
  }
}

// ================= EVENT KOTA =================
kotaInput.addEventListener("change", function () {
  const value = this.value;
  const options = kotaList.options;
  for (let i = 0; i < options.length; i++) {
    if (options[i].value === value) {
      const id = options[i].dataset.id;
      loadJadwal(id);
      cacheKey = "jadwal_" + id;
      localStorage.setItem(cacheKey, JSON.stringify({ id, lokasi: value }));
      break;
    }
  }
});

// ================= GPS =================
async function detectLocation() {
  const cached = localStorage.getItem(cacheKey);
  if (cached) {
    const data = JSON.parse(cached);
    kotaInput.value = data.lokasi;
    loadJadwal(data.id);
    return;
  }

  if (!navigator.geolocation) {
    showToast("Geolokasi tidak didukung browser", "error");
    kotaInput.value = "Kab. Lamongan";
    loadJadwal(kotaId);
    return;
  }

  navigator.geolocation.getCurrentPosition(async (pos) => {
    const lat = pos.coords.latitude;
    const lon = pos.coords.longitude;

    try {
      const resGeo = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`);
      const geoData = await resGeo.json();

      const cityName = geoData.address.city || geoData.address.town || geoData.address.county || geoData.address.village;
      if (!cityName) throw new Error("Kota tidak terdeteksi");

      const resKota = await fetch("https://api.myquran.com/v3/sholat/kota/semua");
      const kotaListData = await resKota.json();

      let match = kotaListData.data.find(k => k.lokasi.toLowerCase().includes(cityName.toLowerCase())) ||
                  kotaListData.data.find(k => cityName.toLowerCase().includes(k.lokasi.toLowerCase()));

      if (match) {
        kotaInput.value = match.lokasi;
        loadJadwal(match.id);
        cacheKey = "jadwal_" + match.id;
        localStorage.setItem(cacheKey, JSON.stringify({ id: match.id, lokasi: match.lokasi }));
        showToast(`Lokasi terdeteksi: ${match.lokasi}`, "success");
      } else {
        throw new Error("Kota tidak ada di database MyQuran");
      }

    } catch (err) {
      console.error(err);
      showToast("Gagal memproses lokasi GPS, pakai kota default", "error");
      kotaInput.value = "Kab. Lamongan";
      loadJadwal(kotaId);
      localStorage.setItem(cacheKey, JSON.stringify({ id: kotaId, lokasi: "Kab. Lamongan" }));
    }

  }, (err) => {
    console.error(err);
    showToast("Gagal mendapatkan koordinat GPS, pakai kota default", "error");
    kotaInput.value = "Kab. Lamongan";
    loadJadwal(kotaId);
    localStorage.setItem(cacheKey, JSON.stringify({ id: kotaId, lokasi: "Kab. Lamongan" }));
  });
}

// ================= TOAST =================
function showToast(message, type = "info", duration = 3000) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.className = "toast show " + type;
  setTimeout(() => toast.className = "toast", duration);
}

// ================= INIT =================
loadTanggal().then(() => loadKota());
loadRandomAyat();
setInterval(loadRandomAyat, 60000);
detectLocation();
