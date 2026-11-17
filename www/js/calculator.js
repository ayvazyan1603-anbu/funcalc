/**
 * FunPay Calculator - Math Engine & Exchanger Tariffs
 * Accurate formulas according to specification
 */

const ExchangerTariffs = {
  // @BitcoinOperator purchase tariffs (Вход k_buy)
  getBuyFeeRate(amount) {
    const s = Number(amount) || 0;
    if (s <= 0) return 0.059;
    if (s <= 50) return 0.059;   // +5.9%
    if (s <= 100) return 0.044;  // +4.4%
    if (s <= 200) return 0.034;  // +3.4%
    if (s <= 400) return 0.029;  // +2.9%
    if (s <= 500) return 0.024;  // +2.4%
    if (s <= 1000) return 0.019; // +1.9%
    if (s <= 3000) return 0.009; // +0.9%
    return 0.0;                  // 0%
  },

  // @BitcoinOperator cashout tariffs (Выход k_out)
  getOutFeeRate(amount) {
    const s = Number(amount) || 0;
    if (s <= 100) return 0.032;  // -3.2%
    if (s <= 500) return 0.024;  // -2.4%
    if (s <= 1000) return 0.019; // -1.9%
    return 0.018;                // -1.8%
  },

  // Inverse lookup of k_out given target net received
  getOutFeeRateForNet(targetNet, route) {
    if (route === 'route_p2p') return 0.01;
    // Brackets:
    // s <= 100: net <= 100 * (1 - 0.032) = 96.8
    // s <= 500: net <= 500 * (1 - 0.024) = 488.0
    // s <= 1000: net <= 1000 * (1 - 0.019) = 981.0
    if (targetNet <= 96.8) return 0.032;
    if (targetNet <= 488.0) return 0.024;
    if (targetNet <= 981.0) return 0.019;
    return 0.018;
  }
};

/**
 * Psychological FunPay price rounded to end in 9
 * e.g. 148 -> 149, 149 -> 149, 150 -> 159
 */
function roundToNine(priceRub) {
  const rounded = Math.ceil(Number(priceRub) || 0);
  if (rounded <= 0) return 9;
  const lastDigit = rounded % 10;
  if (lastDigit === 9) return rounded;
  if (lastDigit < 9) {
    return rounded + (9 - lastDigit);
  }
  return rounded + 9;
}

/**
 * Format currency with proper separators
 */
