# Speed Test PCPM — Latihan Darrell

Aplikasi lokal tanpa framework dan tanpa paket tambahan. Semua aset tersedia di folder proyek; tidak menggunakan CDN atau koneksi internet saat latihan.

## Jalankan di Windows / VS Code

1. Ekstrak ZIP ini.
2. Di VS Code pilih **File → Open Folder**, lalu buka folder `pcpm-speed-test` yang berisi `package.json`.
3. Pastikan Node.js sudah terpasang (versi 18 atau lebih baru). Cek dengan `node --version`.
4. Buka **Terminal → New Terminal** dan jalankan:

   ```sh
   npm start
   ```

5. Buka **http://localhost:5173** di Chrome atau Edge.
6. Tekan **Ctrl+C** di terminal untuk menghentikan server.

Tidak perlu menjalankan `npm install`. Jika PowerShell memblokir `npm.ps1`, gunakan `npm.cmd start` atau pilih terminal Command Prompt.

### Alternatif: Live Server

Jika Anda memakai ekstensi **Live Server** di VS Code, klik kanan `dist/index.html` → **Open with Live Server**. Jangan membuka HTML dengan klik dua kali melalui `file://`, karena aplikasi memakai JavaScript modules.

### Jika port sedang dipakai

Tutup server sebelumnya, atau jalankan di PowerShell:

```powershell
$env:PORT=5174
node server.mjs
```

Lalu buka `http://localhost:5174`.

## Aturan latihan

| Model | Tugas | Jumlah | Durasi |
| --- | --- | --- | --- |
| 1: Angka hilang | Cari satu angka 0–9 yang tidak ada dalam deret 9 angka unik | 250 | 7 menit 30 detik |
| 2: Huruf kembar | Cari huruf yang muncul tepat dua kali dalam deret 10 huruf | 250 | 7 menit 30 detik |

Jumlah dan durasi mengikuti dua PDF bahan belajar yang Anda berikan. Kerjakan kedua model secara berurutan untuk latihan total 500 soal / 15 menit; pemilihan model dilakukan dari menu utama.

Soal dibuat secara acak dengan pola yang sama, bukan salinan bank soal PDF. Ini latihan mandiri dan bukan aplikasi resmi EXPERD/Bank Indonesia. Tampilan mengikuti gaya asesmen biru-putih dan contoh HTML yang diberikan, bukan replika terverifikasi dari aplikasi tes sebenarnya. Ikuti instruksi penyelenggara pada hari tes.

## Cara menjawab

- **Langsung lanjut** (default): ketik satu angka/huruf atau klik tombol di layar. Jawaban segera terkirim dan soal berganti.
- **Ketik lalu Enter**: ketik satu angka/huruf, lalu tekan Enter. Jawaban dapat diganti sebelum dikirim; Backspace atau Hapus mengosongkan jawaban.
- Huruf kecil dan huruf besar sama-sama diterima.
- Tombol yang ditahan tidak mengirim jawaban berulang. Klik ganda sangat cepat pada keyboard layar juga diabaikan pada mode langsung.
- Tidak ada umpan balik benar/salah selama latihan. Jawaban yang sudah terkirim tidak dapat dikoreksi dan tidak tersedia tombol lewati.
- Timer mulai saat tombol Mulai latihan ditekan, berjalan tanpa jeda dan tetap berjalan saat tab berpindah atau dialog konfirmasi terbuka.
- Saat waktu habis, hanya jawaban yang sudah dikirim yang dihitung. Jawaban yang belum dikonfirmasi di mode Enter tidak dihitung.
- Mengakhiri latihan menampilkan hasil; memuat ulang/menutup halaman membuang sesi. Tidak ada penyimpanan riwayat sesi.

## Hasil

- Benar, salah, belum dijawab, dan total dijawab.
- Akurasi = benar / jumlah yang dijawab × 100%; jika belum menjawab, akurasi ditampilkan 0%.
- Kecepatan = jumlah dijawab / waktu terpakai dalam menit.
- Rata-rata per jawaban menghitung waktu sampai setiap jawaban dikirim; waktu setelah jawaban terakhir tidak masuk rata-rata tersebut.
- Pembahasan menampilkan deret, jawaban Anda, kunci, dan status. Pilih semua soal atau hanya salah/belum dijawab.
- Angka pada hasil latihan tidak mewakili ambang kelulusan resmi.

## Struktur proyek

```text
pcpm-speed-test/
  dist/
    index.html
    styles.css
    app.js
    engine.js
    favicon.svg
  test/engine.test.js
  package.json
  server.mjs
  README.md
```

