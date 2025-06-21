"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

interface CountdownTimerProps {
  timeLeft: number
  formatTime: (seconds: number) => string
  user: {
    name: string
  } | null
}

export default function CountdownTimer({ timeLeft, formatTime, user }: CountdownTimerProps) {
  const percent = (timeLeft / 3600) * 100 // 1 h → 3600 s

  return (
    <Card className="bg-white/95 backdrop-blur">
      <CardContent className="p-8 space-y-6 text-center">
        <h3 className="text-xl font-semibold text-brand-black">
          {`Hola ${user?.name ?? ""}, todavía no puedes girar`}
        </h3>
        <p className="text-gray-700">Regresa en:</p>
        <p className="text-4xl font-bold text-brand-red">{formatTime(timeLeft)}</p>
        <Progress value={100 - percent} />
      </CardContent>
    </Card>
  )
}
