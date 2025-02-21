/****************************************************************************************************
 * script.js – Pełna wersja z layoutem:
 *
 * Dla każdej kategorii generujemy w <tbody id="plansTableBody">:
 *   1) Wiersz nagłówka sekcji (na niebieskim tle) z nazwą sekcji (np. "Maszyny wirtualne (IaaS)")
 *   2) Wiersz z tytułami kolumn: [PARAMETRY | CENA (MIESIĘCZNIE) | (puste)]
 *   3) Wiersze z faktycznymi polami (parametry w 1 kolumnie, cena w 2 kolumnie, guzik w 3 kolumnie)
 *
 * Zmiany wg życzeń:
 *  - Wszędzie "Dodaj do wyceny"
 *  - Publiczne IP -> numeric input (ilość)
 *  - W SaaS: MsSQL, Enova, Enova API, Terminal, Extra
 *  - Tylko nazwa sekcji ma niebieskie tło, reszta białe
 *  - Wszędzie, gdzie jest ilość, staramy się dać numeric input z prawej
 ***************************************************************************************************/

let categoriesData = [];
let cart = [];

/****************************************************************************************************
 * Ładowanie data.json i menu
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

      // Aktywne zaznaczenie
      document.querySelectorAll('#categoriesMenu a').forEach(a => a.classList.remove('active'));
      link.classList.add('active');
    });

    li.appendChild(link);
    menuUl.appendChild(li);
  });
}

/****************************************************************************************************
 * Wybór kategorii => generowanie wierszy w #plansTableBody
 ****************************************************************************************************/
function selectCategory(catIndex) {
  const category = categoriesData[catIndex];
  const titleEl  = document.getElementById('categoryTitle');
  const descEl   = document.getElementById('categoryDesc');
  const plansWrapper = document.getElementById('plansTableWrapper');
  const plansBody    = document.getElementById('plansTableBody');

  titleEl.textContent = category.name;
  descEl.textContent  = `Opcje dostępne w kategorii: ${category.name}.`;
  plansWrapper.style.display='block';
  plansBody.innerHTML='';

  switch (category.type) {
    case 'iaas':
      renderIaaS(category, plansBody);
      renderMsLicSection(category, plansBody);
      break;
    case 'paas':
      renderPaaSMachinesSection(category, plansBody);
      renderMsLicSection(category, plansBody);
      renderPaaSDisasterRecoverySection(category, plansBody);
      break;
    case 'saas':
      renderSaaSApplications(category, plansBody);
      renderMsLicSection(category, plansBody);
      break;
    case 'acronis':
      renderServicesList(category, plansBody);
      break;
    case 'csp':
      renderMicrosoft365Section(category, plansBody);
      break;
    case 'security':
      renderSecurityWebAppsSection(category, plansBody);
      renderSecurityFirewallSection(category, plansBody);
      renderSecurityAnalysisSection(category, plansBody);
      break;
    default:
      renderServicesList(category, plansBody);
  }

  initTooltips();
}

/****************************************************************************************************
 * Pomocnicza: Tworzy wiersz z tytułem sekcji (na niebieskim tle)
 ****************************************************************************************************/
function sectionTitleRow(titleText) {
  const tr = document.createElement('tr');
  tr.style.backgroundColor = '#e3f1ff';
  const td = document.createElement('td');
  td.colSpan = 3;
  td.innerHTML = `<h5 class="my-2 ms-2">${titleText}</h5>`;
  tr.appendChild(td);
  return tr;
}

/****************************************************************************************************
 * Pomocnicza: Tworzy wiersz z nagłówkami kolumn: Parametry | Cena (MIESIĘCZNIE) | (puste)
 ****************************************************************************************************/
function sectionHeaderRow(tooltipText="Koszt miesięczny") {
  const tr = document.createElement('tr');
  tr.innerHTML = `
    <th style="width:50%">PARAMETRY</th>
    <th style="width:25%">
      CENA (MIESIĘCZNIE)
      <i class="bi bi-info-circle text-muted ms-1" data-bs-toggle="tooltip" 
         title="${tooltipText}"></i>
    </th>
    <th style="width:25%"></th>
  `;
  return tr;
}

/****************************************************************************************************
 * IaaS
 ****************************************************************************************************/
