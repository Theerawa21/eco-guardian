import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  CheckCircle2,
  Droplets,
  Info,
  Loader2,
  Recycle,
  Zap,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useStudentEcoState } from '../../hooks/useStudentEcoState';
import {
  ElectricityReportFormValues,
  electricityReportSchema,
  WasteReportFormValues,
  wasteReportSchema,
  WaterReportFormValues,
  waterReportSchema,
} from '../../schemas';
import { THAI_MONTHS } from '../../constants';
import {
  submitElectricityReport,
  submitWasteReport,
  submitWaterReport,
} from '../../services/firestore/ecoDataService';
import { ResourceTrendLineChart } from '../../components/charts/EcoCharts';
import { EvidenceUploadField } from '../../components/forms/EvidenceUploadField';
import {
  FeedbackBanner,
  LoadingState,
  UtilityPrivacyNotice,
} from '../../components/ui/StateViews';
import { getHomeEcoTrendStatement } from '../../utils';

export const HomeEcoReportPage: React.FC = () => {
  const { user } = useAuth();
  const state = useStudentEcoState(user?.uid);

  const [activeTab, setActiveTab] = useState<'dashboard' | 'waste' | 'electricity' | 'water'>(
    'dashboard'
  );
  const [wasteEvUrl, setWasteEvUrl] = useState<string | null>(null);
  const [elecEvUrl, setElecEvUrl] = useState<string | null>(null);
  const [waterEvUrl, setWaterEvUrl] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const today = new Date().toISOString().slice(0, 10);

  const wasteForm = useForm<WasteReportFormValues>({
    resolver: zodResolver(wasteReportSchema),
    defaultValues: {
      recordDate: today,
      generalWasteKg: 1.5,
      recyclableWasteKg: 2.0,
      organicWasteKg: 2.0,
      plasticWasteKg: 0.5,
      otherWasteKg: 0,
      note: '',
    },
  });

  const elecForm = useForm<ElectricityReportFormValues>({
    resolver: zodResolver(electricityReportSchema),
    defaultValues: {
      billingMonth: 10,
      billingYear: 2569,
      electricityKwh: 205,
      householdMembers: 4,
      recordDate: today,
      note: '',
    },
  });

  const waterForm = useForm<WaterReportFormValues>({
    resolver: zodResolver(waterReportSchema),
    defaultValues: {
      billingMonth: 10,
      billingYear: 2569,
      waterUnits: 15,
      householdMembers: 4,
      recordDate: today,
      note: '',
    },
  });

  if (state.loading) {
    return <LoadingState message="กำลังโหลดรายงานข้อมูลสิ่งแวดล้อมของครัวเรือน (Home Eco Report)..." />;
  }

  const wasteBaseline = state.wasteRecords.find((w) => w.isBaseline) || null;
  const latestWaste =
    state.wasteRecords.filter((w) => !w.isBaseline).slice(-1)[0] || wasteBaseline;

  const elecBaseline = state.electricityRecords.find((e) => e.isBaseline) || null;
  const latestElec =
    state.electricityRecords.filter((e) => !e.isBaseline).slice(-1)[0] || elecBaseline;

  const waterBaseline = state.waterRecords.find((w) => w.isBaseline) || null;
  const latestWater =
    state.waterRecords.filter((w) => !w.isBaseline).slice(-1)[0] || waterBaseline;

  const handleWasteSubmit = async (values: WasteReportFormValues) => {
    if (!user) return;
    setFeedback(null);
    try {
      await submitWasteReport({
        userId: user.uid,
        ...values,
        evidenceUrl: wasteEvUrl,
        demo: user.demo,
      });
      setWasteEvUrl(null);
      await state.refresh();
      setActiveTab('dashboard');
      setFeedback({
        type: 'success',
        message: 'บันทึกรายงานข้อมูลขยะครัวเรือน (Waste Report) สำเร็จ!',
      });
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err?.message || 'ไม่สามารถบันทึกรายงานขยะได้',
      });
    }
  };

  const handleElecSubmit = async (values: ElectricityReportFormValues) => {
    if (!user) return;
    setFeedback(null);
    try {
      await submitElectricityReport({
        userId: user.uid,
        ...values,
        evidenceUrl: elecEvUrl,
        demo: user.demo,
      });
      setElecEvUrl(null);
      await state.refresh();
      setActiveTab('dashboard');
      setFeedback({
        type: 'success',
        message: 'บันทึกรายงานการใช้ไฟฟ้าครัวเรือน (Electricity Report) สำเร็จ!',
      });
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err?.message || 'ไม่สามารถบันทึกรายงานไฟฟ้าได้',
      });
    }
  };

  const handleWaterSubmit = async (values: WaterReportFormValues) => {
    if (!user) return;
    setFeedback(null);
    try {
      await submitWaterReport({
        userId: user.uid,
        ...values,
        evidenceUrl: waterEvUrl,
        demo: user.demo,
      });
      setWaterEvUrl(null);
      await state.refresh();
      setActiveTab('dashboard');
      setFeedback({
        type: 'success',
        message: 'บันทึกรายงานการใช้น้ำประปาครัวเรือน (Water Report) สำเร็จ!',
      });
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err?.message || 'ไม่สามารถบันทึกรายงานน้ำประปาได้',
      });
    }
  };

  const wasteChartData = state.wasteRecords.map((w) => ({
    label: w.isBaseline ? `Baseline (${w.recordDate})` : w.recordDate,
    value: w.totalWaste,
    baseline: wasteBaseline?.totalWaste,
  }));

  const elecChartData = state.electricityRecords.map((e) => ({
    label: `${e.isBaseline ? 'Baseline ' : ''}${e.billingMonth}/${e.billingYear}`,
    value: e.electricityKwh,
    baseline: elecBaseline?.electricityKwh,
  }));

  const waterChartData = state.waterRecords.map((w) => ({
    label: `${w.isBaseline ? 'Baseline ' : ''}${w.billingMonth}/${w.billingYear}`,
    value: w.waterUnits,
    baseline: waterBaseline?.waterUnits,
  }));

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-eco-200 bg-white p-6 shadow-xs">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-xl font-extrabold text-slate-900">
              รายงานข้อมูลสิ่งแวดล้อมจากครัวเรือน (Home Eco Report & Dashboard)
            </h1>
            <p className="text-xs text-slate-600">
              ติดตามข้อมูลขยะ ไฟฟ้า และน้ำประปาของบ้าน เปรียบเทียบกับค่าพื้นฐาน (Baseline) ตามหลักวิชาการ
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {(
              [
                { key: 'dashboard', label: 'แดชบอร์ดแนวโน้ม' },
                { key: 'waste', label: '+ บันทึกขยะ' },
                { key: 'electricity', label: '+ บันทึกไฟฟ้า' },
                { key: 'water', label: '+ บันทึกน้ำประปา' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`rounded-xl px-3.5 py-2 text-xs font-bold transition ${
                  activeTab === tab.key
                    ? 'bg-eco-600 text-white shadow-xs'
                    : 'border border-slate-200 bg-slate-50 text-slate-700 hover:bg-eco-50'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Section 24 & 65 Important Data Rule Notice */}
      <div className="rounded-2xl border border-sky-200 bg-sky-50/80 p-4 text-xs text-sky-950 flex items-start gap-2.5">
        <Info className="mt-0.5 h-5 w-5 shrink-0 text-sky-600" />
        <div>
          <p className="font-bold">หลักการแปรผลข้อมูลครัวเรือนตามหลักวิชาการ (Data Interpretation Rule):</p>
          <p className="mt-0.5">
            ข้อมูลการใช้ไฟฟ้า น้ำ และขยะของครัวเรือนได้รับผลจากหลายปัจจัย (เช่น สภาพอากาศ วันหยุด และจำนวนสมาชิก)
            ระบบจึงแสดงผลเป็น <strong>“แนวโน้มลดลง”</strong>, <strong>“แนวโน้มเพิ่มขึ้น”</strong> หรือ{' '}
            <strong>“ไม่มีการเปลี่ยนแปลงชัดเจน”</strong> ในช่วงการเข้าร่วมกิจกรรมเพื่อใช้ประกอบการเรียนรู้และวางแผนร่วมกับครอบครัว
          </p>
        </div>
      </div>

      {feedback && (
        <FeedbackBanner
          type={feedback.type}
          message={feedback.message}
          onClose={() => setFeedback(null)}
        />
      )}

      {/* HOME ECO DASHBOARD TAB (Section 25) */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            {/* Waste Card */}
            <div className="rounded-2xl border border-eco-200 bg-white p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 text-sm font-bold text-eco-900">
                  <Recycle className="h-4 w-4 text-eco-600" />
                  ขยะครัวเรือน (Waste)
                </span>
                <span className="rounded-full bg-eco-100 px-2.5 py-0.5 text-xs font-bold text-eco-800">
                  {
                    getHomeEcoTrendStatement(
                      'waste',
                      latestWaste?.trend,
                      Boolean(wasteBaseline)
                    ).shortBadge
                  }
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 rounded-xl bg-slate-50 p-3 text-xs">
                <div>
                  <span className="text-slate-500">ตัวเลขล่าสุด</span>
                  <p className="text-lg font-extrabold text-slate-900">
                    {latestWaste ? `${latestWaste.totalWaste} กก.` : '-'}
                  </p>
                </div>
                <div>
                  <span className="text-slate-500">Baseline</span>
                  <p className="text-lg font-extrabold text-slate-700">
                    {wasteBaseline ? `${wasteBaseline.totalWaste} กก.` : 'ไม่มี Baseline'}
                  </p>
                </div>
                <div>
                  <span className="text-slate-500">ผลต่างที่ลดลง</span>
                  <p className="font-bold text-eco-700">
                    {latestWaste?.wasteReduction !== null &&
                    latestWaste?.wasteReduction !== undefined
                      ? `${latestWaste.wasteReduction} กก.`
                      : 'รอเปรียบเทียบ'}
                  </p>
                </div>
                <div>
                  <span className="text-slate-500">เปลี่ยนแปลง (%)</span>
                  <p className="font-bold text-eco-700">
                    {latestWaste?.wasteReductionPercentage !== null &&
                    latestWaste?.wasteReductionPercentage !== undefined
                      ? `${latestWaste.wasteReductionPercentage}%`
                      : '-'}
                  </p>
                </div>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                {
                  getHomeEcoTrendStatement(
                    'waste',
                    latestWaste?.trend,
                    Boolean(wasteBaseline)
                  ).statement
                }
              </p>
            </div>

            {/* Electricity Card */}
            <div className="rounded-2xl border border-amber-200 bg-white p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 text-sm font-bold text-amber-900">
                  <Zap className="h-4 w-4 text-amber-600" />
                  การใช้ไฟฟ้า (Electricity)
                </span>
                <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-900">
                  {
                    getHomeEcoTrendStatement(
                      'electricity',
                      latestElec?.trend,
                      Boolean(elecBaseline)
                    ).shortBadge
                  }
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 rounded-xl bg-slate-50 p-3 text-xs">
                <div>
                  <span className="text-slate-500">kWh ล่าสุด</span>
                  <p className="text-lg font-extrabold text-slate-900">
                    {latestElec ? `${latestElec.electricityKwh} kWh` : '-'}
                  </p>
                </div>
                <div>
                  <span className="text-slate-500">Baseline</span>
                  <p className="text-lg font-extrabold text-slate-700">
                    {elecBaseline ? `${elecBaseline.electricityKwh} kWh` : 'ไม่มี Baseline'}
                  </p>
                </div>
                <div>
                  <span className="text-slate-500">ผลต่าง (kWh)</span>
                  <p className="font-bold text-amber-800">
                    {latestElec?.differenceKwh !== null &&
                    latestElec?.differenceKwh !== undefined
                      ? `${latestElec.differenceKwh} kWh`
                      : 'รอเปรียบเทียบ'}
                  </p>
                </div>
                <div>
                  <span className="text-slate-500">เปลี่ยนแปลง (%)</span>
                  <p className="font-bold text-amber-800">
                    {latestElec?.changePercentage !== null &&
                    latestElec?.changePercentage !== undefined
                      ? `${latestElec.changePercentage}%`
                      : '-'}
                  </p>
                </div>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                {
                  getHomeEcoTrendStatement(
                    'electricity',
                    latestElec?.trend,
                    Boolean(elecBaseline)
                  ).statement
                }
              </p>
            </div>

            {/* Water Card */}
            <div className="rounded-2xl border border-sky-200 bg-white p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 text-sm font-bold text-sky-900">
                  <Droplets className="h-4 w-4 text-sky-600" />
                  การใช้น้ำประปา (Water)
                </span>
                <span className="rounded-full bg-sky-100 px-2.5 py-0.5 text-xs font-bold text-sky-900">
                  {
                    getHomeEcoTrendStatement(
                      'water',
                      latestWater?.trend,
                      Boolean(waterBaseline)
                    ).shortBadge
                  }
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 rounded-xl bg-slate-50 p-3 text-xs">
                <div>
                  <span className="text-slate-500">หน่วยล่าสุด</span>
                  <p className="text-lg font-extrabold text-slate-900">
                    {latestWater ? `${latestWater.waterUnits} หน่วย` : '-'}
                  </p>
                </div>
                <div>
                  <span className="text-slate-500">Baseline</span>
                  <p className="text-lg font-extrabold text-slate-700">
                    {waterBaseline ? `${waterBaseline.waterUnits} หน่วย` : 'ไม่มี Baseline'}
                  </p>
                </div>
                <div>
                  <span className="text-slate-500">ผลต่าง (หน่วย)</span>
                  <p className="font-bold text-sky-800">
                    {latestWater?.difference !== null &&
                    latestWater?.difference !== undefined
                      ? `${latestWater.difference} หน่วย`
                      : 'รอเปรียบเทียบ'}
                  </p>
                </div>
                <div>
                  <span className="text-slate-500">เปลี่ยนแปลง (%)</span>
                  <p className="font-bold text-sky-800">
                    {latestWater?.changePercentage !== null &&
                    latestWater?.changePercentage !== undefined
                      ? `${latestWater.changePercentage}%`
                      : '-'}
                  </p>
                </div>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                {
                  getHomeEcoTrendStatement(
                    'water',
                    latestWater?.trend,
                    Boolean(waterBaseline)
                  ).statement
                }
              </p>
            </div>
          </div>

          {/* Trend Charts Over Time */}
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="rounded-2xl border border-eco-100 bg-white p-5 shadow-xs">
              <h3 className="text-sm font-bold text-slate-800 mb-3">
                กราฟแนวโน้มขยะครัวเรือนตามเวลา (กก.)
              </h3>
              <ResourceTrendLineChart
                data={wasteChartData}
                unitLabel="กก."
                color="#16a34a"
              />
            </div>

            <div className="rounded-2xl border border-eco-100 bg-white p-5 shadow-xs">
              <h3 className="text-sm font-bold text-slate-800 mb-3">
                กราฟแนวโน้มการใช้ไฟฟ้าตามเวลา (kWh)
              </h3>
              <ResourceTrendLineChart
                data={elecChartData}
                unitLabel="kWh"
                color="#d97706"
              />
            </div>

            <div className="rounded-2xl border border-eco-100 bg-white p-5 shadow-xs">
              <h3 className="text-sm font-bold text-slate-800 mb-3">
                กราฟแนวโน้มการใช้น้ำประปาตามเวลา (หน่วย)
              </h3>
              <ResourceTrendLineChart
                data={waterChartData}
                unitLabel="หน่วย"
                color="#0284c7"
              />
            </div>
          </div>
        </div>
      )}

      {/* WASTE REPORT FORM (Section 21) */}
      {activeTab === 'waste' && (
        <div className="rounded-2xl border border-eco-100 bg-white p-6 shadow-xs space-y-4">
          <h2 className="text-base font-bold text-slate-900">
            บันทึกข้อมูลขยะครัวเรือนรอบใหม่ (Waste Report)
          </h2>
          {!wasteBaseline && (
            <p className="rounded-xl bg-amber-50 p-3 text-xs font-medium text-amber-900">
              หมายเหตุ: ยังไม่มีข้อมูล Baseline ขยะ ระบบจะคำนวณเฉพาะปริมาณขยะรวมและสัดส่วนรีไซเคิลโดยไม่คำนวณค่า Reduction
            </p>
          )}
          <form
            onSubmit={wasteForm.handleSubmit(handleWasteSubmit)}
            className="space-y-4"
            noValidate
          >
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="block text-xs font-bold text-slate-700">
                  วันที่บันทึกข้อมูล *
                </label>
                <input
                  type="date"
                  {...wasteForm.register('recordDate')}
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700">
                  ขยะทั่วไป (กก.) *
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  {...wasteForm.register('generalWasteKg')}
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700">
                  ขยะรีไซเคิล (กก.) *
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  {...wasteForm.register('recyclableWasteKg')}
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
                  {...wasteForm.register('organicWasteKg')}
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
                  {...wasteForm.register('plasticWasteKg')}
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700">
                  ขยะอื่นๆ (กก.) *
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  {...wasteForm.register('otherWasteKg')}
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700">
                บันทึกเพิ่มเติม (Note)
              </label>
              <input
                type="text"
                {...wasteForm.register('note')}
                placeholder="เช่น สัปดาห์นี้แยกขวดพลาสติกและทำปุ๋ยหมักเศษอาหาร"
                className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
              />
            </div>

            {user && (
              <EvidenceUploadField
                uid={user.uid}
                value={wasteEvUrl}
                onChange={setWasteEvUrl}
              />
            )}

            <button
              type="submit"
              disabled={wasteForm.formState.isSubmitting}
              className="inline-flex items-center gap-2 rounded-xl bg-eco-600 px-6 py-3 text-sm font-bold text-white hover:bg-eco-700"
            >
              {wasteForm.formState.isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="h-4 w-4" />
              )}
              <span>บันทึกรายงานขยะ (Waste Report)</span>
            </button>
          </form>
        </div>
      )}

      {/* ELECTRICITY REPORT FORM (Section 22) */}
      {activeTab === 'electricity' && (
        <div className="rounded-2xl border border-eco-100 bg-white p-6 shadow-xs space-y-4">
          <h2 className="text-base font-bold text-slate-900">
            บันทึกรายงานการใช้ไฟฟ้าครัวเรือน (Electricity Report)
          </h2>
          <UtilityPrivacyNotice />
          <form
            onSubmit={elecForm.handleSubmit(handleElecSubmit)}
            className="space-y-4"
            noValidate
          >
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              <div>
                <label className="block text-xs font-bold text-slate-700">
                  เดือนรอบบิล *
                </label>
                <select
                  {...elecForm.register('billingMonth')}
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
                  {...elecForm.register('billingYear')}
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700">
                  หน่วยไฟฟ้า (kWh) *
                </label>
                <input
                  type="number"
                  min="0"
                  {...elecForm.register('electricityKwh')}
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700">
                  จำนวนสมาชิกบ้าน (คน) *
                </label>
                <input
                  type="number"
                  min="1"
                  {...elecForm.register('householdMembers')}
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700">
                  วันที่บันทึก *
                </label>
                <input
                  type="date"
                  {...elecForm.register('recordDate')}
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700">
                บันทึกวิธีการประหยัดไฟหรือปัจจัยในเดือนนี้ (Note)
              </label>
              <input
                type="text"
                {...elecForm.register('note')}
                placeholder="เช่น ปิดไฟดวงที่ไม่ใช้และตั้งแอร์ 26 องศาเซลเซียส"
                className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
              />
            </div>

            {user && (
              <EvidenceUploadField
                uid={user.uid}
                label="แนบภาพหลักฐานหน่วยไฟฟ้า (ไม่บังคับ - ต้องปิดบังชื่อ ที่อยู่ และ QR/Barcode)"
                value={elecEvUrl}
                onChange={setElecEvUrl}
              />
            )}

            <button
              type="submit"
              disabled={elecForm.formState.isSubmitting}
              className="inline-flex items-center gap-2 rounded-xl bg-eco-600 px-6 py-3 text-sm font-bold text-white hover:bg-eco-700"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>บันทึกรายงานไฟฟ้า (Electricity Report)</span>
            </button>
          </form>
        </div>
      )}

      {/* WATER REPORT FORM (Section 23) */}
      {activeTab === 'water' && (
        <div className="rounded-2xl border border-eco-100 bg-white p-6 shadow-xs space-y-4">
          <h2 className="text-base font-bold text-slate-900">
            บันทึกรายงานการใช้น้ำประปาครัวเรือน (Water Report)
          </h2>
          <UtilityPrivacyNotice />
          <form
            onSubmit={waterForm.handleSubmit(handleWaterSubmit)}
            className="space-y-4"
            noValidate
          >
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              <div>
                <label className="block text-xs font-bold text-slate-700">
                  เดือนรอบบิล *
                </label>
                <select
                  {...waterForm.register('billingMonth')}
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
                  {...waterForm.register('billingYear')}
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
                  {...waterForm.register('waterUnits')}
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700">
                  จำนวนสมาชิกบ้าน (คน) *
                </label>
                <input
                  type="number"
                  min="1"
                  {...waterForm.register('householdMembers')}
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700">
                  วันที่บันทึก *
                </label>
                <input
                  type="date"
                  {...waterForm.register('recordDate')}
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700">
                บันทึกวิธีการประหยัดน้ำในเดือนนี้ (Note)
              </label>
              <input
                type="text"
                {...waterForm.register('note')}
                placeholder="เช่น ปิดก๊อกน้ำขณะแปรงฟันและใช้น้ำซักผ้ารดน้ำต้นไม้"
                className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
              />
            </div>

            {user && (
              <EvidenceUploadField
                uid={user.uid}
                label="แนบภาพหลักฐานหน่วยน้ำประปา (ไม่บังคับ - ต้องปิดบังชื่อ ที่อยู่ และ QR/Barcode)"
                value={waterEvUrl}
                onChange={setWaterEvUrl}
              />
            )}

            <button
              type="submit"
              disabled={waterForm.formState.isSubmitting}
              className="inline-flex items-center gap-2 rounded-xl bg-eco-600 px-6 py-3 text-sm font-bold text-white hover:bg-eco-700"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>บันทึกรายงานน้ำประปา (Water Report)</span>
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

