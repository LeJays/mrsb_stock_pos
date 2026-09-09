import React, { useState, useMemo } from 'react';
import { CashSession, UserProfile } from '../types';
import { 
  Vault, Lock, Unlock, DollarSign, ArrowDownRight, CheckCircle2, 
  AlertCircle, History, Clock, RefreshCw, X 
} from 'lucide-react';
import { StoreService } from '../services/store';

interface CashRegisterModalProps {
  activeSession: CashSession | null;
  sessionsHistory: CashSession[];
  currentUser: UserProfile;
  isOpen: boolean;
  onClose: () => void;
  onSessionUpdated: (session: CashSession | null) => void;
}

export const CashRegisterModal: React.FC<CashRegisterModalProps> = ({
  activeSession,
  sessionsHistory,
  currentUser,
  isOpen,
  onClose,
  onSessionUpdated
}) => {
  const [activeTab, setActiveTab] = useState<'current' | 'history'>('current');

  // Open register form
  const [openingAmount, setOpeningAmount] = useState<number | ''>(50000);
  const [openNotes, setOpenNotes] = useState('');

  // Close register form
  const [countedAmount, setCountedAmount] = useState<number | ''>('');
  const [closeNotes, setCloseNotes] = useState('');

  // Retrait form
  const [withdrawalAmount, setWithdrawalAmount] = useState<number | ''>('');
  const [withdrawalReason, setWithdrawalReason] = useState('');
  const [showWithdrawal, setShowWithdrawal] = useState(false);

  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  if (!isOpen) return null;

  // Handlers
  const handleOpenRegister = () => {
    setFeedbackMsg(null);
    const amount = Number(openingAmount) || 0;
    const now = new Date();

    const newSession: CashSession = {
      id: `session-${Date.now()}`,
      date: now.toLocaleDateString('fr-FR'),
      heureOuverture: now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      montantOuverture: amount,
      montantVentesCash: 0,
      montantRetrait: 0,
      montantAttendu: amount,
      statut: 'ouverte',
      vendeurNom: currentUser.nom,
      notes: openNotes
    };

    StoreService.saveActiveSession(newSession);
    onSessionUpdated(newSession);
    setFeedbackMsg({ text: `Caisse ouverte avec un fond initial de ${amount.toLocaleString()} FCFA.`, type: 'success' });
  };

  const handleWithdrawal = () => {
    if (!activeSession) return;
    const w = Number(withdrawalAmount) || 0;
    if (w <= 0) {
      setFeedbackMsg({ text: "Montant de retrait invalide.", type: 'error' });
      return;
    }
    if (w > activeSession.montantAttendu) {
      setFeedbackMsg({ text: "Le montant du retrait dépasse les fonds disponibles en caisse.", type: 'error' });
      return;
    }

    const updated: CashSession = {
      ...activeSession,
      montantRetrait: activeSession.montantRetrait + w,
      montantAttendu: activeSession.montantAttendu - w,
      notes: `${activeSession.notes || ''} | Retrait: ${w} F (${withdrawalReason || 'Sans motif'})`
    };

    StoreService.saveActiveSession(updated);
    onSessionUpdated(updated);
    setShowWithdrawal(false);
    setWithdrawalAmount('');
    setWithdrawalReason('');
    setFeedbackMsg({ text: `Décaissement de ${w.toLocaleString()} FCFA enregistré avec succès.`, type: 'success' });
  };

  const handleCloseRegister = () => {
    if (!activeSession) return;
    if (countedAmount === '' || Number(countedAmount) < 0) {
      setFeedbackMsg({ text: "Veuillez saisir le montant réel compté dans le tiroir-caisse.", type: 'error' });
      return;
    }

    const counted = Number(countedAmount);
    const expected = activeSession.montantAttendu;
    const ecart = counted - expected;
    const now = new Date();

    const closedSession: CashSession = {
      ...activeSession,
      heureFermeture: now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      montantCloture: counted,
      ecart,
      statut: 'fermee',
      notes: `${activeSession.notes || ''} | Clôture: ${closeNotes || 'Clôture de fin de journée'}`
    };

    StoreService.saveActiveSession(closedSession);
    onSessionUpdated(null); // Active session is closed
    setCountedAmount('');
    setCloseNotes('');
    setFeedbackMsg({
      text: `Caisse clôturée. Montant compté : ${counted.toLocaleString()} FCFA (Écart: ${ecart > 0 ? '+' : ''}${ecart.toLocaleString()} FCFA).`,
      type: 'success'
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-[#141414] border border-[#d4af37]/40 rounded-2xl shadow-[0_20px_70px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#181818] border-b border-[#282828]">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#d4af37]/10 border border-[#d4af37]/30 rounded-lg text-[#d4af37]">
              <Vault className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-wide">
                Gestion de Caisse & Tiroir
              </h3>
              <p className="text-[11px] text-[#a7a7a7]">
                Ouverture, clôture et contrôle des flux d'espèces MRS.B
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex bg-[#202020] rounded-lg p-0.5 border border-[#333] text-xs">
              <button
                onClick={() => setActiveTab('current')}
                className={`px-3 py-1.5 rounded-md font-medium transition ${
                  activeTab === 'current' ? 'bg-[#d4af37] text-black font-bold' : 'text-gray-400 hover:text-white'
                }`}
              >
                Session Active
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`px-3 py-1.5 rounded-md font-medium transition ${
                  activeTab === 'history' ? 'bg-[#d4af37] text-black font-bold' : 'text-gray-400 hover:text-white'
                }`}
              >
                Historique ({sessionsHistory.length})
              </button>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Feedback banner */}
          {feedbackMsg && (
            <div className={`p-3 rounded-lg text-xs flex items-center gap-2 ${
              feedbackMsg.type === 'success'
                ? 'bg-emerald-950/80 border border-emerald-800 text-emerald-300'
                : 'bg-rose-950/80 border border-rose-800 text-rose-300'
            }`}>
              {feedbackMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              <span>{feedbackMsg.text}</span>
            </div>
          )}

          {activeTab === 'current' ? (
            activeSession && activeSession.statut === 'ouverte' ? (
              /* ACTIVE REGISTER PANEL */
              <div className="space-y-5">
                <div className="flex items-center justify-between p-4 bg-emerald-950/30 border border-emerald-800/60 rounded-xl">
                  <div className="flex items-center gap-3">
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                    </span>
                    <div>
                      <h4 className="text-sm font-bold text-emerald-300">
                        Caisse Ouverte
                      </h4>
                      <p className="text-[11px] text-gray-400">
                        Depuis aujourd'hui à {activeSession.heureOuverture} par {activeSession.vendeurNom}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950 px-3 py-1 rounded-full border border-emerald-800">
                    Session active
                  </span>
                </div>

                {/* Balance breakdown */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 bg-[#181818] border border-[#282828] rounded-xl">
                    <span className="text-[10px] uppercase tracking-wider text-gray-400 block mb-1">
                      Fond Initial
                    </span>
                    <span className="text-base font-bold text-white font-mono">
                      {activeSession.montantOuverture.toLocaleString()} F
                    </span>
                  </div>

                  <div className="p-3 bg-[#181818] border border-[#282828] rounded-xl">
                    <span className="text-[10px] uppercase tracking-wider text-gray-400 block mb-1">
                      Ventes Espèces
                    </span>
                    <span className="text-base font-bold text-emerald-400 font-mono">
                      +{activeSession.montantVentesCash.toLocaleString()} F
                    </span>
                  </div>

                  <div className="p-3 bg-[#181818] border border-[#282828] rounded-xl">
                    <span className="text-[10px] uppercase tracking-wider text-gray-400 block mb-1">
                      Retraits / Dépenses
                    </span>
                    <span className="text-base font-bold text-rose-400 font-mono">
                      -{activeSession.montantRetrait.toLocaleString()} F
                    </span>
                  </div>

                  <div className="p-3 bg-gradient-to-br from-[#201b10] to-[#161616] border border-[#d4af37]/40 rounded-xl">
                    <span className="text-[10px] uppercase tracking-wider text-[#d4af37] block mb-1 font-semibold">
                      Total Théorique
                    </span>
                    <span className="text-lg font-black text-transparent bg-clip-text bg-gradient-to-r from-[#f1d477] to-[#d4af37] font-mono">
                      {activeSession.montantAttendu.toLocaleString()} F
                    </span>
                  </div>
                </div>

                {/* Withdrawal section */}
                <div className="p-4 bg-[#181818] border border-[#2a2a2a] rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ArrowDownRight className="w-4 h-4 text-rose-400" />
                      <h5 className="text-xs font-bold text-white uppercase tracking-wider">
                        Décaissement / Retrait Exceptionnel
                      </h5>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowWithdrawal(!showWithdrawal)}
                      className="text-xs text-[#d4af37] hover:underline"
                    >
                      {showWithdrawal ? 'Annuler' : '+ Effectuer un retrait'}
                    </button>
                  </div>

                  {showWithdrawal && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-[#262626]">
                      <div>
                        <label className="text-[11px] text-gray-400 block mb-1">Montant (FCFA)</label>
                        <input
                          type="number"
                          placeholder="5000"
                          value={withdrawalAmount}
                          onChange={e => setWithdrawalAmount(e.target.value === '' ? '' : Number(e.target.value))}
                          className="w-full px-3 py-1.5 bg-[#0e0e0e] border border-[#333] rounded-lg text-xs text-white outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-gray-400 block mb-1">Motif du retrait</label>
                        <input
                          type="text"
                          placeholder="Ex: Achat fournitures, taxi..."
                          value={withdrawalReason}
                          onChange={e => setWithdrawalReason(e.target.value)}
                          className="w-full px-3 py-1.5 bg-[#0e0e0e] border border-[#333] rounded-lg text-xs text-white outline-none"
                        />
                      </div>
                      <div className="flex items-end">
                        <button
                          type="button"
                          onClick={handleWithdrawal}
                          className="w-full py-2 bg-rose-900/80 hover:bg-rose-800 text-white font-bold text-xs rounded-lg transition"
                        >
                          Enregistrer Retrait
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Close register form */}
                <div className="p-4 bg-[#1a1711] border border-[#d4af37]/30 rounded-xl space-y-3">
                  <div className="flex items-center gap-2 text-[#d4af37]">
                    <Lock className="w-4 h-4" />
                    <h5 className="text-xs font-bold uppercase tracking-wider">
                      Clôture de Caisse (Fin de Journée)
                    </h5>
                  </div>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    Comptez les espèces physiquement présentes dans votre tiroir-caisse et saisissez le montant total ci-dessous.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium text-[#d4af37] block mb-1">
                        Montant Réel Compté (FCFA) *
                      </label>
                      <input
                        type="number"
                        placeholder="Ex: 92500"
                        value={countedAmount}
                        onChange={e => setCountedAmount(e.target.value === '' ? '' : Number(e.target.value))}
                        className="w-full px-3 py-2 bg-[#0e0e0e] border border-[#444] focus:border-[#d4af37] rounded-lg text-sm font-bold text-white outline-none font-mono"
                        id="countedCashInput"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-400 block mb-1">
                        Remarques de clôture (Optionnel)
                      </label>
                      <input
                        type="text"
                        placeholder="Ex: Tout est en ordre..."
                        value={closeNotes}
                        onChange={e => setCloseNotes(e.target.value)}
                        className="w-full px-3 py-2 bg-[#0e0e0e] border border-[#333] rounded-lg text-xs text-white outline-none"
                      />
                    </div>
                  </div>

                  {countedAmount !== '' && (
                    <div className="p-3 bg-[#111] rounded-lg flex items-center justify-between text-xs font-mono">
                      <span className="text-gray-400">Écart de caisse (Compté - Attendu) :</span>
                      {Number(countedAmount) - activeSession.montantAttendu === 0 ? (
                        <span className="font-bold text-emerald-400">0 FCFA (Caisse Parfaite)</span>
                      ) : Number(countedAmount) - activeSession.montantAttendu > 0 ? (
                        <span className="font-bold text-emerald-400">
                          +{(Number(countedAmount) - activeSession.montantAttendu).toLocaleString()} FCFA (Excédent)
                        </span>
                      ) : (
                        <span className="font-bold text-rose-400">
                          {(Number(countedAmount) - activeSession.montantAttendu).toLocaleString()} FCFA (Déficit)
                        </span>
                      )}
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={handleCloseRegister}
                    className="w-full py-2.5 bg-gradient-to-r from-amber-600 to-amber-700 hover:brightness-110 text-white font-bold text-xs uppercase tracking-wider rounded-lg shadow transition"
                    id="cloturerCaisseBtn"
                  >
                    Clôturer la Caisse & Verrouiller la Session
                  </button>
                </div>
              </div>
            ) : (
              /* OPEN REGISTER FORM */
              <div className="p-6 bg-[#181818] border border-[#2a2a2a] rounded-xl space-y-4 text-center max-w-md mx-auto">
                <div className="w-12 h-12 rounded-full bg-[#d4af37]/10 border border-[#d4af37]/30 text-[#d4af37] flex items-center justify-center mx-auto mb-2">
                  <Unlock className="w-6 h-6" />
                </div>
                <h4 className="text-base font-bold text-white">
                  Ouverture de Caisse
                </h4>
                <p className="text-xs text-gray-400">
                  Aucune session de caisse n'est active pour le moment. Veuillez spécifier le fond de caisse initial pour démarrer la journée.
                </p>

                <div className="text-left space-y-3 pt-2">
                  <div>
                    <label className="text-xs font-medium text-[#d4af37] block mb-1">
                      Fond de Caisse Initial (Espèces) *
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="1000"
                        value={openingAmount}
                        onChange={e => setOpeningAmount(e.target.value === '' ? '' : Number(e.target.value))}
                        className="w-full px-3 py-2 bg-[#0e0e0e] border border-[#333] focus:border-[#d4af37] rounded-lg text-sm font-bold text-white font-mono outline-none"
                        id="openingAmountInput"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500 font-mono">FCFA</span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {[20000, 30000, 50000, 100000].map(val => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setOpeningAmount(val)}
                        className="flex-1 py-1 text-[10px] bg-[#222] hover:bg-[#282828] text-gray-300 border border-[#333] rounded"
                      >
                        {val.toLocaleString()} F
                      </button>
                    ))}
                  </div>

                  <div>
                    <label className="text-xs font-medium text-gray-400 block mb-1">
                      Notes / Vendeur
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Fond remis par directrice..."
                      value={openNotes}
                      onChange={e => setOpenNotes(e.target.value)}
                      className="w-full px-3 py-2 bg-[#0e0e0e] border border-[#333] rounded-lg text-xs text-white outline-none"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleOpenRegister}
                  className="w-full py-3 bg-gradient-to-r from-[#d4af37] to-[#f1d477] hover:brightness-110 text-black font-bold text-xs uppercase tracking-wider rounded-xl shadow-[0_2px_15px_rgba(212,175,55,0.3)] transition"
                  id="ouvrirCaisseBtn"
                >
                  Ouvrir la Caisse & Commencer les Ventes
                </button>
              </div>
            )
          ) : (
            /* SESSIONS HISTORY */
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">
                Historique des Sessions de Caisse
              </h4>

              {sessionsHistory.length === 0 ? (
                <div className="py-8 text-center text-gray-500 text-xs">
                  Aucune session enregistrée dans l'historique.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {sessionsHistory.map(sess => (
                    <div
                      key={sess.id}
                      className="p-3.5 bg-[#181818] border border-[#282828] rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white">{sess.date}</span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                            sess.statut === 'ouverte'
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                              : 'bg-gray-800 text-gray-300'
                          }`}>
                            {sess.statut === 'ouverte' ? 'En cours' : 'Clôturée'}
                          </span>
                        </div>
                        <div className="text-[11px] text-gray-400 mt-1">
                          Ouvert à {sess.heureOuverture} par {sess.vendeurNom}
                          {sess.heureFermeture && ` • Fermé à ${sess.heureFermeture}`}
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-3 font-mono text-right">
                        <div>
                          <div className="text-[10px] text-gray-500">Ouverture</div>
                          <div className="text-gray-300">{sess.montantOuverture.toLocaleString()} F</div>
                        </div>
                        <div>
                          <div className="text-[10px] text-gray-500">Ventes Espèces</div>
                          <div className="text-emerald-400 font-semibold">+{sess.montantVentesCash.toLocaleString()} F</div>
                        </div>
                        <div>
                          <div className="text-[10px] text-gray-500">Montant Final</div>
                          <div className="text-[#d4af37] font-bold">
                            {(sess.montantCloture ?? sess.montantAttendu).toLocaleString()} F
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#181818] border-t border-[#252525] flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-[#252525] hover:bg-[#303030] text-gray-300 text-xs rounded-lg transition"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