function renderIaaS(category, plansBody) {
  // 1) Wiersz tytułu
  plansBody.appendChild(sectionTitleRow("Maszyny wirtualne (IaaS)"));
  // 2) Wiersz nagłówków
  plansBody.appendChild(sectionHeaderRow("Koszt miesięczny za parametry VM"));

  // 3) Wiersz z parametrami
  const tr = document.createElement('tr');
  const tdParams = document.createElement('td');
  const tdPrice  = document.createElement('td');
  const tdButton = document.createElement('td');

  // CPU, RAM, SSD
  tdParams.innerHTML = `
    <div class="mb-2">
      <label>CPU (vCore): </label>
      <input type="range" id="cpuSlider" min="${category.sliders[0].min}" max="${category.sliders[0].max}"
             step="${category.sliders[0].step}" value="${category.sliders[0].min}" style="width:100px;">
      <span id="cpuVal">${category.sliders[0].min}</span>
    </div>
    <div class="mb-2">
      <label>RAM (GB): </label>
      <input type="range" id="ramSlider" min="${category.sliders[1].min}" max="${category.sliders[1].max}"
             step="${category.sliders[1].step}" value="${category.sliders[1].min}" style="width:100px;">
      <span id="ramVal">${category.sliders[1].min}</span>
    </div>
    <div class="mb-2">
      <label>SSD (GB): </label>
      <input type="range" id="ssdSlider" min="${category.sliders[2].min}" max="${category.sliders[2].max}"
             step="${category.sliders[2].step}" value="${category.sliders[2].min}" style="width:100px;">
      <span id="ssdVal">${category.sliders[2].min}</span>
    </div>
    <div class="mb-2">
      <label>Kopie zapasowe (GB): </label>
      <input type="number" id="backupGB" value="0" min="0" style="width:60px; float:right;">
    </div>
    <div class="mb-2">
      <label>Dodatkowe publiczne IP (szt.): </label>
      <input type="number" id="publicIpQty" value="0" min="0" style="width:60px; float:right;">
    </div>
  `;

  // Cena
  tdPrice.innerHTML = `<strong><span id="iaasPrice">0.00</span> PLN</strong>`;

  // Guzik
  tdButton.innerHTML = `<button class="btn btn-primary" id="btnAddIaas">Dodaj do wyceny</button>`;

  tr.appendChild(tdParams);
  tr.appendChild(tdPrice);
  tr.appendChild(tdButton);
  plansBody.appendChild(tr);

  // Logika
  const cpuSlider  = tdParams.querySelector('#cpuSlider');
  const ramSlider  = tdParams.querySelector('#ramSlider');
  const ssdSlider  = tdParams.querySelector('#ssdSlider');
  const backupGB   = tdParams.querySelector('#backupGB');
  const publicIpQty= tdParams.querySelector('#publicIpQty');
  const priceEl    = tdPrice.querySelector('#iaasPrice');

  function updateIaaSPrice(){
    let total=0;
    const cpuVal= parseInt(cpuSlider.value,10);
    const ramVal= parseInt(ramSlider.value,10);
    const ssdVal= parseInt(ssdSlider.value,10);
    const backupVal= parseFloat(backupGB.value)||0;
    const ipVal= parseInt(publicIpQty.value,10)||0;

    // CPU, RAM, SSD
    total += cpuVal*(category.sliders[0].pricePerUnit||0);
    total += ramVal*(category.sliders[1].pricePerUnit||0);
    total += ssdVal*(category.sliders[2].pricePerUnit||0);

    // Kopie
    if(backupVal>0) {
      total += backupVal*(category.backupPricePerGB||0);
    }
    // IP
    if(ipVal>0) {
      total += ipVal*(category.publicIPPrice||0);
    }

    tdParams.querySelector('#cpuVal').textContent = cpuVal;
    tdParams.querySelector('#ramVal').textContent = ramVal;
    tdParams.querySelector('#ssdVal').textContent = ssdVal;
    priceEl.textContent = total.toFixed(2);
  }
  [cpuSlider, ramSlider, ssdSlider, backupGB, publicIpQty].forEach(el =>
    el.addEventListener('input', updateIaaSPrice)
  );
  updateIaaSPrice();

  tdButton.querySelector('#btnAddIaas').addEventListener('click', ()=>{
    const total= parseFloat(priceEl.textContent)||0;
    const cpuVal   = parseInt(cpuSlider.value,10);
    const ramVal   = parseInt(ramSlider.value,10);
    const ssdVal   = parseInt(ssdSlider.value,10);
    const backupVal= parseFloat(backupGB.value)||0;
    const ipVal    = parseInt(publicIpQty.value,10)||0;

    let desc= `CPU=${cpuVal}, RAM=${ramVal}GB, SSD=${ssdVal}GB`;
    if(backupVal>0) desc += `, Backup=${backupVal}GB`;
    if(ipVal>0) desc += `, +${ipVal}xPublicIP`;

    cart.push({
      name: "IaaS",
      details: desc,
      price: total
    });
    renderCart();
  });
}

/****************************************************************************************************
 * MsLicSection (IaaS/PaaS/SaaS)
 ****************************************************************************************************/
function renderMsLicSection(category, plansBody){
  if(!category.msSplaServices) return;

  // Tytuł
  plansBody.appendChild(sectionTitleRow("Licencje Microsoft"));
  // Nagłówek kolumn
  plansBody.appendChild(sectionHeaderRow("Koszt licencji w rozliczeniu miesięcznym"));

  // Jeden wiersz z polami
  const tr = document.createElement('tr');
  const tdParams = document.createElement('td');
  const tdPrice  = document.createElement('td');
  const tdButton = document.createElement('td');

  // Parametry
  tdParams.innerHTML=`
    <label class="me-2">Wybierz licencję:</label>
    <select id="msSelect" class="form-select d-inline-block" style="width:auto; min-width:200px;">
      <option value="" disabled selected>-- wybierz --</option>
    </select>
    <label class="ms-3 me-2">Ilość:</label>
    <input type="number" value="1" min="1" id="msQty" style="width:60px; float:right;">
  `;

  // Cena
  tdPrice.innerHTML= `<strong><span id="msPrice">0.00</span> PLN</strong>`;

  // Guzik
  tdButton.innerHTML= `<button class="btn btn-primary" id="btnAddMS">Dodaj do wyceny</button>`;

  tr.appendChild(tdParams);
  tr.appendChild(tdPrice);
  tr.appendChild(tdButton);
  plansBody.appendChild(tr);

  // Logika
  const msSelect  = tdParams.querySelector('#msSelect');
  const msQty     = tdParams.querySelector('#msQty');
  const msPriceEl = tdPrice.querySelector('#msPrice');
  const btnAddMS  = tdButton.querySelector('#btnAddMS');

  category.msSplaServices.forEach(srv=>{
    const opt= document.createElement('option');
    opt.value= srv.price;
    opt.setAttribute('data-label', srv.label);
    opt.textContent= `${srv.label} (${srv.price} PLN)`;
    msSelect.appendChild(opt);
  });

  function updateMsPrice(){
    if(!msSelect.value){
      msPriceEl.textContent='0.00';
      return;
    }
    const price= parseFloat(msSelect.value)||0;
    const qty  = parseInt(msQty.value,10)||1;
    msPriceEl.textContent= (price*qty).toFixed(2);
  }
  msSelect.addEventListener('change', updateMsPrice);
  msQty.addEventListener('input', updateMsPrice);
  updateMsPrice();

  btnAddMS.addEventListener('click',()=>{
    if(!msSelect.value){
      alert("Wybierz licencję Microsoft!");
      return;
    }
    const label= msSelect.options[msSelect.selectedIndex].getAttribute('data-label')||"";
    const price= parseFloat(msSelect.value)||0;
    const qty  = parseInt(msQty.value,10)||1;
    const total= price*qty;

    cart.push({
      name: category.name + " (Licencje MS)",
      details: `${label} x${qty}`,
      price: total
    });
    renderCart();
  });
}

/****************************************************************************************************
 * PaaS
 ****************************************************************************************************/
