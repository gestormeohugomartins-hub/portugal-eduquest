import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EmailRequest {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { to, subject, html, text }: EmailRequest = await req.json();

    if (!to || !subject || !html) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: to, subject, html' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const smtpHost = Deno.env.get('SMTP_HOST')!;
    const smtpPort = parseInt(Deno.env.get('SMTP_PORT') || '465');
    const smtpUser = Deno.env.get('SMTP_USER')!;
    const smtpPassword = Deno.env.get('SMTP_PASSWORD')!;

    // Use Deno's native SMTP via external service
    // Since Deno edge functions can't do direct SMTP, we'll use a simple HTTP relay approach
    // For now, we'll construct the email and use a workaround

    // Base64 encode credentials for SMTP AUTH
    const authString = btoa(`\x00${smtpUser}\x00${smtpPassword}`);
    
    // Create email content in MIME format
    const boundary = `----=_Part_${Date.now()}`;
    const emailContent = [
      `From: Questeduca <noreply@questeduca.pt>`,
      `To: ${to}`,
      `Subject: ${subject}`,
      `MIME-Version: 1.0`,
      `Content-Type: multipart/alternative; boundary="${boundary}"`,
      ``,
      `--${boundary}`,
      `Content-Type: text/plain; charset=utf-8`,
      `Content-Transfer-Encoding: 7bit`,
      ``,
      text || html.replace(/<[^>]*>/g, ''),
      ``,
      `--${boundary}`,
      `Content-Type: text/html; charset=utf-8`,
      `Content-Transfer-Encoding: 7bit`,
      ``,
      html,
      ``,
      `--${boundary}--`,
    ].join('\r\n');

    // Connect to SMTP server using Deno.connect with TLS
    const conn = await Deno.connectTls({
      hostname: smtpHost,
      port: smtpPort,
    });

    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    const readResponse = async (): Promise<string> => {
      const buffer = new Uint8Array(1024);
      const n = await conn.read(buffer);
      return decoder.decode(buffer.subarray(0, n || 0));
    };

    const sendCommand = async (cmd: string): Promise<string> => {
      await conn.write(encoder.encode(cmd + '\r\n'));
      return await readResponse();
    };

    // SMTP conversation
    await readResponse(); // Initial greeting
    await sendCommand(`EHLO questeduca`);
    await sendCommand(`AUTH PLAIN ${authString}`);
    await sendCommand(`MAIL FROM:<${smtpUser}>`);
    await sendCommand(`RCPT TO:<${to}>`);
    await sendCommand(`DATA`);
    await conn.write(encoder.encode(emailContent + '\r\n.\r\n'));
    await readResponse();
    await sendCommand(`QUIT`);

    conn.close();

    return new Response(
      JSON.stringify({ success: true, message: 'Email sent successfully' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Email error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to send email', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});