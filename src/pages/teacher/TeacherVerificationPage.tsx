import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  FileCheck2,
  XCircle,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { ActionRecord, VerificationStatus } from '../../types';
import {
  getAllActionRecords,
  verifyActionRecordByTeacher,
} from '../../services/firestore/ecoDataService';
import {
  EmptyState,
  FeedbackBanner,
  LoadingState,
} from '../../components/ui/StateViews';

export const TeacherVerificationPage: React.FC = () => {
  const { user } = useAuth();
  const [records, setRecords] = useState<ActionRecord[]>([]);
  const [filterStatus, setFilterStatus] = useState<VerificationStatus | 'all'>('pending');
  const [commentsMap, setCommentsMap] = useState<Record<string, string>>({});
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const loadRecords = async () => {
    setLoading(true);
    try {
      const list = await getAllActionRecords(true);
      setRecords(list);
      const initialComments: Record<string, string> = {};
      list.forEach((r) => {
        if (r.teacherComment) initialComments[r.id] = r.teacherComment;
      });
      setCommentsMap(initialComments);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRecords();
  }, []);

  const handleVerify = async (record: ActionRecord, status: VerificationStatus) => {
    if (!user) return;
    setProcessingId(record.id);
    setFeedback(null);
    try {
      const comment =
        commentsMap[record.id] ||
        (status === 'approved'
          ? 'ตรวจสอบหลักฐานและการสะท้อนคิดเรียบร้อย ปฏิบัติได้ยอดเยี่ยมมาก'
          : 'กรุณาแนบรายละเอียดหรือภาพประกอบเพิ่มเติม');

      await verifyActionRecordByTeacher({
        recordId: record.id,
        status,
        comment,
        teacherId: user.uid,
      });

      await loadRecords();
      setFeedback({
        type: 'success',
        message: `บันทึกผลการตรวจรายการของ ${record.studentName || record.userId} (${status}) เรียบร้อยแล้ว`,
      });
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err?.message || 'เกิดข้อผิดพลาดในการตรวจรับรอง',
      });
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return <LoadingState message="กำลังโหลดรายการหลักฐาน Eco Action ที่รอตรวจสอบ..." />;
  }

  const filtered =
    filterStatus === 'all'
      ? records
      : records.filter((r) => r.teacherVerification === filterStatus);

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
                ตรวจรับรองการปฏิบัติ Eco Action (Teacher Verification)
              </h1>
              <p className="text-xs text-slate-600">
                ตรวจสอบภาพหลักฐาน อ่าน Reflection ให้ข้อเสนอแนะ และอนุมัติคะแนน Action Points (ป้องกันการให้คะแนนซ้ำอัตโนมัติ)
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {(
              [
                { key: 'pending', label: 'รอตรวจ (Pending)' },
                { key: 'approved', label: 'อนุมัติแล้ว (Approved)' },
                { key: 'revision_required', label: 'ขอแก้ไข (Revision)' },
                { key: 'rejected', label: 'ไม่ผ่าน (Rejected)' },
                { key: 'all', label: 'ทั้งหมด' },
              ] as const
            ).map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() => setFilterStatus(f.key)}
                className={`rounded-xl px-3.5 py-2 text-xs font-bold transition ${
                  filterStatus === f.key
                    ? 'bg-eco-600 text-white'
                    : 'border border-slate-200 bg-slate-50 text-slate-700'
                }`}
              >
                {f.label}
              </button>
            ))}
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

      {filtered.length === 0 ? (
        <EmptyState
          title="ไม่มีรายการในสถานะที่เลือก"
          description="คุณสามารถเปลี่ยนตัวกรองสถานะด้านบนเพื่อดูประวัติการตรวจรับรองทั้งหมดได้"
        />
      ) : (
        <div className="grid gap-4">
          {filtered.map((rec) => (
            <div
              key={rec.id}
              className="rounded-2xl border border-eco-100 bg-white p-6 shadow-xs space-y-4"
            >
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-lg bg-eco-600 px-2.5 py-0.5 text-xs font-bold text-white">
                      {rec.studentName || rec.userId}
                    </span>
                    <span className="rounded-lg bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700">
                      วันที่ปฏิบัติ: {rec.date}
                    </span>
                    <span className="rounded-lg bg-sky-100 px-2.5 py-0.5 text-xs font-semibold text-sky-800">
                      ปริมาณ: {rec.quantity} {rec.unit}
                    </span>
                  </div>
                  <h2 className="text-base font-bold text-slate-900">
                    แผน: {rec.actionPlanTitle || rec.actionPlanId}
                  </h2>
                  <p className="text-sm text-slate-700">
                    <strong>รายละเอียด:</strong> {rec.note}
                  </p>
                  <p className="text-xs text-slate-600">
                    <strong>อุปสรรค:</strong> {rec.obstacle || 'ไม่มี'}
                  </p>
                  <div className="rounded-xl bg-eco-50/70 p-3 text-xs text-eco-950 border border-eco-100">
                    <strong>การสะท้อนคิดของนักเรียน (Reflection):</strong> “{rec.reflection}”
                  </div>
                </div>

                {rec.evidenceUrl && (
                  <div className="shrink-0">
                    <img
                      src={rec.evidenceUrl}
                      alt="หลักฐานกิจกรรม"
                      className="h-32 w-44 rounded-xl border border-slate-200 object-cover shadow-xs"
                    />
                  </div>
                )}
              </div>

              {/* Teacher Comment & Action Buttons */}
              <div className="border-t border-slate-100 pt-4 space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700">
                    ข้อเสนอแนะจากครูที่ปรึกษา (Teacher Comment)
                  </label>
                  <input
                    type="text"
                    value={commentsMap[rec.id] || ''}
                    onChange={(e) =>
                      setCommentsMap((prev) => ({
                        ...prev,
                        [rec.id]: e.target.value,
                      }))
                    }
                    placeholder="พิมพ์คำชมเชยหรือข้อเสนอแนะเพื่อส่งให้นักเรียน..."
                    className="mt-1 w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs"
                  />
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="text-xs font-bold">
                    สถานะปัจจุบัน:{' '}
                    {rec.teacherVerification === 'approved' ? (
                      <span className="text-eco-700">อนุมัติแล้ว (Approved)</span>
                    ) : rec.teacherVerification === 'revision_required' ? (
                      <span className="text-amber-700">ขอแก้ไข (Revision Required)</span>
                    ) : rec.teacherVerification === 'rejected' ? (
                      <span className="text-red-700">ไม่ผ่าน (Rejected)</span>
                    ) : (
                      <span className="text-sky-700">รอตรวจสอบ (Pending)</span>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={processingId === rec.id}
                      onClick={() => handleVerify(rec, 'approved')}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-eco-600 px-4 py-2 text-xs font-bold text-white hover:bg-eco-700 disabled:opacity-50"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>อนุมัติ (+25 Action Points)</span>
                    </button>

                    <button
                      type="button"
                      disabled={processingId === rec.id}
                      onClick={() => handleVerify(rec, 'revision_required')}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500 px-4 py-2 text-xs font-bold text-white hover:bg-amber-600 disabled:opacity-50"
                    >
                      <AlertTriangle className="h-3.5 w-3.5" />
                      <span>ขอให้แก้ไข</span>
                    </button>

                    <button
                      type="button"
                      disabled={processingId === rec.id}
                      onClick={() => handleVerify(rec, 'rejected')}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-xs font-bold text-red-700 hover:bg-red-100 disabled:opacity-50"
                    >
                      <XCircle className="h-3.5 w-3.5" />
                      <span>ไม่ผ่าน</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

