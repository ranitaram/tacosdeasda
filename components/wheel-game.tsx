"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

interface WheelGameProps {
  user: { name: string; spinsToday: number; sharedToday: boolean }
  onSpin: (won: boolean) => void
  onShare: () => void
  canGetSecondChance: boolean
  onGoToMenu: () => void
}

const prizes = [
  { label: "🌮 1 Taco Gratis", chance: 0.15, color: "#DC2626", textColor: "white" },
  { label: "🥤 1 Refresco Gratis", chance: 0.15, color: "#D97706", textColor: "white" },
  { label: "💰 10% Descuento", chance: 0.15, color: "#DC2626", textColor: "white" },
  { label: "💰 20% Descuento", chance: 0.15, color: "#D97706", textColor: "white" },
  { label: "😞 Sin Premio", chance: 0.2, color: "#1F1F1F", textColor: "white" },
  { label: "😞 Sin Premio", chance: 0.2, color: "#1F1F1F", textColor: "white" },
]

// Utilidad para escoger premio basado en probabilidad
function getRandomPrize() {
  const rand = Math.random()
  let cumulative = 0
  for (let i = 0; i < prizes.length; i++) {
    cumulative += prizes[i].chance
    if (rand < cumulative) return { prize: prizes[i], index: i }
  }
  return { prize: prizes[prizes.length - 1], index: prizes.length - 1 }
}

