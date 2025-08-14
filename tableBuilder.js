const IconCheck = `<svg class="st-ico" viewBox="0 0 20 20" fill="none">
    <circle cx="10" cy="10" r="9" fill="currentColor" opacity="0.15"></circle>
    <path d="M6 10.5l2.5 2.5L14 7.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`;

const IconCross = `<svg class="st-ico" viewBox="0 0 20 20" fill="none">
    <circle cx="10" cy="10" r="9" fill="currentColor" opacity="0.15"></circle>
    <path d="M6.5 6.5L13.5 13.5M13.5 6.5L6.5 13.5"
          stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
  </svg>`;

const IconPause = `<svg class="st-ico" viewBox="0 0 20 20" fill="currentColor">
    <rect x="6" y="5" width="3" height="10" rx="1"/>
    <rect x="11" y="5" width="3" height="10" rx="1"/>
  </svg>`;

const IconTrash = `<svg class="st-ico" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
    <path d="M7 3h6l.5 2H18v2h-1v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7H2V5h4.5L7 3zm-1 4v9h8V7H6zm2 2h2v6H8V9zm4 0h-2v6h2V9z"/>
  </svg>`;

const IconPlay = `<svg viewBox="0 0 24 24" fill="currentColor"
       xmlns="http://www.w3.org/2000/svg">
    <polygon points="8,5 19,12 8,19" />
  </svg>`;

function createRow(name, ip, status, pingName , address) {
  const section = document.getElementById(name);
  const statusClass = `status-${status}`;
  const rowClass = status === "active" || status === "paused" ? "" : "row-down";

  const createIcon = (svgString) => {
    const wrapper = document.createElement("div");
    wrapper.innerHTML = svgString.trim();
    return wrapper.firstChild;
  };

  let statusIcon;
  if (status === "inactive") statusIcon = createIcon(IconCross);
  if (status === "active") statusIcon = createIcon(IconCheck);
  if (status === "paused") statusIcon = createIcon(IconPause);

  const tr = document.createElement("tr");
  const id = `${name}${address}${ip}`;
  if (rowClass) tr.classList.add(rowClass);
  tr.id = id;

  const tdIp = document.createElement("td");
  tdIp.textContent = ip;

  const tdName = document.createElement("td");
  tdName.textContent = pingName;

  const tdTimer = document.createElement("td");
  const pTimer = document.createElement("p");
  pTimer.className = "timer";
  pTimer.dataset.seconds = "0";
  pTimer.textContent = "00:00";
  tdTimer.appendChild(pTimer);

  const tdStatus = document.createElement("td");
  const pStatus = document.createElement("p");
  pStatus.className = `status ${statusClass}`;
  if (statusIcon) pStatus.appendChild(statusIcon);
  pStatus.append(` ${status}`);
  tdStatus.appendChild(pStatus);

  const tdAction = document.createElement("td");
  tdAction.className = "action";

  const btnDelete = createIcon(IconTrash);
  btnDelete.dataset.action = "delete";
  btnDelete.dataset.rowId = id;

  tdAction.append(btnDelete);

  tr.append(tdIp, tdName, tdTimer, tdStatus, tdAction);
  section?.appendChild(tr);
}

function formatElapsed(sec) {
  const days = Math.floor(sec / 86400);
  const hours = Math.floor((sec % 86400) / 3600);
  const minutes = Math.floor((sec % 3600) / 60);
  const seconds = sec % 60;

  if (days > 0) {
    return `${String(days).padStart(2, "0")}:${String(hours).padStart(
      2,
      "0"
    )}:${String(minutes).padStart(2, "0")}`;
  } else if (hours > 0) {
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
      2,
      "0"
    )}:${String(seconds).padStart(2, "0")}`;
  } else {
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(
      2,
      "0"
    )}`;
  }
}

setInterval(() => {
  document.querySelectorAll("p.timer").forEach((p) => {
    let sec = parseInt(p.dataset.seconds, 10) || 0;
    sec++;
    p.dataset.seconds = sec;
    p.textContent = formatElapsed(sec);
  });
}, 1000);

function getStatusFromP(p) {
  const cls = [...p.classList].find((c) => c.startsWith("status-"));
  return cls ? cls.replace("status-", "") : null;
}

function toNode(icon) {
  if (!icon) return document.createComment("no-icon");
  if (typeof icon === "string") {
    const w = document.createElement("div");
    w.innerHTML = icon.trim();
    return w.firstChild;
  }
  return icon.cloneNode(true);
}

function updateStatus(idRow, newStatus) {
  const tr = document.getElementById(idRow);
  if (!tr) return;

  const tdStatus = tr.children[3];
  if (!tdStatus) return;

  const p = tdStatus.querySelector("p");
  if (!p) return;

  const actualStatus = getStatusFromP(p) || p.textContent.trim();
  if (actualStatus === newStatus) return;

  tr.classList.toggle("row-down", newStatus === "inactive");

  if (actualStatus) p.classList.remove(`status-${actualStatus}`);
  p.classList.add(`status-${newStatus}`);

  const iconMap = {
    active: IconCheck,
    inactive: IconCross,
    paused: IconPause,
  };
  const iconNode = toNode(iconMap[newStatus]);

  p.innerHTML = "";
  if (iconNode) p.appendChild(iconNode);
  p.append(" " + newStatus);

  const pTimer = tr.querySelector("p.timer");
  if (pTimer) {
    pTimer.dataset.seconds = "0";
    pTimer.textContent = "00:00";
  }
}

module.exports = { createRow, updateStatus };
