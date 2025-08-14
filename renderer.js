const { ipcRenderer } = require("electron");
const createSection = require("./sectionCreation");
const { createRow, updateStatus } = require("./tableBuilder");
const ids = [];

window.addEventListener("DOMContentLoaded", () => {
  console.log("📤 Envoi de request-interfaces");
  ipcRenderer.send("request-interfaces");
  const btn = document.getElementById("addBtn");
  btn?.addEventListener("click", () => {
    requestRow();
  });
  document.addEventListener("click", (e) => {
    const target = e.target.closest("[data-action]");
    if (!target) return;

    const action = target.dataset.action;
    let rowId = target.dataset.rowId;
    if (action === "delete") {
      ipcRenderer.send("delete", { action, rowId });
      return;
    }
  });
});

function requestRow() {
  const host = document.getElementById("host").value;
  const pingName = document.getElementById("name").value;
  const select = document.getElementById("interfaces").value;
  const interfaceInfo = JSON.parse(select);
  const { name, address } = interfaceInfo;
  const id = `${name}${address}${host}`;

  if (!host || !pingName || !select) {
    ipcRenderer.send("fields-required");
    return;
  }
  if (ids.includes(id)) {
    ipcRenderer.send("error", { name, host });
    return;
  }
  ipcRenderer.send("add-row", { host, pingName, name, address ,id});
}

ipcRenderer.on("response-interfaces", (event, interfaces) => {
  console.log("📥 Interfaces reçues :", interfaces);
  const select = document.getElementById("interfaces");
  select.innerHTML = "";
  interfaces.forEach(({ name, address }) => {
    const option = document.createElement("option");
    option.textContent = `${name} - ${address}`;
    option.value = JSON.stringify({ name, address });
    select.appendChild(option);
  });
  createSection(interfaces);
});

ipcRenderer.on("response-row", (event, row) => {
  const { ipTarget, pingName, interfaceName, status, address } = row;
  createRow(interfaceName, ipTarget, status, pingName , address);
  let id = `${interfaceName}${address}${ipTarget}`;
  ids.push(id);
  event.sender.send("start-ping", { id, ipTarget, address, interfaceName });
});

ipcRenderer.on("ping-result", (event, result) => {
  const { rowId, status } = result;
  updateStatus(rowId, status);
});

ipcRenderer.on("delete-it", (event, rowId) => {
  document.getElementById(rowId).remove();
  ids.splice(ids.indexOf(rowId), 1);
});




