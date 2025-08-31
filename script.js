document.addEventListener("DOMContentLoaded", () => {
  const logregBox = document.querySelector(".logreg-box")
  const loginLink = document.querySelector(".login-link")
  const registerLink = document.querySelector(".register-link")

  registerLink.addEventListener("click", (e) => {
    e.preventDefault()
    logregBox.classList.add("active")
  })

  loginLink.addEventListener("click", (e) => {
    e.preventDefault()
    logregBox.classList.remove("active")
  })

  const loginButton = document.getElementById("loginButton")

  loginButton.addEventListener("click", (event) => {
    event.preventDefault()

    // For demo purposes, we'll allow any login
    // In a real app, you would validate credentials
    window.location.href = "dashboard.html"
  })
})
