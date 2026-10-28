const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.resolve(__dirname, "..");
const registrationKey = "kt-tree-alley-registered-v1";

function inlineScript(fileName) {
  const html = fs.readFileSync(path.join(root, fileName), "utf8");
  const script = html.match(/<script>([\s\S]*?)<\/script>/);
  assert.ok(script, `${fileName} contains an inline script`);
  return script[1];
}

function visitHome({ search = "", stored = null } = {}) {
  const values = new Map(stored ? [[registrationKey, stored]] : []);
  const redirects = [];
  vm.runInNewContext(inlineScript("index.html"), {
    URLSearchParams,
    localStorage: {
      getItem: (key) => values.get(key) || null,
      setItem: (key, value) => values.set(key, value)
    },
    window: {
      location: { search, replace: (url) => redirects.push(url) }
    }
  });
  return { redirects, values };
}

test("first visit opens registration", () => {
  assert.deepEqual(visitHome().redirects, ["register.html"]);
});

test("registered visitor stays on the home page", () => {
  assert.deepEqual(visitHome({ stored: "1" }).redirects, []);
});

test("return from the registration form enables later visits", () => {
  const result = visitHome({ search: "?registered=1" });
  assert.deepEqual(result.redirects, []);
  assert.equal(result.values.get(registrationKey), "1");
});

test("submitting registration saves a marker and redirects home", () => {
  let onSubmit;
  const timers = [];
  const values = new Map();
  const downloads = [];
  const redirects = [];
  const fields = new Map([
    ["fullName", "Тестовый Сотрудник"],
    ["employeeNumber", "KT-00001"],
    ["position", "Инженер"],
    ["department", "Технический блок"],
    ["city", "Астана"],
    ["plantingDate", "2026-04-10"],
    ["treeType", "Берёза"],
    ["note", ""]
  ]);
  const form = {
    addEventListener: (type, callback) => { if (type === "submit") onSubmit = callback; },
    reportValidity: () => true
  };
  const status = { textContent: "" };
  const dateInput = { max: "" };
  const document = {
    body: { appendChild: () => {} },
    getElementById: (id) => ({ registrationForm: form, formStatus: status, plantingDate: dateInput })[id],
    createElement: () => ({ click() { downloads.push(this.download); }, remove() {} })
  };
  vm.runInNewContext(inlineScript("register.html"), {
    document,
    Date,
    FormData: class { get(key) { return fields.get(key); } },
    Blob,
    URL: { createObjectURL: () => "blob:test", revokeObjectURL: () => {} },
    localStorage: { setItem: (key, value) => values.set(key, value) },
    setTimeout: (callback) => timers.push(callback),
    window: { location: { assign: (url) => redirects.push(url) } }
  });
  assert.equal(typeof onSubmit, "function");
  onSubmit({ preventDefault() {} });
  assert.deepEqual(downloads, ["tree-record-2026-04-10.json"]);
  assert.equal(values.get(registrationKey), "1");
  timers.forEach((callback) => callback());
  assert.deepEqual(redirects, ["index.html?registered=1"]);
});
