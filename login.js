const loginForm = document.getElementById("loginForm");
const loginBtn = document.getElementById("loginBtn");
const loginStatus = document.getElementById("loginStatus");

function setLoginStatus(message, variant = "danger") {
  loginStatus.textContent = message;
  loginStatus.className = `alert alert-${variant}`;
  loginStatus.classList.remove("d-none");
}

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  loginBtn.disabled = true;
  loginStatus.classList.add("d-none");

  const payload = {
    username: document.getElementById("username").value.trim(),
    password: document.getElementById("password").value,
  };

  try {
    const response = await fetch("/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const result = await response.json();

    if (!result.success) {
      setLoginStatus(result.error || "Pogresan korisnik ili lozinka.");
      return;
    }

    window.location.href = result.redirect || "/admin.html";
  } catch (error) {
    setLoginStatus(error.message);
  } finally {
    loginBtn.disabled = false;
  }
});
