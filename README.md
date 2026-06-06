# CareTrack Clinic — TYBT

MediCore Solutions uchun veb-asosli **Tibbiy Yozuvlarni Boshqarish Tizimi** (CareTrack Clinic).

## Texnologiyalar

| Qatlam | Texnologiya |
|--------|-------------|
| Backend | **Node.js**, **Express.js**, NPM (`jsonwebtoken`, `bcryptjs`, `cors`, `dotenv`, `uuid`) |
| Native modullar | `path`, `fs`, `crypto` (promisify via `util`) |
| Middleware | JSON parser, CORS, request logger, JWT `authenticate`, rol `requireRoles`, xato boshqaruv |
| Frontend | HTML/CSS/JS, **Axios** (CDN), JWT `localStorage` |
| Ma'lumotlar | JSON fayl (`server/data/db.json`) — `fs` orqali |

## Ishga tushirish

```bash
cd caretrack-clinic
npm install
node server/services/seedPasswords.js
npm start
```

Brauzer: [http://localhost:3000](http://localhost:3000)

## Demo hisoblar

| Login | Parol | Rol |
|-------|-------|-----|
| `admin` | `admin123` | Administrator |
| `clinician` | `clinician123` | Klinitsist |
| `reception` | `reception123` | Qabulxona |

## API (asosiy)

| Method | Endpoint | Ruxsat |
|--------|----------|--------|
| POST | `/api/auth/login` | Ochiq |
| GET | `/api/doctors` | Ochiq (qidiruv) |
| CRUD | `/api/doctors` | Admin (yozish) |
| GET/POST | `/api/patients` | Staff |
| PUT | `/api/patients/:id` | Admin, Klinitsist |
| DELETE | `/api/patients/:id` | Admin |
| GET | `/api/patients/:id/profile` | Staff — to'liq profil |
| CRUD | `/api/diagnoses` | Admin, Klinitsist |
| GET | `/api/services` | Ochiq |
| POST | `/api/newsletter/subscribe` | Ochiq |

Barcha himoyalangan marshrutlar: `Authorization: Bearer <JWT>`

## Loyiha tuzilmasi

```
caretrack-clinic/
├── server/
│   ├── index.js
│   ├── config.js
│   ├── middleware/   (auth, roles, logger, errorHandler)
│   ├── routes/
│   ├── services/     (dataStore — fs)
│   └── data/db.json
└── public/           (MediLab uslubidagi landing + TYBT panel)
```

## Responsiv dizayn

- **≤991px:** hamburger menyu, qidiruv va newsletter ustun shaklida, dashboard uchun pastki tab navigatsiya
- **≤480px:** kichik telefonlar uchun qo‘shimcha optimallashtirish
- Jadvalar gorizontal scroll (`table-responsive`)

## Rol matritsasi

- **Administrator** — shifokor/bemor/tashxis CRUD
- **Klinitsist** — bemor va tashxis ko'rish/yangilash, yangi tashxis
- **Qabulxona** — yangi bemor, shifokorlar ro'yxati (o'qish)
