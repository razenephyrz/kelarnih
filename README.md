# Kelar.in

Kelari.in adalah prototipe web untuk melacak permohonan dokumen administrasi publik, mulai dari pengajuan, verifikasi, review, hingga penerbitan, lengkap dengan riwayat status yang transparan. Seluruh data bersifat demonstrasi dan bukan layanan pemerintah resmi.

## Tech Stack

- **Framework:** Next.js 16 (App Router) + React 19
- **Bahasa:** TypeScript
- **Styling:** Tailwind CSS 4 (via `@tailwindcss/postcss`), font Fraunces & Inter
- **Ikon:** lucide-react
- **Database:** PostgreSQL (`pg`)
- **ORM:** Drizzle ORM + Drizzle Kit
- **Autentikasi:** mock auth (localStorage) untuk demo, better-auth sudah terpasang di `/api/auth/[...all]` untuk persiapan produksi
- **Tooling:** ESLint 9, TypeScript strict mode

## Cara Menjalankan

### Prasyarat

- Node.js 20+ dan npm
- PostgreSQL yang sedang berjalan

### 1. Clone

```bash
git clone <url-repo-anda>
cd <nama-folder-repo>
```

### 2. Install dependency

```bash
npm install
```

### 3. Atur environment variable

Buat file `.env` di root project:

```env
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/app_db

# opsional
BETTER_AUTH_SECRET=isi-dengan-secret-anda
BETTER_AUTH_URL=http://localhost:3000
```

### 4. Siapkan tabel database

```bash
npx drizzle-kit push
```

> Konfigurasi koneksi untuk Drizzle Kit ada di `drizzle.config.json`. Sesuaikan jika database Anda berbeda.

### 5. Jalankan

```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000). Data demo akan otomatis terisi (seed) saat aplikasi pertama kali memanggil `/api/bootstrap`.

### Akun demo

| Peran | Email | Password |
| --- | --- | --- |
| Warga | `citizen@example.com` | `civic1234` |
| Admin | `admin@example.com` | `civic1234` |

### Script lain

```bash
npm run build       # build production
npm run start       # jalankan hasil build
npm run lint        # cek ESLint
npm run typecheck   # cek TypeScript
```

## Progress Saat Ini

**Sudah ada**

- Landing page (hero, cara kerja, fitur, contoh timeline, transparansi, footer)
- Halaman statis: About, Help, Privacy, Terms
- Register dan login (mock auth, session di localStorage) dengan pengarahan berdasarkan peran
- Dashboard warga: ringkasan, daftar permohonan terbaru, progress terakhir, aksi yang diperlukan
- Daftar permohonan: pencarian, filter status dan jenis dokumen, pengurutan, hapus dengan konfirmasi
- Form permohonan baru (3 langkah: dokumen, detail, review)
- Detail permohonan: timeline 5 tahap, riwayat status (audit), edit detail, kirim ulang informasi, notifikasi terkait
- Panduan dokumen: daftar dan detail prosedur (syarat, langkah, kendala umum)
- Inbox notifikasi (filter, tandai dibaca)
- Profil dan tombol reset data demo
- Halaman admin: statistik, distribusi status, penanda melewati target, perubahan status dengan penjelasan wajib, flag eskalasi
- Backend API (Next.js Route Handlers + Drizzle): `bootstrap`, `requests`, `notifications`, `users`, `health`
- Skema database: user, session, account, verification, procedures, admin_requests, request_history, notifications
- Sinkronisasi client ke server (server dulu, localStorage sebagai cache dan fallback offline)

**Belum / rencana**

- Mengganti mock auth dengan better-auth secara penuh di UI
- Upload dokumen asli (saat ini hanya simulasi)
- Pengiriman notifikasi nyata (email/push)
- Perlindungan role dan otorisasi di sisi server pada API
- Pengujian otomatis
- Penyesuaian ke target SvelteKit + MySQL/TiDB + Netlify

## Catatan

Proyek ini adalah prototipe. Autentikasi mock tidak aman untuk produksi, jadi jangan memasukkan data pribadi yang nyata.
