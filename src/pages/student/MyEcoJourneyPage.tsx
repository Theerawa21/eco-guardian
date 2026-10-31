import React from 'react';
import {
  Award,
  CheckCircle2,
  ClipboardCheck,
  Droplets,
  Flame,
  Recycle,
  ShieldCheck,
  Sparkles,
  Target,
  UserCheck,
  Zap,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useStudentEcoState } from '../../hooks/useStudentEcoState';
import { BEHAVIOR_DOMAINS } from '../../constants';
import { BehaviorRadarChart } from '../../components/charts/EcoCharts';
import { ErrorState, LoadingState } from '../../components/ui/StateViews';
import { getHomeEcoTrendStatement } from '../../utils';

/**
 * Section 36 & 37: BEHAVIOR EVIDENCE MODEL & MY ECO JOURNEY
 * ระบบประเมินพฤติกรรมจาก 4 แหล่ง:
 * 1. Self-Assessment
 * 2. Teacher Observation
 * 3. Eco Action Record
 * 4. Home Eco Data
 * ห้ามใช้ Self-Assessment เพียงรายการเดียวในการสรุป Behavioral Change
 */
export const MyEcoJourneyPage: React.FC = () => {
  const { user } = useAuth();
  const state = useStudentEcoState(user?.uid);

  if (state.loading) {
    return <LoadingState message="กำลังประมวลผลแฟ้มสะสมผลงาน My Eco Journey จาก 4 แหล่งหลักฐาน..." />;
  }

  if (state.error) {
    return <ErrorState message={state.error} onRetry={state.refresh} />;
  }

  const latestObs =
    state.teacherObservations.find((o) => o.assessmentPeriod === 'post') ||
    state.teacherObservations[0] ||
    null;

  const radarData = BEHAVIOR_DOMAINS.map((d) => ({
    domain: d.shortTitle,
    preScore: state.preAssessment?.domainScores?.[d.key] || 0,
    postScore: state.postAssessment?.domainScores?.[d.key] || 0,
    teacherScore: latestObs ? (latestObs.scores[d.key] || 0) * 2 : 0, // normalized to /10 scale
    fullMark: 10,
  }));

  const approvedActionsCount = state.actionRecords.filter(
    (r) => r.teacherVerification === 'approved'
  ).length;

  const wasteBaseline = state.wasteRecords.find((w) => w.isBaseline);
  const latestWaste = state.wasteRecords.filter((w) => !w.isBaseline).slice(-1)[0];

  const elecBaseline = state.electricityRecords.find((e) => e.isBaseline);
  const latestElec = state.electricityRecords.filter((e) => !e.isBaseline).slice(-1)[0];

  const waterBaseline = state.waterRecords.find((w) => w.isBaseline);
  const latestWater = state.waterRecords.filter((w) => !w.isBaseline).slice(-1)[0];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <section className="rounded-3xl border border-eco-200 bg-gradient-to-r from-eco-900 via-eco-800 to-sky-900 p-6 text-white shadow-lg">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-bold">
              <Sparkles className="h-3.5 w-3.5 text-amber-300" />
              4-Source Behavior Evidence Portfolio
            </span>
            <h1 className="mt-2 text-2xl font-extrabold sm:text-3xl">
              My Eco Journey — เส้นทางผู้พิทักษ์สิ่งแวดล้อมของฉัน
            </h1>
            <p className="mt-1 text-xs text-eco-100">
              {user?.displayName} • ชั้น {user?.gradeLevel}/{user?.room} • ระดับปัจจุบัน:{' '}
              {state.currentLevel?.titleEn} ({state.currentLevel?.titleTh})
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="rounded-2xl bg-white/10 px-4 py-2.5">
              <span className="block text-[11px] text-eco-100">Learning Points</span>
              <span className="text-xl font-extrabold">{state.learningPoints}</span>
            </div>
            <div className="rounded-2xl bg-white/10 px-4 py-2.5">
              <span className="block text-[11px] text-eco-100">Action Points</span>
              <span className="text-xl font-extrabold">{state.actionPoints}</span>
            </div>
            <div className="rounded-2xl bg-amber-400/20 px-4 py-2.5">
              <span className="block text-[11px] text-amber-200">Eco Streak</span>
              <span className="text-xl font-extrabold text-amber-300">
                {state.ecoStreak} วัน
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 4-Source Behavior Evidence Model Cards (Section 36) */}
      <section className="rounded-2xl border border-eco-200 bg-white p-6 shadow-xs space-y-4">
        <div>
          <h2 className="text-base font-bold text-slate-900">
            สรุปหลักฐานการพัฒนาพฤติกรรมจาก 4 แหล่งข้อมูล (4-Source Behavior Evidence Model)
          </h2>
          <p className="text-xs text-slate-500">
            การประเมินผลพฤติกรรมในระบบ ECO GUARDIAN ใช้หลักฐานร่วมกันทั้ง 4 แหล่ง ไม่สรุปจากการประเมินตนเองเพียงด้านเดียว
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Source 1: Self-Assessment */}
          <div className="rounded-2xl border border-sky-200 bg-sky-50/50 p-4 space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-bold text-sky-900">
              <ClipboardCheck className="h-4 w-4 text-sky-600" />
              <span>แหล่งที่ 1: Self-Assessment</span>
            </div>
            <p className="text-lg font-extrabold text-slate-900">
              Pre: {state.preAssessment ? `${state.preAssessment.totalScore}/85` : 'รอทำ'} →
              Post: {state.postAssessment ? `${state.postAssessment.totalScore}/85` : 'รอทำ'}
            </p>
            <p className="text-xs text-slate-600">
              Follow-up:{' '}
              {state.followUp
                ? `ยังปฏิบัติ (${state.followUp.frequency})`
                : 'รอติดตามผล'}
            </p>
          </div>

          {/* Source 2: Teacher Observation */}
          <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-4 space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-900">
              <UserCheck className="h-4 w-4 text-amber-600" />
              <span>แหล่งที่ 2: Teacher Observation</span>
            </div>
            <p className="text-lg font-extrabold text-slate-900">
              {latestObs ? `${latestObs.totalScore}/25 คะแนน` : 'รอครูบันทึกสังเกต'}
            </p>
            <p className="text-xs text-slate-600 truncate">
              {latestObs?.comment || 'ประเมินพฤติกรรม 5 ด้านโดยครูที่ปรึกษา'}
            </p>
          </div>

          {/* Source 3: Eco Action Record */}
          <div className="rounded-2xl border border-eco-200 bg-eco-50/50 p-4 space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-bold text-eco-900">
              <Flame className="h-4 w-4 text-eco-600" />
              <span>แหล่งที่ 3: Eco Action Record</span>
            </div>
            <p className="text-lg font-extrabold text-slate-900">
              บันทึก {state.actionRecords.length} ครั้ง (ครูรับรอง {approvedActionsCount} ครั้ง)
            </p>
            <p className="text-xs text-slate-600">
              ทำต่อเนื่องสูงสุด {state.ecoStreak} วัน
            </p>
          </div>

          {/* Source 4: Home Eco Data */}
          <div className="rounded-2xl border border-purple-200 bg-purple-50/50 p-4 space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-bold text-purple-900">
              <ShieldCheck className="h-4 w-4 text-purple-600" />
              <span>แหล่งที่ 4: Home Eco Data</span>
            </div>
            <p className="text-lg font-extrabold text-slate-900">
              ขยะ {state.wasteRecords.length} • ไฟ {state.electricityRecords.length} • น้ำ{' '}
              {state.waterRecords.length} รอบ
            </p>
            <p className="text-xs text-slate-600">
              {state.hasBaseline ? 'มีข้อมูล Baseline ครบถ้วน' : 'รอบันทึก Baseline'}
            </p>
          </div>
        </div>
      </section>

      {/* Radar Chart & Behavior Goal */}
      <section className="grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-7 rounded-2xl border border-eco-100 bg-white p-6 shadow-xs space-y-3">
          <h2 className="text-base font-bold text-slate-900">
            กราฟเรดาร์บูรณาการพฤติกรรม 5 ด้าน (Self Pre/Post vs Teacher Observation)
          </h2>
          <BehaviorRadarChart data={radarData} />
        </div>

        <div className="lg:col-span-5 rounded-2xl border border-eco-100 bg-white p-6 shadow-xs space-y-4">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Target className="h-5 w-5 text-eco-600" />
            เป้าหมายพฤติกรรมและผลการสังเกตจากครู
          </h2>

          {state.commitment && (
            <div className="rounded-xl border border-eco-200 bg-eco-50/60 p-4 space-y-1.5">
              <span className="text-xs font-bold text-eco-800">
                Behavior Goal ({state.commitment.category})
              </span>
              <p className="text-sm font-bold text-slate-900">
                “{state.commitment.what}”
              </p>
              <p className="text-xs text-slate-600">
                สถานที่: {state.commitment.where} | เวลา: {state.commitment.when}
              </p>
            </div>
          )}

          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase text-slate-500">
              บันทึกการสังเกตพฤติกรรมโดยครู (Teacher Observations)
            </h3>
            {state.teacherObservations.length === 0 ? (
              <p className="text-xs text-slate-500">ยังไม่มีข้อมูลการสังเกตจากครู</p>
            ) : (
              state.teacherObservations.map((obs) => (
                <div
                  key={obs.id}
                  className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs space-y-1"
                >
                  <div className="flex justify-between font-bold text-slate-800">
                    <span>ช่วงประเมิน: {obs.assessmentPeriod.toUpperCase()}</span>
                    <span>คะแนนรวม: {obs.totalScore}/25</span>
                  </div>
                  <p className="text-slate-600">“{obs.comment}”</p>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* Home Eco Trends Summary */}
      <section className="rounded-2xl border border-eco-100 bg-white p-6 shadow-xs space-y-4">
        <h2 className="text-base font-bold text-slate-900">
          สรุปแนวโน้มข้อมูลสิ่งแวดล้อมของครัวเรือน (Waste, Electricity, Water Trends)
        </h2>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-eco-100 bg-eco-50/40 p-4 space-y-1">
            <div className="flex items-center gap-2 text-sm font-bold text-eco-900">
              <Recycle className="h-4 w-4 text-eco-600" />
              <span>Waste Trend (แนวโน้มขยะ)</span>
            </div>
            <p className="text-xs text-slate-700 font-semibold">
              Baseline: {wasteBaseline ? `${wasteBaseline.totalWaste} กก.` : '-'} → ล่าสุด:{' '}
              {latestWaste ? `${latestWaste.totalWaste} กก.` : '-'}
            </p>
            <p className="text-xs text-slate-600">
              {
                getHomeEcoTrendStatement(
                  'waste',
                  latestWaste?.trend,
                  Boolean(wasteBaseline)
                ).statement
              }
            </p>
          </div>

          <div className="rounded-xl border border-amber-100 bg-amber-50/40 p-4 space-y-1">
            <div className="flex items-center gap-2 text-sm font-bold text-amber-900">
              <Zap className="h-4 w-4 text-amber-600" />
              <span>Electricity Trend (แนวโน้มไฟฟ้า)</span>
            </div>
            <p className="text-xs text-slate-700 font-semibold">
              Baseline: {elecBaseline ? `${elecBaseline.electricityKwh} kWh` : '-'} → ล่าสุด:{' '}
              {latestElec ? `${latestElec.electricityKwh} kWh` : '-'}
            </p>
            <p className="text-xs text-slate-600">
              {
                getHomeEcoTrendStatement(
                  'electricity',
                  latestElec?.trend,
                  Boolean(elecBaseline)
                ).statement
              }
            </p>
          </div>

          <div className="rounded-xl border border-sky-100 bg-sky-50/40 p-4 space-y-1">
            <div className="flex items-center gap-2 text-sm font-bold text-sky-900">
              <Droplets className="h-4 w-4 text-sky-600" />
              <span>Water Trend (แนวโน้มน้ำประปา)</span>
            </div>
            <p className="text-xs text-slate-700 font-semibold">
              Baseline: {waterBaseline ? `${waterBaseline.waterUnits} หน่วย` : '-'} → ล่าสุด:{' '}
              {latestWater ? `${latestWater.waterUnits} หน่วย` : '-'}
            </p>
            <p className="text-xs text-slate-600">
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
      </section>

      {/* Badges & Mission Progress */}
      <section className="rounded-2xl border border-eco-100 bg-white p-6 shadow-xs space-y-4">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <Award className="h-5 w-5 text-amber-500" />
          เหรียญเกียรติยศและประวัติคะแนนสะสม ({state.earnedBadges.length} เหรียญ)
        </h2>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
          {state.allBadges.map((b) => {
            const earned = state.earnedBadges.some((ub) => ub.badgeId === b.id);
            return (
              <div
                key={b.id}
                className={`rounded-2xl border p-3 text-center ${
                  earned
                    ? 'border-amber-300 bg-amber-50 text-slate-900'
                    : 'border-slate-100 bg-slate-50 text-slate-400 opacity-60'
                }`}
              >
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-amber-400/20 text-amber-600">
                  <Award className="h-5 w-5" />
                </div>
                <p className="mt-2 text-xs font-bold">{b.nameTh}</p>
                <p className="text-[10px]">{b.name}</p>
                {earned && (
                  <span className="mt-1 inline-flex items-center gap-0.5 text-[10px] font-bold text-eco-700">
                    <CheckCircle2 className="h-3 w-3" /> ได้รับแล้ว
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};

