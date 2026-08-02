/**
 * Pure client-side fallback for the "Draft AI Response" feature.
 *
 * Used when POST /api/tickets/generate-response is unreachable — this is
 * what powers TechFlow's "Standalone Demo Mode" (see App.tsx backendStatus
 * offline path), so Jordan can still draft a reasonable reply without a
 * backend connection. It intentionally mirrors the deterministic template
 * branch in `services/triage.py::generate_ticket_response`, but the two
 * cannot be shared directly (different languages/runtimes).
 */
export function buildFallbackResponseTemplate(
  subject: string,
  issueType: string,
  urgency: string,
  tone: string = 'formal'
): string {
  const categoryNorm = issueType.toLowerCase();
  const urgencyNorm = urgency.toLowerCase();
  let bodyReply = `We have received your ticket regarding '${subject}' and assigned it to our specialist team for review.`;

  if (categoryNorm.includes('billing')) {
    bodyReply = urgencyNorm === 'critical'
      ? `We have flagged your ticket regarding '${subject}' as Critical Priority. Our billing operations team has been immediately notified to audit your transaction records. Any erroneous billing charges or duplicate invoices will be reversed promptly within 1 business day.`
      : `We have received your billing inquiry regarding '${subject}'. Our accounting team is reviewing invoice details for your account and will confirm payment adjustments or credit status shortly.`;
  } else if (categoryNorm.includes('technical')) {
    bodyReply = urgencyNorm === 'critical'
      ? `We have escalated your report '${subject}' to our Senior Infrastructure & Site Reliability Engineering team as a Critical Incident. Our engineers are actively investigating server logs and system metrics. We will provide real-time updates as we work toward resolution.`
      : `Our technical engineering team is investigating your report regarding '${subject}'. We are testing steps to reproduce the issue and will share diagnostic findings or a patch update shortly.`;
  } else if (categoryNorm.includes('account')) {
    bodyReply = `We have received your account security inquiry regarding '${subject}'. To safeguard your account integrity, our security desk is verifying session logs and access controls. If you are unable to access your portal, please ensure your multi-factor authentication device is active.`;
  } else if (categoryNorm.includes('feature')) {
    bodyReply = `Thank you for sharing your feature suggestion regarding '${subject}'! We love hearing feedback from our community. Your request has been logged with our Product Management team for evaluation during upcoming roadmap planning cycles.`;
  }

  const toneNorm = tone.toLowerCase();

  if (toneNorm === 'empathic') {
    return `Hello,\n\nWe understand your frustration and deeply apologize for any inconvenience regarding '${subject}'. Thank you for your patience while we resolve this issue.\n\n${bodyReply}\n\nPlease let us know if you have any additional details to add in the meantime.\n\nBest regards,\nTechFlow Support Team`;
  }

  if (toneNorm === 'concise') {
    return `Quick Update / Status: Ticket '${subject}' logged.\n\nSummary:\n${bodyReply}\n\nAction: Assigned to specialist team for immediate review.`;
  }

  if (toneNorm === 'technical') {
    return `Hello,\n\nTechnical Diagnostic Report for '${subject}':\n\n${bodyReply}\n\nSystem Metrics & Stack Trace Analysis: System telemetry and endpoint logs are being processed to isolate the root cause.\n\nBest regards,\nTechFlow Support Team`;
  }

  return `Hello,\n\nThank you for reaching out to TechFlow Support.\n\n${bodyReply}\n\nPlease let us know if you have any additional details to add in the meantime.\n\nBest regards,\nTechFlow Support Team`;
}
