const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.join(__dirname, "..");
const dataSource = fs.readFileSync(path.join(root, "data", "trees.js"), "utf8");
const appSource = fs.readFileSync(path.join(root, "script.js"), "utf8");
const htmlSource = fs.readFileSync(path.join(root, "index.html"), "utf8");
const storageKey = "kazakhtelecom-tree-registrations-v1";

function element() {
  let html = "";
  return {
    value: "",
    textContent: "",
    hidden: false,
    disabled: false,
    children: [],
    listeners: {},
    style: { setProperty() {} },
    classList: { toggle() {} },
    set innerHTML(value) { html = value; this.children = []; },
    get innerHTML() { return html; },
    appendChild(child) { this.children.push(child); },
    append(...children) { this.children.push(...children); },
    addEventListener(type, listener) { this.listeners[type] = listener; },
    setAttribute() {},
    querySelectorAll() { return []; },
    querySelector() { return this.deleteButton ||= element(); },
    getBoundingClientRect() { return { left: 0, top: 0, width: 400, height: 200 }; },
    reset() {},
    remove() {},
    click() {}
  };
}

function mount(storage = new Map()) {
  const nodes = new Map();
  const getNode = (selector) => {
    if (!nodes.has(selector)) nodes.set(selector, element());
    return nodes.get(selector);
  };
  const form = getNode("#registrationForm");
  form.fields = {};
  const document = {
    querySelector: getNode,
    querySelectorAll: () => [],
    createElement: element,
    body: element()
  };
  const context = vm.createContext({
    window: { confirm: () => true },
    document,
    localStorage: {
      getItem: (key) => storage.get(key) ?? null,
      setItem: (key, value) => storage.set(key, value)
    },
    FormData: class {
      constructor(target) { this.fields = target.fields; }
      get(key) { return this.fields[key] ?? null; }
    },
    Blob,
    URL,
    Date,
    setTimeout
  });

  vm.runInContext(dataSource, context);
  vm.runInContext(appSource, context);
  return { nodes, storage, form };
}

function fillForm(form, values = {}) {
  form.fields = {
    fullName: "Тестовый Сотрудник",
    employeeNumber: "KT-99999",
    position: "Инженер",
    department: "Технический блок",
    city: "Астана",
    plantingDate: "2026-05-10",
    treeType: "Клен",
    ageConfirmation: "on",
    ...values
  };
}

function submit(form) {
  form.listeners.submit({ preventDefault() {} });
}

test("all queried element IDs exist in the page", () => {
  const ids = new Set([...htmlSource.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]));
  const selectors = [...appSource.matchAll(/document\.querySelector\("#([^"]+)"\)/g)].map((match) => match[1]);
  assert.deepEqual(selectors.filter((id) => !ids.has(id)), []);
});

test("registered tree appears on map and journal and survives reload", () => {
  const app = mount();
  fillForm(app.form);
  app.nodes.get("#registrationMap").listeners.click({ clientX: 100, clientY: 150 });
  submit(app.form);

  const records = JSON.parse(app.storage.get(storageKey));
  assert.equal(records.length, 1);
  assert.deepEqual(JSON.parse(JSON.stringify(records[0].coordinates)), { x: 25, y: 75 });
  assert.equal(records[0].plantingPeriod, "Весна 2026");
  assert.equal(app.nodes.get("#totalTrees").textContent, 7);
  assert.equal(app.nodes.get("#registrationResult").hidden, false);
  assert.match(app.nodes.get("#treeCard").innerHTML, /Тестовый Сотрудник/);
  assert.match(app.nodes.get("#journalBody").innerHTML, /KT-99999/);

  const reloaded = mount(app.storage);
  assert.equal(reloaded.nodes.get("#totalTrees").textContent, 7);
  assert.match(reloaded.nodes.get("#journalBody").innerHTML, /KT-99999/);
});

test("duplicate employee number is rejected", () => {
  const app = mount();
  fillForm(app.form, { employeeNumber: "KT-10234" });
  submit(app.form);

  assert.equal(app.storage.has(storageKey), false);
  assert.equal(app.nodes.get("#totalTrees").textContent, 6);
  assert.match(app.nodes.get("#registrationMessage").textContent, /уже есть/);
});

test("employee supplied text is escaped in rendered views", () => {
  const app = mount();
  fillForm(app.form, { fullName: "Тестовый <img src=x>" });
  submit(app.form);

  assert.match(app.nodes.get("#treeCard").innerHTML, /&lt;img src=x&gt;/);
  assert.doesNotMatch(app.nodes.get("#treeCard").innerHTML, /<img src=x>/);
  assert.match(app.nodes.get("#journalBody").innerHTML, /&lt;img src=x&gt;/);
});

test("locally registered tree can be removed from this device", () => {
  const app = mount();
  fillForm(app.form);
  submit(app.form);
  app.nodes.get("#treeCard").deleteButton.listeners.click();

  assert.equal(JSON.parse(app.storage.get(storageKey)).length, 0);
  assert.equal(app.nodes.get("#totalTrees").textContent, 6);
  assert.doesNotMatch(app.nodes.get("#journalBody").innerHTML, /KT-99999/);
});
