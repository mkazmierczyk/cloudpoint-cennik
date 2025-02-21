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
 * Rysujemy listę kategorii w menu
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
      document.querySelectorAll('#categoriesMenu a').forEach(a => a.classList.remove('active'));
      link.classList.add('active');
    });

    li.appendChild(link);
    menuUl.appendChild(li);
  });
}

/**
 * Po kliknięciu kategorii
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

  if (category.type === 'iaas') {
    // IaaS (jak poprzednio)
    renderIaaSMachinesSection(category, plansBody);
    renderMsLicSection(category, plansBody);
  } 
  else if (category.type === 'paas') {
    // Nowa funkcja dla PaaS
    renderPaaSSection(category, plansBody);
    renderMsLicSection(category, plansBody); // licencje Microsoft wewnątrz PaaS
    renderPaasDisasterRecoverySection(plansBody);
  }
  else {
    // Inne kategorie - standardowa lista services
    renderServicesList(category, plansBody);
  }

  // Po dynamicznym stworzeniu elementów - włącz tooltips
  initTooltips();
}

/**
 * Funkcja IaaS (jak poprzednio).
 */
function renderIaaSMachinesSection(category, plansBody) {
  // ... (pomijam, bo już mieliśmy w poprzednim przykładzie)
  // W skrócie: suwaki CPU/RAM/SSD + backup + IP + przycisk
  // updateIaaSPrice() itp.
  // ...
  // Oraz MsLicSection => wewnątrz IaaS
}

/**
 * FUNKCJA: renderuje PaaS w układzie podobnym do IaaS,
 * ale:
 *  - Zamiast suwaków => "Wybierz instancję" (z category.paasInstances)
 *  - "Wsparcie techniczne" (Gold lub Platinum)
 *  - Kopie zapasowe (GB)
 *  - Public IP (checkbox)
 *  - Cena i "Dodaj do koszyka" z walidacją wsparcia.
 */
