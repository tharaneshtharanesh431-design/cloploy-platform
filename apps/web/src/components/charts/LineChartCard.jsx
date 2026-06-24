import { ResponsiveContainer, AreaChart, Area, Tooltip } from 'recharts';
import { GlassCard } from '../common/GlassCard';

export function LineChartCard({ title, data, stroke = '#A855F7' }) {
  return (
    <GlassCard className="border border-white/[0.06]">
      <h3 className="text-sm font-semibold font-space text-white/60 uppercase tracking-wider mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height={180}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id={`gradient-${title}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={stroke} stopOpacity={0.3} />
              <stop offset="100%" stopColor={stroke} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Tooltip
            contentStyle={{
              background: '#161B22',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: '12px',
              color: '#fff',
              fontSize: '12px',
              fontFamily: 'Space Grotesk'
            }}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke={stroke}
            strokeWidth={2.5}
            fill={`url(#gradient-${title})`}
            dot={false}
            activeDot={{ r: 5, fill: stroke, stroke: '#06080F', strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </GlassCard>
  );
}
