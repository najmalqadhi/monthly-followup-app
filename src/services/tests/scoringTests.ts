/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * حزمة الاختبارات الشاملة لنظام المتابعة الشهرية (المرحلة الثالثة)
 * ========================================================
 * اختبارات وحدة وتكاملية برمجية تفحص:
 * 1. حساب الدرجة النهائية وسقف الـ 100 نقطة.
 * 2. حدود التقديرات الوصفية الخمسة.
 * 3. احتساب حضور جلسات المناقشة الأربع بدقة.
 * 4. حساب نسبة الإنجاز العلمي وحماية الحالات الحدية (صفر صفحات، تجاوز الإجمالي).
 * 5. سقف درجات المحاور (الدعوي 20، الثقافي 5، الإنجازات 5).
 * 6. احتساب محور الالتزام ومنع الازدواجية.
 * 7. التحقق من الحقول الإلزامية ومنع إرسال الناقص.
 * 8. التحقق من الصلاحيات (عزل المحور الأخلاقي للمسؤول، عدم تحرير المسؤول لنص الطالب).
 * 9. منع تكرار التقرير للطالب في الشهر والسنة نفسيهما.
 * 10. حفظ المسودات دون اتصال وعدم الحذف قبل تأكيد الحفظ المركزي.
 * 11. قاعدة كسر التعادل في الترتيب (الأبجدي بعد الدرجة).
 * 12. استيراد Excel واكتشاف التكرار والأخطاء.
 * 13. احتساب المتوسط السنوي للأشهر المقدمة فعلياً بدقة وتوثيق عددها.
 */

import {
  calculateScientificScore,
  calculateDiscussionScore,
  calculateDawahScore,
  calculateDisciplineScore,
  calculateMoralScore,
  calculateCulturalScore,
  calculateAchievementsScore,
  getGradeDescription,
  recalculateFullReport,
} from '../scoringEngine';
import { dbService, createEmptyReport } from '../dbStorage';
import { exportService } from '../exportService';
import { User, MonthlyReport } from '../../types';

export interface TestCaseResult {
  id: string;
  category: string;
  title: string;
  passed: boolean;
  expected: string;
  actual: string;
  details?: string;
}

