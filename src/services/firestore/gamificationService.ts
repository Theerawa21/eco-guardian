import {
  ActionRecord,
  BadgeDefinition,
  ElectricityRecord,
  LevelDefinition,
  MissionProgress,
  PointTransaction,
  UserBadge,
  WasteRecord,
  WaterRecord,
} from '../../types';
import { DEFAULT_BADGES, DEFAULT_LEVELS } from '../../constants';
import {
  COLLECTIONS,
  getDocument,
  listDocuments,
  setDocument,
} from './collections';
import { createNotification } from './notificationService';

export async function getLevels(): Promise<LevelDefinition[]> {
  const docs = await listDocuments<LevelDefinition>(COLLECTIONS.LEVELS);
  const source = docs.length > 0 ? docs : DEFAULT_LEVELS;
  return [...source].sort((a, b) => a.level - b.level);
}

export async function saveLevelDefinition(level: LevelDefinition): Promise<LevelDefinition> {
  return setDocument(COLLECTIONS.LEVELS, level.id, level);
}

export async function getBadges(): Promise<BadgeDefinition[]> {
  const docs = await listDocuments<BadgeDefinition>(COLLECTIONS.BADGES);
  return docs.length > 0 ? docs : DEFAULT_BADGES;
}

export async function saveBadgeDefinition(badge: BadgeDefinition): Promise<BadgeDefinition> {
  return setDocument(COLLECTIONS.BADGES, badge.id, badge);
}

/**
 * Section 46: IMPORTANT: POINT TRANSACTIONS
 * สร้าง Unique Logic ป้องกันการได้คะแนนซ้ำจาก Event เดียว
 */
export async function awardPointsTransaction(params: {
  userId: string;
  type: 'learning' | 'action';
  points: number;
  sourceType: PointTransaction['sourceType'];
  sourceId: string;
  reason: string;
  demo?: boolean;
}): Promise<{ awarded: boolean; transaction: PointTransaction }> {
  const deterministicId = `tx_${params.userId}_${params.sourceType}_${params.sourceId}`;
  const existing = await getDocument<PointTransaction>(
    COLLECTIONS.POINT_TRANSACTIONS,
    deterministicId
  );

  if (existing) {
    return { awarded: false, transaction: existing };
  }

  const tx: PointTransaction = {
    id: deterministicId,
    userId: params.userId,
    type: params.type,
    points: Math.max(1, Math.round(params.points)),
    sourceType: params.sourceType,
    sourceId: params.sourceId,
    reason: params.reason,
    demo: params.demo ?? false,
    createdAt: new Date().toISOString(),
  };

  await setDocument(COLLECTIONS.POINT_TRANSACTIONS, deterministicId, tx);
  await evaluateAndGrantBadges(params.userId, params.demo);

  return { awarded: true, transaction: tx };
}

export async function getUserPointTransactions(userId: string): Promise<PointTransaction[]> {
  const list = await listDocuments<PointTransaction>(COLLECTIONS.POINT_TRANSACTIONS, [
    { field: 'userId', op: '==', value: userId },
  ]);
  return list.sort((a, b) => (a.createdAt > b.createdAt ? -1 : 1));
}

export async function getUserPointSummary(userId: string): Promise<{
  learningPoints: number;
  actionPoints: number;
  totalPoints: number;
  currentLevel: LevelDefinition;
  nextLevel: LevelDefinition | null;
  levelProgressPercent: number;
  transactions: PointTransaction[];
}> {
  const [transactions, levels] = await Promise.all([
    getUserPointTransactions(userId),
    getLevels(),
  ]);

  let learningPoints = 0;
  let actionPoints = 0;

  for (const tx of transactions) {
    if (tx.type === 'learning') {
      learningPoints += tx.points;
    } else {
      actionPoints += tx.points;
    }
  }

  const totalPoints = learningPoints + actionPoints;
  const sortedLevels = [...levels].sort((a, b) => a.minPoints - b.minPoints);

  let currentLevel = sortedLevels[0] || DEFAULT_LEVELS[0];
  let nextLevel: LevelDefinition | null = null;

  for (let i = 0; i < sortedLevels.length; i++) {
    const lvl = sortedLevels[i];
    if (totalPoints >= lvl.minPoints) {
      currentLevel = lvl;
      nextLevel = sortedLevels[i + 1] || null;
    }
  }

  let levelProgressPercent = 100;
  if (nextLevel) {
    const span = Math.max(1, nextLevel.minPoints - currentLevel.minPoints);
    const gained = Math.max(0, totalPoints - currentLevel.minPoints);
    levelProgressPercent = Math.min(100, Math.round((gained / span) * 100));
  }

  return {
    learningPoints,
    actionPoints,
    totalPoints,
    currentLevel,
    nextLevel,
    levelProgressPercent,
    transactions,
  };
}

