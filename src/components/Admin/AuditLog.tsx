import { Shield, User, Terminal } from 'lucide-react';
import { motion } from 'framer-motion';

export function AuditLogView() {
  const logs = [
    { time: '14:22:05', user: 'Super Master', action: 'Update Role: Budi Santoso -> Admin', target: 'Users', ip: '182.xx.xx.42' },
    { time: '13:45:12', user: 'Master Admin', action: 'Approve Payroll Periode Mei', target: 'Payroll', ip: '36.xx.xx.121' },
    { time: '11:10:30', user: 'Admin HRD', action: 'Input SK: SK/2026/045', target: 'HRIS', ip: '114.xx.xx.8' },
    { time: '09:05:00', user: 'System', action: 'Automatic Deduction: Alpa (12 Users)', target: 'Payroll', ip: '::1' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900">Audit Log System</h2>
          <p className="mt-1 text-sm font-medium text-slate-500">Keamanan & Rekam Jejak Admin</p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-900 text-blue-400 shadow-lg">
           <Terminal className="h-5 w-5" />
        </div>
      </div>

      <div className="theme-card bg-white overflow-hidden p-0 border-slate-100">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 text-[10px] font-bold uppercase text-slate-400 tracking-widest">Waktu</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase text-slate-400 tracking-widest">Pelaku</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase text-slate-400 tracking-widest">Tindakan</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase text-slate-400 tracking-widest text-center">Target</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {logs.map((log, i) => (
                <tr key={i} className="hover:bg-slate-50 transition-colors font-mono">
                  <td className="px-6 py-4 text-[11px] text-slate-400">{log.time}</td>
                  <td className="px-6 py-4">
                     <span className="flex items-center gap-2">
                        <User className="h-3 w-3 text-blue-500" />
                        <span className="text-[11px] font-bold text-slate-900 leading-none">{log.user}</span>
                     </span>
                  </td>
                  <td className="px-6 py-4 text-[11px] font-medium text-slate-600 leading-tight">{log.action}</td>
                  <td className="px-6 py-4 text-center">
                     <span className="inline-flex rounded-md bg-slate-100 px-2.5 py-1 text-[9px] font-bold uppercase tracking-widest text-slate-500">
                        {log.target}
                     </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="theme-card bg-slate-900 p-8 text-white flex items-center gap-6 border-none">
         <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-white/5 border border-white/10 shadow-inner group">
            <Shield className="h-6 w-6 text-blue-400 group-hover:scale-110 transition-transform" />
         </div>
         <div className="flex-1">
            <h4 className="text-lg font-bold tracking-tight">Kedaulatan Data Audit</h4>
            <p className="text-xs text-slate-400 leading-relaxed font-medium mt-2 uppercase tracking-wide">
              Rekam jejak tidak dapat diubah oleh sistem atau admin biasa. Permanen & Terenkripsi.
            </p>
         </div>
      </div>
    </div>
  );
}
