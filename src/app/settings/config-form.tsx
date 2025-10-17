'use client';

import { useState } from 'react';
import { supabaseClient } from '@/lib/supabase/client';

// Define a basic interface for the config data
interface ConfigType {
    user_id: string;
    run_policy: 'always' | 'sampled';
    sample_rate_pct: number;
    obfuscate_pii: boolean;
    max_eval_per_day: number;
}

export default function ConfigForm({ initialConfig }: { initialConfig: ConfigType | null }) {
  const [config, setConfig] = useState<Partial<ConfigType>>(
    initialConfig || {
      run_policy: 'always',
      sample_rate_pct: 100,
      obfuscate_pii: false,
      max_eval_per_day: 1000,
    }
  );
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setConfig(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : (type === 'number' ? Number(value) : value),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    //  Get current user's ID
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
      setMessage('Error: Not authenticated.');
      setLoading(false);
      return;
    }

    //  Prepare data for Upsert (Insert or Update)
    const upsertData = {
      ...config,
      user_id: user.id,
    };

    const { error } = await supabaseClient
      .from('evaluation_configs')
      .upsert(upsertData, { onConflict: 'user_id' }) 
      .select();

    if (error) {
      setMessage(`Error saving configuration: ${error.message}`);
      console.error(error);
    } else {
      setMessage('Configuration saved successfully!');
    }

    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg shadow">
      {/* RUN POLICY */}
      <div>
        <label className="block text-sm font-medium text-gray-700">Run Policy</label>
        <select
          name="run_policy"
          value={config.run_policy}
          onChange={handleChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2"
        >
          <option value="always">Always Evaluate</option>
          <option value="sampled">Sampled Evaluation</option>
        </select>
      </div>

      {/* SAMPLE RATE */}
      {config.run_policy === 'sampled' && (
        <div>
          <label className="block text-sm font-medium text-gray-700">Sample Rate (%)</label>
          <input
            type="range"
            name="sample_rate_pct"
            min="0"
            max="100"
            value={config.sample_rate_pct}
            onChange={handleChange}
            className="mt-2 w-full"
          />
          <p className="text-lg font-semibold mt-1">{config.sample_rate_pct}%</p>
        </div>
      )}

      {/* OBFUSCATE PII */}
      <div className="flex items-center justify-between border-t pt-4">
        <label htmlFor="obfuscate_pii" className="text-sm font-medium text-gray-700">
          Obfuscate PII in Storage
        </label>
        <input
          type="checkbox"
          id="obfuscate_pii"
          name="obfuscate_pii"
          checked={config.obfuscate_pii}
          onChange={handleChange}
          className="h-5 w-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
        />
      </div>

      {/* MAX EVALS PER DAY */}
      <div>
        <label className="block text-sm font-medium text-gray-700">Max Evaluations Per Day</label>
        <input
          type="number"
          name="max_eval_per_day"
          min="1"
          value={config.max_eval_per_day}
          onChange={handleChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
      >
        {loading ? 'Saving...' : 'Save Configuration'}
      </button>

      {message && (
        <p className={`text-center text-sm ${message.startsWith('Error') ? 'text-red-600' : 'text-green-600'}`}>
          {message}
        </p>
      )}
    </form>
  );
}