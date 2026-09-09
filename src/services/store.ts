import { 
  collection, doc, getDocs, setDoc, updateDoc, deleteDoc, addDoc, 
  query, orderBy, serverTimestamp, onSnapshot, getDocFromServer 
} from 'firebase/firestore';
import { db } from '../firebase';
import { Product, Sale, Purchase, CashSession, Category } from '../types';

export class StoreService {
  static async checkConnection(): Promise<boolean> {
    try {
      await getDocFromServer(doc(db, 'system', 'ping'));
      return true;
    } catch (e: any) {
      if (e?.code === 'unavailable' || e?.message?.includes('offline')) {
        return false;
      }
      return true;
    }
  }

  static subscribeToProducts(onData: (products: Product[]) => void): () => void {
    const colRef = collection(db, 'products');
    const unsub = onSnapshot(colRef, (snapshot) => {
      const list: Product[] = [];
      snapshot.forEach(d => {
        list.push({ id: d.id, ...d.data() } as Product);
      });
      onData(list);
    }, (error) => {
      console.warn('Products snapshot error:', error);
      onData([]);
    });

    return unsub;
  }

  static subscribeToCategories(onData: (categories: Category[]) => void): () => void {
    const colRef = collection(db, 'categories');
    const unsub = onSnapshot(colRef, (snapshot) => {
      if (!snapshot.empty) {
        const list: Category[] = [];
        snapshot.forEach(d => {
          list.push({ id: d.id, ...d.data() } as Category);
        });
        onData(list);
      } else {
        onData([]);
      }
    }, (error) => {
      console.warn('Categories snapshot error:', error);
      onData([]);
    });

    return unsub;
  }

  static subscribeToSales(onData: (sales: Sale[]) => void): () => void {
    const q = query(collection(db, 'sales'), orderBy('date', 'desc'));
    const unsub = onSnapshot(q, (snapshot) => {
      const list: Sale[] = [];
      snapshot.forEach(d => {
        list.push({ id: d.id, ...d.data() } as Sale);
      });
      onData(list);
    }, (error) => {
      console.warn('Sales snapshot error:', error);
      onData([]);
    });

    return unsub;
  }

  static subscribeToPurchases(onData: (purchases: Purchase[]) => void): () => void {
    const q = query(collection(db, 'purchases'), orderBy('date', 'desc'));
    const unsub = onSnapshot(q, (snapshot) => {
      const list: Purchase[] = [];
      snapshot.forEach(d => {
        list.push({ id: d.id, ...d.data() } as Purchase);
      });
      onData(list);
    }, (error) => {
      console.warn('Purchases snapshot error:', error);
      onData([]);
    });

    return unsub;
  }

  static subscribeToCashSessions(onData: (sessions: CashSession[]) => void): () => void {
    const colRef = collection(db, 'cash_register');
    const unsub = onSnapshot(colRef, (snapshot) => {
      const list: CashSession[] = [];
      snapshot.forEach(d => {
        list.push({ id: d.id, ...d.data() } as CashSession);
      });
      onData(list);
    }, (error) => {
      console.warn('Cash register snapshot error:', error);
      onData([]);
    });

    return unsub;
  }

  static async loadInitialProducts(): Promise<Product[]> {
    try {
      const snap = await getDocs(collection(db, 'products'));
      const list: Product[] = [];
      snap.forEach(d => {
        list.push({ id: d.id, ...d.data() } as Product);
      });
      return list;
    } catch (err) {
      console.warn('Firestore products load error:', err);
      return [];
    }
  }

  static async saveProduct(prod: Omit<Product, 'id'>, existingId?: string): Promise<Product> {
    const id = existingId || `prod-${Date.now()}`;
    const productData: Product = {
      ...prod,
      id,
      dateCreation: prod.dateCreation || new Date().toISOString(),
      actif: prod.actif !== undefined ? prod.actif : true
    };

    await setDoc(doc(db, 'products', id), {
      nom: productData.nom,
      categorie: productData.categorie,
      prixAchat: Number(productData.prixAchat || 0),
      prixVente: Number(productData.prixVente || 0),
      stock: Number(productData.stock || 0),
      unite: productData.unite,
      codeBarre: productData.codeBarre || '',
      actif: productData.actif,
      dateCreation: productData.dateCreation
    });

    return productData;
  }

