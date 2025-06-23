"use client"

import { useState, useEffect } from "react"
import RegistrationForm from "@/components/registration-form"
import WheelGame from "@/components/wheel-game"
import CountdownTimer from "@/components/countdown-timer"
import { Card, CardContent } from "@/components/ui/card"

interface User {
  name: string
  email: string
  lastSpin: number
  spinsToday: number
  sharedToday: boolean
}

export default function Home() {
  const [user, setUser] = useState<User | null>(null)
  const [gameState, setGameState] = useState<"registration" | "canSpin" | "waiting" | "menu">("registration")
  const [timeLeft, setTimeLeft] = useState(0)
  const [currentView, setCurrentView] = useState<"wheel" | "menu">("wheel")

  // Cargar usuario al iniciar
  useEffect(() => {
    const savedUser = localStorage.getItem("taqueria-user")
    if (savedUser) {
      try {
        const userData: User = JSON.parse(savedUser)
        setUser(userData)
        // Solo verificar estado si ya existe un usuario
        checkUserStatus(userData)
      } catch (error) {
        console.error("Error loading user:", error)
        localStorage.removeItem("taqueria-user")
      }
    }
  }, [])

  // Timer countdown
  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => {
        setTimeLeft(timeLeft - 1)
        if (timeLeft === 1) {
          setGameState("canSpin")
        }
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [timeLeft])

  const checkUserStatus = (userData: User) => {
    const now = Date.now()
    const oneHour = 60 * 60 * 1000
    const oneDay = 24 * 60 * 60 * 1000

    console.log("Checking user status:", {
      lastSpin: userData.lastSpin,
      spinsToday: userData.spinsToday,
      sharedToday: userData.sharedToday,
      timeSinceLastSpin: userData.lastSpin > 0 ? Math.floor((now - userData.lastSpin) / 1000 / 60) : "never",
    })

    // Resetear contadores diarios
    if (userData.lastSpin > 0) {
      const daysSinceLastSpin = Math.floor((now - userData.lastSpin) / oneDay)
      if (daysSinceLastSpin > 0) {
        userData.spinsToday = 0
        userData.sharedToday = false
        localStorage.setItem("taqueria-user", JSON.stringify(userData))
        setUser(userData)
      }
    }

    // Si nunca ha girado, puede girar
    if (userData.lastSpin === 0) {
      console.log("User never spun, can spin")
      setGameState("canSpin")
      return
    }

    // Si ha pasado más de 1 hora y tiene giros disponibles
    if (now - userData.lastSpin >= oneHour && userData.spinsToday < 2) {
      console.log("Can spin - time passed and spins available")
      setGameState("canSpin")
    } else {
      console.log("Must wait")
      setGameState("waiting")
      setTimeLeft(Math.ceil((oneHour - (now - userData.lastSpin)) / 1000))
    }
  }

  const handleRegister = async (name: string, email: string) => {
    const newUser: User = {
      name,
      email,
      lastSpin: 0, // Nunca ha girado
      spinsToday: 0,
      sharedToday: false,
    }

    console.log("=== REGISTRANDO USUARIO ===")
    console.log("Datos del usuario:", newUser)

    // Guardar usuario localmente primero
    localStorage.setItem("taqueria-user", JSON.stringify(newUser))
    setUser(newUser)

    // Ir directamente a la ruleta
    setGameState("canSpin")

    // Integración con Brevo
    try {
      console.log("🚀 Enviando a API de registro...")
      const response = await fetch("/api/register-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email }),
      })

      console.log("📥 Respuesta de API - Status:", response.status)

      const result = await response.json()
      console.log("📥 Respuesta de API - Data:", result)

      if (response.ok) {
        console.log("✅ Usuario registrado exitosamente en Brevo")
      } else {
        console.error("❌ Error registrando en Brevo:", result)
      }
    } catch (error) {
      console.error("💥 Error llamando a API de registro:", error)
    }
  }

  const handleSpin = (won: boolean) => {
    if (!user) return

    console.log("User spun, won:", won)

    const updatedUser = {
      ...user,
      lastSpin: Date.now(),
      spinsToday: user.spinsToday + 1,
    }

    localStorage.setItem("taqueria-user", JSON.stringify(updatedUser))
    setUser(updatedUser)

    // NO verificar estado inmediatamente después del giro
    // El componente WheelGame manejará mostrar el resultado
  }

  const handleShare = () => {
    if (!user) return

    console.log("User shared")

    const updatedUser = {
      ...user,
      sharedToday: true,
    }

    localStorage.setItem("taqueria-user", JSON.stringify(updatedUser))
    setUser(updatedUser)

    // Permitir segundo giro inmediatamente
    setGameState("canSpin")
  }

  const formatTimeLeft = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`
  }

  const goToMenu = () => {
    setCurrentView("menu")
  }

  const backToWheel = () => {
    setCurrentView("wheel")
    // Verificar estado del usuario cuando regrese de menú
    if (user) {
      checkUserStatus(user)
    }
  }

  if (currentView === "menu") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-brand-red via-brand-black to-brand-mustard">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center mb-8">
            <button onClick={backToWheel} className="text-white hover:text-brand-mustard transition-colors">
              ← Volver a la Ruleta
            </button>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-xl">
  <h1 className="text-3xl font-bold text-brand-black text-center mb-6">
    🌮 Menú - Tacos al Carbón y Salsas Bravas 🌮
  </h1>

  <div className="space-y-6 text-brand-black">
    {/* Tacos */}
    <div>
      <h2 className="text-2xl font-semibold text-center mb-2">🌮 Tacos</h2>
      <ul className="space-y-1 text-center">
        <li><span className="font-bold">Taco de Sirloin “Sirlón”</span> – $40</li>
        <li><span className="font-bold">Taco de Chorizo Asadero “Corona”</span> – $40</li>
        <li><span className="font-bold">Taco Combinado (Sirlón + Corona)</span> – $40</li>
      </ul>
      <p className="mt-2 text-center text-sm text-gray-600">Incluye acceso libre a nuestra barra de salsas bravas 🔥</p>
    </div>

    {/* Quesadillas */}
    <div>
      <h2 className="text-2xl font-semibold text-center mb-2">🧀 Quesadillas</h2>
      <ul className="space-y-1 text-center">
        <li><span className="font-bold">Quesadilla Natural</span> – $40</li>
        <li><span className="font-bold">Quesadilla con Sirloin</span> – $50</li>
        <li><span className="font-bold">Quesadilla con Chorizo</span> – $50</li>
        <li><span className="font-bold">Quesadilla Combinada</span> – $50</li>
      </ul>
    </div>

    {/* Salsas */}
    <div>
      <h2 className="text-2xl font-semibold text-center mb-2">🧴 Salsas Bravas (¡Auto‑servicio!)</h2>
    </div>

    {/* Refrescos */}
    <div>
      <h2 className="text-2xl font-semibold text-center mb-2">🥤 Refrescos de Vidrio</h2>
      <p className="text-center">Todos a <span className="font-bold">$20</span></p>
    </div>
  </div>
</div>

        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-red via-brand-black to-brand-mustard">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-2">🌮 Tacos al Carbon</h1>
          <h2 className="text-2xl md:text-3xl font-semibold text-brand-mustard">y Salsas Bravas</h2>
          <p className="text-white/80 mt-4 text-lg">¡Gira la ruleta y gana premios increíbles! 🎰</p>
        </div>

        {/* Debug info */}
        <div className="text-center mb-4 text-white text-sm">
          Estado actual: {gameState} | Usuario: {user?.name || "No registrado"}
        </div>

        {/* Contenido principal */}
        <div className="max-w-2xl mx-auto">
          {gameState === "registration" && (
            <Card className="bg-white/95 backdrop-blur">
              <CardContent className="p-8">
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-brand-black mb-2">¡Bienvenido! 🎉</h3>
                  <p className="text-gray-600">Regístrate para girar la ruleta y ganar premios increíbles</p>
                </div>
                <RegistrationForm onRegister={handleRegister} />
              </CardContent>
            </Card>
          )}

          {gameState === "canSpin" && user && (
            <WheelGame
              user={user}
              onSpin={handleSpin}
              onShare={handleShare}
              canGetSecondChance={user.spinsToday === 1 && !user.sharedToday}
              onGoToMenu={goToMenu}
            />
          )}

          {gameState === "waiting" && user && (
            <CountdownTimer timeLeft={timeLeft} formatTime={formatTimeLeft} user={user} />
          )}
        </div>
      </div>
    </div>
  )
}
