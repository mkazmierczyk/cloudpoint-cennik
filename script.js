/****************************************************************************************************
 * script.js - zawiera pełną obsługę:
 * 1) IaaS (CPU/RAM/SSD + backup + IP + licencje MS)
 * 2) PaaS (Instancje, wsparcie, dysk SSD, backup, IP, DR + licencje MS)
 * 3) SaaS (Aplikacje: MsSQL, Enova, Enova API, Terminal, ExtraData + licencje MS)
 * 4) Acronis, Microsoft CSP (zwykłe listy)
 ****************************************************************************************************/

let categoriesData = [];
let cart = [];

/****************************************************************************************************
 * Po załadowaniu DOM - wczytujemy data.json => categoriesData => render menu
 ****************************************************************************************************/
document.addEventListener('DOMContentLoaded', () => {
  fetch('data.json')
    .then(res => res.json())
    .then(data => {
      categoriesData = data.categories;
      renderCategoriesMenu(categoriesData);
    })
    .catch(err => console.error("Błąd wczytywania data.json:", err));
});


/****************************************************************************************************
 * renderCategoriesMenu - rysuje linki kategorii w #categoriesMenu
 ****************************************************************************************************/
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


/****************************************************************************************************
 * selectCategory - w zależności od cat.type => rysujemy IaaS/PaaS/SaaS/Services
 ****************************************************************************************************/
function selectCategory(catIndex) {
  const category      = categoriesData[catIndex];
  const titleEl       = document.getElementById('categoryTitle');
  const descEl        = document.getElementById('categoryDesc');
  const plansWrapper  = document.getElementById('plansTableWrapper');
  const plansBody     = document.getElementById('plansTableBody');

  titleEl.textContent = category.name;
  descEl.textContent  = `Opcje dostępne w kategorii: ${category.name}.`;
  plansWrapper.style.display = 'block';
  plansBody.innerHTML = '';

  if (category.type === 'iaas') {
    // IaaS
    renderIaaS(category, plansBody);
    renderMsLicSection(category, plansBody);

  } else if (category.type === 'paas') {
    // PaaS
    renderPaaSMachinesSection(category, plansBody);
    renderMsLicSection(category, plansBody);
    renderPaaSDisasterRecoverySection(category, plansBody);

  } else if (category.type === 'saas') {
    // SaaS
    renderSaaSApplications(category, plansBody);
    renderMsLicSection(category, plansBody);

  } else {
    // Acronis / CSP
    renderServicesList(category, plansBody);
  }

  initTooltips();
}


/****************************************************************************************************
 * IaaS - CPU/RAM/SSD + Kopie zapasowe + Public IP
 ****************************************************************************************************/
