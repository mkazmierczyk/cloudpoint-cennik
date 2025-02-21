let categoriesData = [];
let cart = []; // koszyk

document.addEventListener('DOMContentLoaded', () => {
  fetch('data.json')
    .then(res => res.json())
    .then(data => {
      categoriesData = data.categories;
      renderCategoriesMenu(categoriesData);
    })
    .catch(err => console.error("Błąd wczytywania data.json:", err));
});

/**
 * Rysujemy menu kategorii w #categoriesMenu
 */
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

/**
 * Obsługa kliknięcia w kategorię
 */
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

  // Rozróżniamy typ kategorii
  if (category.type === 'iaas') {
    // IaaS
    renderIaaS(category, plansBody);
    renderMsLicSection(category, plansBody);

  } else if (category.type === 'paas') {
    // PaaS
    renderPaaSMachinesSection(category, plansBody);
    renderMsLicSection(category, plansBody);
    renderPaaSDisasterRecoverySection(category, plansBody);

  } else {
    // SaaS, Acronis, CSP
    renderServicesList(category, plansBody);
  }

  initTooltips();
}

/**
 * Render IaaS (Maszyny wirtualne + suwak) + Kopie zapasowe, IP
 */
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
          CPU (vCore):
          <span id="cpuValue">1</span>
        </label>
        <input type="range" id="cpuSlider" min="${category.sliders[0].min}" max="${category.sliders[0].max}" step="${category.sliders[0].step}" value="${category.sliders[0].min}" style="width:150px;">
      </div>
      <div class="mb-2">
        <label class="form-label me-2">
          RAM (GB):
          <span id="ramValue">${category.sliders[1].min}</span>
        </label>
        <input type="range" id="ramSlider" min="${category.sliders[1].min}" max="${category.sliders[1].max}" step="${category.sliders[1].step}" value="${category.sliders[1].min}" style="width:150px;">
      </div>
      <div class="mb-2">
        <label class="form-label me-2">
          SSD (GB):
          <span id="ssdValue">${category.sliders[2].min}</span>
        </label>
        <input type="range" id="ssdSlider" min="${category.sliders[2].min}" max="${category.sliders[2].max}" step="${category.sliders[2].step}" value="${category.sliders[2].min}" style="width:150px;">
      </div>

      <!-- Backup -->
      <div class="mb-2">
        <label class="form-label me-2">
          Kopie zapasowe (GB)
          <i class="bi bi-info-circle text-muted ms-1" data-bs-toggle="tooltip"
             title="Rozmiar kopii zależny od wielkości VM.">
          </i>
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

  // Eventy
  const cpuSlider = contentTr.querySelector('#cpuSlider');
  const ramSlider = contentTr.querySelector('#ramSlider');
  const ssdSlider = contentTr.querySelector('#ssdSlider');
  const backupInput = contentTr.querySelector('#backupGB');
  const publicIP = contentTr.querySelector('#publicIP');
  const priceEl = contentTr.querySelector('#iaasPrice');

  function updatePrice() {
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
    if (publicIP.checked && category.publicIPPrice) {
      total += category.publicIPPrice;
    }

    contentTr.querySelector('#cpuValue').textContent = cpuVal;
    contentTr.querySelector('#ramValue').textContent = ramVal;
    contentTr.querySelector('#ssdValue').textContent = ssdVal;

    priceEl.textContent = total.toFixed(2);
  }

  cpuSlider.addEventListener('input', updatePrice);
  ramSlider.addEventListener('input', updatePrice);
  ssdSlider.addEventListener('input', updatePrice);
  backupInput.addEventListener('input', updatePrice);
  publicIP.addEventListener('change', updatePrice);
  updatePrice();

  // Dodaj do koszyka
  const addBtn = contentTr.querySelector('#btnAddIaas');
  addBtn.addEventListener('click', () => {
    const total = parseFloat(priceEl.textContent) || 0;
    const cpuVal = parseInt(cpuSlider.value, 10);
    const ramVal = parseInt(ramSlider.value, 10);
    const ssdVal = parseInt(ssdSlider.value, 10);
    const backupVal = parseFloat(backupInput.value) || 0;
    const pubIPchecked = publicIP.checked;

    let desc = `CPU=${cpuVal}, RAM=${ramVal}GB, SSD=${ssdVal}GB`;
    if (backupVal > 0) desc += `, Backup=${backupVal}GB`;
    if (pubIPchecked) desc += `, +PublicIP`;

    cart.push({
      name: category.name,
      details: desc,
      price: total
    });
    renderCart();
  });
}

