/****************************************************************************************************
 * ZMIENNE I OGÓLNE FUNKCJE POMOCNICZE
 ****************************************************************************************************/
let categoriesData = []; // Przechowuje kategorie z pliku data.json
let cart = [];           // Zawartość koszyka (obiekty { name, details, price })

// Kursy walut i waluta bazowa (zostaną pobrane z data.json)
let exchangeRates = {};
let baseCurrency = "PLN";

/****************************************************************************************************
 * convertPrice - konwertuje cenę z currency -> baseCurrency, używając exchangeRates
 ****************************************************************************************************/
function convertPrice(amount, currency) {
  if (!exchangeRates || !exchangeRates[currency]) {
    console.warn(`Brak kursu wymiany dla waluty: ${currency}. Używam 1:1.`);
    return amount; // fallback: żadna konwersja
  }
  const rate = exchangeRates[currency];
  return amount * rate;
}

/****************************************************************************************************
 * Po załadowaniu DOM, pobieramy data.json i wczytujemy wszystkie dane
 ****************************************************************************************************/
document.addEventListener('DOMContentLoaded', () => {
  console.log("→ DOMContentLoaded, wczytuję data.json...");

  fetch('data.json')
    .then(res => res.json())
    .then(data => {
      exchangeRates = data.exchangeRates || {};
      baseCurrency = data.baseCurrency || "PLN";
      categoriesData = data.categories || [];

      console.log("→ data.json wczytany:");
      console.log("exchangeRates:", exchangeRates);
      console.log("baseCurrency:", baseCurrency);
      console.log("categoriesData:", categoriesData);

      // Tworzymy menu kategorii:
      renderCategoriesMenu(categoriesData);
    })
    .catch(err => console.error("Błąd wczytywania data.json:", err));
    const btnExportXls = document.getElementById('btnExportXls');
    if (btnExportXls) {
      btnExportXls.addEventListener('click', exportCartToXLS);
    }
});

/****************************************************************************************************
 * renderCategoriesMenu – buduje listę linków do kategorii
 ****************************************************************************************************/
function renderCategoriesMenu(categories) {
  const menuUl = document.getElementById('categoriesMenu');
  menuUl.innerHTML = '';

  categories.forEach((cat, idx) => {
    const li = document.createElement('li');
    const link = document.createElement('a');
    link.href = '#';
    link.textContent = cat.name;
    link.addEventListener('click', (e) => {
      e.preventDefault();
      selectCategory(idx);

      // Podświetlenie aktywnego linku:
      document.querySelectorAll('#categoriesMenu a').forEach(a => a.classList.remove('active'));
      link.classList.add('active');
    });

    li.appendChild(link);
    menuUl.appendChild(li);
  });
}

/****************************************************************************************************
 * selectCategory – obsługuje kliknięcie w link kategorii (z menu)
 ****************************************************************************************************/
function selectCategory(catIndex) {
  const category = categoriesData[catIndex];
  console.log("→ Wybrana kategoria:", category.name);

  // Ustawiamy tytuł i opis
  document.getElementById('categoryTitle').textContent = category.name;

  const desc = (category.labels && category.labels.sectionDescription)
    ? category.labels.sectionDescription
    : `Opcje dostępne w kategorii: ${category.name}.`;

  document.getElementById('categoryDesc').textContent = desc;

  const container = document.getElementById('plansContainer');
  container.innerHTML = ''; // czyścimy poprzednie sekcje

  // Render w zależności od typu:
  switch (category.type) {
    case 'iaas':
      renderIaaS(category, container);
      renderMsLicSection(category, container); 
      break;

    case 'paas':
      renderPaaSMachinesSection(category, container);
      renderMsLicSection(category, container);
      renderPaaSDisasterRecoverySection(category, container);
      break;

    case 'saas':
      renderSaaSApplications(category, container);
      renderSaaS_MsLicSection(category, container);
      break;

    case 'acronis':
      renderAcronisSections(category, container);
      break;

    case 'csp':
      renderMicrosoft365Section(category, container);
      break;

    case 'security':
      renderSecurityWebAppsSection(category, container);
      renderSecurityFirewallSection(category, container);
      renderSecurityAnalysisSection(category, container);
      break;

    default:
      // Fallback – jeśli nie ma dedykowanej logiki
      renderServicesList(category, container);
      break;
  }

  // Inicjalizacja tooltipów (musi być na końcu, po wyrenderowaniu)
  initTooltips();
}

/****************************************************************************************************
 * initTooltips – inicjuje bootstrapowe tooltipy
 ****************************************************************************************************/
function initTooltips() {
  const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
  tooltipTriggerList.map(el => new bootstrap.Tooltip(el));
}

/****************************************************************************************************
 * Helper createSection – tworzy kontener sekcji z tytułem i body
 ****************************************************************************************************/
function createSection(titleText) {
  const wrapper = document.createElement('div');
  wrapper.classList.add('section-wrapper');

  const titleDiv = document.createElement('div');
  titleDiv.classList.add('section-title');
  titleDiv.innerHTML = `<h5 class="m-0">${titleText}</h5>`;

  const bodyDiv = document.createElement('div');
  bodyDiv.classList.add('section-body');

  wrapper.appendChild(titleDiv);
  wrapper.appendChild(bodyDiv);

  return { wrapper, bodyContainer: bodyDiv };
}

/****************************************************************************************************
 * Helper createFlexRow – tworzy wiersz flex: .col-params, .col-price, .col-button
 ****************************************************************************************************/
function createFlexRow() {
  const row = document.createElement('div');
  row.classList.add('row-desktop');

  const paramCol = document.createElement('div');
  paramCol.classList.add('col-params');

  const priceCol = document.createElement('div');
  priceCol.classList.add('col-price');

  const buttonCol = document.createElement('div');
  buttonCol.classList.add('col-button');

  row.appendChild(paramCol);
  row.appendChild(priceCol);
  row.appendChild(buttonCol);

  return { row, paramCol, priceCol, buttonCol };
}

/****************************************************************************************************
 * Funkcja renderCart – aktualizuje widok koszyka
 ****************************************************************************************************/
