import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Loader2, Moon, Brain, Scale, Ruler, User, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import useAuthStore from '@/stores/useAuthStore';
import api from '@/lib/api';

const GRADIENT = 'linear-gradient(135deg, hsl(345 55% 45%), hsl(350 80% 74%))';

const MOODS = ['Happy', 'Neutral', 'Irritable', 'Sad', 'Anxious'].map(v => ({ value: v }));
const SYMPTOMS = ['None', 'Cramps', 'Mood Swings'].map(v => ({ value: v }));
const FREQUENCIES = [
  { value: 'Low', label: 'Low', sub: '1–2×/wk' },
  { value: 'Moderate', label: 'Moderate', sub: '3–4×/wk' },
  { value: 'High', label: 'High', sub: '5+×/wk' },
];
const DIETS = ['Balanced', 'Vegetarian', 'High Sugar', 'Low Carb'].map(v => ({ value: v }));

// Pill selector component
const PillGroup = ({
  options, value, onChange,
}: {
  options: { value: string; emoji?: string; label?: string; sub?: string }[];
  value: string;
  onChange: (v: string) => void;
}) => (
  <div className="flex flex-wrap gap-2">
    {options.map((o) => {
      const sel = value === o.value;
      return (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-150"
          style={{
            background: sel ? GRADIENT : 'transparent',
            color: sel ? '#fff' : undefined,
            borderColor: sel ? 'transparent' : 'hsl(var(--border))',
            boxShadow: sel ? '0 2px 10px hsl(345 55% 45% / 0.3)' : 'none',
            transform: sel ? 'scale(1.06)' : 'scale(1)',
          }}
        >
          <span>{o.label ?? o.value}</span>
          {o.sub && <span className="opacity-70 ml-0.5">{o.sub}</span>}
        </button>
      );
    })}
  </div>
);

// Gradient range slider
const GradientSlider = ({
  value, min, max, step, onChange,
  leftColor = '#22c55e', rightColor = '#ef4444',
}: {
  value: number; min: number; max: number; step: number;
  onChange: (v: number) => void;
  leftColor?: string; rightColor?: string;
}) => {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div className="relative py-2">
      <div className="h-2.5 rounded-full overflow-hidden relative"
        style={{ background: `linear-gradient(to right, ${leftColor}, ${rightColor})` }}>
        <div className="absolute inset-y-0 right-0 bg-white/40 rounded-full transition-all duration-150"
          style={{ width: `${100 - pct}%` }} />
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="absolute inset-0 w-full opacity-0 cursor-pointer h-full"
        style={{ zIndex: 2 }}
      />
      {/* Thumb */}
      <div
        className="absolute top-1/2 -translate-y-1/2 w-5 h-5 rounded-full border-2 border-white shadow-md pointer-events-none"
        style={{
          left: `calc(${pct}% - ${pct * 0.1}px)`, zIndex: 3,
          background: `linear-gradient(135deg, ${leftColor}, ${rightColor})`
        }}
      />
    </div>
  );
};

const Section = ({ icon: Icon, title, children }: {
  icon: React.ElementType; title: string; children: React.ReactNode;
}) => (
  <div className="rounded-2xl border border-border/50 bg-white/20 backdrop-blur-sm p-4 space-y-3">
    <div className="flex items-center gap-2 mb-1">
      <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: GRADIENT }}>
        <Icon className="w-3.5 h-3.5 text-white" />
      </div>
      <span className="text-sm font-semibold">{title}</span>
    </div>
    {children}
  </div>
);

