/******************************************************************************************************
 * script.js 
 * KATEGORIE:
 *   - IaaS        (typu "iaas")        => suwak CPU/RAM/SSD + licencje
 *   - PaaS        (typu "paas")        => instancje + DR + licencje
 *   - SaaS        (typu "saas")        => MsSQL, Enova, Terminal, Extra + licencje
 *   - Acronis     (typu "acronis")     => prosta lista
 *   - Microsoft CSP (typu "csp")       => 1 sekcja "Microsoft 365" (msCspServices)
 *   - Bezpieczeństwo (typu "security") => 3 sekcje: 
 *                                         1) Aplikacje webowe 
 *                                         2) Firewall 
 *                                         3) Analiza (central log, memory)
 ******************************************************************************************************/

let categoriesData = [];
let cart = [];

/******************************************************************************************************
 * 1) DOMContentLoaded
 ******************************************************************************************************/
document.addEventListener('DOMContentLoaded', () => {
  fetch('data.json')
    .then(res => res.json())
    .then(data => {
      categoriesData = data.categories;
      renderCategoriesMenu(categoriesData);
    })
    .catch(err => console.error("Błąd wczytywania data.json:", err));
});


/******************************************************************************************************
 * 2) renderCategoriesMenu
 ******************************************************************************************************/
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
      // Podświetlenie
      document.querySelectorAll('#categoriesMenu a').forEach(a => a.classList.remove('active'));
      link.classList.add('active');
    });

    li.appendChild(link);
    menuUl.appendChild(li);
  });
}


/******************************************************************************************************
 * 3) selectCategory
 ******************************************************************************************************/
function selectCategory(catIndex) {
  const category     = categoriesData[catIndex];
  const titleEl      = document.getElementById('categoryTitle');
  const descEl       = document.getElementById('categoryDesc');
  const plansWrapper = document.getElementById('plansTableWrapper');
  const plansBody    = document.getElementById('plansTableBody');

  titleEl.textContent = category.name;
  descEl.textContent  = `Opcje dostępne w kategorii: ${category.name}.`;

  plansWrapper.style.display='block';
  plansBody.innerHTML='';

  // Rozróżnienie po typie
  if (category.type === 'iaas') {
    renderIaaS(category, plansBody);
    renderMsLicSection(category, plansBody);

  } else if (category.type === 'paas') {
    renderPaaSMachinesSection(category, plansBody);
    renderMsLicSection(category, plansBody);
    renderPaaSDisasterRecoverySection(category, plansBody);

  } else if (category.type === 'saas') {
    renderSaaSApplications(category, plansBody);
    renderMsLicSection(category, plansBody);

  } else if (category.type === 'acronis') {
    renderServicesList(category, plansBody);

  } else if (category.type === 'csp') {
    // Microsoft CSP => "Microsoft 365"
    renderMicrosoft365Section(category, plansBody);

  } else if (category.type === 'security') {
    // Bezpieczeństwo => 3 sekcje
    renderSecurityWebAppsSection(category, plansBody);
    renderSecurityFirewallSection(category, plansBody);
    renderSecurityAnalysisSection(category, plansBody);

  } else {
    // fallback
    renderServicesList(category, plansBody);
  }

  initTooltips();
}


/******************************************************************************************************
 * 4) IaaS
 ******************************************************************************************************/
