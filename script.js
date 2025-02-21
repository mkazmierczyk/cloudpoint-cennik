/***************************************************************************************************
 * script.js - Pełna wersja z "wodotryskami":
 *   - Każda kategoria (IaaS, PaaS, SaaS, Acronis, CSP, Bezpieczeństwo)
 *   - Sekcje .section-wrapper (niebieskie tło, zaokrąglenie)
 *   - Pasek "Parametry" / "Cena (MIESIĘCZNIE)" z tooltipem
 *   - Guzik "Dodaj do wyceny"
 *   - Koszyk (#cartTable) z możliwością usuwania pozycji
 *
 * Wymaga:
 *   - index.html z <table><tbody id="plansTableBody"></tbody></table> i #cartSection, #cartTable
 *   - style.css z definicjami .section-wrapper, .section-header-row
 *   - data.json z polami (IaaS, PaaS, SaaS, Acronis, CSP, Bezpieczeństwo)
 ***************************************************************************************************/

let categoriesData = [];
let cart = [];

/***************************************************************************************************
 * 1) Ładujemy data.json
 ***************************************************************************************************/
document.addEventListener('DOMContentLoaded', () => {
  fetch('data.json')
    .then(res => res.json())
    .then(data => {
      categoriesData = data.categories;
      renderCategoriesMenu(categoriesData);
    })
    .catch(err => console.error("Błąd wczytywania data.json:", err));
});


/***************************************************************************************************
 * 2) renderCategoriesMenu - tworzy listę linków w #categoriesMenu
 ***************************************************************************************************/
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


/***************************************************************************************************
 * 3) selectCategory - dispatcher
 ***************************************************************************************************/