function formatRub(val, decimals = 1) {
  const num = Number(val) || 0;
  return num.toLocaleString('ru-RU', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
}

function formatUsd(val, decimals = 2) {
  const num = Number(val) || 0;
  return num.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
}

function formatPercent(val, decimals = 1) {
  const num = Number(val) || 0;
  return num.toFixed(decimals) + '%';
}

/**
 * Tab 1: Calculate Item Selling Price on FunPay
 */
function calculateItemPrice(params) {
  const P = Math.max(0.0001, Number(params.purchasePrice) || 0.75);
  const B = Math.max(1, Number(params.batchVolume) || 100);
  const K = Math.max(1.0, Number(params.roiMultiplier) || 2.0);
  const rateRub = Math.max(1, Number(params.usdRubRate) || 82.78);
  const route = params.cashoutRoute || 'route_ton';

  const kFpSale = Number(params.fpSaleFeeRate) || 0.06;
  const kFpOut = Number(params.fpOutFeeRate) || 0.02;
  const fFpOut = Number(params.fpFixedOutFeeUsd) || 1.50;
  const fBuy = Number(params.buyFixedFeeUsd) || 1.00;

  // 1. Quantity in batch
  const N = B / P;

  // 2. Buy fee rate and total initial capital required
  const kBuy = ExchangerTariffs.getBuyFeeRate(B);
  const cTotal = B * (1 + kBuy) + fBuy;
  const cPerItem = cTotal / N;

  // 3. Target Net sum in hand
  const targetNet = cTotal * K;

  // 4. Fees for cashout
  let kSwap = 0;
  let kOut = 0;

  if (route === 'route_ton') {
    kSwap = 0.0075;
    kOut = ExchangerTariffs.getOutFeeRateForNet(targetNet, route);
  } else if (route === 'route_direct') {
    kSwap = 0;
    kOut = ExchangerTariffs.getOutFeeRateForNet(targetNet, route);
  } else if (route === 'route_p2p') {
    kSwap = 0;
    kOut = 0.01;
  }

  // After FunPay withdrawal: needed USDT reaching CryptoBot / exchanger
  const afterFpOut = targetNet / ((1 - kSwap) * (1 - kOut));

  // 5. FunPay balance needed before withdrawal fee
  const afterFpSale = (afterFpOut + fFpOut) / (1 - kFpOut);

  // 6. FunPay gross listing price for the whole batch
  const fpGross = afterFpSale / (1 - kFpSale);

  // 7. Per-item prices
  const priceUsd = fpGross / N;
  const priceRub = priceUsd * rateRub;
  const priceRubRounded9 = roundToNine(priceRub);

  // Profit metrics
  const targetNetProfitUsd = targetNet - cTotal;
  const netProfitUsd = targetNetProfitUsd / N;
  const netProfitRub = netProfitUsd * rateRub;
  const markupPercent = ((priceUsd / P) - 1) * 100;
  const roiActual = (netProfitUsd / cPerItem) * 100;

  // Waterfall breakdown per 1 item
  const breakdown = {
    supplierItemUsd: P,
    supplierItemRub: P * rateRub,

    exchangerBuyFeeUsd: (B * kBuy) / N,
    exchangerBuyFeePercent: kBuy * 100,

    buyNetworkFeeUsd: fBuy / N,

    totalCostItemUsd: cPerItem,
    totalCostItemRub: cPerItem * rateRub,

    listingPriceUsd: priceUsd,
    listingPriceRub: priceRub,
    listingPriceRub9: priceRubRounded9,

    fpSaleFeeUsd: (fpGross * kFpSale) / N,
    fpSaleFeePercent: kFpSale * 100,

    fpOutFeeUsd: (afterFpSale * kFpOut) / N,
    fpOutFeePercent: kFpOut * 100,

    fpFixedOutFeeUsd: fFpOut / N,

    swapFeeUsd: route === 'route_ton' ? (afterFpOut * kSwap) / N : 0,
    swapFeePercent: route === 'route_ton' ? 0.75 : 0,

    cashoutFeeUsd: (afterFpOut * (1 - kSwap) * kOut) / N,
    cashoutFeePercent: kOut * 100,

    netProfitUsd: netProfitUsd,
    netProfitRub: netProfitRub,
    markupPercent: markupPercent,
    roiMultiplier: K,

    batchVolume: B,
    batchCount: N,
    kBuy: kBuy,
    kOut: kOut,
    kSwap: kSwap
  };

  return {
    priceUsd,
    priceRub,
    priceRubRounded9,
    netProfitUsd,
    netProfitRub,
    markupPercent,
    roiActual,
    breakdown,
    N,
    cTotal,
    cPerItem,
    targetNet,
    kBuy,
    kOut
  };
}

/**
 * Tab 2: Calculate Withdrawal Net Received
 */
function calculateWithdrawal(params) {
  const enteredAmount = Math.max(0, Number(params.amount) || 0);
  const currency = params.currency || 'RUB'; // 'RUB' or 'USD'
  const rateRub = Math.max(1, Number(params.usdRubRate) || 82.78);
  const route = params.cashoutRoute || 'route_ton';

  const kFpOut = Number(params.fpOutFeeRate) || 0.02;
  const fFpOut = Number(params.fpFixedOutFeeUsd) || 1.50;

  // 1. Normalizing to USD and RUB
  let wUsd = 0;
  let wRub = 0;

  if (currency === 'RUB') {
    wRub = enteredAmount;
    wUsd = enteredAmount / rateRub;
  } else {
    wUsd = enteredAmount;
    wRub = enteredAmount * rateRub;
  }

  // 2. FunPay withdrawal in USDT TRC20: U1 = max(0, W_usd * (1 - k_fp_out) - F_fp_out)
  const fpPercentFeeUsd = wUsd * kFpOut;
  const fpFixedFeeUsd = wUsd > 0 ? fFpOut : 0;
  const totalFpFeeUsd = fpPercentFeeUsd + fpFixedFeeUsd;
  const u1 = Math.max(0, wUsd - totalFpFeeUsd);

  // 3. Swap USDT -> TON in CryptoBot (0.75% if route_ton)
  let kSwap = 0;
  let swapFeeUsd = 0;
  let u2 = u1;

  if (route === 'route_ton') {
    kSwap = 0.0075;
    swapFeeUsd = u1 * kSwap;
    u2 = u1 - swapFeeUsd;
  }

  // 4. Cashout fee
  let kOut = 0;
  if (route === 'route_p2p') {
    kOut = 0.01;
  } else {
    kOut = ExchangerTariffs.getOutFeeRate(u2);
  }

  const cashoutFeeUsd = u2 * kOut;
  const netUsd = Math.max(0, u2 - cashoutFeeUsd);
  const netRub = netUsd * rateRub;

  // Deductions summary
  const totalDeductionsUsd = Math.max(0, wUsd - netUsd);
  const totalDeductionsRub = totalDeductionsUsd * rateRub;
  const lossPercent = wUsd > 0 ? (totalDeductionsUsd / wUsd) * 100 : 0;

  // Minimum threshold warning ($20)
  const isBelowMin = wUsd > 0 && (wUsd < 20 || u2 < 20);

  return {
    wUsd,
    wRub,
    u1,
    u2,
    netUsd,
    netRub,
    totalDeductionsUsd,
    totalDeductionsRub,
    lossPercent,
    isBelowMin,
    route,
    tariffs: {
      kFpOut,
      fFpOut,
      fpPercentFeeUsd,
      fpFixedFeeUsd,
      totalFpFeeUsd,
      kSwap,
      swapFeeUsd,
      kOut,
      cashoutFeeUsd
    }
  };
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    ExchangerTariffs,
    roundToNine,
    formatRub,
    formatUsd,
    formatPercent,
    calculateItemPrice,
    calculateWithdrawal
  };
}
