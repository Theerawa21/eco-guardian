import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  QueryConstraint,
  Timestamp,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage, isFirebaseEnvConfigured, isEmulatorEnabled } from '../firebase/firebase';
import { validateEvidenceFile } from '../../utils';

export const COLLECTIONS = {
  USERS: 'users',
  CLASSROOMS: 'classrooms',
  MISSIONS: 'missions',
  MISSION_CONTENTS: 'missionContents',
  SCENARIOS: 'scenarios',
  MISSION_RESPONSES: 'missionResponses',
  MISSION_PROGRESS: 'missionProgress',
  QUESTIONS: 'questions',
  ASSESSMENTS: 'assessments',
  ASSESSMENT_RESPONSES: 'assessmentResponses',
  BEHAVIOR_COMMITMENTS: 'behaviorCommitments',
  ACTION_PLANS: 'actionPlans',
  ACTION_RECORDS: 'actionRecords',
  WASTE_RECORDS: 'wasteRecords',
  ELECTRICITY_RECORDS: 'electricityRecords',
  WATER_RECORDS: 'waterRecords',
  TEACHER_OBSERVATIONS: 'teacherObservations',
  EVIDENCE: 'evidence',
  BADGES: 'badges',
  USER_BADGES: 'userBadges',
  LEVELS: 'levels',
  POINT_TRANSACTIONS: 'pointTransactions',
  FOLLOW_UPS: 'followUps',
  NOTIFICATIONS: 'notifications',
  SYSTEM_SETTINGS: 'systemSettings',
  FAMILY_MISSION_RECORDS: 'familyMissionRecords',
} as const;

export type CollectionName = (typeof COLLECTIONS)[keyof typeof COLLECTIONS];

// In-memory runtime store used only when Firebase .env credentials are not yet configured
// (Never persisted to localStorage per Section 2 architecture rules)
const runtimeMemoryStore: Record<string, Record<string, any>> = {};

function ensureMemoryBucket(collectionName: string) {
  if (!runtimeMemoryStore[collectionName]) {
    runtimeMemoryStore[collectionName] = {};
  }
  return runtimeMemoryStore[collectionName];
}

export function isLiveFirestoreActive(): boolean {
  return isFirebaseEnvConfigured || isEmulatorEnabled;
}

function normalizeTimestamps<T>(data: any): T {
  if (!data || typeof data !== 'object') return data;
  const clone: any = Array.isArray(data) ? [] : {};
  for (const key of Object.keys(data)) {
    const val = data[key];
    if (val instanceof Timestamp) {
      clone[key] = val.toDate().toISOString();
    } else if (val && typeof val === 'object' && typeof val.toDate === 'function') {
      clone[key] = val.toDate().toISOString();
    } else if (val && typeof val === 'object') {
      clone[key] = normalizeTimestamps(val);
    } else {
      clone[key] = val;
    }
  }
  return clone as T;
}

export async function getDocument<T>(
  collectionName: CollectionName,
  id: string
): Promise<T | null> {
  if (isLiveFirestoreActive()) {
    try {
      const docRef = doc(db, collectionName, id);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        return normalizeTimestamps<T>({ id: snap.id, ...snap.data() });
      }
      return null;
    } catch (error) {
      console.warn(`Firestore getDocument fallback (${collectionName}/${id}):`, error);
    }
  }
  const bucket = ensureMemoryBucket(collectionName);
  return bucket[id] ? ( structuredClone(bucket[id]) as T ) : null;
}

export async function setDocument<T extends Record<string, any>>(
  collectionName: CollectionName,
  id: string,
  data: T
): Promise<T> {
  const payload = { ...data, id };
  const bucket = ensureMemoryBucket(collectionName);
  bucket[id] = structuredClone(payload);

  if (isLiveFirestoreActive()) {
    const docRef = doc(db, collectionName, id);
    await setDoc(docRef, payload, { merge: true });
  }
  return payload;
}

export async function updateDocument<T>(
  collectionName: CollectionName,
  id: string,
  partial: Partial<T>
): Promise<void> {
  const bucket = ensureMemoryBucket(collectionName);
  if (bucket[id]) {
    bucket[id] = { ...bucket[id], ...partial };
  }
  if (isLiveFirestoreActive()) {
    const docRef = doc(db, collectionName, id);
    await updateDoc(docRef, partial as Record<string, any>);
  }
}

export async function deleteDocument(
  collectionName: CollectionName,
  id: string
): Promise<void> {
  const bucket = ensureMemoryBucket(collectionName);
  delete bucket[id];
  if (isLiveFirestoreActive()) {
    const docRef = doc(db, collectionName, id);
    await deleteDoc(docRef);
  }
}

export async function listDocuments<T>(
  collectionName: CollectionName,
  filters?: { field: string; op: '==' | '!=' | '>=' | '<='; value: any }[]
): Promise<T[]> {
  if (isLiveFirestoreActive()) {
    try {
      const constraints: QueryConstraint[] = (filters || []).map((f) =>
        where(f.field, f.op, f.value)
      );
      const q = constraints.length
        ? query(collection(db, collectionName), ...constraints)
        : query(collection(db, collectionName));
      const snap = await getDocs(q);
      const results: T[] = [];
      snap.forEach((docSnap) => {
        results.push(normalizeTimestamps<T>({ id: docSnap.id, ...docSnap.data() }));
      });
      if (results.length > 0) {
        return results;
      }
    } catch (error) {
      console.warn(`Firestore listDocuments fallback (${collectionName}):`, error);
    }
  }

  const bucket = ensureMemoryBucket(collectionName);
  let items = Object.values(bucket) as T[];
  if (filters && filters.length > 0) {
    items = items.filter((item: any) =>
      filters.every((f) => {
        if (f.op === '==') return item[f.field] === f.value;
        if (f.op === '!=') return item[f.field] !== f.value;
        if (f.op === '>=') return item[f.field] >= f.value;
        if (f.op === '<=') return item[f.field] <= f.value;
        return true;
      })
    );
  }
  return structuredClone(items);
}

export async function uploadStorageFile(
  folder: 'evidence' | 'avatars' | 'missions',
  uid: string,
  file: File
): Promise<string> {
  const check = validateEvidenceFile(file);
  if (!check.valid) {
    throw new Error(check.error || 'ไฟล์ไม่ถูกต้อง');
  }

  const safeName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
  const path = folder === 'missions' ? `missions/${safeName}` : `${folder}/${uid}/${safeName}`;

  if (isLiveFirestoreActive()) {
    const storageRef = ref(storage, path);
    await uploadBytes(storageRef, file, { contentType: file.type });
    return await getDownloadURL(storageRef);
  }

  // Fallback object URL for local preview before Firebase Storage bucket is configured
  return URL.createObjectURL(file);
}

