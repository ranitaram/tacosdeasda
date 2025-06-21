import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { name, email } = await request.json()

    // Tu API Key de Mailchimp (la obtienes de tu cuenta)
    const MAILCHIMP_API_KEY = process.env.MAILCHIMP_API_KEY
    const MAILCHIMP_AUDIENCE_ID = process.env.MAILCHIMP_AUDIENCE_ID
    const MAILCHIMP_SERVER_PREFIX = process.env.MAILCHIMP_SERVER_PREFIX // ej: us21

    if (!MAILCHIMP_API_KEY || !MAILCHIMP_AUDIENCE_ID || !MAILCHIMP_SERVER_PREFIX) {
      console.error("Missing Mailchimp configuration")
      return NextResponse.json({ error: "Configuration error" }, { status: 500 })
    }

    const url = `https://${MAILCHIMP_SERVER_PREFIX}.api.mailchimp.com/3.0/lists/${MAILCHIMP_AUDIENCE_ID}/members`

    const response = await fetch(url, {
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

    const data = await response.json()

    if (response.ok) {
      console.log("User registered in Mailchimp:", email)
      return NextResponse.json({ success: true, message: "Usuario registrado exitosamente" })
    } else {
      // Si el usuario ya existe, Mailchimp devuelve error 400
      if (data.title === "Member Exists") {
        console.log("User already exists in Mailchimp:", email)
        return NextResponse.json({ success: true, message: "Usuario ya registrado" })
      }

      console.error("Mailchimp error:", data)
      return NextResponse.json({ error: "Error registrando usuario" }, { status: 400 })
    }
  } catch (error) {
    console.error("Error in register-user API:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
