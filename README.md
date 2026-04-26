# ⚡ EMF Pollution GIS v2 — Google OAuth + JSON Store

**Stack:** Next.js 15 · NextAuth v5 · Vercel Blob · TypeScript · Leaflet · Tailwind

## 👥 Rolet
| Roli    | Akses                                          |
|---------|------------------------------------------------|
| Admin   | Sheh gjithçka · menaxhon users · ndryshon rolet|
| Editor  | Krijon projekte · ngarkon CSV · eksporton       |
| Viewer  | Vetëm read-only                                |

> **Useri i parë** që hyn me Google bëhet automatikisht **Admin**.

---

## 🚀 Deployment — 4 hapa

### 1. Google OAuth Credentials
1. Shko te [console.cloud.google.com](https://console.cloud.google.com)
2. APIs & Services → Credentials → Create OAuth 2.0 Client
3. Authorized redirect URIs: `https://your-app.vercel.app/api/auth/callback/google`
4. Kopjo **Client ID** dhe **Client Secret**

### 2. GitHub
```bash
git init
git add .
git commit -m "feat: EMF Pollution GIS v2 - Google OAuth"
git remote add origin https://github.com/USERNAME/emf-pollution-gis.git
git push -u origin main
```

### 3. Vercel
1. [vercel.com](https://vercel.com) → New Project → Import nga GitHub
2. **Environment Variables** (shto të 4-ta):

| Variable               | Vlera                                    |
|------------------------|------------------------------------------|
| `GOOGLE_CLIENT_ID`     | nga Google Console                       |
| `GOOGLE_CLIENT_SECRET` | nga Google Console                       |
| `AUTH_SECRET`          | `openssl rand -base64 32`                |
| `BLOB_READ_WRITE_TOKEN`| nga Vercel → Storage → Blob → Create     |

3. Deploy!

### 4. Vercel Blob Storage (për JSON data)
1. Vercel Dashboard → Storage → Create Database → Blob
2. Zgjidh projektin tënd → Connect
3. Kopjo `BLOB_READ_WRITE_TOKEN` → shto si env variable

---

## 💻 Development Lokal
```bash
npm install
cp .env.local.example .env.local
# Plotëso .env.local me Google credentials
npm run dev  # http://localhost:3000
```

---

## 📁 Struktura
```
app/
  auth/login/          # Login me Google
  dashboard/           # Lista projekteve
  project/[id]/        # Harta GIS + analiza
  admin/users/         # Menaxhim users (admin only)
  api/                 # REST API routes
components/
  layout/Sidebar       # Navigim + user info
  map/GISMap           # Leaflet + IDW/Kriging/RBF/NN
  map/ProjectClient    # Container kryesor
  map/AllComponents    # CV + Table + Export + Members
  charts/StatsCharts   # Statistika vizuale
  admin/               # Admin panel
lib/
  auth.ts              # NextAuth + Google OAuth
  store.ts             # JSON file store (Vercel Blob)
```

---

## 📊 Formati CSV i pranueshëm
```csv
Location,lat,lon,Distance (m),Hight (m),Frequency (GHz),Emax (V/m),Eavg (V/m),Emin (V/m)
Pika_01,41.3301,19.8182,120,1.5,2.4,38.4,32.5,26.1
```
