import React, { useState } from 'react';
import {
  FileText,
  Search,
  Filter,
  Lock,
  Unlock,
  CheckCircle2,
  Calendar,
  AlertCircle,
  Eye,
  Award,
  Sparkles,
  Users,
  Compass,
  FileCheck,
  X,
} from 'lucide-react';
import { MonthlyReport, User, SystemSettings } from '../../types';
import { dbService } from '../../services/dbStorage';

interface ReportManagementProps {
  reports: MonthlyReport[];
  students: User[];
  settings: SystemSettings;
  onRefresh: () => void;
}

export const ReportManagement: React.FC<ReportManagementProps> = ({
  reports,
  students,
  settings,
  onRefresh,
}) => {
  const [selectedMonth, setSelectedMonth] = useState<number>(settings.currentMonth);
  const [selectedYear, setSelectedYear] = useState<number>(settings.currentYear);
  const [selectedStage, setSelectedStage] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // تفاصيل التقرير المنبثق
  const [inspectReport, setInspectReport] = useState<MonthlyReport | null>(null);

  // حالة تقييم المحور الأخلاقي بواسطة المسؤول
  const [moralModalReport, setMoralModalReport] = useState<MonthlyReport | null>(null);
  const [moralForm, setMoralForm] = useState({
    respect: 2,
    cooperation: 2,
    responsibility: 2,
    goodConduct: 2,
    behavioralDiscipline: 2,
    notes: '',
  });

  const [notificationMsg, setNotificationMsg] = useState<string | null>(null);

  // فلترة التقارير
  const filteredReports = reports.filter((r) => {
    const matchMonth = selectedMonth === 0 || r.month === selectedMonth;
    const matchYear = selectedYear === 0 || r.year === selectedYear;
    const matchStage = selectedStage === 'ALL' || r.educationalStage === selectedStage;
    const matchStatus = selectedStatus === 'ALL' || r.status === selectedStatus;
    const matchSearch =
      r.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.studentCode.toLowerCase().includes(searchTerm.toLowerCase());
    return matchMonth && matchYear && matchStage && matchStatus && matchSearch;
  });

  // الطلاب الذين لم يقدموا تقرير الشهر الحالي
  const submittedStudentIds = new Set(
    reports
      .filter((r) => r.month === selectedMonth && r.year === selectedYear)
      .map((r) => r.studentId)
  );
  const missingStudents = students
    .filter((s) => s.role === 'student' && s.status === 'active')
    .filter((s) => !submittedStudentIds.has(s.id));

  // قفل أو فك قفل التعديل
  const handleToggleLock = (reportId: string, currentAllowed: boolean) => {
    const res = dbService.toggleReportLock(reportId, !currentAllowed, 'المسؤول العام');
    if (res.success) {
      setNotificationMsg(res.message);
      onRefresh();
      if (inspectReport && inspectReport.id === reportId && res.report) {
        setInspectReport(res.report);
      }
      setTimeout(() => setNotificationMsg(null), 3000);
    }
  };

  // فتح نافذة تقييم المحور الأخلاقي للمشرف
  const handleOpenMoralModal = (rep: MonthlyReport) => {
    setMoralModalReport(rep);
    setMoralForm({
      respect: rep.moralEvaluation.respect ?? 2,
      cooperation: rep.moralEvaluation.cooperation ?? 2,
      responsibility: rep.moralEvaluation.responsibility ?? 2,
      goodConduct: rep.moralEvaluation.goodConduct ?? 2,
      behavioralDiscipline: rep.moralEvaluation.behavioralDiscipline ?? 2,
      notes: rep.moralEvaluation.notes || '',
    });
  };

  // حفظ تقييم المحور الأخلاقي
  const handleSaveMoralEvaluation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!moralModalReport) return;

    const res = dbService.evaluateMoralAxis({
      reportId: moralModalReport.id,
      evaluation: moralForm,
      adminName: 'أ. عبد الله المنصور (المسؤول العام)',
    });

    if (res.success) {
      setNotificationMsg(res.message);
      setMoralModalReport(null);
      onRefresh();
      if (inspectReport && inspectReport.id === moralModalReport.id && res.report) {
        setInspectReport(res.report);
      }
      setTimeout(() => setNotificationMsg(null), 3000);
    }
  };

  return (
    <div className="space-y-6">
      {/* الترويسة */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">
            إدارة ومراجعة تقارير الطلاب الشهرية
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            مراجعة محاور التقرير، تقييم المحور الأخلاقي والسلوكي، وإدارة السماح بالتعديل
          </p>
        </div>

        <div className="text-xs text-slate-500">
          إجمالي التقارير المستلمة:{' '}
          <strong className="text-slate-800">{filteredReports.length}</strong> تقرير
        </div>
      </div>

      {notificationMsg && (
        <div className="p-4 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{notificationMsg}</span>
        </div>
      )}

      {/* شريط الفلاتر والبحث */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {/* البحث */}
        <div className="relative sm:col-span-2">
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="بحث باسم الطالب أو رقمه.."
            className="w-full pr-9 pl-3 py-2 text-xs rounded-xl border border-slate-200"
          />
        </div>

        {/* الشهر */}
        <select
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
          className="px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white"
        >
          <option value={0}>جميع الأشهر</option>
          {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
            <option key={m} value={m}>
              شهر {m}
            </option>
          ))}
        </select>

        {/* المرحلة */}
        <select
          value={selectedStage}
          onChange={(e) => setSelectedStage(e.target.value)}
          className="px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white"
        >
          <option value="ALL">جميع المراحل</option>
          <option value="المرحلة الثانوية">المرحلة الثانوية</option>
          <option value="المرحلة الجامعية">المرحلة الجامعية</option>
          <option value="مرحلة التأهيل والتدريب">مرحلة التأهيل والتدريب</option>
        </select>

        {/* الحالة */}
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white"
        >
          <option value="ALL">جميع الحالات</option>
          <option value="submitted">تم التسليم</option>
          <option value="locked">معتمد ومقفل</option>
        </select>
      </div>

      {/* جدول التقارير */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">الطالب</th>
                <th className="py-3 px-4">الشهر / السنة</th>
                <th className="py-3 px-4">المقرر العلمي</th>
                <th className="py-3 px-4 text-center">المجموع (100)</th>
                <th className="py-3 px-4">التقدير</th>
                <th className="py-3 px-4 text-center">الأخلاقي (المشرف)</th>
                <th className="py-3 px-4">الحالة والتعديل</th>
                <th className="py-3 px-4 text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredReports.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-slate-400">
                    لا توجد تقارير مطابقة للشروط المحددة
                  </td>
                </tr>
              ) : (
                filteredReports.map((rep) => (
                  <tr key={rep.id} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      {rep.studentName}
                      <span className="block text-[10px] text-slate-400 font-normal font-mono">
                        {rep.studentCode} • {rep.educationalStage}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600 font-medium">
                      شهر {rep.month} / {rep.year}
                    </td>
                    <td className="py-3 px-4 text-slate-600 truncate max-w-xs">
                      {rep.scientificPerformance.bookName || 'غير مسجل'}
                    </td>
                    <td className="py-3 px-4 text-center font-black text-sm text-teal-700">
                      {rep.totalScore}
                    </td>
                    <td className="py-3 px-4">
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
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => handleOpenMoralModal(rep)}
                        className="px-2 py-1 rounded bg-teal-50 hover:bg-teal-100 text-teal-800 font-bold text-[11px] transition inline-flex items-center gap-1"
                        title="تقييم معايير المحور الأخلاقي لهذا الطالب"
                      >
                        <span>{rep.moralEvaluation.score} / 10</span>
                        <Sparkles className="w-3 h-3 text-teal-600" />
                      </button>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center gap-1 text-[11px] font-bold ${
                          rep.editAllowed
                            ? 'text-emerald-700'
                            : 'text-slate-500'
                        }`}
                      >
                        {rep.editAllowed ? (
                          <>
                            <Unlock className="w-3.5 h-3.5 text-emerald-600" />
                            <span>التعديل متاح للطالب</span>
                          </>
                        ) : (
                          <>
                            <Lock className="w-3.5 h-3.5 text-slate-400" />
                            <span>مقفل</span>
                          </>
                        )}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-center gap-1.5">
                        {/* عرض التقرير كاملاً */}
                        <button
                          onClick={() => setInspectReport(rep)}
                          className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>فتح</span>
                        </button>

                        {/* زر قفل / فتح التعديل */}
                        <button
                          onClick={() => handleToggleLock(rep.id, rep.editAllowed)}
                          className={`p-1.5 rounded transition ${
                            rep.editAllowed
                              ? 'text-amber-700 hover:bg-amber-100'
                              : 'text-emerald-700 hover:bg-emerald-100'
                          }`}
                          title={
                            rep.editAllowed
                              ? 'إيقاف وقفل التعديل عن الطالب'
                              : 'إعادة السماح للطالب بالتعديل'
                          }
                        >
                          {rep.editAllowed ? (
                            <Lock className="w-4 h-4" />
                          ) : (
                            <Unlock className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* بطاقة متابعة الطلاب الذين لم يقدموا تقرير الشهر الحالي */}
      {missingStudents.length > 0 && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600" />
              <span>
                متابعة الطلاب المتأخرين عن تسليم تقرير شهر {selectedMonth || settings.currentMonth} ({missingStudents.length} طالب)
              </span>
            </h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {missingStudents.map((s) => (
              <span
                key={s.id}
                className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-rose-50 text-rose-800 border border-rose-200 text-xs font-semibold"
              >
                <span>{s.fullName}</span>
                <span className="text-[10px] text-rose-500 font-mono">({s.studentId})</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* نافذة معاينة التقرير كاملاً */}
      {inspectReport && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-4xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  تقرير شهر {inspectReport.month} / {inspectReport.year} للطالب: {inspectReport.studentName}
                </h2>
                <p className="text-xs text-slate-500">
                  الرقم التعريفي: {inspectReport.studentCode} • المرحلة: {inspectReport.educationalStage} • تاريخ الإنشاء: {new Date(inspectReport.createdAt).toLocaleDateString('ar-SA')}
                </p>
              </div>
              <button
                onClick={() => setInspectReport(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* بطاقة النتيجة والمحاور */}
            <div className="p-4 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-between">
              <div>
                <span className="text-xs text-teal-800 block">المجموع النهائي والتقدير</span>
                <div className="text-3xl font-black text-teal-900">
                  {inspectReport.totalScore} <span className="text-sm font-normal text-teal-700">/ 100</span>
                </div>
              </div>
              <div className="text-left">
                <span className="px-3 py-1 rounded-full bg-teal-800 text-white font-bold text-xs">
                  {inspectReport.gradeDescription}
                </span>
                <span className="block text-[11px] text-teal-700 mt-1">
                  آخر تعديل: {new Date(inspectReport.updatedAt).toLocaleDateString('ar-SA')}
                </span>
              </div>
            </div>

            {/* تفاصيل المحاور السبعة */}
            <div className="space-y-4 text-xs">
              <div className="p-4 rounded-xl border border-slate-200 space-y-2">
                <div className="flex justify-between font-bold text-slate-800">
                  <span>1. الأداء العلمي (30 نقطة)</span>
                  <span className="text-teal-700">{inspectReport.scientificPerformance.score} / 30</span>
                </div>
                <p className="text-slate-600">
                  الكتاب: <strong>{inspectReport.scientificPerformance.bookName}</strong> • قرأ {inspectReport.scientificPerformance.pagesRead} صفحة من أصل {inspectReport.scientificPerformance.totalPages} صفحة (إنجاز: {inspectReport.scientificPerformance.completionPercentage}%)
                </p>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 space-y-2">
                <div className="flex justify-between font-bold text-slate-800">
                  <span>2. جلسات المناقشة (20 نقطة)</span>
                  <span className="text-teal-700">{inspectReport.discussionSessions.score} / 20</span>
                </div>
                <p className="text-slate-600">
                  حضر {inspectReport.discussionSessions.attendedCount} من 4 جلسات مقررة.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 space-y-2">
                <div className="flex justify-between font-bold text-slate-800">
                  <span>3. الأداء الدعوي (20 نقطة)</span>
                  <span className="text-teal-700">{inspectReport.dawahPerformance.score} / 20</span>
                </div>
                <p className="text-slate-600">
                  سجل {inspectReport.dawahPerformance.totalActivities} أنشطة دعوية بإجمالي {inspectReport.dawahPerformance.totalBeneficiaries} مستفيد.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 space-y-2">
                <div className="flex justify-between font-bold text-slate-800">
                  <span>4. الالتزام والانضباط (10 نقاط)</span>
                  <span className="text-teal-700">{inspectReport.discipline.score} / 10</span>
                </div>
                <p className="text-slate-600">
                  غياب: {inspectReport.discipline.unexcusedAbsences} • تأخر: {inspectReport.discipline.delaysCount} • مهام منجزة: {inspectReport.discipline.tasksCompleted}
                </p>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 space-y-2">
                <div className="flex justify-between font-bold text-slate-800">
                  <span>5. الأداء الأخلاقي والسلوكي (10 نقاط)</span>
                  <span className="text-teal-700">{inspectReport.moralEvaluation.score} / 10</span>
                </div>
                <p className="text-slate-600">
                  ملاحظة المشرف: {inspectReport.moralEvaluation.notes || 'استيفاء المعايير السلوكية'}
                </p>
              </div>

              {/* المحاور الوصفية */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="font-bold text-slate-800 block mb-1">المحور 8: التحديات والصعوبات:</span>
                  <p className="text-slate-600">{inspectReport.challenges.description || 'لم تسجل صعوبات'}</p>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="font-bold text-slate-800 block mb-1">المحور 9: خطة الشهر القادم:</span>
                  <p className="text-slate-600">{inspectReport.nextMonthPlan.goals || 'لم تسجل خطة'}</p>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200 flex justify-between items-center text-xs">
              <span className="text-slate-400">
                * التزاماً بالمعايير، لا يستطيع المسؤول تحرير نصوص التقرير نيابة عن الطالب.
              </span>
              <button
                onClick={() => setInspectReport(null)}
                className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* نافذة منبثقة: تقييم المشرف للمحور الأخلاقي والسلوكي (10 نقاط) */}
      {moralModalReport && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-1">
              تقييم المحور الأخلاقي والسلوكي (10 نقاط)
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              للطالب: <strong>{moralModalReport.studentName}</strong> • شهر {moralModalReport.month} / {moralModalReport.year}
            </p>

            <form onSubmit={handleSaveMoralEvaluation} className="space-y-3.5 text-xs">
              {[
                { key: 'respect', label: '1. الاحترام والتوقير (0 - 2)' },
                { key: 'cooperation', label: '2. التعاون والمبادرة (0 - 2)' },
                { key: 'responsibility', label: '3. تحمل المسؤولية والجدية (0 - 2)' },
                { key: 'goodConduct', label: '4. حسن التعامل والسمت (0 - 2)' },
                { key: 'behavioralDiscipline', label: '5. الانضباط السلوكي العام (0 - 2)' },
              ].map((item) => (
                <div key={item.key} className="flex items-center justify-between p-2 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="font-semibold text-slate-700">{item.label}</span>
                  <select
                    value={(moralForm as any)[item.key]}
                    onChange={(e) =>
                      setMoralForm({
                        ...moralForm,
                        [item.key]: parseInt(e.target.value),
                      })
                    }
                    className="px-3 py-1 text-xs rounded-lg border border-slate-300 bg-white font-bold text-teal-800"
                  >
                    <option value={2}>2 (ممتاز - مستوفى)</option>
                    <option value={1}>1 (متوسط)</option>
                    <option value={0}>0 (غير مستوفى)</option>
                  </select>
                </div>
              ))}

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  ملاحظات وتوجيهات المشرف للطالب
                </label>
                <textarea
                  rows={2}
                  value={moralForm.notes}
                  onChange={(e) => setMoralForm({ ...moralForm, notes: e.target.value })}
                  placeholder="ملاحظات توجيهية وتعزيزية.."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setMoralModalReport(null)}
                  className="px-4 py-2 rounded-xl text-slate-600 font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold"
                >
                  حفظ التقييم وتحديث الدرجة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
