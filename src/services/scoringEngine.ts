/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * محرك احتساب الدرجات لنظام المتابعة الشهرية
 * ========================================================
 * تم تصميم المعادلات لتكون قطعية، عادلة، خالية من الازدواجية،
 * ومطابقة تماماً لدفتر الشروط الرسمي (إجمالي 100 نقطة).
 */

import {
  MonthlyReport,
  GradeDescription,
  DawahActivity,
  DiscussionSession,
  MoralEvaluation,
  CulturalActivity,
  MonthlyAchievement,
} from '../types';

/**
 * 1. حساب درجة الأداء العلمي (30 نقطة)
 * -----------------------------------------------
 * المعادلة: (عدد الصفحات المقروءة / إجمالي صفحات الكتاب) * 30
 * الضوابط:
 * - التحقق من أن عدد الصفحات المقروءة لا يتجاوز الإجمالي (0 <= pagesRead <= totalPages).
 * - إذا كان إجمالي الصفحات 0 تكون الدرجة 0.
 * - السقف الأعلى 30 نقطة.
 */
export function calculateScientificScore(
  totalPages: number,
  pagesRead: number
): { score: number; percentage: number } {
  const validTotal = Math.max(0, Number(totalPages) || 0);
  const validRead = Math.max(0, Number(pagesRead) || 0);

  if (validTotal === 0 || validRead === 0) {
    return { score: 0, percentage: 0 };
  }

  const boundedRead = Math.min(validRead, validTotal);
  const percentage = Math.round((boundedRead / validTotal) * 1000) / 10; // نسبة حتى منزلة عشرية واحدة
  const rawScore = (boundedRead / validTotal) * 30;
  const score = Math.min(30, Math.max(0, Math.round(rawScore * 10) / 10));

  return { score, percentage };
}

/**
 * 2. حساب درجة جلسات المناقشة (20 نقطة)
 * -----------------------------------------------
 * تتكون من 4 جلسات ثابتة شهرياً.
 * كل جلسة: حاضر (5 نقاط) أو غائب (0 نقطة).
 * المعادلة: (عدد الجلسات المحضورة / 4) * 20
 */
export function calculateDiscussionScore(
  sessions: DiscussionSession[]
): { score: number; attendedCount: number } {
  if (!sessions || !Array.isArray(sessions)) {
    return { score: 0, attendedCount: 0 };
  }

  // الجلسات الأربع
  const attendedCount = sessions.filter((s) => s.attended).length;
  const boundedAttended = Math.min(4, Math.max(0, attendedCount));
  const score = Math.round((boundedAttended / 4) * 20);

  return { score, attendedCount: boundedAttended };
}

/**
 * 3. حساب درجة الأداء الدعوي (20 نقطة)
 * -----------------------------------------------
 * يحسب كل نشاط دعوي وفق دور الطالب:
 * - مقدّم (Speaker/Leader): 5 نقاط
 * - منظّم (Organizer): 3 نقاط
 * - مشارك (Participant): 2 نقطة
 * العتبة: إنجاز 4 تقديمات، أو خليط من التنظيم والمشاركة يصل للطالب للسقف.
 * السقف الأعلى: 20 نقطة حتماً (لا يتجاوزه مهما زادت الأنشطة).
 * إذا لم يسجل الطالب أي نشاط، يحصل على 0.
 */
export function calculateDawahScore(activities: DawahActivity[]): {
  score: number;
  totalActivities: number;
  totalBeneficiaries: number;
} {
  if (!activities || !Array.isArray(activities) || activities.length === 0) {
    return { score: 0, totalActivities: 0, totalBeneficiaries: 0 };
  }

  let totalPoints = 0;
  let totalBeneficiaries = 0;

  for (const act of activities) {
    totalBeneficiaries += Math.max(0, Number(act.beneficiariesCount) || 0);

    switch (act.role) {
      case 'مقدّم':
        totalPoints += 5;
        break;
      case 'منظّم':
        totalPoints += 3;
        break;
      case 'مشارك':
      default:
        totalPoints += 2;
        break;
    }
  }

  const score = Math.min(20, Math.max(0, totalPoints));
  return {
    score,
    totalActivities: activities.length,
    totalBeneficiaries,
  };
}

