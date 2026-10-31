import { addDays, format, parseISO } from 'date-fns';
import {
  ActionPlan,
  ActionRecord,
  AssessmentResponse,
  BehaviorCommitment,
  BehaviorDomainKey,
  Classroom,
  ElectricityRecord,
  EvidenceDoc,
  FamilyMissionRecord,
  FollowUpRecord,
  Mission,
  MissionContentDoc,
  MissionProgress,
  MissionResponse,
  Question,
  ScenarioDoc,
  SystemSettings,
  TeacherObservation,
  UserProfile,
  VerificationStatus,
  WasteRecord,
  WaterRecord,
} from '../../types';
import {
  DEFAULT_MISSIONS,
  DEFAULT_QUESTIONS,
  DEFAULT_SYSTEM_SETTINGS,
  FAMILY_ECO_MISSIONS,
} from '../../constants';
import {
  calculateUtilityChange,
  calculateWasteMetrics,
} from '../../utils';
import {
  COLLECTIONS,
  deleteDocument,
  getDocument,
  listDocuments,
  setDocument,
} from './collections';
import { awardPointsTransaction } from './gamificationService';
import { createNotification } from './notificationService';

// ==================== USERS & CLASSROOMS ====================

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  return getDocument<UserProfile>(COLLECTIONS.USERS, uid);
}

export async function saveUserProfile(profile: UserProfile): Promise<UserProfile> {
  return setDocument(COLLECTIONS.USERS, profile.uid, {
    ...profile,
    updatedAt: new Date().toISOString(),
  });
}

export async function getAllUsers(includeDemo = true): Promise<UserProfile[]> {
  const list = await listDocuments<UserProfile>(COLLECTIONS.USERS);
  return includeDemo ? list : list.filter((u) => !u.demo);
}

export async function getClassrooms(): Promise<Classroom[]> {
  const list = await listDocuments<Classroom>(COLLECTIONS.CLASSROOMS);
  return list.sort((a, b) => a.name.localeCompare(b.name, 'th'));
}

export async function saveClassroom(classroom: Classroom): Promise<Classroom> {
  return setDocument(COLLECTIONS.CLASSROOMS, classroom.id, classroom);
}

export async function deleteClassroom(id: string): Promise<void> {
  await deleteDocument(COLLECTIONS.CLASSROOMS, id);
}

// ==================== SYSTEM SETTINGS ====================

export async function getSystemSettings(): Promise<SystemSettings> {
  const doc = await getDocument<SystemSettings>(COLLECTIONS.SYSTEM_SETTINGS, 'global');
  return doc || DEFAULT_SYSTEM_SETTINGS;
}

export async function saveSystemSettings(settings: SystemSettings): Promise<SystemSettings> {
  return setDocument(COLLECTIONS.SYSTEM_SETTINGS, 'global', {
    ...settings,
    id: 'global',
    updatedAt: new Date().toISOString(),
  });
}

// ==================== QUESTION BANK & ASSESSMENTS ====================

export async function getQuestions(activeOnly = false): Promise<Question[]> {
  const docs = await listDocuments<Question>(COLLECTIONS.QUESTIONS);
  const items = docs.length > 0 ? docs : DEFAULT_QUESTIONS;
  const filtered = activeOnly ? items.filter((q) => q.active) : items;
  return [...filtered].sort((a, b) => a.order - b.order);
}

export async function saveQuestion(question: Question): Promise<Question> {
  return setDocument(COLLECTIONS.QUESTIONS, question.id, question);
}

export async function deleteQuestion(questionId: string): Promise<void> {
  await deleteDocument(COLLECTIONS.QUESTIONS, questionId);
}

export async function getStudentAssessment(
  studentId: string,
  assessmentType: 'pre' | 'post'
): Promise<AssessmentResponse | null> {
  const id = `assess_${studentId}_${assessmentType}`;
  const direct = await getDocument<AssessmentResponse>(
    COLLECTIONS.ASSESSMENT_RESPONSES,
    id
  );
  if (direct) return direct;

  const list = await listDocuments<AssessmentResponse>(
    COLLECTIONS.ASSESSMENT_RESPONSES,
    [
      { field: 'studentId', op: '==', value: studentId },
      { field: 'assessmentType', op: '==', value: assessmentType },
    ]
  );
  return list[0] || null;
}

export async function getAllAssessmentResponses(
  includeDemo = true
): Promise<AssessmentResponse[]> {
  const list = await listDocuments<AssessmentResponse>(COLLECTIONS.ASSESSMENT_RESPONSES);
  return includeDemo ? list : list.filter((r) => !r.demo);
}

