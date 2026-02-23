import { useMemo } from 'react';
import { motion } from 'framer-motion';

interface CycleRingProps {
  currentDay: number | null;
  phase: string | null;
  cycleLength?: number;
  predictedNextPeriod?: string | null;
}

const phases = [
  { name: 'Menstrual', color: 'var(--phase-menstrual)', startPct: 0, endPct: 0.18 },
  { name: 'Follicular', color: 'var(--phase-follicular)', startPct: 0.18, endPct: 0.46 },
  { name: 'Ovulatory', color: 'var(--phase-ovulatory)', startPct: 0.46, endPct: 0.57 },
  { name: 'Luteal', color: 'var(--phase-luteal)', startPct: 0.57, endPct: 1 },
];

const CycleRing = ({ currentDay, phase, cycleLength = 28, predictedNextPeriod }: CycleRingProps) => {
  const size = 280;
  const center = size / 2;
  const radius = 110;
  const strokeWidth = 22;

  const arcs = useMemo(() => {
    return phases.map((p) => {
      const startAngle = p.startPct * 360 - 90;
      const endAngle = p.endPct * 360 - 90;
      const startRad = (startAngle * Math.PI) / 180;
      const endRad = (endAngle * Math.PI) / 180;
      const largeArc = endAngle - startAngle > 180 ? 1 : 0;

      const x1 = center + radius * Math.cos(startRad);
      const y1 = center + radius * Math.sin(startRad);
      const x2 = center + radius * Math.cos(endRad);
      const y2 = center + radius * Math.sin(endRad);

      return {
        ...p,
        d: `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`,
      };
    });
  }, []);

  // Indicator position
  const dayPct = currentDay ? currentDay / cycleLength : 0;
  const indicatorAngle = dayPct * 360 - 90;
  const indicatorRad = (indicatorAngle * Math.PI) / 180;
  const ix = center + radius * Math.cos(indicatorRad);
  const iy = center + radius * Math.sin(indicatorRad);

  const phaseName = phase || 'Unknown';

  return (
    <div className="flex flex-col items-center">
      <motion.svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        initial={{ opacity: 0, rotate: -20 }}
        animate={{ opacity: 1, rotate: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
      >
        {/* Background track */}
        <circle cx={center} cy={center} r={radius} fill="none" stroke="hsl(var(--border))" strokeWidth={strokeWidth} opacity={0.3} />

        {/* Phase arcs */}
        {arcs.map((arc) => (
          <path
            key={arc.name}
            d={arc.d}
            fill="none"
            stroke={`hsl(${arc.color})`}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            opacity={0.8}
          />
        ))}

        {/* Current day indicator */}
        {currentDay && (
          <motion.circle
            cx={ix}
            cy={iy}
            r={8}
            fill="hsl(var(--foreground))"
            stroke="hsl(var(--background))"
            strokeWidth={3}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.5, type: 'spring' }}
          />
        )}

        {/* Center text */}
        <text x={center} y={center - 15} textAnchor="middle" fill="hsl(var(--foreground))" className="text-3xl font-display font-bold" fontSize="32">
          {currentDay ? `Day ${currentDay}` : '—'}
        </text>
        <text x={center} y={center + 12} textAnchor="middle" fill="hsl(var(--muted-foreground))" className="text-sm" fontSize="13">
          {phaseName}
        </text>
      </motion.svg>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 justify-center mt-4">
        {phases.map((p) => (
          <div key={p.name} className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: `hsl(${p.color})` }} />
            {p.name}
          </div>
        ))}
      </div>

      {predictedNextPeriod && (
        <p className="text-xs text-muted-foreground mt-3">
          Next period: <span className="text-foreground font-medium">{new Date(predictedNextPeriod).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
        </p>
      )}
    </div>
  );
};

export default CycleRing;
