import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Award,
  BarChart3,
  BookOpen,
  CheckCircle2,
  Droplets,
  Globe2,
  HeartHandshake,
  Leaf,
  LogIn,
  Recycle,
  ShieldCheck,
  Sparkles,
  Zap,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export const LandingPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleStartMission = () => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (user.role === 'admin') navigate('/admin/dashboard');
    else if (user.role === 'teacher') navigate('/teacher/dashboard');
    else navigate('/student/dashboard');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-eco-50/80 via-white to-cream-50 text-slate-800">
      {/* Top Bar */}
      <header className="mx-auto flex max-w-7xl items-center justify-between px-4 py-5 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-eco-600 to-sky-600 text-white shadow-md">
            <Leaf className="h-6 w-6" />
          </div>
          <div>
            <span className="block text-lg font-bold tracking-tight text-eco-900">
              ECO GUARDIAN
            </span>
            <span className="block text-xs text-slate-500">
              Guardian of Our Common Home
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {user ? (
            <button
              type="button"
              onClick={handleStartMission}
              className="inline-flex items-center gap-2 rounded-xl bg-eco-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-eco-700"
            >
              <span>เข้าสู่แดชบอร์ด ({user.displayName})</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          ) : (
            <>
              <Link
                to="/register"
                className="hidden sm:inline-flex items-center rounded-xl border border-eco-200 bg-white px-4 py-2.5 text-sm font-semibold text-eco-800 transition hover:bg-eco-50"
              >
                สมัครสมาชิก
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center gap-2 rounded-xl bg-eco-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-eco-700"
              >
                <LogIn className="h-4 w-4" />
                <span>เข้าสู่ระบบ</span>
              </Link>
            </>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="mx-auto max-w-7xl px-4 pt-8 pb-16 sm:px-6 lg:px-8 lg:pt-14">
        <div className="grid items-center gap-12 lg:grid-cols-12">
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-eco-200 bg-eco-100/80 px-3.5 py-1.5 text-xs font-bold text-eco-800">
              <Sparkles className="h-4 w-4 text-eco-600" />
              <span>นวัตกรรมการศึกษาสิ่งแวดล้อมเชื่อมโยงโรงเรียน บ้าน และชุมชน</span>
            </div>

            <div className="space-y-3">
              <h1 className="text-4xl font-extrabold tracking-tight text-eco-900 sm:text-5xl lg:text-6xl">
                ECO GUARDIAN
              </h1>
              <h2 className="text-xl font-bold text-sky-800 sm:text-2xl lg:text-3xl leading-snug">
                ระบบดิจิทัลเพื่อส่งเสริมจิตสำนึกและพฤติกรรมรับผิดชอบต่อสิ่งแวดล้อม
              </h2>
            </div>

            <p className="rounded-2xl border-l-4 border-eco-600 bg-white/90 p-4 text-lg font-semibold italic text-slate-700 shadow-sm">
              “จากการเรียนรู้ สู่การลงมือดูแลโลกในชีวิตจริง”
            </p>

            <p className="text-base leading-relaxed text-slate-600">
              เรียนรู้ผ่านสถานการณ์จำลอง 5 ภารกิจ (Mission Map) วางแผนปรับเปลี่ยนพฤติกรรมจริงในชีวิตประจำวัน
              (Eco Action Plan) พร้อมระบบติดตามข้อมูลสิ่งแวดล้อมจากครัวเรือน ได้แก่{' '}
              <strong className="text-eco-800">ขยะ การใช้ไฟฟ้า และการใช้น้ำประปา</strong>{' '}
              เพื่อร่วมกันพิทักษ์บ้านส่วนรวมของพวกเรา
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <button
                type="button"
                onClick={handleStartMission}
                className="inline-flex items-center gap-2.5 rounded-2xl bg-eco-600 px-7 py-4 text-base font-bold text-white shadow-lg shadow-eco-600/20 transition hover:bg-eco-700"
              >
                <span>เริ่มต้นภารกิจ</span>
                <ArrowRight className="h-5 w-5" />
              </button>
              <Link
                to="/login"
                className="inline-flex items-center gap-2 rounded-2xl border-2 border-sky-600 bg-white px-7 py-4 text-base font-bold text-sky-700 transition hover:bg-sky-50"
              >
                <LogIn className="h-5 w-5" />
                <span>เข้าสู่ระบบ</span>
              </Link>
            </div>

            <div className="grid grid-cols-3 gap-4 pt-4">
              <div className="rounded-2xl border border-eco-100 bg-white p-3.5 shadow-sm">
                <p className="text-2xl font-extrabold text-eco-700">5 Missions</p>
                <p className="text-xs text-slate-600">ภารกิจเรียนรู้และตัดสินใจ</p>
              </div>
              <div className="rounded-2xl border border-sky-100 bg-white p-3.5 shadow-sm">
                <p className="text-2xl font-extrabold text-sky-700">3 มิติบ้าน</p>
                <p className="text-xs text-slate-600">ติดตามขยะ ไฟฟ้า และน้ำ</p>
              </div>
              <div className="rounded-2xl border border-amber-100 bg-white p-3.5 shadow-sm">
                <p className="text-2xl font-extrabold text-amber-600">4 แหล่งข้อมูล</p>
                <p className="text-xs text-slate-600">โมเดลหลักฐานพฤติกรรมจริง</p>
              </div>
            </div>
          </div>

          {/* Right Highlight Card */}
          <div className="lg:col-span-5">
            <div className="rounded-3xl border border-eco-200 bg-white p-6 shadow-xl space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-eco-100 text-eco-700">
                    <Globe2 className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      เส้นทางผู้พิทักษ์สิ่งแวดล้อม
                    </h3>
                    <p className="text-xs text-slate-500">
                      Eco Explorer สู่ Guardian of Our Common Home
                    </p>
                  </div>
                </div>
                <span className="rounded-full bg-eco-50 px-3 py-1 text-xs font-bold text-eco-700">
                  Gamified Learning
                </span>
              </div>

              <div className="space-y-3">
                {[
                  {
                    icon: BookOpen,
                    title: '1. ประเมินตนเอง & เรียนรู้ 5 ภารกิจ',
                    desc: 'วิเคราะห์สถานการณ์จริง ตัดสินใจ และเห็นผลกระทบต่อ People, Society, Planet',
                    color: 'bg-eco-50 text-eco-700',
                  },
                  {
                    icon: HeartHandshake,
                    title: '2. ตั้งพันธสัญญา & ปฏิบัติการรายวัน',
                    desc: 'เลือกพฤติกรรมเป้าหมาย วางแผน 7-14 วัน และบันทึกผลพร้อมหลักฐานจริง',
                    color: 'bg-sky-50 text-sky-700',
                  },
                  {
                    icon: BarChart3,
                    title: '3. รายงานข้อมูลขยะ ไฟฟ้า และน้ำของครัวเรือน',
                    desc: 'เปรียบเทียบกับค่าพื้นฐาน (Baseline) เพื่อติดตามแนวโน้มการใช้ทรัพยากรในบ้าน',
                    color: 'bg-amber-50 text-amber-700',
                  },
                  {
                    icon: ShieldCheck,
                    title: '4. การรับรองโดยครู & ติดตามผลระยะยาว',
                    desc: 'ประเมินพฤติกรรมจาก 4 แหล่งข้อมูล พร้อมระบบเหรียญรางวัลและระดับผู้พิทักษ์',
                    color: 'bg-emerald-50 text-emerald-700',
                  },
                ].map((step, i) => {
                  const Icon = step.icon;
                  return (
                    <div
                      key={i}
                      className="flex items-start gap-3.5 rounded-2xl border border-slate-100 bg-slate-50/60 p-3.5"
                    >
                      <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${step.color}`}
                      >
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-800">{step.title}</h4>
                        <p className="mt-0.5 text-xs leading-relaxed text-slate-600">
                          {step.desc}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="grid grid-cols-3 gap-2 pt-2">
                <div className="flex flex-col items-center rounded-xl bg-eco-50/70 p-2.5 text-center">
                  <Recycle className="h-5 w-5 text-eco-600" />
                  <span className="mt-1 text-xs font-bold text-eco-900">ลด & คัดแยกขยะ</span>
                </div>
                <div className="flex flex-col items-center rounded-xl bg-amber-50/70 p-2.5 text-center">
                  <Zap className="h-5 w-5 text-amber-600" />
                  <span className="mt-1 text-xs font-bold text-amber-900">ประหยัดไฟฟ้า</span>
                </div>
                <div className="flex flex-col items-center rounded-xl bg-sky-50/70 p-2.5 text-center">
                  <Droplets className="h-5 w-5 text-sky-600" />
                  <span className="mt-1 text-xs font-bold text-sky-900">อนุรักษ์สายน้ำ</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5 Domains Feature Section */}
      <section className="border-t border-eco-100 bg-white py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">
              ครอบคลุมพฤติกรรมรับผิดชอบต่อสิ่งแวดล้อม 5 ด้านหลัก
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              ออกแบบตามกรอบการพัฒนาพลเมืองสิ่งแวดล้อมและหลักฐานเชิงประจักษ์ 4 มิติ
            </p>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {[
              '1. การจัดการขยะและลดการใช้ทรัพยากร',
              '2. การประหยัดพลังงานและน้ำ',
              '3. การบริโภคอย่างรับผิดชอบ',
              '4. การดูแลสิ่งแวดล้อมส่วนรวม',
              '5. การเป็นพลเมืองสิ่งแวดล้อมและการชักชวนผู้อื่น',
            ].map((title, idx) => (
              <div
                key={idx}
                className="rounded-2xl border border-eco-100 bg-cream-50/60 p-4 shadow-xs"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-eco-600 text-xs font-bold text-white">
                  0{idx + 1}
                </div>
                <p className="mt-3 text-sm font-bold text-slate-800">{title}</p>
                <div className="mt-2 flex items-center gap-1 text-xs font-medium text-eco-700">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>ประเมิน & ติดตามผลจริง</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-slate-900 py-8 text-slate-300">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 sm:flex-row sm:px-6 lg:px-8">
          <div className="flex items-center gap-2.5">
            <Award className="h-5 w-5 text-eco-400" />
            <span className="text-sm font-bold text-white">
              ECO GUARDIAN — ระบบดิจิทัลเพื่อส่งเสริมจิตสำนึกและพฤติกรรมรับผิดชอบต่อสิ่งแวดล้อม
            </span>
          </div>
          <p className="text-xs text-slate-400">
            พัฒนาด้วย React + TypeScript + Tailwind CSS + Firebase
          </p>
        </div>
      </footer>
    </div>
  );
};

