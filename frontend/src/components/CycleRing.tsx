import { useMemo, useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface CycleRingProps {
  currentDay: number | null;
  phase: string | null;
  cycleLength?: number;
  predictedNextPeriod?: string | null;
}

// ── Phase detail data ──────────────────────────────────────────────────────────
const PHASE_INFO: Record<string, {
  days: string; hormoneProfile: string; performanceImpact: string;
  trainingFocus: string; recoveryAndOther: string;
}> = {
  Menstrual: {
    days: '1–5',
    hormoneProfile: 'Estrogen and progesterone crash to their lowest baseline.',
    performanceImpact: 'Lower energy levels, reduced endurance, and potential biomechanical changes due to cramping.',
    trainingFocus: 'Baseline maintenance, mobility work, and low-intensity steady state (LISS) cardio.',
    recoveryAndOther: 'Systemic inflammation is high. Recovery from intense muscle damage is slower. The body has a higher demand for iron and hydration to offset blood loss.',
  },
  Follicular: {
    days: '6–13',
    hormoneProfile: 'Estrogen rises steadily; testosterone begins a slow climb.',
    performanceImpact: 'High energy, increased pain tolerance, and optimal access to stored carbohydrates for explosive energy.',
    trainingFocus: 'Progressive overload, heavy resistance training, and high-intensity interval training (HIIT).',
    recoveryAndOther: "The 'Golden Window' for athletes. Muscle recovery is at its absolute peak. Sleep architecture is optimal, and the body builds muscle mass most efficiently during this block.",
  },
  Ovulatory: {
    days: '14–16',
    hormoneProfile: 'Estrogen peaks sharply; Luteinizing Hormone (LH) surges.',
    performanceImpact: 'Absolute peak power output and maximum baseline strength.',
    trainingFocus: 'Hitting 1 Rep Maxes (1RM) and peak athletic performance, but with highly controlled eccentric movements.',
    recoveryAndOther: 'CRITICAL INJURY RISK: Peak estrogen decreases collagen synthesis, causing ligament laxity. Female athletes are up to 6× more likely to suffer an ACL tear during this 72-hour window.',
  },
  Luteal: {
    days: '17–28',
    hormoneProfile: 'Progesterone dominates; estrogen makes a secondary bump before both crash.',
    performanceImpact: 'Decreased aerobic capacity, increased cardiovascular strain, and harder access to stored glycogen.',
    trainingFocus: 'Tapering volume, shifting to moderate-intensity workouts, and prioritising form over heavy weight.',
    recoveryAndOther: 'Progesterone breaks down amino acids, slowing recovery. Core temperature elevated ~0.5°C, reducing heat tolerance. Caloric burn at rest increases 5–10%.',
  },
};

// ── Ring config ────────────────────────────────────────────────────────────────
const phases = [
  { name: 'Menstrual', color: 'var(--phase-menstrual)', startPct: 0, endPct: 0.18 },
  { name: 'Follicular', color: 'var(--phase-follicular)', startPct: 0.18, endPct: 0.46 },
  { name: 'Ovulatory', color: 'var(--phase-ovulatory)', startPct: 0.46, endPct: 0.57 },
  { name: 'Luteal', color: 'var(--phase-luteal)', startPct: 0.57, endPct: 1 },
];

const CycleRing = ({ currentDay, phase, cycleLength = 28, predictedNextPeriod }: CycleRingProps) => {
  const size = 380;
  const center = size / 2;
  const radius = 120;
  const strokeWidth = 24;
  const labelRadius = radius + strokeWidth / 2 + 22;
  const elbowLen = 28;

  // ── Hover state ──────────────────────────────────────────────────────────────
  const [hoveredPhase, setHoveredPhase] = useState<string | null>(null);
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleEnter = useCallback((name: string) => {
    setHoveredPhase(name);
    timerRef.current = setTimeout(() => setActiveTooltip(name), 200);
  }, []);

  const handleLeave = useCallback(() => {
    setHoveredPhase(null);
    setActiveTooltip(null);
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  // ── Arc geometry ─────────────────────────────────────────────────────────────
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

      const midPct = (p.startPct + p.endPct) / 2;
      const midAngle = midPct * 360 - 90;
      const midRad = (midAngle * Math.PI) / 180;

      const lx1 = center + labelRadius * Math.cos(midRad);
      const ly1 = center + labelRadius * Math.sin(midRad);
      const outerR = labelRadius + 18;
      const lx2 = center + outerR * Math.cos(midRad);
      const ly2 = center + outerR * Math.sin(midRad);
      const isRight = Math.cos(midRad) >= 0;
      const lx3 = lx2 + (isRight ? elbowLen : -elbowLen);
      const textAnchor = isRight ? 'start' : 'end';
      const textX = lx3 + (isRight ? 4 : -4);

      const arcFraction = p.endPct - p.startPct;
      const circumference = 2 * Math.PI * radius;
      const arcLen = arcFraction * circumference;

      return {
        ...p, d: `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`,
        lx1, ly1, lx2, ly2, lx3, textX, textAnchor, isRight, arcLen, circumference
      };
    });
  }, []);

  // Basketball
  const dayPct = currentDay ? currentDay / cycleLength : 0;
  const indicatorAngle = dayPct * 360 - 90;
  const indicatorRad = (indicatorAngle * Math.PI) / 180;
  const ix = center + radius * Math.cos(indicatorRad);
  const iy = center + radius * Math.sin(indicatorRad);
  const BALL = 24;

  const tooltipInfo = activeTooltip ? PHASE_INFO[activeTooltip] : null;
  const tooltipArc = activeTooltip ? arcs.find(a => a.name === activeTooltip) : null;

  return (
    <div className="flex flex-col items-center w-full relative">
      <svg
        width="100%"
        viewBox={`0 0 ${size} ${size}`}
        style={{ maxWidth: size, overflow: 'visible' }}
      >
        {/* Background track */}
        <circle cx={center} cy={center} r={radius}
          fill="none" stroke="hsl(var(--border))" strokeWidth={strokeWidth} opacity={0.3} />

        {/* Phase arcs */}
        {arcs.map((arc, i) => {
          const isHov = hoveredPhase === arc.name;
          return (
            <motion.path
              key={arc.name}
              d={arc.d}
              fill="none"
              stroke={`hsl(${arc.color})`}
              strokeLinecap="round"
              initial={{ strokeDasharray: `0 ${arc.circumference}`, opacity: 0 }}
              animate={{
                strokeDasharray: `${arc.arcLen} ${arc.circumference}`,
                opacity: hoveredPhase && !isHov ? 0.35 : 0.9,
                strokeWidth: isHov ? strokeWidth + 6 : strokeWidth,
              }}
              transition={{
                strokeDasharray: { duration: 0.7, delay: 0.3 + i * 0.18, ease: 'easeOut' },
                opacity: { duration: 0.25 },
                strokeWidth: { duration: 0.2 },
              }}
              style={{ cursor: 'pointer' }}
              onMouseEnter={() => handleEnter(arc.name)}
              onMouseLeave={handleLeave}
            />
          );
        })}

        {/* Phase labels */}
        {arcs.map((arc, i) => {
          const isHov = hoveredPhase === arc.name;
          return (
            <motion.g
              key={`label-${arc.name}`}
              initial={{ opacity: 0, x: arc.isRight ? -12 : 12 }}
              animate={{ opacity: hoveredPhase && !isHov ? 0.3 : 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.5 + i * 0.18 }}
              style={{ cursor: 'pointer' }}
              onMouseEnter={() => handleEnter(arc.name)}
              onMouseLeave={handleLeave}
            >
              <line x1={arc.lx1} y1={arc.ly1} x2={arc.lx2} y2={arc.ly2}
                stroke={`hsl(${arc.color})`} strokeWidth={isHov ? 2 : 1.5} opacity={0.8} />
              <line x1={arc.lx2} y1={arc.ly2} x2={arc.lx3} y2={arc.ly2}
                stroke={`hsl(${arc.color})`} strokeWidth={isHov ? 2 : 1.5} opacity={0.8} />
              <circle cx={arc.lx1} cy={arc.ly1} r={isHov ? 4 : 3}
                fill={`hsl(${arc.color})`} opacity={0.9} />
              <text
                x={arc.textX} y={arc.ly2}
                textAnchor={arc.textAnchor}
                dominantBaseline="middle"
                fontSize={isHov ? 13 : 11}
                fontWeight={isHov ? '700' : '600'}
                fill={`hsl(${arc.color})`}
                style={{ transition: 'font-size 0.2s' }}
              >
                {arc.name}
              </text>
            </motion.g>
          );
        })}

        {/* Basketball */}
        {currentDay && (
          <motion.g
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 1.1, type: 'spring', stiffness: 260, damping: 18 }}
            style={{ transformOrigin: `${ix}px ${iy}px` }}
          >
            <circle cx={ix} cy={iy} r={15} fill="white" opacity={0.9} />
            <foreignObject x={ix - BALL / 2} y={iy - BALL / 2} width={BALL} height={BALL} style={{ overflow: 'visible' }}>
              <div style={{
                width: BALL, height: BALL, display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: BALL - 4, lineHeight: 1, userSelect: 'none'
              }}>
                🏀
              </div>
            </foreignObject>
          </motion.g>
        )}

        {/* Center text */}
        <motion.g
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4, duration: 0.4 }}
          style={{ transformOrigin: `${center}px ${center}px` }}
        >
          <text x={center} y={center - 14} textAnchor="middle"
            fill="hsl(var(--foreground))" fontSize="30" fontWeight="bold">
            {currentDay ? `Day ${currentDay}` : '—'}
          </text>
          <text x={center} y={center + 12} textAnchor="middle"
            fill="hsl(var(--muted-foreground))" fontSize="13">
            {phase || 'Unknown'}
          </text>
        </motion.g>
      </svg>

      {/* ── Hover tooltip popup ────────────────────────────────────────────── */}
      <AnimatePresence>
        {tooltipInfo && tooltipArc && (
          <motion.div
            key={activeTooltip}
            initial={{ opacity: 0, scale: 0.92, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 8 }}
            transition={{ duration: 0.22 }}
            className="mt-3 w-full rounded-2xl border p-4 shadow-lg"
            style={{
              borderColor: `hsl(${tooltipArc.color})`,
              background: 'hsl(var(--card) / 0.95)',
              backdropFilter: 'blur(8px)',
            }}
            onMouseEnter={() => handleEnter(activeTooltip!)}
            onMouseLeave={handleLeave}
          >
            <div className="flex items-center gap-2 mb-3">
              <div className="w-3 h-3 rounded-full" style={{ background: `hsl(${tooltipArc.color})` }} />
              <h4 className="font-display font-bold text-sm" style={{ color: `hsl(${tooltipArc.color})` }}>
                {activeTooltip} Phase · Days {tooltipInfo.days}
              </h4>
            </div>
            <div className="space-y-2 text-[11px] leading-relaxed text-muted-foreground">
              <div>
                <span className="font-semibold text-foreground/70">Hormones: </span>
                {tooltipInfo.hormoneProfile}
              </div>
              <div>
                <span className="font-semibold text-foreground/70">Performance: </span>
                {tooltipInfo.performanceImpact}
              </div>
              <div>
                <span className="font-semibold text-foreground/70">Training: </span>
                {tooltipInfo.trainingFocus}
              </div>
              <div>
                <span className="font-semibold text-foreground/70">Recovery: </span>
                {tooltipInfo.recoveryAndOther}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {predictedNextPeriod && (
        <motion.p
          initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.2 }}
          className="text-xs text-muted-foreground mt-3"
        >
          Next period:{' '}
          <span className="text-foreground font-medium">
            {new Date(predictedNextPeriod).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </span>
        </motion.p>
      )}
    </div>
  );
};

export default CycleRing;
