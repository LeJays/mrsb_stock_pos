import React, { useRef } from 'react';
import { Sale } from '../types';
import { Printer, X, CheckCircle, Sparkles } from 'lucide-react';
import { Logo } from './Logo';

interface ReceiptModalProps {
  sale: Sale | null;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ sale, onClose }) => {
  const receiptRef = useRef<HTMLDivElement>(null);

  if (!sale) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto animate-fadeIn">
      <div className="relative w-full max-w-md bg-[#121212] border border-[#d4af37]/40 rounded-xl shadow-[0_20px_60px_rgba(0,0,0,0.8)] overflow-hidden my-6">
        {/* Top actions bar */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-[#181818] border-b border-[#282828]">
          <div className="flex items-center gap-2 text-[#d4af37] text-xs font-semibold uppercase tracking-wider">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <span>Vente Enregistrée</span>
          </div>
          <div className="flex items-center gap-2 print:hidden">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#d4af37] hover:bg-[#f1d477] text-black font-semibold text-xs rounded-md shadow transition"
              id="printReceiptBtn"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimer Ticket</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-[#a7a7a7] hover:text-white hover:bg-white/10 rounded-md transition"
              title="Fermer"
              id="closeReceiptBtn"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Ticket Area */}
        <div className="p-6 text-[#1a1a1a] bg-white print:p-0" ref={receiptRef} id="printableReceipt">
          <div className="max-w-[340px] mx-auto font-mono text-xs leading-relaxed">
            {/* Header */}
            <div className="text-center pb-3 border-b border-dashed border-gray-400">
              <div className="flex justify-center mb-1">
                <Logo size="sm" showSlogan={false} />
              </div>
              <h2 className="text-sm font-bold tracking-widest uppercase font-serif text-gray-900 mt-1">
                MRS.B LUXURY BEAUTY
              </h2>
              <p className="text-[10px] text-gray-600 tracking-wider">
                SOYEZ VOTRE STANDARD DE BEAUTÉ
              </p>
              <p className="text-[9px] text-gray-500 mt-1">
                Tél : +225 07 00 00 00 / Abidjan, Côte d'Ivoire
              </p>
            </div>

            {/* Ticket Info */}
            <div className="py-2.5 border-b border-dashed border-gray-300 text-[11px] space-y-1">
              <div className="flex justify-between">
                <span className="text-gray-500">Ticket N° :</span>
                <span className="font-bold text-gray-900">{sale.ticketNumero || sale.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Date & Heure :</span>
                <span>{sale.date} à {sale.heure}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Vendeur :</span>
                <span>{sale.vendeurNom || 'Caisse'}</span>
              </div>
              {sale.client && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Client :</span>
                  <span className="font-medium text-gray-900">{sale.client}</span>
                </div>
              )}
            </div>

            {/* Items Table */}
            <div className="py-3 border-b border-dashed border-gray-300">
              <div className="grid grid-cols-12 font-bold text-[10px] uppercase text-gray-600 pb-1 mb-1 border-b border-gray-200">
                <span className="col-span-6">Article</span>
                <span className="col-span-2 text-center">Qté</span>
                <span className="col-span-4 text-right">Total</span>
              </div>
              <div className="space-y-1.5 py-1">
                {sale.items.map((it, idx) => (
                  <div key={idx} className="grid grid-cols-12 text-[11px]">
                    <div className="col-span-6 leading-tight">
                      <div className="font-medium text-gray-900">{it.produit}</div>
                      <div className="text-[9px] text-gray-500">{it.prix.toLocaleString()} FCFA</div>
                    </div>
                    <div className="col-span-2 text-center text-gray-700">x{it.quantite}</div>
                    <div className="col-span-4 text-right font-medium text-gray-900">
                      {it.totalLigne.toLocaleString()} F
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Totals Breakdown */}
            <div className="py-3 border-b-2 border-gray-900 space-y-1 text-xs">
              {sale.remise > 0 && (
                <div className="flex justify-between text-gray-600">
                  <span>Sous-total :</span>
                  <span>{sale.sousTotal.toLocaleString()} FCFA</span>
                </div>
              )}
              {sale.remise > 0 && (
                <div className="flex justify-between text-rose-600 font-medium">
                  <span>Remise accordée :</span>
                  <span>-{sale.remise.toLocaleString()} FCFA</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-black text-gray-900 pt-1">
                <span>TOTAL NET :</span>
                <span>{sale.total.toLocaleString()} FCFA</span>
              </div>
            </div>

            {/* Payment Details */}
            <div className="py-2.5 border-b border-dashed border-gray-300 text-[11px] space-y-1">
              <div className="flex justify-between">
                <span className="text-gray-600">Mode de paiement :</span>
                <span className="font-bold text-gray-900 uppercase">{sale.paiement}</span>
              </div>
              {sale.paiement === 'Cash' && (
                <>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Montant remis :</span>
                    <span>{sale.montantDonne.toLocaleString()} FCFA</span>
                  </div>
                  <div className="flex justify-between font-bold text-gray-900">
                    <span>Monnaie rendue :</span>
                    <span>{sale.montantRendu.toLocaleString()} FCFA</span>
                  </div>
                </>
              )}
            </div>

            {/* Footer */}
            <div className="pt-3 text-center text-[9px] text-gray-500 space-y-1">
              <p className="font-medium text-gray-700">
                Merci pour votre confiance & votre fidélité !
              </p>
              <p>Les articles vendus ne sont ni repris ni échangés.</p>
              <div className="flex justify-center items-center gap-1 text-[#b89524] pt-1">
                <Sparkles className="w-2.5 h-2.5" />
                <span className="font-serif italic text-[10px]">Mrs. B Beauty — Sublimez-vous</span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Bottom Actions */}
        <div className="p-4 bg-[#151515] border-t border-[#252525] flex justify-end gap-3 print:hidden">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs text-[#a7a7a7] hover:text-white bg-[#222] hover:bg-[#2c2c2c] border border-[#333] rounded-lg transition"
          >
            Fermer
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-5 py-2 text-xs font-bold text-black bg-gradient-to-r from-[#d4af37] to-[#f1d477] hover:brightness-110 rounded-lg shadow-[0_2px_10px_rgba(212,175,55,0.3)] transition"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimer le Reçu</span>
          </button>
        </div>
      </div>
    </div>
  );
};
