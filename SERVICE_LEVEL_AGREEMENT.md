# Service Level Agreement (SLA)
## SmartInvest Africa Limited

**Effective Date:** February 4, 2026  
**Version:** 1.0  
**Last Updated:** February 4, 2026

---

## 1. SLA INTRODUCTION

This Service Level Agreement ("SLA") defines the service availability standards and support commitments for SmartInvest's Platform and services.

### 1.1 SLA Applicability
- **Free Users:** Best effort basis (no SLA guarantee)
- **Premium Users:** Guaranteed service levels per tier
- **Enterprise Users:** Custom SLA available upon negotiation
- **Non-applicable:** Force majeure events, scheduled maintenance

### 1.2 Definitions

| Term | Definition |
|------|-----------|
| **Downtime** | Platform inaccessible to >5% of users for >5 minutes |
| **Uptime** | Percentage of time Platform is accessible to users |
| **Incident** | Unplanned event causing service degradation |
| **Emergency Maintenance** | Urgent maintenance to prevent data loss or security breach |
| **Scheduled Maintenance** | Planned maintenance during maintenance windows |

---

## 2. SERVICE AVAILABILITY TIERS

### 2.1 Uptime Standards

| Service Tier | Monthly Uptime | Service Credit |
|-------------|----------------|-----------------|
| **Free** | Best Effort | None |
| **Basic Premium** | 99.0% | 10% monthly fee |
| **Professional** | 99.5% | 15% monthly fee |
| **Enterprise** | 99.9% | 25% monthly fee |
| **Premium Plus** | 99.95% | 30% monthly fee |

### 2.2 Uptime Calculation
```
Monthly Uptime % = (Total Minutes in Month - Downtime Minutes) / Total Minutes in Month × 100
```

**Example:** 99.5% uptime = max 21.6 minutes downtime per month

### 2.3 Exclusions from SLA
SLA does not apply to:
- Scheduled maintenance (2 hours/month window)
- Emergency maintenance (security/data integrity)
- Client-side issues (browser, internet, device)
- Third-party service outages (payment processors, cloud providers)
- Force majeure events (natural disasters, war, terrorism)
- DDoS attacks (force majeure category)
- Client misuse or misconfiguration

---

## 3. INFRASTRUCTURE & RELIABILITY

### 3.1 Infrastructure Guarantees
SmartInvest maintains:
- Multi-region redundancy for critical services
- Automated failover systems
- Real-time monitoring and alerting
- 24/7 operations center
- Regular backup procedures

### 3.2 Data Backup & Recovery
- **Backup Frequency:** Hourly for transactions, Daily for user data
- **Recovery Point Objective (RPO):** <1 hour
- **Recovery Time Objective (RTO):** <4 hours
- **Data Retention:** Per compliance requirements (minimum 7 years for financial records)
- **Backup Testing:** Monthly disaster recovery drills

### 3.3 Load Balancing
- **Geographic Distribution:** Traffic across multiple data centers
- **Auto-scaling:** Automatic capacity increase during high demand
- **Rate Limiting:** Fair usage protections per account tier

---

## 4. SUPPORT COMMITMENTS

### 4.1 Support Tier Response Times

| Severity | Basic Premium | Professional | Enterprise |
|----------|---------------|--------------|-----------|
| **Critical** | 2 hours | 30 minutes | 15 minutes |
| **High** | 4 hours | 1 hour | 30 minutes |
| **Medium** | 24 hours | 4 hours | 2 hours |
| **Low** | 48 hours | 24 hours | 8 hours |

### 4.2 Severity Definitions

| Level | Impact | Examples |
|-------|--------|----------|
| **Critical** | Service down or major feature unavailable | Cannot access account, funds trapped, security breach |
| **High** | Significant functionality impaired | Slow transaction processing, feature buggy |
| **Medium** | Minor functionality affected | UI issue, non-critical feature not working |
| **Low** | Cosmetic or minor issue | Typo, minor UI inconsistency |

### 4.3 Support Channels

| Channel | Availability | Response Time |
|---------|-------------|----------------|
| **Chat Support** | Monday-Friday, 8am-6pm EAT | <2 hours (business hours) |
| **Email Support** | 24/7 | Per SLA severity |
| **Phone Support** | Professional/Enterprise only | Per severity |
| **Emergency Line** | Critical issues only | Immediate acknowledgment |

