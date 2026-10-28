import React, { useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  BarChart3,
  Calendar,
  Award,
  BookOpen,
  Users,
  Compass,
  AlertCircle,
} from 'lucide-react';
import { MonthlyReport, User } from '../../types';

interface AnalyticsViewProps {
  reports: MonthlyReport[];
  students: User[];
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  reports,
  students,
}) => {
  const [selectedStudentId, setSelectedStudentId] = useState<string>(
    students.find((s) => s.role === 'student')?.id || ''
  );

  const studentUsers = students.filter((s) => s.role === 'student');
  const selectedStudent = studentUsers.find((s) => s.id === selectedStudentId);

  // تقارير الطالب المحدد مرتبة تصاعدياً حسب الأشهر
  const studentReports = reports
    .filter((r) => r.studentId === selectedStudentId)
    .sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      return a.month - b.month;
    });

  // فحص مؤشر التحسن أو التراجع بين آخر شهرين
  let trendIndicator: { type: 'up' | 'down' | 'same'; diff: number } | null = null;
  if (studentReports.length >= 2) {
    const last = studentReports[studentReports.length - 1];
    const prev = studentReports[studentReports.length - 2];
    const diff = Math.round((last.totalScore - prev.totalScore) * 10) / 10;
    if (diff > 0) trendIndicator = { type: 'up', diff };
    else if (diff < 0) trendIndicator = { type: 'down', diff: Math.abs(diff) };
    else trendIndicator = { type: 'same', diff: 0 };
  }

  return (
    <div className="space-y-6">
      {/* الترويسة ومحدد الطالب */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">
            التحليل والمقارنة الفردية والجماعية
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            مقارنة أداء الطالب عبر الأشهر، تتبع التحسن والتراجع، وتطور الإنجاز العلمي والدعوي
          </p>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <span className="text-xs font-bold text-slate-600 whitespace-nowrap">
            اختر الطالب للتحليل:
          </span>
          <select
            value={selectedStudentId}
            onChange={(e) => setSelectedStudentId(e.target.value)}
            className="w-full md:w-64 px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white font-semibold text-slate-800"
          >
            {studentUsers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.fullName} ({s.studentId})
              </option>
            ))}
          </select>
        </div>
      </div>

      {selectedStudent && (
        <>
          {/* مؤشرات التحسن ومقارنة الأداء */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
              <span className="text-xs font-bold text-slate-500 block mb-1">
                التقارير المقدمة للطالب
              </span>
              <div className="text-3xl font-black text-slate-900">
                {studentReports.length} <span className="text-sm font-normal text-slate-400">تقارير</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                من أصل العام الدراسي الجاري (تظهر الأشهر الفعلية فقط)
              </p>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
              <span className="text-xs font-bold text-slate-500 block mb-1">
                مؤشر التطور (بين آخر شهرين)
              </span>
              {trendIndicator ? (
                <div className="flex items-center gap-2 mt-1">
                  {trendIndicator.type === 'up' ? (
                    <div className="flex items-center gap-1 text-emerald-700 font-black text-2xl">
                      <TrendingUp className="w-6 h-6 text-emerald-600" />
                      <span>+{trendIndicator.diff} نقطة</span>
                    </div>
                  ) : trendIndicator.type === 'down' ? (
                    <div className="flex items-center gap-1 text-rose-700 font-black text-2xl">
                      <TrendingDown className="w-6 h-6 text-rose-600" />
                      <span>-{trendIndicator.diff} نقطة</span>
                    </div>
                  ) : (
                    <div className="text-slate-700 font-black text-2xl">
                      ثبات على المستوى (0.0)
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-xs text-slate-400 mt-2">
                  يتطلب تقريرين على الأقل لحساب مؤشر التطور
                </p>
              )}
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
              <span className="text-xs font-bold text-slate-500 block mb-1">
                متوسط الدرجات الفعلي
              </span>
              <div className="text-3xl font-black text-teal-700">
                {studentReports.length > 0
                  ? Math.round(
                      (studentReports.reduce((acc, r) => acc + r.totalScore, 0) /
                        studentReports.length) *
                        10
                    ) / 10
                  : 0}
                <span className="text-sm font-normal text-slate-400"> / 100</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                محسوب فقط للأشهر المقدمة فعلياً دون استبدال الناقص بصفر
              </p>
            </div>
          </div>

          {/* تنبيه شفافية البيانات */}
          <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl text-xs text-blue-900 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-blue-600 shrink-0" />
            <span>
              <strong>ضمان الشفافية:</strong> يتم عرض ومقارنة الأشهر التي قدم فيها الطالب تقريراً فعلياً فقط، وتفادي المقارنات المضللة للأشهر غير المقدمة.
            </span>
          </div>

          {/* جدول المقارنة التفصيلي عبر الشهور */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-sm">
                جدول مقارنة أداء الطالب «{selectedStudent.fullName}» عبر الأشهر
              </h3>
            </div>

            {studentReports.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                لا توجد تقارير مسجلة لهذا الطالب حتى الآن.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">الشهر</th>
                      <th className="py-2.5 px-3">المقرر المقروء</th>
                      <th className="py-2.5 px-3 text-center">الأداء العلمي (30)</th>
                      <th className="py-2.5 px-3 text-center">جلسات المناقشة (20)</th>
                      <th className="py-2.5 px-3 text-center">الأداء الدعوي (20)</th>
                      <th className="py-2.5 px-3 text-center">الالتزام (10)</th>
                      <th className="py-2.5 px-3 text-center">الأخلاقي (10)</th>
                      <th className="py-2.5 px-3 text-center">الثقافي (5)</th>
                      <th className="py-2.5 px-3 text-center">الإنجازات (5)</th>
                      <th className="py-2.5 px-3 text-center font-bold">المجموع (100)</th>
                      <th className="py-2.5 px-3 text-center">التقدير</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {studentReports.map((rep) => (
                      <tr key={rep.id} className="hover:bg-slate-50 transition">
                        <td className="py-3 px-3 font-bold text-slate-800">
                          شهر {rep.month} / {rep.year}
                        </td>
                        <td className="py-3 px-3 text-slate-600 truncate max-w-xs">
                          {rep.scientificPerformance.bookName || 'غير مسجل'} ({rep.scientificPerformance.completionPercentage}%)
                        </td>
                        <td className="py-3 px-3 text-center font-semibold text-slate-700">
                          {rep.scientificPerformance.score}
                        </td>
                        <td className="py-3 px-3 text-center font-semibold text-slate-700">
                          {rep.discussionSessions.score} ({rep.discussionSessions.attendedCount}/4)
                        </td>
                        <td className="py-3 px-3 text-center font-semibold text-slate-700">
                          {rep.dawahPerformance.score} ({rep.dawahPerformance.totalActivities} نشاط)
                        </td>
                        <td className="py-3 px-3 text-center font-semibold text-slate-700">
                          {rep.discipline.score}
                        </td>
                        <td className="py-3 px-3 text-center font-semibold text-slate-700">
                          {rep.moralEvaluation.score}
                        </td>
                        <td className="py-3 px-3 text-center font-semibold text-slate-700">
                          {rep.culturalActivities.score}
                        </td>
                        <td className="py-3 px-3 text-center font-semibold text-slate-700">
                          {rep.monthlyAchievements.score}
                        </td>
                        <td className="py-3 px-3 text-center font-black text-teal-800 text-sm">
                          {rep.totalScore}
                        </td>
                        <td className="py-3 px-3 text-center">
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
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
