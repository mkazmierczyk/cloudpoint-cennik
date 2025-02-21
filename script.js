let categoriesData = [];
let cart = [];

document.addEventListener('DOMContentLoaded', () => {
  fetch('data.json')
    .then(res => res.json())
    .then(data => {
      categoriesData = data.categories;
      renderCategoriesMenu(categoriesData);
    })
    .catch(err => console.error("Błąd wczytywania data.json:", err));
});

/** MENU KATEGORII */
function renderCategoriesMenu(categories) {
  const menuUl = document.getElementById('categoriesMenu');
  menuUl.innerHTML = '';
  categories.forEach((cat, index) => {
    const li = document.createElement('li');
    const link = document.createElement('a');
    link.href = '#';
    link.textContent = cat.name;
    link.addEventListener('click', (e) => {
      e.preventDefault();
      selectCategory(index);
      document.querySelectorAll('#categoriesMenu a').forEach(a => a.classList.remove('active'));
      link.classList.add('active');
    });
    li.appendChild(link);
    menuUl.appendChild(li);
  });
}

/** WYBÓR KATEGORII */
function selectCategory(catIndex) {
  const category = categoriesData[catIndex];
  const titleEl = document.getElementById('categoryTitle');
  const descEl = document.getElementById('categoryDesc');
  const plansWrapper = document.getElementById('plansTableWrapper');
  const plansBody = document.getElementById('plansTableBody');

  titleEl.textContent = category.name;
  descEl.textContent = `Opcje dostępne w kategorii: ${category.name}.`;

  plansWrapper.style.display = 'block';
  plansBody.innerHTML = '';

  if (category.type === 'iaas') {
    renderIaaS(category, plansBody);
    renderMsLicSection(category, plansBody);
  }
  else if (category.type === 'paas') {
    renderPaaSMachinesSection(category, plansBody);
    renderMsLicSection(category, plansBody);
    renderPaaSDisasterRecoverySection(category, plansBody);
  }
  else if (category.type === 'saas') {
    renderSaaSApplications(category, plansBody);
    renderMsLicSection(category, plansBody);
  }
  else {
    // Acronis, CSP
    renderServicesList(category, plansBody);
  }

  initTooltips();
}

