let categoriesData = [];
let currentCategory = null; // aktualnie wybrana kategoria
let cart = [];             // koszyk (tablica obiektów)

// Prosty log do konsoli - żeby sprawdzić, czy skrypt się wczytuje
console.log("Skrypt działa - test");

/**
 * Inicjacja - pobieramy data.json
 */
function init() {
  fetch("data.json")
    .then(response => response.json())
    .then(data => {
      categoriesData = data.categories;
      // Rysujemy menu
      renderCategoriesMenu();
    })
    .catch(err => console.error("Błąd wczytywania data.json:", err));
}

/**
 * Rysuje listę kategorii (menu po lewej)
 */
function renderCategoriesMenu() {
  const menuContainer = document.getElementById('categoriesMenu');
  menuContainer.innerHTML = '';

  categoriesData.forEach((cat) => {
    const btn = document.createElement('button');
    btn.classList.add('list-group-item', 'list-group-item-action');
    btn.textContent = cat.name;
    
    // Po kliknięciu: ustawiamy aktualną kategorię i renderujemy jej formularz
    btn.addEventListener('click', () => {
      currentCategory = cat;
      renderCategoryForm(cat);
    });
    
    menuContainer.appendChild(btn);
  });
}

/**
 * Renderuje (w prawej kolumnie) formularz odpowiedni dla danej kategorii
 */
function renderCategoryForm(category) {
  const formContainer = document.getElementById('categoryForm');
  formContainer.innerHTML = ''; // wyczyszczenie

  // Sprawdzamy typ kategorii
  if (category.type === 'iaas') {
    // Renderuj formularz IaaS
    formContainer.appendChild(renderIaaSForm(category));
  } else {
    // Renderuj "uniwersalną" listę usług do wyboru (PaaS, SaaS, itp.)
    formContainer.appendChild(renderServicesForm(category));
  }
}

/**
 * Tworzy element DOM z formularzem IaaS:
 * - Suwaki CPU, RAM, Storage
 * - Checkboksy z dodatkami (addons)
 * - Przycisk "Dodaj do wyceny"
 */
function renderIaaSForm(category) {
  const wrap = document.createElement('div');
  wrap.classList.add('card', 'p-3');

  let html = `<h5>${category.name} - konfiguracja</h5>`;

  // Rysujemy suwaki (CPU, RAM, SSD)
  if (category.sliders && category.sliders.length) {
    category.sliders.forEach(slider => {
      html += `
        <div class="mb-3">
          <label class="form-label">
            ${slider.label}: <span id="label-${slider.id}">${slider.min}</span>
          </label>
          <input type="range" 
                 class="form-range" 
                 id="${slider.id}"
                 min="${slider.min}" 
                 max="${slider.max}" 
                 step="${slider.step}"
                 value="${slider.min}"
                 data-price="${slider.pricePerUnit}" />
        </div>
      `;
    });
  }

  // Rysujemy sekcję dodatków
  if (category.addons && category.addons.length) {
    html += `<h6>Dodatkowe usługi:</h6>`;
    category.addons.forEach(addon => {
      html += `
        <div class="form-check">
          <input class="form-check-input" 
                 type="checkbox" 
                 value="${addon.price}" 
                 id="addon-${addon.id}" />
          <label class="form-check-label" for="addon-${addon.id}">
            ${addon.label} (+${addon.price} PLN)
          </label>
        </div>
      `;
    });
  }

  // Przycisk
  html += `
    <button class="btn btn-primary mt-3" id="btnAddIaas">
      Dodaj do wyceny
    </button>
  `;

  wrap.innerHTML = html;

  // Po wstawieniu do DOM - rejestrujemy eventy:
  // 1) Suwaki (aby wyświetlać aktualną wartość)
  if (category.sliders) {
    category.sliders.forEach(slider => {
      const inputEl = wrap.querySelector(`#${slider.id}`);
      const labelEl = wrap.querySelector(`#label-${slider.id}`);
      if (inputEl && labelEl) {
        inputEl.addEventListener('input', (e) => {
          labelEl.textContent = e.target.value;
        });
      }
    });
  }

  // 2) Przycisk "Dodaj do wyceny"
  const addBtn = wrap.querySelector('#btnAddIaas');
  addBtn.addEventListener('click', () => {
    addIaaSConfigToCart(category, wrap);
  });

  return wrap;
}