function renderIaaS(category, plansBody) {
  // Nagłówek
  const headerTr = document.createElement('tr');
  headerTr.innerHTML = `
    <td colspan="3">
      <h5 class="mb-3">Maszyny wirtualne (IaaS)</h5>
    </td>
  `;
  plansBody.appendChild(headerTr);

  // Wiersz
  const contentTr = document.createElement('tr');
  contentTr.innerHTML = `
    <td>
      <div class="mb-2">
        <label class="form-label me-2">
          CPU (vCore): <span id="cpuValue">1</span>
        </label>
        <input type="range" id="cpuSlider" min="${category.sliders[0].min}" max="${category.sliders[0].max}"
               step="${category.sliders[0].step}" value="${category.sliders[0].min}" style="width:150px;">
      </div>
      <div class="mb-2">
        <label class="form-label me-2">
          RAM (GB): <span id="ramValue">${category.sliders[1].min}</span>
        </label>
        <input type="range" id="ramSlider" min="${category.sliders[1].min}" max="${category.sliders[1].max}"
               step="${category.sliders[1].step}" value="${category.sliders[1].min}" style="width:150px;">
      </div>
      <div class="mb-2">
        <label class="form-label me-2">
          SSD (GB): <span id="ssdValue">${category.sliders[2].min}</span>
        </label>
        <input type="range" id="ssdSlider" min="${category.sliders[2].min}" max="${category.sliders[2].max}"
               step="${category.sliders[2].step}" value="${category.sliders[2].min}" style="width:150px;">
      </div>

      <div class="mb-2">
        <label class="form-label me-2">
          Kopie zapasowe (GB)
          <i class="bi bi-info-circle text-muted ms-1" data-bs-toggle="tooltip"
             title="Rozmiar kopii zależny od wielkości VM."></i>
        </label>
        <input type="number" id="backupGB" min="0" value="0" style="width:80px;" class="form-control d-inline-block">
      </div>
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

  const cpuSlider   = contentTr.querySelector('#cpuSlider');
  const ramSlider   = contentTr.querySelector('#ramSlider');
  const ssdSlider   = contentTr.querySelector('#ssdSlider');
  const backupInput = contentTr.querySelector('#backupGB');
  const publicIP    = contentTr.querySelector('#publicIP');
  const priceEl     = contentTr.querySelector('#iaasPrice');

  function updateIaaSPrice() {
    let total = 0;
    const cpuVal    = parseInt(cpuSlider.value,10);
    const ramVal    = parseInt(ramSlider.value,10);
    const ssdVal    = parseInt(ssdSlider.value,10);
    const backupVal = parseFloat(backupInput.value)||0;

    total += cpuVal*(category.sliders[0].pricePerUnit||0);
    total += ramVal*(category.sliders[1].pricePerUnit||0);
    total += ssdVal*(category.sliders[2].pricePerUnit||0);

    if (backupVal>0) {
      total += backupVal*(category.backupPricePerGB||0);
    }
    if (publicIP.checked) {
      total += (category.publicIPPrice||0);
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
  publicIP.addEventListener('change', updateIaaSPrice);
  updateIaaSPrice();

  const btnAddIaas = contentTr.querySelector('#btnAddIaas');
  btnAddIaas.addEventListener('click', ()=> {
    const total    = parseFloat(priceEl.textContent)||0;
    const cpuVal   = parseInt(cpuSlider.value,10);
    const ramVal   = parseInt(ramSlider.value,10);
    const ssdVal   = parseInt(ssdSlider.value,10);
    const backupVal= parseFloat(backupInput.value)||0;
    const ipCheck  = publicIP.checked;

    let desc = `CPU=${cpuVal}, RAM=${ramVal}GB, SSD=${ssdVal}GB`;
    if (backupVal>0) desc += `, Backup=${backupVal}GB`;
    if (ipCheck) desc += `, +PublicIP`;

    cart.push({
      name: "IaaS",
      details: desc,
      price: total
    });
    renderCart();
  });
}


/****************************************************************************************************
 * PaaS - renderPaaSMachinesSection
 * - wyświetla wiersz: Wybierz instancję, wsparcie, Dysk SSD, Backup, IP => cena => Dodaj do koszyka
 ****************************************************************************************************/
function renderPaaSMachinesSection(category, plansBody) {
  const headerTr = document.createElement('tr');
  headerTr.innerHTML=`
    <td colspan="3">
      <h5 class="mb-3">Maszyny wirtualne (PaaS)</h5>
    </td>
  `;
  plansBody.appendChild(headerTr);

  const contentTr = document.createElement('tr');
  contentTr.innerHTML=`
    <td>
      <div class="mb-2">
        <label class="form-label me-2">Wybierz instancję:</label>
        <select id="paasInstanceSelect" class="form-select d-inline-block" style="width:auto; min-width:150px;">
          <option value="" disabled selected>-- wybierz --</option>
        </select>
        <div id="paasInstanceDesc" class="text-muted mt-1" style="font-size:0.85rem;"></div>
      </div>

      <div class="mb-2">
        <label class="form-label me-2">Wsparcie techniczne:</label>
        <select id="paasSupportSelect" class="form-select d-inline-block" style="width:auto; min-width:200px;">
          <option value="" disabled selected>-- wybierz --</option>
          <option value="gold">C-SUPPORT-GOLD</option>
          <option value="platinum">C-SUPPORT-PLATINUM-AddON</option>
        </select>
        <div id="paasSupportDesc" class="text-muted mt-1" style="font-size:0.85rem;"></div>
      </div>

      <div class="mb-2">
        <label class="form-label me-2">Dysk SSD (GB):</label>
        <input type="number" id="paasSsdGB" min="0" value="0" style="width:80px;" class="form-control d-inline-block">
      </div>

      <div class="mb-2">
        <label class="form-label me-2">
          Kopie zapasowe (GB)
          <i class="bi bi-info-circle text-muted ms-1" data-bs-toggle="tooltip"
             title="Rozmiar kopii zależny od wielkości instancji."></i>
        </label>
        <input type="number" id="paasBackupGB" min="0" value="0" style="width:80px;" class="form-control d-inline-block">
      </div>

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

  const instSelect   = contentTr.querySelector('#paasInstanceSelect');
  const instDescEl   = contentTr.querySelector('#paasInstanceDesc');
  const supportSelect= contentTr.querySelector('#paasSupportSelect');
  const supportDescEl= contentTr.querySelector('#paasSupportDesc');
  const ssdInput     = contentTr.querySelector('#paasSsdGB');
  const backupInput  = contentTr.querySelector('#paasBackupGB');
  const ipCheck      = contentTr.querySelector('#paasPublicIP');
  const priceEl      = contentTr.querySelector('#paasPrice');
  const addBtn       = contentTr.querySelector('#btnAddPaaS');

  // Wypełniamy listę instancji
  if (category.paasInstances && category.paasInstances.length) {
    category.paasInstances.forEach(inst => {
      const opt = document.createElement('option');
      opt.value = inst.price;
      opt.setAttribute('data-label', inst.label);
      opt.setAttribute('data-desc', inst.desc||"");
      opt.textContent = `${inst.label} (${inst.price} PLN)`;
      instSelect.appendChild(opt);
    });
  }

  function updateInstDesc() {
    if (!instSelect.value) {
      instDescEl.textContent="";
      return;
    }
    const sel = instSelect.options[instSelect.selectedIndex];
    instDescEl.textContent = sel.getAttribute('data-desc')||"";
  }

  function updateSupportDesc() {
    let txt="";
    if (supportSelect.value==='gold') {
      txt = category.supportGoldDesc||"";
    } else if (supportSelect.value==='platinum') {
      txt = (category.supportGoldDesc||"")+" "+(category.supportPlatinumDesc||"");
    }
    supportDescEl.textContent = txt.trim();
  }

  function updatePaaSPrice() {
    let total = 0;
    const instPrice = parseFloat(instSelect.value)||0;
    total += instPrice;

    if (supportSelect.value==='gold') {
      total += (category.supportGoldPrice||0);
    }
    else if (supportSelect.value==='platinum') {
      total += (category.supportGoldPrice||0);
      total += (category.supportPlatinumAddOnPrice||0);
    }

    const ssdVal = parseFloat(ssdInput.value)||0;
    // załóżmy 1 PLN/GB
    total += ssdVal*1;

    const backupVal = parseFloat(backupInput.value)||0;
    if (backupVal>0) {
      total += backupVal*(category.backupPricePerGB||0);
    }

    if (ipCheck.checked) {
      total += (category.publicIPPrice||0);
    }
    priceEl.textContent = total.toFixed(2);
  }

  instSelect.addEventListener('change', ()=> {
    updateInstDesc();
    updatePaaSPrice();
  });
  supportSelect.addEventListener('change', ()=> {
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

    const total = parseFloat(priceEl.textContent)||0;
    const selInst = instSelect.options[instSelect.selectedIndex];
    const instLabel = selInst.getAttribute('data-label')||"";
    let supText="";
    if (supportSelect.value==='gold') {
      supText="C-SUPPORT-GOLD";
    } else if (supportSelect.value==='platinum') {
      supText="C-SUPPORT-GOLD + C-SUPPORT-PLATINUM-AddON";
    }

    const ssdVal     = parseFloat(ssdInput.value)||0;
    const backupVal  = parseFloat(backupInput.value)||0;
    const ipChecked  = ipCheck.checked;

    let desc = `Instancja=${instLabel}, Wsparcie=${supText}`;
    if (ssdVal>0) desc += `, SSD=${ssdVal}GB`;
    if (backupVal>0) desc += `, Backup=${backupVal}GB`;
    if (ipChecked) desc += `, +PublicIP`;

    cart.push({
      name: "PaaS",
      details: desc,
      price: total
    });
    renderCart();
  });
}


