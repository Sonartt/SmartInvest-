# Business Continuity & Disaster Recovery Plan
## SmartInvest Africa Limited

**Effective Date:** February 5, 2026  
**Version:** 1.0  
**Last Updated:** February 5, 2026

---

## 1. EXECUTIVE SUMMARY

This Business Continuity and Disaster Recovery Plan (BCDRP) outlines SmartInvest's procedures for preparing for, responding to, and recovering from disruptions to normal business operations.

### 1.1 Purpose
- Minimize impact of disruptive events
- Ensure rapid business resumption
- Protect critical operations and data
- Maintain stakeholder confidence
- Comply with regulatory requirements
- Document recovery procedures

### 1.2 Scope
This plan covers:
- All business units and departments
- Critical systems and platforms
- Data centers and infrastructure
- Third-party providers
- Subsidiary operations
- All geographic locations

### 1.3 Plan Governance
- **Executive Sponsor:** Chief Executive Officer
- **Coordinator:** Chief Technology Officer
- **Approver:** Board of Directors
- **Update Frequency:** Annually (minimum)
- **Testing:** Quarterly (minimum)
- **Stakeholder Communication:** As needed

---

## 2. RISK ASSESSMENT & CRITICALITY

### 2.1 Critical Business Functions

| Function | Recovery Priority | Target RTO | Target RPO |
|----------|-------------------|-----------|-----------|
| **Payment Processing** | P1 - CRITICAL | 1 hour | 15 minutes |
| **Core Platform Access** | P1 - CRITICAL | 2 hours | 1 hour |
| **Customer Data** | P1 - CRITICAL | 4 hours | 1 hour |
| **Admin Features** | P2 - HIGH | 8 hours | 4 hours |
| **Reporting/Analytics** | P2 - HIGH | 24 hours | 24 hours |
| **Marketing Systems** | P3 - MEDIUM | 48 hours | 24 hours |

**Definitions:**
- **RTO (Recovery Time Objective):** Maximum acceptable downtime
- **RPO (Recovery Point Objective):** Maximum acceptable data loss

### 2.2 Critical Systems

**Tier 1 (24/7 Protection):**
- Payment gateway servers
- Database servers (primary)
- Authentication systems
- Customer account data
- Transaction history logging

**Tier 2 (Business hours):**
- Admin dashboards
- Reporting systems
- Email and communication
- File servers
- Development environments

**Tier 3 (Recoverable, non-urgent):**
- Non-production systems
- Testing environments
- Archive systems
- Historical data

---

## 3. POTENTIAL DISASTER SCENARIOS

### 3.1 Natural Disasters
- Earthquakes and aftershocks
- Floods and water damage
- Fire and structural damage
- Severe weather (storms, lightning)
- Landslides or environmental events

**Impact:** Physical infrastructure damage, power loss, communication outage

### 3.2 Technology Failures
- Data center outage
- Ransomware or malware attack
- Cyber breach or intrusion
- Software bugs or corruptions
- Hardware failures and degradation

**Impact:** System unavailability, data loss, security compromise

### 3.3 Human Factors
- Key personnel unavailability (illness, exodus)
- Human error causing data loss
- Insider threats or sabotage
- Strikes or labor disputes
- Terrorism or workplace violence

**Impact:** Operational delays, data incidents, leadership gaps

### 3.4 External Events
- Government actions or regulations
- Third-party provider failures
- Utility outages (power, internet)
- Supply chain disruptions
- Pandemics or health emergencies

**Impact:** Regulatory compliance issues, vendor dependencies, resource limitations

---

## 4. RESPONSE STRUCTURE & ROLES

### 4.1 Crisis Management Team

| Role | Responsibility | Alternate |
|------|-----------------|-----------|
| **Crisis Commander** | Activates plan, coordinates response | CEO/COO |
| **Technical Lead** | Oversees technical recovery | CTO |
| **Communications Lead** | External/internal messaging | Head of PR |
| **Operations Lead** | Resource allocation and logistics | Operations Manager |
| **Finance Lead** | Budget and vendor coordination | CFO |
| **HR Lead** | Personnel and payroll continuity | HR Manager |
| **Compliance Lead** | Regulatory notifications | DPO |

### 4.2 Activation Authority
- **Tier 1 Incident:** Crisis Commander or CEO can declare
- **Tier 2 Incident:** CTO recommendation required
- **Tier 3 Incident:** Department head decision

### 4.3 Communication Protocol
Upon plan activation:
1. Crisis team convened within 30 minutes
2. Team members notified via SMS, phone, email
3. Initial briefing within 1 hour
4. Updates every 2-4 hours during incident
5. Daily updates until resolution
6. Post-incident review within 1 week

---

