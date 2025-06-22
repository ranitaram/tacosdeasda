import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { name, email } = await request.json()

    console.log("=== INICIO REGISTRO ===")
    console.log("Datos recibidos:", { name, email })

    // Solo configuración de Brevo
    const BREVO_API_KEY = process.env.BREVO_API_KEY
    const BREVO_LIST_ID = process.env.BREVO_LIST_ID

    console.log("Variables de entorno:", {
      BREVO_API_KEY: BREVO_API_KEY ? "✅ Configurada" : "❌ Faltante",
      BREVO_LIST_ID: BREVO_LIST_ID || "No configurada (opcional)",
    })

    if (!BREVO_API_KEY) {
      console.error("❌ BREVO_API_KEY no está configurada")
      return NextResponse.json({ error: "Configuración de Brevo faltante" }, { status: 500 })
    }

    // URL de la API de Brevo para crear contactos
    const brevoUrl = "https://api.brevo.com/v3/contacts"

    const brevoContactData = {
      email: email,
      attributes: {
        FIRSTNAME: name.split(" ")[0], // Primer nombre
        LASTNAME: name.split(" ").slice(1).join(" ") || "", // Apellidos
        SOURCE: "Taqueria Ruleta", // Para identificar de dónde vienen
      },
      listIds: BREVO_LIST_ID ? [Number.parseInt(BREVO_LIST_ID)] : [], // Agregar a lista específica
      updateEnabled: true, // Actualizar si ya existe
    }

    console.log("📤 Enviando a Brevo:", brevoContactData)
    console.log("🔗 URL:", brevoUrl)

    const brevoResponse = await fetch(brevoUrl, {
      method: "POST",
      headers: {
        "api-key": BREVO_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(brevoContactData),
    })

    console.log("📥 Respuesta de Brevo - Status:", brevoResponse.status)

    const brevoData = await brevoResponse.json()
    console.log("📥 Respuesta de Brevo - Data:", brevoData)

    if (brevoResponse.ok) {
      console.log("✅ Usuario registrado exitosamente en Brevo:", email)
      return NextResponse.json({
        success: true,
        message: "Usuario registrado exitosamente",
        brevoId: brevoData.id,
      })
    } else {
      // Si el usuario ya existe en Brevo
      if (brevoResponse.status === 400 && brevoData.code === "duplicate_parameter") {
        console.log("⚠️ Usuario ya existe en Brevo:", email)
        return NextResponse.json({
          success: true,
          message: "Usuario ya registrado",
        })
      }

      console.error("❌ Error de Brevo:", brevoData)
      return NextResponse.json(
        {
          error: "Error registrando usuario",
          details: brevoData,
        },
        { status: brevoResponse.status },
      )
    }
  } catch (error) {
    console.error("💥 Error en register-user API:", error)
    return NextResponse.json(
      {
        error: "Error interno del servidor",
        details: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 },
    )
  }
}
