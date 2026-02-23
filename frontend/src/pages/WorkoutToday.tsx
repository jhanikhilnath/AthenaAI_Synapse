import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, Check, ChevronLeft, ChevronRight, Clock, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import useAuthStore from '@/stores/useAuthStore';

const cardVariants = {
  enter: (dir: number) => ({
    x: dir > 0 ? 340 : -340,
    opacity: 0,
    scale: 0.92,
    rotateY: dir > 0 ? 12 : -12,
  }),
  center: {
    x: 0,
    opacity: 1,
    scale: 1,
    rotateY: 0,
    transition: { type: 'spring', stiffness: 280, damping: 28 },
  },
  exit: (dir: number) => ({
    x: dir > 0 ? -340 : 340,
    opacity: 0,
    scale: 0.92,
    rotateY: dir > 0 ? -12 : 12,
    transition: { duration: 0.22 },
  }),
};

// Ghost cards stacked behind active card for deck effect
const DeckGhost = ({ offset }: { offset: number }) => (
  <div
    style={{
      position: 'absolute',
      inset: 0,
      transform: `translateY(${offset * 8}px) scale(${1 - offset * 0.04})`,
      zIndex: -offset,
      borderRadius: 'inherit',
      opacity: 1 - offset * 0.28,
      pointerEvents: 'none',
    }}
    className="glass-card"
  />
);

const WorkoutToday = () => {
  const currentPlan = useAuthStore((s) => s.currentPlan);
  const todayWorkout = currentPlan?.plan?.schedule?.[0];
  const exercises: any[] = todayWorkout?.exercises ?? [];

  const [exIndex, setExIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [completedSets, setCompletedSets] = useState<Record<string, boolean>>({});

  const toggleSet = (key: string) => {
    setCompletedSets((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const navigate = (dir: number) => {
    const next = exIndex + dir;
    if (next < 0 || next >= exercises.length) return;
    setDirection(dir);
    setExIndex(next);
  };

  const totalSets = exercises.reduce((acc, ex) => acc + (ex.sets || 0), 0);
  const doneSets = Object.values(completedSets).filter(Boolean).length;
  const progress = totalSets > 0 ? (doneSets / totalSets) * 100 : 0;

  if (!todayWorkout) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="glass-card p-12 text-center max-w-md">
          <p className="text-muted-foreground mb-4">No workout for today. Generate a plan first.</p>
          <Button asChild className="gradient-primary border-0 text-primary-foreground rounded-full">
            <Link to="/dashboard">Go to Dashboard</Link>
          </Button>
        </div>
      </div>
    );
  }

  const ex = exercises[exIndex];
  const ghostCount = Math.min(2, exercises.length - exIndex - 1);

  return (
    <div className="min-h-screen bg-background px-4 md:px-8 py-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/dashboard"><ArrowLeft className="w-5 h-5" /></Link>
          </Button>
          <div>
            <h1 className="text-2xl font-display font-bold">{todayWorkout.focus}</h1>
            <p className="text-xs text-muted-foreground">Day {todayWorkout.day}</p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="glass-card p-4 mb-6">
          <div className="flex justify-between text-xs text-muted-foreground mb-2">
            <span>{doneSets}/{totalSets} sets done</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="h-2 bg-secondary rounded-full overflow-hidden">
            <motion.div
              className="h-full gradient-primary rounded-full"
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.35 }}
            />
          </div>

          {/* Exercise counter */}
          <div className="flex items-center justify-center gap-2 mt-3">
            {exercises.map((_, i) => (
              <button
                key={i}
                onClick={() => { setDirection(i > exIndex ? 1 : -1); setExIndex(i); }}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === exIndex ? 'w-6 bg-primary' : 'w-1.5 bg-secondary'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Card Deck */}
        <div className="relative mb-6" style={{ perspective: '1000px' }}>
          {/* Ghost cards */}
          {Array.from({ length: ghostCount }, (_, i) => (
            <DeckGhost key={i} offset={i + 1} />
          ))}

          <AnimatePresence custom={direction} mode="popLayout">
            <motion.div
              key={exIndex}
              custom={direction}
              variants={cardVariants}
              initial="enter"
              animate="center"
              exit="exit"
              className="glass-card p-6 relative"
              style={{ transformOrigin: 'center center' }}
            >
              {/* Exercise name + rest */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Exercise {exIndex + 1} of {exercises.length}</p>
                  <h2 className="text-xl font-display font-bold leading-tight">{ex.name}</h2>
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground bg-secondary/60 px-2 py-1 rounded-full">
                  <Clock className="w-3 h-3" /> {ex.rest_seconds}s rest
                </div>
              </div>

              {/* Sets */}
              <div className="space-y-2.5">
                {Array.from({ length: ex.sets }, (_, setIdx) => {
                  const key = `${exIndex}-${setIdx}`;
                  return (
                    <div
                      key={key}
                      className={`flex items-center gap-3 p-3 rounded-xl transition-colors cursor-pointer ${
                        completedSets[key] ? 'bg-primary/10 border border-primary/20' : 'bg-secondary/50'
                      }`}
                      onClick={() => toggleSet(key)}
                    >
                      <Checkbox
                        checked={completedSets[key] || false}
                        onCheckedChange={() => toggleSet(key)}
                      />
                      <span className="text-sm font-medium">Set {setIdx + 1}</span>
                      <span className="ml-auto text-sm text-muted-foreground">{ex.reps} reps</span>
                      {completedSets[key] && <Check className="w-4 h-4 text-primary" />}
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Navigation buttons */}
        <div className="flex items-center justify-between gap-4">
          <Button
            variant="outline"
            onClick={() => navigate(-1)}
            disabled={exIndex === 0}
            className="flex-1 gap-2 rounded-full"
          >
            <ChevronLeft className="w-4 h-4" /> Previous
          </Button>
          <Button
            onClick={() => navigate(1)}
            disabled={exIndex === exercises.length - 1}
            className="flex-1 gap-2 gradient-primary border-0 text-primary-foreground rounded-full"
          >
            Next <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        {/* Completion banner */}
        {progress === 100 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card p-8 text-center mt-8 border-primary/30"
          >
            <Trophy className="w-12 h-12 text-primary mx-auto mb-3" />
            <h3 className="font-display font-bold text-xl mb-1">Workout Complete!</h3>
            <p className="text-sm text-muted-foreground">Great job, athlete. Recovery starts now.</p>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default WorkoutToday;
