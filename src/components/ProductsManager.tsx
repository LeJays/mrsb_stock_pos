import React, { useState, useMemo } from 'react';
import { Product, Category } from '../types';
import { 
  Package, Plus, Search, Edit3, Trash2, AlertTriangle, CheckCircle, 
  TrendingUp, ArrowUpDown, X, Filter, Sparkles, DollarSign
} from 'lucide-react';
import { StoreService } from '../services/store';

interface ProductsManagerProps {
  products: Product[];
  categories: Category[];
  onRefresh: () => void;
}

export const ProductsManager: React.FC<ProductsManagerProps> = ({
  products,
  categories,
  onRefresh
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [stockFilter, setStockFilter] = useState<'all' | 'low' | 'out'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [categoryError, setCategoryError] = useState<string | null>(null);

  // Form State
  const [nom, setNom] = useState('');
  const [categorie, setCategorie] = useState('');
  const [newCatInput, setNewCatInput] = useState('');
  const [unite, setUnite] = useState('flacon');
  const [prixAchat, setPrixAchat] = useState<number | ''>('');
  const [prixVente, setPrixVente] = useState<number | ''>('');
  const [stock, setStock] = useState<number | ''>('');
  const [codeBarre, setCodeBarre] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Quick Stock modal
  const [quickStockProduct, setQuickStockProduct] = useState<Product | null>(null);
  const [quickStockDelta, setQuickStockDelta] = useState<number>(5);

  // Global KPIs
  const kpis = useMemo(() => {
    const totalRef = products.length;
    const totalStock = products.reduce((sum, p) => sum + (p.stock || 0), 0);
    const totalValAchat = products.reduce((sum, p) => sum + (p.prixAchat || 0) * (p.stock || 0), 0);
    const totalValVente = products.reduce((sum, p) => sum + (p.prixVente || 0) * (p.stock || 0), 0);
    const lowStockCount = products.filter(p => p.stock > 0 && p.stock <= 5).length;
    const outStockCount = products.filter(p => p.stock <= 0).length;

    return {
      totalRef,
      totalStock,
      totalValAchat,
      totalValVente,
      margePotentielle: totalValVente - totalValAchat,
      lowStockCount,
      outStockCount
    };
  }, [products]);

  // Filtered Products
  const filteredProducts = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return products.filter(p => {
      const matchCat = selectedCategory === 'all' || p.categorie === selectedCategory;
      const matchSearch = !q || 
        p.nom.toLowerCase().includes(q) || 
        (p.codeBarre && p.codeBarre.toLowerCase().includes(q)) ||
        p.categorie.toLowerCase().includes(q);

      let matchStock = true;
      if (stockFilter === 'low') matchStock = p.stock > 0 && p.stock <= 5;
      if (stockFilter === 'out') matchStock = p.stock <= 0;

      return matchCat && matchSearch && matchStock;
    });
  }, [products, searchQuery, selectedCategory, stockFilter]);

  // Open modal for Create
  const handleOpenCreate = () => {
    setEditingProduct(null);
    setNom('');
    setCategorie(categories[0]?.nom || 'Cosmétiques');
    setNewCatInput('');
    setUnite('flacon');
    setPrixAchat('');
    setPrixVente('');
    setStock(10);
    setCodeBarre('');
    setFormError(null);
    setIsModalOpen(true);
  };

  // Open modal for Edit
  const handleOpenEdit = (p: Product) => {
    setEditingProduct(p);
    setNom(p.nom);
    setCategorie(p.categorie);
    setNewCatInput('');
    setUnite(p.unite || 'flacon');
    setPrixAchat(p.prixAchat);
    setPrixVente(p.prixVente);
    setStock(p.stock);
    setCodeBarre(p.codeBarre || '');
    setFormError(null);
    setIsModalOpen(true);
  };

  const categoryBreakdown = useMemo(() => {
    const map = new Map<string, number>();
    products.forEach(product => {
      const key = product.categorie || 'Autre';
      map.set(key, (map.get(key) || 0) + product.stock);
    });
    return Array.from(map.entries())
      .map(([nom, stock]) => ({ nom, stock }))
      .sort((a, b) => b.stock - a.stock)
      .slice(0, 4);
  }, [products]);

  const handleCreateCategory = async () => {
    const name = newCategoryName.trim();
    if (!name) {
      setCategoryError('Le nom de la catégorie est obligatoire.');
      return;
    }

    const exists = categories.some(cat => cat.nom.toLowerCase() === name.toLowerCase());
    if (exists) {
      setCategoryError('Cette catégorie existe déjà.');
      return;
    }

    try {
      await StoreService.saveCategory({ nom: name });
      setNewCategoryName('');
      setCategoryError(null);
      setIsCategoryModalOpen(false);
      onRefresh();
    } catch (err: any) {
      setCategoryError(err?.message || 'Impossible de créer cette catégorie.');
    }
  };

  // Submit Product Form
  const handleSubmitProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const finalCat = categorie === 'NEW' ? newCatInput.trim() : categorie;

    if (!nom.trim()) {
      setFormError("Veuillez renseigner le nom du produit.");
      return;
    }
    if (!finalCat) {
      setFormError("Veuillez choisir ou spécifier une catégorie.");
      return;
    }
    if (prixAchat === '' || Number(prixAchat) < 0) {
      setFormError("Le prix d'achat doit être supérieur ou égal à 0.");
      return;
    }
    if (prixVente === '' || Number(prixVente) <= 0) {
      setFormError("Le prix de vente doit être supérieur à 0.");
      return;
    }
    if (stock === '' || Number(stock) < 0) {
      setFormError("Le stock doit être un nombre positif.");
      return;
    }

    setIsSubmitting(true);
    try {
      if (categorie === 'NEW' && newCatInput.trim()) {
        await StoreService.saveCategory({ nom: newCatInput.trim() });
      }

      await StoreService.saveProduct({
        nom: nom.trim(),
        categorie: finalCat,
        unite: unite.trim() || 'pièce',
        prixAchat: Number(prixAchat),
        prixVente: Number(prixVente),
        stock: Number(stock),
        codeBarre: codeBarre.trim() || undefined,
        actif: true,
        dateCreation: editingProduct?.dateCreation || new Date().toISOString()
      }, editingProduct?.id);

      setIsModalOpen(false);
      onRefresh();
    } catch (err: any) {
      setFormError(`Erreur d'enregistrement : ${err?.message || err}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Product
  const handleDeleteProduct = async (p: Product) => {
    if (confirm(`Êtes-vous certain de vouloir supprimer définitivement le produit "${p.nom}" ?`)) {
      await StoreService.deleteProduct(p.id);
      onRefresh();
    }
  };

  // Quick Stock addition
  const handleQuickStockUpdate = async () => {
    if (!quickStockProduct) return;
    const newStock = Math.max(0, quickStockProduct.stock + quickStockDelta);
    await StoreService.updateProductStock(quickStockProduct.id, newStock);
    setQuickStockProduct(null);
    onRefresh();
  };

  // Calculate projected margin in form
  const formMargin = useMemo(() => {
    const pA = Number(prixAchat) || 0;
    const pV = Number(prixVente) || 0;
    const diff = pV - pA;
    const percent = pV > 0 ? ((diff / pV) * 100).toFixed(1) : '0';
    return { diff, percent };
  }, [prixAchat, prixVente]);

  return (
    <div className="space-y-6">
      {/* Top Stat Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_2fr] gap-4">
        <div className="bg-[#151515] border border-[#2a2a2a] rounded-xl p-4">
          <div className="flex items-center justify-between text-xs text-gray-400 mb-3">
            <span>Catégories</span>
            <button
              onClick={() => setIsCategoryModalOpen(true)}
              className="text-[#d4af37] font-semibold hover:text-[#f1d477]"
            >
              + Créer
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {categories.length === 0 ? (
              <span className="text-xs text-gray-500">Aucune catégorie pour le moment.</span>
            ) : (
              categories.map(cat => (
                <span key={cat.id} className="inline-flex items-center rounded-full border border-[#3a3a3a] bg-[#1d1d1d] px-2.5 py-1 text-[11px] text-gray-200">
                  {cat.nom}
                </span>
              ))
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-[#151515] border border-[#262626] rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between text-gray-400 text-xs mb-1">
              <span>Catalogue Produits</span>
              <Package className="w-4 h-4 text-[#d4af37]" />
            </div>
            <div className="text-xl font-bold text-white">
              {kpis.totalRef} <span className="text-xs font-normal text-gray-400">références</span>
            </div>
            <div className="text-[11px] text-emerald-400 mt-1">
              {kpis.totalStock} unités au total
            </div>
          </div>

          <div className="bg-[#151515] border border-[#262626] rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between text-gray-400 text-xs mb-1">
              <span>Valeur Stock (Achat)</span>
              <TrendingUp className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-xl font-bold text-white">
              {kpis.totalValAchat.toLocaleString()} <span className="text-xs font-normal text-gray-400">FCFA</span>
            </div>
            <div className="text-[11px] text-gray-400 mt-1">
              Capital marchandise immobilisé
            </div>
          </div>

          <div className="bg-[#151515] border border-[#d4af37]/40 rounded-xl p-4 shadow-sm bg-gradient-to-br from-[#1a1811] to-[#121212]">
            <div className="flex items-center justify-between text-[#d4af37] text-xs mb-1">
              <span>Valeur Marchande (Vente)</span>
              <Sparkles className="w-4 h-4 text-[#d4af37]" />
            </div>
            <div className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#f1d477] to-[#d4af37]">
              {kpis.totalValVente.toLocaleString()} <span className="text-xs font-normal text-[#d4af37]">FCFA</span>
            </div>
            <div className="text-[11px] text-[#f1d477] font-medium mt-1">
              Marge brute estimée : +{kpis.margePotentielle.toLocaleString()} F
            </div>
          </div>

          <div className="bg-[#151515] border border-[#262626] rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between text-gray-400 text-xs mb-1">
              <span>Alertes Stock</span>
              <AlertTriangle className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-xl font-bold text-white flex items-baseline gap-2">
              <span className={kpis.lowStockCount > 0 ? 'text-amber-400' : 'text-gray-300'}>
                {kpis.lowStockCount} faibles
              </span>
              {kpis.outStockCount > 0 && (
                <span className="text-rose-400 text-sm font-semibold">
                  / {kpis.outStockCount} épuisés
                </span>
              )}
            </div>
            <div className="text-[11px] text-gray-400 mt-1">
              Seuil critique ≤ 5 unités
            </div>
          </div>
        </div>
      </div>

      {/* Control Bar: Search, Category, Add Button */}
      <div className="bg-[#151515] border border-[#2a2a2a] rounded-xl p-4 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="flex flex-1 items-center gap-2">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Rechercher par nom ou code barre..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-[#0e0e0e] border border-[#333] focus:border-[#d4af37] rounded-lg text-xs text-white placeholder:text-gray-500 outline-none transition"
              id="searchProductInput"
            />
          </div>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
            className="px-3 py-2 bg-[#0e0e0e] border border-[#333] focus:border-[#d4af37] rounded-lg text-xs text-white outline-none"
            id="filterCategorySelect"
          >
            <option value="all">Toutes catégories</option>
            {categories.map(c => (
              <option key={c.id} value={c.nom}>{c.nom}</option>
            ))}
          </select>

          {/* Stock Filter */}
          <select
            value={stockFilter}
            onChange={e => setStockFilter(e.target.value as any)}
            className="px-3 py-2 bg-[#0e0e0e] border border-[#333] focus:border-[#d4af37] rounded-lg text-xs text-white outline-none"
          >
            <option value="all">Tous les stocks</option>
            <option value="low">Stock faible (≤ 5)</option>
            <option value="out">Rupture de stock (0)</option>
          </select>
        </div>

        {/* Add Product Button */}
        <button
          onClick={handleOpenCreate}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-[#d4af37] to-[#f1d477] hover:brightness-110 text-black font-bold text-xs rounded-lg shadow-[0_2px_10px_rgba(212,175,55,0.3)] transition"
          id="addProductBtn"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Nouveau Produit</span>
        </button>
      </div>

      {categoryBreakdown.length > 0 && (
        <div className="bg-[#151515] border border-[#2a2a2a] rounded-xl p-4">
          <div className="mb-3 text-xs font-bold uppercase tracking-wider text-gray-400">Répartition des stocks par catégorie</div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            {categoryBreakdown.map(item => {
              const max = Math.max(...categoryBreakdown.map(cat => cat.stock), 1);
              const width = (item.stock / max) * 100;
              return (
                <div key={item.nom} className="rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] p-3">
                  <div className="mb-1 flex items-center justify-between text-[11px] text-gray-300">
                    <span>{item.nom}</span>
                    <span className="font-mono text-[#d4af37]">{item.stock}</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-[#0f0f0f]">
                    <div className="h-full rounded-full bg-gradient-to-r from-[#d4af37] to-[#f1d477]" style={{ width: `${width}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Products Table */}
      <div className="bg-[#151515] border border-[#2a2a2a] rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-gray-300">
            <thead className="bg-[#1a1a1a] text-gray-400 font-semibold uppercase tracking-wider text-[10px] border-b border-[#282828]">
              <tr>
                <th className="py-3 px-4">Article</th>
                <th className="py-3 px-3">Catégorie</th>
                <th className="py-3 px-3">Prix Achat</th>
                <th className="py-3 px-3">Prix Vente</th>
                <th className="py-3 px-3">Marge / Unité</th>
                <th className="py-3 px-3">En Stock</th>
                <th className="py-3 px-3">Statut</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#242424]">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-gray-500 text-xs">
                    Aucun produit trouvé dans cette sélection.
                  </td>
                </tr>
              ) : (
                filteredProducts.map(product => {
                  const isOutOfStock = product.stock <= 0;
                  const isLowStock = product.stock > 0 && product.stock <= 5;
                  const marginPerUnit = product.prixVente - product.prixAchat;
                  const marginPercent = product.prixVente > 0 ? ((marginPerUnit / product.prixVente) * 100).toFixed(0) : '0';

                  return (
                    <tr key={product.id} className="hover:bg-[#1a1a1a]/80 transition">
                      <td className="py-3 px-4 font-medium text-white">
                        <div className="font-semibold text-white">{product.nom}</div>
                        {product.codeBarre && (
                          <div className="text-[10px] text-gray-500 font-mono">
                            CB: {product.codeBarre}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-3 text-gray-400">
                        {product.categorie}
                        <span className="block text-[10px] text-gray-500">Unité: {product.unite}</span>
                      </td>
                      <td className="py-3 px-3 font-mono">
                        {product.prixAchat.toLocaleString()} F
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-[#d4af37]">
                        {product.prixVente.toLocaleString()} F
                      </td>
                      <td className="py-3 px-3">
                        <span className="text-emerald-400 font-semibold font-mono">
                          +{marginPerUnit.toLocaleString()} F
                        </span>
                        <span className="block text-[10px] text-gray-500">
                          ({marginPercent}% marge)
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1.5">
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                            isOutOfStock
                              ? 'bg-rose-950 text-rose-300 border border-rose-800'
                              : isLowStock
                              ? 'bg-amber-950 text-amber-300 border border-amber-800'
                              : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                          }`}>
                            {product.stock} {product.unite}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        {product.actif ? (
                          <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-900/60">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                            Actif
                          </span>
                        ) : (
                          <span className="text-[10px] text-gray-500 bg-gray-900 px-2 py-0.5 rounded-full">
                            Inactif
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setQuickStockProduct(product);
                              setQuickStockDelta(5);
                            }}
                            className="px-2 py-1 bg-[#222] hover:bg-[#2e2e2e] text-[#d4af37] border border-[#383838] rounded text-[11px] transition"
                            title="Réassort rapide (+ Stock)"
                          >
                            + Stock
                          </button>
                          <button
                            onClick={() => handleOpenEdit(product)}
                            className="p-1.5 text-gray-400 hover:text-white bg-[#222] hover:bg-[#2e2e2e] border border-[#383838] rounded transition"
                            title="Modifier"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(product)}
                            className="p-1.5 text-gray-400 hover:text-rose-400 bg-[#222] hover:bg-[#2e2e2e] border border-[#383838] rounded transition"
                            title="Supprimer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Add/Edit Product */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-lg bg-[#141414] border border-[#d4af37]/40 rounded-xl shadow-2xl p-6 overflow-hidden">
            <div className="flex items-center justify-between pb-3 border-b border-[#282828] mb-5">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Package className="w-5 h-5 text-[#d4af37]" />
                <span>{editingProduct ? 'Modifier le Produit' : 'Ajouter un Nouveau Produit'}</span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitProduct} className="space-y-4">
              {/* Name */}
              <div>
                <label className="text-xs font-medium text-[#d4af37] block mb-1">
                  Nom de l'article *
                </label>
                <input
                  type="text"
                  placeholder="Ex: Huile Scintillante 250ml"
                  value={nom}
                  onChange={e => setNom(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-[#0e0e0e] border border-[#333] focus:border-[#d4af37] rounded-lg text-xs text-white outline-none"
                  id="formNom"
                />
              </div>

              {/* Category & Unit */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-[#d4af37] block mb-1">
                    Catégorie *
                  </label>
                  <select
                    value={categorie}
                    onChange={e => setCategorie(e.target.value)}
                    className="w-full px-3 py-2 bg-[#0e0e0e] border border-[#333] focus:border-[#d4af37] rounded-lg text-xs text-white outline-none"
                  >
                    {categories.map(c => (
                      <option key={c.id} value={c.nom}>{c.nom}</option>
                    ))}
                    <option value="NEW">+ Nouvelle catégorie...</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium text-[#d4af37] block mb-1">
                    Unité de mesure
                  </label>
                  <input
                    type="text"
                    placeholder="flacon, pot, pièce..."
                    value={unite}
                    onChange={e => setUnite(e.target.value)}
                    className="w-full px-3 py-2 bg-[#0e0e0e] border border-[#333] focus:border-[#d4af37] rounded-lg text-xs text-white outline-none"
                  />
                </div>
              </div>

              {categorie === 'NEW' && (
                <div>
                  <label className="text-xs font-medium text-[#f1d477] block mb-1">
                    Nom de la nouvelle catégorie
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Maquillage & Poudres"
                    value={newCatInput}
                    onChange={e => setNewCatInput(e.target.value)}
                    className="w-full px-3 py-2 bg-[#0e0e0e] border border-[#d4af37] rounded-lg text-xs text-white outline-none"
                  />
                </div>
              )}

              {/* Price buy / sell */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-[#d4af37] block mb-1">
                    Prix d'Achat (Coût) FCFA *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="100"
                    placeholder="8000"
                    value={prixAchat}
                    onChange={e => setPrixAchat(e.target.value === '' ? '' : Number(e.target.value))}
                    required
                    className="w-full px-3 py-2 bg-[#0e0e0e] border border-[#333] focus:border-[#d4af37] rounded-lg text-xs text-white outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-[#d4af37] block mb-1">
                    Prix de Vente (Client) FCFA *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="100"
                    placeholder="15000"
                    value={prixVente}
                    onChange={e => setPrixVente(e.target.value === '' ? '' : Number(e.target.value))}
                    required
                    className="w-full px-3 py-2 bg-[#0e0e0e] border border-[#333] focus:border-[#d4af37] rounded-lg text-xs text-white outline-none"
                  />
                </div>
              </div>

              {/* Live Margin Indicator */}
              <div className="p-3 bg-[#181818] border border-[#282828] rounded-lg flex items-center justify-between text-xs">
                <span className="text-gray-400">Bénéfice estimé par article :</span>
                <span className={`font-bold font-mono ${formMargin.diff >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {formMargin.diff.toLocaleString()} FCFA ({formMargin.percent}%)
                </span>
              </div>

              {/* Stock & Barcode */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-[#d4af37] block mb-1">
                    Quantité en Stock *
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="20"
                    value={stock}
                    onChange={e => setStock(e.target.value === '' ? '' : Number(e.target.value))}
                    required
                    className="w-full px-3 py-2 bg-[#0e0e0e] border border-[#333] focus:border-[#d4af37] rounded-lg text-xs text-white outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-[#d4af37] block mb-1">
                    Code Barre (Optionnel)
                  </label>
                  <input
                    type="text"
                    placeholder="3700101..."
                    value={codeBarre}
                    onChange={e => setCodeBarre(e.target.value)}
                    className="w-full px-3 py-2 bg-[#0e0e0e] border border-[#333] focus:border-[#d4af37] rounded-lg text-xs text-white outline-none"
                  />
                </div>
              </div>

              {/* Error banner */}
              {formError && (
                <div className="p-2.5 bg-rose-950/80 border border-rose-800 text-rose-300 text-xs rounded-lg">
                  {formError}
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#262626]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-[#222] hover:bg-[#2b2b2b] text-gray-300 text-xs rounded-lg transition"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-gradient-to-r from-[#d4af37] to-[#f1d477] hover:brightness-110 text-black font-bold text-xs rounded-lg shadow transition"
                >
                  {isSubmitting ? 'Enregistrement...' : editingProduct ? 'Mettre à jour' : 'Créer le produit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl border border-[#d4af37]/40 bg-[#141414] p-5 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-bold text-white">Créer une catégorie</h3>
              <button onClick={() => { setIsCategoryModalOpen(false); setCategoryError(null); }} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-[#d4af37]">Nom de la catégorie</label>
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={e => setNewCategoryName(e.target.value)}
                  placeholder="Ex: Soins visage"
                  className="w-full rounded-lg border border-[#333] bg-[#0e0e0e] px-3 py-2 text-xs text-white outline-none focus:border-[#d4af37]"
                />
              </div>

              {categoryError && (
                <div className="rounded-lg border border-rose-800 bg-rose-950/60 px-3 py-2 text-xs text-rose-200">{categoryError}</div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => { setIsCategoryModalOpen(false); setCategoryError(null); }} className="rounded-lg bg-[#222] px-4 py-2 text-xs text-gray-300">
                  Annuler
                </button>
                <button type="button" onClick={handleCreateCategory} className="rounded-lg bg-gradient-to-r from-[#d4af37] to-[#f1d477] px-4 py-2 text-xs font-bold text-black">
                  Enregistrer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Stock Modal */}
      {quickStockProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-sm bg-[#151515] border border-[#d4af37]/40 rounded-xl p-5 shadow-2xl">
            <h4 className="text-sm font-bold text-white mb-1">
              Réassort rapide : {quickStockProduct.nom}
            </h4>
            <p className="text-xs text-gray-400 mb-4">
              Stock actuel : <strong className="text-white">{quickStockProduct.stock}</strong> {quickStockProduct.unite}
            </p>

            <label className="text-xs text-[#d4af37] font-medium block mb-1">
              Quantité à ajouter (+) ou retirer (-) :
            </label>
            <div className="flex items-center gap-2 mb-4">
              {[-5, +5, +10, +20].map(val => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setQuickStockDelta(val)}
                  className={`px-2.5 py-1 text-xs rounded border transition ${
                    quickStockDelta === val ? 'bg-[#d4af37] text-black font-bold border-[#d4af37]' : 'bg-[#222] text-gray-300 border-[#333]'
                  }`}
                >
                  {val > 0 ? `+${val}` : val}
                </button>
              ))}
            </div>

            <input
              type="number"
              value={quickStockDelta}
              onChange={e => setQuickStockDelta(Number(e.target.value) || 0)}
              className="w-full px-3 py-2 bg-[#0e0e0e] border border-[#333] rounded-lg text-xs text-white mb-4 outline-none"
            />

            <div className="p-2.5 bg-[#202020] rounded-lg text-xs text-gray-300 mb-4 flex justify-between">
              <span>Nouveau stock résultant :</span>
              <strong className="text-emerald-400">
                {Math.max(0, quickStockProduct.stock + quickStockDelta)} {quickStockProduct.unite}
              </strong>
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setQuickStockProduct(null)}
                className="px-3 py-1.5 text-xs text-gray-400 hover:text-white bg-[#222] rounded-lg"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleQuickStockUpdate}
                className="px-4 py-1.5 text-xs font-bold text-black bg-[#d4af37] hover:bg-[#f1d477] rounded-lg"
              >
                Confirmer l'ajustement
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
