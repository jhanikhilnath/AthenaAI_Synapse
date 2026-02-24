import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowLeft, ChevronLeft, ChevronRight, Dumbbell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import useAuthStore from '@/stores/useAuthStore';

const cardVariants = {
  enter: (dir: number) => ({
    x: dir > 0 ? 380 : -380,
    opacity: 0,
    scale: 0.90,
    rotate: dir > 0 ? 6 : -6,
  }),
  center: {
    x: 0,
    opacity: 1,
    scale: 1,
    rotate: 0,
    transition: { type: 'spring', stiffness: 260, damping: 26 },
  },
  exit: (dir: number) => ({
    x: dir > 0 ? -380 : 380,
    opacity: 0,
    scale: 0.90,
    rotate: dir > 0 ? -6 : 6,
    transition: { duration: 0.24 },
  }),
};

const Plan = () => {
  const currentPlan = useAuthStore((s) => s.currentPlan);
  const schedule: any[] = currentPlan?.plan?.schedule || [];

  const [dayIndex, setDayIndex] = useState(0);
  const [direction, setDirection] = useState(1);

  const navigate = (dir: number) => {
    const next = dayIndex + dir;
    if (next < 0 || next >= schedule.length) return;
    setDirection(dir);
    setDayIndex(next);
  };

  // How many ghost cards to show stacked behind
  const ghostCount = Math.min(2, schedule.length - dayIndex - 1);

  return (
    <div className="min-h-screen bg-background px-4 md:px-8 py-8">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/dashboard"><ArrowLeft className="w-5 h-5" /></Link>
          </Button>
          <h1 className="text-2xl font-display font-bold">Weekly Plan</h1>
        </div>

        {schedule.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <p className="text-muted-foreground mb-4">No plan generated yet.</p>
            <Button asChild className="gradient-primary border-0 text-primary-foreground rounded-full">
              <Link to="/dashboard">Go to Dashboard</Link>
            </Button>
          </div>
        ) : (
          <>
            {/* Day label */}
            <div className="flex items-center justify-between mb-3 px-1">
              <p className="text-sm text-muted-foreground">
                Day <span className="text-foreground font-semibold">{dayIndex + 1}</span> of {schedule.length}
              </p>
              {/* Dot indicators */}
              <div className="flex items-center gap-1.5">
                {schedule.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => { setDirection(i > dayIndex ? 1 : -1); setDayIndex(i); }}
                    className={`h-1.5 rounded-full transition-all duration-300 ${i === dayIndex ? 'w-6 bg-primary' : 'w-1.5 bg-secondary'
                      }`}
                  />
                ))}
              </div>
            </div>

            {/* Card Deck */}
            <div className="relative mb-6" style={{ perspective: '1100px' }}>
              {/* Ghost cards stacked behind */}
              {Array.from({ length: ghostCount }, (_, i) => (
                <div
                  key={i}
                  className="glass-card absolute inset-0"
                  style={{
                    transform: `translateY(${(i + 1) * 9}px) scale(${1 - (i + 1) * 0.04})`,
                    zIndex: -(i + 1),
                    opacity: 1 - (i + 1) * 0.28,
                    borderRadius: 'inherit',
                    pointerEvents: 'none',
                  }}
                />
              ))}

              <AnimatePresence custom={direction} mode="popLayout">
                <motion.div
                  key={dayIndex}
                  custom={direction}
                  variants={cardVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  className="glass-card p-6 relative"
                  style={{ transformOrigin: 'center center' }}
                >
                  {/* Day badge */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center text-primary-foreground font-bold text-lg">
                      {schedule[dayIndex].day}
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Day {schedule[dayIndex].day}</p>
                      <h3 className="font-display font-semibold text-lg leading-tight">
                        {schedule[dayIndex].focus}
                      </h3>
                    </div>
                  </div>

                  {/* Exercise list */}
                  <ul className="space-y-2.5">
                    {schedule[dayIndex].exercises?.map((ex: any, j: number) => (
                      <motion.li
                        key={j}
                        initial={{ opacity: 0, x: 12 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: j * 0.05 }}
                        className="flex items-center gap-2.5 text-sm text-muted-foreground bg-secondary/40 px-3 py-2 rounded-lg"
                      >
                        <Dumbbell className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                        <span className="truncate flex-1">{ex.name}</span>
                        <span className="text-xs whitespace-nowrap font-medium text-foreground/70">
                          {ex.sets}×{ex.reps}
                        </span>
                      </motion.li>
                    ))}
                  </ul>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between gap-4">
              <Button
                variant="outline"
                onClick={() => navigate(-1)}
                disabled={dayIndex === 0}
                className="flex-1 gap-2 rounded-full"
              >
                <ChevronLeft className="w-4 h-4" /> Previous
              </Button>
              <Button
                onClick={() => navigate(1)}
                disabled={dayIndex === schedule.length - 1}
                className="flex-1 gap-2 gradient-primary border-0 text-primary-foreground rounded-full"
              >
                Next <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Plan;
