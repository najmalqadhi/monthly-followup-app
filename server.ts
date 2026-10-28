/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * خادم المتابعة الشهرية المركزي لجهاز المسؤول
 * ========================================================
 * يعمل كخادم محلي على كمبيوتر المسؤول (Windows / Linux / Mac)
 * ويوفر:
 * 1. واجهات REST API للاتصال المباشر بين تطبيق الطالب وهواتف أندرويد.
 * 2. تخزين محلي آمن في قاعدة بيانات ملفية محلية (JSON/SQLite).
 * 3. تشغيل واجهة تحكم الويب للمسؤول عبر دمج وسائط Vite.
 * 4. إدارة النسخ الاحتياطية والمزامنة الآمنة.
 */

import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const DB_DIR = path.resolve(__dirname, 'data');
const DB_FILE = path.resolve(DB_DIR, 'motabaa_central_db.json');

// التأكد من وجود مجلد قاعدة البيانات المحلية
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

// قراءة قاعدة البيانات المركزية المحلية
function readDb(): any {
  try {
    if (!fs.existsSync(DB_FILE)) {
      const initialDb = {
        version: '1.0.0',
        createdAt: new Date().toISOString(),
        users: [],
        reports: [],
        settings: {
          organizationName: 'المؤسسة التعليمية لتأهيل الطلاب',
          academicYear: '1447-1448 هـ',
        },
        auditLogs: [],
      };
      fs.writeFileSync(DB_FILE, JSON.stringify(initialDb, null, 2), 'utf-8');
      return initialDb;
    }
    const content = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(content);
  } catch (err) {
    return { users: [], reports: [], settings: {}, auditLogs: [] };
  }
}

// كتابة آمنة لقاعدة البيانات المحلية مع حفظ ذري
function writeDb(data: any): boolean {
  try {
    const tempFile = `${DB_FILE}.tmp`;
    fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), 'utf-8');
    fs.renameSync(tempFile, DB_FILE);
    return true;
  } catch (err) {
    console.error('فشل حفظ قاعدة البيانات المحلية:', err);
    return false;
  }
}

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ترويسات CORS للسماح بتطبيق أندرويد بالاتصال من الشبكة المحلية
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// 1. فحص صحة الخادم والاتصال بالشبكة المحلية
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    systemName: 'تطبيق المتابعة الشهرية',
    mode: 'خادم محلي على جهاز المسؤول (بدون سحابية)',
    serverTime: new Date().toISOString(),
    port: PORT,
  });
});

// 2. تسجيل حساب طالب جديد من تطبيق أندرويد
app.post('/api/register', (req: Request, res: Response) => {
  const { fullName, username, password, educationalStage, email, phone } = req.body;

  if (!fullName || !username || !password || !educationalStage) {
    return res.status(400).json({
      success: false,
      message: 'جميع الحقول الأساسية مطلوبة (الاسم الكامل، اسم المستخدم، كلمة المرور، المرحلة التعليمية).',
    });
  }

  const db = readDb();
  const trimmedUser = String(username).trim().toLowerCase();

  // التحقق من عدم التكرار
  const exists = db.users.some((u: any) => u.username?.toLowerCase() === trimmedUser);
  if (exists) {
    return res.status(400).json({
      success: false,
      message: 'اسم المستخدم مسجل مسبقاً، يرجى اختيار اسم مستخدم آخر.',
    });
  }

  const nextId = db.users.filter((u: any) => u.role === 'student').length + 101;
  const newUser = {
    id: `stu-${Date.now()}`,
    studentId: `STU-2026-${nextId}`,
    fullName: String(fullName).trim(),
    username: trimmedUser,
    email: email ? String(email).trim() : null,
    phone: phone ? String(phone).trim() : null,
    role: 'student',
    status: 'pending', // بانتظار موافقة المسؤول وفق دفتر الشروط
    educationalStage: String(educationalStage).trim(),
    createdAt: new Date().toISOString(),
  };

  db.users.push(newUser);
  writeDb(db);

  res.json({
    success: true,
    message: 'تم تسجيل الحساب بنجاح وهو الآن بحالة «بانتظار الموافقة» من المشرف أو المسؤول.',
    user: newUser,
  });
});

