const STORAGE_KEY = "kazakhtelecom-tree-registrations-v1";
const seedTrees = Array.isArray(window.TREES_DATA) ? window.TREES_DATA : [];
const localTrees = loadLocalTrees();
const trees = [...seedTrees, ...localTrees];

const elements = {
  totalTrees: document.querySelector("#totalTrees"),
  totalCities: document.querySelector("#totalCities"),
  totalDepartments: document.querySelector("#totalDepartments"),
  currentYearTrees: document.querySelector("#currentYearTrees"),
  currentYearLabel: document.querySelector("#currentYearLabel"),
  treeLayer: document.querySelector("#treeLayer"),
  alleyTrees: document.querySelector("#alleyTrees"),
  treeCard: document.querySelector("#treeCard"),
  loginForm: document.querySelector("#loginForm"),
  fullNameInput: document.querySelector("#fullNameInput"),
  employeeNumberInput: document.querySelector("#employeeNumberInput"),
  loginMessage: document.querySelector("#loginMessage"),
  searchInput: document.querySelector("#searchInput"),
  cityFilter: document.querySelector("#cityFilter"),
  yearFilter: document.querySelector("#yearFilter"),
  departmentFilter: document.querySelector("#departmentFilter"),
  journalBody: document.querySelector("#journalBody"),
  planView: document.querySelector("#planView"),
  alleyView: document.querySelector("#alleyView"),
  registrationForm: document.querySelector("#registrationForm"),
  registrationMessage: document.querySelector("#registrationMessage"),
  registrationResult: document.querySelector("#registrationResult"),
  registrationMap: document.querySelector("#registrationMap"),
  placementPin: document.querySelector("#placementPin"),
  positionX: document.querySelector("#positionX"),
  positionY: document.querySelector("#positionY"),
  placeCoordinates: document.querySelector("#placeCoordinates"),
  registerDate: document.querySelector("#registerDate"),
  downloadRegistration: document.querySelector("#downloadRegistration"),
  exportLocalRecords: document.querySelector("#exportLocalRecords"),
  localRecordCount: document.querySelector("#localRecordCount")
};

let selectedTreeId = trees[0]?.id ?? null;
let lastRegisteredId = null;

function loadLocalTrees() {
  try {
    const records = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(records) ? records.filter((tree) => (
      tree && typeof tree.id === "string" && tree.id.startsWith("local-") &&
      typeof tree.fullName === "string" && typeof tree.employeeNumber === "string" &&
      typeof tree.position === "string" && typeof tree.department === "string" &&
      tree.city === "Астана" && typeof tree.plantingDate === "string" &&
      typeof tree.treeType === "string" &&
      Number.isFinite(tree.coordinates?.x) && Number.isFinite(tree.coordinates?.y) &&
      tree.coordinates.x >= 5 && tree.coordinates.x <= 95 &&
      tree.coordinates.y >= 5 && tree.coordinates.y <= 95
    )) : [];
  } catch {
    return [];
  }
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[character]);
}

function uniqueValues(key) {
  return [...new Set(trees.map((tree) => tree[key]).filter(Boolean))].sort();
}

function fillSelect(select, label, values) {
  const previousValue = select.value;
  select.innerHTML = "";
  const allOption = document.createElement("option");
  allOption.value = "";
  allOption.textContent = label;
  select.appendChild(allOption);

  values.forEach((value) => {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = value;
    select.appendChild(option);
  });

  if (values.map(String).includes(previousValue)) {
    select.value = previousValue;
  }
}

function renderStats() {
  const currentYear = new Date().getFullYear();
  elements.totalTrees.textContent = trees.length;
  elements.totalCities.textContent = uniqueValues("city").length;
  elements.totalDepartments.textContent = uniqueValues("department").length;
  elements.currentYearTrees.textContent = trees.filter((tree) => tree.plantingYear === currentYear).length;
  elements.currentYearLabel.textContent = currentYear;
}

