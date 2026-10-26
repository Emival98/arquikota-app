import "server-only";
import { buildReportEmailParams, type ReportEmailInput } from "./email-contract";
import { fmtDateTimeUtc } from "./format";
import { fetchWithTimeout } from "./http";

const EMAILJS_ENDPOINT = "https://api.emailjs.com/api/v1.0/email/send";

export class EmailConfigError extends Error {
  constructor(message = "O envio de email não está configurado no servidor.") {
    super(message);
    this.name = "EmailConfigError";
  }
}

export class EmailSendError extends Error {
  status = 502;

  constructor(message: string) {
    super(message);
    this.name = "EmailSendError";
  }
}

function readConfig() {
  const serviceId = process.env.EMAILJS_SERVICE_ID?.trim();
  const templateId = process.env.EMAILJS_TEMPLATE_ID?.trim();
  const publicKey = process.env.EMAILJS_PUBLIC_KEY?.trim();
  const privateKey = process.env.EMAILJS_PRIVATE_KEY?.trim();

  if (!serviceId || !templateId || !publicKey || !privateKey) {
    throw new EmailConfigError();
  }

  return { serviceId, templateId, publicKey, privateKey };
}

export async function sendReportEmail(input: ReportEmailInput, panelUrl: string): Promise<void> {
  const config = readConfig();
  const templateParams = buildReportEmailParams(
    input,
    panelUrl,
    fmtDateTimeUtc(new Date().toISOString()),
  );

  let response: Response;
  try {
    response = await fetchWithTimeout(
      EMAILJS_ENDPOINT,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          service_id: config.serviceId,
          template_id: config.templateId,
          user_id: config.publicKey,
          accessToken: config.privateKey,
          template_params: templateParams,
        }),
      },
      12_000,
    );
  } catch {
    throw new EmailSendError("Não foi possível contactar o EmailJS. Tenta novamente.");
  }

  if (!response.ok) {
    const detail = (await response.text().catch(() => "")).slice(0, 300);
    console.error("EmailJS recusou o envio", response.status, detail);
    throw new EmailSendError(
      `O EmailJS recusou o envio (${response.status}). Confirma o serviço, o template, as chaves e o acesso à API para aplicações não-browser.`,
    );
  }
}
