import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar as CalendarIcon, ArrowRight, ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { useToast } from '@/hooks/use-toast';
import useAuthStore from '@/stores/useAuthStore';
import api from '@/lib/api';
import { format } from 'date-fns';

const LogPeriod = () => {
  const [bleedingDates, setBleedingDates] = useState<Date[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const fetchCycleInfo = useAuthStore((s) => s.fetchCycleInfo);

  const submitCycle = async () => {
    if (bleedingDates.length === 0) { 
      toast({ title: 'Select at least one bleeding day', variant: 'destructive' }); 
      return; 
    }
    
    setLoading(true);
    try {
      await api.post('/api/periods/bleeding', { dates: bleedingDates.map((d) => format(d, 'yyyy-MM-dd')) });
      await fetchCycleInfo(); // Update global state
      toast({ title: 'Cycle history updated!', description: 'Your period dates have been successfully logged.' });
      navigate('/dashboard');
    } catch (err: any) {
      toast({ title: 'Failed to save cycle data', description: err?.response?.data?.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10 bg-background text-foreground">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-card-strong w-full max-w-lg p-8 relative"
      >
        <Button variant="ghost" size="icon" className="absolute top-4 left-4" asChild>
          <Link to="/dashboard"><ArrowLeft className="w-5 h-5" /></Link>
        </Button>

        <div className="text-center mb-6 mt-4">
          <CalendarIcon className="w-10 h-10 text-primary mx-auto mb-3" />
          <h2 className="text-2xl font-display font-bold">Log Period</h2>
          <p className="text-muted-foreground mt-2 text-sm">Select your recent bleeding days. This helps our ML model learn your cycle pattern and personalize your training.</p>
        </div>

        <div className="flex justify-center mb-6">
          <Calendar
            mode="multiple"
            selected={bleedingDates}
            onSelect={(dates) => setBleedingDates(dates || [])}
            className="rounded-xl border border-border bg-secondary p-3"
          />
        </div>
        
        <p className="text-xs text-muted-foreground text-center mb-8">{bleedingDates.length} day(s) selected</p>
        
        <Button onClick={submitCycle} disabled={loading} className="w-full gradient-primary border-0 text-primary-foreground rounded-full py-6">
          {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
          Save Dates 
        </Button>
      </motion.div>
    </div>
  );
};

export default LogPeriod;
