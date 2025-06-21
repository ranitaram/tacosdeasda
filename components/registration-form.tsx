"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"

interface RegistrationFormProps {
  onRegister: (name: string, email: string) => void
}

export default function RegistrationForm({ onRegister }: RegistrationFormProps) {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [consent, setConsent] = useState(true)
  const [error, setError] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !email.trim()) {
      setError("Por favor completa todos los campos.")
      return
    }
    if (!consent) {
      setError("Debes aceptar recibir comunicaciones para continuar.")
      return
    }
    onRegister(name.trim(), email.trim())
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label className="block mb-1" htmlFor="name">
          Nombre
        </Label>
        <Input id="name" placeholder="Tu nombre" value={name} onChange={(e) => setName(e.target.value)} required />
      </div>

      <div>
        <Label className="block mb-1" htmlFor="email">
          Correo
        </Label>
        <Input
          id="email"
          type="email"
          placeholder="correo@ejemplo.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>

      <div className="flex items-center gap-2">
        <Checkbox id="consent" checked={consent} onCheckedChange={(checked) => setConsent(!!checked)} />
        <Label htmlFor="consent" className="text-sm">
          Acepto recibir promociones por correo
        </Label>
      </div>

      {error && <p className="text-red-600 text-sm">{error}</p>}

      <Button type="submit" className="w-full">
        Registrarme y girar 🎉
      </Button>
    </form>
  )
}
