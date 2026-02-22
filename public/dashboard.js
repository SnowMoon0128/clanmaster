const output = document.getElementById("output");
const siteAdminSection = document.getElementById("section-site-admin");
const siteAdminMenu = document.getElementById("siteAdminMenu");
const ownerInviteMenu = document.getElementById("ownerInviteMenu");
const dashMenu = document.getElementById("dashMenu");
const sessionBadge = document.getElementById("sessionBadge");
const ownerInviteCode = document.getElementById("ownerInviteCode");

const token = localStorage.getItem("cm_token") || "";
const role = localStorage.getItem("cm_role") || "";

if (!token) {
  window.location.href = "/login";
}

let currentClanId = null;

if (role === "site_admin") {
  siteAdminSection.classList.remove("hidden");
  siteAdminMenu.classList.remove("hidden");
}
if (role === "owner") {
  ownerInviteMenu.classList.remove("hidden");
}

document.getElementById("logoutBtn").addEventListener("click", () => {
  localStorage.removeItem("cm_token");
  localStorage.removeItem("cm_role");
  window.location.href = "/login";
});

dashMenu.addEventListener("click", (e) => {
  const btn = e.target.closest(".menu-btn");
  if (!btn) return;

  for (const item of dashMenu.querySelectorAll(".menu-btn")) item.classList.remove("active");
  btn.classList.add("active");

  for (const panel of document.querySelectorAll(".section-panel")) panel.classList.add("hidden");
  const targetPanel = document.getElementById(btn.dataset.target);
  if (targetPanel) targetPanel.classList.remove("hidden");
});

function print(data) {
  if (output) output.textContent = JSON.stringify(data, null, 2);
}

function formToObj(form) {
  const fd = new FormData(form);
  const obj = {};
  for (const [key, value] of fd.entries()) obj[key] = typeof value === "string" ? value.trim() : value;
  return obj;
}

async function api(path, { method = "GET", body, auth = true } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (auth) {
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

async function loadSession() {
  const me = await api("/api/auth/me");
  currentClanId = me?.user?.clanId || null;
  const roleLabel = me?.user?.role || role;
  sessionBadge.textContent = currentClanId
    ? `${roleLabel} | clan:${currentClanId}`
    : `${roleLabel} | no clan`;
}

function withClan(body) {
  if (currentClanId) return { ...body, clanId: currentClanId };
  return body;
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
      alert(error.message);
    }
  });
}

bindForm("addPlayerForm", (v) =>
  api("/api/players", {
    method: "POST",
    body: withClan({ gameUid: v.gameUid, nickname: v.nickname })
  })
);

bindForm("historyForm", (v) => api(`/api/players/${Number(v.playerId)}/history`));

bindForm("blacklistForm", (v) =>
  api("/api/blacklist", {
    method: "POST",
    body: withClan({ playerId: Number(v.playerId), reason: v.reason || null })
  })
);

bindForm("blacklistListForm", () =>
  api(currentClanId ? `/api/blacklist?clanId=${currentClanId}` : "/api/blacklist")
);

bindForm("unblacklistForm", (v) =>
  api(
    currentClanId
      ? `/api/blacklist/${Number(v.entryId)}?clanId=${currentClanId}`
      : `/api/blacklist/${Number(v.entryId)}`,
    { method: "DELETE" }
  )
);

bindForm("listAdminsForm", () => api("/api/clans/admins/me"));

bindForm("removeAdminForm", (v) =>
  api(`/api/clans/admins/me/${Number(v.userId)}`, {
    method: "DELETE"
  })
);

bindForm("overviewForm", () => api("/api/admin/overview"));

bindForm("pendingOwnersForm", () => api("/api/admin/pending-owners"));

bindForm("approveOwnerForm", (v) =>
  api(`/api/admin/pending-owners/${Number(v.requestId)}/approve`, {
    method: "POST",
    body: {}
  })
);

bindForm("rejectOwnerForm", (v) =>
  api(`/api/admin/pending-owners/${Number(v.requestId)}/reject`, {
    method: "POST",
    body: { reason: v.reason || null }
  })
);

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

loadSession().catch((error) => {
  alert(error.message);
  window.location.href = "/login";
});

if (role === "owner") {
  api("/api/clans/admins/me")
    .then((data) => {
      const code = data?.clan?.invite_code;
      if (code && ownerInviteCode) ownerInviteCode.textContent = `Invite code: ${code}`;
    })
    .catch(() => {});
}
