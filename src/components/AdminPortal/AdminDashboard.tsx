import React from 'react';
import {
  Users,
  UserCheck,
  UserX,
  FileCheck2,
  FileX,
  Award,
  TrendingUp,
  Compass,
  Sparkles,
  ArrowUpRight,
  ShieldAlert,
  Download,
  Upload,
  Calendar,
  Layers,
} from 'lucide-react';
import { User, MonthlyReport, SystemSettings } from '../../types';

interface AdminDashboardProps {
  students: User[];
  reports: MonthlyReport[];
  settings: SystemSettings;
  onNavigateTab: (tab: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  students,
  reports,
  settings,
  onNavigateTab,
}) => {
  const currentMonth = settings.currentMonth;
  const currentYear = settings.currentYear;

  const studentUsers = students.filter((s) => s.role === 'student');
  const pendingStudents = studentUsers.filter((s) => s.status === 'pending');
  const activeStudents = studentUsers.filter((s) => s.status === 'active');
  const suspendedStudents = studentUsers.filter((s) => s.status === 'suspended');

  // تقارير هذا الشهر
  const currentMonthReports = reports.filter(
    (r) => r.month === currentMonth && r.year === currentYear
  );

  // معرفات الطلاب الذين قدموا تقارير هذا الشهر
  const submittedStudentIds = new Set(currentMonthReports.map((r) => r.studentId));
  const missingStudentsCount = Math.max(
    0,
    activeStudents.filter((s) => !submittedStudentIds.has(s.id)).length
  );

  // المتوسطات الإحصائية
  const averageScore =
    currentMonthReports.length > 0
      ? Math.round(
          (currentMonthReports.reduce((acc, r) => acc + r.totalScore, 0) /
            currentMonthReports.length) *
            10
        ) / 10
      : 0;

  const totalDawah = currentMonthReports.reduce(
    (acc, r) => acc + (r.dawahPerformance.totalActivities || 0),
    0
  );

  const totalAchievements = currentMonthReports.reduce(
    (acc, r) => acc + (r.monthlyAchievements.achievements.length || 0),
    0
  );

  const averageAttendance =
    currentMonthReports.length > 0
      ? Math.round(
          (currentMonthReports.reduce(
            (acc, r) => acc + r.discussionSessions.attendedCount,
            0
          ) /
            (currentMonthReports.length * 4)) *
            100
        )
      : 0;

  // توزيع التقديرات الوصفية
  const gradeDistribution = {
    ممتاز: currentMonthReports.filter((r) => r.gradeDescription === 'ممتاز').length,
    'جيد جداً': currentMonthReports.filter((r) => r.gradeDescription === 'جيد جداً').length,
    جيد: currentMonthReports.filter((r) => r.gradeDescription === 'جيد').length,
    مقبول: currentMonthReports.filter((r) => r.gradeDescription === 'مقبول').length,
    'يحتاج إلى تحسين': currentMonthReports.filter(
      (r) => r.gradeDescription === 'يحتاج إلى تحسين'
    ).length,
  };

  return (
    <div className="space-y-6">
      {/* الترويسة الرئيسية والإحصائيات العاجلة */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-800 border border-teal-200">
              العام الدراسي: {settings.currentAcademicYear}
            </span>
            <span className="text-xs text-slate-400">• شهر المتابعة الحالي: {currentMonth} / {currentYear}</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            لوحة تحكم المسؤول والإحصاءات العامة
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            متابعة مركزية لكافة حسابات الطلاب وتقارير الإنجاز على كمبيوتر المسؤول
          </p>
        </div>

        {/* تنبيه سريع إن وُجدت حسابات بانتظار الموافقة */}
        {pendingStudents.length > 0 && (
          <button
            onClick={() => onNavigateTab('students')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 text-xs font-bold transition animate-pulse"
          >
            <ShieldAlert className="w-4 h-4 text-amber-600" />
            <span>يوجد {pendingStudents.length} حسابات جديدة بانتظار الموافقة والتفعيل</span>
          </button>
        )}
      </div>

      {/* بطاقات المؤشرات الرقمية الـ 8 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* إجمالي الطلاب */}
        <div
          onClick={() => onNavigateTab('students')}
          className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:border-teal-400 transition cursor-pointer"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500">إجمالي الطلاب</span>
            <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900">{studentUsers.length}</div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1.5">
            <span className="text-emerald-700 font-semibold">{activeStudents.length} نشط</span>
            <span>•</span>
            <span className="text-amber-700 font-semibold">{pendingStudents.length} بانتظار الموافقة</span>
          </div>
        </div>

        {/* التقارير المقدمة هذا الشهر */}
        <div
          onClick={() => onNavigateTab('reports')}
          className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:border-teal-400 transition cursor-pointer"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500">التقارير المقدمة (شهر {currentMonth})</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <FileCheck2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900">{currentMonthReports.length}</div>
          <div className="text-[11px] text-slate-500 mt-1">
            من إجمالي {activeStudents.length} طالب نشط
          </div>
        </div>

        {/* طلاب لم يقدموا التقرير */}
        <div
          onClick={() => onNavigateTab('reports')}
          className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:border-teal-400 transition cursor-pointer"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500">التقارير المتأخرة / المطلوبة</span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-700 flex items-center justify-center">
              <FileX className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-rose-700">{missingStudentsCount}</div>
          <div className="text-[11px] text-slate-500 mt-1">
            طالب لم يرفعوا تقرير هذا الشهر بعد
          </div>
        </div>

        {/* متوسط الدرجات */}
        <div
          onClick={() => onNavigateTab('ranking')}
          className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:border-teal-400 transition cursor-pointer"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500">متوسط درجات الشهر</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-teal-700">
            {averageScore} <span className="text-sm text-slate-400 font-normal">/ 100</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            معدل الحضور: <strong className="text-slate-700">{averageAttendance}%</strong>
          </div>
        </div>

        {/* إجمالي الأنشطة الدعوية */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500">إجمالي الأنشطة الدعوية</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
              <Compass className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900">{totalDawah}</div>
          <div className="text-[11px] text-slate-500 mt-1">
            خطب، محاضرات، ندوات ودروس
          </div>
        </div>

        {/* إجمالي الإنجازات المسجلة */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500">الإنجازات المتميزة</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900">{totalAchievements}</div>
          <div className="text-[11px] text-slate-500 mt-1">
            حفظ متون، قراءات، جوائز ومبادرات
          </div>
        </div>

        {/* الحسابات المعلقة */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500">الحسابات المعلقة</span>
            <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
              <UserX className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-800">{suspendedStudents.length}</div>
          <div className="text-[11px] text-slate-500 mt-1">
            حسابات تم إيقاف نشاطها مؤقتاً
          </div>
        </div>

        {/* حالة قاعدة البيانات المركزية */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500">موقع قاعدة البيانات</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="text-base font-bold text-emerald-800">جهاز المسؤول المحلي</div>
          <div className="text-[11px] text-slate-500 mt-1">
            لا توجد سحابة خارجية • خصوصية تامة
          </div>
        </div>
      </div>

      {/* توزيع الطلاب حسب التقديرات وجدول التقارير الأخيرة */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* توزيع التقديرات الوصفية */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Award className="w-4 h-4 text-teal-700" />
            <span>توزيع تقديرات الطلاب (شهر {currentMonth})</span>
          </h3>

          <div className="space-y-3">
            {[
              { label: 'ممتاز (90 - 100)', count: gradeDistribution['ممتاز'], color: 'bg-emerald-600' },
              { label: 'جيد جداً (80 - 89.9)', count: gradeDistribution['جيد جداً'], color: 'bg-teal-600' },
              { label: 'جيد (70 - 79.9)', count: gradeDistribution['جيد'], color: 'bg-blue-600' },
              { label: 'مقبول (60 - 69.9)', count: gradeDistribution['مقبول'], color: 'bg-amber-500' },
              { label: 'يحتاج إلى تحسين (< 60)', count: gradeDistribution['يحتاج إلى تحسين'], color: 'bg-rose-500' },
            ].map((item, idx) => {
              const total = Math.max(1, currentMonthReports.length);
              const percent = Math.round((item.count / total) * 100);
              return (
                <div key={idx}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-medium text-slate-700">{item.label}</span>
                    <span className="font-bold text-slate-900">
                      {item.count} طلاب ({percent}%)
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className={`h-full ${item.color} rounded-full transition-all duration-500`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 flex justify-between items-center text-xs">
            <span className="text-slate-500">إجمالي التقارير المحسوبة:</span>
            <strong className="text-slate-800">{currentMonthReports.length} تقرير</strong>
          </div>
        </div>

        {/* جدول أحدث التقارير المستلمة للإشراف السريع */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-teal-700" />
              <span>أحدث تقارير الطلاب المستلمة</span>
            </h3>
            <button
              onClick={() => onNavigateTab('reports')}
              className="text-xs font-bold text-teal-700 hover:text-teal-800 hover:underline"
            >
              عرض كافة التقارير
            </button>
          </div>

          {reports.length === 0 ? (
            <p className="text-center py-10 text-xs text-slate-400">لا توجد تقارير مسجلة</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-semibold pb-2">
                    <th className="py-2">الطالب</th>
                    <th className="py-2">المرحلة</th>
                    <th className="py-2">الشهر</th>
                    <th className="py-2 text-center">الدرجة</th>
                    <th className="py-2">التقدير</th>
                    <th className="py-2">الحالة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {reports.slice(0, 5).map((rep) => (
                    <tr key={rep.id} className="hover:bg-slate-50 transition">
                      <td className="py-2.5 font-bold text-slate-800">
                        {rep.studentName}
                        <span className="block text-[10px] text-slate-400 font-normal font-mono">
                          {rep.studentCode}
                        </span>
                      </td>
                      <td className="py-2.5 text-slate-600">{rep.educationalStage}</td>
                      <td className="py-2.5 text-slate-600">شهر {rep.month}</td>
                      <td className="py-2.5 text-center font-bold text-teal-700 text-sm">
                        {rep.totalScore}
                      </td>
                      <td className="py-2.5">
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
                      <td className="py-2.5">
                        {rep.status === 'locked' ? (
                          <span className="text-slate-500 font-medium">معتمد ومقفل</span>
                        ) : (
                          <span className="text-emerald-600 font-medium">تم التسليم</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
