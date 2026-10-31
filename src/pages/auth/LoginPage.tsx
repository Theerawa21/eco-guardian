import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  KeyRound,
  Leaf,
  Loader2,
  LogIn,
  Mail,
  ShieldCheck,
  Sparkles,
  UserCheck,
  Users,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { LoginFormValues, loginSchema } from '../../schemas';
import { DEMO_ACCOUNTS } from '../../services/firestore/seedService';
import { FeedbackBanner } from '../../components/ui/StateViews';

export const LoginPage: React.FC = () => {
  const { loginWithEmail } = useAuth();
  const navigate = useNavigate();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const redirectByRole = (role: string) => {
    if (role === 'admin') navigate('/admin/dashboard', { replace: true });
    else if (role === 'teacher') navigate('/teacher/dashboard', { replace: true });
    else navigate('/student/dashboard', { replace: true });
  };

  const onSubmit = async (values: LoginFormValues) => {
    setErrorMsg(null);
    try {
      const profile = await loginWithEmail(values.email, values.password);
      redirectByRole(profile.role);
    } catch (err: any) {
      setErrorMsg(err?.message || 'เข้าสู่ระบบไม่สำเร็จ กรุณาตรวจสอบอีเมลและรหัสผ่าน');
    }
  };

  const handleQuickDemoLogin = async (roleKey: 'student' | 'teacher' | 'admin') => {
    const acc = DEMO_ACCOUNTS[roleKey];
    setValue('email', acc.email);
    setValue('password', acc.password);
    setErrorMsg(null);
    try {
      const profile = await loginWithEmail(acc.email, acc.password);
      redirectByRole(profile.role);
    } catch (err: any) {
      setErrorMsg(err?.message || 'ไม่สามารถเข้าสู่ระบบด้วยบัญชีตัวอย่างได้');
    }
  };

  return (
    <div className="flex min-h-screen flex-col justify-center bg-gradient-to-br from-eco-50 via-cream-50 to-sky-50 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center">
          <Link
            to="/"
            className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-eco-600 to-sky-600 text-white shadow-md"
          >
            <Leaf className="h-7 w-7" />
          </Link>
          <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-eco-900">
            ECO GUARDIAN
          </h1>
          <p className="mt-1 text-xs font-medium text-slate-600">
            ระบบดิจิทัลเพื่อส่งเสริมจิตสำนึกและพฤติกรรมรับผิดชอบต่อสิ่งแวดล้อม
          </p>
        </div>

        {/* Login Card */}
        <div className="rounded-3xl border border-eco-100 bg-white p-6 shadow-xl sm:p-8 space-y-5">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-lg font-bold text-slate-900">เข้าสู่ระบบ</h2>
            <p className="text-xs text-slate-500">
              กรอกอีเมลและรหัสผ่านเพื่อเข้าสู่พื้นที่การเรียนรู้และปฏิบัติภารกิจ
            </p>
          </div>

          {errorMsg && (
            <FeedbackBanner
              type="error"
              message={errorMsg}
              onClose={() => setErrorMsg(null)}
            />
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <div>
              <label
                htmlFor="login-email"
                className="block text-xs font-bold text-slate-700"
              >
                อีเมล (Email)
              </label>
              <div className="relative mt-1">
                <Mail className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                <input
                  id="login-email"
                  type="email"
                  autoComplete="email"
                  placeholder="example@ecoguardian.edu"
                  {...register('email')}
                  className="w-full rounded-xl border border-slate-300 py-2.5 pl-10 pr-3.5 text-sm focus:border-eco-600 focus:outline-none"
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-xs font-medium text-red-600">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label
                  htmlFor="login-password"
                  className="block text-xs font-bold text-slate-700"
                >
                  รหัสผ่าน (Password)
                </label>
                <Link
                  to="/reset-password"
                  className="text-xs font-semibold text-sky-700 hover:underline"
                >
                  ลืมรหัสผ่าน?
                </Link>
              </div>
              <div className="relative mt-1">
                <KeyRound className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                <input
                  id="login-password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  {...register('password')}
                  className="w-full rounded-xl border border-slate-300 py-2.5 pl-10 pr-3.5 text-sm focus:border-eco-600 focus:outline-none"
                />
              </div>
              {errors.password && (
                <p className="mt-1 text-xs font-medium text-red-600">
                  {errors.password.message}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-eco-600 px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-eco-700 disabled:opacity-60"
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <LogIn className="h-4 w-4" />
              )}
              <span>เข้าสู่ระบบ</span>
            </button>
          </form>

          {/* Quick Demo Role Accounts */}
          <div className="border-t border-slate-100 pt-4 space-y-2.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
              <Sparkles className="h-4 w-4 text-eco-600" />
              <span>ทดสอบเข้าสู่ระบบตามบทบาท (Demo Accounts)</span>
            </div>
            <div className="grid grid-cols-1 gap-2">
              <button
                type="button"
                onClick={() => handleQuickDemoLogin('student')}
                className="flex items-center justify-between rounded-xl border border-eco-200 bg-eco-50/70 px-3.5 py-2.5 text-left text-xs transition hover:bg-eco-100"
              >
                <span className="flex items-center gap-2 font-semibold text-eco-900">
                  <Users className="h-4 w-4 text-eco-700" />
                  {DEMO_ACCOUNTS.student.label}
                </span>
                <span className="rounded-md bg-white px-2 py-0.5 text-[10px] font-bold text-eco-700">
                  Student
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemoLogin('teacher')}
                className="flex items-center justify-between rounded-xl border border-sky-200 bg-sky-50/70 px-3.5 py-2.5 text-left text-xs transition hover:bg-sky-100"
              >
                <span className="flex items-center gap-2 font-semibold text-sky-900">
                  <UserCheck className="h-4 w-4 text-sky-700" />
                  {DEMO_ACCOUNTS.teacher.label}
                </span>
                <span className="rounded-md bg-white px-2 py-0.5 text-[10px] font-bold text-sky-700">
                  Teacher
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemoLogin('admin')}
                className="flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50/70 px-3.5 py-2.5 text-left text-xs transition hover:bg-amber-100"
              >
                <span className="flex items-center gap-2 font-semibold text-amber-900">
                  <ShieldCheck className="h-4 w-4 text-amber-700" />
                  {DEMO_ACCOUNTS.admin.label}
                </span>
                <span className="rounded-md bg-white px-2 py-0.5 text-[10px] font-bold text-amber-700">
                  Admin
                </span>
              </button>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-3 text-center text-xs text-slate-600">
            ยังไม่มีบัญชีผู้ใช้งาน?{' '}
            <Link to="/register" className="font-bold text-eco-700 hover:underline">
              ลงทะเบียนผู้เรียน/ครูใหม่
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

