import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, parseISO, differenceInCalendarDays } from 'date-fns';
import { th } from 'date-fns/locale';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatThaiDate(dateStr?: string | null): string {
  if (!dateStr) return '-';
  try {
    const d = parseISO(dateStr);
    const buddhistYear = d.getFullYear() + 543;
    return `${format(d, 'd MMM', { locale: th })} ${buddhistYear}`;
  } catch {
    return dateStr;
  }
}

export function formatThaiDateTime(dateStr?: string | null): string {
  if (!dateStr) return '-';
  try {
    const d = parseISO(dateStr);
    const buddhistYear = d.getFullYear() + 543;
    return `${format(d, 'd MMM', { locale: th })} ${buddhistYear} ${format(d, 'HH:mm')} น.`;
  } catch {
    return dateStr;
  }
}

export function calculateWasteMetrics(
  input: {
    generalWasteKg: number;
    recyclableWasteKg: number;
    organicWasteKg: number;
    plasticWasteKg: number;
    otherWasteKg: number;
  },
  baselineTotalWaste: number | null
) {
  const general = Math.max(0, Number(input.generalWasteKg) || 0);
  const recyclable = Math.max(0, Number(input.recyclableWasteKg) || 0);
  const organic = Math.max(0, Number(input.organicWasteKg) || 0);
  const plastic = Math.max(0, Number(input.plasticWasteKg) || 0);
  const other = Math.max(0, Number(input.otherWasteKg) || 0);

  const totalWaste = Number((general + recyclable + organic + plastic + other).toFixed(2));
  const diverted = recyclable + organic;
  const recycledPercentage =
    totalWaste > 0 ? Number(((diverted / totalWaste) * 100).toFixed(1)) : 0;

  // Section 21 Rule: ห้ามคำนวณ Reduction หากไม่มี Baseline
  if (baselineTotalWaste === null || baselineTotalWaste <= 0) {
    return {
      totalWaste,
      recycledPercentage,
      wasteReduction: null,
      wasteReductionPercentage: null,
      trend: 'คงที่' as const,
    };
  }

  const wasteReduction = Number((baselineTotalWaste - totalWaste).toFixed(2));
  const wasteReductionPercentage = Number(
    (((baselineTotalWaste - totalWaste) / baselineTotalWaste) * 100).toFixed(1)
  );

  let trend: 'ลดลง' | 'เพิ่มขึ้น' | 'คงที่' = 'คงที่';
  if (wasteReductionPercentage > 1) {
    trend = 'ลดลง';
  } else if (wasteReductionPercentage < -1) {
    trend = 'เพิ่มขึ้น';
  }

  return {
    totalWaste,
    recycledPercentage,
    wasteReduction,
    wasteReductionPercentage,
    trend,
  };
}

export function calculateUtilityChange(
  currentValue: number,
  previousOrBaselineValue: number | null
): {
  previousValue: number | null;
  difference: number | null;
  changePercentage: number | null;
  trend: 'ลดลง' | 'เพิ่มขึ้น' | 'คงที่';
} {
  const current = Math.max(0, Number(currentValue) || 0);
  if (previousOrBaselineValue === null || previousOrBaselineValue <= 0) {
    return {
      previousValue: null,
      difference: null,
      changePercentage: null,
      trend: 'คงที่',
    };
  }

  const difference = Number((current - previousOrBaselineValue).toFixed(2));
  const changePercentage = Number(
    (((current - previousOrBaselineValue) / previousOrBaselineValue) * 100).toFixed(1)
  );

  let trend: 'ลดลง' | 'เพิ่มขึ้น' | 'คงที่' = 'คงที่';
  if (changePercentage < -1) {
    trend = 'ลดลง';
  } else if (changePercentage > 1) {
    trend = 'เพิ่มขึ้น';
  }

  return {
    previousValue: previousOrBaselineValue,
    difference,
    changePercentage,
    trend,
  };
}

/**
 * Section 24 & 65:
 * ข้อมูลไฟฟ้า น้ำ และขยะของครัวเรือนได้รับผลจากหลายปัจจัย
 * ห้ามแสดงข้อความว่า "ECO GUARDIAN ทำให้ไฟฟ้าลดลง"
 * ให้ใช้ข้อความเชิงแนวโน้มตามหลักวิชาการ
 */
export function getHomeEcoTrendStatement(
  resourceType: 'waste' | 'electricity' | 'water',
  trend?: 'ลดลง' | 'เพิ่มขึ้น' | 'คงที่' | null,
  hasBaseline = true
): {
  shortBadge: string;
  statement: string;
} {
  const resourceName =
    resourceType === 'waste'
      ? 'ปริมาณขยะของครัวเรือน'
      : resourceType === 'electricity'
      ? 'การใช้ไฟฟ้าของครัวเรือน'
      : 'การใช้น้ำประปาของครัวเรือน';

  if (!hasBaseline || !trend) {
    return {
      shortBadge: 'รอข้อมูลเปรียบเทียบ',
      statement: `กำลังรวบรวมข้อมูลพื้นฐาน (Baseline) ของ${resourceName}เพื่อติดตามแนวโน้ม`,
    };
  }

  if (trend === 'ลดลง') {
    return {
      shortBadge: 'แนวโน้มลดลง',
      statement: `ข้อมูล${resourceName}มีแนวโน้มลดลงในช่วงการเข้าร่วมกิจกรรม (ทั้งนี้ข้อมูลครัวเรือนขึ้นอยู่กับหลายปัจจัย เช่น สภาพอากาศและจำนวนสมาชิก)`,
    };
  }

  if (trend === 'เพิ่มขึ้น') {
    return {
      shortBadge: 'แนวโน้มเพิ่มขึ้น',
      statement: `ข้อมูล${resourceName}มีแนวโน้มเพิ่มขึ้นในช่วงการเข้าร่วมกิจกรรม (ควรสำรวจปัจจัยแวดล้อมและวางแผนลดการใช้ทรัพยากรร่วมกับครอบครัว)`,
    };
  }

  return {
    shortBadge: 'ไม่มีการเปลี่ยนแปลงชัดเจน',
    statement: `ข้อมูล${resourceName}ไม่มีการเปลี่ยนแปลงชัดเจนเมื่อเทียบกับข้อมูลพื้นฐาน`,
  };
}

export function calculateEcoStreak(dates: string[]): number {
  if (!dates || dates.length === 0) return 0;
  const uniqueDates = Array.from(new Set(dates.map((d) => d.slice(0, 10)))).sort(
    (a, b) => (a > b ? -1 : 1)
  );
  if (uniqueDates.length === 0) return 0;

  let streak = 1;
  for (let i = 0; i < uniqueDates.length - 1; i++) {
    try {
      const current = parseISO(uniqueDates[i]);
      const prev = parseISO(uniqueDates[i + 1]);
      const diff = differenceInCalendarDays(current, prev);
      if (diff === 1) {
        streak++;
      } else {
        break;
      }
    } catch {
      break;
    }
  }
  return streak;
}

export function validateEvidenceFile(file: File): { valid: boolean; error?: string } {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: 'รองรับเฉพาะไฟล์รูปภาพนามสกุล JPG, PNG หรือ WEBP เท่านั้น',
    };
  }
  const maxSizeBytes = 5 * 1024 * 1024; // 5MB
  if (file.size > maxSizeBytes) {
    return {
      valid: false,
      error: 'ขนาดไฟล์ต้องไม่เกิน 5 MB',
    };
  }
  return { valid: true };
}

