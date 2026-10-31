import { useCallback, useEffect, useState } from 'react';
import {
  ActionPlan,
  ActionRecord,
  AssessmentResponse,
  BadgeDefinition,
  BehaviorCommitment,
  ElectricityRecord,
  FamilyMissionRecord,
  FollowUpRecord,
  LevelDefinition,
  Mission,
  MissionProgress,
  MissionResponse,
  PointTransaction,
  TeacherObservation,
  UserBadge,
  WasteRecord,
  WaterRecord,
} from '../types';
import {
  getMissions,
  getStudentActionPlans,
  getStudentActionRecords,
  getStudentAssessment,
  getStudentCommitment,
  getStudentElectricityRecords,
  getStudentFamilyMissions,
  getStudentFollowUp,
  getStudentMissionProgress,
  getStudentMissionResponses,
  getStudentTeacherObservations,
  getStudentWasteRecords,
  getStudentWaterRecords,
} from '../services/firestore/ecoDataService';
import {
  getBadges,
  getUserBadges,
  getUserPointSummary,
} from '../services/firestore/gamificationService';
import { calculateEcoStreak } from '../utils';

export interface StudentEcoState {
  loading: boolean;
  error: string | null;
  preAssessment: AssessmentResponse | null;
  postAssessment: AssessmentResponse | null;
  followUp: FollowUpRecord | null;
  missions: Mission[];
  missionProgress: MissionProgress[];
  missionResponses: MissionResponse[];
  commitment: BehaviorCommitment | null;
  actionPlans: ActionPlan[];
  actionRecords: ActionRecord[];
  wasteRecords: WasteRecord[];
  electricityRecords: ElectricityRecord[];
  waterRecords: WaterRecord[];
  familyMissions: FamilyMissionRecord[];
  teacherObservations: TeacherObservation[];
  learningPoints: number;
  actionPoints: number;
  totalPoints: number;
  currentLevel: LevelDefinition | null;
  nextLevel: LevelDefinition | null;
  levelProgressPercent: number;
  pointTransactions: PointTransaction[];
  allBadges: BadgeDefinition[];
  earnedBadges: UserBadge[];
  ecoStreak: number;
  hasBaseline: boolean;
  refresh: () => Promise<void>;
}

export function useStudentEcoState(studentUid?: string | null): StudentEcoState {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [preAssessment, setPreAssessment] = useState<AssessmentResponse | null>(null);
  const [postAssessment, setPostAssessment] = useState<AssessmentResponse | null>(null);
  const [followUp, setFollowUp] = useState<FollowUpRecord | null>(null);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [missionProgress, setMissionProgress] = useState<MissionProgress[]>([]);
  const [missionResponses, setMissionResponses] = useState<MissionResponse[]>([]);
  const [commitment, setCommitment] = useState<BehaviorCommitment | null>(null);
  const [actionPlans, setActionPlans] = useState<ActionPlan[]>([]);
  const [actionRecords, setActionRecords] = useState<ActionRecord[]>([]);
  const [wasteRecords, setWasteRecords] = useState<WasteRecord[]>([]);
  const [electricityRecords, setElectricityRecords] = useState<ElectricityRecord[]>([]);
  const [waterRecords, setWaterRecords] = useState<WaterRecord[]>([]);
  const [familyMissions, setFamilyMissions] = useState<FamilyMissionRecord[]>([]);
  const [teacherObservations, setTeacherObservations] = useState<TeacherObservation[]>([]);

  const [learningPoints, setLearningPoints] = useState<number>(0);
  const [actionPoints, setActionPoints] = useState<number>(0);
  const [totalPoints, setTotalPoints] = useState<number>(0);
  const [currentLevel, setCurrentLevel] = useState<LevelDefinition | null>(null);
  const [nextLevel, setNextLevel] = useState<LevelDefinition | null>(null);
  const [levelProgressPercent, setLevelProgressPercent] = useState<number>(0);
  const [pointTransactions, setPointTransactions] = useState<PointTransaction[]>([]);
  const [allBadges, setAllBadges] = useState<BadgeDefinition[]>([]);
  const [earnedBadges, setEarnedBadges] = useState<UserBadge[]>([]);

  const refresh = useCallback(async () => {
    if (!studentUid) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [
        pre,
        post,
        fu,
        missionList,
        mProg,
        mResp,
        comm,
        plans,
        records,
        waste,
        elec,
        water,
        fam,
        obs,
        ptSummary,
        badgesDef,
        userBadgesList,
      ] = await Promise.all([
        getStudentAssessment(studentUid, 'pre'),
        getStudentAssessment(studentUid, 'post'),
        getStudentFollowUp(studentUid),
        getMissions(true),
        getStudentMissionProgress(studentUid),
        getStudentMissionResponses(studentUid),
        getStudentCommitment(studentUid),
        getStudentActionPlans(studentUid),
        getStudentActionRecords(studentUid),
        getStudentWasteRecords(studentUid),
        getStudentElectricityRecords(studentUid),
        getStudentWaterRecords(studentUid),
        getStudentFamilyMissions(studentUid),
        getStudentTeacherObservations(studentUid),
        getUserPointSummary(studentUid),
        getBadges(),
        getUserBadges(studentUid),
      ]);

      setPreAssessment(pre);
      setPostAssessment(post);
      setFollowUp(fu);
      setMissions(missionList);
      setMissionProgress(mProg);
      setMissionResponses(mResp);
      setCommitment(comm);
      setActionPlans(plans);
      setActionRecords(records);
      setWasteRecords(waste);
      setElectricityRecords(elec);
      setWaterRecords(water);
      setFamilyMissions(fam);
      setTeacherObservations(obs);

      setLearningPoints(ptSummary.learningPoints);
      setActionPoints(ptSummary.actionPoints);
      setTotalPoints(ptSummary.totalPoints);
      setCurrentLevel(ptSummary.currentLevel);
      setNextLevel(ptSummary.nextLevel);
      setLevelProgressPercent(ptSummary.levelProgressPercent);
      setPointTransactions(ptSummary.transactions);
      setAllBadges(badgesDef);
      setEarnedBadges(userBadgesList);
    } catch (err: any) {
      setError(err?.message || 'เกิดข้อผิดพลาดในการโหลดข้อมูลผู้เรียน');
    } finally {
      setLoading(false);
    }
  }, [studentUid]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const completedDates = actionRecords
    .filter((r) => r.status === 'completed' || r.status === 'partial')
    .map((r) => r.date);
  const ecoStreak = calculateEcoStreak(completedDates);

  const hasBaseline =
    wasteRecords.some((w) => w.isBaseline) &&
    electricityRecords.some((e) => e.isBaseline) &&
    waterRecords.some((w) => w.isBaseline);

  return {
    loading,
    error,
    preAssessment,
    postAssessment,
    followUp,
    missions,
    missionProgress,
    missionResponses,
    commitment,
    actionPlans,
    actionRecords,
    wasteRecords,
    electricityRecords,
    waterRecords,
    familyMissions,
    teacherObservations,
    learningPoints,
    actionPoints,
    totalPoints,
    currentLevel,
    nextLevel,
    levelProgressPercent,
    pointTransactions,
    allBadges,
    earnedBadges,
    ecoStreak,
    hasBaseline,
    refresh,
  };
}

