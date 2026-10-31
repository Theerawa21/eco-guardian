import { z } from 'zod';

const nonNegativeNumber = (fieldLabel: string) =>
  z.coerce
    .number({ invalid_type_error: `กรุณากรอก${fieldLabel}เป็นตัวเลขที่ถูกต้อง` })
    .min(0, { message: `${fieldLabel}ต้องไม่ติดลบ (ตั้งแต่ 0 ขึ้นไป)` })
    .max(100000, { message: `${fieldLabel}มีค่าสูงเกินจริง กรุณาตรวจสอบอีกครั้ง` });

export const loginSchema = z.object({
  email: z.string().trim().min(1, 'กรุณากรอกอีเมล').email('รูปแบบอีเมลไม่ถูกต้อง'),
  password: z.string().min(6, 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร'),
});

export type LoginFormValues = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
  firstName: z.string().trim().min(1, 'กรุณากรอกชื่อจริง'),
  lastName: z.string().trim().min(1, 'กรุณากรอกนามสกุล'),
  studentCode: z.string().trim().optional(),
  email: z.string().trim().min(1, 'กรุณากรอกอีเมล').email('รูปแบบอีเมลไม่ถูกต้อง'),
  password: z.string().min(6, 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร'),
  role: z.enum(['student', 'teacher', 'admin']),
  classId: z.string().optional(),
  gradeLevel: z.string().optional(),
  room: z.string().optional(),
});

export type RegisterFormValues = z.infer<typeof registerSchema>;

export const resetPasswordSchema = z.object({
  email: z.string().trim().min(1, 'กรุณากรอกอีเมลที่ใช้สมัคร').email('รูปแบบอีเมลไม่ถูกต้อง'),
});

export type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

export const baselineSchema = z.object({
  // Waste Baseline
  wasteRecordDate: z.string().min(1, 'กรุณาระบุวันที่บันทึกข้อมูลขยะ'),
  collectionPeriod: z.string().min(1, 'กรุณาระบุช่วงเวลาที่เก็บข้อมูล เช่น 7 วัน หรือ 1 สัปดาห์'),
  wasteUnit: z.string().min(1, 'กรุณาระบุหน่วย เช่น กิโลกรัม (kg)'),
  generalWasteKg: nonNegativeNumber('ปริมาณขยะทั่วไป'),
  recyclableWasteKg: nonNegativeNumber('ปริมาณขยะรีไซเคิล'),
  organicWasteKg: nonNegativeNumber('ปริมาณขยะอินทรีย์'),
  plasticWasteKg: nonNegativeNumber('ปริมาณขยะพลาสติก'),
  // Electricity Baseline
  elecBillingMonth: z.coerce.number().int().min(1).max(12),
  elecBillingYear: z.coerce.number().int().min(2560).max(2600),
  electricityKwh: nonNegativeNumber('หน่วยไฟฟ้า (kWh)'),
  elecRecordDate: z.string().min(1, 'กรุณาระบุวันที่บันทึกข้อมูลไฟฟ้า'),
  // Water Baseline
  waterBillingMonth: z.coerce.number().int().min(1).max(12),
  waterBillingYear: z.coerce.number().int().min(2560).max(2600),
  waterUnits: nonNegativeNumber('หน่วยน้ำประปา'),
  waterRecordDate: z.string().min(1, 'กรุณาระบุวันที่บันทึกข้อมูลน้ำ'),
  householdMembers: z.coerce.number().int().min(1, 'จำนวนสมาชิกในบ้านต้องตั้งแต่ 1 คนขึ้นไป').max(30),
});

export type BaselineFormValues = z.infer<typeof baselineSchema>;

export const behaviorCommitmentSchema = z.object({
  category: z.enum([
    'Waste',
    'Plastic',
    'Energy',
    'Water',
    'Food',
    'Consumption',
    'Biodiversity',
    'Community',
  ]),
  what: z.string().trim().min(5, 'กรุณาระบุพฤติกรรมที่ต้องการเปลี่ยนอย่างน้อย 5 ตัวอักษร'),
  when: z.string().trim().min(3, 'กรุณาระบุช่วงเวลาที่จะปฏิบัติ'),
  where: z.string().trim().min(2, 'กรุณาระบุสถานที่ที่จะปฏิบัติ เช่น ที่บ้าน และโรงเรียน'),
  how: z.string().trim().min(5, 'กรุณาระบุวิธีการปฏิบัติให้ชัดเจน'),
  reason: z.string().trim().min(5, 'กรุณาระบุเหตุผลหรือแรงบันดาลใจในการเลือกพฤติกรรมนี้'),
  startDate: z.string().min(1, 'กรุณาเลือกวันที่เริ่มต้น'),
});

