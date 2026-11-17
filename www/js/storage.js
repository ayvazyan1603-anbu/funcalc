/**
 * FunPay Calculator - Local Persistence
 * Saves settings, currency rates, routes, and price list items
 */

const STORAGE_KEY = 'funpay_calc_v1_data';

const DEFAULT_SETTINGS = {
  activeTab: 'tab-price',
  usdRubRate: 82.78,

  // Tab 1: Price calculation
  purchasePrice: 0.75,
  batchVolume: 100,
  roiMultiplier: 2.0,
  customRoi: '',
  cashoutRoute: 'route_ton', // 'route_ton' | 'route_direct' | 'route_p2p'
  fpSaleFeeRate: 0.06,
  fpOutFeeRate: 0.02,
  fpFixedOutFeeUsd: 1.50,
  buyFixedFeeUsd: 1.00,
  isSettingsOpen: false,

  // Tab 2: Withdrawal
  withdrawalAmount: 10000,
  withdrawalCurrency: 'RUB', // 'RUB' | 'USD'

  // Tab 3: Price List Items
  priceList: [
    { id: '1', name: 'Telegram Premium 1 мес', purchasePrice: 1.85 },
    { id: '2', name: 'Discord Nitro Basic 1 мес', purchasePrice: 0.95 },
    { id: '3', name: 'Discord Nitro Full 1 мес', purchasePrice: 2.90 },
    { id: '4', name: 'Steam Wallet 100 TRY', purchasePrice: 3.10 },
    { id: '5', name: 'ChatGPT Plus (аккаунт)', purchasePrice: 14.50 },
    { id: '6', name: 'Xbox Game Pass Ultimate', purchasePrice: 4.80 }
  ]
};

const AppStorage = {
  get() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return { ...DEFAULT_SETTINGS };
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_SETTINGS, ...parsed };
    } catch (e) {
      console.warn('Storage read failed:', e);
      return { ...DEFAULT_SETTINGS };
    }
  },

  set(updates) {
    try {
      const current = this.get();
      const next = { ...current, ...updates };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    } catch (e) {
      console.error('Storage write failed:', e);
      return this.get();
    }
  },

  reset() {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.error('Storage reset failed:', e);
    }
    return { ...DEFAULT_SETTINGS };
  },

  // Price List helpers
  addPriceItem(item) {
    const data = this.get();
    const newItem = {
      id: Date.now().toString(),
      name: item.name.trim(),
      purchasePrice: Number(item.purchasePrice) || 0.75
    };
    data.priceList = [newItem, ...(data.priceList || [])];
    this.set({ priceList: data.priceList });
    return newItem;
  },

  updatePriceItem(id, updates) {
    const data = this.get();
    data.priceList = (data.priceList || []).map(it => {
      if (it.id === id) {
        return {
          ...it,
          ...updates,
          purchasePrice: Number(updates.purchasePrice !== undefined ? updates.purchasePrice : it.purchasePrice)
        };
      }
      return it;
    });
    this.set({ priceList: data.priceList });
    return data.priceList;
  },

  deletePriceItem(id) {
    const data = this.get();
    data.priceList = (data.priceList || []).filter(it => it.id !== id);
    this.set({ priceList: data.priceList });
    return data.priceList;
  }
};
