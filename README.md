# 🕌 Jadwal Sholat Web App

Aplikasi Web Jadwal Sholat Digital berbasis API publik dari:

- https://api.myquran.com  
- https://bimasislam.kemenag.go.id  


## 🌐 API Yang Digunakan

| Endpoint | Fungsi |
|----------|--------|
| [api.myquran.com/v2/sholat/kota/semua](https://api.myquran.com/v2/sholat/kota/semua) | Daftar kota |
| [api.myquran.com/v2/sholat/jadwal](https://api.myquran.com/v2/sholat/jadwal) | Jadwal harian |
| [api.myquran.com/v2/quran/ayat/acak](https://api.myquran.com/v2/quran/ayat/acak) | Ayat acak |
| [api.myquran.com/v3/cal/today](https://api.myquran.com/v3/cal/today) | Tanggal Hijriah |
---

## ✨ Fitur

- ✅ Pilih kota (autocomplete)
- ✅ Deteksi lokasi (geolocation)
- ✅ Countdown menuju waktu sholat berikutnya
- ✅ Highlight waktu aktif (lintas hari aman)
- ✅ Support Imsak
- ✅ Tanggal Masehi & Hijriah otomatis
- ✅ Running ayat Al-Qur’an acak (auto refresh)
- ✅ Dark mode modern UI
- ✅ Progressive Web App (Installable)

---

## 📂 Struktur Project
<pre>jadwal-sholat/ 
  │ 
  ├── index.html 
  ├── style.css 
  ├── script.js 
  ├── manifest.json 
  ├── waktu_192.png 
  └── README.md 
  </pre>

---

## 🚀 Cara Menjalankan

### Clone Repository

```
git clone https://github.com/USERNAME/jadwal-sholat.git
cd jadwalsholatlmg
index.html
```

## 🎨 Tampilan

- Dark modern glass effect
- Highlight otomatis waktu aktif
- Countdown real-time
- Responsive (Mobile & Desktop)

## 📱 PWA Support

Aplikasi dapat di-install seperti aplikasi Android/iOS melalui browser karena sudah mendukung:
- manifest.json
- theme-color
- standalone display mode

## 🛡️ Catatan

- Tidak menggunakan backend
- Tidak menyimpan data pengguna
- Bergantung pada API publik
- Cocok untuk hosting gratis (GitHub Pages, Netlify, Vercel)

## 👨‍💻 Author
Fabio Karnovaro
© 2026
