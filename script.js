/****************************************************************************************************
 * script.js – spełnia 4 ostatnie wymagania:
 * 1) Pola typu "ilość szt." są tuż obok etykiety,
 * 2) Cena w kolumnie jest wyśrodkowana,
 * 3) Sekcje mają zaokrąglone rogi, nazwa sekcji na niebieskim tle, odstęp między sekcjami,
 * 4) W SaaS inputy i selecty są w tej samej linii co etykieta (nie pod spodem).
 *
 * Struktura:
 *   - Dla każdej sekcji (IaaS, PaaS, SaaS, itp.) tworzymy:
 *       <div class="section-wrapper">
 *         <div class="section-title">Nazwa sekcji</div>
 *         <div class="section-body">
 *           <table> z 3 kolumnami: Parametry | Cena | Przycisk
 *         </div>
 *       </div>
 ***************************************************************************************************/

let categoriesData = [];
let cart = [];

/****************************************************************************************************
 * Po załadowaniu DOM – wczytujemy data.json => categoriesData => render menu
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
 * renderCategoriesMenu – listuje kategorie w #categoriesMenu
 ****************************************************************************************************/
function renderCategoriesMenu(categories) {
  const menuUl = document.getElementById('categoriesMenu');
  menuUl.innerHTML = '';

  categories.forEach((cat, idx) => {
    const li = document.createElement('li');
    const link = document.createElement('a');
    link.href = '#';
    link.textContent = cat.name;
    link.addEventListener('click', e => {
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
 * selectCategory – rysujemy sekcje w #plansContainer (lub #plansTableBody)
 ****************************************************************************************************/
function selectCategory(catIndex) {
  const category = categoriesData[catIndex];
  
  // Ustawiamy tytuł, opis
  document.getElementById('categoryTitle').textContent = category.name;
  document.getElementById('categoryDesc').textContent  = `Opcje dostępne w kategorii: ${category.name}.`;

  // Czyścimy container
  const container = document.getElementById('plansContainer');  // np. <div id="plansContainer">
  container.innerHTML = '';

  // W zależności od category.type
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
      renderMsLicSection(category, container);
      break;
    case 'acronis':
      renderServicesList(category, container);
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
      renderServicesList(category, container);
  }

  initTooltips();
}


/****************************************************************************************************
 * Helper: tworzy <div class="section-wrapper"> z dwiema warstwami:
 *   <div class="section-title">tytuł na niebieskim tle</div>
 *   <div class="section-body">białe tło z margin/padding</div>
 * Zwraca obiekt { wrapper, bodyContainer }, by móc wstawić tam <table> lub cokolwiek
 ****************************************************************************************************/
function createSection(titleText) {
  // Główny wrapper
  const wrapper = document.createElement('div');
  wrapper.classList.add('section-wrapper');  // styl w CSS: margin-bottom, border-radius

  // Pasek tytułu (niebieskie tło)
  const titleDiv = document.createElement('div');
  titleDiv.classList.add('section-title');   // w CSS: background-color, padding
  titleDiv.innerHTML = `<h5 class="m-0">${titleText}</h5>`;

  // Białe wnętrze
  const bodyDiv = document.createElement('div');
  bodyDiv.classList.add('section-body');     // w CSS: background-color:white, padding

  wrapper.appendChild(titleDiv);
  wrapper.appendChild(bodyDiv);

  return { wrapper, bodyContainer: bodyDiv };
}


/****************************************************************************************************
 * Helper: tworzy <table> z thead: Parametry | Cena (MIESIĘCZNIE) | [puste]
 * i zwraca obiekt { table, tbodyEl }
 ****************************************************************************************************/
function createParamTable(tooltip="Koszt miesięczny") {
  const table = document.createElement('table');
  table.classList.add('table', 'mb-0');
  table.style.borderCollapse = 'separate';
  table.style.width = '100%';

  // Thead
  const thead = document.createElement('thead');
  thead.innerHTML = `
    <tr>
      <th style="width:50%">PARAMETRY</th>
      <th style="width:25%; text-align:center;">
        CENA (MIESIĘCZNIE)
        <i class="bi bi-info-circle text-muted ms-1" data-bs-toggle="tooltip" title="${tooltip}"></i>
      </th>
      <th style="width:25%"></th>
    </tr>
  `;
  table.appendChild(thead);

  // Tbody
  const tbody = document.createElement('tbody');
  table.appendChild(tbody);

  return { table, tbodyEl: tbody };
}


/****************************************************************************************************
 * 1) IaaS
 ****************************************************************************************************/
function renderIaaS(category, container) {
  // Tworzymy sekcję
  const sec = createSection("Maszyny wirtualne (IaaS)");

  // Wewnątrz sekcji – tabela 3 kolumny
  const { table, tbodyEl } = createParamTable("Koszt miesięczny za parametry VM");
  sec.bodyContainer.appendChild(table);

  // Dodajemy wiersz z polami
  const tr = document.createElement('tr');
  tr.innerHTML = `
    <td>
      <div class="mb-2">
        <label>CPU (vCore):</label>
        <input type="range" id="cpuSlider" min="${category.sliders[0].min}" max="${category.sliders[0].max}"
               step="${category.sliders[0].step}" value="${category.sliders[0].min}" style="width:100px;">
        <span id="cpuVal">${category.sliders[0].min}</span>
      </div>
      <div class="mb-2">
        <label>RAM (GB):</label>
        <input type="range" id="ramSlider" min="${category.sliders[1].min}" max="${category.sliders[1].max}"
               step="${category.sliders[1].step}" value="${category.sliders[1].min}" style="width:100px;">
        <span id="ramVal">${category.sliders[1].min}</span>
      </div>
      <div class="mb-2">
        <label>SSD (GB):</label>
        <input type="range" id="ssdSlider" min="${category.sliders[2].min}" max="${category.sliders[2].max}"
               step="${category.sliders[2].step}" value="${category.sliders[2].min}" style="width:100px;">
        <span id="ssdVal">${category.sliders[2].min}</span>
      </div>
      <div class="mb-2">
        <label>Kopie zapasowe (GB):</label>
        <input type="number" id="backupGB" value="0" min="0" style="width:60px;">
      </div>
      <div class="mb-2">
        <label>Dodatkowe publiczne IP (szt.):</label>
        <input type="number" id="publicIp" value="0" min="0" style="width:60px;">
      </div>
    </td>
    <td style="text-align:center;">
      <strong><span id="iaasPrice">0.00</span> PLN</strong>
    </td>
    <td>
      <button class="btn btn-primary" id="btnAddIaas">Dodaj do wyceny</button>
    </td>
  `;
  tbodyEl.appendChild(tr);

  container.appendChild(sec.wrapper); // wstawiamy do #plansContainer

  // Logika
  const cpuSlider  = tr.querySelector('#cpuSlider');
  const ramSlider  = tr.querySelector('#ramSlider');
  const ssdSlider  = tr.querySelector('#ssdSlider');
  const backupGB   = tr.querySelector('#backupGB');
  const publicIp   = tr.querySelector('#publicIp');
  const priceEl    = tr.querySelector('#iaasPrice');

  function updateIaaSPrice(){
    let total=0;
    const cpuVal   = parseInt(cpuSlider.value,10);
    const ramVal   = parseInt(ramSlider.value,10);
    const ssdVal   = parseInt(ssdSlider.value,10);
    const backupVal= parseInt(backupGB.value,10)||0;
    const ipVal    = parseInt(publicIp.value,10)||0;

    total+= cpuVal*(category.sliders[0].pricePerUnit||0);
    total+= ramVal*(category.sliders[1].pricePerUnit||0);
    total+= ssdVal*(category.sliders[2].pricePerUnit||0);

    if(backupVal>0) total+= backupVal*(category.backupPricePerGB||0);
    if(ipVal>0)     total+= ipVal*(category.publicIPPrice||0);

    tr.querySelector('#cpuVal').textContent = cpuVal;
    tr.querySelector('#ramVal').textContent = ramVal;
    tr.querySelector('#ssdVal').textContent = ssdVal;
    priceEl.textContent = total.toFixed(2);
  }
  [cpuSlider, ramSlider, ssdSlider, backupGB, publicIp].forEach(el =>
    el.addEventListener('input', updateIaaSPrice)
  );
  updateIaaSPrice();

  tr.querySelector('#btnAddIaas').addEventListener('click',()=>{
    const total= parseFloat(priceEl.textContent)||0;
    const cpuVal   = parseInt(cpuSlider.value,10);
    const ramVal   = parseInt(ramSlider.value,10);
    const ssdVal   = parseInt(ssdSlider.value,10);
    const backupVal= parseInt(backupGB.value,10)||0;
    const ipVal    = parseInt(publicIp.value,10)||0;

    let desc= `CPU=${cpuVal}, RAM=${ramVal}GB, SSD=${ssdVal}GB`;
    if(backupVal>0) desc+= `, Backup=${backupVal}GB`;
    if(ipVal>0)     desc+= `, +${ipVal}xPublicIP`;

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
  const { table, tbodyEl } = createParamTable("Koszt licencji w rozliczeniu miesięcznym");
  sec.bodyContainer.appendChild(table);

  // Wiersz
  const tr = document.createElement('tr');
  tr.innerHTML=`
    <td>
      <label>Wybierz licencję:</label>
      <select id="msSelect" class="form-select" style="width:auto; min-width:150px; margin-left:8px;">
        <option value="" disabled selected>-- wybierz --</option>
      </select>
      <div class="mt-2">
        <label>Ilość:</label>
        <input type="number" id="msQty" value="1" min="1" style="width:60px; margin-left:8px;">
      </div>
    </td>
    <td style="text-align:center;">
      <strong><span id="msPrice">0.00</span> PLN</strong>
    </td>
    <td>
      <button class="btn btn-primary" id="btnAddMS">Dodaj do wyceny</button>
    </td>
  `;
  tbodyEl.appendChild(tr);
  container.appendChild(sec.wrapper);

  const msSelect  = tr.querySelector('#msSelect');
  const msQty     = tr.querySelector('#msQty');
  const msPriceEl = tr.querySelector('#msPrice');
  const btnAddMS  = tr.querySelector('#btnAddMS');

  // Wypełniamy
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
function renderPaaSMachinesSection(category, container) {
  const sec = createSection("Maszyny wirtualne (PaaS)");
  const { table, tbodyEl } = createParamTable("Koszt miesięczny instancji PaaS");
  sec.bodyContainer.appendChild(table);

  // Wiersz
  const tr= document.createElement('tr');
  tr.innerHTML=`
    <td>
      <div class="mb-2">
        <label>Wybierz instancję:</label>
        <select id="paasInst" class="form-select" style="width:auto; min-width:150px; margin-left:8px;">
          <option value="" disabled selected>-- wybierz --</option>
        </select>
        <div id="paasInstDesc" class="text-muted" style="font-size:0.85rem;"></div>
      </div>
      <div class="mb-2">
        <label>Wsparcie techniczne:</label>
        <select id="paasSupport" class="form-select" style="width:auto; min-width:150px; margin-left:8px;">
          <option value="" disabled selected>-- wybierz --</option>
          <option value="gold">C-SUPPORT-GOLD</option>
          <option value="platinum">C-SUPPORT-PLATINUM-AddON</option>
        </select>
        <div id="paasSupportDesc" class="text-muted" style="font-size:0.85rem;"></div>
      </div>
      <div class="mb-2">
        <label>Dysk SSD (GB):</label>
        <input type="number" id="paasSsd" value="0" min="0" style="width:60px; margin-left:8px;">
      </div>
      <div class="mb-2">
        <label>Kopie zapasowe (GB):</label>
        <input type="number" id="paasBackup" value="0" min="0" style="width:60px; margin-left:8px;">
      </div>
      <div class="mb-2">
        <label>Dodatkowe publiczne IP (szt.):</label>
        <input type="number" id="paasIp" value="0" min="0" style="width:60px; margin-left:8px;">
      </div>
    </td>
    <td style="text-align:center;">
      <strong><span id="paasPrice">0.00</span> PLN</strong>
    </td>
    <td>
      <button class="btn btn-primary" id="btnAddPaaS">Dodaj do wyceny</button>
    </td>
  `;
  tbodyEl.appendChild(tr);
  container.appendChild(sec.wrapper);

  // Logika
  const instSelect   = tr.querySelector('#paasInst');
  const instDescEl   = tr.querySelector('#paasInstDesc');
  const supportSel   = tr.querySelector('#paasSupport');
  const supportDescEl= tr.querySelector('#paasSupportDesc');
  const ssdInput     = tr.querySelector('#paasSsd');
  const backupInput  = tr.querySelector('#paasBackup');
  const ipInput      = tr.querySelector('#paasIp');
  const priceEl      = tr.querySelector('#paasPrice');
  const btnAdd       = tr.querySelector('#btnAddPaaS');

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

  function updateDesc(){
    if(!instSelect.value){
      instDescEl.textContent="";
      return;
    }
    const sel= instSelect.options[instSelect.selectedIndex];
    instDescEl.textContent= sel.getAttribute('data-desc')||"";
  }
  function updateSupportDesc(){
    if(supportSel.value==='gold'){
      supportDescEl.textContent= category.supportGoldDesc||"";
    } else if(supportSel.value==='platinum'){
      supportDescEl.textContent= (category.supportGoldDesc||"")+" "+(category.supportPlatinumDesc||"");
    } else {
      supportDescEl.textContent="";
    }
  }
  function updatePaaSPrice(){
    let total=0;
    const instVal = parseFloat(instSelect.value)||0;
    total+= instVal;

    if(supportSel.value==='gold'){
      total+=(category.supportGoldPrice||0);
    } else if(supportSel.value==='platinum'){
      total+=(category.supportGoldPrice||0);
      total+=(category.supportPlatinumAddOnPrice||0);
    }
    const ssdVal = parseInt(ssdInput.value,10)||0;
    total+= ssdVal*1; // 1 PLN/GB
    const backupVal= parseInt(backupInput.value,10)||0;
    if(backupVal>0) total+= backupVal*(category.backupPricePerGB||0);
    const ipVal= parseInt(ipInput.value,10)||0;
    if(ipVal>0) total+= ipVal*(category.publicIPPrice||0);

    priceEl.textContent= total.toFixed(2);
  }

  [instSelect, supportSel, ssdInput, backupInput, ipInput].forEach(el=>{
    el.addEventListener('change', ()=>{
      updateDesc();
      updateSupportDesc();
      updatePaaSPrice();
    });
    el.addEventListener('input', ()=>{
      updateDesc();
      updateSupportDesc();
      updatePaaSPrice();
    });
  });
  updateDesc();
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
    const sel= instSelect.options[instSelect.selectedIndex];
    const instLabel= sel.getAttribute('data-label')||"";
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
    if(ipVal>0)     desc+= `, +${ipVal}xPublicIP`;

    cart.push({
      name: "PaaS",
      details: desc,
      price: total
    });
    renderCart();
  });
}

function renderPaaSDisasterRecoverySection(category, container) {
  if(!category.drServices) return;

  const sec = createSection("Disaster Recovery (PaaS)");
  const { table, tbodyEl } = createParamTable("Koszt DR w rozliczeniu miesięcznym");
  sec.bodyContainer.appendChild(table);

  const storObj= category.drServices.find(x=>x.id==='C-DR-STORAGE');
  const ipObj  = category.drServices.find(x=>x.id==='C-DR-IP');

  const tr= document.createElement('tr');
  tr.innerHTML=`
    <td>
      <div class="mb-2">
        <label>${storObj?.label||'C-DR-STORAGE'} (GB):</label>
        <input type="number" id="drStorage" value="0" min="0" style="width:60px; margin-left:8px;">
      </div>
      <div class="mb-2">
        <label>${ipObj?.label||'C-DR-IP'} (szt.):</label>
        <input type="number" id="drIp" value="1" min="1" style="width:60px; margin-left:8px;">
      </div>
    </td>
    <td style="text-align:center;">
      <strong><span id="drPrice">0.00</span> PLN</strong>
    </td>
    <td>
      <button class="btn btn-primary" id="btnAddDR">Dodaj do wyceny</button>
    </td>
  `;
  tbodyEl.appendChild(tr);
  container.appendChild(sec.wrapper);

  const drStorage= tr.querySelector('#drStorage');
  const drIp     = tr.querySelector('#drIp');
  const drPriceEl= tr.querySelector('#drPrice');
  const btnAddDR = tr.querySelector('#btnAddDR');

  function updateDrPrice(){
    let total=0;
    const sVal= parseInt(drStorage.value,10)||0;
    const iVal= parseInt(drIp.value,10)||1;
    if(storObj) total+= sVal*(storObj.price||0);
    if(ipObj)   total+= iVal*(ipObj.price||0);
    drPriceEl.textContent= total.toFixed(2);
  }
  [drStorage, drIp].forEach(el => el.addEventListener('input', updateDrPrice));
  updateDrPrice();

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
function renderSaaSApplications(category, container){
  const sec = createSection("Aplikacje (SaaS)");
  const { table, tbodyEl } = createParamTable("Koszt miesięczny usług SaaS");
  sec.bodyContainer.appendChild(table);

  // 1) MsSQL
  renderSaaS_MsSQLRow(category, tbodyEl);
  // 2) Enova
  renderSaaS_EnovaRow(category, tbodyEl);
  // 3) Enova API
  renderSaaS_EnovaApiRow(category, tbodyEl);
  // 4) Terminal
  renderSaaS_TerminalRow(category, tbodyEl);
  // 5) Extra
  renderSaaS_ExtraDataRow(category, tbodyEl);

  container.appendChild(sec.wrapper);
}

function renderSaaS_MsSQLRow(category, tbodyEl){
  const tr= document.createElement('tr');
  tr.innerHTML=`
    <td>
      <label>Baza danych Microsoft SQL:</label>
      <select id="msSqlSelect" class="form-select" style="width:auto; min-width:150px; margin-left:8px;">
        <option value="" disabled selected>-- wybierz --</option>
      </select>
      <div id="msSqlDesc" class="text-muted" style="font-size:0.85rem;"></div>
    </td>
    <td style="text-align:center;">
      <strong><span id="msSqlPrice">0.00</span> PLN</strong>
    </td>
    <td>
      <button class="btn btn-primary" id="btnAddMsSql">Dodaj do wyceny</button>
    </td>
  `;
  tbodyEl.appendChild(tr);

  const msSqlSelect= tr.querySelector('#msSqlSelect');
  const msSqlDescEl= tr.querySelector('#msSqlDesc');
  const msSqlPriceEl= tr.querySelector('#msSqlPrice');
  const btnAddMsSql = tr.querySelector('#btnAddMsSql');

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

function renderSaaS_EnovaRow(category, tbodyEl){
  const tr= document.createElement('tr');
  tr.innerHTML=`
    <td>
      <label>Enova365Web:</label>
      <select id="enovaSelect" class="form-select" style="width:auto; min-width:150px; margin-left:8px;">
        <option value="" disabled selected>-- wybierz --</option>
      </select>
      <div id="enovaDesc" class="text-muted" style="font-size:0.85rem;"></div>
      <div class="form-check mt-2">
        <input class="form-check-input" type="checkbox" id="enovaHarm">
        <label class="form-check-label" for="enovaHarm">Harmonogram zadań</label>
      </div>
    </td>
    <td style="text-align:center;">
      <strong><span id="enovaPrice">0.00</span> PLN</strong>
    </td>
    <td>
      <button class="btn btn-primary" id="btnAddEnova">Dodaj do wyceny</button>
    </td>
  `;
  tbodyEl.appendChild(tr);

  const enovaSelect = tr.querySelector('#enovaSelect');
  const enovaDesc   = tr.querySelector('#enovaDesc');
  const enovaPrice  = tr.querySelector('#enovaPrice');
  const enovaHarm   = tr.querySelector('#enovaHarm');
  const btnAddEnova = tr.querySelector('#btnAddEnova');

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
    const sel   = enovaSelect.options[enovaSelect.selectedIndex];
    const label = sel.getAttribute('data-label')||"Enova365Web";
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

function renderSaaS_EnovaApiRow(category, tbodyEl){
  const tr= document.createElement('tr');
  tr.innerHTML=`
    <td>
      <label>Enova365Web API:</label>
      <select id="enovaApiSelect" class="form-select" style="width:auto; min-width:150px; margin-left:8px;">
        <option value="" disabled selected>-- wybierz --</option>
      </select>
      <div id="enovaApiDesc" class="text-muted" style="font-size:0.85rem;"></div>
    </td>
    <td style="text-align:center;">
      <strong><span id="enovaApiPrice">0.00</span> PLN</strong>
    </td>
    <td>
      <button class="btn btn-primary" id="btnAddEnovaApi">Dodaj do wyceny</button>
    </td>
  `;
  tbodyEl.appendChild(tr);

  const enovaApiSelect= tr.querySelector('#enovaApiSelect');
  const enovaApiDescEl= tr.querySelector('#enovaApiDesc');
  const enovaApiPriceEl= tr.querySelector('#enovaApiPrice');
  const btnAddEnovaApi = tr.querySelector('#btnAddEnovaApi');

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

function renderSaaS_TerminalRow(category, tbodyEl){
  const tr= document.createElement('tr');
  tr.innerHTML=`
    <td>
      <label>Terminal w chmurze:</label>
      <div class="mb-2" style="margin-left:8px;">
        <label>Użytkownicy:</label>
        <input type="number" id="termUsers" value="0" min="0" style="width:60px; margin-left:8px;">
      </div>
      <div class="form-check">
        <input class="form-check-input" type="checkbox" id="termSecurity">
        <label class="form-check-label" for="termSecurity">Zabezpieczenie terminala</label>
      </div>
    </td>
    <td style="text-align:center;">
      <strong><span id="termPrice">0.00</span> PLN</strong>
    </td>
    <td>
      <button class="btn btn-primary" id="btnAddTerm">Dodaj do wyceny</button>
    </td>
  `;
  tbodyEl.appendChild(tr);

  const termUsers   = tr.querySelector('#termUsers');
  const termSec     = tr.querySelector('#termSecurity');
  const termPriceEl = tr.querySelector('#termPrice');
  const btnAddTerm  = tr.querySelector('#btnAddTerm');

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
  [termUsers, termSec].forEach(el=> el.addEventListener('input', updateTermPrice));
  updateTermPrice();

  btnAddTerm.addEventListener('click',()=>{
    const users= parseInt(termUsers.value,10)||0;
    if(users<=0){
      alert("Podaj liczbę użytkowników terminala > 0!");
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

function renderSaaS_ExtraDataRow(category, tbodyEl){
  const tr= document.createElement('tr');
  tr.innerHTML=`
    <td>
      <label>Dodatkowe miejsce na dane (GB):</label>
      <input type="number" id="extraData" value="0" min="0" style="width:60px; margin-left:8px;">
    </td>
    <td style="text-align:center;">
      <strong><span id="extraPrice">0.00</span> PLN</strong>
    </td>
    <td>
      <button class="btn btn-primary" id="btnAddExtra">Dodaj do wyceny</button>
    </td>
  `;
  tbodyEl.appendChild(tr);

  const extraData= tr.querySelector('#extraData');
  const extraPriceEl= tr.querySelector('#extraPrice');
  const btnAddExtra= tr.querySelector('#btnAddExtra');

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
  const { table, tbodyEl } = createParamTable("Koszt miesięczny");
  sec.bodyContainer.appendChild(table);

  if(category.services && category.services.length){
    category.services.forEach(srv=>{
      const tr= document.createElement('tr');
      tr.innerHTML=`
        <td>${srv.label}</td>
        <td style="text-align:center;"><strong>${srv.price} PLN</strong></td>
        <td><button class="btn btn-primary btn-sm">Dodaj do wyceny</button></td>
      `;
      tbodyEl.appendChild(tr);

      tr.querySelector('button').addEventListener('click',()=>{
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
    tbodyEl.appendChild(tr);
  }
  container.appendChild(sec.wrapper);
}


/****************************************************************************************************
 * Microsoft CSP => "Microsoft 365"
 ****************************************************************************************************/
function renderMicrosoft365Section(category, container){
  const sec = createSection("Microsoft 365");
  const { table, tbodyEl } = createParamTable("Koszt miesięczny subskrypcji M365");
  sec.bodyContainer.appendChild(table);

  const tr= document.createElement('tr');
  tr.innerHTML=`
    <td>
      <label>Wybierz subskrypcję:</label>
      <select id="m365Select" class="form-select" style="width:auto; min-width:150px; margin-left:8px;">
        <option value="" disabled selected>-- wybierz --</option>
      </select>
      <div id="m365Desc" class="text-muted" style="font-size:0.85rem;"></div>
      <div class="mt-2">
        <label>Ilość:</label>
        <input type="number" id="m365Qty" value="1" min="1" style="width:60px; margin-left:8px;">
      </div>
    </td>
    <td style="text-align:center;">
      <strong><span id="m365Price">0.00</span> PLN</strong>
    </td>
    <td>
      <button class="btn btn-primary" id="btnAddM365">Dodaj do wyceny</button>
    </td>
  `;
  tbodyEl.appendChild(tr);
  container.appendChild(sec.wrapper);

  const m365Select= tr.querySelector('#m365Select');
  const m365Desc  = tr.querySelector('#m365Desc');
  const m365Qty   = tr.querySelector('#m365Qty');
  const m365PriceEl= tr.querySelector('#m365Price');
  const btnAddM365= tr.querySelector('#btnAddM365');

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
 * Bezpieczeństwo
 ****************************************************************************************************/
function renderSecurityWebAppsSection(category, container){
  const sec = createSection("Aplikacje webowe");
  const { table, tbodyEl } = createParamTable("Koszt miesięczny skanowania aplikacji");
  sec.bodyContainer.appendChild(table);

  const tr= document.createElement('tr');
  tr.innerHTML=`
    <td>
      <label>Wybierz usługę skanowania:</label>
      <select id="webAppSelect" class="form-select" style="width:auto; min-width:150px; margin-left:8px;">
        <option value="" disabled selected>-- wybierz --</option>
      </select>
      <div id="webAppDesc" class="text-muted" style="font-size:0.85rem;"></div>
    </td>
    <td style="text-align:center;">
      <strong><span id="webAppPrice">0.00</span> PLN</strong>
    </td>
    <td>
      <button class="btn btn-primary" id="btnAddWebApp">Dodaj do wyceny</button>
    </td>
  `;
  tbodyEl.appendChild(tr);
  container.appendChild(sec.wrapper);

  const webAppSelect  = tr.querySelector('#webAppSelect');
  const webAppDesc    = tr.querySelector('#webAppDesc');
  const webAppPriceEl = tr.querySelector('#webAppPrice');
  const btnAddWebApp  = tr.querySelector('#btnAddWebApp');

  if(category.securityWebApp){
    category.securityWebApp.forEach(srv=>{
      const o= document.createElement('option');
      o.value= srv.price;
      o.setAttribute('data-label', srv.label);
      o.setAttribute('data-desc', srv.desc||"");
      o.textContent= `${srv.label} (${srv.price} PLN)`;
      webAppSelect.appendChild(o);
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
      alert("Wybierz usługę skanowania!");
      return;
    }
    const sel  = webAppSelect.options[webAppSelect.selectedIndex];
    const label= sel.getAttribute('data-label')||"";
    const val  = parseFloat(sel.value)||0;
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
  const { table, tbodyEl } = createParamTable("Koszt miesięczny firewall");
  sec.bodyContainer.appendChild(table);

  const tr= document.createElement('tr');
  tr.innerHTML=`
    <td>
      <label>Wybierz usługę Firewalla:</label>
      <select id="fwSelect" class="form-select" style="width:auto; min-width:150px; margin-left:8px;">
        <option value="" disabled selected>-- wybierz --</option>
      </select>
      <div id="fwDesc" class="text-muted" style="font-size:0.85rem;"></div>
    </td>
    <td style="text-align:center;">
      <strong><span id="fwPrice">0.00</span> PLN</strong>
    </td>
    <td>
      <button class="btn btn-primary" id="btnAddFW">Dodaj do wyceny</button>
    </td>
  `;
  tbodyEl.appendChild(tr);
  container.appendChild(sec.wrapper);

  const fwSelect= tr.querySelector('#fwSelect');
  const fwDesc  = tr.querySelector('#fwDesc');
  const fwPriceEl= tr.querySelector('#fwPrice');
  const btnAddFW= tr.querySelector('#btnAddFW');

  if(category.securityFW){
    category.securityFW.forEach(srv=>{
      const o= document.createElement('option');
      o.value= srv.price;
      o.setAttribute('data-label', srv.label);
      o.setAttribute('data-desc', srv.desc||"");
      o.textContent= `${srv.label} (${srv.price} PLN)`;
      fwSelect.appendChild(o);
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
  fwSelect.addEventListener('change', ()=>{
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
  const { table, tbodyEl } = createParamTable("Koszt analizy w rozliczeniu miesięcznym");
  sec.bodyContainer.appendChild(table);

  const tr= document.createElement('tr');
  tr.innerHTML=`
    <td>
      <div class="mb-2">
        <label>Centralne logowanie (szt.):</label>
        <input type="number" id="centralLog" value="0" min="0" style="width:60px; margin-left:8px;">
      </div>
      <div class="mb-2">
        <label>Pamięć do centralnego logowania (GB):</label>
        <input type="number" id="memoryGB" value="0" min="0" style="width:60px; margin-left:8px;">
      </div>
    </td>
    <td style="text-align:center;">
      <strong><span id="analysisPrice">0.00</span> PLN</strong>
    </td>
    <td>
      <button class="btn btn-primary" id="btnAddAnalysis">Dodaj do wyceny</button>
    </td>
  `;
  tbodyEl.appendChild(tr);
  container.appendChild(sec.wrapper);

  const centralLog= tr.querySelector('#centralLog');
  const memoryGB = tr.querySelector('#memoryGB');
  const priceEl  = tr.querySelector('#analysisPrice');
  const btnAdd   = tr.querySelector('#btnAddAnalysis');

  function updateAnalysis(){
    let total=0;
    const logVal= parseInt(centralLog.value,10)||0;
    const memVal= parseInt(memoryGB.value,10)||0;
    if(logVal>0){
      // np. 20 PLN/szt log, 1 PLN/GB
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
      name: category.name+" (Analiza)",
      details: desc,
      price: total
    });
    renderCart();
  });
}


/****************************************************************************************************
 * KOSZYK
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
 * initTooltips – bootstrap
 ****************************************************************************************************/
function initTooltips() {
  const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
  tooltipTriggerList.map(el => new bootstrap.Tooltip(el));
}
