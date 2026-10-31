import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Leaf, Loader2, UserPlus } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { RegisterFormValues, registerSchema } from '../../schemas';
import { Classroom } from '../../types';
import { getClassrooms } from '../../services/firestore/ecoDataService';
import { FeedbackBanner } from '../../components/ui/StateViews';

export const RegisterPage: React.FC = () => {
  const { registerWithEmail } = useAuth();
  const navigate = useNavigate();
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    getClassrooms().then(setClassrooms);
  }, []);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      studentCode: '',
      email: '',
      password: '',
      role: 'student',
      classId: 'class-m2-1',
      gradeLevel: 'ม.2',
      room: '1',
    },
  });

  const selectedRole = watch('role');

  const onSubmit = async (values: RegisterFormValues) => {
    setErrorMsg(null);
    try {
      const selectedClass = classrooms.find((c) => c.id === values.classId);
      const profile = await registerWithEmail({
        ...values,
        gradeLevel: selectedClass?.gradeLevel || values.gradeLevel || 'ม.2',
        room: selectedClass?.room || values.room || '1',
      });
      if (profile.role === 'admin') navigate('/admin/dashboard');
      else if (profile.role === 'teacher') navigate('/teacher/dashboard');
      else navigate('/student/dashboard');
    } catch (err: any) {
      setErrorMsg(err?.message || 'ไม่สามารถลงทะเบียนได้');
    }
  };

  return (
    <div className="flex min-h-screen flex-col justify-center bg-gradient-to-br from-eco-50 via-cream-50 to-sky-50 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-lg space-y-6">
        <div className="text-center">
          <Link
            to="/"
            className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-eco-600 text-white shadow-md"
          >
            <Leaf className="h-6 w-6" />
          </Link>
          <h1 className="mt-2 text-2xl font-extrabold text-eco-900">
            สมัครสมาชิก ECO GUARDIAN
          </h1>
          <p className="text-xs text-slate-600">
            สร้างบัญชีเพื่อเริ่มการเรียนรู้และบันทึกภารกิจสิ่งแวดล้อม
          </p>
        </div>

        <div className="rounded-3xl border border-eco-100 bg-white p-6 shadow-xl sm:p-8 space-y-4">
          {errorMsg && (
            <FeedbackBanner
              type="error"
              message={errorMsg}
              onClose={() => setErrorMsg(null)}
            />
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-bold text-slate-700">
                  ชื่อจริง *
                </label>
                <input
                  type="text"
                  {...register('firstName')}
                  placeholder="เช่น พิมชนก"
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm"
                />
                {errors.firstName && (
                  <p className="mt-1 text-xs text-red-600">{errors.firstName.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700">
                  นามสกุล *
                </label>
                <input
                  type="text"
                  {...register('lastName')}
                  placeholder="เช่น รักษ์พงไพร"
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm"
                />
                {errors.lastName && (
                  <p className="mt-1 text-xs text-red-600">{errors.lastName.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-bold text-slate-700">
                  บทบาทผู้ใช้งาน (Role) *
                </label>
                <select
                  {...register('role')}
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm"
                >
                  <option value="student">นักเรียน (Student)</option>
                  <option value="teacher">ครูที่ปรึกษา (Teacher)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700">
                  ห้องเรียน
                </label>
                <select
                  {...register('classId')}
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm"
                >
                  {classrooms.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.teacherName})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {selectedRole === 'student' && (
              <div>
                <label className="block text-xs font-bold text-slate-700">
                  รหัสนักเรียน (ถ้ามี)
                </label>
                <input
                  type="text"
                  {...register('studentCode')}
                  placeholder="เช่น 69211"
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700">
                อีเมล (Email) *
              </label>
              <input
                type="email"
                {...register('email')}
                placeholder="student@ecoguardian.edu"
                className="mt-1 w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm"
              />
              {errors.email && (
                <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700">
                รหัสผ่าน (อย่างน้อย 6 ตัวอักษร) *
              </label>
              <input
                type="password"
                {...register('password')}
                placeholder="••••••••"
                className="mt-1 w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm"
              />
              {errors.password && (
                <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-eco-600 px-4 py-3 text-sm font-bold text-white shadow-sm hover:bg-eco-700 disabled:opacity-60"
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <UserPlus className="h-4 w-4" />
              )}
              <span>สร้างบัญชีและเริ่มภารกิจ</span>
            </button>
          </form>

          <div className="border-t border-slate-100 pt-3 text-center text-xs text-slate-600">
            มีบัญชีผู้ใช้งานอยู่แล้ว?{' '}
            <Link to="/login" className="font-bold text-eco-700 hover:underline">
              เข้าสู่ระบบที่นี่
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