function renderIaaS(category, plansBody) {
  // Nagłówek
  const headerTr = document.createElement('tr');
  headerTr.innerHTML=`
    <td colspan="3">
      <h5 class="mb-3">Maszyny wirtualne (IaaS)</h5>
    </td>
  `;
  plansBody.appendChild(headerTr);

  // wiersz
  const contentTr = document.createElement('tr');
  contentTr.innerHTML=`
    <td>
      <div class="mb-2">
        <label class="form-label me-2">CPU (vCore): <span id="cpuValue">1</span></label>
        <input type="range" id="cpuSlider"
               min="${category.sliders[0].min}" max="${category.sliders[0].max}" step="${category.sliders[0].step}"
               value="${category.sliders[0].min}" style="width:150px;">
      </div>
      <div class="mb-2">
        <label class="form-label me-2">RAM (GB): <span id="ramValue">${category.sliders[1].min}</span></label>
        <input type="range" id="ramSlider"
               min="${category.sliders[1].min}" max="${category.sliders[1].max}" step="${category.sliders[1].step}"
               value="${category.sliders[1].min}" style="width:150px;">
      </div>
      <div class="mb-2">
        <label class="form-label me-2">SSD (GB): <span id="ssdValue">${category.sliders[2].min}</span></label>
        <input type="range" id="ssdSlider"
               min="${category.sliders[2].min}" max="${category.sliders[2].max}" step="${category.sliders[2].step}"
               value="${category.sliders[2].min}" style="width:150px;">
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
      <button class="btn btn-outline-primary" id="btnAddIaas">Dodaj do koszyka</button>
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
    let total=0;
    const cpuVal   = parseInt(cpuSlider.value,10);
    const ramVal   = parseInt(ramSlider.value,10);
    const ssdVal   = parseInt(ssdSlider.value,10);
    const backupVal= parseFloat(backupInput.value)||0;

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
    const total = parseFloat(priceEl.textContent)||0;
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


/******************************************************************************************************
 * 5) PaaS (Maszyny + DR)
 ******************************************************************************************************/
function renderPaaSMachinesSection(category, plansBody) {
  /* identycznie jak poprzednio */
  // ...
}
function renderPaaSDisasterRecoverySection(category, plansBody) {
  /* identycznie jak poprzednio */
  // ...
}


/******************************************************************************************************
 * 6) SaaS
 ******************************************************************************************************/
function renderSaaSApplications(category, plansBody) {
  /* MsSQL, Enova, Enova API, Terminal, Extra Data */
  // ...
}


/******************************************************************************************************
 * 7) MsLicSection (IaaS/PaaS/SaaS)
 ******************************************************************************************************/
function renderMsLicSection(category, plansBody) {
  /* Bez zmian */
  // ...
}


/******************************************************************************************************
 * 8) Acronis / fallback => renderServicesList
 ******************************************************************************************************/
function renderServicesList(category, plansBody) {
  /* Prosta lista. Skoro w data.json dla Acronis mamy "services", to to się wyświetli */
  if (category.services && category.services.length) {
    category.services.forEach(srv => {
      const tr = document.createElement('tr');
      tr.innerHTML=`
        <td>${srv.label}</td>
        <td>${srv.price} PLN</td>
        <td><button class="btn btn-outline-primary btn-sm">Dodaj do koszyka</button></td>
      `;
      plansBody.appendChild(tr);
      tr.querySelector('button').addEventListener('click', () => {
        cart.push({
          name: category.name,
          details: srv.label,
          price: srv.price
        });
        renderCart();
      });
    });
  } else {
    const tr = document.createElement('tr');
    tr.innerHTML=`<td colspan="3">Brak usług w tej kategorii.</td>`;
    plansBody.appendChild(tr);
  }
}


/******************************************************************************************************
 * 9) Microsoft CSP (type = "csp") => "Microsoft 365" sekcja
 ******************************************************************************************************/
function renderMicrosoft365Section(category, plansBody) {
  
  const headerTr = document.createElement('tr');
  headerTr.innerHTML=`
    <td colspan="3">
      <h5 class="mb-3">Microsoft 365</h5>
    </td>
  `;
  plansBody.appendChild(headerTr);

  const contentTr = document.createElement('tr');
  contentTr.innerHTML=`
    <td>
      <label class="me-2">Wybierz subskrypcję:</label>
      <select id="m365Select" class="form-select d-inline-block" style="width:auto; min-width:200px;">
        <option value="" disabled selected>-- wybierz --</option>
      </select>
      <div id="m365Desc" class="text-muted mt-1" style="font-size:0.85rem;"></div>

      <label class="ms-3">Ilość:</label>
      <input type="number" id="m365Qty" value="1" min="1"
             style="width:60px;" class="form-control d-inline-block ms-2">
    </td>
    <td>
      <span id="m365Price">0.00</span> PLN
    </td>
    <td>
      <button class="btn btn-outline-primary" id="btnAddM365">
        Dodaj do koszyka
      </button>
    </td>
  `;
  plansBody.appendChild(contentTr);

  const selEl   = contentTr.querySelector('#m365Select');
  const descEl  = contentTr.querySelector('#m365Desc');
  const qtyEl   = contentTr.querySelector('#m365Qty');
  const priceEl = contentTr.querySelector('#m365Price');
  const btnAdd  = contentTr.querySelector('#btnAddM365');

  if (category.msCspServices && category.msCspServices.length) {
    category.msCspServices.forEach(srv => {
      const opt = document.createElement('option');
      opt.value = srv.price;
      opt.setAttribute('data-label', srv.label);
      opt.setAttribute('data-desc', srv.desc||"");
      opt.textContent = `${srv.label} (${srv.price} PLN)`;
      selEl.appendChild(opt);
    });
  }

  function updateM365Desc() {
    if (!selEl.value) {
      descEl.textContent="";
      return;
    }
    const sel = selEl.options[selEl.selectedIndex];
    descEl.textContent = sel.getAttribute('data-desc')||"";
  }

  function updateM365Price() {
    const val = parseFloat(selEl.value)||0;
    const qty = parseInt(qtyEl.value,10)||1;
    const total = val*qty;
    priceEl.textContent = total.toFixed(2);
  }

  selEl.addEventListener('change', () => {
    updateM365Desc();
    updateM365Price();
  });
  qtyEl.addEventListener('input', updateM365Price);

  updateM365Desc();
  updateM365Price();

  btnAdd.addEventListener('click', ()=> {
    if (!selEl.value) {
      alert("Wybierz subskrypcję Microsoft 365!");
      return;
    }
    const selOpt = selEl.options[selEl.selectedIndex];
    const label  = selOpt.getAttribute('data-label');
    const val    = parseFloat(selEl.value)||0;
    const qty    = parseInt(qtyEl.value,10)||1;
    const total  = val*qty;

    cart.push({
      name: category.name + " (Microsoft 365)",
      details: `${label} x${qty}`,
      price: total
    });
    renderCart();
  });
}


/******************************************************************************************************
 * 10) Bezpieczeństwo (type = "security") => 3 sekcje
 ******************************************************************************************************/
/** a) Aplikacje webowe */
function renderSecurityWebAppsSection(category, plansBody) {
  const headerTr = document.createElement('tr');
  headerTr.innerHTML=`
    <td colspan="3">
      <h5 class="mb-3">Aplikacje webowe</h5>
    </td>
  `;
  plansBody.appendChild(headerTr);

  const contentTr = document.createElement('tr');
  contentTr.innerHTML=`
    <td>
      <label class="me-2">Wybierz usługę skanowania:</label>
      <select id="webAppSelect" class="form-select d-inline-block" style="width:auto; min-width:200px;">
        <option value="" disabled selected>-- wybierz --</option>
      </select>
      <div id="webAppDesc" class="text-muted mt-1" style="font-size:0.85rem;"></div>
    </td>
    <td>
      <span id="webAppPrice">0.00</span> PLN
    </td>
    <td>
      <button class="btn btn-outline-primary" id="btnAddWebApp">
        Dodaj do koszyka
      </button>
    </td>
  `;
  plansBody.appendChild(contentTr);

  const selectEl = contentTr.querySelector('#webAppSelect');
  const descEl   = contentTr.querySelector('#webAppDesc');
  const priceEl  = contentTr.querySelector('#webAppPrice');
  const btnAdd   = contentTr.querySelector('#btnAddWebApp');

  if (category.securityWebApp && category.securityWebApp.length) {
    category.securityWebApp.forEach(srv => {
      const opt = document.createElement('option');
      opt.value = srv.price;
      opt.setAttribute('data-label', srv.label);
      opt.setAttribute('data-desc', srv.desc||"");
      opt.textContent = `${srv.label} (${srv.price} PLN)`;
      selectEl.appendChild(opt);
    });
  }

  function updateWebAppPrice() {
    const val = parseFloat(selectEl.value)||0;
    priceEl.textContent= val.toFixed(2);
  }
  function updateWebAppDesc() {
    if (!selectEl.value) {
      descEl.textContent="";
      return;
    }
    const sel = selectEl.options[selectEl.selectedIndex];
    descEl.textContent= sel.getAttribute('data-desc')||"";
  }

  selectEl.addEventListener('change', ()=> {
    updateWebAppPrice();
    updateWebAppDesc();
  });
  updateWebAppPrice();
  updateWebAppDesc();

  btnAdd.addEventListener('click', ()=> {
    if (!selectEl.value) {
      alert("Wybierz usługę skanowania aplikacji webowej!");
      return;
    }
    const sel  = selectEl.options[selectEl.selectedIndex];
    const label= sel.getAttribute('data-label');
    const val  = parseFloat(selectEl.value)||0;

    cart.push({
      name: category.name + " (Aplikacje webowe)",
      details: label,
      price: val
    });
    renderCart();
  });
}


/** b) Firewall w chmurze */
function renderSecurityFirewallSection(category, plansBody) {
  const headerTr = document.createElement('tr');
  headerTr.innerHTML=`
    <td colspan="3">
      <h5 class="mt-4 mb-3">Firewall w chmurze</h5>
    </td>
  `;
  plansBody.appendChild(headerTr);

  const contentTr = document.createElement('tr');
  contentTr.innerHTML=`
    <td>
      <label class="me-2">Wybierz usługę Firewalla:</label>
      <select id="fwSelect" class="form-select d-inline-block" style="width:auto; min-width:200px;">
        <option value="" disabled selected>-- wybierz --</option>
      </select>
      <div id="fwDesc" class="text-muted mt-1" style="font-size:0.85rem;"></div>
    </td>
    <td>
      <span id="fwPrice">0.00</span> PLN
    </td>
    <td>
      <button class="btn btn-outline-primary" id="btnAddFW">
        Dodaj do koszyka
      </button>
    </td>
  `;
  plansBody.appendChild(contentTr);

  const selectEl = contentTr.querySelector('#fwSelect');
  const descEl   = contentTr.querySelector('#fwDesc');
  const priceEl  = contentTr.querySelector('#fwPrice');
  const btnAdd   = contentTr.querySelector('#btnAddFW');

  if (category.securityFW && category.securityFW.length) {
    category.securityFW.forEach(srv => {
      const opt = document.createElement('option');
      opt.value = srv.price;
      opt.setAttribute('data-label', srv.label);
      opt.setAttribute('data-desc', srv.desc||"");
      opt.textContent = `${srv.label} (${srv.price} PLN)`;
      selectEl.appendChild(opt);
    });
  }

  function updateFwPrice() {
    const val = parseFloat(selectEl.value)||0;
    priceEl.textContent = val.toFixed(2);
  }
  function updateFwDesc() {
    if (!selectEl.value) {
      descEl.textContent="";
      return;
    }
    const sel = selectEl.options[selectEl.selectedIndex];
    descEl.textContent= sel.getAttribute('data-desc')||"";
  }

  selectEl.addEventListener('change', () => {
    updateFwPrice();
    updateFwDesc();
  });
  updateFwPrice();
  updateFwDesc();

  btnAdd.addEventListener('click', ()=> {
    if (!selectEl.value) {
      alert("Wybierz usługę Firewalla w chmurze!");
      return;
    }
    const sel   = selectEl.options[selectEl.selectedIndex];
    const label = sel.getAttribute('data-label');
    const val   = parseFloat(selectEl.value)||0;

    cart.push({
      name: category.name + " (Firewall)",
      details: label,
      price: val
    });
    renderCart();
  });
}


/** c) Analiza zabezpieczeń */
function renderSecurityAnalysisSection(category, plansBody) {
  const headerTr = document.createElement('tr');
  headerTr.innerHTML=`
    <td colspan="3">
      <h5 class="mt-4 mb-3">Analiza zabezpieczeń</h5>
    </td>
  `;
  plansBody.appendChild(headerTr);

  const contentTr = document.createElement('tr');
  contentTr.innerHTML=`
    <td>
      <div class="mb-2">
        <label class="me-2">
          Centralne logowanie (szt.)
          <i class="bi bi-info-circle text-muted ms-1" data-bs-toggle="tooltip"
             title="${category.analysis?.centralLoggingTooltip || ''}"></i>
        </label>
        <input type="number" id="centralLogging" min="0" value="0"
               style="width:80px;" class="form-control d-inline-block">
      </div>

      <div class="mb-2">
        <label class="me-2">
          Pamięć do centralnego logowania (GB)
          <i class="bi bi-info-circle text-muted ms-1" data-bs-toggle="tooltip"
             title="${category.analysis?.memoryTooltip || ''}"></i>
        </label>
        <input type="number" id="memoryGB" min="0" value="0"
               style="width:80px;" class="form-control d-inline-block">
      </div>
    </td>
    <td>
      <span id="analysisPrice">0.00</span> PLN
    </td>
    <td>
      <button class="btn btn-outline-primary" id="btnAddAnalysis">
        Dodaj do koszyka
      </button>
    </td>
  `;
  plansBody.appendChild(contentTr);

  const loggingInput = contentTr.querySelector('#centralLogging');
  const memoryInput  = contentTr.querySelector('#memoryGB');
  const priceEl      = contentTr.querySelector('#analysisPrice');
  const btnAdd       = contentTr.querySelector('#btnAddAnalysis');

  function updateAnalysisPrice() {
    // Zdefiniujmy: 20 PLN/szt za centralne logowanie, 1 PLN/GB pamięci
    const logVal = parseInt(loggingInput.value,10)||0;
    const memVal = parseInt(memoryInput.value,10)||0;
    let total=0;
    if (logVal>0) {
      total += logVal*20;
      total += memVal*1;
    }
    priceEl.textContent= total.toFixed(2);
  }

  loggingInput.addEventListener('input', updateAnalysisPrice);
  memoryInput.addEventListener('input', updateAnalysisPrice);
  updateAnalysisPrice();

  btnAdd.addEventListener('click', ()=> {
    const logVal = parseInt(loggingInput.value,10)||0;
    const memVal = parseInt(memoryInput.value,10)||0;

    if (logVal>0 && memVal<5) {
      alert("Jeśli używasz centralnego logowania, pamięć musi być min. 5GB!");
      return;
    }

    let total=0;
    let desc="";
    if (logVal>0) {
      total = logVal*20 + memVal*1;
      desc  = `CentralLog=${logVal}, Memory=${memVal}GB`;
    } else {
      desc = "Brak analizy (0)";
    }

    cart.push({
      name: category.name + " (Analiza)",
      details: desc,
      price: total
    });
    renderCart();
  });
}


/******************************************************************************************************
 * 11) renderCart
 ******************************************************************************************************/
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
    sum += item.price;
    const tr = document.createElement('tr');
    tr.innerHTML=`
      <td>${item.name}</td>
      <td>${item.details}</td>
      <td>${item.price.toFixed(2)}</td>
      <td>
        <button class="btn btn-sm btn-danger">X</button>
      </td>
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


/******************************************************************************************************
 * 12) initTooltips
 ******************************************************************************************************/
function initTooltips() {
  const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
  tooltipTriggerList.map(el => new bootstrap.Tooltip(el));
}
