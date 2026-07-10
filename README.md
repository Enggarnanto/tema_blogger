# Blogger CMS Admin

CMS statis untuk menulis, mengelola, preview, dan publish artikel ke Blogger. Frontend bisa di-host di GitHub Pages, sementara data artikel, auth admin, dan publish function memakai Supabase.

## Fitur

- CRUD artikel dengan Supabase.
- Login admin via Supabase Auth.
- Editor Visual, Editor Teks/Markdown, dan Kode HTML.
- Markdown ke HTML bersih yang aman untuk Blogger.
- Preview artikel dan panel status artikel terpisah.
- Filter artikel berdasarkan status dan kategori.
- Metadata artikel: excerpt, labels, meta keyword, lokasi, status, publish date.
- Slug otomatis berakhiran `.html`.
- Publish ke Blogger lewat Supabase Edge Function.

## File Utama

```text
cms-admin.html
cms-admin.css
cms-admin.js
cms-config.js
supabase/migrations/202607100001_create_cms_posts.sql
supabase/functions/publish-to-blogger/index.ts
```

## Menjalankan Lokal

```bash
python3 -m http.server 5173
```

Buka:

```text
http://localhost:5173/cms-admin.html
```

## Deploy GitHub Pages

Aktifkan GitHub Pages dari repository:

```text
Settings > Pages > Deploy from a branch > main > /root
```

URL CMS:

```text
https://USERNAME.github.io/NAMA_REPO/cms-admin.html
```

## Update / Pull Project

Kalau project sudah pernah di-clone dan ingin mengambil update terbaru dari GitHub:

```bash
git pull origin main
```

Kalau ada perubahan lokal, cek dulu:

```bash
git status --short --branch
```

Kalau lokal punya commit yang belum dikirim ke GitHub:

```bash
git push origin main
```

Setelah push, tunggu GitHub Pages deploy ulang beberapa saat lalu refresh halaman CMS.

## Konfigurasi CMS

Edit `cms-config.js`:

```js
window.CMS_CONFIG = {
  supabaseUrl: "https://PROJECT_REF.supabase.co",
  supabaseAnon: "SUPABASE_ANON_PUBLIC_KEY",
  functionUrl: "https://PROJECT_REF.functions.supabase.co/publish-to-blogger"
};
```

`supabaseAnon` aman berada di frontend selama Row Level Security Supabase aktif. Jangan pernah memasukkan `service_role key`, Google client secret, atau refresh token ke frontend.

## Setup Supabase

1. Buat project Supabase.
2. Buka SQL Editor.
3. Jalankan satu migration ini:

```text
supabase/migrations/202607100001_create_cms_posts.sql
```

4. Buat user admin di:

```text
Authentication > Users
```

5. Tambahkan URL GitHub Pages ke Supabase Auth URL Configuration bila diperlukan.

## Edge Function Blogger

Deploy function:

```bash
supabase functions deploy publish-to-blogger
```

Set secrets:

```bash
supabase secrets set BLOGGER_BLOG_ID="..."
supabase secrets set GOOGLE_CLIENT_ID="..."
supabase secrets set GOOGLE_CLIENT_SECRET="..."
supabase secrets set GOOGLE_REFRESH_TOKEN="..."
supabase secrets set CMS_ADMIN_EMAILS="admin@email.com"
```

## Workflow

1. Login admin dari CMS.
2. Klik `New`.
3. Tulis artikel di Editor Visual, Editor Teks, atau Kode HTML.
4. Isi metadata.
5. Klik `Save Draft`.
6. Klik `Publish` jika Edge Function Blogger sudah siap.

## Catatan Keamanan

- GitHub Pages hanya untuk frontend statis.
- Database, auth, dan secrets tetap di Supabase.
- Secret Google/Blogger hanya boleh disimpan di Supabase secrets.
- RLS pada tabel `cms_posts` wajib aktif.
