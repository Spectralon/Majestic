const canvas = document.getElementById("world");
const ctx = canvas.getContext("2d");
const COLORS = { medkit: "#ff4444", armor: "#4488ff", bandage: "#44ff44", flare: "#ffaa00" };

let ws;
let playerId = null;
let snapshot = null;
let myInventory = [];

function connect() {
  document.getElementById("status").textContent = "connecting...";
  ws = new WebSocket(`ws://${location.hostname}:3001`);
  ws.onopen = () => {
    document.getElementById("status").textContent = "connected";
  };
  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.playerId) {
      playerId = data.playerId;
    } else if (data.error) {
      document.getElementById("status").textContent = "error: " + data.error;
    } else if (data.inventory) {
      myInventory = data.inventory;
      renderInv();
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

function send(cmd) {
  if (!playerId || !ws || ws.readyState !== 1) return;
  cmd.playerId = playerId;
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
    ctx.beginPath();
    ctx.arc(p.position.x, p.position.y, 15, 0, Math.PI * 2);
    ctx.fillStyle = p.id === playerId ? "#00ff88" : "#ff8800";
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
}

function renderInv() {
  const el = document.getElementById("inv");
  el.textContent = myInventory.length ? myInventory.map((i) => `${i.type} x${i.amount}`).join(", ") : "empty";
}

canvas.addEventListener("click", (e) => {
  if (!snapshot) return;
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  for (const item of snapshot.groundItems) {
    const dx = x - item.position.x;
    const dy = y - item.position.y;
    if (dx * dx + dy * dy <= 200) {
      send({ cmd: "pickup", groundItemId: item.id });
      return;
    }
  }
});

connect();