/** ***** IaaS ***** */
function renderIaaS(category, plansBody) {
  const headerTr = document.createElement('tr');
  headerTr.innerHTML = `
    <td colspan="3">
      <h5 class="mb-3">Maszyny wirtualne (IaaS)</h5>
    </td>
  `;
  plansBody.appendChild(headerTr);

  const contentTr = document.createElement('tr');
  contentTr.innerHTML = `
    <td>
      <div class="mb-2">
        <label class="form-label me-2">CPU (vCore): <span id="cpuValue">1</span></label>
        <input type="range" id="cpuSlider" min="${category.sliders[0].min}" max="${category.sliders[0].max}" step="${category.sliders[0].step}" value="${category.sliders[0].min}" style="width:150px;">
      </div>
      <div class="mb-2">
        <label class="form-label me-2">RAM (GB): <span id="ramValue">${category.sliders[1].min}</span></label>
        <input type="range" id="ramSlider" min="${category.sliders[1].min}" max="${category.sliders[1].max}" step="${category.sliders[1].step}" value="${category.sliders[1].min}" style="width:150px;">
      </div>
      <div class="mb-2">
        <label class="form-label me-2">SSD (GB): <span id="ssdValue">${category.sliders[2].min}</span></label>
        <input type="range" id="ssdSlider" min="${category.sliders[2].min}" max="${category.sliders[2].max}" step="${category.sliders[2].step}" value="${category.sliders[2].min}" style="width:150px;">
      </div>

      <!-- Kopie zapasowe -->
      <div class="mb-2">
        <label class="form-label me-2">
          Kopie zapasowe (GB)
          <i class="bi bi-info-circle text-muted ms-1" data-bs-toggle="tooltip"
             title="Rozmiar kopii zależny od wielkości VM."></i>
        </label>
        <input type="number" id="backupGB" min="0" value="0" style="width:80px;" class="form-control d-inline-block">
      </div>
      <!-- Public IP -->
      <div class="form-check">
        <input class="form-check-input" type="checkbox" id="publicIP">
        <label class="form-check-label" for="publicIP">
          Dodatkowe publiczne IP
          <i class="bi bi-info-circle text-muted ms-1" data-bs-toggle="tooltip"
             title="Jeśli VM wymaga osobnego IP."></i>
        </label>
      </div>
    </td>
    <td>
      <span id="iaasPrice">0.00</span> PLN
    </td>
    <td>
      <button class="btn btn-outline-primary" id="btnAddIaas">
        Dodaj do koszyka
      </button>
    </td>
  `;
  plansBody.appendChild(contentTr);

  const cpuSlider = contentTr.querySelector('#cpuSlider');
  const ramSlider = contentTr.querySelector('#ramSlider');
  const ssdSlider = contentTr.querySelector('#ssdSlider');
  const backupInput = contentTr.querySelector('#backupGB');
  const publicIPCheck = contentTr.querySelector('#publicIP');
  const priceEl = contentTr.querySelector('#iaasPrice');

  function updateIaaSPrice() {
    let total = 0;
    const cpuVal = parseInt(cpuSlider.value, 10);
    const ramVal = parseInt(ramSlider.value, 10);
    const ssdVal = parseInt(ssdSlider.value, 10);
    const backupVal = parseFloat(backupInput.value) || 0;

    total += cpuVal * category.sliders[0].pricePerUnit;
    total += ramVal * category.sliders[1].pricePerUnit;
    total += ssdVal * category.sliders[2].pricePerUnit;

    if (backupVal > 0 && category.backupPricePerGB) {
      total += backupVal * category.backupPricePerGB;
    }
    if (publicIPCheck.checked && category.publicIPPrice) {
      total += category.publicIPPrice;
    }

    contentTr.querySelector('#cpuValue').textContent = cpuVal;
    contentTr.querySelector('#ramValue').textContent = ramVal;
    contentTr.querySelector('#ssdValue').textContent = ssdVal;
    priceEl.textContent = total.toFixed(2);
  }

  cpuSlider.addEventListener('input', updateIaaSPrice);
  ramSlider.addEventListener('input', updateIaaSPrice);
  ssdSlider.addEventListener('input', updateIaaSPrice);
  backupInput.addEventListener('input', updateIaaSPrice);
  publicIPCheck.addEventListener('change', updateIaaSPrice);
  updateIaaSPrice();

  const addBtn = contentTr.querySelector('#btnAddIaas');
  addBtn.addEventListener('click', () => {
    const total = parseFloat(priceEl.textContent) || 0;
    const cpuVal = parseInt(cpuSlider.value, 10);
    const ramVal = parseInt(ramSlider.value, 10);
    const ssdVal = parseInt(ssdSlider.value, 10);
    const backupVal = parseFloat(backupInput.value) || 0;
    const pubIP = publicIPCheck.checked;

    let desc = `CPU=${cpuVal}, RAM=${ramVal}GB, SSD=${ssdVal}GB`;
    if (backupVal > 0) desc += `, Backup=${backupVal}GB`;
    if (pubIP) desc += `, +PublicIP`;

    cart.push({
      name: category.name,
      details: desc,
      price: total
    });
    renderCart();
  });
}