function renderPlanTrees() {
  elements.treeLayer.innerHTML = "";

  trees.forEach((tree) => {
    const pin = document.createElement("button");
    pin.className = `tree-pin${tree.id === selectedTreeId ? " selected" : ""}`;
    pin.type = "button";
    pin.style.left = `${tree.coordinates.x}%`;
    pin.style.top = `${tree.coordinates.y}%`;
    pin.setAttribute("aria-label", `Открыть дерево сотрудника ${tree.fullName}`);
    pin.innerHTML = "<span>♣</span>";
    pin.addEventListener("click", () => selectTree(tree.id));

    const label = document.createElement("span");
    label.className = "tree-label";
    label.style.left = `${tree.coordinates.x}%`;
    label.style.top = `${tree.coordinates.y}%`;
    label.textContent = tree.fullName;

    elements.treeLayer.append(pin, label);
  });
}

function renderAlleyTrees() {
  elements.alleyTrees.innerHTML = "";

  trees.forEach((tree, index) => {
    const row = Math.floor(index / 2);
    const side = index % 2 === 0 ? -1 : 1;
    const depth = row / Math.max(1, Math.ceil(trees.length / 2));
    const treeButton = document.createElement("button");
    const size = 64 - depth * 18;
    const left = 50 + side * (20 + depth * 13);
    const top = 25 + row * 16;

    treeButton.className = "alley-tree";
    treeButton.type = "button";
    treeButton.style.left = `${left}%`;
    treeButton.style.top = `${top}%`;
    treeButton.style.setProperty("--size", `${size}px`);
    treeButton.setAttribute("aria-label", `Открыть дерево сотрудника ${tree.fullName}`);
    treeButton.innerHTML = `
      <span class="alley-crown"></span>
      <span class="alley-trunk"></span>
      <span class="alley-name">${escapeHtml(tree.fullName)}</span>
    `;
    treeButton.addEventListener("click", () => selectTree(tree.id));
    elements.alleyTrees.appendChild(treeButton);
  });
}

function renderTreeCard(tree) {
  if (!tree) {
    elements.treeCard.innerHTML = `
      <p class="card-kicker">Выберите дерево</p>
      <h3>Дерево жизни сотрудника</h3>
      <p class="empty-card">Нажмите на дерево на плане или найдите сотрудника через вход.</p>
    `;
    return;
  }

  elements.treeCard.innerHTML = `
    <p class="card-kicker">${escapeHtml(tree.status)}</p>
    <div class="tree-avatar" aria-hidden="true"></div>
    <h3>Дерево жизни сотрудника</h3>
    <dl class="tree-details">
      <div><dt>ФИО</dt><dd>${escapeHtml(tree.fullName)}</dd></div>
      <div><dt>Табельный номер</dt><dd>${escapeHtml(tree.employeeNumber)}</dd></div>
      <div><dt>Должность</dt><dd>${escapeHtml(tree.position)}</dd></div>
      <div><dt>Подразделение</dt><dd>${escapeHtml(tree.department)}</dd></div>
      <div><dt>Город</dt><dd>${escapeHtml(tree.city)}</dd></div>
      <div><dt>Период</dt><dd>${escapeHtml(tree.plantingPeriod)}</dd></div>
      <div><dt>Тип дерева</dt><dd>${escapeHtml(tree.treeType)}</dd></div>
    </dl>
    <p class="note">${escapeHtml(tree.note)}</p>
    ${tree.source === "local" ? `
      <p class="local-record-note">Локальная запись на этом устройстве.</p>
      <button class="delete-local-tree" id="deleteLocalTree" type="button">Удалить запись</button>
    ` : ""}
  `;

  if (tree.source === "local") {
    elements.treeCard.querySelector("#deleteLocalTree").addEventListener("click", () => deleteLocalTree(tree.id));
  }
}

function getFilteredTrees() {
  const query = elements.searchInput.value.trim().toLowerCase();
  const city = elements.cityFilter.value;
  const year = elements.yearFilter.value;
  const department = elements.departmentFilter.value;

  return trees.filter((tree) => {
    const haystack = [
      tree.fullName,
      tree.employeeNumber,
      tree.position,
      tree.department,
      tree.city,
      tree.treeType
    ].join(" ").toLowerCase();

    return (
      (!query || haystack.includes(query)) &&
      (!city || tree.city === city) &&
      (!year || String(tree.plantingYear) === year) &&
      (!department || tree.department === department)
    );
  });
}

