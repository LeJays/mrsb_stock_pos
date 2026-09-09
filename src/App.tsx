import React, { useState, useEffect, useCallback } from 'react';
import { Product, Category, Sale, Purchase, CashSession, UserProfile } from './types';
import { StoreService } from './services/store';
import { AuthService } from './services/auth';
import { Navbar, ActiveTab } from './components/Navbar';
import { CaissePOS } from './components/CaissePOS';
import { ProductsManager } from './components/ProductsManager';
import { PurchasesManager } from './components/PurchasesManager';
import { SalesHistory } from './components/SalesHistory';
import { DashboardFinance } from './components/DashboardFinance';
import { ReceiptModal } from './components/ReceiptModal';
import { CashRegisterModal } from './components/CashRegisterModal';
import { LoginScreen } from './components/LoginScreen';
import { AlertTriangle, Database, CheckCircle2 } from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [authInitialized, setAuthInitialized] = useState(false);

  const [currentTab, setCurrentTab] = useState<ActiveTab>('caisse');
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [activeCashSession, setActiveCashSession] = useState<CashSession | null>(null);
  const [sessionsHistory, setSessionsHistory] = useState<CashSession[]>([]);

  const [activeReceiptSale, setActiveReceiptSale] = useState<Sale | null>(null);
  const [isCashModalOpen, setIsCashModalOpen] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [showStockAlertBanner, setShowStockAlertBanner] = useState(true);
  const [isFirebaseOnline, setIsFirebaseOnline] = useState(true);

  // 1. Listen to Firebase Authentication
  useEffect(() => {
    const unsubAuth = AuthService.subscribeToAuth((user) => {
      setCurrentUser(user);
      setAuthInitialized(true);
    });

    return () => unsubAuth();
  }, []);

  // 2. Check live Firebase Firestore connection
  useEffect(() => {
    StoreService.checkConnection().then(status => {
      setIsFirebaseOnline(status);
    });
  }, []);

  // 3. Connect real-time Firestore listeners when logged in
  useEffect(() => {
    if (!currentUser) return;

    // Real-time Products listener
    const unsubProducts = StoreService.subscribeToProducts((prods) => {
      setProducts(prods);
      setIsInitialLoading(false);
    });

    // Real-time Categories listener
    const unsubCategories = StoreService.subscribeToCategories((cats) => {
      setCategories(cats);
    });

    // Real-time Sales listener
    const unsubSales = StoreService.subscribeToSales((sls) => {
      setSales(sls);
    });

    // Real-time Purchases listener
    const unsubPurchases = StoreService.subscribeToPurchases((purs) => {
      setPurchases(purs);
    });

    // Real-time Cash sessions listener
    const unsubCash = StoreService.subscribeToCashSessions((sessions) => {
      setSessionsHistory(sessions);
      const active = sessions.find(s => s.statut === 'ouverte') || StoreService.getActiveSession();
      setActiveCashSession(active);
    });

    return () => {
      unsubProducts();
      unsubCategories();
      unsubSales();
      unsubPurchases();
      unsubCash();
    };
  }, [currentUser]);

  // Handle Logout
  const handleLogout = async () => {
    await AuthService.logout();
    setCurrentUser(null);
    setCurrentTab('caisse');
  };

  useEffect(() => {
    if (!currentUser) return;

    if (currentUser.role !== 'admin' && (currentTab === 'produits' || currentTab === 'approvisionnements' || currentTab === 'finance')) {
      setCurrentTab('caisse');
    }
  }, [currentUser, currentTab]);

  const salesForDisplay = currentUser && currentUser.role === 'admin'
    ? sales
    : sales.filter(sale => sale.vendeurId === currentUser?.uid);

  // Critical stock products count
  const criticalProducts = products.filter(p => p.stock <= 5 && p.actif);

  // Sale completed callback
  const handleSaleCompleted = (newSale: Sale) => {
    setSales(prev => [newSale, ...prev.filter(s => s.id !== newSale.id)]);
    setActiveReceiptSale(newSale);
  };

  // Refresh helper
  const handleRefresh = async () => {
    const [prods, cats, sls, purs, sessions] = await Promise.all([
      StoreService.loadInitialProducts(),
      StoreService.loadCategories(),
      StoreService.loadSales(),
      StoreService.loadPurchases(),
      StoreService.loadCashSessions()
    ]);
    setProducts(prods);
    setCategories(cats);
    setSales(sls);
    setPurchases(purs);
    setSessionsHistory(sessions);
  };

  // If Auth has not determined status yet and there is no cached user
  if (!authInitialized && !currentUser) {
    return (
      <div className="min-h-screen bg-[#070707] text-white flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 border-2 border-[#d4af37] border-t-transparent rounded-full animate-spin mb-4"></div>
        <h2 className="font-serif text-lg text-[#d4af37] font-semibold tracking-wide">
          MRS.B LUXURY BEAUTY
        </h2>
        <p className="text-xs text-gray-400 mt-1">Connexion à Firebase en cours...</p>
      </div>
    );
  }

  // If not logged in, render the dedicated Login & Registration screen
  if (!currentUser) {
    return (
      <LoginScreen
        onLoginSuccess={(user) => {
          setCurrentUser(user);
          setIsInitialLoading(false);
        }}
        isFirebaseOnline={isFirebaseOnline}
      />
    );
  }

  // Logged in UI
  return (
    <div className="min-h-screen bg-[#0b0b0b] text-[#fffdf8] flex flex-col selection:bg-[#d4af37]/30 selection:text-[#f1d477]">
      {/* Top Navigation */}
      <Navbar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        currentUser={currentUser}
        activeCashSession={activeCashSession}
        onOpenCashModal={() => setIsCashModalOpen(true)}
        onLogout={handleLogout}
        isFirebaseOnline={isFirebaseOnline}
      />

      {/* Database Connection Status Bar */}
      <div className="bg-[#111111] border-b border-[#202020] px-4 py-1 text-[11px] text-gray-400">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-gray-300">
              Base Firestore : <strong className="text-[#d4af37]">mrsbstock</strong> (Synchronisation en temps réel active)
            </span>
          </div>
          <div className="hidden sm:flex items-center gap-3">
            <span>Connecté en tant que : <strong className="text-white">{currentUser.nom}</strong> ({currentUser.email || currentUser.role})</span>
          </div>
        </div>
      </div>

      {/* Critical Stock Alert Banner (Étape 1 & Étape 7) */}
      {showStockAlertBanner && criticalProducts.length > 0 && (
        <div className="bg-amber-950/70 border-b border-amber-800/80 px-4 py-2 text-xs text-amber-200">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                <strong>Alerte Stock :</strong> {criticalProducts.length} produit(s) ont un stock faible ou épuisé (
                {criticalProducts.map(p => `${p.nom}: ${p.stock}`).join(', ')}).
              </span>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              {currentUser.role === 'admin' && (
                <button
                  onClick={() => setCurrentTab('approvisionnements')}
                  className="text-amber-400 hover:text-amber-300 underline font-semibold cursor-pointer"
                >
                  Réapprovisionner
                </button>
              )}
              <button
                onClick={() => setShowStockAlertBanner(false)}
                className="text-gray-400 hover:text-white text-xs px-1 cursor-pointer"
                title="Ignorer l'alerte"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {currentTab === 'caisse' && (
          <CaissePOS
            products={products}
            currentUser={currentUser}
            activeCashSession={activeCashSession}
            onSaleCompleted={handleSaleCompleted}
            onRefreshProducts={handleRefresh}
          />
        )}

        {currentUser.role === 'admin' && currentTab === 'produits' && (
          <ProductsManager
            products={products}
            categories={categories}
            onRefresh={handleRefresh}
          />
        )}

        {currentUser.role === 'admin' && currentTab === 'approvisionnements' && (
          <PurchasesManager
            products={products}
            purchases={purchases}
            currentUser={currentUser}
            onRefresh={handleRefresh}
          />
        )}

        {currentTab === 'historique' && (
          <SalesHistory
            sales={salesForDisplay}
            onViewReceipt={sale => setActiveReceiptSale(sale)}
          />
        )}

        {currentUser.role === 'admin' && currentTab === 'finance' && (
          <DashboardFinance
            sales={sales}
            purchases={purchases}
            products={products}
            onNavigateToStock={() => setCurrentTab('produits')}
            onNavigateToPurchases={() => setCurrentTab('approvisionnements')}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-[#1e1e1e] bg-[#0c0c0c] py-4 px-6 text-center text-xs text-gray-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>© {new Date().getFullYear()} MRS.B Luxury Beauty — Caisse Enregistreuse & Gestion de Stocks</p>
          <div className="flex items-center gap-4 text-[11px] text-gray-400">
            <span>Session : <strong className="text-[#d4af37]">{currentUser.role === 'admin' ? 'Administrateur' : 'Caisse'}</strong></span>
            <span>•</span>
            <span>{products.length} références</span>
            <span>•</span>
            <span>{sales.length} ventes</span>
            <span>•</span>
            <span className="flex items-center gap-1 text-emerald-400">
              <CheckCircle2 className="w-3 h-3" />
              Firebase Synchronisé
            </span>
          </div>
        </div>
      </footer>

      {/* Printable Receipt Modal (Étape 5) */}
      <ReceiptModal
        sale={activeReceiptSale}
        onClose={() => setActiveReceiptSale(null)}
      />

      {/* Cash Drawer Opening & Closing Modal (Étape 8) */}
      <CashRegisterModal
        activeSession={activeCashSession}
        sessionsHistory={sessionsHistory}
        currentUser={currentUser}
        isOpen={isCashModalOpen}
        onClose={() => setIsCashModalOpen(false)}
        onSessionUpdated={newSession => {
          setActiveCashSession(newSession);
        }}
      />
    </div>
  );
}