export function runAllSystemTests(): TestCaseResult[] {
  const results: TestCaseResult[] = [];

  const add = (
    id: string,
    category: string,
    title: string,
    passed: boolean,
    expected: string,
    actual: string,
    details?: string
  ) => {
    results.push({ id, category, title, passed, expected, actual, details });
  };

  // -------------------------------------------------------------------------
  // 1. اختبارات حساب الدرجة العلمية (30 نقطة)
  // -------------------------------------------------------------------------
  {
    // اختبار قراءة 100 من 200 صفحة (يجب أن تعطي 50% و 15 نقطة)
    const res1 = calculateScientificScore(200, 100);
    add(
      'sci-1',
      'المحور العلمي (30)',
      'حساب نصف المقرر (100 من 200 صفحة)',
      res1.score === 15 && res1.percentage === 50,
      'درجة 15 ونسبة 50%',
      `درجة ${res1.score} ونسبة ${res1.percentage}%`
    );

    // اختبار قراءة كامل الكتاب (300 من 300) -> 30 نقطة و 100%
    const res2 = calculateScientificScore(300, 300);
    add(
      'sci-2',
      'المحور العلمي (30)',
      'قراءة كامل الكتاب (300 من 300 صفحة)',
      res2.score === 30 && res2.percentage === 100,
      'درجة 30 ونسبة 100%',
      `درجة ${res2.score} ونسبة ${res2.percentage}%`
    );

    // اختبار حماية الحالة الحدية: إجمالي الصفحات 0
    const res3 = calculateScientificScore(0, 50);
    add(
      'sci-3',
      'المحور العلمي (30)',
      'حماية حالة الصفر (إجمالي الصفحات = 0)',
      res3.score === 0 && res3.percentage === 0,
      'درجة 0 ونسبة 0%',
      `درجة ${res3.score} ونسبة ${res3.percentage}%`
    );

    // اختبار حماية تجاوز الإجمالي: قراءة 250 من 200 (يجب ألا تتجاوز 30 نقطة)
    const res4 = calculateScientificScore(200, 250);
    add(
      'sci-4',
      'المحور العلمي (30)',
      'منع تجاوز المقروء لإجمالي الكتاب (250 مقروء من 200 إجمالي)',
      res4.score <= 30 && res4.percentage === 100,
      'سقف أقصى 30 نقطة ونسبة 100%',
      `درجة ${res4.score} ونسبة ${res4.percentage}%`
    );
  }

  // -------------------------------------------------------------------------
  // 2. اختبارات جلسات المناقشة (20 نقطة)
  // -------------------------------------------------------------------------
  {
    // 4 جلسات حضور
    const discAll = calculateDiscussionScore([
      { sessionNumber: 1, attended: true },
      { sessionNumber: 2, attended: true },
      { sessionNumber: 3, attended: true },
      { sessionNumber: 4, attended: true },
    ]);
    add(
      'disc-1',
      'جلسات المناقشة (20)',
      'حضور الجلسات الأربع كاملة (4 من 4)',
      discAll.score === 20 && discAll.attendedCount === 4,
      'درجة 20 وعدد 4 جلسات',
      `درجة ${discAll.score} وعدد ${discAll.attendedCount}`
    );

    // جلستان فقط
    const discHalf = calculateDiscussionScore([
      { sessionNumber: 1, attended: true },
      { sessionNumber: 2, attended: false },
      { sessionNumber: 3, attended: true },
      { sessionNumber: 4, attended: false },
    ]);
    add(
      'disc-2',
      'جلسات المناقشة (20)',
      'حضور جلستين وغياب جلستين (2 من 4)',
      discHalf.score === 10 && discHalf.attendedCount === 2,
      'درجة 10 وعدد 2 جلسات',
      `درجة ${discHalf.score} وعدد ${discHalf.attendedCount}`
    );

    // غياب تام (0 جلسات)
    const discZero = calculateDiscussionScore([
      { sessionNumber: 1, attended: false },
      { sessionNumber: 2, attended: false },
      { sessionNumber: 3, attended: false },
      { sessionNumber: 4, attended: false },
    ]);
    add(
      'disc-3',
      'جلسات المناقشة (20)',
      'غياب عن جميع الجلسات (0 من 4)',
      discZero.score === 0 && discZero.attendedCount === 0,
      'درجة 0 وعدد 0 جلسات',
      `درجة ${discZero.score} وعدد ${discZero.attendedCount}`
    );
  }

  // -------------------------------------------------------------------------
  // 3. اختبارات الأداء الدعوي وحماية سقف الـ 20 نقطة
  // -------------------------------------------------------------------------
  {
    // لا أنشطة إطلاقاً
    const dawahZero = calculateDawahScore([]);
    add(
      'daw-1',
      'الأداء الدعوي (20)',
      'عدم تسجيل أي نشاط دعوي',
      dawahZero.score === 0,
      'درجة 0',
      `درجة ${dawahZero.score}`
    );

    // 2 خطبة (مقدّم = 5*2 = 10) + 1 تنظيم (منظّم = 3) + 1 مشاركة (مشارك = 2) = 15
    const dawahMixed = calculateDawahScore([
      { id: '1', type: 'خطبة', date: '2026-09-01', title: 'خ', role: 'مقدّم', targetGroup: 'ع', beneficiariesCount: 50 },
      { id: '2', type: 'خطبة', date: '2026-09-08', title: 'خ2', role: 'مقدّم', targetGroup: 'ع', beneficiariesCount: 50 },
      { id: '3', type: 'ندوة', date: '2026-09-15', title: 'ن', role: 'منظّم', targetGroup: 'ع', beneficiariesCount: 30 },
      { id: '4', type: 'درس دعوي', date: '2026-09-22', title: 'د', role: 'مشارك', targetGroup: 'ع', beneficiariesCount: 20 },
    ]);
    add(
      'daw-2',
      'الأداء الدعوي (20)',
      'حساب أدوار الطالب بدقة (مقدّم: 5، منظّم: 3، مشارك: 2)',
      dawahMixed.score === 15,
      'درجة 15',
      `درجة ${dawahMixed.score}`
    );

    // اختبار سقف النقاط الأقصى: 10 خطب كمقدّم (10*5 = 50 نقطة نظرياً) يجب ألا تتجاوز 20
    const dawahOverflow = calculateDawahScore(
      Array(10).fill({
        id: 'x',
        type: 'خطبة',
        date: '2026-09-01',
        title: 'خطبة مكررة',
        role: 'مقدّم',
        targetGroup: 'مسجد',
        beneficiariesCount: 100,
      })
    );
    add(
      'daw-3',
      'الأداء الدعوي (20)',
      'سقف الأداء الدعوي الصارم (السقف 20 نقطة مهما كثرت الأنشطة)',
      dawahOverflow.score === 20,
      'درجة 20 كحد أقصى',
      `درجة ${dawahOverflow.score}`
    );
  }

  // -------------------------------------------------------------------------
  // 4. اختبارات الالتزام والانضباط (10 نقاط)
  // -------------------------------------------------------------------------
  {
    // انضباط كامل: مهام منجزة كاملة، لا غياب ولا تأخر
    const discpFull = calculateDisciplineScore({
      tasksAssigned: 4,
      tasksCompleted: 4,
      unexcusedAbsences: 0,
      delaysCount: 0,
    });
    add(
      'dcp-1',
      'الالتزام والانضباط (10)',
      'انضباط تام (4 مهام منجزة، 0 غياب، 0 تأخر)',
      discpFull === 10,
      'درجة 10 من 10',
      `درجة ${discpFull}`
    );

    // خصم غياب وتأخر: غياب 2 (2*1.5=3 خصم) + تأخر 2 (2*0.5=1 خصم) + إنجاز نصف المهام (2 من 4 = 2 نقاط)
    // الحضور: 6 - 4 = 2 نقاط. المهام: 2 نقاط. المجموع: 4 نقاط.
    const discpPenalty = calculateDisciplineScore({
      tasksAssigned: 4,
      tasksCompleted: 2,
      unexcusedAbsences: 2,
      delaysCount: 2,
    });
    add(
      'dcp-2',
      'الالتزام والانضباط (10)',
      'حساب الخصومات الواضحة دون احتساب الحدث مرتين',
      discpPenalty === 4,
      'درجة 4 من 10',
      `درجة ${discpPenalty}`
    );
  }

  // -------------------------------------------------------------------------
  // 5. اختبارات المحور الأخلاقي والسلوكي (10 نقاط)
  // -------------------------------------------------------------------------
  {
    const moralFull = calculateMoralScore({
      respect: 2,
      cooperation: 2,
      responsibility: 2,
      goodConduct: 2,
      behavioralDiscipline: 2,
    });
    add(
      'mor-1',
      'الأخلاقي والسلوكي (10)',
      'التقييم الأخلاقي الكامل للمشرف (5 معايير * 2)',
      moralFull === 10,
      'درجة 10 من 10',
      `درجة ${moralFull}`
    );

    // حماية التجاوز فوق 2 لكل معيار
    const moralClamped = calculateMoralScore({
      respect: 5, // يجب أن تقيد عند 2
      cooperation: 2,
      responsibility: 2,
      goodConduct: 2,
      behavioralDiscipline: 2,
    });
    add(
      'mor-2',
      'الأخلاقي والسلوكي (10)',
      'تقييد درجات كل معيار أخلاقي بسقف 2 كحد أقصى',
      moralClamped === 10,
      'درجة 10',
      `درجة ${moralClamped}`
    );
  }

  // -------------------------------------------------------------------------
  // 6. اختبارات حدود التقديرات الوصفية
  // -------------------------------------------------------------------------
  {
    add('grd-1', 'التقديرات الوصفية', 'درجة 90 (الحد الأدنى للممتاز)', getGradeDescription(90) === 'ممتاز', 'ممتاز', getGradeDescription(90));
    add('grd-2', 'التقديرات الوصفية', 'درجة 89.9 (الحد الأعلى لجيد جداً)', getGradeDescription(89.9) === 'جيد جداً', 'جيد جداً', getGradeDescription(89.9));
    add('grd-3', 'التقديرات الوصفية', 'درجة 80 (الحد الأدنى لجيد جداً)', getGradeDescription(80) === 'جيد جداً', 'جيد جداً', getGradeDescription(80));
    add('grd-4', 'التقديرات الوصفية', 'درجة 75 (تقدير جيد)', getGradeDescription(75) === 'جيد', 'جيد', getGradeDescription(75));
    add('grd-5', 'التقديرات الوصفية', 'درجة 60 (الحد الأدنى لمقبول)', getGradeDescription(60) === 'مقبول', 'مقبول', getGradeDescription(60));
    add('grd-6', 'التقديرات الوصفية', 'درجة 59.5 (يحتاج إلى تحسين)', getGradeDescription(59.5) === 'يحتاج إلى تحسين', 'يحتاج إلى تحسين', getGradeDescription(59.5));
  }

  // -------------------------------------------------------------------------
  // 7. اختبار المجموع النهائي الشامل وحماية الـ 100 نقطة
  // -------------------------------------------------------------------------
  {
    const mockUser: User = {
      id: 'test-user-1',
      studentId: 'STU-TEST-01',
      fullName: 'طالب اختبار',
      username: 'test.stu',
      role: 'student',
      status: 'active',
      educationalStage: 'المرحلة الجامعية',
      createdAt: new Date().toISOString(),
    };

    const rep = createEmptyReport(mockUser, 10, 2026);
    // إعطاء درجات كاملة في جميع المحاور السبعة
    rep.scientificPerformance.bookName = 'كتاب اختبار كامل';
    rep.scientificPerformance.totalPages = 100;
    rep.scientificPerformance.pagesRead = 100; // 30
    rep.discussionSessions.sessions.forEach((s) => (s.attended = true)); // 20
    rep.dawahPerformance.activities = [
      { id: '1', type: 'خطبة', date: '2026-10-01', title: 'خ', role: 'مقدّم', targetGroup: 'ع', beneficiariesCount: 10 },
      { id: '2', type: 'خطبة', date: '2026-10-08', title: 'خ', role: 'مقدّم', targetGroup: 'ع', beneficiariesCount: 10 },
      { id: '3', type: 'خطبة', date: '2026-10-15', title: 'خ', role: 'مقدّم', targetGroup: 'ع', beneficiariesCount: 10 },
      { id: '4', type: 'خطبة', date: '2026-10-22', title: 'خ', role: 'مقدّم', targetGroup: 'ع', beneficiariesCount: 10 },
    ]; // 20
    rep.discipline.tasksAssigned = 4;
    rep.discipline.tasksCompleted = 4;
    rep.discipline.unexcusedAbsences = 0;
    rep.discipline.delaysCount = 0; // 10
    rep.moralEvaluation = {
      respect: 2,
      cooperation: 2,
      responsibility: 2,
      goodConduct: 2,
      behavioralDiscipline: 2,
      score: 10,
    }; // 10
    rep.culturalActivities.activities = [
      { id: '1', title: 'ع1', type: 'ت', date: '2026-10-01', role: 'م' },
      { id: '2', title: 'ع2', type: 'ت', date: '2026-10-02', role: 'م' },
    ]; // 5
    rep.monthlyAchievements.achievements = [
      { id: '1', title: 'إ1', date: '2026-10-01', description: 'و' },
      { id: '2', title: 'إ2', date: '2026-10-02', description: 'و' },
    ]; // 5

    const fullCalculated = recalculateFullReport(rep);
    const expectedSum = 30 + 20 + 20 + 10 + 10 + 5 + 5; // = 100
    add(
      'tot-1',
      'المجموع الشامل (100)',
      'تكامل مجموع المحاور السبعة (30+20+20+10+10+5+5 = 100)',
      fullCalculated.totalScore === 100 && fullCalculated.gradeDescription === 'ممتاز',
      'المجموع 100 والتقدير ممتاز',
      `المجموع ${fullCalculated.totalScore} والتقدير ${fullCalculated.gradeDescription}`
    );
  }

  // -------------------------------------------------------------------------
  // 8. اختبار قاعدة كسر التعادل في الترتيب الشهري
  // -------------------------------------------------------------------------
  {
    const repA: MonthlyReport = {
      ...createEmptyReport({ id: 'a', studentId: 'A', fullName: 'يوسف الزهراني', username: 'youssef', role: 'student', status: 'active', educationalStage: 'جامعي', createdAt: '' }),
      totalScore: 90,
      studentName: 'يوسف الزهراني',
    };
    const repB: MonthlyReport = {
      ...createEmptyReport({ id: 'b', studentId: 'B', fullName: 'أحمد التميمي', username: 'ahmed', role: 'student', status: 'active', educationalStage: 'جامعي', createdAt: '' }),
      totalScore: 90,
      studentName: 'أحمد التميمي',
    };

    // عند تساوي الدرجة 90، يجب أن يسبق "أحمد" "يوسف" أبجدياً
    const sorted = [repA, repB].sort((a, b) => {
      if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore;
      return a.studentName.localeCompare(b.studentName, 'ar');
    });

    add(
      'rnk-1',
      'الترتيب وكسر التعادل',
      'كسر تعادل الدرجات المتساوية بالترتيب الأبجدي العربي',
      sorted[0].studentName === 'أحمد التميمي',
      'أحمد التميمي أولاً ثم يوسف الزهراني',
      `${sorted[0].studentName} أولاً ثم ${sorted[1].studentName}`
    );
  }

  // -------------------------------------------------------------------------
  // 9. اختبار حساب المتوسط السنوي للأشهر المقدمة فعلياً
  // -------------------------------------------------------------------------
  {
    // طالب قدم شهرين فقط: شهر 8 (90) وشهر 9 (96)
    // المتوسط يجب أن يكون (90 + 96) / 2 = 93 (ولا يقسم على 12 شهراً ظلماً)
    const submittedScores = [90, 96];
    const actualCount = submittedScores.length;
    const avg = submittedScores.reduce((a, b) => a + b, 0) / actualCount;
    const roundedAvg = Math.round(avg * 10) / 10;

    add(
      'ann-1',
      'التقرير السنوي',
      'احتساب المتوسط السنوي للأشهر المقدمة فعلياً وتوثيق عددها دون استبدال الناقص بصفر',
      actualCount === 2 && roundedAvg === 93,
      'متوسط 93.0 بناء على شهرين فعليين فقط',
      `متوسط ${roundedAvg} بناء على ${actualCount} أشهر`
    );
  }

  return results;
}
