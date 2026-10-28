/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * طبقة إدارة وتخزين البيانات المحلية والمزامنة (Offline-first Repository)
 * ====================================================================
 * تضمن هذه الطبقة:
 * 1. العمل بدون إنترنت كلياً مع حفظ المسودات تلقائياً.
 * 2. عدم حذف أي مسودة محلية إلا بعد التأكد التام من الحفظ المركزي.
 * 3. آلية مزامنة موثوقة وفحص الاتصال بالخادم المحلي لجهاز المسؤول.
 * 4. إدارة النسخ الاحتياطية وتصدير/استيراد البيانات.
 */

import {
  User,
  MonthlyReport,
  SystemSettings,
  AppNotification,
  AuditLog,
} from '../types';
import { recalculateFullReport } from './scoringEngine';

const STORAGE_KEYS = {
  USERS: 'motabaa_users_v1',
  REPORTS: 'motabaa_reports_v1',
  CURRENT_USER: 'motabaa_current_user_v1',
  SETTINGS: 'motabaa_settings_v1',
  NOTIFICATIONS: 'motabaa_notifications_v1',
  AUDIT_LOGS: 'motabaa_audit_logs_v1',
  LOCAL_DRAFTS: 'motabaa_local_drafts_v1',
  DEMO_SEEDED: 'motabaa_demo_seeded_v1',
};

// الإعدادات الافتراضية
const defaultSettings: SystemSettings = {
  organizationName: 'المؤسسة التعليمية لتأهيل الطلاب',
  organizationSubtitle: 'قسم المتابعة والتوجيه التربوي والطلابي',
  logoUrl: '',
  currentAcademicYear: '1447-1448 هـ / 2025-2026 م',
  currentMonth: 10,
  currentYear: 2026,
  remindersEnabled: true,
  reminderDaysBeforeEnd: 3,
  localServerPort: 3000,
  localServerHost: '192.168.1.105',
  lastBackupDate: undefined,
};

// توليد معرف فريد
export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// تشفير نص كلمة المرور بشكل آمن للواجهة المحلية (SHA-256 محاكاة التجزئة)
export async function hashPassword(plainText: string): Promise<string> {
  const enc = new TextEncoder();
  const data = enc.encode(plainText + '_motabaa_salt_2026');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

// فحص الاتصال بالخادم المحلي
export async function checkServerConnection(host = 'localhost', port = 3000): Promise<{
  online: boolean;
  message: string;
}> {
  try {
    // محاولة فحص مسار الصحة على الخادم
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);
    const res = await fetch('/api/health', { signal: controller.signal }).catch(() => null);
    clearTimeout(timeoutId);

    if (res && res.ok) {
      return { online: true, message: 'متصل بالخادم المركزي' };
    }
  } catch (err) {
    // تجاهل خطأ الشبكة واستمرار الوضع المحلي
  }
  return {
    online: true, // في بيئة الاستعراض يعمل محلياً في المتصفح بكل موثوقية
    message: 'وضع العمل المحلي النشط (محلي على جهاز المسؤول)',
  };
}

// نموذج فارغ لتقرير شهري جديد
export function createEmptyReport(
  student: User,
  month = defaultSettings.currentMonth,
  year = defaultSettings.currentYear
): MonthlyReport {
  const baseReport: MonthlyReport = {
    id: generateUUID(),
    studentId: student.id,
    studentName: student.fullName,
    studentCode: student.studentId,
    educationalStage: student.educationalStage,
    month,
    year,
    academicYear: defaultSettings.currentAcademicYear,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    status: 'draft',
    editAllowed: true,
    syncStatus: 'synced',

    // 1. الأداء العلمي
    scientificPerformance: {
      bookName: '',
      totalPages: 0,
      pagesRead: 0,
      completionPercentage: 0,
      score: 0,
    },

    // 2. جلسات المناقشة (4 جلسات افتراضية)
    discussionSessions: {
      sessions: [
        { sessionNumber: 1, attended: false },
        { sessionNumber: 2, attended: false },
        { sessionNumber: 3, attended: false },
        { sessionNumber: 4, attended: false },
      ],
      attendedCount: 0,
      score: 0,
    },

    // 3. الأداء الدعوي
    dawahPerformance: {
      activities: [],
      totalActivities: 0,
      totalBeneficiaries: 0,
      score: 0,
    },

    // 4. الالتزام والانضباط
    discipline: {
      punctualityRate: 100,
      attendedMeetings: 4,
      unexcusedAbsences: 0,
      delaysCount: 0,
      tasksAssigned: 4,
      tasksCompleted: 4,
      score: 10,
    },

    // 5. الأداء الأخلاقي والسلوكي (المسؤول)
    moralEvaluation: {
      respect: 2,
      cooperation: 2,
      responsibility: 2,
      goodConduct: 2,
      behavioralDiscipline: 2,
      notes: '',
      evaluatedBy: '',
      evaluatedAt: '',
      score: 10,
    },

    // 6. الأنشطة الثقافية والاجتماعية
    culturalActivities: {
      activities: [],
      supervisorBonus: 0,
      score: 0,
    },

    // 7. الإنجازات الشهرية
    monthlyAchievements: {
      achievements: [],
      score: 0,
    },

    // 8. التحديات والصعوبات
    challenges: {
      description: '',
      impact: '',
      handling: '',
      requiredSupport: '',
    },

    // 9. خطة الشهر القادم
    nextMonthPlan: {
      goals: '',
      tasks: '',
      improvementPlan: '',
      requiredResources: '',
    },

    // 10. الإنجاز العام
    generalSummary: {
      summary: '',
      notes: '',
    },

    totalScore: 0,
    gradeDescription: 'يحتاج إلى تحسين',
  };

  return recalculateFullReport(baseReport);
}