/** PaaS */
function renderPaaSMachinesSection(category, plansBody) {
  // Tytuł
  const headerTr = document.createElement('tr');
  headerTr.innerHTML = `
    <td colspan="3">
      <h5 class="mb-3">Maszyny wirtualne (PaaS)</h5>
    </td>
  `;
  plansBody.appendChild(headerTr);

  // Wiersz
  const contentTr = document.createElement('tr');
  contentTr.innerHTML = `
    <td>
      <!-- instancja -->
      <div class="mb-2">
        <label class="form-label me-2">Wybierz instancję:</label>
        <select id="paasInstanceSelect" class="form-select d-inline-block" style="width:auto; min-width:150px;">
          <option value="" disabled selected>-- wybierz --</option>
        </select>
        <div id="paasInstanceDesc" class="text-muted mt-1" style="font-size:0.85rem;"></div>
      </div>

      <!-- wsparcie -->
      <div class="mb-2">
        <label class="form-label me-2">Wsparcie techniczne:</label>
        <select id="paasSupportSelect" class="form-select d-inline-block" style="width:auto; min-width:200px;">
          <option value="" disabled selected>-- wybierz --</option>
          <option value="gold">C-SUPPORT-GOLD</option>
          <option value="platinum">C-SUPPORT-PLATINUM-AddON</option>
        </select>
        <div id="paasSupportDesc" class="text-muted mt-1" style="font-size:0.85rem;"></div>
      </div>

      <!-- Dysk SSD -->
      <div class="mb-2">
        <label class="form-label me-2">Dysk SSD (GB):</label>
        <input type="number" id="paasSsdGB" min="0" value="0" style="width:80px;" class="form-control d-inline-block">
      </div>

      <!-- Kopie zapasowe -->
      <div class="mb-2">
        <label class="form-label me-2">
          Kopie zapasowe (GB)
          <i class="bi bi-info-circle text-muted ms-1" data-bs-toggle="tooltip"
             title="Rozmiar kopii zależny od wielkości instancji."></i>
        </label>
        <input type="number" id="paasBackupGB" min="0" value="0" style="width:80px;" class="form-control d-inline-block">
      </div>

      <!-- IP -->
      <div class="form-check">
        <input class="form-check-input" type="checkbox" id="paasPublicIP">
        <label class="form-check-label" for="paasPublicIP">
          Dodatkowe publiczne IP
          <i class="bi bi-info-circle text-muted ms-1" data-bs-toggle="tooltip"
             title="Wymagane jeśli chcesz osobny adres IP."></i>
        </label>
      </div>
    </td>
    <td>
      <span id="paasPrice">0.00</span> PLN
    </td>
    <td>
      <button class="btn btn-outline-primary" id="btnAddPaaS">
        Dodaj do koszyka
      </button>
    </td>
  `;
  plansBody.appendChild(contentTr);

  const instSelect = contentTr.querySelector('#paasInstanceSelect');
  const instDescEl = contentTr.querySelector('#paasInstanceDesc');
  const supportSelect = contentTr.querySelector('#paasSupportSelect');
  const supportDescEl = contentTr.querySelector('#paasSupportDesc');
  const ssdInput = contentTr.querySelector('#paasSsdGB');
  const backupInput = contentTr.querySelector('#paasBackupGB');
  const ipCheck = contentTr.querySelector('#paasPublicIP');
  const priceEl = contentTr.querySelector('#paasPrice');
  const addBtn = contentTr.querySelector('#btnAddPaaS');

  // instancje
  if (category.paasInstances) {
    category.paasInstances.forEach(inst => {
      const opt = document.createElement('option');
      opt.value = inst.price;
      opt.setAttribute('data-label', inst.label);
      opt.setAttribute('data-desc', inst.desc || "");
      opt.textContent = `${inst.label} (${inst.price} PLN)`;
      instSelect.appendChild(opt);
    });
  }

  function updateInstDesc() {
    if (!instSelect.value) {
      instDescEl.textContent = "";
      return;
    }
    const sel = instSelect.options[instSelect.selectedIndex];
    instDescEl.textContent = sel.getAttribute('data-desc') || "";
  }

  function updateSupportDesc() {
    let txt = "";
    if (supportSelect.value === 'gold') {
      txt = category.supportGoldDesc || "";
    } else if (supportSelect.value === 'platinum') {
      txt = (category.supportGoldDesc||"") + " " + (category.supportPlatinumDesc||"");
    }
    supportDescEl.textContent = txt.trim();
  }

  function updatePaaSPrice() {
    let total = 0;
    const instPrice = parseFloat(instSelect.value) || 0;
    total += instPrice;

    if (supportSelect.value === 'gold') {
      total += (category.supportGoldPrice || 0);
    } else if (supportSelect.value === 'platinum') {
      total += (category.supportGoldPrice || 0);
      total += (category.supportPlatinumAddOnPrice || 0);
    }

    // Dysk SSD
    const ssdVal = parseFloat(ssdInput.value) || 0;
    // Załóżmy 1 PLN/GB dla SSD w PaaS
    total += ssdVal * 1.0;

    // Backup
    const backupVal = parseFloat(backupInput.value) || 0;
    if (backupVal>0 && category.backupPricePerGB) {
      total += backupVal * category.backupPricePerGB;
    }

    if (ipCheck.checked && category.publicIPPrice) {
      total += category.publicIPPrice;
    }
    priceEl.textContent = total.toFixed(2);
  }

  instSelect.addEventListener('change', () => {
    updateInstDesc();
    updatePaaSPrice();
  });
  supportSelect.addEventListener('change', () => {
    updateSupportDesc();
    updatePaaSPrice();
  });
  ssdInput.addEventListener('input', updatePaaSPrice);
  backupInput.addEventListener('input', updatePaaSPrice);
  ipCheck.addEventListener('change', updatePaaSPrice);

  updateInstDesc();
  updateSupportDesc();
  updatePaaSPrice();

  addBtn.addEventListener('click', () => {
    if (!instSelect.value) {
      alert("Musisz wybrać instancję PaaS!");
      return;
    }
    if (!supportSelect.value) {
      alert("Musisz wybrać co najmniej C-SUPPORT-GOLD!");
      return;
    }

    const total = parseFloat(priceEl.textContent) || 0;
    const selInst = instSelect.options[instSelect.selectedIndex];
    const instLabel = selInst.getAttribute('data-label')||"";
    let supDesc = "";
    if (supportSelect.value === 'gold') {
      supDesc = "C-SUPPORT-GOLD";
    } else if (supportSelect.value === 'platinum') {
      supDesc = "C-SUPPORT-GOLD + C-SUPPORT-PLATINUM-AddON";
    }
    const ssdVal = parseFloat(ssdInput.value)||0;
    const backupVal = parseFloat(backupInput.value)||0;
    const ipChecked = ipCheck.checked;

    let desc = `Instancja=${instLabel}, Wsparcie=${supDesc}`;
    if (ssdVal>0) desc += `, SSD=${ssdVal}GB`;
    if (backupVal>0) desc += `, Backup=${backupVal}GB`;
    if (ipChecked) desc += `, +PublicIP`;

    cart.push({
      name: category.name,
      details: desc,
      price: total
    });
    renderCart();
  });
}