function renderPaaSSection(category, plansBody) {
  // Nagłówek
  const headerTr = document.createElement('tr');
  headerTr.innerHTML = `
    <td colspan="3">
      <h5 class="mb-3">Maszyny wirtualne (PaaS)</h5>
    </td>
  `;
  plansBody.appendChild(headerTr);

  // Główny wiersz
  const contentTr = document.createElement('tr');
  contentTr.innerHTML = `
    <td>
      <!-- Lista instancji -->
      <div class="mb-2">
        <label class="form-label me-2">Wybierz instancję:</label>
        <select id="paasInstanceSelect" class="form-select d-inline-block" style="width:auto; min-width:150px;">
          <option value="" disabled selected>-- wybierz --</option>
        </select>
      </div>

      <!-- Wsparcie techniczne -->
      <div class="mb-2">
        <label class="form-label me-2">Wsparcie techniczne:</label>
        <select id="paasSupportSelect" class="form-select d-inline-block" style="width:auto; min-width:200px;">
          <option value="" disabled selected>-- wybierz --</option>
          <option value="gold">C-SUPPORT-GOLD</option>
          <option value="platinum">C-SUPPORT-PLATINUM-AddON</option>
        </select>
      </div>

      <!-- Kopie zapasowe -->
      <div class="mb-2">
        <label class="form-label me-2">
          Kopie zapasowe (GB)
          <i class="bi bi-info-circle text-muted ms-1" data-bs-toggle="tooltip"
             title="Rozmiar kopii zależny od wielkości instancji.">
          </i>
        </label>
        <input type="number" min="0" value="0" id="paasBackupGB" style="width:80px;" class="form-control d-inline-block">
      </div>

      <!-- Public IP -->
      <div class="form-check">
        <input class="form-check-input" type="checkbox" value="" id="paasPublicIP">
        <label class="form-check-label" for="paasPublicIP">
          Dodatkowe publiczne IP
          <i class="bi bi-info-circle text-muted ms-1" data-bs-toggle="tooltip"
             title="Wymagane jeśli chcesz osobny adres IP.">
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
  const backupInput = contentTr.querySelector('#paasBackupGB');
  const ipCheck = contentTr.querySelector('#paasPublicIP');
  const priceEl = contentTr.querySelector('#paasPrice');
  const addBtn = contentTr.querySelector('#btnAddPaaS');

  // Uzupełniamy listę instancji
  category.paasInstances.forEach(inst => {
    const opt = document.createElement('option');
    opt.value = inst.price;
    opt.setAttribute('data-label', inst.label);
    opt.textContent = `${inst.label} (${inst.price} PLN)`;
    instSelect.appendChild(opt);
  });

  // Funkcja licząca cenę PaaS
  function updatePaaSPrice() {
    let total = 0;
    // Instancja
    const instPrice = parseFloat(instSelect.value) || 0;
    total += instPrice;
    // Wsparcie
    if (supportSelect.value === 'gold') {
      // minimalne gold
      total += category.supportGoldPrice || 0;
    } else if (supportSelect.value === 'platinum') {
      // platinum => gold + platinum
      total += (category.supportGoldPrice || 0);
      total += (category.supportPlatinumAddOnPrice || 0);
    }
    // Backup
    const backupGB = parseFloat(backupInput.value) || 0;
    if (backupGB > 0 && category.backupPricePerGB) {
      total += backupGB * category.backupPricePerGB;
    }
    // Public IP
    if (ipCheck.checked && category.publicIPPrice) {
      total += category.publicIPPrice;
    }

    priceEl.textContent = total.toFixed(2);
  }

  // Eventy
  instSelect.addEventListener('change', updatePaaSPrice);
  supportSelect.addEventListener('change', updatePaaSPrice);
  backupInput.addEventListener('input', updatePaaSPrice);
  ipCheck.addEventListener('change', updatePaaSPrice);

  // Na start
  updatePaaSPrice();

  // Dodaj do koszyka (z walidacją wsparcia)
  addBtn.addEventListener('click', () => {
    if (!instSelect.value) {
      alert("Musisz wybrać instancję PaaS!");
      return;
    }
    if (!supportSelect.value) {
      alert("Musisz wybrać co najmniej C-SUPPORT-GOLD!");
      return;
    }

    const instLabel = instSelect.options[instSelect.selectedIndex].getAttribute('data-label');
    const instPrice = parseFloat(instSelect.value);

    let supportCost = 0;
    let supportDesc = "";
    if (supportSelect.value === 'gold') {
      supportCost = category.supportGoldPrice || 0;
      supportDesc = "C-SUPPORT-GOLD";
    } else if (supportSelect.value === 'platinum') {
      supportCost = (category.supportGoldPrice || 0) + (category.supportPlatinumAddOnPrice || 0);
      supportDesc = "C-SUPPORT-GOLD + C-SUPPORT-PLATINUM-AddON";
    }

    const backupGB = parseFloat(backupInput.value) || 0;
    const backupCost = backupGB * (category.backupPricePerGB || 0);
    const ipCost = ipCheck.checked ? (category.publicIPPrice || 0) : 0;

    let total = instPrice + supportCost + backupCost + ipCost;

    let desc = `Instancja=${instLabel}, Wsparcie=${supportDesc}`;
    if (backupGB > 0) desc += `, Backup=${backupGB}GB`;
    if (ipCheck.checked) desc += `, +PublicIP`;

    // Tworzymy pozycję koszyka
    const cartItem = {
      name: category.name,
      details: desc,
      price: total
    };
    cart.push(cartItem);
    renderCart();
  });
}

/**
 * Sekcja Licencje Microsoft (wewnątrz IaaS lub PaaS),
 * bazuje na polu "msSplaServices"
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

  // Wiersz: select + ilość + cena + "Dodaj"
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

  // Uzupełniamy select
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

    const cartItem = {
      name: `${category.name} (Licencje MS)`,
      details: `${label} x${qty}`,
      price: total
    };
    cart.push(cartItem);
    renderCart();
  });
}

/**
 * "Disaster Recovery" sekcja dla PaaS, bierzemy z kategorii "PaaS_DR"
 *  - 2 usługi: C-DR-STORAGE, C-DR-IP
 *  - Każda ma input (liczba) + tooltip
 *  - 1 przycisk "Dodaj do koszyka"
 */
function renderPaasDisasterRecoverySection(plansBody) {
  // Znajdź w data kategorie "PaaS_DR"
  const drCat = categoriesData.find(c => c.type === 'paas_dr');
  if (!drCat || !drCat.services) return;

  // Nagłówek
  const headerTr = document.createElement('tr');
  headerTr.innerHTML = `
    <td colspan="3">
      <h5 class="mt-4 mb-3">Disaster Recovery</h5>
    </td>
  `;
  plansBody.appendChild(headerTr);

  // Wiersz z polami
  const contentTr = document.createElement('tr');
  contentTr.innerHTML = `
    <td>
      <!-- 2 usługi: C-DR-STORAGE, C-DR-IP -->
      <div class="mb-2">
        <label class="form-label me-2">
          C-DR-STORAGE
          <i class="bi bi-info-circle text-muted ms-1"
             data-bs-toggle="tooltip"
             title="Storage w GB dla DR">
          </i>
        </label>
        <input type="number" min="0" value="0" id="drStorageInput" style="width:80px;" class="form-control d-inline-block">
      </div>

      <div class="mb-2">
        <label class="form-label me-2">
          C-DR-IP
          <i class="bi bi-info-circle text-muted ms-1"
             data-bs-toggle="tooltip"
             title="Adresy IP dla DR (min 1)">
          </i>
        </label>
        <input type="number" min="1" value="1" id="drIpInput" style="width:80px;" class="form-control d-inline-block">
      </div>
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

  const storageInput = contentTr.querySelector('#drStorageInput');
  const ipInput = contentTr.querySelector('#drIpInput');
  const priceEl = contentTr.querySelector('#drPrice');
  const btnAddDR = contentTr.querySelector('#btnAddDR');

  // Znajdź obiekty w drCat.services
  const storageSrv = drCat.services.find(s => s.id === 'C-DR-STORAGE');
  const ipSrv = drCat.services.find(s => s.id === 'C-DR-IP');

  function updateDrPrice() {
    const sVal = parseFloat(storageInput.value) || 0;
    const iVal = parseFloat(ipInput.value) || 1;

    let total = 0;
    if (storageSrv) {
      total += sVal * storageSrv.price;
    }
    if (ipSrv) {
      total += iVal * ipSrv.price;
    }
    priceEl.textContent = total.toFixed(2);
  }

  storageInput.addEventListener('input', updateDrPrice);
  ipInput.addEventListener('input', updateDrPrice);
  updateDrPrice();

  btnAddDR.addEventListener('click', () => {
    const sVal = parseFloat(storageInput.value) || 0;
    const iVal = parseFloat(ipInput.value) || 1;
    if (iVal < 1) {
      alert("C-DR-IP musi być co najmniej 1!");
      return;
    }
    let total = 0;
    if (storageSrv) total += sVal * storageSrv.price;
    if (ipSrv) total += iVal * ipSrv.price;

    let desc = `C-DR-STORAGE=${sVal}GB, C-DR-IP=${iVal}`;
    const cartItem = {
      name: 'PaaS (DR)',
      details: desc,
      price: total
    };
    cart.push(cartItem);
    renderCart();
  });
}

/**
 * Render usług (dla pozostałych kategorii)
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
        const cartItem = {
          name: category.name,
          details: srv.label,
          price: srv.price
        };
        cart.push(cartItem);
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
 * Rysuje koszyk
 */
function renderCart() {
  const cartSection = document.getElementById('cartSection');
  const tbody = document.querySelector('#cartTable tbody');
  const totalEl = document.getElementById('cartTotal');

  if (cart.length === 0) {
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
 * Inicjalizacja tooltipów (Bootstrap)
 */
function initTooltips() {
  const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
  tooltipTriggerList.map(el => new bootstrap.Tooltip(el));
}