function renderCart() {
  const cartSection = document.getElementById('cartSection');
  const tbody = document.querySelector('#cartTable tbody');
  const totalEl = document.getElementById('cartTotal');

  if (!cart.length) {
    cartSection.style.display = 'none';
    return;
  }
  cartSection.style.display = 'block';
  tbody.innerHTML = '';

  let sum = 0;

  cart.forEach((item, index) => {
    sum += item.price;

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${item.name}</td>
      <td>${item.details}</td>
      <td>${item.price.toFixed(2)}</td>
      <td><button class="btn btn-sm btn-danger">X</button></td>
    `;

    const btnRemove = tr.querySelector('button');
    btnRemove.addEventListener('click', () => {
      cart.splice(index, 1);
      renderCart();
    });

    tbody.appendChild(tr);
  });

  totalEl.textContent = sum.toFixed(2);
}

/****************************************************************************************************
 * Fallback – jeśli nie ma dedykowanej logiki (category.type nieznany)
 ****************************************************************************************************/
function renderServicesList(category, container) {
  const sec = createSection(category.name || "Usługi");
  const div = document.createElement('div');
  div.textContent = "Brak szczegółowej konfiguracji.";
  sec.bodyContainer.appendChild(div);

  container.appendChild(sec.wrapper);
}

/****************************************************************************************************
 *  1. IaaS
 ****************************************************************************************************/
function renderIaaS(category, container) {
  const secTitle = (category.labels && category.labels.sectionTitle) 
    ? category.labels.sectionTitle 
    : "IaaS";

  const sec = createSection(secTitle);
  const { row, paramCol, priceCol, buttonCol } = createFlexRow();

  // Slidery i inputy:
  const lblCpu = (category.labels && category.labels.cpuLabel) || "CPU:";
  const lblRam = (category.labels && category.labels.ramLabel) || "RAM:";
  const lblSsd = (category.labels && category.labels.ssdLabel) || "SSD (GB):";
  const lblBkp = (category.labels && category.labels.backupLabel) || "Backup (GB):";
  const lblIp  = (category.labels && category.labels.publicIpLabel) || "Public IP:";

  const backupTooltip = (category.labels && category.labels.backupTooltip) || "";
  const ipTooltip     = (category.labels && category.labels.publicIpTooltip) || "";
  const btnTxt        = (category.labels && category.labels.addToCartBtn) || "Dodaj";

  paramCol.innerHTML = `
    <div class="inline-fields">
      <label>${lblCpu}</label>
      <input type="range" id="cpuSlider"
             min="${category.sliders[0].min}" max="${category.sliders[0].max}"
             step="${category.sliders[0].step}" value="${category.sliders[0].min}"
             style="width:100px;">
      <span id="cpuVal">${category.sliders[0].min}</span>
    </div>
    <div class="inline-fields">
      <label>${lblRam}</label>
      <input type="range" id="ramSlider"
             min="${category.sliders[1].min}" max="${category.sliders[1].max}"
             step="${category.sliders[1].step}" value="${category.sliders[1].min}"
             style="width:100px;">
      <span id="ramVal">${category.sliders[1].min}</span>
    </div>
    <div class="inline-fields">
      <label>${lblSsd}</label>
      <input type="range" id="ssdSlider"
             min="${category.sliders[2].min}" max="${category.sliders[2].max}"
             step="${category.sliders[2].step}" value="${category.sliders[2].min}"
             style="width:100px;">
      <span id="ssdVal">${category.sliders[2].min}</span>
    </div>
    <div class="inline-fields">
      <label>${lblBkp}</label>
      <input type="number" id="backupGB" value="0" min="0" style="width:60px;">
      <i class="bi bi-info-circle text-muted"
         data-bs-toggle="tooltip"
         title="${backupTooltip}"></i>
    </div>
    <div class="inline-fields">
      <label>${lblIp}</label>
      <input type="number" id="publicIp" value="0" min="0" style="width:60px;">
      <i class="bi bi-info-circle text-muted"
         data-bs-toggle="tooltip"
         title="${ipTooltip}"></i>
    </div>
  `;

  priceCol.innerHTML = `<strong><span id="iaasPrice">0.00</span> PLN</strong>`;
  buttonCol.innerHTML = `<button class="btn btn-primary" id="btnAddIaas">${btnTxt}</button>`;

  // Dodajemy do DOM
  sec.bodyContainer.appendChild(row);
  container.appendChild(sec.wrapper);

  // Pobieramy referencje do elementów
  const cpuSlider = paramCol.querySelector('#cpuSlider');
  const ramSlider = paramCol.querySelector('#ramSlider');
  const ssdSlider = paramCol.querySelector('#ssdSlider');
  const backupGB  = paramCol.querySelector('#backupGB');
  const publicIp  = paramCol.querySelector('#publicIp');
  const priceEl   = priceCol.querySelector('#iaasPrice');
  const btnAdd    = buttonCol.querySelector('#btnAddIaas');

  function updateIaaSPrice() {
    let total = 0;

    const cpuVal = parseInt(cpuSlider.value, 10) || 0;
    const ramVal = parseInt(ramSlider.value, 10) || 0;
    const ssdVal = parseInt(ssdSlider.value, 10) || 0;
    const bkpVal = parseInt(backupGB.value, 10) || 0;
    const ipVal  = parseInt(publicIp.value, 10) || 0;

    // CPU slider
    const cpuPriceUnit = convertPrice(category.sliders[0].pricePerUnit, category.sliders[0].currency);
    total += cpuVal * cpuPriceUnit;

    // RAM slider
    const ramPriceUnit = convertPrice(category.sliders[1].pricePerUnit, category.sliders[1].currency);
    total += ramVal * ramPriceUnit;

    // SSD slider
    const ssdPriceUnit = convertPrice(category.sliders[2].pricePerUnit, category.sliders[2].currency);
    total += ssdVal * ssdPriceUnit;

    // Backup
    const bkpPrice = convertPrice(category.backupPricePerGB, category.backupCurrency);
    if (bkpVal > 0) {
      total += bkpVal * bkpPrice;
    }

    // Public IP
    const ipPrice = convertPrice(category.publicIPPrice, category.publicIPCurrency);
    if (ipVal > 0) {
      total += ipVal * ipPrice;
    }

    // Ustawiamy teksty
    paramCol.querySelector('#cpuVal').textContent = cpuVal;
    paramCol.querySelector('#ramVal').textContent = ramVal;
    paramCol.querySelector('#ssdVal').textContent = ssdVal;

    priceEl.textContent = total.toFixed(2);
  }

  // Eventy
  [cpuSlider, ramSlider, ssdSlider, backupGB, publicIp].forEach(el => {
    el.addEventListener('input', updateIaaSPrice);
  });

  updateIaaSPrice(); // inicjalne przeliczenie

  btnAdd.addEventListener('click', () => {
    const total = parseFloat(priceEl.textContent) || 0;

    const cpuVal = parseInt(cpuSlider.value, 10) || 0;
    const ramVal = parseInt(ramSlider.value, 10) || 0;
    const ssdVal = parseInt(ssdSlider.value, 10) || 0;
    const bkpVal = parseInt(backupGB.value, 10) || 0;
    const ipVal  = parseInt(publicIp.value, 10) || 0;

    let desc = `CPU=${cpuVal}, RAM=${ramVal}GB, SSD=${ssdVal}GB`;
    if (bkpVal > 0) desc += `, Backup=${bkpVal}GB`;
    if (ipVal > 0)  desc += `, +${ipVal}xPublicIP`;

    cart.push({
      name: category.name,
      details: desc,
      price: total
    });

    renderCart();
  });
}

/****************************************************************************************************
 * MsLicSection – sekcja licencji Microsoft (SPLA). Używana w IaaS/PaaS/SaaS
 ****************************************************************************************************/
function renderMsLicSection(category, container) {
  if (!category.msSplaServices || !category.msSplaServices.length) {
    return; // brak sekcji
  }

  const secTitle = (category.labels && category.labels.msLicSectionTitle)
    ? category.labels.msLicSectionTitle
    : "Licencje Microsoft";

  const sec = createSection(secTitle);
  const { row, paramCol, priceCol, buttonCol } = createFlexRow();

  const btnTxt = (category.labels && category.labels.addToCartBtn) || "Dodaj";

  paramCol.innerHTML = `
    <div class="inline-fields">
      <label>Wybierz licencję:</label>
      <select id="msSelect" class="form-select" style="width:auto; min-width:150px;">
        <option value="" disabled selected>-- wybierz --</option>
      </select>
      <label>Ilość:</label>
      <input type="number" id="msQty" value="1" min="1" style="width:60px;">
    </div>
  `;
  priceCol.innerHTML = `<strong><span id="msPrice">0.00</span> PLN</strong>`;
  buttonCol.innerHTML = `<button class="btn btn-primary" id="btnAddMS">${btnTxt}</button>`;

  sec.bodyContainer.appendChild(row);
  container.appendChild(sec.wrapper);

  const msSelect = paramCol.querySelector('#msSelect');
  const msQty    = paramCol.querySelector('#msQty');
  const msPriceEl= priceCol.querySelector('#msPrice');
  const btnAddMS = buttonCol.querySelector('#btnAddMS');

  // Wypełniamy select
  category.msSplaServices.forEach(srv => {
    const opt = document.createElement('option');
    opt.value = JSON.stringify(srv); // w value damy JSON całego obiektu (label, price, currency)
    opt.textContent = `${srv.label} (${srv.price} ${srv.currency || ''})`;
    msSelect.appendChild(opt);
  });

  function updateMsPrice() {
    if (!msSelect.value) {
      msPriceEl.textContent = '0.00';
      return;
    }
    const srvObj = JSON.parse(msSelect.value);
    const qty = parseInt(msQty.value, 10) || 1;

    const p = convertPrice(srvObj.price, srvObj.currency || "PLN");
    msPriceEl.textContent = (p * qty).toFixed(2);
  }

  msSelect.addEventListener('change', updateMsPrice);
  msQty.addEventListener('input', updateMsPrice);
  updateMsPrice();

  btnAddMS.addEventListener('click', () => {
    if (!msSelect.value) {
      alert("Wybierz licencję Microsoft!");
      return;
    }
    const srvObj = JSON.parse(msSelect.value);
    const qty = parseInt(msQty.value, 10) || 1;
    const p   = convertPrice(srvObj.price, srvObj.currency || "PLN");
    const total = p * qty;

    cart.push({
      name: secTitle,
      details: `${srvObj.label} x${qty}`,
      price: total
    });

    renderCart();
  });
}
/****************************************************************************************************
 *  2. PaaS
 ****************************************************************************************************/
function renderPaaSMachinesSection(category, container) {
  const secTitle = (category.labels && category.labels.sectionTitle) 
    ? category.labels.sectionTitle 
    : "PaaS Machines";

  const sec = createSection(secTitle);
  const { row, paramCol, priceCol, buttonCol } = createFlexRow();

  const lblInst    = (category.labels && category.labels.selectInstLabel) || "Wybierz instancję:";
  const lblSupport = (category.labels && category.labels.supportLabel)    || "Wsparcie techniczne:";
  const lblSsd     = (category.labels && category.labels.ssdLabel)       || "SSD (GB):";
  const lblBkp     = (category.labels && category.labels.backupLabel)    || "Backup (GB):";
  const lblIp      = (category.labels && category.labels.publicIpLabel)  || "Public IP:";

  const bkpTip = (category.labels && category.labels.backupTooltip) || "";
  const ipTip  = (category.labels && category.labels.publicIpTooltip) || "";
  const btnTxt = (category.labels && category.labels.addToCartBtn) || "Dodaj";

  paramCol.innerHTML = `
    <div class="inline-fields">
      <label>${lblInst}</label>
      <select id="paasInst" class="form-select" style="width:auto; min-width:150px;">
        <option value="" disabled selected>-- wybierz --</option>
      </select>
    </div>
    <div id="paasInstDesc" class="text-muted" style="font-size:0.85rem; margin-bottom:8px;"></div>

    <div class="inline-fields">
      <label>${lblSupport}</label>
      <select id="paasSupport" class="form-select" style="width:auto; min-width:150px;">
        <option value="" disabled selected>-- wybierz --</option>
        <option value="gold">GOLD</option>
        <option value="platinum">PLATINUM</option>
      </select>
    </div>
    <div id="paasSupportDesc" class="text-muted" style="font-size:0.85rem; margin-bottom:8px;"></div>

    <div class="inline-fields">
      <label>${lblSsd}</label>
      <input type="number" id="paasSsd" value="0" min="0" style="width:60px;">
    </div>
    <div class="inline-fields">
      <label>${lblBkp}</label>
      <input type="number" id="paasBackup" value="0" min="0" style="width:60px;">
      <i class="bi bi-info-circle text-muted"
         data-bs-toggle="tooltip"
         title="${bkpTip}"></i>
    </div>
    <div class="inline-fields">
      <label>${lblIp}</label>
      <input type="number" id="paasIp" value="0" min="0" style="width:60px;">
      <i class="bi bi-info-circle text-muted"
         data-bs-toggle="tooltip"
         title="${ipTip}"></i>
    </div>
  `;
  priceCol.innerHTML = `<strong><span id="paasPrice">0.00</span> PLN</strong>`;
  buttonCol.innerHTML = `<button class="btn btn-primary" id="btnAddPaaS">${btnTxt}</button>`;

  sec.bodyContainer.appendChild(row);
  container.appendChild(sec.wrapper);

  const instSelect    = paramCol.querySelector('#paasInst');
  const instDescEl    = paramCol.querySelector('#paasInstDesc');
  const supportSelect = paramCol.querySelector('#paasSupport');
  const supportDescEl = paramCol.querySelector('#paasSupportDesc');
  const ssdInput      = paramCol.querySelector('#paasSsd');
  const bkpInput      = paramCol.querySelector('#paasBackup');
  const ipInput       = paramCol.querySelector('#paasIp');
  const priceEl       = priceCol.querySelector('#paasPrice');
  const btnAdd        = buttonCol.querySelector('#btnAddPaaS');

  // Wypełniamy select instancji
  if (category.paasInstances) {
    category.paasInstances.forEach(inst => {
      const opt = document.createElement('option');
      opt.value = JSON.stringify(inst);
      opt.textContent = `${inst.label} (${inst.price} ${inst.currency || ''})`;
      instSelect.appendChild(opt);
    });
  }

  function updatePaaS() {
    let total = 0;

    // instancja
    if (instSelect.value) {
      const instObj = JSON.parse(instSelect.value);
      instDescEl.textContent = instObj.desc || "";

      const instPrice = convertPrice(instObj.price, instObj.currency);
      total += instPrice;
    } else {
      instDescEl.textContent = "";
    }

    // wsparcie
    const goldPrice      = convertPrice(category.supportGoldPrice, category.supportGoldCurrency || "PLN");
    const platinumAddOn  = convertPrice(category.supportPlatinumAddOnPrice, category.supportPlatinumAddOnCurrency || "PLN");
    
    if (supportSelect.value === 'gold') {
      total += goldPrice;
      supportDescEl.textContent = category.supportGoldDesc || "";
    } else if (supportSelect.value === 'platinum') {
      // gold + platinumAddOn
      total += (goldPrice + platinumAddOn);
      supportDescEl.textContent = `${category.supportGoldDesc || ''} + ${category.supportPlatinumDesc || ''}`;
    } else {
      supportDescEl.textContent = "";
    }

    // SSD
    const ssdVal = parseInt(ssdInput.value, 10) || 0;
    total += ssdVal; // tu można by też użyć convertPrice jeżeli ma być cennik za 1GB

    // Backup
    const bkpVal  = parseInt(bkpInput.value, 10) || 0;
    const bkpUnit = convertPrice(category.backupPricePerGB, category.backupCurrency);
    total += bkpVal * bkpUnit;

    // Public IP
    const ipVal   = parseInt(ipInput.value, 10) || 0;
    const ipPrice = convertPrice(category.publicIPPrice, category.publicIPCurrency);
    total += ipVal * ipPrice;

    priceEl.textContent = total.toFixed(2);
  }

  [instSelect, supportSelect, ssdInput, bkpInput, ipInput].forEach(el => {
    el.addEventListener('change', updatePaaS);
    el.addEventListener('input', updatePaaS);
  });

  updatePaaS();

  btnAdd.addEventListener('click', () => {
    let total = parseFloat(priceEl.textContent) || 0;
    if (!instSelect.value) {
      alert("Musisz wybrać instancję PaaS!");
      return;
    }
    if (!supportSelect.value) {
      alert("Musisz wybrać wsparcie (gold/platinum)!");
      return;
    }

    const instObj = JSON.parse(instSelect.value);
    const ssdVal  = parseInt(ssdInput.value, 10)   || 0;
    const bkpVal  = parseInt(bkpInput.value, 10)   || 0;
    const ipVal   = parseInt(ipInput.value, 10)    || 0;

    let supText = supportSelect.value.toUpperCase();
    let desc = `Instancja=${instObj.label}, Wsparcie=${supText}`;

    if (ssdVal > 0) desc += `, SSD=${ssdVal}GB`;
    if (bkpVal > 0) desc += `, Backup=${bkpVal}GB`;
    if (ipVal > 0)  desc += `, +${ipVal}xPublicIP`;

    cart.push({
      name: category.name,
      details: desc,
      price: total
    });

    renderCart();
  });
}

function renderPaaSDisasterRecoverySection(category, container) {
  if (!category.drServices || !category.drServices.length) return;

  const lblTitle = (category.labels && category.labels.drSectionTitle) || "Disaster Recovery";
  const lblStor  = (category.labels && category.labels.drStorageLabel) || "Storage (GB):";
  const lblIp    = (category.labels && category.labels.drIpLabel)      || "Public IP:";
  const alertIp  = (category.labels && category.labels.drIpAlert)      || "IP musi być >=1!";
  const btnTxt   = (category.labels && category.labels.addToCartBtn)   || "Dodaj";

  const sec = createSection(lblTitle);
  const { row, paramCol, priceCol, buttonCol } = createFlexRow();

  // Znajdź obiekty drServices
  const storObj = category.drServices.find(x => x.id === 'C-DR-STORAGE');
  const ipObj   = category.drServices.find(x => x.id === 'C-DR-IP');

  paramCol.innerHTML = `
    <div class="inline-fields">
      <label>${lblStor}</label>
      <input type="number" id="drStorage" value="0" min="0" style="width:60px;">
      <i class="bi bi-info-circle text-muted"
         data-bs-toggle="tooltip"
         title="${storObj?.tooltip || ''}"></i>
    </div>
    <div class="inline-fields">
      <label>${lblIp}</label>
      <input type="number" id="drIp" value="1" min="1" style="width:60px;">
      <i class="bi bi-info-circle text-muted"
         data-bs-toggle="tooltip"
         title="${ipObj?.tooltip || ''}"></i>
    </div>
  `;
  priceCol.innerHTML = `<strong><span id="drPrice">0.00</span> PLN</strong>`;
  buttonCol.innerHTML = `<button class="btn btn-primary" id="btnAddDR">${btnTxt}</button>`;

  sec.bodyContainer.appendChild(row);
  container.appendChild(sec.wrapper);

  const drStorage = paramCol.querySelector('#drStorage');
  const drIp      = paramCol.querySelector('#drIp');
  const drPriceEl = priceCol.querySelector('#drPrice');
  const btnAddDR  = buttonCol.querySelector('#btnAddDR');

  function updateDRPrice() {
    let total = 0;
    const sVal = parseInt(drStorage.value, 10) || 0;
    const iVal = parseInt(drIp.value, 10)      || 1;

    if (storObj) {
      const storPrice = convertPrice(storObj.price, storObj.currency || "PLN");
      total += sVal * storPrice;
    }
    if (ipObj) {
      const ipPrice = convertPrice(ipObj.price, ipObj.currency || "PLN");
      total += iVal * ipPrice;
    }
    drPriceEl.textContent = total.toFixed(2);
  }

  [drStorage, drIp].forEach(el => el.addEventListener('input', updateDRPrice));
  updateDRPrice();

  btnAddDR.addEventListener('click', () => {
    const total = parseFloat(drPriceEl.textContent) || 0;
    const sVal = parseInt(drStorage.value, 10) || 0;
    const iVal = parseInt(drIp.value, 10)      || 1;

    if (iVal < 1) {
      alert(alertIp);
      return;
    }
    let desc = "";
    if (storObj) desc += `${storObj.label}=${sVal}GB, `;
    if (ipObj)   desc += `${ipObj.label}=${iVal}`;

    cart.push({
      name: lblTitle,
      details: desc,
      price: total
    });

    renderCart();
  });
}

/****************************************************************************************************
 *  3. SaaS
 ****************************************************************************************************/
function renderSaaSApplications(category, container) {
  const secTitle = (category.labels && category.labels.sectionTitle)
    ? category.labels.sectionTitle
    : "SaaS Applications";

  const sec = createSection(secTitle);
  container.appendChild(sec.wrapper);

  // Dodajemy poszczególne funkcje/flexRow
  renderSaaS_MsSQLRow(category, sec.bodyContainer);
  renderSaaS_EnovaRow(category, sec.bodyContainer);
  renderSaaS_EnovaApiRow(category, sec.bodyContainer);
  renderSaaS_TerminalRow(category, sec.bodyContainer);
  renderSaaS_ExtraDataRow(category, sec.bodyContainer);
}

// SaaS Licencje Microsoft
function renderSaaS_MsLicSection(category, container) {
  if (!category.msSplaServices || !category.msSplaServices.length) return;

  const secTitle = (category.labels && category.labels.msLicSectionTitle)
    ? category.labels.msLicSectionTitle
    : "Licencje Microsoft (SaaS)";

  const sec = createSection(secTitle);
  const { row, paramCol, priceCol, buttonCol } = createFlexRow();

  const btnTxt = (category.labels && category.labels.addToCartBtn) || "Dodaj";

  paramCol.innerHTML = `
    <div class="inline-fields">
      <label>Wybierz licencję:</label>
      <select id="saasMsSelect" class="form-select" style="width:auto; min-width:150px;">
        <option value="" disabled selected>-- wybierz --</option>
      </select>
      <label>Ilość:</label>
      <input type="number" id="saasMsQty" value="1" min="1" style="width:60px;">
    </div>
  `;

  priceCol.innerHTML = `<strong><span id="saasMsPrice">0.00</span> PLN</strong>`;
  buttonCol.innerHTML = `<button class="btn btn-primary" id="btnAddSaasMs">${btnTxt}</button>`;

  sec.bodyContainer.appendChild(row);
  container.appendChild(sec.wrapper);

  const saasMsSelect   = paramCol.querySelector('#saasMsSelect');
  const saasMsQty      = paramCol.querySelector('#saasMsQty');
  const saasMsPriceEl  = priceCol.querySelector('#saasMsPrice');
  const btnAddSaasMs   = buttonCol.querySelector('#btnAddSaasMs');

  category.msSplaServices.forEach(srv => {
    const opt = document.createElement('option');
    opt.value = JSON.stringify(srv);
    opt.textContent = `${srv.label} (${srv.price} ${srv.currency || ''})`;
    saasMsSelect.appendChild(opt);
  });

  function updateSaasMsPrice() {
    if (!saasMsSelect.value) {
      saasMsPriceEl.textContent = '0.00';
      return;
    }
    const srv = JSON.parse(saasMsSelect.value);
    const qty = parseInt(saasMsQty.value, 10) || 1;
    const p   = convertPrice(srv.price, srv.currency || "PLN");
    saasMsPriceEl.textContent = (p * qty).toFixed(2);
  }

  saasMsSelect.addEventListener('change', updateSaasMsPrice);
  saasMsQty.addEventListener('input', updateSaasMsPrice);
  updateSaasMsPrice();

  btnAddSaasMs.addEventListener('click', () => {
    if (!saasMsSelect.value) {
      alert("Wybierz licencję!");
      return;
    }
    const srv = JSON.parse(saasMsSelect.value);
    const qty = parseInt(saasMsQty.value, 10) || 1;
    const p   = convertPrice(srv.price, srv.currency || "PLN");
    const total = p * qty;

    cart.push({
      name: secTitle,
      details: `${srv.label} x${qty}`,
      price: total
    });

    renderCart();
  });
}

// Podfunkcje SaaS (MS SQL, Enova, Terminal, Extra Miejsce)
function renderSaaS_MsSQLRow(category, container) {
  const { row, paramCol, priceCol, buttonCol } = createFlexRow();

  paramCol.innerHTML = `
    <div class="inline-fields">
      <label>Baza danych Microsoft SQL:</label>
      <select id="msSqlSelect" class="form-select" style="width:auto; min-width:150px;">
        <option value="" disabled selected>-- wybierz --</option>
      </select>
    </div>
    <div id="msSqlDesc" class="text-muted" style="font-size:0.85rem; margin-top:4px;"></div>
  `;

  priceCol.innerHTML = `<strong><span id="msSqlPrice">0.00</span> PLN</strong>`;
  buttonCol.innerHTML = `<button class="btn btn-primary" id="btnAddMsSql">Dodaj</button>`;

  container.appendChild(row);

  const msSqlItem = category.services.find(s => s.id === "saas_msSQL");
  if (msSqlItem) {
    const select = paramCol.querySelector('#msSqlSelect');
    const opt = document.createElement('option');
    opt.value = JSON.stringify(msSqlItem);
    opt.textContent = `${msSqlItem.label} (${msSqlItem.price} ${msSqlItem.currency})`;
    select.appendChild(opt);
  }

  const msSqlSelect  = paramCol.querySelector('#msSqlSelect');
  const msSqlDescEl  = paramCol.querySelector('#msSqlDesc');
  const msSqlPriceEl = priceCol.querySelector('#msSqlPrice');
  const btnAddMsSql  = buttonCol.querySelector('#btnAddMsSql');

  msSqlSelect.addEventListener('change', () => {
    if (!msSqlSelect.value) {
      msSqlDescEl.textContent = "";
      msSqlPriceEl.textContent = "0.00";
      return;
    }
    const obj = JSON.parse(msSqlSelect.value);
    msSqlDescEl.textContent = obj.desc || "";
    const p = convertPrice(obj.price, obj.currency || "PLN");
    msSqlPriceEl.textContent = p.toFixed(2);
  });

  btnAddMsSql.addEventListener('click', () => {
    if (!msSqlSelect.value) {
      alert("Wybierz Bazę SQL!");
      return;
    }
    const obj = JSON.parse(msSqlSelect.value);
    const p   = convertPrice(obj.price, obj.currency || "PLN");

    cart.push({
      name: "SaaS - MS SQL",
      details: obj.label,
      price: p
    });
    renderCart();
  });
}

function renderSaaS_EnovaRow(category, container) {
  const { row, paramCol, priceCol, buttonCol } = createFlexRow();

  const harmLabel = (category.labels && category.labels.harmonogramLabel) || "Harmonogram:";

  paramCol.innerHTML = `
    <div class="inline-fields">
      <label>Enova365Web:</label>
      <select id="enovaSelect" class="form-select" style="width:auto; min-width:150px;">
        <option value="" disabled selected>-- wybierz --</option>
      </select>
    </div>
    <div id="enovaDesc" class="text-muted" style="font-size:0.85rem; margin-top:4px;"></div>

    <div class="inline-fields mt-2">
      <label>${harmLabel}</label>
      <input type="checkbox" id="enovaHarm">
    </div>
  `;
  priceCol.innerHTML = `<strong><span id="enovaPrice">0.00</span> PLN</strong>`;
  buttonCol.innerHTML = `<button class="btn btn-primary" id="btnAddEnova">Dodaj</button>`;

  container.appendChild(row);

  const enovaItem = category.services.find(s => s.id === "saas_enova");
  const enovaSelect = paramCol.querySelector('#enovaSelect');
  const enovaDescEl = paramCol.querySelector('#enovaDesc');
  const enovaHarm   = paramCol.querySelector('#enovaHarm');
  const enovaPriceEl= priceCol.querySelector('#enovaPrice');
  const btnAddEnova = buttonCol.querySelector('#btnAddEnova');

  if (enovaItem) {
    const opt = document.createElement('option');
    opt.value = JSON.stringify(enovaItem);
    opt.textContent = `${enovaItem.label} (${enovaItem.price} ${enovaItem.currency})`;
    enovaSelect.appendChild(opt);
  }

  function updateEnovaPrice() {
    let total = 0;
    if (enovaSelect.value) {
      const obj = JSON.parse(enovaSelect.value);
      enovaDescEl.textContent = obj.desc || "";
      const base = convertPrice(obj.price, obj.currency || "PLN");
      total += base;
    } else {
      enovaDescEl.textContent = "";
    }
    if (enovaHarm.checked) {
      const c = convertPrice(category.harmonogramCost, category.harmonogramCurrency || "PLN");
      total += c;
    }
    enovaPriceEl.textContent = total.toFixed(2);
  }

  enovaSelect.addEventListener('change', updateEnovaPrice);
  enovaHarm.addEventListener('change', updateEnovaPrice);
  updateEnovaPrice();

  btnAddEnova.addEventListener('click', () => {
    if (!enovaSelect.value) {
      alert("Wybierz Enova!");
      return;
    }
    const total = parseFloat(enovaPriceEl.textContent) || 0;

    let desc = "";
    const obj = JSON.parse(enovaSelect.value);
    desc += obj.label;

    cart.push({
      name: "SaaS - Enova",
      details: desc,
      price: total
    });
    renderCart();
  });
}

function renderSaaS_EnovaApiRow(category, container) {
  const { row, paramCol, priceCol, buttonCol } = createFlexRow();

  paramCol.innerHTML = `
    <div class="inline-fields">
      <label>Enova365Web API:</label>
      <select id="enovaApiSelect" class="form-select" style="width:auto; min-width:150px;">
        <option value="" disabled selected>-- wybierz --</option>
      </select>
    </div>
    <div id="enovaApiDesc" class="text-muted" style="font-size:0.85rem; margin-top:4px;"></div>
  `;
  priceCol.innerHTML = `<strong><span id="enovaApiPrice">0.00</span> PLN</strong>`;
  buttonCol.innerHTML = `<button class="btn btn-primary" id="btnAddEnovaApi">Dodaj</button>`;

  container.appendChild(row);

  const enovaApiItem = category.services.find(s => s.id === "saas_enovaApi");
  const enovaApiSelect = paramCol.querySelector('#enovaApiSelect');
  const enovaApiDescEl = paramCol.querySelector('#enovaApiDesc');
  const enovaApiPriceEl= priceCol.querySelector('#enovaApiPrice');
  const btnAddEnovaApi = buttonCol.querySelector('#btnAddEnovaApi');

  if (enovaApiItem) {
    const opt = document.createElement('option');
    opt.value = JSON.stringify(enovaApiItem);
    opt.textContent = `${enovaApiItem.label} (${enovaApiItem.price} ${enovaApiItem.currency})`;
    enovaApiSelect.appendChild(opt);
  }

  enovaApiSelect.addEventListener('change', () => {
    if (!enovaApiSelect.value) {
      enovaApiDescEl.textContent = "";
      enovaApiPriceEl.textContent = "0.00";
      return;
    }
    const obj = JSON.parse(enovaApiSelect.value);
    enovaApiDescEl.textContent = obj.desc || "";
    const price = convertPrice(obj.price, obj.currency);
    enovaApiPriceEl.textContent = price.toFixed(2);
  });

  btnAddEnovaApi.addEventListener('click', () => {
    if (!enovaApiSelect.value) {
      alert("Wybierz EnovaAPI!");
      return;
    }
    const obj = JSON.parse(enovaApiSelect.value);
    const p   = convertPrice(obj.price, obj.currency || "PLN");

    cart.push({
      name: "SaaS - EnovaAPI",
      details: obj.label,
      price: p
    });

    renderCart();
  });
}

function renderSaaS_TerminalRow(category, container) {
  const { row, paramCol, priceCol, buttonCol } = createFlexRow();

  const lblTerm   = (category.labels && category.labels.terminalLabel)       || "Terminal:";
  const lblUsers  = (category.labels && category.labels.terminalUsersLabel)  || "Użytkownicy:";
  const lblSec    = (category.labels && category.labels.terminalSecurityLabel) || "Zabezpieczenie:";
  const alertSec  = (category.labels && category.labels.terminalSecurityAlert) || "Terminal bez zabezpieczenia!";

  paramCol.innerHTML = `
    <div class="inline-fields">
      <label>${lblTerm}</label>
      <label>${lblUsers}</label>
      <input type="number" id="termUsers" value="0" min="0" style="width:60px;">
    </div>
    <div class="inline-fields mt-2">
      <label>${lblSec}</label>
      <input type="checkbox" id="termSec">
      <i class="bi bi-info-circle text-muted"
         data-bs-toggle="tooltip"
         title="">
      </i>
    </div>
  `;
  priceCol.innerHTML = `<strong><span id="termPrice">0.00</span> PLN</strong>`;
  buttonCol.innerHTML = `<button class="btn btn-primary" id="btnAddTerm">Dodaj</button>`;

  container.appendChild(row);

  const termUsers    = paramCol.querySelector('#termUsers');
  const termSec      = paramCol.querySelector('#termSec');
  const termPriceEl  = priceCol.querySelector('#termPrice');
  const btnAddTerm   = buttonCol.querySelector('#btnAddTerm');

  function updateTermPrice() {
    let total = 0;
    const users = parseInt(termUsers.value, 10) || 0;

    // Cena za usera
    const perUser = convertPrice(category.terminalPricePerUser, category.terminalPricePerUserCurrency);
    if (users > 0) {
      total += users * perUser;

      if (termSec.checked) {
        const secCost = convertPrice(category.terminalSecurityCost, category.terminalSecurityCurrency);
        total += secCost;
      }
    }
    termPriceEl.textContent = total.toFixed(2);
  }

  [termUsers, termSec].forEach(el => el.addEventListener('input', updateTermPrice));
  updateTermPrice();

  btnAddTerm.addEventListener('click', () => {
    const total = parseFloat(termPriceEl.textContent) || 0;
    const users = parseInt(termUsers.value, 10) || 0;

    if (users <= 0) {
      alert("Podaj liczbę użytkowników > 0!");
      return;
    }
    let desc = `Users=${users}`;

    cart.push({
      name: "SaaS - Terminal",
      details: desc,
      price: total
    });

    if (!termSec.checked) {
      alert(alertSec);
    }

    renderCart();
  });
}

function renderSaaS_ExtraDataRow(category, container) {
  const { row, paramCol, priceCol, buttonCol } = createFlexRow();

  const lblExtra = (category.labels && category.labels.extraDataLabel) || "Extra space (GB):";

  paramCol.innerHTML = `
    <div class="inline-fields">
      <label>${lblExtra}</label>
      <input type="number" id="extraData" value="0" min="0" style="width:60px;">
      <i class="bi bi-info-circle text-muted"
         data-bs-toggle="tooltip"
         title="">
      </i>
    </div>
  `;
  priceCol.innerHTML = `<strong><span id="extraPrice">0.00</span> PLN</strong>`;
  buttonCol.innerHTML = `<button class="btn btn-primary" id="btnAddExtra">Dodaj</button>`;

  container.appendChild(row);

  const extraData = paramCol.querySelector('#extraData');
  const extraPriceEl = priceCol.querySelector('#extraPrice');
  const btnAddExtra = buttonCol.querySelector('#btnAddExtra');

  function updateExtraPrice() {
    const val = parseInt(extraData.value, 10) || 0;
    const cost = convertPrice(category.extraDataStoragePrice, category.extraDataStorageCurrency);
    extraPriceEl.textContent = (val * cost).toFixed(2);
  }

  extraData.addEventListener('input', updateExtraPrice);
  updateExtraPrice();

  btnAddExtra.addEventListener('click', () => {
    const val = parseInt(extraData.value, 10) || 0;
    if (val <= 0) {
      alert("Podaj ilość > 0!");
      return;
    }
    const cost = parseFloat(extraPriceEl.textContent) || 0;

    cart.push({
      name: "SaaS - Dodatkowe miejsce",
      details: `Ilość=${val}GB`,
      price: cost
    });

    renderCart();
  });
}

/****************************************************************************************************
 * 4. Acronis - 5 sekcji
 ****************************************************************************************************/
function renderAcronisSections(category, container) {
  const lbl = category.labels || {};
  renderAcronisPerGBSection(category, container, lbl);
  renderAcronisPerWorkloadSection(category, container, lbl);
  renderAcronisM365GSuiteSection(category, container, lbl);
  renderAcronisSecuritySection(category, container, lbl);
  renderAcronisManagementSection(category, container, lbl);
}

// 4.1 Per GB
function renderAcronisPerGBSection(category, container, labels) {
  const services = category.services.filter(s => s.id && s.id.startsWith("acronis_perGB"));
  if (!services.length) return;

  const secTitle = labels.perGbSectionTitle || "Kopie zapasowe (per GB)";
  const sec = createSection(secTitle);

  services.forEach(srv => {
    const { row, paramCol, priceCol, buttonCol } = createFlexRow();

    paramCol.innerHTML = `
      <div class="inline-fields">
        <label>${srv.label}:</label>
        <input type="number" id="${srv.id}_qty" value="0" min="0" style="width:60px;">
        <i class="bi bi-info-circle text-muted"
           data-bs-toggle="tooltip"
           title="${srv.tip || ''}"></i>
      </div>
    `;
    priceCol.innerHTML = `<strong><span id="${srv.id}_price">0.00</span> PLN</strong>`;
    buttonCol.innerHTML = `<button class="btn btn-primary" id="btn_${srv.id}">${labels.addToCartBtn || 'Dodaj'}</button>`;

    sec.bodyContainer.appendChild(row);

    const qtyInput = paramCol.querySelector(`#${srv.id}_qty`);
    const priceEl = priceCol.querySelector(`#${srv.id}_price`);
    const btnAdd  = buttonCol.querySelector(`#btn_${srv.id}`);

    qtyInput.addEventListener('input', () => {
      const qty = parseInt(qtyInput.value, 10) || 0;
      const p   = convertPrice(srv.price, srv.currency || "PLN");
      priceEl.textContent = (qty * p).toFixed(2);
    });

    btnAdd.addEventListener('click', () => {
      const qty = parseInt(qtyInput.value, 10) || 0;
      if (qty <= 0) {
        alert("Podaj ilość > 0");
        return;
      }
      const p = convertPrice(srv.price, srv.currency || "PLN");
      const total = qty * p;

      cart.push({
        name: secTitle,
        details: `${srv.label} x${qty}`,
        price: total
      });
      renderCart();
    });
  });

  container.appendChild(sec.wrapper);
}