const Setup = () => {
  const { athlete, fetchProfile } = useAuthStore();
  const [bio, setBio] = useState({
    age: 25, weight: 60, height: 165,
    mood: '', symptoms: '', exercise_frequency: '', diet: '',
    sleep_hours: 7, stress_level: 5,
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (athlete?.biometricsHistory?.length) {
      const last = athlete.biometricsHistory[athlete.biometricsHistory.length - 1];
      setBio({
        age: last.age || 25, weight: last.weight || 60, height: last.height || 165,
        mood: '', symptoms: '',
        exercise_frequency: last.exercise_frequency || '',
        diet: last.diet || '',
        sleep_hours: last.sleep_hours || 7,
        stress_level: last.stress_level || 5,
      });
    }
  }, [athlete]);

  const submitBiometrics = async () => {
    if (!bio.mood || !bio.symptoms || !bio.exercise_frequency || !bio.diet || !bio.age || !bio.weight || !bio.height) {
      toast({ title: 'Missing Information', description: 'Please complete all fields.', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      await api.post('/api/biometrics', bio);
      await fetchProfile();
      toast({ title: 'Biometrics saved!', description: 'Your training context is updated.' });
      navigate('/dashboard');
    } catch (err: any) {
      toast({ title: 'Failed to save biometrics', description: err?.response?.data?.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const set = (k: string) => (v: any) => setBio((b) => ({ ...b, [k]: v }));

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

        {/* Header */}
        <div className="text-center mb-7 mt-2">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3" style={{ background: GRADIENT }}>
            <Heart className="w-7 h-7 text-white" />
          </div>
          <h2 className="text-2xl font-display font-bold">Log Biometrics</h2>
          <p className="text-muted-foreground mt-1.5 text-sm max-w-xs mx-auto leading-relaxed">
            How are you feeling today? This powers your personalised training plan.
          </p>
        </div>

        <div className="space-y-4">

          {/* Body stats */}
          <Section icon={User} title="Body Stats">
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Age', icon: User, key: 'age', unit: 'yr' },
                { label: 'Weight', icon: Scale, key: 'weight', unit: 'kg' },
                { label: 'Height', icon: Ruler, key: 'height', unit: 'cm' },
              ].map(({ label, key, unit }) => (
                <div key={key} className="space-y-1">
                  <Label className="text-xs text-muted-foreground">{label} ({unit})</Label>
                  <Input
                    type="number"
                    value={(bio as any)[key]}
                    onChange={(e) => set(key)(+e.target.value)}
                    className="bg-secondary/60 border-border text-center font-semibold"
                  />
                </div>
              ))}
            </div>
          </Section>

          {/* Mood */}
          <Section icon={Brain} title="Today's Mood *">
            <PillGroup options={MOODS} value={bio.mood} onChange={set('mood')} />
          </Section>

          {/* Symptoms */}
          <Section icon={Heart} title="Symptoms *">
            <PillGroup options={SYMPTOMS} value={bio.symptoms} onChange={set('symptoms')} />
          </Section>

          {/* Exercise frequency */}
          <Section icon={User} title="Exercise Frequency *">
            <PillGroup options={FREQUENCIES} value={bio.exercise_frequency} onChange={set('exercise_frequency')} />
          </Section>

          {/* Diet */}
          <Section icon={Heart} title="Diet *">
            <PillGroup options={DIETS} value={bio.diet} onChange={set('diet')} />
          </Section>

          {/* Sleep */}
          <Section icon={Moon} title={`Sleep · ${bio.sleep_hours}h / night`}>
            <GradientSlider
              value={bio.sleep_hours} min={0} max={12} step={0.5}
              onChange={set('sleep_hours')}
              leftColor="#ef4444" rightColor="#22c55e"
            />
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>0 h</span><span>6 h</span><span>12 h</span>
            </div>
          </Section>

          {/* Stress */}
          <Section icon={Brain} title={`Stress · ${bio.stress_level} / 10`}>
            <GradientSlider
              value={bio.stress_level} min={1} max={10} step={1}
              onChange={set('stress_level')}
              leftColor="#22c55e" rightColor="#ef4444"
            />
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>Relaxed</span><span>Moderate</span><span>High</span>
            </div>
          </Section>

        </div>

        <div className="mt-6">
          <Button
            onClick={submitBiometrics}
            disabled={loading}
            className="w-full border-0 text-primary-foreground rounded-full h-12 font-semibold text-base"
            style={{ background: GRADIENT }}
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
            Save Biometrics
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

export default Setup;
