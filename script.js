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
      // Obsługa kliknięcia w kategorię
      selectCategory(index);
      // oznacz link jako active
      document.querySelectorAll('#categoriesMenu a').forEach(a => a.classList.remove('active'));
      link.classList.add('active');
    });
    li.appendChild(link);
    menuUl.appendChild(li);
  });
}

/**
 * Wywoływane po kliknięciu w kategorię (index)
 */
function selectCategory(catIndex) {
  const category = categoriesData[catIndex];
  const titleEl = document.getElementById('categoryTitle');
  const descEl = document.getElementById('categoryDesc');
  const plansWrapper = document.getElementById('plansTableWrapper');
  const plansBody = document.getElementById('plansTableBody');

  // Ustawiamy tytuł
  titleEl.textContent = category.name;
  descEl.textContent = `Opcje dostępne w kategorii ${category.name}.`;

  // Pokażemy wrapper z tabelą
  plansWrapper.style.display = 'block';

  // Czyścimy dotychczasowe wiersze
  plansBody.innerHTML = '';

  // Sprawdzamy typ (iaas czy inne)
  if (category.type === 'iaas') {
    // Generujemy 1 wiersz z przyciskiem "Konfiguruj IaaS"
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>Skonfiguruj zasoby (CPU, RAM, SSD) + dodatki (Windows, Linux, Support)</td>
      <td>Dynamiczne</td>
      <td>
        <button class="btn btn-outline-primary btn-sm">
          Konfiguruj
        </button>
      </td>
    `;
    // Po kliknięciu w "Konfiguruj" -> otwieramy prompt (dla uproszczenia)
    const btn = tr.querySelector('button');
    btn.addEventListener('click', () => {
      configureIaaS(category);
    });
    plansBody.appendChild(tr);

  } else {
    // Mamy "services" - rysujemy je wierszami
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
 * Obsługa IaaS - proste prompty do CPU/RAM/SSD + checkboks do dodatków
 * (Wersja minimalna, w realu lepiej byłoby zrobić modal z suwakami).
 */
function configureIaaS(category) {
  const cpu = parseInt(prompt("CPU (vCore)?", "1"), 10) || 1;
  const ram = parseInt(prompt("RAM (GB)?", "2"), 10) || 2;
  const ssd = parseInt(prompt("SSD (GB)?", "50"), 10) || 50;

  // Oblicz cenę bazową z suwaków
  let total = 0;
  let desc = `IaaS: CPU=${cpu}, RAM=${ram}, SSD=${ssd} | `;

  // Znajdź definicje sliderów w JSON
  category.sliders.forEach(sl => {
    if (sl.id === 'cpu') {
      total += sl.pricePerUnit * cpu;
    } else if (sl.id === 'ram') {
      total += sl.pricePerUnit * ram;
    } else if (sl.id === 'storage') {
      total += sl.pricePerUnit * ssd;
    }
  });

  // Dodatki
  let chosenAddons = [];
  if (confirm("Dodać Windows OS License? (+10 PLN)")) {
    const addon = category.addons.find(a => a.id === 'win-os');
    if (addon) {
      chosenAddons.push(addon.label);
      total += addon.price;
    }
  }
  if (confirm("Dodać Linux OS License? (+5 PLN)")) {
    const addon = category.addons.find(a => a.id === 'lin-os');
    if (addon) {
      chosenAddons.push(addon.label);
      total += addon.price;
    }
  }
  if (confirm("Dodać Managed Support? (+15 PLN)")) {
    const addon = category.addons.find(a => a.id === 'support');
    if (addon) {
      chosenAddons.push(addon.label);
      total += addon.price;
    }
  }

  if (chosenAddons.length > 0) {
    desc += `Dodatki: ${chosenAddons.join(", ")}`;
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
 * Dodawanie usługi z PaaS/SaaS/Acronis do koszyka
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
 * Rysowanie zawartości koszyka
 */
function renderCart() {
  const cartSection = document.getElementById('cartSection');
  const tbody = document.querySelector('#cartTable tbody');
  const totalEl = document.getElementById('cartTotal');

  // Jeśli koszyk jest pusty, chowamy sekcję
  if (cart.length === 0) {
    cartSection.style.display = 'none';
    return;
  } else {
    cartSection.style.display = 'block';
  }

  // Czyścimy tabelę
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