// 4.2 Per Workload
function renderAcronisPerWorkloadSection(category, container, labels) {
  const baseOption   = category.services.find(s => s.id === "acronis_perWorkload_base");
  const cloudOption  = category.services.find(s => s.id === "acronis_perWorkload_cloud");
  const localOption  = category.services.find(s => s.id === "acronis_perWorkload_local");

  if (!baseOption || (!cloudOption && !localOption)) {
    return;
  }

  const secTitle = labels.perWorkloadSectionTitle || "Kopie zapasowe (per Workload)";
  const sec = createSection(secTitle);
  const { row, paramCol, priceCol, buttonCol } = createFlexRow();

  const lblBase   = labels.workloadBaseLabel   || "Base:";
  const lblCloud  = labels.workloadCloudLabel  || "Kopie do chmury:";
  const lblLocal  = labels.workloadLocalLabel  || "Kopie lokalne:";
  const alertText = labels.workloadAlert       || "Wybierz bazę + chmura/lokal.";

  paramCol.innerHTML = `
    <div class="inline-fields">
      <label>${lblBase}</label>
      <select id="wlBaseSelect" class="form-select" style="width:auto; min-width:150px;">
        <option value="" disabled selected>-- wybierz --</option>
      </select>
      <label>Ilość:</label>
      <input type="number" id="wlBaseQty" value="0" min="0" style="width:60px;">
      <i class="bi bi-info-circle text-muted"
         data-bs-toggle="tooltip"
         title="${baseOption.tip || ''}"></i>
    </div>
    <div id="wlBaseDesc" class="text-muted" style="font-size:0.85rem; margin-bottom:8px;"></div>

    <div class="inline-fields">
      <label>${lblCloud}</label>
      <input type="number" id="wlCloud" value="0" min="0" style="width:60px;">
      <i class="bi bi-info-circle text-muted"
         data-bs-toggle="tooltip"
         title="${cloudOption ? cloudOption.tip : ''}"></i>
    </div>
    <div class="inline-fields">
      <label>${lblLocal}</label>
      <input type="number" id="wlLocal" value="0" min="0" style="width:60px;">
      <i class="bi bi-info-circle text-muted"
         data-bs-toggle="tooltip"
         title="${localOption ? localOption.tip : ''}"></i>
    </div>
  `;
  priceCol.innerHTML = `<strong><span id="wlPrice">0.00</span> PLN</strong>`;
  buttonCol.innerHTML = `<button class="btn btn-primary" id="btnWl">${labels.addToCartBtn || 'Dodaj'}</button>`;

  sec.bodyContainer.appendChild(row);
  container.appendChild(sec.wrapper);

  const wlBaseSelect = paramCol.querySelector('#wlBaseSelect');
  const wlBaseQty    = paramCol.querySelector('#wlBaseQty');
  const wlBaseDesc   = paramCol.querySelector('#wlBaseDesc');
  const wlCloud      = paramCol.querySelector('#wlCloud');
  const wlLocal      = paramCol.querySelector('#wlLocal');
  const wlPriceEl    = priceCol.querySelector('#wlPrice');
  const btnWl        = buttonCol.querySelector('#btnWl');

  // Wypełniamy selecta bazami (mogą być potencjalnie różne base)
  const baseItems = category.services.filter(s => s.id && s.id.startsWith("acronis_perWorkload_base"));
  baseItems.forEach(it => {
    const opt = document.createElement('option');
    opt.value = JSON.stringify(it);
    opt.textContent = `${it.label} (${it.price} ${it.currency})`;
    wlBaseSelect.appendChild(opt);
  });

  function updateWlPrice() {
    let total = 0;
    if (wlBaseSelect.value) {
      const baseObj = JSON.parse(wlBaseSelect.value);
      wlBaseDesc.textContent = baseObj.desc || "";

      const baseQty = parseInt(wlBaseQty.value, 10) || 0;
      const baseP   = convertPrice(baseObj.price, baseObj.currency || "PLN");
      if (baseQty > 0) {
        total += baseQty * baseP;
      }
    } else {
      wlBaseDesc.textContent = "";
    }

    const cloudVal = parseInt(wlCloud.value, 10) || 0;
    if (cloudVal > 0 && cloudOption) {
      const cP = convertPrice(cloudOption.price, cloudOption.currency || "PLN");
      total += cloudVal * cP;
    }

    const localVal = parseInt(wlLocal.value, 10) || 0;
    if (localVal > 0 && localOption) {
      const lP = convertPrice(localOption.price, localOption.currency || "PLN");
      total += localVal * lP;
    }

    wlPriceEl.textContent = total.toFixed(2);
  }

  [wlBaseSelect, wlBaseQty, wlCloud, wlLocal].forEach(el => {
    el.addEventListener('input', updateWlPrice);
    el.addEventListener('change', updateWlPrice);
  });

  updateWlPrice();

  btnWl.addEventListener('click', () => {
    const total = parseFloat(wlPriceEl.textContent) || 0;
    if (!wlBaseSelect.value) {
      alert(alertText);
      return;
    }
    const baseQty = parseInt(wlBaseQty.value, 10) || 0;
    const cloudVal= parseInt(wlCloud.value, 10)   || 0;
    const localVal= parseInt(wlLocal.value, 10)   || 0;

    if (baseQty <= 0 || (cloudVal <= 0 && localVal <= 0)) {
      alert(alertText);
      return;
    }

    let desc = `Base x${baseQty}`;
    if (cloudVal > 0) desc += `, Cloud x${cloudVal}`;
    if (localVal > 0) desc += `, Local x${localVal}`;

    cart.push({
      name: secTitle,
      details: desc,
      price: total
    });
    renderCart();
  });
}