### 4.4 Support Limitations
- No phone support for free accounts
- Maximum 3 support tickets per day (free tier)
- Unlimited support for paid tiers
- Response time ≠ resolution time

---

## 5. PERFORMANCE GUARANTEES

### 5.1 Transaction Processing

| Transaction Type | Standard SLA | Premium SLA |
|-----------------|-------------|-----------|
| **M-Pesa C2B** | 2 minutes | <30 seconds |
| **PayPal Transfer** | 10 minutes | <5 minutes |
| **P2P Transfer** | 5 minutes | <2 minutes |
| **API Calls** | <500ms | <200ms |

### 5.2 Page Load Times
- **Initial Load:** <3 seconds (95th percentile)
- **Navigation:** <1 second (95th percentile)
- **API Response:** <200ms (95th percentile)
- **Mobile Load:** <5 seconds (95th percentile)

### 5.3 Database Performance
- **Query Response:** <100ms (99th percentile)
- **Write Operations:** <500ms (99th percentile)
- **Report Generation:** <60 seconds for standard reports

---

## 6. SERVICE CREDITS

### 6.1 Credit Eligibility
Service credits apply only when:
- Uptime falls below monthly SLA commitment
- SmartInvest is the cause (excludes force majeure)
- Client pays all monthly fees on time
- Client is current with account obligations

### 6.2 Credit Calculation
```
Credit = (SLA % - Actual Uptime %) / SLA % × Monthly Fee × Credit Percentage
```

**Example:**
- SLA: 99.5%, Actual: 98.0%, Monthly Fee: KES 2,000, Credit %: 15%
- Credit = (99.5 - 98.0) / 99.5 × 2,000 × 15% = KES 45.23

### 6.3 Credit Limits
- Maximum monthly credit: 100% of monthly fee
- Maximum cumulative credits: 3 months of fees per year
- Credits issued as account credit (not cash refunds)
- Credits non-transferable and expire after 12 months

### 6.4 Credit Claims
- Must be requested within 30 days of SLA breach
- Submitted via support ticket with documentation
- Processed within 15 business days
- No credits without formal request

---

## 7. MONITORING & REPORTING

### 7.1 Service Monitoring
SmartInvest monitors:
- **Uptime:** Real-time dashboard tracking
- **Performance:** API response times, page load times
- **Errors:** Exception rates and error types
- **Capacity:** CPU, memory, disk, bandwidth utilization
- **Security:** Intrusion attempts, SSL/TLS validity

### 7.2 Status Page
- **Public Status:** https://status.smartinvest.africa
- **Updates:** Real-time during incidents
- **Historical:** 90-day incident history
- **Notifications:** Email/SMS alerts for major incidents (opt-in)

### 7.3 Monthly Reporting
SLA reports provided within 5 business days of month-end including:
- Uptime percentage
- Incident summary and root causes
- Performance metrics
- Planned maintenance events
- Service credit calculation (if applicable)

### 7.4 SLA Violations Escalation
| Occurrence | Response |
|-----------|----------|
| 1st violation | Report + credit issued |
| 2nd violation (same quarter) | Executive notification + credit |
| 3rd violation (same quarter) | Account review + retention outreach |
| 4+ violations (same quarter) | Possible service restructuring |

---

## 8. INCIDENT MANAGEMENT

### 8.1 Incident Response Process

1. **Detection** (Automated or reported)
2. **Investigation** (Root cause analysis initiated)
3. **Communication** (Status updates every 30 minutes)
4. **Mitigation** (Implement fix or workaround)
5. **Resolution** (Service restored to normal)
6. **Post-mortem** (Analysis within 5 business days for critical incidents)

### 8.2 Communication During Outages
- **First Update:** Within 15 minutes of detection
- **Subsequent Updates:** Every 30 minutes
- **Status Page:** Updated in real-time
- **Email/SMS:** For critical incidents (opt-in users)
- **Social Media:** For company-wide issues
- **Post-incident Report:** Within 48 hours

