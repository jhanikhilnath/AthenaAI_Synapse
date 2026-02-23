import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, User, Dumbbell, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import useAuthStore from '@/stores/useAuthStore';

const Profile = () => {
  const { athlete, fetchProfile } = useAuthStore();

  useEffect(() => { fetchProfile(); }, []);

  return (
    <div className="min-h-screen bg-background px-4 md:px-8 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <Button variant="ghost" size="icon" asChild><Link to="/dashboard"><ArrowLeft className="w-5 h-5" /></Link></Button>
          <h1 className="text-2xl font-display font-bold">Profile</h1>
        </div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-full gradient-primary flex items-center justify-center">
              <User className="w-8 h-8 text-primary-foreground" />
            </div>
            <div>
              <h2 className="font-display font-bold text-lg">{athlete?.email || 'Athlete'}</h2>
              <p className="text-sm text-muted-foreground">{athlete?.sport} · {athlete?.experienceLevel}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-secondary/50 rounded-xl p-4 text-center">
              <Dumbbell className="w-5 h-5 text-primary mx-auto mb-1" />
              <p className="text-2xl font-display font-bold">{athlete?.workouts?.length || 0}</p>
              <p className="text-xs text-muted-foreground">Workouts</p>
            </div>
            <div className="bg-secondary/50 rounded-xl p-4 text-center">
              <TrendingUp className="w-5 h-5 text-accent mx-auto mb-1" />
              <p className="text-2xl font-display font-bold">{athlete?.history?.length || 0}</p>
              <p className="text-xs text-muted-foreground">Cycle Records</p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Profile;