export async function getUserBadges(userId: string): Promise<UserBadge[]> {
  return listDocuments<UserBadge>(COLLECTIONS.USER_BADGES, [
    { field: 'userId', op: '==', value: userId },
  ]);
}

export async function evaluateAndGrantBadges(
  userId: string,
  demo = false
): Promise<UserBadge[]> {
  const [
    badges,
    existingUserBadges,
    missionsDone,
    actionsDone,
    wasteReports,
    elecReports,
    waterReports,
    txs,
  ] = await Promise.all([
    getBadges(),
    getUserBadges(userId),
    listDocuments<MissionProgress>(COLLECTIONS.MISSION_PROGRESS, [
      { field: 'userId', op: '==', value: userId },
    ]),
    listDocuments<ActionRecord>(COLLECTIONS.ACTION_RECORDS, [
      { field: 'userId', op: '==', value: userId },
    ]),
    listDocuments<WasteRecord>(COLLECTIONS.WASTE_RECORDS, [
      { field: 'userId', op: '==', value: userId },
    ]),
    listDocuments<ElectricityRecord>(COLLECTIONS.ELECTRICITY_RECORDS, [
      { field: 'userId', op: '==', value: userId },
    ]),
    listDocuments<WaterRecord>(COLLECTIONS.WATER_RECORDS, [
      { field: 'userId', op: '==', value: userId },
    ]),
    listDocuments<PointTransaction>(COLLECTIONS.POINT_TRANSACTIONS, [
      { field: 'userId', op: '==', value: userId },
    ]),
  ]);

  const earnedIds = new Set(existingUserBadges.map((b) => b.badgeId));
  const completedMissionsCount = missionsDone.filter((m) => m.status === 'completed').length;
  const completedActionsCount = actionsDone.filter((a) => a.status === 'completed').length;
  const nonBaselineWaste = wasteReports.filter((w) => !w.isBaseline).length;
  const nonBaselineElec = elecReports.filter((e) => !e.isBaseline).length;
  const nonBaselineWater = waterReports.filter((w) => !w.isBaseline).length;
  const totalPoints = txs.reduce((acc, item) => acc + item.points, 0);

  const newlyGranted: UserBadge[] = [];

  for (const badge of badges) {
    if (!badge.active || earnedIds.has(badge.id)) continue;

    let qualified = false;
    if (badge.requirementType === 'mission_count') {
      qualified = completedMissionsCount >= badge.requirementValue;
    } else if (badge.requirementType === 'action_count') {
      qualified = completedActionsCount >= badge.requirementValue;
    } else if (badge.requirementType === 'waste_report') {
      qualified = nonBaselineWaste >= badge.requirementValue;
    } else if (badge.requirementType === 'electricity_report') {
      qualified = nonBaselineElec >= badge.requirementValue;
    } else if (badge.requirementType === 'water_report') {
      qualified = nonBaselineWater >= badge.requirementValue;
    } else if (badge.requirementType === 'total_points') {
      qualified = totalPoints >= badge.requirementValue;
    }

    if (qualified) {
      const userBadgeId = `ub_${userId}_${badge.id}`;
      const ub: UserBadge = {
        id: userBadgeId,
        userId,
        badgeId: badge.id,
        badgeCode: badge.code,
        badgeName: badge.nameTh,
        earnedAt: new Date().toISOString(),
        demo,
      };
      await setDocument(COLLECTIONS.USER_BADGES, userBadgeId, ub);
      newlyGranted.push(ub);

      if (!demo) {
        await createNotification({
          userId,
          title: `ได้รับเหรียญเกียรติยศใหม่: ${badge.nameTh}`,
          message: `ขอแสดงความยินดี! คุณปลดล็อกเหรียญ "${badge.name}" (${badge.description})`,
          type: 'badge',
          link: '/student/journey',
        });
      }
    }
  }

  return [...existingUserBadges, ...newlyGranted];
}

