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

/**
 * Menu kategorii
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
 * Po kliknięciu w kategorię
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
    renderIaaS(category, plansBody);
    renderMsLicSection(category, plansBody);
  }
  else if (category.type === 'paas') {
    renderPaaSMachinesSection(category, plansBody);
    renderMsLicSection(category, plansBody);
    renderPaaSDisasterRecoverySection(category, plansBody);
  }
  else if (category.type === 'saas') {
    renderSaaS(category, plansBody);
  }
  else {
    // SaaS, Acronis, CSP
    renderServicesList(category, plansBody);
  }

  initTooltips();
}

/**
 * ----- IaaS, PaaS, MsLic i DR to to samo co poprzednio -----
 * (funkcje: renderIaaS, renderMsLicSection, renderPaaSMachinesSection, etc.)
 * TU SKUPIAMY SIĘ NA NOWEJ FUNKCJI renderSaaS
 */

/**
 * Render sekcji SaaS:
 * 1) Aplikacje (SQL, Enova, Terminal, etc.)
 * 2) Licencje Microsoft
 */
function renderSaaS(category, plansBody) {
  // Sekcja Aplikacje
  renderSaaSApplications(category, plansBody);
  // Sekcja Licencje Microsoft (jeśli jest w data)
  renderMsLicSection(category, plansBody);
}

/**
 * Sekcja Aplikacje w SaaS:
 * a) Baza danych MS SQL (select + opis)
 * b) Enova365Web (select + opis) + Harmonogram checkbox
 * c) Enova365Web API (select + opis)
 * d) Terminal w chmurze (# użytk., mandatory security)
 * e) Dodatkowe miejsce na dane (#)
 * + Przycisk "Dodaj do koszyka"
 */