function renderPaaSMachinesSection(category, plansBody){
  // Tytuł
  plansBody.appendChild(sectionTitleRow("Maszyny wirtualne (PaaS)"));
  // Nagłówek
  plansBody.appendChild(sectionHeaderRow("Koszt miesięczny instancji PaaS"));

  // Wiersz
  const tr = document.createElement('tr');
  const tdParams = document.createElement('td');
  const tdPrice  = document.createElement('td');
  const tdButton = document.createElement('td');

  tdParams.innerHTML=`
    <div class="mb-2">
      <label>Wybierz instancję:</label>
      <select id="paasInst" class="form-select d-inline-block" style="width:auto; min-width:150px;">
        <option value="" disabled selected>-- wybierz --</option>
      </select>
      <div id="paasInstDesc" class="text-muted mt-1" style="font-size:0.85rem;"></div>
    </div>
    <div class="mb-2">
      <label>Wsparcie techniczne:</label>
      <select id="paasSupport" class="form-select d-inline-block" style="width:auto; min-width:150px;">
        <option value="" disabled selected>-- wybierz --</option>
        <option value="gold">C-SUPPORT-GOLD</option>
        <option value="platinum">C-SUPPORT-PLATINUM-AddON</option>
      </select>
      <div id="paasSupportDesc" class="text-muted mt-1" style="font-size:0.85rem;"></div>
    </div>
    <div class="mb-2">
      <label>Dysk SSD (GB):</label>
      <input type="number" id="paasSsd" min="0" value="0" style="width:60px; float:right;">
    </div>
    <div class="mb-2">
      <label>Kopie zapasowe (GB):</label>
      <input type="number" id="paasBackup" min="0" value="0" style="width:60px; float:right;">
    </div>
    <div class="mb-2">
      <label>Dodatkowe publiczne IP (szt.):</label>
      <input type="number" id="paasIp" min="0" value="0" style="width:60px; float:right;">
    </div>
  `;

  tdPrice.innerHTML= `<strong><span id="paasPrice">0.00</span> PLN</strong>`;
  tdButton.innerHTML= `<button class="btn btn-primary" id="btnAddPaaS">Dodaj do wyceny</button>`;

  tr.appendChild(tdParams);
  tr.appendChild(tdPrice);
  tr.appendChild(tdButton);
  plansBody.appendChild(tr);

  // Logika
  const instSelect = tdParams.querySelector('#paasInst');
  const instDescEl = tdParams.querySelector('#paasInstDesc');
  const supportSel = tdParams.querySelector('#paasSupport');
  const supportDesc= tdParams.querySelector('#paasSupportDesc');
  const ssdInput   = tdParams.querySelector('#paasSsd');
  const backupInput= tdParams.querySelector('#paasBackup');
  const ipInput    = tdParams.querySelector('#paasIp');
  const priceEl    = tdPrice.querySelector('#paasPrice');
  const btnAdd     = tdButton.querySelector('#btnAddPaaS');

  // Instancje
  if(category.paasInstances){
    category.paasInstances.forEach(inst=>{
      const opt= document.createElement('option');
      opt.value= inst.price;
      opt.setAttribute('data-label', inst.label);
      opt.setAttribute('data-desc', inst.desc||"");
      opt.textContent= `${inst.label} (${inst.price} PLN)`;
      instSelect.appendChild(opt);
    });
  }

  function updateInstDesc(){
    if(!instSelect.value){
      instDescEl.textContent="";
      return;
    }
    const sel= instSelect.options[instSelect.selectedIndex];
    instDescEl.textContent= sel.getAttribute('data-desc')||"";
  }
  function updateSupportDesc(){
    if(supportSel.value==='gold'){
      supportDesc.textContent= category.supportGoldDesc||"";
    } else if(supportSel.value==='platinum'){
      supportDesc.textContent= (category.supportGoldDesc||"")+" "+(category.supportPlatinumDesc||"");
    } else {
      supportDesc.textContent="";
    }
  }

  function updatePaaSPrice(){
    let total=0;
    const instPrice = parseFloat(instSelect.value)||0;
    total+= instPrice;

    if(supportSel.value==='gold'){
      total+=(category.supportGoldPrice||0);
    } else if(supportSel.value==='platinum'){
      total+=(category.supportGoldPrice||0);
      total+=(category.supportPlatinumAddOnPrice||0);
    }
    const ssdVal= parseInt(ssdInput.value,10)||0;
    total+= ssdVal*1; // 1 PLN/GB
    const backupVal= parseInt(backupInput.value,10)||0;
    if(backupVal>0) total+= backupVal*(category.backupPricePerGB||0);
    const ipVal= parseInt(ipInput.value,10)||0;
    if(ipVal>0) total+= ipVal*(category.publicIPPrice||0);

    priceEl.textContent= total.toFixed(2);
  }

  [instSelect, supportSel, ssdInput, backupInput, ipInput].forEach(el => {
    el.addEventListener('change', ()=>{
      updateInstDesc();
      updateSupportDesc();
      updatePaaSPrice();
    });
    el.addEventListener('input', ()=>{
      updateInstDesc();
      updateSupportDesc();
      updatePaaSPrice();
    });
  });

  updateInstDesc();
  updateSupportDesc();
  updatePaaSPrice();

  btnAdd.addEventListener('click',()=>{
    if(!instSelect.value){
      alert("Musisz wybrać instancję PaaS!");
      return;
    }
    if(!supportSel.value){
      alert("Musisz wybrać co najmniej C-SUPPORT-GOLD!");
      return;
    }
    const total= parseFloat(priceEl.textContent)||0;
    const instLab = instSelect.options[instSelect.selectedIndex].getAttribute('data-label')||"";
    let supText="";
    if(supportSel.value==='gold') {
      supText="C-SUPPORT-GOLD";
    } else if(supportSel.value==='platinum') {
      supText="C-SUPPORT-GOLD + PLATINUM-AddON";
    }
    const ssdVal= parseInt(ssdInput.value,10)||0;
    const backupVal= parseInt(backupInput.value,10)||0;
    const ipVal= parseInt(ipInput.value,10)||0;

    let desc= `Instancja=${instLab}, Wsparcie=${supText}`;
    if(ssdVal>0) desc+= `, SSD=${ssdVal}GB`;
    if(backupVal>0) desc+= `, Backup=${backupVal}GB`;
    if(ipVal>0) desc+= `, +${ipVal}xPublicIP`;

    cart.push({
      name: "PaaS",
      details: desc,
      price: total
    });
    renderCart();
  });
}

