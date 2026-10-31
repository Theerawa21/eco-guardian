import {
  ActionPlan,
  ActionRecord,
  AssessmentResponse,
  BehaviorCommitment,
  Classroom,
  ElectricityRecord,
  FollowUpRecord,
  MissionProgress,
  MissionResponse,
  PointTransaction,
  TeacherObservation,
  UserBadge,
  UserProfile,
  WasteRecord,
  WaterRecord,
} from '../../types';
import {
  DEFAULT_BADGES,
  DEFAULT_LEVELS,
  DEFAULT_MISSIONS,
  DEFAULT_QUESTIONS,
  DEFAULT_SYSTEM_SETTINGS,
} from '../../constants';
import {
  COLLECTIONS,
  deleteDocument,
  listDocuments,
  setDocument,
} from './collections';
import { saveMission } from './ecoDataService';

export const DEMO_ACCOUNTS = {
  student: {
    uid: 'demo-student-01',
    email: 'student01@ecoguardian.edu',
    password: 'Password123!',
    label: 'นักเรียนต้นแบบ: ด.ญ.พิมชนก รักษ์พงไพร (ม.2/1)',
  },
  teacher: {
    uid: 'demo-teacher-01',
    email: 'teacher01@ecoguardian.edu',
    password: 'Password123!',
    label: 'ครูที่ปรึกษา: ครูกานต์พิชชา สายชล (ม.2/1)',
  },
  admin: {
    uid: 'demo-admin-01',
    email: 'admin@ecoguardian.edu',
    password: 'Password123!',
    label: 'ผู้ดูแลระบบ: ดร.ธนภัทร พิทักษ์โลก (Admin)',
  },
};

let initialSeedCompleted = false;

export async function ensureSystemMasterData(): Promise<void> {
  if (initialSeedCompleted) return;
  initialSeedCompleted = true;

  const existingUsers = await listDocuments<UserProfile>(COLLECTIONS.USERS);
  if (existingUsers.length === 0) {
    await seedFullDemoDataset();
  }
}