## 5. BACKUP & RECOVERY SYSTEMS

### 5.1 Data Backup Strategy

**Frequency:**
- Transactional data: Hourly backups
- Customer data: 4-hour cycle
- Static content: Daily backups
- Configuration files: With every change
- Archives: Weekly + monthly snapshots

**Location:**
- Primary backup: On-site redundant storage
- Secondary backup: Geographic alternate location
- Tertiary backup: Cloud off-site provider
- Verification: Monthly restore tests

### 5.2 Recovery Point Options

| Scenario | Recovery Option | Data Freshness | Time to Restore |
|----------|-----------------|---|---|
| **Ransomware detected** | Clean backup (24+ hrs old) | Acceptable loss | 2-4 hours |
| **Hardware failure** | Hot standby (active-active) | Real-time | 5 minutes |
| **Data corruption** | Database snapshots (hourly) | <1 hour old | 30 minutes |
| **Major disaster** | Off-site backup replication | 1-4 hours old | 4-8 hours |

### 5.3 Geographic Redundancy
- **Primary Data Center:** Nairobi metropolitan area
- **Failover Data Center:** South Africa (alternate region)
- **Cloud Backup:** AWS or Azure (geographically distributed)
- **Failover Time:** < 30 minutes for P1 systems

---

## 6. INCIDENT RESPONSE PROCEDURES

### 6.1 Detection & Assessment (15 minutes)

1. **Identify Issue**
   - Automated monitoring alert or manual report
   - Determine severity (P1/P2/P3)
   - Assess scope (how many users affected)
   - Document initial impact

2. **Initial Response**
   - Notify on-call technical staff
   - Notify department manager
   - Begin preliminary investigation
   - Gather initial information

3. **Activate or Escalate**
   - If resolved quickly, document and monitor
   - If ongoing >15 minutes, activate Crisis Team
   - Escalate if P1 or multiple systems affected

### 6.2 Response & Mitigation (1-4 hours)

**Crisis Team Actions:**
- Establish command center (physical or virtual)
- Gather technical details and root cause assessment
- Implement immediate workarounds or containment
- Begin recovery procedures if applicable
- Document timeline of events
- Prepare internal communications

**Communication Actions:**
- Notify customers of service impact
- Provide initial status estimate
- Update ETA for service restoration
- Notify staff of any workarounds
- Activate redundant systems if needed

**Technical Actions:**
- Isolate affected systems (if security incident)
- Execute failover procedures (if applicable)
- Begin restore from backup (if needed)
- Implement remediation (if quick fix available)
- Verify system integrity and security

### 6.3 Recovery & Restoration (2-24 hours)

- Execute full recovery procedure
- Restore from backup if needed
- Verify data integrity and completeness
- Restore connectivity and access
- Conduct smoke testing
- Gradual customer migration (if needed)

---

## 7. COMMUNICATION PLAN

### 7.1 Internal Communication

**Upon Activation:**
- Send SMS alert to Crisis Team
- Email with incident details
- Slack/Teams notification with status
- War room video conference link

**During Incident:**
- Hourly updates to leadership
- Department-specific guidance
- Escalation points and action items
- Staff procedures and workarounds

**Upon Resolution:**
- Notification of service restoration
- Summary of what happened
- Thank you for patience
- Post-incident review announcement

### 7.2 External Communication

**Customer Notification:**
- Status page update (within 30 minutes)
- Email notification (if P1 or >1 hour)
- Social media updates (every 2 hours during incident)
- Recovery notification (upon restoration)

**Standard Template:**
> We are currently experiencing elevated latency on our core platform. Our team is investigating and working to resolve the issue. We apologize for any inconvenience. Updates will be provided every [X minutes].

### 7.3 Regulatory Notification
- Data breach: Within 48 hours (per regulation)
- Compliance impact: Within 1 business day
- Extended outage: Notify CBK if applicable
- Documented findings: Within 5 business days

---

## 8. RECOVERY PROCEDURES

### 8.1 Database Recovery
```
1. Stop all database connections
2. Verify last valid backup integrity
3. Begin database restore from backup
4. Monitor restore progress (eta: [time])
5. Verify data completeness and consistency
6. Test critical queries and transactions
7. Gradually return connections to system
8. Monitor for anomalies
9. Verify end-to-end functionality
```

### 8.2 Application Server Recovery
```
1. Verify backup copies exist
2. Provision new server infrastructure
3. Deploy application code from backup
4. Restore configuration files
5. Establish database connectivity
6. Perform health checks
7. Gradual traffic migration
8. Monitor error rates and performance
9. Full verification of features
```