function renderPaaSDisasterRecoverySection(category, plansBody){
  if(!category.drServices) return;

  // Tytuł
  plansBody.appendChild(sectionTitleRow("Disaster Recovery (PaaS)"));
  // Nagłówek
  plansBody.appendChild(sectionHeaderRow("Koszt DR w rozliczeniu miesięcznym"));

  // Wiersz
  const tr = document.createElement('tr');
  const tdParams = document.createElement('td');
  const tdPrice  = document.createElement('td');
  const tdButton = document.createElement('td');

  const storObj = category.drServices.find(x=>x.id==='C-DR-STORAGE');
  const ipObj   = category.drServices.find(x=>x.id==='C-DR-IP');

  tdParams.innerHTML=`
    <div class="mb-2">
      <label>${storObj?.label||'C-DR-STORAGE'} (GB): </label>
      <input type="number" id="drStorage" min="0" value="0" style="width:60px; float:right;">
    </div>
    <div class="mb-2">
      <label>${ipObj?.label||'C-DR-IP'} (szt.): </label>
      <input type="number" id="drIp" min="1" value="1" style="width:60px; float:right;">
    </div>
  `;
  tdPrice.innerHTML=`<strong><span id="drPrice">0.00</span> PLN</strong>`;
  tdButton.innerHTML=`<button class="btn btn-primary" id="btnAddDR">Dodaj do wyceny</button>`;

  tr.appendChild(tdParams);
  tr.appendChild(tdPrice);
  tr.appendChild(tdButton);
  plansBody.appendChild(tr);

  // Logika
  const drStorage = tdParams.querySelector('#drStorage');
  const drIp      = tdParams.querySelector('#drIp');
  const drPriceEl = tdPrice.querySelector('#drPrice');
  const btnAddDR  = tdButton.querySelector('#btnAddDR');

  function updateDRPrice(){
    let total=0;
    const sVal= parseInt(drStorage.value,10)||0;
    const iVal= parseInt(drIp.value,10)||1;
    if(storObj) total+= sVal*(storObj.price||0);
    if(ipObj)   total+= iVal*(ipObj.price||0);
    drPriceEl.textContent= total.toFixed(2);
  }
  [drStorage, drIp].forEach(el => el.addEventListener('input', updateDRPrice));
  updateDRPrice();

  btnAddDR.addEventListener('click',()=>{
    const sVal= parseInt(drStorage.value,10)||0;
    const iVal= parseInt(drIp.value,10)||1;
    if(iVal<1){
      alert("C-DR-IP musi być >=1!");
      return;
    }
    let total=0;
    if(storObj) total+= sVal*(storObj.price||0);
    if(ipObj)   total+= iVal*(ipObj.price||0);

    let desc= `${storObj?.label||'C-DR-STORAGE'}=${sVal}GB, ${ipObj?.label||'C-DR-IP'}=${iVal}`;
    cart.push({
      name: "PaaS (DR)",
      details: desc,
      price: total
    });
    renderCart();
  });
}

/****************************************************************************************************
 * SaaS
 ****************************************************************************************************/
