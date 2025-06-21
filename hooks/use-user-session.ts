"use client"

import { useState, useEffect } from "react"

export interface UserSession {
  id: string
  name: string
  email: string
  lastSpin: number
  spinsToday: number
  sharedToday: boolean
  registeredAt: number
}

export interface UserState {
  user: UserSession | null
  canSpin: boolean
  timeUntilNextSpin: number
  needsRegistration: boolean
  canGetSecondChance: boolean
}

export function useUserSession() {
  const [userState, setUserState] = useState<UserState>({
    user: null,
    canSpin: false,
    timeUntilNextSpin: 0,
    needsRegistration: true,
    canGetSecondChance: false,
  })

  const [timeLeft, setTimeLeft] = useState(0)

  // Cargar usuario del localStorage al montar
  useEffect(() => {
    const savedUser = localStorage.getItem("taqueria-user")
    if (savedUser) {
      try {
        const user: UserSession = JSON.parse(savedUser)
        updateUserState(user)
      } catch (error) {
        console.error("Error parsing saved user:", error)
        localStorage.removeItem("taqueria-user")
      }
    }
  }, [])

  // Countdown timer
  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => {
        setTimeLeft(timeLeft - 1)
        if (timeLeft === 1) {
          // Recalcular estado cuando termine el countdown
          const savedUser = localStorage.getItem("taqueria-user")
          if (savedUser) {
            const user: UserSession = JSON.parse(savedUser)
            updateUserState(user)
          }
        }
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [timeLeft])

  const updateUserState = (user: UserSession) => {
    const now = Date.now()
    const oneHour = 60 * 60 * 1000 // 1 hora en milisegundos
    const oneDay = 24 * 60 * 60 * 1000 // 1 día en milisegundos

    // Resetear contadores diarios si ha pasado un día
    if (user.lastSpin > 0) {
      // Solo si ya ha girado antes
      const daysSinceLastSpin = Math.floor((now - user.lastSpin) / oneDay)
      if (daysSinceLastSpin > 0) {
        user.spinsToday = 0
        user.sharedToday = false
      }
    }

    // Si nunca ha girado (lastSpin = 0), puede girar inmediatamente
    const timeSinceLastSpin = user.lastSpin === 0 ? oneHour : now - user.lastSpin
    const canSpinByTime = timeSinceLastSpin >= oneHour
    const hasSpinsLeft = user.spinsToday < 2

    const canSpin = canSpinByTime && hasSpinsLeft
    const timeUntilNextSpin = canSpinByTime ? 0 : Math.ceil((oneHour - timeSinceLastSpin) / 1000)

    console.log("Debug - User state:", {
      lastSpin: user.lastSpin,
      timeSinceLastSpin: Math.floor(timeSinceLastSpin / 1000 / 60), // en minutos
      canSpinByTime,
      hasSpinsLeft,
      canSpin,
      spinsToday: user.spinsToday,
    })

    const canGetSecondChance = user.spinsToday === 1 && !user.sharedToday

    setUserState({
      user,
      canSpin,
      timeUntilNextSpin,
      needsRegistration: false,
      canGetSecondChance,
    })

    setTimeLeft(timeUntilNextSpin)

    // Guardar usuario actualizado
    localStorage.setItem("taqueria-user", JSON.stringify(user))
  }

  const registerUser = async (name: string, email: string) => {
    const now = Date.now()
    const newUser: UserSession = {
      id: `user_${now}`,
      name,
      email,
      lastSpin: 0, // Nunca ha girado, puede girar inmediatamente
      spinsToday: 0,
      sharedToday: false,
      registeredAt: now,
    }

    // Aquí integraremos con Mailchimp
    try {
      await fetch("/api/register-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email }),
      })
    } catch (error) {
      console.error("Error registering user:", error)
    }

    localStorage.setItem("taqueria-user", JSON.stringify(newUser))

    // Establecer estado directamente para usuario recién registrado
    setUserState({
      user: newUser,
      canSpin: true, // Puede girar inmediatamente
      timeUntilNextSpin: 0,
      needsRegistration: false,
      canGetSecondChance: false,
    })

    setTimeLeft(0)
  }

  const recordSpin = (won: boolean) => {
    if (!userState.user) return

    const updatedUser = {
      ...userState.user,
      lastSpin: Date.now(),
      spinsToday: userState.user.spinsToday + 1,
    }

    updateUserState(updatedUser)
  }

  const recordShare = () => {
    if (!userState.user) return

    const updatedUser = {
      ...userState.user,
      sharedToday: true,
    }

    updateUserState(updatedUser)
  }

  const formatTimeLeft = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`
  }

  return {
    ...userState,
    timeLeft,
    registerUser,
    recordSpin,
    recordShare,
    formatTimeLeft,
  }
}
