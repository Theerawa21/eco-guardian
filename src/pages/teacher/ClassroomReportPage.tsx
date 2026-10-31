import React, { useEffect, useState } from 'react';
import {
  BarChart3,
  Download,
  FileText,
  Printer,
} from 'lucide-react';
import {
  exportReportAsCsv,
  exportReportAsPrintablePdf,
  REPORT_TYPES_META,
  ReportType,
} from '../../services/firestore/reportExportService';
import {
  getAllActionRecords,
  getAllAssessmentResponses,
  getAllElectricityRecords,
  getAllMissionProgress,
  getAllUsers,
  getAllWasteRecords,
  getAllWaterRecords,
  getClassrooms,
} from '../../services/firestore/ecoDataService';
import { Classroom } from '../../types';
import { LoadingState } from '../../components/ui/StateViews';

export const ClassroomReportPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('all');
  const [includeDemo, setIncludeDemo] = useState<boolean>(true);
  const [summary, setSummary] = useState({
    studentCount: 0,
    completionRate: 0,
    preAverage: 0,
    postAverage: 0,
    behaviorScoreAvg: 0,
    ecoActionCount: 0,
    wasteReducedHouseholds: 0,
    elecReducedHouseholds: 0,
    waterReducedHouseholds: 0,
  });

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [
          users,
          clsList,
          assessments,
          missions,
          actions,
          waste,
          elec,
          water,
        ] = await Promise.all([
          getAllUsers(includeDemo),
          getClassrooms(),
          getAllAssessmentResponses(includeDemo),
          getAllMissionProgress(includeDemo),
          getAllActionRecords(includeDemo),
          getAllWasteRecords(includeDemo),
          getAllElectricityRecords(includeDemo),
          getAllWaterRecords(includeDemo),
        ]);

        setClassrooms(clsList);

        const students = users.filter(
          (u) =>
            u.role === 'student' &&
            (selectedClassId === 'all' || u.classId === selectedClassId)
        );
        const uids = new Set(students.map((s) => s.uid));

        const completedAll = students.filter(
          (s) =>
            missions.filter(
              (m) => m.userId === s.uid && m.status === 'completed'
            ).length >= 5
        ).length;

        const preList = assessments.filter(
          (a) => a.assessmentType === 'pre' && uids.has(a.studentId)
        );
        const postList = assessments.filter(
          (a) => a.assessmentType === 'post' && uids.has(a.studentId)
        );

        const preAvg =
          preList.length > 0
            ? Number(
                (
                  preList.reduce((acc, item) => acc + item.totalScore, 0) /
                  preList.length
                ).toFixed(1)
              )
            : 0;
        const postAvg =
          postList.length > 0
            ? Number(
                (
                  postList.reduce((acc, item) => acc + item.totalScore, 0) /
                  postList.length
                ).toFixed(1)
              )
            : 0;
        const behaviorAvg =
          postList.length > 0
            ? Number(
                (
                  postList.reduce(
                    (acc, item) => acc + item.sectionScores.sectionC,
                    0
                  ) / postList.length
                ).toFixed(1)
              )
            : 0;

        const clsActions = actions.filter((a) => uids.has(a.userId)).length;

        const wasteReduced = waste.filter(
          (w) => !w.isBaseline && uids.has(w.userId) && w.trend === 'ลดลง'
        ).length;
        const elecReduced = elec.filter(
          (e) => !e.isBaseline && uids.has(e.userId) && e.trend === 'ลดลง'
        ).length;
        const waterReduced = water.filter(
          (w) => !w.isBaseline && uids.has(w.userId) && w.trend === 'ลดลง'
        ).length;

        setSummary({
          studentCount: students.length,
          completionRate:
            students.length > 0
              ? Number(((completedAll / students.length) * 100).toFixed(1))
              : 0,
          preAverage: preAvg,
          postAverage: postAvg,
          behaviorScoreAvg: behaviorAvg,
          ecoActionCount: clsActions,
          wasteReducedHouseholds: wasteReduced,
          elecReducedHouseholds: elecReduced,
          waterReducedHouseholds: waterReduced,
        });
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [selectedClassId, includeDemo]);

  if (loading) {
    return <LoadingState message="กำลังประมวลผลรายงานระดับห้องเรียน..." />;
  }

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-eco-200 bg-white p-6 shadow-xs">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex items-start gap-3.5">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-purple-100 text-purple-700">
              <BarChart3 className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-slate-900">
                รายงานสรุปผลระดับห้องเรียนและศูนย์ส่งออกรายงาน (Classroom Reports)
              </h1>
              <p className="text-xs text-slate-600">
                แสดงข้อมูลภาพรวมระดับห้องเรียนโดยคุ้มครองข้อมูลส่วนบุคคลของนักเรียนและครัวเรือน
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <label className="inline-flex items-center gap-2 text-xs font-bold text-slate-700">
              <input
                type="checkbox"
                checked={includeDemo}
                onChange={(e) => setIncludeDemo(e.target.checked)}
                className="h-4 w-4 accent-eco-600"
              />
              <span>รวมข้อมูลตัวอย่าง (Demo Data)</span>
            </label>

            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="rounded-xl border border-slate-300 px-3.5 py-2 text-xs font-bold"
            >
              <option value="all">ทุกห้องเรียน</option>
              {classrooms.map((c) => (
                <option key={c.id} value={c.id}>
                  ห้อง {c.name} ({c.teacherName})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Section 40: Classroom Report Summary Metrics */}
      <section className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <div className="rounded-2xl border border-eco-100 bg-white p-4 shadow-xs">
          <span className="text-xs text-slate-500 font-bold">จำนวนผู้เรียน</span>
          <p className="mt-1 text-2xl font-extrabold text-slate-900">
            {summary.studentCount} คน
          </p>
        </div>
        <div className="rounded-2xl border border-eco-100 bg-white p-4 shadow-xs">
          <span className="text-xs text-slate-500 font-bold">Completion Rate</span>
          <p className="mt-1 text-2xl font-extrabold text-eco-700">
            {summary.completionRate}%
          </p>
        </div>
        <div className="rounded-2xl border border-eco-100 bg-white p-4 shadow-xs">
          <span className="text-xs text-slate-500 font-bold">Pre Average</span>
          <p className="mt-1 text-2xl font-extrabold text-sky-700">
            {summary.preAverage}/85
          </p>
        </div>
        <div className="rounded-2xl border border-eco-100 bg-white p-4 shadow-xs">
          <span className="text-xs text-slate-500 font-bold">Post Average</span>
          <p className="mt-1 text-2xl font-extrabold text-eco-700">
            {summary.postAverage}/85
          </p>
        </div>
        <div className="rounded-2xl border border-eco-100 bg-white p-4 shadow-xs">
          <span className="text-xs text-slate-500 font-bold">Behavior Score</span>
          <p className="mt-1 text-2xl font-extrabold text-purple-700">
            {summary.behaviorScoreAvg}/50
          </p>
        </div>
        <div className="rounded-2xl border border-eco-100 bg-white p-4 shadow-xs">
          <span className="text-xs text-slate-500 font-bold">Eco Actions</span>
          <p className="mt-1 text-2xl font-extrabold text-amber-600">
            {summary.ecoActionCount} ครั้ง
          </p>
        </div>
      </section>

      {/* Household Trends Summary */}
      <section className="rounded-2xl border border-eco-100 bg-white p-6 shadow-xs space-y-3">
        <h2 className="text-base font-bold text-slate-900">
          สรุปแนวโน้มข้อมูลสิ่งแวดล้อมของครัวเรือนในห้องเรียน (เทียบกับ Baseline)
        </h2>
        <div className="grid gap-4 md:grid-cols-3 text-xs">
          <div className="rounded-xl bg-eco-50/70 p-4 border border-eco-200">
            <span className="font-bold text-eco-950">Waste Trend (แนวโน้มขยะครัวเรือน)</span>
            <p className="mt-1 text-sm font-bold text-eco-800">
              มีแนวโน้มลดลง {summary.wasteReducedHouseholds} ครัวเรือน
            </p>
            <p className="mt-0.5 text-slate-600">
              ข้อมูลปริมาณขยะของครัวเรือนมีแนวโน้มลดลงในช่วงการเข้าร่วมกิจกรรม
            </p>
          </div>
          <div className="rounded-xl bg-amber-50/70 p-4 border border-amber-200">
            <span className="font-bold text-amber-950">Electricity Trend (แนวโน้มไฟฟ้า)</span>
            <p className="mt-1 text-sm font-bold text-amber-800">
              มีแนวโน้มลดลง {summary.elecReducedHouseholds} ครัวเรือน
            </p>
            <p className="mt-0.5 text-slate-600">
              ข้อมูลการใช้ไฟฟ้าของครัวเรือนมีแนวโน้มลดลงในช่วงการเข้าร่วมกิจกรรม
            </p>
          </div>
          <div className="rounded-xl bg-sky-50/70 p-4 border border-sky-200">
            <span className="font-bold text-sky-950">Water Trend (แนวโน้มน้ำประปา)</span>
            <p className="mt-1 text-sm font-bold text-sky-800">
              มีแนวโน้มลดลง {summary.waterReducedHouseholds} ครัวเรือน
            </p>
            <p className="mt-0.5 text-slate-600">
              ข้อมูลการใช้น้ำประปาของครัวเรือนมีแนวโน้มลดลงในช่วงการเข้าร่วมกิจกรรม
            </p>
          </div>
        </div>
      </section>

      {/* Section 51: Export 9 Report Types (CSV & PDF) */}
      <section className="rounded-2xl border border-eco-100 bg-white p-6 shadow-xs space-y-4">
        <div>
          <h2 className="text-base font-bold text-slate-900">
            ส่งออกรายงานวิจัยและรายงานการเรียนการสอน 9 ประเภท (CSV & Printable PDF)
          </h2>
          <p className="text-xs text-slate-500">
            รองรับการเปิดด้วย Microsoft Excel ภาษาไทย (UTF-8 BOM) และการพิมพ์รายงาน PDF
          </p>
        </div>

        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {REPORT_TYPES_META.map((rep) => (
            <div
              key={rep.key}
              className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-slate-50/60 p-4 space-y-3"
            >
              <div>
                <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                  <FileText className="h-4 w-4 text-eco-600 shrink-0" />
                  <span>{rep.title}</span>
                </div>
                <p className="mt-1 text-xs text-slate-600">{rep.description}</p>
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => exportReportAsCsv(rep.key as ReportType, includeDemo)}
                  className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-eco-600 px-3 py-2 text-xs font-bold text-white hover:bg-eco-700"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Export CSV</span>
                </button>
                <button
                  type="button"
                  onClick={() =>
                    exportReportAsPrintablePdf(rep.key as ReportType, includeDemo)
                  }
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100"
                >
                  <Printer className="h-3.5 w-3.5" />
                  <span>PDF</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