export async function seedFullDemoDataset(): Promise<{
  studentsCount: number;
  teachersCount: number;
  adminsCount: number;
  classroomsCount: number;
  missionsCount: number;
}> {
  const now = new Date().toISOString();

  // 1. System Settings, Levels, Badges, Questions, Missions
  await setDocument(COLLECTIONS.SYSTEM_SETTINGS, 'global', DEFAULT_SYSTEM_SETTINGS);

  for (const lvl of DEFAULT_LEVELS) {
    await setDocument(COLLECTIONS.LEVELS, lvl.id, lvl);
  }
  for (const badge of DEFAULT_BADGES) {
    await setDocument(COLLECTIONS.BADGES, badge.id, badge);
  }
  for (const q of DEFAULT_QUESTIONS) {
    await setDocument(COLLECTIONS.QUESTIONS, q.id, { ...q, demo: true });
  }
  for (const m of DEFAULT_MISSIONS) {
    await saveMission({ ...m, demo: true });
  }

  // 2. Classrooms (2 ห้อง)
  const classrooms: Classroom[] = [
    {
      id: 'class-m2-1',
      name: 'ม.2/1',
      gradeLevel: 'ม.2',
      room: '1',
      academicYear: '2569',
      teacherId: 'demo-teacher-01',
      teacherName: 'ครูกานต์พิชชา สายชล',
      demo: true,
      createdAt: now,
    },
    {
      id: 'class-m2-2',
      name: 'ม.2/2',
      gradeLevel: 'ม.2',
      room: '2',
      academicYear: '2569',
      teacherId: 'demo-teacher-02',
      teacherName: 'ครูณัฐพงศ์ พงศ์พนา',
      demo: true,
      createdAt: now,
    },
  ];
  for (const c of classrooms) {
    await setDocument(COLLECTIONS.CLASSROOMS, c.id, c);
  }

  // 3. Admin (1 คน) & Teachers (2 คน)
  const adminUser: UserProfile = {
    uid: 'demo-admin-01',
    email: 'admin@ecoguardian.edu',
    studentCode: null,
    firstName: 'ธนภัทร',
    lastName: 'พิทักษ์โลก',
    displayName: 'ดร.ธนภัทร พิทักษ์โลก',
    role: 'admin',
    classId: null,
    avatarUrl: null,
    active: true,
    demo: true,
    createdAt: now,
    updatedAt: now,
  };

  const teachers: UserProfile[] = [
    {
      uid: 'demo-teacher-01',
      email: 'teacher01@ecoguardian.edu',
      studentCode: null,
      firstName: 'กานต์พิชชา',
      lastName: 'สายชล',
      displayName: 'ครูกานต์พิชชา สายชล',
      role: 'teacher',
      classId: 'class-m2-1',
      gradeLevel: 'ม.2',
      room: '1',
      avatarUrl: null,
      active: true,
      demo: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      uid: 'demo-teacher-02',
      email: 'teacher02@ecoguardian.edu',
      studentCode: null,
      firstName: 'ณัฐพงศ์',
      lastName: 'พงศ์พนา',
      displayName: 'ครูณัฐพงศ์ พงศ์พนา',
      role: 'teacher',
      classId: 'class-m2-2',
      gradeLevel: 'ม.2',
      room: '2',
      avatarUrl: null,
      active: true,
      demo: true,
      createdAt: now,
      updatedAt: now,
    },
  ];

  await setDocument(COLLECTIONS.USERS, adminUser.uid, adminUser);
  for (const t of teachers) {
    await setDocument(COLLECTIONS.USERS, t.uid, t);
  }

  // 4. Students (10 คน)
  const studentNames = [
    { first: 'พิมชนก', last: 'รักษ์พงไพร', code: '69201', classId: 'class-m2-1', room: '1' },
    { first: 'ปุณณวิช', last: 'สายธารธรรม', code: '69202', classId: 'class-m2-1', room: '1' },
    { first: 'ชญานิศ', last: 'เจริญสุข', code: '69203', classId: 'class-m2-1', room: '1' },
    { first: 'ธนกร', last: 'วรโชติ', code: '69204', classId: 'class-m2-1', room: '1' },
    { first: 'ณัฐณิชา', last: 'ร่มเย็น', code: '69205', classId: 'class-m2-1', room: '1' },
    { first: 'กิตติภพ', last: 'แสงอรุณ', code: '69206', classId: 'class-m2-2', room: '2' },
    { first: 'ภัทรานิษฐ์', last: 'สมบูรณ์ผล', code: '69207', classId: 'class-m2-2', room: '2' },
    { first: 'ศุภกร', last: 'เมฆาใส', code: '69208', classId: 'class-m2-2', room: '2' },
    { first: 'อัญชิสา', last: 'พฤกษาชาติ', code: '69209', classId: 'class-m2-2', room: '2' },
    { first: 'ภูมิภัทร', last: 'ใจดี', code: '69210', classId: 'class-m2-2', room: '2' },
  ];

  for (let i = 0; i < studentNames.length; i++) {
    const s = studentNames[i];
    const indexStr = String(i + 1).padStart(2, '0');
    const uid = `demo-student-${indexStr}`;

    const studentProfile: UserProfile = {
      uid,
      email: `student${indexStr}@ecoguardian.edu`,
      studentCode: s.code,
      firstName: s.first,
      lastName: s.last,
      displayName: `${s.first} ${s.last}`,
      role: 'student',
      classId: s.classId,
      gradeLevel: 'ม.2',
      room: s.room,
      avatarUrl: null,
      active: true,
      demo: true,
      createdAt: now,
      updatedAt: now,
    };

    await setDocument(COLLECTIONS.USERS, uid, studentProfile);

    // Pre-Assessment for all 10 students
    const preId = `assess_${uid}_pre`;
    const preScoreBase = 52 + (i % 5) * 3;
    const preAssessment: AssessmentResponse = {
      id: preId,
      studentId: uid,
      studentName: studentProfile.displayName,
      classId: s.classId,
      assessmentType: 'pre',
      itemScores: { 'q-a1': 2, 'q-a2': 2, 'q-a3': 2, 'q-a4': 2 },
      answers: {},
      sectionScores: {
        sectionA: 8,
        sectionB: 16,
        sectionC: preScoreBase - 24,
      },
      domainScores: {
        waste_management: 6,
        energy_water_saving: 6,
        responsible_consumption: 6,
        common_environment_care: 5 + (i % 2),
        environmental_citizenship: 5 + (i % 3),
      },
      totalScore: preScoreBase,
      maxScore: 85,
      percentage: Number(((preScoreBase / 85) * 100).toFixed(1)),
      demo: true,
      createdAt: '2026-09-01T09:00:00.000Z',
    };
    await setDocument(COLLECTIONS.ASSESSMENT_RESPONSES, preId, preAssessment);

    // Post-Assessment for first 7 students
    if (i < 7) {
      const postId = `assess_${uid}_post`;
      const postScoreBase = 71 + (i % 4) * 3;
      const postAssessment: AssessmentResponse = {
        id: postId,
        studentId: uid,
        studentName: studentProfile.displayName,
        classId: s.classId,
        assessmentType: 'post',
        itemScores: { 'q-a1': 2, 'q-a2': 2, 'q-a3': 2, 'q-a4': 2, 'q-a5': 2 },
        answers: {},
        sectionScores: {
          sectionA: 10,
          sectionB: 22,
          sectionC: postScoreBase - 32,
        },
        domainScores: {
          waste_management: 9,
          energy_water_saving: 8,
          responsible_consumption: 8,
          common_environment_care: 8,
          environmental_citizenship: 8,
        },
        totalScore: postScoreBase,
        maxScore: 85,
        percentage: Number(((postScoreBase / 85) * 100).toFixed(1)),
        demo: true,
        createdAt: '2026-10-15T10:00:00.000Z',
      };
      await setDocument(COLLECTIONS.ASSESSMENT_RESPONSES, postId, postAssessment);
    }

    // Missions completed (5 missions for first 6 students, 3 missions for others)
    const missionsCount = i < 6 ? 5 : 3;
    for (let mIdx = 0; mIdx < missionsCount; mIdx++) {
      const mission = DEFAULT_MISSIONS[mIdx];
      const progId = `mprog_${uid}_${mission.id}`;
      const prog: MissionProgress = {
        id: progId,
        userId: uid,
        missionId: mission.id,
        missionOrder: mission.order,
        status: 'completed',
        completedAt: `2026-09-0${mIdx + 2}T14:00:00.000Z`,
        demo: true,
      };
      await setDocument(COLLECTIONS.MISSION_PROGRESS, progId, prog);

      const respId = `mresp_${uid}_${mission.id}`;
      const resp: MissionResponse = {
        id: respId,
        userId: uid,
        missionId: mission.id,
        selectedChoiceId: mission.choices.find((c) => c.isOptimal)?.id || mission.choices[0].id,
        impactScores: { people: 92, society: 90, planet: 94 },
        reflection: `ได้เรียนรู้ความสำคัญของ ${mission.title} และนำกลับไปปรับใช้ร่วมกับครอบครัวที่บ้าน`,
        pointsEarned: mission.learningPoints,
        demo: true,
        createdAt: `2026-09-0${mIdx + 2}T14:00:00.000Z`,
      };
      await setDocument(COLLECTIONS.MISSION_RESPONSES, respId, resp);

      const txId = `tx_${uid}_mission_${mission.id}`;
      const tx: PointTransaction = {
        id: txId,
        userId: uid,
        type: 'learning',
        points: mission.learningPoints,
        sourceType: 'mission',
        sourceId: mission.id,
        reason: `ผ่านภารกิจ ${mission.title}`,
        demo: true,
        createdAt: `2026-09-0${mIdx + 2}T14:00:00.000Z`,
      };
      await setDocument(COLLECTIONS.POINT_TRANSACTIONS, txId, tx);
    }

    // Behavior Commitment & Action Plan
    const commitId = `commit_${uid}`;
    const commitment: BehaviorCommitment = {
      id: commitId,
      userId: uid,
      category: i % 2 === 0 ? 'Waste' : 'Energy',
      what:
        i % 2 === 0
          ? 'คัดแยกขยะอินทรีย์และขยะรีไซเคิลออกจากขยะทั่วไปทุกวันหลังมื้อเย็น'
          : 'ปิดสวิตช์ไฟ ถอดปลั๊กพัดลม และตั้งเครื่องปรับอากาศที่ 26 องศาเซลเซียสทุกวัน',
      when: 'ทุกวัน เวลา 18.30 - 20.00 น.',
      where: 'ที่บ้านและห้องเรียน',
      how: 'ตั้งถังแยกขยะชัดเจนในครัว และตรวจเช็กสวิตช์ไฟก่อนออกจากห้องทุกครั้ง',
      reason: 'ต้องการลดภาระขยะและพลังงานของครอบครัวเพื่อดูแลบ้านส่วนรวม',
      startDate: '2026-09-10',
      demo: true,
      createdAt: '2026-09-10T08:00:00.000Z',
    };
    await setDocument(COLLECTIONS.BEHAVIOR_COMMITMENTS, commitId, commitment);

    const planId = `plan_${uid}_01`;
    const plan: ActionPlan = {
      id: planId,
      userId: uid,
      title:
        i % 2 === 0
          ? 'ภารกิจ 14 วัน คัดแยกขยะต้นทางและพกกระบอกน้ำ'
          : 'ภารกิจ 14 วัน บ้านประหยัดไฟและน้ำอย่างรู้คุณค่า',
      category: i % 2 === 0 ? 'Waste' : 'Energy',
      goal: 'ปฏิบัติต่อเนื่องครบ 14 วันและลดการใช้ทรัพยากรในบ้านอย่างน้อย 10%',
      behavior: commitment.what,
      reason: commitment.reason,
      startDate: '2026-09-10',
      endDate: '2026-09-23',
      targetDays: 14,
      indicator: 'จำนวนวันที่คัดแยกขยะและจำนวนชิ้นพลาสติกที่ลดได้',
      evidenceMethod: 'ภาพถ่ายจุดคัดแยกขยะในบ้านและการบันทึกผลรายวัน',
      status: 'active',
      demo: true,
      createdAt: '2026-09-10T08:30:00.000Z',
    };
    await setDocument(COLLECTIONS.ACTION_PLANS, planId, plan);

    // Daily Action Records (5 days for student 01, 2 days for others)
    const daysToSeed = i === 0 ? 5 : 2;
    for (let d = 1; d <= daysToSeed; d++) {
      const dateStr = `2026-10-${String(25 + d).padStart(2, '0')}`;
      const recId = `actrec_${uid}_${planId}_${dateStr}`;
      const isPending = d === daysToSeed;
      const rec: ActionRecord = {
        id: recId,
        userId: uid,
        studentName: studentProfile.displayName,
        classId: s.classId,
        actionPlanId: planId,
        actionPlanTitle: plan.title,
        date: dateStr,
        status: 'completed',
        quantity: 4 + (d % 3),
        unit: i % 2 === 0 ? 'ชิ้น/ถุงที่แยกได้' : 'จุดที่ปิดไฟ/ถอดปลั๊ก',
        note: `ปฏิบัติภารกิจวันที่ ${d} ร่วมกับคุณแม่และน้องที่บ้านเรียบร้อย`,
        obstacle: 'ไม่มีอุปสรรค',
        reflection: 'เมื่อจัดจุดแยกขยะให้ชัดเจน สมาชิกในบ้านให้ความร่วมมือดีขึ้นมาก',
        evidenceUrl:
          'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&w=800&q=80',
        teacherVerification: isPending ? 'pending' : 'approved',
        teacherComment: isPending
          ? undefined
          : 'มีความตั้งใจและปฏิบัติอย่างต่อเนื่องดีมาก ขอชื่นชมครับ/ค่ะ',
        verifiedBy: isPending ? undefined : 'demo-teacher-01',
        verifiedAt: isPending ? undefined : `${dateStr}T16:00:00.000Z`,
        demo: true,
        createdAt: `${dateStr}T12:00:00.000Z`,
      };
      await setDocument(COLLECTIONS.ACTION_RECORDS, recId, rec);

      const actTxId = `tx_${uid}_action_checkin_${recId}`;
      await setDocument(COLLECTIONS.POINT_TRANSACTIONS, actTxId, {
        id: actTxId,
        userId: uid,
        type: 'action',
        points: isPending ? 15 : 40,
        sourceType: 'action_checkin',
        sourceId: recId,
        reason: `บันทึกปฏิบัติการรายวัน (${dateStr})`,
        demo: true,
        createdAt: `${dateStr}T12:00:00.000Z`,
      } satisfies PointTransaction);
    }

    // Home Eco Baseline & Periodic Reports (Waste, Electricity, Water)
    const baseWasteTotal = Number((8.5 + (i % 3) * 0.8).toFixed(2));
    const currentWasteTotal = Number((baseWasteTotal * 0.78).toFixed(2));
    const wasteReduction = Number((baseWasteTotal - currentWasteTotal).toFixed(2));
    const wasteReductionPct = Number(((wasteReduction / baseWasteTotal) * 100).toFixed(1));

    const wasteBaseline: WasteRecord = {
      id: `waste_base_${uid}`,
      userId: uid,
      isBaseline: true,
      recordDate: '2026-09-02',
      collectionPeriod: '7 วัน (ก่อนเริ่มภารกิจ)',
      unit: 'กิโลกรัม (kg)',
      generalWasteKg: 3.5,
      recyclableWasteKg: 1.5,
      organicWasteKg: 2.5,
      plasticWasteKg: Number((baseWasteTotal - 7.5).toFixed(2)),
      otherWasteKg: 0,
      totalWaste: baseWasteTotal,
      recycledPercentage: 47.1,
      wasteReduction: null,
      wasteReductionPercentage: null,
      trend: 'คงที่',
      note: 'ข้อมูลพื้นฐานขยะครัวเรือนก่อนเริ่มกิจกรรม',
      evidenceUrl: null,
      demo: true,
      createdAt: '2026-09-02T10:00:00.000Z',
    };
    const wasteReport1: WasteRecord = {
      id: `waste_${uid}_2026-10-15`,
      userId: uid,
      isBaseline: false,
      recordDate: '2026-10-15',
      unit: 'กิโลกรัม (kg)',
      generalWasteKg: 1.8,
      recyclableWasteKg: 2.2,
      organicWasteKg: 2.1,
      plasticWasteKg: Number(Math.max(0.3, currentWasteTotal - 6.1).toFixed(2)),
      otherWasteKg: 0,
      totalWaste: currentWasteTotal,
      recycledPercentage: 65.2,
      wasteReduction,
      wasteReductionPercentage: wasteReductionPct,
      trend: 'ลดลง',
      note: 'แยกขยะรีไซเคิลและนำเศษอาหารไปทำปุ๋ยหมักต้นไม้',
      evidenceUrl: null,
      demo: true,
      createdAt: '2026-10-15T10:00:00.000Z',
    };
    await setDocument(COLLECTIONS.WASTE_RECORDS, wasteBaseline.id, wasteBaseline);
    await setDocument(COLLECTIONS.WASTE_RECORDS, wasteReport1.id, wasteReport1);

    const baseKwh = 240 + i * 8;
    const nextKwh = Math.round(baseKwh * 0.91);
    const diffKwh = nextKwh - baseKwh;
    const pctKwh = Number(((diffKwh / baseKwh) * 100).toFixed(1));

    const elecBase: ElectricityRecord = {
      id: `elec_base_${uid}`,
      userId: uid,
      isBaseline: true,
      billingMonth: 8,
      billingYear: 2569,
      electricityKwh: baseKwh,
      householdMembers: 4,
      recordDate: '2026-09-02',
      previousKwh: null,
      differenceKwh: null,
      changePercentage: null,
      trend: 'คงที่',
      note: 'ข้อมูลพื้นฐานการใช้ไฟฟ้าเดือนสิงหาคม 2569',
      evidenceUrl: null,
      demo: true,
      createdAt: '2026-09-02T10:00:00.000Z',
    };
    const elecRep1: ElectricityRecord = {
      id: `elec_${uid}_2569_9`,
      userId: uid,
      isBaseline: false,
      billingMonth: 9,
      billingYear: 2569,
      electricityKwh: nextKwh,
      householdMembers: 4,
      recordDate: '2026-10-05',
      previousKwh: baseKwh,
      differenceKwh: diffKwh,
      changePercentage: pctKwh,
      trend: 'ลดลง',
      note: 'ปรับแอร์ที่ 26 องศาเซลเซียสและถอดปลั๊กเครื่องใช้ไฟฟ้าที่ไม่ใช้งาน',
      evidenceUrl: null,
      demo: true,
      createdAt: '2026-10-05T10:00:00.000Z',
    };
    await setDocument(COLLECTIONS.ELECTRICITY_RECORDS, elecBase.id, elecBase);
    await setDocument(COLLECTIONS.ELECTRICITY_RECORDS, elecRep1.id, elecRep1);

    const baseWater = 18 + (i % 4);
    const nextWater = Math.max(12, baseWater - 2);
    const diffWater = nextWater - baseWater;
    const pctWater = Number(((diffWater / baseWater) * 100).toFixed(1));

    const waterBase: WaterRecord = {
      id: `water_base_${uid}`,
      userId: uid,
      isBaseline: true,
      billingMonth: 8,
      billingYear: 2569,
      waterUnits: baseWater,
      householdMembers: 4,
      recordDate: '2026-09-02',
      previousUnits: null,
      difference: null,
      changePercentage: null,
      trend: 'คงที่',
      note: 'ข้อมูลพื้นฐานการใช้น้ำเดือนสิงหาคม 2569',
      evidenceUrl: null,
      demo: true,
      createdAt: '2026-09-02T10:00:00.000Z',
    };
    const waterRep1: WaterRecord = {
      id: `water_${uid}_2569_9`,
      userId: uid,
      isBaseline: false,
      billingMonth: 9,
      billingYear: 2569,
      waterUnits: nextWater,
      householdMembers: 4,
      recordDate: '2026-10-05',
      previousUnits: baseWater,
      difference: diffWater,
      changePercentage: pctWater,
      trend: 'ลดลง',
      note: 'ปิดก๊อกน้ำระหว่างแปรงฟันและนำน้ำล้างผักไปรดน้ำต้นไม้',
      evidenceUrl: null,
      demo: true,
      createdAt: '2026-10-05T10:00:00.000Z',
    };
    await setDocument(COLLECTIONS.WATER_RECORDS, waterBase.id, waterBase);
    await setDocument(COLLECTIONS.WATER_RECORDS, waterRep1.id, waterRep1);

    // Teacher Observation (Pre & Post)
    const obsPre: TeacherObservation = {
      id: `obs_${uid}_pre`,
      studentId: uid,
      studentName: studentProfile.displayName,
      classId: s.classId,
      teacherId: s.classId === 'class-m2-1' ? 'demo-teacher-01' : 'demo-teacher-02',
      teacherName: s.classId === 'class-m2-1' ? 'ครูกานต์พิชชา สายชล' : 'ครูณัฐพงศ์ พงศ์พนา',
      assessmentPeriod: 'pre',
      scores: {
        waste_management: 3,
        energy_water_saving: 3,
        responsible_consumption: 3,
        common_environment_care: 3,
        environmental_citizenship: 2,
      },
      totalScore: 14,
      comment: 'นักเรียนมีความสนใจเบื้องต้นแต่ยังต้องกระตุ้นเรื่องการคัดแยกขยะและชักชวนเพื่อน',
      demo: true,
      createdAt: '2026-09-03T11:00:00.000Z',
    };
    const obsPost: TeacherObservation = {
      id: `obs_${uid}_post`,
      studentId: uid,
      studentName: studentProfile.displayName,
      classId: s.classId,
      teacherId: s.classId === 'class-m2-1' ? 'demo-teacher-01' : 'demo-teacher-02',
      teacherName: s.classId === 'class-m2-1' ? 'ครูกานต์พิชชา สายชล' : 'ครูณัฐพงศ์ พงศ์พนา',
      assessmentPeriod: 'post',
      scores: {
        waste_management: 5,
        energy_water_saving: 4,
        responsible_consumption: 4,
        common_environment_care: 5,
        environmental_citizenship: 4,
      },
      totalScore: 22,
      comment: 'พกกระบอกน้ำมาโรงเรียนสม่ำเสมอ แยกขยะในห้องเรียนและช่วยเตือนเพื่อนให้ปิดไฟก่อนออกจากห้อง',
      demo: true,
      createdAt: '2026-10-20T11:00:00.000Z',
    };
    await setDocument(COLLECTIONS.TEACHER_OBSERVATIONS, obsPre.id, obsPre);
    await setDocument(COLLECTIONS.TEACHER_OBSERVATIONS, obsPost.id, obsPost);

    // Follow-up for first 5 students
    if (i < 5) {
      const fu: FollowUpRecord = {
        id: `followup_${uid}`,
        userId: uid,
        stillPracticing: 'yes',
        frequency: 'daily',
        obstacles: 'บางวันกลับบ้านดึกแต่คุณแม่ช่วยแยกขยะไว้รอ',
        routineBehaviors: 'พกกระบอกน้ำไปโรงเรียน แยกขยะรีไซเคิล และปิดไฟเมื่อไม่ใช้',
        stoppedBehaviors: 'ไม่มี',
        reflection: 'รู้สึกว่าการดูแลสิ่งแวดล้อมกลายเป็นนิสัยปกติของคนในบ้านไปแล้ว',
        newWasteKg: currentWasteTotal,
        newElectricityKwh: nextKwh,
        newWaterUnits: nextWater,
        demo: true,
        createdAt: '2026-10-30T09:00:00.000Z',
      };
      await setDocument(COLLECTIONS.FOLLOW_UPS, fu.id, fu);
    }

    // Grant starter & waste/energy/water badges to demo students
    for (const badge of DEFAULT_BADGES.slice(0, i === 0 ? 6 : 4)) {
      const ubId = `ub_${uid}_${badge.id}`;
      const ub: UserBadge = {
        id: ubId,
        userId: uid,
        badgeId: badge.id,
        badgeCode: badge.code,
        badgeName: badge.nameTh,
        earnedAt: '2026-10-16T09:00:00.000Z',
        demo: true,
      };
      await setDocument(COLLECTIONS.USER_BADGES, ubId, ub);
    }
  }

  return {
    studentsCount: 10,
    teachersCount: 2,
    adminsCount: 1,
    classroomsCount: 2,
    missionsCount: DEFAULT_MISSIONS.length,
  };
}