/** PaaS DR */
function renderPaaSDisasterRecoverySection(category, plansBody) {
  if (!category.drServices) return;

  const headerTr = document.createElement('tr');
  headerTr.innerHTML = `
    <td colspan="3">
      <h5 class="mt-4 mb-3">Disaster Recovery (PaaS)</h5>
    </td>
  `;
  plansBody.appendChild(headerTr);

  const contentTr = document.createElement('tr');
  contentTr.innerHTML = `
    <td>
      <div class="mb-2" id="drStorageWrap"></div>
      <div class="mb-2" id="drIpWrap"></div>
    </td>
    <td>
      <span id="drPrice">0.00</span> PLN
    </td>
    <td>
      <button class="btn btn-outline-primary" id="btnAddDR">
        Dodaj do koszyka
      </button>
    </td>
  `;
  plansBody.appendChild(contentTr);

  const drStorageWrap = contentTr.querySelector('#drStorageWrap');
  const drIpWrap = contentTr.querySelector('#drIpWrap');
  const drPriceEl = contentTr.querySelector('#drPrice');
  const btnAddDR = contentTr.querySelector('#btnAddDR');

  const storObj = category.drServices.find(s => s.id==='C-DR-STORAGE');
  const ipObj = category.drServices.find(s => s.id==='C-DR-IP');

  drStorageWrap.innerHTML = `
    <label class="form-label me-2">${storObj?.label||'C-DR-STORAGE'}
      <i class="bi bi-info-circle text-muted ms-1" data-bs-toggle="tooltip"
         title="${storObj?.tooltip||''}"></i>
    </label>
    <input type="number" id="drStorageInput" min="0" value="0" style="width:80px;" class="form-control d-inline-block">
  `;
  drIpWrap.innerHTML = `
    <label class="form-label me-2">${ipObj?.label||'C-DR-IP'}
      <i class="bi bi-info-circle text-muted ms-1" data-bs-toggle="tooltip"
         title="${ipObj?.tooltip||''}"></i>
    </label>
    <input type="number" id="drIpInput" min="1" value="1" style="width:80px;" class="form-control d-inline-block">
  `;

  const drStorageInput = contentTr.querySelector('#drStorageInput');
  const drIpInput = contentTr.querySelector('#drIpInput');

  function updateDrPrice() {
    let total = 0;
    const sVal = parseFloat(drStorageInput.value) || 0;
    const iVal = parseFloat(drIpInput.value) || 1;
    if (storObj) total += sVal * storObj.price;
    if (ipObj) total += iVal * ipObj.price;
    drPriceEl.textContent = total.toFixed(2);
  }

  drStorageInput.addEventListener('input', updateDrPrice);
  drIpInput.addEventListener('input', updateDrPrice);
  updateDrPrice();

  btnAddDR.addEventListener('click', () => {
    const sVal = parseFloat(drStorageInput.value)||0;
    const iVal = parseFloat(drIpInput.value)||1;
    if (iVal<1) {
      alert("C-DR-IP musi być co najmniej 1!");
      return;
    }
    let total = 0;
    if (storObj) total += sVal * storObj.price;
    if (ipObj) total += iVal * ipObj.price;

    let desc = `${storObj?.label||'C-DR-STORAGE'}=${sVal}GB, ${ipObj?.label||'C-DR-IP'}=${iVal}`;
    cart.push({
      name: category.name+" (DR)",
      details: desc,
      price: total
    });
    renderCart();
  });
}