export async function submitAssessmentResponse(params: {
  studentId: string;
  studentName?: string;
  classId?: string | null;
  assessmentType: 'pre' | 'post';
  answers: Record<string, string | number>;
  questions: Question[];
  demo?: boolean;
}): Promise<AssessmentResponse> {
  const itemScores: Record<string, number> = {};
  let sectionA = 0;
  let sectionB = 0;
  let sectionC = 0;
  let maxScore = 0;

  const domainScores: Record<BehaviorDomainKey, number> = {
    waste_management: 0,
    energy_water_saving: 0,
    responsible_consumption: 0,
    common_environment_care: 0,
    environmental_citizenship: 0,
  };

  for (const q of params.questions) {
    if (!q.active) continue;
    maxScore += q.score;
    const rawAns = params.answers[q.id];
    let earned = 0;

    if (q.questionType === 'multiple_choice' || q.questionType === 'true_false') {
      earned = String(rawAns) === String(q.correctAnswer) ? q.score : 0;
    } else if (q.questionType === 'rating_scale') {
      const numeric = Number(rawAns) || 0;
      earned = Math.min(q.score, Math.max(1, numeric));
    } else {
      earned = String(rawAns || '').trim().length >= 3 ? q.score : 0;
    }

    itemScores[q.id] = earned;

    if (q.section === 'A') sectionA += earned;
    if (q.section === 'B') sectionB += earned;
    if (q.section === 'C') {
      sectionC += earned;
      if (q.domain !== 'knowledge' && q.domain !== 'attitude') {
        domainScores[q.domain] = (domainScores[q.domain] || 0) + earned;
      }
    }
  }

  const totalScore = sectionA + sectionB + sectionC;
  const percentage = maxScore > 0 ? Number(((totalScore / maxScore) * 100).toFixed(1)) : 0;

  const id = `assess_${params.studentId}_${params.assessmentType}`;
  const response: AssessmentResponse = {
    id,
    studentId: params.studentId,
    studentName: params.studentName,
    classId: params.classId,
    assessmentType: params.assessmentType,
    itemScores,
    answers: params.answers,
    sectionScores: {
      sectionA,
      sectionB,
      sectionC,
    },
    domainScores,
    totalScore,
    maxScore,
    percentage,
    demo: params.demo ?? false,
    createdAt: new Date().toISOString(),
  };

  await setDocument(COLLECTIONS.ASSESSMENT_RESPONSES, id, response);

  await awardPointsTransaction({
    userId: params.studentId,
    type: 'learning',
    points: params.assessmentType === 'pre' ? 30 : 40,
    sourceType: params.assessmentType === 'pre' ? 'pre_assessment' : 'post_assessment',
    sourceId: id,
    reason:
      params.assessmentType === 'pre'
        ? 'ทำแบบประเมินก่อนเรียน (Pre-Assessment) สำเร็จ'
        : 'ทำแบบประเมินหลังเรียน (Post-Assessment) สำเร็จ',
    demo: params.demo,
  });

  return response;
}

// ==================== MISSIONS & PROGRESS ====================

export async function getMissions(activeOnly = false): Promise<Mission[]> {
  const docs = await listDocuments<Mission>(COLLECTIONS.MISSIONS);
  const source = docs.length > 0 ? docs : DEFAULT_MISSIONS;
  const filtered = activeOnly ? source.filter((m) => m.active) : source;
  return [...filtered].sort((a, b) => a.order - b.order);
}

export async function saveMission(mission: Mission): Promise<Mission> {
  // Also sync missionContents and scenarios collections per Section 45 schema
  const contentDoc: MissionContentDoc = {
    id: `content_${mission.id}`,
    missionId: mission.id,
    text: mission.learnContent.text,
    keyPoints: mission.learnContent.keyPoints,
    imageUrl: mission.learnContent.imageUrl,
    infographicTitle: mission.learnContent.infographicTitle,
    videoUrl: mission.learnContent.videoUrl,
    updatedAt: new Date().toISOString(),
  };
  const scenarioDoc: ScenarioDoc = {
    id: `scenario_${mission.id}`,
    missionId: mission.id,
    situationTitle: mission.situationTitle,
    situationText: mission.situationText,
    decidePrompt: mission.decidePrompt,
    choices: mission.choices,
    updatedAt: new Date().toISOString(),
  };

  await Promise.all([
    setDocument(COLLECTIONS.MISSIONS, mission.id, mission),
    setDocument(COLLECTIONS.MISSION_CONTENTS, contentDoc.id, contentDoc),
    setDocument(COLLECTIONS.SCENARIOS, scenarioDoc.id, scenarioDoc),
  ]);
  return mission;
}

export async function getStudentMissionProgress(
  userId: string
): Promise<MissionProgress[]> {
  return listDocuments<MissionProgress>(COLLECTIONS.MISSION_PROGRESS, [
    { field: 'userId', op: '==', value: userId },
  ]);
}

