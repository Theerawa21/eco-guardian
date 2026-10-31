import React, { useCallback, useEffect, useState } from 'react';
import {
  Award,
  CheckCircle2,
  Database,
  Download,
  Plus,
  Printer,
  RefreshCw,
  ShieldCheck,
  Trash2,
} from 'lucide-react';
import {
  ActionRecord,
  AssessmentResponse,
  BadgeDefinition,
  Classroom,
  ElectricityRecord,
  LevelDefinition,
  Mission,
  Question,
  SystemSettings,
  UserProfile,
  WasteRecord,
  WaterRecord,
} from '../../types';
import {
  deleteClassroom,
  deleteQuestion,
  getAllActionRecords,
  getAllAssessmentResponses,
  getAllElectricityRecords,
  getAllMissionProgress,
  getAllUsers,
  getAllWasteRecords,
  getAllWaterRecords,
  getClassrooms,
  getMissions,
  getQuestions,
  getSystemSettings,
  saveClassroom,
  saveMission,
  saveQuestion,
  saveSystemSettings,
  saveUserProfile,
} from '../../services/firestore/ecoDataService';
import {
  getBadges,
  getLevels,
  saveBadgeDefinition,
  saveLevelDefinition,
} from '../../services/firestore/gamificationService';
import {
  purgeDemoData,
  seedFullDemoDataset,
} from '../../services/firestore/seedService';
import {
  exportReportAsCsv,
  exportReportAsPrintablePdf,
  REPORT_TYPES_META,
  ReportType,
} from '../../services/firestore/reportExportService';
import { FeedbackBanner, LoadingState } from '../../components/ui/StateViews';

type AdminMenuKey =
  | 'Dashboard'
  | 'Users'
  | 'Students'
  | 'Teachers'
  | 'Classrooms'
  | 'Missions'
  | 'Mission Content'
  | 'Question Bank'
  | 'Assessments'
  | 'Behavior Indicators'
  | 'Eco Actions'
  | 'Waste Reports'
  | 'Electricity Reports'
  | 'Water Reports'
  | 'Badges'
  | 'Levels'
  | 'Reports'
  | 'Settings';

const ADMIN_MENUS: AdminMenuKey[] = [
  'Dashboard',
  'Users',
  'Students',
  'Teachers',
  'Classrooms',
  'Missions',
  'Mission Content',
  'Question Bank',
  'Assessments',
  'Behavior Indicators',
  'Eco Actions',
  'Waste Reports',
  'Electricity Reports',
  'Water Reports',
  'Badges',
  'Levels',
  'Reports',
  'Settings',
];

