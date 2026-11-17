# Daily Logbook IT Support

Aplikasi web sederhana untuk mencatat aktivitas harian, penanganan kendala, dan penyelesaian pekerjaan IT Support.

## Fitur

- Header dokumen dengan identitas dan informasi dokumen.
- Form identitas petugas, departemen/unit, periode laporan, dan lokasi kerja.
- Pencatatan aktivitas berdasarkan tanggal dan Ticket ID.
- Kategori pekerjaan seperti hardware, software, jaringan, printer, instalasi, dan maintenance.
- Informasi prioritas, permasalahan, tindakan troubleshooting, status, hasil penyelesaian, follow-up, bukti, dan catatan.
- Perhitungan durasi otomatis berdasarkan jam mulai dan jam selesai dalam satuan menit.
- Mendukung perhitungan durasi yang melewati tengah malam.
- Dashboard ringkasan jumlah task, task selesai, task dalam proses, dan total durasi.
- Pencarian serta filter berdasarkan status, kategori, dan rentang tanggal.
- Pengurutan tanggal terbaru atau terlama.
- Pagination agar riwayat task lebih mudah dibaca.
- Detail task melalui jendela modal.
- Ubah status task langsung dari tabel tanpa membuka form edit.
- Grafik ringkasan jumlah aktivitas per kategori.
- Backup dan restore seluruh data menggunakan JSON.
- Export data ke CSV, hapus seluruh data dengan konfirmasi, dan cetak halaman logbook.

## Teknologi

- HTML5
- CSS3
- JavaScript Native
- LocalStorage untuk menyimpan data pada browser

Tidak menggunakan framework atau database server.

## Struktur File

```
daily_logbook/
├── index.html
├── style.css
├── app.js
└── README.md
```

## Cara Menjalankan

1. Clone repository ini atau download file ZIP.
2. Buka folder project.
3. Jalankan dengan membuka file `index.html` di browser.
4. Isi identitas petugas dan mulai input aktivitas pada form Daily Activity.

Aplikasi juga dapat dijalankan menggunakan ekstensi Live Server di Visual Studio Code.

## Cara Menggunakan

1. Isi identitas petugas, departemen/unit, periode laporan, dan lokasi kerja.
2. Masukkan tanggal, pelapor/perangkat, kategori, prioritas, serta deskripsi task.
3. Isi tindakan troubleshooting dan status pekerjaan.
4. Masukkan jam mulai dan jam selesai. Durasi akan dihitung otomatis dalam menit.
5. Isi hasil penyelesaian, follow-up, tautan bukti, atau catatan jika diperlukan.
6. Klik **Simpan Task** untuk menyimpan data.
7. Gunakan fitur pencarian, filter, edit, atau hapus untuk mengelola riwayat.
8. Klik **Export CSV** untuk mengunduh data atau **Cetak** untuk mencetak logbook.

## Penyimpanan Data

Data aktivitas dan sebagian identitas disimpan menggunakan LocalStorage pada browser yang digunakan. Data tidak otomatis tersinkronisasi antarperangkat atau antarbrowser. Menghapus data situs/browser dapat menghapus data logbook yang tersimpan, jadi lakukan export CSV secara berkala sebagai salinan.

## GitHub Pages

Untuk mempublikasikan aplikasi melalui GitHub Pages:

1. Buka **Settings** pada repository.
2. Pilih menu **Pages**.
3. Pada bagian **Build and deployment**, pilih **Deploy from a branch**.
4. Pilih branch **main** dan folder **/(root)**.
5. Klik **Save**.

Setelah proses deployment selesai, aplikasi dapat diakses melalui:

https://hilmanamrullah.github.io/daily_logbook/

## Repository

https://github.com/HilmanAmrullah/daily_logbook