  static async deleteProduct(id: string): Promise<void> {
    await deleteDoc(doc(db, 'products', id));
  }

  static async updateProductStock(id: string, newStock: number): Promise<void> {
    await updateDoc(doc(db, 'products', id), { stock: Number(newStock) });
  }

  static async loadCategories(): Promise<Category[]> {
    try {
      const snap = await getDocs(collection(db, 'categories'));
      const list: Category[] = [];
      snap.forEach(d => {
        list.push({ id: d.id, ...d.data() } as Category);
      });
      return list;
    } catch (err) {
      console.warn('Firestore categories load error:', err);
      return [];
    }
  }

  static async saveCategory(cat: Omit<Category, 'id'>): Promise<Category> {
    const categoryName = cat.nom.trim();
    if (!categoryName) {
      throw new Error('Le nom de la catégorie est requis.');
    }

    const id = `cat-${Date.now()}`;
    const newCat: Category = { id, nom: categoryName, description: cat.description || '' };
    await setDoc(doc(db, 'categories', id), {
      nom: newCat.nom,
      description: newCat.description || ''
    });
    return newCat;
  }

  static async deleteCategory(id: string): Promise<void> {
    await deleteDoc(doc(db, 'categories', id));
  }

  static async loadSales(): Promise<Sale[]> {
    try {
      const snap = await getDocs(query(collection(db, 'sales'), orderBy('date', 'desc')));
      const list: Sale[] = [];
      snap.forEach(d => {
        list.push({ id: d.id, ...d.data() } as Sale);
      });
      return list;
    } catch (err) {
      console.warn('Firestore sales load error:', err);
      return [];
    }
  }

  static async createSale(sale: Omit<Sale, 'id'>): Promise<Sale> {
    const id = `sale-${Date.now()}`;
    const newSale: Sale = { ...sale, id };

    await setDoc(doc(db, 'sales', id), {
      ...newSale,
      timestamp: serverTimestamp()
    });

    await addDoc(collection(db, 'sorties'), {
      saleId: id,
      date: newSale.date,
      heure: newSale.heure,
      client: newSale.client,
      vendeurNom: newSale.vendeurNom,
      vendeurId: newSale.vendeurId,
      paiement: newSale.paiement,
      montantDonne: newSale.montantDonne,
      montantRendu: newSale.montantRendu,
      total: newSale.total,
      montant: newSale.total,
      items: newSale.items,
      timestamp: serverTimestamp()
    });

    return newSale;
  }

  static async loadPurchases(): Promise<Purchase[]> {
    try {
      const snap = await getDocs(collection(db, 'purchases'));
      const list: Purchase[] = [];
      snap.forEach(d => {
        list.push({ id: d.id, ...d.data() } as Purchase);
      });
      return list;
    } catch (err) {
      console.warn('Firestore purchases load error:', err);
      return [];
    }
  }

  static async createPurchase(purchase: Omit<Purchase, 'id'>): Promise<Purchase> {
    const id = `pur-${Date.now()}`;
    const newPurchase: Purchase = { ...purchase, id };

    await setDoc(doc(db, 'purchases', id), {
      ...newPurchase,
      timestamp: serverTimestamp()
    });

    await addDoc(collection(db, 'entrees'), {
      purchaseId: id,
      date: newPurchase.date,
      heure: newPurchase.heure,
      categorie: 'Approvisionnement',
      produitNom: newPurchase.produitNom,
      quantite: newPurchase.quantite,
      montant: newPurchase.montantTotal,
      fournisseur: newPurchase.fournisseur,
      auteur: newPurchase.utilisateur,
      timestamp: serverTimestamp()
    });

    return newPurchase;
  }

  static async loadCashSessions(): Promise<CashSession[]> {
    try {
      const snap = await getDocs(collection(db, 'cash_register'));
      const list: CashSession[] = [];
      snap.forEach(d => {
        list.push({ id: d.id, ...d.data() } as CashSession);
      });
      return list;
    } catch (err) {
      console.warn('Firestore cash sessions load error:', err);
      return [];
    }
  }

  static getActiveSession(): CashSession | null {
    return null;
  }

  static saveActiveSession(session: CashSession | null): void {
    if (!session) return;
    setDoc(doc(db, 'cash_register', session.id), session).catch(err => {
      console.warn('Firestore save session error:', err);
    });
  }
}