### 8.3 Data Center Failover
```
1. Verify failover site readiness
2. Update DNS records to failover location
3. Activate secondary database replicas
4. Route traffic to failover data center
5. Verify all services operational
6. Monitor performance and availability
7. Provide stakeholder updates
8. Plan recovery to primary site
```

---

## 9. TESTING & MAINTENANCE

### 9.1 Testing Schedule

| Test Type | Frequency | Duration | Scope |
|-----------|-----------|----------|-------|
| **Tabletop Exercise** | Quarterly | 1-2 hours | Plan review & discussion |
| **Backup Verification** | Monthly | 1 hour | Restore single database |
| **Failover Test** | Quarterly | 2-4 hours | Actual failover to alternate |
| **Full Simulation** | Annually | 4-8 hours | Complete incident scenario |

### 9.2 Testing Procedures

**Monthly Backup Test:**
- Restore production database to test environment
- Verify data completeness and integrity
- Confirm restore time (compare to RTO)
- Document any issues
- Archive test results

**Quarterly Failover Test:**
- Execute actual switchover to alternate site
- Verify all services operational
- Monitor performance metrics
- Conduct transactions and verify accuracy
- Switch back to primary
- Document findings and issues

**Annual Full Simulation:**
- Simulate major disaster scenario
- Activate crisis team
- Execute all recovery procedures
- Test communication protocols
- Observe response execution
- Identify gaps and improvements

### 9.3 Plan Maintenance
- Review plan annually (minimum)
- Update contact information quarterly
- Test recovery procedures quarterly
- Document lessons learned
- Incorporate new systems
- Update timelines and procedures
- Conduct training annually

---

## 10. VENDOR & THIRD-PARTY CONSIDERATIONS

### 10.1 Vendor Requirements
All critical vendors must:
- Maintain redundant capacity
- Provide SLA guarantees (99.9% minimum)
- Maintain backup and recovery capability
- Provide failover support
- Offer disaster recovery assistance
- Maintain crisis response team
- Document recovery procedures

### 10.2 Verification Steps
- Request vendor disaster recovery procedures
- Verify vendor backup systems
- Confirm vendor recovery time objectives
- Test vendor failover capability
- Establish vendor escalation contacts
- Include in annual testing schedule

---

## 11. TRAINING & AWARENESS

### 11.1 Training Program
All personnel receive:
- Initial BCDRP training (upon hire)
- Annual refresher training
- Role-specific procedure training
- Crisis response simulations
- Technical recovery procedures (for IT staff)
- Communication protocols (for leadership)

### 11.2 Knowledge Management
- Plan documentation in shared location
- Contact information regularly updated
- Procedures referenced in training
- Checklist provided to critical roles
- Procedures tested quarterly
- Lessons documented and shared

---

## 12. DOCUMENT & PLAN CONTROL

### 12.1 Updating Procedures
- Annual review required (minimum)
- Changes approved by CEO and Board
- 30 days' notice for major changes
- Immediate update for critical procedure changes
- Version control and tracking
- Historical versions retained (3 years)

### 12.2 Distribution
Plan copies maintained by:
- Crisis Team members (physical + electronic)
- IT Department (backup + failover sites)
- Executive Leadership
- Board of Directors
- Off-site secure location

---

## 13. POST-INCIDENT REVIEW

### 13.1 Review Process
Within 5 business days of incident:
- Convene crisis team
- Review timeline and decisions
- Identify what went well
- Identify gaps and issues
- Develop corrective actions
- Document and share findings

### 13.2 Documentation
Document:
- Incident timeline (minute-by-minute)
- Root cause analysis
- Impact assessment (customers, data, revenue)
- Recovery actions taken
- Time to detection and recovery
- Lessons learned
- Recommended improvements

### 13.3 Continuous Improvement
- Implement quick improvements immediately
- Plan larger improvements in next quarter
- Update plan based on findings
- Share learnings across organization
- Communicate improvements to stakeholders

---

## 14. CONTACT & ESCALATION

### 14.1 24/7 Crisis Contact Tree

**Primary Contacts (Try in order):**
1. On-call Technical Lead: [phone]
2. CTO: [phone/email]
3. CEO: [phone/email]
4. Board Chair: [phone]

**Backup Contacts:**
- Operations Manager (when CTO unavailable)
- Deputy CTO (when primary unavailable)
- CFO (financial/resource decisions)
- Head of PR (communications support)

### 14.2 Service Provider Escalation
- Payment Gateway: 24/7 critical hotline
- Cloud Provider: Enterprise support channel
- ISP/Telecom: Disaster recovery hotline
- Data Center: Direct operations line
- Security Partner: Incident response team

---

**This Business Continuity and Disaster Recovery Plan is effective immediately and supersedes all previous versions.**

**Last Updated: February 5, 2026**
