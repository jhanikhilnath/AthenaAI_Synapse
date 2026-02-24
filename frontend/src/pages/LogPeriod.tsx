import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ChevronLeft, ChevronRight, Loader2, Droplets } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import useAuthStore from '@/stores/useAuthStore';
import api from '@/lib/api';
import {
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths,
  isToday, isFuture,
} from 'date-fns';

const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

const GRADIENT = 'linear-gradient(135deg, hsl(345 55% 45%), hsl(350 80% 74%))';

const LogPeriod = () => {
  const [selected, setSelected] = useState<Date[]>([]);
  const [viewDate, setViewDate] = useState(new Date());
  const [direction, setDirection] = useState(1);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const fetchCycleInfo = useAuthStore((s) => s.fetchCycleInfo);

  const monthStart = startOfMonth(viewDate);
  const calStart = startOfWeek(monthStart);
  const calEnd = endOfWeek(endOfMonth(viewDate));
  const days = eachDayOfInterval({ start: calStart, end: calEnd });

  const isSelected = (d: Date) => selected.some((s) => isSameDay(s, d));

  const toggleDay = (d: Date) => {
    if (isFuture(d) && !isToday(d)) return; // no future dates
    setSelected((prev) =>
      isSelected(d) ? prev.filter((s) => !isSameDay(s, d)) : [...prev, d]
    );
  };

  const prevMonth = () => { setDirection(-1); setViewDate((v) => subMonths(v, 1)); };
  const nextMonth = () => { setDirection(1); setViewDate((v) => addMonths(v, 1)); };

  const submitCycle = async () => {
    if (selected.length === 0) {
      toast({ title: 'Select at least one bleeding day', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      await api.post('/api/periods/bleeding', { dates: selected.map((d) => format(d, 'yyyy-MM-dd')) });
      await fetchCycleInfo();
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
        className="glass-card-strong w-full max-w-md p-8 relative"
      >
        {/* Back */}
        <Button variant="ghost" size="icon" className="absolute top-4 left-4" asChild>
          <Link to="/dashboard"><ArrowLeft className="w-5 h-5" /></Link>
        </Button>

        {/* Header */}
        <div className="text-center mb-6 mt-2">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3"
            style={{ background: GRADIENT }}
          >
            <Droplets className="w-7 h-7 text-white" />
          </div>
          <h2 className="text-2xl font-display font-bold">Log Period</h2>
          <p className="text-muted-foreground mt-1.5 text-sm leading-relaxed max-w-xs mx-auto">
            Tap your bleeding days below. This trains our AI to personalise your cycle-synced plan.
          </p>
        </div>

        {/* Calendar card */}
        <div className="rounded-2xl overflow-hidden border border-border/50 bg-white/20 backdrop-blur-sm shadow-sm mb-4">

          {/* Month navigation */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border/30">
            <button
              onClick={prevMonth}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-primary/10 transition-colors"
            >
              <ChevronLeft className="w-4 h-4 text-primary" />
            </button>
            <AnimatePresence mode="popLayout" initial={false} custom={direction}>
              <motion.span
                key={format(viewDate, 'yyyy-MM')}
                custom={direction}
                initial={{ x: direction * 40, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: direction * -40, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="font-display font-bold text-base"
              >
                {format(viewDate, 'MMMM yyyy')}
              </motion.span>
            </AnimatePresence>
            <button
              onClick={nextMonth}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-primary/10 transition-colors"
            >
              <ChevronRight className="w-4 h-4 text-primary" />
            </button>
          </div>

          {/* Weekday headers */}
          <div className="grid grid-cols-7 px-2 pt-2">
            {DAYS.map((d) => (
              <div key={d} className="text-center text-[11px] font-semibold text-muted-foreground py-1">
                {d}
              </div>
            ))}
          </div>

          {/* Day cells */}
          <AnimatePresence mode="wait" initial={false} custom={direction}>
            <motion.div
              key={format(viewDate, 'yyyy-MM')}
              custom={direction}
              initial={{ x: direction * 60, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: direction * -60, opacity: 0 }}
              transition={{ duration: 0.22 }}
              className="grid grid-cols-7 gap-y-1 px-2 pb-3 pt-1"
            >
              {days.map((day) => {
                const inMonth = isSameMonth(day, viewDate);
                const sel = isSelected(day);
                const today = isToday(day);
                const disabled = isFuture(day) && !today;

                return (
                  <button
                    key={day.toISOString()}
                    onClick={() => toggleDay(day)}
                    disabled={disabled}
                    className="relative flex items-center justify-center rounded-full mx-auto transition-all duration-150"
                    style={{
                      width: 36,
                      height: 36,
                      background: sel ? GRADIENT : 'transparent',
                      opacity: disabled ? 0.25 : inMonth ? 1 : 0.35,
                      boxShadow: sel ? '0 2px 10px hsl(345 55% 45% / 0.35)' : 'none',
                      transform: sel ? 'scale(1.08)' : 'scale(1)',
                    }}
                  >
                    {/* Today ring */}
                    {today && !sel && (
                      <span
                        className="absolute inset-0 rounded-full border-2"
                        style={{ borderColor: 'hsl(345 55% 45%)' }}
                      />
                    )}
                    <span
                      className="text-xs font-medium"
                      style={{ color: sel ? '#fff' : today ? 'hsl(345 55% 45%)' : undefined }}
                    >
                      {format(day, 'd')}
                    </span>
                  </button>
                );
              })}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Selection summary */}
        <div className="flex items-center justify-between mb-5 px-1">
          <p className="text-xs text-muted-foreground">
            {selected.length === 0
              ? 'No days selected yet'
              : `${selected.length} day${selected.length > 1 ? 's' : ''} selected`}
          </p>
          {selected.length > 0 && (
            <button
              onClick={() => setSelected([])}
              className="text-xs text-primary hover:underline"
            >
              Clear all
            </button>
          )}
        </div>

        {/* Selected day pills */}
        {selected.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="flex flex-wrap gap-1.5 mb-5"
          >
            {[...selected]
              .sort((a, b) => a.getTime() - b.getTime())
              .map((d) => (
                <span
                  key={d.toISOString()}
                  className="text-[11px] font-medium text-white px-2.5 py-1 rounded-full cursor-pointer hover:opacity-80 transition-opacity"
                  style={{ background: GRADIENT }}
                  onClick={() => toggleDay(d)}
                >
                  {format(d, 'MMM d')} ×
                </span>
              ))}
          </motion.div>
        )}

        {/* Submit */}
        <Button
          onClick={submitCycle}
          disabled={loading || selected.length === 0}
          className="w-full border-0 text-primary-foreground rounded-full py-6 font-semibold text-base transition-opacity"
          style={{ background: GRADIENT }}
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
          Save Period Dates
        </Button>
      </motion.div>
    </div>
  );
};

export default LogPeriod;
