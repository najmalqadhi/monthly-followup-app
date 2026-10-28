import React, { useState } from 'react';
import {
  FileText,
  Calendar,
  Award,
  ChevronLeft,
  Printer,
  CheckCircle2,
  Lock,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import { MonthlyReport, User } from '../../types';
import { exportService } from '../../services/exportService';

interface PastReportsProps {
  user: User;
  reports: MonthlyReport[];
  onOpenReport: (reportId: string) => void;
  onBack: () => void;
}

export const PastReports: React.FC<PastReportsProps> = ({
  user,
  reports,
  onOpenReport,
  onBack,
}) => {
  const [selectedReport, setSelectedReport] = useState<MonthlyReport | null>(
    reports[0] || null
  );

  return (
    <div className="space-y-6">
      {/* الترويسة */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex items-center justify-between no-print">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition"
          >
            <ArrowRight className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-900">
              سجل التقارير الشهرية السابقة
            </h1>
            <p className="text-xs text-slate-500">
              إجمالي التقارير المعتمدة المسجلة: {reports.length} تقرير
            </p>
          </div>
        </div>

        {selectedReport && (
          <button
            onClick={() => exportService.printCurrentReport()}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 transition flex items-center gap-1.5"
          >
            <Printer className="w-4 h-4 text-slate-600" />
            <span>طباعة التقرير المعتمد (PDF)</span>
          </button>
        )}
      </div>

      {reports.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center text-slate-500 border border-slate-200">
          <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-700 mb-1">
            لا توجد تقارير سابقة معتمدة حتى الآن
          </h3>
          <p className="text-xs text-slate-400">
            ستظهر التقارير الشهرية هنا فور قيامك بتسليمها ومراجعتها واعتمادها من المشرف.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* قائمة التقارير بالجانب */}
          <div className="space-y-3 no-print">
            <h3 className="text-xs font-bold text-slate-500 uppercase px-1">
              اختر الشهر للاطلاع
            </h3>
            {reports.map((rep) => {
              const isSelected = selectedReport?.id === rep.id;
              return (
                <div
                  key={rep.id}
                  onClick={() => setSelectedReport(rep)}
                  className={`p-4 rounded-xl border transition cursor-pointer ${
                    isSelected
                      ? 'bg-teal-50/80 border-teal-500 shadow-xs'
                      : 'bg-white hover:bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-sm text-slate-800">
                      تقرير شهر {rep.month} / {rep.year}
                    </span>
                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                        rep.totalScore >= 90
                          ? 'bg-emerald-100 text-emerald-800'
                          : rep.totalScore >= 80
                          ? 'bg-teal-100 text-teal-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {rep.totalScore}/100 • {rep.gradeDescription}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 truncate">
                    الكتاب: {rep.scientificPerformance.bookName || 'غير محدد'}
                  </p>
                  <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
                    <span>
                      {new Date(rep.createdAt).toLocaleDateString('ar-SA')}
                    </span>
                    {rep.status === 'locked' ? (
                      <span className="inline-flex items-center gap-1 text-slate-500">
                        <Lock className="w-3 h-3" />
                        <span>معتمد ومقفل</span>
                      </span>
                    ) : (
                      <span className="text-emerald-600 font-medium">تم التسليم</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* المعاينة والتفاصيل الرسمية للتقرير المحدد */}
          {selectedReport && (
            <div className="lg:col-span-2 bg-white rounded-2xl p-8 border border-slate-200/80 shadow-xs space-y-6 print:border-none print:shadow-none print:p-0">
              {/* ترويسة رسمية للطباعة */}
              <div className="text-center pb-6 border-b border-slate-200">
                <span className="text-xs font-semibold text-slate-500 tracking-wider">
                  المؤسسة التعليمية لتأهيل الطلاب • قسم المتابعة والتوجيه
                </span>
                <h2 className="text-2xl font-black text-slate-900 mt-1">
                  تقرير المتابعة والتقييم الشهري
                </h2>
                <div className="inline-block mt-2 px-3 py-1 rounded-full bg-slate-100 text-xs font-bold text-slate-700">
                  شهر {selectedReport.month} / سنة {selectedReport.year} ({selectedReport.academicYear})
                </div>
              </div>

              {/* بيانات الطالب في جدول منظم */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                <div>
                  <span className="text-slate-400 block mb-0.5">اسم الطالب</span>
                  <strong className="text-slate-800 text-sm">
                    {selectedReport.studentName}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">الرقم التعريفي</span>
                  <strong className="text-slate-800 font-mono">
                    {selectedReport.studentCode}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">المرحلة التعليمية</span>
                  <strong className="text-slate-800">
                    {selectedReport.educationalStage}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">تاريخ الاعتماد</span>
                  <strong className="text-slate-800">
                    {new Date(selectedReport.updatedAt).toLocaleDateString('ar-SA')}
                  </strong>
                </div>
              </div>

              {/* جدول المحاور السبعة الرسمية */}
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs border border-slate-200 rounded-xl overflow-hidden">
                  <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">#</th>
                      <th className="py-2.5 px-3">المحور</th>
                      <th className="py-2.5 px-3 text-center">الوزن الرسمي</th>
                      <th className="py-2.5 px-3 text-center">الدرجة المستحقة</th>
                      <th className="py-2.5 px-3">التفاصيل والإنجاز</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr>
                      <td className="py-2.5 px-3 font-bold text-slate-400">1</td>
                      <td className="py-2.5 px-3 font-semibold text-slate-800">الأداء العلمي</td>
                      <td className="py-2.5 px-3 text-center font-bold">30</td>
                      <td className="py-2.5 px-3 text-center font-bold text-teal-700">
                        {selectedReport.scientificPerformance.score}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600">
                        كتاب «{selectedReport.scientificPerformance.bookName}» (قراءة {selectedReport.scientificPerformance.pagesRead} من {selectedReport.scientificPerformance.totalPages} ص • {selectedReport.scientificPerformance.completionPercentage}%)
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 font-bold text-slate-400">2</td>
                      <td className="py-2.5 px-3 font-semibold text-slate-800">جلسات المناقشة</td>
                      <td className="py-2.5 px-3 text-center font-bold">20</td>
                      <td className="py-2.5 px-3 text-center font-bold text-teal-700">
                        {selectedReport.discussionSessions.score}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600">
                        حضور {selectedReport.discussionSessions.attendedCount} من 4 جلسات مقررة
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 font-bold text-slate-400">3</td>
                      <td className="py-2.5 px-3 font-semibold text-slate-800">الأداء الدعوي</td>
                      <td className="py-2.5 px-3 text-center font-bold">20</td>
                      <td className="py-2.5 px-3 text-center font-bold text-teal-700">
                        {selectedReport.dawahPerformance.score}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600">
                        إنجاز {selectedReport.dawahPerformance.totalActivities} أنشطة دعوية ومستفيدين: {selectedReport.dawahPerformance.totalBeneficiaries}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 font-bold text-slate-400">4</td>
                      <td className="py-2.5 px-3 font-semibold text-slate-800">الالتزام والانضباط</td>
                      <td className="py-2.5 px-3 text-center font-bold">10</td>
                      <td className="py-2.5 px-3 text-center font-bold text-teal-700">
                        {selectedReport.discipline.score}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600">
                        غياب: {selectedReport.discipline.unexcusedAbsences} • تأخر: {selectedReport.discipline.delaysCount} • مهام منجزة: {selectedReport.discipline.tasksCompleted}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 font-bold text-slate-400">5</td>
                      <td className="py-2.5 px-3 font-semibold text-slate-800">الأداء الأخلاقي والسلوكي</td>
                      <td className="py-2.5 px-3 text-center font-bold">10</td>
                      <td className="py-2.5 px-3 text-center font-bold text-teal-700">
                        {selectedReport.moralEvaluation.score}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600">
                        تقييم المشرف: {selectedReport.moralEvaluation.notes || 'استيفاء المعايير السلوكية'}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 font-bold text-slate-400">6</td>
                      <td className="py-2.5 px-3 font-semibold text-slate-800">الأنشطة الثقافية والاجتماعية</td>
                      <td className="py-2.5 px-3 text-center font-bold">5</td>
                      <td className="py-2.5 px-3 text-center font-bold text-teal-700">
                        {selectedReport.culturalActivities.score}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600">
                        {selectedReport.culturalActivities.activities.length} نشاط ثقافي/اجتماعي مسجل
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 font-bold text-slate-400">7</td>
                      <td className="py-2.5 px-3 font-semibold text-slate-800">الإنجازات الشهرية</td>
                      <td className="py-2.5 px-3 text-center font-bold">5</td>
                      <td className="py-2.5 px-3 text-center font-bold text-teal-700">
                        {selectedReport.monthlyAchievements.score}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600">
                        {selectedReport.monthlyAchievements.achievements.length} إنجاز مسجل
                      </td>
                    </tr>
                  </tbody>
                  <tfoot className="bg-slate-50 font-bold border-t border-slate-200">
                    <tr>
                      <td colSpan={2} className="py-3 px-3 text-slate-800">
                        المجموع النهائي والتقدير العام
                      </td>
                      <td className="py-3 px-3 text-center text-slate-800">100</td>
                      <td className="py-3 px-3 text-center text-base text-teal-800">
                        {selectedReport.totalScore}
                      </td>
                      <td className="py-3 px-3 text-teal-800">
                        التقدير: {selectedReport.gradeDescription}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* التحديات وخطة الشهر القادم (وصفي) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
                  <strong className="text-slate-800 block mb-1">
                    أهم التحديات المسجلة:
                  </strong>
                  <p className="text-slate-600">
                    {selectedReport.challenges.description || 'لم تسجل صعوبات خاصة.'}
                  </p>
                </div>
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
                  <strong className="text-slate-800 block mb-1">
                    خطة ومستهدفات الشهر القادم:
                  </strong>
                  <p className="text-slate-600">
                    {selectedReport.nextMonthPlan.goals || 'مواصلة خطة القراءة والأنشطة.'}
                  </p>
                </div>
              </div>

              {/* توقيع المشرف والختم الرسمي */}
              <div className="pt-8 border-t border-slate-200 flex justify-between items-end text-xs text-slate-500">
                <div className="text-center">
                  <span className="block mb-6">توقيع الطالب</span>
                  <span className="font-semibold text-slate-800">{selectedReport.studentName}</span>
                </div>
                <div className="text-center">
                  <span className="block mb-6">اعتماد المشرف / المسؤول</span>
                  <span className="font-semibold text-slate-800">أ. عبد الله المنصور</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
