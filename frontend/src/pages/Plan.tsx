import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowLeft, Dumbbell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import useAuthStore from '@/stores/useAuthStore';

const Plan = () => {
  const currentPlan = useAuthStore((s) => s.currentPlan);
  const schedule = currentPlan?.plan?.schedule || [];

  return (
    <div className="min-h-screen bg-background px-4 md:px-8 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <Button variant="ghost" size="icon" asChild><Link to="/dashboard"><ArrowLeft className="w-5 h-5" /></Link></Button>
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
          <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide">
            {schedule.map((day: any, i: number) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="glass-card p-6 min-w-[260px] snap-center flex-shrink-0"
              >
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center text-primary-foreground text-sm font-bold">
                    {day.day}
                  </div>
                  <span className="text-xs text-muted-foreground">Day {day.day}</span>
                </div>
                <h3 className="font-display font-semibold mb-3">{day.focus}</h3>
                <ul className="space-y-2">
                  {day.exercises?.map((ex: any, j: number) => (
                    <li key={j} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Dumbbell className="w-3 h-3 text-primary flex-shrink-0" />
                      <span className="truncate">{ex.name}</span>
                      <span className="ml-auto text-xs whitespace-nowrap">{ex.sets}×{ex.reps}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Plan;
