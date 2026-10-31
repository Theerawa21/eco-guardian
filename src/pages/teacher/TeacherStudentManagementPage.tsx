import React, { useEffect, useState } from 'react';
import {
  BookOpen,
  ClipboardCheck,
  Flame,
  Home,
  Search,
  UserCheck,
  Users,
} from 'lucide-react';
import { Classroom, UserProfile } from '../../types';
import { getAllUsers, getClassrooms } from '../../services/firestore/ecoDataService';
import { useStudentEcoState } from '../../hooks/useStudentEcoState';
import { LoadingState } from '../../components/ui/StateViews';
import { getHomeEcoTrendStatement } from '../../utils';

export const TeacherStudentManagementPage: React.FC = () => {
  const [students, setStudents] = useState<UserProfile[]>([]);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClassId, setSelectedClassId] = useState<string>('all');
  const [selectedStudent, setSelectedStudent] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [uList, cList] = await Promise.all([
          getAllUsers(true),
          getClassrooms(),
        ]);
        const onlyStudents = uList.filter((u) => u.role === 'student');
        setStudents(onlyStudents);
        setClassrooms(cList);
        if (onlyStudents.length > 0) {
          setSelectedStudent(onlyStudents[0]);
        }
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const studentState = useStudentEcoState(selectedStudent?.uid);

  if (loading) {
    return <LoadingState message="กำลังโหลดรายชื่อนักเรียนและห้องเรียน..." />;
  }

  const filteredStudents = students.filter((s) => {
    const matchesClass =
      selectedClassId === 'all' || s.classId === selectedClassId;
    const q = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !q ||
      s.displayName.toLowerCase().includes(q) ||
      (s.studentCode || '').toLowerCase().includes(q) ||
      s.email.toLowerCase().includes(q);
    return matchesClass && matchesSearch;
  });

  const latestWaste = studentState.wasteRecords.filter((w) => !w.isBaseline).slice(-1)[0];
  const latestElec = studentState.electricityRecords.filter((e) => !e.isBaseline).slice(-1)[0];
  const latestWater = studentState.waterRecords.filter((w) => !w.isBaseline).slice(-1)[0];

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-eco-200 bg-white p-6 shadow-xs">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex items-start gap-3.5">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-sky-100 text-sky-700">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-slate-900">
                จัดการและติดตามผู้เรียนรายบุคคล (Student Management)
              </h1>
              <p className="text-xs text-slate-600">
                ค้นหานักเรียน กรองตามห้องเรียน และตรวจสอบความก้าวหน้าครบทั้ง 6 มิติ
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ค้นหาชื่อ หรือรหัสนักเรียน..."
                className="rounded-xl border border-slate-300 py-2 pl-9 pr-3 text-xs"
              />
            </div>

            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="rounded-xl border border-slate-300 px-3 py-2 text-xs font-semibold"
            >
              <option value="all">ทุกห้องเรียน ({students.length} คน)</option>
              {classrooms.map((c) => (
                <option key={c.id} value={c.id}>
                  ห้อง {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left Student Roster */}
        <div className="lg:col-span-4 rounded-2xl border border-eco-100 bg-white p-4 shadow-xs space-y-2 max-h-[680px] overflow-y-auto">
          <h2 className="px-2 py-1 text-xs font-bold uppercase text-slate-500">
            รายชื่อนักเรียน ({filteredStudents.length} คน)
          </h2>
          {filteredStudents.map((st) => {
            const active = selectedStudent?.uid === st.uid;
            return (
              <button
                key={st.uid}
                type="button"
                onClick={() => setSelectedStudent(st)}
                className={`flex w-full items-center justify-between rounded-xl p-3 text-left transition ${
                  active
                    ? 'bg-eco-600 text-white shadow-xs'
                    : 'hover:bg-eco-50 text-slate-800'
                }`}
              >
                <div>
                  <p className="text-xs font-bold">{st.displayName}</p>
                  <p
                    className={`text-[11px] ${
                      active ? 'text-eco-100' : 'text-slate-500'
                    }`}
                  >
                    รหัส: {st.studentCode || '-'} • ชั้น {st.gradeLevel}/{st.room}
                  </p>
                </div>
                <span
                  className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${
                    active ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  ดูข้อมูล
                </span>
              </button>
            );
          })}
        </div>

        {/* Right Student 360-Degree Inspector (Section 39) */}
        <div className="lg:col-span-8 space-y-4">
          {!selectedStudent ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
              กรุณาเลือกนักเรียนจากรายชื่อด้านซ้ายเพื่อดูรายละเอียด
            </div>
          ) : studentState.loading ? (
            <LoadingState message={`กำลังโหลดข้อมูลของ ${selectedStudent.displayName}...`} />
          ) : (
            <>
              {/* 1. Profile Header */}
              <div className="rounded-2xl border border-eco-200 bg-white p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
                <div>
                  <span className="rounded-md bg-eco-100 px-2.5 py-0.5 text-xs font-bold text-eco-800">
                    รหัส: {selectedStudent.studentCode || 'N/A'} • ชั้น{' '}
                    {selectedStudent.gradeLevel}/{selectedStudent.room}
                  </span>
                  <h2 className="mt-1 text-lg font-extrabold text-slate-900">
                    {selectedStudent.displayName}
                  </h2>
                  <p className="text-xs text-slate-500">{selectedStudent.email}</p>
                </div>
                <div className="flex gap-3 text-center">
                  <div className="rounded-xl bg-sky-50 px-3.5 py-2">
                    <span className="block text-[10px] font-bold text-sky-700">
                      Learning Points
                    </span>
                    <span className="text-lg font-extrabold text-sky-900">
                      {studentState.learningPoints}
                    </span>
                  </div>
                  <div className="rounded-xl bg-eco-50 px-3.5 py-2">
                    <span className="block text-[10px] font-bold text-eco-700">
                      Action Points
                    </span>
                    <span className="text-lg font-extrabold text-eco-900">
                      {studentState.actionPoints}
                    </span>
                  </div>
                </div>
              </div>

              {/* 2. Assessment & Mission Progress */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-eco-100 bg-white p-5 shadow-xs space-y-2">
                  <h3 className="flex items-center gap-2 text-xs font-bold text-slate-800">
                    <ClipboardCheck className="h-4 w-4 text-sky-600" />
                    ผลแบบประเมิน (Assessment)
                  </h3>
                  <p className="text-xs text-slate-700">
                    <strong>Pre-Assessment:</strong>{' '}
                    {studentState.preAssessment
                      ? `${studentState.preAssessment.totalScore}/${studentState.preAssessment.maxScore} (${studentState.preAssessment.percentage}%)`
                      : 'ยังไม่ได้ทำ'}
                  </p>
                  <p className="text-xs text-slate-700">
                    <strong>Post-Assessment:</strong>{' '}
                    {studentState.postAssessment
                      ? `${studentState.postAssessment.totalScore}/${studentState.postAssessment.maxScore} (${studentState.postAssessment.percentage}%)`
                      : 'ยังไม่ได้ทำ'}
                  </p>
                </div>

                <div className="rounded-2xl border border-eco-100 bg-white p-5 shadow-xs space-y-2">
                  <h3 className="flex items-center gap-2 text-xs font-bold text-slate-800">
                    <BookOpen className="h-4 w-4 text-purple-600" />
                    ความก้าวหน้าภารกิจ (Mission Progress)
                  </h3>
                  <p className="text-xs text-slate-700">
                    ผ่านแล้ว{' '}
                    <strong>
                      {
                        studentState.missionProgress.filter(
                          (m) => m.status === 'completed'
                        ).length
                      }
                      /5
                    </strong>{' '}
                    ภารกิจ
                  </p>
                  <p className="text-xs text-slate-600 truncate">
                    เป้าหมายพฤติกรรม: {studentState.commitment?.what || 'ยังไม่ได้ระบุ'}
                  </p>
                </div>
              </div>

              {/* 3. Home Eco Summary */}
              <div className="rounded-2xl border border-eco-100 bg-white p-5 shadow-xs space-y-2">
                <h3 className="flex items-center gap-2 text-xs font-bold text-slate-800">
                  <Home className="h-4 w-4 text-eco-600" />
                  ข้อมูลสิ่งแวดล้อมครัวเรือน (Home Eco Data)
                </h3>
                <div className="grid gap-3 sm:grid-cols-3 text-xs">
                  <div className="rounded-xl bg-slate-50 p-3">
                    <span className="font-bold text-slate-700">ขยะครัวเรือน:</span>
                    <p className="mt-0.5 text-slate-600">
                      {
                        getHomeEcoTrendStatement(
                          'waste',
                          latestWaste?.trend,
                          studentState.hasBaseline
                        ).shortBadge
                      }{' '}
                      ({latestWaste ? `${latestWaste.totalWaste} กก.` : 'รอข้อมูล'})
                    </p>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-3">
                    <span className="font-bold text-slate-700">ไฟฟ้าครัวเรือน:</span>
                    <p className="mt-0.5 text-slate-600">
                      {
                        getHomeEcoTrendStatement(
                          'electricity',
                          latestElec?.trend,
                          studentState.hasBaseline
                        ).shortBadge
                      }{' '}
                      ({latestElec ? `${latestElec.electricityKwh} kWh` : 'รอข้อมูล'})
                    </p>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-3">
                    <span className="font-bold text-slate-700">น้ำประปาครัวเรือน:</span>
                    <p className="mt-0.5 text-slate-600">
                      {
                        getHomeEcoTrendStatement(
                          'water',
                          latestWater?.trend,
                          studentState.hasBaseline
                        ).shortBadge
                      }{' '}
                      ({latestWater ? `${latestWater.waterUnits} หน่วย` : 'รอข้อมูล'})
                    </p>
                  </div>
                </div>
              </div>

              {/* 4. Eco Action & Teacher Observations */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-eco-100 bg-white p-5 shadow-xs space-y-2">
                  <h3 className="flex items-center gap-2 text-xs font-bold text-slate-800">
                    <Flame className="h-4 w-4 text-amber-600" />
                    การลงมือทำ (Eco Action Records: {studentState.actionRecords.length})
                  </h3>
                  <div className="space-y-1.5 max-h-40 overflow-y-auto">
                    {studentState.actionRecords.slice(0, 4).map((r) => (
                      <div key={r.id} className="rounded-lg bg-slate-50 p-2 text-xs">
                        <span className="font-bold">{r.date}:</span> {r.note} (
                        {r.teacherVerification})
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl border border-eco-100 bg-white p-5 shadow-xs space-y-2">
                  <h3 className="flex items-center gap-2 text-xs font-bold text-slate-800">
                    <UserCheck className="h-4 w-4 text-eco-600" />
                    ผลการสังเกตโดยครู (Teacher Observation)
                  </h3>
                  <div className="space-y-1.5 max-h-40 overflow-y-auto">
                    {studentState.teacherObservations.map((o) => (
                      <div key={o.id} className="rounded-lg bg-slate-50 p-2 text-xs">
                        <span className="font-bold uppercase">
                          [{o.assessmentPeriod}] {o.totalScore}/25 คะแนน:
                        </span>{' '}
                        {o.comment}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

