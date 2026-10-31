import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, KeyRound, Loader2 } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { ResetPasswordFormValues, resetPasswordSchema } from '../../schemas';
import { FeedbackBanner } from '../../components/ui/StateViews';

export const ResetPasswordPage: React.FC = () => {
  const { sendResetPassword } = useAuth();
  const [status, setStatus] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const onSubmit = async (values: ResetPasswordFormValues) => {
    setStatus(null);
    try {
      await sendResetPassword(values.email);
      setStatus({
        type: 'success',
        message: `ระบบได้ส่งลิงก์สำหรับตั้งรหัสผ่านใหม่ไปยัง ${values.email} เรียบร้อยแล้ว`,
      });
    } catch (err: any) {
      setStatus({
        type: 'error',
        message: err?.message || 'ไม่สามารถส่งลิงก์รีเซ็ตรหัสผ่านได้',
      });
    }
  };

  return (
    <div className="flex min-h-screen flex-col justify-center bg-cream-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-md rounded-3xl border border-eco-100 bg-white p-8 shadow-xl space-y-5">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-100 text-sky-700">
            <KeyRound className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900">ลืมรหัสผ่าน</h1>
            <p className="text-xs text-slate-500">
              กรอกอีเมลของคุณเพื่อรับลิงก์ตั้งรหัสผ่านใหม่ผ่าน Firebase Authentication
            </p>
          </div>
        </div>

        {status && (
          <FeedbackBanner
            type={status.type}
            message={status.message}
            onClose={() => setStatus(null)}
          />
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div>
            <label className="block text-xs font-bold text-slate-700">
              อีเมลที่ใช้ลงทะเบียน
            </label>
            <input
              type="email"
              placeholder="student01@ecoguardian.edu"
              {...register('email')}
              className="mt-1 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm"
            />
            {errors.email && (
              <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-eco-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-eco-700 disabled:opacity-60"
          >
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
            <span>ส่งลิงก์ตั้งรหัสผ่านใหม่</span>
          </button>
        </form>

        <div className="pt-2 text-center">
          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-eco-700"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>กลับไปหน้าเข้าสู่ระบบ</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