export default function WheelGame({ user, onSpin, onShare, canGetSecondChance, onGoToMenu }: WheelGameProps) {
  const [isSpinning, setIsSpinning] = useState(false)
  const [result, setResult] = useState<{ label: string; color: string } | null>(null)
  const [showResult, setShowResult] = useState(false)
  const wheelRef = useRef<HTMLDivElement>(null)

  console.log("WheelGame - canGetSecondChance:", canGetSecondChance, "user:", user)

  const handleSpin = () => {
    if (isSpinning) return

    setIsSpinning(true)
    setShowResult(false)
    setResult(null)

    // Resetear la ruleta a posición inicial
    if (wheelRef.current) {
      wheelRef.current.style.transition = "none"
      wheelRef.current.style.transform = "rotate(0deg)"
    }

    // Obtener premio aleatorio
    const { prize, index } = getRandomPrize()

    console.log("Prize won:", prize.label, "Won:", prize.label !== "😞 Sin Premio")

    // Calcular ángulo final
    const segmentAngle = 360 / prizes.length
    const targetAngle = index * segmentAngle + segmentAngle / 2
    const spins = 8 + Math.random() * 4 // Entre 8 y 12 vueltas completas
    const finalAngle = spins * 360 + (360 - targetAngle) // Invertir porque la ruleta gira en sentido contrario

    // Aplicar animación después de un pequeño delay
    setTimeout(() => {
      if (wheelRef.current) {
        wheelRef.current.style.transition = "transform 4s cubic-bezier(0.17, 0.67, 0.12, 0.99)"
        wheelRef.current.style.transform = `rotate(${finalAngle}deg)`
      }
    }, 100)

    // Mostrar resultado después de la animación
    setTimeout(() => {
      setResult(prize)
      setShowResult(true)
      setIsSpinning(false)
      onSpin(prize.label !== "😞 Sin Premio")
    }, 4200)
  }

  const handleSecondChance = (platform: string) => {
    // Simular compartir en redes sociales
    const message = "¡Estoy probando suerte en Tacos al Carbon y Salsas Bravas! 🌮🎰"
    const url = window.location.href

    if (platform === "facebook") {
      window.open(
        `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(message)}`,
        "_blank",
      )
    } else if (platform === "whatsapp") {
      window.open(`https://wa.me/?text=${encodeURIComponent(message + " " + url)}`, "_blank")
    }

    onShare()
    setShowResult(false)
    setResult(null)
  }

  return (
    <Card className="bg-white/95 backdrop-blur">
      <CardContent className="p-8 space-y-6 text-center">
        {!showResult ? (
          <>
            <h3 className="text-2xl font-semibold text-brand-black">¡Gira la ruleta, {user.name}!</h3>

            {/* Debug info */}
            <div className="text-xs text-gray-500">
              Giros hoy: {user.spinsToday} | Compartido: {user.sharedToday ? "Sí" : "No"} | Segunda oportunidad:{" "}
              {canGetSecondChance ? "Sí" : "No"}
            </div>

            {/* Ruleta */}
            <div className="relative mx-auto w-80 h-80">
              {/* Indicador/Flecha */}
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-2 z-10">
                <div className="w-0 h-0 border-l-6 border-r-6 border-b-12 border-l-transparent border-r-transparent border-b-brand-mustard shadow-lg"></div>
              </div>

              {/* Ruleta */}
              <div
                ref={wheelRef}
                className="w-full h-full rounded-full border-8 border-brand-black relative overflow-hidden shadow-2xl"
              >
                {prizes.map((prize, index) => {
                  const segmentAngle = 360 / prizes.length
                  const startAngle = segmentAngle * index
                  const endAngle = segmentAngle * (index + 1)
                  const midAngle = startAngle + segmentAngle / 2

                  // Coordenadas para el texto (más cerca del borde)
                  const textRadius = 110 // Más lejos del centro
                  const textX = 50 + (textRadius / 160) * 50 * Math.cos(((midAngle - 90) * Math.PI) / 180)
                  const textY = 50 + (textRadius / 160) * 50 * Math.sin(((midAngle - 90) * Math.PI) / 180)

                  return (
                    <div key={index} className="absolute inset-0">
                      {/* Segmento de color */}
                      <div
                        className="absolute inset-0 w-full h-full"
                        style={{
                          background: `conic-gradient(from ${startAngle}deg, ${prize.color} 0deg, ${prize.color} ${segmentAngle}deg, transparent ${segmentAngle}deg)`,
                          clipPath: `polygon(50% 50%, ${50 + 50 * Math.cos(((startAngle - 90) * Math.PI) / 180)}% ${50 + 50 * Math.sin(((startAngle - 90) * Math.PI) / 180)}%, ${50 + 50 * Math.cos(((endAngle - 90) * Math.PI) / 180)}% ${50 + 50 * Math.sin(((endAngle - 90) * Math.PI) / 180)}%)`,
                        }}
                      />

                      {/* Texto del premio */}
                      <div
                        className="absolute font-bold text-xs leading-tight pointer-events-none"
                        style={{
                          left: `${textX}%`,
                          top: `${textY}%`,
                          transform: `translate(-50%, -50%) rotate(${midAngle}deg)`,
                          color: prize.textColor,
                          textShadow: "1px 1px 2px rgba(0,0,0,0.8)",
                          width: "80px",
                          textAlign: "center",
                        }}
                      >
                        {prize.label}
                      </div>

                      {/* Línea divisoria */}
                      <div
                        className="absolute bg-white opacity-30"
                        style={{
                          left: "50%",
                          top: "50%",
                          width: "2px",
                          height: "50%",
                          transformOrigin: "top center",
                          transform: `rotate(${startAngle}deg)`,
                        }}
                      />
                    </div>
                  )
                })}

                {/* Centro de la ruleta */}
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-brand-mustard rounded-full border-4 border-white shadow-lg flex items-center justify-center">
                  <div className="text-2xl">🎰</div>
                </div>
              </div>
            </div>

            <Button onClick={handleSpin} disabled={isSpinning} size="lg" className="w-full text-xl py-6">
              {isSpinning ? "Girando... 🎰" : "¡GIRAR RULETA! 🎰"}
            </Button>
          </>
        ) : (
          <>
            <h3 className="text-2xl font-semibold text-brand-black">¡Tu Premio!</h3>
            <div
              className="mx-auto w-32 h-32 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-2xl"
              style={{ backgroundColor: result?.color }}
            >
              {result?.label}
            </div>

            {result?.label === "😞 Sin Premio" && canGetSecondChance ? (
              <>
                <p className="text-gray-700">
                  ¡No te desanimes! Comparte en redes sociales para obtener un segundo intento
                </p>
                <div className="flex flex-col gap-4">
                  <Button
                    onClick={() => handleSecondChance("facebook")}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    📘 Compartir en Facebook
                  </Button>
                  <Button
                    onClick={() => handleSecondChance("whatsapp")}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    📱 Compartir por WhatsApp
                  </Button>
                </div>
              </>
            ) : (
              <>
                {result?.label !== "😞 Sin Premio" && (
                  <div className="bg-green-100 border border-green-400 rounded-lg p-4">
                    <p className="text-green-800 font-semibold">
                      ¡Felicidades! Muestra esta pantalla en el restaurante para reclamar tu premio.
                    </p>
                    <p className="text-sm text-green-600 mt-2">Código: TACO-{Date.now().toString().slice(-6)}</p>
                  </div>
                )}
                <Button onClick={onGoToMenu} className="w-full">
                  Ver Menú de la Taquería 🌮
                </Button>
              </>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
