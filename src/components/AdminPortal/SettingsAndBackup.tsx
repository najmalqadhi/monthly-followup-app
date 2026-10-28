import React, { useState, useRef } from 'react';
import {
  Settings,
  HardDrive,
  Download,
  Upload,
  RefreshCw,
  ShieldCheck,
  Wifi,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  Info,
  Server,
  Layers,
} from 'lucide-react';
import { SystemSettings, AuditLog } from '../../types';
import { dbService } from '../../services/dbStorage';

interface SettingsAndBackupProps {
  settings: SystemSettings;
  onRefreshSettings: () => void;
}

export const SettingsAndBackup: React.FC<SettingsAndBackupProps> = ({
  settings,
  onRefreshSettings,
}) => {
  const [formData, setFormData] = useState<SystemSettings>({ ...settings });
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const backupInputRef = useRef<HTMLInputElement | null>(null);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    dbService.updateSettings(formData, 'المسؤول العام');
    setNotification({ type: 'success', text: 'تم حفظ إعدادات النظام بنجاح.' });
    onRefreshSettings();
    setTimeout(() => setNotification(null), 3000);
  };

  // تصدير نسخة احتياطية
  const handleExportBackup = () => {
    const jsonStr = dbService.exportFullBackup();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const dateStr = new Date().toISOString().substring(0, 10);
    a.download = `نسخة_احتياطية_المتابعة_الشهرية_${dateStr}.json`;
    a.click();
    URL.revokeObjectURL(url);

    setNotification({
      type: 'success',
      text: 'تم إنشاء وتنزيل ملف النسخة الاحتياطية بنجاح إلى جهازك.',
    });
    onRefreshSettings();
    setTimeout(() => setNotification(null), 3500);
  };

  // استعادة نسخة احتياطية
  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const content = evt.target?.result as string;
      if (!content) return;

      if (
        window.confirm(
          'تنبيه أمني هام: استعادة النسخة الاحتياطية ستستبدل البيانات الحالية ببيانات الملف المستعاد. هل تريد المتابعة بالتأكيد؟'
        )
      ) {
        const res = dbService.importFullBackup(content, 'المسؤول العام');
        if (res.success) {
          setNotification({ type: 'success', text: res.message });
          onRefreshSettings();
        } else {
          setNotification({ type: 'error', text: res.message });
        }
      }
    };
    reader.readAsText(file);
    if (e.target) e.target.value = '';
  };

  // مسح البيانات التجريبية
  const handleClearDemo = () => {
    dbService.clearDemoData();
    setShowClearConfirm(false);
    setNotification({
      type: 'success',
      text: 'تم مسح كافة البيانات التجريبية والتقارير الافتراضية بنجاح. النظام الآن جاهز للاستخدام الفعلي.',
    });
    onRefreshSettings();
    setTimeout(() => setNotification(null), 3500);
  };

  return (
    <div className="space-y-6">
      {/* الترويسة */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
        <h1 className="text-xl font-bold text-slate-900">
          إعدادات النظام والنسخ الاحتياطي والشبكة المحلية
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          إدارة بيانات المؤسسة، إعدادات الاتصال المباشر بين الهواتف وحاسوب المسؤول، وحفظ النسخ الاحتياطية اليدوية
        </p>
      </div>

      {notification && (
        <div
          className={`p-4 rounded-xl text-xs font-bold flex items-center gap-2 ${
            notification.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          {notification.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-rose-600" />
          )}
          <span>{notification.text}</span>
        </div>
      )}

      {/* نموذج الإعدادات الأساسية */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
        <h2 className="text-sm font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100 flex items-center gap-2">
          <Settings className="w-4 h-4 text-teal-700" />
          <span>البيانات الأساسية للمؤسسة والسنة الدراسية</span>
        </h2>

        <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                اسم المؤسسة أو المنظمة التعليمية
              </label>
              <input
                type="text"
                value={formData.organizationName}
                onChange={(e) =>
                  setFormData({ ...formData, organizationName: e.target.value })
                }
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                القسم أو التوصيف الإداري
              </label>
              <input
                type="text"
                value={formData.organizationSubtitle}
                onChange={(e) =>
                  setFormData({ ...formData, organizationSubtitle: e.target.value })
                }
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                العام الدراسي الحالي
              </label>
              <input
                type="text"
                value={formData.currentAcademicYear}
                onChange={(e) =>
                  setFormData({ ...formData, currentAcademicYear: e.target.value })
                }
                placeholder="1447-1448 هـ / 2025-2026 م"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 font-medium"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                شهر التقرير النشط حالياً
              </label>
              <select
                value={formData.currentMonth}
                onChange={(e) =>
                  setFormData({ ...formData, currentMonth: parseInt(e.target.value) })
                }
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white"
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                  <option key={m} value={m}>
                    شهر {m} (أكتوبر حالياً)
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold transition"
            >
              حفظ التعديلات
            </button>
          </div>
        </form>
      </div>

      {/* قسم النسخ الاحتياطي اليدوي والاستعادة */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
        <h2 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100 flex items-center gap-2">
          <HardDrive className="w-4 h-4 text-teal-700" />
          <span>النسخ الاحتياطي اليدوي والاستعادة</span>
        </h2>

        <p className="text-xs text-slate-600 leading-relaxed">
          التزاماً بالشرط المعماري: يتم حفظ كافة بيانات الطلاب والتقارير وسجلات التدقيق محلياً على جهاز المسؤول دون الاعتماد على خوادم سحابية دائمة. يمكنك أخذ نسخة احتياطية دورية وتخزينها في قرص صلب خارجي أو موقع آمن تختاره.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          {/* تصدير نسخة */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
            <h3 className="font-bold text-xs text-slate-800">
              إنشاء وتنزيل نسخة احتياطية (JSON)
            </h3>
            <p className="text-[11px] text-slate-500">
              تتضمن كافة الطلاب، والتقارير الشهرية السابقة، والمحاور، وسجل العمليات الإدارية.
            </p>
            {settings.lastBackupDate && (
              <span className="text-[10px] text-slate-400 block">
                آخر تصدير: {new Date(settings.lastBackupDate).toLocaleString('ar-SA')}
              </span>
            )}
            <button
              onClick={handleExportBackup}
              className="mt-2 px-4 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs flex items-center gap-1.5 transition"
            >
              <Download className="w-4 h-4" />
              <span>تصدير وحفظ النسخة الاحتياطية</span>
            </button>
          </div>

          {/* استعادة نسخة */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
            <h3 className="font-bold text-xs text-slate-800">
              استعادة النظام من نسخة احتياطية سابقة
            </h3>
            <p className="text-[11px] text-slate-500">
              يقوم النظام بالتحقق التلقائي من سلامة الملف وتطابق البنية قبل التطبيق، ويطلب تأكيدك قبل استبدال البيانات.
            </p>
            <input
              ref={backupInputRef}
              type="file"
              accept=".json"
              className="hidden"
              onChange={handleImportBackup}
            />
            <button
              onClick={() => backupInputRef.current?.click()}
              className="mt-2 px-4 py-2 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition"
            >
              <Upload className="w-4 h-4" />
              <span>اختيار ملف النسخة والاستعادة</span>
            </button>
          </div>
        </div>
      </div>

      {/* دليل الاتصال الشبكي المباشر بين الهواتف وجهاز المسؤول */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
        <h2 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100 flex items-center gap-2">
          <Wifi className="w-4 h-4 text-teal-700" />
          <span>آلية اتصال هواتف الطلاب بحاسوب المسؤول (الشبكة المحلية والحدود)</span>
        </h2>

        <div className="text-xs text-slate-600 space-y-3 leading-relaxed">
          <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-xl text-amber-900 flex items-start gap-2">
            <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <strong>توضيح معماري هام وفق دفتر الشروط:</strong>
              <p>
                لا يستخدم هذا النظام مزامنة سحابية دائمة مدفوعة. جهاز كمبيوتر المسؤول هو المصدر المركزي الحصري لتخزين البيانات.
                عندما يكون جهاز المسؤول مغلقاً أو غير متصل بالشبكة، يعمل تطبيق أندرويد في وضع العمل دون إنترنت كلياً، ويحفظ المسودات في الهاتف بأمان دون حذف أي بيانات حتى يعود الاتصال.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <strong className="text-slate-800 block text-xs">
              خطوات ربط هواتف الطلاب على نفس شبكة Wi-Fi:
            </strong>
            <ol className="list-decimal list-inside space-y-1 pr-2">
              <li>
                على جهاز كمبيوتر المسؤول (Windows)، افتح موجه الأوامر واكتب: <code className="bg-slate-100 px-1 py-0.5 rounded font-mono">ipconfig</code>
              </li>
              <li>
                ابحث عن عنوان <code className="bg-slate-100 px-1 py-0.5 rounded font-mono">IPv4 Address</code> (مثال: <code className="text-teal-700 font-bold">192.168.1.105</code>).
              </li>
              <li>
                في هواتف الطلاب، افتح تطبيق المتابعة الشهرية، وعند شاشة الدخول اضغط على زر <strong>«إعدادات الاتصال بجهاز المسؤول»</strong> واكتب: <code className="bg-slate-100 px-1.5 py-0.5 rounded text-teal-800 font-bold font-mono">http://192.168.1.105:3000</code>.
              </li>
              <li>
                في حال الرغبة بالوصول من خارج شبكة Wi-Fi المحلية (عن بعد عبر الإنترنت): يُنصح باستخدام شبكة خاصة افتراضية آمنة مثل <strong>Tailscale</strong> أو <strong>WireGuard</strong> لربط الهاتف بحاسوب المسؤول مباشرة ودون فتح منافذ غير محمية.
              </li>
            </ol>
          </div>
        </div>
      </div>

      {/* تفريغ البيانات التجريبية */}
      <div className="bg-white rounded-2xl p-6 border border-rose-200 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-rose-900 text-sm flex items-center gap-2">
              <Trash2 className="w-4 h-4 text-rose-600" />
              <span>تفريغ ومسح البيانات التجريبية</span>
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              حذف الطلاب والتقارير التجريبية الافتراضية للبدء في استخدام النظام الفعلي دون اختلاط
            </p>
          </div>

          {!showClearConfirm ? (
            <button
              onClick={() => setShowClearConfirm(true)}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-300 transition"
            >
              مسح البيانات التجريبية الآن
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-100"
              >
                إلغاء
              </button>
              <button
                onClick={handleClearDemo}
                className="px-4 py-1.5 rounded-lg text-xs font-bold bg-rose-700 hover:bg-rose-800 text-white"
              >
                تأكيد الحذف النهائي
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
