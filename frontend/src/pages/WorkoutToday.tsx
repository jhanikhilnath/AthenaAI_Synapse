import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Check, Clock, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import useAuthStore from '@/stores/useAuthStore';

const WorkoutToday = () => {
  const currentPlan = useAuthStore((s) => s.currentPlan);
  const todayWorkout = currentPlan?.plan?.schedule?.[0];
  const [completedSets, setCompletedSets] = useState<Record<string, boolean>>({});

  const toggleSet = (key: string) => {
    setCompletedSets((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const totalSets = todayWorkout?.exercises?.reduce((acc: number, ex: any) => acc + (ex.sets || 0), 0) || 0;
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

  return (
    <div className="min-h-screen bg-background px-4 md:px-8 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="icon" asChild><Link to="/dashboard"><ArrowLeft className="w-5 h-5" /></Link></Button>
          <div>
            <h1 className="text-2xl font-display font-bold">{todayWorkout.focus}</h1>
            <p className="text-xs text-muted-foreground">Day {todayWorkout.day}</p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="glass-card p-4 mb-6">
          <div className="flex justify-between text-xs text-muted-foreground mb-2">
            <span>{doneSets}/{totalSets} sets</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="h-2 bg-secondary rounded-full overflow-hidden">
            <motion.div className="h-full gradient-primary rounded-full" animate={{ width: `${progress}%` }} transition={{ duration: 0.3 }} />
          </div>
        </div>

        {/* Exercises */}
        <div className="space-y-4">
          {todayWorkout.exercises?.map((ex: any, i: number) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="glass-card p-5"
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-display font-semibold">{ex.name}</h3>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="w-3 h-3" /> {ex.rest_seconds}s rest
                </div>
              </div>

              <div className="space-y-2">
                {Array.from({ length: ex.sets }, (_, setIdx) => {
                  const key = `${i}-${setIdx}`;
                  return (
                    <div
                      key={key}
                      className={`flex items-center gap-3 p-2.5 rounded-lg transition-colors ${completedSets[key] ? 'bg-primary/10' : 'bg-secondary/50'}`}
                    >
                      <Checkbox
                        checked={completedSets[key] || false}
                        onCheckedChange={() => toggleSet(key)}
                      />
                      <span className="text-sm">Set {setIdx + 1}</span>
                      <span className="ml-auto text-sm text-muted-foreground">{ex.reps} reps</span>
                      {completedSets[key] && <Check className="w-4 h-4 text-primary" />}
                    </div>
                  );
                })}
              </div>
            </motion.div>
          ))}
        </div>

        {progress === 100 && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="glass-card p-8 text-center mt-8 border-primary/30">
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
