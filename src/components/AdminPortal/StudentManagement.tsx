import React, { useState, useRef } from 'react';
import {
  Users,
  Search,
  Filter,
  UserPlus,
  FileSpreadsheet,
  Download,
  Upload,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Lock,
  KeyRound,
  MoreVertical,
  ShieldAlert,
  ArrowUpDown,
} from 'lucide-react';
import { User } from '../../types';
import { dbService } from '../../services/dbStorage';
import { exportService, ExcelImportRow } from '../../services/exportService';

interface StudentManagementProps {
  students: User[];
  onRefresh: () => void;
}

export const StudentManagement: React.FC<StudentManagementProps> = ({
  students,
  onRefresh,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStage, setSelectedStage] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');

  // نوافذ منبثقة
  const [showAddModal, setShowAddModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showResetPasswordModal, setShowResetPasswordModal] = useState<User | null>(null);

  // حالة إضافة طالب جديد يدوياً
  const [newStudentForm, setNewStudentForm] = useState({
    fullName: '',
    username: '',
    educationalStage: 'المرحلة الجامعية',
    password: '',
    email: '',
    phone: '',
    supervisorName: 'المسؤول العام',
  });
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // حالة استيراد Excel
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [importRows, setImportRows] = useState<ExcelImportRow[]>([]);
  const [importStats, setImportStats] = useState<{ valid: number; invalid: number } | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  // حالة إعادة تعيين كلمة المرور
  const [newPassword, setNewPassword] = useState('');

  // التصفية والبحث
  const filteredStudents = students
    .filter((s) => s.role === 'student')
    .filter((s) => {
      const matchSearch =
        s.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.studentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.username.toLowerCase().includes(searchTerm.toLowerCase());
      const matchStage = selectedStage === 'ALL' || s.educationalStage === selectedStage;
      const matchStatus = selectedStatus === 'ALL' || s.status === selectedStatus;
      return matchSearch && matchStage && matchStatus;
    });

  // تغيير حالة الطالب (قبول، تعليق، رفض)
  const handleUpdateStatus = (studentId: string, status: User['status']) => {
    const res = dbService.updateUserStatus(studentId, status);
    if (res.success) {
      setActionMessage({ type: 'success', text: res.message });
      onRefresh();
      setTimeout(() => setActionMessage(null), 3000);
    }
  };

  // إضافة طالب يدوياً
  const handleManualAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await dbService.registerStudent({
      fullName: newStudentForm.fullName,
      username: newStudentForm.username,
      passwordPlain: newStudentForm.password,
      educationalStage: newStudentForm.educationalStage,
      email: newStudentForm.email,
      phone: newStudentForm.phone,
      supervisorName: newStudentForm.supervisorName,
    });

    if (res.success) {
      // للمسؤول تفعيل الحساب المضاف مباشرة
      if (res.user) {
        dbService.updateUserStatus(res.user.id, 'active', 'المسؤول العام');
      }
      setActionMessage({ type: 'success', text: 'تمت إضافة وتفعيل حساب الطالب بنجاح.' });
      setShowAddModal(false);
      setNewStudentForm({
        fullName: '',
        username: '',
        educationalStage: 'المرحلة الجامعية',
        password: '',
        email: '',
        phone: '',
        supervisorName: 'المسؤول العام',
      });
      onRefresh();
      setTimeout(() => setActionMessage(null), 3000);
    } else {
      setActionMessage({ type: 'error', text: res.message });
    }
  };

  // فحص ملف Excel المرفوع
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsImporting(true);
      const res = await exportService.parseAndValidateStudentExcel(file, students);
      setImportRows(res.rows);
      setImportStats({ valid: res.validCount, invalid: res.invalidCount });
      setIsImporting(false);
    } catch (err: any) {
      setIsImporting(false);
      setActionMessage({
        type: 'error',
        text: 'تعذر قراءة ملف Excel: تأكد من صحة الملف وتطابق الأعمدة.',
      });
    }
  };

  // اعتماد استيراد الطلاب الصالحين
  const handleConfirmImport = async () => {
    const validRows = importRows.filter((r) => r.isValid);
    if (validRows.length === 0) return;

    const newUsers = await exportService.commitImportedStudents(validRows, students, 'active');
    const allUsers = [...students, ...newUsers];
    localStorage.setItem('motabaa_users_v1', JSON.stringify(allUsers));

    dbService.addAuditLog({
      action: 'استيراد طلاب من Excel',
      performedBy: 'المسؤول العام',
      details: `تم استيراد ${newUsers.length} طالب بنجاح من ملف Excel واعتماد حساباتهم.`,
    });

    setActionMessage({
      type: 'success',
      text: `تم استيراد واعتماد ${newUsers.length} طالب بنجاح في قاعدة البيانات المحلية.`,
    });
    setShowImportModal(false);
    setImportRows([]);
    setImportStats(null);
    onRefresh();
    setTimeout(() => setActionMessage(null), 3000);
  };

  // إعادة تعيين كلمة المرور
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showResetPasswordModal) return;

    const res = await dbService.resetPasswordByAdmin(
      showResetPasswordModal.id,
      newPassword,
      'المسؤول العام'
    );

    if (res.success) {
      setActionMessage({ type: 'success', text: res.message });
      setShowResetPasswordModal(null);
      setNewPassword('');
      setTimeout(() => setActionMessage(null), 3000);
    } else {
      setActionMessage({ type: 'error', text: res.message });
    }
  };

  return (
    <div className="space-y-6">
      {/* الترويسة والأزرار الرئيسية */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">
            إدارة حسابات الطلاب والتسجيل
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            مراجعة طلبات الانضمام، تفعيل الحسابات، الاستيراد والتصدير من وإلى Excel
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-stretch sm:self-auto">
          {/* تصدير إلى Excel */}
          <button
            onClick={() => exportService.exportStudentsToExcel(students)}
            className="px-3.5 py-2 rounded-xl text-xs font-bold border border-slate-300 hover:bg-slate-50 text-slate-700 transition flex items-center gap-1.5"
            title="تنزيل قائمة كافة الطلاب كملف Excel"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>تصدير Excel</span>
          </button>

          {/* استيراد من Excel */}
          <button
            onClick={() => setShowImportModal(true)}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-teal-50 hover:bg-teal-100 border border-teal-200 text-teal-800 transition flex items-center gap-1.5"
            title="استيراد دفعة طلاب من ملف Excel مع التحقق"
          >
            <Upload className="w-4 h-4 text-teal-600" />
            <span>استيراد من Excel</span>
          </button>

          {/* إضافة طالب يدوياً */}
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-teal-700 hover:bg-teal-800 text-white shadow-xs transition flex items-center gap-1.5"
          >
            <UserPlus className="w-4 h-4" />
            <span>إضافة طالب يدوياً</span>
          </button>
        </div>
      </div>

      {/* رسالة النجاح أو التنبيه */}
      {actionMessage && (
        <div
          className={`p-4 rounded-xl text-xs font-bold flex items-center gap-2 ${
            actionMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          {actionMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-rose-600" />
          )}
          <span>{actionMessage.text}</span>
        </div>
      )}

      {/* شريط البحث والتصفية */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center gap-3">
        {/* حقل البحث */}
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="البحث باسم الطالب، الرقم التعريفي، أو اسم المستخدم.."
            className="w-full pr-10 pl-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-teal-600"
          />
        </div>

        {/* تصفية المرحلة التعليمية */}
        <select
          value={selectedStage}
          onChange={(e) => setSelectedStage(e.target.value)}
          className="w-full md:w-48 px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-700"
        >
          <option value="ALL">جميع المراحل التعليمية</option>
          <option value="المرحلة الثانوية">المرحلة الثانوية</option>
          <option value="المرحلة الجامعية">المرحلة الجامعية</option>
          <option value="مرحلة التأهيل والتدريب">مرحلة التأهيل والتدريب</option>
        </select>

        {/* تصفية حالة الحساب */}
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="w-full md:w-44 px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-700"
        >
          <option value="ALL">جميع الحالات</option>
          <option value="pending">بانتظار الموافقة</option>
          <option value="active">مفعل ونشط</option>
          <option value="suspended">معلق</option>
        </select>
      </div>

      {/* جدول الطلاب */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">الرقم التعريفي</th>
                <th className="py-3 px-4">اسم الطالب الكامل</th>
                <th className="py-3 px-4">اسم المستخدم</th>
                <th className="py-3 px-4">المرحلة التعليمية</th>
                <th className="py-3 px-4">حالة الحساب</th>
                <th className="py-3 px-4">تاريخ التسجيل</th>
                <th className="py-3 px-4 text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-400">
                    لا يوجد طلاب مطابقون لمعايير البحث
                  </td>
                </tr>
              ) : (
                filteredStudents.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3 px-4 font-mono font-bold text-slate-700">
                      {s.studentId}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      {s.fullName}
                      {s.email && (
                        <span className="block text-[10px] text-slate-400 font-normal">
                          {s.email}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-600 font-mono text-[11px]">
                      {s.username}
                    </td>
                    <td className="py-3 px-4 text-slate-700">{s.educationalStage}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          s.status === 'active'
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : s.status === 'pending'
                            ? 'bg-amber-50 text-amber-800 border border-amber-300'
                            : 'bg-rose-50 text-rose-800 border border-rose-200'
                        }`}
                      >
                        {s.status === 'active'
                          ? 'مفعل'
                          : s.status === 'pending'
                          ? 'بانتظار الموافقة'
                          : 'معلق'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-400">
                      {new Date(s.createdAt).toLocaleDateString('ar-SA')}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-center gap-1.5">
                        {/* أزرار قبول / تفعيل / تعليق */}
                        {s.status === 'pending' && (
                          <button
                            onClick={() => handleUpdateStatus(s.id, 'active')}
                            className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-bold transition"
                            title="قبول الحساب وتفعيله"
                          >
                            قبول وتفعيل
                          </button>
                        )}

                        {s.status === 'active' && (
                          <button
                            onClick={() => handleUpdateStatus(s.id, 'suspended')}
                            className="px-2 py-1 bg-slate-100 hover:bg-rose-100 text-slate-700 hover:text-rose-700 rounded text-[11px] font-medium transition"
                            title="تعليق الحساب مؤقتاً"
                          >
                            تعليق
                          </button>
                        )}

                        {s.status === 'suspended' && (
                          <button
                            onClick={() => handleUpdateStatus(s.id, 'active')}
                            className="px-2 py-1 bg-teal-50 hover:bg-teal-100 text-teal-800 rounded text-[11px] font-bold transition"
                            title="إعادة تفعيل الحساب"
                          >
                            إعادة تفعيل
                          </button>
                        )}

                        {/* زر إعادة تعيين كلمة المرور بأمان */}
                        <button
                          onClick={() => setShowResetPasswordModal(s)}
                          className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
                          title="إعادة تعيين كلمة المرور"
                        >
                          <KeyRound className="w-3.5 h-3.5" />
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

      {/* نافذة منبثقة: إضافة طالب يدوياً */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100">
              إضافة حساب طالب جديد يدوياً
            </h3>

            <form onSubmit={handleManualAddStudent} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  الاسم الكامل للطالب <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newStudentForm.fullName}
                  onChange={(e) =>
                    setNewStudentForm({ ...newStudentForm, fullName: e.target.value })
                  }
                  placeholder="مثال: صالح بن عبد العزيز الدوسري"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  اسم المستخدم (فريد بالإنجليزية) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newStudentForm.username}
                  onChange={(e) =>
                    setNewStudentForm({ ...newStudentForm, username: e.target.value })
                  }
                  placeholder="saleh.dosari"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  كلمة المرور الأولية (6 خانات فأكثر) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="password"
                  required
                  value={newStudentForm.password}
                  onChange={(e) =>
                    setNewStudentForm({ ...newStudentForm, password: e.target.value })
                  }
                  placeholder="••••••••"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  المرحلة التعليمية <span className="text-rose-500">*</span>
                </label>
                <select
                  value={newStudentForm.educationalStage}
                  onChange={(e) =>
                    setNewStudentForm({ ...newStudentForm, educationalStage: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                >
                  <option value="المرحلة الثانوية">المرحلة الثانوية</option>
                  <option value="المرحلة الجامعية">المرحلة الجامعية</option>
                  <option value="مرحلة التأهيل والتدريب">مرحلة التأهيل والتدريب</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">البريد الإلكتروني (اختياري)</label>
                  <input
                    type="email"
                    value={newStudentForm.email}
                    onChange={(e) =>
                      setNewStudentForm({ ...newStudentForm, email: e.target.value })
                    }
                    placeholder="student@example.com"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">رقم الهاتف (اختياري)</label>
                  <input
                    type="text"
                    value={newStudentForm.phone}
                    onChange={(e) =>
                      setNewStudentForm({ ...newStudentForm, phone: e.target.value })
                    }
                    placeholder="05xxxxxxxx"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold"
                >
                  حفظ وتفعيل الحساب
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* نافذة منبثقة: استيراد الطلاب من Excel مع المعاينة والتحقق */}
      {showImportModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                استيراد قائمة الطلاب من ملف Excel
              </h3>
              <button
                onClick={() => exportService.downloadImportTemplate()}
                className="text-xs font-bold text-teal-700 hover:underline flex items-center gap-1"
              >
                <Download className="w-3.5 h-3.5" />
                <span>تحميل نموذج الاستيراد الجاهز</span>
              </button>
            </div>

            <div className="py-4 space-y-4 overflow-y-auto flex-1 text-xs">
              {/* منطقة رفع الملف */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-teal-300 hover:border-teal-500 bg-teal-50/30 rounded-2xl p-6 text-center cursor-pointer transition"
              >
                <FileSpreadsheet className="w-10 h-10 text-teal-600 mx-auto mb-2" />
                <p className="font-bold text-slate-800 text-sm">
                  اضغط هنا لاختيار ملف Excel (.xlsx أو .xls)
                </p>
                <p className="text-slate-500 mt-1">
                  يقوم النظام بالتحقق الآلي من الحقول الإلزامية واكتشاف التكرار قبل الاعتماد
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  className="hidden"
                  onChange={handleFileUpload}
                />
              </div>

              {/* إحصائيات المعاينة */}
              {importStats && (
                <div className="flex items-center gap-4 p-3 rounded-xl bg-slate-50 border border-slate-200 font-bold">
                  <span className="text-emerald-700">
                    السجلات الصالحة للاستيراد: {importStats.valid}
                  </span>
                  <span>•</span>
                  <span className="text-rose-700">
                    السجلات التي بها أخطاء: {importStats.invalid}
                  </span>
                </div>
              )}

              {/* جدول المعاينة وفحص الأخطاء */}
              {importRows.length > 0 && (
                <div className="border border-slate-200 rounded-xl overflow-hidden max-h-60 overflow-y-auto">
                  <table className="w-full text-right text-[11px]">
                    <thead className="bg-slate-100 text-slate-700 font-bold sticky top-0">
                      <tr>
                        <th className="py-2 px-3">السطر</th>
                        <th className="py-2 px-3">الاسم الكامل</th>
                        <th className="py-2 px-3">اسم المستخدم</th>
                        <th className="py-2 px-3">المرحلة</th>
                        <th className="py-2 px-3">الحالة والتحقق</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {importRows.map((r, i) => (
                        <tr
                          key={i}
                          className={r.isValid ? 'bg-white' : 'bg-rose-50/60'}
                        >
                          <td className="py-2 px-3 font-mono">{r.rowNumber}</td>
                          <td className="py-2 px-3 font-semibold">{r.fullName || '-'}</td>
                          <td className="py-2 px-3 font-mono">{r.username || '-'}</td>
                          <td className="py-2 px-3">{r.educationalStage || '-'}</td>
                          <td className="py-2 px-3">
                            {r.isValid ? (
                              <span className="text-emerald-700 font-bold flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>جاهز للاستيراد</span>
                              </span>
                            ) : (
                              <span className="text-rose-700 font-bold flex items-center gap-1" title={r.errors.join('، ')}>
                                <XCircle className="w-3.5 h-3.5" />
                                <span>{r.errors[0]}</span>
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  setShowImportModal(false);
                  setImportRows([]);
                }}
                className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold text-xs"
              >
                إلغاء
              </button>
              {importStats && importStats.valid > 0 && (
                <button
                  type="button"
                  onClick={handleConfirmImport}
                  className="px-5 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs"
                >
                  اعتماد استيراد {importStats.valid} طالب
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* نافذة منبثقة: إعادة تعيين كلمة المرور بواسطة المسؤول */}
      {showResetPasswordModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-2">
              إعادة تعيين كلمة المرور
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              للطالب: <strong>{showResetPasswordModal.fullName}</strong> ({showResetPasswordModal.studentId})
            </p>

            <form onSubmit={handleResetPassword} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  كلمة المرور الجديدة (6 خانات فأكثر)
                </label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="أدخل كلمة المرور الجديدة"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300"
                />
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-500 leading-relaxed">
                * تُخزن كلمة المرور الجديدة بتشفير تجزئة آمن وتوثق العملية في سجل المراجعة، دون عرض النصوص الصريحة.
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowResetPasswordModal(null)}
                  className="px-4 py-2 rounded-xl text-slate-600 font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold"
                >
                  حفظ كلمة المرور
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
