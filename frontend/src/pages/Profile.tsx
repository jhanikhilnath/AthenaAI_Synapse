import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  User,
  Dumbbell,
  TrendingUp,
  Calendar,
  Activity,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import useAuthStore from '@/stores/useAuthStore';
import { format } from 'date-fns';

const Profile = () => {
  const { athlete, cycleInfo, fetchProfile, fetchCycleInfo } = useAuthStore();

  useEffect(() => {
    fetchProfile();
    fetchCycleInfo();
  }, []);

  const getSportEmoji = (sport?: string) => {
    switch (sport?.toLowerCase()) {
      case 'running': return '🏃‍♀️';
      case 'cycling': return '🚴‍♀️';
      case 'swimming': return '🏊‍♀️';
      case 'weightlifting': return '🏋️‍♀️';
      case 'crossfit': return '🤸‍♀️';
      case 'tennis': return '🎾';
      case 'basketball': return '🏀';
      case 'soccer': return '⚽';
      case 'football': return '🏈';
      case 'yoga': return '🧘‍♀️';
      case 'pilates': return '🧘‍♀️';
      case 'gymnastics': return '🤸‍♀️';
      case 'rock climbing': return '🧗‍♀️';
      case 'boxing': return '🥊';
      case 'martial arts': return '🥋';
      case 'surfing': return '🏄‍♀️';
      case 'dancing': return '💃';
      case 'rowing': return '🚣‍♀️';
      case 'volleyball': return '🏐';
      case 'hockey': return '🏑';
      case 'skiing': return '🎿';
      case 'snowboarding': return '🏂';
      default: return '💪';
    }
  };

  const getReadinessStr = (phase?: string) => {
    switch (phase?.toLowerCase()) {
      case 'menstrual': return { score: 60, colorClass: 'bg-phase-menstrual', status: 'Focus on recovery & light movement' };
      case 'follicular': return { score: 90, colorClass: 'bg-phase-follicular', status: 'Good to go! High energy, ready to push.' };
      case 'ovulatory': return { score: 100, colorClass: 'bg-phase-ovulatory', status: 'Prime condition! Hit your PRs.' };
      case 'luteal': return { score: 75, colorClass: 'bg-phase-luteal', status: 'Good to go, but listen to your body.' };
      default: return { score: 80, colorClass: 'bg-primary', status: 'Ready to train' };
    }
  };

  const getIntensityStr = (phase?: string) => {
    switch (phase?.toLowerCase()) {
      case 'menstrual': return { level: 'Low', colorClass: 'text-phase-menstrual', desc: 'Keep it light (Yoga, Walking)' };
      case 'follicular': return { level: 'High', colorClass: 'text-phase-follicular', desc: 'Push hard (HIIT, Heavy Weights)' };
      case 'ovulatory': return { level: 'Peak', colorClass: 'text-phase-ovulatory', desc: 'Max effort (PRs, Competitions)' };
      case 'luteal': return { level: 'Moderate', colorClass: 'text-phase-luteal', desc: 'Maintenance (Pilates, Steady Cardio)' };
      default: return { level: 'Normal', colorClass: 'text-primary', desc: 'Standard training load' };
    }
  };

  const readiness = getReadinessStr(cycleInfo?.currentPhase || undefined);
  const intensity = getIntensityStr(cycleInfo?.currentPhase || undefined);

  return (
    <div className='min-h-screen bg-background px-4 md:px-8 py-8'>
      <div className='max-w-3xl mx-auto space-y-8'>
        {/* Header */}
        <div className='flex items-center gap-3'>
          <Button variant='ghost' size='icon' asChild>
            <Link to='/dashboard'>
              <ArrowLeft className='w-5 h-5' />
            </Link>
          </Button>
          <h1 className='text-2xl font-display font-bold'>Your Profile</h1>
        </div>

        {/* Identity Card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className='flex flex-col md:flex-row items-center gap-6 p-2 md:p-6 mb-8 text-center md:text-left'
        >
          <div className='w-28 h-28 rounded-full gradient-primary flex items-center justify-center flex-shrink-0 shadow-xl shadow-primary/20 p-1'>
            <div className="w-full h-full rounded-full bg-background flex items-center justify-center">
              <User className='w-12 h-12 text-primary' />
            </div>
          </div>
          <div>
            <h2 className='font-display font-bold text-3xl md:text-4xl mb-1'>
              {athlete?.name || 'Athlete'}
            </h2>
            <p className='text-sm text-muted-foreground mb-3'>
              {athlete?.email}
            </p>
            <div className='inline-flex items-center gap-2 px-4 py-1.5 bg-primary/10 rounded-full text-xs font-semibold text-primary'>
              <span className='text-sm leading-none'>{getSportEmoji(athlete?.sport)}</span>
              <span>{athlete?.sport || 'General Fitness'}</span>
              <span className='w-1 h-1 bg-primary/30 rounded-full mx-1' />
              <span>{athlete?.experienceLevel || 'Beginner'}</span>
            </div>
          </div>
        </motion.div>

        <div className="flex items-center justify-center opacity-70 my-4">
          <div className="h-[3px] flex-1 max-w-xs rounded-l-full bg-gradient-to-r from-transparent to-primary/40" />
          <div className="w-2 h-2 rounded-full bg-primary/60 mx-4" />
          <div className="h-[3px] flex-1 max-w-xs rounded-r-full bg-gradient-to-l from-transparent to-primary/40" />
        </div>

        <div className='grid md:grid-cols-2 gap-6'>
          {/* Player Readiness */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className='bg-card/40 backdrop-blur-xl border-l-[3px] border-l-primary rounded-3xl p-6 md:p-8 flex flex-col justify-center relative overflow-hidden'
          >
            {/* Soft background glow */}
            <div className={`absolute top-0 right-0 w-32 h-32 opacity-10 blur-3xl rounded-full ${readiness.colorClass}`} />

            <div className='flex items-center justify-between mb-6 relative z-10'>
              <div className='flex items-center gap-3'>
                <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <TrendingUp className='w-5 h-5 text-primary' />
                </div>
                <h3 className='font-display font-semibold text-xl'>
                  Readiness
                </h3>
              </div>
              <span className='font-display font-bold text-lg text-primary bg-primary/10 px-4 py-1.5 rounded-full capitalize'>
                {cycleInfo?.currentPhase ? `${cycleInfo.currentPhase}` : 'Ready'}
              </span>
            </div>
            <div className='h-2 w-full bg-secondary/60 rounded-full overflow-hidden mb-4 relative z-10'>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${readiness.score}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
                className={`h-full ${readiness.colorClass}`}
              />
            </div>
            <p className='text-sm text-muted-foreground leading-relaxed relative z-10'>
              {readiness.status}
            </p>
          </motion.div>

          {/* Training Intensity */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className='bg-card/40 backdrop-blur-xl border-l-[3px] border-l-accent rounded-3xl p-6 md:p-8 flex flex-col justify-center relative overflow-hidden'
          >
            {/* Soft background glow */}
            <div className={`absolute bottom-0 right-0 w-32 h-32 opacity-10 blur-3xl rounded-full bg-accent`} />

            <div className='flex items-center gap-3 mb-6 relative z-10'>
              <div className="w-10 h-10 rounded-2xl bg-accent/10 flex items-center justify-center">
                <Zap className='w-5 h-5 text-accent' />
              </div>
              <h3 className='font-display font-semibold text-xl'>
                Intensity Target
              </h3>
            </div>
            <div className='flex items-end gap-3 mb-2 relative z-10'>
              <span className={`font-display font-bold text-5xl leading-none ${intensity.colorClass}`}>
                {intensity.level}
              </span>
            </div>
            <p className='text-sm text-muted-foreground leading-relaxed relative z-10 mt-2'>
              {intensity.desc}
            </p>
          </motion.div>
        </div>

        <div className="flex items-center justify-center opacity-70 my-4">
          <div className="h-[3px] flex-1 max-w-xs rounded-l-full bg-gradient-to-r from-transparent to-primary/40" />
          <div className="w-2 h-2 rounded-full bg-primary/60 mx-4" />
          <div className="h-[3px] flex-1 max-w-xs rounded-r-full bg-gradient-to-l from-transparent to-primary/40" />
        </div>

        <div className='grid md:grid-cols-2 gap-6'>
          {/* Cycle Stats */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className='bg-card/30 rounded-3xl p-6 md:p-8'
          >
            <div className='flex items-center gap-3 mb-8'>
              <Activity className='w-5 h-5 text-muted-foreground' />
              <h3 className='font-display font-medium text-lg text-muted-foreground'>
                Cycle History
              </h3>
            </div>
            <div className='grid grid-cols-2 gap-8'>
              <div>
                <p className='text-4xl font-display font-bold text-foreground mb-1'>
                  {cycleInfo?.averageCycleLength ? Number(cycleInfo.averageCycleLength).toFixed(1) : '--'}
                </p>
                <p className='text-xs font-medium text-muted-foreground uppercase tracking-wider'>
                  Avg Days
                </p>
              </div>
              <div>
                <p className='text-4xl font-display font-bold text-foreground mb-1'>
                  {athlete?.cycleHistory?.length || 0}
                </p>
                <p className='text-xs font-medium text-muted-foreground uppercase tracking-wider'>
                  Logs
                </p>
              </div>
            </div>
          </motion.div>

          {/* Fitness Stats */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className='bg-card/30 rounded-3xl p-6 md:p-8'
          >
            <div className='flex items-center gap-3 mb-8'>
              <Dumbbell className='w-5 h-5 text-muted-foreground' />
              <h3 className='font-display font-medium text-lg text-muted-foreground'>
                AI Generations
              </h3>
            </div>
            <div className='grid grid-cols-2 gap-8'>
              <div>
                <p className='text-4xl font-display font-bold text-foreground mb-1'>
                  {athlete?.workouts?.length || 0}
                </p>
                <p className='text-xs font-medium text-muted-foreground uppercase tracking-wider'>
                  Total Plans
                </p>
              </div>
              <div className="min-w-0">
                <p className='text-lg sm:text-lg md:text-xl font-display font-bold text-foreground mb-1 capitalize whitespace-nowrap'>
                  {athlete?.workouts?.[athlete.workouts.length - 1]?.phaseData
                    ?.current_phase || 'N/A'}
                </p>
                <p className='text-xs font-medium text-muted-foreground uppercase tracking-wider mt-2.5'>
                  Last Phase
                </p>
              </div>
            </div>
          </motion.div>
        </div>

        <div className="flex items-center justify-center opacity-70 my-4">
          <div className="h-[3px] flex-1 max-w-xs rounded-l-full bg-gradient-to-r from-transparent to-primary/40" />
          <div className="w-2 h-2 rounded-full bg-primary/60 mx-4" />
          <div className="h-[3px] flex-1 max-w-xs rounded-r-full bg-gradient-to-l from-transparent to-primary/40" />
        </div>

        {/* Your Plans List */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className='mt-12'
        >
          <div className='flex items-center gap-3 mb-6 px-2'>
            <div className="w-10 h-10 rounded-2xl bg-secondary flex items-center justify-center">
              <Calendar className='w-5 h-5 text-muted-foreground' />
            </div>
            <h3 className='font-display font-semibold text-xl'>
              Your Plans
            </h3>
          </div>

          {!athlete?.workouts || athlete.workouts.length === 0 ? (
            <div className="bg-card/20 rounded-3xl p-12 text-center border border-dashed border-border/50">
              <p className='text-muted-foreground'>No workout plans generated yet.</p>
            </div>
          ) : (
            <div className='space-y-4'>
              {[...athlete.workouts]
                .reverse()
                .slice(0, 5)
                .map((workout, i) => (
                  <div
                    key={i}
                    className='group flex flex-col sm:flex-row sm:items-center justify-between p-5 md:p-6 bg-card/20 hover:bg-card/40 border border-transparent hover:border-border/50 rounded-3xl transition-all duration-300 gap-4 cursor-pointer'
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full overflow-hidden bg-secondary flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                        <Dumbbell className="w-5 h-5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className='font-semibold text-lg text-foreground group-hover:text-primary transition-colors'>
                          {workout.plan?.schedule?.[0]?.focus || 'Workout Plan'}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="w-2 h-2 rounded-full bg-primary/60" />
                          <p className='text-sm text-muted-foreground'>
                            {workout.phaseData?.current_phase || 'Phase Unknown'}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className='sm:text-right flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 border-border/50 pt-3 sm:pt-0 mt-2 sm:mt-0'>
                      <p className='text-sm font-medium text-foreground bg-secondary/50 px-3 py-1 rounded-full'>
                        {format(new Date(workout.date), 'MMM d, yyyy')}
                      </p>
                      <p className='text-xs text-muted-foreground mt-2 font-medium tracking-wide uppercase'>
                        {workout.plan?.schedule?.length || 0} Day Cycle
                      </p>
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