/**
 * Sekcja PaaS (Maszyny wirtualne, wsparcie, Dysk SSD(GB), Backup, IP)
 */
function renderPaaSMachinesSection(category, plansBody) {
  const headerTr = document.createElement('tr');
  headerTr.innerHTML = `
    <td colspan="3">
      <h5 class="mb-3">Maszyny wirtualne (PaaS)</h5>
    </td>
  `;
  plansBody.appendChild(headerTr);

  const contentTr = document.createElement('tr');
  contentTr.innerHTML = `
    <td>
      <!-- Wybierz instancję -->
      <div class="mb-2">
        <label class="form-label me-2">Wybierz instancję:</label>
        <select id="paasInstanceSelect" class="form-select d-inline-block" style="width:auto; min-width:150px;">
          <option value="" disabled selected>-- wybierz --</option>
        </select>
      </div>

      <!-- Wsparcie -->
      <div class="mb-2">
        <label class="form-label me-2">Wsparcie techniczne:</label>
        <select id="paasSupportSelect" class="form-select d-inline-block" style="width:auto; min-width:200px;">
          <option value="" disabled selected>-- wybierz --</option>
          <option value="gold">C-SUPPORT-GOLD</option>
          <option value="platinum">C-SUPPORT-PLATINUM-AddON</option>
        </select>
      </div>

      <!-- Dysk SSD (GB) -->
      <div class="mb-2">
        <label class="form-label me-2">Dysk SSD (GB):</label>
        <input type="number" id="paasSsdGB" min="0" value="0" style="width:80px;" class="form-control d-inline-block">
      </div>

      <!-- Kopie zapasowe (GB) -->
      <div class="mb-2">
        <label class="form-label me-2">
          Kopie zapasowe (GB)
          <i class="bi bi-info-circle text-muted ms-1" data-bs-toggle="tooltip"
             title="Rozmiar kopii zależny od wielkości instancji.">
          </i>
        </label>
        <input type="number" id="paasBackupGB" min="0" value="0" style="width:80px;" class="form-control d-inline-block">
      </div>

      <!-- Public IP -->
      <div class="form-check">
        <input class="form-check-input" type="checkbox" id="paasPublicIP">
        <label class="form-check-label" for="paasPublicIP">
          Dodatkowe publiczne IP
          <i class="bi bi-info-circle text-muted ms-1"
             data-bs-toggle="tooltip"
             title="Wymagane, jeśli chcesz osobny adres IP.">
          </i>
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
  const supportSelect = contentTr.querySelector('#paasSupportSelect');
  const ssdInput = contentTr.querySelector('#paasSsdGB');
  const backupInput = contentTr.querySelector('#paasBackupGB');
  const ipCheck = contentTr.querySelector('#paasPublicIP');
  const priceEl = contentTr.querySelector('#paasPrice');
  const addBtn = contentTr.querySelector('#btnAddPaaS');

  // Uzupełniamy listę instancji
  if (category.paasInstances && category.paasInstances.length) {
    category.paasInstances.forEach(inst => {
      const opt = document.createElement('option');
      opt.value = inst.price;
      opt.setAttribute('data-label', inst.label);
      opt.textContent = `${inst.label} (${inst.price} PLN)`;
      instSelect.appendChild(opt);
    });
  }

  // Obliczanie ceny
  function updatePaaSPrice() {
    let total = 0;

    // Instancja
    const instPrice = parseFloat(instSelect.value) || 0;
    total += instPrice;

    // Wsparcie
    if (supportSelect.value === 'gold') {
      total += (category.supportGoldPrice || 0);
    } else if (supportSelect.value === 'platinum') {
      total += (category.supportGoldPrice || 0);
      total += (category.supportPlatinumAddOnPrice || 0);
    }

    // Dysk SSD (GB) - załóżmy 1 PLN/GB
    const ssdVal = parseFloat(ssdInput.value) || 0;
    const ssdPricePerGB = 1.0; // stała - dostosuj
    total += ssdVal * ssdPricePerGB;

    // Kopie zapasowe
    const backupVal = parseFloat(backupInput.value) || 0;
    if (backupVal > 0 && category.backupPricePerGB) {
      total += backupVal * category.backupPricePerGB;
    }

    // Public IP
    if (ipCheck.checked && category.publicIPPrice) {
      total += category.publicIPPrice;
    }

    priceEl.textContent = total.toFixed(2);
  }

  instSelect.addEventListener('change', updatePaaSPrice);
  supportSelect.addEventListener('change', updatePaaSPrice);
  ssdInput.addEventListener('input', updatePaaSPrice);
  backupInput.addEventListener('input', updatePaaSPrice);
  ipCheck.addEventListener('change', updatePaaSPrice);
  updatePaaSPrice();

  // Dodaj do koszyka
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
    const instLabel = instSelect.options[instSelect.selectedIndex]?.dataset.label || "Brak";
    let supportDesc = "";
    if (supportSelect.value === 'gold') {
      supportDesc = "C-SUPPORT-GOLD";
    } else if (supportSelect.value === 'platinum') {
      supportDesc = "C-SUPPORT-GOLD + C-SUPPORT-PLATINUM-AddON";
    }

    const ssdVal = parseFloat(ssdInput.value) || 0;
    const backupVal = parseFloat(backupInput.value) || 0;
    const ipChecked = ipCheck.checked;

    let desc = `Instancja=${instLabel}, Wsparcie=${supportDesc}`;
    if (ssdVal > 0) desc += `, SSD=${ssdVal}GB`;
    if (backupVal > 0) desc += `, Backup=${backupVal}GB`;
    if (ipChecked) desc += `, +PublicIP`;

    cart.push({
      name: category.name,
      details: desc,
      price: total
    });
    renderCart();
  });
}

/**
 * Sekcja "Disaster Recovery" w PaaS 
 */
function renderPaaSDisasterRecoverySection(category, plansBody) {
  if (!category.drServices || !category.drServices.length) return;

  const headerTr = document.createElement('tr');
  headerTr.innerHTML = `
    <td colspan="3">
      <h5 class="mt-4 mb-3">Disaster Recovery</h5>
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

  const storObj = category.drServices.find(s => s.id === 'C-DR-STORAGE');
  const ipObj = category.drServices.find(s => s.id === 'C-DR-IP');

  // Rysujemy inputy
  drStorageWrap.innerHTML = `
    <label class="form-label me-2">
      ${storObj?.label || 'C-DR-STORAGE'}
      <i class="bi bi-info-circle text-muted ms-1"
         data-bs-toggle="tooltip"
         title="${storObj?.tooltip || ''}">
      </i>
    </label>
    <input type="number" id="drStorageInput" min="0" value="0" style="width:80px;" class="form-control d-inline-block">
  `;
  drIpWrap.innerHTML = `
    <label class="form-label me-2">
      ${ipObj?.label || 'C-DR-IP'}
      <i class="bi bi-info-circle text-muted ms-1"
         data-bs-toggle="tooltip"
         title="${ipObj?.tooltip || ''}">
      </i>
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
    const sVal = parseFloat(drStorageInput.value) || 0;
    const iVal = parseFloat(drIpInput.value) || 1;
    if (iVal < 1) {
      alert("C-DR-IP musi być co najmniej 1!");
      return;
    }
    let total = 0;
    if (storObj) total += sVal * storObj.price;
    if (ipObj) total += iVal * ipObj.price;

    let desc = `${storObj?.label || 'C-DR-STORAGE'}=${sVal}GB, ${ipObj?.label || 'C-DR-IP'}=${iVal}`;
    cart.push({
      name: `${category.name} (DR)`,
      details: desc,
      price: total
    });
    renderCart();
  });
}

/**
 * Licencje Microsoft (dla IaaS/PaaS)
 */
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
    const qty = parseInt(msQty.value, 10) || 1;
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
    const qty = parseInt(msQty.value, 10) || 1;
    const total = price * qty;

    cart.push({
      name: `${category.name} (Licencje MS)`,
      details: `${label} x${qty}`,
      price: total
    });
    renderCart();
  });
}

/**
 * Dla SaaS, Acronis, CSP - standardowa lista
 */
function renderServicesList(category, plansBody) {
  if (category.services && category.services.length) {
    category.services.forEach(srv => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
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
    tr.innerHTML = `<td colspan="3">Brak usług w tej kategorii.</td>`;
    plansBody.appendChild(tr);
  }
}

/**
 * Koszyk
 */
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

/**
 * Tooltipy Bootstrap
 */
function initTooltips() {
  const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
  tooltipTriggerList.map(el => new bootstrap.Tooltip(el));
}
