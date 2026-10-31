import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  ArrowRight,
  CheckCircle2,
  Compass,
  Droplets,
  Loader2,
  Recycle,
  Zap,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { BaselineFormValues, baselineSchema } from '../../schemas';
import { THAI_MONTHS } from '../../constants';
import {
  getStudentElectricityRecords,
  getStudentWasteRecords,
  getStudentWaterRecords,
  saveHomeEcoBaseline,
} from '../../services/firestore/ecoDataService';
import { EvidenceUploadField } from '../../components/forms/EvidenceUploadField';
import {
  FeedbackBanner,
  LoadingState,
  UtilityPrivacyNotice,
} from '../../components/ui/StateViews';

export const HomeEcoBaselinePage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [hasSavedBaseline, setHasSavedBaseline] = useState(false);
  const [elecEvidenceUrl, setElecEvidenceUrl] = useState<string | null>(null);
  const [waterEvidenceUrl, setWaterEvidenceUrl] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const today = new Date().toISOString().slice(0, 10);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<BaselineFormValues>({
    resolver: zodResolver(baselineSchema),
    defaultValues: {
      wasteRecordDate: today,
      collectionPeriod: '7 วัน (ก่อนเริ่มภารกิจ)',
      wasteUnit: 'กิโลกรัม (kg)',
      generalWasteKg: 3.5,
      recyclableWasteKg: 1.5,
      organicWasteKg: 2.5,
      plasticWasteKg: 1.0,
      elecBillingMonth: 9,
      elecBillingYear: 2569,
      electricityKwh: 220,
      elecRecordDate: today,
      waterBillingMonth: 9,
      waterBillingYear: 2569,
      waterUnits: 16,
      waterRecordDate: today,
      householdMembers: 4,
    },
  });

  useEffect(() => {
    async function load() {
      if (!user) return;
      setLoading(true);
      try {
        const [wasteList, elecList, waterList] = await Promise.all([
          getStudentWasteRecords(user.uid),
          getStudentElectricityRecords(user.uid),
          getStudentWaterRecords(user.uid),
        ]);

        const wBase = wasteList.find((w) => w.isBaseline);
        const eBase = elecList.find((e) => e.isBaseline);
        const waBase = waterList.find((w) => w.isBaseline);

        if (wBase && eBase && waBase) {
          setHasSavedBaseline(true);
          setElecEvidenceUrl(eBase.evidenceUrl);
          setWaterEvidenceUrl(waBase.evidenceUrl);
          reset({
            wasteRecordDate: wBase.recordDate,
            collectionPeriod: wBase.collectionPeriod || '7 วัน (ก่อนเริ่มภารกิจ)',
            wasteUnit: wBase.unit || 'กิโลกรัม (kg)',
            generalWasteKg: wBase.generalWasteKg,
            recyclableWasteKg: wBase.recyclableWasteKg,
            organicWasteKg: wBase.organicWasteKg,
            plasticWasteKg: wBase.plasticWasteKg,
            elecBillingMonth: eBase.billingMonth,
            elecBillingYear: eBase.billingYear,
            electricityKwh: eBase.electricityKwh,
            elecRecordDate: eBase.recordDate,
            waterBillingMonth: waBase.billingMonth,
            waterBillingYear: waBase.billingYear,
            waterUnits: waBase.waterUnits,
            waterRecordDate: waBase.recordDate,
            householdMembers: eBase.householdMembers || 4,
          });
        }
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [user, reset]);

  const onSubmit = async (values: BaselineFormValues) => {
    if (!user) return;
    setFeedback(null);
    try {
      await saveHomeEcoBaseline({
        userId: user.uid,
        ...values,
        elecEvidenceUrl,
        waterEvidenceUrl,
        demo: user.demo,
      });
      setHasSavedBaseline(true);
      setFeedback({
        type: 'success',
        message:
          'บันทึกข้อมูลพื้นฐานของบ้าน (Home Eco Baseline) สำเร็จ! คุณพร้อมเริ่มต้นภารกิจ Mission Map แล้ว',
      });
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err?.message || 'ไม่สามารถบันทึกข้อมูลพื้นฐานได้',
      });
    }
  };

  if (loading) {
    return <LoadingState message="กำลังโหลดข้อมูลพื้นฐานของครัวเรือน (Baseline)..." />;
  }

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-eco-200 bg-white p-6 shadow-xs">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex items-start gap-3.5">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-sky-100 text-sky-700">
              <Compass className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-slate-900">
                บันทึกข้อมูลพื้นฐานของบ้าน (Home Eco Baseline)
              </h1>
              <p className="text-xs text-slate-600">
                เก็บข้อมูลตั้งต้นด้านขยะ ไฟฟ้า และน้ำของครัวเรือนก่อนเริ่มภารกิจ เพื่อใช้เปรียบเทียบแนวโน้มการเปลี่ยนแปลงตามจริง
              </p>
            </div>
          </div>

          {hasSavedBaseline && (
            <button
              type="button"
              onClick={() => navigate('/student/missions')}
              className="inline-flex items-center gap-2 rounded-xl bg-eco-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-eco-700"
            >
              <span>เข้าสู่แผนที่ภารกิจ (Mission Map)</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      <UtilityPrivacyNotice />

      {feedback && (
        <FeedbackBanner
          type={feedback.type}
          message={feedback.message}
          onClose={() => setFeedback(null)}
        />
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
        {/* 1. Waste Baseline */}
        <section className="rounded-2xl border border-eco-100 bg-white p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
            <Recycle className="h-5 w-5 text-eco-600" />
            <div>
              <h2 className="text-base font-bold text-slate-900">
                1. ข้อมูลพื้นฐานด้านขยะครัวเรือน (Waste Baseline)
              </h2>
              <p className="text-xs text-slate-500">
                สำรวจและชั่งน้ำหนักหรือประมาณการปริมาณขยะในบ้านตามช่วงเวลาที่เก็บข้อมูล
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-xs font-bold text-slate-700">
                วันที่บันทึกข้อมูล *
              </label>
              <input
                type="date"
                {...register('wasteRecordDate')}
                className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700">
                ช่วงเวลาที่เก็บข้อมูล *
              </label>
              <input
                type="text"
                {...register('collectionPeriod')}
                placeholder="เช่น 7 วัน หรือ 1 สัปดาห์"
                className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700">
                หน่วยวัด *
              </label>
              <input
                type="text"
                {...register('wasteUnit')}
                className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="block text-xs font-bold text-slate-700">
                ขยะทั่วไป (กก.) *
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                {...register('generalWasteKg')}
                className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
              />
              {errors.generalWasteKg && (
                <p className="mt-1 text-xs text-red-600">{errors.generalWasteKg.message}</p>
              )}
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700">
                ขยะรีไซเคิล (กก.) *
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                {...register('recyclableWasteKg')}
                className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700">
                ขยะอินทรีย์/เศษอาหาร (กก.) *
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                {...register('organicWasteKg')}
                className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700">
                ขยะพลาสติก (กก.) *
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                {...register('plasticWasteKg')}
                className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
          </div>
        </section>

        {/* 2. Electricity Baseline */}
        <section className="rounded-2xl border border-eco-100 bg-white p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
            <Zap className="h-5 w-5 text-amber-500" />
            <div>
              <h2 className="text-base font-bold text-slate-900">
                2. ข้อมูลพื้นฐานการใช้ไฟฟ้า (Electricity Baseline)
              </h2>
              <p className="text-xs text-slate-500">
                ดูจำนวนหน่วยไฟฟ้า (kWh) จากบิลค่าไฟเดือนล่าสุด (ไม่บังคับกรอกค่าใช้จ่ายเป็นเงินบาท)
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="block text-xs font-bold text-slate-700">
                เดือนของรอบบิล *
              </label>
              <select
                {...register('elecBillingMonth')}
                className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
              >
                {THAI_MONTHS.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700">
                ปี พ.ศ. *
              </label>
              <input
                type="number"
                {...register('elecBillingYear')}
                className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700">
                จำนวนหน่วยไฟฟ้า (kWh) *
              </label>
              <input
                type="number"
                step="1"
                min="0"
                {...register('electricityKwh')}
                className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
              />
              {errors.electricityKwh && (
                <p className="mt-1 text-xs text-red-600">{errors.electricityKwh.message}</p>
              )}
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700">
                วันที่บันทึกข้อมูล *
              </label>
              <input
                type="date"
                {...register('elecRecordDate')}
                className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
          </div>

          {user && (
            <EvidenceUploadField
              uid={user.uid}
              label="ภาพประกอบหน่วยไฟฟ้า (ไม่บังคับ - กรุณาปิดบังชื่อ ที่อยู่ และ QR/Barcode ก่อนอัปโหลด)"
              value={elecEvidenceUrl}
              onChange={setElecEvidenceUrl}
            />
          )}
        </section>

        {/* 3. Water Baseline */}
        <section className="rounded-2xl border border-eco-100 bg-white p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
            <Droplets className="h-5 w-5 text-sky-600" />
            <div>
              <h2 className="text-base font-bold text-slate-900">
                3. ข้อมูลพื้นฐานการใช้น้ำประปา (Water Baseline)
              </h2>
              <p className="text-xs text-slate-500">
                ดูจำนวนหน่วยน้ำประปา (ยูนิต/ลบ.ม.) จากบิลค่าน้ำเดือนล่าสุด (ไม่บังคับกรอกค่าใช้จ่าย)
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <div>
              <label className="block text-xs font-bold text-slate-700">
                เดือนของรอบบิล *
              </label>
              <select
                {...register('waterBillingMonth')}
                className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
              >
                {THAI_MONTHS.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700">
                ปี พ.ศ. *
              </label>
              <input
                type="number"
                {...register('waterBillingYear')}
                className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700">
                หน่วยน้ำประปา (ยูนิต) *
              </label>
              <input
                type="number"
                step="0.5"
                min="0"
                {...register('waterUnits')}
                className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
              />
              {errors.waterUnits && (
                <p className="mt-1 text-xs text-red-600">{errors.waterUnits.message}</p>
              )}
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700">
                สมาชิกในบ้าน (คน) *
              </label>
              <input
                type="number"
                min="1"
                {...register('householdMembers')}
                className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700">
                วันที่บันทึกข้อมูล *
              </label>
              <input
                type="date"
                {...register('waterRecordDate')}
                className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
          </div>

          {user && (
            <EvidenceUploadField
              uid={user.uid}
              label="ภาพประกอบหน่วยน้ำประปา (ไม่บังคับ - กรุณาปิดบังชื่อ ที่อยู่ และ QR/Barcode ก่อนอัปโหลด)"
              value={waterEvidenceUrl}
              onChange={setWaterEvidenceUrl}
            />
          )}
        </section>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 rounded-2xl bg-eco-600 px-8 py-3.5 text-sm font-bold text-white shadow-md hover:bg-eco-700 disabled:opacity-60"
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle2 className="h-4 w-4" />
            )}
            <span>บันทึกข้อมูลพื้นฐาน (Home Eco Baseline)</span>
          </button>
        </div>
      </form>
    </div>
  );
};