export type BehaviorCommitmentFormValues = z.infer<typeof behaviorCommitmentSchema>;

export const actionPlanSchema = z.object({
  title: z.string().trim().min(4, 'กรุณาตั้งชื่อแผนปฏิบัติการอย่างน้อย 4 ตัวอักษร'),
  category: z.enum([
    'Waste',
    'Plastic',
    'Energy',
    'Water',
    'Food',
    'Consumption',
    'Biodiversity',
    'Community',
  ]),
  goal: z.string().trim().min(5, 'กรุณาระบุเป้าหมายของแผนปฏิบัติการ'),
  behavior: z.string().trim().min(5, 'กรุณาระบุพฤติกรรมที่จะทำรายวัน'),
  reason: z.string().trim().min(5, 'กรุณาระบุเหตุผลความสำคัญ'),
  startDate: z.string().min(1, 'กรุณาระบุวันเริ่มต้น'),
  targetDays: z.coerce.number().int().min(7, 'จำนวนวันเป้าหมายต้องอย่างน้อย 7 วัน').max(60),
  indicator: z.string().trim().min(3, 'กรุณาระบุตัวชี้วัดความสำเร็จ เช่น จำนวนชิ้นที่ลดได้ หรือจำนวนวันที่ทำสำเร็จ'),
  evidenceMethod: z.string().trim().min(3, 'กรุณาระบุวิธีเก็บหลักฐาน เช่น ภาพถ่ายขณะคัดแยกขยะ หรือบันทึกประจำวัน'),
});

export type ActionPlanFormValues = z.infer<typeof actionPlanSchema>;

export const actionRecordSchema = z.object({
  actionPlanId: z.string().min(1, 'กรุณาเลือกแผนปฏิบัติการ'),
  date: z.string().min(1, 'กรุณาระบุวันที่ปฏิบัติ'),
  status: z.enum(['completed', 'partial', 'notCompleted']),
  quantity: nonNegativeNumber('ปริมาณที่ทำได้'),
  unit: z.string().trim().min(1, 'กรุณาระบุหน่วย เช่น ชิ้น, ครั้ง, กิโลกรัม, นาที'),
  note: z.string().trim().min(3, 'กรุณาบันทึกรายละเอียดสั้นๆ'),
  obstacle: z.string().trim().default('ไม่มีอุปสรรค'),
  reflection: z.string().trim().min(5, 'กรุณาเขียนสะท้อนคิดสิ่งที่ได้เรียนรู้จากการลงมือทำ (อย่างน้อย 5 ตัวอักษร)'),
});

export type ActionRecordFormValues = z.infer<typeof actionRecordSchema>;

export const wasteReportSchema = z.object({
  recordDate: z.string().min(1, 'กรุณาระบุวันที่บันทึกข้อมูล'),
  generalWasteKg: nonNegativeNumber('ขยะทั่วไป (กิโลกรัม)'),
  recyclableWasteKg: nonNegativeNumber('ขยะรีไซเคิล (กิโลกรัม)'),
  organicWasteKg: nonNegativeNumber('ขยะอินทรีย์ (กิโลกรัม)'),
  plasticWasteKg: nonNegativeNumber('ขยะพลาสติก (กิโลกรัม)'),
  otherWasteKg: nonNegativeNumber('ขยะอื่นๆ (กิโลกรัม)'),
  note: z.string().trim().default(''),
});

export type WasteReportFormValues = z.infer<typeof wasteReportSchema>;

export const electricityReportSchema = z.object({
  billingMonth: z.coerce.number().int().min(1, 'เลือกเดือน 1-12').max(12),
  billingYear: z.coerce.number().int().min(2560, 'ระบุปี พ.ศ.').max(2600),
  electricityKwh: nonNegativeNumber('จำนวนหน่วยไฟฟ้า (kWh)'),
  householdMembers: z.coerce.number().int().min(1, 'จำนวนสมาชิกในบ้านอย่างน้อย 1 คน').max(30),
  recordDate: z.string().min(1, 'กรุณาระบุวันที่บันทึก'),
  note: z.string().trim().default(''),
});