function selectCategory(catIndex) {
  const category = categoriesData[catIndex];

  const titleEl      = document.getElementById('categoryTitle');
  const descEl       = document.getElementById('categoryDesc');
  const plansWrapper = document.getElementById('plansTableWrapper');
  const plansBody    = document.getElementById('plansTableBody'); // <tbody id="plansTableBody">

  titleEl.textContent = category.name;
  descEl.textContent  = `Opcje dostępne w kategorii: ${category.name}.`;
  plansWrapper.style.display = 'block';
  plansBody.innerHTML = ''; // czyścimy poprzednie sekcje

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


/***************************************************************************************************
 * 4) IaaS
 ***************************************************************************************************/
function renderIaaS(category, plansBody) {
  // Tworzymy sekcję .section-wrapper w <tr><td colSpan="3">
  const row = document.createElement('tr');
  const col = document.createElement('td');
  col.colSpan=3;

  const secDiv= document.createElement('div');
  secDiv.classList.add('section-wrapper');

  // Tytuł
  const h5= document.createElement('h5');
  h5.textContent= "Maszyny wirtualne (IaaS)";
  secDiv.appendChild(h5);

  // Pasek parametry/cena
  const headerRow= document.createElement('div');
  headerRow.classList.add('section-header-row');
  headerRow.innerHTML=`
    <div>Parametry</div>
    <div>Cena (MIESIĘCZNIE)
      <i class="bi bi-info-circle text-muted ms-1" data-bs-toggle="tooltip"
         title="Koszt miesięczny za wybrane parametry."></i>
    </div>
  `;
  secDiv.appendChild(headerRow);

  // Content
  const contentDiv= document.createElement('div');
  contentDiv.innerHTML=`
    <div class="mb-2">
      <label>CPU (vCore): <span id="cpuVal">1</span></label>
      <input type="range" id="cpuSlider"
             min="${category.sliders[0].min}" max="${category.sliders[0].max}"
             step="${category.sliders[0].step}" value="${category.sliders[0].min}" style="width:150px;">
    </div>
    <div class="mb-2">
      <label>RAM (GB): <span id="ramVal">${category.sliders[1].min}</span></label>
      <input type="range" id="ramSlider"
             min="${category.sliders[1].min}" max="${category.sliders[1].max}"
             step="${category.sliders[1].step}" value="${category.sliders[1].min}" style="width:150px;">
    </div>
    <div class="mb-2">
      <label>SSD (GB): <span id="ssdVal">${category.sliders[2].min}</span></label>
      <input type="range" id="ssdSlider"
             min="${category.sliders[2].min}" max="${category.sliders[2].max}"
             step="${category.sliders[2].step}" value="${category.sliders[2].min}" style="width:150px;">
    </div>

    <div class="mb-2">
      <label>Kopie zapasowe (GB):
        <i class="bi bi-info-circle text-muted ms-1" data-bs-toggle="tooltip"
           title="Rozmiar kopii zależny od wielkości VM."></i>
      </label>
      <input type="number" id="backupGB" min="0" value="0" style="width:80px;" class="form-control d-inline-block">
    </div>

    <div class="form-check mb-2">
      <input class="form-check-input" type="checkbox" id="publicIP">
      <label class="form-check-label" for="publicIP">
        Dodatkowe publiczne IP
      </label>
    </div>

    <div class="d-flex align-items-center">
      <strong class="me-3"><span id="iaasPrice">0.00</span> PLN</strong>
      <button class="btn btn-primary" id="btnAddIaas">Dodaj do wyceny</button>
    </div>
  `;
  secDiv.appendChild(contentDiv);

  col.appendChild(secDiv);
  row.appendChild(col);
  plansBody.appendChild(row);

  // Logika
  const cpuSlider   = contentDiv.querySelector('#cpuSlider');
  const ramSlider   = contentDiv.querySelector('#ramSlider');
  const ssdSlider   = contentDiv.querySelector('#ssdSlider');
  const backupInput = contentDiv.querySelector('#backupGB');
  const publicIP    = contentDiv.querySelector('#publicIP');
  const priceEl     = contentDiv.querySelector('#iaasPrice');

  function updateIaaSPrice(){
    let total=0;
    const cpuVal= parseInt(cpuSlider.value,10);
    const ramVal= parseInt(ramSlider.value,10);
    const ssdVal= parseInt(ssdSlider.value,10);
    const backupVal= parseFloat(backupInput.value)||0;

    total+= cpuVal*(category.sliders[0].pricePerUnit||0);
    total+= ramVal*(category.sliders[1].pricePerUnit||0);
    total+= ssdVal*(category.sliders[2].pricePerUnit||0);
    if(backupVal>0) total+= backupVal*(category.backupPricePerGB||0);
    if(publicIP.checked) total+= (category.publicIPPrice||0);

    contentDiv.querySelector('#cpuVal').textContent= cpuVal;
    contentDiv.querySelector('#ramVal').textContent= ramVal;
    contentDiv.querySelector('#ssdVal').textContent= ssdVal;
    priceEl.textContent= total.toFixed(2);
  }
  [cpuSlider, ramSlider, ssdSlider, backupInput].forEach(el =>
    el.addEventListener('input', updateIaaSPrice));
  publicIP.addEventListener('change', updateIaaSPrice);
  updateIaaSPrice();

  const btnAddIaas= contentDiv.querySelector('#btnAddIaas');
  btnAddIaas.addEventListener('click',()=>{
    const total= parseFloat(priceEl.textContent)||0;
    const cpuVal= parseInt(cpuSlider.value,10);
    const ramVal= parseInt(ramSlider.value,10);
    const ssdVal= parseInt(ssdSlider.value,10);
    const backupVal= parseFloat(backupInput.value)||0;
    const ipCheck= publicIP.checked;

    let desc= `CPU=${cpuVal}, RAM=${ramVal}GB, SSD=${ssdVal}GB`;
    if(backupVal>0) desc+= `, Backup=${backupVal}GB`;
    if(ipCheck) desc+= `, +PublicIP`;

    cart.push({
      name: "IaaS",
      details: desc,
      price: total
    });
    renderCart();
  });
}


/***************************************************************************************************
 * MsLicSection (IaaS/PaaS/SaaS) - sekcja "Licencje Microsoft"
 ***************************************************************************************************/
function renderMsLicSection(category, plansBody) {
  if(!category.msSplaServices) return;
  
  // .section-wrapper ...
  const row = document.createElement('tr');
  const col = document.createElement('td');
  col.colSpan=3;

  const secDiv= document.createElement('div');
  secDiv.classList.add('section-wrapper');

  const h5= document.createElement('h5');
  h5.textContent= "Licencje Microsoft";
  secDiv.appendChild(h5);

  const headerRow= document.createElement('div');
  headerRow.classList.add('section-header-row');
  headerRow.innerHTML=`
    <div>Parametry</div>
    <div>Cena (MIESIĘCZNIE)
      <i class="bi bi-info-circle text-muted ms-1" data-bs-toggle="tooltip"
         title="Koszt licencji w rozliczeniu miesięcznym."></i>
    </div>
  `;
  secDiv.appendChild(headerRow);

  const contentDiv= document.createElement('div');
  contentDiv.innerHTML=`
    <div class="mb-2">
      <label class="me-2">Wybierz licencję:</label>
      <select id="msSelect" class="form-select d-inline-block" style="width:auto; min-width:200px;">
        <option value="" disabled selected>-- wybierz --</option>
      </select>
      <label class="ms-3 me-2">Ilość:</label>
      <input type="number" value="1" min="1" id="msQty"
             style="width:60px;" class="form-control d-inline-block">
    </div>
    <div class="d-flex align-items-center">
      <strong class="me-3"><span id="msPrice">0.00</span> PLN</strong>
      <button class="btn btn-primary" id="btnAddMS">Dodaj do wyceny</button>
    </div>
  `;
  secDiv.appendChild(contentDiv);

  col.appendChild(secDiv);
  row.appendChild(col);
  plansBody.appendChild(row);

  // wypełniamy
  const msSelect = contentDiv.querySelector('#msSelect');
  const msQty    = contentDiv.querySelector('#msQty');
  const msPriceEl= contentDiv.querySelector('#msPrice');
  const btnAddMS = contentDiv.querySelector('#btnAddMS');

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
    const p= parseFloat(msSelect.value)||0;
    const q= parseInt(msQty.value,10)||1;
    msPriceEl.textContent= (p*q).toFixed(2);
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
    const qty= parseInt(msQty.value,10)||1;
    const total= price*qty;

    cart.push({
      name: category.name + " (Licencje MS)",
      details: `${label} x${qty}`,
      price: total
    });
    renderCart();
  });
}


/***************************************************************************************************
 * 5) PaaS - Machines + DR
 ***************************************************************************************************/
