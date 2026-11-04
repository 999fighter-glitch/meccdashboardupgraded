# MECC Management Board

Sistem Pemantauan & Kesiapsiagaan Ambulans Bersepadu bagi semua wilayah terlibat: **Klang, Banting, Shah Alam & HASA**.

Dibina menggunakan **React 19**, **Vite**, **Tailwind CSS**, dan **TypeScript**. Sistem ini beroperasi 100% pada pelayar web (client-side) dengan simpanan data automatik di `localStorage`.

---

## 🚀 Panduan Muat Naik ke GitHub & Deploy ke GitHub Pages

Aplikasi ini telah dikonfigurasi khusus dengan:
- Path relatif (`base: './'`) dalam `vite.config.ts` untuk memastikan semua skrip dan gaya CSS dimuatkan dengan sempurna di GitHub Pages.
- Aliran kerja automatik GitHub Actions di `.github/workflows/deploy.yml`.
- Sokongan `public/404.html` untuk memastikannya tidak ralat apabila halaman dimuat semula.

### Langkah 1: Inisialisasi Git & Push ke GitHub

Buka terminal pada folder projek ini dan jalankan arahan berikut:

```bash
# 1. Inisialisasi git (jika belum dibuat)
git init

# 2. Tambah kesemua fail projek
git add .

# 3. Buat commit pertama
git commit -m "feat: MECC Management Board ready for GitHub Pages"

# 4. Tetapkan branch utama kepada 'main'
git branch -M main

# 5. Sambungkan ke repositori GitHub anda (gantikan <username> dan <repo-name>)
git remote add origin https://github.com/<username>/<repo-name>.git

# 6. Tolak kod ke GitHub
git push -u origin main
```

---

### Langkah 2: Aktifkan GitHub Pages di Repositori GitHub

1. Pergi ke halaman repositori anda di **GitHub**.
2. Klik tab **Settings** (di bahagian atas kanan repositori).
3. Di menu sebelah kiri, pilih **Pages** (di bawah seksyen *Code and automation*).
4. Di bawah **Build and deployment**:
   - **Source**: Pilih **GitHub Actions**.
5. Selesai! GitHub Actions akan secara automatik menjalankan workflow `deploy.yml`, membina aplikasi (`npm run build`), dan menerbitkannya ke GitHub Pages.
6. Pautan laman web anda akan dipaparkan di bahagian atas halaman Settings Pages (contohnya: `https://<username>.github.io/<repo-name>/`).

---

## 🛠️ Arahan Pembangunan Tempatan (Local Development)

```bash
# Pasang kebergantungan (dependencies)
npm install

# Jalankan pelayan pembangunan tempatan
npm run dev

# Bina untuk pengeluaran (production build)
npm run build

# Pratonton hasil binaan pengeluaran
npm run preview
```

---

## 📋 Ciri-Ciri Utama Sistem

- **MECC Management Board:** Paparan status kesiapsiagaan seluruh kontinjen ambulans (Klang, Banting, Shah Alam, HASA).
- **POZ Updater:** Pengemaskinian pantas kontinjen Wilayah Klang / POZ HTAR.
- **MECC Status Board:** Penjanaan format teks WhatsApp automatik bagi pertukaran syif (AM, PM, ON).
- **Direktori Responder:** Pangkalan data anggota bertugas, pemandu, dan pegawai perubatan.
- **Sandaran & Pulihkan Data:** Eksport dan import fail JSON secara terus tanpa memerlukan pelayan luaran.
