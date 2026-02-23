import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import useAuthStore from '@/stores/useAuthStore';
import heroBg from '@/assets/hero-bg.jpg';

const sports = ['Soccer', 'Basketball', 'Tennis', 'Swimming', 'Running', 'CrossFit', 'Volleyball', 'Weightlifting', 'Cycling', 'Yoga', 'Boxing', 'Other'];

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [sport, setSport] = useState('');
  const [experienceLevel, setExperienceLevel] = useState('Beginner');
  const [loading, setLoading] = useState(false);
  const register = useAuthStore((s) => s.register);
  const fetchProfile = useAuthStore((s) => s.fetchProfile);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sport) { toast({ title: 'Select your sport', variant: 'destructive' }); return; }
    setLoading(true);
    try {
      await register({ name, email, password, sport, experienceLevel });
      await fetchProfile();
      navigate('/setup');
    } catch (err: any) {
      toast({ title: 'Registration failed', description: err?.response?.data?.message || 'Please try again', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center px-4 py-10 bg-background overflow-hidden">
      {/* Background image — same as landing page */}
      <div className="absolute inset-0">
        <img src={heroBg} alt="" className="w-full h-full object-cover opacity-70" />
        <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/80 to-background" />
      </div>

      {/* Form card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="relative z-10 glass-card-strong w-full max-w-md p-8"
      >
        <div className="text-center mb-8">
          <h1 className="text-3xl font-display font-bold gradient-text">AthenaAI</h1>
          <p className="text-muted-foreground mt-2">Create your athlete profile</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input id="name" type="text" placeholder="Jane Doe" value={name} onChange={(e) => setName(e.target.value)} className="bg-secondary border-border" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
              <Input id="email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-10 bg-secondary border-border" required />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
              <Input id="password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className="pl-10 bg-secondary border-border" required />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Sport</Label>
            <Select value={sport} onValueChange={setSport}>
              <SelectTrigger className="bg-secondary border-border">
                <SelectValue placeholder="Select your sport" />
              </SelectTrigger>
              <SelectContent>
                {sports.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <Label>Experience Level</Label>
            <RadioGroup value={experienceLevel} onValueChange={setExperienceLevel} className="flex gap-4">
              {['Beginner', 'Intermediate', 'Advanced'].map((lvl) => (
                <div key={lvl} className="flex items-center gap-2">
                  <RadioGroupItem value={lvl} id={lvl} />
                  <Label htmlFor={lvl} className="cursor-pointer text-sm">{lvl}</Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <Button type="submit" disabled={loading} className="w-full gradient-primary border-0 text-primary-foreground rounded-full py-5">
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Create Account
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-primary hover:underline">Sign in</Link>
        </p>
      </motion.div>
    </div>
  );
};

export default Register;