/**
 * Section 57: ห้ามนำ Demo Data ไปปะปนกับข้อมูลวิจัยจริง
 * สามารถลบเฉพาะข้อมูลที่ติด Flag demo: true ออกได้ทั้งหมด
 */
export async function purgeDemoData(): Promise<number> {
  const targetCollections = [
    COLLECTIONS.USERS,
    COLLECTIONS.CLASSROOMS,
    COLLECTIONS.ASSESSMENT_RESPONSES,
    COLLECTIONS.MISSION_PROGRESS,
    COLLECTIONS.MISSION_RESPONSES,
    COLLECTIONS.BEHAVIOR_COMMITMENTS,
    COLLECTIONS.ACTION_PLANS,
    COLLECTIONS.ACTION_RECORDS,
    COLLECTIONS.WASTE_RECORDS,
    COLLECTIONS.ELECTRICITY_RECORDS,
    COLLECTIONS.WATER_RECORDS,
    COLLECTIONS.TEACHER_OBSERVATIONS,
    COLLECTIONS.USER_BADGES,
    COLLECTIONS.POINT_TRANSACTIONS,
    COLLECTIONS.FOLLOW_UPS,
  ];

  let deletedCount = 0;
  for (const colName of targetCollections) {
    const docs = await listDocuments<{ id: string; uid?: string; demo?: boolean }>(colName);
    for (const d of docs) {
      if (d.demo === true) {
        const key = d.id || d.uid;
        if (key) {
          await deleteDocument(colName, key);
          deletedCount++;
        }
      }
    }
  }
  return deletedCount;
}

