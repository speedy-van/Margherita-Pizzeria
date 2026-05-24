import {
  EmailShell,
  emailBrand,
} from "@/emails/components/EmailShell";
import { EmailButton } from "@/emails/components/EmailButton";

interface Props {
  /** Absolute URL that points to the admin reset-password page. */
  resetUrl: string;
  /** Minutes until the link expires (currently 60). */
  expiresInMinutes: number;
}

const muted = {
  color: emailBrand.muted,
  margin: "0 0 16px",
  lineHeight: 1.5,
  fontSize: "15px",
};

export function PasswordResetEmail({ resetUrl, expiresInMinutes }: Props) {
  return (
    <EmailShell
      preview={`Reset your Margherita Pizzeria admin password`}
      title="Reset your password"
    >
      <p style={muted}>
        We received a request to reset your Margherita Pizzeria admin password.
        Use the button below to choose a new one — the link expires in{" "}
        {expiresInMinutes} minutes and can only be used once.
      </p>
      <EmailButton href={resetUrl}>Reset password</EmailButton>
      <p style={{ ...muted, marginTop: "24px" }}>
        If you didn’t ask for a reset you can safely ignore this email — your
        password will stay unchanged.
      </p>
    </EmailShell>
  );
}

export default PasswordResetEmail;
