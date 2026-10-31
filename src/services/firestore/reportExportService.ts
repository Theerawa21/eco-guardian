import {
  getAllActionRecords,
  getAllAssessmentResponses,
  getAllElectricityRecords,
  getAllFollowUps,
  getAllMissionProgress,
  getAllTeacherObservations,
  getAllUsers,
  getAllWasteRecords,
  getAllWaterRecords,
  getClassrooms,
} from './ecoDataService';

export type ReportType =
  | 'student_report'
  | 'classroom_report'
  | 'assessment_report'
  | 'behavior_report'
  | 'eco_action_report'
  | 'waste_report'
  | 'electricity_report'
  | 'water_report'
  | 'followup_report';

export const REPORT_TYPES_META: {
  key: ReportType;
  title: string;
  description: string;
}[] = [
  {
    key: 'student_report',
    title: '1. รายงานภาพรวมผู้เรียน (Student Report)',
    description: 'ข้อมูลความก้าวหน้ารายบุคคล คะแนนการเรียนรู้ คะแนนปฏิบัติ และจำนวนภารกิจที่สำเร็จ',
  },
  {
    key: 'classroom_report',
    title: '2. รายงานสรุประดับห้องเรียน (Classroom Report)',
    description: 'อัตราการเข้าร่วม คะแนนเฉลี่ย Pre/Post การปฏิบัติ Eco Action และแนวโน้มทรัพยากรรายห้อง',
  },
  {
    key: 'assessment_report',
    title: '3. รายงานผลแบบประเมินก่อน-หลัง (Assessment Report)',
    description: 'เปรียบเทียบคะแนน Pre-Assessment และ Post-Assessment รายบุคคลและรายด้าน',
  },
  {
    key: 'behavior_report',
    title: '4. รายงานหลักฐานพฤติกรรม 4 แหล่ง (Behavior Evidence Report)',
    description: 'บูรณาการข้อมูล Self-Assessment, Teacher Observation, Eco Action และ Home Eco Data',
  },
  {
    key: 'eco_action_report',
    title: '5. รายงานการลงมือปฏิบัติจริง (Eco Action Report)',
    description: 'รายการบันทึกปฏิบัติการรายวัน สถานะการตรวจรับรองของครู และการสะท้อนคิด',
  },
  {
    key: 'waste_report',
    title: '6. รายงานข้อมูลขยะครัวเรือน (Waste Report)',
    description: 'ปริมาณขยะแยกประเภท สัดส่วนรีไซเคิล และแนวโน้มการเปลี่ยนแปลงเทียบกับ Baseline',
  },
  {
    key: 'electricity_report',
    title: '7. รายงานการใช้ไฟฟ้าครัวเรือน (Electricity Report)',
    description: 'หน่วยการใช้ไฟฟ้า (kWh) เทียบกับ Baseline และแนวโน้มการเปลี่ยนแปลง',
  },
  {
    key: 'water_report',
    title: '8. รายงานการใช้น้ำประปาครัวเรือน (Water Report)',
    description: 'หน่วยการใช้น้ำประปาเทียบกับ Baseline และแนวโน้มการเปลี่ยนแปลง',
  },
  {
    key: 'followup_report',
    title: '9. รายงานการติดตามผลระยะยาว (Follow-up Report)',
    description: 'ความต่อเนื่องของพฤติกรรมหลังจบกิจกรรม พฤติกรรมที่กลายเป็นกิจวัตร และอุปสรรค',
  },
];