export async function getAllMissionProgress(
  includeDemo = true
): Promise<MissionProgress[]> {
  const list = await listDocuments<MissionProgress>(COLLECTIONS.MISSION_PROGRESS);
  return includeDemo ? list : list.filter((m) => !m.demo);
}

export async function getStudentMissionResponses(
  userId: string
): Promise<MissionResponse[]> {
  return listDocuments<MissionResponse>(COLLECTIONS.MISSION_RESPONSES, [
    { field: 'userId', op: '==', value: userId },
  ]);
}

export async function completeMissionStep(params: {
  userId: string;
  mission: Mission;
  selectedChoiceId: string;
  reflection: string;
  demo?: boolean;
}): Promise<MissionResponse> {
  const choice =
    params.mission.choices.find((c) => c.id === params.selectedChoiceId) ||
    params.mission.choices[0];

  const responseId = `mresp_${params.userId}_${params.mission.id}`;
  const response: MissionResponse = {
    id: responseId,
    userId: params.userId,
    missionId: params.mission.id,
    selectedChoiceId: choice.id,
    impactScores: {
      people: choice.impact.people,
      society: choice.impact.society,
      planet: choice.impact.planet,
    },
    reflection: params.reflection.trim(),
    pointsEarned: params.mission.learningPoints,
    demo: params.demo ?? false,
    createdAt: new Date().toISOString(),
  };

  const progressId = `mprog_${params.userId}_${params.mission.id}`;
  const progress: MissionProgress = {
    id: progressId,
    userId: params.userId,
    missionId: params.mission.id,
    missionOrder: params.mission.order,
    status: 'completed',
    completedAt: new Date().toISOString(),
    demo: params.demo ?? false,
  };

  await Promise.all([
    setDocument(COLLECTIONS.MISSION_RESPONSES, responseId, response),
    setDocument(COLLECTIONS.MISSION_PROGRESS, progressId, progress),
  ]);

  await awardPointsTransaction({
    userId: params.userId,
    type: 'learning',
    points: params.mission.learningPoints,
    sourceType: 'mission',
    sourceId: params.mission.id,
    reason: `ผ่านภารกิจและเขียนสะท้อนคิดใน ${params.mission.title}`,
    demo: params.demo,
  });

  return response;
}

// ==================== BEHAVIOR COMMITMENT & ECO ACTION ====================

export async function getStudentCommitment(
  userId: string
): Promise<BehaviorCommitment | null> {
  const id = `commit_${userId}`;
  const direct = await getDocument<BehaviorCommitment>(
    COLLECTIONS.BEHAVIOR_COMMITMENTS,
    id
  );
  if (direct) return direct;
  const list = await listDocuments<BehaviorCommitment>(
    COLLECTIONS.BEHAVIOR_COMMITMENTS,
    [{ field: 'userId', op: '==', value: userId }]
  );
  return list[0] || null;
}

export async function saveBehaviorCommitment(
  params: Omit<BehaviorCommitment, 'id' | 'createdAt'>
): Promise<BehaviorCommitment> {
  const id = `commit_${params.userId}`;
  const item: BehaviorCommitment = {
    ...params,
    id,
    createdAt: new Date().toISOString(),
  };
  await setDocument(COLLECTIONS.BEHAVIOR_COMMITMENTS, id, item);

  await awardPointsTransaction({
    userId: params.userId,
    type: 'learning',
    points: 20,
    sourceType: 'commitment',
    sourceId: id,
    reason: `ตั้งพันธสัญญาการเปลี่ยนพฤติกรรม (${params.category})`,
    demo: params.demo,
  });

  return item;
}

export async function getStudentActionPlans(userId: string): Promise<ActionPlan[]> {
  const list = await listDocuments<ActionPlan>(COLLECTIONS.ACTION_PLANS, [
    { field: 'userId', op: '==', value: userId },
  ]);
  return list.sort((a, b) => (a.createdAt > b.createdAt ? -1 : 1));
}

export async function getAllActionPlans(includeDemo = true): Promise<ActionPlan[]> {
  const list = await listDocuments<ActionPlan>(COLLECTIONS.ACTION_PLANS);
  return includeDemo ? list : list.filter((p) => !p.demo);
}

