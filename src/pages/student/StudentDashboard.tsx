import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Award,
  BookOpen,
  CheckCircle2,
  Compass,
  Droplets,
  Flame,
  Recycle,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingDown,
  TrendingUp,
  Minus,
  Zap,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useStudentEcoState } from '../../hooks/useStudentEcoState';
import { EcoProgressChart } from '../../components/charts/EcoCharts';
import { ErrorState, LoadingState } from '../../components/ui/StateViews';
import { getHomeEcoTrendStatement } from '../../utils';

export const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const state = useStudentEcoState(user?.uid);

  if (state.loading) {
    return <LoadingState message="กำลังโหลดแดชบอร์ดผู้พิทักษ์สิ่งแวดล้อมของคุณ..." />;
  }

  if (state.error) {
    return <ErrorState message={state.error} onRetry={state.refresh} />;
  }

  const completedMissions = state.missionProgress.filter(
    (m) => m.status === 'completed'
  ).length;
  const totalMissions = state.missions.length || 5;

  const latestWaste =
    state.wasteRecords.filter((w) => !w.isBaseline).slice(-1)[0] ||
    state.wasteRecords.find((w) => w.isBaseline) ||
    null;
  const latestElec =
    state.electricityRecords.filter((e) => !e.isBaseline).slice(-1)[0] ||
    state.electricityRecords.find((e) => e.isBaseline) ||
    null;
  const latestWater =
    state.waterRecords.filter((w) => !w.isBaseline).slice(-1)[0] ||
    state.waterRecords.find((w) => w.isBaseline) ||
    null;

  const wasteTrendInfo = getHomeEcoTrendStatement(
    'waste',
    latestWaste?.trend,
    state.wasteRecords.some((w) => w.isBaseline)
  );
  const elecTrendInfo = getHomeEcoTrendStatement(
    'electricity',
    latestElec?.trend,
    state.electricityRecords.some((e) => e.isBaseline)
  );
  const waterTrendInfo = getHomeEcoTrendStatement(
    'water',
    latestWater?.trend,
    state.waterRecords.some((w) => w.isBaseline)
  );

  const renderTrendPill = (trend?: 'ลดลง' | 'เพิ่มขึ้น' | 'คงที่') => {
    if (trend === 'ลดลง') {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-eco-100 px-2.5 py-0.5 text-xs font-bold text-eco-800">
          <TrendingDown className="h-3.5 w-3.5" />
          แนวโน้มลดลง
        </span>
      );
    }
    if (trend === 'เพิ่มขึ้น') {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-800">
          <TrendingUp className="h-3.5 w-3.5" />
          แนวโน้มเพิ่มขึ้น
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-700">
        <Minus className="h-3.5 w-3.5" />
        คงที่ / ข้อมูลตั้งต้น
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* 1. Profile & Level Hero Banner */}
      <section className="rounded-3xl border border-eco-200 bg-gradient-to-r from-eco-800 via-eco-700 to-sky-800 p-6 text-white shadow-lg">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border-2 border-white/40 bg-white/15 text-2xl font-extrabold backdrop-blur">
              {user?.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.displayName}
                  className="h-full w-full rounded-2xl object-cover"
                />
              ) : (
                user?.firstName?.slice(0, 1) || 'E'
              )}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-white/20 px-3 py-0.5 text-xs font-bold">
                  รหัสนักเรียน: {user?.studentCode || 'N/A'}
                </span>
                <span className="rounded-full bg-eco-400/30 px-3 py-0.5 text-xs font-bold">
                  ระดับชั้น {user?.gradeLevel || 'ม.2'} ห้อง {user?.room || '1'}
                </span>
              </div>
              <h1 className="mt-1.5 text-2xl font-extrabold tracking-tight">
                สวัสดี, {user?.displayName}
              </h1>
              <p className="text-xs text-eco-100">
                ร่วมเปลี่ยนการเรียนรู้สู่การดูแลโลกในชีวิตจริง ทั้งที่โรงเรียน บ้าน และชุมชน
              </p>
            </div>
          </div>

          {/* My Level Box */}
          <div className="rounded-2xl border border-white/20 bg-white/10 p-4 backdrop-blur md:min-w-[290px]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-eco-100">ระดับปัจจุบัน (My Level)</span>
              <span className="rounded-lg bg-amber-400 px-2 py-0.5 text-xs font-extrabold text-slate-900">
                Level {state.currentLevel?.level || 1}
              </span>
            </div>
            <p className="mt-1 text-lg font-extrabold text-white">
              {state.currentLevel?.titleEn || 'Eco Explorer'}
            </p>
            <p className="text-xs text-eco-100">
              {state.currentLevel?.titleTh || 'นักสำรวจสิ่งแวดล้อม'}
            </p>
            <div className="mt-3">
              <div className="flex justify-between text-[11px] text-eco-100 mb-1">
                <span>คะแนนสะสมรวม: {state.totalPoints} แต้ม</span>
                <span>
                  {state.nextLevel
                    ? `อีก ${state.nextLevel.minPoints - state.totalPoints} แต้ม สู่ Level ${state.nextLevel.level}`
                    : 'ระดับสูงสุดแล้ว!'}
                </span>
              </div>
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-white/20">
                <div
                  className="h-full rounded-full bg-amber-400 transition-all"
                  style={{ width: `${state.levelProgressPercent}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Onboarding Step Guide if Pre-Assessment or Baseline not completed */}
      {(!state.preAssessment || !state.hasBaseline) && (
        <section className="rounded-2xl border-2 border-amber-300 bg-amber-50 p-5 shadow-xs">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div className="space-y-1">
              <h2 className="flex items-center gap-2 text-base font-bold text-amber-950">
                <Sparkles className="h-5 w-5 text-amber-600" />
                เริ่มต้นก้าวแรกของผู้พิทักษ์ (ปลดล็อก Mission Map)
              </h2>
              <p className="text-xs text-amber-900">
                กรุณาทำแบบประเมินก่อนเรียน (Pre-Assessment) และบันทึกข้อมูลพื้นฐานของบ้าน
                (Home Eco Baseline) ก่อนเริ่มทำภารกิจที่ 1
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {!state.preAssessment && (
                <Link
                  to="/student/pre-assessment"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-amber-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-amber-700"
                >
                  <span>1. ทำ Pre-Assessment</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              )}
              {!state.hasBaseline && (
                <Link
                  to="/student/baseline"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-eco-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-eco-700"
                >
                  <span>2. บันทึก Home Eco Baseline</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              )}
            </div>
          </div>
        </section>
      )}

      {/* 2. Key Metrics Cards: Learning Points, Action Points, Mission Progress, Eco Streak */}
      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-2xl border border-eco-100 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Learning Points</span>
            <div className="rounded-xl bg-sky-50 p-2 text-sky-600">
              <BookOpen className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-2 text-3xl font-extrabold text-sky-700">
            {state.learningPoints}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            คะแนนจากการเรียนรู้และสะท้อนคิด
          </p>
        </div>

        <div className="rounded-2xl border border-eco-100 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Action Points</span>
            <div className="rounded-xl bg-eco-50 p-2 text-eco-600">
              <ShieldCheck className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-2 text-3xl font-extrabold text-eco-700">
            {state.actionPoints}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            คะแนนจากการลงมือปฏิบัติจริง
          </p>
        </div>

        <div className="rounded-2xl border border-eco-100 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Mission Progress</span>
            <div className="rounded-xl bg-purple-50 p-2 text-purple-600">
              <Compass className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-2 text-3xl font-extrabold text-purple-700">
            {completedMissions}/{totalMissions}
          </p>
          <p className="mt-1 text-xs text-slate-500">จำนวนภารกิจการเรียนรู้ที่ผ่าน</p>
        </div>

        <div className="rounded-2xl border border-eco-100 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Eco Streak</span>
            <div className="rounded-xl bg-amber-50 p-2 text-amber-600">
              <Flame className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-2 text-3xl font-extrabold text-amber-600">
            {state.ecoStreak} วัน
          </p>
          <p className="mt-1 text-xs text-slate-500">ทำกิจกรรมต่อเนื่องสม่ำเสมอ</p>
        </div>
      </section>

      {/* 3. My Behavior Goal & Mission Progress Bar */}
      <section className="grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-7 rounded-2xl border border-eco-100 bg-white p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Target className="h-5 w-5 text-eco-600" />
              <h2 className="text-base font-bold text-slate-900">
                เป้าหมายพฤติกรรมที่ฉันเลือก (My Behavior Goal)
              </h2>
            </div>
            <Link
              to="/student/commitment"
              className="text-xs font-bold text-eco-700 hover:underline"
            >
              แก้ไขเป้าหมาย
            </Link>
          </div>

          {state.commitment ? (
            <div className="rounded-2xl border border-eco-200 bg-eco-50/60 p-4 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="rounded-lg bg-eco-600 px-2.5 py-1 text-xs font-bold text-white">
                  หมวดหมู่: {state.commitment.category}
                </span>
                <span className="text-xs text-slate-600">
                  เริ่มเมื่อ: {state.commitment.startDate}
                </span>
              </div>
              <p className="text-base font-bold text-eco-950">
                “{state.commitment.what}”
              </p>
              <div className="grid grid-cols-1 gap-2 text-xs text-slate-700 sm:grid-cols-2">
                <p>
                  <strong>เมื่อใด:</strong> {state.commitment.when}
                </p>
                <p>
                  <strong>สถานที่:</strong> {state.commitment.where}
                </p>
                <p className="sm:col-span-2">
                  <strong>วิธีการ:</strong> {state.commitment.how}
                </p>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-300 p-5 text-center">
              <p className="text-sm font-medium text-slate-600">
                คุณยังไม่ได้ตั้งเป้าหมายพันธสัญญาการเปลี่ยนพฤติกรรม
              </p>
              <Link
                to="/student/commitment"
                className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-eco-600 px-4 py-2 text-xs font-bold text-white hover:bg-eco-700"
              >
                <span>เลือกพฤติกรรมที่ต้องการเปลี่ยน</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          )}

          <div className="pt-2 space-y-3">
            <EcoProgressChart
              label="ความก้าวหน้าการเรียนรู้ 5 Mission"
              current={completedMissions}
              target={totalMissions}
              unit="ภารกิจ"
              colorClass="bg-eco-600"
            />
            <EcoProgressChart
              label="จำนวนวันปฏิบัติ Eco Action ที่บันทึก"
              current={state.actionRecords.length}
              target={state.actionPlans[0]?.targetDays || 14}
              unit="วัน"
              colorClass="bg-sky-600"
            />
          </div>
        </div>

        {/* Badges Showcase */}
        <div className="lg:col-span-5 rounded-2xl border border-eco-100 bg-white p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Award className="h-5 w-5 text-amber-500" />
              <h2 className="text-base font-bold text-slate-900">
                เหรียญรางวัลที่ได้รับ ({state.earnedBadges.length}/{state.allBadges.length})
              </h2>
            </div>
            <Link
              to="/student/journey"
              className="text-xs font-bold text-eco-700 hover:underline"
            >
              ดูทั้งหมด
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            {state.allBadges.map((b) => {
              const isEarned = state.earnedBadges.some((ub) => ub.badgeId === b.id);
              return (
                <div
                  key={b.id}
                  className={`flex items-start gap-2.5 rounded-xl border p-3 ${
                    isEarned
                      ? 'border-amber-200 bg-amber-50/70 text-slate-900'
                      : 'border-slate-100 bg-slate-50/60 text-slate-400 opacity-75'
                  }`}
                >
                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                      isEarned
                        ? 'bg-amber-400 text-slate-950'
                        : 'bg-slate-200 text-slate-500'
                    }`}
                  >
                    <Award className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold truncate">{b.nameTh}</p>
                    <p className="text-[10px] truncate">{b.name}</p>
                    {isEarned && (
                      <span className="mt-0.5 inline-flex items-center gap-0.5 text-[10px] font-bold text-eco-700">
                        <CheckCircle2 className="h-3 w-3" /> ได้รับแล้ว
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 4. Home Eco Summary (ขยะ ไฟฟ้า น้ำ พร้อมแนวโน้ม ลดลง/คงที่/เพิ่มขึ้น) */}
      <section className="rounded-2xl border border-eco-100 bg-white p-6 shadow-xs space-y-4">
        <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              สรุปข้อมูลสิ่งแวดล้อมจากครัวเรือน (Home Eco Summary)
            </h2>
            <p className="text-xs text-slate-500">
              ติดตามข้อมูลขยะ ไฟฟ้า และน้ำของบ้านเมื่อเทียบกับข้อมูลพื้นฐาน (Baseline)
            </p>
          </div>
          <Link
            to="/student/home-eco"
            className="inline-flex items-center gap-1.5 rounded-xl bg-eco-600 px-4 py-2 text-xs font-bold text-white hover:bg-eco-700"
          >
            <span>บันทึกรายงาน Home Eco</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {/* Waste Summary Card */}
          <div className="rounded-2xl border border-eco-100 bg-eco-50/40 p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 text-sm font-bold text-eco-900">
                <Recycle className="h-4 w-4 text-eco-600" />
                ขยะครัวเรือน (Waste)
              </span>
              {renderTrendPill(latestWaste?.trend)}
            </div>
            <p className="text-2xl font-extrabold text-slate-900">
              {latestWaste ? `${latestWaste.totalWaste} กก.` : 'ยังไม่มีข้อมูล'}
            </p>
            <p className="text-xs text-slate-600 leading-relaxed">
              {wasteTrendInfo.statement}
            </p>
          </div>

          {/* Electricity Summary Card */}
          <div className="rounded-2xl border border-amber-100 bg-amber-50/40 p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 text-sm font-bold text-amber-900">
                <Zap className="h-4 w-4 text-amber-600" />
                การใช้ไฟฟ้า (Electricity)
              </span>
              {renderTrendPill(latestElec?.trend)}
            </div>
            <p className="text-2xl font-extrabold text-slate-900">
              {latestElec ? `${latestElec.electricityKwh} kWh` : 'ยังไม่มีข้อมูล'}
            </p>
            <p className="text-xs text-slate-600 leading-relaxed">
              {elecTrendInfo.statement}
            </p>
          </div>

          {/* Water Summary Card */}
          <div className="rounded-2xl border border-sky-100 bg-sky-50/40 p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 text-sm font-bold text-sky-900">
                <Droplets className="h-4 w-4 text-sky-600" />
                การใช้น้ำประปา (Water)
              </span>
              {renderTrendPill(latestWater?.trend)}
            </div>
            <p className="text-2xl font-extrabold text-slate-900">
              {latestWater ? `${latestWater.waterUnits} หน่วย` : 'ยังไม่มีข้อมูล'}
            </p>
            <p className="text-xs text-slate-600 leading-relaxed">
              {waterTrendInfo.statement}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

