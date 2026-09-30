# IntelliPresence — AWS SES Email Integration

This module manages automated transactional email dispatching via **Amazon Simple Email Service (SES)**.

---

## 📧 Key Email Workflows

1. **Low-Attendance Threshold Alerts**:
   * Automatically triggered when an enrolled student's semester or course attendance drops below the 75% examination threshold.
   * Calculates the exact number of consecutive upcoming classes the student must attend to regain eligibility.

2. **Faculty & Student Invitations**:
   * Onboarding invitation emails carrying single-use cryptographic registration tokens.

---

## 🛡️ Production & Interview Architecture Notes

* **Sandbox vs. Production**: In AWS SES Sandbox mode, recipient addresses must be pre-verified. The service includes automatic mock fallback (`status: "simulated"`) so local developers and test suites do not encounter crashes or incur AWS costs.
* **DKIM & SPF Authentication**: Designed to work with custom domain sender identities (`notifications@institution.edu`) with 100% spam-folder protection.
