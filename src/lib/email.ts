import { supabase } from "@/integrations/supabase/client";

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail({ to, subject, html, text }: SendEmailParams) {
  const { data, error } = await supabase.functions.invoke('send-email', {
    body: { to, subject, html, text }
  });

  if (error) throw error;
  return data;
}

// Email templates for Questeduca
export const emailTemplates = {
  passwordRecovery: (resetLink: string) => ({
    subject: "🔑 Recuperar Palavra-passe - Questeduca",
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: 'Segoe UI', Arial, sans-serif; background-color: #f5f0e6; margin: 0; padding: 20px;">
        <div style="max-width: 500px; margin: 0 auto; background: #fff; border-radius: 12px; border: 3px solid #8b7355; overflow: hidden;">
          <div style="background: linear-gradient(135deg, #c9a227 0%, #d4a726 100%); padding: 30px; text-align: center;">
            <h1 style="color: #1a1a2e; margin: 0; font-size: 28px;">⚔️ Questeduca</h1>
          </div>
          <div style="padding: 30px;">
            <h2 style="color: #1a1a2e; margin-top: 0;">Recuperar Palavra-passe</h2>
            <p style="color: #555; line-height: 1.6;">
              Recebemos um pedido para redefinir a tua palavra-passe. Clica no botão abaixo para criar uma nova:
            </p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetLink}" style="display: inline-block; background: linear-gradient(135deg, #c9a227 0%, #d4a726 100%); color: #1a1a2e; text-decoration: none; padding: 15px 30px; border-radius: 8px; font-weight: bold; font-size: 16px;">
                🔑 Redefinir Palavra-passe
              </a>
            </div>
            <p style="color: #888; font-size: 13px;">
              Se não fizeste este pedido, podes ignorar este email. O link expira em 24 horas.
            </p>
          </div>
          <div style="background: #f5f0e6; padding: 15px; text-align: center; border-top: 1px solid #ddd;">
            <p style="color: #888; font-size: 12px; margin: 0;">
              Questeduca © 2026 — Jogo educativo para o 1º Ciclo
            </p>
          </div>
        </div>
      </body>
      </html>
    `,
  }),

  parentStudentRecovery: (studentName: string, approveLink: string) => ({
    subject: "🛡️ Autorização de Recuperação - Questeduca",
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: 'Segoe UI', Arial, sans-serif; background-color: #f5f0e6; margin: 0; padding: 20px;">
        <div style="max-width: 500px; margin: 0 auto; background: #fff; border-radius: 12px; border: 3px solid #8b7355; overflow: hidden;">
          <div style="background: linear-gradient(135deg, #c9a227 0%, #d4a726 100%); padding: 30px; text-align: center;">
            <h1 style="color: #1a1a2e; margin: 0; font-size: 28px;">⚔️ Questeduca</h1>
          </div>
          <div style="padding: 30px;">
            <h2 style="color: #1a1a2e; margin-top: 0;">Pedido de Recuperação</h2>
            <p style="color: #555; line-height: 1.6;">
              O seu educando <strong>${studentName}</strong> solicitou a recuperação da palavra-passe.
            </p>
            <p style="color: #555; line-height: 1.6;">
              Para autorizar esta recuperação, clique no botão abaixo:
            </p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${approveLink}" style="display: inline-block; background: linear-gradient(135deg, #c9a227 0%, #d4a726 100%); color: #1a1a2e; text-decoration: none; padding: 15px 30px; border-radius: 8px; font-weight: bold; font-size: 16px;">
                ✅ Autorizar Recuperação
              </a>
            </div>
            <p style="color: #888; font-size: 13px;">
              Se não reconhece este pedido, pode ignorar este email.
            </p>
          </div>
          <div style="background: #f5f0e6; padding: 15px; text-align: center; border-top: 1px solid #ddd;">
            <p style="color: #888; font-size: 12px; margin: 0;">
              Questeduca © 2026 — Jogo educativo para o 1º Ciclo
            </p>
          </div>
        </div>
      </body>
      </html>
    `,
  }),

  studentRecoveryApproved: (studentName: string, resetLink: string) => ({
    subject: "✅ Recuperação Autorizada - Questeduca",
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: 'Segoe UI', Arial, sans-serif; background-color: #f5f0e6; margin: 0; padding: 20px;">
        <div style="max-width: 500px; margin: 0 auto; background: #fff; border-radius: 12px; border: 3px solid #8b7355; overflow: hidden;">
          <div style="background: linear-gradient(135deg, #c9a227 0%, #d4a726 100%); padding: 30px; text-align: center;">
            <h1 style="color: #1a1a2e; margin: 0; font-size: 28px;">⚔️ Questeduca</h1>
          </div>
          <div style="padding: 30px;">
            <h2 style="color: #1a1a2e; margin-top: 0;">Olá, ${studentName}! 🎉</h2>
            <p style="color: #555; line-height: 1.6;">
              Boas notícias! O teu encarregado de educação <strong>autorizou</strong> a recuperação da tua palavra-passe.
            </p>
            <p style="color: #555; line-height: 1.6;">
              Clica no botão abaixo para criar uma nova palavra-passe:
            </p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetLink}" style="display: inline-block; background: linear-gradient(135deg, #c9a227 0%, #d4a726 100%); color: #1a1a2e; text-decoration: none; padding: 15px 30px; border-radius: 8px; font-weight: bold; font-size: 16px;">
                🔑 Criar Nova Palavra-passe
              </a>
            </div>
            <p style="color: #888; font-size: 13px;">
              O link expira em 24 horas. Se tiveres problemas, pede ajuda ao teu encarregado de educação.
            </p>
          </div>
          <div style="background: #f5f0e6; padding: 15px; text-align: center; border-top: 1px solid #ddd;">
            <p style="color: #888; font-size: 12px; margin: 0;">
              Questeduca © 2026 — Jogo educativo para o 1º Ciclo
            </p>
          </div>
        </div>
      </body>
      </html>
    `,
  }),

  welcome: (studentName: string) => ({
    subject: "🏰 Bem-vindo ao Questeduca!",
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: 'Segoe UI', Arial, sans-serif; background-color: #f5f0e6; margin: 0; padding: 20px;">
        <div style="max-width: 500px; margin: 0 auto; background: #fff; border-radius: 12px; border: 3px solid #8b7355; overflow: hidden;">
          <div style="background: linear-gradient(135deg, #c9a227 0%, #d4a726 100%); padding: 30px; text-align: center;">
            <h1 style="color: #1a1a2e; margin: 0; font-size: 28px;">⚔️ Questeduca</h1>
          </div>
          <div style="padding: 30px;">
            <h2 style="color: #1a1a2e; margin-top: 0;">Bem-vindo, ${studentName}! 🎉</h2>
            <p style="color: #555; line-height: 1.6;">
              A tua conta foi criada com sucesso! Estás pronto para começar a construir a tua aldeia, 
              responder a perguntas e defender-te de monstros e aliens!
            </p>
            <div style="background: #f5f0e6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #1a1a2e; margin-top: 0;">🎮 O que te espera:</h3>
              <ul style="color: #555; padding-left: 20px;">
                <li>Perguntas do 1º ao 4º ano</li>
                <li>Construir e melhorar a tua aldeia</li>
                <li>Ganhar moedas e diamantes</li>
                <li>Fazer amigos de todo o Portugal</li>
              </ul>
            </div>
            <p style="color: #555;">
              Boa sorte na tua aventura! 🏰⚔️
            </p>
          </div>
          <div style="background: #f5f0e6; padding: 15px; text-align: center; border-top: 1px solid #ddd;">
            <p style="color: #888; font-size: 12px; margin: 0;">
              Questeduca © 2026 — Jogo educativo para o 1º Ciclo
            </p>
          </div>
        </div>
      </body>
      </html>
    `,
  }),
};