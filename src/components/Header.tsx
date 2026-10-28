import React, { useState } from 'react';
import {
  GraduationCap,
  Bell,
  CheckCircle2,
  AlertTriangle,
  Smartphone,
  ShieldCheck,
  UserCheck,
  FlaskConical,
  Wifi,
  ChevronDown,
} from 'lucide-react';
import { User, AppNotification } from '../types';
import { dbService } from '../services/dbStorage';

interface HeaderProps {
  currentUser: User | null;
  onUserChange: (user: User) => void;
  activeTab: string;
  onTabChange: (tab: string) => void;
  onOpenTests: () => void;
  onOpenFlutterHub: () => void;
  notifications: AppNotification[];
  onRefreshNotifications: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  onUserChange,
  activeTab,
  onTabChange,
  onOpenTests,
  onOpenFlutterHub,
  notifications,
  onRefreshNotifications,
}) => {
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const users = dbService.getUsers();
  const unreadCount = notifications.filter((n) => !n.read).length;
  const settings = dbService.getSettings();

  const handleMarkAllRead = () => {
    dbService.markAllNotificationsRead();
    onRefreshNotifications();
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* الشعار واسم التطبيق */}
          <div className="flex items-center space-x-3 space-x-reverse">
            <div className="w-10 h-10 rounded-xl bg-teal-700 text-white flex items-center justify-center shadow-sm">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg text-slate-900 tracking-tight">
                  تطبيق المتابعة الشهرية
                </span>
                <span className="text-[11px] font-semibold bg-teal-50 text-teal-700 border border-teal-200 px-2 py-0.5 rounded-full">
                  محلي • جهاز المسؤول
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                {settings.organizationName}
              </p>
            </div>
          </div>

          {/* أزرار الإجراءات السريعة والمستخدم */}
          <div className="flex items-center space-x-2 space-x-reverse">
            {/* مؤشر الاتصال بالشبكة المحلية */}
            <div
              className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium"
              title="الخادم يعمل محلياً على جهاز المسؤول مع دعم العمل دون إنترنت"
            >
              <Wifi className="w-3.5 h-3.5 text-emerald-600" />
              <span>خادم محلي نشط</span>
            </div>

            {/* زر تشغيل الاختبارات الآلية */}
            <button
              onClick={onOpenTests}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
              title="فحص واختبار معادلات الدرجات وحالات الحدود (Phase 3)"
            >
              <FlaskConical className="w-4 h-4 text-teal-600" />
              <span className="hidden sm:inline">تشغيل الاختبارات</span>
            </button>

            {/* زر مشروع Flutter للأندرويد */}
            <button
              onClick={onOpenFlutterHub}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 transition"
              title="عرض وتصدير كود Flutter لبرنامج Android Studio"
            >
              <Smartphone className="w-4 h-4 text-teal-700" />
              <span className="hidden sm:inline">كود تطبيق أندرويد</span>
            </button>

            {/* قائمة الإشعارات */}
            <div className="relative">
              <button
                onClick={() => setShowNotifMenu(!showNotifMenu)}
                className="relative p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition"
                title="التنبيهات والإشعارات"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>

              {showNotifMenu && (
                <div className="absolute left-0 sm:left-auto sm:right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in slide-in-from-top-2">
                  <div className="flex items-center justify-between px-4 py-2 border-b border-slate-100">
                    <span className="font-bold text-sm text-slate-800">
                      التنبيهات والإشعارات ({notifications.length})
                    </span>
                    {unreadCount > 0 && (
                      <button
                        onClick={handleMarkAllRead}
                        className="text-xs text-teal-700 hover:underline font-medium"
                      >
                        تحديد الكل كمقروء
                      </button>
                    )}
                  </div>
                  <div className="max-h-72 overflow-y-auto divide-y divide-slate-50">
                    {notifications.length === 0 ? (
                      <p className="text-center py-6 text-xs text-slate-400">
                        لا توجد تنبيهات جديدة
                      </p>
                    ) : (
                      notifications.slice(0, 8).map((n) => (
                        <div
                          key={n.id}
                          className={`p-3 text-xs flex gap-2.5 ${
                            n.read ? 'bg-white' : 'bg-teal-50/50'
                          }`}
                        >
                          {n.type === 'warning' ? (
                            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                          ) : n.type === 'success' ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                          ) : (
                            <Bell className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                          )}
                          <div className="flex-1">
                            <p className="font-semibold text-slate-800 mb-0.5">
                              {n.title}
                            </p>
                            <p className="text-slate-600 leading-relaxed">
                              {n.message}
                            </p>
                            <span className="text-[10px] text-slate-400 mt-1 block">
                              {new Date(n.timestamp).toLocaleTimeString('ar-SA', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* محدد المستخدم وتبديل الدور للاختبار */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition text-right"
              >
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs ${
                    currentUser?.role === 'admin'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-teal-100 text-teal-800'
                  }`}
                >
                  {currentUser?.role === 'admin' ? (
                    <ShieldCheck className="w-4 h-4" />
                  ) : (
                    <UserCheck className="w-4 h-4" />
                  )}
                </div>
                <div className="hidden sm:block">
                  <div className="text-xs font-bold text-slate-800 leading-tight">
                    {currentUser?.fullName}
                  </div>
                  <div className="text-[10px] text-slate-500">
                    {currentUser?.role === 'admin'
                      ? 'لوحة تحكم المسؤول'
                      : 'بوابة الطالب'}
                  </div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {showUserMenu && (
                <div className="absolute left-0 sm:left-auto sm:right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50">
                  <div className="px-3 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    تبديل الحساب لتجربة النظام
                  </div>
                  <div className="divide-y divide-slate-100">
                    {users.map((u) => (
                      <button
                        key={u.id}
                        onClick={() => {
                          onUserChange(u);
                          setShowUserMenu(false);
                        }}
                        className={`w-full px-3 py-2 text-right text-xs flex items-center justify-between hover:bg-slate-50 transition ${
                          currentUser?.id === u.id
                            ? 'bg-teal-50/70 font-bold text-teal-900'
                            : 'text-slate-700'
                        }`}
                      >
                        <div>
                          <div className="font-semibold">{u.fullName}</div>
                          <div className="text-[10px] text-slate-400">
                            {u.role === 'admin'
                              ? 'المسؤول العام'
                              : `${u.educationalStage} (${u.studentId})`}
                          </div>
                        </div>
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded ${
                            u.status === 'active'
                              ? 'bg-emerald-100 text-emerald-800'
                              : u.status === 'pending'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {u.status === 'active'
                            ? 'نشط'
                            : u.status === 'pending'
                            ? 'بانتظار الموافقة'
                            : 'معلق'}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
