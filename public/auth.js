const output = document.getElementById("output");

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

async function api(path, { method = "GET", body } = {}) {
  const res = await fetch(path, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || "Request failed");
  return data;
}

function bindForm(formId, handler, after) {
  const form = document.getElementById(formId);
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    try {
      const data = await handler(formToObj(form));
      print(data);
      if (after) after(data);
    } catch (error) {
      print({ error: error.message });
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
}, (data) => {
  if (data.token) {
    localStorage.setItem("cm_token", data.token);
    localStorage.setItem("cm_role", data.user?.role || "");
    window.location.href = "/dashboard";
  }
});

bindForm("ownerRegisterForm", (v) => api("/api/auth/register-owner", {
  method: "POST",
  body: { email: v.email, password: v.password, displayName: v.displayName, clanName: v.clanName }
}));

bindForm("managerRegisterForm", (v) => api("/api/auth/register-manager", {
  method: "POST",
  body: { email: v.email, password: v.password, displayName: v.displayName }
}));
