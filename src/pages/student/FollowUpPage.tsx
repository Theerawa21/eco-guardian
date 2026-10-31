import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CheckCircle2, Loader2, Sparkles } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { FollowUpFormValues, followUpSchema } from '../../schemas';
import {
  getStudentFollowUp,
  getSystemSettings,
  submitFollowUpRecord,
} from '../../services/firestore/ecoDataService';
import { FeedbackBanner, LoadingState } from '../../components/ui/StateViews';

export const FollowUpPage: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [followUpDays, setFollowUpDays] = useState(30);
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FollowUpFormValues>({
    resolver: zodResolver(followUpSchema),
    defaultValues: {
      stillPracticing: 'yes',
      frequency: 'daily',
      obstacles: 'ไม่มีอุปสรรค',
      routineBehaviors: '',
      stoppedBehaviors: 'ไม่มี',
      reflection: '',
      newWasteKg: null,
      newElectricityKwh: null,
      newWaterUnits: null,
    },
  });

  useEffect(() => {
    async function load() {
      if (!user) return;
      setLoading(true);
      try {
        const [settings, prev] = await Promise.all([
          getSystemSettings(),
          getStudentFollowUp(user.uid),
        ]);
        setFollowUpDays(settings.followUpDays || 30);
        if (prev) {
          reset({
            stillPracticing: prev.stillPracticing,
            frequency: prev.frequency,
            obstacles: prev.obstacles,
            routineBehaviors: prev.routineBehaviors,
            stoppedBehaviors: prev.stoppedBehaviors,
            reflection: prev.reflection,
            newWasteKg: prev.newWasteKg ?? null,
            newElectricityKwh: prev.newElectricityKwh ?? null,
            newWaterUnits: prev.newWaterUnits ?? null,
          });
        }
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [user, reset]);

  const onSubmit = async (values: FollowUpFormValues) => {
    if (!user) return;
    setFeedback(null);
    try {
      await submitFollowUpRecord({
        userId: user.uid,
        ...values,
        demo: user.demo,
      });
      setFeedback({
        type: 'success',
        message: 'บันทึกแบบติดตามผลระยะยาว (Follow-up) และข้อมูล Home Eco รอบใหม่สำเร็จ!',
      });
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err?.message || 'ไม่สามารถบันทึกแบบติดตามผลได้',
      });
    }
  };

  if (loading) {
    return <LoadingState message="กำลังโหลดแบบติดตามผลระยะยาว (Follow-up)..." />;
  }

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-eco-200 bg-white p-6 shadow-xs">
        <div className="flex items-start gap-3.5">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-purple-100 text-purple-700">
            <Sparkles className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-slate-900">
              การติดตามผลความยั่งยืนของพฤติกรรม (Follow-up ระยะ {followUpDays} วัน)
            </h1>
            <p className="text-xs text-slate-600">
              สำรวจความต่อเนื่องของพฤติกรรมหลังจบกิจกรรม พฤติกรรมที่กลายเป็นกิจวัตรประจำวัน และข้อมูล Home Eco รอบติดตามผล
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

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="rounded-2xl border border-eco-100 bg-white p-6 shadow-xs space-y-5"
        noValidate
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-bold text-slate-700">
              1. ปัจจุบันคุณยังปฏิบัติพฤติกรรมรักษ์สิ่งแวดล้อมอยู่หรือไม่? *
            </label>
            <select
              {...register('stillPracticing')}
              className="mt-1 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm"
            >
              <option value="yes">ยังปฏิบัติอย่างต่อเนื่องสม่ำเสมอ</option>
              <option value="sometimes">ปฏิบัติเป็นบางครั้งเมื่อมีโอกาส</option>
              <option value="no">หยุดปฏิบัติแล้ว</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700">
              2. ความถี่ในการปฏิบัติในปัจจุบัน *
            </label>
            <select
              {...register('frequency')}
              className="mt-1 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm"
            >
              <option value="daily">ทุกวัน (เป็นนิสัยประจำวัน)</option>
              <option value="4_5_days_week">4 - 5 วันต่อสัปดาห์</option>
              <option value="2_3_days_week">2 - 3 วันต่อสัปดาห์</option>
              <option value="rarely">นานๆ ครั้ง</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700">
            3. พฤติกรรมใดบ้างที่กลายเป็นกิจวัตรประจำวันของคุณและครอบครัวแล้ว? *
          </label>
          <textarea
            rows={2}
            {...register('routineBehaviors')}
            placeholder="เช่น พกกระบอกน้ำไปโรงเรียน แยกขยะก่อนทิ้ง และปิดไฟเมื่อออกจากห้อง"
            className="mt-1 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm"
          />
          {errors.routineBehaviors && (
            <p className="mt-1 text-xs text-red-600">
              {errors.routineBehaviors.message}
            </p>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-bold text-slate-700">
              4. พฤติกรรมใดที่ทำน้อยลงหรือหยุดทำ? (หากไม่มีให้ระบุว่า "ไม่มี") *
            </label>
            <input
              type="text"
              {...register('stoppedBehaviors')}
              className="mt-1 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700">
              5. อุปสรรคในการรักษาพฤติกรรมระยะยาว *
            </label>
            <input
              type="text"
              {...register('obstacles')}
              className="mt-1 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700">
            6. การสะท้อนคิดหลังผ่านช่วงติดตามผล {followUpDays} วัน *
          </label>
          <textarea
            rows={3}
            {...register('reflection')}
            placeholder="คุณเห็นการเปลี่ยนแปลงใดในตนเองและครอบครัวที่ชัดเจนที่สุด?"
            className="mt-1 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm"
          />
          {errors.reflection && (
            <p className="mt-1 text-xs text-red-600">{errors.reflection.message}</p>
          )}
        </div>

        <div className="rounded-2xl border border-sky-100 bg-sky-50/60 p-4 space-y-3">
          <h3 className="text-xs font-bold text-sky-950">
            บันทึกข้อมูล Home Eco Data รอบติดตามผล (ไม่บังคับ)
          </h3>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-xs font-medium text-slate-700">
                ขยะรวมรอบใหม่ (กก.)
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                {...register('newWasteKg')}
                placeholder="เช่น 6.2"
                className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700">
                หน่วยไฟฟ้ารอบใหม่ (kWh)
              </label>
              <input
                type="number"
                step="1"
                min="0"
                {...register('newElectricityKwh')}
                placeholder="เช่น 200"
                className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700">
                หน่วยน้ำประปารอบใหม่ (ยูนิต)
              </label>
              <input
                type="number"
                step="0.5"
                min="0"
                {...register('newWaterUnits')}
                placeholder="เช่น 14"
                className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 rounded-2xl bg-eco-600 px-7 py-3 text-sm font-bold text-white shadow-md hover:bg-eco-700"
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle2 className="h-4 w-4" />
            )}
            <span>บันทึกผล Follow-up</span>
          </button>
        </div>
      </form>
    </div>
  );
};

