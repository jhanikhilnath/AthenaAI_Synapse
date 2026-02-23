import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Zap, Brain, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import heroBg from '@/assets/hero-bg.jpg';

const features = [
  {
    icon: Activity,
    title: 'Cycle-Synced Training',
    description:
      'Workouts that adapt to your menstrual phase for peak performance and recovery.',
  },
  {
    icon: Brain,
    title: 'AI Coaching',
    description:
      'An elite AI sports scientist adjusts volume, intensity, and exercises just for you.',
  },
  {
    icon: Zap,
    title: 'Daily Adaptation',
    description:
      'Log biometrics daily and watch your plan evolve with your body in real-time.',
  },
];

const Landing = () => {
  return (
    <div className='min-h-screen bg-background'>
      {/* Hero */}
      <section className='relative min-h-screen flex items-center justify-center overflow-hidden'>
        <div className='absolute inset-0'>
          <img
            src={heroBg}
            alt='Athlete in motion'
            className='w-full h-full object-cover opacity-40'
          />
          <div className='absolute inset-0 bg-gradient-to-b from-background/60 via-background/80 to-background' />
        </div>

        <div className='relative z-10 text-center px-6 max-w-4xl mx-auto'>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          >
            <h1 className='text-5xl md:text-7xl font-display font-bold tracking-tight mb-6'>
              Training Synced with{' '}
              <span className='gradient-text'>Your Biology</span>
            </h1>
            <p className='text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10'>
              AI-powered workout plans that adapt to your menstrual cycle,
              sport, and daily biometrics. Train smarter, not harder.
            </p>
            <div className='flex flex-col sm:flex-row gap-4 justify-center'>
              <Button
                asChild
                size='lg'
                className='text-lg px-8 py-6 rounded-full gradient-primary border-0 text-primary-foreground shadow-lg hover:shadow-primary/30 transition-shadow'
              >
                <Link to='/register'>Start Your Journey</Link>
              </Button>
              <Button
                asChild
                variant='outline'
                size='lg'
                className='text-lg px-8 py-6 rounded-full border-border/50 hover:bg-secondary'
              >
                <Link to='/login'>Sign In</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className='py-24 px-6'>
        <div className='max-w-6xl mx-auto'>
          <motion.h2
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className='text-3xl md:text-4xl font-display font-bold text-center mb-16'
          >
            Why <span className='gradient-text'>AthenaAI</span>?
          </motion.h2>

          <div className='grid md:grid-cols-3 gap-8'>
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className='glass-card p-8 text-center group hover:border-primary/30 transition-colors'
              >
                <div className='w-14 h-14 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-6 group-hover:animate-pulse-glow transition-shadow'>
                  <f.icon className='w-7 h-7 text-primary-foreground' />
                </div>
                <h3 className='text-xl font-display font-semibold mb-3'>
                  {f.title}
                </h3>
                <p className='text-muted-foreground leading-relaxed'>
                  {f.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className='py-8 px-6 border-t border-border/30 text-center text-muted-foreground text-sm'>
        © 2026 AthenaAI · Training synced with your biology
      </footer>
    </div>
  );
};

export default Landing;
