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
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs no-print w-full overflow-x-hidden">
      <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-auto py-2.5 sm:h-16 gap-2">
          
          {/* الشعار واسم التطبيق (مع ضبط العرض للموبايل) */}
          <div className="flex items-center space-x-2 space-x-reverse min-w-0 flex-1">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-teal-700 text-white flex items-center justify-center shadow-sm shrink-0">
              <GraduationCap className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-bold text-sm sm:text-lg text-slate-900 tracking-tight truncate">
                  المتابعة الشهرية
                </span>
                <span className="hidden md:inline-block text-[10px] font-semibold bg-teal-50 text-teal-700 border border-teal-200 px-2 py-0.5 rounded-full">
                  محلي
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-500 font-medium truncate">
                {settings.organizationName}
              </p>
            </div>
          </div>

          {/* أزرار الإجراءات السريعة والمستخدم */}
          <div className="flex items-center space-x-1.5 sm:space-x-2 space-x-reverse shrink-0">
            
            {/* زر تشغيل الاختبارات الآلية (يظهر بشاشات متوسطة فأعلى) */}
            <button
              onClick={onOpenTests}
              className="hidden lg:flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
              title="فحص واختبار معادلات الدرجات وحالات الحدود"
            >
              <FlaskConical className="w-3.5 h-3.5 text-teal-600" />
              <span>الاختبارات</span>
            </button>

            {/* زر مشروع Flutter للأندرويد */}
            <button
              onClick={onOpenFlutterHub}
              className="hidden md:flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 transition"
              title="عرض وتصدير كود Flutter لبرنامج Android Studio"
            >
              <Smartphone className="w-3.5 h-3.5 text-teal-700" />
              <span>أندرويد</span>
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
                  <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>

              {showNotifMenu && (
                <div className="absolute left-0 sm:left-auto sm:right-0 mt-2 w-72 sm:w-96 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50">
                  <div className="flex items-center justify-between px-4 py-2 border-b border-slate-100">
                    <span className="font-bold text-xs sm:text-sm text-slate-800">
                      التنبيهات ({notifications.length})
                    </span>
                    {unreadCount > 0 && (
                      <button
                        onClick={handleMarkAllRead}
                        className="text-xs text-teal-700 hover:underline font-medium"
                      >
                        قراءة الكل
                      </button>
                    )}
                  </div>
                  <div className="max-h-64 overflow-y-auto divide-y divide-slate-50">
                    {notifications.length === 0 ? (
                      <p className="text-center py-4 text-xs text-slate-400">
                        لا توجد تنبيهات جديدة
                      </p>
                    ) : (
                      notifications.slice(0, 8).map((n) => (
                        <div
                          key={n.id}
                          className={`p-2.5 text-xs flex gap-2 ${
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
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-slate-800 mb-0.5 truncate">
                              {n.title}
                            </p>
                            <p className="text-slate-600 leading-relaxed text-[11px]">
                              {n.message}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* محدد المستخدم وتبديل الدور */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-1.5 p-1 sm:px-2.5 sm:py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition text-right"
              >
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
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
                <div className="hidden md:block text-right">
                  <div className="text-xs font-bold text-slate-800 leading-tight truncate max-w-[100px]">
                    {currentUser?.fullName}
                  </div>
                  <div className="text-[10px] text-slate-500">
                    {currentUser?.role === 'admin' ? 'مسؤول' : 'طالب'}
                  </div>
                </div>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {showUserMenu && (
                <div className="absolute left-0 sm:left-auto sm:right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50">
                  <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    تبديل الحساب
                  </div>
                  <div className="divide-y divide-slate-100 max-h-60 overflow-y-auto">
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
                        <div className="truncate pl-2">
                          <div className="font-semibold truncate">{u.fullName}</div>
                          <div className="text-[10px] text-slate-400">
                            {u.role === 'admin' ? 'المسؤول العام' : u.educationalStage}
                          </div>
                        </div>
                        <span className="text-[9px] px-1 py-0.5 rounded bg-slate-100 text-slate-600 shrink-0">
                          {u.role === 'admin' ? 'مسؤول' : 'طالب'}
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