function renderPaaSMachinesSection(category, plansBody){
  const row= document.createElement('tr');
  const col= document.createElement('td');
  col.colSpan=3;

  const secDiv= document.createElement('div');
  secDiv.classList.add('section-wrapper');

  const h5= document.createElement('h5');
  h5.textContent= "Maszyny wirtualne (PaaS)";
  secDiv.appendChild(h5);

  const headerRow= document.createElement('div');
  headerRow.classList.add('section-header-row');
  headerRow.innerHTML=`
    <div>Parametry</div>
    <div>Cena (MIESIĘCZNIE)
      <i class="bi bi-info-circle text-muted ms-1"
         title="Koszt miesięczny instancji PaaS."
         data-bs-toggle="tooltip"></i>
    </div>
  `;
  secDiv.appendChild(headerRow);

  const contentDiv= document.createElement('div');
  contentDiv.innerHTML=`
    <div class="mb-2">
      <label class="me-2">Wybierz instancję:</label>
      <select id="paasInstSelect" class="form-select d-inline-block" style="width:auto; min-width:150px;">
        <option value="" disabled selected>-- wybierz --</option>
      </select>
      <div id="paasInstDesc" class="text-muted mt-1" style="font-size:0.85rem;"></div>
    </div>
    <div class="mb-2">
      <label class="me-2">Wsparcie techniczne:</label>
      <select id="paasSupportSelect" class="form-select d-inline-block" style="width:auto; min-width:200px;">
        <option value="" disabled selected>-- wybierz --</option>
        <option value="gold">C-SUPPORT-GOLD</option>
        <option value="platinum">C-SUPPORT-PLATINUM-AddON</option>
      </select>
      <div id="paasSupportDesc" class="text-muted mt-1" style="font-size:0.85rem;"></div>
    </div>
    <div class="mb-2">
      <label class="me-2">Dysk SSD (GB):</label>
      <input type="number" id="paasSsdGB" min="0" value="0" style="width:80px;" class="form-control d-inline-block">
    </div>
    <div class="mb-2">
      <label class="me-2">
        Kopie zapasowe (GB)
        <i class="bi bi-info-circle text-muted ms-1" data-bs-toggle="tooltip"
           title="Rozmiar kopii zależny od wielkości instancji."></i>
      </label>
      <input type="number" id="paasBackupGB" min="0" value="0" style="width:80px;" class="form-control d-inline-block">
    </div>
    <div class="form-check mb-2">
      <input class="form-check-input" type="checkbox" id="paasPublicIP">
      <label class="form-check-label" for="paasPublicIP">
        Dodatkowe publiczne IP
      </label>
    </div>

    <div class="d-flex align-items-center">
      <strong class="me-3"><span id="paasPrice">0.00</span> PLN</strong>
      <button class="btn btn-primary" id="btnAddPaaS">Dodaj do wyceny</button>
    </div>
  `;
  secDiv.appendChild(contentDiv);

  col.appendChild(secDiv);
  row.appendChild(col);
  plansBody.appendChild(row);

  // logika
  const instSelect   = contentDiv.querySelector('#paasInstSelect');
  const instDescEl   = contentDiv.querySelector('#paasInstDesc');
  const supportSelect= contentDiv.querySelector('#paasSupportSelect');
  const supportDescEl= contentDiv.querySelector('#paasSupportDesc');
  const ssdInput     = contentDiv.querySelector('#paasSsdGB');
  const backupInput  = contentDiv.querySelector('#paasBackupGB');
  const ipCheck      = contentDiv.querySelector('#paasPublicIP');
  const priceEl      = contentDiv.querySelector('#paasPrice');
  const btnAdd       = contentDiv.querySelector('#btnAddPaaS');

  if(category.paasInstances){
    category.paasInstances.forEach(inst=>{
      const o= document.createElement('option');
      o.value= inst.price;
      o.setAttribute('data-label', inst.label);
      o.setAttribute('data-desc', inst.desc||"");
      o.textContent= `${inst.label} (${inst.price} PLN)`;
      instSelect.appendChild(o);
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
    if(supportSelect.value==='gold'){
      supportDescEl.textContent= category.supportGoldDesc||"";
    } else if(supportSelect.value==='platinum'){
      supportDescEl.textContent= (category.supportGoldDesc||"")+" "+(category.supportPlatinumDesc||"");
    } else {
      supportDescEl.textContent="";
    }
  }
  function updatePaaSPrice(){
    let total=0;
    const instPrice= parseFloat(instSelect.value)||0;
    total+= instPrice;

    if(supportSelect.value==='gold'){
      total+= (category.supportGoldPrice||0);
    } else if(supportSelect.value==='platinum'){
      total+= (category.supportGoldPrice||0);
      total+= (category.supportPlatinumAddOnPrice||0);
    }
    const ssdVal= parseFloat(ssdInput.value)||0;
    // 1 PLN/GB
    total+= ssdVal*1.0;
    const backupVal= parseFloat(backupInput.value)||0;
    if(backupVal>0){
      total+= backupVal*(category.backupPricePerGB||0);
    }
    if(ipCheck.checked){
      total+= (category.publicIPPrice||0);
    }
    priceEl.textContent= total.toFixed(2);
  }

  instSelect.addEventListener('change',()=>{
    updateInstDesc();
    updatePaaSPrice();
  });
  supportSelect.addEventListener('change',()=>{
    updateSupportDesc();
    updatePaaSPrice();
  });
  ssdInput.addEventListener('input', updatePaaSPrice);
  backupInput.addEventListener('input', updatePaaSPrice);
  ipCheck.addEventListener('change', updatePaaSPrice);

  updateInstDesc();
  updateSupportDesc();
  updatePaaSPrice();

  btnAdd.addEventListener('click',()=>{
    if(!instSelect.value){
      alert("Musisz wybrać instancję PaaS!");
      return;
    }
    if(!supportSelect.value){
      alert("Musisz wybrać co najmniej C-SUPPORT-GOLD!");
      return;
    }
    const total= parseFloat(priceEl.textContent)||0;
    const selInst= instSelect.options[instSelect.selectedIndex];
    const instLabel= selInst.getAttribute('data-label')||"";
    let supText="";
    if(supportSelect.value==='gold'){
      supText="C-SUPPORT-GOLD";
    } else if(supportSelect.value==='platinum'){
      supText="C-SUPPORT-GOLD + PLATINUM-AddON";
    }
    const ssdVal= parseFloat(ssdInput.value)||0;
    const backupVal= parseFloat(backupInput.value)||0;
    const ipChecked= ipCheck.checked;

    let desc= `Instancja=${instLabel}, Wsparcie=${supText}`;
    if(ssdVal>0) desc+= `, SSD=${ssdVal}GB`;
    if(backupVal>0) desc+= `, Backup=${backupVal}GB`;
    if(ipChecked) desc+= `, +PublicIP`;

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
  
  const row= document.createElement('tr');
  const col= document.createElement('td');
  col.colSpan=3;

  const secDiv= document.createElement('div');
  secDiv.classList.add('section-wrapper');

  const h5= document.createElement('h5');
  h5.textContent= "Disaster Recovery (PaaS)";
  secDiv.appendChild(h5);

  const headerRow= document.createElement('div');
  headerRow.classList.add('section-header-row');
  headerRow.innerHTML=`
    <div>Parametry</div>
    <div>Cena (MIESIĘCZNIE)
      <i class="bi bi-info-circle text-muted ms-1" data-bs-toggle="tooltip"
         title="Koszt DR w rozliczeniu miesięcznym."></i>
    </div>
  `;
  secDiv.appendChild(headerRow);

  const contentDiv= document.createElement('div');
  const storObj= category.drServices.find(x=>x.id==='C-DR-STORAGE');
  const ipObj  = category.drServices.find(x=>x.id==='C-DR-IP');
  contentDiv.innerHTML=`
    <div class="mb-2">
      <label>${storObj?.label||'C-DR-STORAGE'} (GB)
        <i class="bi bi-info-circle text-muted ms-1" data-bs-toggle="tooltip"
           title="${storObj?.tooltip||''}"></i>
      </label>
      <input type="number" id="drStorage" min="0" value="0" style="width:80px;"
             class="form-control d-inline-block">
    </div>
    <div class="mb-2">
      <label>${ipObj?.label||'C-DR-IP'} (szt.)
        <i class="bi bi-info-circle text-muted ms-1" data-bs-toggle="tooltip"
           title="${ipObj?.tooltip||''}"></i>
      </label>
      <input type="number" id="drIp" min="1" value="1" style="width:80px;"
             class="form-control d-inline-block">
    </div>
    <div class="d-flex align-items-center">
      <strong class="me-3"><span id="drPrice">0.00</span> PLN</strong>
      <button class="btn btn-primary" id="btnAddDR">Dodaj do wyceny</button>
    </div>
  `;
  secDiv.appendChild(contentDiv);

  col.appendChild(secDiv);
  row.appendChild(col);
  plansBody.appendChild(row);

  const drStorage= contentDiv.querySelector('#drStorage');
  const drIp     = contentDiv.querySelector('#drIp');
  const drPriceEl= contentDiv.querySelector('#drPrice');
  const btnAddDR = contentDiv.querySelector('#btnAddDR');

  function updateDrPrice(){
    let total=0;
    const sVal= parseFloat(drStorage.value)||0;
    const iVal= parseFloat(drIp.value)||1;
    if(storObj) total+= sVal*(storObj.price||0);
    if(ipObj)   total+= iVal*(ipObj.price||0);
    drPriceEl.textContent= total.toFixed(2);
  }
  drStorage.addEventListener('input', updateDrPrice);
  drIp.addEventListener('input', updateDrPrice);
  updateDrPrice();

  btnAddDR.addEventListener('click',()=>{
    const sVal= parseFloat(drStorage.value)||0;
    const iVal= parseFloat(drIp.value)||1;
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


/***************************************************************************************************
 * 6) SaaS - Aplikacje (MsSQL, Enova, API, Terminal, Extra) 
 ***************************************************************************************************/
function renderSaaSApplications(category, plansBody){
  const row= document.createElement('tr');
  const col= document.createElement('td');
  col.colSpan=3;

  const secDiv= document.createElement('div');
  secDiv.classList.add('section-wrapper');

  const h5= document.createElement('h5');
  h5.textContent= "Aplikacje (SaaS)";
  secDiv.appendChild(h5);

  const headerRow= document.createElement('div');
  headerRow.classList.add('section-header-row');
  headerRow.innerHTML=`
    <div>Parametry</div>
    <div>Cena (MIESIĘCZNIE)
      <i class="bi bi-info-circle text-muted ms-1" data-bs-toggle="tooltip"
         title="Koszt miesięczny usług SaaS."></i>
    </div>
  `;
  secDiv.appendChild(headerRow);

  // wstawiamy kolejno MsSQL, Enova, Enova API, Terminal, Extra
  const contentDiv= document.createElement('div');
  // MsSQL
  contentDiv.appendChild(renderSaaS_MsSQLRow(category));
  // Enova
  contentDiv.appendChild(renderSaaS_EnovaRow(category));
  // Enova API
  contentDiv.appendChild(renderSaaS_EnovaApiRow(category));
  // Terminal
  contentDiv.appendChild(renderSaaS_TerminalRow(category));
  // Extra
  contentDiv.appendChild(renderSaaS_ExtraDataRow(category));

  secDiv.appendChild(contentDiv);

  col.appendChild(secDiv);
  row.appendChild(col);
  plansBody.appendChild(row);
}

/** MsSQL (SaaS) */
function renderSaaS_MsSQLRow(category){
  const div= document.createElement('div');
  div.classList.add('mb-3');
  div.innerHTML=`
    <label class="d-block mb-1">Baza danych Microsoft SQL:</label>
    <select id="msSqlSelect" class="form-select d-inline-block" style="width:auto; min-width:200px;">
      <option value="" disabled selected>-- wybierz --</option>
    </select>
    <div id="msSqlDesc" class="text-muted" style="font-size:0.85rem; margin-top:4px;"></div>

    <div class="d-flex align-items-center mt-2">
      <strong class="me-3"><span id="msSqlPrice">0.00</span> PLN</strong>
      <button class="btn btn-primary" id="btnAddMsSql">Dodaj do wyceny</button>
    </div>
  `;
  const msSqlSelect= div.querySelector('#msSqlSelect');
  const msSqlDescEl= div.querySelector('#msSqlDesc');
  const msSqlPriceEl= div.querySelector('#msSqlPrice');
  const btnAddMsSql= div.querySelector('#btnAddMsSql');

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

  function updateMsSqlPrice(){
    const val= parseFloat(msSqlSelect.value)||0;
    msSqlPriceEl.textContent= val.toFixed(2);
  }
  function updateMsSqlDesc(){
    if(!msSqlSelect.value){
      msSqlDescEl.textContent="";
      return;
    }
    const sel= msSqlSelect.options[msSqlSelect.selectedIndex];
    msSqlDescEl.textContent= sel.getAttribute('data-desc')||"";
  }
  msSqlSelect.addEventListener('change',()=>{
    updateMsSqlPrice();
    updateMsSqlDesc();
  });
  updateMsSqlPrice();
  updateMsSqlDesc();

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
  return div;
}

/** Enova (SaaS) */
function renderSaaS_EnovaRow(category){
  const div= document.createElement('div');
  div.classList.add('mb-3');
  div.innerHTML=`
    <label class="d-block mb-1">Enova365Web:</label>
    <select id="enovaSelect" class="form-select d-inline-block" style="width:auto; min-width:200px;">
      <option value="" disabled selected>-- wybierz --</option>
    </select>
    <div id="enovaDesc" class="text-muted" style="font-size:0.85rem; margin-top:4px;"></div>

    <div class="form-check mt-2">
      <input class="form-check-input" type="checkbox" id="enovaHarmonogram">
      <label class="form-check-label" for="enovaHarmonogram">Harmonogram zadań</label>
    </div>

    <div class="d-flex align-items-center mt-2">
      <strong class="me-3"><span id="enovaPrice">0.00</span> PLN</strong>
      <button class="btn btn-primary" id="btnAddEnova">Dodaj do wyceny</button>
    </div>
  `;
  const enovaSelect      = div.querySelector('#enovaSelect');
  const enovaDescEl      = div.querySelector('#enovaDesc');
  const enovaPriceEl     = div.querySelector('#enovaPrice');
  const enovaHarmonogram = div.querySelector('#enovaHarmonogram');
  const btnAddEnova      = div.querySelector('#btnAddEnova');

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

  function updateEnovaPrice(){
    let total= parseFloat(enovaSelect.value)||0;
    if(enovaHarmonogram.checked){
      total+= (category.harmonogramCost||10);
    }
    enovaPriceEl.textContent= total.toFixed(2);
  }
  function updateEnovaDesc(){
    if(!enovaSelect.value){
      enovaDescEl.textContent="";
      return;
    }
    const sel= enovaSelect.options[enovaSelect.selectedIndex];
    enovaDescEl.textContent= sel.getAttribute('data-desc')||"";
  }
  enovaSelect.addEventListener('change',()=>{
    updateEnovaPrice();
    updateEnovaDesc();
  });
  enovaHarmonogram.addEventListener('change', updateEnovaPrice);
  updateEnovaPrice();
  updateEnovaDesc();

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

  return div;
}

/** Enova API (SaaS) */
function renderSaaS_EnovaApiRow(category){
  const div= document.createElement('div');
  div.classList.add('mb-3');
  div.innerHTML=`
    <label class="d-block mb-1">Enova365Web API:</label>
    <select id="enovaApiSelect" class="form-select d-inline-block" style="width:auto; min-width:200px;">
      <option value="" disabled selected>-- wybierz --</option>
    </select>
    <div id="enovaApiDesc" class="text-muted" style="font-size:0.85rem; margin-top:4px;"></div>

    <div class="d-flex align-items-center mt-2">
      <strong class="me-3"><span id="enovaApiPrice">0.00</span> PLN</strong>
      <button class="btn btn-primary" id="btnAddEnovaApi">Dodaj do wyceny</button>
    </div>
  `;
  const enovaApiSelect= div.querySelector('#enovaApiSelect');
  const enovaApiDescEl= div.querySelector('#enovaApiDesc');
  const enovaApiPriceEl= div.querySelector('#enovaApiPrice');
  const btnAddEnovaApi= div.querySelector('#btnAddEnovaApi');

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
  function updateApiPrice(){
    const val= parseFloat(enovaApiSelect.value)||0;
    enovaApiPriceEl.textContent= val.toFixed(2);
  }
  function updateApiDesc(){
    if(!enovaApiSelect.value){
      enovaApiDescEl.textContent="";
      return;
    }
    const sel= enovaApiSelect.options[enovaApiSelect.selectedIndex];
    enovaApiDescEl.textContent= sel.getAttribute('data-desc')||"";
  }
  enovaApiSelect.addEventListener('change',()=>{
    updateApiPrice();
    updateApiDesc();
  });
  updateApiPrice();
  updateApiDesc();

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

  return div;
}

/** Terminal w chmurze (SaaS) */
function renderSaaS_TerminalRow(category){
  const div= document.createElement('div');
  div.classList.add('mb-3');
  div.innerHTML=`
    <label class="d-block mb-1">Terminal w chmurze:</label>
    <div class="mb-2">
      <input type="number" id="terminalUsers" min="0" value="0"
             style="width:80px;" class="form-control d-inline-block me-2">
      <label class="form-check-label">użytkownicy</label>
    </div>
    <div class="form-check mb-2">
      <input class="form-check-input" type="checkbox" id="terminalSecurity">
      <label class="form-check-label" for="terminalSecurity">
        Zabezpieczenie terminala
      </label>
    </div>
    <div class="d-flex align-items-center">
      <strong class="me-3"><span id="terminalPrice">0.00</span> PLN</strong>
      <button class="btn btn-primary" id="btnAddTerminal">Dodaj do wyceny</button>
    </div>
  `;
  const terminalUsers= div.querySelector('#terminalUsers');
  const terminalSecurity= div.querySelector('#terminalSecurity');
  const terminalPriceEl= div.querySelector('#terminalPrice');
  const btnAddTerminal= div.querySelector('#btnAddTerminal');

  function updateTerminalPrice(){
    let total=0;
    const users= parseInt(terminalUsers.value,10)||0;
    if(users>0){
      total+= users*(category.terminalPricePerUser||30);
      if(terminalSecurity.checked){
        total+= (category.terminalSecurityCost||20);
      }
    }
    terminalPriceEl.textContent= total.toFixed(2);
  }
  [terminalUsers, terminalSecurity].forEach(el =>
    el.addEventListener('input', updateTerminalPrice));
  updateTerminalPrice();

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

  return div;
}

/** Dodatkowe miejsce (SaaS) */
function renderSaaS_ExtraDataRow(category){
  const div= document.createElement('div');
  div.classList.add('mb-3');
  div.innerHTML=`
    <label class="d-block mb-1">Dodatkowe miejsce na dane (GB):</label>
    <input type="number" id="extraDataInput" min="0" value="0"
           style="width:80px;" class="form-control d-inline-block me-2">
    <div class="d-flex align-items-center mt-2">
      <strong class="me-3"><span id="extraDataPrice">0.00</span> PLN</strong>
      <button class="btn btn-primary" id="btnAddExtraData">Dodaj do wyceny</button>
    </div>
  `;
  const extraDataInput   = div.querySelector('#extraDataInput');
  const extraDataPriceEl = div.querySelector('#extraDataPrice');
  const btnAddExtraData  = div.querySelector('#btnAddExtraData');

  function updateExtraDataPrice(){
    const val= parseInt(extraDataInput.value,10)||0;
    let cost= val*(category.extraDataStoragePrice||2);
    extraDataPriceEl.textContent= cost.toFixed(2);
  }
  extraDataInput.addEventListener('input', updateExtraDataPrice);
  updateExtraDataPrice();

  btnAddExtraData.addEventListener('click',()=>{
    const val= parseInt(extraDataInput.value,10)||0;
    if(val<=0){
      alert("Podaj liczbę > 0!");
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

  return div;
}


/***************************************************************************************************
 * 7) Acronis / fallback => renderServicesList
 ***************************************************************************************************/
function renderServicesList(category, plansBody){
  const row= document.createElement('tr');
  const col= document.createElement('td');
  col.colSpan=3;

  const secDiv= document.createElement('div');
  secDiv.classList.add('section-wrapper');

  const h5= document.createElement('h5');
  h5.textContent= category.name;
  secDiv.appendChild(h5);

  const headerRow= document.createElement('div');
  headerRow.classList.add('section-header-row');
  headerRow.innerHTML=`
    <div>Parametry</div>
    <div>Cena (MIESIĘCZNIE)
      <i class="bi bi-info-circle text-muted ms-1" data-bs-toggle="tooltip"
         title="Koszt miesięczny."></i>
    </div>
  `;
  secDiv.appendChild(headerRow);

  const contentDiv= document.createElement('div');
  if(category.services && category.services.length){
    category.services.forEach(srv=>{
      const itemDiv= document.createElement('div');
      itemDiv.classList.add('d-flex','justify-content-between','align-items-center','mb-2');
      itemDiv.innerHTML=`
        <div>${srv.label}</div>
        <div class="d-flex align-items-center">
          <strong class="me-3">${srv.price} PLN</strong>
          <button class="btn btn-primary btn-sm">Dodaj do wyceny</button>
        </div>
      `;
      const btn= itemDiv.querySelector('button');
      btn.addEventListener('click',()=>{
        cart.push({
          name: category.name,
          details: srv.label,
          price: srv.price
        });
        renderCart();
      });
      contentDiv.appendChild(itemDiv);
    });
  } else {
    contentDiv.innerHTML=`<div class="text-muted">Brak usług w tej kategorii.</div>`;
  }
  secDiv.appendChild(contentDiv);

  col.appendChild(secDiv);
  row.appendChild(col);
  plansBody.appendChild(row);
}


/***************************************************************************************************
 * 8) Microsoft CSP => "Microsoft 365"
 ***************************************************************************************************/
function renderMicrosoft365Section(category, plansBody){
  const row= document.createElement('tr');
  const col= document.createElement('td');
  col.colSpan=3;

  const secDiv= document.createElement('div');
  secDiv.classList.add('section-wrapper');

  const h5= document.createElement('h5');
  h5.textContent= "Microsoft 365";
  secDiv.appendChild(h5);

  const headerRow= document.createElement('div');
  headerRow.classList.add('section-header-row');
  headerRow.innerHTML=`
    <div>Parametry</div>
    <div>Cena (MIESIĘCZNIE)
      <i class="bi bi-info-circle text-muted ms-1" data-bs-toggle="tooltip"
         title="Koszt miesięczny subskrypcji M365."></i>
    </div>
  `;
  secDiv.appendChild(headerRow);

  const contentDiv= document.createElement('div');
  contentDiv.innerHTML=`
    <div class="mb-2">
      <label class="me-2">Wybierz subskrypcję:</label>
      <select id="m365Select" class="form-select d-inline-block" style="width:auto; min-width:200px;">
        <option value="" disabled selected>-- wybierz --</option>
      </select>
      <div id="m365Desc" class="text-muted mt-1" style="font-size:0.85rem;"></div>

      <label class="ms-3 me-2">Ilość:</label>
      <input type="number" id="m365Qty" value="1" min="1"
             style="width:60px;" class="form-control d-inline-block">
    </div>
    <div class="d-flex align-items-center">
      <strong class="me-3"><span id="m365Price">0.00</span> PLN</strong>
      <button class="btn btn-primary" id="btnAddM365">Dodaj do wyceny</button>
    </div>
  `;
  secDiv.appendChild(contentDiv);

  col.appendChild(secDiv);
  row.appendChild(col);
  plansBody.appendChild(row);

  // logika
  const m365Select= contentDiv.querySelector('#m365Select');
  const m365Desc  = contentDiv.querySelector('#m365Desc');
  const m365Qty   = contentDiv.querySelector('#m365Qty');
  const m365PriceEl= contentDiv.querySelector('#m365Price');
  const btnAddM365= contentDiv.querySelector('#btnAddM365');

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

  m365Select.addEventListener('change',()=>{
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


/***************************************************************************************************
 * 9) Bezpieczeństwo => 3 sekcje: Aplikacje webowe, Firewall, Analiza
 ***************************************************************************************************/
function renderSecurityWebAppsSection(category, plansBody){
  const row= document.createElement('tr');
  const col= document.createElement('td');
  col.colSpan=3;

  const secDiv= document.createElement('div');
  secDiv.classList.add('section-wrapper');

  const h5= document.createElement('h5');
  h5.textContent= "Aplikacje webowe";
  secDiv.appendChild(h5);

  const headerRow= document.createElement('div');
  headerRow.classList.add('section-header-row');
  headerRow.innerHTML=`
    <div>Parametry</div>
    <div>Cena (MIESIĘCZNIE)
      <i class="bi bi-info-circle text-muted ms-1" data-bs-toggle="tooltip"
         title="Koszt miesięczny skanowania aplikacji webowej."></i>
    </div>
  `;
  secDiv.appendChild(headerRow);

  const contentDiv= document.createElement('div');
  contentDiv.innerHTML=`
    <label class="d-block mb-1">Wybierz usługę skanowania:</label>
    <select id="webAppSelect" class="form-select d-inline-block" style="width:auto; min-width:200px;">
      <option value="" disabled selected>-- wybierz --</option>
    </select>
    <div id="webAppDesc" class="text-muted" style="font-size:0.85rem; margin-top:4px;"></div>

    <div class="d-flex align-items-center mt-2">
      <strong class="me-3"><span id="webAppPrice">0.00</span> PLN</strong>
      <button class="btn btn-primary" id="btnAddWebApp">Dodaj do wyceny</button>
    </div>
  `;
  secDiv.appendChild(contentDiv);

  col.appendChild(secDiv);
  row.appendChild(col);
  plansBody.appendChild(row);

  const webAppSelect= contentDiv.querySelector('#webAppSelect');
  const webAppDesc  = contentDiv.querySelector('#webAppDesc');
  const webAppPriceEl= contentDiv.querySelector('#webAppPrice');
  const btnAddWebApp= contentDiv.querySelector('#btnAddWebApp');

  if(category.securityWebApp && category.securityWebApp.length){
    category.securityWebApp.forEach(srv=>{
      const o= document.createElement('option');
      o.value= srv.price;
      o.setAttribute('data-label', srv.label);
      o.setAttribute('data-desc', srv.desc||"");
      o.textContent= `${srv.label} (${srv.price} PLN)`;
      webAppSelect.appendChild(o);
    });
  }

  function updateWebAppPrice(){
    const val= parseFloat(webAppSelect.value)||0;
    webAppPriceEl.textContent= val.toFixed(2);
  }
  function updateWebAppDesc(){
    if(!webAppSelect.value){
      webAppDesc.textContent="";
      return;
    }
    const sel= webAppSelect.options[webAppSelect.selectedIndex];
    webAppDesc.textContent= sel.getAttribute('data-desc')||"";
  }
  webAppSelect.addEventListener('change',()=>{
    updateWebAppPrice();
    updateWebAppDesc();
  });
  updateWebAppPrice();
  updateWebAppDesc();

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
  const row= document.createElement('tr');
  const col= document.createElement('td');
  col.colSpan=3;

  const secDiv= document.createElement('div');
  secDiv.classList.add('section-wrapper');

  const h5= document.createElement('h5');
  h5.textContent= "Firewall w chmurze";
  secDiv.appendChild(h5);

  const headerRow= document.createElement('div');
  headerRow.classList.add('section-header-row');
  headerRow.innerHTML=`
    <div>Parametry</div>
    <div>Cena (MIESIĘCZNIE)
      <i class="bi bi-info-circle text-muted ms-1" data-bs-toggle="tooltip"
         title="Koszt miesięczny firewall."></i>
    </div>
  `;
  secDiv.appendChild(headerRow);

  const contentDiv= document.createElement('div');
  contentDiv.innerHTML=`
    <label class="d-block mb-1">Wybierz usługę Firewalla:</label>
    <select id="fwSelect" class="form-select d-inline-block" style="width:auto; min-width:200px;">
      <option value="" disabled selected>-- wybierz --</option>
    </select>
    <div id="fwDesc" class="text-muted" style="font-size:0.85rem; margin-top:4px;"></div>

    <div class="d-flex align-items-center mt-2">
      <strong class="me-3"><span id="fwPrice">0.00</span> PLN</strong>
      <button class="btn btn-primary" id="btnAddFW">Dodaj do wyceny</button>
    </div>
  `;
  secDiv.appendChild(contentDiv);

  col.appendChild(secDiv);
  row.appendChild(col);
  plansBody.appendChild(row);

  const fwSelect   = contentDiv.querySelector('#fwSelect');
  const fwDesc     = contentDiv.querySelector('#fwDesc');
  const fwPriceEl  = contentDiv.querySelector('#fwPrice');
  const btnAddFW   = contentDiv.querySelector('#btnAddFW');

  if(category.securityFW && category.securityFW.length){
    category.securityFW.forEach(srv=>{
      const o= document.createElement('option');
      o.value= srv.price;
      o.setAttribute('data-label', srv.label);
      o.setAttribute('data-desc', srv.desc||"");
      o.textContent= `${srv.label} (${srv.price} PLN)`;
      fwSelect.appendChild(o);
    });
  }

  function updateFwPrice(){
    const val= parseFloat(fwSelect.value)||0;
    fwPriceEl.textContent= val.toFixed(2);
  }
  function updateFwDesc(){
    if(!fwSelect.value){
      fwDesc.textContent="";
      return;
    }
    const sel= fwSelect.options[fwSelect.selectedIndex];
    fwDesc.textContent= sel.getAttribute('data-desc')||"";
  }
  fwSelect.addEventListener('change',()=>{
    updateFwPrice();
    updateFwDesc();
  });
  updateFwPrice();
  updateFwDesc();

  btnAddFW.addEventListener('click',()=>{
    if(!fwSelect.value){
      alert("Wybierz usługę Firewalla w chmurze!");
      return;
    }
    const sel   = fwSelect.options[fwSelect.selectedIndex];
    const label = sel.getAttribute('data-label')||"FW";
    const val   = parseFloat(sel.value)||0;

    cart.push({
      name: category.name + " (Firewall)",
      details: label,
      price: val
    });
    renderCart();
  });
}

function renderSecurityAnalysisSection(category, plansBody){
  const row= document.createElement('tr');
  const col= document.createElement('td');
  col.colSpan=3;

  const secDiv= document.createElement('div');
  secDiv.classList.add('section-wrapper');

  const h5= document.createElement('h5');
  h5.textContent= "Analiza zabezpieczeń";
  secDiv.appendChild(h5);

  const headerRow= document.createElement('div');
  headerRow.classList.add('section-header-row');
  headerRow.innerHTML=`
    <div>Parametry</div>
    <div>Cena (MIESIĘCZNIE)
      <i class="bi bi-info-circle text-muted ms-1" data-bs-toggle="tooltip"
         title="Koszt analizy zabezpieczeń w ujęciu miesięcznym."></i>
    </div>
  `;
  secDiv.appendChild(headerRow);

  const storObj= category.analysis; // do tooltipów
  const contentDiv= document.createElement('div');
  contentDiv.innerHTML=`
    <div class="mb-2">
      <label class="me-2">
        Centralne logowanie (szt.)
        <i class="bi bi-info-circle text-muted ms-1" data-bs-toggle="tooltip"
           title="${storObj?.centralLoggingTooltip||''}"></i>
      </label>
      <input type="number" id="centralLogging" min="0" value="0"
             style="width:80px;" class="form-control d-inline-block">
    </div>
    <div class="mb-2">
      <label class="me-2">
        Pamięć do centralnego logowania (GB)
        <i class="bi bi-info-circle text-muted ms-1" data-bs-toggle="tooltip"
           title="${storObj?.memoryTooltip||''}"></i>
      </label>
      <input type="number" id="memoryGB" min="0" value="0"
             style="width:80px;" class="form-control d-inline-block">
    </div>
    <div class="d-flex align-items-center">
      <strong class="me-3"><span id="analysisPrice">0.00</span> PLN</strong>
      <button class="btn btn-primary" id="btnAddAnalysis">Dodaj do wyceny</button>
    </div>
  `;
  secDiv.appendChild(contentDiv);

  col.appendChild(secDiv);
  row.appendChild(col);
  plansBody.appendChild(row);

  const loggingInput= contentDiv.querySelector('#centralLogging');
  const memoryInput = contentDiv.querySelector('#memoryGB');
  const priceEl     = contentDiv.querySelector('#analysisPrice');
  const btnAdd      = contentDiv.querySelector('#btnAddAnalysis');

  function updateAnalysisPrice(){
    let total=0;
    const logVal= parseInt(loggingInput.value,10)||0;
    const memVal= parseInt(memoryInput.value,10)||0;
    if(logVal>0){
      total+= logVal*20; // np. 20 PLN/szt
      total+= memVal*1;  // 1 PLN/GB
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
      name: category.name+" (Analiza)",
      details: desc,
      price: total
    });
    renderCart();
  });
}


/***************************************************************************************************
 * 10) Koszyk
 ***************************************************************************************************/
function renderCart() {
  const cartSection = document.getElementById('cartSection');
  const tbody       = document.querySelector('#cartTable tbody');
  const totalEl     = document.getElementById('cartTotal');

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


/***************************************************************************************************
 * 11) initTooltips
 ***************************************************************************************************/
function initTooltips(){
  const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
  tooltipTriggerList.map(el => new bootstrap.Tooltip(el));
}