/****************************************************************************************************
 * PaaS - Disaster Recovery
 ****************************************************************************************************/
function renderPaaSDisasterRecoverySection(category, plansBody) {
  if (!category.drServices) return;

  const headerTr = document.createElement('tr');
  headerTr.innerHTML=`
    <td colspan="3">
      <h5 class="mt-4 mb-3">Disaster Recovery (PaaS)</h5>
    </td>
  `;
  plansBody.appendChild(headerTr);

  const contentTr = document.createElement('tr');
  contentTr.innerHTML=`
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
  const drIpWrap      = contentTr.querySelector('#drIpWrap');
  const drPriceEl     = contentTr.querySelector('#drPrice');
  const btnAddDR      = contentTr.querySelector('#btnAddDR');

  const storObj = category.drServices.find(s=>s.id==='C-DR-STORAGE');
  const ipObj   = category.drServices.find(s=>s.id==='C-DR-IP');

  drStorageWrap.innerHTML=`
    <label class="form-label me-2">${storObj?.label||'C-DR-STORAGE'}
      <i class="bi bi-info-circle text-muted ms-1" data-bs-toggle="tooltip"
         title="${storObj?.tooltip||''}"></i>
    </label>
    <input type="number" id="drStorageInput" min="0" value="0" style="width:80px;" class="form-control d-inline-block">
  `;

  drIpWrap.innerHTML=`
    <label class="form-label me-2">${ipObj?.label||'C-DR-IP'}
      <i class="bi bi-info-circle text-muted ms-1" data-bs-toggle="tooltip"
         title="${ipObj?.tooltip||''}"></i>
    </label>
    <input type="number" id="drIpInput" min="1" value="1" style="width:80px;" class="form-control d-inline-block">
  `;

  const drStorageInput = contentTr.querySelector('#drStorageInput');
  const drIpInput      = contentTr.querySelector('#drIpInput');

  function updateDrPrice() {
    let total=0;
    const sVal = parseFloat(drStorageInput.value)||0;
    const iVal = parseFloat(drIpInput.value)||1;

    if (storObj) total += sVal * storObj.price;
    if (ipObj)   total += iVal * ipObj.price;

    drPriceEl.textContent = total.toFixed(2);
  }

  drStorageInput.addEventListener('input', updateDrPrice);
  drIpInput.addEventListener('input', updateDrPrice);
  updateDrPrice();

  btnAddDR.addEventListener('click', ()=> {
    const sVal = parseFloat(drStorageInput.value)||0;
    const iVal = parseFloat(drIpInput.value)||1;
    if (iVal<1) {
      alert("C-DR-IP musi być co najmniej 1!");
      return;
    }
    let total=0;
    if (storObj) total += sVal*storObj.price;
    if (ipObj)   total += iVal*ipObj.price;

    let desc = `${storObj?.label||'C-DR-STORAGE'}=${sVal}GB, ${ipObj?.label||'C-DR-IP'}=${iVal}`;

    cart.push({
      name: "PaaS (DR)",
      details: desc,
      price: total
    });
    renderCart();
  });
}


/****************************************************************************************************
 * SaaS - renderSaaSApplications
 * - rysuje nagłówek "Aplikacje (SaaS)" i 5 wierszy (MsSQL, Enova, Enova API, Terminal, ExtraData)
 ****************************************************************************************************/
function renderSaaSApplications(category, plansBody) {
  // Nagłówek
  const headerTr = document.createElement('tr');
  headerTr.innerHTML=`
    <td colspan="3">
      <h5 class="mb-3">Aplikacje (SaaS)</h5>
    </td>
  `;
  plansBody.appendChild(headerTr);

  // MsSQL
  renderSaaS_MsSQLRow(category, plansBody);
  // Enova
  renderSaaS_EnovaRow(category, plansBody);
  // Enova API
  renderSaaS_EnovaApiRow(category, plansBody);
  // Terminal
  renderSaaS_TerminalRow(category, plansBody);
  // Extra
  renderSaaS_ExtraDataRow(category, plansBody);
}


/****************************************************************************************************
 * MsSQL w SaaS
 ****************************************************************************************************/
function renderSaaS_MsSQLRow(category, plansBody) {
  const tr = document.createElement('tr');
  tr.innerHTML=`
    <td>
      <label class="me-2">Baza danych Microsoft SQL:</label>
      <select id="msSqlSelect" class="form-select d-inline-block" style="width:auto; min-width:200px;">
        <option value="" disabled selected>-- wybierz --</option>
      </select>
      <div id="msSqlDesc" class="text-muted" style="font-size:0.85rem; margin-top:4px;"></div>
    </td>
    <td>
      <span id="msSqlPrice">0.00</span> PLN
    </td>
    <td>
      <button class="btn btn-outline-primary" id="btnAddMsSql">Dodaj do koszyka</button>
    </td>
  `;
  plansBody.appendChild(tr);

  const msSqlSelect  = tr.querySelector('#msSqlSelect');
  const msSqlDescEl  = tr.querySelector('#msSqlDesc');
  const msSqlPriceEl = tr.querySelector('#msSqlPrice');
  const btnAddMsSql  = tr.querySelector('#btnAddMsSql');

  if (category.msSqlDbOptions) {
    category.msSqlDbOptions.forEach(opt => {
      const o = document.createElement('option');
      o.value = opt.price;
      o.setAttribute('data-label', opt.label);
      o.setAttribute('data-desc', opt.desc||"");
      o.textContent = `${opt.label} (${opt.price} PLN)`;
      msSqlSelect.appendChild(o);
    });
  }

  function updateMsSqlPrice() {
    const val = parseFloat(msSqlSelect.value)||0;
    msSqlPriceEl.textContent = val.toFixed(2);
  }
  function updateMsSqlDesc() {
    if (!msSqlSelect.value) {
      msSqlDescEl.textContent="";
      return;
    }
    const sel = msSqlSelect.options[msSqlSelect.selectedIndex];
    msSqlDescEl.textContent = sel.getAttribute('data-desc')||"";
  }

  msSqlSelect.addEventListener('change', ()=> {
    updateMsSqlPrice();
    updateMsSqlDesc();
  });

  updateMsSqlPrice();
  updateMsSqlDesc();

  btnAddMsSql.addEventListener('click', ()=> {
    if (!msSqlSelect.value) {
      alert("Wybierz Bazę SQL!");
      return;
    }
    const sel = msSqlSelect.options[msSqlSelect.selectedIndex];
    const label = sel.getAttribute('data-label')||"SQL DB";
    const price = parseFloat(sel.value)||0;

    cart.push({
      name: "SaaS - MS SQL",
      details: label,
      price
    });
    renderCart();
  });
}


/****************************************************************************************************
 * Enova + Harmonogram
 ****************************************************************************************************/
function renderSaaS_EnovaRow(category, plansBody) {
  const tr = document.createElement('tr');
  tr.innerHTML=`
    <td>
      <label class="me-2">Enova365Web:</label>
      <select id="enovaSelect" class="form-select d-inline-block" style="width:auto; min-width:200px;">
        <option value="" disabled selected>-- wybierz --</option>
      </select>
      <div id="enovaDesc" class="text-muted" style="font-size:0.85rem; margin-top:4px;"></div>

      <div class="form-check mt-2">
        <input class="form-check-input" type="checkbox" id="enovaHarmonogram">
        <label class="form-check-label" for="enovaHarmonogram">
          Harmonogram zadań
        </label>
      </div>
    </td>
    <td>
      <span id="enovaPrice">0.00</span> PLN
    </td>
    <td>
      <button class="btn btn-outline-primary" id="btnAddEnova">Dodaj do koszyka</button>
    </td>
  `;
  plansBody.appendChild(tr);

  const enovaSelect      = tr.querySelector('#enovaSelect');
  const enovaDescEl      = tr.querySelector('#enovaDesc');
  const enovaPriceEl     = tr.querySelector('#enovaPrice');
  const enovaHarmonogram = tr.querySelector('#enovaHarmonogram');
  const btnAddEnova      = tr.querySelector('#btnAddEnova');

  if (category.enovaWebOptions) {
    category.enovaWebOptions.forEach(opt => {
      const o = document.createElement('option');
      o.value = opt.price;
      o.setAttribute('data-label', opt.label);
      o.setAttribute('data-desc', opt.desc||"");
      o.textContent= `${opt.label} (${opt.price} PLN)`;
      enovaSelect.appendChild(o);
    });
  }

  function updateEnovaPrice() {
    let total = parseFloat(enovaSelect.value)||0;
    if (enovaHarmonogram.checked) {
      total += (category.harmonogramCost||10);
    }
    enovaPriceEl.textContent = total.toFixed(2);
  }
  function updateEnovaDesc() {
    if (!enovaSelect.value) {
      enovaDescEl.textContent="";
      return;
    }
    const sel = enovaSelect.options[enovaSelect.selectedIndex];
    enovaDescEl.textContent= sel.getAttribute('data-desc')||"";
  }

  enovaSelect.addEventListener('change', ()=> {
    updateEnovaPrice();
    updateEnovaDesc();
  });
  enovaHarmonogram.addEventListener('change', updateEnovaPrice);

  updateEnovaPrice();
  updateEnovaDesc();

  btnAddEnova.addEventListener('click', ()=> {
    if (!enovaSelect.value) {
      alert("Wybierz Enova!");
      return;
    }
    const sel       = enovaSelect.options[enovaSelect.selectedIndex];
    const label     = sel.getAttribute('data-label')||"Enova365Web";
    const basePrice = parseFloat(enovaSelect.value)||0;

    cart.push({
      name: "SaaS - Enova365Web",
      details: label,
      price: basePrice
    });

    if (enovaHarmonogram.checked) {
      const harmCost = category.harmonogramCost||10;
      cart.push({
        name: "SaaS - Harmonogram zadań",
        details: "Dodatkowy moduł",
        price: harmCost
      });
    }
    renderCart();
  });
}


/****************************************************************************************************
 * Enova API
 ****************************************************************************************************/
function renderSaaS_EnovaApiRow(category, plansBody) {
  const tr = document.createElement('tr');
  tr.innerHTML=`
    <td>
      <label class="me-2">Enova365Web API:</label>
      <select id="enovaApiSelect" class="form-select d-inline-block" style="width:auto; min-width:200px;">
        <option value="" disabled selected>-- wybierz --</option>
      </select>
      <div id="enovaApiDesc" class="text-muted" style="font-size:0.85rem; margin-top:4px;"></div>
    </td>
    <td><span id="enovaApiPrice">0.00</span> PLN</td>
    <td><button class="btn btn-outline-primary" id="btnAddEnovaApi">Dodaj do koszyka</button></td>
  `;
  plansBody.appendChild(tr);

  const enovaApiSelect = tr.querySelector('#enovaApiSelect');
  const enovaApiDescEl = tr.querySelector('#enovaApiDesc');
  const enovaApiPriceEl= tr.querySelector('#enovaApiPrice');
  const btnAddEnovaApi = tr.querySelector('#btnAddEnovaApi');

  if (category.enovaWebApiOptions) {
    category.enovaWebApiOptions.forEach(opt => {
      const o = document.createElement('option');
      o.value= opt.price;
      o.setAttribute('data-label', opt.label);
      o.setAttribute('data-desc', opt.desc||"");
      o.textContent= `${opt.label} (${opt.price} PLN)`;
      enovaApiSelect.appendChild(o);
    });
  }

  function updateApiPrice() {
    const val = parseFloat(enovaApiSelect.value)||0;
    enovaApiPriceEl.textContent = val.toFixed(2);
  }
  function updateApiDesc() {
    if (!enovaApiSelect.value) {
      enovaApiDescEl.textContent="";
      return;
    }
    const sel = enovaApiSelect.options[enovaApiSelect.selectedIndex];
    enovaApiDescEl.textContent = sel.getAttribute('data-desc')||"";
  }

  enovaApiSelect.addEventListener('change', ()=> {
    updateApiPrice();
    updateApiDesc();
  });
  updateApiPrice();
  updateApiDesc();

  btnAddEnovaApi.addEventListener('click', ()=> {
    if (!enovaApiSelect.value) {
      alert("Wybierz Enova365Web API!");
      return;
    }
    const sel   = enovaApiSelect.options[enovaApiSelect.selectedIndex];
    const label = sel.getAttribute('data-label')||"EnovaAPI";
    const price = parseFloat(sel.value)||0;

    cart.push({
      name: "SaaS - EnovaAPI",
      details: label,
      price
    });
    renderCart();
  });
}


/****************************************************************************************************
 * Terminal w chmurze
 ****************************************************************************************************/
function renderSaaS_TerminalRow(category, plansBody) {
  const tr = document.createElement('tr');
  tr.innerHTML=`
    <td>
      <label class="me-2">Terminal w chmurze:</label>
      <input type="number" id="terminalUsers" min="0" value="0"
             style="width:80px;" class="form-control d-inline-block mt-1">
      <div class="form-check mt-2">
        <input class="form-check-input" type="checkbox" id="terminalSecurity">
        <label class="form-check-label" for="terminalSecurity">
          Zabezpieczenie terminala
        </label>
      </div>
    </td>
    <td>
      <span id="terminalPrice">0.00</span> PLN
    </td>
    <td>
      <button class="btn btn-outline-primary" id="btnAddTerminal">Dodaj do koszyka</button>
    </td>
  `;
  plansBody.appendChild(tr);

  const terminalUsers    = tr.querySelector('#terminalUsers');
  const terminalSecurity = tr.querySelector('#terminalSecurity');
  const terminalPriceEl  = tr.querySelector('#terminalPrice');
  const btnAddTerminal   = tr.querySelector('#btnAddTerminal');

  function updateTerminalPrice() {
    let total=0;
    const users = parseInt(terminalUsers.value,10)||0;
    if (users>0) {
      total += users*(category.terminalPricePerUser||30);
      if (terminalSecurity.checked) {
        total += (category.terminalSecurityCost||20);
      }
    }
    terminalPriceEl.textContent= total.toFixed(2);
  }

  terminalUsers.addEventListener('input', updateTerminalPrice);
  terminalSecurity.addEventListener('change', updateTerminalPrice);
  updateTerminalPrice();

  btnAddTerminal.addEventListener('click', ()=> {
    const users = parseInt(terminalUsers.value,10)||0;
    if (users<=0) {
      alert("Podaj liczbę użytkowników > 0!");
      return;
    }
    const termCost = users*(category.terminalPricePerUser||30);
    cart.push({
      name: "SaaS - Terminal w chmurze",
      details: `Users=${users}`,
      price: termCost
    });

    if (terminalSecurity.checked) {
      const secCost = category.terminalSecurityCost||20;
      cart.push({
        name: "SaaS - Zabezpieczenie terminala",
        details: "Dodatkowa ochrona",
        price: secCost
      });
    } else {
      alert("UWAGA: Terminal bez zabezpieczenia!");
    }
    renderCart();
  });
}


/****************************************************************************************************
 * Dodatkowe miejsce na dane
 ****************************************************************************************************/
function renderSaaS_ExtraDataRow(category, plansBody) {
  const tr = document.createElement('tr');
  tr.innerHTML=`
    <td>
      <label class="me-2">Dodatkowe miejsce na dane:</label>
      <input type="number" id="extraDataInput" min="0" value="0"
             style="width:80px;" class="form-control d-inline-block mt-1">
    </td>
    <td>
      <span id="extraDataPrice">0.00</span> PLN
    </td>
    <td>
      <button class="btn btn-outline-primary" id="btnAddExtraData">Dodaj do koszyka</button>
    </td>
  `;
  plansBody.appendChild(tr);

  const extraDataInput   = tr.querySelector('#extraDataInput');
  const extraDataPriceEl = tr.querySelector('#extraDataPrice');
  const btnAddExtraData  = tr.querySelector('#btnAddExtraData');

  function updateExtraDataPrice() {
    const val = parseInt(extraDataInput.value,10)||0;
    let cost  = val*(category.extraDataStoragePrice||2);
    extraDataPriceEl.textContent = cost.toFixed(2);
  }

  extraDataInput.addEventListener('input', updateExtraDataPrice);
  updateExtraDataPrice();

  btnAddExtraData.addEventListener('click', ()=> {
    const val = parseInt(extraDataInput.value,10)||0;
    if (val<=0) {
      alert("Podaj liczbę > 0!");
      return;
    }
    let cost = val*(category.extraDataStoragePrice||2);

    cart.push({
      name: "SaaS - Dodatkowe miejsce",
      details: `Ilość=${val}`,
      price: cost
    });
    renderCart();
  });
}


/****************************************************************************************************
 * MsLicSection - licencje Microsoft (IaaS/PaaS/SaaS)
 ****************************************************************************************************/
function renderMsLicSection(category, plansBody) {
  if (!category.msSplaServices) return;

  const headerTr = document.createElement('tr');
  headerTr.innerHTML=`
    <td colspan="3">
      <h5 class="mt-4 mb-3">Licencje Microsoft</h5>
    </td>
  `;
  plansBody.appendChild(headerTr);

  const contentTr = document.createElement('tr');
  contentTr.innerHTML=`
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

  const msSelect  = contentTr.querySelector('#msSelect');
  const msQty     = contentTr.querySelector('#msQty');
  const msPriceEl = contentTr.querySelector('#msPrice');
  const btnAddMS  = contentTr.querySelector('#btnAddMS');

  category.msSplaServices.forEach(srv => {
    const opt = document.createElement('option');
    opt.value = srv.price;
    opt.setAttribute('data-label', srv.label);
    opt.textContent = `${srv.label} (${srv.price} PLN)`;
    msSelect.appendChild(opt);
  });

  function updateMsPrice() {
    if (!msSelect.value) {
      msPriceEl.textContent='0.00';
      return;
    }
    const price = parseFloat(msSelect.value)||0;
    const qty   = parseInt(msQty.value,10)||1;
    msPriceEl.textContent=(price*qty).toFixed(2);
  }

  msSelect.addEventListener('change', updateMsPrice);
  msQty.addEventListener('input', updateMsPrice);
  updateMsPrice();

  btnAddMS.addEventListener('click', () => {
    if (!msSelect.value) {
      alert("Wybierz licencję Microsoft!");
      return;
    }
    const label = msSelect.options[msSelect.selectedIndex].getAttribute('data-label')||"";
    const price = parseFloat(msSelect.value)||0;
    const qty   = parseInt(msQty.value,10)||1;
    const total = price*qty;

    cart.push({
      name: category.name + " (Licencje MS)",
      details: `${label} x${qty}`,
      price: total
    });
    renderCart();
  });
}


