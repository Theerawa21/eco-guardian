# ECO GUARDIAN
## ระบบดิจิทัลเพื่อส่งเสริมจิตสำนึกและพฤติกรรมรับผิดชอบต่อสิ่งแวดล้อม
> **“จากการเรียนรู้ สู่การลงมือดูแลโลกในชีวิตจริง”**

**ECO GUARDIAN** เป็นนวัตกรรมการศึกษาที่เชื่อมโยงการเรียนรู้ด้านสิ่งแวดล้อมกับการลงมือปฏิบัติจริงของนักเรียน ทั้งในโรงเรียน บ้าน และชุมชน โดยมีระบบภารกิจการเรียนรู้ (Mission Map 5 ภารกิจ) ระบบติดตามพฤติกรรมรายวัน (Eco Action Plan & Record) ระบบเกมมิฟิเคชัน (Points, Levels, Badges) ระบบรับรองและสังเกตพฤติกรรมโดยครู (Teacher Verification & Observation) และระบบรายงานข้อมูลสิ่งแวดล้อมจากครัวเรือน (Home Eco Report) ได้แก่ **ขยะ การใช้ไฟฟ้า และการใช้น้ำประปา** พร้อมการประเมินผลจากหลักฐานพฤติกรรม 4 แหล่งข้อมูล (4-Source Behavior Evidence Model)

---

## 1. Technology Stack

### Frontend
- **React 18** + **TypeScript** + **Vite**
- **React Router v6** (Role-based Protected Routes)
- **Tailwind CSS** (Modern Environmental Education Design System, Mobile-First Responsive)
- **Lucide Icons** (`lucide-react`)
- **Recharts** (Responsive 2D Bar Chart, Line Chart, Radar Chart, Progress Chart)
- **React Hook Form** + **Zod** (Form Validation)
- **date-fns** (Thai Date Formatting & Streak Calculation)
- ฟอนต์ภาษาไทย: `Sarabun` และ `Noto Sans Thai`

### Backend & Cloud Infrastructure
- **Firebase Authentication** (Email/Password, Reset Password, Logout, และโครงสร้างรองรับ Google Sign-in)
- **Cloud Firestore** (ฐานข้อมูลหลัก 26 Collections พร้อม Security Rules และ Composite Indexes)
- **Firebase Storage** (จัดเก็บภาพหลักฐานกิจกรรมและรูปโปรไฟล์ แยกสิทธิ์ตาม UID)
- **Firebase Hosting** + **GitHub Actions** (CI/CD สำหรับ Preview Channel บน Pull Request และ Production Deploy บน `main`)

---

## 2. Prerequisites (สิ่งที่ต้องติดตั้งก่อนเริ่มใช้งาน)

- **Node.js** เวอร์ชัน `18.x` หรือ `20.x` ขึ้นไป
- **npm** เวอร์ชัน `9.x` ขึ้นไป
- **Firebase CLI** (`npm install -g firebase-tools`) สำหรับรัน Firebase Emulator Suite และ Deploy
- **Git** สำหรับจัดการ Source Control และเชื่อมกับ GitHub Repository (`eco-guardian`)

---

## 3. Installation & Package Scripts

ตรวจสอบคำสั่งจาก `package.json` ที่พร้อมใช้งานจริง:

```bash
# 1. ติดตั้ง Dependencies
npm install

# 2. รันระบบในโหมดพัฒนา (Development Server)
npm run dev

# 3. ตรวจสอบชนิดข้อมูล TypeScript
npm run typecheck

# 4. ตรวจสอบมาตรฐานโค้ดด้วย ESLint
npm run lint

# 5. สร้าง Production Build ลงในโฟลเดอร์ dist/
npm run build

# 6. ทดสอบรัน Production Build ในเครื่อง
npm run preview
```

สำหรับคำสั่ง Firebase CLI:
```bash
# รัน Firebase Emulator Suite (Auth, Firestore, Storage, Hosting)
firebase emulators:start

# Deploy ระบบขึ้น Firebase Production
firebase deploy
```

---

## 4. Environment Variables (`.env.local`)

