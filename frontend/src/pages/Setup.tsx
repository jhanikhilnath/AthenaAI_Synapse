import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar as CalendarIcon, ArrowRight, ArrowLeft, Loader2, Moon, Heart, Brain, Scale, Ruler } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import api from '@/lib/api';
import { format } from 'date-fns';

const moods = ['Happy', 'Neutral', 'Tired', 'Stressed', 'Energetic', 'Anxious', 'Calm'];
const symptoms = ['None', 'Cramps', 'Headache', 'Bloating', 'Fatigue', 'Back Pain', 'Breast Tenderness'];

const Setup = () => {
  const [step, setStep] = useState(1);
  const [bleedingDates, setBleedingDates] = useState<Date[]>([]);
  const [bio, setBio] = useState({ age: 25, weight: 60, height: 165, mood: 'Neutral', symptoms: 'None', sleep_hours: 7, stress_level: 5 });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const submitCycle = async () => {
    if (bleedingDates.length === 0) { toast({ title: 'Select at least one bleeding day', variant: 'destructive' }); return; }
    setLoading(true);
    try {
      await api.post('/api/periods/bleeding', { dates: bleedingDates.map((d) => format(d, 'yyyy-MM-dd')) });
      setStep(2);
    } catch (err: any) {
      toast({ title: 'Failed to save cycle data', description: err?.response?.data?.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const submitBiometrics = async () => {
    setLoading(true);
    try {
      await api.post('/api/biometrics', bio);
      toast({ title: 'Setup complete!', description: 'Welcome to AthenaAI' });
      navigate('/dashboard');
    } catch (err: any) {
      toast({ title: 'Failed to save biometrics', description: err?.response?.data?.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10 bg-background">
      <motion.div
        key={step}
        initial={{ opacity: 0, x: 30 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -30 }}
        className="glass-card-strong w-full max-w-lg p-8"
      >
        {/* Progress */}
        <div className="flex gap-2 mb-8">
          {[1, 2].map((s) => (
            <div key={s} className={`h-1.5 flex-1 rounded-full transition-colors ${s <= step ? 'gradient-primary' : 'bg-secondary'}`} />
          ))}
        </div>

        {step === 1 && (
          <>
            <div className="text-center mb-6">
              <CalendarIcon className="w-10 h-10 text-primary mx-auto mb-3" />
              <h2 className="text-2xl font-display font-bold">Your Cycle History</h2>
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
            <p className="text-xs text-muted-foreground text-center mb-4">{bleedingDates.length} day(s) selected</p>
            <Button onClick={submitCycle} disabled={loading} className="w-full gradient-primary border-0 text-primary-foreground rounded-full py-5">
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Continue <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </>
        )}

        {step === 2 && (
          <>
            <div className="text-center mb-6">
              <Heart className="w-10 h-10 text-primary mx-auto mb-3" />
              <h2 className="text-2xl font-display font-bold">Today's Biometrics</h2>
              <p className="text-muted-foreground mt-2 text-sm">How are you feeling? This data powers your personalized training plan.</p>
            </div>

            <div className="space-y-5">
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Age</Label>
                  <Input type="number" value={bio.age} onChange={(e) => setBio({ ...bio, age: +e.target.value })} className="bg-secondary border-border" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs flex items-center gap-1"><Scale className="w-3 h-3" /> Weight (kg)</Label>
                  <Input type="number" value={bio.weight} onChange={(e) => setBio({ ...bio, weight: +e.target.value })} className="bg-secondary border-border" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs flex items-center gap-1"><Ruler className="w-3 h-3" /> Height (cm)</Label>
                  <Input type="number" value={bio.height} onChange={(e) => setBio({ ...bio, height: +e.target.value })} className="bg-secondary border-border" />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs">Mood</Label>
                <Select value={bio.mood} onValueChange={(v) => setBio({ ...bio, mood: v })}>
                  <SelectTrigger className="bg-secondary border-border"><SelectValue /></SelectTrigger>
                  <SelectContent>{moods.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs">Symptoms</Label>
                <Select value={bio.symptoms} onValueChange={(v) => setBio({ ...bio, symptoms: v })}>
                  <SelectTrigger className="bg-secondary border-border"><SelectValue /></SelectTrigger>
                  <SelectContent>{symptoms.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs flex items-center gap-1"><Moon className="w-3 h-3" /> Sleep Hours: {bio.sleep_hours}h</Label>
                <Slider value={[bio.sleep_hours]} onValueChange={([v]) => setBio({ ...bio, sleep_hours: v })} min={0} max={12} step={0.5} className="py-2" />
              </div>

              <div className="space-y-2">
                <Label className="text-xs flex items-center gap-1"><Brain className="w-3 h-3" /> Stress Level: {bio.stress_level}/10</Label>
                <Slider value={[bio.stress_level]} onValueChange={([v]) => setBio({ ...bio, stress_level: v })} min={1} max={10} step={1} className="py-2" />
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <Button variant="outline" onClick={() => setStep(1)} className="flex-1 rounded-full">
                <ArrowLeft className="w-4 h-4 mr-2" /> Back
              </Button>
              <Button onClick={submitBiometrics} disabled={loading} className="flex-1 gradient-primary border-0 text-primary-foreground rounded-full">
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Complete Setup
              </Button>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
};

export default Setup;