/****************************************************************************************************
 * ServicesList - dla Acronis / Microsoft CSP
 ****************************************************************************************************/
function renderServicesList(category, plansBody) {
  if (category.services && category.services.length) {
    category.services.forEach(srv => {
      const tr = document.createElement('tr');
      tr.innerHTML=`
        <td>${srv.label}</td>
        <td>${srv.price} PLN</td>
        <td>
          <button class="btn btn-outline-primary btn-sm">
            Dodaj do koszyka
          </button>
        </td>
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
    tr.innerHTML=`<td colspan="3">Brak usług w tej kategorii.</td>`;
    plansBody.appendChild(tr);
  }
}


/****************************************************************************************************
 * renderCart - wyświetla koszyk, podsumowanie, obsługuje usuwanie wierszy
 ****************************************************************************************************/
function renderCart() {
  const cartSection = document.getElementById('cartSection');
  const tbody       = document.querySelector('#cartTable tbody');
  const totalEl     = document.getElementById('cartTotal');

  if (!cart.length) {
    cartSection.style.display='none';
    return;
  }
  cartSection.style.display='block';
  tbody.innerHTML='';

  let sum=0;
  cart.forEach((item, index) => {
    sum+= item.price;
    const tr = document.createElement('tr');
    tr.innerHTML=`
      <td>${item.name}</td>
      <td>${item.details}</td>
      <td>${item.price.toFixed(2)}</td>
      <td><button class="btn btn-sm btn-danger">X</button></td>
    `;
    const btnRemove = tr.querySelector('button');
    btnRemove.addEventListener('click', ()=> {
      cart.splice(index,1);
      renderCart();
    });
    tbody.appendChild(tr);
  });

  totalEl.textContent= sum.toFixed(2);
}


/****************************************************************************************************
 * initTooltips - inicjuje tooltipy (i) od Bootstrap
 ****************************************************************************************************/
function initTooltips() {
  const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
  tooltipTriggerList.map(el => new bootstrap.Tooltip(el));
}