function renderSaaSApplications(category, plansBody) {
  // Nagłówek
  const headerTr = document.createElement('tr');
  headerTr.innerHTML = `
    <td colspan="3">
      <h5 class="mb-3">Aplikacje (SaaS)</h5>
    </td>
  `;
  plansBody.appendChild(headerTr);

  // Główny wiersz
  const contentTr = document.createElement('tr');
  contentTr.innerHTML = `
    <td>
      <!-- A) Baza danych Microsoft SQL -->
      <div class="mb-3">
        <label class="form-label fw-bold">Baza danych Microsoft SQL</label><br/>
        <select id="saasMsSqlSelect" class="form-select d-inline-block" style="width:auto; min-width:200px;">
          <option value="" disabled selected>-- wybierz --</option>
        </select>
        <div id="saasMsSqlDesc" class="text-muted mt-1" style="font-size:0.85rem;"></div>
      </div>

      <!-- B) Enova365Web + Harmonogram -->
      <div class="mb-3">
        <label class="form-label fw-bold">Enova365Web</label><br/>
        <select id="enovaWebSelect" class="form-select d-inline-block" style="width:auto; min-width:200px;">
          <option value="" disabled selected>-- wybierz --</option>
        </select>
        <div id="enovaWebDesc" class="text-muted mt-1" style="font-size:0.85rem;"></div>

        <div class="form-check mt-2">
          <input class="form-check-input" type="checkbox" id="enovaHarmony">
          <label class="form-check-label" for="enovaHarmony">
            Harmonogram zadań
          </label>
        </div>
      </div>

      <!-- C) Enova365Web API -->
      <div class="mb-3">
        <label class="form-label fw-bold">Enova365Web API</label><br/>
        <select id="enovaApiSelect" class="form-select d-inline-block" style="width:auto; min-width:200px;">
          <option value="" disabled selected>-- wybierz --</option>
        </select>
        <div id="enovaApiDesc" class="text-muted mt-1" style="font-size:0.85rem;"></div>
      </div>

      <!-- D) Terminal w chmurze -->
      <div class="mb-3">
        <label class="form-label fw-bold">
          Terminal w chmurze
          <i class="bi bi-info-circle text-muted ms-1"
             data-bs-toggle="tooltip"
             title="Podaj liczbę użytkowników terminala.">
          </i>
        </label><br/>
        <input type="number" id="terminalUsers" min="0" value="0" style="width:80px;" class="form-control d-inline-block">

        <div class="form-check mt-2">
          <input class="form-check-input" type="checkbox" id="terminalSecurity">
          <label class="form-check-label" for="terminalSecurity">
            Zabezpieczenie terminala przed atakami
          </label>
        </div>
      </div>

      <!-- E) Dodatkowe miejsce na dane -->
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

  // Referencje do elementów
  const msSqlSelect = contentTr.querySelector('#saasMsSqlSelect');
  const msSqlDescEl = contentTr.querySelector('#saasMsSqlDesc');

  const enovaWebSelect = contentTr.querySelector('#enovaWebSelect');
  const enovaWebDescEl = contentTr.querySelector('#enovaWebDesc');
  const enovaHarmonyCheck = contentTr.querySelector('#enovaHarmony');

  const enovaApiSelect = contentTr.querySelector('#enovaApiSelect');
  const enovaApiDescEl = contentTr.querySelector('#enovaApiDesc');

  const terminalUsers = contentTr.querySelector('#terminalUsers');
  const terminalSecurity = contentTr.querySelector('#terminalSecurity');

  const extraDataInput = contentTr.querySelector('#extraData');

  const priceEl = contentTr.querySelector('#saasAppsPrice');
  const addBtn = contentTr.querySelector('#btnAddSaasApps');

  // Wypełniamy selecty
  // 1) msSqlDbOptions
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
  // 2) enovaWebOptions
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
  // 3) enovaWebApiOptions
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

  // Funkcje do uzupełniania opisów
  function updateMsSqlDesc() {
    if (!msSqlSelect.value) {
      msSqlDescEl.textContent = "";
      return;
    }
    const selOpt = msSqlSelect.options[msSqlSelect.selectedIndex];
    msSqlDescEl.textContent = selOpt.getAttribute('data-desc') || "";
  }
  function updateEnovaWebDesc() {
    if (!enovaWebSelect.value) {
      enovaWebDescEl.textContent = "";
      return;
    }
    const selOpt = enovaWebSelect.options[enovaWebSelect.selectedIndex];
    enovaWebDescEl.textContent = selOpt.getAttribute('data-desc') || "";
  }
  function updateEnovaApiDesc() {
    if (!enovaApiSelect.value) {
      enovaApiDescEl.textContent = "";
      return;
    }
    const selOpt = enovaApiSelect.options[enovaApiSelect.selectedIndex];
    enovaApiDescEl.textContent = selOpt.getAttribute('data-desc') || "";
  }

  // Obliczanie ceny
  function updateSaasAppsPrice() {
    let total = 0;

    // msSQL
    const msSqlPrice = parseFloat(msSqlSelect.value) || 0;
    total += msSqlPrice;

    // enovaWeb
    const enovaWebPrice = parseFloat(enovaWebSelect.value) || 0;
    total += enovaWebPrice;
    // "Harmonogram zadań" – nie wskazałeś ceny, załóżmy 0 PLN

    // enovaWeb API
    const enovaApiPrice = parseFloat(enovaApiSelect.value) || 0;
    total += enovaApiPrice;

    // Terminal
    const termUsers = parseInt(terminalUsers.value, 10) || 0;
    if (termUsers > 0) {
      // załóżmy, że price: category.terminalPricePerUser
      total += termUsers * (category.terminalPricePerUser || 0);
    }
    // "Zabezpieczenie terminala" – nie ma ceny w Twoim opisie, załóżmy 0

    // Dodatkowe miejsce na dane
    const extraDataVal = parseInt(extraDataInput.value, 10) || 0;
    if (extraDataVal > 0) {
      total += extraDataVal * (category.extraDataStoragePrice || 0);
    }

    priceEl.textContent = total.toFixed(2);
  }

  // Obsługa eventów
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
  terminalUsers.addEventListener('input', updateSaasAppsPrice);
  terminalSecurity.addEventListener('change', updateSaasAppsPrice);
  extraDataInput.addEventListener('input', updateSaasAppsPrice);

  // Inicjalizacja
  updateMsSqlDesc();
  updateEnovaWebDesc();
  updateEnovaApiDesc();
  updateSaasAppsPrice();

  // Dodaj do koszyka
  addBtn.addEventListener('click', () => {
    const total = parseFloat(priceEl.textContent) || 0;

    // Walidacje
    // 1) Terminal - jeżeli #user > 0, to security MUSI być zaznaczone
    const termUsers = parseInt(terminalUsers.value, 10) || 0;
    if (termUsers > 0 && !terminalSecurity.checked) {
      alert("Włącz 'Zabezpieczenie terminala' przy dodatnich użytkownikach terminala!");
      return;
    }

    // Budujemy opis
    let descArr = [];

    // msSQL
    if (msSqlSelect.value) {
      const selOpt = msSqlSelect.options[msSqlSelect.selectedIndex];
      const label = selOpt.getAttribute('data-label');
      descArr.push(`SQL=${label}`);
    }
    // enovaWeb
    if (enovaWebSelect.value) {
      const selOpt = enovaWebSelect.options[enovaWebSelect.selectedIndex];
      const label = selOpt.getAttribute('data-label');
      descArr.push(`Enova=${label}`);
      if (enovaHarmonyCheck.checked) {
        descArr.push(`+Harmonogram`);
      }
    }
    // enovaWebAPI
    if (enovaApiSelect.value) {
      const selOpt = enovaApiSelect.options[enovaApiSelect.selectedIndex];
      const label = selOpt.getAttribute('data-label');
      descArr.push(`EnovaAPI=${label}`);
    }

    // Terminal
    if (termUsers > 0) {
      descArr.push(`TerminalUsers=${termUsers}`);
      if (terminalSecurity.checked) {
        descArr.push(`Zabezp.Terminal=Yes`);
      }
    }

    // Extra Data
    const extraVal = parseInt(extraDataInput.value, 10) || 0;
    if (extraVal > 0) {
      descArr.push(`ExtraData=${extraVal} szt.`);
    }

    if (descArr.length === 0) {
      alert("Nie wybrano żadnych aplikacji w SaaS!");
      return;
    }

    // Dodaj do koszyka
    cart.push({
      name: category.name + " (Aplikacje)",
      details: descArr.join(", "),
      price: total
    });
    renderCart();
  });
}

/**
 * Sekcja MsLic (IaaS/PaaS/SaaS)
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
      name: category.name + " (Licencje MS)",
      details: `${label} x${qty}`,
      price: total
    });
    renderCart();
  });
}

/**
 * Inne kategorie (Acronis, CSP) - standard
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
 * Tooltipy (Bootstrap 5)
 */
function initTooltips() {
  const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
  tooltipTriggerList.map(el => new bootstrap.Tooltip(el));
}
