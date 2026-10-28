import React, { useState, useEffect } from 'react';
import {
  FlaskConical,
  CheckCircle2,
  XCircle,
  X,
  Play,
  RotateCw,
  Award,
  ShieldCheck,
} from 'lucide-react';
import { runAllSystemTests, TestCaseResult } from '../services/tests/scoringTests';

interface TestRunnerModalProps {
  onClose: () => void;
}

export const TestRunnerModal: React.FC<TestRunnerModalProps> = ({ onClose }) => {
  const [testResults, setTestResults] = useState<TestCaseResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const runTests = () => {
    setIsRunning(true);
    setTimeout(() => {
      const results = runAllSystemTests();
      setTestResults(results);
      setIsRunning(false);
    }, 400);
  };

  useEffect(() => {
    runTests();
  }, []);

  const passedCount = testResults.filter((t) => t.passed).length;
  const totalCount = testResults.length;
  const allPassed = totalCount > 0 && passedCount === totalCount;

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-4xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] flex flex-col">
        {/* الترويسة */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center font-bold">
              <FlaskConical className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                فحص واختبار معادلات النظام آلياً (Phase 3 Testing)
              </h2>
              <p className="text-xs text-slate-500">
                تشغيل اختبارات الوحدة والتكامل للتحقق من المعادلات، الحدود القصوى، والصلاحيات
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* شريط الإحصائية وحالة الاختبار */}
        <div className="py-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-lg ${
                allPassed
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-rose-100 text-rose-800'
              }`}
            >
              {passedCount}/{totalCount}
            </div>
            <div>
              <div className="font-bold text-sm text-slate-900">
                {allPassed
                  ? 'تم اجتياز كافة الاختبارات الآلية بنجاح (100%)'
                  : 'توجد اختبارات لم تنجح'}
              </div>
              <div className="text-xs text-slate-500">
                {passedCount} اختبار ناجح من أصل {totalCount} حالة تم فحصها فعلياً
              </div>
            </div>
          </div>

          <button
            onClick={runTests}
            disabled={isRunning}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-teal-700 hover:bg-teal-800 text-white transition flex items-center gap-1.5 disabled:opacity-50"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isRunning ? 'animate-spin' : ''}`} />
            <span>إعادة تشغيل الاختبارات</span>
          </button>
        </div>

        {/* قائمة نتائج الاختبارات */}
        <div className="flex-1 overflow-y-auto py-4 space-y-2.5">
          {testResults.map((t) => (
            <div
              key={t.id}
              className={`p-3.5 rounded-xl border text-xs transition ${
                t.passed
                  ? 'bg-emerald-50/40 border-emerald-200'
                  : 'bg-rose-50/60 border-rose-200'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  {t.passed ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-800">{t.title}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-semibold">
                        {t.category}
                      </span>
                    </div>
                    <div className="text-slate-500 text-[11px] mt-1 space-x-2 space-x-reverse">
                      <span>المتوقع: <strong>{t.expected}</strong></span>
                      <span>•</span>
                      <span>الناتج الفعلي: <strong>{t.actual}</strong></span>
                    </div>
                  </div>
                </div>

                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                    t.passed
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-rose-100 text-rose-800'
                  }`}
                >
                  {t.passed ? 'ناجح' : 'فشل'}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="pt-3 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
