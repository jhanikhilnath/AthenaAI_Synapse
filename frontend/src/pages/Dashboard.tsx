import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Zap, Loader2, LogOut, Dumbbell, ClipboardList, Upload, MessageSquare, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import useAuthStore from '@/stores/useAuthStore';
import CycleRing from '@/components/CycleRing';
import api from '@/lib/api';
import { format } from 'date-fns';
import athleteBanner from '@/assets/athlete-banner.png';
import yogaWarrior from '@/assets/yoga-warrior.png';

const QUOTES = [
  "The scoreboard only reflects the work you did when the stands were empty.",
  "Train like you are in second, compete like you are in first.",
  "Your body will withstand almost anything; it is your mind you have to convince.",
  "Don't stop when you are tired; stop when you are done.",
  "A champion is simply a contender who refused to stay down.",
  "The difference between the impossible and the possible lies entirely in your daily routine.",
  "Pain is temporary, but the results of pushing through it are permanent.",
  "Sweat is the currency you pay today for the victory you want tomorrow.",
  "You can't outrun a bad diet, and you can't out-train a weak mindset.",
  "Excuses burn zero calories and win zero medals.",
];
const SESSION_QUOTE = QUOTES[Math.floor(Math.random() * QUOTES.length)];

/* Floating animated blobs */
const Blob = ({ style }: { style: React.CSSProperties }) => (
  <motion.div
    className="absolute rounded-full blur-3xl pointer-events-none"
    animate={{ scale: [1, 1.15, 1], opacity: [0.35, 0.55, 0.35] }}
    transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
    style={style}
  />
);

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
    <div className="relative min-h-screen bg-background overflow-hidden">

      {/* ── Animated background blobs ── */}
      <Blob style={{ width: 420, height: 420, top: '-80px', left: '-100px', background: 'hsl(345 55% 60% / 0.3)' }} />
      <Blob style={{ width: 320, height: 320, bottom: '80px', right: '-60px', background: 'hsl(350 80% 74% / 0.25)', animationDelay: '2s' }} />
      <Blob style={{ width: 240, height: 240, top: '40%', left: '55%', background: 'hsl(345 55% 50% / 0.18)', animationDelay: '4s' }} />

      {/* ── Header ── */}
      <header className="sticky top-0 z-50 glass-card rounded-none border-x-0 border-t-0 px-4 md:px-8 py-4">
        <div className="flex items-center justify-between">
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
        </div>
        {/* Motivational quote */}
        <p
          className="text-sm font-medium italic text-center mt-0.5 w-full"
          style={{
            background: 'linear-gradient(135deg, hsl(345 55% 45%), hsl(350 80% 74%))',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            lineHeight: 1.5,
          }}
        >
          "{SESSION_QUOTE}"
        </p>
      </header>

      <main className="relative z-10 max-w-6xl mx-auto px-4 md:px-8 py-8 space-y-8">

        {/* ── Athlete illustration banner ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative overflow-hidden rounded-2xl shadow-xl"
          style={{ minHeight: 160 }}
        >
          <img src={athleteBanner} alt="Athlete" className="w-full h-48 object-cover object-top" />
          <div className="absolute inset-0 bg-gradient-to-r from-background/70 via-background/30 to-transparent flex items-center px-8">
            <div>
              <h3 className="text-2xl font-display font-bold gradient-text">Your Journey</h3>
              <p className="text-sm text-muted-foreground mt-1">Cycle-synced · AI-powered · Built for you</p>
            </div>
          </div>
        </motion.div>

        {/* ── Main grid: Cycle ring + Actions ── */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="grid md:grid-cols-2 gap-8">

          {/* Left: Cycle Ring */}
          <div className="glass-card p-8 flex flex-col items-center justify-center relative overflow-hidden">
            {/* Decorative yoga image bottom-right */}
            <img src={yogaWarrior} alt="" className="absolute -bottom-4 -right-4 w-28 h-28 object-contain opacity-20 pointer-events-none" />
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
                  <Link to="/workout/today">Start Workout 🏃‍♀️</Link>
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
                <h4 className="font-display font-semibold text-sm mb-2 text-primary">🧠 Coach's Note</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">{currentPlan.plan.athlete_summary}</p>
              </motion.div>
            )}

            {/* Quick Links — richer cards */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { to: '/plan', icon: ClipboardList, label: 'Plan', emoji: '📋', desc: 'Weekly' },
                { to: '/import', icon: Upload, label: 'Import', emoji: '📥', desc: 'Data' },
                { to: '/check-in', icon: MessageSquare, label: 'Check-in', emoji: '✅', desc: 'Feedback' },
              ].map((link, i) => (
                <motion.div
                  key={link.to}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 + i * 0.08 }}
                  whileHover={{ scale: 1.04, y: -2 }}
                  whileTap={{ scale: 0.97 }}
                >
                  <Link to={link.to} className="glass-card p-4 text-center hover:border-primary/40 transition-colors group flex flex-col items-center gap-1">
                    <span className="text-2xl">{link.emoji}</span>
                    <span className="text-xs font-semibold text-foreground/80 group-hover:text-primary transition-colors">{link.label}</span>
                    <span className="text-[10px] text-muted-foreground">{link.desc}</span>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default Dashboard;
