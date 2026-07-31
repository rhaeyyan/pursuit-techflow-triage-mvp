#!/usr/bin/env python3
"""Generate a 250-ticket sample CSV for TechFlow Support Queue."""

import csv
import random
from datetime import datetime, timedelta

random.seed(42)

OUTPUT = "sample_250_tickets.csv"
CHANNELS = ["Email", "Web Portal", "Chat", "Phone", "API", "Monitoring", "Slack", "Mobile App"]

START = datetime(2026, 7, 28, 6, 0, 0)
END = datetime(2026, 7, 31, 18, 0, 0)
SPAN = (END - START).total_seconds()


def rand_ts():
    return (START + timedelta(seconds=random.random() * SPAN)).strftime("%Y-%m-%dT%H:%M:%SZ")


# ---------- ticket templates per category ----------

BILLING_CRITICAL = [
    ("Billing error on enterprise subscription renewal", "Our enterprise plan was renewed at incorrect pricing. The billing error resulted in a $4,200 overcharge on invoice #INV-{n}."),
    ("Double charged for annual license upgrade", "We were double charged $1,500 when upgrading from Pro to Enterprise. Transaction refs TXN-{n}A and TXN-{n}B both posted."),
    ("Unauthorized charge on company corporate card", "An unauthorized charge of $899 appeared on our corporate Amex ending in 4{n:03d}. We did not authorize this transaction."),
    ("Billing error: wrong plan tier pricing applied", "After downgrading to Starter, our invoice still shows Enterprise pricing. This billing error needs immediate correction."),
    ("Double charged after failed payment retry", "Our payment was double charged after the system retried a declined card. Two charges of $299 posted to Visa ending {n:04d}."),
    ("Unauthorized charge from cancelled trial account", "We cancelled our trial 30 days ago but received an unauthorized charge of $199 on our account this morning."),
    ("Billing error on multi-seat license invoice #{n}", "Invoice #{n} shows billing error — 50 seats charged but we only have 28 active users. Overcharge of $1,100."),
    ("Double charged during payment method migration", "During migration to new payment method, our account was double charged $649. Both old and new cards were billed."),
]

BILLING_HIGH = [
    ("Request refund for unused API credits", "We purchased 500K API credits but only used 120K before switching providers. Requesting refund for remaining credits."),
    ("Invoice discrepancy on Q3 statement", "Invoice #INV-{n} shows charges for add-ons we never activated. Please review and issue corrected invoice."),
    ("Payment failed on automatic renewal", "Our automatic renewal payment failed with error code PAY-{n:03d}. Card on file is valid — please retry or send payment link."),
    ("Credit card update rejected by payment gateway", "Attempting to update our credit card details but getting 'card verification failed' error. Card works fine elsewhere."),
    ("Need refund for accidental plan upgrade", "An admin accidentally upgraded our plan. Requesting immediate refund of the $450 difference charged to our account."),
    ("Invoice missing volume discount agreement", "Our invoice doesn't reflect the 20% volume discount from contract #CTR-{n}. Please apply the discount and reissue."),
    ("Payment failed three times this week", "Our scheduled payment failed again today — third time this week. Error: 'processor declined'. Need alternative payment method."),
    ("Credit card expiry causing service interruption warning", "Received warning that our credit card on file expires next week. Unable to update through the billing portal."),
    ("Refund request for duplicate annual subscription", "We have two active subscriptions for the same team. Need refund on the duplicate subscription #{n}."),
    ("Outstanding invoice from two months ago", "Invoice #INV-{n} from May is still showing unpaid despite payment confirmation. Please reconcile."),
]