/** ***** SaaS (Aplikacje) ***** */
function renderSaaSApplications(category, plansBody) {
  // Nagłówek
  const headerTr = document.createElement('tr');
  headerTr.innerHTML = `
    <td colspan="3">
      <h5 class="mb-3">Aplikacje (SaaS)</h5>
    </td>
  `;
  plansBody.appendChild(headerTr);

  // Wiersz
  const contentTr = document.createElement('tr');
  contentTr.innerHTML = `
    <td>
      <!-- Baza danych MS SQL -->
      <div class="mb-3">
        <label class="form-label fw-bold">Baza danych Microsoft SQL</label><br/>
        <select id="saasMsSqlSelect" class="form-select d-inline-block" style="width:auto; min-width:200px;">
          <option value="" disabled selected>-- wybierz --</option>
        </select>
        <div id="saasMsSqlDesc" class="text-muted mt-1" style="font-size:0.85rem;"></div>
      </div>

      <!-- Enova365Web -->
      <div class="mb-3">
        <label class="form-label fw-bold">Enova365Web</label><br/>
        <select id="enovaWebSelect" class="form-select d-inline-block" style="width:auto; min-width:200px;">
          <option value="" disabled selected>-- wybierz --</option>
        </select>
        <div id="enovaWebDesc" class="text-muted mt-1" style="font-size:0.85rem;"></div>

        <div class="form-check mt-2">
          <input class="form-check-input" type="checkbox" id="enovaHarmony">
          <label class="form-check-label" for="enovaHarmony">Harmonogram zadań</label>
        </div>
      </div>

      <!-- Enova365Web API -->
      <div class="mb-3">
        <label class="form-label fw-bold">Enova365Web API</label><br/>
        <select id="enovaApiSelect" class="form-select d-inline-block" style="width:auto; min-width:200px;">
          <option value="" disabled selected>-- wybierz --</option>
        </select>
        <div id="enovaApiDesc" class="text-muted mt-1" style="font-size:0.85rem;"></div>
      </div>

      <!-- Terminal w chmurze -->
      <div class="mb-3">
        <label class="form-label fw-bold">
          Terminal w chmurze
          <i class="bi bi-info-circle text-muted ms-1" data-bs-toggle="tooltip"
             title="Podaj liczbę użytkowników terminala."></i>
        </label><br/>
        <input type="number" id="terminalUsers" min="0" value="0" style="width:80px;" class="form-control d-inline-block">
        <div class="form-check mt-2">
          <input class="form-check-input" type="checkbox" id="terminalSecurity">
          <label class="form-check-label" for="terminalSecurity">
            Zabezpieczenie terminala przed atakami
          </label>
        </div>
      </div>

      <!-- Dodatkowe miejsce na dane -->
      <div class="mb-3">
        <label class="form-label fw-bold">
          Dodatkowe miejsce na dane
          <i class="bi bi-info-circle text-muted ms-1"
             data-bs-toggle="tooltip"
             title="Wpisz liczbę jednostek potrzebnego miejsca na dane.">
          </i>
        </label><br/>
        <input type="number" id="extraData" min="0" value="0" style="width:80px;" class="form-control d-inline-block">
      </div>
    </td>
    <td>
      <span id="saasAppsPrice">0.00</span> PLN
    </td>
    <td>
      <button class="btn btn-outline-primary" id="btnAddSaasApps">
        Dodaj do koszyka
      </button>
    </td>
  `;
  plansBody.appendChild(contentTr);

  // Pobieramy referencje
  const msSqlSelect = contentTr.querySelector('#saasMsSqlSelect');
  const msSqlDescEl = contentTr.querySelector('#saasMsSqlDesc');

  const enovaWebSelect = contentTr.querySelector('#enovaWebSelect');
  const enovaWebDescEl = contentTr.querySelector('#enovaWebDesc');
  const enovaHarmonyCheck = contentTr.querySelector('#enovaHarmony');

  const enovaApiSelect = contentTr.querySelector('#enovaApiSelect');
  const enovaApiDescEl = contentTr.querySelector('#enovaApiDesc');

  const termUsers = contentTr.querySelector('#terminalUsers');
  const termSecurity = contentTr.querySelector('#terminalSecurity');

  const extraDataInput = contentTr.querySelector('#extraData');

  const priceEl = contentTr.querySelector('#saasAppsPrice');
  const addBtn = contentTr.querySelector('#btnAddSaasApps');

  // Wypełniamy selecty (msSqlDbOptions, enovaWebOptions, enovaWebApiOptions)
  if (category.msSqlDbOptions) {
    category.msSqlDbOptions.forEach(opt => {
      const o = document.createElement('option');
      o.value = opt.price;
      o.setAttribute('data-label', opt.label);
      o.setAttribute('data-desc', opt.desc || "");
      o.textContent = `${opt.label} (${opt.price} PLN)`;
      msSqlSelect.appendChild(o);
    });
  }
  if (category.enovaWebOptions) {
    category.enovaWebOptions.forEach(opt => {
      const o = document.createElement('option');
      o.value = opt.price;
      o.setAttribute('data-label', opt.label);
      o.setAttribute('data-desc', opt.desc || "");
      o.textContent = `${opt.label} (${opt.price} PLN)`;
      enovaWebSelect.appendChild(o);
    });
  }
  if (category.enovaWebApiOptions) {
    category.enovaWebApiOptions.forEach(opt => {
      const o = document.createElement('option');
      o.value = opt.price;
      o.setAttribute('data-label', opt.label);
      o.setAttribute('data-desc', opt.desc || "");
      o.textContent = `${opt.label} (${opt.price} PLN)`;
      enovaApiSelect.appendChild(o);
    });
  }

  // Opisy
  function updateMsSqlDesc() {
    if (!msSqlSelect.value) {
      msSqlDescEl.textContent = "";
      return;
    }
    const sOpt = msSqlSelect.options[msSqlSelect.selectedIndex];
    msSqlDescEl.textContent = sOpt.getAttribute('data-desc') || "";
  }
  function updateEnovaWebDesc() {
    if (!enovaWebSelect.value) {
      enovaWebDescEl.textContent = "";
      return;
    }
    const sOpt = enovaWebSelect.options[enovaWebSelect.selectedIndex];
    enovaWebDescEl.textContent = sOpt.getAttribute('data-desc')||"";
  }
  function updateEnovaApiDesc() {
    if (!enovaApiSelect.value) {
      enovaApiDescEl.textContent = "";
      return;
    }
    const sOpt = enovaApiSelect.options[enovaApiSelect.selectedIndex];
    enovaApiDescEl.textContent = sOpt.getAttribute('data-desc')||"";
  }

  // Obliczanie ceny
  function updateSaasAppsPrice() {
    let total = 0;

    // msSql
    const msSqlVal = parseFloat(msSqlSelect.value)||0;
    total += msSqlVal;

    // enovaWeb
    const enovaWebVal = parseFloat(enovaWebSelect.value)||0;
    total += enovaWebVal;
    // Harmonogram = 0 PLN (nie ma info, więc załóżmy 0)

    // enovaWeb API
    const enovaApiVal = parseFloat(enovaApiSelect.value)||0;
    total += enovaApiVal;

    // Terminal
    const tUsers = parseInt(termUsers.value,10)||0;
    if (tUsers>0) {
      total += tUsers*(category.terminalPricePerUser||0);
    }
    // Security = 0 PLN ?

    // Dodatkowe miejsce
    const extraVal = parseInt(extraDataInput.value,10)||0;
    if (extraVal>0) {
      total += extraVal*(category.extraDataStoragePrice||0);
    }

    priceEl.textContent = total.toFixed(2);
  }

  // Eventy
  msSqlSelect.addEventListener('change', () => {
    updateMsSqlDesc();
    updateSaasAppsPrice();
  });
  enovaWebSelect.addEventListener('change', () => {
    updateEnovaWebDesc();
    updateSaasAppsPrice();
  });
  enovaApiSelect.addEventListener('change', () => {
    updateEnovaApiDesc();
    updateSaasAppsPrice();
  });

  termUsers.addEventListener('input', updateSaasAppsPrice);
  termSecurity.addEventListener('change', updateSaasAppsPrice);
  extraDataInput.addEventListener('input', updateSaasAppsPrice);

  // Inicjalizacje
  updateMsSqlDesc();
  updateEnovaWebDesc();
  updateEnovaApiDesc();
  updateSaasAppsPrice();

  // Dodawanie do koszyka
  addBtn.addEventListener('click', () => {
    const total = parseFloat(priceEl.textContent)||0;

    // Walidacja terminala
    const tUsers = parseInt(termUsers.value,10)||0;
    if (tUsers>0 && !termSecurity.checked) {
      alert("Włącz zabezpieczenie terminala, skoro liczba użytkowników > 0!");
      return;
    }

    // Zbieramy opis
    let descArr = [];

    // msSql
    if (msSqlSelect.value) {
      const sOpt = msSqlSelect.options[msSqlSelect.selectedIndex];
      const label = sOpt.getAttribute('data-label')||"";
      descArr.push(`SQL=${label}`);
    }
    // enovaWeb
    if (enovaWebSelect.value) {
      const sOpt = enovaWebSelect.options[enovaWebSelect.selectedIndex];
      const label = sOpt.getAttribute('data-label')||"";
      descArr.push(`Enova=${label}`);
      if (enovaHarmonyCheck.checked) {
        descArr.push(`+Harmonogram`);
      }
    }
    // enovaApi
    if (enovaApiSelect.value) {
      const sOpt = enovaApiSelect.options[enovaApiSelect.selectedIndex];
      const label = sOpt.getAttribute('data-label')||"";
      descArr.push(`EnovaAPI=${label}`);
    }
    // terminal
    if (tUsers>0) {
      descArr.push(`TerminalUsers=${tUsers}`);
      if (termSecurity.checked) {
        descArr.push(`Zab.Terminal=Yes`);
      }
    }
    // extraData
    const extraVal = parseInt(extraDataInput.value,10)||0;
    if (extraVal>0) {
      descArr.push(`ExtraData=${extraVal}szt.`);
    }

    if (descArr.length===0) {
      alert("Nie wybrano żadnej aplikacji w SaaS!");
      return;
    }

    cart.push({
      name: category.name+" (Aplikacje)",
      details: descArr.join(", "),
      price: total
    });
    renderCart();
  });
}

