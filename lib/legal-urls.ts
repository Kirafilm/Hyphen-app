const configuredWebUrl = (process.env.EXPO_PUBLIC_WEB_URL ?? "https://hyphenjob.com").replace(/\/$/, "");

export function getPrivacyPolicyUrl(): string {
  return `${configuredWebUrl}/privacy/`;
}

export function getTermsOfUseUrl(): string {
  return `${configuredWebUrl}/terms/`;
}
