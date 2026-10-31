import React, { useEffect, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import {
  Award,
  BarChart3,
  Bell,
  BookOpen,
  CheckCheck,
  ClipboardCheck,
  Compass,
  FileCheck2,
  Flame,
  Home,
  Leaf,
  LogOut,
  Menu,
  ShieldCheck,
  Sparkles,
  Target,
  UserCheck,
  Users,
  X,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { AppNotification } from '../../types';
import {
  getUserNotifications,
  markAllUserNotificationsRead,
  markNotificationAsRead,
} from '../../services/firestore/notificationService';
import { isLiveFirestoreActive } from '../../services/firestore/collections';
import { formatThaiDateTime } from '../../utils';

export const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  useEffect(() => {
    let active = true;
    async function loadNotifs() {
      if (!user) return;
      const list = await getUserNotifications(user.uid, user.role);
      if (active) setNotifications(list);
    }
    loadNotifs();
    const timer = setInterval(loadNotifs, 12000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [user]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleMarkRead = async (n: AppNotification) => {
    await markNotificationAsRead(n.id);
    setNotifications((prev) =>
      prev.map((item) => (item.id === n.id ? { ...item, read: true } : item))
    );
    if (n.link) {
      setNotifOpen(false);
      navigate(n.link);
    }
  };

  const handleMarkAllRead = async () => {
    if (!user) return;
    await markAllUserNotificationsRead(user.uid, user.role);
    setNotifications((prev) => prev.map((item) => ({ ...item, read: true })));
  };

  const studentNav = [
    { to: '/student/dashboard', label: 'หน้าหลักผู้เรียน', icon: Home },
    { to: '/student/pre-assessment', label: 'ประเมินก่อนเรียน', icon: ClipboardCheck },
    { to: '/student/baseline', label: 'ข้อมูลพื้นฐานบ้าน', icon: Compass },
    { to: '/student/missions', label: 'แผนที่ 5 ภารกิจ', icon: BookOpen },
    { to: '/student/commitment', label: 'พันธสัญญาพฤติกรรม', icon: Target },
    { to: '/student/actions', label: 'แผน & บันทึกปฏิบัติ', icon: Flame },
    { to: '/student/home-eco', label: 'รายงานขยะ-ไฟ-น้ำ', icon: BarChart3 },
    { to: '/student/post-assessment', label: 'ประเมินหลังเรียน', icon: FileCheck2 },
    { to: '/student/follow-up', label: 'ติดตามผล (Follow-up)', icon: Sparkles },
    { to: '/student/journey', label: 'My Eco Journey', icon: Award },
  ];

  const teacherNav = [
    { to: '/teacher/dashboard', label: 'แดชบอร์ดครู', icon: Home },
    { to: '/teacher/verification', label: 'ตรวจหลักฐาน Eco Action', icon: FileCheck2 },
    { to: '/teacher/students', label: 'จัดการและติดตามผู้เรียน', icon: Users },
    { to: '/teacher/observations', label: 'ประเมินสังเกตพฤติกรรม', icon: UserCheck },
    { to: '/teacher/reports', label: 'รายงานระดับห้องเรียน', icon: BarChart3 },
  ];

  const adminNav = [
    { to: '/admin/dashboard', label: 'ระบบบริหารจัดการ (Admin CMS)', icon: ShieldCheck },
    { to: '/teacher/dashboard', label: 'มุมมองครูที่ปรึกษา', icon: Users },
    { to: '/student/dashboard', label: 'มุมมองนักเรียน', icon: Compass },
  ];

  const activeNav =
    user?.role === 'admin'
      ? adminNav
      : user?.role === 'teacher'
      ? teacherNav
      : studentNav;

  const roleBadgeLabel =
    user?.role === 'admin'
      ? 'ผู้ดูแลระบบ (Admin)'
      : user?.role === 'teacher'
      ? 'ครูที่ปรึกษา (Teacher)'
      : 'นักเรียน (Student)';

  return (
    <div className="min-h-screen bg-cream-50 flex flex-col">
      {/* Top Header */}
      <header className="sticky top-0 z-30 border-b border-eco-100 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="เปิดหรือปิดเมนูนำทาง"
              className="rounded-xl p-2 text-slate-600 hover:bg-eco-50 lg:hidden"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
            <Link to="/" className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-eco-600 to-sky-600 text-white shadow-sm">
                <Leaf className="h-5 w-5" />
              </div>
              <div>
                <span className="block text-base font-bold tracking-tight text-eco-900">
                  ECO GUARDIAN
                </span>
                <span className="hidden text-[11px] font-medium text-slate-500 sm:block">
                  ระบบส่งเสริมจิตสำนึกและพฤติกรรมรับผิดชอบต่อสิ่งแวดล้อม
                </span>
              </div>
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <span
              className={`hidden items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold md:inline-flex ${
                isLiveFirestoreActive()
                  ? 'bg-eco-100 text-eco-800'
                  : 'bg-sky-100 text-sky-800'
              }`}
            >
              <span className="h-2 w-2 rounded-full bg-current" />
              {isLiveFirestoreActive() ? 'Firebase Connected' : 'Firebase Service Ready'}
            </span>

            {/* Notification Bell Center (Section 50) */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setNotifOpen(!notifOpen)}
                aria-label="ศูนย์การแจ้งเตือน"
                className="relative rounded-xl border border-slate-200 bg-white p-2 text-slate-700 transition hover:bg-eco-50 hover:text-eco-700"
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white">
                    {unreadCount}
                  </span>
                )}
              </button>

              {notifOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl border border-slate-200 bg-white p-4 shadow-xl z-50">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                    <h3 className="text-sm font-bold text-slate-800">
                      ศูนย์การแจ้งเตือน ({unreadCount} รายการใหม่)
                    </h3>
                    {unreadCount > 0 && (
                      <button
                        type="button"
                        onClick={handleMarkAllRead}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-eco-700 hover:underline"
                      >
                        <CheckCheck className="h-3.5 w-3.5" />
                        อ่านทั้งหมด
                      </button>
                    )}
                  </div>
                  <div className="mt-2 max-h-80 space-y-2 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <p className="py-6 text-center text-xs text-slate-500">
                        ยังไม่มีการแจ้งเตือนใหม่ในขณะนี้
                      </p>
                    ) : (
                      notifications.slice(0, 12).map((n) => (
                        <button
                          key={n.id}
                          type="button"
                          onClick={() => handleMarkRead(n)}
                          className={`w-full rounded-xl p-3 text-left transition ${
                            n.read
                              ? 'bg-slate-50/70 text-slate-600 hover:bg-slate-100'
                              : 'border border-eco-200 bg-eco-50/70 text-slate-900 hover:bg-eco-100/70'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <span className="text-xs font-bold">{n.title}</span>
                            {!n.read && (
                              <span className="h-2 w-2 shrink-0 rounded-full bg-eco-600 mt-1" />
                            )}
                          </div>
                          <p className="mt-1 text-xs leading-relaxed">{n.message}</p>
                          <span className="mt-1 block text-[10px] text-slate-400">
                            {formatThaiDateTime(n.createdAt)}
                          </span>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* User Profile Pill */}
            <div className="hidden sm:flex items-center gap-2.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-eco-600 text-xs font-bold text-white">
                {user?.firstName?.slice(0, 1) || 'U'}
              </div>
              <div className="text-left">
                <p className="text-xs font-bold text-slate-800 leading-tight">
                  {user?.displayName}
                </p>
                <p className="text-[11px] font-medium text-eco-700">
                  {roleBadgeLabel} {user?.gradeLevel ? `• ${user.gradeLevel}/${user.room}` : ''}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              aria-label="ออกจากระบบ"
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-red-200 hover:bg-red-50 hover:text-red-700"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">ออกจากระบบ</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Layout */}
      <div className="mx-auto flex w-full max-w-7xl flex-1 gap-6 px-4 py-6 sm:px-6 lg:px-8">
        {/* Desktop Sidebar */}
        <aside className="hidden w-64 shrink-0 lg:block">
          <nav
            aria-label="เมนูหลักของระบบ"
            className="sticky top-22 space-y-1.5 rounded-2xl border border-eco-100 bg-white p-3 shadow-sm"
          >
            <div className="px-3 py-2 border-b border-slate-100 mb-2">
              <p className="text-[11px] font-bold uppercase tracking-wider text-eco-700">
                เมนูนำทาง ({roleBadgeLabel})
              </p>
            </div>
            {activeNav.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition ${
                      isActive
                        ? 'bg-eco-600 text-white shadow-sm'
                        : 'text-slate-700 hover:bg-eco-50 hover:text-eco-800'
                    }`
                  }
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </aside>

        {/* Mobile Drawer */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-40 flex lg:hidden">
            <div
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs"
              onClick={() => setMobileMenuOpen(false)}
            />
            <div className="relative z-50 flex w-72 flex-col bg-white p-4 shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <span className="text-sm font-bold text-eco-900">เมนูนำทาง ECO GUARDIAN</span>
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded-lg p-1 text-slate-500"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="mt-3 space-y-1 overflow-y-auto">
                {activeNav.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      onClick={() => setMobileMenuOpen(false)}
                      className={({ isActive }) =>
                        `flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium ${
                          isActive
                            ? 'bg-eco-600 text-white'
                            : 'text-slate-700 hover:bg-eco-50'
                        }`
                      }
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <span>{item.label}</span>
                    </NavLink>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Page Body */}
        <main className="min-w-0 flex-1">{children}</main>
      </div>

      {/* Footer */}
      <footer className="mt-auto border-t border-eco-100 bg-white py-4">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 text-xs text-slate-500 sm:flex-row sm:px-6 lg:px-8">
          <p className="font-medium text-slate-700">
            ECO GUARDIAN — ระบบดิจิทัลเพื่อส่งเสริมจิตสำนึกและพฤติกรรมรับผิดชอบต่อสิ่งแวดล้อม
          </p>
          <p>“จากการเรียนรู้ สู่การลงมือดูแลโลกในชีวิตจริง”</p>
        </div>
      </footer>
    </div>
  );
};

