const loginView = document.getElementById("loginView");
const dashboardView = document.getElementById("dashboardView");
const siteAdminSection = document.getElementById("siteAdminSection");

const tokenInput = document.getElementById("token");
const output = document.getElementById("output");

const savedToken = localStorage.getItem("cm_token") || "";
const savedRole = localStorage.getItem("cm_role") || "";
if (savedToken) tokenInput.value = savedToken;

setView(Boolean(savedToken), savedRole);

document.getElementById("saveTokenBtn").addEventListener("click", () => {
  const token = tokenInput.value.trim();
  localStorage.setItem("cm_token", token);
  print({ message: "token saved" });
});

document.getElementById("logoutBtn").addEventListener("click", () => {
  tokenInput.value = "";
  localStorage.removeItem("cm_token");
  localStorage.removeItem("cm_role");
  setView(false, "");
  print({ message: "logged out" });
});

function setView(isLoggedIn, role) {
  loginView.classList.toggle("hidden", isLoggedIn);
  dashboardView.classList.toggle("hidden", !isLoggedIn);
  siteAdminSection.classList.toggle("hidden", role !== "site_admin");
}

function getToken() {
  return tokenInput.value.trim();
}

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

async function api(path, { method = "GET", body, auth = false } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (auth) {
    const token = getToken();
    if (!token) throw new Error("JWT token is required.");
    headers.Authorization = `Bearer ${token}`;
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
      if (data.token) {
        tokenInput.value = data.token;
        localStorage.setItem("cm_token", data.token);
      }
      if (data.user?.role) {
        localStorage.setItem("cm_role", data.user.role);
        setView(true, data.user.role);
      }
      print(data);
    } catch (err) {
      print({ error: err.message });
    }
  });
}

bindForm("loginForm", (v) => {
  const body = {};
  if (v.email) body.email = v.email;
  if (v.adminName) body.adminName = v.adminName;
  if (v.adminId) body.adminId = v.adminId;
  body.password = v.password;
  return api("/api/auth/login", { method: "POST", body });
});

bindForm("ownerRegisterForm", (v) =>
  api("/api/auth/register-owner", {
    method: "POST",
    body: { email: v.email, password: v.password, displayName: v.displayName, clanName: v.clanName }
  })
);

bindForm("managerRegisterForm", (v) =>
  api("/api/auth/register-manager", {
    method: "POST",
    body: { email: v.email, password: v.password, displayName: v.displayName }
  })
);

bindForm("addPlayerForm", (v) =>
  api("/api/players", {
    method: "POST",
    auth: true,
    body: { clanId: Number(v.clanId), gameUid: v.gameUid, nickname: v.nickname }
  })
);

bindForm("movePlayerForm", (v) =>
  api(`/api/players/${Number(v.playerId)}/move`, {
    method: "POST",
    auth: true,
    body: { clanId: Number(v.clanId) }
  })
);

bindForm("historyForm", (v) =>
  api(`/api/players/${Number(v.playerId)}/history`, {
    auth: true
  })
);

bindForm("blacklistForm", (v) =>
  api("/api/blacklist", {
    method: "POST",
    auth: true,
    body: { clanId: Number(v.clanId), playerId: Number(v.playerId), reason: v.reason || null }
  })
);

bindForm("listAdminsForm", (v) =>
  api(`/api/clans/${Number(v.clanId)}/admins`, {
    auth: true
  })
);

bindForm("addAdminForm", (v) =>
  api(`/api/clans/${Number(v.clanId)}/admins`, {
    method: "POST",
    auth: true,
    body: { email: v.email }
  })
);

bindForm("overviewForm", () =>
  api("/api/admin/overview", {
    auth: true
  })
);

bindForm("blockUserForm", (v) =>
  api("/api/admin/block-user", {
    method: "POST",
    auth: true,
    body: { userId: Number(v.userId), reason: v.reason || null }
  })
);

bindForm("unblockUserForm", (v) =>
  api("/api/admin/unblock-user", {
    method: "POST",
    auth: true,
    body: { userId: Number(v.userId) }
  })
);
