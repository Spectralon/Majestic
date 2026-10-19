const canvas = document.getElementById("world");
const ctx = canvas.getContext("2d");
const COLORS = { medkit: "#ff4444", armor: "#4488ff", bandage: "#44ff44", flare: "#ffaa00" };

let ws;
let controlledPlayerId = null;
let snapshot = null;

function connect() {
  document.getElementById("status").textContent = "connecting...";
  ws = new WebSocket(`ws://${location.hostname}:3001`);
  ws.onopen = () => {
    document.getElementById("status").textContent = "connected";
  };
  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.error) {
      document.getElementById("status").textContent = "error: " + data.error;
    } else if (data.tick !== undefined) {
      snapshot = data;
      render();
    }
  };
  ws.onclose = () => {
    document.getElementById("status").textContent = "disconnected, retrying...";
    setTimeout(connect, 2000);
  };
}

function sendRaw(cmd) {
  if (!ws || ws.readyState !== 1) return;
  ws.send(JSON.stringify(cmd));
}

function send(cmd) {
  if (!controlledPlayerId || !ws || ws.readyState !== 1) return;
  cmd.playerId = controlledPlayerId;
  ws.send(JSON.stringify(cmd));
}

function render() {
  if (!snapshot) return;
  ctx.fillStyle = "#1a1a2e";
  ctx.fillRect(0, 0, 800, 600);

  for (const item of snapshot.groundItems) {
    ctx.beginPath();
    ctx.arc(item.position.x, item.position.y, 8, 0, Math.PI * 2);
    ctx.fillStyle = COLORS[item.type] || "#fff";
    ctx.fill();
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.fillStyle = "#ccc";
    ctx.font = "10px sans-serif";
    ctx.fillText(item.type, item.position.x - 14, item.position.y + 20);
  }

  for (const p of snapshot.players) {
    if (p.effects.some((e) => e.type === "flare")) {
      ctx.beginPath();
      ctx.arc(p.position.x, p.position.y, 30, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255, 170, 0, 0.3)";
      ctx.fill();
      ctx.strokeStyle = "#ffaa00";
      ctx.lineWidth = 2;
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.arc(p.position.x, p.position.y, 15, 0, Math.PI * 2);
    ctx.fillStyle = p.id === controlledPlayerId ? "#00ff88" : "#ff8800";
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.font = "bold 11px sans-serif";
    ctx.fillText(p.id, p.position.x - 8, p.position.y - 22);
    ctx.fillStyle = "#333";
    ctx.fillRect(p.position.x - 15, p.position.y + 18, 30, 5);
    ctx.fillStyle = "#f44";
    ctx.fillRect(p.position.x - 15, p.position.y + 18, 30 * (p.hp / 100), 5);
    ctx.fillStyle = "#48f";
    ctx.fillRect(p.position.x - 15, p.position.y + 24, 30 * (p.armor / 100), 3);
  }

  ctx.fillStyle = "#666";
  ctx.font = "12px monospace";
  ctx.fillText(`tick: ${snapshot.tick}`, 10, 20);
  renderInv();
}

function renderInv() {
  const el = document.getElementById("inv");
  if (!controlledPlayerId || !snapshot) {
    el.textContent = "click a player to control";
    return;
  }
  const items = snapshot.inventories[controlledPlayerId];
  el.textContent = items && items.length ? items.map((i) => `${i.type} x${i.amount}`).join(", ") : "empty";
}

canvas.addEventListener("click", (e) => {
  if (!snapshot) return;
  const rect = canvas.getBoundingClientRect();
  const x = (e.clientX - rect.left) * (canvas.width / rect.width);
  const y = (e.clientY - rect.top) * (canvas.height / rect.height);

  for (const p of snapshot.players) {
    const dx = x - p.position.x;
    const dy = y - p.position.y;
    if (dx * dx + dy * dy <= 225) {
      controlledPlayerId = p.id;
      document.getElementById("invSection").style.display = "block";
      return;
    }
  }

  for (const item of snapshot.groundItems) {
    const dx = x - item.position.x;
    const dy = y - item.position.y;
    if (dx * dx + dy * dy <= 200) {
      send({ cmd: "pickup", groundItemId: item.id });
      return;
    }
  }

  if (controlledPlayerId) {
    send({ cmd: "setTarget", x, y });
  }
});

canvas.addEventListener("contextmenu", (e) => {
  e.preventDefault();
  const section = document.getElementById("invSection");
  section.style.display = section.style.display === "none" ? "block" : "none";
});

connect();
