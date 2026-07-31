import { TriagedTicket } from './types';

export const DEMO_TICKETS: TriagedTicket[] = [
  {
    ticket_id: 'TCK-9021',
    subject: 'URGENT: Production Database Deadlock & API Outage in US-East',
    body: 'Our primary PostgreSQL database instance has entered a deadlock cascade causing 500 errors across all production API gateways. Entire customer portal is down for 15,000 active users. Immediate escalation requested!',
    customer_id: 'CUST-88392',
    channel: 'API / Monitoring Webhook',
    created_at: '2026-07-30T21:45:10Z',
    issue_type: 'technical',
    urgency: 'critical',
    urgency_score: 4,
    confidence_source: 'rule',
  },
  {
    ticket_id: 'TCK-9022',
    subject: 'Security Alert: Suspected unauthorized API token access detected',
    body: 'Anomalous IP addresses from unknown locations are attempting to use our master secret API keys. Need immediate session revocation and token rotation verification.',
    customer_id: 'CUST-10492',
    channel: 'Security Desk',
    created_at: '2026-07-30T21:30:00Z',
    issue_type: 'account',
    urgency: 'critical',
    urgency_score: 4,
    confidence_source: 'llm',
  },
  {
    ticket_id: 'TCK-9023',
    subject: 'Double billing error on annual enterprise subscription renewal',
    body: 'We were charged $24,000 twice on invoice #INV-2026-881. Our accounting department requires urgent correction and immediate refund confirmation.',
    customer_id: 'CUST-77401',
    channel: 'Email',
    created_at: '2026-07-30T20:15:22Z',
    issue_type: 'billing',
    urgency: 'high',
    urgency_score: 3,
    confidence_source: 'rule',
  },
  {
    ticket_id: 'TCK-9024',
    subject: 'SSO SAML authentication loop for European team members',
    body: 'Users attempting to login via Azure AD SAML SSO are stuck in an infinite redirect loop. Unable to access workspace dashboards.',
    customer_id: 'CUST-33921',
    channel: 'Web Portal',
    created_at: '2026-07-30T19:50:11Z',
    issue_type: 'account',
    urgency: 'high',
    urgency_score: 3,
    confidence_source: 'llm',
  },
  {
    ticket_id: 'TCK-9025',
    subject: 'Webhook delivery failing for invoice.paid events',
    body: 'Webhook notifications for billing events fail intermittently with status 504 gateway timeout. Retry queue is filling up quickly.',
    customer_id: 'CUST-55102',
    channel: 'Developer Portal',
    created_at: '2026-07-30T18:12:44Z',
    issue_type: 'technical',
    urgency: 'high',
    urgency_score: 3,
    confidence_source: 'llm',
  },
  {
    ticket_id: 'TCK-9026',
    subject: 'Request for webhook retry policy configuration UI',
    body: 'Can we configure backoff intervals and max retries for failed webhooks directly from the workspace admin settings dashboard?',
    customer_id: 'CUST-12849',
    channel: 'Web Portal',
    created_at: '2026-07-30T17:05:00Z',
    issue_type: 'feature_request',
    urgency: 'medium',
    urgency_score: 2,
    confidence_source: 'llm',
  },
  {
    ticket_id: 'TCK-9027',
    subject: 'Dashboard analytics chart rendering glitch on Safari',
    body: 'The usage metrics line graph overlaps with the table header when viewing on Safari 17.4 desktop browser.',
    customer_id: 'CUST-49201',
    channel: 'In-App Chat',
    created_at: '2026-07-30T15:40:19Z',
    issue_type: 'technical',
    urgency: 'medium',
    urgency_score: 2,
    confidence_source: 'fallback',
  },
  {
    ticket_id: 'TCK-9028',
    subject: 'Update billing address and tax ID for Q3 invoice',
    body: 'Please update our VAT ID to DE99201844 and primary billing address for TechFlow AG.',
    customer_id: 'CUST-66103',
    channel: 'Email',
    created_at: '2026-07-30T14:22:05Z',
    issue_type: 'billing',
    urgency: 'low',
    urgency_score: 1,
    confidence_source: 'rule',
  },
  {
    ticket_id: 'TCK-9029',
    subject: 'Inquiry regarding API rate limits for standard tier',
    body: 'Hi TechFlow Support, could you confirm the request rate limit for the GET /v1/analytics endpoint on standard plans?',
    customer_id: 'CUST-88301',
    channel: 'Email',
    created_at: '2026-07-30T12:10:30Z',
    issue_type: 'general',
    urgency: 'low',
    urgency_score: 1,
    confidence_source: 'rule',
  },
  {
    ticket_id: 'TCK-9030',
    subject: 'Request to add Dark Mode auto-sync with system preference',
    body: 'It would be awesome if the UI auto-switched between light and dark themes depending on OS color scheme settings.',
    customer_id: 'CUST-22019',
    channel: 'Community Forum',
    created_at: '2026-07-30T10:00:00Z',
    issue_type: 'feature_request',
    urgency: 'low',
    urgency_score: 1,
    confidence_source: 'fallback',
  },
];

export const SAMPLE_CSV_CONTENT = `ticket_id,subject,body,customer_id,channel,created_at
TCK-1001,"URGENT: Production database connection timeout","All production microservices are returning 500 error due to database connection timeout.",CUST-001,Monitoring,2026-07-30T10:00:00Z
TCK-1002,"Unable to update payment credit card details","Getting invalid transaction response code when saving new Visa card.",CUST-002,Web Portal,2026-07-30T10:15:00Z
TCK-1003,"Feature Request: Export audit logs to S3 bucket","Our security team needs daily automated export of user access logs to AWS S3 bucket.",CUST-003,Email,2026-07-30T11:00:00Z
TCK-1004,"Password reset email link expired immediately","Users reporting password reset links expire within 5 seconds instead of 15 minutes.",CUST-004,Web Portal,2026-07-30T11:30:00Z
TCK-1005,"Documentation question regarding Webhook HMAC signatures","Where can we find example Python code for validating X-TechFlow-Signature headers?",CUST-005,Email,2026-07-30T12:00:00Z`;

export function downloadSampleCSV(): void {
  const blob = new Blob([SAMPLE_CSV_CONTENT], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', 'sample_support_tickets.csv');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