TECHNICAL_CRITICAL = [
    ("Production API returning 500 error on all endpoints", "All production API endpoints returning 500 error since 08:00 UTC. Error trace: NullPointerException in AuthService. Affecting all users."),
    ("Main application server down in EU-West region", "Our primary application server down in EU-West-1. Health checks failing, all requests timing out. {n} users affected."),
    ("System crash during peak traffic hours", "Platform experienced total system crash at 14:00 UTC during peak load. Auto-recovery failed, manual restart needed."),
    ("Complete system outage across all regions", "Experiencing full system outage. Dashboard, API, and webhook delivery all non-functional. Started 20 minutes ago."),
    ("Critical data loss in reporting module", "Historical analytics data loss detected in the reporting module. Reports from the last 7 days showing zero values."),
    ("Users can't access dashboard after update", "After the v3.{n} update, no users can't access the main dashboard. Login succeeds but redirects to blank page."),
    ("Database outage causing cascading failures", "Primary database outage in US-East. All dependent microservices returning errors. Customer-facing impact confirmed."),
    ("500 error on checkout flow blocking revenue", "Production checkout flow returning 500 error. Zero successful transactions in the last 45 minutes. Revenue impact critical."),
    ("Server down after scheduled maintenance window", "Post-maintenance, the analytics server down and not recovering. Kubernetes pods in CrashLoopBackOff state."),
    ("System crash with kernel panic on node pool", "System crash on primary node pool with kernel panic. Auto-scaling replacement nodes also failing to initialize."),
]

TECHNICAL_HIGH = [
    ("UI alignment bug on settings page in Firefox", "There's a CSS bug causing the user settings panel to overlap the navigation bar in Firefox 120+. Screenshots attached."),
    ("Search filter bug returning incorrect results", "Search filter bug: filtering by date range 'Last 7 days' returns results from last 30 days instead."),
    ("Data export bug truncating large CSV files", "When exporting datasets larger than 10K rows, the CSV download bug causes truncation at exactly 9,999 rows."),
    ("Notification bug sending duplicate email alerts", "Users receiving 3-4 duplicate email alerts for each event. The notification bug started after Tuesday's deployment."),
    ("Dashboard chart rendering bug in dark mode", "Pie chart labels invisible due to rendering bug in dark mode theme. Text color matches background."),
    ("Mobile app login bug on Android 15 devices", "Intermittent login bug on Android 15 — the biometric prompt crashes the app 40% of the time."),
    ("API rate limiter bug blocking legitimate requests", "Our integration is getting 429 errors despite being well within rate limits. Rate limiter bug confirmed by checking our usage stats."),
    ("Pagination bug skipping records on page 2", "Table pagination bug: clicking page 2 skips IDs 51-75 and shows records starting from ID 76."),
    ("Webhook delivery bug causing missed events", "Webhook bug causing approximately 15% of order.completed events to not fire. Retry mechanism also failing."),
    ("Timezone bug displaying wrong timestamps", "All timestamps showing in UTC despite user timezone set to EST. Timezone conversion bug affecting reports."),
]

ACCOUNT_MEDIUM = [
    ("Password reset link not arriving via email", "I requested a password reset 30 minutes ago but haven't received the email. Checked spam folder — nothing there."),
    ("Account locked after SSO configuration change", "Our IT team updated SSO settings and now my account locked out. SAML assertion errors in the login flow."),
    ("Need password reset for service account", "The password reset is needed for service account svc-deploy-{n}@company.com used in our CI/CD pipeline."),
    ("Account locked due to suspicious activity alert", "Received 'suspicious activity' notification and now account locked. I was just traveling and using a VPN."),
    ("Password reset not working with new email domain", "Company changed email domains. Password reset sends to old @oldcorp.com address instead of @newcorp.com."),
    ("Admin account locked after MFA device replacement", "Replaced my phone and now admin account locked because MFA codes don't match. Need account recovery."),
    ("Bulk password reset needed for team migration", "Migrating 35 users to new SSO provider. Need bulk password reset for all accounts under org ID ORG-{n}."),
    ("Account locked — exceeded maximum login attempts", "My account locked after entering wrong password. The lockout timer seems stuck — it's been 2 hours."),
]