/**
 * 4. حساب درجة الالتزام والانضباط (10 نقاط)
 * -----------------------------------------------
 * معايير واضحة لمنع احتساب نفس الحدث مرتين:
 * 1. إنجاز المهام الشهرية (4 نقاط):
 *    - نسبة المهام المنجزة / المهام المسندة * 4 نقاط.
 *    - إذا لم تُسند مهام محددة افتراضياً، يعتبر الطالب مستوفياً لـ 4 نقاط كاملة.
 * 2. الحضور والانضباط بالمواعيد (6 نقاط):
 *    - أساس 6 نقاط.
 *    - خصم 1.5 نقطة لكل غياب غير مبرر.
 *    - خصم 0.5 نقطة لكل تأخر عن موعد رسمي.
 *    - الحد الأدنى لمحور الحضور 0.
 * المجموع: (مهام + حضور) بين 0 و 10 نقاط.
 */
export function calculateDisciplineScore(params: {
  tasksAssigned: number;
  tasksCompleted: number;
  unexcusedAbsences: number;
  delaysCount: number;
}): number {
  const {
    tasksAssigned = 0,
    tasksCompleted = 0,
    unexcusedAbsences = 0,
    delaysCount = 0,
  } = params;

  // 1. درجة المهام (0 - 4)
  let taskScore = 4;
  if (tasksAssigned > 0) {
    const validCompleted = Math.min(tasksCompleted, tasksAssigned);
    taskScore = (validCompleted / tasksAssigned) * 4;
  }

  // 2. درجة الانضباط والحضور (0 - 6)
  const attendanceDeduction =
    Math.max(0, unexcusedAbsences) * 1.5 + Math.max(0, delaysCount) * 0.5;
  const attendanceScore = Math.max(0, 6 - attendanceDeduction);

  const total = Math.min(10, Math.max(0, taskScore + attendanceScore));
  return Math.round(total * 10) / 10;
}

/**
 * 5. حساب درجة الأداء الأخلاقي والسلوكي (10 نقاط)
 * -----------------------------------------------
 * خاصة بالمسؤول والمشرف حصراً.
 * تتكون من 5 معايير محددة، كل معيار من درجتين:
 * 1. الاحترام (0 - 2)
 * 2. التعاون (0 - 2)
 * 3. تحمل المسؤولية (0 - 2)
 * 4. حسن التعامل (0 - 2)
 * 5. الانضباط السلوكي (0 - 2)
 * المجموع: من 0 إلى 10.
 */
export function calculateMoralScore(evaluation?: Partial<MoralEvaluation>): number {
  if (!evaluation) return 0;

  const clamp2 = (v: number | undefined) => Math.min(2, Math.max(0, Number(v) || 0));

  const total =
    clamp2(evaluation.respect) +
    clamp2(evaluation.cooperation) +
    clamp2(evaluation.responsibility) +
    clamp2(evaluation.goodConduct) +
    clamp2(evaluation.behavioralDiscipline);

  return Math.min(10, Math.max(0, Math.round(total * 10) / 10));
}

/**
 * 6. حساب درجة الأنشطة الثقافية والاجتماعية (5 نقاط)
 * -----------------------------------------------
 * كل نشاط يمنح 2.5 نقطة.
 * عتبة الوصول للعلامة الكاملة: نشاطان (2 * 2.5 = 5 نقاط).
 * يمكن للمسؤول إضافة مكافأة تقييمية ضمن سقف الـ 5 نقاط الكلي.
 */
export function calculateCulturalScore(
  activities: CulturalActivity[],
  supervisorBonus = 0
): number {
  if (!activities || !Array.isArray(activities) || activities.length === 0) {
    return Math.min(5, Math.max(0, supervisorBonus));
  }

  const baseScore = activities.length * 2.5;
  const total = baseScore + (Number(supervisorBonus) || 0);

  return Math.min(5, Math.max(0, Math.round(total * 10) / 10));
}

