import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  ArrowRight,
  CheckCircle2,
  Loader2,
  Sparkles,
  Target,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import {
  BehaviorCommitmentFormValues,
  behaviorCommitmentSchema,
} from '../../schemas';
import { BEHAVIOR_CATEGORIES } from '../../constants';
import {
  getStudentCommitment,
  saveBehaviorCommitment,
} from '../../services/firestore/ecoDataService';
import { FeedbackBanner, LoadingState } from '../../components/ui/StateViews';

export const BehaviorCommitmentPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const today = new Date().toISOString().slice(0, 10);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<BehaviorCommitmentFormValues>({
    resolver: zodResolver(behaviorCommitmentSchema),
    defaultValues: {
      category: 'Waste',
      what: '',
      when: 'ทุกวันหลังเลิกเรียนและหลังอาหารเย็น',
      where: 'ที่บ้านและที่โรงเรียน',
      how: '',
      reason: '',
      startDate: today,
    },
  });

  const selectedCategory = watch('category');

  useEffect(() => {
    async function load() {
      if (!user) return;
      setLoading(true);
      try {
        const existing = await getStudentCommitment(user.uid);
        if (existing) {
          setSaved(true);
          reset({
            category: existing.category,
            what: existing.what,
            when: existing.when,
            where: existing.where,
            how: existing.how,
            reason: existing.reason,
            startDate: existing.startDate,
          });
        }
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [user, reset]);

  const onSubmit = async (values: BehaviorCommitmentFormValues) => {
    if (!user) return;
    setFeedback(null);
    try {
      await saveBehaviorCommitment({
        userId: user.uid,
        ...values,
        demo: user.demo,
      });
      setSaved(true);
      setFeedback({
        type: 'success',
        message:
          'บันทึกพันธสัญญาการเปลี่ยนพฤติกรรมสำเร็จ! ก้าวต่อไปคือการสร้างแผนปฏิบัติการ (Eco Action Plan)',
      });
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err?.message || 'ไม่สามารถบันทึกพันธสัญญาได้',
      });
    }
  };

  if (loading) {
    return <LoadingState message="กำลังโหลดข้อมูลพันธสัญญาพฤติกรรม..." />;
  }

  const currentCatMeta =
    BEHAVIOR_CATEGORIES.find((c) => c.key === selectedCategory) ||
    BEHAVIOR_CATEGORIES[0];

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-eco-200 bg-white p-6 shadow-xs">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex items-start gap-3.5">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-eco-100 text-eco-700">
              <Target className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-slate-900">
                พันธสัญญาการเปลี่ยนพฤติกรรม (Behavior Commitment)
              </h1>
              <p className="text-xs text-slate-600">
                เลือก “พฤติกรรม 1 อย่างที่ฉันต้องการเปลี่ยน” อย่างชัดเจน เพื่อสร้างนิสัยใหม่ที่ยั่งยืน
              </p>
            </div>
          </div>

          {saved && (
            <button
              type="button"
              onClick={() => navigate('/student/actions')}
              className="inline-flex items-center gap-2 rounded-xl bg-eco-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-eco-700"
            >
              <span>ไปสร้างแผน Eco Action Plan</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          )}
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
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-2">
            1. เลือกหมวดหมู่พฤติกรรม (Category) *
          </label>
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            {BEHAVIOR_CATEGORIES.map((cat) => {
              const active = selectedCategory === cat.key;
              return (
                <button
                  key={cat.key}
                  type="button"
                  onClick={() => setValue('category', cat.key)}
                  className={`rounded-xl border p-3 text-left transition ${
                    active
                      ? 'border-2 border-eco-600 bg-eco-50 text-eco-950 font-bold'
                      : 'border-slate-200 bg-slate-50/60 text-slate-700 hover:bg-eco-50/40'
                  }`}
                >
                  <span className="block text-xs font-bold">{cat.key}</span>
                  <span className="mt-0.5 block text-[11px] leading-snug">
                    {cat.labelTh}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Example Suggestions */}
        <div className="rounded-xl border border-sky-100 bg-sky-50/70 p-3.5 text-xs text-sky-900">
          <p className="font-bold flex items-center gap-1.5">
            <Sparkles className="h-4 w-4 text-sky-600" />
            ตัวอย่างพฤติกรรมในหมวด {currentCatMeta.labelTh}: (คลิกเพื่อนำไปใช้ได้)
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {currentCatMeta.examples.map((ex) => (
              <button
                key={ex}
                type="button"
                onClick={() => setValue('what', ex)}
                className="rounded-lg border border-sky-200 bg-white px-3 py-1.5 text-xs font-medium text-sky-800 hover:bg-sky-100"
              >
                + {ex}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700">
            2. พฤติกรรมที่ฉันต้องการเปลี่ยนคืออะไร (What) *
          </label>
          <input
            type="text"
            {...register('what')}
            placeholder="ระบุพฤติกรรมที่ชัดเจนและวัดผลได้ เช่น พกกระบอกน้ำและคัดแยกขยะทุกวัน"
            className="mt-1 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm"
          />
          {errors.what && (
            <p className="mt-1 text-xs text-red-600">{errors.what.message}</p>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="block text-xs font-bold text-slate-700">
              3. จะทำเมื่อใด (When) *
            </label>
            <input
              type="text"
              {...register('when')}
              placeholder="เช่น ทุกวัน เวลา 18.00 น."
              className="mt-1 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm"
            />
            {errors.when && (
              <p className="mt-1 text-xs text-red-600">{errors.when.message}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700">
              4. จะทำที่ไหน (Where) *
            </label>
            <input
              type="text"
              {...register('where')}
              placeholder="เช่น ที่บ้านและที่โรงเรียน"
              className="mt-1 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm"
            />
            {errors.where && (
              <p className="mt-1 text-xs text-red-600">{errors.where.message}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700">
              5. วันที่เริ่มต้น (Start Date) *
            </label>
            <input
              type="date"
              {...register('startDate')}
              className="mt-1 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700">
            6. จะมีวิธีการปฏิบัติอย่างไรให้สำเร็จ (How) *
          </label>
          <textarea
            rows={2}
            {...register('how')}
            placeholder="อธิบายขั้นตอนหรือการเตรียมตัว เช่น เตรียมถังแยกขยะในห้องครัวและตั้งเตือนในโทรศัพท์"
            className="mt-1 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm"
          />
          {errors.how && (
            <p className="mt-1 text-xs text-red-600">{errors.how.message}</p>
          )}
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700">
            7. เหตุผลและแรงบันดาลใจในการเปลี่ยนพฤติกรรมนี้ (Reason) *
          </label>
          <textarea
            rows={2}
            {...register('reason')}
            placeholder="ทำไมการเปลี่ยนพฤติกรรมนี้จึงมีความหมายต่อคุณ ครอบครัว และสิ่งแวดล้อม?"
            className="mt-1 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm"
          />
          {errors.reason && (
            <p className="mt-1 text-xs text-red-600">{errors.reason.message}</p>
          )}
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 rounded-2xl bg-eco-600 px-7 py-3 text-sm font-bold text-white shadow-md hover:bg-eco-700 disabled:opacity-60"
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle2 className="h-4 w-4" />
            )}
            <span>บันทึกพันธสัญญา (Behavior Commitment)</span>
          </button>
        </div>
      </form>
    </div>
  );
};

