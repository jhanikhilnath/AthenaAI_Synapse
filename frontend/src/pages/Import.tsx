import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Upload as UploadIcon, Loader2, Sparkles, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import useAuthStore from '@/stores/useAuthStore';
import api from '@/lib/api';

const Import = () => {
  const [textPlan, setTextPlan] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const setCurrentPlan = useAuthStore((s) => s.setCurrentPlan);
  const { toast } = useToast();

  const handleSync = async () => {
    if (!textPlan.trim()) { toast({ title: 'Paste a workout plan first', variant: 'destructive' }); return; }
    setLoading(true);
    try {
      const { data } = await api.post('/api/workout/upload', { textPlan });
      setResult(data);
      setCurrentPlan(data);
      toast({ title: 'Plan synced!' });
    } catch (err: any) {
      toast({ title: 'Sync failed', description: err?.response?.data?.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background px-4 md:px-8 py-8">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <Button variant="ghost" size="icon" asChild><Link to="/dashboard"><ArrowLeft className="w-5 h-5" /></Link></Button>
          <h1 className="text-2xl font-display font-bold">Import a Plan</h1>
        </div>

        <AnimatePresence mode="wait">
          {!result ? (
            <motion.div key="input" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="glass-card p-6 mb-6">
                <p className="text-sm text-muted-foreground mb-4">Paste your coach's plan or a generic workout. Athena will analyze it and optimize it for your current cycle phase.</p>
                <Textarea
                  value={textPlan}
                  onChange={(e) => setTextPlan(e.target.value)}
                  placeholder="Day 1: Squats 4x5, Leg Press 3x10&#10;Day 2: Rest&#10;Day 3: Bench Press 4x6..."
                  className="bg-secondary border-border min-h-[200px] font-mono text-sm"
                />
              </div>

              <Button onClick={handleSync} disabled={loading} className="w-full gradient-primary border-0 text-primary-foreground rounded-full py-5 text-lg">
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    AI analyzing biological context...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 mr-2" />
                    Athena Sync It
                  </>
                )}
              </Button>
            </motion.div>
          ) : (
            <motion.div key="result" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="glass-card p-6">
                  <h3 className="font-display font-semibold mb-3 text-muted-foreground">Original Plan</h3>
                  <pre className="text-sm text-muted-foreground whitespace-pre-wrap font-mono bg-secondary/50 rounded-lg p-4">{textPlan}</pre>
                </div>
                <div className="glass-card p-6 border-primary/30">
                  <h3 className="font-display font-semibold mb-3 text-primary">Athena Optimized</h3>
                  {result.plan?.athlete_summary && (
                    <p className="text-xs text-muted-foreground mb-4 italic">{result.plan.athlete_summary}</p>
                  )}
                  {result.plan?.schedule?.map((day: any, i: number) => (
                    <div key={i} className="mb-3">
                      <p className="text-sm font-semibold">Day {day.day}: {day.focus}</p>
                      <ul className="ml-4 text-xs text-muted-foreground">
                        {day.exercises?.map((ex: any, j: number) => (
                          <li key={j}>• {ex.name} — {ex.sets}×{ex.reps}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <Button variant="outline" onClick={() => setResult(null)} className="rounded-full">Try Another</Button>
                <Button asChild className="gradient-primary border-0 text-primary-foreground rounded-full">
                  <Link to="/plan">View Full Plan <ArrowRight className="w-4 h-4 ml-1" /></Link>
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Import;
