/**
 * Comprehensive Test Suite for FunPay Calculator Formulas
 */

const {
  ExchangerTariffs,
  roundToNine,
  calculateItemPrice,
  calculateWithdrawal
} = require('../www/js/calculator.js');

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ FAIL: ${message}`);
    process.exit(1);
  } else {
    console.log(`✅ PASS: ${message}`);
  }
}

console.log('--- Testing Exchanger Tariffs (Buy) ---');
assert(ExchangerTariffs.getBuyFeeRate(25) === 0.059, 'Buy fee for $25 should be 5.9%');
assert(ExchangerTariffs.getBuyFeeRate(50) === 0.059, 'Buy fee for $50 should be 5.9%');
assert(ExchangerTariffs.getBuyFeeRate(100) === 0.044, 'Buy fee for $100 should be 4.4%');
assert(ExchangerTariffs.getBuyFeeRate(150) === 0.034, 'Buy fee for $150 should be 3.4%');
assert(ExchangerTariffs.getBuyFeeRate(300) === 0.029, 'Buy fee for $300 should be 2.9%');
assert(ExchangerTariffs.getBuyFeeRate(450) === 0.024, 'Buy fee for $450 should be 2.4%');
assert(ExchangerTariffs.getBuyFeeRate(800) === 0.019, 'Buy fee for $800 should be 1.9%');
assert(ExchangerTariffs.getBuyFeeRate(2000) === 0.009, 'Buy fee for $2000 should be 0.9%');
assert(ExchangerTariffs.getBuyFeeRate(5000) === 0.0, 'Buy fee for $5000 should be 0.0%');

console.log('--- Testing Exchanger Tariffs (Cashout) ---');
assert(ExchangerTariffs.getOutFeeRate(50) === 0.032, 'Out fee for $50 should be 3.2%');
assert(ExchangerTariffs.getOutFeeRate(100) === 0.032, 'Out fee for $100 should be 3.2%');
assert(ExchangerTariffs.getOutFeeRate(250) === 0.024, 'Out fee for $250 should be 2.4%');
assert(ExchangerTariffs.getOutFeeRate(750) === 0.019, 'Out fee for $750 should be 1.9%');
assert(ExchangerTariffs.getOutFeeRate(1500) === 0.018, 'Out fee for $1500 should be 1.8%');

console.log('--- Testing Rounding to 9 ---');
assert(roundToNine(148) === 149, '148 -> 149');
assert(roundToNine(149) === 149, '149 -> 149');
assert(roundToNine(150) === 159, '150 -> 159');
assert(roundToNine(141) === 149, '141 -> 149');

console.log('--- Testing Tab 1: Item Price Calculation ---');
const priceRes = calculateItemPrice({
  purchasePrice: 0.75,
  batchVolume: 100,
  roiMultiplier: 2.0,
  usdRubRate: 82.78,
  cashoutRoute: 'route_ton',
  fpSaleFeeRate: 0.06,
  fpOutFeeRate: 0.02,
  fpFixedOutFeeUsd: 1.50,
  buyFixedFeeUsd: 1.00
});

console.log('Price USD:', priceRes.priceUsd.toFixed(2));
console.log('Price RUB:', priceRes.priceRub.toFixed(1));
console.log('Price RUB 9:', priceRes.priceRubRounded9);
console.log('Net Profit RUB:', priceRes.netProfitRub.toFixed(1));
console.log('Net Profit USD:', priceRes.netProfitUsd.toFixed(2));
console.log('Markup %:', priceRes.markupPercent.toFixed(1));

assert(priceRes.priceUsd > 1.5 && priceRes.priceUsd < 2.2, 'Price USD in expected range');
assert(priceRes.priceRub > 130 && priceRes.priceRub < 180, 'Price RUB in expected range');
assert(priceRes.netProfitRub > 50, 'Net profit RUB > 50');
assert(priceRes.breakdown.batchCount > 130, 'Batch items count ~133');

console.log('--- Testing Tab 2: Withdrawal Calculation ---');
const withRes = calculateWithdrawal({
  amount: 10000,
  currency: 'RUB',
  usdRubRate: 82.78,
  cashoutRoute: 'route_ton',
  fpOutFeeRate: 0.02,
  fpFixedOutFeeUsd: 1.50
});

console.log('Withdrawal Input USD:', withRes.wUsd.toFixed(2));
console.log('After FP (U1):', withRes.u1.toFixed(2));
console.log('After Swap (U2):', withRes.u2.toFixed(2));
console.log('Net USD Received:', withRes.netUsd.toFixed(2));
console.log('Net RUB Received:', withRes.netRub.toFixed(1));
console.log('Total Deductions RUB:', withRes.totalDeductionsRub.toFixed(1));
console.log('Loss %:', withRes.lossPercent.toFixed(1));

assert(withRes.wUsd > 120, 'Withdrawal USD normalized correctly');
assert(withRes.u1 < withRes.wUsd, 'FunPay fee deducted');
assert(withRes.u2 < withRes.u1, 'CryptoBot swap fee deducted');
assert(withRes.netUsd < withRes.u2, 'Cashout fee deducted');
assert(withRes.netRub > 8500 && withRes.netRub < 9500, 'Net RUB received in expected range');

console.log('\n🎉 ALL TESTS PASSED SUCCESSFULLY!');