export const AdminDashboard: React.FC = () => {
  const [activeMenu, setActiveMenu] = useState<AdminMenuKey>('Dashboard');
  const [includeDemo, setIncludeDemo] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(true);
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);

  const [users, setUsers] = useState<UserProfile[]>([]);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [assessments, setAssessments] = useState<AssessmentResponse[]>([]);
  const [actions, setActions] = useState<ActionRecord[]>([]);
  const [wasteList, setWasteList] = useState<WasteRecord[]>([]);
  const [elecList, setElecList] = useState<ElectricityRecord[]>([]);
  const [waterList, setWaterList] = useState<WaterRecord[]>([]);
  const [badges, setBadges] = useState<BadgeDefinition[]>([]);
  const [levels, setLevels] = useState<LevelDefinition[]>([]);
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [completedMissionsTotal, setCompletedMissionsTotal] = useState(0);

  // Editor state
  const [editingMission, setEditingMission] = useState<Mission | null>(null);
  const [newClassName, setNewClassName] = useState('');
  const [newClassGrade, setNewClassGrade] = useState('ม.2');
  const [newClassRoom, setNewClassRoom] = useState('3');
  const [newClassTeacher, setNewClassTeacher] = useState('ครูกานต์พิชชา สายชล');

  const [newQuestionText, setNewQuestionText] = useState('');
  const [newQuestionSection, setNewQuestionSection] = useState<'A' | 'B' | 'C'>('C');
  const [newQuestionType, setNewQuestionType] = useState<Question['questionType']>('rating_scale');

  const loadAllAdminData = useCallback(async () => {
    setLoading(true);
    try {
      const [
        uList,
        cList,
        mList,
        qList,
        aList,
        actList,
        wList,
        eList,
        waList,
        bList,
        lList,
        sDoc,
        mProg,
      ] = await Promise.all([
        getAllUsers(includeDemo),
        getClassrooms(),
        getMissions(false),
        getQuestions(false),
        getAllAssessmentResponses(includeDemo),
        getAllActionRecords(includeDemo),
        getAllWasteRecords(includeDemo),
        getAllElectricityRecords(includeDemo),
        getAllWaterRecords(includeDemo),
        getBadges(),
        getLevels(),
        getSystemSettings(),
        getAllMissionProgress(includeDemo),
      ]);

      setUsers(uList);
      setClassrooms(cList);
      setMissions(mList);
      setQuestions(qList);
      setAssessments(aList);
      setActions(actList);
      setWasteList(wList);
      setElecList(eList);
      setWaterList(waList);
      setBadges(bList);
      setLevels(lList);
      setSettings(sDoc);
      setCompletedMissionsTotal(
        mProg.filter((m) => m.status === 'completed').length
      );
      setEditingMission((prev) => prev || mList[0] || null);
    } finally {
      setLoading(false);
    }
  }, [includeDemo]);

  useEffect(() => {
    loadAllAdminData();
  }, [loadAllAdminData]);

  const handleSeedDemo = async () => {
    setLoading(true);
    try {
      const res = await seedFullDemoDataset();
      await loadAllAdminData();
      setFeedback({
        type: 'success',
        message: `สร้างข้อมูล Demo สำเร็จ (นักเรียน ${res.studentsCount} คน, ครู ${res.teachersCount} คน, Admin ${res.adminsCount} คน, ห้องเรียน ${res.classroomsCount} ห้อง, ภารกิจ ${res.missionsCount} Mission — ติด Flag demo: true ทุกรายการ)`,
      });
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err?.message || 'เกิดข้อผิดพลาดในการสร้างข้อมูล Demo',
      });
      setLoading(false);
    }
  };

  const handlePurgeDemo = async () => {
    setLoading(true);
    try {
      const count = await purgeDemoData();
      await loadAllAdminData();
      setFeedback({
        type: 'info',
        message: `ลบข้อมูลที่ติด Flag demo: true ออกจากฐานข้อมูลเรียบร้อยแล้ว (${count} รายการ) เพื่อเตรียมพร้อมสำหรับข้อมูลวิจัยจริง`,
      });
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err?.message || 'ไม่สามารถลบข้อมูล Demo ได้',
      });
      setLoading(false);
    }
  };

  const handleAddClassroom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClassName.trim()) return;
    const id = `class-${Date.now()}`;
    await saveClassroom({
      id,
      name: newClassName.trim(),
      gradeLevel: newClassGrade,
      room: newClassRoom,
      academicYear: settings?.academicYear || '2569',
      teacherId: 'demo-teacher-01',
      teacherName: newClassTeacher,
      demo: false,
      createdAt: new Date().toISOString(),
    });
    setNewClassName('');
    await loadAllAdminData();
    setFeedback({ type: 'success', message: 'เพิ่มห้องเรียนใหม่สำเร็จ' });
  };

  const handleAddQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuestionText.trim()) return;
    const q: Question = {
      id: `q-custom-${Date.now()}`,
      assessmentType: 'pre_post',
      section: newQuestionSection,
      domain:
        newQuestionSection === 'A'
          ? 'knowledge'
          : newQuestionSection === 'B'
          ? 'attitude'
          : 'waste_management',
      questionType: newQuestionType,
      questionText: newQuestionText.trim(),
      choices:
        newQuestionType === 'multiple_choice'
          ? ['ตัวเลือกที่ 1', 'ตัวเลือกที่ 2', 'ตัวเลือกที่ 3', 'ตัวเลือกที่ 4']
          : newQuestionType === 'true_false'
          ? ['ใช่ (ถูก)', 'ไม่ใช่ (ผิด)']
          : undefined,
      correctAnswer:
        newQuestionType === 'multiple_choice'
          ? 'ตัวเลือกที่ 1'
          : newQuestionType === 'true_false'
          ? 'ใช่ (ถูก)'
          : undefined,
      score: newQuestionSection === 'A' ? 2 : 5,
      order: questions.length + 1,
      active: true,
      demo: false,
    };
    await saveQuestion(q);
    setNewQuestionText('');
    await loadAllAdminData();
    setFeedback({ type: 'success', message: 'เพิ่มข้อคำถามใน Question Bank สำเร็จ' });
  };

  const handleSaveMission = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMission) return;
    await saveMission(editingMission);
    await loadAllAdminData();
    setFeedback({
      type: 'success',
      message: `บันทึกเนื้อหา ${editingMission.title} ลงใน Firestore เรียบร้อยแล้ว`,
    });
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    await saveSystemSettings(settings);
    setFeedback({
      type: 'success',
      message: 'บันทึกการตั้งค่าระบบ (System Settings) ลงใน Firestore สำเร็จ',
    });
  };

  if (loading) {
    return <LoadingState message="กำลังโหลดระบบบริหารจัดการสำหรับผู้ดูแลระบบ (Admin Console)..." />;
  }

  const students = users.filter((u) => u.role === 'student');

  const householdsWithHomeEco = new Set([
    ...wasteList.map((w) => w.userId),
    ...elecList.map((e) => e.userId),
    ...waterList.map((w) => w.userId),
  ]).size;

  const totalWasteKgReported = Number(
    wasteList.reduce((acc, w) => acc + w.totalWaste, 0).toFixed(1)
  );
  const totalElecKwhReported = Number(
    elecList.reduce((acc, e) => acc + e.electricityKwh, 0).toFixed(0)
  );
  const totalWaterUnitsReported = Number(
    waterList.reduce((acc, w) => acc + w.waterUnits, 0).toFixed(1)
  );

  // Section 41: แสดงค่าการเปลี่ยนแปลงเฉพาะข้อมูลที่มี Baseline เปรียบเทียบได้
  const comparableWasteReports = wasteList.filter(
    (w) => !w.isBaseline && w.wasteReductionPercentage !== null
  );
  const avgWasteReductionPct =
    comparableWasteReports.length > 0
      ? Number(
          (
            comparableWasteReports.reduce(
              (acc, w) => acc + (w.wasteReductionPercentage || 0),
              0
            ) / comparableWasteReports.length
          ).toFixed(1)
        )
      : null;

  const comparableElecReports = elecList.filter(
    (e) => !e.isBaseline && e.changePercentage !== null
  );
  const avgElecChangePct =
    comparableElecReports.length > 0
      ? Number(
          (
            comparableElecReports.reduce(
              (acc, e) => acc + (e.changePercentage || 0),
              0
            ) / comparableElecReports.length
          ).toFixed(1)
        )
      : null;

  const comparableWaterReports = waterList.filter(
    (w) => !w.isBaseline && w.changePercentage !== null
  );
  const avgWaterChangePct =
    comparableWaterReports.length > 0
      ? Number(
          (
            comparableWaterReports.reduce(
              (acc, w) => acc + (w.changePercentage || 0),
              0
            ) / comparableWaterReports.length
          ).toFixed(1)
        )
      : null;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <section className="rounded-3xl border border-eco-200 bg-gradient-to-r from-slate-900 via-eco-900 to-sky-900 p-6 text-white shadow-lg">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-bold">
              <ShieldCheck className="h-4 w-4 text-eco-400" />
              School Dashboard & Admin CMS (18 Modules)
            </span>
            <h1 className="mt-2 text-2xl font-extrabold">
              ระบบบริหารจัดการภาพรวมโรงเรียน (Admin Management System)
            </h1>
            <p className="text-xs text-eco-100">
              จัดการผู้ใช้ ห้องเรียน เนื้อหา 5 ภารกิจ คลังข้อสอบ ตัวชี้วัดพฤติกรรม เหรียญ ระดับ และการตั้งค่าระบบผ่าน Firestore โดยไม่ต้องแก้ Source Code
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <label className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2 text-xs font-bold text-white">
              <input
                type="checkbox"
                checked={includeDemo}
                onChange={(e) => setIncludeDemo(e.target.checked)}
                className="h-4 w-4 accent-eco-400"
              />
              <span>แสดงรวมข้อมูล Demo (demo: true)</span>
            </label>

            <button
              type="button"
              onClick={handleSeedDemo}
              className="inline-flex items-center gap-1.5 rounded-xl bg-eco-500 px-3.5 py-2 text-xs font-bold text-slate-950 hover:bg-eco-400"
            >
              <Database className="h-3.5 w-3.5" />
              <span>Seed Demo Data</span>
            </button>

            <button
              type="button"
              onClick={handlePurgeDemo}
              className="inline-flex items-center gap-1.5 rounded-xl bg-red-500/80 px-3.5 py-2 text-xs font-bold text-white hover:bg-red-600"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>ล้างข้อมูล Demo</span>
            </button>
          </div>
        </div>
      </section>

      {feedback && (
        <FeedbackBanner
          type={feedback.type}
          message={feedback.message}
          onClose={() => setFeedback(null)}
        />
      )}

      {/* 18 Admin Menu Pills (Section 42) */}
      <div className="flex flex-wrap gap-1.5 rounded-2xl border border-eco-100 bg-white p-3 shadow-xs">
        {ADMIN_MENUS.map((menu) => (
          <button
            key={menu}
            type="button"
            onClick={() => setActiveMenu(menu)}
            className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
              activeMenu === menu
                ? 'bg-eco-600 text-white shadow-xs'
                : 'bg-slate-50 text-slate-700 hover:bg-eco-50 hover:text-eco-800'
            }`}
          >
            {menu}
          </button>
        ))}
      </div>

      {/* 1. SCHOOL DASHBOARD (Section 41) */}
      {activeMenu === 'Dashboard' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="rounded-2xl border border-eco-100 bg-white p-5 shadow-xs">
              <span className="text-xs font-bold text-slate-500">จำนวนผู้เรียนเข้าร่วม</span>
              <p className="mt-2 text-3xl font-extrabold text-eco-700">
                {students.length} คน
              </p>
            </div>
            <div className="rounded-2xl border border-eco-100 bg-white p-5 shadow-xs">
              <span className="text-xs font-bold text-slate-500">จำนวนห้องเรียน</span>
              <p className="mt-2 text-3xl font-extrabold text-sky-700">
                {classrooms.length} ห้อง
              </p>
            </div>
            <div className="rounded-2xl border border-eco-100 bg-white p-5 shadow-xs">
              <span className="text-xs font-bold text-slate-500">จำนวน Eco Actions</span>
              <p className="mt-2 text-3xl font-extrabold text-amber-600">
                {actions.length} รายการ
              </p>
            </div>
            <div className="rounded-2xl border border-eco-100 bg-white p-5 shadow-xs">
              <span className="text-xs font-bold text-slate-500">จำนวนภารกิจสำเร็จ</span>
              <p className="mt-2 text-3xl font-extrabold text-purple-700">
                {completedMissionsTotal} ครั้ง
              </p>
            </div>
            <div className="rounded-2xl border border-eco-100 bg-white p-5 shadow-xs">
              <span className="text-xs font-bold text-slate-500">
                ครัวเรือนที่มีข้อมูล Home Eco
              </span>
              <p className="mt-2 text-3xl font-extrabold text-emerald-700">
                {householdsWithHomeEco} ครัวเรือน
              </p>
            </div>
            <div className="rounded-2xl border border-eco-100 bg-white p-5 shadow-xs">
              <span className="text-xs font-bold text-slate-500">ขยะที่รายงานสะสม</span>
              <p className="mt-2 text-2xl font-extrabold text-slate-900">
                {totalWasteKgReported} กก.
              </p>
              <span className="text-[11px] font-semibold text-eco-700">
                {avgWasteReductionPct !== null
                  ? `เทียบ Baseline เฉลี่ยลดลง ${avgWasteReductionPct}%`
                  : 'รอข้อมูลเปรียบเทียบ Baseline'}
              </span>
            </div>
            <div className="rounded-2xl border border-eco-100 bg-white p-5 shadow-xs">
              <span className="text-xs font-bold text-slate-500">ไฟฟ้าที่รายงานสะสม</span>
              <p className="mt-2 text-2xl font-extrabold text-slate-900">
                {totalElecKwhReported} kWh
              </p>
              <span className="text-[11px] font-semibold text-amber-700">
                {avgElecChangePct !== null
                  ? `เทียบ Baseline เฉลี่ยเปลี่ยนแปลง ${avgElecChangePct}%`
                  : 'รอข้อมูลเปรียบเทียบ Baseline'}
              </span>
            </div>
            <div className="rounded-2xl border border-eco-100 bg-white p-5 shadow-xs">
              <span className="text-xs font-bold text-slate-500">น้ำประปาที่รายงานสะสม</span>
              <p className="mt-2 text-2xl font-extrabold text-slate-900">
                {totalWaterUnitsReported} หน่วย
              </p>
              <span className="text-[11px] font-semibold text-sky-700">
                {avgWaterChangePct !== null
                  ? `เทียบ Baseline เฉลี่ยเปลี่ยนแปลง ${avgWaterChangePct}%`
                  : 'รอข้อมูลเปรียบเทียบ Baseline'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 2, 3, 4. USERS / STUDENTS / TEACHERS */}
      {(activeMenu === 'Users' ||
        activeMenu === 'Students' ||
        activeMenu === 'Teachers') && (
        <div className="rounded-2xl border border-eco-100 bg-white p-6 shadow-xs space-y-4">
          <h2 className="text-base font-bold text-slate-900">
            จัดการข้อมูลผู้ใช้งาน ({activeMenu})
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-700">
                  <th className="p-3">ชื่อ-นามสกุล</th>
                  <th className="p-3">อีเมล</th>
                  <th className="p-3">รหัสนักเรียน</th>
                  <th className="p-3">บทบาท (Role)</th>
                  <th className="p-3">ห้องเรียน</th>
                  <th className="p-3">สถานะ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users
                  .filter((u) =>
                    activeMenu === 'Students'
                      ? u.role === 'student'
                      : activeMenu === 'Teachers'
                      ? u.role === 'teacher'
                      : true
                  )
                  .map((u) => (
                    <tr key={u.uid}>
                      <td className="p-3 font-bold text-slate-900">
                        {u.displayName}{' '}
                        {u.demo && (
                          <span className="ml-1 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] text-amber-800">
                            Demo
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-slate-600">{u.email}</td>
                      <td className="p-3">{u.studentCode || '-'}</td>
                      <td className="p-3">
                        <select
                          value={u.role}
                          onChange={async (e) => {
                            const updated = {
                              ...u,
                              role: e.target.value as UserProfile['role'],
                            };
                            await saveUserProfile(updated);
                            await loadAllAdminData();
                          }}
                          className="rounded-lg border border-slate-300 px-2 py-1 text-xs font-semibold"
                        >
                          <option value="student">student</option>
                          <option value="teacher">teacher</option>
                          <option value="admin">admin</option>
                        </select>
                      </td>
                      <td className="p-3">
                        {u.gradeLevel ? `${u.gradeLevel}/${u.room}` : '-'}
                      </td>
                      <td className="p-3">
                        <button
                          type="button"
                          onClick={async () => {
                            await saveUserProfile({ ...u, active: !u.active });
                            await loadAllAdminData();
                          }}
                          className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                            u.active
                              ? 'bg-eco-100 text-eco-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {u.active ? 'Active' : 'Suspended'}
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. CLASSROOMS */}
      {activeMenu === 'Classrooms' && (
        <div className="space-y-4">
          <form
            onSubmit={handleAddClassroom}
            className="rounded-2xl border border-eco-100 bg-white p-5 shadow-xs grid gap-3 sm:grid-cols-5 items-end"
          >
            <div>
              <label className="block text-xs font-bold text-slate-700">
                ชื่อห้องเรียน (เช่น ม.2/3)
              </label>
              <input
                type="text"
                value={newClassName}
                onChange={(e) => setNewClassName(e.target.value)}
                placeholder="ม.2/3"
                className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700">ระดับชั้น</label>
              <input
                type="text"
                value={newClassGrade}
                onChange={(e) => setNewClassGrade(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700">ห้อง</label>
              <input
                type="text"
                value={newClassRoom}
                onChange={(e) => setNewClassRoom(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700">ครูที่ปรึกษา</label>
              <input
                type="text"
                value={newClassTeacher}
                onChange={(e) => setNewClassTeacher(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-xs"
              />
            </div>
            <button
              type="submit"
              className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-eco-600 px-4 py-2 text-xs font-bold text-white hover:bg-eco-700"
            >
              <Plus className="h-4 w-4" />
              <span>เพิ่มห้องเรียน</span>
            </button>
          </form>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {classrooms.map((c) => (
              <div
                key={c.id}
                className="rounded-2xl border border-eco-100 bg-white p-5 shadow-xs flex items-center justify-between"
              >
                <div>
                  <h3 className="text-base font-bold text-slate-900">ห้อง {c.name}</h3>
                  <p className="text-xs text-slate-600">ครูที่ปรึกษา: {c.teacherName}</p>
                  <p className="text-xs text-slate-500">ปีการศึกษา {c.academicYear}</p>
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    await deleteClassroom(c.id);
                    await loadAllAdminData();
                  }}
                  className="rounded-lg border border-red-200 p-2 text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 6 & 7. MISSIONS & MISSION CONTENT MANAGEMENT (Section 43) */}
      {(activeMenu === 'Missions' || activeMenu === 'Mission Content') && (
        <div className="grid gap-6 lg:grid-cols-12">
          <div className="lg:col-span-4 space-y-2">
            {missions.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setEditingMission(m)}
                className={`w-full rounded-2xl border p-4 text-left transition ${
                  editingMission?.id === m.id
                    ? 'border-eco-600 bg-eco-50'
                    : 'border-slate-200 bg-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-eco-700">
                    Mission {m.order} ({m.learningPoints} pts)
                  </span>
                  <span className="text-[11px] font-bold">
                    {m.active ? 'เปิดใช้งาน' : 'ปิด'}
                  </span>
                </div>
                <p className="mt-1 text-sm font-bold text-slate-900">{m.title}</p>
              </button>
            ))}
          </div>

          {editingMission && (
            <form
              onSubmit={handleSaveMission}
              className="lg:col-span-8 rounded-2xl border border-eco-100 bg-white p-6 shadow-xs space-y-4"
            >
              <h2 className="text-base font-bold text-slate-900">
                แก้ไขเนื้อหาภารกิจ (Mission Content & Scenario Editor): {editingMission.title}
              </h2>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700">
                    ชื่อภารกิจ (Mission Title)
                  </label>
                  <input
                    type="text"
                    value={editingMission.title}
                    onChange={(e) =>
                      setEditingMission({ ...editingMission, title: e.target.value })
                    }
                    className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700">
                    คะแนนการเรียนรู้ (Points)
                  </label>
                  <input
                    type="number"
                    value={editingMission.learningPoints}
                    onChange={(e) =>
                      setEditingMission({
                        ...editingMission,
                        learningPoints: Number(e.target.value) || 50,
                      })
                    }
                    className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700">
                  สถานการณ์จำลอง (Situation Text)
                </label>
                <textarea
                  rows={3}
                  value={editingMission.situationText}
                  onChange={(e) =>
                    setEditingMission({
                      ...editingMission,
                      situationText: e.target.value,
                    })
                  }
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700">
                  เนื้อหาบทเรียน (Lesson Content Text)
                </label>
                <textarea
                  rows={3}
                  value={editingMission.learnContent.text}
                  onChange={(e) =>
                    setEditingMission({
                      ...editingMission,
                      learnContent: {
                        ...editingMission.learnContent,
                        text: e.target.value,
                      },
                    })
                  }
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700">
                  คำถามตัดสินใจ (Decide Prompt)
                </label>
                <input
                  type="text"
                  value={editingMission.decidePrompt}
                  onChange={(e) =>
                    setEditingMission({
                      ...editingMission,
                      decidePrompt: e.target.value,
                    })
                  }
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700">
                  คำถามสะท้อนคิด (Reflection Question)
                </label>
                <input
                  type="text"
                  value={editingMission.reflectionQuestion}
                  onChange={(e) =>
                    setEditingMission({
                      ...editingMission,
                      reflectionQuestion: e.target.value,
                    })
                  }
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-xs"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <label className="inline-flex items-center gap-2 text-xs font-bold text-slate-700">
                  <input
                    type="checkbox"
                    checked={editingMission.active}
                    onChange={(e) =>
                      setEditingMission({
                        ...editingMission,
                        active: e.target.checked,
                      })
                    }
                    className="h-4 w-4 accent-eco-600"
                  />
                  <span>เปิดใช้งานภารกิจนี้ (Active Status)</span>
                </label>

                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-eco-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-eco-700"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  <span>บันทึกการแก้ไขลง Firestore</span>
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* 8. QUESTION BANK (Section 44) */}
      {activeMenu === 'Question Bank' && (
        <div className="space-y-4">
          <form
            onSubmit={handleAddQuestion}
            className="rounded-2xl border border-eco-100 bg-white p-5 shadow-xs grid gap-3 sm:grid-cols-5 items-end"
          >
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700">
                ข้อความคำถามใหม่ (Question Text)
              </label>
              <input
                type="text"
                value={newQuestionText}
                onChange={(e) => setNewQuestionText(e.target.value)}
                placeholder="พิมพ์ข้อคำถาม..."
                className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700">ตอน (Section)</label>
              <select
                value={newQuestionSection}
                onChange={(e) =>
                  setNewQuestionSection(e.target.value as 'A' | 'B' | 'C')
                }
                className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-xs"
              >
                <option value="A">Section A (ความรู้)</option>
                <option value="B">Section B (เจตคติ)</option>
                <option value="C">Section C (พฤติกรรม)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700">รูปแบบคำถาม</label>
              <select
                value={newQuestionType}
                onChange={(e) =>
                  setNewQuestionType(e.target.value as Question['questionType'])
                }
                className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-xs"
              >
                <option value="rating_scale">rating_scale</option>
                <option value="multiple_choice">multiple_choice</option>
                <option value="true_false">true_false</option>
                <option value="reflection">reflection</option>
              </select>
            </div>
            <button
              type="submit"
              className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-eco-600 px-4 py-2 text-xs font-bold text-white hover:bg-eco-700"
            >
              <Plus className="h-4 w-4" />
              <span>เพิ่มคำถาม</span>
            </button>
          </form>

          <div className="rounded-2xl border border-eco-100 bg-white p-6 shadow-xs space-y-2">
            <h2 className="text-sm font-bold text-slate-900">
              คลังคำถามทั้งหมด ({questions.length} ข้อ)
            </h2>
            {questions.map((q) => (
              <div
                key={q.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 p-3 text-xs"
              >
                <div>
                  <span className="rounded bg-eco-100 px-2 py-0.5 font-bold text-eco-800 mr-2">
                    Section {q.section} • {q.questionType} ({q.score} คะแนน)
                  </span>
                  <span className="font-semibold text-slate-800">{q.questionText}</span>
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    await deleteQuestion(q.id);
                    await loadAllAdminData();
                  }}
                  className="text-red-600 hover:underline shrink-0"
                >
                  ลบ
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 9. ASSESSMENTS */}
      {activeMenu === 'Assessments' && (
        <div className="rounded-2xl border border-eco-100 bg-white p-6 shadow-xs space-y-3">
          <h2 className="text-base font-bold text-slate-900">
            ข้อมูลการทำแบบประเมิน Pre / Post-Assessment ({assessments.length} รายการ)
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b bg-slate-50">
                  <th className="p-3">นักเรียน</th>
                  <th className="p-3">ประเภท</th>
                  <th className="p-3">Section A</th>
                  <th className="p-3">Section B</th>
                  <th className="p-3">Section C</th>
                  <th className="p-3">รวม</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {assessments.map((a) => (
                  <tr key={a.id}>
                    <td className="p-3 font-bold">{a.studentName || a.studentId}</td>
                    <td className="p-3 uppercase font-bold text-eco-700">
                      {a.assessmentType}
                    </td>
                    <td className="p-3">{a.sectionScores.sectionA}</td>
                    <td className="p-3">{a.sectionScores.sectionB}</td>
                    <td className="p-3">{a.sectionScores.sectionC}</td>
                    <td className="p-3 font-extrabold">
                      {a.totalScore}/{a.maxScore} ({a.percentage}%)
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 10. BEHAVIOR INDICATORS */}
      {activeMenu === 'Behavior Indicators' && settings && (
        <div className="rounded-2xl border border-eco-100 bg-white p-6 shadow-xs space-y-4">
          <h2 className="text-base font-bold text-slate-900">
            ตัวชี้วัดพฤติกรรมรับผิดชอบต่อสิ่งแวดล้อม 5 ด้าน (Behavior Indicators)
          </h2>
          {settings.behaviorIndicators.map((bi, idx) => (
            <div key={bi.domain} className="rounded-xl border border-slate-200 p-4 space-y-2">
              <p className="text-sm font-bold text-eco-900">
                ด้านที่ {idx + 1}: {bi.label}
              </p>
              <ul className="list-disc pl-5 text-xs text-slate-700 space-y-1">
                {bi.indicators.map((ind, i) => (
                  <li key={i}>{ind}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      {/* 11, 12, 13, 14. ECO ACTIONS / WASTE / ELECTRICITY / WATER REPORTS */}
      {(activeMenu === 'Eco Actions' ||
        activeMenu === 'Waste Reports' ||
        activeMenu === 'Electricity Reports' ||
        activeMenu === 'Water Reports') && (
        <div className="rounded-2xl border border-eco-100 bg-white p-6 shadow-xs space-y-4">
          <h2 className="text-base font-bold text-slate-900">
            รายการข้อมูลในระบบ: {activeMenu}
          </h2>
          {activeMenu === 'Eco Actions' && (
            <div className="space-y-2">
              {actions.map((a) => (
                <div key={a.id} className="rounded-xl border p-3 text-xs flex justify-between">
                  <div>
                    <strong>{a.studentName || a.userId}</strong> ({a.date}): {a.note}
                  </div>
                  <span className="font-bold uppercase text-eco-700">
                    {a.teacherVerification}
                  </span>
                </div>
              ))}
            </div>
          )}
          {activeMenu === 'Waste Reports' && (
            <div className="space-y-2">
              {wasteList.map((w) => (
                <div key={w.id} className="rounded-xl border p-3 text-xs flex justify-between">
                  <span>
                    {w.userId} • {w.recordDate} ({w.isBaseline ? 'Baseline' : 'Report'})
                  </span>
                  <span className="font-bold">
                    ขยะรวม {w.totalWaste} กก. (รีไซเคิล/อินทรีย์ {w.recycledPercentage}%)
                  </span>
                </div>
              ))}
            </div>
          )}
          {activeMenu === 'Electricity Reports' && (
            <div className="space-y-2">
              {elecList.map((e) => (
                <div key={e.id} className="rounded-xl border p-3 text-xs flex justify-between">
                  <span>
                    {e.userId} • เดือน {e.billingMonth}/{e.billingYear} (
                    {e.isBaseline ? 'Baseline' : 'Report'})
                  </span>
                  <span className="font-bold">
                    {e.electricityKwh} kWh (แนวโน้ม{e.trend})
                  </span>
                </div>
              ))}
            </div>
          )}
          {activeMenu === 'Water Reports' && (
            <div className="space-y-2">
              {waterList.map((w) => (
                <div key={w.id} className="rounded-xl border p-3 text-xs flex justify-between">
                  <span>
                    {w.userId} • เดือน {w.billingMonth}/{w.billingYear} (
                    {w.isBaseline ? 'Baseline' : 'Report'})
                  </span>
                  <span className="font-bold">
                    {w.waterUnits} หน่วย (แนวโน้ม{w.trend})
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 15. BADGES (Section 32) */}
      {activeMenu === 'Badges' && (
        <div className="rounded-2xl border border-eco-100 bg-white p-6 shadow-xs space-y-4">
          <h2 className="text-base font-bold text-slate-900">
            จัดการเหรียญเกียรติยศใน Firestore (Badge Definitions)
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {badges.map((b) => (
              <div key={b.id} className="rounded-xl border border-slate-200 p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-slate-900">
                    {b.nameTh} ({b.name})
                  </span>
                  <Award className="h-5 w-5 text-amber-500" />
                </div>
                <p className="text-xs text-slate-600">{b.description}</p>
                <div className="flex items-center gap-2 text-xs">
                  <span>เกณฑ์ปลดล็อก ({b.requirementType}):</span>
                  <input
                    type="number"
                    value={b.requirementValue}
                    onChange={async (e) => {
                      const updated = {
                        ...b,
                        requirementValue: Number(e.target.value) || 1,
                      };
                      await saveBadgeDefinition(updated);
                      await loadAllAdminData();
                    }}
                    className="w-20 rounded border px-2 py-1"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 16. LEVELS (Section 33) */}
      {activeMenu === 'Levels' && (
        <div className="rounded-2xl border border-eco-100 bg-white p-6 shadow-xs space-y-4">
          <h2 className="text-base font-bold text-slate-900">
            จัดการเกณฑ์ระดับผู้พิทักษ์ใน Firestore (Level Criteria)
          </h2>
          <div className="space-y-3">
            {levels.map((l) => (
              <div
                key={l.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 p-4 text-xs"
              >
                <div>
                  <span className="font-bold text-eco-800">
                    Level {l.level}: {l.titleEn} ({l.titleTh})
                  </span>
                  <p className="text-slate-600">{l.description}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span>คะแนนขั้นต่ำ:</span>
                  <input
                    type="number"
                    value={l.minPoints}
                    onChange={async (e) => {
                      await saveLevelDefinition({
                        ...l,
                        minPoints: Number(e.target.value) || 0,
                      });
                      await loadAllAdminData();
                    }}
                    className="w-24 rounded border px-2 py-1 font-bold"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 17. REPORTS (Section 51) */}
      {activeMenu === 'Reports' && (
        <div className="rounded-2xl border border-eco-100 bg-white p-6 shadow-xs space-y-4">
          <h2 className="text-base font-bold text-slate-900">
            ศูนย์ส่งออกรายงานทั้ง 9 ประเภท (CSV และ PDF)
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {REPORT_TYPES_META.map((rep) => (
              <div
                key={rep.key}
                className="rounded-2xl border border-slate-200 p-4 space-y-3"
              >
                <p className="text-xs font-bold text-slate-900">{rep.title}</p>
                <p className="text-xs text-slate-600">{rep.description}</p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => exportReportAsCsv(rep.key as ReportType, includeDemo)}
                    className="inline-flex flex-1 items-center justify-center gap-1 rounded-xl bg-eco-600 px-3 py-2 text-xs font-bold text-white hover:bg-eco-700"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>CSV</span>
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      exportReportAsPrintablePdf(rep.key as ReportType, includeDemo)
                    }
                    className="inline-flex items-center justify-center gap-1 rounded-xl border border-slate-300 px-3 py-2 text-xs font-bold text-slate-700"
                  >
                    <Printer className="h-3.5 w-3.5" />
                    <span>PDF</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 18. SETTINGS */}
      {activeMenu === 'Settings' && settings && (
        <form
          onSubmit={handleSaveSettings}
          className="rounded-2xl border border-eco-100 bg-white p-6 shadow-xs space-y-4"
        >
          <h2 className="text-base font-bold text-slate-900">
            ตั้งค่าระบบ (System Settings)
          </h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold text-slate-700">
                ชื่อสถานศึกษา
              </label>
              <input
                type="text"
                value={settings.schoolName}
                onChange={(e) =>
                  setSettings({ ...settings, schoolName: e.target.value })
                }
                className="mt-1 w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700">
                ปีการศึกษา
              </label>
              <input
                type="text"
                value={settings.academicYear}
                onChange={(e) =>
                  setSettings({ ...settings, academicYear: e.target.value })
                }
                className="mt-1 w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700">
                ค่าเริ่มต้นระยะเวลาแผน Eco Action Plan (7 หรือ 14 วัน)
              </label>
              <select
                value={settings.defaultActionPlanDays}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    defaultActionPlanDays: Number(e.target.value) === 7 ? 7 : 14,
                  })
                }
                className="mt-1 w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm"
              >
                <option value={7}>7 วัน</option>
                <option value={14}>14 วัน</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700">
                ระยะเวลาติดตามผล Follow-up (วัน - ค่าเริ่มต้น 30 วัน)
              </label>
              <input
                type="number"
                value={settings.followUpDays}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    followUpDays: Number(e.target.value) || 30,
                  })
                }
                className="mt-1 w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm"
              />
            </div>
          </div>

          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-xl bg-eco-600 px-6 py-3 text-sm font-bold text-white hover:bg-eco-700"
          >
            <RefreshCw className="h-4 w-4" />
            <span>บันทึกการตั้งค่าระบบ</span>
          </button>
        </form>
      )}
    </div>
  );
};