export type ElectricityReportFormValues = z.infer<typeof electricityReportSchema>;

export const waterReportSchema = z.object({
  billingMonth: z.coerce.number().int().min(1, 'เลือกเดือน 1-12').max(12),
  billingYear: z.coerce.number().int().min(2560, 'ระบุปี พ.ศ.').max(2600),
  waterUnits: nonNegativeNumber('จำนวนหน่วยน้ำประปา (ยูนิต/ลบ.ม.)'),
  householdMembers: z.coerce.number().int().min(1, 'จำนวนสมาชิกในบ้านอย่างน้อย 1 คน').max(30),
  recordDate: z.string().min(1, 'กรุณาระบุวันที่บันทึก'),
  note: z.string().trim().default(''),
});

export type WaterReportFormValues = z.infer<typeof waterReportSchema>;

export const familyMissionSchema = z.object({
  missionCode: z.enum([
    'zero_waste_day',
    'energy_saving_day',
    'water_saving_week',
    'no_single_use_plastic_day',
    'food_waste_challenge',
  ]),
  participatingMembers: z.coerce.number().int().min(1, 'ระบุจำนวนสมาชิกที่ร่วมกิจกรรม').max(25),
  date: z.string().min(1, 'กรุณาระบุวันที่ทำกิจกรรมครอบครัว'),
  summary: z.string().trim().min(5, 'กรุณาสรุปกิจกรรมที่ทำร่วมกับครอบครัว'),
  reflection: z.string().trim().min(5, 'กรุณาเขียนความรู้สึกหรือสิ่งที่ครอบครัวได้เรียนรู้ร่วมกัน'),
});

export type FamilyMissionFormValues = z.infer<typeof familyMissionSchema>;

export const teacherObservationSchema = z.object({
  studentId: z.string().min(1, 'กรุณาเลือกนักเรียน'),
  assessmentPeriod: z.enum(['pre', 'during', 'post']),
  waste_management: z.coerce.number().int().min(1).max(5),
  energy_water_saving: z.coerce.number().int().min(1).max(5),
  responsible_consumption: z.coerce.number().int().min(1).max(5),
  common_environment_care: z.coerce.number().int().min(1).max(5),
  environmental_citizenship: z.coerce.number().int().min(1).max(5),
  comment: z.string().trim().min(3, 'กรุณาบันทึกข้อสังเกตพฤติกรรมของนักเรียน'),
});

export type TeacherObservationFormValues = z.infer<typeof teacherObservationSchema>;

export const followUpSchema = z.object({
  stillPracticing: z.enum(['yes', 'sometimes', 'no']),
  frequency: z.enum(['daily', '4_5_days_week', '2_3_days_week', 'rarely']),
  obstacles: z.string().trim().min(3, 'กรุณาระบุอุปสรรคที่พบในการรักษาพฤติกรรม'),
  routineBehaviors: z.string().trim().min(3, 'กรุณาระบุพฤติกรรมที่กลายเป็นกิจวัตรประจำวันแล้ว'),
  stoppedBehaviors: z.string().trim().min(2, 'กรุณาระบุพฤติกรรมที่ทำน้อยลงหรือหยุดทำ (หากไม่มีให้ระบุว่า ไม่มี)'),
  reflection: z.string().trim().min(5, 'กรุณาเขียนสะท้อนคิดหลังผ่านช่วงติดตามผล'),
  newWasteKg: z.preprocess(
    (val) => (val === '' || val === null || val === undefined ? null : Number(val)),
    z.number().min(0).nullable().optional()
  ),
  newElectricityKwh: z.preprocess(
    (val) => (val === '' || val === null || val === undefined ? null : Number(val)),
    z.number().min(0).nullable().optional()
  ),
  newWaterUnits: z.preprocess(
    (val) => (val === '' || val === null || val === undefined ? null : Number(val)),
    z.number().min(0).nullable().optional()
  ),
});

export type FollowUpFormValues = z.infer<typeof followUpSchema>;