function renderSaaSApplications(category, plansBody){
  // Tytuł
  plansBody.appendChild(sectionTitleRow("Aplikacje (SaaS)"));
  // Nagłówek
  plansBody.appendChild(sectionHeaderRow("Koszt miesięczny usług SaaS"));

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

/** Każda usługa w SaaS to 1 wiersz: param w 1 kolumnie, cena w 2, guzik w 3 */
function renderSaaS_MsSQLRow(category, plansBody){
  const tr = document.createElement('tr');
  const tdParams = document.createElement('td');
  const tdPrice  = document.createElement('td');
  const tdButton = document.createElement('td');

  tdParams.innerHTML=`
    <label class="d-block mb-1">Baza danych Microsoft SQL:</label>
    <select id="msSqlSelect" class="form-select" style="width:auto; min-width:200px;">
      <option value="" disabled selected>-- wybierz --</option>
    </select>
    <div id="msSqlDesc" class="text-muted" style="font-size:0.85rem; margin-top:4px;"></div>
  `;
  tdPrice.innerHTML= `<strong><span id="msSqlPrice">0.00</span> PLN</strong>`;
  tdButton.innerHTML= `<button class="btn btn-primary" id="btnAddMsSql">Dodaj do wyceny</button>`;

  tr.appendChild(tdParams);
  tr.appendChild(tdPrice);
  tr.appendChild(tdButton);
  plansBody.appendChild(tr);

  // Logika
  const msSqlSelect = tdParams.querySelector('#msSqlSelect');
  const msSqlDescEl = tdParams.querySelector('#msSqlDesc');
  const msSqlPriceEl= tdPrice.querySelector('#msSqlPrice');
  const btnAddMsSql = tdButton.querySelector('#btnAddMsSql');

  if(category.msSqlDbOptions){
    category.msSqlDbOptions.forEach(opt=>{
      const o= document.createElement('option');
      o.value= opt.price;
      o.setAttribute('data-label', opt.label);
      o.setAttribute('data-desc', opt.desc||"");
      o.textContent= `${opt.label} (${opt.price} PLN)`;
      msSqlSelect.appendChild(o);
    });
  }

  function updatePrice(){
    const val= parseFloat(msSqlSelect.value)||0;
    msSqlPriceEl.textContent= val.toFixed(2);
  }
  function updateDesc(){
    if(!msSqlSelect.value){
      msSqlDescEl.textContent="";
      return;
    }
    const sel= msSqlSelect.options[msSqlSelect.selectedIndex];
    msSqlDescEl.textContent= sel.getAttribute('data-desc')||"";
  }
  msSqlSelect.addEventListener('change',()=>{
    updatePrice();
    updateDesc();
  });
  updatePrice();
  updateDesc();

  btnAddMsSql.addEventListener('click',()=>{
    if(!msSqlSelect.value){
      alert("Wybierz Bazę SQL!");
      return;
    }
    const sel= msSqlSelect.options[msSqlSelect.selectedIndex];
    const label= sel.getAttribute('data-label')||"SQL DB";
    const price= parseFloat(sel.value)||0;

    cart.push({
      name: "SaaS - MS SQL",
      details: label,
      price
    });
    renderCart();
  });
}

function renderSaaS_EnovaRow(category, plansBody){
  const tr= document.createElement('tr');
  const tdParams = document.createElement('td');
  const tdPrice  = document.createElement('td');
  const tdButton = document.createElement('td');

  tdParams.innerHTML=`
    <label class="d-block mb-1">Enova365Web:</label>
    <select id="enovaSelect" class="form-select" style="width:auto; min-width:200px;">
      <option value="" disabled selected>-- wybierz --</option>
    </select>
    <div id="enovaDesc" class="text-muted" style="font-size:0.85rem; margin-top:4px;"></div>
    <div class="form-check mt-2">
      <input class="form-check-input" type="checkbox" id="enovaHarmonogram">
      <label class="form-check-label" for="enovaHarmonogram">Harmonogram zadań</label>
    </div>
  `;
  tdPrice.innerHTML= `<strong><span id="enovaPrice">0.00</span> PLN</strong>`;
  tdButton.innerHTML= `<button class="btn btn-primary" id="btnAddEnova">Dodaj do wyceny</button>`;

  tr.appendChild(tdParams);
  tr.appendChild(tdPrice);
  tr.appendChild(tdButton);
  plansBody.appendChild(tr);

  const enovaSelect      = tdParams.querySelector('#enovaSelect');
  const enovaDescEl      = tdParams.querySelector('#enovaDesc');
  const enovaPriceEl     = tdPrice.querySelector('#enovaPrice');
  const enovaHarmonogram = tdParams.querySelector('#enovaHarmonogram');
  const btnAddEnova      = tdButton.querySelector('#btnAddEnova');

  if(category.enovaWebOptions){
    category.enovaWebOptions.forEach(opt=>{
      const o= document.createElement('option');
      o.value= opt.price;
      o.setAttribute('data-label', opt.label);
      o.setAttribute('data-desc', opt.desc||"");
      o.textContent= `${opt.label} (${opt.price} PLN)`;
      enovaSelect.appendChild(o);
    });
  }

  function updatePrice(){
    let total= parseFloat(enovaSelect.value)||0;
    if(enovaHarmonogram.checked){
      total+= (category.harmonogramCost||10);
    }
    enovaPriceEl.textContent= total.toFixed(2);
  }
  function updateDesc(){
    if(!enovaSelect.value){
      enovaDescEl.textContent="";
      return;
    }
    const sel= enovaSelect.options[enovaSelect.selectedIndex];
    enovaDescEl.textContent= sel.getAttribute('data-desc')||"";
  }

  enovaSelect.addEventListener('change', ()=>{
    updatePrice();
    updateDesc();
  });
  enovaHarmonogram.addEventListener('change', updatePrice);
  updatePrice();
  updateDesc();

  btnAddEnova.addEventListener('click',()=>{
    if(!enovaSelect.value){
      alert("Wybierz Enova!");
      return;
    }
    const sel= enovaSelect.options[enovaSelect.selectedIndex];
    const label= sel.getAttribute('data-label')||"Enova365Web";
    const basePrice= parseFloat(enovaSelect.value)||0;

    cart.push({
      name: "SaaS - Enova365Web",
      details: label,
      price: basePrice
    });
    if(enovaHarmonogram.checked){
      const harmCost= category.harmonogramCost||10;
      cart.push({
        name: "SaaS - Harmonogram zadań",
        details: "Dodatkowy moduł",
        price: harmCost
      });
    }
    renderCart();
  });
}

function renderSaaS_EnovaApiRow(category, plansBody){
  const tr= document.createElement('tr');
  const tdParams = document.createElement('td');
  const tdPrice  = document.createElement('td');
  const tdButton = document.createElement('td');

  tdParams.innerHTML=`
    <label class="d-block mb-1">Enova365Web API:</label>
    <select id="enovaApiSelect" class="form-select" style="width:auto; min-width:200px;">
      <option value="" disabled selected>-- wybierz --</option>
    </select>
    <div id="enovaApiDesc" class="text-muted" style="font-size:0.85rem; margin-top:4px;"></div>
  `;
  tdPrice.innerHTML= `<strong><span id="enovaApiPrice">0.00</span> PLN</strong>`;
  tdButton.innerHTML= `<button class="btn btn-primary" id="btnAddEnovaApi">Dodaj do wyceny</button>`;

  tr.appendChild(tdParams);
  tr.appendChild(tdPrice);
  tr.appendChild(tdButton);
  plansBody.appendChild(tr);

  const enovaApiSelect= tdParams.querySelector('#enovaApiSelect');
  const enovaApiDescEl= tdParams.querySelector('#enovaApiDesc');
  const enovaApiPriceEl= tdPrice.querySelector('#enovaApiPrice');
  const btnAddEnovaApi= tdButton.querySelector('#btnAddEnovaApi');

  if(category.enovaWebApiOptions){
    category.enovaWebApiOptions.forEach(opt=>{
      const o= document.createElement('option');
      o.value= opt.price;
      o.setAttribute('data-label', opt.label);
      o.setAttribute('data-desc', opt.desc||"");
      o.textContent= `${opt.label} (${opt.price} PLN)`;
      enovaApiSelect.appendChild(o);
    });
  }

  function updatePrice(){
    const val= parseFloat(enovaApiSelect.value)||0;
    enovaApiPriceEl.textContent= val.toFixed(2);
  }
  function updateDesc(){
    if(!enovaApiSelect.value){
      enovaApiDescEl.textContent="";
      return;
    }
    const sel= enovaApiSelect.options[enovaApiSelect.selectedIndex];
    enovaApiDescEl.textContent= sel.getAttribute('data-desc')||"";
  }
  enovaApiSelect.addEventListener('change',()=>{
    updatePrice();
    updateDesc();
  });
  updatePrice();
  updateDesc();

  btnAddEnovaApi.addEventListener('click',()=>{
    if(!enovaApiSelect.value){
      alert("Wybierz Enova365Web API!");
      return;
    }
    const sel= enovaApiSelect.options[enovaApiSelect.selectedIndex];
    const label= sel.getAttribute('data-label')||"EnovaAPI";
    const price= parseFloat(sel.value)||0;

    cart.push({
      name: "SaaS - EnovaAPI",
      details: label,
      price
    });
    renderCart();
  });
}

function renderSaaS_TerminalRow(category, plansBody){
  const tr= document.createElement('tr');
  const tdParams= document.createElement('td');
  const tdPrice = document.createElement('td');
  const tdButton= document.createElement('td');

  tdParams.innerHTML=`
    <label class="d-block mb-1">Terminal w chmurze:</label>
    <div class="mb-2">
      <label>Użytkownicy: </label>
      <input type="number" id="terminalUsers" min="0" value="0" style="width:60px; float:right;">
    </div>
    <div class="form-check mb-2">
      <input class="form-check-input" type="checkbox" id="terminalSecurity">
      <label class="form-check-label" for="terminalSecurity">Zabezpieczenie terminala</label>
    </div>
  `;
  tdPrice.innerHTML= `<strong><span id="terminalPrice">0.00</span> PLN</strong>`;
  tdButton.innerHTML= `<button class="btn btn-primary" id="btnAddTerminal">Dodaj do wyceny</button>`;

  tr.appendChild(tdParams);
  tr.appendChild(tdPrice);
  tr.appendChild(tdButton);
  plansBody.appendChild(tr);

  const terminalUsers    = tdParams.querySelector('#terminalUsers');
  const terminalSecurity = tdParams.querySelector('#terminalSecurity');
  const terminalPriceEl  = tdPrice.querySelector('#terminalPrice');
  const btnAddTerminal   = tdButton.querySelector('#btnAddTerminal');

  function updatePrice(){
    let total=0;
    const users= parseInt(terminalUsers.value,10)||0;
    if(users>0){
      total += users*(category.terminalPricePerUser||30);
      if(terminalSecurity.checked){
        total += (category.terminalSecurityCost||20);
      }
    }
    terminalPriceEl.textContent= total.toFixed(2);
  }
  [terminalUsers, terminalSecurity].forEach(el => el.addEventListener('input', updatePrice));
  updatePrice();

  btnAddTerminal.addEventListener('click',()=>{
    const users= parseInt(terminalUsers.value,10)||0;
    if(users<=0){
      alert("Podaj liczbę użytkowników terminala > 0!");
      return;
    }
    const termCost= users*(category.terminalPricePerUser||30);
    cart.push({
      name: "SaaS - Terminal w chmurze",
      details: `Users=${users}`,
      price: termCost
    });
    if(terminalSecurity.checked){
      const secCost= category.terminalSecurityCost||20;
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

function renderSaaS_ExtraDataRow(category, plansBody){
  const tr= document.createElement('tr');
  const tdParams= document.createElement('td');
  const tdPrice = document.createElement('td');
  const tdButton= document.createElement('td');

  tdParams.innerHTML=`
    <label class="d-block mb-1">Dodatkowe miejsce na dane (GB):</label>
    <input type="number" id="extraData" min="0" value="0" style="width:60px; float:right;">
  `;
  tdPrice.innerHTML= `<strong><span id="extraDataPrice">0.00</span> PLN</strong>`;
  tdButton.innerHTML= `<button class="btn btn-primary" id="btnAddExtraData">Dodaj do wyceny</button>`;

  tr.appendChild(tdParams);
  tr.appendChild(tdPrice);
  tr.appendChild(tdButton);
  plansBody.appendChild(tr);

  const extraData= tdParams.querySelector('#extraData');
  const extraDataPriceEl= tdPrice.querySelector('#extraDataPrice');
  const btnAddExtra= tdButton.querySelector('#btnAddExtraData');

  function updateExtraPrice(){
    const val= parseInt(extraData.value,10)||0;
    let cost= val*(category.extraDataStoragePrice||2);
    extraDataPriceEl.textContent= cost.toFixed(2);
  }
  extraData.addEventListener('input', updateExtraPrice);
  updateExtraPrice();

  btnAddExtra.addEventListener('click',()=>{
    const val= parseInt(extraData.value,10)||0;
    if(val<=0){
      alert("Podaj liczbę GB > 0!");
      return;
    }
    let cost= val*(category.extraDataStoragePrice||2);
    cart.push({
      name: "SaaS - Dodatkowe miejsce",
      details: `Ilość=${val}GB`,
      price: cost
    });
    renderCart();
  });
}

/****************************************************************************************************
 * Acronis / fallback => renderServicesList
 ****************************************************************************************************/
function renderServicesList(category, plansBody){
  // Tytuł
  plansBody.appendChild(sectionTitleRow(category.name));
  // Nagłówek
  plansBody.appendChild(sectionHeaderRow("Koszt miesięczny"));

  // Wiersz(–y)
  if(category.services && category.services.length){
    category.services.forEach(srv=>{
      const tr= document.createElement('tr');
      const tdParam = document.createElement('td');
      const tdPrice = document.createElement('td');
      const tdBtn   = document.createElement('td');

      tdParam.textContent= srv.label;
      tdPrice.innerHTML= `<strong>${srv.price} PLN</strong>`;
      tdBtn.innerHTML= `<button class="btn btn-primary btn-sm">Dodaj do wyceny</button>`;

      tr.appendChild(tdParam);
      tr.appendChild(tdPrice);
      tr.appendChild(tdBtn);
      plansBody.appendChild(tr);

      tdBtn.querySelector('button').addEventListener('click',()=>{
        cart.push({
          name: category.name,
          details: srv.label,
          price: srv.price
        });
        renderCart();
      });
    });
  } else {
    const tr= document.createElement('tr');
    const td= document.createElement('td');
    td.colSpan=3;
    td.textContent= "Brak usług w tej kategorii.";
    tr.appendChild(td);
    plansBody.appendChild(tr);
  }
}

/****************************************************************************************************
 * Microsoft CSP => "Microsoft 365"
 ****************************************************************************************************/
function renderMicrosoft365Section(category, plansBody){
  // Tytuł
  plansBody.appendChild(sectionTitleRow("Microsoft 365"));
  // Nagłówek
  plansBody.appendChild(sectionHeaderRow("Koszt miesięczny subskrypcji M365"));

  // Wiersz
  const tr= document.createElement('tr');
  const tdParam= document.createElement('td');
  const tdPrice= document.createElement('td');
  const tdBtn  = document.createElement('td');

  tdParam.innerHTML=`
    <label class="d-block mb-1">Wybierz subskrypcję:</label>
    <select id="m365Select" class="form-select" style="width:auto; min-width:200px;">
      <option value="" disabled selected>-- wybierz --</option>
    </select>
    <div id="m365Desc" class="text-muted" style="font-size:0.85rem; margin-top:4px;"></div>

    <div class="mt-2">
      <label>Ilość:</label>
      <input type="number" id="m365Qty" value="1" min="1" style="width:60px; float:right;">
    </div>
  `;
  tdPrice.innerHTML= `<strong><span id="m365Price">0.00</span> PLN</strong>`;
  tdBtn.innerHTML= `<button class="btn btn-primary" id="btnAddM365">Dodaj do wyceny</button>`;

  tr.appendChild(tdParam);
  tr.appendChild(tdPrice);
  tr.appendChild(tdBtn);
  plansBody.appendChild(tr);

  // Logika
  const m365Select= tdParam.querySelector('#m365Select');
  const m365Desc  = tdParam.querySelector('#m365Desc');
  const m365Qty   = tdParam.querySelector('#m365Qty');
  const m365PriceEl= tdPrice.querySelector('#m365Price');
  const btnAddM365= tdBtn.querySelector('#btnAddM365');

  if(category.msCspServices && category.msCspServices.length){
    category.msCspServices.forEach(srv=>{
      const opt= document.createElement('option');
      opt.value= srv.price;
      opt.setAttribute('data-label', srv.label);
      opt.setAttribute('data-desc', srv.desc||"");
      opt.textContent= `${srv.label} (${srv.price} PLN)`;
      m365Select.appendChild(opt);
    });
  }

  function updateM365Desc(){
    if(!m365Select.value){
      m365Desc.textContent="";
      return;
    }
    const sel= m365Select.options[m365Select.selectedIndex];
    m365Desc.textContent= sel.getAttribute('data-desc')||"";
  }
  function updateM365Price(){
    const val= parseFloat(m365Select.value)||0;
    const qty= parseInt(m365Qty.value,10)||1;
    m365PriceEl.textContent= (val*qty).toFixed(2);
  }
  m365Select.addEventListener('change', ()=>{
    updateM365Desc();
    updateM365Price();
  });
  m365Qty.addEventListener('input', updateM365Price);
  updateM365Desc();
  updateM365Price();

  btnAddM365.addEventListener('click',()=>{
    if(!m365Select.value){
      alert("Wybierz subskrypcję Microsoft 365!");
      return;
    }
    const sel   = m365Select.options[m365Select.selectedIndex];
    const label = sel.getAttribute('data-label')||"M365 sub";
    const val   = parseFloat(m365Select.value)||0;
    const qty   = parseInt(m365Qty.value,10)||1;
    const total = val*qty;

    cart.push({
      name: category.name + " (Microsoft 365)",
      details: `${label} x${qty}`,
      price: total
    });
    renderCart();
  });
}

/****************************************************************************************************
 * Bezpieczeństwo => 3 sekcje (Aplikacje webowe, Firewall, Analiza)
 ****************************************************************************************************/
function renderSecurityWebAppsSection(category, plansBody){
  // Tytuł
  plansBody.appendChild(sectionTitleRow("Aplikacje webowe"));
  // Nagłówek
  plansBody.appendChild(sectionHeaderRow("Koszt miesięczny skanowania aplikacji"));

  // Wiersz
  const tr= document.createElement('tr');
  const tdParam= document.createElement('td');
  const tdPrice= document.createElement('td');
  const tdBtn  = document.createElement('td');

  tdParam.innerHTML=`
    <label class="d-block mb-1">Wybierz usługę skanowania:</label>
    <select id="webAppSelect" class="form-select" style="width:auto; min-width:200px;">
      <option value="" disabled selected>-- wybierz --</option>
    </select>
    <div id="webAppDesc" class="text-muted mt-1" style="font-size:0.85rem;"></div>
  `;
  tdPrice.innerHTML= `<strong><span id="webAppPrice">0.00</span> PLN</strong>`;
  tdBtn.innerHTML= `<button class="btn btn-primary" id="btnAddWebApp">Dodaj do wyceny</button>`;

  tr.appendChild(tdParam);
  tr.appendChild(tdPrice);
  tr.appendChild(tdBtn);
  plansBody.appendChild(tr);

  const webAppSelect= tdParam.querySelector('#webAppSelect');
  const webAppDesc  = tdParam.querySelector('#webAppDesc');
  const webAppPriceEl= tdPrice.querySelector('#webAppPrice');
  const btnAddWebApp= tdBtn.querySelector('#btnAddWebApp');

  if(category.securityWebApp && category.securityWebApp.length){
    category.securityWebApp.forEach(srv=>{
      const opt= document.createElement('option');
      opt.value= srv.price;
      opt.setAttribute('data-label', srv.label);
      opt.setAttribute('data-desc', srv.desc||"");
      opt.textContent= `${srv.label} (${srv.price} PLN)`;
      webAppSelect.appendChild(opt);
    });
  }

  function updatePrice(){
    const val= parseFloat(webAppSelect.value)||0;
    webAppPriceEl.textContent= val.toFixed(2);
  }
  function updateDesc(){
    if(!webAppSelect.value){
      webAppDesc.textContent="";
      return;
    }
    const sel= webAppSelect.options[webAppSelect.selectedIndex];
    webAppDesc.textContent= sel.getAttribute('data-desc')||"";
  }
  webAppSelect.addEventListener('change', ()=>{
    updatePrice();
    updateDesc();
  });
  updatePrice();
  updateDesc();

  btnAddWebApp.addEventListener('click',()=>{
    if(!webAppSelect.value){
      alert("Wybierz usługę skanowania aplikacji webowej!");
      return;
    }
    const sel= webAppSelect.options[webAppSelect.selectedIndex];
    const label= sel.getAttribute('data-label')||"";
    const val= parseFloat(sel.value)||0;
    cart.push({
      name: category.name + " (Aplikacje webowe)",
      details: label,
      price: val
    });
    renderCart();
  });
}

function renderSecurityFirewallSection(category, plansBody){
  // Tytuł
  plansBody.appendChild(sectionTitleRow("Firewall w chmurze"));
  // Nagłówek
  plansBody.appendChild(sectionHeaderRow("Koszt miesięczny firewall"));

  // Wiersz
  const tr= document.createElement('tr');
  const tdParam= document.createElement('td');
  const tdPrice= document.createElement('td');
  const tdBtn  = document.createElement('td');

  tdParam.innerHTML=`
    <label class="d-block mb-1">Wybierz usługę Firewalla:</label>
    <select id="fwSelect" class="form-select" style="width:auto; min-width:200px;">
      <option value="" disabled selected>-- wybierz --</option>
    </select>
    <div id="fwDesc" class="text-muted mt-1" style="font-size:0.85rem;"></div>
  `;
  tdPrice.innerHTML= `<strong><span id="fwPrice">0.00</span> PLN</strong>`;
  tdBtn.innerHTML= `<button class="btn btn-primary" id="btnAddFW">Dodaj do wyceny</button>`;

  tr.appendChild(tdParam);
  tr.appendChild(tdPrice);
  tr.appendChild(tdBtn);
  plansBody.appendChild(tr);

  const fwSelect= tdParam.querySelector('#fwSelect');
  const fwDesc  = tdParam.querySelector('#fwDesc');
  const fwPriceEl= tdPrice.querySelector('#fwPrice');
  const btnAddFW= tdBtn.querySelector('#btnAddFW');

  if(category.securityFW && category.securityFW.length){
    category.securityFW.forEach(srv=>{
      const opt= document.createElement('option');
      opt.value= srv.price;
      opt.setAttribute('data-label', srv.label);
      opt.setAttribute('data-desc', srv.desc||"");
      opt.textContent= `${srv.label} (${srv.price} PLN)`;
      fwSelect.appendChild(opt);
    });
  }

  function updatePrice(){
    const val= parseFloat(fwSelect.value)||0;
    fwPriceEl.textContent= val.toFixed(2);
  }
  function updateDesc(){
    if(!fwSelect.value){
      fwDesc.textContent="";
      return;
    }
    const sel= fwSelect.options[fwSelect.selectedIndex];
    fwDesc.textContent= sel.getAttribute('data-desc')||"";
  }
  fwSelect.addEventListener('change',()=>{
    updatePrice();
    updateDesc();
  });
  updatePrice();
  updateDesc();

  btnAddFW.addEventListener('click',()=>{
    if(!fwSelect.value){
      alert("Wybierz usługę Firewalla w chmurze!");
      return;
    }
    const sel  = fwSelect.options[fwSelect.selectedIndex];
    const label= sel.getAttribute('data-label')||"";
    const val  = parseFloat(sel.value)||0;
    cart.push({
      name: category.name + " (Firewall)",
      details: label,
      price: val
    });
    renderCart();
  });
}

function renderSecurityAnalysisSection(category, plansBody){
  // Tytuł
  plansBody.appendChild(sectionTitleRow("Analiza zabezpieczeń"));
  // Nagłówek
  plansBody.appendChild(sectionHeaderRow("Koszt analizy w rozliczeniu miesięcznym"));

  // Wiersz
  const tr= document.createElement('tr');
  const tdParam= document.createElement('td');
  const tdPrice= document.createElement('td');
  const tdBtn  = document.createElement('td');

  const storObj= category.analysis;
  tdParam.innerHTML=`
    <div class="mb-2">
      <label>Centralne logowanie (szt.):</label>
      <input type="number" id="centralLogging" min="0" value="0" style="width:60px; float:right;">
    </div>
    <div class="mb-2">
      <label>Pamięć do centralnego logowania (GB):</label>
      <input type="number" id="memoryGB" min="0" value="0" style="width:60px; float:right;">
    </div>
  `;
  tdPrice.innerHTML= `<strong><span id="analysisPrice">0.00</span> PLN</strong>`;
  tdBtn.innerHTML= `<button class="btn btn-primary" id="btnAddAnalysis">Dodaj do wyceny</button>`;

  tr.appendChild(tdParam);
  tr.appendChild(tdPrice);
  tr.appendChild(tdBtn);
  plansBody.appendChild(tr);

  const loggingInput= tdParam.querySelector('#centralLogging');
  const memoryInput = tdParam.querySelector('#memoryGB');
  const priceEl     = tdPrice.querySelector('#analysisPrice');
  const btnAdd      = tdBtn.querySelector('#btnAddAnalysis');

  function updateAnalysisPrice(){
    let total=0;
    const logVal= parseInt(loggingInput.value,10)||0;
    const memVal= parseInt(memoryInput.value,10)||0;
    if(logVal>0){
      // np. 20 PLN/szt, 1 PLN/GB
      total+= logVal*20;
      total+= memVal*1;
    }
    priceEl.textContent= total.toFixed(2);
  }
  [loggingInput, memoryInput].forEach(el => el.addEventListener('input', updateAnalysisPrice));
  updateAnalysisPrice();

  btnAdd.addEventListener('click',()=>{
    const logVal= parseInt(loggingInput.value,10)||0;
    const memVal= parseInt(memoryInput.value,10)||0;
    if(logVal>0 && memVal<5){
      alert("Jeśli używasz centralnego logowania, pamięć musi być min. 5GB!");
      return;
    }
    let total=0;
    let desc="";
    if(logVal>0){
      total= logVal*20 + memVal*1;
      desc= `CentralLog=${logVal}, Memory=${memVal}GB`;
    } else {
      desc= "Brak analizy (0)";
    }
    cart.push({
      name: category.name + " (Analiza)",
      details: desc,
      price: total
    });
    renderCart();
  });
}

/****************************************************************************************************
 * Koszyk
 ****************************************************************************************************/
function renderCart() {
  const cartSection= document.getElementById('cartSection');
  const tbody= document.querySelector('#cartTable tbody');
  const totalEl= document.getElementById('cartTotal');

  if(!cart.length){
    cartSection.style.display='none';
    return;
  }
  cartSection.style.display='block';
  tbody.innerHTML='';

  let sum=0;
  cart.forEach((item, index)=>{
    sum+= item.price;
    const tr= document.createElement('tr');
    tr.innerHTML=`
      <td>${item.name}</td>
      <td>${item.details}</td>
      <td>${item.price.toFixed(2)}</td>
      <td><button class="btn btn-sm btn-danger">X</button></td>
    `;
    const btnRemove= tr.querySelector('button');
    btnRemove.addEventListener('click',()=>{
      cart.splice(index,1);
      renderCart();
    });
    tbody.appendChild(tr);
  });
  totalEl.textContent= sum.toFixed(2);
}

/****************************************************************************************************
 * initTooltips - Bootstrap 5
 ****************************************************************************************************/
function initTooltips(){
  const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
  tooltipTriggerList.map(el => new bootstrap.Tooltip(el));
}
