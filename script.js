function renderIaaS(category, plansBody) {
  // 1) Nagłówek "Maszyny wirtualne"
  const headerTr = document.createElement('tr');
  headerTr.innerHTML = `
    <td colspan="3">
      <h5 class="mb-3">Maszyny wirtualne (IaaS)</h5>
    </td>
  `;
  plansBody.appendChild(headerTr);

  // 2) Wiersz: suwaki CPU/RAM/SSD, Backup, IP, + cena
  const contentTr = document.createElement('tr');
  contentTr.innerHTML = `
    <td>
      <div class="mb-2">
        <label class="form-label me-2">CPU (vCore): <span id="cpuValue">1</span></label>
        <input type="range" id="cpuSlider" min="${category.sliders[0].min}" max="${category.sliders[0].max}" step="${category.sliders[0].step}" value="${category.sliders[0].min}" style="width:150px;">
      </div>
      <div class="mb-2">
        <label class="form-label me-2">RAM (GB): <span id="ramValue">${category.sliders[1].min}</span></label>
        <input type="range" id="ramSlider" min="${category.sliders[1].min}" max="${category.sliders[1].max}" step="${category.sliders[1].step}" value="${category.sliders[1].min}" style="width:150px;">
      </div>
      <div class="mb-2">
        <label class="form-label me-2">SSD (GB): <span id="ssdValue">${category.sliders[2].min}</span></label>
        <input type="range" id="ssdSlider" min="${category.sliders[2].min}" max="${category.sliders[2].max}" step="${category.sliders[2].step}" value="${category.sliders[2].min}" style="width:150px;">
      </div>

      <!-- Kopie zapasowe -->
      <div class="mb-2">
        <label class="form-label me-2">
          Kopie zapasowe (GB)
          <i class="bi bi-info-circle text-muted ms-1"
             data-bs-toggle="tooltip"
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

  // Eventy suwaków i inputów
  const cpuSlider = contentTr.querySelector('#cpuSlider');
  const ramSlider = contentTr.querySelector('#ramSlider');
  const ssdSlider = contentTr.querySelector('#ssdSlider');
  const backupGB = contentTr.querySelector('#backupGB');
  const publicIP = contentTr.querySelector('#publicIP');

  function updateIaaSPrice() {
    let total = 0;
    const cpuVal = parseInt(cpuSlider.value, 10);
    const ramVal = parseInt(ramSlider.value, 10);
    const ssdVal = parseInt(ssdSlider.value, 10);
    const backupVal = parseFloat(backupGB.value) || 0;

    // CPU
    total += cpuVal * category.sliders[0].pricePerUnit;
    // RAM
    total += ramVal * category.sliders[1].pricePerUnit;
    // SSD
    total += ssdVal * category.sliders[2].pricePerUnit;

    // Kopie zapasowe
    if (backupVal > 0 && category.backupPricePerGB) {
      total += backupVal * category.backupPricePerGB;
    }
    // Public IP
    if (publicIP.checked && category.publicIPPrice) {
      total += category.publicIPPrice;
    }

    contentTr.querySelector('#cpuValue').textContent = cpuVal;
    contentTr.querySelector('#ramValue').textContent = ramVal;
    contentTr.querySelector('#ssdValue').textContent = ssdVal;

    contentTr.querySelector('#iaasPrice').textContent = total.toFixed(2);
  }

  // Nasłuchiwanie zmian
  cpuSlider.addEventListener('input', updateIaaSPrice);
  ramSlider.addEventListener('input', updateIaaSPrice);
  ssdSlider.addEventListener('input', updateIaaSPrice);
  backupGB.addEventListener('input', updateIaaSPrice);
  publicIP.addEventListener('change', updateIaaSPrice);
  updateIaaSPrice();

  // Dodawanie do koszyka
  const btnAdd = contentTr.querySelector('#btnAddIaas');
  btnAdd.addEventListener('click', () => {
    let total = parseFloat(contentTr.querySelector('#iaasPrice').textContent) || 0;
    const cpuVal = parseInt(cpuSlider.value, 10);
    const ramVal = parseInt(ramSlider.value, 10);
    const ssdVal = parseInt(ssdSlider.value, 10);
    const backupVal = parseFloat(backupGB.value) || 0;
    const publicChecked = publicIP.checked;

    let desc = `CPU=${cpuVal}, RAM=${ramVal}GB, SSD=${ssdVal}GB`;
    if (backupVal > 0) desc += `, Backup=${backupVal}GB`;
    if (publicChecked) desc += `, +PublicIP`;

    cart.push({
      name: category.name,
      details: desc,
      price: total
    });
    renderCart();
  });
}

/**
 * Sekcja „Licencje Microsoft” (wewnątrz IaaS albo PaaS) 
 * bazuje na category.msSplaServices
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
    cart.push({
      name: `${category.name} (Licencje MS)`,
      details: `${label} x${qty}`,
      price: total
    });
    renderCart();
  });
}
