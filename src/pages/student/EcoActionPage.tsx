import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  CalendarCheck,
  CheckCircle2,
  Clock,
  Flame,
  HeartHandshake,
  Loader2,
  PlusCircle,
  XCircle,
  AlertTriangle,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useStudentEcoState } from '../../hooks/useStudentEcoState';
import {
  ActionPlanFormValues,
  actionPlanSchema,
  ActionRecordFormValues,
  actionRecordSchema,
  FamilyMissionFormValues,
  familyMissionSchema,
} from '../../schemas';
import { BEHAVIOR_CATEGORIES, FAMILY_ECO_MISSIONS } from '../../constants';
import {
  createEcoActionPlan,
  getSystemSettings,
  submitDailyActionRecord,
  submitFamilyMissionRecord,
} from '../../services/firestore/ecoDataService';
import { EvidenceUploadField } from '../../components/forms/EvidenceUploadField';
import { FeedbackBanner, LoadingState } from '../../components/ui/StateViews';

export const EcoActionPage: React.FC = () => {
  const { user } = useAuth();
  const state = useStudentEcoState(user?.uid);

  const [activeTab, setActiveTab] = useState<'checkin' | 'plan' | 'family'>('checkin');
  const [defaultTargetDays, setDefaultTargetDays] = useState<7 | 14>(14);
  const [checkinEvidenceUrl, setCheckinEvidenceUrl] = useState<string | null>(null);
  const [familyEvidenceUrl, setFamilyEvidenceUrl] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const today = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    getSystemSettings().then((s) => {
      setDefaultTargetDays(s.defaultActionPlanDays || 14);
    });
  }, []);

  const planForm = useForm<ActionPlanFormValues>({
    resolver: zodResolver(actionPlanSchema),
    defaultValues: {
      title: '',
      category: 'Waste',
      goal: 'ปฏิบัติต่อเนื่องทุกวันและลดการใช้ทรัพยากรในบ้าน',
      behavior: '',
      reason: '',
      startDate: today,
      targetDays: 14,
      indicator: 'จำนวนวันที่ทำสำเร็จและปริมาณที่ลดได้',
      evidenceMethod: 'ภาพถ่ายขณะลงมือทำและบันทึกประจำวัน',
    },
  });

  const checkinForm = useForm<ActionRecordFormValues>({
    resolver: zodResolver(actionRecordSchema),
    defaultValues: {
      actionPlanId: '',
      date: today,
      status: 'completed',
      quantity: 1,
      unit: 'ครั้ง/ชิ้น',
      note: '',
      obstacle: 'ไม่มีอุปสรรค',
      reflection: '',
    },
  });

  const familyForm = useForm<FamilyMissionFormValues>({
    resolver: zodResolver(familyMissionSchema),
    defaultValues: {
      missionCode: 'zero_waste_day',
      participatingMembers: 3,
      date: today,
      summary: '',
      reflection: '',
    },
  });

  useEffect(() => {
    if (state.commitment) {
      planForm.setValue('category', state.commitment.category);
      planForm.setValue('behavior', state.commitment.what);
      planForm.setValue('reason', state.commitment.reason);
      planForm.setValue(
        'title',
        `แผนปฏิบัติการ ${defaultTargetDays} วัน: ${state.commitment.what.slice(0, 35)}`
      );
    }
    planForm.setValue('targetDays', defaultTargetDays);
  }, [state.commitment, defaultTargetDays, planForm]);

  useEffect(() => {
    if (state.actionPlans.length > 0 && !checkinForm.getValues('actionPlanId')) {
      checkinForm.setValue('actionPlanId', state.actionPlans[0].id);
    }
  }, [state.actionPlans, checkinForm]);

  const handleCreatePlan = async (values: ActionPlanFormValues) => {
    if (!user) return;
    setFeedback(null);
    try {
      const created = await createEcoActionPlan({
        userId: user.uid,
        ...values,
        demo: user.demo,
      });
      await state.refresh();
      checkinForm.setValue('actionPlanId', created.id);
      setActiveTab('checkin');
      setFeedback({
        type: 'success',
        message: `สร้างแผนปฏิบัติการ "${created.title}" (${created.targetDays} วัน) เรียบร้อยแล้ว!`,
      });
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err?.message || 'ไม่สามารถสร้างแผนปฏิบัติการได้',
      });
    }
  };

  const handleDailyCheckin = async (values: ActionRecordFormValues) => {
    if (!user) return;
    setFeedback(null);
    try {
      const selectedPlan = state.actionPlans.find(
        (p) => p.id === values.actionPlanId
      );
      await submitDailyActionRecord({
        userId: user.uid,
        studentName: user.displayName,
        classId: user.classId,
        actionPlanId: values.actionPlanId,
        actionPlanTitle: selectedPlan?.title || 'แผนปฏิบัติการรักษ์โลก',
        date: values.date,
        status: values.status,
        quantity: values.quantity,
        unit: values.unit,
        note: values.note,
        obstacle: values.obstacle || 'ไม่มีอุปสรรค',
        reflection: values.reflection,
        evidenceUrl: checkinEvidenceUrl,
        demo: user.demo,
      });
      setCheckinEvidenceUrl(null);
      checkinForm.reset({
        actionPlanId: values.actionPlanId,
        date: today,
        status: 'completed',
        quantity: 1,
        unit: values.unit,
        note: '',
        obstacle: 'ไม่มีอุปสรรค',
        reflection: '',
      });
      await state.refresh();
      setFeedback({
        type: 'success',
        message:
          'บันทึกการปฏิบัติประจำวัน (Daily Check-in) สำเร็จ! รายการถูกส่งให้ครูตรวจรับรองแล้ว',
      });
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err?.message || 'ไม่สามารถบันทึกผลประจำวันได้',
      });
    }
  };

  const handleFamilyMissionSubmit = async (values: FamilyMissionFormValues) => {
    if (!user) return;
    setFeedback(null);
    try {
      await submitFamilyMissionRecord({
        userId: user.uid,
        ...values,
        evidenceUrl: familyEvidenceUrl,
        demo: user.demo,
      });
      setFamilyEvidenceUrl(null);
      familyForm.reset({
        missionCode: 'zero_waste_day',
        participatingMembers: 3,
        date: today,
        summary: '',
        reflection: '',
      });
      await state.refresh();
      setFeedback({
        type: 'success',
        message: 'บันทึกการเข้าร่วมภารกิจครอบครัว (Family Eco Mission) สำเร็จ!',
      });
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err?.message || 'ไม่สามารถบันทึกภารกิจครอบครัวได้',
      });
    }
  };

  if (state.loading) {
    return <LoadingState message="กำลังโหลดแผนปฏิบัติการและประวัติการลงมือทำ..." />;
  }

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-eco-200 bg-white p-6 shadow-xs">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex items-start gap-3.5">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
              <Flame className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-slate-900">
                แผนปฏิบัติการและบันทึกผลรายวัน (Eco Action & Family Mission)
              </h1>
              <p className="text-xs text-slate-600">
                สร้างแผนปฏิบัติการ 7 หรือ 14 วัน บันทึกการลงมือทำรายวันพร้อมภาพหลักฐาน และทำภารกิจร่วมกับครอบครัว
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('checkin')}
              className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
                activeTab === 'checkin'
                  ? 'bg-eco-600 text-white shadow-xs'
                  : 'border border-slate-200 bg-slate-50 text-slate-700'
              }`}
            >
              1. บันทึกรายวัน (Daily Check-in)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('plan')}
              className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
                activeTab === 'plan'
                  ? 'bg-eco-600 text-white shadow-xs'
                  : 'border border-slate-200 bg-slate-50 text-slate-700'
              }`}
            >
              2. สร้างแผน Eco Action Plan
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('family')}
              className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
                activeTab === 'family'
                  ? 'bg-eco-600 text-white shadow-xs'
                  : 'border border-slate-200 bg-slate-50 text-slate-700'
              }`}
            >
              3. ภารกิจครอบครัว (Family Mission)
            </button>
          </div>
        </div>
      </div>

      {feedback && (
        <FeedbackBanner
          type={feedback.type}
          message={feedback.message}
          onClose={() => setFeedback(null)}
        />
      )}

      {/* TAB 1: DAILY CHECK-IN */}
      {activeTab === 'checkin' && (
        <div className="grid gap-6 lg:grid-cols-12">
          <div className="lg:col-span-6 rounded-2xl border border-eco-100 bg-white p-6 shadow-xs space-y-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <CalendarCheck className="h-5 w-5 text-eco-600" />
              บันทึกการปฏิบัติประจำวัน (Daily Eco Action Record)
            </h2>

            {state.actionPlans.length === 0 ? (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900 space-y-2">
                <p className="font-bold">คุณยังไม่มีแผนปฏิบัติการ (Eco Action Plan)</p>
                <p>กรุณาสร้างแผนปฏิบัติการก่อนเริ่มบันทึกการลงมือทำรายวัน</p>
                <button
                  type="button"
                  onClick={() => setActiveTab('plan')}
                  className="rounded-lg bg-amber-600 px-3 py-1.5 font-bold text-white"
                >
                  ไปสร้างแผน Eco Action Plan
                </button>
              </div>
            ) : (
              <form
                onSubmit={checkinForm.handleSubmit(handleDailyCheckin)}
                className="space-y-4"
                noValidate
              >
                <div>
                  <label className="block text-xs font-bold text-slate-700">
                    เลือกแผนปฏิบัติการ *
                  </label>
                  <select
                    {...checkinForm.register('actionPlanId')}
                    className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                  >
                    {state.actionPlans.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.title} ({p.targetDays} วัน)
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700">
                      วันที่ปฏิบัติ *
                    </label>
                    <input
                      type="date"
                      {...checkinForm.register('date')}
                      className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700">
                      สถานะการปฏิบัติ *
                    </label>
                    <select
                      {...checkinForm.register('status')}
                      className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                    >
                      <option value="completed">ทำสำเร็จตามเป้าหมาย (Completed)</option>
                      <option value="partial">ทำได้บางส่วน (Partial)</option>
                      <option value="notCompleted">ยังไม่ได้ทำในวันนี้ (Not Completed)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700">
                      จำนวน/ปริมาณที่ทำได้ *
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      {...checkinForm.register('quantity')}
                      className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700">
                      หน่วยวัด *
                    </label>
                    <input
                      type="text"
                      {...checkinForm.register('unit')}
                      placeholder="เช่น ชิ้น, ถุง, ครั้ง, นาที"
                      className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700">
                    รายละเอียดสิ่งที่ทำในวันนี้ (Note) *
                  </label>
                  <input
                    type="text"
                    {...checkinForm.register('note')}
                    placeholder="เช่น แยกขวดพลาสติกและกล่องนมที่บ้าน 5 ชิ้น"
                    className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                  />
                  {checkinForm.formState.errors.note && (
                    <p className="mt-1 text-xs text-red-600">
                      {checkinForm.formState.errors.note.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700">
                    อุปสรรคที่พบ (Obstacle)
                  </label>
                  <input
                    type="text"
                    {...checkinForm.register('obstacle')}
                    placeholder="เช่น ไม่มีอุปสรรค หรือ กลับบ้านเย็นจึงทำร่วมกับแม่"
                    className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700">
                    การสะท้อนคิดจากการลงมือทำ (Reflection) *
                  </label>
                  <textarea
                    rows={2}
                    {...checkinForm.register('reflection')}
                    placeholder="รู้สึกอย่างไร หรือได้เรียนรู้อะไรจากการปฏิบัติในวันนี้?"
                    className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                  />
                  {checkinForm.formState.errors.reflection && (
                    <p className="mt-1 text-xs text-red-600">
                      {checkinForm.formState.errors.reflection.message}
                    </p>
                  )}
                </div>

                {user && (
                  <EvidenceUploadField
                    uid={user.uid}
                    value={checkinEvidenceUrl}
                    onChange={setCheckinEvidenceUrl}
                  />
                )}

                <button
                  type="submit"
                  disabled={checkinForm.formState.isSubmitting}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-eco-600 px-5 py-3 text-sm font-bold text-white shadow-sm hover:bg-eco-700 disabled:opacity-60"
                >
                  {checkinForm.formState.isSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4" />
                  )}
                  <span>บันทึก Check-in รายวัน</span>
                </button>
              </form>
            )}
          </div>

          {/* History & Teacher Verification Status */}
          <div className="lg:col-span-6 rounded-2xl border border-eco-100 bg-white p-6 shadow-xs space-y-4">
            <h2 className="text-base font-bold text-slate-900">
              ประวัติการบันทึกและสถานะการรับรองจากครู ({state.actionRecords.length} รายการ)
            </h2>

            <div className="max-h-[600px] space-y-3 overflow-y-auto pr-1">
              {state.actionRecords.length === 0 ? (
                <p className="py-8 text-center text-xs text-slate-500">
                  ยังไม่มีรายการบันทึกปฏิบัติการรายวัน
                </p>
              ) : (
                state.actionRecords.map((rec) => {
                  const statusBadge =
                    rec.teacherVerification === 'approved' ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-eco-100 px-2.5 py-0.5 text-[11px] font-bold text-eco-800">
                        <CheckCircle2 className="h-3.5 w-3.5" /> ครูอนุมัติแล้ว (+25 แต้ม)
                      </span>
                    ) : rec.teacherVerification === 'revision_required' ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-bold text-amber-800">
                        <AlertTriangle className="h-3.5 w-3.5" /> ขอแก้ไขเพิ่มเติม
                      </span>
                    ) : rec.teacherVerification === 'rejected' ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-[11px] font-bold text-red-800">
                        <XCircle className="h-3.5 w-3.5" /> ไม่ผ่านการรับรอง
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-sky-100 px-2.5 py-0.5 text-[11px] font-bold text-sky-800">
                        <Clock className="h-3.5 w-3.5" /> รอครูตรวจหลักฐาน
                      </span>
                    );

                  return (
                    <div
                      key={rec.id}
                      className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 space-y-2"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-xs font-bold text-slate-900">
                          วันที่ {rec.date} • ปริมาณ: {rec.quantity} {rec.unit}
                        </span>
                        {statusBadge}
                      </div>
                      <p className="text-xs font-semibold text-slate-800">{rec.note}</p>
                      <p className="text-xs text-slate-600">
                        <strong>การสะท้อนคิด:</strong> {rec.reflection}
                      </p>
                      {rec.teacherComment && (
                        <div className="rounded-xl border border-eco-200 bg-white p-2.5 text-xs text-eco-900">
                          <strong>ความเห็นจากครูที่ปรึกษา:</strong> {rec.teacherComment}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: CREATE ECO ACTION PLAN */}
      {activeTab === 'plan' && (
        <div className="rounded-2xl border border-eco-100 bg-white p-6 shadow-xs space-y-5">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <PlusCircle className="h-5 w-5 text-eco-600" />
              สร้างแผนปฏิบัติการสิ่งแวดล้อม (Eco Action Plan)
            </h2>
            <p className="text-xs text-slate-500">
              กำหนดเป้าหมายระยะเวลา 7 หรือ 14 วัน ตัวชี้วัด และวิธีการเก็บหลักฐานการลงมือทำ
            </p>
          </div>

          <form
            onSubmit={planForm.handleSubmit(handleCreatePlan)}
            className="space-y-4"
            noValidate
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-bold text-slate-700">
                  ชื่อแผนปฏิบัติการ (Title) *
                </label>
                <input
                  type="text"
                  {...planForm.register('title')}
                  placeholder="เช่น ภารกิจ 14 วัน คัดแยกขยะในบ้านทุกวัน"
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm"
                />
                {planForm.formState.errors.title && (
                  <p className="mt-1 text-xs text-red-600">
                    {planForm.formState.errors.title.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700">
                  หมวดหมู่ (Category) *
                </label>
                <select
                  {...planForm.register('category')}
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm"
                >
                  {BEHAVIOR_CATEGORIES.map((c) => (
                    <option key={c.key} value={c.key}>
                      {c.labelTh}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-bold text-slate-700">
                  วันเริ่มต้น (Start Date) *
                </label>
                <input
                  type="date"
                  {...planForm.register('startDate')}
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700">
                  ระยะเวลาเป้าหมาย (Target Days - ค่าเริ่มต้น {defaultTargetDays} วัน) *
                </label>
                <select
                  {...planForm.register('targetDays')}
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm"
                >
                  <option value={7}>7 วัน (1 สัปดาห์)</option>
                  <option value={14}>14 วัน (2 สัปดาห์)</option>
                  <option value={21}>21 วัน (3 สัปดาห์)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700">
                เป้าหมายของแผน (Goal) *
              </label>
              <input
                type="text"
                {...planForm.register('goal')}
                className="mt-1 w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700">
                พฤติกรรมที่จะทำรายวัน (Behavior) *
              </label>
              <input
                type="text"
                {...planForm.register('behavior')}
                className="mt-1 w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-bold text-slate-700">
                  ตัวชี้วัดความสำเร็จ (Indicator) *
                </label>
                <input
                  type="text"
                  {...planForm.register('indicator')}
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700">
                  วิธีเก็บหลักฐาน (Evidence Method) *
                </label>
                <input
                  type="text"
                  {...planForm.register('evidenceMethod')}
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700">
                เหตุผลความสำคัญ (Reason) *
              </label>
              <textarea
                rows={2}
                {...planForm.register('reason')}
                className="mt-1 w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm"
              />
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={planForm.formState.isSubmitting}
                className="inline-flex items-center gap-2 rounded-xl bg-eco-600 px-6 py-3 text-sm font-bold text-white hover:bg-eco-700"
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>บันทึกแผน Eco Action Plan</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 3: FAMILY ECO MISSION (Section 27) */}
      {activeTab === 'family' && (
        <div className="grid gap-6 lg:grid-cols-12">
          <div className="lg:col-span-6 rounded-2xl border border-eco-100 bg-white p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <HeartHandshake className="h-5 w-5 text-eco-600" />
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  บันทึกภารกิจรักษ์โลกร่วมกับครอบครัว (Family Eco Mission)
                </h2>
                <p className="text-xs text-slate-500">
                  ชวนคนในบ้านทำกิจกรรมร่วมกันโดยไม่ต้องสร้างบัญชีผู้ปกครองแยก
                </p>
              </div>
            </div>

            <form
              onSubmit={familyForm.handleSubmit(handleFamilyMissionSubmit)}
              className="space-y-4"
              noValidate
            >
              <div>
                <label className="block text-xs font-bold text-slate-700">
                  เลือกภารกิจครอบครัว *
                </label>
                <select
                  {...familyForm.register('missionCode')}
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                >
                  {FAMILY_ECO_MISSIONS.map((fm) => (
                    <option key={fm.code} value={fm.code}>
                      {fm.title} (+{fm.points} แต้ม)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700">
                    จำนวนสมาชิกที่ร่วมทำ (คน) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    {...familyForm.register('participatingMembers')}
                    className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700">
                    วันที่ทำกิจกรรม *
                  </label>
                  <input
                    type="date"
                    {...familyForm.register('date')}
                    className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700">
                  สรุปสิ่งที่ครอบครัวลงมือทำร่วมกัน *
                </label>
                <textarea
                  rows={2}
                  {...familyForm.register('summary')}
                  placeholder="เช่น คุณพ่อ คุณแม่ และฉันร่วมกันแยกขยะรีไซเคิลและงดรับถุงพลาสติกที่ตลาด"
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                />
                {familyForm.formState.errors.summary && (
                  <p className="mt-1 text-xs text-red-600">
                    {familyForm.formState.errors.summary.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700">
                  ความรู้สึกและสิ่งที่ครอบครัวได้เรียนรู้ (Reflection) *
                </label>
                <textarea
                  rows={2}
                  {...familyForm.register('reflection')}
                  placeholder="เช่น ทุกคนในบ้านสนุกและเห็นตรงกันว่าขยะลดลงมาก"
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                />
              </div>

              {user && (
                <EvidenceUploadField
                  uid={user.uid}
                  value={familyEvidenceUrl}
                  onChange={setFamilyEvidenceUrl}
                />
              )}

              <button
                type="submit"
                disabled={familyForm.formState.isSubmitting}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-eco-600 px-5 py-3 text-sm font-bold text-white hover:bg-eco-700"
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>บันทึกภารกิจครอบครัว</span>
              </button>
            </form>
          </div>

          <div className="lg:col-span-6 rounded-2xl border border-eco-100 bg-white p-6 shadow-xs space-y-4">
            <h2 className="text-base font-bold text-slate-900">
              ภารกิจครอบครัวที่บันทึกแล้ว ({state.familyMissions.length} รายการ)
            </h2>
            <div className="space-y-3">
              {state.familyMissions.length === 0 ? (
                <p className="py-8 text-center text-xs text-slate-500">
                  ยังไม่มีประวัติการบันทึกภารกิจครอบครัว
                </p>
              ) : (
                state.familyMissions.map((fm) => (
                  <div
                    key={fm.id}
                    className="rounded-2xl border border-eco-200 bg-eco-50/40 p-4 space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-eco-900">
                        {fm.missionTitle}
                      </span>
                      <span className="text-xs text-slate-500">
                        {fm.date} ({fm.participatingMembers} คน)
                      </span>
                    </div>
                    <p className="text-xs text-slate-700">{fm.summary}</p>
                    <p className="text-xs italic text-slate-600">“{fm.reflection}”</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