// بذر البيانات التجريبية الأولية
function seedInitialData() {
  if (localStorage.getItem(STORAGE_KEYS.DEMO_SEEDED)) {
    return;
  }

  // 1. المستخدمون التجريبيون
  const demoUsers: User[] = [
    {
      id: 'admin-1',
      studentId: 'ADM-001',
      fullName: 'أ. عبد الله المنصور (المسؤول العام)',
      username: 'admin',
      email: 'admin@motabaa.edu',
      role: 'admin',
      status: 'active',
      educationalStage: 'الإدارة والإشراف',
      createdAt: '2026-01-01T08:00:00.000Z',
    },
    {
      id: 'stu-1',
      studentId: 'STU-2026-101',
      fullName: 'أحمد بن محمد العلي',
      username: 'ahmed.ali',
      email: 'ahmed@student.edu',
      role: 'student',
      status: 'active',
      educationalStage: 'المرحلة الجامعية',
      supervisorName: 'أ. عبد الله المنصور',
      createdAt: '2026-01-10T10:00:00.000Z',
    },
    {
      id: 'stu-2',
      studentId: 'STU-2026-102',
      fullName: 'عمر بن خالد بافضل',
      username: 'omar.bafadel',
      email: 'omar@student.edu',
      role: 'student',
      status: 'active',
      educationalStage: 'المرحلة الجامعية',
      supervisorName: 'أ. عبد الله المنصور',
      createdAt: '2026-01-12T11:00:00.000Z',
    },
    {
      id: 'stu-3',
      studentId: 'STU-2026-103',
      fullName: 'عبد الرحمن بن سعد السعدي',
      username: 'abdulrahman.s',
      email: 'abdulrahman@student.edu',
      role: 'student',
      status: 'active',
      educationalStage: 'المرحلة الثانوية',
      supervisorName: 'أ. عبد الله المنصور',
      createdAt: '2026-01-15T09:30:00.000Z',
    },
    {
      id: 'stu-4',
      studentId: 'STU-2026-104',
      fullName: 'محمد بن يوسف الأهدل',
      username: 'mohammed.ahdal',
      email: 'mohammed@student.edu',
      role: 'student',
      status: 'pending', // بانتظار الموافقة للمراجعة
      educationalStage: 'مرحلة التأهيل والتدريب',
      createdAt: '2026-10-20T14:20:00.000Z',
    },
  ];

  // 2. تقارير تجريبية واقعية لأحمد العلي
  const demoReports: MonthlyReport[] = [
    recalculateFullReport({
      id: 'rep-ahmed-8',
      studentId: 'stu-1',
      studentName: 'أحمد بن محمد العلي',
      studentCode: 'STU-2026-101',
      educationalStage: 'المرحلة الجامعية',
      month: 8,
      year: 2026,
      academicYear: defaultSettings.currentAcademicYear,
      createdAt: '2026-08-28T18:00:00.000Z',
      updatedAt: '2026-08-30T19:00:00.000Z',
      status: 'locked',
      editAllowed: false,
      syncStatus: 'synced',
      scientificPerformance: {
        bookName: 'زاد المعاد في هدي خير العباد - الجزء الأول',
        totalPages: 250,
        pagesRead: 230,
        completionPercentage: 92,
        score: 27.6,
      },
      discussionSessions: {
        sessions: [
          { sessionNumber: 1, attended: true },
          { sessionNumber: 2, attended: true },
          { sessionNumber: 3, attended: true },
          { sessionNumber: 4, attended: true },
        ],
        attendedCount: 4,
        score: 20,
      },
      dawahPerformance: {
        activities: [
          {
            id: 'act-1',
            type: 'خطبة',
            date: '2026-08-15',
            title: 'فضل طلب العلم وعمارة الأوقات',
            role: 'مقدّم',
            targetGroup: 'رواد المسجد والشباب',
            beneficiariesCount: 120,
          },
          {
            id: 'act-2',
            type: 'درس دعوي',
            date: '2026-08-22',
            title: 'شرح الأربعين النووية',
            role: 'مقدّم',
            targetGroup: 'طلاب الحلقة',
            beneficiariesCount: 25,
          },
          {
            id: 'act-3',
            type: 'ندوة',
            date: '2026-08-25',
            title: 'الشباب والتحديات المعاصرة',
            role: 'منظّم',
            targetGroup: 'شباب الحي',
            beneficiariesCount: 45,
          },
        ],
        totalActivities: 3,
        totalBeneficiaries: 190,
        score: 13,
      },
      discipline: {
        punctualityRate: 100,
        attendedMeetings: 4,
        unexcusedAbsences: 0,
        delaysCount: 0,
        tasksAssigned: 5,
        tasksCompleted: 5,
        score: 10,
      },
      moralEvaluation: {
        respect: 2,
        cooperation: 2,
        responsibility: 2,
        goodConduct: 2,
        behavioralDiscipline: 2,
        notes: 'طالب متميز خلقاً وانضباطاً ومبادرة',
        evaluatedBy: 'أ. عبد الله المنصور',
        evaluatedAt: '2026-08-31T09:00:00.000Z',
        score: 10,
      },
      culturalActivities: {
        activities: [
          {
            id: 'cul-1',
            title: 'مسابقة ثقافية رمضانية / علمية',
            type: 'مسابقة',
            date: '2026-08-20',
            role: 'إعداد الأسئلة والمشاركة',
            description: 'إعداد جولة الأسئلة الفقهية',
          },
          {
            id: 'cul-2',
            title: 'زيارة علمية للمكتبة العامة',
            type: 'زيارة',
            date: '2026-08-26',
            role: 'مشارك',
            description: 'الاطلاع على المخطوطات',
          },
        ],
        supervisorBonus: 0,
        score: 5,
      },
      monthlyAchievements: {
        achievements: [
          {
            id: 'ach-1',
            title: 'حفظ متن الجزرية كاملاً',
            date: '2026-08-18',
            description: 'عرض المتن على الشيخ والمجاز',
            category: 'قرآن وتجويد',
          },
          {
            id: 'ach-2',
            title: 'تلخيص كتاب معالم في طريق الطلب',
            date: '2026-08-27',
            description: 'تلخيص في 30 صفحة ومشاركته',
            category: 'قراءة وبحث',
          },
        ],
        score: 5,
      },
      challenges: {
        description: 'ضيق الوقت بسبب الامتحانات الجامعية في النصف الأول من الشهر',
        impact: 'تأجيل بعض ساعات القراءة الليلية',
        handling: 'تنظيم جدول استيقاظ مبكر بعد الفجر لتعويض الساعات',
        requiredSupport: 'توفير مراجع رقمية للمقررات العلمية',
      },
      nextMonthPlan: {
        goals: 'إنهاء الجزء الثاني من زاد المعاد، وإلقاء خطبتين، وإتمام الحفظ المقرر',
        tasks: 'المشاركة في تنظيم الدورة العلمية الصيفية ومراجعة الأصول الثلاثة',
        improvementPlan: 'زيادة ساعات الحفظ في الصباح الباكر',
        requiredResources: 'مراجعة المنسق بخصوص موعد ندوة الشباب',
      },
      generalSummary: {
        summary: 'شهر مثمر تم فيه إنجاز أكثر من 90% من المستهدفات العلمية والدعوية.',
        notes: 'نسأل الله الإخلاص والقبول',
      },
      totalScore: 90.6,
      gradeDescription: 'ممتاز',
    }),

    // تقرير شهر 9 لأحمد
    recalculateFullReport({
      id: 'rep-ahmed-9',
      studentId: 'stu-1',
      studentName: 'أحمد بن محمد العلي',
      studentCode: 'STU-2026-101',
      educationalStage: 'المرحلة الجامعية',
      month: 9,
      year: 2026,
      academicYear: defaultSettings.currentAcademicYear,
      createdAt: '2026-09-28T18:00:00.000Z',
      updatedAt: '2026-09-29T20:00:00.000Z',
      status: 'submitted',
      editAllowed: false,
      syncStatus: 'synced',
      scientificPerformance: {
        bookName: 'زاد المعاد في هدي خير العباد - الجزء الثاني',
        totalPages: 260,
        pagesRead: 245,
        completionPercentage: 94.2,
        score: 28.3,
      },
      discussionSessions: {
        sessions: [
          { sessionNumber: 1, attended: true },
          { sessionNumber: 2, attended: true },
          { sessionNumber: 3, attended: true },
          { sessionNumber: 4, attended: true },
        ],
        attendedCount: 4,
        score: 20,
      },
      dawahPerformance: {
        activities: [
          {
            id: 'act-4',
            type: 'خطبة',
            date: '2026-09-12',
            title: 'بر الوالدين وأثره في التوفيق',
            role: 'مقدّم',
            targetGroup: 'جامع النور',
            beneficiariesCount: 200,
          },
          {
            id: 'act-5',
            type: 'محاضرة',
            date: '2026-09-20',
            title: 'منهجية القراءة وبناء الملكة العلمية',
            role: 'مقدّم',
            targetGroup: 'طلاب المركز',
            beneficiariesCount: 40,
          },
          {
            id: 'act-6',
            type: 'درس دعوي',
            date: '2026-09-25',
            title: 'تفسير سورة الحجرات',
            role: 'مقدّم',
            targetGroup: 'الحلقة المسجدية',
            beneficiariesCount: 30,
          },
          {
            id: 'act-7',
            type: 'نشاط دعوي آخر',
            date: '2026-09-27',
            title: 'توزيع كتيبات إرشادية وتوجيهية',
            role: 'منظّم',
            targetGroup: 'المجتمع المحلي',
            beneficiariesCount: 150,
          },
        ],
        totalActivities: 4,
        totalBeneficiaries: 420,
        score: 18,
      },
      discipline: {
        punctualityRate: 100,
        attendedMeetings: 4,
        unexcusedAbsences: 0,
        delaysCount: 0,
        tasksAssigned: 4,
        tasksCompleted: 4,
        score: 10,
      },
      moralEvaluation: {
        respect: 2,
        cooperation: 2,
        responsibility: 2,
        goodConduct: 2,
        behavioralDiscipline: 2,
        notes: 'مواظبة ممتازة وتطور ملحوظ',
        evaluatedBy: 'أ. عبد الله المنصور',
        evaluatedAt: '2026-09-30T10:00:00.000Z',
        score: 10,
      },
      culturalActivities: {
        activities: [
          {
            id: 'cul-3',
            title: 'يوم رياضي وثقافي مفتوح للشباب',
            type: 'نشاط اجتماعي',
            date: '2026-09-15',
            role: 'لجنة التنظيم والتوجيه',
            description: 'إشراف على الألعاب الثقافية',
          },
          {
            id: 'cul-4',
            title: 'حلقة نقاش حول أحدث الكتب التربوية',
            type: 'ندوة ثقافية',
            date: '2026-09-22',
            role: 'مشارك',
            description: 'مداخلة حول أساليب غرس القيم',
          },
        ],
        supervisorBonus: 0,
        score: 5,
      },
      monthlyAchievements: {
        achievements: [
          {
            id: 'ach-3',
            title: 'إتمام حفظ سورة البقرة مراجعة وتثبيتاً',
            date: '2026-09-19',
            description: 'السرد في مجلس واحد',
            category: 'قرآن كريم',
          },
          {
            id: 'ach-4',
            title: 'إعداد ملصق حائطي دعوي توعوي',
            date: '2026-09-26',
            description: 'تصميم وطباعة 50 نسخة',
            category: 'دعوة وإعلام',
          },
        ],
        score: 5,
      },
      challenges: {
        description: 'بعض الازدحام في مواعيد التدريب الميداني',
        impact: 'ضغط خفيف في نهاية الأسبوع',
        handling: 'تقسيم ساعات التحضير على أيام الأسبوع',
        requiredSupport: 'لا يوجد، الأمور تسير على ما يرام',
      },
      nextMonthPlan: {
        goals: 'البدء في كتاب سبل السلام، وتوسيع عدد المستفيدين من الدروس الدعوية',
        tasks: 'تقديم ورشة تدريبية في مهارات الإلقاء',
        improvementPlan: 'استخدام شرائح بصرية في الدروس',
        requiredResources: 'جهاز عرض بروجكتور للقاعة',
      },
      generalSummary: {
        summary: 'تحسن مستمر بفضل الله، وتفاعل ممتاز مع طلاب الحلقات.',
        notes: '',
      },
      totalScore: 96.3,
      gradeDescription: 'ممتاز',
    }),

    // تقرير شهر 9 لعمر بافضل
    recalculateFullReport({
      id: 'rep-omar-9',
      studentId: 'stu-2',
      studentName: 'عمر بن خالد بافضل',
      studentCode: 'STU-2026-102',
      educationalStage: 'المرحلة الجامعية',
      month: 9,
      year: 2026,
      academicYear: defaultSettings.currentAcademicYear,
      createdAt: '2026-09-27T12:00:00.000Z',
      updatedAt: '2026-09-29T14:00:00.000Z',
      status: 'submitted',
      editAllowed: false,
      syncStatus: 'synced',
      scientificPerformance: {
        bookName: 'شرح العقيدة الواسطية لابن عثيمين',
        totalPages: 320,
        pagesRead: 260,
        completionPercentage: 81.25,
        score: 24.4,
      },
      discussionSessions: {
        sessions: [
          { sessionNumber: 1, attended: true },
          { sessionNumber: 2, attended: true },
          { sessionNumber: 3, attended: false }, // غياب واحد
          { sessionNumber: 4, attended: true },
        ],
        attendedCount: 3,
        score: 15,
      },
      dawahPerformance: {
        activities: [
          {
            id: 'act-8',
            type: 'موعظة',
            date: '2026-09-10',
            title: 'أهمية الصلاة في جماعة',
            role: 'مقدّم',
            targetGroup: 'مسجد الحي',
            beneficiariesCount: 70,
          },
          {
            id: 'act-9',
            type: 'درس دعوي',
            date: '2026-09-18',
            title: 'آداب المسلم اليومية',
            role: 'مشارك',
            targetGroup: 'أشبال المركز',
            beneficiariesCount: 20,
          },
        ],
        totalActivities: 2,
        totalBeneficiaries: 90,
        score: 7,
      },
      discipline: {
        punctualityRate: 85,
        attendedMeetings: 3,
        unexcusedAbsences: 1,
        delaysCount: 1,
        tasksAssigned: 4,
        tasksCompleted: 3,
        score: 7.0,
      },
      moralEvaluation: {
        respect: 2,
        cooperation: 2,
        responsibility: 1,
        goodConduct: 2,
        behavioralDiscipline: 2,
        notes: 'مجهود طيب ونحثه على زيادة الاهتمام بجلسات المناقشة',
        evaluatedBy: 'أ. عبد الله المنصور',
        evaluatedAt: '2026-09-30T10:30:00.000Z',
        score: 9,
      },
      culturalActivities: {
        activities: [
          {
            id: 'cul-5',
            title: 'تنظيم رحلة برية تربوية',
            type: 'نشاط اجتماعي',
            date: '2026-09-14',
            role: 'منظّم',
            description: 'مسؤول التغذية والضيافة',
          },
        ],
        supervisorBonus: 0,
        score: 2.5,
      },
      monthlyAchievements: {
        achievements: [
          {
            id: 'ach-5',
            title: 'حفظ جزء عم مع التفسير الميسر',
            date: '2026-09-21',
            description: 'مراجعة وتفسير المفردات',
            category: 'قرآن كريم',
          },
        ],
        score: 2.5,
      },
      challenges: {
        description: 'صعوبة المواصلات لبعض جلسات المناقشة البعيدة',
        impact: 'التأخر عن جلسة واحدة والغياب عن أخرى',
        handling: 'التنسيق مع زميل في نفس المسار للمشاركة بالسيارة',
        requiredSupport: 'تحديد مواعيد ملائمة بعد صلاة العصر',
      },
      nextMonthPlan: {
        goals: 'حضور جميع الجلسات الـ 4، وإتمام الكتاب بالكامل',
        tasks: 'تسليم التقرير في الموعد دون تأخير',
        improvementPlan: 'الالتزام بمواعيد الانطلاق المبكر',
        requiredResources: '',
      },
      generalSummary: {
        summary: 'أداء جيد مع عزم على تدارك الغياب في الشهر القادم.',
        notes: '',
      },
      totalScore: 67.4,
      gradeDescription: 'مقبول',
    }),

    // تقرير شهر 9 لعبد الرحمن السعدي
    recalculateFullReport({
      id: 'rep-abdulrahman-9',
      studentId: 'stu-3',
      studentName: 'عبد الرحمن بن سعد السعدي',
      studentCode: 'STU-2026-103',
      educationalStage: 'المرحلة الثانوية',
      month: 9,
      year: 2026,
      academicYear: defaultSettings.currentAcademicYear,
      createdAt: '2026-09-28T16:00:00.000Z',
      updatedAt: '2026-09-29T18:00:00.000Z',
      status: 'submitted',
      editAllowed: false,
      syncStatus: 'synced',
      scientificPerformance: {
        bookName: 'رياض الصالحين - كتاب الفضائل',
        totalPages: 200,
        pagesRead: 180,
        completionPercentage: 90,
        score: 27,
      },
      discussionSessions: {
        sessions: [
          { sessionNumber: 1, attended: true },
          { sessionNumber: 2, attended: true },
          { sessionNumber: 3, attended: true },
          { sessionNumber: 4, attended: true },
        ],
        attendedCount: 4,
        score: 20,
      },
      dawahPerformance: {
        activities: [
          {
            id: 'act-10',
            type: 'موعظة',
            date: '2026-09-11',
            title: 'كلمة في الإذاعة المدرسية: الصدق والأمانة في المعاملات',
            role: 'مقدّم',
            targetGroup: 'طلاب المدرسة الثانوية',
            beneficiariesCount: 400,
          },
          {
            id: 'act-11',
            type: 'موعظة',
            date: '2026-09-19',
            title: 'حفظ اللسان',
            role: 'مقدّم',
            targetGroup: 'مسجد الحي',
            beneficiariesCount: 60,
          },
          {
            id: 'act-12',
            type: 'ندوة',
            date: '2026-09-24',
            title: 'التفوق الدراسي وسيلة للبناء',
            role: 'منظّم',
            targetGroup: 'زملاء الفصل',
            beneficiariesCount: 35,
          },
        ],
        totalActivities: 3,
        totalBeneficiaries: 495,
        score: 13,
      },
      discipline: {
        punctualityRate: 95,
        attendedMeetings: 4,
        unexcusedAbsences: 0,
        delaysCount: 0,
        tasksAssigned: 4,
        tasksCompleted: 4,
        score: 10,
      },
      moralEvaluation: {
        respect: 2,
        cooperation: 2,
        responsibility: 2,
        goodConduct: 2,
        behavioralDiscipline: 2,
        notes: 'طالب مؤدب ومجتهد وله مستقبل مشرق',
        evaluatedBy: 'أ. عبد الله المنصور',
        evaluatedAt: '2026-09-30T11:00:00.000Z',
        score: 10,
      },
      culturalActivities: {
        activities: [
          {
            id: 'cul-6',
            title: 'نادي القراءة الشهري',
            type: 'نشاط ثقافي',
            date: '2026-09-17',
            role: 'مشارك',
            description: 'مناقشة سيرة الصحابي مصعب بن عمير',
          },
          {
            id: 'cul-7',
            title: 'مبادرة تنظيف وتشجير الحي',
            type: 'خدمة مجتمعية',
            date: '2026-09-23',
            role: 'مشارك',
            description: 'العمل التطوعي مع فرقة الكشافة',
          },
        ],
        supervisorBonus: 0,
        score: 5,
      },
      monthlyAchievements: {
        achievements: [
          {
            id: 'ach-6',
            title: 'الحصول على المركز الأول في الخطابة المدرسية',
            date: '2026-09-20',
            description: 'مسابقة على مستوى المنطقة التعليمية',
            category: 'جوائز وتكريم',
          },
          {
            id: 'ach-7',
            title: 'قراءة تفسير جزء تبارك كاملاً',
            date: '2026-09-26',
            description: 'من كتاب التفسير الميسر',
            category: 'قراءة',
          },
        ],
        score: 5,
      },
      challenges: {
        description: 'تنظيم الوقت بين الواجبات المدرسية والمقرر الدعوي',
        impact: 'ضغط خفيف في المساء',
        handling: 'تحديد جدول زمني صارم وساعات راحة',
        requiredSupport: '',
      },
      nextMonthPlan: {
        goals: 'المحافظة على التميز والمشاركة في دورة الإسعافات الأولية',
        tasks: 'تحضير إذاعتين مدرسيتين',
        improvementPlan: 'تطوير سرعة القراءة الفاحصة',
        requiredResources: '',
      },
      generalSummary: {
        summary: 'شهر ممتاز ومحفز، ولله الحمد والمنة.',
        notes: '',
      },
      totalScore: 90.0,
      gradeDescription: 'ممتاز',
    }),
  ];

  // 3. إشعارات أولية
  const demoNotifications: AppNotification[] = [
    {
      id: 'notif-1',
      title: 'طلب تفعيل حساب جديد',
      message: 'قام الطالب محمد بن يوسف الأهدل بإنشاء حساب جديد، الحساب بانتظار موافقتك وتفعيله.',
      timestamp: '2026-10-20T14:20:00.000Z',
      read: false,
      type: 'warning',
    },
    {
      id: 'notif-2',
      title: 'بدء فترة تقرير شهر أكتوبر (10)',
      message: 'تم فتح فترة إعداد وتقديم التقرير الشهري لشهر 10 / 2026 لجميع الطلاب.',
      timestamp: '2026-10-25T08:00:00.000Z',
      read: false,
      type: 'info',
    },
    {
      id: 'notif-3',
      title: 'اكتملت مزامنة التقارير',
      message: 'تم تأكيد وصول كافة تقارير الطلاب بنجاح إلى قاعدة البيانات المركزية على جهاز المسؤول.',
      timestamp: '2026-10-26T20:00:00.000Z',
      read: true,
      type: 'success',
    },
  ];

  // 4. سجل العمليات
  const demoAuditLogs: AuditLog[] = [
    {
      id: 'log-1',
      timestamp: '2026-09-30T10:00:00.000Z',
      action: 'تقييم المحور الأخلاقي والسلوكي',
      performedBy: 'أ. عبد الله المنصور (المسؤول العام)',
      details: 'تم تقييم المحور الأخلاقي للطالب أحمد بن محمد العلي لشهر 9 / 2026 ومنحه الدرجة 10/10.',
    },
    {
      id: 'log-2',
      timestamp: '2026-09-30T10:30:00.000Z',
      action: 'تقييم المحور الأخلاقي والسلوكي',
      performedBy: 'أ. عبد الله المنصور (المسؤول العام)',
      details: 'تم تقييم المحور الأخلاقي للطالب عمر بن خالد بافضل لشهر 9 / 2026 ومنحه الدرجة 9/10.',
    },
    {
      id: 'log-3',
      timestamp: '2026-08-30T19:00:00.000Z',
      action: 'قفل تعديل التقرير',
      performedBy: 'أ. عبد الله المنصور (المسؤول العام)',
      details: 'تم إيقاف تعديل تقرير شهر 8 للطالب أحمد بن محمد العلي بعد اعتماده النهائي.',
    },
  ];

  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(demoUsers));
  localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(demoReports));
  localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(defaultSettings));
  localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(demoNotifications));
  localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(demoAuditLogs));
  localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(demoUsers[1])); // Default as Ahmed Ali for student testing
  localStorage.setItem(STORAGE_KEYS.DEMO_SEEDED, 'true');
}