คัดลอกไฟล์ `.env.example` ไปเป็น `.env.local`:

```bash
cp .env.example .env.local
```

กำหนดค่าจาก Firebase Console -> Project Settings -> Web App:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_USE_FIREBASE_EMULATOR=false
```

> **ข้อควรระวังด้านความปลอดภัย:** ไฟล์ `.env` และ `.env.local` ถูกเพิ่มไว้ใน `.gitignore` แล้ว ห้ามนำ Credential หรือ Service Account Key ขึ้น GitHub Repository โดยเด็ดขาด

---

## 5. Firebase Setup & Emulator Suite

1. สร้างโปรเจกต์ใหม่ที่ [Firebase Console](https://console.firebase.google.com/)
2. เปิดใช้งาน **Authentication** (Sign-in method: Email/Password)
3. เปิดใช้งาน **Cloud Firestore** และ Deploy Rules + Indexes:
   ```bash
   firebase deploy --only firestore:rules,firestore:indexes
   ```
4. เปิดใช้งาน **Firebase Storage** และ Deploy Storage Rules:
   ```bash
   firebase deploy --only storage
   ```
5. หากต้องการทดสอบด้วย **Firebase Emulator Suite** ในเครื่อง:
   - ตั้งค่า `VITE_USE_FIREBASE_EMULATOR=true` ใน `.env.local`
   - รันคำสั่ง `firebase emulators:start` (Emulator UI จะเปิดที่ `http://localhost:4000`)

---

## 6. GitHub Actions & Deployment

ระบบมีไฟล์ Workflow พร้อมใช้งานใน `.github/workflows/`:
1. **`.github/workflows/firebase-hosting-pull-request.yml`**: เมื่อเปิด Pull Request เข้าสู่ `main` ระบบจะรัน `npm run typecheck`, `npm run lint`, `npm run build` และสร้าง Firebase Preview Channel อัตโนมัติ
2. **`.github/workflows/firebase-hosting-merge.yml`**: เมื่อ Merge เข้าสู่ `main` ระบบจะ Build และ Deploy ขึ้น Firebase Hosting (Live Channel)

