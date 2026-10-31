import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  CheckCircle2,
  ClipboardCheck,
  Loader2,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { AssessmentResponse, Question } from '../../types';
import {
  ATTITUDE_SCALE_OPTIONS,
  BEHAVIOR_DOMAINS,
  RATING_SCALE_OPTIONS,
} from '../../constants';
import {
  getQuestions,
  getStudentAssessment,
  submitAssessmentResponse,
} from '../../services/firestore/ecoDataService';
import { FeedbackBanner, LoadingState } from '../../components/ui/StateViews';

export const PreAssessmentPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [questions, setQuestions] = useState<Question[]>([]);
  const [existing, setExisting] = useState<AssessmentResponse | null>(null);
  const [answers, setAnswers] = useState<Record<string, string | number>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  useEffect(() => {
    async function load() {
      if (!user) return;
      setLoading(true);
      try {
        const [qList, prevResp] = await Promise.all([
          getQuestions(true),
          getStudentAssessment(user.uid, 'pre'),
        ]);
        setQuestions(qList);
        if (prevResp) {
          setExisting(prevResp);
          setAnswers(prevResp.answers || {});
        }
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [user]);

  const handleSelectAnswer = (qId: string, val: string | number) => {
    setAnswers((prev) => ({ ...prev, [qId]: val }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const unanswered = questions.filter((q) => answers[q.id] === undefined || answers[q.id] === '');
    if (unanswered.length > 0) {
      setFeedback({
        type: 'error',
        message: `กรุณาตอบคำถามให้ครบทุกข้อ (ยังไม่ได้ตอบ ${unanswered.length} ข้อ)`,
      });
      return;
    }

    setSubmitting(true);
    setFeedback(null);
    try {
      const resp = await submitAssessmentResponse({
        studentId: user.uid,
        studentName: user.displayName,
        classId: user.classId,
        assessmentType: 'pre',
        answers,
        questions,
        demo: user.demo,
      });
      setExisting(resp);
      setFeedback({
        type: 'success',
        message: `บันทึกผลแบบประเมินก่อนเรียนสำเร็จ! คะแนนรวมของคุณคือ ${resp.totalScore}/${resp.maxScore} (${resp.percentage}%)`,
      });
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err?.message || 'ไม่สามารถบันทึกผลแบบประเมินได้',
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingState message="กำลังโหลดแบบประเมินก่อนกิจกรรม (Pre-Assessment)..." />;
  }

  const sectionA = questions.filter((q) => q.section === 'A');
  const sectionB = questions.filter((q) => q.section === 'B');
  const sectionC = questions.filter((q) => q.section === 'C');

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-eco-200 bg-white p-6 shadow-xs">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex items-start gap-3.5">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-eco-100 text-eco-700">
              <ClipboardCheck className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-slate-900">
                แบบประเมินก่อนเริ่มภารกิจ (Pre-Assessment)
              </h1>
              <p className="text-xs text-slate-600">
                ประเมินความรู้ เจตคติ และพฤติกรรมรับผิดชอบต่อสิ่งแวดล้อม 5 ด้าน ก่อนเริ่มการเรียนรู้
              </p>
            </div>
          </div>

          {existing && (
            <div className="rounded-2xl border border-eco-200 bg-eco-50 px-4 py-2.5 text-right">
              <span className="inline-flex items-center gap-1 text-xs font-bold text-eco-800">
                <CheckCircle2 className="h-4 w-4 text-eco-600" />
                ทำแบบประเมินแล้ว
              </span>
              <p className="text-lg font-extrabold text-eco-900">
                {existing.totalScore}/{existing.maxScore} คะแนน ({existing.percentage}%)
              </p>
            </div>
          )}
        </div>
      </div>

      {feedback && (
        <FeedbackBanner
          type={feedback.type}
          message={feedback.message}
          onClose={() => setFeedback(null)}
        />
      )}

      {existing && (
        <div className="rounded-2xl border border-sky-200 bg-sky-50/70 p-5">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div className="space-y-1">
              <h2 className="text-sm font-bold text-sky-950">
                สรุปคะแนนรายตอนและรายด้าน (Pre-Assessment)
              </h2>
              <p className="text-xs text-sky-800">
                ตอนที่ A ความรู้: {existing.sectionScores.sectionA} คะแนน | ตอนที่ B เจตคติ:{' '}
                {existing.sectionScores.sectionB} คะแนน | ตอนที่ C พฤติกรรม 5 ด้าน:{' '}
                {existing.sectionScores.sectionC} คะแนน
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate('/student/baseline')}
              className="inline-flex items-center gap-2 rounded-xl bg-eco-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-eco-700"
            >
              <span>ไปขั้นตอนถัดไป: บันทึกข้อมูลพื้นฐานบ้าน (Baseline)</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section A */}
        <section className="rounded-2xl border border-eco-100 bg-white p-6 shadow-xs space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <span className="rounded-md bg-sky-100 px-2.5 py-0.5 text-xs font-bold text-sky-800">
              Section A
            </span>
            <h2 className="mt-1 text-base font-bold text-slate-900">
              ตอนที่ 1: ความรู้และความตระหนักด้านสิ่งแวดล้อม
            </h2>
          </div>

          <div className="space-y-5">
            {sectionA.map((q) => (
              <div key={q.id} className="rounded-xl border border-slate-200 p-4 space-y-3">
                <p className="text-sm font-bold text-slate-800">{q.questionText}</p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {(q.choices || []).map((choice) => {
                    const selected = answers[q.id] === choice;
                    return (
                      <label
                        key={choice}
                        className={`flex cursor-pointer items-center gap-2.5 rounded-xl border p-3 text-xs font-medium transition ${
                          selected
                            ? 'border-eco-600 bg-eco-50 text-eco-950 font-bold'
                            : 'border-slate-200 bg-white hover:bg-slate-50'
                        }`}
                      >
                        <input
                          type="radio"
                          name={q.id}
                          checked={selected}
                          onChange={() => handleSelectAnswer(q.id, choice)}
                          className="h-4 w-4 accent-eco-600"
                        />
                        <span>{choice}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Section B */}
        <section className="rounded-2xl border border-eco-100 bg-white p-6 shadow-xs space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <span className="rounded-md bg-purple-100 px-2.5 py-0.5 text-xs font-bold text-purple-800">
              Section B
            </span>
            <h2 className="mt-1 text-base font-bold text-slate-900">
              ตอนที่ 2: เจตคติและความตั้งใจต่อการดูแลสิ่งแวดล้อม
            </h2>
          </div>

          <div className="space-y-4">
            {sectionB.map((q) => (
              <div key={q.id} className="rounded-xl border border-slate-200 p-4 space-y-3">
                <p className="text-sm font-bold text-slate-800">{q.questionText}</p>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-5">
                  {ATTITUDE_SCALE_OPTIONS.map((opt) => {
                    const selected = Number(answers[q.id]) === opt.value;
                    return (
                      <label
                        key={opt.value}
                        className={`flex cursor-pointer items-center justify-center rounded-xl border p-2.5 text-center text-xs font-medium transition ${
                          selected
                            ? 'border-eco-600 bg-eco-600 text-white font-bold'
                            : 'border-slate-200 bg-slate-50/70 hover:bg-eco-50'
                        }`}
                      >
                        <input
                          type="radio"
                          name={q.id}
                          checked={selected}
                          onChange={() => handleSelectAnswer(q.id, opt.value)}
                          className="sr-only"
                        />
                        <span>{opt.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Section C: 5 Behavior Domains */}
        <section className="rounded-2xl border border-eco-100 bg-white p-6 shadow-xs space-y-5">
          <div className="border-b border-slate-100 pb-3">
            <span className="rounded-md bg-eco-100 px-2.5 py-0.5 text-xs font-bold text-eco-800">
              Section C
            </span>
            <h2 className="mt-1 text-base font-bold text-slate-900">
              ตอนที่ 3: พฤติกรรมรับผิดชอบต่อสิ่งแวดล้อม 5 ด้าน (Rating Scale 1-5)
            </h2>
            <p className="text-xs text-slate-500">
              5 = ปฏิบัติเป็นประจำ | 4 = ปฏิบัติบ่อยครั้ง | 3 = ปฏิบัติบางครั้ง | 2 = ปฏิบัติน้อยครั้ง | 1 = ไม่เคยปฏิบัติ
            </p>
          </div>

          {BEHAVIOR_DOMAINS.map((domain) => {
            const domainQuestions = sectionC.filter((q) => q.domain === domain.key);
            return (
              <div key={domain.key} className="space-y-3">
                <div className="rounded-xl bg-eco-50/80 px-4 py-2.5">
                  <h3 className="text-sm font-bold text-eco-950">
                    ด้านที่ {domain.number}: {domain.title}
                  </h3>
                  <p className="text-xs text-eco-800">{domain.description}</p>
                </div>

                {domainQuestions.map((q) => (
                  <div
                    key={q.id}
                    className="rounded-xl border border-slate-200 p-4 space-y-3"
                  >
                    <p className="text-sm font-bold text-slate-800">{q.questionText}</p>
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-5">
                      {RATING_SCALE_OPTIONS.map((opt) => {
                        const selected = Number(answers[q.id]) === opt.value;
                        return (
                          <label
                            key={opt.value}
                            className={`flex cursor-pointer items-center justify-center rounded-xl border p-2.5 text-center text-xs font-medium transition ${
                              selected
                                ? 'border-eco-600 bg-eco-600 text-white font-bold'
                                : 'border-slate-200 bg-slate-50/70 hover:bg-eco-50'
                            }`}
                          >
                            <input
                              type="radio"
                              name={q.id}
                              checked={selected}
                              onChange={() => handleSelectAnswer(q.id, opt.value)}
                              className="sr-only"
                            />
                            <span>{opt.label}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            );
          })}
        </section>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-2 rounded-2xl bg-eco-600 px-8 py-3.5 text-sm font-bold text-white shadow-md hover:bg-eco-700 disabled:opacity-60"
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle2 className="h-4 w-4" />
            )}
            <span>บันทึกผลแบบประเมินก่อนเรียน (Pre-Assessment)</span>
          </button>
        </div>
      </form>
    </div>
  );
};

