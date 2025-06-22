import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { name, email } = await request.json()

    // Tu API Key de Mailchimp (la obtienes de tu cuenta)
    const MAILCHIMP_API_KEY = process.env.MAILCHIMP_API_KEY
    const MAILCHIMP_AUDIENCE_ID = process.env.MAILCHIMP_AUDIENCE_ID
    const MAILCHIMP_SERVER_PREFIX = process.env.MAILCHIMP_SERVER_PREFIX // ej: us21

    // Configuración de Brevo
    const BREVO_API_KEY = process.env.BREVO_API_KEY
    const BREVO_LIST_ID = process.env.BREVO_LIST_ID

    if (!MAILCHIMP_API_KEY || !MAILCHIMP_AUDIENCE_ID || !MAILCHIMP_SERVER_PREFIX) {
      console.error("Missing Mailchimp configuration")
      return NextResponse.json({ error: "Configuración de Mailchimp faltante" }, { status: 500 })
    }

    if (!BREVO_API_KEY) {
      console.error("Missing Brevo API Key")
      return NextResponse.json({ error: "Configuración de Brevo faltante" }, { status: 500 })
    }

    // URL de la API de Mailchimp para crear miembros
    const mailchimpUrl = `https://${MAILCHIMP_SERVER_PREFIX}.api.mailchimp.com/3.0/lists/${MAILCHIMP_AUDIENCE_ID}/members`

    // URL de la API de Brevo para crear contactos
    const brevoUrl = "https://api.brevo.com/v3/contacts"

    const mailchimpResponse = await fetch(mailchimpUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${MAILCHIMP_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email_address: email,
        status: "subscribed",
        merge_fields: {
          FNAME: name.split(" ")[0], // Primer nombre
          LNAME: name.split(" ").slice(1).join(" ") || "", // Apellidos
        },
        tags: ["taqueria-wheel"], // Tag para identificar de dónde vienen
      }),
    })

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

    console.log("Registrando usuario en Brevo:", { email, name })

    const brevoResponse = await fetch(brevoUrl, {
      method: "POST",
      headers: {
        "api-key": BREVO_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(brevoContactData),
    })

    const mailchimpData = await mailchimpResponse.json()
    const brevoData = await brevoResponse.json()

    if (mailchimpResponse.ok) {
      console.log("User registered in Mailchimp:", email)
    } else {
      // Si el usuario ya existe, Mailchimp devuelve error 400
      if (mailchimpData.title === "Member Exists") {
        console.log("User already exists in Mailchimp:", email)
      } else {
        console.error("Mailchimp error:", mailchimpData)
        return NextResponse.json(
          { error: "Error registrando usuario en Mailchimp", details: mailchimpData },
          { status: 400 },
        )
      }
    }

    if (brevoResponse.ok) {
      console.log("Usuario registrado exitosamente en Brevo:", email)
      return NextResponse.json({
        success: true,
        message: "Usuario registrado exitosamente",
        brevoId: brevoData.id,
      })
    } else {
      // Si el usuario ya existe en Brevo
      if (brevoResponse.status === 400 && brevoData.code === "duplicate_parameter") {
        console.log("Usuario ya existe en Brevo:", email)
        return NextResponse.json({
          success: true,
          message: "Usuario ya registrado",
        })
      }

      console.error("Error de Brevo:", brevoData)
      return NextResponse.json(
        {
          error: "Error registrando usuario",
          details: brevoData,
        },
        { status: brevoResponse.status },
      )
    }
  } catch (error) {
    console.error("Error en register-user API:", error)
    return NextResponse.json(
      {
        error: "Error interno del servidor",
        details: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 },
    )
  }
}
