import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ExternalLink,
  Globe2,
  HeartHandshake,
  Loader2,
  Lock,
  PlayCircle,
  Sparkles,
  Users,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useStudentEcoState } from '../../hooks/useStudentEcoState';
import { Mission, MissionChoice } from '../../types';
import { completeMissionStep } from '../../services/firestore/ecoDataService';
import { FeedbackBanner, LoadingState } from '../../components/ui/StateViews';

type MissionStep = 'situation' | 'learn' | 'decide' | 'impact' | 'reflection';

export const MissionMapPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const state = useStudentEcoState(user?.uid);

  const [activeMission, setActiveMission] = useState<Mission | null>(null);
  const [step, setStep] = useState<MissionStep>('situation');
  const [selectedChoice, setSelectedChoice] = useState<MissionChoice | null>(null);
  const [reflectionText, setReflectionText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);

  if (state.loading) {
    return <LoadingState message="กำลังโหลดแผนที่ภารกิจ (Mission Map)..." />;
  }

  const completedMissionIds = new Set(
    state.missionProgress
      .filter((p) => p.status === 'completed')
      .map((p) => p.missionId)
  );

  const isMissionUnlocked = (mission: Mission): boolean => {
    if (mission.requiresPreAssessment && !state.preAssessment) return false;
    if (mission.requiresBaseline && !state.hasBaseline) return false;
    if (!mission.unlockRequirementMissionId) return true;
    return completedMissionIds.has(mission.unlockRequirementMissionId);
  };

  const handleOpenMission = (mission: Mission) => {
    if (!isMissionUnlocked(mission)) {
      setFeedback({
        type: 'info',
        message: !state.preAssessment
          ? 'กรุณาทำแบบประเมินก่อนเรียน (Pre-Assessment) ก่อนเริ่มภารกิจ'
          : !state.hasBaseline
          ? 'กรุณาบันทึกข้อมูลพื้นฐานของบ้าน (Home Eco Baseline) ก่อนเริ่มภารกิจ'
          : 'กรุณาผ่านภารกิจก่อนหน้าให้สำเร็จเพื่อปลดล็อกภารกิจนี้',
      });
      return;
    }

    const prevResp = state.missionResponses.find((r) => r.missionId === mission.id);
    setActiveMission(mission);
    setStep('situation');
    if (prevResp) {
      const foundChoice =
        mission.choices.find((c) => c.id === prevResp.selectedChoiceId) || null;
      setSelectedChoice(foundChoice);
      setReflectionText(prevResp.reflection || '');
    } else {
      setSelectedChoice(null);
      setReflectionText('');
    }
    setFeedback(null);
  };

  const handleCompleteMission = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !activeMission || !selectedChoice) return;
    if (reflectionText.trim().length < 10) {
      setFeedback({
        type: 'error',
        message: 'กรุณาเขียนสิ่งที่ได้เรียนรู้ (Reflection) อย่างน้อย 10 ตัวอักษร',
      });
      return;
    }

    setSubmitting(true);
    setFeedback(null);
    try {
      await completeMissionStep({
        userId: user.uid,
        mission: activeMission,
        selectedChoiceId: selectedChoice.id,
        reflection: reflectionText,
        demo: user.demo,
      });
      await state.refresh();
      setFeedback({
        type: 'success',
        message: `ยอดเยี่ยม! คุณผ่าน ${activeMission.title} และได้รับ +${activeMission.learningPoints} Learning Points เรียบร้อยแล้ว`,
      });
      const shouldPromptCommitment = activeMission.triggersCommitment;
      setActiveMission(null);
      if (shouldPromptCommitment && !state.commitment) {
        navigate('/student/commitment');
      }
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err?.message || 'เกิดข้อผิดพลาดในการบันทึกภารกิจ',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-3xl border border-eco-200 bg-white p-6 shadow-xs">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <span className="rounded-full bg-eco-100 px-3 py-1 text-xs font-bold text-eco-800">
              Interactive Environmental Learning
            </span>
            <h1 className="mt-2 text-2xl font-extrabold text-slate-900">
              แผนที่ 5 ภารกิจผู้พิทักษ์สิ่งแวดล้อม (Mission Map)
            </h1>
            <p className="text-xs text-slate-600">
              ทุกภารกิจประกอบด้วย 6 ขั้นตอน: Situation → Learn → Decide → Impact (People, Society, Planet) → Feedback → Reflection
            </p>
          </div>
          <div className="rounded-2xl bg-eco-50 px-4 py-3 text-right">
            <span className="text-xs font-semibold text-eco-800">ความก้าวหน้าของคุณ</span>
            <p className="text-2xl font-extrabold text-eco-900">
              {completedMissionIds.size}/{state.missions.length} ภารกิจ
            </p>
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

      {/* Prerequisites Alert if locked */}
      {(!state.preAssessment || !state.hasBaseline) && (
        <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs font-semibold text-amber-950">
            ต้องทำแบบประเมินก่อนเรียน (Pre-Assessment) และบันทึกข้อมูลพื้นฐานบ้าน (Home Eco Baseline) ก่อนเริ่ม Mission 1
          </p>
          <div className="flex gap-2">
            {!state.preAssessment && (
              <Link
                to="/student/pre-assessment"
                className="rounded-xl bg-amber-600 px-3 py-1.5 text-xs font-bold text-white"
              >
                ทำ Pre-Assessment
              </Link>
            )}
            {!state.hasBaseline && (
              <Link
                to="/student/baseline"
                className="rounded-xl bg-eco-600 px-3 py-1.5 text-xs font-bold text-white"
              >
                บันทึก Baseline
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Mission Map Cards */}
      {!activeMission && (
        <div className="grid gap-4">
          {state.missions.map((mission) => {
            const completed = completedMissionIds.has(mission.id);
            const unlocked = isMissionUnlocked(mission);

            return (
              <div
                key={mission.id}
                className={`rounded-2xl border p-5 transition ${
                  completed
                    ? 'border-eco-300 bg-eco-50/40'
                    : unlocked
                    ? 'border-sky-200 bg-white shadow-sm hover:border-eco-400'
                    : 'border-slate-200 bg-slate-100/70 opacity-75'
                }`}
              >
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-lg bg-eco-600 px-2.5 py-0.5 text-xs font-bold text-white">
                        Mission {mission.order}
                      </span>
                      <span className="rounded-lg bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-900">
                        +{mission.learningPoints} Learning Points
                      </span>
                      {completed && (
                        <span className="inline-flex items-center gap-1 rounded-lg bg-eco-100 px-2.5 py-0.5 text-xs font-bold text-eco-800">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          สำเร็จภารกิจแล้ว
                        </span>
                      )}
                      {!unlocked && (
                        <span className="inline-flex items-center gap-1 rounded-lg bg-slate-200 px-2.5 py-0.5 text-xs font-bold text-slate-700">
                          <Lock className="h-3.5 w-3.5" />
                          ล็อกอยู่
                        </span>
                      )}
                    </div>

                    <h2 className="text-lg font-extrabold text-slate-900">
                      {mission.title}
                    </h2>
                    <p className="text-xs text-slate-600">{mission.subtitle}</p>

                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {mission.topics.map((t) => (
                        <span
                          key={t}
                          className="rounded-full border border-slate-200 bg-white px-2.5 py-0.5 text-[11px] font-medium text-slate-600"
                        >
                          #{t}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <button
                      type="button"
                      onClick={() => handleOpenMission(mission)}
                      className={`inline-flex items-center gap-2 rounded-xl px-5 py-3 text-xs font-bold shadow-xs transition ${
                        completed
                          ? 'border border-eco-600 bg-white text-eco-700 hover:bg-eco-50'
                          : unlocked
                          ? 'bg-eco-600 text-white hover:bg-eco-700'
                          : 'bg-slate-300 text-slate-600 cursor-not-allowed'
                      }`}
                    >
                      {completed ? (
                        <>
                          <BookOpen className="h-4 w-4" />
                          <span>ทบทวนภารกิจ</span>
                        </>
                      ) : unlocked ? (
                        <>
                          <PlayCircle className="h-4 w-4" />
                          <span>เริ่มทำภารกิจ</span>
                        </>
                      ) : (
                        <>
                          <Lock className="h-4 w-4" />
                          <span>ยังไม่ปลดล็อก</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Active Mission Interactive Flow (Section 16: Situation -> Learn -> Decide -> Impact -> Feedback -> Reflection) */}
      {activeMission && (
        <div className="rounded-3xl border-2 border-eco-500 bg-white p-6 shadow-xl space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <span className="text-xs font-bold text-eco-700">
                กำลังทำภารกิจที่ {activeMission.order} (+{activeMission.learningPoints} คะแนน)
              </span>
              <h2 className="text-xl font-extrabold text-slate-900">
                {activeMission.title}
              </h2>
            </div>
            <button
              type="button"
              onClick={() => setActiveMission(null)}
              className="rounded-xl border border-slate-200 px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              กลับไปหน้าแผนที่ภารกิจ
            </button>
          </div>

          {/* Stepper Tabs */}
          <div className="grid grid-cols-5 gap-2">
            {(
              [
                { key: 'situation', label: '1. Situation (สถานการณ์)' },
                { key: 'learn', label: '2. Learn (เรียนรู้)' },
                { key: 'decide', label: '3. Decide (ตัดสินใจ)' },
                { key: 'impact', label: '4. Impact & Feedback' },
                { key: 'reflection', label: '5. Reflection (สะท้อนคิด)' },
              ] as { key: MissionStep; label: string }[]
            ).map((s) => (
              <button
                key={s.key}
                type="button"
                onClick={() => {
                  if ((s.key === 'impact' || s.key === 'reflection') && !selectedChoice) {
                    return;
                  }
                  setStep(s.key);
                }}
                className={`rounded-xl px-2 py-2.5 text-center text-xs font-bold transition ${
                  step === s.key
                    ? 'bg-eco-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-eco-50'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          {/* Step 1: Situation */}
          {step === 'situation' && (
            <div className="space-y-4 rounded-2xl bg-cream-50 p-6 border border-eco-100">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-900">
                <Sparkles className="h-3.5 w-3.5" />
                Situation: สถานการณ์จริงรอบตัวเรา
              </span>
              <h3 className="text-lg font-bold text-slate-900">
                {activeMission.situationTitle}
              </h3>
              <p className="text-sm leading-relaxed text-slate-700">
                {activeMission.situationText}
              </p>
              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setStep('learn')}
                  className="inline-flex items-center gap-2 rounded-xl bg-eco-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-eco-700"
                >
                  <span>ไปขั้นที่ 2: ศึกษาเนื้อหา (Learn)</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Learn (Text, Infographic, Video Link) */}
          {step === 'learn' && (
            <div className="space-y-5 rounded-2xl border border-sky-100 bg-sky-50/40 p-6">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-100 px-3 py-1 text-xs font-bold text-sky-900">
                <BookOpen className="h-3.5 w-3.5" />
                Learn: สาระสำคัญและอินโฟกราฟิก
              </span>
              <p className="text-sm leading-relaxed text-slate-800">
                {activeMission.learnContent.text}
              </p>

              <div className="rounded-2xl bg-white p-4 border border-sky-100 space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-sky-800">
                  ประเด็นสำคัญที่ต้องรู้ (Key Takeaways)
                </h4>
                <ul className="space-y-1.5 text-xs text-slate-700">
                  {activeMission.learnContent.keyPoints.map((kp, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-eco-600" />
                      <span>{kp}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Infographic Cards */}
              {activeMission.learnContent.infographicItems && (
                <div className="space-y-2.5">
                  <h4 className="text-xs font-bold text-slate-800">
                    📊 อินโฟกราฟิก: {activeMission.learnContent.infographicTitle}
                  </h4>
                  <div className="grid gap-3 sm:grid-cols-3">
                    {activeMission.learnContent.infographicItems.map((info, i) => (
                      <div
                        key={i}
                        className="rounded-2xl border border-eco-200 bg-white p-4 shadow-2xs"
                      >
                        <p className="text-xs font-bold text-slate-500">{info.label}</p>
                        <p className="mt-1 text-xl font-extrabold text-eco-700">
                          {info.value}
                        </p>
                        <p className="mt-1 text-xs text-slate-600">{info.detail}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeMission.learnContent.videoUrl && (
                <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3.5">
                  <span className="text-xs font-semibold text-slate-700">
                    สื่อวิดีโอเสริมการเรียนรู้ประจำภารกิจ
                  </span>
                  <a
                    href={activeMission.learnContent.videoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-sky-700 hover:underline"
                  >
                    <span>เปิดดูวิดีโอประกอบ</span>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>
              )}

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setStep('decide')}
                  className="inline-flex items-center gap-2 rounded-xl bg-eco-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-eco-700"
                >
                  <span>ไปขั้นที่ 3: ร่วมตัดสินใจ (Decide)</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Decide */}
          {step === 'decide' && (
            <div className="space-y-4">
              <div className="rounded-2xl bg-eco-50 p-4 border border-eco-200">
                <p className="text-sm font-bold text-eco-950">
                  คำถามสถานการณ์: {activeMission.decidePrompt}
                </p>
              </div>

              <div className="grid gap-3">
                {activeMission.choices.map((ch) => {
                  const isSelected = selectedChoice?.id === ch.id;
                  return (
                    <button
                      key={ch.id}
                      type="button"
                      onClick={() => {
                        setSelectedChoice(ch);
                        setStep('impact');
                      }}
                      className={`w-full rounded-2xl border p-4 text-left transition ${
                        isSelected
                          ? 'border-2 border-eco-600 bg-eco-50/70'
                          : 'border-slate-200 bg-white hover:border-eco-400 hover:bg-slate-50'
                      }`}
                    >
                      <p className="text-sm font-bold text-slate-900">{ch.label}</p>
                      <p className="mt-1 text-xs text-slate-600">{ch.description}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step 4: Impact (People, Society, Planet) & Feedback */}
          {step === 'impact' && selectedChoice && (
            <div className="space-y-5">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <span className="text-xs font-bold text-slate-500">
                  ทางเลือกที่คุณตัดสินใจ:
                </span>
                <p className="mt-0.5 text-sm font-bold text-slate-900">
                  “{selectedChoice.label}”
                </p>
              </div>

              <h3 className="text-sm font-bold text-slate-800">
                ผลกระทบจากการตัดสินใจ 3 มิติ (Impact Analysis)
              </h3>

              <div className="grid gap-4 md:grid-cols-3">
                {/* People */}
                <div className="rounded-2xl border border-sky-200 bg-sky-50/50 p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-sky-900">
                      <Users className="h-4 w-4 text-sky-600" />
                      People (ตนเองและครอบครัว)
                    </span>
                    <span className="text-sm font-extrabold text-sky-700">
                      {selectedChoice.impact.people}/100
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-white">
                    <div
                      className="h-full rounded-full bg-sky-600"
                      style={{ width: `${selectedChoice.impact.people}%` }}
                    />
                  </div>
                  <p className="text-xs text-slate-700">
                    {selectedChoice.impact.peopleText}
                  </p>
                </div>

                {/* Society */}
                <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-900">
                      <HeartHandshake className="h-4 w-4 text-amber-600" />
                      Society (โรงเรียนและชุมชน)
                    </span>
                    <span className="text-sm font-extrabold text-amber-700">
                      {selectedChoice.impact.society}/100
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-white">
                    <div
                      className="h-full rounded-full bg-amber-500"
                      style={{ width: `${selectedChoice.impact.society}%` }}
                    />
                  </div>
                  <p className="text-xs text-slate-700">
                    {selectedChoice.impact.societyText}
                  </p>
                </div>

                {/* Planet */}
                <div className="rounded-2xl border border-eco-200 bg-eco-50/50 p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-eco-900">
                      <Globe2 className="h-4 w-4 text-eco-600" />
                      Planet (โลกและระบบนิเวศ)
                    </span>
                    <span className="text-sm font-extrabold text-eco-700">
                      {selectedChoice.impact.planet}/100
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-white">
                    <div
                      className="h-full rounded-full bg-eco-600"
                      style={{ width: `${selectedChoice.impact.planet}%` }}
                    />
                  </div>
                  <p className="text-xs text-slate-700">
                    {selectedChoice.impact.planetText}
                  </p>
                </div>
              </div>

              {/* Feedback Box */}
              <div
                className={`rounded-2xl border p-4 ${
                  selectedChoice.isOptimal
                    ? 'border-eco-300 bg-eco-50 text-eco-950'
                    : 'border-amber-300 bg-amber-50 text-amber-950'
                }`}
              >
                <p className="text-xs font-bold uppercase">
                  ข้อเสนอแนะและคำอธิบายผลลัพธ์ (Feedback)
                </p>
                <p className="mt-1 text-sm leading-relaxed">{selectedChoice.feedback}</p>
              </div>

              <div className="flex justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setStep('decide')}
                  className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
                >
                  ลองตัดสินใจทางเลือกอื่น
                </button>
                <button
                  type="button"
                  onClick={() => setStep('reflection')}
                  className="inline-flex items-center gap-2 rounded-xl bg-eco-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-eco-700"
                >
                  <span>ไปขั้นที่ 5: เขียนสะท้อนคิด (Reflection)</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* Step 5: Reflection */}
          {step === 'reflection' && (
            <form onSubmit={handleCompleteMission} className="space-y-4">
              <div className="rounded-2xl border border-eco-200 bg-eco-50/50 p-5 space-y-3">
                <label
                  htmlFor="mission-reflection"
                  className="block text-sm font-bold text-eco-950"
                >
                  คำถามชวนคิดประจำภารกิจ: {activeMission.reflectionQuestion}
                </label>
                <textarea
                  id="mission-reflection"
                  rows={4}
                  value={reflectionText}
                  onChange={(e) => setReflectionText(e.target.value)}
                  placeholder="เขียนสิ่งที่คุณได้เรียนรู้ แนวคิดที่ได้ และสิ่งที่จะนำไปปฏิบัติจริงที่บ้านและโรงเรียน..."
                  className="w-full rounded-xl border border-slate-300 bg-white p-3.5 text-sm focus:border-eco-600 focus:outline-none"
                />
                <p className="text-xs text-slate-500">
                  ข้อมูลการสะท้อนคิดนี้จะถูกบันทึกลงใน Cloud Firestore และครูที่ปรึกษาสามารถอ่านเพื่อให้คำแนะนำได้
                </p>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 rounded-2xl bg-eco-600 px-7 py-3 text-sm font-bold text-white shadow-md hover:bg-eco-700 disabled:opacity-60"
                >
                  {submitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4" />
                  )}
                  <span>
                    บันทึก Reflection และรับ +{activeMission.learningPoints} Learning Points
                  </span>
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
};

