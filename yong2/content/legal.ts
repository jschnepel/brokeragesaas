/**
 * Canonical legal copy for the contact form. The string here is the *exact*
 * disclosure rendered to the visitor and the *exact* string captured into
 * the audit trail server-side, so both sides agree on what the visitor
 * agreed to. If you change the wording, the audit log automatically picks
 * up the new version on the next submission.
 *
 * Compliance scope:
 *   - TCPA: written consent for marketing calls/SMS still required after the
 *     11th-Circuit vacatur of the FCC's one-to-one rule (Jan 2025). FCC's
 *     April 2025 opt-out rule still applies.
 *   - AZ HB 2498: solicitation texts to DNC-listed numbers require consent
 *     or an existing business relationship. EBR window is 18 months
 *     post-transaction or 3 months post-inquiry.
 *   - CAN-SPAM: the email channel needs a physical address + one-click
 *     unsubscribe in any subsequent marketing email — those are downstream
 *     in Resend templates, not the inquiry form itself.
 *   - ARMLS: required listing-data attribution is included so the same
 *     paragraph covers the lead-capture surface.
 *
 * The SMS line is conditional — only the box-checked path opts in.
 */

export const CONTACT_DISCLOSURE = `By submitting, you consent to Yong Choi and Russ Lyon Sotheby's International Realty contacting you by email or phone about your inquiry. SMS marketing only with the box checked. Listing data courtesy of ARMLS. See our Privacy Policy.`;

export const SMS_OPT_IN_LABEL = `I agree to receive SMS messages from Yong Choi about new listings and updates. Message and data rates may apply. Reply STOP to opt out.`;