ACCOUNT_LOW = [
    ("Change email address for primary admin account", "Please change email on the primary admin account from admin@old-domain.com to admin@new-domain.com."),
    ("Need to change email for billing notifications", "Please change email for billing notifications from finance@acme.com to accounting@acme.com."),
    ("Change email associated with developer API account", "Change email on my developer API account from john.doe@company.com to j.doe@company.com due to naming convention update."),
    ("Request to change email on team owner account", "Our team owner left the company. Need to change email from prev-owner@corp.com to new-owner@corp.com."),
    ("Change email for compliance audit notifications", "Need to change email receiving compliance audit notifications to compliance-team@enterprise.com."),
]

GENERAL_MEDIUM = [
    ("How to set up webhook event filtering", "We want to only receive 'order.completed' and 'order.refunded' webhook events. Where do we configure event filtering?"),
    ("Feature request: custom dashboard widgets", "Our team would love the ability to create custom dashboard widgets with user-defined KPI metrics."),
    ("Question about API versioning and deprecation policy", "We're integrating v2 API. What is your API versioning strategy and deprecation timeline for v1 endpoints?"),
    ("Documentation unclear on batch import format", "The batch import documentation doesn't specify the maximum file size or supported delimiters for TSV files."),
    ("Request demo of enterprise analytics module", "We're evaluating the enterprise analytics add-on for our 200-person team. Can we schedule a demo?"),
    ("How to configure SAML SSO with Okta", "Looking for step-by-step instructions to configure SAML-based SSO with our Okta tenant for 150 users."),
    ("Feature request: Slack integration for alerts", "It would be great to have native Slack integration for real-time alert notifications in our #ops channel."),
    ("Onboarding assistance for new engineering team", "We just added 20 engineers to our plan. Can we get a guided onboarding session for the new team members?"),
    ("Question about data retention and GDPR compliance", "What is your data retention policy? We need to ensure compliance with GDPR Article 17 right to erasure."),
    ("Feature request: two-factor authentication via hardware keys", "We'd like to use YubiKey hardware tokens for two-factor authentication. Is this on the roadmap?"),
    ("How to migrate data from competitor platform", "We're switching from CompetitorX. Do you offer a migration tool or service for importing historical data?"),
    ("Inquiry about SOC 2 Type II certification", "Our procurement team requires SOC 2 Type II compliance documentation before we can sign the enterprise contract."),
    ("Feature request: custom role-based access controls", "We need granular RBAC with custom roles beyond the standard Admin/Member/Viewer permissions."),
    ("Question about multi-region data residency options", "Does your platform support data residency in the EU? We need all customer data stored within EU boundaries."),
    ("How to set up automated nightly data exports", "We want to automatically export all transaction data nightly to our S3 bucket. What's the recommended approach?"),
    ("Feature request: audit log export in JSON format", "Currently audit logs only export as CSV. We need JSON format for ingestion into our SIEM platform."),
    ("Training materials for new admin onboarding", "Do you have training videos or documentation specifically for platform administrators? We're onboarding 5 new admins."),
    ("Question about API rate limits for enterprise tier", "We're planning to make ~50K API calls per hour. What are the rate limits on the Enterprise plan?"),
    ("Feature request: dark mode for admin console", "Our ops team works night shifts and would appreciate a dark mode option for the admin console."),
    ("Guidance on implementing custom OAuth2 scopes", "We want to define custom OAuth2 scopes for our internal apps. Is this supported and where is it documented?"),
    ("How to configure IP allowlisting for API access", "We need to restrict API access to our office and VPN IP ranges. Where can we set up IP allowlisting?"),
    ("Feature request: scheduled report delivery via email", "We'd like to schedule automated weekly reports delivered to a distribution list every Monday at 9 AM EST."),
    ("Inquiry about uptime SLA for enterprise customers", "What uptime SLA guarantees are included in the Enterprise plan? We need 99.95% minimum for our contract."),
    ("How to use the bulk user provisioning API", "We need to provision 500+ user accounts via API for our annual onboarding cycle. Looking for documentation."),
    ("Feature request: multi-language support for help center", "Our customers span 12 countries. We need the help center and in-app tooltips localized in at least 5 languages."),
    ("Question about cross-account data sharing permissions", "We have three separate accounts for different business units. Can data be shared or queried across accounts?"),
    ("How to interpret the anomaly detection dashboard", "The anomaly detection alerts are firing but the dashboard doesn't explain what thresholds trigger them."),
    ("Feature request: mobile push notifications for critical alerts", "We currently only get email alerts. Need mobile push notifications for critical severity events."),
    ("Inquiry about professional services and implementation support", "We're a 500-person org starting a platform rollout. Do you offer professional services for implementation?"),
    ("How to configure custom email templates for notifications", "We want to customize the email notification templates with our company branding and footer links."),
    ("Question about sandbox environment for testing", "Is there a sandbox or staging environment we can use for testing integrations without affecting production data?"),
    ("Feature request: drag-and-drop workflow builder", "A visual drag-and-drop workflow builder would greatly speed up our automation configuration process."),
    ("Comparing Standard vs Enterprise plan feature differences", "Can you provide a detailed comparison matrix of Standard vs Enterprise plan features for our procurement review?"),
    ("How to set up cross-region failover for high availability", "We need guidance on configuring cross-region failover to meet our 99.99% availability requirements."),
    ("Feature request: GraphQL API endpoint support", "Our frontend team prefers GraphQL over REST. Are there plans to offer a GraphQL API endpoint?"),
    ("Question about connector availability for Salesforce CRM", "We use Salesforce as our CRM. Is there a native connector or do we need to build a custom integration?"),
    ("How to enable field-level encryption for sensitive data", "We store PII in custom fields and need field-level encryption. Is this available on our current plan?"),
    ("Feature request: customizable ticket priority matrix", "We want to define our own priority scoring matrix based on customer tier, issue type, and SLA deadlines."),
    ("Inquiry about partner program and reseller discounts", "We're an MSP managing 40+ client accounts. Do you have a partner program with volume discounts?"),
    ("How to integrate with Terraform for infrastructure provisioning", "Our DevOps team manages everything via Terraform. Do you publish a Terraform provider for resource management?"),
]


