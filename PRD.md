**🇮🇩 Paskatema - Website Paskibra SMK Telkom Malang**

## 📖 Deskripsi Proyek
Sistem informasi, portal berita, dan manajemen keanggotaan untuk Paskatema (Paskibra SMK Telkom Malang). Website ini dirancang untuk memberikan informasi publik seputar kegiatan paskibra, sekaligus menyediakan *Content Management System* (CMS) dan fitur manajerial untuk admin organisasi.

---

## 🗺️ Peta Situs & Halaman Utama

### 1. Dashboard (Beranda)
Halaman pendaratan utama yang menampilkan informasi ringkas dan menarik:
* **Navbar:** Navigasi utama (Home, About Us, Event, Struktur, Profil Anggota, Login/Register).
* **Hero Section:** Banner utama dengan *copywriting* / tulisan menarik.
* **Highlight Event:** Menampilkan event-event unggulan Paskatema.
* **E-Book Peraturan:** Akses ke buku elektronik peraturan Paskatema yang dibuat oleh senior.
* **Berita Terbaru:** *Feed* artikel atau berita terkini.
* **Pendaftaran Anggota:** Akses pintas untuk pendaftaran anggota baru.
* **Footer:** Informasi kontak dan tautan terkait.

### 2. About Us
Halaman profil organisasi:
* **Sejarah:** Latar belakang dan sejarah terbentuknya Paskatema.
* **Riwayat Lomba:** Daftar kompetisi yang pernah diikuti.
* **Galeri Prestasi:** Menampilkan trofi dan penghargaan yang telah diraih.

### 3. Struktur Organisasi
Halaman untuk melihat hierarki kepengurusan:
* **Bagan Hierarki:** Menampilkan struktur dari Pembina, Pelatih, Komandan, Wakil Komandan, dan jajaran di bawahnya.
* **Filter Periode:** Fitur untuk melihat daftar anggota dan struktur berdasarkan tahun/periode kepengurusan.

### 4. Event
Halaman dokumentasi kegiatan:
* Menampilkan daftar seluruh *event* internal (seperti LKBB Antareja) maupun eksternal (lomba yang diikuti oleh Paskatema).

---

## ⚙️ Fitur Sistem & Spesifikasi

Fitur dibagi berdasarkan hak akses untuk menjaga keamanan dan kerapian operasional:

### Hak Akses & Akun
* **Tiga Role Akun:**
  * **Anggota (`USER`):** hasil registrasi mandiri (calon anggota, anggota aktif, atau purna). Anggota aktif & purna mengajukan angkatan saat daftar, lalu diverifikasi admin. Mengelola profil, mengunggah foto galeri ke angkatannya, dan ikut forum.
  * **Bendahara (`BENDAHARA`):** otomatis dimiliki anggota yang **menjabat Bendahara** di Struktur periode aktif (dicabut saat jabatan diganti). Semua hak anggota, ditambah Panel Bendahara yang hanya berisi Laporan Keuangan. **Satu-satunya** role yang mencatat, mengedit, dan menghapus transaksi kas.
  * **Admin (`ADMIN`):** mengelola seluruh konten dan organisasi, mengisi angkatan anggota, dan menetapkan role (Anggota/Bendahara/Admin). Laporan keuangan hanya bisa dilihat, tidak diubah.
* **Pemberian Role:** registrasi publik selalu menghasilkan Anggota. Admin pertama dibuat lewat `prisma/seed.ts`; admin lain ditetapkan dari panel (Struktur → Anggota). Role Bendahara tidak bisa diberikan manual, karena mengikuti jabatan di Struktur.
* **Manajemen Profil:** Anggota dapat melakukan *login* dan mengedit data profil mereka masing-masing.

### Fitur Pengguna Umum (User)
* **Pendaftaran Anggota Dinamis:** *User* dapat mendaftar menjadi anggota Paskatema melalui formulir yang telah disediakan.
* **Sistem Voting:** Terintegrasi di halaman Struktur, memungkinkan *user* untuk memberikan suara dalam pemilihan Komandan dan Wakil Komandan periode selanjutnya.
* **Galeri per Angkatan:** Anggota mengunggah foto & video ke galeri angkatannya sendiri dan mengelola miliknya.
* **Profil Anggota (Aktif/Purna):** Jaringan ala LinkedIn untuk anggota dan alumni.
  * Status **Aktif** atau **Purna** ditetapkan admin (per anggota, atau satu angkatan sekaligus).
  * Anggota mengisi sendiri: pendidikan/kampus, pekerjaan/instansi, keahlian, LinkedIn, Instagram.
  * Direktori `/anggota` (cari nama, filter status & angkatan) dan halaman profil `/anggota/<id>` dengan riwayat jabatan.
  * Privasi: publik hanya melihat nama, foto, angkatan, status, dan jabatan. Detail profil hanya untuk anggota ber-angkatan yang login. Anggota Purna boleh memilih profil lengkapnya tampil publik.
* **Event:** Halaman `/event` berisi agenda dan dokumentasi kegiatan, dengan poster dan video.
* **Forum Anggota:** Diskusi berbentuk topik dan balasan, khusus anggota yang angkatannya sudah diisi admin.
  * **Forum Umum:** terbuka untuk semua angkatan.
  * **Forum Angkatan:** hanya bisa dilihat dan ditulisi anggota angkatan tersebut.
  * Penulis bisa mengedit/menghapus topik dan balasannya sendiri. Admin bisa menyematkan, mengunci, dan menghapus topik/balasan siapa pun. Maksimal 10 kiriman per menit.
  * Chat pribadi dan notifikasi realtime belum termasuk cakupan.

