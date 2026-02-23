import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CalendarDays, Zap, Loader2, LogOut, Dumbbell, ClipboardList, Upload, MessageSquare, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import useAuthStore from '@/stores/useAuthStore';
import CycleRing from '@/components/CycleRing';
import api from '@/lib/api';
import { format } from 'date-fns';

const Dashboard = () => {
  const { athlete, cycleInfo, currentPlan, setCurrentPlan, fetchProfile, fetchCycleInfo, logout } = useAuthStore();
  const [generating, setGenerating] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    fetchProfile();
    fetchCycleInfo();
  }, []);

  const generatePlan = async () => {
    setGenerating(true);
    try {
      const { data } = await api.post('/api/workout/generate', {});
      setCurrentPlan(data);
      toast({ title: 'Plan generated!', description: data.plan?.athlete_summary?.slice(0, 80) + '...' });
    } catch (err: any) {
      toast({ title: 'Generation failed', description: err?.response?.data?.message || 'Make sure you logged cycle & biometrics first.', variant: 'destructive' });
    } finally {
      setGenerating(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const todayWorkout = currentPlan?.plan?.schedule?.[0];

  return (
    <div className="min-h-screen bg-background">
      {/* Top Bar */}
      <header className="sticky top-0 z-50 glass-card rounded-none border-x-0 border-t-0 px-4 md:px-8 py-4 flex items-center justify-between">
        <div>
          <h2 className="font-display font-bold text-lg gradient-text">
            Welcome back, {athlete?.name?.split(' ')[0] || 'Athlete'}!
          </h2>
          <p className="text-xs text-muted-foreground">{format(new Date(), 'EEEE, MMMM d')}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="rounded-full text-xs text-primary border-primary" asChild>
            <Link to="/log-period">Log Period</Link>
          </Button>
          <Button variant="outline" size="sm" className="rounded-full text-xs" asChild>
            <Link to="/setup">Log Biometrics</Link>
          </Button>
          <Button variant="ghost" size="icon" asChild className="text-muted-foreground">
            <Link to="/profile"><User className="w-4 h-4" /></Link>
          </Button>
          <Button variant="ghost" size="icon" onClick={handleLogout} className="text-muted-foreground">
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 md:px-8 py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="grid md:grid-cols-2 gap-8">
          {/* Left: Cycle Ring */}
          <div className="glass-card p-8 flex flex-col items-center justify-center">
            <CycleRing
              currentDay={cycleInfo?.currentCycleDay ?? null}
              phase={cycleInfo?.currentPhase ?? null}
              cycleLength={cycleInfo?.averageCycleLength}
              predictedNextPeriod={cycleInfo?.predictedNextPeriodStart}
            />
            {cycleInfo?.physiologicalContext && (
              <p className="text-xs text-muted-foreground text-center mt-4 max-w-xs leading-relaxed">
                {cycleInfo.physiologicalContext}
              </p>
            )}
          </div>

          {/* Right: Actions */}
          <div className="space-y-6">
            {/* Today's Action */}
            {todayWorkout ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
                    <Dumbbell className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <div>
                    <h3 className="font-display font-semibold">Today's Focus</h3>
                    <p className="text-sm text-muted-foreground">{todayWorkout.focus}</p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mb-4">{todayWorkout.exercises?.length} exercises</p>
                <Button asChild className="w-full gradient-primary border-0 text-primary-foreground rounded-full">
                  <Link to="/workout/today">Start Workout</Link>
                </Button>
              </motion.div>
            ) : (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-8 text-center">
                <Zap className="w-12 h-12 text-primary mx-auto mb-4" />
                <h3 className="font-display font-bold text-xl mb-2">Generate Your Weekly Plan</h3>
                <p className="text-sm text-muted-foreground mb-6">Our AI will create a cycle-synced 7-day plan tailored to your biology.</p>
                <Button onClick={generatePlan} disabled={generating} className="gradient-primary border-0 text-primary-foreground rounded-full px-8 py-5">
                  {generating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Zap className="w-4 h-4 mr-2" />}
                  Generate Plan
                </Button>
              </motion.div>
            )}

            {/* Coach's Note */}
            {currentPlan?.plan?.athlete_summary && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card p-6 border-l-4 border-l-primary">
                <h4 className="font-display font-semibold text-sm mb-2 text-primary">Coach's Note</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">{currentPlan.plan.athlete_summary}</p>
              </motion.div>
            )}

            {/* Quick Links */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { to: '/plan', icon: ClipboardList, label: 'Plan' },
                { to: '/import', icon: Upload, label: 'Import' },
                { to: '/check-in', icon: MessageSquare, label: 'Check-in' },
              ].map((link) => (
                <Link key={link.to} to={link.to} className="glass-card p-4 text-center hover:border-primary/30 transition-colors group">
                  <link.icon className="w-5 h-5 mx-auto mb-1.5 text-muted-foreground group-hover:text-primary transition-colors" />
                  <span className="text-xs text-muted-foreground">{link.label}</span>
                </Link>
              ))}
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default Dashboard;
