// supabase/functions/send-email/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import nodemailer from "https://deno.land/x/nodemailer@v6.9.7/mod.ts"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

type Payload = {
  to: string
  subject: string
  body: string
}

serve(async (req) => {
  // CORS preflight
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders })

  try {
    const { to, subject, body } = (await req.json()) as Payload

    if (!to || !subject || !body) {
      return new Response(JSON.stringify({ error: "Missing to/subject/body" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    const user = Deno.env.get("NODEMAILER_USER")
    const pass = Deno.env.get("NODEMAILER_PASS")

    if (!user || !pass) {
      return new Response(JSON.stringify({ error: "Missing NODEMAILER_USER/NODEMAILER_PASS env vars" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user, pass },
    })

    await transporter.sendMail({
      from: user,
      to,
      subject,
      text: body,
      html: `<p>${body.replace(/\n/g, "<br>")}</p>`,
    })

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }
})
