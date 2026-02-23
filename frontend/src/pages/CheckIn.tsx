import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Loader2, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import useAuthStore from '@/stores/useAuthStore';
import api from '@/lib/api';

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

  const ratingLabel = rating <= 3 ? 'Too Easy' : rating <= 6 ? 'Just Right' : rating <= 8 ? 'Challenging' : 'Exhausted';

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-10">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-card-strong w-full max-w-md p-8">
        <div className="flex items-center gap-3 mb-8">
          <Button variant="ghost" size="icon" asChild><Link to="/dashboard"><ArrowLeft className="w-5 h-5" /></Link></Button>
          <h1 className="text-2xl font-display font-bold">Weekly Check-in</h1>
        </div>

        <div className="space-y-8">
          <div>
            <p className="text-sm text-muted-foreground mb-4">How did this week's plan feel?</p>
            <div className="text-center mb-4">
              <span className="text-5xl font-display font-bold gradient-text">{rating}</span>
              <p className="text-sm text-muted-foreground mt-1">{ratingLabel}</p>
            </div>
            <Slider value={[rating]} onValueChange={([v]) => setRating(v)} min={1} max={10} step={1} className="py-2" />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>Too Easy</span>
              <span>Exhausted</span>
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
            Submit & Adjust Plan
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

export default CheckIn;
