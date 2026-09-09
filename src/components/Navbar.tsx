import React from 'react';
import { UserProfile, CashSession } from '../types';
import { 
  ShoppingBag, Package, Truck, History, TrendingUp, Vault, 
  UserCheck, Shield, ChevronDown, RefreshCw, LogOut, Database 
} from 'lucide-react';
import { Logo } from './Logo';

export type ActiveTab = 'caisse' | 'produits' | 'approvisionnements' | 'historique' | 'finance';

interface NavbarProps {
  currentTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  currentUser: UserProfile;
  activeCashSession: CashSession | null;
  onOpenCashModal: () => void;
  onLogout?: () => void;
  isFirebaseOnline?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  currentUser,
  activeCashSession,
  onOpenCashModal,
  onLogout,
  isFirebaseOnline = true
}) => {
  const isAdmin = currentUser.role === 'admin';

  return (
    <header className="sticky top-0 z-40 bg-[#0b0b0b]/95 backdrop-blur-md border-b border-[#242424] shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 gap-4">
          {/* Brand Logo */}
          <div className="cursor-pointer shrink-0" onClick={() => onSelectTab('caisse')}>
            <Logo size="md" />
          </div>

          {/* Center Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-1 bg-[#141414] p-1 rounded-xl border border-[#242424]">
            <button
              onClick={() => onSelectTab('caisse')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition ${
                currentTab === 'caisse'
                  ? 'bg-[#d4af37] text-black shadow-sm'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
              id="navTabCaisse"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Caisse POS</span>
            </button>

            {isAdmin && (
              <button
                onClick={() => onSelectTab('produits')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition ${
                  currentTab === 'produits'
                    ? 'bg-[#d4af37] text-black shadow-sm'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
                id="navTabProduits"
              >
                <Package className="w-4 h-4" />
                <span>Produits & Stock</span>
              </button>
            )}

            {isAdmin && (
              <button
                onClick={() => onSelectTab('approvisionnements')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition ${
                  currentTab === 'approvisionnements'
                    ? 'bg-[#d4af37] text-black shadow-sm'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
                id="navTabApprovisionnements"
              >
                <Truck className="w-4 h-4" />
                <span>Approvisionnements</span>
              </button>
            )}

            <button
              onClick={() => onSelectTab('historique')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition ${
                currentTab === 'historique'
                  ? 'bg-[#d4af37] text-black shadow-sm'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
              id="navTabHistorique"
            >
              <History className="w-4 h-4" />
              <span>Historique Ventes</span>
            </button>

            {isAdmin && (
              <button
                onClick={() => onSelectTab('finance')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition ${
                  currentTab === 'finance'
                    ? 'bg-[#d4af37] text-black shadow-sm'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
                id="navTabFinance"
              >
                <TrendingUp className="w-4 h-4" />
                <span>Finance & Dashboard</span>
              </button>
            )}
          </nav>

          {/* Right Action: Cash Drawer Status & Role Profile */}
          <div className="flex items-center gap-2.5">
            {/* Cash Drawer Button */}
            <button
              onClick={onOpenCashModal}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs transition ${
                activeCashSession && activeCashSession.statut === 'ouverte'
                  ? 'bg-emerald-950/40 border-emerald-800/80 text-emerald-300 hover:bg-emerald-900/50'
                  : 'bg-rose-950/40 border-rose-800/80 text-rose-300 hover:bg-rose-900/50'
              }`}
              title="Gérer le tiroir-caisse et la session journalière"
              id="cashDrawerNavBtn"
            >
              <Vault className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">
                {activeCashSession && activeCashSession.statut === 'ouverte'
                  ? `Caisse : ${activeCashSession.montantAttendu.toLocaleString()} F`
                  : 'Caisse Fermée'}
              </span>
              <span className="sm:hidden">
                {activeCashSession && activeCashSession.statut === 'ouverte' ? 'Ouverte' : 'Fermée'}
              </span>
            </button>

            <div className="flex items-center gap-2 px-3 py-1.5 bg-[#181818] border border-[#303030] rounded-lg text-xs">
              {isAdmin ? (
                <Shield className="w-3.5 h-3.5 text-[#d4af37]" />
              ) : (
                <UserCheck className="w-3.5 h-3.5 text-blue-400" />
              )}
              <div className="text-left hidden lg:block leading-tight">
                <div className="text-[10px] text-gray-400 font-medium">Session Active</div>
                <div className="text-white font-semibold flex items-center gap-1">
                  <span className="max-w-[120px] truncate">{currentUser.nom}</span>
                  <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase ${
                    isAdmin ? 'bg-[#d4af37]/20 text-[#d4af37]' : 'bg-blue-900/40 text-blue-300'
                  }`}>
                    {currentUser.role}
                  </span>
                </div>
              </div>
              <span className="lg:hidden text-xs font-bold uppercase text-[#d4af37]">
                {currentUser.role}
              </span>
            </div>

            {/* Logout Button */}
            {onLogout && (
              <button
                onClick={onLogout}
                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[#181818] hover:bg-rose-950/40 border border-[#2b2b2b] hover:border-rose-700/60 rounded-lg text-xs text-gray-400 hover:text-rose-300 transition"
                title="Se déconnecter de la session"
                id="logoutBtn"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden xl:inline">Déconnexion</span>
              </button>
            )}
          </div>
        </div>

        {/* Mobile Navigation Tabs (visible on small screens) */}
        <div className="md:hidden flex items-center justify-between gap-1 overflow-x-auto py-2.5 border-t border-[#1f1f1f] text-xs">
          <button
            onClick={() => onSelectTab('caisse')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap font-medium ${
              currentTab === 'caisse' ? 'bg-[#d4af37] text-black font-bold' : 'text-gray-400'
            }`}
          >
            Caisse POS
          </button>
          {isAdmin && (
            <button
              onClick={() => onSelectTab('produits')}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap font-medium ${
                currentTab === 'produits' ? 'bg-[#d4af37] text-black font-bold' : 'text-gray-400'
              }`}
            >
              Produits
            </button>
          )}
          {isAdmin && (
            <button
              onClick={() => onSelectTab('approvisionnements')}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap font-medium ${
                currentTab === 'approvisionnements' ? 'bg-[#d4af37] text-black font-bold' : 'text-gray-400'
              }`}
            >
              Achats
            </button>
          )}
          <button
            onClick={() => onSelectTab('historique')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap font-medium ${
              currentTab === 'historique' ? 'bg-[#d4af37] text-black font-bold' : 'text-gray-400'
            }`}
          >
            Ventes
          </button>
          {isAdmin && (
            <button
              onClick={() => onSelectTab('finance')}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap font-medium ${
                currentTab === 'finance' ? 'bg-[#d4af37] text-black font-bold' : 'text-gray-400'
              }`}
            >
              Dashboard
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
