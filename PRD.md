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
  * **Anggota (`USER`):** hasil registrasi mandiri. Mengelola profil, mengunggah foto galeri ke angkatannya, dan ikut forum.
  * **Bendahara (`BENDAHARA`):** semua hak anggota, ditambah Panel Bendahara yang hanya berisi Laporan Keuangan. **Satu-satunya** role yang mencatat, mengedit, dan menghapus transaksi kas.
  * **Admin (`ADMIN`):** mengelola seluruh konten dan organisasi, mengisi angkatan anggota, dan menetapkan role (Anggota/Bendahara/Admin). Laporan keuangan hanya bisa dilihat, tidak diubah.
* **Pemberian Role:** registrasi publik selalu menghasilkan Anggota. Admin pertama dibuat lewat `prisma/seed.ts`; role lain ditetapkan admin dari panel (Struktur → Anggota).
* **Manajemen Profil:** Anggota dapat melakukan *login* dan mengedit data profil mereka masing-masing.

### Fitur Pengguna Umum (User)
* **Pendaftaran Anggota Dinamis:** *User* dapat mendaftar menjadi anggota Paskatema melalui formulir yang telah disediakan.
* **Sistem Voting:** Terintegrasi di halaman Struktur, memungkinkan *user* untuk memberikan suara dalam pemilihan Komandan dan Wakil Komandan periode selanjutnya.
* **Galeri per Angkatan:** Anggota mengunggah foto ke galeri angkatannya sendiri dan mengelola foto miliknya.
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
* **Media / Document Manager:** Sistem penyimpanan *file* terpusat (lokal di `uploads/`, atau Cloudinary bila dikonfigurasi). Admin dapat mengunggah dan menyimpan foto dokumentasi di *server*. Saat membuat berita atau *event* baru, admin tinggal memilih gambar dari galeri yang sudah ada tanpa harus mencari ulang di *device* lokal (mendukung *upload* langsung juga).
* **Form Builder Dinamis:** Admin dapat mengatur dan memodifikasi *field* (isian) pada formulir pendaftaran anggota baru secara dinamis untuk ditampilkan di *Front-End*.
* **URL Shortener:** Fitur bawaan untuk mempersingkat tautan (*link*) guna memudahkan penyebaran informasi ke anggota atau publik.
