import React, { useState, useMemo } from 'react';
import { Product, Purchase, UserProfile } from '../types';
import { Truck, Plus, Search, CheckCircle, Calendar, DollarSign, Package } from 'lucide-react';
import { StoreService } from '../services/store';

interface PurchasesManagerProps {
  products: Product[];
  purchases: Purchase[];
  currentUser: UserProfile;
  onRefresh: () => void;
}

export const PurchasesManager: React.FC<PurchasesManagerProps> = ({
  products,
  purchases,
  currentUser,
  onRefresh
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Form
  const [selectedProductId, setSelectedProductId] = useState<string>(products[0]?.id || '');
  const [fournisseur, setFournisseur] = useState('');
  const [quantite, setQuantite] = useState<number | ''>(10);
  const [prixAchat, setPrixAchat] = useState<number | ''>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Selected product helper
  const activeProduct = useMemo(() => {
    return products.find(p => p.id === selectedProductId);
  }, [products, selectedProductId]);

  // Set default buy price when product selected
  const handleProductChange = (id: string) => {
    setSelectedProductId(id);
    const prod = products.find(p => p.id === id);
    if (prod) {
      setPrixAchat(prod.prixAchat);
    }
  };

  // KPIs
  const kpis = useMemo(() => {
    const totalPurchases = purchases.reduce((sum, p) => sum + (p.montantTotal || 0), 0);
    const totalQty = purchases.reduce((sum, p) => sum + (p.quantite || 0), 0);
    return { totalPurchases, totalQty, count: purchases.length };
  }, [purchases]);

  const filteredPurchases = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return purchases.filter(p => {
      return !q || 
        p.produitNom.toLowerCase().includes(q) || 
        p.fournisseur.toLowerCase().includes(q) ||
        p.date.toLowerCase().includes(q);
    });
  }, [purchases, searchQuery]);

  const handleOpenCreate = () => {
    if (products.length > 0) {
      setSelectedProductId(products[0].id);
      setPrixAchat(products[0].prixAchat);
    }
    setFournisseur('');
    setQuantite(10);
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!activeProduct) {
      setErrorMsg("Veuillez sélectionner un produit valide.");
      return;
    }
    if (!fournisseur.trim()) {
      setErrorMsg("Veuillez renseigner le fournisseur.");
      return;
    }
    if (!quantite || Number(quantite) <= 0) {
      setErrorMsg("Veuillez entrer une quantité positive.");
      return;
    }
    if (prixAchat === '' || Number(prixAchat) < 0) {
      setErrorMsg("Veuillez entrer un prix d'achat valide.");
      return;
    }

    setIsSubmitting(true);
    try {
      const qte = Number(quantite);
      const unitPrice = Number(prixAchat);
      const totalCost = qte * unitPrice;
      const now = new Date();

      // 1. Record purchase
      await StoreService.createPurchase({
        date: now.toLocaleDateString('fr-FR'),
        heure: now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        fournisseur: fournisseur.trim(),
        produitId: activeProduct.id,
        produitNom: activeProduct.nom,
        quantite: qte,
        prixAchat: unitPrice,
        montantTotal: totalCost,
        utilisateur: currentUser.nom
      });

      // 2. Increment stock in products
      const newStock = activeProduct.stock + qte;
      await StoreService.updateProductStock(activeProduct.id, newStock);

      setIsModalOpen(false);
      onRefresh();
    } catch (err: any) {
      setErrorMsg(`Erreur : ${err?.message || err}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#151515] border border-[#282828] rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-gray-400 text-xs mb-1">
            <span>Total Investi (Achats)</span>
            <DollarSign className="w-4 h-4 text-[#d4af37]" />
          </div>
          <div className="text-xl font-bold text-white">
            {kpis.totalPurchases.toLocaleString()} <span className="text-xs font-normal text-gray-400">FCFA</span>
          </div>
          <p className="text-[11px] text-gray-400 mt-1">Approvisionnements enregistrés</p>
        </div>

        <div className="bg-[#151515] border border-[#282828] rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-gray-400 text-xs mb-1">
            <span>Unités Entrées en Stock</span>
            <Package className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl font-bold text-white">
            {kpis.totalQty.toLocaleString()} <span className="text-xs font-normal text-gray-400">unités</span>
          </div>
          <p className="text-[11px] text-emerald-400 mt-1">Réassort marchandise</p>
        </div>

        <div className="bg-[#151515] border border-[#282828] rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-gray-400 text-xs mb-1">
            <span>Lots Reçus</span>
            <Truck className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-xl font-bold text-white">
            {kpis.count} <span className="text-xs font-normal text-gray-400">livraisons</span>
          </div>
          <p className="text-[11px] text-gray-400 mt-1">Historique complet</p>
        </div>
      </div>

      {/* Control Bar */}
      <div className="bg-[#151515] border border-[#2a2a2a] rounded-xl p-4 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Rechercher par produit, fournisseur ou date..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-[#0e0e0e] border border-[#333] focus:border-[#d4af37] rounded-lg text-xs text-white placeholder:text-gray-500 outline-none transition"
          />
        </div>

        <button
          onClick={handleOpenCreate}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-[#d4af37] to-[#f1d477] hover:brightness-110 text-black font-bold text-xs rounded-lg shadow transition"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Nouvel Approvisionnement</span>
        </button>
      </div>

      {/* Purchases Table */}
      <div className="bg-[#151515] border border-[#2a2a2a] rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-gray-300">
            <thead className="bg-[#1a1a1a] text-gray-400 font-semibold uppercase tracking-wider text-[10px] border-b border-[#282828]">
              <tr>
                <th className="py-3 px-4">Date & Heure</th>
                <th className="py-3 px-4">Article</th>
                <th className="py-3 px-3">Fournisseur</th>
                <th className="py-3 px-3 text-center">Quantité Entrée</th>
                <th className="py-3 px-3 text-right">Prix Achat Unit.</th>
                <th className="py-3 px-4 text-right">Total Investi</th>
                <th className="py-3 px-3">Enregistré par</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#242424]">
              {filteredPurchases.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-gray-500 text-xs">
                    Aucun approvisionnement enregistré pour le moment.
                  </td>
                </tr>
              ) : (
                filteredPurchases.map(item => (
                  <tr key={item.id} className="hover:bg-[#1a1a1a]/80 transition">
                    <td className="py-3 px-4 text-gray-400 font-mono">
                      {item.date} <span className="text-[10px] text-gray-500">{item.heure}</span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-white">
                      {item.produitNom}
                    </td>
                    <td className="py-3 px-3 text-gray-300">
                      {item.fournisseur}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-900">
                        +{item.quantite}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-gray-300">
                      {item.prixAchat.toLocaleString()} F
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-[#d4af37]">
                      {item.montantTotal.toLocaleString()} FCFA
                    </td>
                    <td className="py-3 px-3 text-gray-400 text-[11px]">
                      {item.utilisateur || 'Admin'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: New Purchase */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-md bg-[#141414] border border-[#d4af37]/40 rounded-xl shadow-2xl p-6 overflow-hidden">
            <h3 className="text-base font-bold text-white flex items-center gap-2 pb-3 border-b border-[#282828] mb-4">
              <Truck className="w-5 h-5 text-[#d4af37]" />
              <span>Entrée de Stock / Approvisionnement</span>
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Product */}
              <div>
                <label className="text-xs font-medium text-[#d4af37] block mb-1">
                  Article à réapprovisionner *
                </label>
                <select
                  value={selectedProductId}
                  onChange={e => handleProductChange(e.target.value)}
                  className="w-full px-3 py-2 bg-[#0e0e0e] border border-[#333] focus:border-[#d4af37] rounded-lg text-xs text-white outline-none"
                  required
                >
                  {products.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.nom} (Stock actuel : {p.stock} {p.unite})
                    </option>
                  ))}
                </select>
              </div>

              {/* Fournisseur */}
              <div>
                <label className="text-xs font-medium text-[#d4af37] block mb-1">
                  Nom du Fournisseur / Distributeur *
                </label>
                <input
                  type="text"
                  placeholder="Ex: Laboratoire Paris, Grossiste Abidjan..."
                  value={fournisseur}
                  onChange={e => setFournisseur(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-[#0e0e0e] border border-[#333] focus:border-[#d4af37] rounded-lg text-xs text-white outline-none"
                />
              </div>

              {/* Quantity & Buy Price */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-[#d4af37] block mb-1">
                    Quantité reçue *
                  </label>
                  <input
                    type="number"
                    min="1"
                    placeholder="10"
                    value={quantite}
                    onChange={e => setQuantite(e.target.value === '' ? '' : Number(e.target.value))}
                    required
                    className="w-full px-3 py-2 bg-[#0e0e0e] border border-[#333] focus:border-[#d4af37] rounded-lg text-xs text-white outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-[#d4af37] block mb-1">
                    Prix Achat Unit. FCFA *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="100"
                    placeholder="7500"
                    value={prixAchat}
                    onChange={e => setPrixAchat(e.target.value === '' ? '' : Number(e.target.value))}
                    required
                    className="w-full px-3 py-2 bg-[#0e0e0e] border border-[#333] focus:border-[#d4af37] rounded-lg text-xs text-white outline-none"
                  />
                </div>
              </div>

              {/* Total Calculation */}
              <div className="p-3 bg-[#181818] border border-[#282828] rounded-lg flex items-center justify-between text-xs">
                <span className="text-gray-400">Coût Total d'Achat :</span>
                <span className="text-base font-bold text-[#d4af37] font-mono">
                  {((Number(quantite) || 0) * (Number(prixAchat) || 0)).toLocaleString()} FCFA
                </span>
              </div>

              {errorMsg && (
                <div className="p-2.5 bg-rose-950/80 border border-rose-800 text-rose-300 text-xs rounded-lg">
                  {errorMsg}
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#282828]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-[#222] hover:bg-[#2c2c2c] text-gray-300 text-xs rounded-lg transition"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-gradient-to-r from-[#d4af37] to-[#f1d477] hover:brightness-110 text-black font-bold text-xs rounded-lg shadow transition"
                >
                  {isSubmitting ? 'Enregistrement...' : 'Valider & Mettre à jour le stock'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
