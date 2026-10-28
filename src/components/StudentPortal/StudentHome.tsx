import React from 'react';
import {
  BookOpen,
  Users,
  Award,
  Sparkles,
  Calendar,
  CheckCircle2,
  Clock,
  ArrowRight,
  TrendingUp,
  FileText,
  AlertCircle,
} from 'lucide-react';
import { User, MonthlyReport } from '../../types';

interface StudentHomeProps {
  user: User;
  reports: MonthlyReport[];
  currentDraft: MonthlyReport | null;
  onOpenReportForm: (reportId?: string) => void;
  onViewPastReports: () => void;
}

export const StudentHome: React.FC<StudentHomeProps> = ({
  user,
  reports,
  currentDraft,
  onOpenReportForm,
  onViewPastReports,
}) => {
  const currentMonth = 10;
  const currentYear = 2026;

  // فحص حالة تقرير الشهر الحالي
  const currentSubmitted = reports.find(
    (r) => r.month === currentMonth && r.year === currentYear
  );

  const latestReport = reports[0]; // التقرير الأحدث المعتمد أو المسلم

  // درجات التقارير السابقة للمخطط البياني الشخصي للطالب
  const historicalReports = [...reports].sort((a, b) => {
    if (a.year !== b.year) return a.year - b.year;
    return a.month - b.month;
  });

  return (
    <div className="space-y-6">
      {/* بطاقة الترحيب والبيانات الأساسية للطالب */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-teal-50 border border-teal-200/60 flex items-center justify-center text-teal-700 font-bold text-xl">
              {user.fullName.slice(0, 2)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900">
                  مرحباً بك، {user.fullName}
                </h1>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  طالب منتظم
                </span>
              </div>
              <p className="text-sm text-slate-500 mt-1">
                الرقم التعريفي: <span className="font-mono font-medium text-slate-700">{user.studentId}</span> • المرحلة: <span className="font-medium text-slate-700">{user.educationalStage}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-stretch sm:self-auto">
            <div className="text-right sm:text-left">
              <span className="text-xs text-slate-400 block">المشرف المباشر</span>
              <span className="text-sm font-semibold text-slate-700">
                {user.supervisorName || 'المسؤول العام'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* بطاقة متابعة تقرير الشهر الحالي */}
      <div className="bg-linear-to-l from-teal-50/70 to-white rounded-2xl p-6 border-2 border-teal-500/20 shadow-xs">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-teal-700" />
              <h2 className="text-lg font-bold text-slate-900">
                تقرير شهر أكتوبر ({currentMonth}) / {currentYear}
              </h2>
              {currentSubmitted ? (
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  تم التسليم بنجاح
                </span>
              ) : currentDraft ? (
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800">
                  مسودة محفوظة محلياً
                </span>
              ) : (
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-sky-100 text-sky-800">
                  مطلوب إعداد التقرير
                </span>
              )}
            </div>
            <p className="text-sm text-slate-600 max-w-2xl leading-relaxed">
              {currentSubmitted
                ? `تم تسليم التقرير بدرجة نهائية ${currentSubmitted.totalScore}/100 (${currentSubmitted.gradeDescription}). يمكنك الاطلاع على تفاصيل الدرجات والملاحظات الإشرافية.`
                : currentDraft
                ? 'لديك مسودة تقرير قيد التحرير تم حفظها تلقائياً على هذا الجهاز بدون اتصال. اضغط لمتابعة تعبئة بقية المحاور.'
                : 'بدأت فترة إعداد التقرير الشهري. التقرير يشمل 10 محاور تبدأ بنموذج فارغ، ويحفظ تلقائياً أثناء الكتابة.'}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {currentSubmitted ? (
              <button
                onClick={() => onOpenReportForm(currentSubmitted.id)}
                className="px-5 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-sm shadow-sm transition flex items-center gap-2"
              >
                <span>عرض تفاصيل التقرير</span>
                <ArrowRight className="w-4 h-4 rotate-180" />
              </button>
            ) : (
              <button
                onClick={() => onOpenReportForm(currentDraft?.id)}
                className="px-5 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-sm shadow-sm transition flex items-center gap-2"
              >
                <span>{currentDraft ? 'متابعة التقرير الحالي' : 'إنشاء تقرير شهري جديد'}</span>
                <ArrowRight className="w-4 h-4 rotate-180" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ملخص آخر نتيجة معتمدة وتوزيع الدرجات على المحاور السبعة */}
      {latestReport && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* بطاقة النتيجة الإجمالية */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold text-slate-500 uppercase">
                  نتيجة شهر {latestReport.month} / {latestReport.year}
                </span>
                <span
                  className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                    latestReport.totalScore >= 90
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : latestReport.totalScore >= 80
                      ? 'bg-teal-50 text-teal-800 border border-teal-200'
                      : latestReport.totalScore >= 70
                      ? 'bg-blue-50 text-blue-800 border border-blue-200'
                      : 'bg-amber-50 text-amber-800 border border-amber-200'
                  }`}
                >
                  {latestReport.gradeDescription}
                </span>
              </div>

              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-5xl font-black text-slate-900">
                  {latestReport.totalScore}
                </span>
                <span className="text-xl font-bold text-slate-400">/ 100</span>
              </div>

              <p className="text-xs text-slate-500 leading-relaxed">
                تم احتساب الدرجة بناء على المحاور السبعة الرسمية بدقة متناهية.
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>تاريخ الاعتماد:</span>
              <span className="font-medium text-slate-700">
                {new Date(latestReport.updatedAt).toLocaleDateString('ar-SA')}
              </span>
            </div>
          </div>

          {/* توزيع الدرجات على المحاور السبعة */}
          <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
            <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-teal-600" />
              <span>توزيع درجات المحاور السبعة (شهر {latestReport.month})</span>
            </h3>

            <div className="space-y-3.5">
              {/* المحور 1: الأداء العلمي (30) */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-semibold text-slate-700">1. الأداء العلمي</span>
                  <span className="font-bold text-teal-700">
                    {latestReport.scientificPerformance.score} / 30 ({latestReport.scientificPerformance.completionPercentage}%)
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full bg-teal-600 rounded-full transition-all duration-500"
                    style={{
                      width: `${(latestReport.scientificPerformance.score / 30) * 100}%`,
                    }}
                  />
                </div>
              </div>

              {/* المحور 2: جلسات المناقشة (20) */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-semibold text-slate-700">2. جلسات المناقشة (4 جلسات)</span>
                  <span className="font-bold text-teal-700">
                    {latestReport.discussionSessions.score} / 20 ({latestReport.discussionSessions.attendedCount} من 4)
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full bg-teal-600 rounded-full transition-all duration-500"
                    style={{
                      width: `${(latestReport.discussionSessions.score / 20) * 100}%`,
                    }}
                  />
                </div>
              </div>

              {/* المحور 3: الأداء الدعوي (20) */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-semibold text-slate-700">3. الأداء الدعوي</span>
                  <span className="font-bold text-teal-700">
                    {latestReport.dawahPerformance.score} / 20 ({latestReport.dawahPerformance.totalActivities} أنشطة • {latestReport.dawahPerformance.totalBeneficiaries} مستفيد)
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full bg-teal-600 rounded-full transition-all duration-500"
                    style={{
                      width: `${(latestReport.dawahPerformance.score / 20) * 100}%`,
                    }}
                  />
                </div>
              </div>

              {/* المحور 4: الالتزام والانضباط (10) */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-semibold text-slate-700">4. الالتزام والانضباط</span>
                  <span className="font-bold text-teal-700">
                    {latestReport.discipline.score} / 10
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full bg-teal-600 rounded-full transition-all duration-500"
                    style={{
                      width: `${(latestReport.discipline.score / 10) * 100}%`,
                    }}
                  />
                </div>
              </div>

              {/* المحور 5: الأداء الأخلاقي والسلوكي (10) */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-semibold text-slate-700">5. الأداء الأخلاقي والسلوكي (المشرف)</span>
                  <span className="font-bold text-teal-700">
                    {latestReport.moralEvaluation.score} / 10
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full bg-teal-600 rounded-full transition-all duration-500"
                    style={{
                      width: `${(latestReport.moralEvaluation.score / 10) * 100}%`,
                    }}
                  />
                </div>
              </div>

              {/* المحاور 6 و 7: الثقافي (5) والإنجازات (5) */}
              <div className="grid grid-cols-2 gap-4 pt-1">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-semibold text-slate-700">6. الأنشطة الثقافية</span>
                    <span className="font-bold text-teal-700">
                      {latestReport.culturalActivities.score} / 5
                    </span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full bg-teal-600 rounded-full"
                      style={{
                        width: `${(latestReport.culturalActivities.score / 5) * 100}%`,
                      }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-semibold text-slate-700">7. الإنجازات الشهرية</span>
                    <span className="font-bold text-teal-700">
                      {latestReport.monthlyAchievements.score} / 5
                    </span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full bg-teal-600 rounded-full"
                      style={{
                        width: `${(latestReport.monthlyAchievements.score / 5) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* مخطط التطور الشخصي عبر الأشهر السابقة */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-teal-700" />
            <h3 className="font-bold text-slate-900 text-base">
              مخطط تطور أدائك الفردي عبر الأشهر
            </h3>
          </div>
          <button
            onClick={onViewPastReports}
            className="text-xs font-semibold text-teal-700 hover:text-teal-800 hover:underline"
          >
            عرض سجل كافة التقارير السابقة
          </button>
        </div>

        {historicalReports.length === 0 ? (
          <p className="text-center py-8 text-sm text-slate-400">
            لا توجد تقارير سابقة كافية لرسم منحنى التطور بعد.
          </p>
        ) : (
          <div className="space-y-4">
            <div className="flex items-end justify-between gap-4 h-44 pt-6 px-4 border-b border-slate-100">
              {historicalReports.map((rep) => {
                const heightPercent = Math.max(15, Math.round(rep.totalScore));
                return (
                  <div
                    key={rep.id}
                    className="flex-1 flex flex-col items-center gap-2 h-full justify-end group"
                  >
                    <span className="text-xs font-bold text-slate-700 group-hover:text-teal-700 transition">
                      {rep.totalScore}
                    </span>
                    <div
                      className="w-full max-w-[48px] rounded-t-lg bg-teal-600/80 group-hover:bg-teal-700 transition-all duration-300 relative"
                      style={{ height: `${heightPercent}%` }}
                    >
                      <div className="absolute inset-0 bg-white/10 rounded-t-lg" />
                    </div>
                    <span className="text-xs text-slate-500 font-medium whitespace-nowrap">
                      شهر {rep.month}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-center gap-6 text-xs text-slate-500 pt-2">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-xs bg-teal-600" />
                <span>الدرجة النهائية للشهر (من 100)</span>
              </span>
              <span className="text-slate-400">
                * تُعرض درجاتك وتطورك الشخصي فقط دون ترتيب أو كشف لبيانات زملائك
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