// 4.3 M365/GSuite
function renderAcronisM365GSuiteSection(category, container, labels) {
  const m365 = category.services.find(s => s.id === "acronis_M365_GSuite_kopia");
  const arch = category.services.find(s => s.id === "acronis_M365_GSuite_archiwizacja");
  const gsui= category.services.find(s => s.id === "acronis_M365_GSuite_gsuite");

  if (!m365 || !arch || !gsui) return;

  const secTitle = labels.m365SectionTitle || "Kopie zapasowe M365 i G-Suite";
  const sec = createSection(secTitle);

  // 1) Kopia M365
  {
    const { row, paramCol, priceCol, buttonCol } = createFlexRow();

    paramCol.innerHTML = `
      <div class="inline-fields">
        <label>${m365.label}:</label>
        <input type="number" id="m365Qty" value="0" min="0" style="width:60px;">
        <i class="bi bi-info-circle text-muted" data-bs-toggle="tooltip" title="${m365.tip || ''}"></i>
      </div>
      <div class="inline-fields">
        <label>Zaawansowany:</label>
        <input type="checkbox" id="m365Adv">
      </div>
    `;
    priceCol.innerHTML = `<strong><span id="m365Price">0.00</span> PLN</strong>`;
    buttonCol.innerHTML = `<button class="btn btn-primary" id="btnM365">${labels.addToCartBtn || 'Dodaj'}</button>`;
    sec.bodyContainer.appendChild(row);

    const m365Qty = paramCol.querySelector('#m365Qty');
    const m365Adv = paramCol.querySelector('#m365Adv');
    const m365PriceEl = priceCol.querySelector('#m365Price');
    const btnM365 = buttonCol.querySelector('#btnM365');

    function updateM365() {
      const qty = parseInt(m365Qty.value, 10) || 0;
      const base = convertPrice(m365.price, m365.currency || "PLN");
      let extra = 0;
      if (m365Adv.checked) extra = 10; // "przykładowa" dopłata

      m365PriceEl.textContent = ((base + extra) * qty).toFixed(2);
    }

    [m365Qty, m365Adv].forEach(el => el.addEventListener('input', updateM365));
    updateM365();

    btnM365.addEventListener('click', () => {
      const qty = parseInt(m365Qty.value, 10) || 0;
      if (qty <= 0) {
        alert("Podaj ilość > 0");
        return;
      }
      const base = convertPrice(m365.price, m365.currency || "PLN");
      let extra = m365Adv.checked ? 10 : 0;
      const total = (base + extra) * qty;

      cart.push({
        name: secTitle,
        details: `${m365.label} x${qty}${m365Adv.checked ? ' (zaawansowany)' : ''}`,
        price: total
      });
      renderCart();
    });
  }

  // 2) Archiwizacja M365
  {
    const { row, paramCol, priceCol, buttonCol } = createFlexRow();
    paramCol.innerHTML = `
      <div class="inline-fields">
        <label>${arch.label}:</label>
        <input type="number" id="archQty" value="0" min="0" style="width:60px;">
        <i class="bi bi-info-circle text-muted" data-bs-toggle="tooltip" title="${arch.tip || ''}"></i>
      </div>
    `;
    priceCol.innerHTML = `<strong><span id="archPrice">0.00</span> PLN</strong>`;
    buttonCol.innerHTML = `<button class="btn btn-primary" id="btnArch">${labels.addToCartBtn || 'Dodaj'}</button>`;
    sec.bodyContainer.appendChild(row);

    const archQty = paramCol.querySelector('#archQty');
    const archPriceEl = priceCol.querySelector('#archPrice');
    const btnArch = buttonCol.querySelector('#btnArch');

    function updateArch() {
      const qty = parseInt(archQty.value, 10) || 0;
      const p   = convertPrice(arch.price, arch.currency || "PLN");
      archPriceEl.textContent = (p * qty).toFixed(2);
    }
    archQty.addEventListener('input', updateArch);
    updateArch();

    btnArch.addEventListener('click', () => {
      const qty = parseInt(archQty.value, 10) || 0;
      if (qty <= 0) {
        alert("Podaj ilość > 0");
        return;
      }
      const p = convertPrice(arch.price, arch.currency);
      const total = p * qty;

      cart.push({
        name: secTitle,
        details: `${arch.label} x${qty}`,
        price: total
      });
      renderCart();
    });
  }

  // 3) G-Suite
  {
    const { row, paramCol, priceCol, buttonCol } = createFlexRow();
    paramCol.innerHTML = `
      <div class="inline-fields">
        <label>${gsui.label}:</label>
        <input type="number" id="gsuiQty" value="0" min="0" style="width:60px;">
        <i class="bi bi-info-circle text-muted" data-bs-toggle="tooltip" title="${gsui.tip || ''}"></i>
      </div>
    `;
    priceCol.innerHTML = `<strong><span id="gsuiPrice">0.00</span> PLN</strong>`;
    buttonCol.innerHTML = `<button class="btn btn-primary" id="btnGsui">${labels.addToCartBtn || 'Dodaj'}</button>`;
    sec.bodyContainer.appendChild(row);

    const gsuiQty = paramCol.querySelector('#gsuiQty');
    const gsuiPriceEl = priceCol.querySelector('#gsuiPrice');
    const btnGsui = buttonCol.querySelector('#btnGsui');

    function updateGsuite() {
      const qty = parseInt(gsuiQty.value, 10) || 0;
      const p = convertPrice(gsui.price, gsui.currency || "PLN");
      gsuiPriceEl.textContent = (p * qty).toFixed(2);
    }
    gsuiQty.addEventListener('input', updateGsuite);
    updateGsuite();

    btnGsui.addEventListener('click', () => {
      const qty = parseInt(gsuiQty.value, 10) || 0;
      if (qty <= 0) {
        alert("Podaj ilość > 0");
        return;
      }
      const p = convertPrice(gsui.price, gsui.currency || "PLN");
      const total = p * qty;

      cart.push({
        name: secTitle,
        details: `${gsui.label} x${qty}`,
        price: total
      });
      renderCart();
    });
  }

  container.appendChild(sec.wrapper);
}