### Fitur Bendahara
* **Laporan Keuangan:** Mencatat pemasukan dan pengeluaran kas dengan rincian tanggal, keterangan, nama vendor, jumlah, satuan, harga, sub total (jumlah × harga, dihitung otomatis), dan total. Setiap transaksi mencatat siapa yang memasukkannya. Publik hanya melihat ringkasan (total masuk/keluar/saldo).

### Fitur Panel Administrator (Admin)
* **Manajemen Konten (CRUD):** Admin dapat membuat, membaca, memperbarui, dan menghapus data (CRUD) untuk bagian **Berita**, **Event**, **Prestasi**, **E-Book**, **Galeri**, **Anggota**, dan **Struktur Organisasi**.
* **Berita dalam Markdown:** Isi berita ditulis dengan Markdown (ada pratinjau) dan disimpan sebagai file `content/news/<id>.md`.
* **Manajemen Anggota & Role:** Admin mengisi angkatan anggota dan menetapkan role Anggota/Bendahara/Admin.
* **Moderasi Forum:** Sematkan, kunci, dan hapus topik/balasan.
* **Status Anggota:** Menetapkan status Aktif/Purna per anggota atau untuk satu angkatan sekaligus.
* **Media / Document Manager:** Sistem penyimpanan *file* terpusat. Foto (≤ 5 MB) dan video (MP4/WEBM/MOV, ≤ 100 MB) disimpan di Cloudinary bila dikonfigurasi, selain itu lokal di `uploads/`. PDF E-Book dan isi berita tetap di server. Admin dapat mengunggah dan menyimpan foto dokumentasi di *server*. Saat membuat berita atau *event* baru, admin tinggal memilih gambar dari galeri yang sudah ada tanpa harus mencari ulang di *device* lokal (mendukung *upload* langsung juga).
* **Form Builder Dinamis:** Admin dapat mengatur dan memodifikasi *field* (isian) pada formulir pendaftaran anggota baru secara dinamis untuk ditampilkan di *Front-End*.
* **URL Shortener:** Fitur bawaan untuk mempersingkat tautan (*link*) guna memudahkan penyebaran informasi ke anggota atau publik.

---

## ☁️ Penyiapan Cloudinary (sekali jalan)

Sampai langkah ini selesai, semua file tetap tersimpan di server dan website berjalan normal.

1. **Buat akun** gratis di https://cloudinary.com/users/register_free memakai email organisasi/sekolah (bukan email pribadi). Cloud name disarankan `paskatema`.
2. **Ambil kunci** di https://console.cloudinary.com/settings/api-keys: salin *API environment variable* (`cloudinary://API_KEY:API_SECRET@CLOUD_NAME`). API Secret rahasia: jangan dikirim di chat atau di-commit.
3. **Isi `.env`** di VPS (`/docker/paskatema/web-paskatema/.env`):
   ```
   CLOUDINARY_URL="cloudinary://API_KEY:API_SECRET@CLOUD_NAME"
   CLOUDINARY_FOLDER="paskatema"
   ```
4. **Restart backend:** `docker compose up -d --force-recreate`, lalu cek `docker compose logs paskatema-api | grep Penyimpanan` harus menampilkan *Penyimpanan foto & video: Cloudinary*.
5. **Pindahkan foto lama:**
   ```bash
   docker exec paskatema_api node dist/src/scripts/migrate-uploads-to-cloudinary.js --dry-run
   docker exec paskatema_api node dist/src/scripts/migrate-uploads-to-cloudinary.js
   ```
   Aman diulang; file lokal tidak dihapus dan tetap jadi cadangan.

Kuota paket gratis ± 25 kredit/bulan (penyimpanan + bandwidth + transformasi). Video paling cepat menghabiskan kuota; pantau di dashboard Cloudinary.

---

## 🔄 Rencana Migrasi ke Digital

Prinsip: anggota mendaftar sendiri, admin cukup memverifikasi.

* **Jenis pendaftar di `/daftar`:** *Calon anggota baru* (lalu isi formulir rekrutmen di `/pendaftaran`), *Anggota aktif* (isi angkatan), *Purna* (isi angkatan & tahun lulus). Akun lama tanpa angkatan bisa mengajukan dari `/akun`.
* **Verifikasi:** Admin → Struktur & Kepengurusan → **Verifikasi Anggota**, dikelompokkan per angkatan dengan tombol **Setujui semua Angkatan N**; angkatan & status bisa dikoreksi per orang.

| Tahap | Isi |
|---|---|
| 1. Persiapan | Periode kepengurusan aktif, jabatan, struktur pengurus (termasuk Bendahara). Catat **saldo kas awal** sebagai satu transaksi pemasukan; buku/Excel lama jadi arsip. |
| 2. Anggota aktif | Bagikan `/daftar?as=aktif` ke grup WA tiap angkatan, tenggat ± 2 minggu; admin verifikasi per angkatan. |
| 3. Purna | Bagikan `/daftar?as=purna` ke grup alumni, tanpa tenggat. |
| 4. Konten | Unggah dokumen/E-Book, berita, event, galeri penting. |
| 5. Beralih penuh | Setelah tenggat, pendaftaran, pemilihan, dan kas hanya lewat website. |

*Opsional (belum dibuat):* impor daftar anggota lama dari Excel (nama, angkatan, status, email) untuk verifikasi otomatis berdasarkan email.