### 8.3 Critical Incident Response
For incidents affecting 25%+ of users:
- Senior engineering escalation
- Executive team notification
- Hourly communications to customers
- Dedicated war room
- Post-incident review mandatory

---

## 9. MAINTENANCE & UPDATES

### 9.1 Scheduled Maintenance

| Frequency | Window | Max Duration | Notice |
|-----------|--------|-------------|--------|
| **Weekly** | Tuesday 2am-4am EAT | 2 hours | 7 days |
| **Monthly** | Last Sunday 12am-2am | 2 hours | 14 days |
| **Quarterly** | Announced | 4 hours | 30 days |

### 9.2 Zero-downtime Updates
- Critical security patches: Applied immediately with failover
- Major features: Rolling deployment with feature flags
- Database migrations: Backward-compatible with testing
- UI updates: Cached, progressive rollout

### 9.3 Scheduled Maintenance Notification
- Posted 30 days before for major maintenance
- Posted 7 days before for standard maintenance
- Posted immediately for emergency maintenance
- Email notification to premium users
- In-app banner notification 48 hours before

### 9.4 Emergency Maintenance
Emergency maintenance (security/data integrity) may be performed without notice if:
- Immediate risk to data or security
- Immediate risk to platform availability
- Compliance with legal or regulatory requirements
- Post-incident: Full disclosure within 24 hours

---

## 10. SECURITY & COMPLIANCE

### 10.1 Security Standards
Platform maintained to:
- ISO 27001 information security standards (target certification)
- OWASP Top 10 mitigation practices
- NIST cybersecurity framework
- PCI DSS compliance (for payment handling)
- Kenya Data Protection Act compliance

### 10.2 Security Monitoring
- 24/7 intrusion detection
- Real-time threat assessment
- Automated malware scanning
- Vulnerability assessments (quarterly)
- Penetration testing (bi-annual)
- Bug bounty program active

### 10.3 Data Protection
- Encryption in transit (TLS 1.2+)
- Encryption at rest (AES-256)
- Secure deletion of data (cryptographic erasure)
- Redundancy across geographically separated systems
- Access logging and audit trails

---

## 11. ACCEPTABLE USE

### 11.1 Client Obligations
Users agree to:
- Not attack or attempt to compromise platform
- Not exceed rate limits or consume excessive resources
- Comply with terms of service and policies
- Report security vulnerabilities responsibly
- Not interfere with monitoring or compliance measures

### 11.2 Consequences of Abuse
Users who violate these obligations may:
- Have access rate-limited
- Be subject to additional monitoring
- Have accounts suspended or terminated
- Forfeit service credits
- Be liable for damages or legal action

---

## 12. LIMITATION OF LIABILITY

### 12.1 SLA as Exclusive Remedy
- SLA credits are exclusive remedy for service failures
- Client waives other damages related to SLA breaches
- Limited to amounts paid for affected service
- Service credits ≠ service restoration guarantee

### 12.2 Excluded Damages
SmartInvest not liable for:
- Lost profits or revenue
- Lost data or business interruption
- Indirect or consequential damages
- Third-party claim impacts
- Client misuse or misconfiguration

---

## 13. UPDATES & MODIFICATIONS

### 13.1 SLA Changes
- New SLA terms: 30 days' notice to users
- Improved terms: Effective immediately
- Degraded terms: 60 days' notice for non-emergency
- Emergency changes: Effective immediately with explanation

### 13.2 Version Control
- SLA versions tracked with effective dates
- Historical versions available on request
- Current version always posted on website
- Conflicts: Earlier version applies to active subscribers

---

## 14. CONTACT & ESCALATION

For SLA-related issues:

| Category | Contact | Response Time |
|----------|---------|----------------|
| **General Support** | support@smartinvest.africa | Per severity |
| **SLA Questions** | sla@smartinvest.africa | 24 hours |
| **Outage/Incident** | incidents@smartinvest.africa | 15 minutes |
| **Escalation** | executive@smartinvest.africa | 1 hour |

**Address:** SmartInvest Africa Limited, Nairobi, Kenya  
**Phone:** +254 (Available for enterprise customer support)

---

**This SLA is effective immediately and supersedes all previous versions.**

**Last Updated: February 4, 2026**
