const container = document.getElementById("container");

function createSection(interfaces) {
  interfaces.forEach(({ name, address }) => {
    const div = document.createElement("div");

    const h3 = document.createElement("h5");
    h3.textContent = `from ${name} - ${address}`;
    div.appendChild(h3);
    const table = document.createElement("table");
    const tbody = document.createElement("tbody");
    tbody.id = name;
    table.appendChild(tbody);
    div.appendChild(table);
    container.appendChild(div);
  });
}

module.exports = createSection;