/** MsLicSection (uniwersalne dla IaaS/PaaS/SaaS) */
function renderMsLicSection(category, plansBody) {
  if (!category.msSplaServices) return;
  const headerTr = document.createElement('tr');
  headerTr.innerHTML = `
    <td colspan="3">
      <h5 class="mt-4 mb-3">Licencje Microsoft</h5>
    </td>
  `;
  plansBody.appendChild(headerTr);

  const contentTr = document.createElement('tr');
  contentTr.innerHTML = `
    <td>
      <label class="form-label me-2">Wybierz licencję:</label>
      <select id="msSelect" class="form-select d-inline-block" style="width:auto; min-width:200px;">
        <option value="" disabled selected>-- wybierz --</option>
      </select>
      <label class="form-label ms-3">Ilość:</label>
      <input type="number" value="1" min="1" id="msQty" style="width:60px;" class="form-control d-inline-block ms-2">
    </td>
    <td>
      <span id="msPrice">0.00</span> PLN
    </td>
    <td>
      <button class="btn btn-outline-primary" id="btnAddMS">
        Dodaj do koszyka
      </button>
    </td>
  `;
  plansBody.appendChild(contentTr);

  const msSelect = contentTr.querySelector('#msSelect');
  const msQty = contentTr.querySelector('#msQty');
  const msPriceEl = contentTr.querySelector('#msPrice');
  const btnAddMS = contentTr.querySelector('#btnAddMS');

  category.msSplaServices.forEach(srv => {
    const opt = document.createElement('option');
    opt.value = srv.price;
    opt.setAttribute('data-label', srv.label);
    opt.textContent = `${srv.label} (${srv.price} PLN)`;
    msSelect.appendChild(opt);
  });

  function updateMsPrice() {
    if (!msSelect.value) {
      msPriceEl.textContent = '0.00';
      return;
    }
    const price = parseFloat(msSelect.value);
    const qty = parseInt(msQty.value, 10)||1;
    msPriceEl.textContent = (price * qty).toFixed(2);
  }

  msSelect.addEventListener('change', updateMsPrice);
  msQty.addEventListener('input', updateMsPrice);
  updateMsPrice();

  btnAddMS.addEventListener('click', () => {
    if (!msSelect.value) {
      alert("Wybierz licencję Microsoft!");
      return;
    }
    const label = msSelect.options[msSelect.selectedIndex].getAttribute('data-label');
    const price = parseFloat(msSelect.value);
    const qty = parseInt(msQty.value, 10)||1;
    const total = price * qty;

    cart.push({
      name: category.name + " (Licencje MS)",
      details: `${label} x${qty}`,
      price: total
    });
    renderCart();
  });
}

/** Proste kategorie (Acronis, CSP) */
function renderServicesList(category, plansBody) {
  if (category.services && category.services.length) {
    category.services.forEach(srv => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${srv.label}</td>
        <td>${srv.price} PLN</td>
        <td><button class="btn btn-outline-primary btn-sm">Dodaj do koszyka</button></td>
      `;
      const btn = tr.querySelector('button');
      btn.addEventListener('click', () => {
        cart.push({
          name: category.name,
          details: srv.label,
          price: srv.price
        });
        renderCart();
      });
      plansBody.appendChild(tr);
    });
  } else {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td colspan="3">Brak usług w tej kategorii.</td>`;
    plansBody.appendChild(tr);
  }
}

/** Koszyk */
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

/** Tooltipy (Bootstrap) */
function initTooltips() {
  const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
  tooltipTriggerList.map(el => new bootstrap.Tooltip(el));
}