/**
 * Funkcja wywoływana po kliknięciu "Dodaj do wyceny" w sekcji IaaS
 */
function addIaaSConfigToCart(category, container) {
  let total = 0;
  let description = `${category.name}: `;

  // Zliczamy suwaki
  if (category.sliders) {
    category.sliders.forEach(slider => {
      const inputEl = container.querySelector(`#${slider.id}`);
      if (!inputEl) return;
      const count = parseFloat(inputEl.value);
      const pricePerUnit = parseFloat(inputEl.dataset.price) || 0;
      const cost = count * pricePerUnit;
      total += cost;
      description += `${slider.label} = ${count}, `;
    });
  }

  // Zliczamy dodatki (checkbox)
  let addonsDescription = [];
  if (category.addons) {
    category.addons.forEach(addon => {
      const addonEl = container.querySelector(`#addon-${addon.id}`);
      if (addonEl && addonEl.checked) {
        total += parseFloat(addonEl.value);
        addonsDescription.push(addon.label);
      }
    });
  }

  if (addonsDescription.length > 0) {
    description += `[Dodatki: ${addonsDescription.join(', ')}]`;
  }

  // Tworzymy obiekt pozycji w koszyku
  const cartItem = {
    name: category.name,
    details: description,
    price: total
  };

  cart.push(cartItem);
  renderCart();
}

/**
 * Renderuje formularz dla pozostałych kategorii (PaaS, SaaS, Acronis, itp.)
 */
function renderServicesForm(category) {
  const wrap = document.createElement('div');
  wrap.classList.add('card', 'p-3');

  let html = `<h5>${category.name} - wybór usług</h5>`;

  // Select z usługami
  html += `
    <div class="mb-3">
      <label class="form-label">Usługa:</label>
      <select class="form-select" id="serviceSelect">
        <option value="0" selected disabled>-- Wybierz usługę --</option>
  `;
  if (category.services) {
    category.services.forEach((srv) => {
      html += `
        <option value="${srv.price}" data-label="${srv.label}">
          ${srv.label} (${srv.price} PLN)
        </option>
      `;
    });
  }
  html += `</select></div>`;

  // Ilość
  html += `
    <div class="mb-3">
      <label class="form-label">Ilość:</label>
      <input type="number" class="form-control" id="serviceQty" value="1" min="1" />
    </div>
  `;

  // Przycisk dodawania
  html += `
    <button class="btn btn-primary" id="btnAddService">
      Dodaj do wyceny
    </button>
  `;

  wrap.innerHTML = html;

  // Rejestracja eventu
  const addBtn = wrap.querySelector('#btnAddService');
  addBtn.addEventListener('click', () => {
    addServiceToCart(category, wrap);
  });

  return wrap;
}

/**
 * Dodaje wybraną usługę z danej kategorii do koszyka
 */
function addServiceToCart(category, container) {
  const selectEl = container.querySelector('#serviceSelect');
  const qtyEl = container.querySelector('#serviceQty');

  if (!selectEl.value || selectEl.value === '0') {
    alert('Wybierz usługę!');
    return;
  }

  const price = parseFloat(selectEl.value);
  const label = selectEl.options[selectEl.selectedIndex].dataset.label;
  const qty = parseInt(qtyEl.value, 10) || 1;

  const total = price * qty;

  const cartItem = {
    name: category.name,
    details: `${label} x ${qty}`,
    price: total
  };

  cart.push(cartItem);
  renderCart();
}

/**
 * Renderuje tabelę koszyka
 */
function renderCart() {
  const tbody = document.querySelector('#cartTable tbody');
  tbody.innerHTML = '';

  let sum = 0;

  cart.forEach((item, index) => {
    sum += item.price;

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${item.name}</td>
      <td>${item.details}</td>
      <td>${item.price.toFixed(2)}</td>
      <td><button class="btn btn-sm btn-danger" data-index="${index}">X</button></td>
    `;
    tbody.appendChild(tr);
  });

  // Obsługa usunięcia
  tbody.querySelectorAll('button.btn-danger').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = parseInt(btn.dataset.index, 10);
      cart.splice(idx, 1);
      renderCart();
    });
  });

  // Suma
  document.getElementById('cartTotal').textContent = sum.toFixed(2);
}

// Główna inicjacja
document.addEventListener('DOMContentLoaded', init);
