import React, { useState, useMemo } from 'react';
import { Product, BasketItem, PaymentMethod, Sale, UserProfile } from '../types';
import { 
  Search, ShoppingBag, Trash2, Plus, Minus, Check, AlertTriangle, 
  CreditCard, Smartphone, Banknote, X, Sparkles, ReceiptText, ShieldAlert,
  User, RefreshCw
} from 'lucide-react';
import { StoreService } from '../services/store';

interface CaissePOSProps {
  products: Product[];
  currentUser: UserProfile;
  activeCashSession: { statut: string } | null;
  onSaleCompleted: (sale: Sale) => void;
  onRefreshProducts: () => void;
}

export const CaissePOS: React.FC<CaissePOSProps> = ({
  products,
  currentUser,
  activeCashSession,
  onSaleCompleted,
  onRefreshProducts
}) => {
  const [basket, setBasket] = useState<BasketItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [clientName, setClientName] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Cash');
  const [cashGiven, setCashGiven] = useState<number | ''>('');
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [discountType, setDiscountType] = useState<'amount' | 'percent'>('amount');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Categories extraction
  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach(p => {
      if (p.categorie) set.add(p.categorie);
    });
    return Array.from(set);
  }, [products]);

  // Filtered products
  const filteredProducts = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return products.filter(p => {
      if (!p.actif) return false;
      const matchCat = selectedCategory === 'all' || p.categorie === selectedCategory;
      const matchSearch = !q || 
        p.nom.toLowerCase().includes(q) || 
        (p.codeBarre && p.codeBarre.toLowerCase().includes(q)) ||
        p.categorie.toLowerCase().includes(q);
      return matchCat && matchSearch;
    });
  }, [products, searchQuery, selectedCategory]);

  // Cart Calculations
  const subTotal = useMemo(() => {
    return basket.reduce((sum, item) => sum + item.prix * item.quantite, 0);
  }, [basket]);

  const computedDiscount = useMemo(() => {
    if (discountType === 'percent') {
      return Math.round((subTotal * (discountAmount || 0)) / 100);
    }
    return Math.min(discountAmount || 0, subTotal);
  }, [subTotal, discountAmount, discountType]);

  const netTotal = useMemo(() => {
    return Math.max(0, subTotal - computedDiscount);
  }, [subTotal, computedDiscount]);

  const changeDue = useMemo(() => {
    if (paymentMethod !== 'Cash') return 0;
    const given = Number(cashGiven) || 0;
    return Math.max(0, given - netTotal);
  }, [paymentMethod, cashGiven, netTotal]);

  // Add to basket
  const addToBasket = (product: Product) => {
    setErrorMessage(null);
    if (product.stock <= 0) {
      setErrorMessage(`Le produit "${product.nom}" est en rupture de stock.`);
      return;
    }

    setBasket(prev => {
      const existing = prev.find(item => item.productId === product.id);
      if (existing) {
        if (existing.quantite + 1 > product.stock) {
          setErrorMessage(`Stock maximum atteint pour "${product.nom}" (${product.stock} disponibles).`);
          return prev;
        }
        return prev.map(item => 
          item.productId === product.id ? { ...item, quantite: item.quantite + 1 } : item
        );
      } else {
        return [
          ...prev,
          {
            productId: product.id,
            produit: product.nom,
            categorie: product.categorie,
            quantite: 1,
            prix: product.prixVente,
            unite: product.unite || 'pièce',
            stockDisponible: product.stock
          }
        ];
      }
    });
  };

  // Update quantity in basket
  const updateQuantity = (productId: string, newQty: number) => {
    setErrorMessage(null);
    const product = products.find(p => p.id === productId);
    if (!product) return;

    if (newQty <= 0) {
      removeFromBasket(productId);
      return;
    }

    if (newQty > product.stock) {
      setErrorMessage(`Stock insuffisant pour "${product.nom}". Disponible : ${product.stock}`);
      return;
    }

    setBasket(prev => prev.map(item => 
      item.productId === productId ? { ...item, quantite: newQty } : item
    ));
  };

  const removeFromBasket = (productId: string) => {
    setBasket(prev => prev.filter(item => item.productId !== productId));
  };

  const clearBasket = () => {
    setBasket([]);
    setCashGiven('');
    setDiscountAmount(0);
    setErrorMessage(null);
  };

  // Fast cash buttons (FCFA)
  const setQuickCash = (amount: number) => {
    setCashGiven(amount);
  };

  // Barcode / Enter key handling
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && filteredProducts.length === 1) {
      addToBasket(filteredProducts[0]);
      setSearchQuery('');
    }
  };

  // Checkout and stock verification
  const handleValidateSale = async () => {
    setErrorMessage(null);

    if (basket.length === 0) {
      setErrorMessage("Le panier est vide. Veuillez ajouter au moins un produit.");
      return;
    }

    // Étape 3 — Vérification du stock avant validation
    for (const item of basket) {
      const liveProduct = products.find(p => p.id === item.productId);
      const currentStock = liveProduct ? liveProduct.stock : 0;
      if (item.quantite > currentStock) {
        setErrorMessage(
          `❌ VENTE BLOQUÉE : Stock insuffisant pour "${item.produit}". Demandé : ${item.quantite}, En stock réel : ${currentStock}.`
        );
        return;
      }
    }

    if (paymentMethod === 'Cash') {
      const given = Number(cashGiven) || 0;
      if (given < netTotal) {
        setErrorMessage(`Montant reçu insuffisant. Il manque ${(netTotal - given).toLocaleString()} FCFA.`);
        return;
      }
    }

    setIsProcessing(true);

    try {
      const now = new Date();
      const ticketNum = `TCK-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${String(Math.floor(1000 + Math.random() * 9000))}`;

      // Build sale object
      const salePayload: Omit<Sale, 'id'> = {
        ticketNumero: ticketNum,
        date: now.toLocaleDateString('fr-FR'),
        heure: now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        vendeurId: currentUser.uid,
        vendeurNom: currentUser.nom,
        client: clientName.trim() || 'Client de passage',
        items: basket.map(it => ({
          productId: it.productId,
          produit: it.produit,
          categorie: it.categorie,
          quantite: it.quantite,
          prix: it.prix,
          totalLigne: it.prix * it.quantite,
          unite: it.unite
        })),
        sousTotal: subTotal,
        remise: computedDiscount,
        total: netTotal,
        paiement: paymentMethod,
        montantDonne: paymentMethod === 'Cash' ? (Number(cashGiven) || netTotal) : netTotal,
        montantRendu: changeDue,
        statut: 'validée'
      };

      // 1. Deduct stock for each product
      for (const item of basket) {
        const prod = products.find(p => p.id === item.productId);
        if (prod) {
          const newStock = Math.max(0, prod.stock - item.quantite);
          await StoreService.updateProductStock(item.productId, newStock);
        }
      }

      // 2. Save Sale to Store & Firestore
      const savedSale = await StoreService.createSale(salePayload);

      // 3. Update active cash session if payment is Cash
      if (activeCashSession && activeCashSession.statut === 'ouverte' && paymentMethod === 'Cash') {
        const updatedSession = {
          ...activeCashSession,
          montantVentesCash: (activeCashSession.montantVentesCash || 0) + netTotal,
          montantAttendu: activeCashSession.montantOuverture + ((activeCashSession.montantVentesCash || 0) + netTotal) - activeCashSession.montantRetrait
        };
        StoreService.saveActiveSession(updatedSession);
      }

      // Reset cart and trigger receipt modal
      clearBasket();
      setClientName('');
      onRefreshProducts();
      onSaleCompleted(savedSale);
    } catch (err: any) {
      setErrorMessage(`Erreur lors de l'enregistrement de la vente : ${err?.message || err}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* LEFT COLUMN: Product Catalog & Search (7 cols) */}
      <div className="lg:col-span-7 flex flex-col gap-4">
        {/* Search & Category Filter */}
        <div className="bg-[#151515] border border-[#2a2a2a] rounded-xl p-4 shadow-sm flex flex-col gap-3">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#a7a7a7]" />
            <input
              type="text"
              id="caisseSearchInput"
              placeholder="Rechercher par nom, code-barre ou catégorie (Appuyez sur Entrée)..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              className="w-full pl-10 pr-4 py-2.5 bg-[#0e0e0e] border border-[#333] focus:border-[#d4af37] rounded-lg text-sm text-white placeholder:text-gray-500 outline-none transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none text-xs">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition ${
                selectedCategory === 'all'
                  ? 'bg-[#d4af37] text-black font-semibold'
                  : 'bg-[#202020] text-[#a7a7a7] hover:text-white hover:bg-[#282828]'
              }`}
            >
              Tous ({products.length})
            </button>
            {categories.map(cat => {
              const count = products.filter(p => p.categorie === cat && p.actif).length;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition ${
                    selectedCategory === cat
                      ? 'bg-[#d4af37] text-black font-semibold'
                      : 'bg-[#202020] text-[#a7a7a7] hover:text-white hover:bg-[#282828]'
                  }`}
                >
                  {cat} ({count})
                </button>
              );
            })}
          </div>
        </div>

        {/* Product Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5 max-h-[calc(100vh-280px)] overflow-y-auto pr-1">
          {filteredProducts.length === 0 ? (
            <div className="col-span-full py-12 text-center bg-[#151515] border border-[#262626] rounded-xl text-gray-500 text-sm">
              <ShoppingBag className="w-8 h-8 mx-auto mb-2 opacity-40 text-[#d4af37]" />
              <p>Aucun produit ne correspond à votre recherche.</p>
            </div>
          ) : (
            filteredProducts.map(product => {
              const isOutOfStock = product.stock <= 0;
              const isLowStock = product.stock > 0 && product.stock <= 5;
              const inBasket = basket.find(b => b.productId === product.id);

              return (
                <div
                  key={product.id}
                  onClick={() => !isOutOfStock && addToBasket(product)}
                  className={`group relative p-3.5 rounded-xl border transition-all flex flex-col justify-between text-left select-none ${
                    isOutOfStock
                      ? 'bg-[#121212] border-[#252525] opacity-50 cursor-not-allowed'
                      : inBasket
                      ? 'bg-[#1a1711] border-[#d4af37] shadow-[0_0_15px_rgba(212,175,55,0.15)] cursor-pointer hover:border-[#f1d477]'
                      : 'bg-[#151515] border-[#282828] hover:border-[#d4af37]/60 hover:bg-[#1a1a1a] cursor-pointer'
                  }`}
                  id={`productCard-${product.id}`}
                >
                  {/* Category & Stock Pill */}
                  <div className="flex items-center justify-between gap-1 mb-2">
                    <span className="text-[10px] uppercase font-medium tracking-wider text-gray-400 truncate">
                      {product.categorie}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        isOutOfStock
                          ? 'bg-rose-950/80 text-rose-300 border border-rose-800/60'
                          : isLowStock
                          ? 'bg-amber-950/80 text-amber-300 border border-amber-800/60'
                          : 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/50'
                      }`}
                    >
                      {isOutOfStock ? 'Épuisé' : `Stock: ${product.stock}`}
                    </span>
                  </div>

                  {/* Name */}
                  <h4 className="text-xs font-semibold text-white group-hover:text-[#f1d477] transition line-clamp-2 leading-snug mb-2">
                    {product.nom}
                  </h4>

                  {/* Price & Add indicator */}
                  <div className="flex items-center justify-between pt-2 border-t border-[#262626]">
                    <div>
                      <div className="text-xs font-bold text-[#d4af37]">
                        {product.prixVente.toLocaleString()} <span className="text-[10px] font-normal text-gray-400">FCFA</span>
                      </div>
                      <span className="text-[9px] text-gray-500 font-light">
                        par {product.unite || 'unité'}
                      </span>
                    </div>

                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center transition ${
                      inBasket 
                        ? 'bg-[#d4af37] text-black font-bold text-xs' 
                        : 'bg-[#222] text-[#d4af37] group-hover:bg-[#d4af37] group-hover:text-black'
                    }`}>
                      {inBasket ? `+${inBasket.quantite}` : <Plus className="w-3.5 h-3.5" />}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* RIGHT COLUMN: Interactive Cart & Payment (5 cols) */}
      <div className="lg:col-span-5 bg-[#151515] border border-[#2a2a2a] rounded-xl p-5 shadow-lg flex flex-col justify-between min-h-[580px]">
        <div>
          {/* Cart Header */}
          <div className="flex items-center justify-between pb-3 border-b border-[#282828] mb-4">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-[#d4af37]" />
              <h3 className="text-sm font-bold tracking-wide uppercase text-white">
                Panier de Vente ({basket.reduce((s, i) => s + i.quantite, 0)} articles)
              </h3>
            </div>
            {basket.length > 0 && (
              <button
                onClick={clearBasket}
                className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1 transition"
                title="Vider le panier"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Vider</span>
              </button>
            )}
          </div>

          {/* Client Field */}
          <div className="mb-3.5">
            <label className="text-[11px] font-medium text-[#d4af37] block mb-1">
              Nom du Client (Optionnel)
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
              <input
                type="text"
                id="caisseClientInput"
                placeholder="Ex: Mme Traoré, Aminata..."
                value={clientName}
                onChange={e => setClientName(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-[#0e0e0e] border border-[#333] focus:border-[#d4af37] rounded-lg text-xs text-white outline-none transition"
              />
            </div>
          </div>

          {/* Basket Items List */}
          <div className="max-h-[220px] overflow-y-auto space-y-2 mb-4 pr-1">
            {basket.length === 0 ? (
              <div className="py-10 text-center text-gray-500 text-xs border border-dashed border-[#282828] rounded-lg">
                <p>Votre panier est vide.</p>
                <p className="text-[11px] text-gray-600 mt-1">Sélectionnez des articles à gauche pour commencer.</p>
              </div>
            ) : (
              basket.map(item => (
                <div
                  key={item.productId}
                  className="bg-[#1a1a1a] border border-[#282828] rounded-lg p-2.5 flex items-center justify-between gap-2 text-xs"
                >
                  <div className="flex-1 min-w-0">
                    <h5 className="font-medium text-white truncate">{item.produit}</h5>
                    <div className="text-[11px] text-[#d4af37] font-semibold mt-0.5">
                      {item.prix.toLocaleString()} FCFA
                    </div>
                  </div>

                  {/* Quantity controls */}
                  <div className="flex items-center gap-1 bg-[#101010] border border-[#333] rounded-md px-1 py-0.5">
                    <button
                      onClick={() => updateQuantity(item.productId, item.quantite - 1)}
                      className="p-1 text-gray-400 hover:text-white transition"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <input
                      type="number"
                      min="1"
                      max={item.stockDisponible}
                      value={item.quantite}
                      onChange={e => updateQuantity(item.productId, parseInt(e.target.value) || 1)}
                      className="w-8 text-center text-xs font-bold bg-transparent text-white outline-none"
                    />
                    <button
                      onClick={() => updateQuantity(item.productId, item.quantite + 1)}
                      className="p-1 text-gray-400 hover:text-white transition"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Total Line */}
                  <div className="w-20 text-right font-bold text-white">
                    {(item.prix * item.quantite).toLocaleString()} F
                  </div>

                  <button
                    onClick={() => removeFromBasket(item.productId)}
                    className="text-gray-500 hover:text-rose-400 p-1 transition"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Discount Field */}
          <div className="flex items-center justify-between gap-2 p-2 bg-[#121212] border border-[#242424] rounded-lg mb-4 text-xs">
            <span className="text-gray-400 font-medium">Remise commerciale :</span>
            <div className="flex items-center gap-1">
              <input
                type="number"
                min="0"
                placeholder="0"
                value={discountAmount || ''}
                onChange={e => setDiscountAmount(Math.max(0, Number(e.target.value) || 0))}
                className="w-20 px-2 py-1 bg-[#1a1a1a] border border-[#333] rounded text-right text-xs text-white outline-none"
              />
              <div className="flex bg-[#222] rounded border border-[#333] overflow-hidden">
                <button
                  type="button"
                  onClick={() => setDiscountType('amount')}
                  className={`px-1.5 py-1 text-[10px] ${discountType === 'amount' ? 'bg-[#d4af37] text-black font-bold' : 'text-gray-400'}`}
                >
                  FCFA
                </button>
                <button
                  type="button"
                  onClick={() => setDiscountType('percent')}
                  className={`px-1.5 py-1 text-[10px] ${discountType === 'percent' ? 'bg-[#d4af37] text-black font-bold' : 'text-gray-400'}`}
                >
                  %
                </button>
              </div>
            </div>
          </div>

          {/* Totals Box */}
          <div className="p-3.5 bg-gradient-to-br from-[#201c13] to-[#141414] border border-[#d4af37]/30 rounded-xl mb-4 space-y-1.5">
            <div className="flex justify-between text-xs text-gray-400">
              <span>Sous-total :</span>
              <span>{subTotal.toLocaleString()} FCFA</span>
            </div>
            {computedDiscount > 0 && (
              <div className="flex justify-between text-xs text-emerald-400">
                <span>Remise appliquée :</span>
                <span>-{computedDiscount.toLocaleString()} FCFA</span>
              </div>
            )}
            <div className="flex justify-between items-baseline pt-2 border-t border-[#d4af37]/30">
              <span className="text-xs uppercase font-bold text-gray-300">TOTAL À PAYER</span>
              <span className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#f1d477] to-[#d4af37]" id="caisseNetTotal">
                {netTotal.toLocaleString()} <span className="text-xs font-medium text-[#d4af37]">FCFA</span>
              </span>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div className="mb-4">
            <label className="text-[11px] font-medium text-[#d4af37] block mb-1.5">
              Mode de Règlement
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {(['Cash', 'Orange Money', 'MTN MoMo', 'Carte Bancaire'] as PaymentMethod[]).map(method => (
                <button
                  key={method}
                  type="button"
                  onClick={() => setPaymentMethod(method)}
                  className={`py-2 px-1 text-[11px] font-semibold rounded-lg border transition text-center flex flex-col items-center gap-1 ${
                    paymentMethod === method
                      ? 'bg-[#d4af37] text-black border-[#d4af37] shadow-sm'
                      : 'bg-[#1a1a1a] text-gray-400 border-[#303030] hover:text-white hover:bg-[#222]'
                  }`}
                >
                  {method === 'Cash' && <Banknote className="w-3.5 h-3.5" />}
                  {method === 'Orange Money' && <Smartphone className="w-3.5 h-3.5 text-orange-400" />}
                  {method === 'MTN MoMo' && <Smartphone className="w-3.5 h-3.5 text-yellow-400" />}
                  {method === 'Carte Bancaire' && <CreditCard className="w-3.5 h-3.5 text-blue-400" />}
                  <span className="truncate">{method === 'Carte Bancaire' ? 'Carte' : method}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Cash input & fast buttons */}
          {paymentMethod === 'Cash' && (
            <div className="p-3 bg-[#111] border border-[#2a2a2a] rounded-xl mb-4 space-y-2.5">
              <div className="flex justify-between items-center gap-2">
                <label className="text-xs text-gray-300 font-medium">Montant Reçu :</label>
                <div className="relative">
                  <input
                    type="number"
                    step="500"
                    placeholder="0"
                    value={cashGiven}
                    onChange={e => setCashGiven(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-36 px-2.5 py-1.5 bg-[#181818] border border-[#444] focus:border-[#d4af37] rounded-lg text-right font-bold text-sm text-white outline-none"
                    id="cashGivenInput"
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-500">FCFA</span>
                </div>
              </div>

              {/* Fast shortcuts */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => setQuickCash(netTotal)}
                  className="px-2 py-1 text-[10px] bg-[#222] hover:bg-[#333] text-[#d4af37] border border-[#444] rounded"
                >
                  Montant Exact
                </button>
                {[5000, 10000, 20000, 50000].map(amt => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setQuickCash(amt)}
                    className="px-2 py-1 text-[10px] bg-[#1e1e1e] hover:bg-[#282828] text-gray-300 border border-[#333] rounded"
                  >
                    {amt.toLocaleString()} F
                  </button>
                ))}
              </div>

              {/* Change Due Display */}
              <div className="flex justify-between items-center pt-2 border-t border-[#222]">
                <span className="text-xs text-gray-400 font-medium">Monnaie à rendre :</span>
                <span className={`text-base font-black ${changeDue > 0 ? 'text-emerald-400' : 'text-gray-300'}`} id="caisseChangeDue">
                  {changeDue.toLocaleString()} FCFA
                </span>
              </div>
            </div>
          )}

          {/* Error Banner */}
          {errorMessage && (
            <div className="p-3 bg-rose-950/80 border border-rose-800 text-rose-200 text-xs rounded-lg flex items-start gap-2 mb-4 animate-shake">
              <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <p className="leading-snug">{errorMessage}</p>
            </div>
          )}
        </div>

        {/* Validation Button */}
        <button
          type="button"
          onClick={handleValidateSale}
          disabled={isProcessing || basket.length === 0}
          className={`w-full py-3.5 px-4 rounded-xl font-bold uppercase tracking-wider text-xs flex items-center justify-center gap-2 shadow-lg transition ${
            isProcessing || basket.length === 0
              ? 'bg-[#2a2a2a] text-gray-500 border border-[#3a3a3a] cursor-not-allowed'
              : 'bg-gradient-to-r from-[#d4af37] via-[#f1d477] to-[#d4af37] text-black hover:brightness-110 hover:shadow-[0_0_20px_rgba(212,175,55,0.4)] cursor-pointer'
          }`}
          id="validerVenteBtn"
        >
          {isProcessing ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Validation en cours...</span>
            </>
          ) : (
            <>
              <Check className="w-4 h-4 text-black stroke-[3]" />
              <span>Valider la Vente & Imprimer le Ticket</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
