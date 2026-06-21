import { useMutation } from '@tanstack/react-query';
import { FileDown, Upload } from 'lucide-react';
import { useState } from 'react';
import { usePreference } from '../contexts/PreferenceContext.jsx';
import { api, downloadExport } from '../lib/api.js';

export default function ImportExport() {
  const { t } = usePreference();
  const [resource, setResource] = useState('customers');
  const [file, setFile] = useState(null);
  const upload = useMutation({
    mutationFn: async () => {
      const body = new FormData();
      body.append('file', file);
      return (await api.post(`/import-export/${resource}`, body)).data;
    }
  });
  const sync = useMutation({ mutationFn: async () => (await api.post('/sync/google-sheets')).data });

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <section className="panel p-4">
        <h1 className="mb-4 text-xl font-bold">{t('import')}</h1>
        <div className="grid gap-3">
          <select className="input" value={resource} onChange={(e) => setResource(e.target.value)}>
            <option value="customers">{t('customers')}</option>
            <option value="transactions">{t('transactions')}</option>
          </select>
          <input className="input" type="file" accept=".xlsx,.csv" onChange={(e) => setFile(e.target.files?.[0])} />
          <button className="btn btn-primary" disabled={!file || upload.isPending} onClick={() => upload.mutate()}>
            <Upload size={18} />
            {t('import')}
          </button>
          {upload.data && <p className="text-sm text-brand-700">Imported {upload.data.imported} rows</p>}
        </div>
      </section>
      <section className="panel p-4">
        <h1 className="mb-4 text-xl font-bold">{t('export')}</h1>
        <div className="grid gap-3 sm:grid-cols-3">
          {['xlsx', 'csv', 'pdf'].map((format) => (
            <button key={format} className="btn btn-muted" onClick={() => downloadExport(resource, format)}>
              <FileDown size={18} />
              {format.toUpperCase()}
            </button>
          ))}
        </div>
        <button className="btn btn-primary mt-4 w-full" onClick={() => sync.mutate()}>{t('syncSheets')}</button>
        {sync.data && <pre className="mt-3 overflow-auto rounded-md bg-slate-100 p-3 text-xs dark:bg-slate-800">{JSON.stringify(sync.data, null, 2)}</pre>}
      </section>
    </div>
  );
}
