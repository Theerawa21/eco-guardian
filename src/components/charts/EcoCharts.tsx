import React from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

export interface RadarDataPoint {
  domain: string;
  preScore: number;
  postScore?: number;
  teacherScore?: number;
  fullMark: number;
}

export const BehaviorRadarChart: React.FC<{ data: RadarDataPoint[] }> = ({ data }) => (
  <div className="h-72 w-full" aria-label="กราฟเรดาร์แสดงคะแนนพฤติกรรมสิ่งแวดล้อม 5 ด้าน">
    <ResponsiveContainer width="100%" height="100%">
      <RadarChart cx="50%" cy="50%" outerRadius="72%" data={data}>
        <PolarGrid stroke="#e2e8f0" />
        <PolarAngleAxis
          dataKey="domain"
          tick={{ fill: '#334155', fontSize: 12, fontWeight: 500 }}
        />
        <PolarRadiusAxis angle={30} domain={[0, 10]} tick={{ fontSize: 10 }} />
        <Radar
          name="ก่อนกิจกรรม (Pre)"
          dataKey="preScore"
          stroke="#0284c7"
          fill="#0ea5e9"
          fillOpacity={0.3}
        />
        {data.some((d) => d.postScore !== undefined && d.postScore > 0) && (
          <Radar
            name="หลังกิจกรรม (Post)"
            dataKey="postScore"
            stroke="#15803d"
            fill="#22c55e"
            fillOpacity={0.4}
          />
        )}
        {data.some((d) => d.teacherScore !== undefined && d.teacherScore > 0) && (
          <Radar
            name="ครูสังเกตพฤติกรรม"
            dataKey="teacherScore"
            stroke="#d97706"
            fill="#f59e0b"
            fillOpacity={0.25}
          />
        )}
        <Legend wrapperStyle={{ fontSize: '12px' }} />
        <Tooltip />
      </RadarChart>
    </ResponsiveContainer>
  </div>
);

export interface TrendLinePoint {
  label: string;
  value: number;
  baseline?: number;
}

export const ResourceTrendLineChart: React.FC<{
  data: TrendLinePoint[];
  unitLabel: string;
  color?: string;
}> = ({ data, unitLabel, color = '#16a34a' }) => (
  <div className="h-64 w-full" aria-label={`กราฟเส้นแสดงแนวโน้ม (${unitLabel})`}>
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#475569' }} />
        <YAxis tick={{ fontSize: 12, fill: '#475569' }} />
        <Tooltip
          formatter={(value: any) => [`${value} ${unitLabel}`, 'ค่าที่บันทึก']}
        />
        <Legend wrapperStyle={{ fontSize: '12px' }} />
        <Line
          type="monotone"
          dataKey="value"
          name={`ปริมาณ (${unitLabel})`}
          stroke={color}
          strokeWidth={3}
          dot={{ r: 5 }}
          activeDot={{ r: 7 }}
        />
        {data.some((d) => d.baseline !== undefined) && (
          <Line
            type="monotone"
            dataKey="baseline"
            name={`ค่าพื้นฐาน Baseline (${unitLabel})`}
            stroke="#94a3b8"
            strokeDasharray="5 5"
            strokeWidth={2}
            dot={false}
          />
        )}
      </LineChart>
    </ResponsiveContainer>
  </div>
);

export interface BarComparisonPoint {
  name: string;
  pre: number;
  post: number;
}

export const AssessmentComparisonBarChart: React.FC<{
  data: BarComparisonPoint[];
}> = ({ data }) => (
  <div className="h-64 w-full" aria-label="กราฟแท่งเปรียบเทียบคะแนนก่อนและหลังกิจกรรม">
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#475569' }} />
        <YAxis tick={{ fontSize: 12, fill: '#475569' }} />
        <Tooltip />
        <Legend wrapperStyle={{ fontSize: '12px' }} />
        <Bar
          dataKey="pre"
          name="ก่อนกิจกรรม (Pre)"
          fill="#38bdf8"
          radius={[6, 6, 0, 0]}
        />
        <Bar
          dataKey="post"
          name="หลังกิจกรรม (Post)"
          fill="#16a34a"
          radius={[6, 6, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  </div>
);

export const EcoProgressChart: React.FC<{
  label: string;
  current: number;
  target: number;
  unit?: string;
  colorClass?: string;
}> = ({
  label,
  current,
  target,
  unit = '',
  colorClass = 'bg-eco-600',
}) => {
  const pct = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0;
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
        <span>{label}</span>
        <span>
          {current}/{target} {unit} ({pct}%)
        </span>
      </div>
      <div
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label}
        className="h-3 w-full overflow-hidden rounded-full bg-slate-100"
      >
        <div
          className={`h-full rounded-full transition-all duration-500 ${colorClass}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
};