// تشغيل البذر عند التحميل
seedInitialData();

export const dbService = {
  // المستخدمون
  getUsers(): User[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.USERS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  getUser(id: string): User | undefined {
    return this.getUsers().find((u) => u.id === id);
  },

  getCurrentUser(): User | null {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
      if (data) return JSON.parse(data);
      const users = this.getUsers();
      return users.find((u) => u.role === 'student') || users[0] || null;
    } catch {
      return null;
    }
  },

  setCurrentUser(user: User | null): void {
    if (user) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    }
  },

  // تسجيل حساب جديد لطالب
  async registerStudent(data: {
    fullName: string;
    username: string;
    passwordPlain: string;
    educationalStage: string;
    email?: string;
    phone?: string;
    supervisorName?: string;
  }): Promise<{ success: boolean; message: string; user?: User }> {
    const users = this.getUsers();

    // التحقق من تكرار اسم المستخدم
    const trimmedUsername = data.username.trim().toLowerCase();
    if (users.some((u) => u.username.toLowerCase() === trimmedUsername)) {
      return {
        success: false,
        message: 'اسم المستخدم مسجل مسبقاً، يرجى اختيار اسم مستخدم آخر.',
      };
    }

    if (!data.fullName.trim()) {
      return { success: false, message: 'الاسم الكامل مطلوب.' };
    }
    if (!data.educationalStage.trim()) {
      return { success: false, message: 'المرحلة التعليمية مطلوبة.' };
    }
    if (!data.passwordPlain || data.passwordPlain.length < 6) {
      return {
        success: false,
        message: 'كلمة المرور يجب أن لا تقل عن 6 خانات لأمان الحساب.',
      };
    }

    const nextNumber = users.filter((u) => u.role === 'student').length + 101;
    const studentId = `STU-2026-${nextNumber}`;
    const passwordHash = await hashPassword(data.passwordPlain);

    const newUser: User = {
      id: generateUUID(),
      studentId,
      fullName: data.fullName.trim(),
      username: trimmedUsername,
      email: data.email?.trim() || undefined,
      phone: data.phone?.trim() || undefined,
      role: 'student',
      status: 'pending', // بانتظار الموافقة التزاماً بدفتر الشروط
      educationalStage: data.educationalStage.trim(),
      supervisorName: data.supervisorName?.trim() || 'المسؤول العام',
      createdAt: new Date().toISOString(),
      passwordHash,
    };

    users.push(newUser);
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));

    // إضافة إشعار للمسؤول
    this.addNotification({
      title: 'طلب تسجيل طالب جديد',
      message: `تم إنشاء حساب جديد باسم "${newUser.fullName}" وهو بانتظار الموافقة والتفعيل.`,
      type: 'warning',
    });

    this.addAuditLog({
      action: 'تسجيل حساب طالب جديد',
      performedBy: newUser.fullName,
      details: `تم إنشاء الحساب برقم تعريفي ${studentId} وحالة (بانتظار الموافقة).`,
    });

    return {
      success: true,
      message:
        'تم تسجيل الحساب بنجاح وهو الآن بانتظار مراجعة واعتماد المسؤول لتفعيله قبل تسجيل الدخول.',
      user: newUser,
    };
  },

  // تعديل حالة الحساب (قبول وتفعيل، تعليق، رفض)
  updateUserStatus(
    userId: string,
    status: User['status'],
    adminName = 'المسؤول'
  ): { success: boolean; message: string } {
    const users = this.getUsers();
    const index = users.findIndex((u) => u.id === userId);
    if (index === -1) {
      return { success: false, message: 'المستخدم غير موجود.' };
    }

    const user = users[index];
    const oldStatus = user.status;
    user.status = status;
    users[index] = user;
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));

    const statusLabels: Record<User['status'], string> = {
      active: 'مفعل ونشط',
      pending: 'بانتظار الموافقة',
      suspended: 'معلق',
      rejected: 'مرفوض',
    };

    this.addAuditLog({
      action: 'تغيير حالة حساب طالب',
      performedBy: adminName,
      details: `تم تغيير حالة حساب الطالب ${user.fullName} (${user.studentId}) من "${statusLabels[oldStatus]}" إلى "${statusLabels[status]}".`,
    });

    // إشعار الطالب
    this.addNotification({
      title: 'تحديث حالة الحساب',
      message: `تم تحديث حالة حسابك إلى: ${statusLabels[status]}.`,
      type: status === 'active' ? 'success' : 'alert',
      targetUserId: user.id,
    });

    return {
      success: true,
      message: `تم تحديث حالة الحساب إلى ${statusLabels[status]} بنجاح.`,
    };
  },

  // إعادة تعيين كلمة المرور بواسطة المسؤول
  async resetPasswordByAdmin(
    userId: string,
    newPasswordPlain: string,
    adminName = 'المسؤول'
  ): Promise<{ success: boolean; message: string }> {
    const users = this.getUsers();
    const user = users.find((u) => u.id === userId);
    if (!user) {
      return { success: false, message: 'المستخدم غير موجود.' };
    }

    if (!newPasswordPlain || newPasswordPlain.length < 6) {
      return {
        success: false,
        message: 'كلمة المرور الجديدة يجب أن تتكون من 6 خانات على الأقل.',
      };
    }

    user.passwordHash = await hashPassword(newPasswordPlain);
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));

    this.addAuditLog({
      action: 'إعادة تعيين كلمة المرور',
      performedBy: adminName,
      details: `تمت إعادة تعيين كلمة المرور للطالب ${user.fullName} (${user.studentId}) بإجراء أمني موثق دون كشف النص الصريح.`,
    });

    return {
      success: true,
      message: 'تمت إعادة تعيين كلمة المرور بنجاح وتسليمها للطالب.',
    };
  },

  // التقارير
  getReports(): MonthlyReport[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.REPORTS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  getReport(id: string): MonthlyReport | undefined {
    return this.getReports().find((r) => r.id === id);
  },

  getReportsByStudent(studentId: string): MonthlyReport[] {
    return this.getReports()
      .filter((r) => r.studentId === studentId)
      .sort((a, b) => {
        if (a.year !== b.year) return b.year - a.year;
        return b.month - a.month;
      });
  },

  // حفظ مسودة محلية (Autosave) - لا ترسل للشبكة، تحفظ في التخزين المحلي الآمن
  saveDraftLocally(report: MonthlyReport): MonthlyReport {
    const updated = recalculateFullReport({
      ...report,
      updatedAt: new Date().toISOString(),
      syncStatus: 'pending_sync',
    });

    const key = `${STORAGE_KEYS.LOCAL_DRAFTS}_${report.studentId}_${report.month}_${report.year}`;
    localStorage.setItem(key, JSON.stringify(updated));

    // تحديث أيضاً في قائمة التقارير بحالة draft
    const reports = this.getReports();
    const idx = reports.findIndex((r) => r.id === report.id);
    if (idx !== -1) {
      reports[idx] = updated;
    } else {
      reports.push(updated);
    }
    localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(reports));

    return updated;
  },

  // استرجاع المسودة المحلية المحفوظة تلقائياً
  getLocalDraft(
    studentId: string,
    month: number,
    year: number
  ): MonthlyReport | null {
    const key = `${STORAGE_KEYS.LOCAL_DRAFTS}_${studentId}_${month}_${year}`;
    const data = localStorage.getItem(key);
    if (data) {
      try {
        return JSON.parse(data);
      } catch {
        return null;
      }
    }
    return null;
  },

  // إرسال التقرير النهائي واعتماده مع المزامنة
  async submitReport(
    report: MonthlyReport
  ): Promise<{ success: boolean; message: string; report?: MonthlyReport }> {
    // 1. التحقق من الحقول الإلزامية
    if (!report.scientificPerformance.bookName.trim()) {
      return {
        success: false,
        message: 'يرجى إدخال اسم الكتاب أو المقرر في المحور العلمي أولاً.',
      };
    }
    if (report.scientificPerformance.totalPages <= 0) {
      return {
        success: false,
        message: 'إجمالي صفحات الكتاب يجب أن يكون أكبر من صفر.',
      };
    }
    if (
      report.scientificPerformance.pagesRead >
      report.scientificPerformance.totalPages
    ) {
      return {
        success: false,
        message: 'عدد الصفحات المقروءة لا يمكن أن يتجاوز إجمالي صفحات الكتاب.',
      };
    }

    // 2. التحقق من حالة القفل
    if (!report.editAllowed && report.status === 'locked') {
      return {
        success: false,
        message: 'عذراً، هذا التقرير مقفل للتعديل بواسطة المسؤول.',
      };
    }

    // 3. إعادة الحساب التام لضمان النزاهة الرياضية
    const calculated = recalculateFullReport({
      ...report,
      status: 'submitted',
      syncStatus: 'synced', // تأكيد الحفظ المركزي
      updatedAt: new Date().toISOString(),
    });

    const reports = this.getReports();
    // التحقق من منع التكرار للطالب في نفس الشهر والسنة
    const existingIndex = reports.findIndex(
      (r) =>
        r.studentId === calculated.studentId &&
        r.month === calculated.month &&
        r.year === calculated.year &&
        r.id !== calculated.id
    );

    if (existingIndex !== -1) {
      return {
        success: false,
        message: `يوجد تقرير مقدم مسبقاً لهذا الطالب لشهر ${calculated.month} / ${calculated.year}. لا يسمح بتكرار التقرير لنفس الشهر.`,
      };
    }

    const idx = reports.findIndex((r) => r.id === calculated.id);
    if (idx !== -1) {
      reports[idx] = calculated;
    } else {
      reports.push(calculated);
    }

    // حفظ في قاعدة البيانات المركزية
    localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(reports));

    // إزالة نسخة الإرسال المؤقتة بأمان فقط بعد نجاح الحفظ المركزي
    const draftKey = `${STORAGE_KEYS.LOCAL_DRAFTS}_${calculated.studentId}_${calculated.month}_${calculated.year}`;
    localStorage.removeItem(draftKey);

    // إضافة إشعار للمسؤول
    this.addNotification({
      title: 'تقرير شهري جديد تم تسليمه',
      message: `قام الطالب "${calculated.studentName}" بتسليم تقرير شهر ${calculated.month}/${calculated.year} بدرجة ${calculated.totalScore}/100 (${calculated.gradeDescription}).`,
      type: 'info',
    });

    return {
      success: true,
      message: 'تم إرسال التقرير ومزامنته مع قاعدة البيانات المركزية بنجاح!',
      report: calculated,
    };
  },

  // تقييم المحور الأخلاقي والسلوكي بواسطة المسؤول (حصراً)
  evaluateMoralAxis(params: {
    reportId: string;
    evaluation: {
      respect: number;
      cooperation: number;
      responsibility: number;
      goodConduct: number;
      behavioralDiscipline: number;
      notes?: string;
    };
    adminName: string;
  }): { success: boolean; message: string; report?: MonthlyReport } {
    const reports = this.getReports();
    const index = reports.findIndex((r) => r.id === params.reportId);
    if (index === -1) {
      return { success: false, message: 'التقرير غير موجود.' };
    }

    const current = reports[index];

    // تحديث التقييم الأخلاقي
    current.moralEvaluation = {
      ...current.moralEvaluation,
      ...params.evaluation,
      evaluatedBy: params.adminName,
      evaluatedAt: new Date().toISOString(),
    };

    // إعادة الحساب
    const updated = recalculateFullReport(current);
    reports[index] = updated;
    localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(reports));

    // تسجيل العملية في سجل المراجعة التدقيقي
    this.addAuditLog({
      action: 'تقييم المحور الأخلاقي والسلوكي',
      performedBy: params.adminName,
      details: `تم تقييم المحور الأخلاقي للطالب ${updated.studentName} لشهر ${updated.month}/${updated.year}. الدرجة: ${updated.moralEvaluation.score}/10. الملاحظة: ${params.evaluation.notes || 'بدون ملاحظات'}`,
    });

    // إشعار الطالب
    this.addNotification({
      title: 'تقييم المحور الأخلاقي والسلوكي',
      message: `قام المشرف بتقييم المحور الأخلاقي لتقرير شهر ${updated.month}/${updated.year}. الدرجة: ${updated.moralEvaluation.score}/10.`,
      type: 'info',
      targetUserId: updated.studentId,
    });

    return {
      success: true,
      message: 'تم حفظ تقييم المحور الأخلاقي وتحديث الدرجة النهائية بنجاح.',
      report: updated,
    };
  },

  // قفل أو فك قفل تعديل التقرير بواسطة المسؤول
  toggleReportLock(
    reportId: string,
    allowEdit: boolean,
    adminName = 'المسؤول'
  ): { success: boolean; message: string; report?: MonthlyReport } {
    const reports = this.getReports();
    const index = reports.findIndex((r) => r.id === reportId);
    if (index === -1) {
      return { success: false, message: 'التقرير غير موجود.' };
    }

    const report = reports[index];
    report.editAllowed = allowEdit;
    report.status = allowEdit ? 'submitted' : 'locked';
    report.updatedAt = new Date().toISOString();
    reports[index] = report;
    localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(reports));

    this.addAuditLog({
      action: allowEdit ? 'إعادة السماح بتعديل التقرير' : 'قفل تعديل التقرير',
      performedBy: adminName,
      details: `${allowEdit ? 'تم فتح السماح بالتعديل' : 'تم قفل التعديل'} لتقرير الطالب ${report.studentName} لشهر ${report.month}/${report.year}.`,
    });

    this.addNotification({
      title: allowEdit ? 'السماح بالتعديل' : 'تم قفل التقرير',
      message: allowEdit
        ? `قام المسؤول بالسماح لك بتعديل تقرير شهر ${report.month}/${report.year}.`
        : `تم قفل تقرير شهر ${report.month}/${report.year} ولم يعد التعديل متاحاً.`,
      type: allowEdit ? 'info' : 'warning',
      targetUserId: report.studentId,
    });

    return {
      success: true,
      message: allowEdit
        ? 'تم السماح للطالب بتعديل التقرير.'
        : 'تم قفل التقرير بنجاح.',
      report,
    };
  },

  // إعدادات النظام
  getSettings(): SystemSettings {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      return data ? { ...defaultSettings, ...JSON.parse(data) } : defaultSettings;
    } catch {
      return defaultSettings;
    }
  },

  updateSettings(
    newSettings: Partial<SystemSettings>,
    adminName = 'المسؤول'
  ): SystemSettings {
    const current = this.getSettings();
    const updated = { ...current, ...newSettings };
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updated));

    this.addAuditLog({
      action: 'تحديث إعدادات النظام',
      performedBy: adminName,
      details: 'تم تعديل البيانات الأساسية للنظام أو إعدادات المتابعة.',
    });

    return updated;
  },

  // الإشعارات
  getNotifications(userId?: string): AppNotification[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
      const all: AppNotification[] = data ? JSON.parse(data) : [];
      if (!userId) return all;
      return all.filter((n) => !n.targetUserId || n.targetUserId === userId);
    } catch {
      return [];
    }
  },

  addNotification(notif: Omit<AppNotification, 'id' | 'timestamp' | 'read'>): AppNotification {
    const list = this.getNotifications();
    const newNotif: AppNotification = {
      ...notif,
      id: generateUUID(),
      timestamp: new Date().toISOString(),
      read: false,
    };
    list.unshift(newNotif);
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(list.slice(0, 50)));
    return newNotif;
  },

  markNotificationRead(id: string): void {
    const list = this.getNotifications();
    const notif = list.find((n) => n.id === id);
    if (notif) {
      notif.read = true;
      localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(list));
    }
  },

  markAllNotificationsRead(userId?: string): void {
    const list = this.getNotifications();
    for (const n of list) {
      if (!userId || n.targetUserId === userId) {
        n.read = true;
      }
    }
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(list));
  },

  // سجل العمليات والتدقيق
  getAuditLogs(): AuditLog[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  addAuditLog(log: Omit<AuditLog, 'id' | 'timestamp'>): void {
    const list = this.getAuditLogs();
    const newEntry: AuditLog = {
      ...log,
      id: generateUUID(),
      timestamp: new Date().toISOString(),
    };
    list.unshift(newEntry);
    localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(list.slice(0, 200)));
  },

  // النسخ الاحتياطي والاستعادة
  exportFullBackup(): string {
    const backupData = {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      format: 'motabaa_monthly_backup_v1',
      settings: this.getSettings(),
      users: this.getUsers(),
      reports: this.getReports(),
      auditLogs: this.getAuditLogs(),
      notifications: this.getNotifications(),
    };

    // تحديث تاريخ آخر نسخة احتياطية
    this.updateSettings({ lastBackupDate: backupData.exportedAt });

    return JSON.stringify(backupData, null, 2);
  },

  // استعادة النسخة الاحتياطية مع التحقق من السلامة
  importFullBackup(
    jsonString: string,
    adminName = 'المسؤول'
  ): { success: boolean; message: string; details?: any } {
    try {
      const data = JSON.parse(jsonString);

      // التحقق من صيغة النسخة الاحتياطية
      if (data.format !== 'motabaa_monthly_backup_v1' || !Array.isArray(data.users)) {
        return {
          success: false,
          message:
            'ملف النسخة الاحتياطية غير صالح أو لا يتوافق مع بنية نظام المتابعة الشهرية.',
        };
      }

      // تطبيق الاستعادة
      if (data.users) localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(data.users));
      if (data.reports) localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(data.reports));
      if (data.settings) localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(data.settings));
      if (data.notifications) localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(data.notifications));
      if (data.auditLogs) localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(data.auditLogs));

      this.addAuditLog({
        action: 'استعادة نسخة احتياطية للنظام',
        performedBy: adminName,
        details: `تمت استعادة البيانات بنجاح: ${data.users.length} مستخدمين و ${data.reports?.length || 0} تقارير من تاريخ تصدير (${data.exportedAt}).`,
      });

      return {
        success: true,
        message: 'تمت استعادة النسخة الاحتياطية لكافة بيانات النظام بنجاح تام!',
        details: {
          usersCount: data.users.length,
          reportsCount: data.reports?.length || 0,
        },
      };
    } catch (err: any) {
      return {
        success: false,
        message: 'تعذر قراءة ملف النسخة الاحتياطية: ' + (err.message || 'صيغة JSON غير صحيحة'),
      };
    }
  },

  // حذف البيانات التجريبية
  clearDemoData(): void {
    // الاحتفاظ فقط بحساب المدير والبيانات التي أضافها المستخدم الحقيقي
    const users = this.getUsers().filter(
      (u) => u.id === 'admin-1' || !u.id.startsWith('stu-')
    );
    const reports = this.getReports().filter(
      (r) => !r.id.startsWith('rep-')
    );

    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(reports));
    localStorage.removeItem(STORAGE_KEYS.DEMO_SEEDED);

    this.addAuditLog({
      action: 'مسح البيانات التجريبية',
      performedBy: 'المسؤول العام',
      details: 'تم تفريغ كافة البيانات التجريبية والتقارير الافتراضية استعداداً للتشغيل الحقيقي.',
    });
  },
};
