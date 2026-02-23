import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Loader2, Moon, Heart, Brain, Scale, Ruler, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import useAuthStore from '@/stores/useAuthStore';
import api from '@/lib/api';

const moods = ['Happy', 'Neutral', 'Irritable', 'Sad', 'Anxious'];
const symptoms = ['None', 'Cramps', 'Mood Swings'];

const Setup = () => {
  const { athlete, fetchProfile } = useAuthStore();
  
  const [bio, setBio] = useState({ 
    age: 25, 
    weight: 60, 
    height: 165, 
    mood: '', 
    symptoms: '', 
    sleep_hours: 7, 
    stress_level: 5 
  });
  
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Pre-fill fields that don't change often from the latest biometrics entry
    if (athlete?.biometricsHistory && athlete.biometricsHistory.length > 0) {
      const lastBio = athlete.biometricsHistory[athlete.biometricsHistory.length - 1];
      setBio({
        age: lastBio.age || 25,
        weight: lastBio.weight || 60,
        height: lastBio.height || 165,
        mood: '', // intentionally blank
        symptoms: '', // intentionally blank
        sleep_hours: lastBio.sleep_hours || 7,
        stress_level: lastBio.stress_level || 5
      });
    }
  }, [athlete]);

  const submitBiometrics = async () => {
    if (!bio.mood) {
      toast({ title: 'Mood is required', description: 'Please select your mood.', variant: 'destructive' });
      return;
    }
    if (!bio.symptoms) {
      toast({ title: 'Symptoms are required', description: 'Please select any symptoms.', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      await api.post('/api/biometrics', bio);
      await fetchProfile(); // refresh the global state with latest info
      toast({ title: 'Biometrics saved!', description: 'Your training context is updated.' });
      navigate('/dashboard');
    } catch (err: any) {
      toast({ title: 'Failed to save biometrics', description: err?.response?.data?.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10 bg-background text-foreground">
      <motion.div
        initial={{ opacity: 0, x: 30 }}
        animate={{ opacity: 1, x: 0 }}
        className="glass-card-strong w-full max-w-lg p-8 relative"
      >
        <Button variant="ghost" size="icon" className="absolute top-4 left-4" asChild>
          <Link to="/dashboard"><ArrowLeft className="w-5 h-5" /></Link>
        </Button>

        <div className="text-center mb-6 mt-4">
          <Heart className="w-10 h-10 text-primary mx-auto mb-3" />
          <h2 className="text-2xl font-display font-bold">Log Biometrics</h2>
          <p className="text-muted-foreground mt-2 text-sm">How are you feeling? This data powers your personalized training plan.</p>
        </div>

        <div className="space-y-5">
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label className="text-xs flex items-center gap-1"><User className="w-3 h-3" /> Age</Label>
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
            <Label className="text-xs">Mood <span className="text-destructive">*</span></Label>
            <Select value={bio.mood} onValueChange={(v) => setBio({ ...bio, mood: v })}>
              <SelectTrigger className="bg-secondary border-border"><SelectValue placeholder="Select mood" /></SelectTrigger>
              <SelectContent>{moods.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-xs">Symptoms <span className="text-destructive">*</span></Label>
            <Select value={bio.symptoms} onValueChange={(v) => setBio({ ...bio, symptoms: v })}>
              <SelectTrigger className="bg-secondary border-border"><SelectValue placeholder="Select symptom" /></SelectTrigger>
              <SelectContent>{symptoms.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
            </Select>
          </div>

          <div className="space-y-2 pt-2">
            <Label className="text-xs flex items-center gap-1"><Moon className="w-3 h-3" /> Sleep Hours: {bio.sleep_hours}h</Label>
            <Slider value={[bio.sleep_hours]} onValueChange={([v]) => setBio({ ...bio, sleep_hours: v })} min={0} max={12} step={0.5} className="py-2" />
          </div>

          <div className="space-y-2 pt-2">
            <Label className="text-xs flex items-center gap-1"><Brain className="w-3 h-3" /> Stress Level: {bio.stress_level}/10</Label>
            <Slider value={[bio.stress_level]} onValueChange={([v]) => setBio({ ...bio, stress_level: v })} min={1} max={10} step={1} className="py-2" />
          </div>
        </div>

        <div className="mt-8">
          <Button onClick={submitBiometrics} disabled={loading} className="w-full gradient-primary border-0 text-primary-foreground rounded-full h-12">
            {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
            Complete Setup
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

export default Setup;