ตั้งค่า **GitHub Secrets** ใน Repository Settings -> Secrets and variables -> Actions:
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`
- `FIREBASE_SERVICE_ACCOUNT`

---

## 7. Firestore & Storage Security Rules

- **Firestore Rules (`firebase/firestore.rules` และ `firestore.rules`)**:
  - **Student**: อ่านและบันทึกเฉพาะข้อมูลของตนเอง (`request.auth.uid == resource.data.userId`)
  - **Teacher**: อ่านข้อมูลนักเรียนในความดูแล บันทึกผลการสังเกตพฤติกรรม (`teacherObservations`) และตรวจรับรองหลักฐาน (`actionRecords`)
  - **Admin**: จัดการข้อมูลหลักของระบบ (Missions, Question Bank, Badges, Levels, System Settings, Users, Classrooms)
  - **`pointTransactions`**: ป้องกันการแก้ไขย้อนหลังและใช้รหัสธุรกรรมเฉพาะ (`tx_{userId}_{sourceType}_{sourceId}`) เพื่อป้องกันการให้คะแนนซ้ำจากเหตุการณ์เดียว
- **Storage Rules (`firebase/storage.rules` และ `storage.rules`)**:
  - นักเรียนอัปโหลดไฟล์ได้เฉพาะโฟลเดอร์ของตนเอง (`evidence/{uid}/...` และ `avatars/{uid}/...`)
  - จำกัดเฉพาะไฟล์รูปภาพ `image/jpeg`, `image/png`, `image/webp` ขนาดไม่เกิน `5 MB` และไม่อนุญาต Anonymous Upload

---

## 8. Project Structure

```text
eco-guardian/
├── .github/workflows/
│   ├── firebase-hosting-merge.yml
│   └── firebase-hosting-pull-request.yml
├── firebase/
│   ├── firestore.rules
│   ├── storage.rules
│   └── firestore.indexes.json
├── public/
│   └── eco-icon.svg
├── src/
│   ├── components/
│   │   ├── charts/EcoCharts.tsx
│   │   ├── forms/EvidenceUploadField.tsx
│   │   ├── layout/AppLayout.tsx
│   │   ├── layout/ProtectedRoute.tsx
│   │   └── ui/StateViews.tsx
│   ├── constants/index.ts
│   ├── contexts/AuthContext.tsx
│   ├── features/
│   │   ├── actions/
│   │   ├── assessment/
│   │   ├── auth/
│   │   ├── gamification/
│   │   ├── homeEco/
│   │   ├── missions/
│   │   └── reports/
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   └── useStudentEcoState.ts
│   ├── pages/
│   │   ├── LandingPage.tsx
│   │   ├── auth/ (LoginPage, RegisterPage, ResetPasswordPage)
│   │   ├── student/ (Dashboard, Pre/Post Assessment, Baseline, MissionMap, Commitment, EcoAction, HomeEcoReport, FollowUp, MyEcoJourney)
│   │   ├── teacher/ (TeacherDashboard, Verification, StudentManagement, Observation, ClassroomReport)
│   │   └── admin/ (AdminDashboard - 18 Modules)
│   ├── schemas/index.ts
│   ├── services/
│   │   ├── firebase/firebase.ts
│   │   └── firestore/ (collections, ecoDataService, gamificationService, notificationService, reportExportService, seedService)
│   ├── types/index.ts
│   └── utils/index.ts
├── .env.example
├── firebase.json
├── firestore.indexes.json
├── firestore.rules
├── storage.rules
├── package.json
└── README.md
```

---

## 9. Demo Account Setup & Seed Data

ระบบมี Seed Service (`src/services/firestore/seedService.ts`) ที่สร้างข้อมูลตัวอย่างพร้อม Flag `demo: true` (นักเรียน 10 คน, ครู 2 คน, Admin 1 คน, ห้องเรียน 2 ห้อง, 5 Missions, ตัวอย่าง Assessment, Eco Action และ Home Eco Report) โดยสามารถกดปุ่มทดสอบเข้าสู่ระบบได้ทันทีจากหน้า `/login`:

| บทบาท (Role) | อีเมล (Email) | รหัสผ่าน (Password) | รายละเอียด |
| :--- | :--- | :--- | :--- |
| **Student** | `student01@ecoguardian.edu` | `Password123!` | ด.ญ.พิมชนก รักษ์พงไพร (ชั้น ม.2/1) |
| **Teacher** | `teacher01@ecoguardian.edu` | `Password123!` | ครูกานต์พิชชา สายชล (ครูที่ปรึกษา ม.2/1) |
| **Admin** | `admin@ecoguardian.edu` | `Password123!` | ดร.ธนภัทร พิทักษ์โลก (ผู้ดูแลระบบ) |

> **การแยกข้อมูล Demo ออกจากข้อมูลวิจัยจริง:** ในหน้า Admin Dashboard และ Classroom Report มีตัวเลือกเปิด/ปิดการรวมข้อมูล `demo: true` และมีปุ่ม **"ล้างข้อมูล Demo"** (`purgeDemoData`) เพื่อลบเฉพาะข้อมูลตัวอย่างออกก่อนเริ่มเก็บข้อมูลวิจัยจริง

---

## 10. Troubleshooting

- **ไม่สามารถเข้าสู่ระบบด้วย Firebase จริงได้**: ตรวจสอบว่าได้สร้างไฟล์ `.env.local` และเปิดใช้งาน Email/Password Sign-in ใน Firebase Console เรียบร้อยแล้ว
- **อัปโหลดรูปภาพไม่สำเร็จ**: ตรวจสอบว่าไฟล์เป็นนามสกุล `.jpg`, `.png`, หรือ `.webp` ขนาดไม่เกิน 5 MB และ Deploy `storage.rules` แล้ว
- **เปิดไฟล์ CSV ใน Excel แล้วภาษาไทยอ่านไม่ออก**: ระบบใส่ UTF-8 BOM (`\uFEFF`) ให้อัตโนมัติแล้ว สามารถดับเบิลคลิกเปิดใน Microsoft Excel ได้ทันที

