import { X } from 'lucide-react';

export default function Modal({ title, open, onClose, children }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-end bg-slate-950/45 p-0 sm:place-items-center sm:p-4">
      <div className="max-h-[92vh] w-full overflow-y-auto rounded-t-lg bg-white p-4 shadow-xl dark:bg-slate-900 sm:max-w-lg sm:rounded-lg">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold">{title}</h2>
          <button className="btn btn-muted h-10 min-h-10 w-10 p-0" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