export async function createEcoActionPlan(
  params: Omit<ActionPlan, 'id' | 'endDate' | 'status' | 'createdAt'>
): Promise<ActionPlan> {
  const start = parseISO(params.startDate);
  const end = addDays(start, Math.max(1, params.targetDays - 1));
  const id = `plan_${params.userId}_${Date.now()}`;

  const plan: ActionPlan = {
    ...params,
    id,
    endDate: format(end, 'yyyy-MM-dd'),
    status: 'active',
    createdAt: new Date().toISOString(),
  };

  await setDocument(COLLECTIONS.ACTION_PLANS, id, plan);

  if (!params.demo) {
    await createNotification({
      userId: 'role_teacher',
      roleTarget: 'teacher',
      title: 'นักเรียนสร้างแผนปฏิบัติการ Eco Action Plan ใหม่',
      message: `แผน "${plan.title}" (${plan.targetDays} วัน) เริ่มต้นเมื่อ ${plan.startDate}`,
      type: 'action_due',
      link: '/teacher/students',
    });
  }

  return plan;
}

export async function getStudentActionRecords(userId: string): Promise<ActionRecord[]> {
  const list = await listDocuments<ActionRecord>(COLLECTIONS.ACTION_RECORDS, [
    { field: 'userId', op: '==', value: userId },
  ]);
  return list.sort((a, b) => (a.date > b.date ? -1 : 1));
}

export async function getAllActionRecords(includeDemo = true): Promise<ActionRecord[]> {
  const list = await listDocuments<ActionRecord>(COLLECTIONS.ACTION_RECORDS);
  const filtered = includeDemo ? list : list.filter((r) => !r.demo);
  return filtered.sort((a, b) => (a.createdAt > b.createdAt ? -1 : 1));
}

export async function submitDailyActionRecord(
  params: Omit<
    ActionRecord,
    'id' | 'teacherVerification' | 'createdAt'
  >
): Promise<ActionRecord> {
  const id = `actrec_${params.userId}_${params.actionPlanId}_${params.date}`;
  const record: ActionRecord = {
    ...params,
    id,
    teacherVerification: 'pending',
    createdAt: new Date().toISOString(),
  };

  await setDocument(COLLECTIONS.ACTION_RECORDS, id, record);

  if (params.evidenceUrl) {
    const evId = `ev_${id}`;
    const evDoc: EvidenceDoc = {
      id: evId,
      userId: params.userId,
      sourceType: 'action_record',
      sourceId: id,
      fileUrl: params.evidenceUrl,
      fileType: 'image/jpeg',
      fileSize: 0,
      demo: params.demo,
      createdAt: new Date().toISOString(),
    };
    await setDocument(COLLECTIONS.EVIDENCE, evId, evDoc);
  }

  // Section 31: ห้ามให้คะแนนจากการ Upload หลักฐานอย่างเดียว ต้องผ่านเงื่อนไขกิจกรรมก่อน
  if (params.status === 'completed' && params.reflection.trim().length >= 5) {
    await awardPointsTransaction({
      userId: params.userId,
      type: 'action',
      points: 15,
      sourceType: 'action_checkin',
      sourceId: id,
      reason: `บันทึกปฏิบัติการรายวัน (${params.date}) สำเร็จตามเป้าหมาย`,
      demo: params.demo,
    });
  }

  if (!params.demo) {
    await createNotification({
      userId: 'role_teacher',
      roleTarget: 'teacher',
      title: 'มีรายการบันทึก Eco Action รอตรวจรับรอง',
      message: `${params.studentName || 'นักเรียน'} ส่งบันทึกประจำวันที่ ${params.date}`,
      type: 'verification',
      link: '/teacher/verification',
    });
  }

  return record;
}

/**
 * Section 28: TEACHER VERIFICATION
 * เมื่อ Approved ระบบเพิ่ม Action Points และป้องกันการเพิ่มคะแนนซ้ำด้วย PointTransactions
 */
export async function verifyActionRecordByTeacher(params: {
  recordId: string;
  status: VerificationStatus;
  comment: string;
  teacherId: string;
}): Promise<ActionRecord> {
  const existing = await getDocument<ActionRecord>(
    COLLECTIONS.ACTION_RECORDS,
    params.recordId
  );
  if (!existing) {
    throw new Error('ไม่พบรายการบันทึก Eco Action ที่ต้องการตรวจ');
  }

  const updated: ActionRecord = {
    ...existing,
    teacherVerification: params.status,
    teacherComment: params.comment.trim(),
    verifiedBy: params.teacherId,
    verifiedAt: new Date().toISOString(),
  };

  await setDocument(COLLECTIONS.ACTION_RECORDS, params.recordId, updated);

  if (params.status === 'approved') {
    await awardPointsTransaction({
      userId: existing.userId,
      type: 'action',
      points: 25,
      sourceType: 'teacher_verified_action',
      sourceId: existing.id,
      reason: `ครูรับรองหลักฐานและการปฏิบัติ Eco Action ประจำวันที่ ${existing.date}`,
      demo: existing.demo,
    });
  }

  const statusTextMap: Record<VerificationStatus, string> = {
    pending: 'รอการตรวจสอบ',
    approved: 'อนุมัติรับรองเรียบร้อย (+25 Action Points)',
    revision_required: 'ขอให้ปรับปรุง/เพิ่มเติมข้อมูล',
    rejected: 'ไม่ผ่านเกณฑ์การรับรอง',
  };

  await createNotification({
    userId: existing.userId,
    title: `ผลการตรวจ Eco Action วันที่ ${existing.date}`,
    message: `สถานะ: ${statusTextMap[params.status]} ${
      params.comment ? `| ความเห็นครู: ${params.comment}` : ''
    }`,
    type: 'verification',
    link: '/student/actions',
    demo: existing.demo,
  });

  return updated;
}

