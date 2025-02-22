/****************************************************************************************************
 * script.js - wersja "flex + media queries" (bez <table>), 
 *             3 kolumny (parametry | cena | przycisk) na desktopie,
 *             na mobile (max-width:576px) układ pionowy.
 ****************************************************************************************************/

let categoriesData = [];
let cart = [];

/****************************************************************************************************
 * Po załadowaniu DOM wczytujemy data.json i rysujemy menu
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
 * renderCategoriesMenu - buduje listę linków do kategorii w #categoriesMenu
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
      document.querySelectorAll('#categoriesMenu a').forEach(a => a.classList.remove('active'));
      link.classList.add('active');
    });
    li.appendChild(link);
    menuUl.appendChild(li);
  });
}


/****************************************************************************************************
 * selectCategory - wywołuje funkcje renderujące zależnie od cat.type
 ****************************************************************************************************/
function selectCategory(catIndex) {
  const category = categoriesData[catIndex];
  document.getElementById('categoryTitle').textContent = category.name;
  document.getElementById('categoryDesc').textContent  = `Opcje dostępne w kategorii: ${category.name}.`;

  const plansContainer = document.getElementById('plansContainer');
  plansContainer.innerHTML = '';

  switch (category.type) {
    case 'iaas':
      renderIaaS(category, plansContainer);
      renderMsLicSection(category, plansContainer);
      break;
    case 'paas':
      renderPaaSMachinesSection(category, plansContainer);
      renderMsLicSection(category, plansContainer);
      renderPaaSDisasterRecoverySection(category, plansContainer);
      break;
    case 'saas':
      renderSaaSApplications(category, plansContainer);
      renderMsLicSection(category, plansContainer);
      break;
    case 'acronis':
      renderServicesList(category, plansContainer);
      break;
    case 'csp':
      renderMicrosoft365Section(category, plansContainer);
      break;
    case 'security':
      renderSecurityWebAppsSection(category, plansContainer);
      renderSecurityFirewallSection(category, plansContainer);
      renderSecurityAnalysisSection(category, plansContainer);
      break;
    default:
      renderServicesList(category, plansContainer);
  }

  initTooltips();
}


/****************************************************************************************************
 * Helper: createSection(titleText) => { wrapper, bodyContainer }
 *  Tworzy .section-wrapper z .section-title (niebieski pasek) i .section-body (białe tło)
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
 * Helper: createFlexRow => tworzy <div class="row-desktop"> z 3 kolumnami:
 *    paramCol (.col-params), priceCol (.col-price), buttonCol (.col-button)
 *  Zwraca obiekt { row, paramCol, priceCol, buttonCol }
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
 * IaaS
 ****************************************************************************************************/
