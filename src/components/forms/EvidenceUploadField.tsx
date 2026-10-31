import React, { useState } from 'react';
import { ImagePlus, Loader2, Trash2, CheckCircle2 } from 'lucide-react';
import { uploadStorageFile } from '../../services/firestore/collections';
import { validateEvidenceFile } from '../../utils';

interface EvidenceUploadFieldProps {
  uid: string;
  folder?: 'evidence' | 'avatars' | 'missions';
  label?: string;
  helperText?: string;
  value: string | null;
  onChange: (url: string | null) => void;
}

export const EvidenceUploadField: React.FC<EvidenceUploadFieldProps> = ({
  uid,
  folder = 'evidence',
  label = 'อัปโหลดภาพหลักฐานกิจกรรม (JPG, PNG, WEBP ไม่เกิน 5 MB)',
  helperText = 'เลือกไฟล์รูปภาพที่ชัดเจน ระบบจะจัดเก็บใน Firebase Storage ตามสิทธิ์ของผู้ใช้',
  value,
  onChange,
}) => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    const check = validateEvidenceFile(file);
    if (!check.valid) {
      setError(check.error || 'ไฟล์ไม่ถูกต้อง');
      return;
    }

    setUploading(true);
    try {
      const url = await uploadStorageFile(folder, uid, file);
      onChange(url);
    } catch (err: any) {
      setError(err?.message || 'เกิดข้อผิดพลาดในการอัปโหลดไฟล์');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-semibold text-slate-700">{label}</label>
      <p className="text-xs text-slate-500">{helperText}</p>

      {value ? (
        <div className="relative overflow-hidden rounded-xl border border-eco-200 bg-eco-50/50 p-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <img
                src={value}
                alt="ภาพหลักฐานที่อัปโหลด"
                className="h-16 w-16 rounded-lg object-cover border border-eco-300"
              />
              <div>
                <p className="flex items-center gap-1.5 text-xs font-semibold text-eco-800">
                  <CheckCircle2 className="h-4 w-4 text-eco-600" />
                  แนบภาพหลักฐานเรียบร้อยแล้ว
                </p>
                <p className="mt-0.5 text-xs text-slate-500 truncate max-w-xs">
                  พร้อมบันทึกเข้าสู่ระบบ
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onChange(null)}
              className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-white px-2.5 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
            >
              <Trash2 className="h-3.5 w-3.5" />
              ลบภาพ
            </button>
          </div>
        </div>
      ) : (
        <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50/70 px-4 py-5 text-center transition hover:border-eco-500 hover:bg-eco-50/30">
          {uploading ? (
            <div className="flex items-center gap-2 text-sm font-medium text-eco-700">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>กำลังอัปโหลดไฟล์ไปยัง Firebase Storage...</span>
            </div>
          ) : (
            <>
              <ImagePlus className="h-7 w-7 text-eco-600" />
              <span className="mt-1.5 text-xs font-semibold text-slate-700">
                คลิกเพื่อเลือกรูปภาพประกอบ (JPG, PNG, WEBP)
              </span>
              <span className="mt-0.5 text-[11px] text-slate-500">
                ขนาดไฟล์สูงสุดไม่เกิน 5 MB
              </span>
            </>
          )}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileChange}
            disabled={uploading}
            className="sr-only"
          />
        </label>
      )}

      {error && (
        <p role="alert" className="text-xs font-medium text-red-600">
          {error}
        </p>
      )}
    </div>
  );
};

