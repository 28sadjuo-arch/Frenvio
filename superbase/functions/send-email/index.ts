// supabase/functions/send-email/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import nodemailer from "https://deno.land/x/nodemailer@v6.9.7/mod.ts"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    const { to, subject, body } = await req.json()

    const transporter = nodemailer.createTransport({
      host: Deno.env.get("NODEMAILER_HOST") || "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: {
        user: Deno.env.get("NODEMAILER_USER"),
        pass: Deno.env.get("NODEMAILER_PASS"),
      },
    })

    await transporter.sendMail({
      from: `"FREVIO" <${Deno.env.get("NODEMAILER_USER")}>`,
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