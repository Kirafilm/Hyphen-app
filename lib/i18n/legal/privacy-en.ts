import type { LegalSection } from "../types";

const PRIVACY_POLICY_TEXT = `The Hyphen Freelance application (the "App") is owned and operated by Hyphen ("Company" or "we"). We respect personal data and are committed to fully implementing and complying with data protection principles and all relevant provisions of the Personal Data (Privacy) Ordinance (Cap. 486) of Hong Kong (the "Ordinance"). This policy applies to users of the App and any other persons whose personal data is collected, used, and held by us, regardless of the manner of collection.\n\nThis Privacy Policy applies to all users of the App, including but not limited to service users requesting services ("Consumers"), service users wishing to provide services ("Freelancers"), and any other persons whose personal data is collected, used, and held by us, regardless of the manner of collection.`;

const DATA_COLLECTION_TEXT = `You may voluntarily provide your personal data to us. To purchase and use services under the App, all personal data — namely name, email address, contact telephone number, specific address and/or region — is considered mandatory. If you fail to provide the above mandatory data, your purchase/service request will not be considered.`;

export const privacySectionsEn = [
  { title: "1. Privacy Policy", body: PRIVACY_POLICY_TEXT },
  { title: "2. Types of Personal Data Collected, Used, and Held", body: DATA_COLLECTION_TEXT },
  {
    title: "3. Purposes of Holding Personal Data",
    body: `The Company will only collect, use, and hold name, email address, contact telephone number, specific address and/or region, and transaction records. The Company will not collect other personal data.\n\nPersonal data collected from you will be used by the Company for the following purposes:\n(a) Identity verification: to verify identity for handling requests to access, correct, and delete personal data.\n(b) Member account and activity processing: member registration; identity verification; purchase and activity communications, etc.;\n(c) Service provision: to provide services to you through the App and allow you to participate in other activities through the App;\n(d) Processing personal data requests: to verify identity for handling requests to access, correct, and delete personal data;\n(e) Statistics: to conduct statistical and data analysis; such reports contain only anonymised data for the Company's reference and to improve our services and product quality;\n(f) Administration and management: our internal administration and management, including audit and internal analysis;\n(g) Direct marketing and promotion: only with your consent, the Company may from time to time send or contact you to share promotional or marketing information. Promotional and marketing topics may include promotion of our business and our members' businesses, covering media, entertainment and travel, banking and finance, beauty and cosmetics, computers, real estate, dining, insurance, education, health products, pharmaceuticals, personal care, social networks and services; and\n(h) Transfer to service providers / consumers: to transfer your personal data to service providers (if you are a Consumer) or consumers (if you are a service provider) for purchasing products or providing services, or to enable communication between service providers and consumers regarding the provision or acceptance of any service or product.\n\nIf you are under 18, please obtain consent from your parent or guardian before providing personal data.`,
  },
  {
    title: "4. Retention of Personal Data",
    body: `The Company will retain all your personal data and transaction records for (i) the period necessary to fulfil the purposes for which they were collected and (ii) as required by law. Thereafter, all your personal data and transaction records will be destroyed.\n\nOur information and data are stored and maintained in our electronic databases, facilities, servers, and backup servers, which may be located outside your country of residence, where legal protection and security standards may not be equivalent to those provided and required by the laws and regulations applicable in your country. You hereby expressly consent to our transfer, storage, maintenance, and retention of all your information and data in electronic databases, facilities, servers, and backup servers located outside your country of residence for the purposes stated in Section 3.`,
  },
  {
    title: "5. Accuracy and Changes to Personal Data",
    body: "To ensure that member personal data held by the Company (especially contact details) is accurate, you may receive confirmation or verification requests from us. To correct or change personal data, or to opt out of future direct marketing and promotional information, please contact us at any time.",
  },
  {
    title: "6. Personal Data Processing and Security Measures",
    body: `Personal data collected about you will not be disclosed to any other party without your prior approval.\n\nWe have implemented security measures and monitoring procedures to prevent unauthorised or accidental access, processing, deletion, loss, or use of data. All persons who may access data will ensure compliance with data protection requirements.\n\nOur security measures include:\n(a) Controls on password complexity, retries, and resets to prevent password cracking.\n(b) Advanced encryption technology to protect personal data (including name, email address, telephone number, credit card data, and purchase records) during transmission. Our Secure Sockets Layer (SSL) system prevents your data from being intercepted or accessed by unauthorised third parties during transmission.\n(c) Only personnel authorised and trained in strict privacy guidelines and procedures may access or process your personal data. Such personnel are accountable for non-compliance with relevant obligations.\n(d) Security systems will be reviewed regularly.\n\nExcept as required by law, the Company will not transfer or disclose any of your personal data to any other party.`,
  },
  {
    title: "7. Limitation of Liability",
    body: "The Company has implemented all reasonably practicable procedures, measures, and steps to safeguard the security of your personal data. However, no method of internet transmission or electronic storage is absolutely secure. We cannot guarantee absolute security. Unless negligence is proven, we shall not be liable in this regard.",
  },
  {
    title: "8. Third-Party Websites",
    body: "After clicking advertisements or hyperlink buttons on our website, you may leave our website and enter websites of the Company's advertising clients, content providers, suppliers, affiliates, or business partners. Your access to these third-party websites is not protected by this policy.\n\nThese third-party websites are not owned or controlled by the Company. We have not authorised them to collect any personal data from you. Therefore, we are not responsible for any data leakage on these websites or losses arising from third-party website practices or policies. For any enquiries or questions regarding their own privacy practices or policies, please contact the administrators or owners of such websites directly.",
  },
  {
    title: "9. Third-Party Payment Gateways",
    body: "To use the Company's services, you need to access a third-party payment gateway and provide your personal data for payment processing.\n\nIt is not owned or controlled by the Company. We have not authorised or required the third-party payment gateway to collect any personal data from you. Therefore, we are not responsible for any leakage of your personal data on third-party payment gateways. For any enquiries or questions regarding their own privacy practices or policies, please contact the operators of the third-party payment gateway directly.",
  },
  {
    title: "10. Cookies",
    body: 'We may use "Cookies" to improve our internet services and enhance your online experience. Cookies are small files automatically stored in your computer\'s web browser and can be retrieved by the application/website. Cookies may be used to remember you and your preferences when you visit the website, and to tailor the application/website to your needs. Information collected by Cookies is anonymous visitor personalisation information and does not include name or address information, or any information that would enable anyone to contact you by telephone, email, or any other means. When using Cookies, we do not collect any personal data from you. You can disable Cookies by changing your web browser settings. Cookies cannot be used to run programmes or transmit viruses to your computer.',
  },
  {
    title: "11. Advertising (third-party ads)",
    body: "Our website (https://hyphenjob.com) may display third-party ads to support the platform. Providers may use cookies, pixels, or other identifiers to measure performance or show more relevant ads.\n\nYou can limit or clear cookies in your browser settings. Third-party ad services process data under their own privacy policies. We do not sell your personal data. For questions about ads on our site, contact hyphe.office@gmail.com.",
  },
  {
    title: "12. Changes to This Privacy Policy",
    body: "If necessary, the Company may update or revise this Privacy Policy in the future. The revised policy will be published on our website with the effective date stated. Please visit our website from time to time for the latest information.",
  },
  {
    title: "13. Access to Personal Data",
    body: "Under the Ordinance, you have the right to request access to and correction of personal data relating to your application. If you wish to exercise these rights, please contact us.",
  },
  {
    title: "14. Contact Us",
    body: "If you have any requests (including opt-out), enquiries, or comments regarding our Privacy Policy or practices, please contact us at hyphe.office@gmail.com. In general, your request or enquiry will be processed within 14 business days after receipt and verification of your identity.",
  },
  { title: "15. Effective Date", body: "This Privacy Policy is effective from 25 May 2026. The advertising disclosure was updated on 3 August 2026." },
] satisfies LegalSection[];