function renderIaaS(category, container) {
  const sec = createSection("Maszyny wirtualne (IaaS)");
  // Tworzymy w .section-body => row-desktop => 3 col
  const { row, paramCol, priceCol, buttonCol } = createFlexRow();

  // Parametry
  paramCol.innerHTML = `
    <div class="inline-fields">
      <label>CPU (vCore):</label>
      <input type="range" id="cpuSlider" min="${category.sliders[0].min}" max="${category.sliders[0].max}"
             step="${category.sliders[0].step}" value="${category.sliders[0].min}" style="width:100px;">
      <span id="cpuVal">${category.sliders[0].min}</span>
    </div>
    <div class="inline-fields">
      <label>RAM (GB):</label>
      <input type="range" id="ramSlider" min="${category.sliders[1].min}" max="${category.sliders[1].max}"
             step="${category.sliders[1].step}" value="${category.sliders[1].min}" style="width:100px;">
      <span id="ramVal">${category.sliders[1].min}</span>
    </div>
    <div class="inline-fields">
      <label>SSD (GB):</label>
      <input type="range" id="ssdSlider" min="${category.sliders[2].min}" max="${category.sliders[2].max}"
             step="${category.sliders[2].step}" value="${category.sliders[2].min}" style="width:100px;">
      <span id="ssdVal">${category.sliders[2].min}</span>
    </div>
    <div class="inline-fields">
      <label>Kopie zapasowe (GB):</label>
      <input type="number" id="backupGB" value="0" min="0" style="width:60px;">
    </div>
    <div class="inline-fields">
      <label>Dodatkowe publiczne IP (szt.):</label>
      <input type="number" id="publicIp" value="0" min="0" style="width:60px;">
    </div>
  `;

  // Cena (wyśrodkowana)
  priceCol.innerHTML = `
    <strong><span id="iaasPrice">0.00</span> PLN</strong>
  `;

  // Guzik
  buttonCol.innerHTML = `
    <button class="btn btn-primary" id="btnAddIaas">Dodaj do wyceny</button>
  `;

  // Wstaw row do sekcji
  sec.bodyContainer.appendChild(row);
  container.appendChild(sec.wrapper);

  // Logika
  const cpuSlider = paramCol.querySelector('#cpuSlider');
  const ramSlider = paramCol.querySelector('#ramSlider');
  const ssdSlider = paramCol.querySelector('#ssdSlider');
  const backupGB  = paramCol.querySelector('#backupGB');
  const publicIp  = paramCol.querySelector('#publicIp');
  const priceEl   = priceCol.querySelector('#iaasPrice');
  const btnAdd    = buttonCol.querySelector('#btnAddIaas');

  function updatePrice() {
    let total = 0;
    const cpuVal   = parseInt(cpuSlider.value,10);
    const ramVal   = parseInt(ramSlider.value,10);
    const ssdVal   = parseInt(ssdSlider.value,10);
    const backupVal= parseInt(backupGB.value,10)||0;
    const ipVal    = parseInt(publicIp.value,10)||0;
    total += cpuVal*(category.sliders[0].pricePerUnit||0);
    total += ramVal*(category.sliders[1].pricePerUnit||0);
    total += ssdVal*(category.sliders[2].pricePerUnit||0);
    if(backupVal>0) total += backupVal*(category.backupPricePerGB||0);
    if(ipVal>0)     total += ipVal*(category.publicIPPrice||0);

    paramCol.querySelector('#cpuVal').textContent = cpuVal;
    paramCol.querySelector('#ramVal').textContent = ramVal;
    paramCol.querySelector('#ssdVal').textContent = ssdVal;
    priceEl.textContent = total.toFixed(2);
  }
  [cpuSlider, ramSlider, ssdSlider, backupGB, publicIp].forEach(el =>
    el.addEventListener('input', updatePrice)
  );
  updatePrice();

  btnAdd.addEventListener('click', () => {
    const total= parseFloat(priceEl.textContent)||0;
    const cpuVal   = parseInt(cpuSlider.value,10);
    const ramVal   = parseInt(ramSlider.value,10);
    const ssdVal   = parseInt(ssdSlider.value,10);
    const backupVal= parseInt(backupGB.value,10)||0;
    const ipVal    = parseInt(publicIp.value,10)||0;
    let desc = `CPU=${cpuVal}, RAM=${ramVal}GB, SSD=${ssdVal}GB`;
    if(backupVal>0) desc+= `, Backup=${backupVal}GB`;
    if(ipVal>0) desc+= `, +${ipVal}xPublicIP`;

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
function renderMsLicSection(category, container) {
  if(!category.msSplaServices) return;
  const sec = createSection("Licencje Microsoft");
  const { row, paramCol, priceCol, buttonCol } = createFlexRow();

  // Parametry
  paramCol.innerHTML=`
    <div class="inline-fields">
      <label>Wybierz licencję:</label>
      <select id="msSelect" class="form-select" style="width:auto; min-width:150px;">
        <option value="" disabled selected>-- wybierz --</option>
      </select>
      <label>Ilość:</label>
      <input type="number" id="msQty" value="1" min="1" style="width:60px;">
    </div>
  `;

  // Cena
  priceCol.innerHTML=`
    <strong><span id="msPrice">0.00</span> PLN</strong>
  `;

  // Guzik
  buttonCol.innerHTML=`
    <button class="btn btn-primary" id="btnAddMS">Dodaj do wyceny</button>
  `;

  sec.bodyContainer.appendChild(row);
  container.appendChild(sec.wrapper);

  const msSelect  = paramCol.querySelector('#msSelect');
  const msQty     = paramCol.querySelector('#msQty');
  const msPriceEl = priceCol.querySelector('#msPrice');
  const btnAddMS  = buttonCol.querySelector('#btnAddMS');

  category.msSplaServices.forEach(srv=>{
    const opt= document.createElement('option');
    opt.value= srv.price;
    opt.setAttribute('data-label', srv.label);
    opt.textContent= `${srv.label} (${srv.price} PLN)`;
    msSelect.appendChild(opt);
  });

  function updatePrice() {
    if(!msSelect.value){
      msPriceEl.textContent='0.00';
      return;
    }
    const price= parseFloat(msSelect.value)||0;
    const qty  = parseInt(msQty.value,10)||1;
    msPriceEl.textContent= (price*qty).toFixed(2);
  }
  msSelect.addEventListener('change', updatePrice);
  msQty.addEventListener('input', updatePrice);
  updatePrice();

  btnAddMS.addEventListener('click', ()=>{
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
 * PaaS - Maszyny
 ****************************************************************************************************/
function renderPaaSMachinesSection(category, container) {
  const sec = createSection("Maszyny wirtualne (PaaS)");
  const { row, paramCol, priceCol, buttonCol } = createFlexRow();

  // Parametry
  paramCol.innerHTML=`
    <div class="inline-fields">
      <label>Wybierz instancję:</label>
      <select id="paasInst" class="form-select" style="width:auto; min-width:150px;">
        <option value="" disabled selected>-- wybierz --</option>
      </select>
    </div>
    <div id="paasInstDesc" class="text-muted" style="font-size:0.85rem; margin-bottom:8px;"></div>

    <div class="inline-fields">
      <label>Wsparcie techniczne:</label>
      <select id="paasSupport" class="form-select" style="width:auto; min-width:150px;">
        <option value="" disabled selected>-- wybierz --</option>
        <option value="gold">C-SUPPORT-GOLD</option>
        <option value="platinum">C-SUPPORT-PLATINUM-AddON</option>
      </select>
    </div>
    <div id="paasSupportDesc" class="text-muted" style="font-size:0.85rem; margin-bottom:8px;"></div>

    <div class="inline-fields">
      <label>Dysk SSD (GB):</label>
      <input type="number" id="paasSsd" value="0" min="0" style="width:60px;">
    </div>
    <div class="inline-fields">
      <label>Kopie zapasowe (GB):</label>
      <input type="number" id="paasBackup" value="0" min="0" style="width:60px;">
    </div>
    <div class="inline-fields">
      <label>Dodatkowe publiczne IP (szt.):</label>
      <input type="number" id="paasIp" value="0" min="0" style="width:60px;">
    </div>
  `;

  // Cena
  priceCol.innerHTML=`
    <strong><span id="paasPrice">0.00</span> PLN</strong>
  `;

  // Guzik
  buttonCol.innerHTML=`
    <button class="btn btn-primary" id="btnAddPaaS">Dodaj do wyceny</button>
  `;

  sec.bodyContainer.appendChild(row);
  container.appendChild(sec.wrapper);

  const instSelect   = paramCol.querySelector('#paasInst');
  const instDescEl   = paramCol.querySelector('#paasInstDesc');
  const supportSel   = paramCol.querySelector('#paasSupport');
  const supportDescEl= paramCol.querySelector('#paasSupportDesc');
  const ssdInput     = paramCol.querySelector('#paasSsd');
  const backupInput  = paramCol.querySelector('#paasBackup');
  const ipInput      = paramCol.querySelector('#paasIp');
  const priceEl      = priceCol.querySelector('#paasPrice');
  const btnAdd       = buttonCol.querySelector('#btnAddPaaS');

  if (category.paasInstances) {
    category.paasInstances.forEach(inst=>{
      const opt= document.createElement('option');
      opt.value= inst.price;
      opt.setAttribute('data-label', inst.label);
      opt.setAttribute('data-desc', inst.desc||"");
      opt.textContent= `${inst.label} (${inst.price} PLN)`;
      instSelect.appendChild(opt);
    });
  }

  function updatePaaS() {
    if (instSelect.value) {
      const sel= instSelect.options[instSelect.selectedIndex];
      instDescEl.textContent= sel.getAttribute('data-desc')||"";
    } else {
      instDescEl.textContent= "";
    }
    if (supportSel.value==='gold') {
      supportDescEl.textContent= category.supportGoldDesc||"";
    } else if (supportSel.value==='platinum') {
      supportDescEl.textContent= (category.supportGoldDesc||"")+" "+(category.supportPlatinumDesc||"");
    } else {
      supportDescEl.textContent= "";
    }

    let total=0;
    const instVal= parseFloat(instSelect.value)||0;
    total+= instVal;
    if (supportSel.value==='gold') {
      total+=(category.supportGoldPrice||0);
    } else if (supportSel.value==='platinum') {
      total+=(category.supportGoldPrice||0)+(category.supportPlatinumAddOnPrice||0);
    }
    const ssdVal= parseInt(ssdInput.value,10)||0;
    total+= ssdVal*1;
    const backupVal= parseInt(backupInput.value,10)||0;
    if(backupVal>0) total+= backupVal*(category.backupPricePerGB||0);
    const ipVal= parseInt(ipInput.value,10)||0;
    if(ipVal>0) total+= ipVal*(category.publicIPPrice||0);

    priceEl.textContent= total.toFixed(2);
  }
  [instSelect, supportSel, ssdInput, backupInput, ipInput].forEach(el=>{
    el.addEventListener('change', updatePaaS);
    el.addEventListener('input', updatePaaS);
  });
  updatePaaS();

  btnAdd.addEventListener('click', ()=>{
    if(!instSelect.value){
      alert("Musisz wybrać instancję PaaS!");
      return;
    }
    if(!supportSel.value){
      alert("Musisz wybrać co najmniej C-SUPPORT-GOLD!");
      return;
    }
    const total= parseFloat(priceEl.textContent)||0;
    const selInst= instSelect.options[instSelect.selectedIndex];
    const instLabel= selInst.getAttribute('data-label')||"";
    let supText="";
    if(supportSel.value==='gold') {
      supText="C-SUPPORT-GOLD";
    } else if(supportSel.value==='platinum') {
      supText="C-SUPPORT-GOLD + PLATINUM-AddON";
    }
    const ssdVal= parseInt(ssdInput.value,10)||0;
    const backupVal= parseInt(backupInput.value,10)||0;
    const ipVal= parseInt(ipInput.value,10)||0;

    let desc= `Instancja=${instLabel}, Wsparcie=${supText}`;
    if(ssdVal>0) desc+= `, SSD=${ssdVal}GB`;
    if(backupVal>0) desc+= `, Backup=${backupVal}GB`;
    if(ipVal>0) desc+= `, +${ipVal}xPublicIP`;

    cart.push({ name: "PaaS", details: desc, price: total });
    renderCart();
  });
}

function renderPaaSDisasterRecoverySection(category, container) {
  if(!category.drServices) return;
  const sec = createSection("Disaster Recovery (PaaS)");
  const { row, paramCol, priceCol, buttonCol } = createFlexRow();

  const storObj= category.drServices.find(x=>x.id==='C-DR-STORAGE');
  const ipObj  = category.drServices.find(x=>x.id==='C-DR-IP');

  paramCol.innerHTML=`
    <div class="inline-fields">
      <label>${storObj?.label||'C-DR-STORAGE'} (GB):</label>
      <input type="number" id="drStorage" value="0" min="0" style="width:60px;">
    </div>
    <div class="inline-fields">
      <label>${ipObj?.label||'C-DR-IP'} (szt.):</label>
      <input type="number" id="drIp" value="1" min="1" style="width:60px;">
    </div>
  `;
  priceCol.innerHTML=`
    <strong><span id="drPrice">0.00</span> PLN</strong>
  `;
  buttonCol.innerHTML=`
    <button class="btn btn-primary" id="btnAddDR">Dodaj do wyceny</button>
  `;

  sec.bodyContainer.appendChild(row);
  container.appendChild(sec.wrapper);

  const drStorage= paramCol.querySelector('#drStorage');
  const drIp     = paramCol.querySelector('#drIp');
  const drPriceEl= priceCol.querySelector('#drPrice');
  const btnAddDR = buttonCol.querySelector('#btnAddDR');

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
    cart.push({ name: "PaaS (DR)", details: desc, price: total });
    renderCart();
  });
}

/****************************************************************************************************
 * SaaS
 ****************************************************************************************************/
function renderSaaSApplications(category, container){
  const sec = createSection("Aplikacje (SaaS)");

  // MsSQL
  renderSaaS_MsSQLRow(category, sec.bodyContainer);
  // Enova
  renderSaaS_EnovaRow(category, sec.bodyContainer);
  // Enova API
  renderSaaS_EnovaApiRow(category, sec.bodyContainer);
  // Terminal
  renderSaaS_TerminalRow(category, sec.bodyContainer);
  // Extra
  renderSaaS_ExtraDataRow(category, sec.bodyContainer);

  container.appendChild(sec.wrapper);
}

/** MsSQL */
function renderSaaS_MsSQLRow(category, bodyContainer){
  const { row, paramCol, priceCol, buttonCol } = createFlexRow();
  paramCol.innerHTML=`
    <div class="inline-fields">
      <label>Baza danych Microsoft SQL:</label>
      <select id="msSqlSelect" class="form-select" style="width:auto; min-width:150px;">
        <option value="" disabled selected>-- wybierz --</option>
      </select>
    </div>
    <div id="msSqlDesc" class="text-muted" style="font-size:0.85rem; margin-top:4px;"></div>
  `;
  priceCol.innerHTML=`
    <strong><span id="msSqlPrice">0.00</span> PLN</strong>
  `;
  buttonCol.innerHTML=`
    <button class="btn btn-primary" id="btnAddMsSql">Dodaj do wyceny</button>
  `;

  bodyContainer.appendChild(row);

  const msSqlSelect  = paramCol.querySelector('#msSqlSelect');
  const msSqlDescEl  = paramCol.querySelector('#msSqlDesc');
  const msSqlPriceEl = priceCol.querySelector('#msSqlPrice');
  const btnAddMsSql  = buttonCol.querySelector('#btnAddMsSql');

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
  msSqlSelect.addEventListener('change', ()=>{
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

/** Enova */
function renderSaaS_EnovaRow(category, bodyContainer){
  const { row, paramCol, priceCol, buttonCol } = createFlexRow();
  paramCol.innerHTML=`
    <div class="inline-fields">
      <label>Enova365Web:</label>
      <select id="enovaSelect" class="form-select" style="width:auto; min-width:150px;">
        <option value="" disabled selected>-- wybierz --</option>
      </select>
    </div>
    <div id="enovaDesc" class="text-muted" style="font-size:0.85rem; margin-top:4px;"></div>
    <div class="inline-fields mt-2">
      <label>Harmonogram:</label>
      <input type="checkbox" id="enovaHarm">
    </div>
  `;
  priceCol.innerHTML=`
    <strong><span id="enovaPrice">0.00</span> PLN</strong>
  `;
  buttonCol.innerHTML=`
    <button class="btn btn-primary" id="btnAddEnova">Dodaj do wyceny</button>
  `;

  bodyContainer.appendChild(row);

  const enovaSelect = paramCol.querySelector('#enovaSelect');
  const enovaDesc   = paramCol.querySelector('#enovaDesc');
  const enovaPrice  = priceCol.querySelector('#enovaPrice');
  const enovaHarm   = paramCol.querySelector('#enovaHarm');
  const btnAddEnova = buttonCol.querySelector('#btnAddEnova');

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
    if(enovaHarm.checked){
      total+=(category.harmonogramCost||10);
    }
    enovaPrice.textContent= total.toFixed(2);
  }
  function updateDesc(){
    if(!enovaSelect.value){
      enovaDesc.textContent="";
      return;
    }
    const sel= enovaSelect.options[enovaSelect.selectedIndex];
    enovaDesc.textContent= sel.getAttribute('data-desc')||"";
  }
  enovaSelect.addEventListener('change', ()=>{
    updatePrice();
    updateDesc();
  });
  enovaHarm.addEventListener('change', updatePrice);
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
    if(enovaHarm.checked){
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

/** Enova API */
function renderSaaS_EnovaApiRow(category, bodyContainer){
  const { row, paramCol, priceCol, buttonCol } = createFlexRow();
  paramCol.innerHTML=`
    <div class="inline-fields">
      <label>Enova365Web API:</label>
      <select id="enovaApiSelect" class="form-select" style="width:auto; min-width:150px;">
        <option value="" disabled selected>-- wybierz --</option>
      </select>
    </div>
    <div id="enovaApiDesc" class="text-muted" style="font-size:0.85rem; margin-top:4px;"></div>
  `;
  priceCol.innerHTML=`
    <strong><span id="enovaApiPrice">0.00</span> PLN</strong>
  `;
  buttonCol.innerHTML=`
    <button class="btn btn-primary" id="btnAddEnovaApi">Dodaj do wyceny</button>
  `;

  bodyContainer.appendChild(row);

  const enovaApiSelect= paramCol.querySelector('#enovaApiSelect');
  const enovaApiDescEl= paramCol.querySelector('#enovaApiDesc');
  const enovaApiPriceEl= priceCol.querySelector('#enovaApiPrice');
  const btnAddEnovaApi= buttonCol.querySelector('#btnAddEnovaApi');

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
  enovaApiSelect.addEventListener('change', ()=>{
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

/** Terminal */
function renderSaaS_TerminalRow(category, bodyContainer){
  const { row, paramCol, priceCol, buttonCol } = createFlexRow();
  paramCol.innerHTML=`
    <div class="inline-fields">
      <label>Terminal w chmurze:</label>
      <label>Użytkownicy:</label>
      <input type="number" id="termUsers" value="0" min="0" style="width:60px;">
    </div>
    <div class="inline-fields mt-2">
      <label>Zabezpieczenie terminala:</label>
      <input type="checkbox" id="termSec">
    </div>
  `;
  priceCol.innerHTML=`
    <strong><span id="termPrice">0.00</span> PLN</strong>
  `;
  buttonCol.innerHTML=`
    <button class="btn btn-primary" id="btnAddTerm">Dodaj do wyceny</button>
  `;

  bodyContainer.appendChild(row);

  const termUsers   = paramCol.querySelector('#termUsers');
  const termSec     = paramCol.querySelector('#termSec');
  const termPriceEl = priceCol.querySelector('#termPrice');
  const btnAddTerm  = buttonCol.querySelector('#btnAddTerm');

  function updateTermPrice(){
    let total=0;
    const users= parseInt(termUsers.value,10)||0;
    if(users>0){
      total+= users*(category.terminalPricePerUser||30);
      if(termSec.checked){
        total+=(category.terminalSecurityCost||20);
      }
    }
    termPriceEl.textContent= total.toFixed(2);
  }
  [termUsers, termSec].forEach(el => el.addEventListener('input', updateTermPrice));
  updateTermPrice();

  btnAddTerm.addEventListener('click',()=>{
    const users= parseInt(termUsers.value,10)||0;
    if(users<=0){
      alert("Podaj liczbę użytkowników > 0!");
      return;
    }
    const base= users*(category.terminalPricePerUser||30);
    cart.push({
      name: "SaaS - Terminal w chmurze",
      details: `Users=${users}`,
      price: base
    });
    if(termSec.checked){
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

/** Extra */
function renderSaaS_ExtraDataRow(category, bodyContainer){
  const { row, paramCol, priceCol, buttonCol } = createFlexRow();
  paramCol.innerHTML=`
    <div class="inline-fields">
      <label>Dodatkowe miejsce na dane (GB):</label>
      <input type="number" id="extraData" value="0" min="0" style="width:60px;">
    </div>
  `;
  priceCol.innerHTML=`
    <strong><span id="extraPrice">0.00</span> PLN</strong>
  `;
  buttonCol.innerHTML=`
    <button class="btn btn-primary" id="btnAddExtra">Dodaj do wyceny</button>
  `;

  bodyContainer.appendChild(row);

  const extraData= paramCol.querySelector('#extraData');
  const extraPriceEl= priceCol.querySelector('#extraPrice');
  const btnAddExtra= buttonCol.querySelector('#btnAddExtra');

  function updateExtraPrice(){
    const val= parseInt(extraData.value,10)||0;
    let cost= val*(category.extraDataStoragePrice||2);
    extraPriceEl.textContent= cost.toFixed(2);
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
function renderServicesList(category, container) {
  const sec = createSection(category.name);

  // Każdą usługę w "row-desktop"
  if(category.services && category.services.length){
    category.services.forEach(srv=>{
      const { row, paramCol, priceCol, buttonCol } = createFlexRow();
      paramCol.textContent= srv.label;
      priceCol.innerHTML= `<strong>${srv.price} PLN</strong>`;
      buttonCol.innerHTML= `<button class="btn btn-primary btn-sm">Dodaj do wyceny</button>`;
      buttonCol.querySelector('button').addEventListener('click', ()=>{
        cart.push({ name: category.name, details: srv.label, price: srv.price });
        renderCart();
      });
      sec.bodyContainer.appendChild(row);
    });
  } else {
    // Brak usług
    const infoDiv= document.createElement('div');
    infoDiv.textContent= "Brak usług w tej kategorii.";
    sec.bodyContainer.appendChild(infoDiv);
  }
  container.appendChild(sec.wrapper);
}

/****************************************************************************************************
 * Microsoft CSP => "Microsoft 365"
 ****************************************************************************************************/
function renderMicrosoft365Section(category, container){
  const sec = createSection("Microsoft 365");
  const { row, paramCol, priceCol, buttonCol } = createFlexRow();

  paramCol.innerHTML=`
    <div class="inline-fields">
      <label>Wybierz subskrypcję:</label>
      <select id="m365Select" class="form-select" style="width:auto; min-width:150px;">
        <option value="" disabled selected>-- wybierz --</option>
      </select>
      <label>Ilość:</label>
      <input type="number" id="m365Qty" value="1" min="1" style="width:60px;">
    </div>
    <div id="m365Desc" class="text-muted" style="font-size:0.85rem; margin-top:4px;"></div>
  `;
  priceCol.innerHTML=`
    <strong><span id="m365Price">0.00</span> PLN</strong>
  `;
  buttonCol.innerHTML=`
    <button class="btn btn-primary" id="btnAddM365">Dodaj do wyceny</button>
  `;

  sec.bodyContainer.appendChild(row);
  container.appendChild(sec.wrapper);

  const m365Select= paramCol.querySelector('#m365Select');
  const m365Desc  = paramCol.querySelector('#m365Desc');
  const m365Qty   = paramCol.querySelector('#m365Qty');
  const m365PriceEl= priceCol.querySelector('#m365Price');
  const btnAddM365= buttonCol.querySelector('#btnAddM365');

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

  function updateDesc(){
    if(!m365Select.value){
      m365Desc.textContent="";
      return;
    }
    const sel= m365Select.options[m365Select.selectedIndex];
    m365Desc.textContent= sel.getAttribute('data-desc')||"";
  }
  function updatePrice(){
    const val= parseFloat(m365Select.value)||0;
    const qty= parseInt(m365Qty.value,10)||1;
    m365PriceEl.textContent= (val*qty).toFixed(2);
  }
  m365Select.addEventListener('change', ()=>{
    updateDesc();
    updatePrice();
  });
  m365Qty.addEventListener('input', updatePrice);
  updateDesc();
  updatePrice();

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
 * Bezpieczeństwo (3 sekcje)
 ****************************************************************************************************/
function renderSecurityWebAppsSection(category, container){
  const sec = createSection("Aplikacje webowe");
  const { row, paramCol, priceCol, buttonCol } = createFlexRow();

  paramCol.innerHTML=`
    <div class="inline-fields">
      <label>Wybierz usługę:</label>
      <select id="webAppSelect" class="form-select" style="width:auto; min-width:150px;">
        <option value="" disabled selected>-- wybierz --</option>
      </select>
    </div>
    <div id="webAppDesc" class="text-muted" style="font-size:0.85rem; margin-top:4px;"></div>
  `;
  priceCol.innerHTML=`
    <strong><span id="webAppPrice">0.00</span> PLN</strong>
  `;
  buttonCol.innerHTML=`
    <button class="btn btn-primary" id="btnAddWebApp">Dodaj do wyceny</button>
  `;

  sec.bodyContainer.appendChild(row);
  container.appendChild(sec.wrapper);

  const webAppSelect= paramCol.querySelector('#webAppSelect');
  const webAppDesc  = paramCol.querySelector('#webAppDesc');
  const webAppPriceEl= priceCol.querySelector('#webAppPrice');
  const btnAddWebApp= buttonCol.querySelector('#btnAddWebApp');

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
  webAppSelect.addEventListener('change',()=>{
    updatePrice();
    updateDesc();
  });
  updatePrice();
  updateDesc();

  btnAddWebApp.addEventListener('click',()=>{
    if(!webAppSelect.value){
      alert("Wybierz usługę skanowania!");
      return;
    }
    const sel   = webAppSelect.options[webAppSelect.selectedIndex];
    const label = sel.getAttribute('data-label')||"";
    const val   = parseFloat(sel.value)||0;
    cart.push({
      name: category.name + " (Aplikacje webowe)",
      details: label,
      price: val
    });
    renderCart();
  });
}

function renderSecurityFirewallSection(category, container){
  const sec = createSection("Firewall w chmurze");
  const { row, paramCol, priceCol, buttonCol } = createFlexRow();

  paramCol.innerHTML=`
    <div class="inline-fields">
      <label>Wybierz usługę:</label>
      <select id="fwSelect" class="form-select" style="width:auto; min-width:150px;">
        <option value="" disabled selected>-- wybierz --</option>
      </select>
    </div>
    <div id="fwDesc" class="text-muted" style="font-size:0.85rem; margin-top:4px;"></div>
  `;
  priceCol.innerHTML=`
    <strong><span id="fwPrice">0.00</span> PLN</strong>
  `;
  buttonCol.innerHTML=`
    <button class="btn btn-primary" id="btnAddFW">Dodaj do wyceny</button>
  `;

  sec.bodyContainer.appendChild(row);
  container.appendChild(sec.wrapper);

  const fwSelect = paramCol.querySelector('#fwSelect');
  const fwDesc   = paramCol.querySelector('#fwDesc');
  const fwPriceEl= priceCol.querySelector('#fwPrice');
  const btnAddFW = buttonCol.querySelector('#btnAddFW');

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
      alert("Wybierz usługę Firewalla!");
      return;
    }
    const sel   = fwSelect.options[fwSelect.selectedIndex];
    const label = sel.getAttribute('data-label')||"";
    const val   = parseFloat(sel.value)||0;
    cart.push({
      name: category.name + " (Firewall)",
      details: label,
      price: val
    });
    renderCart();
  });
}

function renderSecurityAnalysisSection(category, container){
  const sec = createSection("Analiza zabezpieczeń");
  const { row, paramCol, priceCol, buttonCol } = createFlexRow();

  paramCol.innerHTML=`
    <div class="inline-fields">
      <label>Centralne logowanie (szt.):</label>
      <input type="number" id="centralLog" value="0" min="0" style="width:60px;">
    </div>
    <div class="inline-fields mt-2">
      <label>Pamięć do logowania (GB):</label>
      <input type="number" id="memoryGB" value="0" min="0" style="width:60px;">
    </div>
  `;
  priceCol.innerHTML=`
    <strong><span id="analysisPrice">0.00</span> PLN</strong>
  `;
  buttonCol.innerHTML=`
    <button class="btn btn-primary" id="btnAddAnalysis">Dodaj do wyceny</button>
  `;

  sec.bodyContainer.appendChild(row);
  container.appendChild(sec.wrapper);

  const centralLog= paramCol.querySelector('#centralLog');
  const memoryGB = paramCol.querySelector('#memoryGB');
  const priceEl = priceCol.querySelector('#analysisPrice');
  const btnAdd = buttonCol.querySelector('#btnAddAnalysis');

  function updateAnalysis(){
    let total=0;
    const logVal= parseInt(centralLog.value,10)||0;
    const memVal= parseInt(memoryGB.value,10)||0;
    if(logVal>0){
      total+= logVal*20 + memVal*1;
    }
    priceEl.textContent= total.toFixed(2);
  }
  [centralLog, memoryGB].forEach(el => el.addEventListener('input', updateAnalysis));
  updateAnalysis();

  btnAdd.addEventListener('click',()=>{
    const logVal= parseInt(centralLog.value,10)||0;
    const memVal= parseInt(memoryGB.value,10)||0;
    if(logVal>0 && memVal<5){
      alert("Jeśli używasz centralnego logowania, pamięć musi być min. 5GB!");
      return;
    }
    let total=0;
    let desc="";
    if(logVal>0){
      total= logVal*20 + memVal;
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
 * initTooltips - bootstrap 5
 ****************************************************************************************************/
function initTooltips(){
  const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
  tooltipTriggerList.map(el => new bootstrap.Tooltip(el));
}
