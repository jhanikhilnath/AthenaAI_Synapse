import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, User, Dumbbell, TrendingUp, Calendar, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import useAuthStore from '@/stores/useAuthStore';
import { format } from 'date-fns';

const Profile = () => {
  const { athlete, cycleInfo, fetchProfile, fetchCycleInfo } = useAuthStore();

  useEffect(() => { 
    fetchProfile(); 
    fetchCycleInfo();
  }, []);

  return (
    <div className="min-h-screen bg-background px-4 md:px-8 py-8">
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/dashboard"><ArrowLeft className="w-5 h-5" /></Link>
          </Button>
          <h1 className="text-2xl font-display font-bold">Your Profile</h1>
        </div>

        {/* Identity Card */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-8 flex items-center gap-6">
          <div className="w-20 h-20 rounded-full gradient-primary flex items-center justify-center flex-shrink-0">
            <User className="w-10 h-10 text-primary-foreground" />
          </div>
          <div>
            <h2 className="font-display font-bold text-2xl">{athlete?.name || 'Athlete'}</h2>
            <p className="text-sm text-muted-foreground mb-1">{athlete?.email}</p>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-secondary rounded-full text-xs font-medium text-muted-foreground mt-2">
              <Dumbbell className="w-3 h-3" />
              <span>{athlete?.sport || 'General Fitness'}</span>
              <span className="w-1 h-1 bg-border rounded-full" />
              <span>{athlete?.experienceLevel || 'Beginner'}</span>
            </div>
          </div>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Cycle Stats */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-6">
            <div className="flex items-center gap-2 mb-6">
              <Activity className="w-5 h-5 text-accent" />
              <h3 className="font-display font-semibold text-lg">Cycle Statistics</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-secondary/50 rounded-xl p-4 text-center">
                <p className="text-3xl font-display font-bold text-accent">{cycleInfo?.averageCycleLength || '--'}</p>
                <p className="text-xs text-muted-foreground mt-1">Avg Cycle Length</p>
              </div>
              <div className="bg-secondary/50 rounded-xl p-4 text-center">
                <p className="text-3xl font-display font-bold text-accent">{athlete?.cycleHistory?.length || 0}</p>
                <p className="text-xs text-muted-foreground mt-1">Recorded Cycles</p>
              </div>
            </div>
          </motion.div>

          {/* Fitness Stats */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card p-6">
            <div className="flex items-center gap-2 mb-6">
              <Dumbbell className="w-5 h-5 text-primary" />
              <h3 className="font-display font-semibold text-lg">Fitness Journey</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-secondary/50 rounded-xl p-4 text-center">
                <p className="text-3xl font-display font-bold text-primary">{athlete?.workouts?.length || 0}</p>
                <p className="text-xs text-muted-foreground mt-1">Total Plans Generated</p>
              </div>
              <div className="bg-secondary/50 rounded-xl p-4 text-center">
                <p className="text-lg font-display font-bold text-primary truncate max-w-full px-2">
                   {athlete?.workouts?.[athlete.workouts.length - 1]?.phaseData?.current_phase || 'N/A'}
                </p>
                <p className="text-xs text-muted-foreground mt-1">Latest Phase Synced</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Recent Workouts List */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-card p-6">
          <div className="flex items-center gap-2 mb-6">
            <Calendar className="w-5 h-5 text-muted-foreground" />
            <h3 className="font-display font-semibold text-lg">Recent AI Plans</h3>
          </div>
          
          {!athlete?.workouts || athlete.workouts.length === 0 ? (
            <p className="text-sm text-center text-muted-foreground py-8">No workout plans generated yet.</p>
          ) : (
            <div className="space-y-3">
              {[...athlete.workouts].reverse().slice(0, 5).map((workout, i) => (
                <div key={i} className="flex items-center justify-between p-4 bg-secondary/30 rounded-lg hover:bg-secondary/50 transition-colors">
                  <div>
                    <p className="font-medium text-sm">{workout.plan?.schedule?.[0]?.focus || 'Workout Plan'}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{workout.phaseData?.current_phase || 'Phase Unknown'}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-medium">{format(new Date(workout.date), 'MMM d, yyyy')}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{workout.plan?.schedule?.length || 0} days</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>

      </div>
    </div>
  );
};

export default Profile;
