let categoriesData = [];

/**
 * Funkcja pobierająca dane z data.json
 */
function loadData() {
  fetch('data.json')
    .then(response => response.json())
    .then(data => {
      categoriesData = data.categories; 
      createAccordionContent(categoriesData);
      calculateTotal();
    })
    .catch(error => console.error('Błąd wczytywania pliku JSON:', error));
}

/**
 * Generuje HTML akordeonu dla każdej kategorii.
 * Dla każdej kategorii tworzymy:
 *  - Sekcję akordeonową
 *  - Wewnątrz sekcji karty (dla uproszczenia: jedną kartę z kilkoma polami)
 */
function createAccordionContent(categories) {
  const accordionContainer = document.getElementById('categoriesAccordion');
  accordionContainer.innerHTML = ''; // wyczyszczenie zawartości

  categories.forEach((category, index) => {
    // ID potrzebne do mechanizmu akordeonu
    const headingId = `heading-${index}`;
    const collapseId = `collapse-${index}`;

    // Tworzymy element akordeonowy
    const accordionItem = document.createElement('div');
    accordionItem.classList.add('accordion-item');

    // Nagłówek akordeonu
    accordionItem.innerHTML = `
      <h2 class="accordion-header" id="${headingId}">
        <button class="accordion-button ${index === 0 ? '' : 'collapsed'}" type="button"
          data-bs-toggle="collapse"
          data-bs-target="#${collapseId}"
          aria-expanded="${index === 0 ? 'true' : 'false'}"
          aria-controls="${collapseId}">
          ${category.name}
        </button>
      </h2>
      <div id="${collapseId}" class="accordion-collapse collapse ${index === 0 ? 'show' : ''}"
        aria-labelledby="${headingId}"
        data-bs-parent="#categoriesAccordion">
        <div class="accordion-body">
          <!-- Tu wstawimy dynamicznie pola dla każdej usługi w kategorii -->
          <div class="row" id="category-content-${index}">
          </div>
        </div>
      </div>
    `;

    accordionContainer.appendChild(accordionItem);

    // Teraz dla tej kategorii (IaaS, PaaS itd.) generujemy pola
    const categoryContent = document.getElementById(`category-content-${index}`);

    category.items.forEach(item => {
      // Wstawiamy do categoryContent "kartę" z danym polem (slider lub list)
      const col = document.createElement('div');
      col.classList.add('col-12', 'col-md-6', 'mb-3');

      // Przygotujmy dynamicznie element (HTML) w zależności od typu
      let fieldHTML = '';

      if (item.type === 'slider') {
        // Suwak: tworzymy range + label
        fieldHTML = `
          <div class="card">
            <div class="card-body">
              <label for="${item.id}" class="form-label">
                <strong>${item.label}</strong>: 
                <span id="${item.id}-value">0</span>
              </label>
              <input type="range" 
                     class="form-range" 
                     id="${item.id}" 
                     min="${item.min}" 
                     max="${item.max}" 
                     step="${item.step}" 
                     value="${item.min}"
                     data-priceperunit="${item.pricePerUnit}"
                     data-fieldtype="slider"
                     data-category="${category.name}">

              <!-- Dodatkowe info o cenie jednostkowej -->
              <small class="text-muted">
                Cena za 1 szt.: ${item.pricePerUnit} PLN
              </small>
            </div>
          </div>
        `;
      } else if (item.type === 'list') {
        // Lista (select)
        // Tworzymy <select> z <option> dla każdej opcji
        let optionsHTML = '';
        item.options.forEach((opt, idx) => {
          optionsHTML += `
            <option value="${opt.price}">
              ${opt.label} (${opt.price} PLN)
            </option>
          `;
        });

        fieldHTML = `
          <div class="card">
            <div class="card-body">
              <label for="${item.id}" class="form-label">
                <strong>${item.label}</strong>
              </label>
              <select class="form-select"
                      id="${item.id}"
                      data-fieldtype="list"
                      data-category="${category.name}">
                <option value="0" selected>-- wybierz opcję --</option>
                ${optionsHTML}
              </select>
            </div>
          </div>
        `;
      }

      col.innerHTML = fieldHTML;
      categoryContent.appendChild(col);
    });
  });

  // Po wygenerowaniu wszystkich pól, rejestrujemy eventListenery
  registerEventListeners();
}

/**
 * Rejestrujemy eventy (input/change) dla pól dynamicznie stworzonych
 */
function registerEventListeners() {
  // Wybieramy wszystkie inputy typu range
  const rangeInputs = document.querySelectorAll('input[type="range"]');
  rangeInputs.forEach(input => {
    input.addEventListener('input', (e) => {
      const valueSpan = document.getElementById(`${input.id}-value`);
      valueSpan.textContent = e.target.value;
      calculateTotal();
    });
    // Na start zaktualizuj label
    const valueSpan = document.getElementById(`${input.id}-value`);
    valueSpan.textContent = input.value;
  });

  // Wybieramy wszystkie selecty
  const selectInputs = document.querySelectorAll('select[data-fieldtype="list"]');
  selectInputs.forEach(select => {
    select.addEventListener('change', () => {
      calculateTotal();
    });
  });
}

/**
 * Główna funkcja obliczająca łączną cenę
 */
function calculateTotal() {
  let totalPrice = 0;

  // Przelatujemy po wszystkich polach (slidery)
  const rangeInputs = document.querySelectorAll('input[type="range"][data-fieldtype="slider"]');
  rangeInputs.forEach(range => {
    const count = parseFloat(range.value);
    const pricePerUnit = parseFloat(range.dataset.priceperunit) || 0;
    const cost = count * pricePerUnit;
    totalPrice += cost;
  });

  // Przelatujemy po wszystkich polach (select) 
  const selectInputs = document.querySelectorAll('select[data-fieldtype="list"]');
  selectInputs.forEach(select => {
    const selectedPrice = parseFloat(select.value) || 0;
    totalPrice += selectedPrice;
  });

  // Wyświetlamy wartość
  document.getElementById('totalPrice').textContent = totalPrice.toFixed(2);
}

// -------------- MAIN --------------
document.addEventListener('DOMContentLoaded', () => {
  loadData();
});
