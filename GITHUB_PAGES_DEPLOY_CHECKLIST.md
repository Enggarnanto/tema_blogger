# Checklist Deploy CMS ke GitHub Pages

GitHub Pages bisa dipakai untuk hosting file statis CMS:

```text
cms-admin.html
cms-admin.css
cms-admin.js
```

Supabase tetap dipakai untuk database, login, dan Edge Function. Blogger API secrets tetap disimpan di Supabase, bukan di GitHub Pages.

## 1. Yang Aman Dipublish ke GitHub Pages

- [ ] `cms-admin.html`
- [ ] `cms-admin.css`
- [ ] `cms-admin.js`
- [ ] `tema_seopro_demo.html`
- [ ] `SUPABASE_CMS_CHECKLIST.md`
- [ ] `GITHUB_PAGES_DEPLOY_CHECKLIST.md`

## 2. Yang Jangan Ditaruh di Frontend

- [ ] Jangan taruh `service_role key` Supabase di file HTML/JS.
- [ ] Jangan taruh `GOOGLE_CLIENT_SECRET` di file HTML/JS.
- [ ] Jangan taruh `GOOGLE_REFRESH_TOKEN` di file HTML/JS.
- [ ] Jangan taruh password admin di file project.

Catatan: `anon public key` Supabase boleh dipakai di frontend karena akses tetap dibatasi RLS policy.

## 3. Buat Repository GitHub

- [ ] Buat repository baru di GitHub.
- [ ] Contoh nama:

```text
tema-blogger-cms
```

- [ ] Set repository ke `Private` dulu kalau CMS masih eksperimen.
- [ ] Set ke `Public` kalau mau GitHub Pages gratis tanpa batasan private repo plan.

## 4. Push Project ke GitHub

Jalankan dari direktori project:

```bash
git init
git add .
git commit -m "Add Blogger CMS admin"
git branch -M main
git remote add origin https://github.com/USERNAME/tema-blogger-cms.git
git push -u origin main
```

Kalau repo lokal sudah punya remote, cukup:

```bash
git add .
git commit -m "Add CMS deployment checklist"
git push
```

## 5. Aktifkan GitHub Pages

- [ ] Buka repository GitHub.
- [ ] Masuk ke `Settings`.
- [ ] Masuk ke `Pages`.
- [ ] Pada `Build and deployment`, pilih:

```text
Source: Deploy from a branch
Branch: main
Folder: /root
```

- [ ] Klik `Save`.
- [ ] Tunggu sampai GitHub memberi URL Pages.

Contoh URL:

```text
https://USERNAME.github.io/tema-blogger-cms/cms-admin.html
```

## 6. Konfigurasi CMS Setelah Online

- [ ] Buka URL GitHub Pages CMS.
- [ ] Masuk ke `Settings`.
- [ ] Isi `Supabase URL`.
- [ ] Isi `Anon Key`.
- [ ] Isi `Publish Function URL`.
- [ ] Klik `Save Settings`.
- [ ] Login pakai user admin Supabase.
- [ ] Klik `Load Posts`.

## 7. Tambahkan Domain GitHub Pages ke Supabase

Supabase Auth biasanya perlu URL aplikasi dimasukkan ke daftar redirect/site URL.

- [ ] Buka Supabase.
- [ ] Masuk ke `Authentication` > `URL Configuration`.
- [ ] Isi `Site URL` dengan URL GitHub Pages:

```text
https://USERNAME.github.io/tema-blogger-cms
```

- [ ] Tambahkan redirect URL:

```text
https://USERNAME.github.io/tema-blogger-cms/**
```

## 8. Cek CORS Edge Function

Function saat ini sudah memakai:

```text
Access-Control-Allow-Origin: *
```

Jadi GitHub Pages bisa memanggil function Supabase.

## 9. Tes Setelah Deploy

- [ ] CMS GitHub Pages terbuka.
- [ ] CSS dan JS berhasil load.
- [ ] Settings bisa disimpan.
- [ ] Login admin berhasil.
- [ ] Save draft masuk ke Supabase.
- [ ] Load posts berhasil.
- [ ] Delete post berhasil.
- [ ] Publish ke Blogger berhasil setelah Blogger secrets siap.

## Catatan Penting

GitHub Pages hanya hosting frontend. Database, auth, dan secrets tetap di Supabase.