Uji logika generator, deadline, dan perhitungan hasil: `npm test`.

Seluruh pemrosesan berlangsung di browser Anda. Server bawaan hanya menyajikan aset dan mendengarkan koneksi lokal (127.0.0.1).

## E-VM, E-PM, E-LI (v1.1)

Buka menu **E-VM / E-PM / E-LI**, atau `/inventory.html`.

| Subtes | Paket 1 | Paket 2 | Total |
| --- | ---: | ---: | ---: |
| E-VM | 30 | 30 | 60 |
| E-PM | 50 | 25 | 75 |
| E-LI | 50 | 25 | 75 |
| Total | 130 | 80 | 210 |

Seluruh 210 soal, 210 jawaban referensi dan 210 pembahasan diekstrak dari keenam PDF yang diunggah. Seluruh 375 uraian pilihan skala E-PM (75 × 5) disimpan. Opsi A–E dipertahankan sesuai urutan PDF. Soal mirip atau berulang antar-paket tetap dipertahankan.

Pilih satu paket atau gabungan kedua paket pada subtes yang sama. Tiap soal memiliki ID unik, nomor asli, nama PDF, halaman soal dan halaman pembahasan. Tidak ditambahkan batas waktu karena durasi tiga subtes tersebut tidak tercantum dalam PDF. Waktu terpakai dicatat.

Jawaban dapat diubah dan nomor soal dapat dikunjungi kembali sebelum selesai. Setelah sesi selesai, jawaban dikunci; hasil menampilkan jawaban sendiri, jawaban rujukan, dan pembahasan. Filter hasil mencakup semua soal, sesuai rujukan, atau berbeda/belum dijawab.

### Arti evaluasi

- **E-VM / E-LI**: benar/salah menurut kunci bahan latihan PDF. Materi tersebut bukan kunci resmi EXPERD/Bank Indonesia. Pembahasan sumber menjelaskan opsi kunci; tidak dibuat-buat alasan untuk setiap opsi lain yang tidak dijelaskan oleh PDF. Semua pilihan A–E dapat dilihat kembali di pembahasan.
- **E-PM**: sesuai/berbeda dari referensi PDF, bukan kepribadian benar/salah. Uraian untuk jawaban sendiri dan jawaban referensi ditampilkan. Seluruh uraian 1–5 tersedia. Tetap isi inventori kepribadian sesuai diri sendiri. Uraian dalam bahan belajar tidak dijadikan diagnosis atau hasil psikometri resmi.
- Belum dijawab dihitung terpisah dari respons yang berbeda. Persentase kecocokan menggunakan jumlah yang sudah dijawab sebagai penyebut, dengan 0% jika belum ada jawaban.

Bank soal dan kunci tersimpan dalam `dist/inventory-data.js`. Karena latihan berjalan di browser, data kunci secara teknis dapat dibaca dari source code. Antarmuka baru menampilkan pembahasan sesudah selesai.

### Audit ekstraksi

`extraction-audit.json` mencatat jumlah soal, kunci, pembahasan, pilihan dan uraian skala per PDF. Pemeriksaan kedua menggunakan pembaca PDF berbeda memverifikasi 1.395 fragmen teks (soal, pilihan, pembahasan/uraian skala) dan mencocokkan 210 kunci. Normalisasi hanya mencakup spasi/baris dan tanda hubung terpisah hasil ekstraksi; makna materi tidak diganti. Ejaan yang sudah ada dalam sumber dapat tetap muncul. Hash SHA-256 tiap PDF asal tersimpan di bank soal.

Sepuluh pemeriksaan otomatis (`npm test`) mencakup E-ST dan bank soal baru, navigasi, perubahan jawaban, jawaban invalid, perhitungan hasil, serta seluruh paket yang diselesaikan. Pengujian browser visual belum dilakukan di lingkungan pembuatan.

### Memperbarui repository

Ekstrak isi paket pembaruan ke folder repository Anda, sehingga `dist`, `test`, `package.json`, dan `vercel.json` berada langsung di root repository. Pertahankan folder `.git` yang sudah ada. Jalankan:

```powershell
npm.cmd test
git status
git add dist test package.json README.md extraction-audit.json
git commit -m "Add complete EVM EPM ELI practice sets and PDF explanations"
git push origin main
```

Jika repository sudah terhubung dengan Vercel, push ke cabang produksi akan memicu deployment sesuai pengaturan proyek Anda. `vercel.json` tetap memakai output `dist`.
