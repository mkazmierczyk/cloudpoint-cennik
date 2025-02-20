// Zmienna przechowująca dane o usługach
let servicesData = [];

// Funkcja obliczająca cenę na podstawie aktualnych wartości
function calculatePrice() {
  // Pobieramy wybrany indeks usługi
  const serviceSelect = document.getElementById('serviceSelect');
  const selectedIndex = serviceSelect.selectedIndex;

  // Pobieramy wartości suwaków
  const cpuSlider = document.getElementById('cpuSlider');
  const ramSlider = document.getElementById('ramSlider');

  const cpu = parseInt(cpuSlider.value, 10);
  const ram = parseInt(ramSlider.value, 10);

  // Aktualizujemy wyświetlane wartości w interfejsie
  document.getElementById('cpuValue').textContent = cpu;
  document.getElementById('ramValue').textContent = ram;

  // Jeśli nie załadowaliśmy danych (lub usługa nie istnieje) - wyjdź
  if (servicesData.length === 0 || selectedIndex < 0) return;

  // Pobieramy aktualnie wybraną usługę z tablicy
  const selectedService = servicesData[selectedIndex];

  // Logika obliczania ceny (przykład)
  const basePrice = selectedService.basePrice; // stała opłata bazowa
  const cpuCost = selectedService.cpuPricePerUnit * cpu;
  const ramCost = selectedService.ramPricePerGB * ram;

  const totalPrice = basePrice + cpuCost + ramCost;

  // Wyświetlamy wynik
  document.getElementById('priceValue').textContent = totalPrice.toFixed(2);
}

// Funkcja ładująca dane z pliku JSON
function loadServicesData() {
  fetch('data.json')
    .then(response => response.json())
    .then(data => {
      // Zakładamy, że w JSON mamy klucz "services"
      servicesData = data.services;
      populateServiceSelect();
      calculatePrice(); // oblicz cenę dla pierwszego z brzegu wpisu
    })
    .catch(error => console.error('Błąd podczas wczytywania danych: ', error));
}

// Funkcja wypełniająca listę wyboru usługami
function populateServiceSelect() {
  const serviceSelect = document.getElementById('serviceSelect');
  serviceSelect.innerHTML = ''; // wyczyść listę

  servicesData.forEach((service, index) => {
    const option = document.createElement('option');
    option.value = index;
    option.textContent = service.type;
    serviceSelect.appendChild(option);
  });
}

// Nasłuchiwanie zmian i wywołanie głównej funkcji
window.addEventListener('DOMContentLoaded', () => {
  loadServicesData();

  document.getElementById('serviceSelect').addEventListener('change', calculatePrice);
  document.getElementById('cpuSlider').addEventListener('input', calculatePrice);
  document.getElementById('ramSlider').addEventListener('input', calculatePrice);
});
