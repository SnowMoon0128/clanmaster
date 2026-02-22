const tokenInput = document.getElementById("token");
const output = document.getElementById("output");

const storedToken = localStorage.getItem("cm_token");
if (storedToken) tokenInput.value = storedToken;

document.getElementById("saveTokenBtn").addEventListener("click", () => {
  localStorage.setItem("cm_token", tokenInput.value.trim());
  print({ message: "token saved" });
});

document.getElementById("logoutBtn").addEventListener("click", () => {
  tokenInput.value = "";
  localStorage.removeItem("cm_token");
  print({ message: "logged out" });
});

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
    if (!token) throw new Error("JWT token이 필요합니다.");
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(path, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || "요청 실패");
  return data;
}

async function handleForm(formId, handler) {
  const form = document.getElementById(formId);
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    try {
      const data = await handler(formToObj(form));
      if (data.token) {
        tokenInput.value = data.token;
        localStorage.setItem("cm_token", data.token);
      }
      print(data);
    } catch (err) {
      print({ error: err.message });
    }
  });
}

handleForm("loginForm", (v) => {
  const body = {};
  if (v.email) body.email = v.email;
  if (v.adminName) body.adminName = v.adminName;
  if (v.adminId) body.adminId = v.adminId;
  body.password = v.password;
  return api("/api/auth/login", { method: "POST", body });
});

handleForm("ownerRegisterForm", (v) =>
  api("/api/auth/register-owner", {
    method: "POST",
    body: { email: v.email, password: v.password, displayName: v.displayName, clanName: v.clanName }
  })
);

handleForm("managerRegisterForm", (v) =>
  api("/api/auth/register-manager", {
    method: "POST",
    body: { email: v.email, password: v.password, displayName: v.displayName }
  })
);

handleForm("addPlayerForm", (v) =>
  api("/api/players", {
    method: "POST",
    auth: true,
    body: { clanId: Number(v.clanId), gameUid: v.gameUid, nickname: v.nickname }
  })
);

handleForm("movePlayerForm", (v) =>
  api(`/api/players/${Number(v.playerId)}/move`, {
    method: "POST",
    auth: true,
    body: { clanId: Number(v.clanId) }
  })
);

handleForm("historyForm", (v) =>
  api(`/api/players/${Number(v.playerId)}/history`, {
    auth: true
  })
);

handleForm("blacklistForm", (v) =>
  api("/api/blacklist", {
    method: "POST",
    auth: true,
    body: { clanId: Number(v.clanId), playerId: Number(v.playerId), reason: v.reason || null }
  })
);

handleForm("listAdminsForm", (v) =>
  api(`/api/clans/${Number(v.clanId)}/admins`, {
    auth: true
  })
);

handleForm("addAdminForm", (v) =>
  api(`/api/clans/${Number(v.clanId)}/admins`, {
    method: "POST",
    auth: true,
    body: { email: v.email }
  })
);

handleForm("overviewForm", () =>
  api("/api/admin/overview", {
    auth: true
  })
);

handleForm("blockUserForm", (v) =>
  api("/api/admin/block-user", {
    method: "POST",
    auth: true,
    body: { userId: Number(v.userId), reason: v.reason || null }
  })
);

handleForm("unblockUserForm", (v) =>
  api("/api/admin/unblock-user", {
    method: "POST",
    auth: true,
    body: { userId: Number(v.userId) }
  })
);