// 4.4 Mechanizmy zabezpieczeń
function renderAcronisSecuritySection(category, container, labels) {
  const services = category.services.filter(s => s.id && s.id.startsWith("acronis_security"));
  if (!services.length) return;

  const secTitle = labels.securitySectionTitle || "Mechanizmy zabezpieczeń";
  const sec = createSection(secTitle);
  const { row, paramCol, priceCol, buttonCol } = createFlexRow();

  paramCol.innerHTML = `
    <div class="inline-fields">
      <label>Wybierz rozwiązanie:</label>
      <select id="acrSecSelect" class="form-select" style="width:auto; min-width:150px;">
        <option value="" disabled selected>-- wybierz --</option>
      </select>
      <label>Ilość:</label>
      <input type="number" id="acrSecQty" value="0" min="0" style="width:60px;">
    </div>
    <div id="acrSecDesc" class="text-muted" style="font-size:0.85rem; margin-top:4px;"></div>
  `;
  priceCol.innerHTML = `<strong><span id="acrSecPrice">0.00</span> PLN</strong>`;
  buttonCol.innerHTML = `<button class="btn btn-primary" id="btnAcrSec">${labels.addToCartBtn || 'Dodaj'}</button>`;

  sec.bodyContainer.appendChild(row);
  container.appendChild(sec.wrapper);

  const acrSecSelect = paramCol.querySelector('#acrSecSelect');
  const acrSecQty    = paramCol.querySelector('#acrSecQty');
  const acrSecDesc   = paramCol.querySelector('#acrSecDesc');
  const acrSecPriceEl= priceCol.querySelector('#acrSecPrice');
  const btnAcrSec    = buttonCol.querySelector('#btnAcrSec');

  services.forEach(srv => {
    const opt = document.createElement('option');
    opt.value = JSON.stringify(srv);
    opt.textContent = `${srv.label} (${srv.price} ${srv.currency})`;
    acrSecSelect.appendChild(opt);
  });

  function updateAcrSecPrice() {
    if (!acrSecSelect.value) {
      acrSecPriceEl.textContent = '0.00';
      acrSecDesc.textContent = '';
      return;
    }
    const srv = JSON.parse(acrSecSelect.value);
    const qty = parseInt(acrSecQty.value, 10) || 0;
    const p   = convertPrice(srv.price, srv.currency || "PLN");
    acrSecPriceEl.textContent = (p * qty).toFixed(2);
    acrSecDesc.textContent = srv.desc || "";
  }

  acrSecSelect.addEventListener('change', updateAcrSecPrice);
  acrSecQty.addEventListener('input', updateAcrSecPrice);
  updateAcrSecPrice();

  btnAcrSec.addEventListener('click', () => {
    if (!acrSecSelect.value) {
      alert("Wybierz rozwiązanie zabezpieczeń!");
      return;
    }
    const srv = JSON.parse(acrSecSelect.value);
    const qty = parseInt(acrSecQty.value, 10) || 0;
    if (qty <= 0) {
      alert("Podaj ilość > 0!");
      return;
    }
    const p = convertPrice(srv.price, srv.currency || "PLN");
    const total = p * qty;

    cart.push({
      name: secTitle,
      details: `${srv.label} x${qty}`,
      price: total
    });
    renderCart();
  });
}

