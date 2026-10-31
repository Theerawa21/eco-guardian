export type UserRole = 'student' | 'teacher' | 'admin';

export interface UserProfile {
  uid: string;
  email: string;
  studentCode: string | null;
  firstName: string;
  lastName: string;
  displayName: string;
  role: UserRole;
  classId: string | null;
  gradeLevel?: string | null;
  room?: string | null;
  avatarUrl: string | null;
  active: boolean;
  demo?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Classroom {
  id: string;
  name: string;
  gradeLevel: string;
  room: string;
  academicYear: string;
  teacherId: string;
  teacherName: string;
  demo?: boolean;
  createdAt: string;
}

export type BehaviorDomainKey =
  | 'waste_management'
  | 'energy_water_saving'
  | 'responsible_consumption'
  | 'common_environment_care'
  | 'environmental_citizenship';

export type QuestionType = 'true_false' | 'multiple_choice' | 'rating_scale' | 'reflection';

export interface Question {
  id: string;
  assessmentType: 'pre_post' | 'mission';
  section: 'A' | 'B' | 'C';
  domain: BehaviorDomainKey | 'knowledge' | 'attitude';
  questionType: QuestionType;
  questionText: string;
  choices?: string[];
  correctAnswer?: string;
  score: number;
  order: number;
  active: boolean;
  demo?: boolean;
}

export interface AssessmentDefinition {
  id: string;
  type: 'pre' | 'post';
  title: string;
  description: string;
  active: boolean;
  createdAt: string;
}

export interface AssessmentResponse {
  id: string;
  studentId: string;
  studentName?: string;
  classId?: string | null;
  assessmentType: 'pre' | 'post';
  itemScores: Record<string, number>;
  answers: Record<string, string | number>;
  sectionScores: {
    sectionA: number;
    sectionB: number;
    sectionC: number;
  };
  domainScores: Record<BehaviorDomainKey, number>;
  totalScore: number;
  maxScore: number;
  percentage: number;
  demo?: boolean;
  createdAt: string;
}

export interface MissionChoice {
  id: string;
  label: string;
  description: string;
  impact: {
    people: number; // 1-100 score
    society: number; // 1-100 score
    planet: number; // 1-100 score
    peopleText: string;
    societyText: string;
    planetText: string;
  };
  feedback: string;
  isOptimal: boolean;
}

export interface Mission {
  id: string;
  order: number;
  title: string;
  subtitle: string;
  topics: string[];
  situationTitle: string;
  situationText: string;
  situationImageUrl?: string;
  learnContent: {
    text: string;
    keyPoints: string[];
    imageUrl?: string;
    infographicTitle?: string;
    infographicItems?: { label: string; value: string; detail: string }[];
    videoUrl?: string;
  };
  decidePrompt: string;
  choices: MissionChoice[];
  reflectionQuestion: string;
  learningPoints: number;
  unlockRequirementMissionId: string | null;
  requiresPreAssessment: boolean;
  requiresBaseline: boolean;
  triggersCommitment: boolean;
  active: boolean;
  demo?: boolean;
}

export interface MissionContentDoc {
  id: string;
  missionId: string;
  text: string;
  keyPoints: string[];
  imageUrl?: string;
  infographicTitle?: string;
  videoUrl?: string;
  updatedAt: string;
}

export interface ScenarioDoc {
  id: string;
  missionId: string;
  situationTitle: string;
  situationText: string;
  decidePrompt: string;
  choices: MissionChoice[];
  updatedAt: string;
}

export interface MissionResponse {
  id: string;
  userId: string;
  missionId: string;
  selectedChoiceId: string;
  impactScores: {
    people: number;
    society: number;
    planet: number;
  };
  reflection: string;
  pointsEarned: number;
  demo?: boolean;
  createdAt: string;
}

export interface MissionProgress {
  id: string;
  userId: string;
  missionId: string;
  missionOrder: number;
  status: 'locked' | 'unlocked' | 'completed';
  completedAt?: string;
  demo?: boolean;
}

export type BehaviorCategory =
  | 'Waste'
  | 'Plastic'
  | 'Energy'
  | 'Water'
  | 'Food'
  | 'Consumption'
  | 'Biodiversity'
  | 'Community';

export interface BehaviorCommitment {
  id: string;
  userId: string;
  category: BehaviorCategory;
  what: string;
  when: string;
  where: string;
  how: string;
  reason: string;
  startDate: string;
  demo?: boolean;
  createdAt: string;
}

export interface ActionPlan {
  id: string;
  userId: string;
  title: string;
  category: BehaviorCategory;
  goal: string;
  behavior: string;
  reason: string;
  startDate: string;
  endDate: string;
  targetDays: number;
  indicator: string;
  evidenceMethod: string;
  status: 'active' | 'completed' | 'paused';
  demo?: boolean;
  createdAt: string;
}

export type VerificationStatus = 'pending' | 'approved' | 'revision_required' | 'rejected';

export interface ActionRecord {
  id: string;
  userId: string;
  studentName?: string;
  classId?: string | null;
  actionPlanId: string;
  actionPlanTitle?: string;
  date: string;
  status: 'completed' | 'partial' | 'notCompleted';
  quantity: number;
  unit: string;
  note: string;
  obstacle: string;
  reflection: string;
  evidenceUrl: string | null;
  teacherVerification: VerificationStatus;
  teacherComment?: string;
  verifiedBy?: string;
  verifiedAt?: string;
  demo?: boolean;
  createdAt: string;
}

export interface WasteRecord {
  id: string;
  userId: string;
  isBaseline: boolean;
  recordDate: string;
  collectionPeriod?: string;
  unit?: string;
  generalWasteKg: number;
  recyclableWasteKg: number;
  organicWasteKg: number;
  plasticWasteKg: number;
  otherWasteKg: number;
  totalWaste: number;
  recycledPercentage: number;
  wasteReduction: number | null;
  wasteReductionPercentage: number | null;
  trend?: 'ลดลง' | 'เพิ่มขึ้น' | 'คงที่';
  note: string;
  evidenceUrl: string | null;
  demo?: boolean;
  createdAt: string;
}

export interface ElectricityRecord {
  id: string;
  userId: string;
  isBaseline: boolean;
  billingMonth: number;
  billingYear: number;
  electricityKwh: number;
  householdMembers: number;
  recordDate: string;
  previousKwh: number | null;
  differenceKwh: number | null;
  changePercentage: number | null;
  trend: 'ลดลง' | 'เพิ่มขึ้น' | 'คงที่';
  note: string;
  evidenceUrl: string | null;
  demo?: boolean;
  createdAt: string;
}

export interface WaterRecord {
  id: string;
  userId: string;
  isBaseline: boolean;
  billingMonth: number;
  billingYear: number;
  waterUnits: number;
  householdMembers: number;
  recordDate: string;
  previousUnits: number | null;
  difference: number | null;
  changePercentage: number | null;
  trend: 'ลดลง' | 'เพิ่มขึ้น' | 'คงที่';
  note: string;
  evidenceUrl: string | null;
  demo?: boolean;
  createdAt: string;
}

export interface FamilyMissionRecord {
  id: string;
  userId: string;
  missionCode:
    | 'zero_waste_day'
    | 'energy_saving_day'
    | 'water_saving_week'
    | 'no_single_use_plastic_day'
    | 'food_waste_challenge';
  missionTitle: string;
  participatingMembers: number;
  date: string;
  summary: string;
  reflection: string;
  evidenceUrl: string | null;
  demo?: boolean;
  createdAt: string;
}

export interface TeacherObservation {
  id: string;
  studentId: string;
  studentName?: string;
  classId?: string | null;
  teacherId: string;
  teacherName?: string;
  assessmentPeriod: 'pre' | 'during' | 'post';
  scores: Record<BehaviorDomainKey, number>;
  totalScore: number;
  comment: string;
  demo?: boolean;
  createdAt: string;
}

export interface EvidenceDoc {
  id: string;
  userId: string;
  sourceType: 'action_record' | 'waste' | 'electricity' | 'water' | 'family_mission';
  sourceId: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  demo?: boolean;
  createdAt: string;
}

export interface BadgeDefinition {
  id: string;
  code: string;
  name: string;
  nameTh: string;
  description: string;
  iconName: string;
  requirementType: 'mission_count' | 'action_count' | 'waste_report' | 'electricity_report' | 'water_report' | 'total_points' | 'streak';
  requirementValue: number;
  active: boolean;
}

export interface UserBadge {
  id: string;
  userId: string;
  badgeId: string;
  badgeCode: string;
  badgeName: string;
  earnedAt: string;
  demo?: boolean;
}

export interface LevelDefinition {
  id: string;
  level: number;
  titleEn: string;
  titleTh: string;
  minPoints: number;
  maxPoints: number;
  description: string;
  iconName: string;
}

export interface PointTransaction {
  id: string;
  userId: string;
  type: 'learning' | 'action';
  points: number;
  sourceType:
    | 'pre_assessment'
    | 'baseline'
    | 'mission'
    | 'commitment'
    | 'action_checkin'
    | 'teacher_verified_action'
    | 'home_eco_report'
    | 'family_mission'
    | 'post_assessment'
    | 'follow_up';
  sourceId: string;
  reason: string;
  demo?: boolean;
  createdAt: string;
}

export interface FollowUpRecord {
  id: string;
  userId: string;
  stillPracticing: 'yes' | 'sometimes' | 'no';
  frequency: 'daily' | '4_5_days_week' | '2_3_days_week' | 'rarely';
  obstacles: string;
  routineBehaviors: string;
  stoppedBehaviors: string;
  reflection: string;
  newWasteKg?: number | null;
  newElectricityKwh?: number | null;
  newWaterUnits?: number | null;
  demo?: boolean;
  createdAt: string;
}

export interface AppNotification {
  id: string;
  userId: string;
  roleTarget?: UserRole;
  title: string;
  message: string;
  type: 'mission' | 'action_due' | 'verification' | 'badge' | 'followup' | 'system';
  read: boolean;
  link?: string;
  demo?: boolean;
  createdAt: string;
}

export interface SystemSettings {
  id: string;
  schoolName: string;
  academicYear: string;
  defaultActionPlanDays: 7 | 14;
  followUpDays: number;
  postAssessmentUnlocked: boolean;
  followUpUnlocked: boolean;
  behaviorIndicators: {
    domain: BehaviorDomainKey;
    label: string;
    indicators: string[];
  }[];
  updatedAt: string;
}

