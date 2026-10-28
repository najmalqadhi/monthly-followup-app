import React, { useState } from 'react';
import {
  FileText,
  Printer,
  Calendar,
  Award,
  BookOpen,
  Users,
  Compass,
  Sparkles,
  TrendingUp,
  Info,
} from 'lucide-react';
import { MonthlyReport, User, SystemSettings } from '../../types';
import { exportService } from '../../services/exportService';
import { getGradeDescription } from '../../services/scoringEngine';

interface AnnualReportViewProps {
  students: User[];
  reports: MonthlyReport[];
  settings: SystemSettings;
}

export const AnnualReportView: React.FC<AnnualReportViewProps> = ({
  students,
  reports,
  settings,
}) => {
  const studentUsers = students.filter((s) => s.role === 'student');
  const [selectedStudentId, setSelectedStudentId] = useState<string>(
    studentUsers[0]?.id || ''
  );

  const student = studentUsers.find((s) => s.id === selectedStudentId);

  // جلب تقارير هذا الطالب
  const studentReports = reports
    .filter((r) => r.studentId === selectedStudentId)
    .sort((a, b) => a.month - b.month);

  // الحساب الشفاف للمتوسط السنوي:
  // لا نستبدل الأشهر الناقصة بصفر، بل نبيّن بدقة عدد الأشهر الفعلية المقيدة
  const actualSubmittedMonthsCount = studentReports.length;
  const annualAverageScore =
    actualSubmittedMonthsCount > 0
      ? Math.round(
          (studentReports.reduce((sum, r) => sum + r.totalScore, 0) /
            actualSubmittedMonthsCount) *
            10
        ) / 10
      : 0;

  const annualGradeDescription = getGradeDescription(annualAverageScore);

  // إحصائيات سنوية مجمعة
  const totalPagesReadYear = studentReports.reduce(
    (sum, r) => sum + r.scientificPerformance.pagesRead,
    0
  );

  const totalSessionsAttendedYear = studentReports.reduce(
    (sum, r) => sum + r.discussionSessions.attendedCount,
    0
  );

  const totalDawahActivitiesYear = studentReports.reduce(
    (sum, r) => sum + r.dawahPerformance.totalActivities,
    0
  );

  const totalBeneficiariesYear = studentReports.reduce(
    (sum, r) => sum + r.dawahPerformance.totalBeneficiaries,
    0
  );

  const totalAchievementsYear = studentReports.reduce(
    (sum, r) => sum + r.monthlyAchievements.achievements.length,
    0
  );

  return (
    <div className="space-y-6">
      {/* شريط الإجراءات والتحكم */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4 no-print">
        <div>
          <h1 className="text-xl font-bold text-slate-900">
            التقرير السنوي الشامل للطالب
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            إصدار تقرير ختامي موثق يحسب المعدل الفعلي للأشهر المقدمة مع ملخص الإنجازات
          </p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <select
            value={selectedStudentId}
            onChange={(e) => setSelectedStudentId(e.target.value)}
            className="px-3.5 py-2 text-xs rounded-xl border border-slate-300 bg-white font-semibold text-slate-800"
          >
            {studentUsers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.fullName} ({s.studentId})
              </option>
            ))}
          </select>

          <button
            onClick={() => exportService.printCurrentReport()}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-teal-700 hover:bg-teal-800 text-white transition flex items-center gap-1.5 whitespace-nowrap"
          >
            <Printer className="w-4 h-4" />
            <span>طباعة التقرير السنوي (PDF)</span>
          </button>
        </div>
      </div>

      {student && (
        <div className="bg-white rounded-2xl p-8 border border-slate-200/80 shadow-xs space-y-6 print:border-none print:shadow-none print:p-0">
          {/* ترويسة التقرير السنوي الرسمي */}
          <div className="text-center pb-6 border-b border-slate-200">
            <span className="text-xs font-semibold text-slate-500 tracking-wider block">
              {settings.organizationName} • {settings.organizationSubtitle}
            </span>
            <h2 className="text-2xl font-black text-slate-900 mt-1">
              التقرير التقييمي السنوي للأداء والمتابعة
            </h2>
            <div className="inline-block mt-2 px-3 py-1 rounded-full bg-slate-100 text-xs font-bold text-slate-700">
              العام الدراسي: {settings.currentAcademicYear}
            </div>
          </div>

          {/* بيانات الطالب في بطاقة رسمية */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs">
            <div>
              <span className="text-slate-400 block mb-0.5">اسم الطالب الكامل</span>
              <strong className="text-slate-900 text-sm">{student.fullName}</strong>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5">الرقم التعريفي</span>
              <strong className="text-slate-800 font-mono">{student.studentId}</strong>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5">المرحلة التعليمية</span>
              <strong className="text-slate-800">{student.educationalStage}</strong>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5">المشرف المباشر</span>
              <strong className="text-slate-800">
                {student.supervisorName || 'المسؤول العام'}
              </strong>
            </div>
          </div>

          {/* خلاصة النتيجة السنوية ومؤشرات الشفافية */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl bg-teal-50 border border-teal-200 flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold text-teal-800 block mb-1">
                  المعدل التراكمي السنوي
                </span>
                <div className="text-4xl font-black text-teal-900">
                  {annualAverageScore} <span className="text-base font-normal text-teal-700">/ 100</span>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-teal-200/60 flex items-center justify-between">
                <span className="text-xs text-teal-800 font-medium">التقدير السنوي:</span>
                <span className="px-2.5 py-0.5 rounded-full bg-teal-800 text-white font-bold text-xs">
                  {annualGradeDescription}
                </span>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold text-slate-600 block mb-1">
                  عدد الأشهر المعتمدة في المعدل
                </span>
                <div className="text-3xl font-black text-slate-800">
                  {actualSubmittedMonthsCount} <span className="text-sm font-normal text-slate-400">أشهر</span>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-slate-200 text-[11px] text-slate-500">
                * تم حساب المتوسط بقسمة مجموع الدرجات على ({actualSubmittedMonthsCount}) أشهر فعلية فقط دون تخفيض غير مبرر للأشهر غير المدرجة.
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold text-slate-600 block mb-1">
                  إجمالي الحصيلة السنوية
                </span>
                <div className="text-xs space-y-1 mt-2 text-slate-700">
                  <div className="flex justify-between">
                    <span>الصفحات المقروءة:</span>
                    <strong className="text-teal-700">{totalPagesReadYear} صفحة</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>حضور جلسات المناقشة:</span>
                    <strong className="text-teal-700">{totalSessionsAttendedYear} جلسة</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>الأنشطة الدعوية:</span>
                    <strong className="text-teal-700">{totalDawahActivitiesYear} نشاط ({totalBeneficiariesYear} مستفيد)</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>الإنجازات المسجلة:</span>
                    <strong className="text-teal-700">{totalAchievementsYear} إنجاز</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* جدول سجل الدرجات الشهرية الداخلة في الحساب */}
          <div>
            <h3 className="text-sm font-bold text-slate-900 mb-3">
              سجل الدرجات الشهرية المفصلة للعام الدراسي
            </h3>
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">الشهر</th>
                    <th className="py-2.5 px-3">المقرر العلمي المقروء</th>
                    <th className="py-2.5 px-2 text-center">العلمي (30)</th>
                    <th className="py-2.5 px-2 text-center">المناقشة (20)</th>
                    <th className="py-2.5 px-2 text-center">الدعوي (20)</th>
                    <th className="py-2.5 px-2 text-center">الالتزام (10)</th>
                    <th className="py-2.5 px-2 text-center">الأخلاقي (10)</th>
                    <th className="py-2.5 px-2 text-center">الثقافي (5)</th>
                    <th className="py-2.5 px-2 text-center">الإنجاز (5)</th>
                    <th className="py-2.5 px-3 text-center font-bold">المجموع (100)</th>
                    <th className="py-2.5 px-3 text-center">التقدير</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {studentReports.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="py-8 text-center text-slate-400">
                        لا توجد تقارير مقدمة لهذا الطالب خلال هذا العام
                      </td>
                    </tr>
                  ) : (
                    studentReports.map((rep) => (
                      <tr key={rep.id} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3 font-bold text-slate-800">
                          شهر {rep.month}
                        </td>
                        <td className="py-2.5 px-3 text-slate-600 truncate max-w-xs">
                          {rep.scientificPerformance.bookName || 'غير مسجل'} ({rep.scientificPerformance.pagesRead} ص)
                        </td>
                        <td className="py-2.5 px-2 text-center text-slate-700">
                          {rep.scientificPerformance.score}
                        </td>
                        <td className="py-2.5 px-2 text-center text-slate-700">
                          {rep.discussionSessions.score}
                        </td>
                        <td className="py-2.5 px-2 text-center text-slate-700">
                          {rep.dawahPerformance.score}
                        </td>
                        <td className="py-2.5 px-2 text-center text-slate-700">
                          {rep.discipline.score}
                        </td>
                        <td className="py-2.5 px-2 text-center text-slate-700">
                          {rep.moralEvaluation.score}
                        </td>
                        <td className="py-2.5 px-2 text-center text-slate-700">
                          {rep.culturalActivities.score}
                        </td>
                        <td className="py-2.5 px-2 text-center text-slate-700">
                          {rep.monthlyAchievements.score}
                        </td>
                        <td className="py-2.5 px-3 text-center font-black text-teal-800 text-sm">
                          {rep.totalScore}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              rep.totalScore >= 90
                                ? 'bg-emerald-50 text-emerald-800'
                                : rep.totalScore >= 80
                                ? 'bg-teal-50 text-teal-800'
                                : 'bg-blue-50 text-blue-800'
                            }`}
                          >
                            {rep.gradeDescription}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                {studentReports.length > 0 && (
                  <tfoot className="bg-slate-50 font-bold border-t border-slate-200">
                    <tr>
                      <td colSpan={2} className="py-3 px-3 text-slate-900">
                        المتوسط السنوي العام ({actualSubmittedMonthsCount} أشهر)
                      </td>
                      <td colSpan={7}></td>
                      <td className="py-3 px-3 text-center text-teal-800 text-base font-black">
                        {annualAverageScore}
                      </td>
                      <td className="py-3 px-3 text-center text-teal-800">
                        {annualGradeDescription}
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>

          {/* ملخص أهم التحديات والخطط المسجلة للطالب */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
              <strong className="text-slate-800 block mb-2 font-bold">
                أهم الصعوبات والتحديات التي تم رصدها خلال العام:
              </strong>
              <ul className="list-disc list-inside space-y-1 text-slate-600">
                {studentReports
                  .filter((r) => r.challenges.description)
                  .map((r, i) => (
                    <li key={i}>
                      شهر {r.month}: {r.challenges.description}
                    </li>
                  ))}
                {studentReports.every((r) => !r.challenges.description) && (
                  <li>لم تسجل صعوبات خاصة تعيق مسيرة الطالب.</li>
                )}
              </ul>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
              <strong className="text-slate-800 block mb-2 font-bold">
                أبرز الإنجازات والخطط التطويرية المنجزة:
              </strong>
              <ul className="list-disc list-inside space-y-1 text-slate-600">
                {studentReports
                  .flatMap((r) => r.monthlyAchievements.achievements)
                  .slice(0, 5)
                  .map((ach, i) => (
                    <li key={i}>
                      {ach.title} {ach.description ? `(${ach.description})` : ''}
                    </li>
                  ))}
                {studentReports.every(
                  (r) => r.monthlyAchievements.achievements.length === 0
                ) && <li>تم استيفاء المقررات العامة بنجاح.</li>}
              </ul>
            </div>
          </div>

          {/* التوقيعات الرسمية في أسفل التقرير السنوي */}
          <div className="pt-10 border-t border-slate-200 flex justify-between items-end text-xs text-slate-500">
            <div className="text-center">
              <span className="block mb-8">إعداد وتدقيق المسؤول الإداري</span>
              <span className="font-bold text-slate-800">أ. عبد الله المنصور</span>
            </div>
            <div className="text-center">
              <span className="block mb-8">اعتماد مدير المؤسسة التعليمية</span>
              <span className="font-bold text-slate-800">د. عبد الرحمن بن صالح</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