// ==================== HOME ECO BASELINE & REPORTS ====================

export async function getStudentWasteRecords(userId: string): Promise<WasteRecord[]> {
  const list = await listDocuments<WasteRecord>(COLLECTIONS.WASTE_RECORDS, [
    { field: 'userId', op: '==', value: userId },
  ]);
  return list.sort((a, b) => (a.recordDate > b.recordDate ? 1 : -1));
}

export async function getAllWasteRecords(includeDemo = true): Promise<WasteRecord[]> {
  const list = await listDocuments<WasteRecord>(COLLECTIONS.WASTE_RECORDS);
  return includeDemo ? list : list.filter((r) => !r.demo);
}

export async function getStudentElectricityRecords(
  userId: string
): Promise<ElectricityRecord[]> {
  const list = await listDocuments<ElectricityRecord>(
    COLLECTIONS.ELECTRICITY_RECORDS,
    [{ field: 'userId', op: '==', value: userId }]
  );
  return list.sort((a, b) =>
    a.billingYear !== b.billingYear
      ? a.billingYear - b.billingYear
      : a.billingMonth - b.billingMonth
  );
}

export async function getAllElectricityRecords(
  includeDemo = true
): Promise<ElectricityRecord[]> {
  const list = await listDocuments<ElectricityRecord>(COLLECTIONS.ELECTRICITY_RECORDS);
  return includeDemo ? list : list.filter((r) => !r.demo);
}

export async function getStudentWaterRecords(userId: string): Promise<WaterRecord[]> {
  const list = await listDocuments<WaterRecord>(COLLECTIONS.WATER_RECORDS, [
    { field: 'userId', op: '==', value: userId },
  ]);
  return list.sort((a, b) =>
    a.billingYear !== b.billingYear
      ? a.billingYear - b.billingYear
      : a.billingMonth - b.billingMonth
  );
}

export async function getAllWaterRecords(includeDemo = true): Promise<WaterRecord[]> {
  const list = await listDocuments<WaterRecord>(COLLECTIONS.WATER_RECORDS);
  return includeDemo ? list : list.filter((r) => !r.demo);
}

