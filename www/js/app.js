/**
 * FunPay Calculator - Main Application Controller
 * Handles UI interactions, math rendering, haptics, clipboard, and synchronization
 */

document.addEventListener('DOMContentLoaded', () => {
  // Application State initialized from Storage
  let state = AppStorage.get();

  // Elements: Header & Toast
  const toastEl = document.getElementById('toast');
  const headerRateDisplay = document.getElementById('headerRateDisplay');
  const btnEditRate = document.getElementById('btnEditRate');

  // Elements: Tab Navigation
  const navItems = document.querySelectorAll('.bottom-nav .nav-item');
  const tabViews = document.querySelectorAll('.tab-view');

  // Elements: Tab 1 (Price Calculation)
  const resPriceUsd = document.getElementById('resPriceUsd');
  const resPriceRub = document.getElementById('resPriceRub');
  const resPriceRub9 = document.getElementById('resPriceRub9');
  const resMarkupPercent = document.getElementById('resMarkupPercent');
  const resNetProfit = document.getElementById('resNetProfit');
  const btnCopyPriceRub = document.getElementById('btnCopyPriceRub');

  const inputPurchasePrice = document.getElementById('inputPurchasePrice');
  const inputUsdRate = document.getElementById('inputUsdRate');
  const btnResetRate = document.getElementById('btnResetRate');

  const chipGrid = document.querySelectorAll('.chip-grid .chip-btn[data-multiplier]');
  const inputCustomRoi = document.getElementById('inputCustomRoi');
  const presetMultiplierBadge = document.getElementById('presetMultiplierBadge');

  const accordionSettings = document.getElementById('accordionSettings');
  const btnToggleSettings = document.getElementById('btnToggleSettings');
  const accordionSummaryText = document.getElementById('accordionSummaryText');
  const sliderBatchVolume = document.getElementById('sliderBatchVolume');
  const inputBatchVolume = document.getElementById('inputBatchVolume');
  const batchTariffBadge = document.getElementById('batchTariffBadge');
  const cashoutRouteRadios = document.querySelectorAll('input[name="cashoutRoute"]');

  const inputFpSaleFee = document.getElementById('inputFpSaleFee');
  const inputFpOutFee = document.getElementById('inputFpOutFee');
  const inputFpFixedOutFee = document.getElementById('inputFpFixedOutFee');
  const inputBuyFixedFee = document.getElementById('inputBuyFixedFee');
  const btnResetSettings = document.getElementById('btnResetSettings');

  const unitWaterfallList = document.getElementById('unitWaterfallList');
  const breakdownBatchSummary = document.getElementById('breakdownBatchSummary');

  // Elements: Tab 2 (Withdrawal)
  const resWithdrawUsd = document.getElementById('resWithdrawUsd');
  const resWithdrawRub = document.getElementById('resWithdrawRub');
  const resWithdrawLost = document.getElementById('resWithdrawLost');
  const withdrawMinWarning = document.getElementById('withdrawMinWarning');
  const btnCopyWithdrawRub = document.getElementById('btnCopyWithdrawRub');

  const inputWithdrawAmount = document.getElementById('inputWithdrawAmount');
  const withdrawCurrencyToggle = document.getElementById('withdrawCurrencyToggle');
  const withdrawCurSymbol = document.getElementById('withdrawCurSymbol');
  const withdrawCurCode = document.getElementById('withdrawCurCode');
  const withdrawChipGrid = document.getElementById('withdrawChipGrid');
  const withdrawRouteRadios = document.querySelectorAll('input[name="withdrawRoute"]');
  const withdrawLiveTariffBadge = document.getElementById('withdrawLiveTariffBadge');
  const withdrawWaterfallList = document.getElementById('withdrawWaterfallList');

  // Elements: Tab 3 (Price List)
  const catalogSearchInput = document.getElementById('catalogSearchInput');
  const btnOpenAddModal = document.getElementById('btnOpenAddModal');
  const catalogRateInfo = document.getElementById('catalogRateInfo');
  const catalogRoiInfo = document.getElementById('catalogRoiInfo');
  const catalogBatchInfo = document.getElementById('catalogBatchInfo');
  const catalogItemsList = document.getElementById('catalogItemsList');

  // Modal elements
  const addItemModal = document.getElementById('addItemModal');
  const btnCloseAddModal = document.getElementById('btnCloseAddModal');
  const btnCancelAddModal = document.getElementById('btnCancelAddModal');
  const addItemForm = document.getElementById('addItemForm');
  const newItemName = document.getElementById('newItemName');
  const newItemCost = document.getElementById('newItemCost');
  const modalCalcPriceRub = document.getElementById('modalCalcPriceRub');
  const modalCalcProfitRub = document.getElementById('modalCalcProfitRub');

  /* ==========================================================================
     Utility: Haptic Feedback & Toast
     ========================================================================== */
  function triggerHaptic(type = 'light') {
    try {
      if ('vibrate' in navigator) {
        if (type === 'success') {
          navigator.vibrate([20, 30, 40]);
        } else {
          navigator.vibrate(30);
        }
      }
    } catch (e) {
      // Ignore vibration errors
    }
  }

  let toastTimeout = null;
  function showToast(message, isSuccess = true) {
    if (!toastEl) return;
    triggerHaptic(isSuccess ? 'success' : 'light');
    toastEl.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="${isSuccess ? '#34d399' : '#38bdf8'}" stroke-width="2.5">
        <path d="M20 6L9 17l-5-5"/>
      </svg>
      <span>${message}</span>
    `;
    toastEl.classList.add('show');
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
      toastEl.classList.remove('show');
    }, 2200);
  }

  function copyToClipboard(text, notifyText) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        showToast(notifyText);
      }).catch(() => {
        fallbackCopy(text, notifyText);
      });
    } else {
      fallbackCopy(text, notifyText);
    }
  }

  function fallbackCopy(text, notifyText) {
    const input = document.createElement('textarea');
    input.value = text;
    document.body.appendChild(input);
    input.select();
    try {
      document.execCommand('copy');
      showToast(notifyText);
    } catch (err) {
      showToast('Не удалось скопировать', false);
    }
    document.body.removeChild(input);
  }

  /* ==========================================================================
     Tab Navigation Controller
     ========================================================================== */
  function switchTab(tabId) {
    state.activeTab = tabId;
    AppStorage.set({ activeTab: tabId });

    navItems.forEach(item => {
      const isTarget = item.getAttribute('data-tab') === tabId;
      item.classList.toggle('active', isTarget);
    });

    tabViews.forEach(view => {
      const isTarget = view.id === tabId;
      view.classList.toggle('active', isTarget);
    });

    triggerHaptic('light');

    if (tabId === 'tab-price') {
      renderTabPrice();
    } else if (tabId === 'tab-withdraw') {
      renderTabWithdraw();
    } else if (tabId === 'tab-catalog') {
      renderTabCatalog();
    }
  }

  navItems.forEach(item => {
    item.addEventListener('click', () => {
      const tabId = item.getAttribute('data-tab');
      switchTab(tabId);
    });
  });

  /* ==========================================================================
     Global Currency Rate Controller
     ========================================================================== */
  function updateGlobalRate(newRate) {
    const rate = Math.max(1, Number(newRate) || 82.78);
    state.usdRubRate = rate;
    AppStorage.set({ usdRubRate: rate });

    headerRateDisplay.textContent = `${formatRub(rate, 2)} ₽`;
    if (document.activeElement !== inputUsdRate) {
      inputUsdRate.value = rate;
    }

    // Refresh whichever tab is active
    renderTabPrice();
    renderTabWithdraw();
    renderTabCatalog();
  }

  btnEditRate.addEventListener('click', () => {
    switchTab('tab-price');
    inputUsdRate.focus();
    inputUsdRate.select();
  });

  btnResetRate.addEventListener('click', () => {
    updateGlobalRate(82.78);
    showToast('Курс сброшен на 82.78 ₽');
  });

  inputUsdRate.addEventListener('input', (e) => {
    const val = parseFloat(e.target.value);
    if (!isNaN(val) && val > 0) {
      updateGlobalRate(val);
    }
  });

  /* ==========================================================================
     TAB 1: Price Calculation Controller
     ========================================================================== */
  function getTabPriceParams() {
    return {
      purchasePrice: parseFloat(inputPurchasePrice.value) || 0.75,
      batchVolume: parseFloat(inputBatchVolume.value) || 100,
      roiMultiplier: parseFloat(state.roiMultiplier) || 2.0,
      usdRubRate: parseFloat(state.usdRubRate) || 82.78,
      cashoutRoute: state.cashoutRoute || 'route_ton',
      fpSaleFeeRate: (parseFloat(inputFpSaleFee.value) || 6.0) / 100,
      fpOutFeeRate: (parseFloat(inputFpOutFee.value) || 2.0) / 100,
      fpFixedOutFeeUsd: parseFloat(inputFpFixedOutFee.value) || 1.50,
      buyFixedFeeUsd: parseFloat(inputBuyFixedFee.value) || 1.00
    };
  }

  function renderTabPrice() {
    const params = getTabPriceParams();
    const result = calculateItemPrice(params);
    const { breakdown } = result;

    // Sticky Top Result Card
    const exactRub = Math.round(result.priceRub);
    const rounded9Rub = result.priceRubRounded9;
    resPriceUsd.textContent = `$${formatUsd(result.priceUsd, 2)}`;
    resPriceRub.textContent = `${exactRub} ₽`;
    resPriceRub9.textContent = `${rounded9Rub} ₽`;

    resMarkupPercent.textContent = `+${formatPercent(result.markupPercent, 1)}`;
    resNetProfit.textContent = `+${formatRub(result.netProfitRub, 1)} ₽ ($${formatUsd(result.netProfitUsd, 2)})`;

    // Copy Button Binding
    btnCopyPriceRub.onclick = () => {
      copyToClipboard(`${rounded9Rub}`, `Скопировано: ${rounded9Rub} ₽`);
    };

    // Live Badge on Batch
    const buyFeePct = (result.kBuy * 100).toFixed(1);
    const outFeePct = (result.kOut * 100).toFixed(1);
    batchTariffBadge.textContent = `Вход: +${buyFeePct}% / Выход: -${outFeePct}%`;

    // Accordion summary text
    let routeLabel = 'TON CryptoBot';
    if (params.cashoutRoute === 'route_direct') routeLabel = 'USDT Прямой';
    if (params.cashoutRoute === 'route_p2p') routeLabel = 'CryptoBot P2P';
    accordionSummaryText.textContent = `Партия ${params.batchVolume} USDT • ${routeLabel}`;

    // Render Unit Loss Breakdown Waterfall
    breakdownBatchSummary.textContent = `партия ~${Math.round(result.N)} шт.`;
    renderUnitWaterfall(breakdown, params.usdRubRate);
  }

  function renderUnitWaterfall(bd, rateRub) {
    const rows = [
      {
        sign: '•',
        signClass: '',
        title: 'Закуп у поставщика',
        usd: bd.supplierItemUsd,
        rub: bd.supplierItemRub,
        isBold: false
      },
      {
        sign: '+',
        signClass: 'minus',
        title: `Комиссия закупа USDT (+${formatPercent(bd.exchangerBuyFeePercent, 1)})`,
        usd: bd.exchangerBuyFeeUsd,
        rub: bd.exchangerBuyFeeUsd * rateRub
      },
      {
        sign: '+',
        signClass: 'minus',
        title: 'Доля фикс. сети закупа USDT ($1.00)',
        usd: bd.buyNetworkFeeUsd,
        rub: bd.buyNetworkFeeUsd * rateRub
      },
      {
        sign: '=',
        signClass: 'eq',
        title: 'Себестоимость 1 шт.',
        usd: bd.totalCostItemUsd,
        rub: bd.totalCostItemRub,
        isBold: true
      },
      {
        sign: '★',
        signClass: 'eq',
        title: 'Цена выставления на FunPay (брутто)',
        usd: bd.listingPriceUsd,
        rub: bd.listingPriceRub,
        isBold: true
      },
      {
        sign: '−',
        signClass: 'minus',
        title: `Комиссия продажи FunPay (-${formatPercent(bd.fpSaleFeePercent, 1)})`,
        usd: bd.fpSaleFeeUsd,
        rub: bd.fpSaleFeeUsd * rateRub
      },
      {
        sign: '−',
        signClass: 'minus',
        title: `Комиссия вывода FunPay (-${formatPercent(bd.fpOutFeePercent, 1)})`,
        usd: bd.fpOutFeeUsd,
        rub: bd.fpOutFeeUsd * rateRub
      },
      {
        sign: '−',
        signClass: 'minus',
        title: 'Доля фикс. сети вывода FunPay ($1.50)',
        usd: bd.fpFixedOutFeeUsd,
        rub: bd.fpFixedOutFeeUsd * rateRub
      }
    ];

    if (bd.swapFeeUsd > 0) {
      rows.push({
        sign: '−',
        signClass: 'minus',
        title: 'Своп CryptoBot USDT → TON (-0.75%)',
        usd: bd.swapFeeUsd,
        rub: bd.swapFeeUsd * rateRub
      });
    }

    rows.push({
      sign: '−',
      signClass: 'minus',
      title: `Комиссия обналичивания (-${formatPercent(bd.cashoutFeePercent, 1)})`,
      usd: bd.cashoutFeeUsd,
      rub: bd.cashoutFeeUsd * rateRub
    });

    rows.push({
      sign: '✓',
      signClass: 'plus',
      title: 'Чистая прибыль на руки с 1 шт.',
      usd: bd.netProfitUsd,
      rub: bd.netProfitRub,
      isBold: true,
      isResult: true
    });

    unitWaterfallList.innerHTML = rows.map(r => `
      <div class="waterfall-row ${r.isResult ? 'positive total-result' : ''}">
        <div class="wf-left">
          <span class="wf-sign ${r.signClass}">${r.sign}</span>
          <span class="wf-title" style="${r.isBold ? 'font-weight: 700; color: #fff;' : ''}">${r.title}</span>
        </div>
        <div class="wf-right">
          <span class="wf-val-rub" style="${r.isResult ? 'color: #34d399; font-size: 14px;' : ''}">
            ${r.isResult ? '+' : ''}${formatRub(r.rub, 1)} ₽
          </span>
          <span class="wf-val-usd">$${formatUsd(r.usd, 3)}</span>
        </div>
      </div>
    `).join('');
  }

  // Inputs Event Listeners for Tab 1
  inputPurchasePrice.addEventListener('input', () => {
    state.purchasePrice = parseFloat(inputPurchasePrice.value) || 0.75;
    AppStorage.set({ purchasePrice: state.purchasePrice });
    renderTabPrice();
  });

  // Preset Chips
  chipGrid.forEach(btn => {
    btn.addEventListener('click', () => {
      const mul = parseFloat(btn.getAttribute('data-multiplier'));
      state.roiMultiplier = mul;
      state.customRoi = '';
      inputCustomRoi.value = '';
      AppStorage.set({ roiMultiplier: mul, customRoi: '' });

      chipGrid.forEach(c => c.classList.remove('active'));
      btn.classList.add('active');
      presetMultiplierBadge.textContent = `Цель: x${mul.toFixed(1)}`;
      triggerHaptic('light');
      renderTabPrice();
      renderTabCatalog();
    });
  });

  inputCustomRoi.addEventListener('input', (e) => {
    const val = parseFloat(e.target.value);
    if (!isNaN(val) && val >= 1.0) {
      state.roiMultiplier = val;
      state.customRoi = val;
      AppStorage.set({ roiMultiplier: val, customRoi: val });
      chipGrid.forEach(c => c.classList.remove('active'));
      presetMultiplierBadge.textContent = `Цель: x${val.toFixed(1)}`;
      renderTabPrice();
      renderTabCatalog();
    }
  });

  // Batch Volume Slider & Input sync
  function setBatchVolume(val) {
    const num = Math.max(1, Math.min(10000, Number(val) || 100));
    sliderBatchVolume.value = Math.min(2000, num);
    inputBatchVolume.value = num;
    state.batchVolume = num;
    AppStorage.set({ batchVolume: num });
    renderTabPrice();
    renderTabCatalog();
  }

  sliderBatchVolume.addEventListener('input', (e) => setBatchVolume(e.target.value));
  inputBatchVolume.addEventListener('input', (e) => setBatchVolume(e.target.value));

  // Accordion Toggle
  btnToggleSettings.addEventListener('click', () => {
    const isOpen = accordionSettings.classList.toggle('open');
    state.isSettingsOpen = isOpen;
    AppStorage.set({ isSettingsOpen: isOpen });
    triggerHaptic('light');
  });

  // Cashout Route Selection
  function syncCashoutRoute(route) {
    state.cashoutRoute = route;
    AppStorage.set({ cashoutRoute: route });

    cashoutRouteRadios.forEach(r => r.checked = (r.value === route));
    withdrawRouteRadios.forEach(r => r.checked = (r.value === route));

    renderTabPrice();
    renderTabWithdraw();
  }

  cashoutRouteRadios.forEach(r => {
    r.addEventListener('change', (e) => {
      syncCashoutRoute(e.target.value);
      triggerHaptic('light');
    });
  });

  // Fine-grained Fees
  [inputFpSaleFee, inputFpOutFee, inputFpFixedOutFee, inputBuyFixedFee].forEach(el => {
    el.addEventListener('input', () => {
      AppStorage.set({
        fpSaleFeeRate: (parseFloat(inputFpSaleFee.value) || 6.0) / 100,
        fpOutFeeRate: (parseFloat(inputFpOutFee.value) || 2.0) / 100,
        fpFixedOutFeeUsd: parseFloat(inputFpFixedOutFee.value) || 1.50,
        buyFixedFeeUsd: parseFloat(inputBuyFixedFee.value) || 1.00
      });
      renderTabPrice();
      renderTabWithdraw();
    });
  });

  btnResetSettings.addEventListener('click', () => {
    inputFpSaleFee.value = '6.0';
    inputFpOutFee.value = '2.0';
    inputFpFixedOutFee.value = '1.50';
    inputBuyFixedFee.value = '1.00';
    setBatchVolume(100);
    syncCashoutRoute('route_ton');
    showToast('Настройки комиссий сброшены');
  });

  /* ==========================================================================
     TAB 2: Withdrawal Controller
     ========================================================================== */
  function renderWithdrawChips(currency) {
    const rubAmounts = [3000, 5000, 10000, 25000];
    const usdAmounts = [50, 100, 200, 500];
    const amounts = currency === 'RUB' ? rubAmounts : usdAmounts;

    withdrawChipGrid.innerHTML = amounts.map(amt => `
      <button class="chip-btn" data-amt="${amt}">
        ${currency === 'RUB' ? formatRub(amt, 0) + ' ₽' : '$' + amt}
      </button>
    `).join('');

    withdrawChipGrid.querySelectorAll('.chip-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const amt = btn.getAttribute('data-amt');
        inputWithdrawAmount.value = amt;
        state.withdrawalAmount = parseFloat(amt);
        AppStorage.set({ withdrawalAmount: state.withdrawalAmount });
        triggerHaptic('light');
        renderTabWithdraw();
      });
    });
  }

  function setWithdrawCurrency(cur) {
    state.withdrawalCurrency = cur;
    AppStorage.set({ withdrawalCurrency: cur });

    const isRub = cur === 'RUB';
    withdrawCurSymbol.textContent = isRub ? '₽' : '$';
    withdrawCurCode.textContent = isRub ? 'RUB' : 'USDT';

    withdrawCurrencyToggle.querySelectorAll('.cur-btn').forEach(b => {
      b.classList.toggle('active', b.getAttribute('data-cur') === cur);
    });

    renderWithdrawChips(cur);
    renderTabWithdraw();
  }

  withdrawCurrencyToggle.querySelectorAll('.cur-btn').forEach(b => {
    b.addEventListener('click', () => {
      setWithdrawCurrency(b.getAttribute('data-cur'));
      triggerHaptic('light');
    });
  });

  withdrawRouteRadios.forEach(r => {
    r.addEventListener('change', (e) => {
      syncCashoutRoute(e.target.value);
      triggerHaptic('light');
    });
  });

  inputWithdrawAmount.addEventListener('input', () => {
    state.withdrawalAmount = parseFloat(inputWithdrawAmount.value) || 0;
    AppStorage.set({ withdrawalAmount: state.withdrawalAmount });
    renderTabWithdraw();
  });

  function renderTabWithdraw() {
    const params = {
      amount: parseFloat(inputWithdrawAmount.value) || 0,
      currency: state.withdrawalCurrency || 'RUB',
      usdRubRate: parseFloat(state.usdRubRate) || 82.78,
      cashoutRoute: state.cashoutRoute || 'route_ton',
      fpOutFeeRate: (parseFloat(inputFpOutFee.value) || 2.0) / 100,
      fpFixedOutFeeUsd: parseFloat(inputFpFixedOutFee.value) || 1.50
    };

    const res = calculateWithdrawal(params);

    // Sticky Top Result Card
    const netRubExact = Math.round(res.netRub);
    resWithdrawRub.textContent = `${formatRub(netRubExact, 0)} ₽`;
    resWithdrawUsd.textContent = `$${formatUsd(res.netUsd, 2)}`;

    resWithdrawLost.textContent = `-${formatRub(res.totalDeductionsRub, 0)} ₽ (-$${formatUsd(res.totalDeductionsUsd, 2)} | ${formatPercent(res.lossPercent, 1)})`;

    // Copy Button Binding
    btnCopyWithdrawRub.onclick = () => {
      copyToClipboard(`${netRubExact}`, `Скопировано: ${netRubExact} ₽`);
    };

    // Warning Badge for < $20
    withdrawMinWarning.classList.toggle('hidden', !res.isBelowMin);

    // Live Exchanger Tariff Badge
    const outFeePct = (res.tariffs.kOut * 100).toFixed(1);
    withdrawLiveTariffBadge.textContent = state.cashoutRoute === 'route_p2p' ? 'CryptoBot P2P: -1.0%' : `Обменник: -${outFeePct}%`;

    // Waterfall checklist
    renderWithdrawWaterfall(res, params.usdRubRate);
  }

  function renderWithdrawWaterfall(res, rateRub) {
    const t = res.tariffs;
    const rows = [
      {
        sign: '•',
        signClass: '',
        title: 'Исходная сумма на балансе FunPay',
        usd: res.wUsd,
        rub: res.wRub,
        isBold: true
      },
      {
        sign: '−',
        signClass: 'minus',
        title: `Комиссия вывода FunPay (${(t.kFpOut * 100).toFixed(1)}% + $${t.fFpOut.toFixed(2)})`,
        usd: t.totalFpFeeUsd,
        rub: t.totalFpFeeUsd * rateRub,
        sub: `Остаток: $${formatUsd(res.u1, 2)} (USDT TRC20)`
      }
    ];

    if (t.swapFeeUsd > 0) {
      rows.push({
        sign: '−',
        signClass: 'minus',
        title: 'Своп в TON через CryptoBot (0.75%)',
        usd: t.swapFeeUsd,
        rub: t.swapFeeUsd * rateRub,
        sub: `Остаток: $${formatUsd(res.u2, 2)} в TON`
      });
    }

    rows.push({
      sign: '−',
      signClass: 'minus',
      title: state.cashoutRoute === 'route_p2p' ? 'P2P-маркет CryptoBot (1.0%)' : `Комиссия обналичивания (-${(t.kOut * 100).toFixed(1)}%)`,
      usd: t.cashoutFeeUsd,
      rub: t.cashoutFeeUsd * rateRub
    });

    rows.push({
      sign: '=',
      signClass: 'plus',
      title: 'Итого чистыми на карту / счёт',
      usd: res.netUsd,
      rub: res.netRub,
      isBold: true,
      isResult: true
    });

    withdrawWaterfallList.innerHTML = rows.map(r => `
      <div class="waterfall-row ${r.isResult ? 'positive total-result' : ''}">
        <div class="wf-left">
          <span class="wf-sign ${r.signClass}">${r.sign}</span>
          <div style="display: flex; flex-direction: column;">
            <span class="wf-title" style="${r.isBold ? 'font-weight: 700; color: #fff;' : ''}">${r.title}</span>
            ${r.sub ? `<span style="font-size: 10.5px; color: #38bdf8; font-family: var(--font-mono);">${r.sub}</span>` : ''}
          </div>
        </div>
        <div class="wf-right">
          <span class="wf-val-rub" style="${r.isResult ? 'color: #34d399; font-size: 14px;' : ''}">
            ${formatRub(r.rub, 1)} ₽
          </span>
          <span class="wf-val-usd">$${formatUsd(r.usd, 2)}</span>
        </div>
      </div>
    `).join('');
  }

  /* ==========================================================================
     TAB 3: Price List (Catalog) Controller
     ========================================================================== */
  function renderTabCatalog() {
    catalogRateInfo.textContent = `${formatRub(state.usdRubRate, 2)} ₽`;
    catalogRoiInfo.textContent = `x${Number(state.roiMultiplier || 2.0).toFixed(1)}`;
    catalogBatchInfo.textContent = `${state.batchVolume || 100}$`;

    const filterText = (catalogSearchInput.value || '').trim().toLowerCase();
    const items = state.priceList || [];
    const filtered = items.filter(it => it.name.toLowerCase().includes(filterText));

    const calcParams = getTabPriceParams();

    if (filtered.length === 0) {
      catalogItemsList.innerHTML = `
        <div style="text-align: center; padding: 40px 10px; color: var(--text-muted); font-size: 14px;">
          ${filterText ? 'Ничего не найдено по вашему запросу' : 'Прайс-лист пуст. Добавьте свой первый товар!'}
        </div>
      `;
      return;
    }

    catalogItemsList.innerHTML = filtered.map(item => {
      const itemParams = { ...calcParams, purchasePrice: item.purchasePrice };
      const res = calculateItemPrice(itemParams);
      const exactRub = Math.round(res.priceRub);
      const rounded9 = res.priceRubRounded9;

      return `
        <div class="catalog-card" data-id="${item.id}">
          <div class="catalog-item-header">
            <div class="catalog-item-title">${escapeHtml(item.name)}</div>
            <div class="catalog-item-actions">
              <button class="btn-action-icon copy-item-price" title="Скопировать цену ₽" data-price="${rounded9}">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                </svg>
              </button>
              <button class="btn-action-icon delete delete-item-btn" title="Удалить товар" data-id="${item.id}">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M3 6h18"/>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                </svg>
              </button>
            </div>
          </div>

          <div class="catalog-item-body">
            <div class="catalog-price-group">
              <span class="catalog-price-main">${exactRub} ₽</span>
              <span class="catalog-price-round" title="По 9">${rounded9} ₽</span>
              <span style="font-size: 11px; color: var(--text-muted); font-family: var(--font-mono);">($${formatUsd(res.priceUsd, 2)})</span>
            </div>

            <div class="catalog-profit-group">
              <span class="catalog-profit-val">+${formatRub(res.netProfitRub, 0)} ₽</span>
              <span class="catalog-cost-val">Закуп: $${formatUsd(item.purchasePrice, 2)}</span>
            </div>
          </div>
        </div>
      `;
    }).join('');

    // Attach listeners to items
    catalogItemsList.querySelectorAll('.copy-item-price').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const p = btn.getAttribute('data-price');
        copyToClipboard(p, `Скопировано: ${p} ₽`);
      });
    });

    catalogItemsList.querySelectorAll('.delete-item-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-id');
        if (confirm('Удалить этот товар из прайс-листа?')) {
          AppStorage.deletePriceItem(id);
          state.priceList = AppStorage.get().priceList;
          renderTabCatalog();
          showToast('Товар удалён');
        }
      });
    });
  }

  catalogSearchInput.addEventListener('input', () => {
    renderTabCatalog();
  });

  // Modal: Add Item
  btnOpenAddModal.addEventListener('click', () => {
    addItemModal.classList.remove('hidden');
    newItemName.value = '';
    newItemCost.value = '';
    updateModalPreview();
    newItemName.focus();
    triggerHaptic('light');
  });

  function closeModal() {
    addItemModal.classList.add('hidden');
  }

  btnCloseAddModal.addEventListener('click', closeModal);
  btnCancelAddModal.addEventListener('click', closeModal);

  function updateModalPreview() {
    const cost = parseFloat(newItemCost.value) || 0;
    if (cost <= 0) {
      modalCalcPriceRub.textContent = '-- ₽';
      modalCalcProfitRub.textContent = '-- ₽';
      return;
    }
    const calcParams = getTabPriceParams();
    const res = calculateItemPrice({ ...calcParams, purchasePrice: cost });
    modalCalcPriceRub.textContent = `${res.priceRubRounded9} ₽ ($${formatUsd(res.priceUsd, 2)})`;
    modalCalcProfitRub.textContent = `+${formatRub(res.netProfitRub, 1)} ₽`;
  }

  newItemCost.addEventListener('input', updateModalPreview);

  addItemForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = newItemName.value.trim();
    const cost = parseFloat(newItemCost.value);
    if (!name || isNaN(cost) || cost <= 0) {
      alert('Пожалуйста, введите корректное название и цену закупа.');
      return;
    }

    AppStorage.addPriceItem({ name, purchasePrice: cost });
    state.priceList = AppStorage.get().priceList;
    closeModal();
    renderTabCatalog();
    showToast(`Товар "${name}" добавлен!`);
  });

  function escapeHtml(str) {
    return str.replace(/&/g, '&amp;')
              .replace(/</g, '&lt;')
              .replace(/>/g, '&gt;')
              .replace(/"/g, '&quot;')
              .replace(/'/g, '&#039;');
  }

  /* ==========================================================================
     Initialize Application
     ========================================================================== */
  function initialize() {
    // Populate form fields from stored state
    headerRateDisplay.textContent = `${formatRub(state.usdRubRate, 2)} ₽`;
    inputUsdRate.value = state.usdRubRate;
    inputPurchasePrice.value = state.purchasePrice;
    setBatchVolume(state.batchVolume);

    inputFpSaleFee.value = ((state.fpSaleFeeRate || 0.06) * 100).toFixed(1);
    inputFpOutFee.value = ((state.fpOutFeeRate || 0.02) * 100).toFixed(1);
    inputFpFixedOutFee.value = (state.fpFixedOutFeeUsd || 1.50).toFixed(2);
    inputBuyFixedFee.value = (state.buyFixedFeeUsd || 1.00).toFixed(2);

    if (state.customRoi) {
      inputCustomRoi.value = state.customRoi;
      chipGrid.forEach(c => c.classList.remove('active'));
      presetMultiplierBadge.textContent = `Цель: x${Number(state.customRoi).toFixed(1)}`;
    } else {
      chipGrid.forEach(c => {
        const mul = parseFloat(c.getAttribute('data-multiplier'));
        c.classList.toggle('active', mul === state.roiMultiplier);
      });
      presetMultiplierBadge.textContent = `Цель: x${Number(state.roiMultiplier || 2.0).toFixed(1)}`;
    }

    syncCashoutRoute(state.cashoutRoute || 'route_ton');

    if (state.isSettingsOpen) {
      accordionSettings.classList.add('open');
    }

    inputWithdrawAmount.value = state.withdrawalAmount || 10000;
    setWithdrawCurrency(state.withdrawalCurrency || 'RUB');

    // Switch to active tab
    switchTab(state.activeTab || 'tab-price');
  }

  initialize();
});
