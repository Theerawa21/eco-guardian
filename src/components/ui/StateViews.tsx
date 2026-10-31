import React from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Inbox,
  Info,
  Loader2,
  RefreshCw,
  ShieldAlert,
} from 'lucide-react';

export const LoadingState: React.FC<{ message?: string }> = ({
  message = 'กำลังโหลดข้อมูลจากฐานข้อมูล...',
}) => (
  <div
    role="status"
    aria-live="polite"
    className="flex flex-col items-center justify-center rounded-2xl border border-eco-100 bg-white p-10 text-center shadow-sm"
  >
    <Loader2 className="h-10 w-10 animate-spin text-eco-600" />
    <p className="mt-3 text-sm font-medium text-slate-600">{message}</p>
  </div>
);

export const EmptyState: React.FC<{
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}> = ({ title, description, actionLabel, onAction }) => (
  <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white/80 p-8 text-center">
    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-eco-50 text-eco-600">
      <Inbox className="h-6 w-6" />
    </div>
    <h3 className="mt-3 text-base font-semibold text-slate-800">{title}</h3>
    <p className="mt-1 max-w-md text-sm text-slate-600">{description}</p>
    {actionLabel && onAction && (
      <button
        type="button"
        onClick={onAction}
        className="mt-4 inline-flex items-center gap-2 rounded-xl bg-eco-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-eco-700"
      >
        {actionLabel}
      </button>
    )}
  </div>
);

export const ErrorState: React.FC<{
  message: string;
  onRetry?: () => void;
}> = ({ message, onRetry }) => (
  <div
    role="alert"
    className="flex flex-col items-center justify-center rounded-2xl border border-red-200 bg-red-50/80 p-6 text-center"
  >
    <AlertCircle className="h-8 w-8 text-red-600" />
    <h3 className="mt-2 text-base font-semibold text-red-900">เกิดข้อผิดพลาด</h3>
    <p className="mt-1 text-sm text-red-700">{message}</p>
    {onRetry && (
      <button
        type="button"
        onClick={onRetry}
        className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-700"
      >
        <RefreshCw className="h-3.5 w-3.5" />
        ลองใหม่อีกครั้ง
      </button>
    )}
  </div>
);

export const FeedbackBanner: React.FC<{
  type: 'success' | 'error' | 'info';
  message: string;
  onClose?: () => void;
}> = ({ type, message, onClose }) => {
  const styles =
    type === 'success'
      ? 'border-eco-300 bg-eco-50 text-eco-900'
      : type === 'error'
      ? 'border-red-300 bg-red-50 text-red-900'
      : 'border-sky-300 bg-sky-50 text-sky-900';

  const Icon =
    type === 'success' ? CheckCircle2 : type === 'error' ? AlertCircle : Info;

  return (
    <div
      role={type === 'error' ? 'alert' : 'status'}
      className={`flex items-start justify-between gap-3 rounded-xl border p-4 text-sm ${styles}`}
    >
      <div className="flex items-start gap-2.5">
        <Icon className="mt-0.5 h-5 w-5 shrink-0" />
        <span className="font-medium">{message}</span>
      </div>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="text-xs font-semibold underline opacity-75 hover:opacity-100"
        >
          ปิด
        </button>
      )}
    </div>
  );
};

/**
 * Section 26: PRIVACY
 * แจ้งเตือนการคุ้มครองข้อมูลส่วนบุคคลก่อนอัปโหลดใบแจ้งค่าไฟฟ้าหรือน้ำ
 */
export const UtilityPrivacyNotice: React.FC = () => (
  <div className="rounded-xl border border-amber-200 bg-amber-50/90 p-4 text-xs text-amber-900">
    <div className="flex items-start gap-2.5">
      <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
      <div>
        <p className="font-bold text-amber-950">
          คำแนะนำด้านความเป็นส่วนตัว (Privacy Protection) — ไม่บังคับอัปโหลดภาพใบแจ้งหนี้
        </p>
        <p className="mt-1 leading-relaxed">
          ข้อมูลการใช้ทรัพยากรของครัวเรือนเป็นข้อมูลส่วนบุคคล และระบบไม่เก็บข้อมูลจำนวนเงินค่าใช้จ่าย
          หากต้องการแนบภาพหลักฐาน กรุณาขีดฆ่าหรือปิดบังข้อมูลสำคัญต่อไปนี้ก่อนอัปโหลดทุกครั้ง:
        </p>
        <ul className="mt-1.5 grid grid-cols-2 gap-x-4 gap-y-1 font-medium sm:grid-cols-3">
          <li>• ชื่อ-นามสกุลเจ้าของบ้าน</li>
          <li>• ที่อยู่บ้านเลขที่</li>
          <li>• เลขผู้ใช้ไฟ / เลขผู้ใช้น้ำ</li>
          <li>• QR Code ทุกจุด</li>
          <li>• Barcode ทุกจุด</li>
          <li>• ข้อมูลการชำระเงิน</li>
        </ul>
      </div>
    </div>
  </div>
);

