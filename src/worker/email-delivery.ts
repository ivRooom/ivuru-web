export type ResendPayloadInput = {
  from: string;
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
  bcc?: string;
};

export const buildResendPayload = ({
  from,
  to,
  subject,
  html,
  replyTo,
  bcc,
}: ResendPayloadInput) => ({
  from,
  to: [to],
  ...(bcc?.trim() ? { bcc: [bcc.trim()] } : {}),
  subject,
  html,
  ...(replyTo?.trim() ? { reply_to: replyTo.trim() } : {}),
});
