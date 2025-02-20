let categoriesData = [];
let cart = []; // koszyk

console.log("Skrypt działa - test");

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
 * Po kliknięciu w kategorię (index) - aktualizujemy tytuł i generujemy tabelę
 */
function selectCategory(catIndex) {
  const category = categoriesData[catIndex];

  const titleEl = document.getElementById('categoryTitle');
  const descEl = document.getElementById('categoryDesc');
  const plansWrapper = document.getElementById('plansTableWrapper');
  const plansBody = document.getElementById('plansTableBody');

  // Ustawiamy tytuł i opis
  titleEl.textContent = category.name;
  descEl.textContent = `Opcje dostępne w kategorii: ${category.name}.`;

  // Pokaż tabelę
  plansWrapper.style.display = 'block';
  // Czyścimy poprzednie wiersze
  plansBody.innerHTML = '';

  // Sprawdzamy typ (IaaS czy inne)
  if (category.type === 'iaas') {
    // Renderujemy wiersz z suwakami, dropdown, checkboxem itd.
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>
        <!-- SUWAKI -->
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

        <!-- DROPDOWN OS -->
        <div class="mb-2">
          <label class="form-label me-2">System:</label>
          <select id="osSelect" class="form-select d-inline-block" style="width:auto;">
          </select>
        </div>

        <!-- CHECKBOX SUPPORT -->
        <div class="form-check">
          <input class="form-check-input" type="checkbox" value="support" id="supportCheckbox">
          <label class="form-check-label" for="supportCheckbox">
            Managed Support (+15 PLN)
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

    plansBody.appendChild(tr);

    // Uzupełniamy dropdown OS
    const osSelect = tr.querySelector('#osSelect');
    category.addons.forEach(addon => {
      const option = document.createElement('option');
      option.value = addon.id;
      option.textContent = `${addon.label} (+${addon.price} PLN)`;
      osSelect.appendChild(option);
    });

    // Eventy suwaków + checkbox + select
    const cpuSlider = tr.querySelector('#cpuSlider');
    const ramSlider = tr.querySelector('#ramSlider');
    const ssdSlider = tr.querySelector('#ssdSlider');
    const supportCheckbox = tr.querySelector('#supportCheckbox');

    cpuSlider.addEventListener('input', () => {
      tr.querySelector('#cpuValue').textContent = cpuSlider.value;
      updateIaaSPrice(category, tr);
    });
    ramSlider.addEventListener('input', () => {
      tr.querySelector('#ramValue').textContent = ramSlider.value;
      updateIaaSPrice(category, tr);
    });
    ssdSlider.addEventListener('input', () => {
      tr.querySelector('#ssdValue').textContent = ssdSlider.value;
      updateIaaSPrice(category, tr);
    });
    osSelect.addEventListener('change', () => {
      updateIaaSPrice(category, tr);
    });
    supportCheckbox.addEventListener('change', () => {
      updateIaaSPrice(category, tr);
    });

    // Pierwsze wywołanie
    updateIaaSPrice(category, tr);

    // Obsługa przycisku "Dodaj do koszyka"
    const addBtn = tr.querySelector('#btnAddIaas');
    addBtn.addEventListener('click', () => {
      addIaaSConfigToCart(category, tr);
    });

  } else {
    // Inne kategorie - "services"
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
          addServiceToCart(category, srv);
        });
        plansBody.appendChild(tr);
      });
    } else {
      // Brak services
      const tr = document.createElement('tr');
      tr.innerHTML = `<td colspan="3">Brak usług w tej kategorii.</td>`;
      plansBody.appendChild(tr);
    }
  }
}

/**
 * Funkcja przelicza cenę w IaaS przy każdej zmianie suwaka / dropdown / checkbox
 */
function updateIaaSPrice(category, container) {
  // Pobierz suwak i inne elementy
  const cpuVal = parseInt(container.querySelector('#cpuSlider').value, 10);
  const ramVal = parseInt(container.querySelector('#ramSlider').value, 10);
  const ssdVal = parseInt(container.querySelector('#ssdSlider').value, 10);
  const osId = container.querySelector('#osSelect').value;
  const supportChecked = container.querySelector('#supportCheckbox').checked;

  let total = 0;

  // Znajdź definicje sliderów i dodaj do total
  category.sliders.forEach(sl => {
    if (sl.id === 'cpu') {
      total += cpuVal * sl.pricePerUnit;
    } else if (sl.id === 'ram') {
      total += ramVal * sl.pricePerUnit;
    } else if (sl.id === 'storage') {
      total += ssdVal * sl.pricePerUnit;
    }
  });

  // OS
  if (category.addons) {
    const chosenOs = category.addons.find(a => a.id === osId);
    if (chosenOs) {
      total += chosenOs.price;
    }
  }

  // Support?
  if (supportChecked) {
    // Powiedzmy, że jest na sztywno 15 PLN
    total += 15;
  }

  // Wyświetl wynik
  const priceEl = container.querySelector('#iaasPrice');
  priceEl.textContent = total.toFixed(2);
}

/**
 * Dodaje wybraną konfigurację IaaS do koszyka
 */
function addIaaSConfigToCart(category, container) {
  const cpuVal = parseInt(container.querySelector('#cpuSlider').value, 10);
  const ramVal = parseInt(container.querySelector('#ramSlider').value, 10);
  const ssdVal = parseInt(container.querySelector('#ssdSlider').value, 10);
  const osId = container.querySelector('#osSelect').value;
  const supportChecked = container.querySelector('#supportCheckbox').checked;

  // Obliczamy cenę jeszcze raz
  let total = 0;
  category.sliders.forEach(sl => {
    if (sl.id === 'cpu') {
      total += cpuVal * sl.pricePerUnit;
    } else if (sl.id === 'ram') {
      total += ramVal * sl.pricePerUnit;
    } else if (sl.id === 'storage') {
      total += ssdVal * sl.pricePerUnit;
    }
  });
  let chosenOsLabel = '';
  if (category.addons) {
    const chosenOs = category.addons.find(a => a.id === osId);
    if (chosenOs) {
      total += chosenOs.price;
      chosenOsLabel = chosenOs.label;
    }
  }
  if (supportChecked) {
    total += 15; 
  }

  // Opis
  let desc = `CPU=${cpuVal}, RAM=${ramVal}, SSD=${ssdVal} GB, OS=${chosenOsLabel || 'Brak'}, `;
  if (supportChecked) {
    desc += `Support=Yes`;
  } else {
    desc += `Support=No`;
  }

  // Tworzymy obiekt koszyka
  const cartItem = {
    name: category.name,
    details: desc,
    price: total
  };
  cart.push(cartItem);
  renderCart();
}

/**
 * Dodaje usługę (PaaS, SaaS, itp.) do koszyka
 */
function addServiceToCart(category, srv) {
  const cartItem = {
    name: category.name,
    details: srv.label,
    price: srv.price
  };
  cart.push(cartItem);
  renderCart();
}

/**
 * Renderuje koszyk
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

