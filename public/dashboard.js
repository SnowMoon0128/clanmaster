const tokenInput = document.getElementById("token");
const output = document.getElementById("output");
const siteAdminSection = document.getElementById("section-site-admin");
const siteAdminMenu = document.getElementById("siteAdminMenu");
const ownerInviteMenu = document.getElementById("ownerInviteMenu");
const dashMenu = document.getElementById("dashMenu");

const token = localStorage.getItem("cm_token") || "";
const role = localStorage.getItem("cm_role") || "";

if (!token) {
  window.location.href = "/login";
}

tokenInput.value = token;
if (role === "site_admin") {
  siteAdminSection.classList.remove("hidden");
  siteAdminMenu.classList.remove("hidden");
}
if (role === "owner") {
  ownerInviteMenu.classList.remove("hidden");
}

document.getElementById("saveTokenBtn").addEventListener("click", () => {
  localStorage.setItem("cm_token", tokenInput.value.trim());
  print({ message: "token saved" });
});

document.getElementById("logoutBtn").addEventListener("click", () => {
  localStorage.removeItem("cm_token");
  localStorage.removeItem("cm_role");
  window.location.href = "/login";
});

dashMenu.addEventListener("click", (e) => {
  const btn = e.target.closest(".menu-btn");
  if (!btn) return;

  for (const item of dashMenu.querySelectorAll(".menu-btn")) {
    item.classList.remove("active");
  }
  btn.classList.add("active");

  for (const panel of document.querySelectorAll(".section-panel")) {
    panel.classList.add("hidden");
  }

  const targetPanel = document.getElementById(btn.dataset.target);
  if (targetPanel) targetPanel.classList.remove("hidden");
});

function print(data) {
  output.textContent = JSON.stringify(data, null, 2);
}

function formToObj(form) {
  const fd = new FormData(form);
  const obj = {};
  for (const [key, value] of fd.entries()) {
    obj[key] = typeof value === "string" ? value.trim() : value;
  }
  return obj;
}

async function api(path, { method = "GET", body, auth = true } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (auth) {
    const currentToken = tokenInput.value.trim();
    if (!currentToken) throw new Error("JWT token is required.");
    headers.Authorization = `Bearer ${currentToken}`;
  }

  const res = await fetch(path, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || "Request failed");
  return data;
}

function bindForm(formId, handler) {
  const form = document.getElementById(formId);
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    try {
      const data = await handler(formToObj(form));
      print(data);
    } catch (error) {
      print({ error: error.message });
    }
  });
}

bindForm("addPlayerForm", (v) =>
  api("/api/players", {
    method: "POST",
    body: { clanId: Number(v.clanId), gameUid: v.gameUid, nickname: v.nickname }
  })
);

bindForm("movePlayerForm", (v) =>
  api(`/api/players/${Number(v.playerId)}/move`, {
    method: "POST",
    body: { clanId: Number(v.clanId) }
  })
);

bindForm("historyForm", (v) => api(`/api/players/${Number(v.playerId)}/history`));

bindForm("blacklistForm", (v) =>
  api("/api/blacklist", {
    method: "POST",
    body: { clanId: Number(v.clanId), playerId: Number(v.playerId), reason: v.reason || null }
  })
);

bindForm("blacklistListForm", (v) => api(`/api/blacklist?clanId=${Number(v.clanId)}`));

bindForm("listAdminsForm", (v) => api(`/api/clans/${Number(v.clanId)}/admins`));

bindForm("addAdminForm", (v) =>
  api(`/api/clans/${Number(v.clanId)}/admins`, {
    method: "POST",
    body: { email: v.email }
  })
);

bindForm("overviewForm", () => api("/api/admin/overview"));

bindForm("blockUserForm", (v) =>
  api("/api/admin/block-user", {
    method: "POST",
    body: { userId: Number(v.userId), reason: v.reason || null }
  })
);

bindForm("unblockUserForm", (v) =>
  api("/api/admin/unblock-user", {
    method: "POST",
    body: { userId: Number(v.userId) }
  })
);
