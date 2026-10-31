import React, { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CheckCircle2, Loader2, UserCheck } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import {
  TeacherObservationFormValues,
  teacherObservationSchema,
} from '../../schemas';
import { TeacherObservation, UserProfile } from '../../types';
import {
  BEHAVIOR_DOMAINS,
  RATING_SCALE_OPTIONS,
} from '../../constants';
import {
  getAllTeacherObservations,
  getAllUsers,
  submitTeacherObservation,
} from '../../services/firestore/ecoDataService';
import { FeedbackBanner, LoadingState } from '../../components/ui/StateViews';

export const TeacherObservationPage: React.FC = () => {
  const { user } = useAuth();
  const [students, setStudents] = useState<UserProfile[]>([]);
  const [observations, setObservations] = useState<TeacherObservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<TeacherObservationFormValues>({
    resolver: zodResolver(teacherObservationSchema),
    defaultValues: {
      studentId: '',
      assessmentPeriod: 'post',
      waste_management: 4,
      energy_water_saving: 4,
      responsible_consumption: 4,
      common_environment_care: 4,
      environmental_citizenship: 4,
      comment: '',
    },
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [uList, obsList] = await Promise.all([
        getAllUsers(true),
        getAllTeacherObservations(true),
      ]);
      const onlyStudents = uList.filter((u) => u.role === 'student');
      setStudents(onlyStudents);
      setObservations(obsList);
      if (onlyStudents.length > 0) {
        setValue('studentId', onlyStudents[0].uid);
      }
    } finally {
      setLoading(false);
    }
  }, [setValue]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onSubmit = async (values: TeacherObservationFormValues) => {
    if (!user) return;
    setFeedback(null);
    try {
      const st = students.find((s) => s.uid === values.studentId);
      await submitTeacherObservation({
        studentId: values.studentId,
        studentName: st?.displayName,
        classId: st?.classId,
        teacherId: user.uid,
        teacherName: user.displayName,
        assessmentPeriod: values.assessmentPeriod,
        scores: {
          waste_management: values.waste_management,
          energy_water_saving: values.energy_water_saving,
          responsible_consumption: values.responsible_consumption,
          common_environment_care: values.common_environment_care,
          environmental_citizenship: values.environmental_citizenship,
        },
        comment: values.comment,
        demo: st?.demo,
      });
      await loadData();
      setFeedback({
        type: 'success',
        message: `บันทึกผลการสังเกตพฤติกรรมของ ${st?.displayName || values.studentId} ช่วง ${values.assessmentPeriod.toUpperCase()} เรียบร้อยแล้ว!`,
      });
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err?.message || 'ไม่สามารถบันทึกผลการสังเกตพฤติกรรมได้',
      });
    }
  };

  if (loading) {
    return <LoadingState message="กำลังโหลดแบบประเมินสังเกตพฤติกรรมสำหรับครู..." />;
  }

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-eco-200 bg-white p-6 shadow-xs">
        <div className="flex items-start gap-3.5">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
            <UserCheck className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-slate-900">
              แบบประเมินสังเกตพฤติกรรมสำหรับครู (Teacher Observation)
            </h1>
            <p className="text-xs text-slate-600">
              ประเมินพฤติกรรมรับผิดชอบต่อสิ่งแวดล้อม 5 ด้านเดียวกับ Student Self-Assessment รองรับช่วง Pre, During และ Post
            </p>
          </div>
        </div>
      </div>

      {feedback && (
        <FeedbackBanner
          type={feedback.type}
          message={feedback.message}
          onClose={() => setFeedback(null)}
        />
      )}

      <div className="grid gap-6 lg:grid-cols-12">
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="lg:col-span-7 rounded-2xl border border-eco-100 bg-white p-6 shadow-xs space-y-4"
          noValidate
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold text-slate-700">
                เลือกนักเรียน *
              </label>
              <select
                {...register('studentId')}
                className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
              >
                {students.map((s) => (
                  <option key={s.uid} value={s.uid}>
                    {s.studentCode ? `[${s.studentCode}] ` : ''}
                    {s.displayName} (ห้อง {s.gradeLevel}/{s.room})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700">
                ระยะเวลาการประเมิน (Assessment Period) *
              </label>
              <select
                {...register('assessmentPeriod')}
                className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
              >
                <option value="pre">ก่อนเริ่มกิจกรรม (Pre-Observation)</option>
                <option value="during">ระหว่างทำกิจกรรม (During-Observation)</option>
                <option value="post">หลังจบกิจกรรม (Post-Observation)</option>
              </select>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <h2 className="text-sm font-bold text-slate-900">
              ประเมินคะแนนรายด้าน 5 ด้าน (ระดับ 1 - 5 คะแนน)
            </h2>
            {BEHAVIOR_DOMAINS.map((d) => (
              <div
                key={d.key}
                className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">
                    ด้านที่ {d.number}: {d.title}
                  </span>
                </div>
                <select
                  {...register(d.key)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-medium"
                >
                  {RATING_SCALE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700">
              บันทึกข้อสังเกตพฤติกรรมเพิ่มเติมโดยครู (Comment) *
            </label>
            <textarea
              rows={3}
              {...register('comment')}
              placeholder="บันทึกพฤติกรรมที่สังเกตเห็นจริงในโรงเรียน เช่น การพกกระบอกน้ำ การแยกขยะในห้องเรียน หรือการช่วยเตือนเพื่อน..."
              className="mt-1 w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm"
            />
            {errors.comment && (
              <p className="mt-1 text-xs text-red-600">{errors.comment.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-eco-600 px-6 py-3 text-sm font-bold text-white shadow-sm hover:bg-eco-700"
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle2 className="h-4 w-4" />
            )}
            <span>บันทึกผล Teacher Observation</span>
          </button>
        </form>

        <div className="lg:col-span-5 rounded-2xl border border-eco-100 bg-white p-6 shadow-xs space-y-4">
          <h2 className="text-base font-bold text-slate-900">
            ประวัติการสังเกตพฤติกรรมที่บันทึกแล้ว ({observations.length} รายการ)
          </h2>
          <div className="max-h-[560px] space-y-3 overflow-y-auto pr-1">
            {observations.map((obs) => (
              <div
                key={obs.id}
                className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-xs space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">
                    {obs.studentName || obs.studentId}
                  </span>
                  <span className="rounded-md bg-eco-100 px-2 py-0.5 font-bold text-eco-800 uppercase">
                    {obs.assessmentPeriod} ({obs.totalScore}/25)
                  </span>
                </div>
                <p className="text-slate-600">“{obs.comment}”</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