function renderJournal() {
  const filteredTrees = getFilteredTrees();

  elements.journalBody.innerHTML = filteredTrees.length ? filteredTrees.map((tree) => `
    <tr data-id="${escapeHtml(tree.id)}">
      <td>${escapeHtml(tree.fullName)}</td>
      <td>${escapeHtml(tree.employeeNumber)}</td>
      <td>${escapeHtml(tree.position)}</td>
      <td>${escapeHtml(tree.city)}</td>
      <td>${escapeHtml(tree.plantingPeriod)}</td>
      <td>${escapeHtml(tree.treeType)}</td>
    </tr>
  `).join("") : '<tr><td colspan="6">По этим условиям деревья не найдены.</td></tr>';

  [...elements.journalBody.querySelectorAll("tr[data-id]")].forEach((row) => {
    row.addEventListener("click", () => {
      selectTree(row.dataset.id);
      document.querySelector("#map").scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });
}

function selectTree(id) {
  selectedTreeId = id;
  const tree = trees.find((item) => item.id === id);
  renderTreeCard(tree);
  renderPlanTrees();
}

function normalize(value) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function handleLogin(event) {
  event.preventDefault();

  const name = normalize(elements.fullNameInput.value);
  const employeeNumber = normalize(elements.employeeNumberInput.value);

  const tree = trees.find((item) => (
    normalize(item.fullName).includes(name) &&
    normalize(item.employeeNumber) === employeeNumber
  ));

  if (!name || !employeeNumber) {
    elements.loginMessage.textContent = "Заполните ФИО и табельный номер.";
    return;
  }

  if (!tree) {
    elements.loginMessage.textContent = "Запись не найдена. Проверьте ФИО и табельный номер.";
    return;
  }

  elements.loginMessage.textContent = `Найдено дерево сотрудника: ${tree.fullName}.`;
  selectTree(tree.id);
  document.querySelector("#map").scrollIntoView({ behavior: "smooth", block: "start" });
}

function setPlacement(x, y) {
  const safeX = Math.min(95, Math.max(5, Math.round(Number(x) || 50)));
  const safeY = Math.min(95, Math.max(5, Math.round(Number(y) || 50)));
  elements.positionX.value = safeX;
  elements.positionY.value = safeY;
  elements.placementPin.style.left = `${safeX}%`;
  elements.placementPin.style.top = `${safeY}%`;
  elements.placeCoordinates.textContent = `Положение на схеме: ${safeX}% по горизонтали, ${safeY}% по вертикали.`;
}

function plantingPeriod(date) {
  const month = Number(date.slice(5, 7));
  const season = ["Зима", "Весна", "Лето", "Осень"][Math.floor((month % 12) / 3)];
  return `${season} ${date.slice(0, 4)}`;
}

function saveLocalTrees(records) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
    return true;
  } catch {
    return false;
  }
}

function downloadJson(data, filename) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function renderLocalControls() {
  elements.localRecordCount.textContent = `Локальных записей: ${localTrees.length}`;
  elements.exportLocalRecords.disabled = localTrees.length === 0;
}

function refreshFilterOptions() {
  fillSelect(elements.cityFilter, "Все города", uniqueValues("city"));
  fillSelect(elements.yearFilter, "Все годы", uniqueValues("plantingYear").map(String));
  fillSelect(elements.departmentFilter, "Все подразделения", uniqueValues("department"));
}

function refreshTreeViews() {
  renderStats();
  refreshFilterOptions();
  renderPlanTrees();
  renderAlleyTrees();
  renderJournal();
  renderTreeCard(trees.find((tree) => tree.id === selectedTreeId));
  renderLocalControls();
}