export async function saveHomeEcoBaseline(params: {
  userId: string;
  wasteRecordDate: string;
  collectionPeriod: string;
  wasteUnit: string;
  generalWasteKg: number;
  recyclableWasteKg: number;
  organicWasteKg: number;
  plasticWasteKg: number;
  elecBillingMonth: number;
  elecBillingYear: number;
  electricityKwh: number;
  elecRecordDate: string;
  elecEvidenceUrl: string | null;
  waterBillingMonth: number;
  waterBillingYear: number;
  waterUnits: number;
  waterRecordDate: string;
  waterEvidenceUrl: string | null;
  householdMembers: number;
  demo?: boolean;
}): Promise<{
  wasteBaseline: WasteRecord;
  electricityBaseline: ElectricityRecord;
  waterBaseline: WaterRecord;
}> {
  const metrics = calculateWasteMetrics(
    {
      generalWasteKg: params.generalWasteKg,
      recyclableWasteKg: params.recyclableWasteKg,
      organicWasteKg: params.organicWasteKg,
      plasticWasteKg: params.plasticWasteKg,
      otherWasteKg: 0,
    },
    null
  );

  const wasteId = `waste_base_${params.userId}`;
  const wasteBaseline: WasteRecord = {
    id: wasteId,
    userId: params.userId,
    isBaseline: true,
    recordDate: params.wasteRecordDate,
    collectionPeriod: params.collectionPeriod,
    unit: params.wasteUnit,
    generalWasteKg: params.generalWasteKg,
    recyclableWasteKg: params.recyclableWasteKg,
    organicWasteKg: params.organicWasteKg,
    plasticWasteKg: params.plasticWasteKg,
    otherWasteKg: 0,
    totalWaste: metrics.totalWaste,
    recycledPercentage: metrics.recycledPercentage,
    wasteReduction: null,
    wasteReductionPercentage: null,
    trend: 'คงที่',
    note: `ข้อมูลพื้นฐาน (Baseline) ช่วงเวลาเก็บข้อมูล: ${params.collectionPeriod}`,
    evidenceUrl: null,
    demo: params.demo ?? false,
    createdAt: new Date().toISOString(),
  };

  const elecId = `elec_base_${params.userId}`;
  const electricityBaseline: ElectricityRecord = {
    id: elecId,
    userId: params.userId,
    isBaseline: true,
    billingMonth: params.elecBillingMonth,
    billingYear: params.elecBillingYear,
    electricityKwh: params.electricityKwh,
    householdMembers: params.householdMembers,
    recordDate: params.elecRecordDate,
    previousKwh: null,
    differenceKwh: null,
    changePercentage: null,
    trend: 'คงที่',
    note: 'ข้อมูลพื้นฐานการใช้ไฟฟ้าก่อนเริ่มภารกิจ (Baseline)',
    evidenceUrl: params.elecEvidenceUrl,
    demo: params.demo ?? false,
    createdAt: new Date().toISOString(),
  };

  const waterId = `water_base_${params.userId}`;
  const waterBaseline: WaterRecord = {
    id: waterId,
    userId: params.userId,
    isBaseline: true,
    billingMonth: params.waterBillingMonth,
    billingYear: params.waterBillingYear,
    waterUnits: params.waterUnits,
    householdMembers: params.householdMembers,
    recordDate: params.waterRecordDate,
    previousUnits: null,
    difference: null,
    changePercentage: null,
    trend: 'คงที่',
    note: 'ข้อมูลพื้นฐานการใช้น้ำก่อนเริ่มภารกิจ (Baseline)',
    evidenceUrl: params.waterEvidenceUrl,
    demo: params.demo ?? false,
    createdAt: new Date().toISOString(),
  };

  await Promise.all([
    setDocument(COLLECTIONS.WASTE_RECORDS, wasteId, wasteBaseline),
    setDocument(COLLECTIONS.ELECTRICITY_RECORDS, elecId, electricityBaseline),
    setDocument(COLLECTIONS.WATER_RECORDS, waterId, waterBaseline),
  ]);

  await awardPointsTransaction({
    userId: params.userId,
    type: 'learning',
    points: 30,
    sourceType: 'baseline',
    sourceId: `baseline_${params.userId}`,
    reason: 'บันทึกข้อมูลพื้นฐานของครัวเรือน (Home Eco Baseline) ครบถ้วน',
    demo: params.demo,
  });

  return { wasteBaseline, electricityBaseline, waterBaseline };
}

export async function submitWasteReport(params: {
  userId: string;
  recordDate: string;
  generalWasteKg: number;
  recyclableWasteKg: number;
  organicWasteKg: number;
  plasticWasteKg: number;
  otherWasteKg: number;
  note: string;
  evidenceUrl: string | null;
  demo?: boolean;
}): Promise<WasteRecord> {
  const existing = await getStudentWasteRecords(params.userId);
  const baseline = existing.find((w) => w.isBaseline) || null;

  const metrics = calculateWasteMetrics(
    {
      generalWasteKg: params.generalWasteKg,
      recyclableWasteKg: params.recyclableWasteKg,
      organicWasteKg: params.organicWasteKg,
      plasticWasteKg: params.plasticWasteKg,
      otherWasteKg: params.otherWasteKg,
    },
    baseline ? baseline.totalWaste : null
  );

  const id = `waste_${params.userId}_${params.recordDate}`;
  const record: WasteRecord = {
    id,
    userId: params.userId,
    isBaseline: false,
    recordDate: params.recordDate,
    unit: 'กิโลกรัม (kg)',
    generalWasteKg: params.generalWasteKg,
    recyclableWasteKg: params.recyclableWasteKg,
    organicWasteKg: params.organicWasteKg,
    plasticWasteKg: params.plasticWasteKg,
    otherWasteKg: params.otherWasteKg,
    totalWaste: metrics.totalWaste,
    recycledPercentage: metrics.recycledPercentage,
    wasteReduction: metrics.wasteReduction,
    wasteReductionPercentage: metrics.wasteReductionPercentage,
    trend: metrics.trend,
    note: params.note,
    evidenceUrl: params.evidenceUrl,
    demo: params.demo ?? false,
    createdAt: new Date().toISOString(),
  };

  await setDocument(COLLECTIONS.WASTE_RECORDS, id, record);

  await awardPointsTransaction({
    userId: params.userId,
    type: 'action',
    points: 20,
    sourceType: 'home_eco_report',
    sourceId: id,
    reason: `บันทึกรายงานข้อมูลขยะครัวเรือนประจำวันที่ ${params.recordDate}`,
    demo: params.demo,
  });

  return record;
}

