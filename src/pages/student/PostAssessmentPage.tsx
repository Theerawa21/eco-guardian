import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  CheckCircle2,
  FileCheck2,
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
import { AssessmentComparisonBarChart } from '../../components/charts/EcoCharts';
import { FeedbackBanner, LoadingState } from '../../components/ui/StateViews';

export const PostAssessmentPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [questions, setQuestions] = useState<Question[]>([]);
  const [preResp, setPreResp] = useState<AssessmentResponse | null>(null);
  const [postResp, setPostResp] = useState<AssessmentResponse | null>(null);
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
        const [qList, pre, post] = await Promise.all([
          getQuestions(true),
          getStudentAssessment(user.uid, 'pre'),
          getStudentAssessment(user.uid, 'post'),
        ]);
        setQuestions(qList);
        setPreResp(pre);
        if (post) {
          setPostResp(post);
          setAnswers(post.answers || {});
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

    const unanswered = questions.filter(
      (q) => answers[q.id] === undefined || answers[q.id] === ''
    );
    if (unanswered.length > 0) {
      setFeedback({
        type: 'error',
        message: `กรุณาตอบคำถามให้ครบทุกข้อ (เหลืออีก ${unanswered.length} ข้อ)`,
      });
      return;
    }

    setSubmitting(true);
    setFeedback(null);
    try {
      const saved = await submitAssessmentResponse({
        studentId: user.uid,
        studentName: user.displayName,
        classId: user.classId,
        assessmentType: 'post',
        answers,
        questions,
        demo: user.demo,
      });
      setPostResp(saved);
      setFeedback({
        type: 'success',
        message: `บันทึกผลแบบประเมินหลังกิจกรรม (Post-Assessment) สำเร็จ! คะแนนของคุณคือ ${saved.totalScore}/${saved.maxScore}`,
      });
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err?.message || 'ไม่สามารถบันทึกผลได้',
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingState message="กำลังโหลดแบบประเมินหลังจบกิจกรรม (Post-Assessment)..." />;
  }

  const diffScore =
    preResp && postResp ? postResp.totalScore - preResp.totalScore : null;
  const pctChange =
    preResp && postResp && preResp.totalScore > 0
      ? Number(
          (((postResp.totalScore - preResp.totalScore) / preResp.totalScore) * 100).toFixed(
            1
          )
        )
      : null;

  const domainBarData = BEHAVIOR_DOMAINS.map((d) => ({
    name: d.shortTitle,
    pre: preResp?.domainScores?.[d.key] || 0,
    post: postResp?.domainScores?.[d.key] || 0,
  }));

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-eco-200 bg-white p-6 shadow-xs">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex items-start gap-3.5">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-eco-100 text-eco-700">
              <FileCheck2 className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-slate-900">
                แบบประเมินหลังจบกิจกรรม (Post-Assessment)
              </h1>
              <p className="text-xs text-slate-600">
                เปรียบเทียบคะแนนก่อนเรียน (Pre) และหลังเรียน (Post) แยกรายด้าน
              </p>
            </div>
          </div>

          {postResp && (
            <button
              type="button"
              onClick={() => navigate('/student/journey')}
              className="inline-flex items-center gap-2 rounded-xl bg-eco-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-eco-700"
            >
              <span>ดูสรุปผล My Eco Journey</span>
              <ArrowRight className="h-4 w-4" />
            </button>
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

      {/* Pre vs Post Comparison Summary (Section 34) */}
      {postResp && (
        <section className="rounded-2xl border border-eco-200 bg-white p-6 shadow-xs space-y-5">
          <h2 className="text-base font-bold text-slate-900">
            ผลการเปรียบเทียบคะแนนก่อนและหลังเข้าร่วมกิจกรรม (Pre vs Post Comparison)
          </h2>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="rounded-xl bg-sky-50 p-4">
              <span className="text-xs text-sky-800 font-bold">คะแนนก่อนเรียน (PreScore)</span>
              <p className="mt-1 text-2xl font-extrabold text-sky-900">
                {preResp ? `${preResp.totalScore}/${preResp.maxScore}` : '-'}
              </p>
            </div>
            <div className="rounded-xl bg-eco-50 p-4">
              <span className="text-xs text-eco-800 font-bold">คะแนนหลังเรียน (PostScore)</span>
              <p className="mt-1 text-2xl font-extrabold text-eco-900">
                {postResp.totalScore}/{postResp.maxScore}
              </p>
            </div>
            <div className="rounded-xl bg-amber-50 p-4">
              <span className="text-xs text-amber-900 font-bold">ผลต่างคะแนน (Difference)</span>
              <p className="mt-1 text-2xl font-extrabold text-amber-800">
                {diffScore !== null
                  ? diffScore >= 0
                    ? `+${diffScore}`
                    : diffScore
                  : '-'}
              </p>
            </div>
            <div className="rounded-xl bg-purple-50 p-4">
              <span className="text-xs text-purple-900 font-bold">
                การเปลี่ยนแปลง (Percentage Change)
              </span>
              <p className="mt-1 text-2xl font-extrabold text-purple-800">
                {pctChange !== null
                  ? pctChange >= 0
                    ? `+${pctChange}%`
                    : `${pctChange}%`
                  : '-'}
              </p>
            </div>
          </div>

          <AssessmentComparisonBarChart data={domainBarData} />
        </section>
      )}

      {/* Post-Assessment Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {(['A', 'B', 'C'] as const).map((sec) => {
          const secQuestions = questions.filter((q) => q.section === sec);
          return (
            <section
              key={sec}
              className="rounded-2xl border border-eco-100 bg-white p-6 shadow-xs space-y-4"
            >
              <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">
                Section {sec}:{' '}
                {sec === 'A'
                  ? 'ความรู้และความตระหนัก'
                  : sec === 'B'
                  ? 'เจตคติและความตั้งใจ'
                  : 'พฤติกรรมรับผิดชอบต่อสิ่งแวดล้อม 5 ด้าน'}
              </h2>
              <div className="space-y-4">
                {secQuestions.map((q) => (
                  <div
                    key={q.id}
                    className="rounded-xl border border-slate-200 p-4 space-y-3"
                  >
                    <p className="text-sm font-bold text-slate-800">{q.questionText}</p>
                    {q.questionType === 'multiple_choice' ||
                    q.questionType === 'true_false' ? (
                      <div className="grid gap-2 sm:grid-cols-2">
                        {(q.choices || []).map((c) => (
                          <label
                            key={c}
                            className={`flex cursor-pointer items-center gap-2 rounded-xl border p-3 text-xs ${
                              answers[q.id] === c
                                ? 'border-eco-600 bg-eco-50 font-bold text-eco-950'
                                : 'border-slate-200 bg-white'
                            }`}
                          >
                            <input
                              type="radio"
                              name={`post_${q.id}`}
                              checked={answers[q.id] === c}
                              onChange={() => handleSelectAnswer(q.id, c)}
                              className="h-4 w-4 accent-eco-600"
                            />
                            <span>{c}</span>
                          </label>
                        ))}
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-5">
                        {(sec === 'B' ? ATTITUDE_SCALE_OPTIONS : RATING_SCALE_OPTIONS).map(
                          (opt) => (
                            <label
                              key={opt.value}
                              className={`flex cursor-pointer items-center justify-center rounded-xl border p-2.5 text-center text-xs ${
                                Number(answers[q.id]) === opt.value
                                  ? 'border-eco-600 bg-eco-600 font-bold text-white'
                                  : 'border-slate-200 bg-slate-50'
                              }`}
                            >
                              <input
                                type="radio"
                                name={`post_${q.id}`}
                                checked={Number(answers[q.id]) === opt.value}
                                onChange={() => handleSelectAnswer(q.id, opt.value)}
                                className="sr-only"
                              />
                              <span>{opt.label}</span>
                            </label>
                          )
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          );
        })}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-2 rounded-2xl bg-eco-600 px-8 py-3.5 text-sm font-bold text-white shadow-md hover:bg-eco-700"
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle2 className="h-4 w-4" />
            )}
            <span>บันทึกผล Post-Assessment</span>
          </button>
        </div>
      </form>
    </div>
  );
};

