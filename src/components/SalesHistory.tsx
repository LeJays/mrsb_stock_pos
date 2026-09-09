import React, { useState, useMemo } from 'react';
import { Sale } from '../types';
import { Search, Printer, Receipt, Calendar, User, CreditCard } from 'lucide-react';

interface SalesHistoryProps {
  sales: Sale[];
  onViewReceipt: (sale: Sale) => void;
}

export const SalesHistory: React.FC<SalesHistoryProps> = ({ sales, onViewReceipt }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');

  const filteredSales = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return sales.filter(s => {
      const matchPayment = paymentFilter === 'all' || s.paiement === paymentFilter;
      const matchSearch = !q ||
        (s.ticketNumero && s.ticketNumero.toLowerCase().includes(q)) ||
        (s.client && s.client.toLowerCase().includes(q)) ||
        (s.vendeurNom && s.vendeurNom.toLowerCase().includes(q)) ||
        s.date.toLowerCase().includes(q) ||
        s.items.some(it => it.produit.toLowerCase().includes(q));

      return matchPayment && matchSearch;
    });
  }, [sales, searchQuery, paymentFilter]);

  const totalFilteredSales = useMemo(() => {
    return filteredSales.reduce((sum, s) => sum + s.total, 0);
  }, [filteredSales]);

  return (
    <div className="space-y-6">
      {/* Control Bar */}
      <div className="bg-[#151515] border border-[#2a2a2a] rounded-xl p-4 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="flex flex-1 items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Rechercher par ticket, client, vendeur ou article..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-[#0e0e0e] border border-[#333] focus:border-[#d4af37] rounded-lg text-xs text-white placeholder:text-gray-500 outline-none transition"
            />
          </div>

          <select
            value={paymentFilter}
            onChange={e => setPaymentFilter(e.target.value)}
            className="px-3 py-2 bg-[#0e0e0e] border border-[#333] focus:border-[#d4af37] rounded-lg text-xs text-white outline-none"
          >
            <option value="all">Tous les règlements</option>
            <option value="Cash">Cash (Espèces)</option>
            <option value="Orange Money">Orange Money</option>
            <option value="MTN MoMo">MTN MoMo</option>
            <option value="Carte Bancaire">Carte Bancaire</option>
          </select>
        </div>

        <div className="text-right text-xs">
          <span className="text-gray-400">Total sélection : </span>
          <strong className="text-[#d4af37] font-mono text-sm">
            {totalFilteredSales.toLocaleString()} FCFA
          </strong>
        </div>
      </div>

      {/* Sales Table */}
      <div className="bg-[#151515] border border-[#2a2a2a] rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-gray-300">
            <thead className="bg-[#1a1a1a] text-gray-400 font-semibold uppercase tracking-wider text-[10px] border-b border-[#282828]">
              <tr>
                <th className="py-3 px-4">Ticket & Date</th>
                <th className="py-3 px-3">Client</th>
                <th className="py-3 px-3">Articles Vendus</th>
                <th className="py-3 px-3 text-center">Articles</th>
                <th className="py-3 px-3">Paiement</th>
                <th className="py-3 px-4 text-right">Total Payé</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#242424]">
              {filteredSales.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-500 text-xs">
                    Aucune vente ne correspond à ces critères.
                  </td>
                </tr>
              ) : (
                filteredSales.map(sale => {
                  const totalItemsCount = sale.items.reduce((s, it) => s + it.quantite, 0);

                  return (
                    <tr key={sale.id} className="hover:bg-[#1a1a1a]/80 transition">
                      <td className="py-3 px-4">
                        <div className="font-mono font-bold text-white text-[11px]">
                          {sale.ticketNumero || sale.id}
                        </div>
                        <div className="text-[10px] text-gray-400">
                          {sale.date} à {sale.heure} • {sale.vendeurNom}
                        </div>
                      </td>

                      <td className="py-3 px-3 font-medium text-gray-200">
                        {sale.client || 'Client de passage'}
                      </td>

                      <td className="py-3 px-3 max-w-[280px]">
                        <div className="truncate text-gray-300">
                          {sale.items.map(it => `${it.produit} (x${it.quantite})`).join(', ')}
                        </div>
                      </td>

                      <td className="py-3 px-3 text-center font-mono font-semibold text-gray-300">
                        x{totalItemsCount}
                      </td>

                      <td className="py-3 px-3">
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#d4af37] bg-[#d4af37]/10 px-2 py-0.5 rounded-md border border-[#d4af37]/20">
                          {sale.paiement}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right font-mono font-bold text-white text-sm">
                        {sale.total.toLocaleString()} FCFA
                      </td>

                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => onViewReceipt(sale)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#222] hover:bg-[#d4af37] text-[#d4af37] hover:text-black border border-[#3a3a3a] hover:border-[#d4af37] rounded-md font-semibold text-[11px] transition ml-auto"
                          title="Imprimer / Voir le ticket de caisse"
                        >
                          <Receipt className="w-3.5 h-3.5" />
                          <span>Reçu</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
