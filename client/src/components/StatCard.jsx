import { motion } from 'framer-motion';

export default function StatCard({ icon: Icon, label, value, tone = 'brand' }) {
  const tones = {
    brand: 'bg-brand-50 text-brand-700 dark:bg-emerald-950 dark:text-emerald-200',
    amber: 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-200',
    rose: 'bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-200',
    sky: 'bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-200'
  };

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="panel p-4">
      <div className="flex items-center gap-3">
        <div className={`grid h-11 w-11 place-items-center rounded-md ${tones[tone]}`}>
          <Icon size={21} />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase text-slate-500">{label}</p>
          <p className="truncate text-xl font-bold">{value}</p>
        </div>
      </div>
    </motion.div>
  );
}
