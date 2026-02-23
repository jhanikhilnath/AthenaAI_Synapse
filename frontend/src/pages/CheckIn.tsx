import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Loader2, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import useAuthStore from '@/stores/useAuthStore';
import api from '@/lib/api';

const RATINGS = [
  { value: 1, label: 'Too Easy', emoji: '😴' },
  { value: 2, label: 'Very Light', emoji: '🥱' },
  { value: 3, label: 'Light', emoji: '😌' },
  { value: 4, label: 'Moderate', emoji: '🙂' },
  { value: 5, label: 'Just Right', emoji: '😊' },
  { value: 6, label: 'Solid', emoji: '💪' },
  { value: 7, label: 'Hard', emoji: '😤' },
  { value: 8, label: 'Challenging', emoji: '😰' },
  { value: 9, label: 'Very Hard', emoji: '🥵' },
  { value: 10, label: 'Exhausted', emoji: '💀' },
];

// Interpolate green(120°) → yellow(60°) → red(0°) across 1–10
function getRatingColor(value: number) {
  const t = (value - 1) / 9; // 0 → 1
  const hue = Math.round(120 - t * 120);
  return `hsl(${hue} 80% 45%)`;
}

const CheckIn = () => {
  const [rating, setRating] = useState(5);
  const [comments, setComments] = useState('');
  const [loading, setLoading] = useState(false);
  const setCurrentPlan = useAuthStore((s) => s.setCurrentPlan);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const { data } = await api.post('/api/workout/tweak', { workoutRating: rating, comments });
      setCurrentPlan(data);
      toast({ title: 'Plan adjusted!', description: 'Your next week is optimized based on your feedback.' });
      navigate('/dashboard');
    } catch (err: any) {
      toast({ title: 'Failed', description: err?.response?.data?.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const current = RATINGS[rating - 1];
  const thumbColor = getRatingColor(rating);
  // % position of thumb for the fill
  const pct = ((rating - 1) / 9) * 100;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-10">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-card-strong w-full max-w-md p-8">
        <div className="flex items-center gap-3 mb-8">
          <Button variant="ghost" size="icon" asChild><Link to="/dashboard"><ArrowLeft className="w-5 h-5" /></Link></Button>
          <h1 className="text-2xl font-display font-bold">Weekly Check-in</h1>
        </div>

        <div className="space-y-8">
          <div>
            <p className="text-sm text-muted-foreground mb-5">How did this week's plan feel?</p>

            {/* Big emoji + label */}
            <div className="text-center mb-5">
              <motion.span
                key={rating}
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 18 }}
                className="text-5xl block mb-1"
              >
                {current.emoji}
              </motion.span>
              <span className="text-3xl font-display font-bold" style={{ color: thumbColor }}>
                {rating}
              </span>
              <p className="text-sm font-medium mt-0.5" style={{ color: thumbColor }}>
                {current.label}
              </p>
            </div>

            {/* Gradient slider */}
            <div className="relative py-3">
              {/* Gradient track */}
              <div className="relative h-3 rounded-full overflow-hidden"
                style={{ background: 'linear-gradient(to right, hsl(120 80% 45%), hsl(60 80% 50%), hsl(0 80% 45%))' }}>
                {/* Filled portion highlight */}
                <div
                  className="absolute inset-y-0 left-0 rounded-full transition-all duration-150"
                  style={{ width: `${pct}%`, background: 'rgba(255,255,255,0.25)' }}
                />
              </div>

              {/* Native range input laid over the track */}
              <input
                type="range"
                min={1} max={10} step={1}
                value={rating}
                onChange={(e) => setRating(Number(e.target.value))}
                className="absolute inset-0 w-full opacity-0 cursor-pointer h-full"
                style={{ zIndex: 2 }}
              />

              {/* Custom thumb */}
              <div
                className="absolute top-1/2 -translate-y-1/2 w-5 h-5 rounded-full border-2 border-white shadow-md transition-all duration-150 pointer-events-none"
                style={{
                  left: `calc(${pct}% - ${pct * 0.1}px)`,
                  background: thumbColor,
                  zIndex: 3,
                }}
              />
            </div>

            {/* End labels */}
            <div className="flex justify-between text-xs text-muted-foreground mt-2">
              <span>😴 Too Easy</span>
              <span>Exhausted 💀</span>
            </div>
          </div>

          <div>
            <p className="text-sm text-muted-foreground mb-2">Coach's Notes</p>
            <Textarea
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder="Any notes for Athena? (e.g., 'Knees hurt on squats')"
              className="bg-secondary border-border min-h-[100px]"
            />
          </div>

          <Button onClick={handleSubmit} disabled={loading} className="w-full gradient-primary border-0 text-primary-foreground rounded-full py-5">
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
            Submit &amp; Adjust Plan
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

export default CheckIn;
