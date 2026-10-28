const trees = Array.isArray(window.TREES_DATA) ? window.TREES_DATA : [];

const elements = {
  totalTrees: document.querySelector("#totalTrees"),
  totalCities: document.querySelector("#totalCities"),
  totalDepartments: document.querySelector("#totalDepartments"),
  currentYearTrees: document.querySelector("#currentYearTrees"),
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
  alleyView: document.querySelector("#alleyView")
};

let selectedTreeId = trees[0]?.id ?? null;

function uniqueValues(key) {
  return [...new Set(trees.map((tree) => tree[key]).filter(Boolean))].sort();
}

function fillSelect(select, label, values) {
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
}

function renderStats() {
  elements.totalTrees.textContent = trees.length;
  elements.totalCities.textContent = uniqueValues("city").length;
  elements.totalDepartments.textContent = uniqueValues("department").length;
  elements.currentYearTrees.textContent = trees.filter((tree) => tree.plantingYear === 2026).length;
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
      <span class="alley-name">${tree.fullName}</span>
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
    <p class="card-kicker">${tree.status}</p>
    <div class="tree-avatar" aria-hidden="true"></div>
    <h3>Дерево жизни сотрудника</h3>
    <dl class="tree-details">
      <div><dt>ФИО</dt><dd>${tree.fullName}</dd></div>
      <div><dt>Табельный номер</dt><dd>${tree.employeeNumber}</dd></div>
      <div><dt>Должность</dt><dd>${tree.position}</dd></div>
      <div><dt>Подразделение</dt><dd>${tree.department}</dd></div>
      <div><dt>Город</dt><dd>${tree.city}</dd></div>
      <div><dt>Период</dt><dd>${tree.plantingPeriod}</dd></div>
      <div><dt>Тип дерева</dt><dd>${tree.treeType}</dd></div>
    </dl>
    <p class="note">${tree.note}</p>
  `;
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

  elements.journalBody.innerHTML = filteredTrees.map((tree) => `
    <tr data-id="${tree.id}">
      <td>${tree.fullName}</td>
      <td>${tree.employeeNumber}</td>
      <td>${tree.position}</td>
      <td>${tree.city}</td>
      <td>${tree.plantingPeriod}</td>
      <td>${tree.treeType}</td>
    </tr>
  `).join("");

  [...elements.journalBody.querySelectorAll("tr")].forEach((row) => {
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
  fillSelect(elements.cityFilter, "Все города", uniqueValues("city"));
  fillSelect(elements.yearFilter, "Все годы", uniqueValues("plantingYear").map(String));
  fillSelect(elements.departmentFilter, "Все подразделения", uniqueValues("department"));

  [
    elements.searchInput,
    elements.cityFilter,
    elements.yearFilter,
    elements.departmentFilter
  ].forEach((control) => control.addEventListener("input", renderJournal));
}

function init() {
  renderStats();
  initFilters();
  renderPlanTrees();
  renderAlleyTrees();
  renderJournal();
  renderTreeCard(trees.find((tree) => tree.id === selectedTreeId));
  bindViewToggle();
  elements.loginForm.addEventListener("submit", handleLogin);
}

init();
