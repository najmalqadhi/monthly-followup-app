import React, { useState } from 'react';
import {
  Award,
  Filter,
  Download,
  Printer,
  ChevronUp,
  FileSpreadsheet,
  Medal,
  CheckCircle2,
} from 'lucide-react';
import { MonthlyReport, SystemSettings } from '../../types';
import { exportService } from '../../services/exportService';

interface StudentRankingProps {
  reports: MonthlyReport[];
  settings: SystemSettings;
}

export const StudentRanking: React.FC<StudentRankingProps> = ({
  reports,
  settings,
}) => {
  const [selectedMonth, setSelectedMonth] = useState<number>(settings.currentMonth);
  const [selectedYear, setSelectedYear] = useState<number>(settings.currentYear);
  const [selectedStage, setSelectedStage] = useState<string>('ALL');

  // تصفية التقارير لهذا الشهر والسنة
  const monthlyReports = reports
    .filter((r) => r.month === selectedMonth && r.year === selectedYear)
    .filter((r) => selectedStage === 'ALL' || r.educationalStage === selectedStage);

  // فرز تنازلي حسب الدرجة، مع تطبيق قاعدة كسر التعادل أبجدياً بالاسم
  const rankedReports = [...monthlyReports].sort((a, b) => {
    if (b.totalScore !== a.totalScore) {
      return b.totalScore - a.totalScore;
    }
    return a.studentName.localeCompare(b.studentName, 'ar');
  });

  return (
    <div className="space-y-6">
      {/* الترويسة والأزرار */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4 no-print">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1">
              <Medal className="w-3.5 h-3.5 text-amber-600" />
              <span>خاص بالمسؤول فقط • محجوب عن الطلاب</span>
            </span>
          </div>
          <h1 className="text-xl font-bold text-slate-900">
            ترتيب وتقييم الطلاب لشهر {selectedMonth} / {selectedYear}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            ترتيب تنازلي دقيق حسب الدرجة الإجمالية، مع كسر التعادل بالترتيب الأبجدي الصارم
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() =>
              exportService.exportRankingsToExcel(
                rankedReports,
                selectedMonth,
                selectedYear
              )
            }
            className="px-3.5 py-2 rounded-xl text-xs font-bold border border-slate-300 hover:bg-slate-50 text-slate-700 transition flex items-center gap-1.5"
            title="تصدير جدول الترتيب إلى ملف Excel"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>تصدير Excel</span>
          </button>

          <button
            onClick={() => exportService.printCurrentReport()}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-teal-700 hover:bg-teal-800 text-white transition flex items-center gap-1.5"
          >
            <Printer className="w-4 h-4" />
            <span>طباعة كشف الترتيب الرسمي (PDF)</span>
          </button>
        </div>
      </div>

      {/* شريط الفلاتر */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex flex-wrap items-center gap-3 no-print">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-600">الشهر:</span>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
            className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-white"
          >
            {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
              <option key={m} value={m}>
                شهر {m}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-600">السنة:</span>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-white"
          >
            <option value={2026}>2026</option>
            <option value={2025}>2025</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-600">المرحلة:</span>
          <select
            value={selectedStage}
            onChange={(e) => setSelectedStage(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-white"
          >
            <option value="ALL">جميع المراحل التعليمية</option>
            <option value="المرحلة الثانوية">المرحلة الثانوية</option>
            <option value="المرحلة الجامعية">المرحلة الجامعية</option>
            <option value="مرحلة التأهيل والتدريب">مرحلة التأهيل والتدريب</option>
          </select>
        </div>

        <div className="mr-auto text-xs text-slate-400">
          عدد الطلاب المرتبين: {rankedReports.length} طالب
        </div>
      </div>

      {/* جدول الترتيب الرسمي */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden print:border-none print:shadow-none">
        {/* ترويسة خاصة بالطباعة */}
        <div className="hidden print:block p-6 text-center border-b border-slate-300">
          <h2 className="text-xl font-bold text-slate-900">
            كشف ترتيب نتائج الطلاب الشهري
          </h2>
          <p className="text-xs text-slate-600 mt-1">
            شهر {selectedMonth} / {selectedYear} • {settings.organizationName}
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
              <tr>
                <th className="py-3 px-3 text-center">الترتيب</th>
                <th className="py-3 px-3">الرقم</th>
                <th className="py-3 px-3">اسم الطالب</th>
                <th className="py-3 px-3">المرحلة</th>
                <th className="py-3 px-2 text-center" title="الأداء العلمي من 30">العلمي (30)</th>
                <th className="py-3 px-2 text-center" title="جلسات المناقشة من 20">المناقشة (20)</th>
                <th className="py-3 px-2 text-center" title="الأداء الدعوي من 20">الدعوي (20)</th>
                <th className="py-3 px-2 text-center" title="الالتزام والانضباط من 10">الالتزام (10)</th>
                <th className="py-3 px-2 text-center" title="الأداء الأخلاقي والسلوكي من 10">الأخلاقي (10)</th>
                <th className="py-3 px-2 text-center" title="الأنشطة الثقافية من 5">الثقافي (5)</th>
                <th className="py-3 px-2 text-center" title="الإنجازات الشهرية من 5">الإنجاز (5)</th>
                <th className="py-3 px-3 text-center font-black text-sm">المجموع (100)</th>
                <th className="py-3 px-3 text-center">التقدير</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rankedReports.length === 0 ? (
                <tr>
                  <td colSpan={13} className="py-10 text-center text-slate-400">
                    لا توجد تقارير مقدمة لهذا الشهر بالمحددات المختارة
                  </td>
                </tr>
              ) : (
                rankedReports.map((rep, idx) => {
                  const rank = idx + 1;
                  return (
                    <tr
                      key={rep.id}
                      className={`hover:bg-slate-50 transition ${
                        rank === 1
                          ? 'bg-amber-50/40'
                          : rank === 2
                          ? 'bg-slate-50/60'
                          : rank === 3
                          ? 'bg-orange-50/30'
                          : ''
                      }`}
                    >
                      <td className="py-3 px-3 text-center font-bold">
                        <span
                          className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                            rank === 1
                              ? 'bg-amber-500 text-white'
                              : rank === 2
                              ? 'bg-slate-400 text-white'
                              : rank === 3
                              ? 'bg-amber-700 text-white'
                              : 'text-slate-500'
                          }`}
                        >
                          {rank}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-500">
                        {rep.studentCode}
                      </td>
                      <td className="py-3 px-3 font-bold text-slate-900">
                        {rep.studentName}
                      </td>
                      <td className="py-3 px-3 text-slate-600">
                        {rep.educationalStage}
                      </td>
                      <td className="py-3 px-2 text-center text-slate-700">
                        {rep.scientificPerformance.score}
                      </td>
                      <td className="py-3 px-2 text-center text-slate-700">
                        {rep.discussionSessions.score}
                      </td>
                      <td className="py-3 px-2 text-center text-slate-700">
                        {rep.dawahPerformance.score}
                      </td>
                      <td className="py-3 px-2 text-center text-slate-700">
                        {rep.discipline.score}
                      </td>
                      <td className="py-3 px-2 text-center text-slate-700">
                        {rep.moralEvaluation.score}
                      </td>
                      <td className="py-3 px-2 text-center text-slate-700">
                        {rep.culturalActivities.score}
                      </td>
                      <td className="py-3 px-2 text-center text-slate-700">
                        {rep.monthlyAchievements.score}
                      </td>
                      <td className="py-3 px-3 text-center font-black text-sm text-teal-800">
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
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
