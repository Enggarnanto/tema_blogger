# Checklist Integrasi Supabase CMS

Checklist sementara untuk menghubungkan `cms-admin.html` dengan Supabase dan Blogger.

## 1. Setup Project Supabase

- [x] Buat project baru di Supabase.
- [ ] Catat `Project URL` dari `Project Settings` > `API`.
- [ ] Catat `anon public key` dari `Project Settings` > `API`.
- [ ] Buat user admin dari `Authentication` > `Users` > `Add user`.

## 2. Setup Database CMS

- [x] Buka `SQL Editor` di Supabase.
- [x] Jalankan isi file:

```text
supabase/migrations/202607100001_create_cms_posts.sql
```

- [x] Pastikan tabel `cms_posts` muncul di `Table Editor`.
- [x] Pastikan RLS aktif dan policy `select`, `insert`, `update`, `delete` sudah ada.

## 3. Jalankan CMS Lokal

- [ ] Jalankan server lokal dari direktori project:

```bash
python3 -m http.server 5173
```

- [ ] Buka CMS dari browser:

```text
http://localhost:5173/cms-admin.html
```

- [ ] Masuk ke menu `Settings`.
- [ ] Isi `Supabase URL`.
- [ ] Isi `Anon Key`.
- [ ] Klik `Save Settings`.
- [ ] Login pakai email dan password user admin Supabase.
- [ ] Klik `Load Posts` untuk tes koneksi database.

## 4. Tes CRUD Supabase

- [ ] Klik `New`.
- [ ] Isi judul, slug, konten, excerpt, labels, dan status.
- [ ] Klik `Save Draft`.
- [ ] Cek tabel `cms_posts` di Supabase, pastikan data masuk.
- [ ] Edit artikel dari CMS.
- [ ] Klik `Save Draft` lagi.
- [ ] Cek data berubah di Supabase.
- [ ] Klik `Delete`.
- [ ] Pastikan artikel terhapus dari CMS dan Supabase.

## 5. Deploy Edge Function Publish

Butuh Supabase CLI.

- [ ] Login Supabase CLI:

```bash
supabase login
```

- [ ] Link project:

```bash
supabase link --project-ref PROJECT_REF_KAMU
```

- [ ] Push database migration jika belum dijalankan manual:

```bash
supabase db push
```

- [ ] Deploy function:

```bash
supabase functions deploy publish-to-blogger
```

- [ ] Catat function URL:

```text
https://PROJECT_REF.functions.supabase.co/publish-to-blogger
```

- [ ] Isi URL tersebut ke field `Publish Function URL` di CMS Settings.

## 6. Setup Blogger API Secrets

Secrets yang dibutuhkan Edge Function:

- [ ] `BLOGGER_BLOG_ID`
- [ ] `GOOGLE_CLIENT_ID`
- [ ] `GOOGLE_CLIENT_SECRET`
- [ ] `GOOGLE_REFRESH_TOKEN`
- [ ] `CMS_ADMIN_EMAILS`

Set secrets:

```bash
supabase secrets set BLOGGER_BLOG_ID="..."
supabase secrets set GOOGLE_CLIENT_ID="..."
supabase secrets set GOOGLE_CLIENT_SECRET="..."
supabase secrets set GOOGLE_REFRESH_TOKEN="..."
supabase secrets set CMS_ADMIN_EMAILS="emailadmin@domain.com"
```

Catatan: `GOOGLE_REFRESH_TOKEN` perlu dibuat dari OAuth Google dengan akses Blogger API.

## 7. Tes Publish ke Blogger

- [ ] Buka `http://localhost:5173/cms-admin.html`.
- [ ] Login admin.
- [ ] Pastikan `Publish Function URL` sudah diisi.
- [ ] Buat atau pilih artikel.
- [ ] Klik `Publish`.
- [ ] Cek artikel muncul di Blogger.
- [ ] Cek field `blogger_post_id` dan `blogger_url` di tabel `cms_posts`.

## Status Sementara

- [ ] GitHub Pages CMS online.
- [x] Database migration Supabase berhasil.
- [ ] CRUD lokal jalan.
- [ ] Login Supabase jalan.
- [ ] Save draft ke Supabase jalan.
- [ ] Load posts dari Supabase jalan.
- [ ] Delete dari Supabase jalan.
- [ ] Edge Function berhasil deploy.
- [ ] Publish ke Blogger berhasil.
