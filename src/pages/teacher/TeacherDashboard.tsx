import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  FileCheck2,
  Flame,
  Sparkles,
  UserCheck,
  Users,
} from 'lucide-react';
import {
  getAllActionPlans,
  getAllActionRecords,
  getAllAssessmentResponses,
  getAllFollowUps,
  getAllMissionProgress,
  getAllUsers,
} from '../../services/firestore/ecoDataService';
import { LoadingState } from '../../components/ui/StateViews';

export const TeacherDashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalStudents: 0,
    completedPre: 0,
    completedAllMissions: 0,
    doingEcoAction: 0,
    pendingVerification: 0,
    completedPost: 0,
    completedFollowUp: 0,
  });

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [users, assessments, missions, plans, records, followUps] =
          await Promise.all([
            getAllUsers(true),
            getAllAssessmentResponses(true),
            getAllMissionProgress(true),
            getAllActionPlans(true),
            getAllActionRecords(true),
            getAllFollowUps(true),
          ]);

        const students = users.filter((u) => u.role === 'student');
        const preSet = new Set(
          assessments
            .filter((a) => a.assessmentType === 'pre')
            .map((a) => a.studentId)
        );
        const postSet = new Set(
          assessments
            .filter((a) => a.assessmentType === 'post')
            .map((a) => a.studentId)
        );
        const allMissionsCount = students.filter(
          (s) =>
            missions.filter(
              (m) => m.userId === s.uid && m.status === 'completed'
            ).length >= 5
        ).length;
        const activeActionStudents = new Set(
          plans.filter((p) => p.status === 'active').map((p) => p.userId)
        ).size;
        const pendingCount = records.filter(
          (r) => r.teacherVerification === 'pending'
        ).length;

        setStats({
          totalStudents: students.length,
          completedPre: preSet.size,
          completedAllMissions: allMissionsCount,
          doingEcoAction: activeActionStudents,
          pendingVerification: pendingCount,
          completedPost: postSet.size,
          completedFollowUp: followUps.length,
        });
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return <LoadingState message="กำลังโหลดข้อมูลสรุปแดชบอร์ดครูที่ปรึกษา..." />;
  }

  const summaryCards = [
    {
      label: 'นักเรียนทั้งหมด',
      value: stats.totalStudents,
      unit: 'คน',
      icon: Users,
      color: 'bg-eco-50 text-eco-700 border-eco-200',
    },
    {
      label: 'ทำ Pre-Assessment แล้ว',
      value: stats.completedPre,
      unit: 'คน',
      icon: ClipboardCheck,
      color: 'bg-sky-50 text-sky-700 border-sky-200',
    },
    {
      label: 'ทำ Mission ครบ 5 ภารกิจ',
      value: stats.completedAllMissions,
      unit: 'คน',
      icon: BookOpen,
      color: 'bg-purple-50 text-purple-700 border-purple-200',
    },
    {
      label: 'กำลังทำ Eco Action',
      value: stats.doingEcoAction,
      unit: 'คน',
      icon: Flame,
      color: 'bg-amber-50 text-amber-800 border-amber-200',
    },
    {
      label: 'รอตรวจหลักฐาน',
      value: stats.pendingVerification,
      unit: 'รายการ',
      icon: Clock,
      color: 'bg-red-50 text-red-700 border-red-200',
    },
    {
      label: 'ทำ Post-Assessment แล้ว',
      value: stats.completedPost,
      unit: 'คน',
      icon: FileCheck2,
      color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    },
    {
      label: 'ทำ Follow-up แล้ว',
      value: stats.completedFollowUp,
      unit: 'คน',
      icon: Sparkles,
      color: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    },
  ];

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-eco-200 bg-gradient-to-r from-sky-900 via-eco-800 to-eco-900 p-6 text-white shadow-lg">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-bold">
              Teacher Portal • ระบบติดตามและรับรองพฤติกรรมผู้เรียน
            </span>
            <h1 className="mt-2 text-2xl font-extrabold">
              แดชบอร์ดครูที่ปรึกษา (Teacher Dashboard)
            </h1>
            <p className="text-xs text-eco-100">
              ติดตามความก้าวหน้าของผู้เรียน ตรวจสอบหลักฐาน Eco Action บันทึกการสังเกตพฤติกรรม และดูรายงานระดับห้องเรียน
            </p>
          </div>
          <Link
            to="/teacher/verification"
            className="inline-flex items-center gap-2 rounded-2xl bg-amber-400 px-5 py-3 text-xs font-extrabold text-slate-950 shadow-md hover:bg-amber-300"
          >
            <span>ตรวจหลักฐานที่รออนุมัติ ({stats.pendingVerification})</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* Section 38: 7 Summary Cards */}
      <section className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {summaryCards.map((c) => {
          const Icon = c.icon;
          return (
            <div
              key={c.label}
              className={`rounded-2xl border p-5 shadow-xs bg-white`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-600">{c.label}</span>
                <div className={`rounded-xl p-2 ${c.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
              </div>
              <p className="mt-3 text-3xl font-extrabold text-slate-900">
                {c.value}{' '}
                <span className="text-xs font-semibold text-slate-500">{c.unit}</span>
              </p>
            </div>
          );
        })}
      </section>

      {/* Teacher Quick Modules */}
      <section className="grid gap-4 md:grid-cols-2">
        <Link
          to="/teacher/verification"
          className="group rounded-2xl border border-eco-200 bg-white p-6 shadow-xs transition hover:border-eco-500 hover:shadow-md"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-eco-100 p-3 text-eco-700">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  1. ตรวจรับรองหลักฐาน Eco Action (Teacher Verification)
                </h2>
                <p className="text-xs text-slate-600">
                  ดูภาพหลักฐาน อ่านการสะท้อนคิด ให้ข้อเสนอแนะ และอนุมัติคะแนน Action Points
                </p>
              </div>
            </div>
            <ArrowRight className="h-5 w-5 text-slate-400 group-hover:text-eco-600" />
          </div>
        </Link>

        <Link
          to="/teacher/observations"
          className="group rounded-2xl border border-eco-200 bg-white p-6 shadow-xs transition hover:border-eco-500 hover:shadow-md"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-amber-100 p-3 text-amber-700">
                <UserCheck className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  2. แบบประเมินสังเกตพฤติกรรมโดยครู (Teacher Observation)
                </h2>
                <p className="text-xs text-slate-600">
                  ประเมินพฤติกรรมนักเรียน 5 ด้าน ช่วงก่อนเรียน (Pre) ระหว่างเรียน (During) และหลังเรียน (Post)
                </p>
              </div>
            </div>
            <ArrowRight className="h-5 w-5 text-slate-400 group-hover:text-eco-600" />
          </div>
        </Link>

        <Link
          to="/teacher/students"
          className="group rounded-2xl border border-eco-200 bg-white p-6 shadow-xs transition hover:border-eco-500 hover:shadow-md"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-sky-100 p-3 text-sky-700">
                <Users className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  3. จัดการและติดตามข้อมูลนักเรียนรายบุคคล (Student Management)
                </h2>
                <p className="text-xs text-slate-600">
                  ค้นหา กรองตามห้องเรียน และดูข้อมูล Profile, Mission, Eco Action, Assessment และ Home Eco
                </p>
              </div>
            </div>
            <ArrowRight className="h-5 w-5 text-slate-400 group-hover:text-eco-600" />
          </div>
        </Link>

        <Link
          to="/teacher/reports"
          className="group rounded-2xl border border-eco-200 bg-white p-6 shadow-xs transition hover:border-eco-500 hover:shadow-md"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-purple-100 p-3 text-purple-700">
                <BarChart3 className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  4. รายงานสรุปผลระดับห้องเรียนและส่งออก CSV/PDF (Classroom Report)
                </h2>
                <p className="text-xs text-slate-600">
                  ดูอัตราความสำเร็จ ค่าเฉลี่ยคะแนน แนวโน้มขยะ-ไฟ-น้ำ และส่งออกไฟล์รายงาน
                </p>
              </div>
            </div>
            <ArrowRight className="h-5 w-5 text-slate-400 group-hover:text-eco-600" />
          </div>
        </Link>
      </section>
    </div>
  );
};