// 4.5 Zarządzanie stacjami i serwerami
function renderAcronisManagementSection(category, container, labels) {
  const services = category.services.filter(s => s.id && s.id.startsWith("acronis_management"));
  if (!services.length) return;

  const secTitle = labels.managementSectionTitle || "Zarządzanie stacjami i serwerami";
  const sec = createSection(secTitle);
  const { row, paramCol, priceCol, buttonCol } = createFlexRow();

  paramCol.innerHTML = `
    <div class="inline-fields">
      <label>Wybierz rozwiązanie:</label>
      <select id="acrMgmtSelect" class="form-select" style="width:auto; min-width:150px;">
        <option value="" disabled selected>-- wybierz --</option>
      </select>
      <label>Ilość:</label>
      <input type="number" id="acrMgmtQty" value="0" min="0" style="width:60px;">
    </div>
    <div id="acrMgmtDesc" class="text-muted" style="font-size:0.85rem; margin-top:4px;"></div>
  `;
  priceCol.innerHTML = `<strong><span id="acrMgmtPrice">0.00</span> PLN</strong>`;
  buttonCol.innerHTML = `<button class="btn btn-primary" id="btnAcrMgmt">${labels.addToCartBtn || 'Dodaj'}</button>`;

  sec.bodyContainer.appendChild(row);
  container.appendChild(sec.wrapper);

  const acrMgmtSelect = paramCol.querySelector('#acrMgmtSelect');
  const acrMgmtQty    = paramCol.querySelector('#acrMgmtQty');
  const acrMgmtDesc   = paramCol.querySelector('#acrMgmtDesc');
  const acrMgmtPriceEl= priceCol.querySelector('#acrMgmtPrice');
  const btnAcrMgmt    = buttonCol.querySelector('#btnAcrMgmt');

  services.forEach(srv => {
    const opt = document.createElement('option');
    opt.value = JSON.stringify(srv);
    opt.textContent = `${srv.label} (${srv.price} ${srv.currency})`;
    acrMgmtSelect.appendChild(opt);
  });

  function updateAcrMgmtPrice() {
    if (!acrMgmtSelect.value) {
      acrMgmtPriceEl.textContent = '0.00';
      acrMgmtDesc.textContent = '';
      return;
    }
    const srv = JSON.parse(acrMgmtSelect.value);
    const qty = parseInt(acrMgmtQty.value, 10) || 0;
    const p   = convertPrice(srv.price, srv.currency || "PLN");

    acrMgmtPriceEl.textContent = (p * qty).toFixed(2);
    acrMgmtDesc.textContent = srv.desc || "";
  }

  acrMgmtSelect.addEventListener('change', updateAcrMgmtPrice);
  acrMgmtQty.addEventListener('input', updateAcrMgmtPrice);
  updateAcrMgmtPrice();

  btnAcrMgmt.addEventListener('click', () => {
    if (!acrMgmtSelect.value) {
      alert("Wybierz rozwiązanie zarządzania!");
      return;
    }
    const srv = JSON.parse(acrMgmtSelect.value);
    const qty = parseInt(acrMgmtQty.value, 10) || 0;
    if (qty <= 0) {
      alert("Podaj ilość > 0!");
      return;
    }
    const p = convertPrice(srv.price, srv.currency || "PLN");
    const total = p * qty;

    cart.push({
      name: secTitle,
      details: `${srv.label} x${qty}`,
      price: total
    });
    renderCart();
  });
}