/**
 * 7. حساب درجة الإنجازات الشهرية (5 نقاط)
 * -----------------------------------------------
 * كل إنجاز معتبر يمنح 2.5 نقطة.
 * عتبة الوصول للعلامة الكاملة: إنجازان شهريان.
 * السقف الأعلى: 5 نقاط.
 */
export function calculateAchievementsScore(
  achievements: MonthlyAchievement[]
): number {
  if (!achievements || !Array.isArray(achievements) || achievements.length === 0) {
    return 0;
  }

  const score = achievements.length * 2.5;
  return Math.min(5, Math.max(0, Math.round(score * 10) / 10));
}

/**
 * تحديد التقدير الوصفي حسب المتطلبات الرسمية:
 * 90 إلى 100: ممتاز
 * 80 إلى أقل من 90: جيد جداً
 * 70 إلى أقل من 80: جيد
 * 60 إلى أقل من 70: مقبول
 * أقل من 60: يحتاج إلى تحسين
 */
export function getGradeDescription(totalScore: number): GradeDescription {
  const score = Math.round(totalScore * 10) / 10;
  if (score >= 90) return 'ممتاز';
  if (score >= 80) return 'جيد جداً';
  if (score >= 70) return 'جيد';
  if (score >= 60) return 'مقبول';
  return 'يحتاج إلى تحسين';
}

/**
 * الحساب الشامل للتقرير الشهري وتحديث كافة الدرجات آلياً
 */
export function recalculateFullReport(report: MonthlyReport): MonthlyReport {
  // 1. الأداء العلمي
  const sci = calculateScientificScore(
    report.scientificPerformance.totalPages,
    report.scientificPerformance.pagesRead
  );

  // 2. جلسات المناقشة
  const disc = calculateDiscussionScore(report.discussionSessions.sessions);

  // 3. الأداء الدعوي
  const daw = calculateDawahScore(report.dawahPerformance.activities);

  // 4. الالتزام والانضباط
  const discpScore = calculateDisciplineScore({
    tasksAssigned: report.discipline.tasksAssigned,
    tasksCompleted: report.discipline.tasksCompleted,
    unexcusedAbsences: report.discipline.unexcusedAbsences,
    delaysCount: report.discipline.delaysCount,
  });

  // 5. الأداء الأخلاقي والسلوكي (المسؤول)
  const moralScore = calculateMoralScore(report.moralEvaluation);

  // 6. الأنشطة الثقافية والاجتماعية
  const cultScore = calculateCulturalScore(
    report.culturalActivities.activities,
    report.culturalActivities.supervisorBonus
  );

  // 7. الإنجازات الشهرية
  const achScore = calculateAchievementsScore(
    report.monthlyAchievements.achievements
  );

  // المجموع النهائي (سقف 100 نقطة)
  const rawTotal =
    sci.score +
    disc.score +
    daw.score +
    discpScore +
    moralScore +
    cultScore +
    achScore;

  const totalScore = Math.min(100, Math.max(0, Math.round(rawTotal * 10) / 10));
  const gradeDescription = getGradeDescription(totalScore);

  return {
    ...report,
    scientificPerformance: {
      ...report.scientificPerformance,
      score: sci.score,
      completionPercentage: sci.percentage,
    },
    discussionSessions: {
      ...report.discussionSessions,
      score: disc.score,
      attendedCount: disc.attendedCount,
    },
    dawahPerformance: {
      ...report.dawahPerformance,
      score: daw.score,
      totalActivities: daw.totalActivities,
      totalBeneficiaries: daw.totalBeneficiaries,
    },
    discipline: {
      ...report.discipline,
      score: discpScore,
    },
    moralEvaluation: {
      ...report.moralEvaluation,
      score: moralScore,
    },
    culturalActivities: {
      ...report.culturalActivities,
      score: cultScore,
    },
    monthlyAchievements: {
      ...report.monthlyAchievements,
      score: achScore,
    },
    totalScore,
    gradeDescription,
    updatedAt: new Date().toISOString(),
  };
}
