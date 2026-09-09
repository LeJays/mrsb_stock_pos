export type UserRole = 'admin' | 'caisse';

export interface UserProfile {
  uid: string;
  nom: string;
  email: string;
  role: UserRole;
  createdAt?: string;
}

export interface Product {
  id: string;
  nom: string;
  categorie: string;
  prixAchat: number;
  prixVente: number;
  stock: number;
  unite: string;
  codeBarre?: string;
  actif: boolean;
  dateCreation: string;
}

export interface BasketItem {
  productId: string;
  produit: string;
  categorie: string;
  quantite: number;
  prix: number;
  unite: string;
  stockDisponible: number;
}

export type PaymentMethod = 'Cash' | 'Orange Money' | 'MTN MoMo' | 'Carte Bancaire';

export interface SaleItem {
  productId: string;
  produit: string;
  categorie: string;
  quantite: number;
  prix: number;
  totalLigne: number;
  unite?: string;
}

export interface Sale {
  id: string;
  ticketNumero: string;
  date: string;
  heure: string;
  vendeurId: string;
  vendeurNom: string;
  client: string;
  items: SaleItem[];
  sousTotal: number;
  remise: number;
  total: number;
  paiement: PaymentMethod;
  montantDonne: number;
  montantRendu: number;
  statut: 'validée' | 'annulée';
  timestamp?: any;
}

export interface Purchase {
  id: string;
  date: string;
  heure: string;
  fournisseur: string;
  produitId: string;
  produitNom: string;
  quantite: number;
  prixAchat: number;
  montantTotal: number;
  utilisateur: string;
  timestamp?: any;
}

export interface CashSession {
  id: string;
  date: string;
  heureOuverture: string;
  heureFermeture?: string;
  montantOuverture: number;
  montantVentesCash: number;
  montantRetrait: number;
  montantAttendu: number;
  montantCloture?: number;
  ecart?: number;
  statut: 'ouverte' | 'fermee';
  vendeurNom: string;
  notes?: string;
}

export interface Category {
  id: string;
  nom: string;
  description?: string;
}