/****************************************************************************************************
 * 5. Microsoft CSP – Microsoft 365
 ****************************************************************************************************/
function renderMicrosoft365Section(category, container) {
  const secTitle = (category.labels && category.labels.sectionTitle) 
    ? category.labels.sectionTitle 
    : "Microsoft 365";

  const sec = createSection(secTitle);
  const { row, paramCol, priceCol, buttonCol } = createFlexRow();

  const desc = (category.labels && category.labels.sectionDescription) || "";
  const lblSelect = (category.labels && category.labels.selectLabel) || "Subskrypcja:";
  const lblQty    = (category.labels && category.labels.qtyLabel)    || "Ilość:";
  const btnTxt    = (category.labels && category.labels.addToCartBtn)|| "Dodaj";

  paramCol.innerHTML = `
    <p class="text-muted" style="margin-bottom:8px;">${desc}</p>
    <div class="inline-fields">
      <label>${lblSelect}</label>
      <select id="m365Select" class="form-select" style="width:auto; min-width:150px;">
        <option value="" disabled selected>-- wybierz --</option>
      </select>
      <label>${lblQty}</label>
      <input type="number" id="m365Qty" value="1" min="1" style="width:60px;">
    </div>
    <div id="m365Info" class="text-muted" style="font-size:0.85rem; margin-top:4px;"></div>
  `;
  priceCol.innerHTML = `<strong><span id="m365Price">0.00</span> PLN</strong>`;
  buttonCol.innerHTML = `<button class="btn btn-primary" id="btnAddM365">${btnTxt}</button>`;

  sec.bodyContainer.appendChild(row);
  container.appendChild(sec.wrapper);

  const m365Select   = paramCol.querySelector('#m365Select');
  const m365Qty      = paramCol.querySelector('#m365Qty');
  const m365Info     = paramCol.querySelector('#m365Info');
  const m365PriceEl  = priceCol.querySelector('#m365Price');
  const btnAddM365   = buttonCol.querySelector('#btnAddM365');

  if (category.msCspServices && category.msCspServices.length) {
    category.msCspServices.forEach(srv => {
      const opt = document.createElement('option');
      opt.value = JSON.stringify(srv);
      opt.textContent = `${srv.label} (${srv.price} ${srv.currency})`;
      m365Select.appendChild(opt);
    });
  }

  function updateM365Price() {
    if (!m365Select.value) {
      m365PriceEl.textContent = '0.00';
      m365Info.textContent = '';
      return;
    }
    const srv = JSON.parse(m365Select.value);
    const qty = parseInt(m365Qty.value, 10) || 1;
    const p = convertPrice(srv.price, srv.currency || "PLN");
    m365PriceEl.textContent = (p * qty).toFixed(2);
    m365Info.textContent = srv.desc || "";
  }

  m365Select.addEventListener('change', updateM365Price);
  m365Qty.addEventListener('input', updateM365Price);
  updateM365Price();

  btnAddM365.addEventListener('click', () => {
    if (!m365Select.value) {
      alert("Wybierz subskrypcję Microsoft 365!");
      return;
    }
    const srv = JSON.parse(m365Select.value);
    const qty = parseInt(m365Qty.value, 10) || 1;
    const p = convertPrice(srv.price, srv.currency || "PLN");
    const total = p * qty;

    cart.push({
      name: "Microsoft 365",
      details: `${srv.label} x${qty}`,
      price: total
    });
    renderCart();
  });
}

/****************************************************************************************************
 * 6. Bezpieczeństwo
 ****************************************************************************************************/