// 3. تسجيل دخول الطالب
app.post('/api/login', (req: Request, res: Response) => {
  const { username, password } = req.body;
  const db = readDb();
  const trimmedUser = String(username || '').trim().toLowerCase();

  const user = db.users.find((u: any) => u.username?.toLowerCase() === trimmedUser);
  if (!user) {
    return res.status(401).json({
      success: false,
      message: 'اسم المستخدم أو كلمة المرور غير صحيحة.',
    });
  }

  if (user.status !== 'active') {
    return res.status(403).json({
      success: false,
      message:
        user.status === 'pending'
          ? 'حسابك بانتظار مراجعة واعتماد المسؤول لتفعيله.'
          : 'تم تعليق هذا الحساب. يرجى مراجعة المسؤول.',
      user,
    });
  }

  res.json({
    success: true,
    message: 'تم تسجيل الدخول بنجاح.',
    user,
  });
});

// 4. استلام ومزامنة التقرير الشهري
app.post('/api/reports/submit', (req: Request, res: Response) => {
  const report = req.body;
  if (!report || !report.studentId || !report.month || !report.year) {
    return res.status(400).json({
      success: false,
      message: 'بيانات التقرير غير مكتملة.',
    });
  }

  const db = readDb();

  // فحص منع التكرار للطالب في نفس الشهر والسنة
  const duplicate = db.reports.find(
    (r: any) =>
      r.studentId === report.studentId &&
      r.month === report.month &&
      r.year === report.year &&
      r.id !== report.id
  );

  if (duplicate) {
    return res.status(409).json({
      success: false,
      message: `يوجد تقرير مسجل مسبقاً لهذا الطالب لشهر ${report.month} / ${report.year}.`,
    });
  }

  // حفظ التقرير في قاعدة البيانات المركزية
  const existingIdx = db.reports.findIndex((r: any) => r.id === report.id);
  const updatedReport = {
    ...report,
    status: 'submitted',
    syncStatus: 'synced',
    updatedAt: new Date().toISOString(),
  };

  if (existingIdx !== -1) {
    db.reports[existingIdx] = updatedReport;
  } else {
    db.reports.push(updatedReport);
  }

  writeDb(db);

  res.json({
    success: true,
    message: 'تم تأكيد حفظ التقرير بنجاح في قاعدة البيانات المركزية لجهاز المسؤول.',
    report: updatedReport,
  });
});

// 5. جلب كافة تقارير الطلاب للمسؤول
app.get('/api/reports', (req: Request, res: Response) => {
  const db = readDb();
  res.json({ reports: db.reports || [] });
});

// 6. جلب قائمة الطلاب
app.get('/api/students', (req: Request, res: Response) => {
  const db = readDb();
  res.json({ students: db.users || [] });
});

// 7. تصدير النسخة الاحتياطية كملف JSON
app.get('/api/backup/export', (req: Request, res: Response) => {
  const db = readDb();
  res.setHeader('Content-Disposition', 'attachment; filename=motabaa_backup.json');
  res.setHeader('Content-Type', 'application/json');
  res.send(JSON.stringify(db, null, 2));
});

// إعداد Vite في بيئة التطوير
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`=======================================================`);
    console.log(`خادم تطبيق المتابعة الشهرية يعمل على المنفذ: ${PORT}`);
    console.log(`الوصول المحلي: http://localhost:${PORT}`);
    console.log(`الوصول من الشبكة المحلية وأندرويد: http://0.0.0.0:${PORT}`);
    console.log(`=======================================================`);
  });
}

startServer();