function handleRegistration(event) {
  event.preventDefault();
  const data = new FormData(elements.registrationForm);
  const fullName = String(data.get("fullName") || "").trim().replace(/\s+/g, " ");
  const employeeNumber = String(data.get("employeeNumber") || "").trim().toUpperCase();
  const position = String(data.get("position") || "").trim();
  const department = String(data.get("department") || "").trim();
  const city = String(data.get("city") || "");
  const plantingDate = String(data.get("plantingDate") || "");
  const treeType = String(data.get("treeType") || "");
  const today = new Date();
  const todayString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  elements.registrationResult.hidden = true;

  if (!fullName || !employeeNumber || !position || !department || city !== "Астана" ||
      !treeType || !/^\d{4}-\d{2}-\d{2}$/.test(plantingDate) ||
      plantingDate > todayString || data.get("ageConfirmation") !== "on") {
    elements.registrationMessage.textContent = "Проверьте обязательные поля и дату посадки.";
    return;
  }

  if (trees.some((tree) => normalize(tree.employeeNumber) === normalize(employeeNumber))) {
    elements.registrationMessage.textContent = "Дерево с этим табельным номером уже есть в журнале.";
    return;
  }

  const tree = {
    id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    fullName,
    employeeNumber,
    position,
    department,
    city,
    plantingDate,
    plantingYear: Number(plantingDate.slice(0, 4)),
    plantingPeriod: plantingPeriod(plantingDate),
    treeType,
    status: "Зарегистрировано локально",
    coordinates: { x: Number(elements.positionX.value), y: Number(elements.positionY.value) },
    note: "Дерево зарегистрировано сотрудником на этом устройстве.",
    source: "local"
  };

  if (!saveLocalTrees([...localTrees, tree])) {
    elements.registrationMessage.textContent = "Браузер не разрешил сохранить запись. Попробуйте обычное окно браузера.";
    return;
  }

  localTrees.push(tree);
  trees.push(tree);
  selectedTreeId = tree.id;
  lastRegisteredId = tree.id;
  refreshTreeViews();
  elements.registrationForm.reset();
  setPlacement(50, 50);
  elements.registrationMessage.textContent = `Дерево сотрудника ${fullName} сохранено на этом устройстве.`;
  elements.registrationResult.hidden = false;
}

function deleteLocalTree(id) {
  const index = localTrees.findIndex((tree) => tree.id === id);
  if (index < 0 || !window.confirm("Удалить эту локальную запись с устройства?")) return;

  const remaining = localTrees.filter((tree) => tree.id !== id);
  if (!saveLocalTrees(remaining)) {
    window.alert("Не удалось удалить запись из хранилища браузера.");
    return;
  }

  localTrees.splice(index, 1);
  trees.splice(trees.findIndex((tree) => tree.id === id), 1);
  if (selectedTreeId === id) selectedTreeId = trees[0]?.id ?? null;
  if (lastRegisteredId === id) {
    lastRegisteredId = null;
    elements.registrationResult.hidden = true;
  }
  refreshTreeViews();
}

function initRegistration() {
  const today = new Date();
  elements.registerDate.max = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  setPlacement(50, 50);

  elements.registrationMap.addEventListener("click", (event) => {
    const bounds = elements.registrationMap.getBoundingClientRect();
    setPlacement((event.clientX - bounds.left) / bounds.width * 100, (event.clientY - bounds.top) / bounds.height * 100);
  });
  elements.positionX.addEventListener("input", () => setPlacement(elements.positionX.value, elements.positionY.value));
  elements.positionY.addEventListener("input", () => setPlacement(elements.positionX.value, elements.positionY.value));
  elements.registrationForm.addEventListener("submit", handleRegistration);
  elements.downloadRegistration.addEventListener("click", () => {
    const tree = localTrees.find((item) => item.id === lastRegisteredId);
    if (tree) downloadJson({ version: 1, record: tree }, `tree-${tree.employeeNumber.replace(/[^a-zA-Z0-9_-]/g, "")}.json`);
  });
  elements.exportLocalRecords.addEventListener("click", () => {
    if (localTrees.length) downloadJson({ version: 1, records: localTrees }, "kazakhtelecom-local-trees.json");
  });
}

function bindViewToggle() {
  document.querySelectorAll("[data-view]").forEach((button) => {
    button.addEventListener("click", () => {
      const view = button.dataset.view;

      document.querySelectorAll("[data-view]").forEach((item) => {
        item.classList.toggle("active", item === button);
        item.setAttribute("aria-selected", String(item === button));
      });

      elements.planView.classList.toggle("active", view === "plan");
      elements.alleyView.classList.toggle("active", view === "alley");
    });
  });
}

function initFilters() {
  refreshFilterOptions();

  [
    elements.searchInput,
    elements.cityFilter,
    elements.yearFilter,
    elements.departmentFilter
  ].forEach((control) => control.addEventListener("input", renderJournal));
}

function init() {
  initFilters();
  initRegistration();
  refreshTreeViews();
  bindViewToggle();
  elements.loginForm.addEventListener("submit", handleLogin);
}

init();