function renderSecurityWebAppsSection(category, container) {
  if (!category.securityWebApp || !category.securityWebApp.length) return;

  const lblTitle = (category.labels && category.labels.webAppsTitle) || "Aplikacje webowe";
  const sec = createSection(lblTitle);
  const { row, paramCol, priceCol, buttonCol } = createFlexRow();

  paramCol.innerHTML = `
    <div class="inline-fields">
      <label>Wybierz usługę:</label>
      <select id="webAppSelect" class="form-select" style="width:auto; min-width:150px;">
        <option value="" disabled selected>-- wybierz --</option>
      </select>
    </div>
    <div id="webAppDesc" class="text-muted" style="font-size:0.85rem; margin-top:4px;"></div>
  `;
  priceCol.innerHTML = `<strong><span id="webAppPrice">0.00</span> PLN</strong>`;
  buttonCol.innerHTML = `<button class="btn btn-primary" id="btnAddWebApp">${(category.labels && category.labels.addToCartBtn) || 'Dodaj'}</button>`;

  sec.bodyContainer.appendChild(row);
  container.appendChild(sec.wrapper);

  const webAppSelect  = paramCol.querySelector('#webAppSelect');
  const webAppDesc    = paramCol.querySelector('#webAppDesc');
  const webAppPriceEl = priceCol.querySelector('#webAppPrice');
  const btnAddWebApp  = buttonCol.querySelector('#btnAddWebApp');

  category.securityWebApp.forEach(srv => {
    const opt = document.createElement('option');
    opt.value = JSON.stringify(srv);
    opt.textContent = `${srv.label} (${srv.price} ${srv.currency})`;
    webAppSelect.appendChild(opt);
  });

  function updateWebAppPrice() {
    if (!webAppSelect.value) {
      webAppPriceEl.textContent = "0.00";
      webAppDesc.textContent = "";
      return;
    }
    const srv = JSON.parse(webAppSelect.value);
    const p = convertPrice(srv.price, srv.currency || "PLN");
    webAppPriceEl.textContent = p.toFixed(2);
    webAppDesc.textContent = srv.desc || "";
  }

  webAppSelect.addEventListener('change', updateWebAppPrice);
  updateWebAppPrice();

  btnAddWebApp.addEventListener('click', () => {
    if (!webAppSelect.value) {
      alert("Wybierz usługę skanowania!");
      return;
    }
    const srv = JSON.parse(webAppSelect.value);
    const p   = convertPrice(srv.price, srv.currency || "PLN");

    cart.push({
      name: lblTitle,
      details: srv.label,
      price: p
    });
    renderCart();
  });
}

function renderSecurityFirewallSection(category, container) {
  if (!category.securityFW || !category.securityFW.length) return;

  const lblTitle = (category.labels && category.labels.firewallTitle) || "Firewall w chmurze";
  const sec = createSection(lblTitle);
  const { row, paramCol, priceCol, buttonCol } = createFlexRow();

  paramCol.innerHTML = `
    <div class="inline-fields">
      <label>Wybierz usługę:</label>
      <select id="fwSelect" class="form-select" style="width:auto; min-width:150px;">
        <option value="" disabled selected>-- wybierz --</option>
      </select>
    </div>
    <div id="fwDesc" class="text-muted" style="font-size:0.85rem; margin-top:4px;"></div>
  `;
  priceCol.innerHTML = `<strong><span id="fwPrice">0.00</span> PLN</strong>`;
  buttonCol.innerHTML = `<button class="btn btn-primary" id="btnAddFW">${(category.labels && category.labels.addToCartBtn) || 'Dodaj'}</button>`;

  sec.bodyContainer.appendChild(row);
  container.appendChild(sec.wrapper);

  const fwSelect    = paramCol.querySelector('#fwSelect');
  const fwDesc      = paramCol.querySelector('#fwDesc');
  const fwPriceEl   = priceCol.querySelector('#fwPrice');
  const btnAddFW    = buttonCol.querySelector('#btnAddFW');

  category.securityFW.forEach(srv => {
    const opt = document.createElement('option');
    opt.value = JSON.stringify(srv);
    opt.textContent = `${srv.label} (${srv.price} ${srv.currency})`;
    fwSelect.appendChild(opt);
  });

  function updateFwPrice() {
    if (!fwSelect.value) {
      fwPriceEl.textContent = "0.00";
      fwDesc.textContent = "";
      return;
    }
    const srv = JSON.parse(fwSelect.value);
    const p = convertPrice(srv.price, srv.currency || "PLN");
    fwPriceEl.textContent = p.toFixed(2);
    fwDesc.textContent = srv.desc || "";
  }

  fwSelect.addEventListener('change', updateFwPrice);
  updateFwPrice();

  btnAddFW.addEventListener('click', () => {
    if (!fwSelect.value) {
      alert("Wybierz Firewall!");
      return;
    }
    const srv = JSON.parse(fwSelect.value);
    const p   = convertPrice(srv.price, srv.currency || "PLN");

    cart.push({
      name: lblTitle,
      details: srv.label,
      price: p
    });
    renderCart();
  });
}

function renderSecurityAnalysisSection(category, container) {
  const lblTitle   = (category.labels && category.labels.analysisTitle) || "Analiza zabezpieczeń";
  const centralTip = (category.labels && category.labels.centralLoggingTooltip) || "Central Logging?";
  const memTip     = (category.labels && category.labels.memoryTooltip) || "Memory?";

  const sec = createSection(lblTitle);
  const { row, paramCol, priceCol, buttonCol } = createFlexRow();

  paramCol.innerHTML = `
    <div class="inline-fields">
      <label>Centralne logowanie (szt.):</label>
      <input type="number" id="centralLog" value="0" min="0" style="width:60px;">
      <i class="bi bi-info-circle text-muted"
         data-bs-toggle="tooltip"
         title="${centralTip}"></i>
    </div>
    <div class="inline-fields mt-2">
      <label>Pamięć do logowania (GB):</label>
      <input type="number" id="memoryGB" value="0" min="0" style="width:60px;">
      <i class="bi bi-info-circle text-muted"
         data-bs-toggle="tooltip"
         title="${memTip}"></i>
    </div>
  `;
  priceCol.innerHTML = `<strong><span id="analysisPrice">0.00</span> PLN</strong>`;
  buttonCol.innerHTML = `<button class="btn btn-primary" id="btnAddAnalysis">${(category.labels && category.labels.addToCartBtn) || 'Dodaj'}</button>`;

  sec.bodyContainer.appendChild(row);
  container.appendChild(sec.wrapper);

  const centralLog = paramCol.querySelector('#centralLog');
  const memoryGB   = paramCol.querySelector('#memoryGB');
  const analysisPriceEl = priceCol.querySelector('#analysisPrice');
  const btnAddAnal = buttonCol.querySelector('#btnAddAnalysis');

  function updateAnalysis() {
    let total = 0;
    const logVal = parseInt(centralLog.value, 10) || 0;
    const memVal = parseInt(memoryGB.value, 10)   || 0;

    if (logVal > 0) {
      total += (logVal * 20); 
      total += memVal; 
    }

    analysisPriceEl.textContent = total.toFixed(2);
  }

  [centralLog, memoryGB].forEach(el => el.addEventListener('input', updateAnalysis));
  updateAnalysis();

  btnAddAnal.addEventListener('click', () => {
    const logVal = parseInt(centralLog.value, 10) || 0;
    const memVal = parseInt(memoryGB.value, 10)   || 0;

    // Przykład walidacji
    if (logVal > 0 && memVal < 5) {
      alert("Jeśli używasz centralnego logowania, pamięć musi być min. 5GB!");
      return;
    }
    let desc = (logVal > 0) 
      ? `CentralLog=${logVal}, Memory=${memVal}GB`
      : "Brak analizy (0)";

    let total = parseFloat(analysisPriceEl.textContent) || 0;

    cart.push({
      name: lblTitle,
      details: desc,
      price: total
    });
    renderCart();
  });
}
/**
 * exportCartToXLS – generuje plik .xls (HTML) z zawartością koszyka
 * i wywołuje pobranie (download) przez przeglądarkę
 */
function exportCartToXLS() {
  if (!cart.length) {
    alert("Koszyk jest pusty, brak danych do eksportu!");
    return;
  }

  // Tworzymy prosty HTML w postaci tabeli – Excel potrafi to otworzyć:
  let html = `
    <table border="1">
      <thead>
        <tr>
          <th>Kategoria</th>
          <th>Szczegóły</th>
          <th>Cena (PLN)</th>
        </tr>
      </thead>
      <tbody>
  `;

  cart.forEach(item => {
    html += `
      <tr>
        <td>${item.name}</td>
        <td>${item.details}</td>
        <td>${item.price.toFixed(2)}</td>
      </tr>
    `;
  });

  // Policzmy sumę:
  const sum = cart.reduce((acc, item) => acc + item.price, 0).toFixed(2);

  html += `
      <tr>
        <td colspan="2"><strong>Razem</strong></td>
        <td><strong>${sum}</strong></td>
      </tr>
    </tbody>
    </table>
  `;

  // Stworzymy data URI z typem: vnd.ms-excel
  const blob = new Blob([html], { type: 'application/vnd.ms-excel' });
  const url = URL.createObjectURL(blob);

  // Tworzymy tymczasowy link <a>, symulujemy kliknięcie -> ściąga plik
  const a = document.createElement('a');
  a.href = url;
  a.download = `wycena_${new Date().toISOString().slice(0,10)}.xls`; // nazwa pliku
  document.body.appendChild(a);
  a.click();

  // Usuwamy link i zwalniamy URL
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}


