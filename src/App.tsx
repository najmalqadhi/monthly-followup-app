/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Users,
  FileCheck2,
  Medal,
  BarChart3,
  CalendarCheck,
  Settings,
  PlusCircle,
  History,
  Home,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { User, MonthlyReport, SystemSettings, AppNotification } from './types';
import { dbService, createEmptyReport } from './services/dbStorage';
import { Header } from './components/Header';
import { StudentHome } from './components/StudentPortal/StudentHome';
import { ReportForm } from './components/StudentPortal/ReportForm';
import { PastReports } from './components/StudentPortal/PastReports';
import { AdminDashboard } from './components/AdminPortal/AdminDashboard';
import { StudentManagement } from './components/AdminPortal/StudentManagement';
import { ReportManagement } from './components/AdminPortal/ReportManagement';
import { StudentRanking } from './components/AdminPortal/StudentRanking';
import { AnalyticsView } from './components/AdminPortal/AnalyticsView';
import { AnnualReportView } from './components/AdminPortal/AnnualReportView';
import { SettingsAndBackup } from './components/AdminPortal/SettingsAndBackup';
import { FlutterProjectHub } from './components/FlutterProjectHub';
import { TestRunnerModal } from './components/TestRunnerModal';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [students, setStudents] = useState<User[]>([]);
  const [reports, setReports] = useState<MonthlyReport[]>([]);
  const [settings, setSettings] = useState<SystemSettings>(dbService.getSettings());
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  // التبويب النشط
  const [activeTab, setActiveTab] = useState<string>('home');
  const [editingReportId, setEditingReportId] = useState<string | null>(null);

  // النوافذ المنبثقة
  const [showFlutterHub, setShowFlutterHub] = useState<boolean>(false);
  const [showTestRunner, setShowTestRunner] = useState<boolean>(false);

  // تحميل البيانات الأولية
  const loadData = () => {
    const allUsers = dbService.getUsers();
    setStudents(allUsers);
    const allReports = dbService.getReports();
    setReports(allReports);
    setSettings(dbService.getSettings());

    const user = dbService.getCurrentUser();
    setCurrentUser(user);
    setNotifications(dbService.getNotifications(user?.id));
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleUserChange = (newUser: User) => {
    dbService.setCurrentUser(newUser);
    setCurrentUser(newUser);
    setNotifications(dbService.getNotifications(newUser.id));
    setActiveTab(newUser.role === 'admin' ? 'dashboard' : 'home');
    setEditingReportId(null);
  };

  // فتح نموذج التقرير للطالب
  const handleOpenReportForm = (reportId?: string) => {
    if (reportId) {
      setEditingReportId(reportId);
    } else if (currentUser) {
      // إنشاء تقرير جديد فارغ لهذا الشهر
      const newRep = createEmptyReport(
        currentUser,
        settings.currentMonth,
        settings.currentYear
      );
      dbService.saveDraftLocally(newRep);
      setEditingReportId(newRep.id);
      loadData();
    }
    setActiveTab('form');
  };

  // حفظ مسودة
  const handleSaveDraft = (updated: MonthlyReport) => {
    dbService.saveDraftLocally(updated);
    loadData();
  };

  // إرسال التقرير النهائي
  const handleSubmitReport = async (updated: MonthlyReport) => {
    const res = await dbService.submitReport(updated);
    if (res.success) {
      loadData();
      setActiveTab('home');
      setEditingReportId(null);
      alert(res.message);
    } else {
      alert(res.message);
    }
  };

  const studentReports = currentUser
    ? reports.filter((r) => r.studentId === currentUser.id)
    : [];
  const currentDraft =
    currentUser &&
    dbService.getLocalDraft(
      currentUser.id,
      settings.currentMonth,
      settings.currentYear
    );

  const currentEditingReport = editingReportId
    ? reports.find((r) => r.id === editingReportId) || currentDraft
    : currentDraft || (currentUser ? createEmptyReport(currentUser) : null);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* الترويسة الرئيسية مع محدد المستخدم وإشعارات النظام */}
      <Header
        currentUser={currentUser}
        onUserChange={handleUserChange}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onOpenTests={() => setShowTestRunner(true)}
        onOpenFlutterHub={() => setShowFlutterHub(true)}
        notifications={notifications}
        onRefreshNotifications={loadData}
      />

      {/* شريط التنقل الرئيسي */}
      <nav className="bg-white border-b border-slate-200 sticky top-16 z-30 shadow-2xs no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center space-x-1 space-x-reverse overflow-x-auto no-scrollbar py-2">
            {currentUser?.role === 'student' ? (
              <>
                <button
                  onClick={() => {
                    setActiveTab('home');
                    setEditingReportId(null);
                  }}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
                    activeTab === 'home'
                      ? 'bg-teal-700 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Home className="w-4 h-4" />
                  <span>الرئيسية والمتابعة</span>
                </button>

                <button
                  onClick={() => handleOpenReportForm(currentDraft?.id)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
                    activeTab === 'form'
                      ? 'bg-teal-700 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>
                    {currentDraft ? 'متابعة مسودة التقرير' : 'إعداد التقرير الشهري'}
                  </span>
                </button>

                <button
                  onClick={() => {
                    setActiveTab('past');
                    setEditingReportId(null);
                  }}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
                    activeTab === 'past'
                      ? 'bg-teal-700 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <History className="w-4 h-4" />
                  <span>سجل التقارير السابقة ({studentReports.length})</span>
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setActiveTab('dashboard')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
                    activeTab === 'dashboard'
                      ? 'bg-teal-700 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span>لوحة المؤشرات العامة</span>
                </button>

                <button
                  onClick={() => setActiveTab('students')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
                    activeTab === 'students'
                      ? 'bg-teal-700 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  <span>إدارة الطلاب ({students.filter((s) => s.role === 'student').length})</span>
                </button>

                <button
                  onClick={() => setActiveTab('reports')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
                    activeTab === 'reports'
                      ? 'bg-teal-700 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <FileCheck2 className="w-4 h-4" />
                  <span>مراجعة التقارير ({reports.length})</span>
                </button>

                <button
                  onClick={() => setActiveTab('ranking')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
                    activeTab === 'ranking'
                      ? 'bg-teal-700 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Medal className="w-4 h-4" />
                  <span>ترتيب الطلاب الشهري</span>
                </button>

                <button
                  onClick={() => setActiveTab('analytics')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
                    activeTab === 'analytics'
                      ? 'bg-teal-700 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <BarChart3 className="w-4 h-4" />
                  <span>التحليل والمقارنة</span>
                </button>

                <button
                  onClick={() => setActiveTab('annual')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
                    activeTab === 'annual'
                      ? 'bg-teal-700 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <CalendarCheck className="w-4 h-4" />
                  <span>التقرير السنوي الشامل</span>
                </button>

                <button
                  onClick={() => setActiveTab('settings')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
                    activeTab === 'settings'
                      ? 'bg-teal-700 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Settings className="w-4 h-4" />
                  <span>الإعدادات والنسخ الاحتياطي</span>
                </button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* المحتوى الرئيسي للتطبيق */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full">
        {currentUser?.role === 'student' ? (
          // ==================== بوابة الطالب ====================
          <>
            {activeTab === 'home' && (
              <StudentHome
                user={currentUser}
                reports={studentReports}
                currentDraft={currentDraft}
                onOpenReportForm={handleOpenReportForm}
                onViewPastReports={() => setActiveTab('past')}
              />
            )}

            {activeTab === 'form' && currentEditingReport && (
              <ReportForm
                user={currentUser}
                report={currentEditingReport}
                onSaveDraft={handleSaveDraft}
                onSubmitReport={handleSubmitReport}
                onBack={() => {
                  setActiveTab('home');
                  setEditingReportId(null);
                }}
                isReadOnly={
                  currentEditingReport.status === 'locked' ||
                  !currentEditingReport.editAllowed
                }
              />
            )}

            {activeTab === 'past' && (
              <PastReports
                user={currentUser}
                reports={studentReports}
                onOpenReport={(id) => handleOpenReportForm(id)}
                onBack={() => setActiveTab('home')}
              />
            )}
          </>
        ) : (
          // ==================== لوحة تحكم المسؤول ====================
          <>
            {activeTab === 'dashboard' && (
              <AdminDashboard
                students={students}
                reports={reports}
                settings={settings}
                onNavigateTab={setActiveTab}
              />
            )}

            {activeTab === 'students' && (
              <StudentManagement students={students} onRefresh={loadData} />
            )}

            {activeTab === 'reports' && (
              <ReportManagement
                reports={reports}
                students={students}
                settings={settings}
                onRefresh={loadData}
              />
            )}

            {activeTab === 'ranking' && (
              <StudentRanking reports={reports} settings={settings} />
            )}

            {activeTab === 'analytics' && (
              <AnalyticsView reports={reports} students={students} />
            )}

            {activeTab === 'annual' && (
              <AnnualReportView
                students={students}
                reports={reports}
                settings={settings}
              />
            )}

            {activeTab === 'settings' && (
              <SettingsAndBackup
                settings={settings}
                onRefreshSettings={loadData}
              />
            )}
          </>
        )}
      </main>

      {/* تذييل الصفحة الرسمي */}
      <footer className="bg-white border-t border-slate-200 py-6 mt-auto text-center text-xs text-slate-500 no-print">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>
            تطبيق المتابعة الشهرية • الإصدار 1.0.0 • قاعدة بيانات محلية آمنة على جهاز المسؤول
          </p>
          <div className="flex items-center gap-4 text-slate-400">
            <span>تشفير محلي PBKDF2/SHA-256</span>
            <span>•</span>
            <span>جاهزية Android Studio (Flutter)</span>
          </div>
        </div>
      </footer>

      {/* نافذة استعراض كود Flutter للأندرويد */}
      {showFlutterHub && (
        <FlutterProjectHub onClose={() => setShowFlutterHub(false)} />
      )}

      {/* نافذة تشغيل الاختبارات الآلية (Phase 3 Testing) */}
      {showTestRunner && (
        <TestRunnerModal onClose={() => setShowTestRunner(false)} />
      )}
    </div>
  );
}
