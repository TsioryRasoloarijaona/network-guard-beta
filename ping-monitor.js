const { spawn } = require("child_process");

const isWin = process.platform === "win32";

const timers = Object.create(null); 
const inflight = Object.create(null);
const states = Object.create(null); 
const lastOutput = Object.create(null);


function pingOnce(host, sourceIp) {
  return new Promise((resolve) => {
    const args = isWin ? ["-n", "1", "-w", "1000"] : ["-c", "1", "-W", "1"];

    if (sourceIp) {

      if (isWin) args.push("-S", sourceIp);
      else args.push("-I", sourceIp);
    }
    args.push(host);

    const child = spawn("ping", args, { windowsHide: true });

    let out = "";
    let err = "";

    child.stdout.on("data", (d) => (out += d.toString()));
    child.stderr.on("data", (d) => (err += d.toString()));

    child.on("error", () => resolve({ alive: false, output: "spawn error" }));

    child.on("close", (code) => {
      const text = (out || err || "").toString();


      let alive = false;
      if (isWin) {
        alive =
          /TTL=/i.test(text) &&
          !/Destination host unreachable|General failure|timed out/i.test(text);
      } else {
        alive = /1 received|1 packets received|bytes from/i.test(text);
      }

      resolve({ alive, output: text.trim() });
    });
  });
}

function startPingLoop(
  host,
  interfaceName,
  interfaceIp,
  rowId,
  onResult,
  periodMs = 2000
) {

  if (!states[rowId]) states[rowId] = { status: "paused", ok: 0, fail: 0 };

  // annule ancienne boucle si existante
  if (timers[rowId]) clearTimeout(timers[rowId]);

  const tick = async () => {

    if (inflight[rowId]) {
      timers[rowId] = setTimeout(tick, 150);
      return;
    }

    inflight[rowId] = true;
    try {
      const { alive, output } = await pingOnce(host, interfaceIp);
      lastOutput[rowId] = output;

      const st = states[rowId];

      if (alive) {
        st.ok += 1;
        st.fail = 0;

        if (st.status !== "active" && st.ok >= 2) {
          st.status = "active";
          onResult({ rowId, status: "active", output });
        } else if (st.status === "active") {
          onResult({ rowId, status: "active", output });
        }
      } else {
        st.fail += 1;
        st.ok = 0;

        if (st.status !== "inactive" && st.fail >= 3) {
          st.status = "inactive";
          onResult({ rowId, status: "inactive", output });
        } else if (st.status === "inactive") {
          onResult({ rowId, status: "inactive", output });
        }
      }
    } catch (e) {
      const st = states[rowId];
      st.fail += 1;
      st.ok = 0;
      st.status = "inactive";
      onResult({ rowId, status: "inactive", output: String(e?.message || e) });
    } finally {
      inflight[rowId] = false;
      timers[rowId] = setTimeout(tick, periodMs);
    }
  };
  states[rowId].ok = 0;
  states[rowId].fail = 0;

  tick();
}

function stopPingLoop(rowId) {
  if (timers[rowId]) {
    clearTimeout(timers[rowId]);
    delete timers[rowId];
  }
  delete inflight[rowId];

}

module.exports = { startPingLoop, stopPingLoop };
