document.addEventListener("DOMContentLoaded", () => {
  const logregBox = document.querySelector(".logreg-box")
  const loginLink = document.querySelector(".login-link")
  const registerLink = document.querySelector(".register-link")

  if (registerLink && logregBox) {
    registerLink.addEventListener("click", (e) => {
      e.preventDefault()
      logregBox.classList.add("active")
    })
  }

  if (loginLink && logregBox) {
    loginLink.addEventListener("click", (e) => {
      e.preventDefault()
      logregBox.classList.remove("active")
    })
  }

  // Update navbar based on auth status and set up login redirection on load
  fetch("/api/me")
    .then(r => r.json())
    .then(data => {
      if (data.success && data.authenticated) {
        // If on the login page (index.html), redirect to dashboard
        if (window.location.pathname.endsWith("index.html") || window.location.pathname === "/") {
          window.location.href = "/dashboard"
        }
        
        // Dynamically add Dashboard and Logout links to navbar on other pages
        const navbars = document.querySelectorAll(".navbar");
        navbars.forEach(navbar => {
          if (!navbar.querySelector('a[href="/dashboard"]')) {
            const dashboardLink = document.createElement("a");
            dashboardLink.href = "/dashboard";
            dashboardLink.textContent = "Dashboard";
            
            const logoutLink = document.createElement("a");
            logoutLink.href = "#";
            logoutLink.id = "nav-logout-btn";
            logoutLink.textContent = "Logout";
            logoutLink.addEventListener("click", (e) => {
              e.preventDefault();
              fetch("/api/logout", { method: "POST" })
                .then(() => {
                  window.location.href = "/";
                });
            });

            navbar.appendChild(dashboardLink);
            navbar.appendChild(logoutLink);
          }
        });
      }
    })
    .catch(err => console.error("Error checking session:", err));

  // Login handler
  const loginButton = document.getElementById("loginButton")
  if (loginButton) {
    loginButton.addEventListener("click", (event) => {
      event.preventDefault()
      const emailInput = document.getElementById("login-email")
      const passwordInput = document.getElementById("login-password")
      const errorDiv = document.getElementById("login-error")

      if (errorDiv) errorDiv.textContent = ""

      if (!emailInput || !passwordInput) return

      const email = emailInput.value.trim()
      const password = passwordInput.value.trim()

      if (!email || !password) {
        if (errorDiv) errorDiv.textContent = "Email and Password are required."
        return
      }

      fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      })
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          window.location.href = "/dashboard"
        } else {
          if (errorDiv) errorDiv.textContent = data.error || "Login failed."
        }
      })
      .catch(err => {
        console.error("Login request error:", err)
        if (errorDiv) errorDiv.textContent = "An error occurred. Please try again."
      })
    })
  }

  // Register handler
  const registerButton = document.getElementById("registerButton")
  if (registerButton) {
    registerButton.addEventListener("click", (event) => {
      event.preventDefault()
      const usernameInput = document.getElementById("register-username")
      const emailInput = document.getElementById("register-email")
      const passwordInput = document.getElementById("register-password")
      const termsCheckbox = document.getElementById("terms")
      const errorDiv = document.getElementById("register-error")

      if (errorDiv) errorDiv.textContent = ""

      if (!usernameInput || !emailInput || !passwordInput) return

      const username = usernameInput.value.trim()
      const email = emailInput.value.trim()
      const password = passwordInput.value.trim()

      if (!username || !email || !password) {
        if (errorDiv) errorDiv.textContent = "All fields are required."
        return
      }

      if (password.length < 6) {
        if (errorDiv) errorDiv.textContent = "Password must be at least 6 characters."
        return
      }

      if (termsCheckbox && !termsCheckbox.checked) {
        if (errorDiv) errorDiv.textContent = "You must agree to the Terms and Conditions."
        return
      }

      fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password })
      })
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          window.location.href = "/dashboard"
        } else {
          if (errorDiv) errorDiv.textContent = data.error || "Sign Up failed."
        }
      })
      .catch(err => {
        console.error("Signup request error:", err)
        if (errorDiv) errorDiv.textContent = "An error occurred. Please try again."
      })
    })
  }

  // Cyber City Particles Animation
  const canvas = document.getElementById("cyber-particles")
  if (canvas) {
    const ctx = canvas.getContext("2d")
    let particles = []
    
    const resizeCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resizeCanvas()
    window.addEventListener("resize", resizeCanvas)

    class Particle {
      constructor() {
        this.x = Math.random() * canvas.width
        this.y = Math.random() * canvas.height
        this.vx = (Math.random() - 0.5) * 0.8
        this.vy = (Math.random() - 0.5) * 0.8
        this.radius = Math.random() * 3.5 + 3.5
        const colors = ["rgba(0, 242, 254, ", "rgba(168, 85, 247, ", "rgba(236, 72, 153, "]
        this.colorPrefix = colors[Math.floor(Math.random() * colors.length)]
        this.alpha = Math.random() * 0.3 + 0.7
        this.alphaSpeed = 0.007 + Math.random() * 0.005
      }

      update() {
        this.x += this.vx
        this.y += this.vy
        
        if (this.x < 0 || this.x > canvas.width) this.vx *= -1
        if (this.y < 0 || this.y > canvas.height) this.vy *= -1

        this.alpha += this.alphaSpeed
        if (this.alpha > 1.0 || this.alpha < 0.5) {
          this.alphaSpeed *= -1
        }
      }

      draw() {
        ctx.beginPath()
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2)
        ctx.fillStyle = this.colorPrefix + this.alpha + ")"
        ctx.shadowColor = this.colorPrefix + "1)"
        ctx.shadowBlur = 20
        ctx.fill()
        ctx.shadowBlur = 0
      }
    }

    const initParticles = () => {
      particles = []
      const count = Math.min(180, Math.floor((canvas.width * canvas.height) / 8000))
      for (let i = 0; i < count; i++) {
        particles.push(new Particle())
      }
    }
    initParticles()

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      
      ctx.strokeStyle = "rgba(0, 242, 254, 0.12)"
      ctx.lineWidth = 1
      const gridSize = 80
      for (let x = 0; x < canvas.width; x += gridSize) {
        ctx.beginPath()
        ctx.moveTo(x, 0)
        ctx.lineTo(x, canvas.height)
        ctx.stroke()
      }
      for (let y = 0; y < canvas.height; y += gridSize) {
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(canvas.width, y)
        ctx.stroke()
      }

      for (let i = 0; i < particles.length; i++) {
        particles[i].update()
        particles[i].draw()
        
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x
          const dy = particles[i].y - particles[j].y
          const dist = Math.sqrt(dx * dx + dy * dy)
          
          if (dist < 150) {
            ctx.beginPath()
            ctx.moveTo(particles[i].x, particles[i].y)
            ctx.lineTo(particles[j].x, particles[j].y)
            const alpha = (1 - dist / 150) * 0.55
            ctx.strokeStyle = `rgba(0, 242, 254, ${alpha})`
            ctx.lineWidth = 1.2
            ctx.stroke()
          }
        }
      }
      
      requestAnimationFrame(animate)
    }
    animate()
  }
})
