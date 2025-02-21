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
 * Rysujemy w #categoriesMenu listę <li> z linkami do kategorii
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
      // Wybieramy kategorię
      selectCategory(index);
      // Podświetlenie "active"
      document.querySelectorAll('#categoriesMenu a').forEach(a => a.classList.remove('active'));
      link.classList.add('active');
    });

    li.appendChild(link);
    menuUl.appendChild(li);
  });
}

/**
 * Po kliknięciu w kategorię (index) - pokazujemy odpowiednią tabelę
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

  // Sprawdzamy typ
  if (category.type === 'iaas') {
    // Dwie sekcje
    renderIaaSMachinesSection(category, plansBody);
    renderMicrosoftLicSection(category, plansBody);
  } else {
    // Inne kategorie
    renderServicesList(category, plansBody);
  }

  // Po dynamicznym dodaniu elementów - włącz tooltips
  initTooltips();
}

/**
 * Sekcja (A) "Maszyny wirtualne" w IaaS
 */
function renderIaaSMachinesSection(category, plansBody) {
  // Nagłówek
  const headerTr = document.createElement('tr');
  headerTr.innerHTML = `
    <td colspan="3">
      <h5 class="mb-3">Maszyny wirtualne</h5>
    </td>
  `;
  plansBody.appendChild(headerTr);

  // Wiersz z suwakami + backup + IP
  const contentTr = document.createElement('tr');
  contentTr.innerHTML = `
    <td>
      <!-- Suwaki CPU/RAM/SSD -->
      <div class="mb-2">
        <label class="form-label me-2">CPU: <span id="cpuValue">1</span></label>
        <input type="range" min="${category.sliders[0].min}" max="${category.sliders[0].max}" step="${category.sliders[0].step}" value="${category.sliders[0].min}" id="cpuSlider" style="width:150px;">
      </div>
      <div class="mb-2">
        <label class="form-label me-2">RAM (GB): <span id="ramValue">${category.sliders[1].min}</span></label>
        <input type="range" min="${category.sliders[1].min}" max="${category.sliders[1].max}" step="${category.sliders[1].step}" value="${category.sliders[1].min}" id="ramSlider" style="width:150px;">
      </div>
      <div class="mb-2">
        <label class="form-label me-2">SSD (GB): <span id="ssdValue">${category.sliders[2].min}</span></label>
        <input type="range" min="${category.sliders[2].min}" max="${category.sliders[2].max}" step="${category.sliders[2].step}" value="${category.sliders[2].min}" id="ssdSlider" style="width:150px;">
      </div>

      <!-- Kopie zapasowe (GB) -->
      <div class="mb-2">
        <label class="form-label me-2">
          Kopie zapasowe (GB)
          <i class="bi bi-info-circle text-muted ms-1"
             data-bs-toggle="tooltip" 
             title="Rozmiar kopii powinien zbliżony być do rozmiaru VM.">
          </i>
        </label>
        <input type="number" min="0" value="0" id="backupGB" style="width:80px;" class="form-control d-inline-block">
      </div>

      <!-- Public IP (checkbox) -->
      <div class="form-check">
        <input class="form-check-input" type="checkbox" value="" id="publicIP">
        <label class="form-check-label" for="publicIP">
          Dodatkowe publiczne IP
          <i class="bi bi-info-circle text-muted ms-1"
             data-bs-toggle="tooltip" 
             title="Jeśli VM wymaga osobnego IP.">
          </i>
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
  const publicIPcheck = contentTr.querySelector('#publicIP');

  cpuSlider.addEventListener('input', () => {
    contentTr.querySelector('#cpuValue').textContent = cpuSlider.value;
    updateIaaSPrice(category, contentTr);
  });
  ramSlider.addEventListener('input', () => {
    contentTr.querySelector('#ramValue').textContent = ramSlider.value;
    updateIaaSPrice(category, contentTr);
  });
  ssdSlider.addEventListener('input', () => {
    contentTr.querySelector('#ssdValue').textContent = ssdSlider.value;
    updateIaaSPrice(category, contentTr);
  });
  backupInput.addEventListener('input', () => {
    updateIaaSPrice(category, contentTr);
  });
  publicIPcheck.addEventListener('change', () => {
    updateIaaSPrice(category, contentTr);
  });

  // Pierwsze wywołanie
  updateIaaSPrice(category, contentTr);

  // Dodawanie do koszyka
  const addBtn = contentTr.querySelector('#btnAddIaas');
  addBtn.addEventListener('click', () => {
    addIaaSConfigToCart(category, contentTr);
  });
}

/**
 * Funkcja licząca cenę IaaS
 */
function updateIaaSPrice(category, container) {
  const cpuVal = parseInt(container.querySelector('#cpuSlider').value, 10);
  const ramVal = parseInt(container.querySelector('#ramSlider').value, 10);
  const ssdVal = parseInt(container.querySelector('#ssdSlider').value, 10);
  const backupGB = parseFloat(container.querySelector('#backupGB').value) || 0;
  const publicIPchecked = container.querySelector('#publicIP').checked;

  let total = 0;

  // CPU
  total += cpuVal * category.sliders[0].pricePerUnit;
  // RAM
  total += ramVal * category.sliders[1].pricePerUnit;
  // SSD
  total += ssdVal * category.sliders[2].pricePerUnit;

  // Backup
  if (category.backupPricePerGB && backupGB > 0) {
    total += backupGB * category.backupPricePerGB;
  }
  // Public IP
  if (publicIPchecked && category.publicIPPrice) {
    total += category.publicIPPrice;
  }

  container.querySelector('#iaasPrice').textContent = total.toFixed(2);
}

/**
 * Dodawanie IaaS do koszyka
 */
function addIaaSConfigToCart(category, container) {
  const cpuVal = parseInt(container.querySelector('#cpuSlider').value, 10);
  const ramVal = parseInt(container.querySelector('#ramSlider').value, 10);
  const ssdVal = parseInt(container.querySelector('#ssdSlider').value, 10);
  const backupGB = parseFloat(container.querySelector('#backupGB').value) || 0;
  const publicIPchecked = container.querySelector('#publicIP').checked;

  let total = 0;
  total += cpuVal * category.sliders[0].pricePerUnit;
  total += ramVal * category.sliders[1].pricePerUnit;
  total += ssdVal * category.sliders[2].pricePerUnit;
  if (category.backupPricePerGB && backupGB > 0) {
    total += backupGB * category.backupPricePerGB;
  }
  if (publicIPchecked && category.publicIPPrice) {
    total += category.publicIPPrice;
  }

  let desc = `CPU=${cpuVal}, RAM=${ramVal}GB, SSD=${ssdVal}GB`;
  if (backupGB > 0) {
    desc += `, Backup=${backupGB}GB`;
  }
  if (publicIPchecked) {
    desc += `, +PublicIP`;
  }

  const cartItem = {
    name: category.name,
    details: desc,
    price: total
  };
  cart.push(cartItem);
  renderCart();
}

/**
 * Sekcja (B) "Licencje Microsoft" w IaaS
 * Dane pobieramy z category.msSplaServices
 */
function renderMicrosoftLicSection(category, plansBody) {
  if (!category.msSplaServices) return;

  // Nagłówek
  const headerTr = document.createElement('tr');
  headerTr.innerHTML = `
    <td colspan="3">
      <h5 class="mt-4 mb-3">Licencje Microsoft</h5>
    </td>
  `;
  plansBody.appendChild(headerTr);

  // Wiersz: select + ilość + cena + przycisk
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
      alert('Wybierz licencję Microsoft!');
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
 * Renderowanie usług w innych kategoriach (PaaS, SaaS, Acronis, CSP)
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
 * Rysowanie koszyka
 */
function renderCart() {
  const cartSection = document.getElementById('cartSection');
  const tbody = document.querySelector('#cartTable tbody');
  const totalEl = document.getElementById('cartTotal');

  if (cart.length === 0) {
    cartSection.style.display = 'none';
    return;
  } else {
    cartSection.style.display = 'block';
  }

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