export async function submitElectricityReport(params: {
  userId: string;
  billingMonth: number;
  billingYear: number;
  electricityKwh: number;
  householdMembers: number;
  recordDate: string;
  note: string;
  evidenceUrl: string | null;
  demo?: boolean;
}): Promise<ElectricityRecord> {
  const existing = await getStudentElectricityRecords(params.userId);

  // Section 53: ป้องกัน duplicate month records (ยกเว้นอัปเดตเดือนเดิม)
  const duplicateNonBaseline = existing.find(
    (e) =>
      !e.isBaseline &&
      e.billingYear === params.billingYear &&
      e.billingMonth === params.billingMonth
  );
  if (duplicateNonBaseline) {
    throw new Error(
      `คุณได้บันทึกข้อมูลการใช้ไฟฟ้าของเดือนที่ ${params.billingMonth}/${params.billingYear} ไปแล้ว`
    );
  }

  const baseline = existing.find((e) => e.isBaseline) || existing[0] || null;
  const previousRecord =
    existing.length > 0 ? existing[existing.length - 1] : baseline;

  const calc = calculateUtilityChange(
    params.electricityKwh,
    previousRecord ? previousRecord.electricityKwh : null
  );

  const id = `elec_${params.userId}_${params.billingYear}_${params.billingMonth}`;
  const record: ElectricityRecord = {
    id,
    userId: params.userId,
    isBaseline: false,
    billingMonth: params.billingMonth,
    billingYear: params.billingYear,
    electricityKwh: params.electricityKwh,
    householdMembers: params.householdMembers,
    recordDate: params.recordDate,
    previousKwh: calc.previousValue,
    differenceKwh: calc.difference,
    changePercentage: calc.changePercentage,
    trend: calc.trend,
    note: params.note,
    evidenceUrl: params.evidenceUrl,
    demo: params.demo ?? false,
    createdAt: new Date().toISOString(),
  };

  await setDocument(COLLECTIONS.ELECTRICITY_RECORDS, id, record);

  await awardPointsTransaction({
    userId: params.userId,
    type: 'action',
    points: 25,
    sourceType: 'home_eco_report',
    sourceId: id,
    reason: `บันทึกรายงานการใช้ไฟฟ้าครัวเรือน เดือน ${params.billingMonth}/${params.billingYear}`,
    demo: params.demo,
  });

  return record;
}

export async function submitWaterReport(params: {
  userId: string;
  billingMonth: number;
  billingYear: number;
  waterUnits: number;
  householdMembers: number;
  recordDate: string;
  note: string;
  evidenceUrl: string | null;
  demo?: boolean;
}): Promise<WaterRecord> {
  const existing = await getStudentWaterRecords(params.userId);

  const duplicateNonBaseline = existing.find(
    (w) =>
      !w.isBaseline &&
      w.billingYear === params.billingYear &&
      w.billingMonth === params.billingMonth
  );
  if (duplicateNonBaseline) {
    throw new Error(
      `คุณได้บันทึกข้อมูลการใช้น้ำประปาของเดือนที่ ${params.billingMonth}/${params.billingYear} ไปแล้ว`
    );
  }

  const baseline = existing.find((w) => w.isBaseline) || existing[0] || null;
  const previousRecord =
    existing.length > 0 ? existing[existing.length - 1] : baseline;

  const calc = calculateUtilityChange(
    params.waterUnits,
    previousRecord ? previousRecord.waterUnits : null
  );

  const id = `water_${params.userId}_${params.billingYear}_${params.billingMonth}`;
  const record: WaterRecord = {
    id,
    userId: params.userId,
    isBaseline: false,
    billingMonth: params.billingMonth,
    billingYear: params.billingYear,
    waterUnits: params.waterUnits,
    householdMembers: params.householdMembers,
    recordDate: params.recordDate,
    previousUnits: calc.previousValue,
    difference: calc.difference,
    changePercentage: calc.changePercentage,
    trend: calc.trend,
    note: params.note,
    evidenceUrl: params.evidenceUrl,
    demo: params.demo ?? false,
    createdAt: new Date().toISOString(),
  };

  await setDocument(COLLECTIONS.WATER_RECORDS, id, record);

  await awardPointsTransaction({
    userId: params.userId,
    type: 'action',
    points: 25,
    sourceType: 'home_eco_report',
    sourceId: id,
    reason: `บันทึกรายงานการใช้น้ำประปาครัวเรือน เดือน ${params.billingMonth}/${params.billingYear}`,
    demo: params.demo,
  });

  return record;
}

// ==================== FAMILY ECO MISSION ====================

export async function getStudentFamilyMissions(
  userId: string
): Promise<FamilyMissionRecord[]> {
  const list = await listDocuments<FamilyMissionRecord>(
    COLLECTIONS.FAMILY_MISSION_RECORDS,
    [{ field: 'userId', op: '==', value: userId }]
  );
  return list.sort((a, b) => (a.date > b.date ? -1 : 1));
}

