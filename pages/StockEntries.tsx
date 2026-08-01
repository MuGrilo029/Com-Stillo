import React, { useMemo, useState } from 'react';
import { ArrowLeft, Download, Search, Package, CalendarDays } from 'lucide-react';
import { useAppStore } from '../store';
import { Card, Button, Input, Table } from '../components/UI';
import { formatDisplayDate } from '../lib/utils';

export const StockEntries: React.FC = () => {
  const { stockMovements, navigateTo } = useAppStore();
  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const entries = useMemo(() => {
    const term = search.toLowerCase().trim();
    return (stockMovements || [])
      .filter(m => m.type === 'PURCHASE')
      .filter(m => {
        const date = new Date(m.date).toISOString().slice(0, 10);
        const matchesTerm = !term || `${m.productName} ${m.variantName || ''} ${m.observations || ''}`.toLowerCase().includes(term);
        return matchesTerm && (!startDate || date >= startDate) && (!endDate || date <= endDate);
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [stockMovements, search, startDate, endDate]);

  const totalQuantity = entries.reduce((sum, entry) => sum + Number(entry.quantity || 0), 0);
  const totalCost = entries.reduce((sum, entry) => sum + (Number(entry.quantity || 0) * Number(entry.unitCost || 0)), 0);

  const exportCsv = () => {
    const header = 'Data;Produto;Variação;Quantidade;Custo unitário;Observações\n';
    const rows = entries.map(entry => [
      new Date(entry.date).toLocaleDateString('pt-BR'),
      entry.productName,
      entry.variantName || 'Produto principal',
      entry.quantity,
      Number(entry.unitCost || 0).toFixed(2),
      entry.observations || ''
    ].map(value => `"${String(value).replaceAll('"', '""')}"`).join(';')).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'historico-entradas-estoque.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col sm:flex-row justify-between gap-4 items-start sm:items-center">
        <div>
          <button onClick={() => navigateTo('INVENTORY')} className="flex items-center gap-2 text-wine-600 dark:text-wine-300 hover:underline text-sm mb-2">
            <ArrowLeft size={16} /> Voltar ao estoque
          </button>
          <h2 className="text-2xl font-black text-wine-900 dark:text-white uppercase tracking-tight">Histórico de Entradas</h2>
          <p className="text-sm text-wine-500 dark:text-slate-400">Acompanhe quando, quanto e qual variação foi recebida.</p>
        </div>
        <Button variant="outline" onClick={exportCsv}><Download size={16} /> Exportar CSV</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-l-4 border-l-emerald-500"><p className="text-xs font-bold uppercase text-wine-500">Entradas registradas</p><p className="text-2xl font-black text-wine-900 dark:text-white mt-1">{entries.length}</p></Card>
        <Card className="border-l-4 border-l-blue-500"><p className="text-xs font-bold uppercase text-wine-500">Quantidade recebida</p><p className="text-2xl font-black text-wine-900 dark:text-white mt-1">{totalQuantity} un.</p></Card>
        <Card className="border-l-4 border-l-amber-500"><p className="text-xs font-bold uppercase text-wine-500">Custo registrado</p><p className="text-2xl font-black text-wine-900 dark:text-white mt-1">R$ {totalCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p></Card>
      </div>

      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div className="relative"><Search className="absolute left-3 top-9 text-gray-400" size={18} /><Input label="Buscar produto, variação ou observação" value={search} onChange={e => setSearch(e.target.value)} className="pl-10" /></div>
          <Input label="Data inicial" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
          <Input label="Data final" type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
        </div>
      </Card>

      <Card>
        <Table headers={['Data', 'Produto', 'Variação', 'Quantidade', 'Custo unitário', 'Custo total', 'Observações']}>
          {entries.map(entry => (
            <tr key={entry.id} className="border-b border-wine-50 dark:border-slate-700/50">
              <td className="py-3 px-4 text-xs font-mono text-wine-500"><span className="inline-flex items-center gap-1"><CalendarDays size={13} />{formatDisplayDate(entry.date)}</span></td>
              <td className="py-3 px-4 font-bold text-wine-900 dark:text-white"><span className="inline-flex items-center gap-2"><Package size={15} />{entry.productName}</span></td>
              <td className="py-3 px-4 text-sm text-wine-600 dark:text-slate-300">{entry.variantName || 'Produto principal'}</td>
              <td className="py-3 px-4 font-black text-emerald-600">+{entry.quantity}</td>
              <td className="py-3 px-4">R$ {Number(entry.unitCost || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
              <td className="py-3 px-4 font-bold">R$ {(Number(entry.quantity || 0) * Number(entry.unitCost || 0)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
              <td className="py-3 px-4 text-xs text-wine-500 dark:text-slate-400">{entry.observations || '-'}</td>
            </tr>
          ))}
          {entries.length === 0 && <tr><td colSpan={7} className="py-10 text-center text-sm text-wine-400">Nenhuma entrada encontrada.</td></tr>}
        </Table>
      </Card>
    </div>
  );
};
