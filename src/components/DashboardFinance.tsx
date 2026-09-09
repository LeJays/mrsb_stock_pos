import React, { useMemo } from 'react';
import { Sale, Purchase, Product, PaymentMethod } from '../types';
import { 
  TrendingUp, DollarSign, ShoppingCart, Award, Smartphone, 
  Banknote, CreditCard, AlertTriangle, ArrowUpRight, BarChart3, 
  Calendar, Layers, ShieldCheck
} from 'lucide-react';

interface DashboardFinanceProps {
  sales: Sale[];
  purchases: Purchase[];
  products: Product[];
  onNavigateToStock: () => void;
  onNavigateToPurchases: () => void;
}

export const DashboardFinance: React.FC<DashboardFinanceProps> = ({
  sales,
  purchases,
  products,
  onNavigateToStock,
  onNavigateToPurchases
}) => {
  const todayStr = new Date().toLocaleDateString('fr-FR');

  // Computed Financial Metrics
  const stats = useMemo(() => {
    const todaySales = sales.filter(s => s.date === todayStr && s.statut === 'validée');
    const totalTodayRevenue = todaySales.reduce((sum, s) => sum + s.total, 0);

    const validSales = sales.filter(s => s.statut === 'validée');
    const totalRevenue = validSales.reduce((sum, s) => sum + s.total, 0);

    let totalCogs = 0;
    validSales.forEach(s => {
      s.items.forEach(it => {
        const prod = products.find(p => p.id === it.productId);
        const buyPrice = prod ? prod.prixAchat : it.prix * 0.5;
        totalCogs += buyPrice * it.quantite;
      });
    });

    const netProfit = totalRevenue - totalCogs;
    const totalExpenses = purchases.reduce((sum, p) => sum + p.montantTotal, 0);
    const grossMargin = totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : '0';
    const avgBasket = validSales.length > 0 ? Math.round(totalRevenue / validSales.length) : 0;

    const paymentMap: Record<PaymentMethod, { count: number; total: number }> = {
      'Cash': { count: 0, total: 0 },
      'Orange Money': { count: 0, total: 0 },
      'MTN MoMo': { count: 0, total: 0 },
      'Carte Bancaire': { count: 0, total: 0 }
    };

    validSales.forEach(s => {
      if (paymentMap[s.paiement]) {
        paymentMap[s.paiement].count += 1;
        paymentMap[s.paiement].total += s.total;
      }
    });

    const productSalesMap: Record<string, { nom: string; qty: number; revenue: number; categorie: string }> = {};
    validSales.forEach(s => {
      s.items.forEach(it => {
        if (!productSalesMap[it.produit]) {
          productSalesMap[it.produit] = { nom: it.produit, qty: 0, revenue: 0, categorie: it.categorie };
        }
        productSalesMap[it.produit].qty += it.quantite;
        productSalesMap[it.produit].revenue += it.totalLigne;
      });
    });

    const topProducts = Object.values(productSalesMap).sort((a, b) => b.revenue - a.revenue).slice(0, 5);
    const criticalStock = products.filter(p => p.stock <= 5);
    const totalStockValue = products.reduce((sum, p) => sum + (p.prixAchat * p.stock), 0);
    const latestSales = [...validSales].sort((a, b) => b.date.localeCompare(a.date) || b.heure.localeCompare(a.heure)).slice(0, 5);

    const revenueByCategory: Record<string, number> = {};
    validSales.forEach(sale => {
      sale.items.forEach(item => {
        const key = item.categorie || 'Autre';
        revenueByCategory[key] = (revenueByCategory[key] || 0) + item.totalLigne;
      });
    });

    const categoryRevenue = Object.entries(revenueByCategory)
      .map(([categorie, montant]) => ({ categorie, montant }))
      .sort((a, b) => b.montant - a.montant);

    return {
      todaySalesCount: todaySales.length,
      totalTodayRevenue,
      totalRevenue,
      totalExpenses,
      totalStockValue,
      netProfit,
      grossMargin,
      avgBasket,
      totalTransactions: validSales.length,
      paymentMap,
      topProducts,
      criticalStock,
      latestSales,
      categoryRevenue
    };
  }, [sales, purchases, products, todayStr]);

  return (
    <div className="space-y-6">
      {/* Top Main Financial KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Chiffre d'Affaires du Jour */}
        <div className="bg-[#151515] border border-[#2a2a2a] rounded-xl p-4 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
            <span>Ventes du Jour ({todayStr})</span>
            <Calendar className="w-4 h-4 text-[#d4af37]" />
          </div>
          <div className="text-2xl font-black text-white font-mono">
            {stats.totalTodayRevenue.toLocaleString()} <span className="text-xs font-normal text-gray-400">FCFA</span>
          </div>
          <div className="text-[11px] text-emerald-400 flex items-center gap-1 mt-1 font-medium">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>{stats.todaySalesCount} transaction(s) aujourd'hui</span>
          </div>
        </div>

        {/* Chiffre d'Affaires Global */}
        <div className="bg-[#151515] border border-[#2a2a2a] rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
            <span>Chiffre d'Affaires Cumulé</span>
            <DollarSign className="w-4 h-4 text-[#d4af37]" />
          </div>
          <div className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#f1d477] to-[#d4af37] font-mono">
            {stats.totalRevenue.toLocaleString()} <span className="text-xs font-normal text-[#d4af37]">FCFA</span>
          </div>
          <div className="text-[11px] text-gray-400 mt-1">
            Sur {stats.totalTransactions} ventes validées
          </div>
        </div>

        {/* Bénéfice Net */}
        <div className="bg-[#151515] border border-emerald-900/40 rounded-xl p-4 shadow-sm bg-gradient-to-br from-[#121f15] to-[#121212]">
          <div className="flex items-center justify-between text-xs text-emerald-400 mb-1">
            <span>Bénéfice Net Estimé</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400 font-mono">
            +{stats.netProfit.toLocaleString()} <span className="text-xs font-normal text-emerald-300">FCFA</span>
          </div>
          <div className="text-[11px] text-emerald-300/80 mt-1">
            Marge nette moyenne : <strong>{stats.grossMargin}%</strong>
          </div>
        </div>

        {/* Panier Moyen */}
        <div className="bg-[#151515] border border-[#2a2a2a] rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
            <span>Panier Moyen</span>
            <ShoppingCart className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-black text-white font-mono">
            {stats.avgBasket.toLocaleString()} <span className="text-xs font-normal text-gray-400">FCFA</span>
          </div>
          <div className="text-[11px] text-gray-400 mt-1">
            Montant moyen par client
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="bg-[#151515] border border-[#2a2a2a] rounded-xl p-4">
          <div className="text-[11px] uppercase tracking-wider text-gray-400">Dépenses achats</div>
          <div className="mt-2 text-2xl font-black text-white font-mono">{stats.totalExpenses.toLocaleString()} <span className="text-xs text-gray-400">FCFA</span></div>
          <div className="mt-1 text-[11px] text-gray-400">Approvisionnements enregistrés</div>
        </div>
        <div className="bg-[#151515] border border-[#2a2a2a] rounded-xl p-4">
          <div className="text-[11px] uppercase tracking-wider text-gray-400">Valeur du stock</div>
          <div className="mt-2 text-2xl font-black text-white font-mono">{stats.totalStockValue.toLocaleString()} <span className="text-xs text-gray-400">FCFA</span></div>
          <div className="mt-1 text-[11px] text-gray-400">Base achat actuelle</div>
        </div>
        <div className="bg-[#151515] border border-[#2a2a2a] rounded-xl p-4">
          <div className="text-[11px] uppercase tracking-wider text-gray-400">Taux marge nette</div>
          <div className="mt-2 text-2xl font-black text-emerald-400 font-mono">{stats.grossMargin}%</div>
          <div className="mt-1 text-[11px] text-gray-400">Performance globale</div>
        </div>
        <div className="bg-[#151515] border border-[#2a2a2a] rounded-xl p-4">
          <div className="text-[11px] uppercase tracking-wider text-gray-400">Produits critiques</div>
          <div className="mt-2 text-2xl font-black text-amber-400 font-mono">{stats.criticalStock.length}</div>
          <div className="mt-1 text-[11px] text-gray-400">À réapprovisionner</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Payment Methods Breakdown (6 cols) */}
        <div className="lg:col-span-6 bg-[#151515] border border-[#282828] rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-[#252525]">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
              <Banknote className="w-4 h-4 text-[#d4af37]" />
              <span>Répartition des Encaissements</span>
            </h4>
            <span className="text-xs text-gray-400 font-mono">{stats.totalRevenue.toLocaleString()} F total</span>
          </div>

          <div className="space-y-3 pt-1">
            {/* Cash */}
            {(() => {
              const total = stats.paymentMap['Cash'].total;
              const pct = stats.totalRevenue > 0 ? ((total / stats.totalRevenue) * 100).toFixed(1) : '0';
              return (
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-300 flex items-center gap-1.5 font-medium">
                      <Banknote className="w-3.5 h-3.5 text-[#d4af37]" />
                      Espèces (Cash)
                    </span>
                    <span className="font-mono text-white font-semibold">
                      {total.toLocaleString()} FCFA ({pct}%)
                    </span>
                  </div>
                  <div className="w-full h-2 bg-[#222] rounded-full overflow-hidden">
                    <div className="h-full bg-[#d4af37] rounded-full transition-all duration-500" style={{ width: `${pct}%` }}></div>
                  </div>
                </div>
              );
            })()}

            {/* Orange Money */}
            {(() => {
              const total = stats.paymentMap['Orange Money'].total;
              const pct = stats.totalRevenue > 0 ? ((total / stats.totalRevenue) * 100).toFixed(1) : '0';
              return (
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-300 flex items-center gap-1.5 font-medium">
                      <Smartphone className="w-3.5 h-3.5 text-orange-400" />
                      Orange Money
                    </span>
                    <span className="font-mono text-white font-semibold">
                      {total.toLocaleString()} FCFA ({pct}%)
                    </span>
                  </div>
                  <div className="w-full h-2 bg-[#222] rounded-full overflow-hidden">
                    <div className="h-full bg-orange-500 rounded-full transition-all duration-500" style={{ width: `${pct}%` }}></div>
                  </div>
                </div>
              );
            })()}

            {/* MTN MoMo */}
            {(() => {
              const total = stats.paymentMap['MTN MoMo'].total;
              const pct = stats.totalRevenue > 0 ? ((total / stats.totalRevenue) * 100).toFixed(1) : '0';
              return (
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-300 flex items-center gap-1.5 font-medium">
                      <Smartphone className="w-3.5 h-3.5 text-yellow-400" />
                      MTN MoMo
                    </span>
                    <span className="font-mono text-white font-semibold">
                      {total.toLocaleString()} FCFA ({pct}%)
                    </span>
                  </div>
                  <div className="w-full h-2 bg-[#222] rounded-full overflow-hidden">
                    <div className="h-full bg-yellow-500 rounded-full transition-all duration-500" style={{ width: `${pct}%` }}></div>
                  </div>
                </div>
              );
            })()}

            {/* Carte Bancaire */}
            {(() => {
              const total = stats.paymentMap['Carte Bancaire'].total;
              const pct = stats.totalRevenue > 0 ? ((total / stats.totalRevenue) * 100).toFixed(1) : '0';
              return (
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-300 flex items-center gap-1.5 font-medium">
                      <CreditCard className="w-3.5 h-3.5 text-blue-400" />
                      Carte Bancaire
                    </span>
                    <span className="font-mono text-white font-semibold">
                      {total.toLocaleString()} FCFA ({pct}%)
                    </span>
                  </div>
                  <div className="w-full h-2 bg-[#222] rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full transition-all duration-500" style={{ width: `${pct}%` }}></div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>

        {/* Top Selling Products (6 cols) */}
        <div className="lg:col-span-6 bg-[#151515] border border-[#282828] rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-[#252525]">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
              <Award className="w-4 h-4 text-[#d4af37]" />
              <span>Meilleures Ventes (Top Produits)</span>
            </h4>
            <span className="text-xs text-[#d4af37] font-medium">Par chiffre d'affaires</span>
          </div>

          <div className="space-y-2.5">
            {stats.topProducts.length === 0 ? (
              <p className="py-6 text-center text-xs text-gray-500">
                Aucune vente enregistrée pour établir le classement.
              </p>
            ) : (
              stats.topProducts.map((prod, idx) => (
                <div
                  key={prod.nom}
                  className="p-2.5 bg-[#1a1a1a] border border-[#282828] rounded-lg flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 ${
                      idx === 0 ? 'bg-[#d4af37] text-black' : idx === 1 ? 'bg-gray-300 text-black' : 'bg-amber-900 text-amber-200'
                    }`}>
                      {idx + 1}
                    </div>
                    <div className="truncate">
                      <div className="font-medium text-white truncate">{prod.nom}</div>
                      <div className="text-[10px] text-gray-400">{prod.categorie}</div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="font-bold text-[#d4af37] font-mono">
                      {prod.revenue.toLocaleString()} F
                    </div>
                    <div className="text-[10px] text-gray-400">
                      {prod.qty} unité(s) vendue(s)
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#151515] border border-[#2a2a2a] rounded-xl p-5">
          <div className="mb-4 flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">Récapitulatif par catégorie</h4>
            <Layers className="w-4 h-4 text-[#d4af37]" />
          </div>
          <div className="space-y-3">
            {stats.categoryRevenue.length === 0 ? (
              <p className="text-xs text-gray-500">Aucune donnée de catégorie disponible.</p>
            ) : (
              stats.categoryRevenue.map(item => {
                const max = Math.max(...stats.categoryRevenue.map(cat => cat.montant), 1);
                return (
                  <div key={item.categorie}>
                    <div className="mb-1 flex items-center justify-between text-[11px] text-gray-300">
                      <span>{item.categorie}</span>
                      <span className="font-mono text-white">{item.montant.toLocaleString()} FCFA</span>
                    </div>
                    <div className="h-2 rounded-full bg-[#0f0f0f]">
                      <div className="h-full rounded-full bg-gradient-to-r from-[#d4af37] to-[#f1d477]" style={{ width: `${(item.montant / max) * 100}%` }} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="bg-[#151515] border border-[#2a2a2a] rounded-xl p-5">
          <div className="mb-4 flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">Ventes récentes</h4>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="space-y-2">
            {stats.latestSales.length === 0 ? (
              <p className="text-xs text-gray-500">Aucune vente récente disponible.</p>
            ) : (
              stats.latestSales.map(sale => (
                <div key={sale.id} className="flex items-center justify-between rounded-lg border border-[#2a2a2a] bg-[#191919] px-3 py-2 text-xs">
                  <div>
                    <div className="font-semibold text-white">{sale.ticketNumero}</div>
                    <div className="text-gray-400">{sale.date} • {sale.client}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono font-bold text-[#d4af37]">{sale.total.toLocaleString()} FCFA</div>
                    <div className="text-gray-400">{sale.paiement}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Critical Stock Alerts Banner */}
      {stats.criticalStock.length > 0 && (
        <div className="p-4 bg-amber-950/40 border border-amber-800/60 rounded-xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span>Alerte Stock Critique : {stats.criticalStock.length} article(s) à réapprovisionner d'urgence</span>
            </div>
            <button
              onClick={onNavigateToPurchases}
              className="text-xs text-amber-300 hover:text-amber-200 underline font-medium"
            >
              Créer un approvisionnement →
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
            {stats.criticalStock.map(p => (
              <div
                key={p.id}
                className="p-2.5 bg-[#151515] border border-amber-900/50 rounded-lg flex items-center justify-between text-xs"
              >
                <div className="min-w-0 pr-2">
                  <div className="font-semibold text-white truncate">{p.nom}</div>
                  <div className="text-[10px] text-gray-400">{p.categorie}</div>
                </div>
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                  p.stock <= 0
                    ? 'bg-rose-950 text-rose-300 border border-rose-800'
                    : 'bg-amber-950 text-amber-300 border border-amber-800'
                }`}>
                  {p.stock <= 0 ? 'RUPTURE' : `${p.stock} restant(s)`}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
