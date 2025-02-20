document.addEventListener('DOMContentLoaded', () => {
  // W tym przykładzie nie pobieramy pliku data.json (chyba że chcesz dynamicznie).
  // Możemy na sztywno ustawić różne plany w obiektach i wypełniać tabelę.

  const tableBody = document.querySelector('.packages-table tbody');

  // Definiujemy trzy warianty planów
  const plansRegular = [
    { memory: '512 MiB', vcpu: '1 vCPU', transfer: '500 GiB', ssd: '10 GiB', hr: '$0.00595', mo: '$4.00' },
    { memory: '1 GiB',   vcpu: '1 vCPU', transfer: '1000 GiB', ssd: '25 GiB', hr: '$0.00893', mo: '$6.00' },
    { memory: '2 GiB',   vcpu: '1 vCPU', transfer: '2000 GiB', ssd: '50 GiB', hr: '$0.01786', mo: '$12.00' },
    { memory: '2 GiB',   vcpu: '2 vCPUs', transfer: '3000 GiB', ssd: '60 GiB', hr: '$0.02679', mo: '$18.00' },
  ];
  const plansPremiumIntel = [
    { memory: '2 GiB',   vcpu: '1 vCPU (Intel)', transfer: '2000 GiB', ssd: '50 GiB', hr: '$0.02',   mo: '$14.00' },
    { memory: '4 GiB',   vcpu: '2 vCPUs (Intel)', transfer: '3000 GiB', ssd: '80 GiB', hr: '$0.04',   mo: '$28.00' },
  ];
  const plansPremiumAMD = [
    { memory: '2 GiB',   vcpu: '1 vCPU (AMD)', transfer: '2000 GiB', ssd: '50 GiB', hr: '$0.018',   mo: '$13.00' },
    { memory: '4 GiB',   vcpu: '2 vCPUs (AMD)', transfer: '3000 GiB', ssd: '80 GiB', hr: '$0.036',   mo: '$26.00' },
  ];

  // Funkcja do renderowania planów w tabeli
  function renderPlans(plans) {
    tableBody.innerHTML = '';
    plans.forEach(plan => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${plan.memory}</td>
        <td>${plan.vcpu}</td>
        <td>${plan.transfer}</td>
        <td>${plan.ssd}</td>
        <td>${plan.hr}</td>
        <td>${plan.mo}</td>
        <td><button class="btn btn-outline-primary">→</button></td>
      `;
      tableBody.appendChild(tr);
    });
  }

  // Na starcie - ładujemy "Regular"
  renderPlans(plansRegular);

  // Obsługa kliknięcia w radio
  document.getElementById('cpuRegular').addEventListener('change', () => {
    renderPlans(plansRegular);
  });
  document.getElementById('cpuPremiumIntel').addEventListener('change', () => {
    renderPlans(plansPremiumIntel);
  });
  document.getElementById('cpuPremiumAMD').addEventListener('change', () => {
    renderPlans(plansPremiumAMD);
  });
});