def build_tickets():
    tickets = []
    tid = 2001

    def add(templates, count):
        nonlocal tid
        pool = templates * ((count // len(templates)) + 1)
        random.shuffle(pool)
        for subj, body in pool[:count]:
            n = tid - 2000
            tickets.append({
                "ticket_id": f"TCK-{tid}",
                "subject": subj.format(n=n),
                "body": body.format(n=n),
                "customer_id": f"CUST-{100 + (tid - 2001)}",
                "channel": random.choice(CHANNELS),
                "created_at": rand_ts(),
            })
            tid += 1

    add(BILLING_CRITICAL, 25)
    add(BILLING_HIGH, 30)
    add(TECHNICAL_CRITICAL, 30)
    add(TECHNICAL_HIGH, 25)
    add(ACCOUNT_MEDIUM, 25)
    add(ACCOUNT_LOW, 15)
    add(GENERAL_MEDIUM, 100)

    random.shuffle(tickets)

    # Re-assign sequential IDs and customer IDs after shuffle
    for i, t in enumerate(tickets):
        t["ticket_id"] = f"TCK-{2001 + i}"
        t["customer_id"] = f"CUST-{100 + i}"

    return tickets


def main():
    tickets = build_tickets()
    with open(OUTPUT, "w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=["ticket_id", "subject", "body", "customer_id", "channel", "created_at"])
        writer.writeheader()
        writer.writerows(tickets)
    print(f"Generated {len(tickets)} tickets -> {OUTPUT}")


if __name__ == "__main__":
    main()