function escapeCsvCell(value: unknown): string {
  if (value === null || value === undefined) return '';
  const str = String(value).replace(/"/g, '""');
  return `"${str}"`;
}

export function downloadCsvFile(
  filename: string,
  headers: string[],
  rows: (string | number | null | undefined)[][]
): void {
  const csvLines = [
    headers.map(escapeCsvCell).join(','),
    ...rows.map((r) => r.map(escapeCsvCell).join(',')),
  ];
  // Add UTF-8 BOM for Thai language support in Excel
  const csvContent = '\uFEFF' + csvLines.join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename.endsWith('.csv') ? filename : `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export async function generateReportDataset(
  reportType: ReportType,
  includeDemo = true
): Promise<{
  title: string;
  headers: string[];
  rows: (string | number | null | undefined)[][];
}> {
  const [
    users,
    classrooms,
    assessments,
    missions,
    actions,
    waste,
    elec,
    water,
    observations,
    followUps,
  ] = await Promise.all([
    getAllUsers(includeDemo),
    getClassrooms(),
    getAllAssessmentResponses(includeDemo),
    getAllMissionProgress(includeDemo),
    getAllActionRecords(includeDemo),
    getAllWasteRecords(includeDemo),
    getAllElectricityRecords(includeDemo),
    getAllWaterRecords(includeDemo),
    getAllTeacherObservations(includeDemo),
    getAllFollowUps(includeDemo),
  ]);

  const students = users.filter((u) => u.role === 'student');
  const classMap = new Map(classrooms.map((c) => [c.id, c.name]));

  if (reportType === 'student_report') {
    const headers = [
      'รหัสนักเรียน',
      'ชื่อ-นามสกุล',
      'ห้องเรียน',
      'ภารกิจที่สำเร็จ (5 Mission)',
      'คะแนน Pre-Assessment',
      'คะแนน Post-Assessment',
      'จำนวน Eco Action ที่บันทึก',
      'จำนวนที่ครูอนุมัติแล้ว',
      'ประเภทข้อมูล',
    ];
    const rows = students.map((st) => {
      const mDone = missions.filter(
        (m) => m.userId === st.uid && m.status === 'completed'
      ).length;
      const pre = assessments.find(
        (a) => a.studentId === st.uid && a.assessmentType === 'pre'
      );
      const post = assessments.find(
        (a) => a.studentId === st.uid && a.assessmentType === 'post'
      );
      const stActions = actions.filter((a) => a.userId === st.uid);
      const approved = stActions.filter(
        (a) => a.teacherVerification === 'approved'
      ).length;

      return [
        st.studentCode || '-',
        st.displayName,
        classMap.get(st.classId || '') || st.classId || '-',
        mDone,
        pre ? `${pre.totalScore}/${pre.maxScore}` : 'ยังไม่ทำ',
        post ? `${post.totalScore}/${post.maxScore}` : 'ยังไม่ทำ',
        stActions.length,
        approved,
        st.demo ? 'Demo' : 'ข้อมูลจริง',
      ];
    });
    return { title: 'รายงานภาพรวมผู้เรียน (Student Report)', headers, rows };
  }

  if (reportType === 'classroom_report') {
    const headers = [
      'ห้องเรียน',
      'ครูที่ปรึกษา',
      'จำนวนนักเรียน',
      'อัตราทำภารกิจครบ (%)',
      'ค่าเฉลี่ย Pre-Assessment',
      'ค่าเฉลี่ย Post-Assessment',
      'จำนวนบันทึก Eco Action รวม',
    ];
    const rows = classrooms.map((cls) => {
      const clsStudents = students.filter((s) => s.classId === cls.id);
      const count = clsStudents.length;
      const completedAllMissions = clsStudents.filter(
        (s) =>
          missions.filter((m) => m.userId === s.uid && m.status === 'completed')
            .length >= 5
      ).length;
      const completionRate =
        count > 0 ? ((completedAllMissions / count) * 100).toFixed(1) : '0.0';

      const preList = assessments.filter(
        (a) =>
          a.assessmentType === 'pre' &&
          clsStudents.some((s) => s.uid === a.studentId)
      );
      const postList = assessments.filter(
        (a) =>
          a.assessmentType === 'post' &&
          clsStudents.some((s) => s.uid === a.studentId)
      );

      const preAvg =
        preList.length > 0
          ? (
              preList.reduce((acc, item) => acc + item.totalScore, 0) /
              preList.length
            ).toFixed(1)
          : '-';
      const postAvg =
        postList.length > 0
          ? (
              postList.reduce((acc, item) => acc + item.totalScore, 0) /
              postList.length
            ).toFixed(1)
          : '-';

      const clsActions = actions.filter((a) =>
        clsStudents.some((s) => s.uid === a.userId)
      ).length;

      return [
        cls.name,
        cls.teacherName,
        count,
        completionRate,
        preAvg,
        postAvg,
        clsActions,
      ];
    });
    return { title: 'รายงานสรุประดับห้องเรียน (Classroom Report)', headers, rows };
  }

  if (reportType === 'assessment_report') {
    const headers = [
      'รหัสนักเรียน',
      'ชื่อ-นามสกุล',
      'Pre รวม (85)',
      'Post รวม (85)',
      'ผลต่างคะแนน',
      'ร้อยละการเปลี่ยนแปลง (%)',
      'Pre พฤติกรรม (50)',
      'Post พฤติกรรม (50)',
    ];
    const rows = students.map((st) => {
      const pre = assessments.find(
        (a) => a.studentId === st.uid && a.assessmentType === 'pre'
      );
      const post = assessments.find(
        (a) => a.studentId === st.uid && a.assessmentType === 'post'
      );
      const diff =
        pre && post ? post.totalScore - pre.totalScore : null;
      const pct =
        pre && post && pre.totalScore > 0
          ? (((post.totalScore - pre.totalScore) / pre.totalScore) * 100).toFixed(1)
          : '-';

      return [
        st.studentCode || '-',
        st.displayName,
        pre ? pre.totalScore : '-',
        post ? post.totalScore : '-',
        diff !== null ? (diff >= 0 ? `+${diff}` : diff) : '-',
        pct,
        pre ? pre.sectionScores.sectionC : '-',
        post ? post.sectionScores.sectionC : '-',
      ];
    });
    return {
      title: 'รายงานผลแบบประเมินก่อน-หลัง (Assessment Report)',
      headers,
      rows,
    };
  }

  if (reportType === 'behavior_report') {
    const headers = [
      'รหัสนักเรียน',
      'ชื่อ-นามสกุล',
      'แหล่งที่ 1: Self-Assessment (Post/50)',
      'แหล่งที่ 2: Teacher Observation (Post/25)',
      'แหล่งที่ 3: Eco Action ที่ผ่านการรับรอง (ครั้ง)',
      'แหล่งที่ 4: แนวโน้มข้อมูลขยะครัวเรือน',
      'แหล่งที่ 4: แนวโน้มข้อมูลไฟฟ้าครัวเรือน',
      'แหล่งที่ 4: แนวโน้มข้อมูลน้ำครัวเรือน',
    ];
    const rows = students.map((st) => {
      const post = assessments.find(
        (a) => a.studentId === st.uid && a.assessmentType === 'post'
      );
      const obsPost = observations.find(
        (o) => o.studentId === st.uid && o.assessmentPeriod === 'post'
      );
      const verifiedActions = actions.filter(
        (a) => a.userId === st.uid && a.teacherVerification === 'approved'
      ).length;
      const stWaste = waste.filter((w) => w.userId === st.uid && !w.isBaseline);
      const stElec = elec.filter((e) => e.userId === st.uid && !e.isBaseline);
      const stWater = water.filter((w) => w.userId === st.uid && !w.isBaseline);

      return [
        st.studentCode || '-',
        st.displayName,
        post ? post.sectionScores.sectionC : 'รอข้อมูล',
        obsPost ? obsPost.totalScore : 'รอข้อมูล',
        verifiedActions,
        stWaste.length > 0 ? `แนวโน้ม${stWaste[stWaste.length - 1].trend || 'คงที่'}` : 'รอเปรียบเทียบ',
        stElec.length > 0 ? `แนวโน้ม${stElec[stElec.length - 1].trend}` : 'รอเปรียบเทียบ',
        stWater.length > 0 ? `แนวโน้ม${stWater[stWater.length - 1].trend}` : 'รอเปรียบเทียบ',
      ];
    });
    return {
      title: 'รายงานหลักฐานพฤติกรรมจาก 4 แหล่ง (Behavior Evidence Report)',
      headers,
      rows,
    };
  }

  if (reportType === 'eco_action_report') {
    const headers = [
      'วันที่ปฏิบัติ',
      'นักเรียน',
      'แผนปฏิบัติการ',
      'สถานะการทำ',
      'ปริมาณ',
      'หน่วย',
      'การสะท้อนคิด (Reflection)',
      'สถานะครูตรวจรับรอง',
    ];
    const rows = actions.map((a) => [
      a.date,
      a.studentName || a.userId,
      a.actionPlanTitle || a.actionPlanId,
      a.status,
      a.quantity,
      a.unit,
      a.reflection,
      a.teacherVerification,
    ]);
    return { title: 'รายงานการลงมือปฏิบัติจริง (Eco Action Report)', headers, rows };
  }

  if (reportType === 'waste_report') {
    const headers = [
      'รหัสผู้ใช้',
      'วันที่บันทึก',
      'ประเภทข้อมูล',
      'ขยะทั่วไป (kg)',
      'ขยะรีไซเคิล (kg)',
      'ขยะอินทรีย์ (kg)',
      'ขยะพลาสติก (kg)',
      'ขยะรวม (kg)',
      'สัดส่วนหมุนเวียน (%)',
      'ลดลงจาก Baseline (kg)',
      'เปลี่ยนแปลง (%)',
    ];
    const rows = waste.map((w) => [
      w.userId,
      w.recordDate,
      w.isBaseline ? 'Baseline' : 'Report',
      w.generalWasteKg,
      w.recyclableWasteKg,
      w.organicWasteKg,
      w.plasticWasteKg,
      w.totalWaste,
      w.recycledPercentage,
      w.wasteReduction ?? '-',
      w.wasteReductionPercentage ?? '-',
    ]);
    return { title: 'รายงานข้อมูลขยะครัวเรือน (Waste Report)', headers, rows };
  }

  if (reportType === 'electricity_report') {
    const headers = [
      'รหัสผู้ใช้',
      'เดือน/ปี พ.ศ.',
      'ประเภทข้อมูล',
      'หน่วยไฟฟ้า (kWh)',
      'จำนวนสมาชิกบ้าน',
      'ค่าก่อนหน้า (kWh)',
      'ผลต่าง (kWh)',
      'เปลี่ยนแปลง (%)',
      'แนวโน้ม',
    ];
    const rows = elec.map((e) => [
      e.userId,
      `${e.billingMonth}/${e.billingYear}`,
      e.isBaseline ? 'Baseline' : 'Report',
      e.electricityKwh,
      e.householdMembers,
      e.previousKwh ?? '-',
      e.differenceKwh ?? '-',
      e.changePercentage ?? '-',
      `แนวโน้ม${e.trend}`,
    ]);
    return {
      title: 'รายงานการใช้ไฟฟ้าครัวเรือน (Electricity Report)',
      headers,
      rows,
    };
  }

  if (reportType === 'water_report') {
    const headers = [
      'รหัสผู้ใช้',
      'เดือน/ปี พ.ศ.',
      'ประเภทข้อมูล',
      'หน่วยน้ำประปา (ยูนิต)',
      'จำนวนสมาชิกบ้าน',
      'ค่าก่อนหน้า (ยูนิต)',
      'ผลต่าง (ยูนิต)',
      'เปลี่ยนแปลง (%)',
      'แนวโน้ม',
    ];
    const rows = water.map((w) => [
      w.userId,
      `${w.billingMonth}/${w.billingYear}`,
      w.isBaseline ? 'Baseline' : 'Report',
      w.waterUnits,
      w.householdMembers,
      w.previousUnits ?? '-',
      w.difference ?? '-',
      w.changePercentage ?? '-',
      `แนวโน้ม${w.trend}`,
    ]);
    return { title: 'รายงานการใช้น้ำประปาครัวเรือน (Water Report)', headers, rows };
  }

  // followup_report
  const headers = [
    'รหัสผู้ใช้',
    'วันที่ติดตามผล',
    'ยังปฏิบัติอยู่หรือไม่',
    'ความถี่ในการปฏิบัติ',
    'พฤติกรรมที่กลายเป็นกิจวัตร',
    'พฤติกรรมที่หยุดทำ',
    'อุปสรรค',
    'การสะท้อนคิด',
  ];
  const rows = followUps.map((f) => [
    f.userId,
    f.createdAt.slice(0, 10),
    f.stillPracticing,
    f.frequency,
    f.routineBehaviors,
    f.stoppedBehaviors,
    f.obstacles,
    f.reflection,
  ]);
  return { title: 'รายงานการติดตามผลระยะยาว (Follow-up Report)', headers, rows };
}

export async function exportReportAsCsv(
  reportType: ReportType,
  includeDemo = true
): Promise<void> {
  const data = await generateReportDataset(reportType, includeDemo);
  const datePart = new Date().toISOString().slice(0, 10);
  downloadCsvFile(`eco_guardian_${reportType}_${datePart}.csv`, data.headers, data.rows);
}

/**
 * Section 51: ออกแบบ Service ให้รองรับ PDF ในระยะถัดไป (และใช้งานสั่งพิมพ์ PDF ได้ทันที)
 */
export async function exportReportAsPrintablePdf(
  reportType: ReportType,
  includeDemo = true
): Promise<void> {
  const data = await generateReportDataset(reportType, includeDemo);
  const printWindow = window.open('', '_blank', 'width=1024,height=768');
  if (!printWindow) return;

  const thCells = data.headers.map((h) => `<th>${h}</th>`).join('');
  const trRows = data.rows
    .map(
      (r) =>
        `<tr>${r.map((cell) => `<td>${cell ?? '-'}</td>`).join('')}</tr>`
    )
    .join('');

  printWindow.document.write(`
    <!doctype html>
    <html lang="th">
      <head>
        <meta charset="utf-8" />
        <title>${data.title} - ECO GUARDIAN</title>
        <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@400;600;700&display=swap" rel="stylesheet">
        <style>
          body { font-family: 'Sarabun', sans-serif; padding: 24px; color: #1e293b; }
          h1 { font-size: 20px; margin-bottom: 4px; color: #166534; }
          p { font-size: 13px; color: #475569; margin-bottom: 16px; }
          table { width: 100%; border-collapse: collapse; font-size: 12px; }
          th, td { border: 1px solid #cbd5e1; padding: 8px; text-align: left; }
          th { background-color: #f0fdf4; color: #166534; font-weight: 700; }
          tr:nth-child(even) { background-color: #f8fafc; }
        </style>
      </head>
      <body>
        <h1>ECO GUARDIAN - ${data.title}</h1>
        <p>สร้างรายงานเมื่อ: ${new Date().toLocaleString('th-TH')} | หมายเหตุ: ข้อมูลการใช้ทรัพยากรของครัวเรือนแสดงแนวโน้มในช่วงการเข้าร่วมกิจกรรม</p>
        <table>
          <thead><tr>${thCells}</tr></thead>
          <tbody>${trRows}</tbody>
        </table>
        <script>
          window.onload = function() { window.print(); };
        </script>
      </body>
    </html>
  `);
  printWindow.document.close();
}

