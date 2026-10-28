import React, { useState, useEffect, useRef } from 'react';
import {
  Save,
  Send,
  BookOpen,
  Users,
  Award,
  Sparkles,
  Shield,
  Compass,
  FileCheck2,
  Calendar,
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Lock,
  ArrowRight,
  Info,
} from 'lucide-react';
import {
  MonthlyReport,
  User,
  DawahActivity,
  CulturalActivity,
  MonthlyAchievement,
} from '../../types';
import { recalculateFullReport } from '../../services/scoringEngine';
import { dbService, generateUUID } from '../../services/dbStorage';

interface ReportFormProps {
  user: User;
  report: MonthlyReport;
  onSaveDraft: (updated: MonthlyReport) => void;
  onSubmitReport: (updated: MonthlyReport) => void;
  onBack: () => void;
  isReadOnly?: boolean;
}

export const ReportForm: React.FC<ReportFormProps> = ({
  user,
  report: initialReport,
  onSaveDraft,
  onSubmitReport,
  onBack,
  isReadOnly = false,
}) => {
  const [report, setReport] = useState<MonthlyReport>(initialReport);
  const [activeTab, setActiveTab] = useState<number>(0);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [errors, setErrors] = useState<string[]>([]);
  const autosaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // تحديث الحسابات وإعادة الحساب عند أي تغيير
  const handleUpdate = (updater: (prev: MonthlyReport) => MonthlyReport) => {
    if (isReadOnly || !report.editAllowed) return;

    setReport((prev) => {
      const next = updater(prev);
      const recalculated = recalculateFullReport(next);

      // حفظ مسودة تلقائي في الذاكرة المحلية
      setSaveStatus('saving');
      if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
      autosaveTimerRef.current = setTimeout(() => {
        dbService.saveDraftLocally(recalculated);
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
      }, 1000);

      return recalculated;
    });
  };

  useEffect(() => {
    return () => {
      if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
    };
  }, []);

  // إضافة نشاط دعوي جديد
  const handleAddDawahActivity = () => {
    const newActivity: DawahActivity = {
      id: generateUUID(),
      type: 'خطبة',
      date: new Date().toISOString().substring(0, 10),
      title: '',
      role: 'مقدّم',
      targetGroup: 'المجتمع المحلي',
      beneficiariesCount: 50,
    };

    handleUpdate((prev) => ({
      ...prev,
      dawahPerformance: {
        ...prev.dawahPerformance,
        activities: [...prev.dawahPerformance.activities, newActivity],
      },
    }));
  };

  // حذف نشاط دعوي
  const handleRemoveDawahActivity = (id: string) => {
    handleUpdate((prev) => ({
      ...prev,
      dawahPerformance: {
        ...prev.dawahPerformance,
        activities: prev.dawahPerformance.activities.filter((a) => a.id !== id),
      },
    }));
  };

  // إضافة نشاط ثقافي جديد
  const handleAddCulturalActivity = () => {
    const newAct: CulturalActivity = {
      id: generateUUID(),
      title: '',
      type: 'نشاط اجتماعي',
      date: new Date().toISOString().substring(0, 10),
      role: 'مشارك',
      description: '',
    };
    handleUpdate((prev) => ({
      ...prev,
      culturalActivities: {
        ...prev.culturalActivities,
        activities: [...prev.culturalActivities.activities, newAct],
      },
    }));
  };

  const handleRemoveCulturalActivity = (id: string) => {
    handleUpdate((prev) => ({
      ...prev,
      culturalActivities: {
        ...prev.culturalActivities,
        activities: prev.culturalActivities.activities.filter((a) => a.id !== id),
      },
    }));
  };

  // إضافة إنجاز شهري جديد
  const handleAddAchievement = () => {
    const newAch: MonthlyAchievement = {
      id: generateUUID(),
      title: '',
      date: new Date().toISOString().substring(0, 10),
      description: '',
      category: 'عام',
    };
    handleUpdate((prev) => ({
      ...prev,
      monthlyAchievements: {
        ...prev.monthlyAchievements,
        achievements: [...prev.monthlyAchievements.achievements, newAch],
      },
    }));
  };

  const handleRemoveAchievement = (id: string) => {
    handleUpdate((prev) => ({
      ...prev,
      monthlyAchievements: {
        ...prev.monthlyAchievements,
        achievements: prev.monthlyAchievements.achievements.filter((a) => a.id !== id),
      },
    }));
  };

  // إرسال التقرير النهائي والتحقق من النواقص
  const handleFinalSubmit = () => {
    const errs: string[] = [];

    if (!report.scientificPerformance.bookName.trim()) {
      errs.push('المحور العلمي: اسم الكتاب أو المقرر مطلوب.');
    }
    if (report.scientificPerformance.totalPages <= 0) {
      errs.push('المحور العلمي: إجمالي صفحات الكتاب يجب أن يكون أكبر من صفر.');
    }
    if (
      report.scientificPerformance.pagesRead >
      report.scientificPerformance.totalPages
    ) {
      errs.push(
        'المحور العلمي: عدد الصفحات المقروءة لا يمكن أن يتجاوز إجمالي صفحات الكتاب.'
      );
    }

    if (errs.length > 0) {
      setErrors(errs);
      setActiveTab(0);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setErrors([]);
    onSubmitReport(report);
  };

  const tabs = [
    { title: '1. العلمي والمناقشة', score: `${report.scientificPerformance.score + report.discussionSessions.score} / 50` },
    { title: '2. الدعوي والانضباط', score: `${report.dawahPerformance.score + report.discipline.score} / 30` },
    { title: '3. الأخلاقي والسلوكي', score: `${report.moralEvaluation.score} / 10` },
    { title: '4. الثقافي والإنجازات', score: `${report.culturalActivities.score + report.monthlyAchievements.score} / 10` },
    { title: '5. التحديات والخطة والملخص', score: 'وصفي' },
  ];

  const locked = isReadOnly || !report.editAllowed;

  return (
    <div className="space-y-6">
      {/* شريط الإجراءات والترويسة */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <button
            onClick={onBack}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 mb-2 transition"
          >
            <ArrowRight className="w-4 h-4" />
            <span>العودة للوحة المتابعة</span>
          </button>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-slate-900">
              تقرير متابعة شهر {report.month} / {report.year}
            </h1>
            {locked && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                <Lock className="w-3 h-3" />
                <span>التقرير مقفل للقراءة فقط</span>
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            الطالب: <span className="font-semibold text-slate-700">{report.studentName}</span> • الرقم: <span className="font-mono text-slate-700">{report.studentCode}</span> • المرحلة: <span className="text-slate-700">{report.educationalStage}</span>
          </p>
        </div>

        {/* المجموع اللحظي وأزرار الحفظ */}
        <div className="flex items-center gap-4 self-stretch md:self-auto justify-between md:justify-end">
          <div className="text-right">
            <span className="text-xs text-slate-400 block font-medium">الدرجة المحتسبة</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-teal-700">
                {report.totalScore}
              </span>
              <span className="text-xs font-bold text-slate-400">/ 100</span>
              <span className="text-xs font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded">
                {report.gradeDescription}
              </span>
            </div>
          </div>

          {!locked && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => onSaveDraft(report)}
                className="px-3.5 py-2 rounded-xl text-xs font-bold border border-slate-300 hover:bg-slate-50 text-slate-700 transition flex items-center gap-1.5"
                title="حفظ المسودة محلياً في الذاكرة"
              >
                <Save className="w-3.5 h-3.5 text-slate-500" />
                <span>حفظ مسودة</span>
              </button>

              <button
                onClick={handleFinalSubmit}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-teal-700 hover:bg-teal-800 text-white shadow-xs transition flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>إرسال التقرير ومزامنة</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* مؤشر الحفظ التلقائي في الخلفية */}
      {saveStatus !== 'idle' && (
        <div className="flex items-center justify-end text-xs text-slate-500 gap-1.5 transition">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          <span>تم حفظ المسودة محلياً في ذاكرة جهازك</span>
        </div>
      )}

      {/* تنبيه الأخطاء إن وجدت */}
      {errors.length > 0 && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 text-xs text-rose-800 space-y-1">
          <div className="flex items-center gap-2 font-bold text-rose-900 mb-1">
            <AlertCircle className="w-4 h-4 text-rose-600" />
            <span>يرجى استكمال الحقول الإلزامية قبل الإرسال:</span>
          </div>
          <ul className="list-disc list-inside space-y-0.5">
            {errors.map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      {/* شريط التبويبات للمحاور */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-slate-200 no-scrollbar">
        {tabs.map((tab, idx) => (
          <button
            key={idx}
            onClick={() => setActiveTab(idx)}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center gap-2 ${
              activeTab === idx
                ? 'bg-teal-700 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
            }`}
          >
            <span>{tab.title}</span>
            <span
              className={`text-[11px] px-1.5 py-0.5 rounded ${
                activeTab === idx ? 'bg-teal-800 text-teal-100' : 'bg-slate-100 text-slate-500'
              }`}
            >
              {tab.score}
            </span>
          </button>
        ))}
      </div>

      {/* محتوى التبويبات */}
      <div className="space-y-6">
        {/* التبويب 1: المحور العلمي (30) وجلسات المناقشة (20) */}
        {activeTab === 0 && (
          <div className="space-y-6">
            {/* المحور الأول: الأداء العلمي */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center font-bold text-sm">
                    1
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">
                      المحور الأول: الأداء العلمي (30 نقطة)
                    </h3>
                    <p className="text-xs text-slate-500">
                      المعادلة: (عدد الصفحات المقروءة ÷ إجمالي صفحات المقرر) × 30
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-400 block font-medium">الدرجة المحتسبة</span>
                  <span className="text-lg font-black text-teal-700">
                    {report.scientificPerformance.score} <span className="text-xs font-normal text-slate-400">/ 30</span>
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-3">
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    اسم الكتاب أو المقرر العلمي لهذا الشهر <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    disabled={locked}
                    value={report.scientificPerformance.bookName}
                    onChange={(e) =>
                      handleUpdate((prev) => ({
                        ...prev,
                        scientificPerformance: {
                          ...prev.scientificPerformance,
                          bookName: e.target.value,
                        },
                      }))
                    }
                    placeholder="مثال: زاد المعاد في هدي خير العباد، الجزء الثاني"
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-hidden focus:border-teal-600 disabled:bg-slate-50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    إجمالي صفحات الكتاب أو المقرر <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    disabled={locked}
                    value={report.scientificPerformance.totalPages || ''}
                    onChange={(e) =>
                      handleUpdate((prev) => ({
                        ...prev,
                        scientificPerformance: {
                          ...prev.scientificPerformance,
                          totalPages: Math.max(0, parseInt(e.target.value) || 0),
                        },
                      }))
                    }
                    placeholder="مثال: 250"
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-hidden focus:border-teal-600 disabled:bg-slate-50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    عدد الصفحات المقروءة خلال الشهر <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    disabled={locked}
                    value={report.scientificPerformance.pagesRead || ''}
                    onChange={(e) =>
                      handleUpdate((prev) => ({
                        ...prev,
                        scientificPerformance: {
                          ...prev.scientificPerformance,
                          pagesRead: Math.max(0, parseInt(e.target.value) || 0),
                        },
                      }))
                    }
                    placeholder="مثال: 200"
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-hidden focus:border-teal-600 disabled:bg-slate-50"
                  />
                </div>

                <div className="flex flex-col justify-end">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs flex items-center justify-between">
                    <span className="text-slate-600 font-medium">نسبة الإنجاز العلمي:</span>
                    <span className="font-bold text-teal-700 text-sm">
                      {report.scientificPerformance.completionPercentage}%
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* المحور الثاني: جلسات المناقشة */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center font-bold text-sm">
                    2
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">
                      المحور الثاني: جلسات المناقشة (20 نقطة)
                    </h3>
                    <p className="text-xs text-slate-500">
                      أربع جلسات ثابتة شهرياً. (حاضر = 5 نقاط، غائب = 0 نقطة).
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-400 block font-medium">الدرجة المحتسبة</span>
                  <span className="text-lg font-black text-teal-700">
                    {report.discussionSessions.score} <span className="text-xs font-normal text-slate-400">/ 20</span>
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {report.discussionSessions.sessions.map((s, idx) => (
                  <div
                    key={s.sessionNumber}
                    className={`p-4 rounded-xl border transition cursor-pointer select-none ${
                      s.attended
                        ? 'bg-teal-50/60 border-teal-300 text-teal-900'
                        : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                    onClick={() => {
                      if (locked) return;
                      handleUpdate((prev) => {
                        const updatedSessions = [...prev.discussionSessions.sessions];
                        updatedSessions[idx] = {
                          ...updatedSessions[idx],
                          attended: !updatedSessions[idx].attended,
                        };
                        return {
                          ...prev,
                          discussionSessions: {
                            ...prev.discussionSessions,
                            sessions: updatedSessions,
                          },
                        };
                      });
                    }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold">الجلسة رقم {s.sessionNumber}</span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          s.attended
                            ? 'bg-teal-600 text-white'
                            : 'bg-slate-200 text-slate-600'
                        }`}
                      >
                        {s.attended ? 'حاضر (5 نقاط)' : 'غائب (0)'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      {s.attended
                        ? 'تم تثبيت حضور الجلسة بنجاح.'
                        : 'اضغط للتبديل إلى حاضر إذا حضرت الجلسة.'}
                    </p>
                  </div>
                ))}
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs flex items-center justify-between">
                <span className="text-slate-600">
                  إجمالي الجلسات المحضورة:{' '}
                  <strong className="text-slate-800">
                    {report.discussionSessions.attendedCount} من 4
                  </strong>
                </span>
                <span className="text-teal-700 font-bold">
                  {report.discussionSessions.score} نقاط من 20
                </span>
              </div>
            </div>
          </div>
        )}

        {/* التبويب 2: الأداء الدعوي (20) والالتزام والانضباط (10) */}
        {activeTab === 1 && (
          <div className="space-y-6">
            {/* المحور الثالث: الأداء الدعوي */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center font-bold text-sm">
                    3
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">
                      المحور الثالث: الأداء الدعوي (20 نقطة)
                    </h3>
                    <p className="text-xs text-slate-500">
                      احتساب دقيق حسب الدور: مقدّم (5 نقاط)، منظّم (3 نقاط)، مشارك (2 نقطة). السقف الأقصى 20 نقطة.
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-400 block font-medium">الدرجة المحتسبة</span>
                  <span className="text-lg font-black text-teal-700">
                    {report.dawahPerformance.score} <span className="text-xs font-normal text-slate-400">/ 20</span>
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-600">
                  الأنشطة المسجلة: <strong>{report.dawahPerformance.activities.length}</strong> • إجمالي المستفيدين: <strong>{report.dawahPerformance.totalBeneficiaries}</strong>
                </span>
                {!locked && (
                  <button
                    type="button"
                    onClick={handleAddDawahActivity}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold bg-teal-50 text-teal-700 border border-teal-200 hover:bg-teal-100 transition flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>إضافة نشاط دعوي جديد</span>
                  </button>
                )}
              </div>

              {report.dawahPerformance.activities.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl">
                  لم يتم تسجيل أي نشاط دعوي لهذا الشهر. إذا لم تنفذ نشاطاً يحسب المحور تلقائياً بصفر.
                </div>
              ) : (
                <div className="space-y-3">
                  {report.dawahPerformance.activities.map((act, index) => (
                    <div
                      key={act.id}
                      className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-700">
                          نشاط #{index + 1}
                        </span>
                        {!locked && (
                          <button
                            type="button"
                            onClick={() => handleRemoveDawahActivity(act.id)}
                            className="text-rose-600 hover:text-rose-800 text-xs flex items-center gap-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>حذف</span>
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 mb-1">
                            نوع النشاط
                          </label>
                          <select
                            disabled={locked}
                            value={act.type}
                            onChange={(e) => {
                              const val = e.target.value as any;
                              handleUpdate((prev) => {
                                const acts = [...prev.dawahPerformance.activities];
                                acts[index] = { ...acts[index], type: val };
                                return {
                                  ...prev,
                                  dawahPerformance: { ...prev.dawahPerformance, activities: acts },
                                };
                              });
                            }}
                            className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white"
                          >
                            <option value="خطبة">خطبة</option>
                            <option value="محاضرة">محاضرة</option>
                            <option value="ندوة">ندوة</option>
                            <option value="درس دعوي">درس دعوي</option>
                            <option value="موعظة">موعظة</option>
                            <option value="نشاط دعوي آخر">نشاط دعوي آخر</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 mb-1">
                            دور الطالب في النشاط
                          </label>
                          <select
                            disabled={locked}
                            value={act.role}
                            onChange={(e) => {
                              const val = e.target.value as any;
                              handleUpdate((prev) => {
                                const acts = [...prev.dawahPerformance.activities];
                                acts[index] = { ...acts[index], role: val };
                                return {
                                  ...prev,
                                  dawahPerformance: { ...prev.dawahPerformance, activities: acts },
                                };
                              });
                            }}
                            className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white"
                          >
                            <option value="مقدّم">مقدّم (5 نقاط)</option>
                            <option value="منظّم">منظّم (3 نقاط)</option>
                            <option value="مشارك">مشارك (2 نقطة)</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 mb-1">
                            تاريخ النشاط
                          </label>
                          <input
                            type="date"
                            disabled={locked}
                            value={act.date}
                            onChange={(e) => {
                              const val = e.target.value;
                              handleUpdate((prev) => {
                                const acts = [...prev.dawahPerformance.activities];
                                acts[index] = { ...acts[index], date: val };
                                return {
                                  ...prev,
                                  dawahPerformance: { ...prev.dawahPerformance, activities: acts },
                                };
                              });
                            }}
                            className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white"
                          />
                        </div>

                        <div className="sm:col-span-2">
                          <label className="block text-[11px] font-bold text-slate-600 mb-1">
                            عنوان أو موضوع النشاط
                          </label>
                          <input
                            type="text"
                            disabled={locked}
                            value={act.title}
                            placeholder="مثال: فضل بر الوالدين وأثره في حياة المسلم"
                            onChange={(e) => {
                              const val = e.target.value;
                              handleUpdate((prev) => {
                                const acts = [...prev.dawahPerformance.activities];
                                acts[index] = { ...acts[index], title: val };
                                return {
                                  ...prev,
                                  dawahPerformance: { ...prev.dawahPerformance, activities: acts },
                                };
                              });
                            }}
                            className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 mb-1">
                            عدد المستفيدين التقريبي
                          </label>
                          <input
                            type="number"
                            min="0"
                            disabled={locked}
                            value={act.beneficiariesCount}
                            onChange={(e) => {
                              const val = parseInt(e.target.value) || 0;
                              handleUpdate((prev) => {
                                const acts = [...prev.dawahPerformance.activities];
                                acts[index] = { ...acts[index], beneficiariesCount: val };
                                return {
                                  ...prev,
                                  dawahPerformance: { ...prev.dawahPerformance, activities: acts },
                                };
                              });
                            }}
                            className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* المحور الرابع: الالتزام والانضباط */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center font-bold text-sm">
                    4
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">
                      المحور الرابع: الالتزام والانضباط (10 نقاط)
                    </h3>
                    <p className="text-xs text-slate-500">
                      معادلة محددة تمنع احتساب الحدث مرتين (إنجاز المهام: 4 نقاط، الانضباط والحضور: 6 نقاط مع خصم 1.5 للغياب و 0.5 للتأخر).
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-400 block font-medium">الدرجة المحتسبة</span>
                  <span className="text-lg font-black text-teal-700">
                    {report.discipline.score} <span className="text-xs font-normal text-slate-400">/ 10</span>
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    عدد مرات الغياب غير المبرر
                  </label>
                  <input
                    type="number"
                    min="0"
                    disabled={locked}
                    value={report.discipline.unexcusedAbsences}
                    onChange={(e) =>
                      handleUpdate((prev) => ({
                        ...prev,
                        discipline: {
                          ...prev.discipline,
                          unexcusedAbsences: Math.max(0, parseInt(e.target.value) || 0),
                        },
                      }))
                    }
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">خصم 1.5 نقطة لكل غياب</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    عدد مرات التأخر عن المواعيد
                  </label>
                  <input
                    type="number"
                    min="0"
                    disabled={locked}
                    value={report.discipline.delaysCount}
                    onChange={(e) =>
                      handleUpdate((prev) => ({
                        ...prev,
                        discipline: {
                          ...prev.discipline,
                          delaysCount: Math.max(0, parseInt(e.target.value) || 0),
                        },
                      }))
                    }
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">خصم 0.5 نقطة لكل تأخر</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    إجمالي المهام المسندة للشهر
                  </label>
                  <input
                    type="number"
                    min="1"
                    disabled={locked}
                    value={report.discipline.tasksAssigned}
                    onChange={(e) =>
                      handleUpdate((prev) => ({
                        ...prev,
                        discipline: {
                          ...prev.discipline,
                          tasksAssigned: Math.max(0, parseInt(e.target.value) || 0),
                        },
                      }))
                    }
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    المهام المنجزة بنجاح
                  </label>
                  <input
                    type="number"
                    min="0"
                    disabled={locked}
                    value={report.discipline.tasksCompleted}
                    onChange={(e) =>
                      handleUpdate((prev) => ({
                        ...prev,
                        discipline: {
                          ...prev.discipline,
                          tasksCompleted: Math.max(0, parseInt(e.target.value) || 0),
                        },
                      }))
                    }
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* التبويب 3: الأداء الأخلاقي والسلوكي (10) - خاص بالمسؤول والمشرف */}
        {activeTab === 2 && (
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center font-bold text-sm">
                  5
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    المحور الخامس: الأداء الأخلاقي والسلوكي (10 نقاط)
                  </h3>
                  <p className="text-xs text-slate-500">
                    معايير تقييم خاصة بالمسؤول والمشرف حصراً لضمان النزاهة والحيادية.
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-400 block font-medium">الدرجة المحتسبة</span>
                <span className="text-lg font-black text-teal-700">
                  {report.moralEvaluation.score} <span className="text-xs font-normal text-slate-400">/ 10</span>
                </span>
              </div>
            </div>

            <div className="p-4 bg-amber-50/70 border border-amber-200/80 rounded-xl text-xs text-amber-900 flex items-start gap-2.5">
              <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <div className="leading-relaxed">
                <strong>تنبيه الصلاحيات:</strong> وفق دفتر الشروط الرسمي، لا يسمح للطالب بتعديل تقييم المشرف الأخلاقي، كما لا يحرر المسؤول نص التقرير نيابة عن الطالب. يتم تقييم هذا المحور عبر لوحة تحكم المسؤول من خلال المعايير الخمسة.
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {[
                { label: 'الاحترام والتوقير', val: report.moralEvaluation.respect },
                { label: 'التعاون والمبادرة', val: report.moralEvaluation.cooperation },
                { label: 'تحمل المسؤولية', val: report.moralEvaluation.responsibility },
                { label: 'حسن التعامل والسمت', val: report.moralEvaluation.goodConduct },
                { label: 'الانضباط السلوكي', val: report.moralEvaluation.behavioralDiscipline },
              ].map((item, idx) => (
                <div key={idx} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-center">
                  <span className="text-xs font-bold text-slate-700 block mb-2">{item.label}</span>
                  <span className="text-lg font-black text-teal-700">{item.val}</span>
                  <span className="text-xs text-slate-400 block mt-1">من 2 نقطة</span>
                </div>
              ))}
            </div>

            {report.moralEvaluation.notes && (
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                <span className="font-bold text-slate-700 block mb-1">ملاحظات المشرف المباشر:</span>
                <p className="text-slate-600 leading-relaxed">{report.moralEvaluation.notes}</p>
                {report.moralEvaluation.evaluatedAt && (
                  <span className="text-[10px] text-slate-400 mt-2 block">
                    تم التقييم بواسطة {report.moralEvaluation.evaluatedBy || 'المسؤول'} بتاريخ {new Date(report.moralEvaluation.evaluatedAt).toLocaleDateString('ar-SA')}
                  </span>
                )}
              </div>
            )}
          </div>
        )}

        {/* التبويب 4: الأنشطة الثقافية (5) والإنجازات (5) */}
        {activeTab === 3 && (
          <div className="space-y-6">
            {/* المحور السادس: الأنشطة الثقافية والاجتماعية */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center font-bold text-sm">
                    6
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">
                      المحور السادس: الأنشطة الثقافية والاجتماعية (5 نقاط)
                    </h3>
                    <p className="text-xs text-slate-500">
                      كل نشاط يمنح 2.5 نقطة مع سقف أقصى 5 نقاط (نشاطان يكفيان للدرجة الكاملة).
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-400 block font-medium">الدرجة المحتسبة</span>
                  <span className="text-lg font-black text-teal-700">
                    {report.culturalActivities.score} <span className="text-xs font-normal text-slate-400">/ 5</span>
                  </span>
                </div>
              </div>

              {!locked && (
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleAddCulturalActivity}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold bg-teal-50 text-teal-700 border border-teal-200 hover:bg-teal-100 transition flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>إضافة نشاط ثقافي / اجتماعي</span>
                  </button>
                </div>
              )}

              {report.culturalActivities.activities.length === 0 ? (
                <p className="text-center py-6 text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl">
                  لم تسجل أنشطة ثقافية أو اجتماعية لهذا الشهر.
                </p>
              ) : (
                <div className="space-y-3">
                  {report.culturalActivities.activities.map((c, i) => (
                    <div key={c.id} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-700">نشاط #{i + 1}</span>
                        {!locked && (
                          <button
                            type="button"
                            onClick={() => handleRemoveCulturalActivity(c.id)}
                            className="text-rose-600 hover:text-rose-800 text-xs"
                          >
                            حذف
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <input
                          type="text"
                          disabled={locked}
                          value={c.title}
                          placeholder="اسم النشاط *"
                          onChange={(e) => {
                            const val = e.target.value;
                            handleUpdate((prev) => {
                              const acts = [...prev.culturalActivities.activities];
                              acts[i] = { ...acts[i], title: val };
                              return { ...prev, culturalActivities: { ...prev.culturalActivities, activities: acts } };
                            });
                          }}
                          className="px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white"
                        />
                        <input
                          type="text"
                          disabled={locked}
                          value={c.type}
                          placeholder="نوع النشاط (مسابقة، زيارة..)"
                          onChange={(e) => {
                            const val = e.target.value;
                            handleUpdate((prev) => {
                              const acts = [...prev.culturalActivities.activities];
                              acts[i] = { ...acts[i], type: val };
                              return { ...prev, culturalActivities: { ...prev.culturalActivities, activities: acts } };
                            });
                          }}
                          className="px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white"
                        />
                        <input
                          type="text"
                          disabled={locked}
                          value={c.role}
                          placeholder="دور الطالب"
                          onChange={(e) => {
                            const val = e.target.value;
                            handleUpdate((prev) => {
                              const acts = [...prev.culturalActivities.activities];
                              acts[i] = { ...acts[i], role: val };
                              return { ...prev, culturalActivities: { ...prev.culturalActivities, activities: acts } };
                            });
                          }}
                          className="px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* المحور السابع: الإنجازات الشهرية */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center font-bold text-sm">
                    7
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">
                      المحور السابع: الإنجازات الشهرية (5 نقاط)
                    </h3>
                    <p className="text-xs text-slate-500">
                      كل إنجاز يمنح 2.5 نقطة مع سقف أقصى 5 نقاط (إنجازان يكفيان للدرجة الكاملة).
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-400 block font-medium">الدرجة المحتسبة</span>
                  <span className="text-lg font-black text-teal-700">
                    {report.monthlyAchievements.score} <span className="text-xs font-normal text-slate-400">/ 5</span>
                  </span>
                </div>
              </div>

              {!locked && (
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleAddAchievement}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold bg-teal-50 text-teal-700 border border-teal-200 hover:bg-teal-100 transition flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>إضافة إنجاز شهري</span>
                  </button>
                </div>
              )}

              {report.monthlyAchievements.achievements.length === 0 ? (
                <p className="text-center py-6 text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl">
                  لم يتم تسجيل إنجازات خاصة لهذا الشهر.
                </p>
              ) : (
                <div className="space-y-3">
                  {report.monthlyAchievements.achievements.map((ach, i) => (
                    <div key={ach.id} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-700">إنجاز #{i + 1}</span>
                        {!locked && (
                          <button
                            type="button"
                            onClick={() => handleRemoveAchievement(ach.id)}
                            className="text-rose-600 hover:text-rose-800 text-xs"
                          >
                            حذف
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <input
                          type="text"
                          disabled={locked}
                          value={ach.title}
                          placeholder="عنوان الإنجاز *"
                          onChange={(e) => {
                            const val = e.target.value;
                            handleUpdate((prev) => {
                              const achs = [...prev.monthlyAchievements.achievements];
                              achs[i] = { ...achs[i], title: val };
                              return { ...prev, monthlyAchievements: { ...prev.monthlyAchievements, achievements: achs } };
                            });
                          }}
                          className="px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white"
                        />
                        <input
                          type="text"
                          disabled={locked}
                          value={ach.description}
                          placeholder="وصف مختصر للإنجاز"
                          onChange={(e) => {
                            const val = e.target.value;
                            handleUpdate((prev) => {
                              const achs = [...prev.monthlyAchievements.achievements];
                              achs[i] = { ...achs[i], description: val };
                              return { ...prev, monthlyAchievements: { ...prev.monthlyAchievements, achievements: achs } };
                            });
                          }}
                          className="px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* التبويب 5: المحاور الوصفية (التحديات، الخطة، الإنجاز العام) */}
        {activeTab === 4 && (
          <div className="space-y-6">
            {/* المحور الثامن: التحديات والصعوبات */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
              <div className="pb-3 border-b border-slate-100">
                <h3 className="font-bold text-slate-900 text-sm">
                  المحور الثامن: التحديات والصعوبات (محور وصفي لا يؤثر على الدرجات)
                </h3>
                <p className="text-xs text-slate-500">
                  سجل التحديات التي واجهتك، أثرها، وكيف تعاملت معها والدعم المطلوب.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    وصف التحدي أو الصعوبة
                  </label>
                  <textarea
                    rows={3}
                    disabled={locked}
                    value={report.challenges.description}
                    onChange={(e) =>
                      handleUpdate((prev) => ({
                        ...prev,
                        challenges: { ...prev.challenges, description: e.target.value },
                      }))
                    }
                    placeholder="مثال: ضيق الوقت في منتصف الشهر بسبب الامتحانات.."
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 disabled:bg-slate-50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    كيفية التعامل مع التحدي والدعم المطلوب
                  </label>
                  <textarea
                    rows={3}
                    disabled={locked}
                    value={report.challenges.handling}
                    onChange={(e) =>
                      handleUpdate((prev) => ({
                        ...prev,
                        challenges: { ...prev.challenges, handling: e.target.value },
                      }))
                    }
                    placeholder="تنظيم الجدول الزمني، الاستيقاظ مبكراً.."
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 disabled:bg-slate-50"
                  />
                </div>
              </div>
            </div>

            {/* المحور التاسع: خطة الشهر القادم */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
              <div className="pb-3 border-b border-slate-100">
                <h3 className="font-bold text-slate-900 text-sm">
                  المحور التاسع: خطة الشهر القادم (محور وصفي)
                </h3>
                <p className="text-xs text-slate-500">
                  تحديد الأهداف والمهام المراد إنجازها في الشهر القادم وخطة التحسين.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    الأهداف والمستهدفات القادمة
                  </label>
                  <textarea
                    rows={3}
                    disabled={locked}
                    value={report.nextMonthPlan.goals}
                    onChange={(e) =>
                      handleUpdate((prev) => ({
                        ...prev,
                        nextMonthPlan: { ...prev.nextMonthPlan, goals: e.target.value },
                      }))
                    }
                    placeholder="إنهاء الجزء الثالث، إلقاء درسين دعويين.."
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 disabled:bg-slate-50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    خطة التحسين والدعم المطلوب
                  </label>
                  <textarea
                    rows={3}
                    disabled={locked}
                    value={report.nextMonthPlan.improvementPlan}
                    onChange={(e) =>
                      handleUpdate((prev) => ({
                        ...prev,
                        nextMonthPlan: { ...prev.nextMonthPlan, improvementPlan: e.target.value },
                      }))
                    }
                    placeholder="زيادة الحفظ في الفجر، التنسيق مع المشرف.."
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 disabled:bg-slate-50"
                  />
                </div>
              </div>
            </div>

            {/* المحور العاشر: الإنجاز العام والملاحظات */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
              <div className="pb-3 border-b border-slate-100">
                <h3 className="font-bold text-slate-900 text-sm">
                  المحور العاشر: الإنجاز العام والملاحظات
                </h3>
                <p className="text-xs text-slate-500">
                  تلخيص شامل لما تحقق خلال هذا الشهر وأي ملاحظات تود مشاركتها مع المشرف.
                </p>
              </div>

              <div>
                <textarea
                  rows={4}
                  disabled={locked}
                  value={report.generalSummary.summary}
                  onChange={(e) =>
                    handleUpdate((prev) => ({
                      ...prev,
                      generalSummary: { ...prev.generalSummary, summary: e.target.value },
                    }))
                  }
                  placeholder="الحمد لله كان شهراً مثمراً من حيث الالتزام بالقراءة اليومية والتواصل مع الطلاب المستفيدين.."
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 disabled:bg-slate-50"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