export async function submitFamilyMissionRecord(params: {
  userId: string;
  missionCode: FamilyMissionRecord['missionCode'];
  participatingMembers: number;
  date: string;
  summary: string;
  reflection: string;
  evidenceUrl: string | null;
  demo?: boolean;
}): Promise<FamilyMissionRecord> {
  const meta =
    FAMILY_ECO_MISSIONS.find((m) => m.code === params.missionCode) ||
    FAMILY_ECO_MISSIONS[0];

  const id = `fammis_${params.userId}_${params.missionCode}_${params.date}`;
  const record: FamilyMissionRecord = {
    id,
    userId: params.userId,
    missionCode: params.missionCode,
    missionTitle: meta.title,
    participatingMembers: params.participatingMembers,
    date: params.date,
    summary: params.summary,
    reflection: params.reflection,
    evidenceUrl: params.evidenceUrl,
    demo: params.demo ?? false,
    createdAt: new Date().toISOString(),
  };

  await setDocument(COLLECTIONS.FAMILY_MISSION_RECORDS, id, record);

  await awardPointsTransaction({
    userId: params.userId,
    type: 'action',
    points: meta.points,
    sourceType: 'family_mission',
    sourceId: id,
    reason: `ทำภารกิจครอบครัว ${meta.title} สำเร็จ`,
    demo: params.demo,
  });

  return record;
}

// ==================== TEACHER OBSERVATION ====================

export async function getStudentTeacherObservations(
  studentId: string
): Promise<TeacherObservation[]> {
  const list = await listDocuments<TeacherObservation>(
    COLLECTIONS.TEACHER_OBSERVATIONS,
    [{ field: 'studentId', op: '==', value: studentId }]
  );
  return list.sort((a, b) => (a.createdAt > b.createdAt ? -1 : 1));
}

export async function getAllTeacherObservations(
  includeDemo = true
): Promise<TeacherObservation[]> {
  const list = await listDocuments<TeacherObservation>(COLLECTIONS.TEACHER_OBSERVATIONS);
  return includeDemo ? list : list.filter((o) => !o.demo);
}

export async function submitTeacherObservation(params: {
  studentId: string;
  studentName?: string;
  classId?: string | null;
  teacherId: string;
  teacherName?: string;
  assessmentPeriod: 'pre' | 'during' | 'post';
  scores: Record<BehaviorDomainKey, number>;
  comment: string;
  demo?: boolean;
}): Promise<TeacherObservation> {
  const totalScore = Object.values(params.scores).reduce((a, b) => a + b, 0);
  const id = `obs_${params.studentId}_${params.assessmentPeriod}`;

  const obs: TeacherObservation = {
    id,
    studentId: params.studentId,
    studentName: params.studentName,
    classId: params.classId,
    teacherId: params.teacherId,
    teacherName: params.teacherName,
    assessmentPeriod: params.assessmentPeriod,
    scores: params.scores,
    totalScore,
    comment: params.comment,
    demo: params.demo ?? false,
    createdAt: new Date().toISOString(),
  };

  await setDocument(COLLECTIONS.TEACHER_OBSERVATIONS, id, obs);
  return obs;
}

// ==================== FOLLOW-UP ====================

export async function getStudentFollowUp(userId: string): Promise<FollowUpRecord | null> {
  const id = `followup_${userId}`;
  const direct = await getDocument<FollowUpRecord>(COLLECTIONS.FOLLOW_UPS, id);
  if (direct) return direct;
  const list = await listDocuments<FollowUpRecord>(COLLECTIONS.FOLLOW_UPS, [
    { field: 'userId', op: '==', value: userId },
  ]);
  return list[0] || null;
}

export async function getAllFollowUps(includeDemo = true): Promise<FollowUpRecord[]> {
  const list = await listDocuments<FollowUpRecord>(COLLECTIONS.FOLLOW_UPS);
  return includeDemo ? list : list.filter((f) => !f.demo);
}

export async function submitFollowUpRecord(
  params: Omit<FollowUpRecord, 'id' | 'createdAt'>
): Promise<FollowUpRecord> {
  const id = `followup_${params.userId}`;
  const record: FollowUpRecord = {
    ...params,
    id,
    createdAt: new Date().toISOString(),
  };

  await setDocument(COLLECTIONS.FOLLOW_UPS, id, record);

  await awardPointsTransaction({
    userId: params.userId,
    type: 'action',
    points: 40,
    sourceType: 'follow_up',
    sourceId: id,
    reason: 'บันทึกแบบติดตามผลความยั่งยืนของพฤติกรรม (Follow-up) สำเร็จ',
    demo: params.demo,
  });

  return record;
}

