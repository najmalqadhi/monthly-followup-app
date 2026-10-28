/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * خدمة التصدير والاستيراد (Excel & Printable Reports)
 * ========================================================
 * تدعم:
 * 1. استيراد الطلاب من ملف Excel مع فحص الأخطاء والتكرار ومعاينة قبل الاعتماد.
 * 2. تصدير قائمة الطلاب إلى Excel.
 * 3. تصدير نتائج وترتيب الطلاب لشهر محدد إلى Excel.
 * 4. تصدير التقرير الفردي والتقرير السنوي إلى صفحات منسقة مهيأة للطباعة والحفظ كـ PDF.
 */

import * as XLSX from 'xlsx';
import { User, MonthlyReport } from '../types';
import { hashPassword, generateUUID } from './dbStorage';

export interface ExcelImportRow {
  rowNumber: number;
  fullName: string;
  username: string;
  educationalStage: string;
  email?: string;
  phone?: string;
  supervisorName?: string;
  isValid: boolean;
  errors: string[];
}

export const exportService = {
  // 1. تصدير قائمة الطلاب إلى Excel
  exportStudentsToExcel(students: User[], filename = 'قائمة_الطلاب_المتابعة_الشهرية.xlsx'): void {
    const rows = students
      .filter((s) => s.role === 'student')
      .map((s, idx) => ({
        'م': idx + 1,
        'الرقم التعريفي': s.studentId,
        'الاسم الكامل': s.fullName,
        'اسم المستخدم': s.username,
        'المرحلة التعليمية': s.educationalStage,
        'المشرف المباشر': s.supervisorName || 'غير محدد',
        'البريد الإلكتروني': s.email || '-',
        'رقم الهاتف': s.phone || '-',
        'حالة الحساب':
          s.status === 'active'
            ? 'مفعل'
            : s.status === 'pending'
            ? 'بانتظار الموافقة'
            : s.status === 'suspended'
            ? 'معلق'
            : 'مرفوض',
        'تاريخ التسجيل': s.createdAt ? new Date(s.createdAt).toLocaleDateString('ar-SA') : '-',
      }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    // تفعيل اتجاه اليمين إلى اليسار في ورقة العمل
    if (!worksheet['!views']) worksheet['!views'] = [];
    worksheet['!views'].push({ rightToLeft: true });

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'الطلاب');
    XLSX.writeFile(workbook, filename);
  },

  // 2. تصدير نتائج وترتيب الطلاب لشهر محدد إلى Excel
  exportRankingsToExcel(
    reports: MonthlyReport[],
    month: number,
    year: number,
    filename?: string
  ): void {
    const finalFilename = filename || `نتائج_وترتيب_الطلاب_شهر_${month}_${year}.xlsx`;

    // فرز تنازلي حسب الدرجة، ثم أبجدياً عند التساوي
    const sorted = [...reports].sort((a, b) => {
      if (b.totalScore !== a.totalScore) {
        return b.totalScore - a.totalScore;
      }
      return a.studentName.localeCompare(b.studentName, 'ar');
    });

    const rows = sorted.map((rep, idx) => ({
      'الترتيب': idx + 1,
      'الرقم التعريفي': rep.studentCode,
      'اسم الطالب': rep.studentName,
      'المرحلة التعليمية': rep.educationalStage,
      'الأداء العلمي (30)': rep.scientificPerformance.score,
      'جلسات المناقشة (20)': rep.discussionSessions.score,
      'الأداء الدعوي (20)': rep.dawahPerformance.score,
      'الالتزام والانضباط (10)': rep.discipline.score,
      'الأداء الأخلاقي (10)': rep.moralEvaluation.score,
      'الأنشطة الثقافية (5)': rep.culturalActivities.score,
      'الإنجازات الشهرية (5)': rep.monthlyAchievements.score,
      'المجموع النهائي (100)': rep.totalScore,
      'التقدير الوصفي': rep.gradeDescription,
      'حالة التقرير': rep.status === 'locked' ? 'معتمد ومقفل' : 'تم التسليم',
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    if (!worksheet['!views']) worksheet['!views'] = [];
    worksheet['!views'].push({ rightToLeft: true });

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, `شهر ${month}-${year}`);
    XLSX.writeFile(workbook, finalFilename);
  },

  // 3. توليد وتنزيل قالب Excel فارغ للاستيراد
  downloadImportTemplate(): void {
    const templateRows = [
      {
        'الاسم الكامل': 'أحمد عبد الله القحطاني',
        'اسم المستخدم': 'ahmed.qahtani',
        'المرحلة التعليمية': 'المرحلة الجامعية',
        'البريد الإلكتروني': 'ahmed.q@example.com',
        'رقم الهاتف': '0501234567',
        'المشرف المباشر': 'أ. عبد الله المنصور',
      },
      {
        'الاسم الكامل': 'سعد بن إبراهيم الدوسري',
        'اسم المستخدم': 'saad.dosari',
        'المرحلة التعليمية': 'المرحلة الثانوية',
        'البريد الإلكتروني': 'saad.d@example.com',
        'رقم الهاتف': '0559876543',
        'المشرف المباشر': 'أ. عبد الله المنصور',
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateRows);
    if (!worksheet['!views']) worksheet['!views'] = [];
    worksheet['!views'].push({ rightToLeft: true });

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'نموذج_استيراد_الطلاب');
    XLSX.writeFile(workbook, 'نموذج_استيراد_الطلاب_المتابعة_الشهرية.xlsx');
  },

  // 4. قراءة وفحص ملف Excel المرفوع لاستيراد الطلاب
  async parseAndValidateStudentExcel(
    file: File,
    existingUsers: User[]
  ): Promise<{
    rows: ExcelImportRow[];
    validCount: number;
    invalidCount: number;
    existingUsernames: Set<string>;
  }> {
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data, { type: 'array' });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    const rawJson: any[] = XLSX.utils.sheet_to_json(worksheet);

    const existingUsernames = new Set(
      existingUsers.map((u) => u.username.toLowerCase().trim())
    );
    const seenUsernamesInFile = new Set<string>();

    const rows: ExcelImportRow[] = [];
    let validCount = 0;
    let invalidCount = 0;

    rawJson.forEach((raw, idx) => {
      const rowNumber = idx + 2; // باعتبار السطر 1 هو الترويسة
      const errors: string[] = [];

      const fullName = (
        raw['الاسم الكامل'] ||
        raw['الاسم'] ||
        raw['name'] ||
        raw['fullName'] ||
        ''
      ).toString().trim();

      const username = (
        raw['اسم المستخدم'] ||
        raw['username'] ||
        ''
      ).toString().trim().toLowerCase();

      const educationalStage = (
        raw['المرحلة التعليمية'] ||
        raw['المرحلة'] ||
        raw['stage'] ||
        ''
      ).toString().trim();

      const email = (raw['البريد الإلكتروني'] || raw['email'] || '').toString().trim();
      const phone = (raw['رقم الهاتف'] || raw['phone'] || '').toString().trim();
      const supervisorName = (raw['المشرف المباشر'] || raw['المشرف'] || '').toString().trim();

      // التحقق من الحقول الإلزامية
      if (!fullName) {
        errors.push('الاسم الكامل مطلوب');
      }
      if (!username) {
        errors.push('اسم المستخدم مطلوب');
      } else {
        if (username.length < 3) {
          errors.push('اسم المستخدم قصير جداً (أقل من 3 أحرف)');
        }
        if (existingUsernames.has(username)) {
          errors.push('اسم المستخدم مسجل مسبقاً في النظام');
        }
        if (seenUsernamesInFile.has(username)) {
          errors.push('اسم المستخدم مكرر في الملف نفسه');
        }
        seenUsernamesInFile.add(username);
      }

      if (!educationalStage) {
        errors.push('المرحلة التعليمية مطلوبة');
      }

      const isValid = errors.length === 0;
      if (isValid) validCount++;
      else invalidCount++;

      rows.push({
        rowNumber,
        fullName,
        username,
        educationalStage,
        email: email || undefined,
        phone: phone || undefined,
        supervisorName: supervisorName || undefined,
        isValid,
        errors,
      });
    });

    return { rows, validCount, invalidCount, existingUsernames };
  },

  // 5. اعتماد وحفظ صفوف الطلاب المستوردة الصالحة
  async commitImportedStudents(
    validRows: ExcelImportRow[],
    currentUsers: User[],
    defaultStatus: 'active' | 'pending' = 'active'
  ): Promise<User[]> {
    const newUsers: User[] = [];
    const baseCount = currentUsers.filter((u) => u.role === 'student').length;

    for (let i = 0; i < validRows.length; i++) {
      const row = validRows[i];
      const studentNum = baseCount + i + 101;
      const studentId = `STU-2026-${studentNum}`;
      // كلمة مرور افتراضية مشفرة بآلية آمنة (Student@2026)
      const passwordHash = await hashPassword('Student@2026');

      newUsers.push({
        id: generateUUID(),
        studentId,
        fullName: row.fullName,
        username: row.username,
        email: row.email,
        phone: row.phone,
        role: 'student',
        status: defaultStatus,
        educationalStage: row.educationalStage,
        supervisorName: row.supervisorName || 'المسؤول العام',
        createdAt: new Date().toISOString(),
        passwordHash,
      });
    }

    return newUsers;
  },

  // 6. أمر طباعة التقرير (يفتح نافذة الطباعة المجهزة رسمياً)
  printCurrentReport(): void {
    window.print();
  },
};
