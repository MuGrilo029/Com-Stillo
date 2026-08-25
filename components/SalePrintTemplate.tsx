import React from 'react';
import { CompanySettings, Sale, SaleItem, Transaction } from '../types';

interface SalePrintTemplateProps {
  sale: Sale | null;
  companySettings: CompanySettings;
  transactions: Transaction[];
  id?: string;
}

export const SalePrintTemplate: React.FC<SalePrintTemplateProps> = ({
  sale,
  companySettings,
  transactions,
  id = 'printable-order'
}) => {
  if (!sale) return null;

  const paidTransactions = transactions
    .filter(transaction => transaction.status === 'PAID' && transaction.type === 'INCOME' && (
      transaction.saleId === sale.id ||
      (transaction.description && transaction.description.includes(`Venda #${sale.id.slice(0, 4)}`))
    ))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const subtotal = sale.items.reduce((total, item) => total + (item.unitPrice * item.quantity), 0);
  const paidTotal = paidTransactions.reduce((total, transaction) => total + transaction.amount, 0);

  return (
    <div id={id} className="hidden print:block text-black">
      <div className="w-full h-full font-sans leading-tight p-4 max-w-[210mm] mx-auto">
        <style>{`
          @media print {
            @page { margin: 0; size: auto; }
            body * { visibility: hidden !important; height: 0 !important; overflow: hidden !important; }
            #${id}, #${id} * { visibility: visible !important; height: auto !important; overflow: visible !important; }
            #${id} { position: absolute !important; left: 0 !important; top: 0 !important; width: 100vw !important; min-height: 100vh !important; z-index: 9999 !important; background: white !important; padding: 20mm !important; box-sizing: border-box !important; }
          }
        `}</style>
        <div className="flex justify-between items-start mb-2 border-b-2 border-black pb-2">
          <div>
            <h1 className="text-xl font-bold uppercase tracking-widest mb-1">{companySettings.name}</h1>
            <p>{companySettings.address} | {companySettings.phone}</p>
            <p>CNPJ: {companySettings.cnpj}</p>
          </div>
          <div className="text-right">
            <h2 className="text-lg font-bold uppercase">PEDIDO DE VENDA</h2>
            <p>#{sale.id.slice(0, 8)}</p>
            <p>{new Date(sale.date).toLocaleDateString()} {new Date(sale.date).toLocaleTimeString().slice(0, 5)}</p>
          </div>
        </div>

        <div className="mb-2 p-2 border border-black rounded-md flex justify-between bg-gray-50">
          <div>
            <p><span className="font-bold">Cliente:</span> {sale.customerName}</p>
            <p><span className="font-bold">Telefone:</span> {sale.customerPhone || 'N/A'}</p>
          </div>
          <div className="text-right">
            <p><span className="font-bold">Status:</span> {sale.status === 'COMPLETED' ? 'CONCLUÍDO' : 'CANCELADO'}</p>
            <p><span className="font-bold">Entrega:</span> {sale.deliveryType === 'DELIVERY' ? 'Domicílio' : 'Retirada'}</p>
          </div>
        </div>

        <div className="flex-1 mb-2">
          <table className="w-full text-left border-collapse">
            <thead><tr className="border-b border-black text-[10px] uppercase"><th className="py-1">Qtd</th><th className="py-1">Item / Descrição</th><th className="py-1 text-right">Unit.</th><th className="py-1 text-right">Total</th></tr></thead>
            <tbody className="text-[10px]">
              {sale.items.map((item: SaleItem, index: number) => (
                <tr key={index} className="border-b border-gray-200">
                  <td className="py-1 w-8 align-top font-bold">{item.quantity}x</td>
                  <td className="py-1 align-top"><div className="font-bold">{item.productName}</div>{item.description && <div className="text-[9px] text-gray-600 italic leading-tight">{item.description}</div>}</td>
                  <td className="py-1 text-right align-top">R$ {item.unitPrice.toFixed(2)}</td>
                  <td className="py-1 text-right align-top font-bold">R$ {(item.quantity * item.unitPrice).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="border-t-2 border-black pt-2 mb-4">
          <div className="flex justify-end gap-8 text-sm"><div className="text-right"><p className="text-xs">Subtotal: R$ {subtotal.toFixed(2)}</p><p className="text-xs">Desconto: - R$ {(sale.discount || 0).toFixed(2)}</p><p className="font-bold text-lg border-t border-black mt-1">TOTAL: R$ {sale.total.toFixed(2)}</p></div></div>
          <div className="mt-2 text-[10px] flex gap-4 bg-gray-100 p-2 rounded">
            <div><span className="font-bold">Forma de Pagamento:</span> {sale.paymentType === 'PARTIAL' ? 'Parcial / Entrada + Resto' : 'Integral / À Vista'}</div>
            {sale.paymentType === 'PARTIAL' && <><div><span className="font-bold">Entrada:</span> R$ {sale.downPayment?.toFixed(2)} ({sale.downPaymentMethod})</div><div><span className="font-bold">Restante:</span> R$ {sale.remainingAmount?.toFixed(2)} ({sale.remainingPaymentMethod})</div></>}
            {sale.paymentType === 'FULL' && <div>Meio: {sale.paymentMethod}</div>}
          </div>

          <div className="mt-4 pt-2 border-t border-gray-300">
            <p className="font-bold text-[10px] uppercase mb-1">Histórico de Pagamentos</p>
            <div className="space-y-1">
              {paidTransactions.map((transaction, index) => (
                <div key={transaction.id} className="flex justify-between text-[10px] border-b border-gray-200 border-dotted pb-1"><span>{new Date(transaction.date).toLocaleDateString()} - <span className="font-bold text-gray-700">{transaction.category || (index === 0 && sale.paymentType === 'PARTIAL' ? 'Entrada' : 'Pagamento')}</span></span><span className="font-bold text-green-700">R$ {transaction.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span></div>
              ))}
              {paidTransactions.length === 0 && <p className="text-[10px] italic text-gray-500">Nenhum pagamento registrado.</p>}
              <div className="flex justify-end mt-2"><p className="text-[10px]"><span className="font-bold text-red-600 uppercase">Saldo Devedor:</span>{' '}<span className="font-bold text-red-700 text-sm">R$ {(sale.total - paidTotal).toFixed(2)}</span></p></div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-8 mt-auto pt-8">
          <div className="border-t border-black text-center pt-1"><p className="font-bold uppercase tracking-widest text-[10px]">{companySettings.name}</p><p className="text-[9px]">Assinatura do Responsável</p></div>
          <div className="border-t border-black text-center pt-1"><p className="font-bold uppercase tracking-widest text-[10px]">{sale.customerName}</p><p className="text-[9px]">Assinatura do Cliente</p></div>
        </div>
      </div>
    </div>
  );
};
