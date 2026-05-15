import { Wallet, Printer, ChevronDown, TrendingUp, Info } from 'lucide-react';

export function Payslip({ profile }: { profile: any }) {
  const payslip = {
    period: 'Mei 2026',
    baseSalary: 4500000,
    allowances: [
      { name: 'Tunjangan Jabatan', amount: 1500000 },
      { name: 'Tunjangan Makan', amount: 500000 },
      { name: 'Tunjangan Transport', amount: 500000 },
    ],
    deductions: [
      { name: 'Potongan Terlambat', amount: 20000 },
      { name: 'BPJS Kesehatan', amount: 120000 },
    ],
    netSalary: 6860000,
  };

  return (
    <div className="space-y-6 pb-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">Slip Gaji</h2>
        <button className="flex items-center gap-2 rounded-xl bg-blue-50 px-4 py-2 text-xs font-bold text-blue-600 hover:bg-blue-100 transition-colors">
          <Printer className="h-4 w-4" />
          CETAK PDF
        </button>
      </div>

      {/* Salary Overview Card */}
      <div className="relative overflow-hidden rounded-[32px] bg-gray-900 p-8 text-white shadow-2xl">
        <div className="relative z-10">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Take Home Pay • {payslip.period}</p>
          <h3 className="mt-2 text-4xl font-black tracking-tight">
            Rp{payslip.netSalary.toLocaleString('id-ID')}
          </h3>
          <div className="mt-6 flex items-center gap-2 text-[10px] font-bold text-green-400 bg-green-400/10 w-fit px-3 py-1 rounded-full border border-green-400/20">
            <TrendingUp className="h-3 w-3" />
            NAIK 2.4% DARI BULAN LALU
          </div>
        </div>
        <Wallet className="absolute -right-8 -bottom-8 h-40 w-40 text-white/5 rotate-12" />
      </div>

      {/* Details Sections */}
      <div className="space-y-4">
        {/* Allowances */}
        <div className="rounded-3xl bg-white p-6 border border-gray-100 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-widest text-gray-400">Penghasilan & Tunjangan</h4>
            <ChevronDown className="h-4 w-4 text-gray-300" />
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-1">
              <span className="text-sm font-medium text-gray-600">Gaji Pokok</span>
              <span className="text-sm font-bold text-gray-900">Rp{payslip.baseSalary.toLocaleString('id-ID')}</span>
            </div>
            {payslip.allowances.map((item) => (
              <div key={item.name} className="flex justify-between items-center py-1">
                <span className="text-sm font-medium text-gray-600">{item.name}</span>
                <span className="text-sm font-bold text-green-600">+ Rp{item.amount.toLocaleString('id-ID')}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Deductions */}
        <div className="rounded-3xl bg-white p-6 border border-gray-100 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-widest text-gray-400">Potongan</h4>
            <ChevronDown className="h-4 w-4 text-gray-300" />
          </div>
          <div className="space-y-3">
            {payslip.deductions.map((item) => (
              <div key={item.name} className="flex justify-between items-center py-1 text-red-600">
                <span className="text-sm font-medium">{item.name}</span>
                <span className="text-sm font-bold">- Rp{item.amount.toLocaleString('id-ID')}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex gap-4 rounded-3xl bg-blue-50 p-6 border border-blue-100">
        <Info className="h-6 w-6 text-blue-600 shrink-0" />
        <p className="text-[10px] text-blue-800 leading-relaxed font-bold uppercase tracking-wide">
          Periode penggajian dihitung dari tanggal 16 hingga tanggal 15 bulan berikutnya.
        </p>
      </div>
    </div>
  );
}
