# LifeLink — Smart Blood Rescue Network

LifeLink is an intelligent emergency blood-matching platform that prioritizes potentially suitable eligible donors based on preliminary ABO/Rh blood compatibility, availability, proximity, and emergency urgency, while escalating unanswered requests through a controlled multi-wave response workflow.

---

## 1. Project Architecture Overview

LifeLink connects voluntary blood donors, accredited hospitals, and regional healthcare administrators on a unified, high-availability platform backed by Google Cloud Firestore and Firebase Authentication.

### Technology Stack
- **Frontend**: React 19, TypeScript, Tailwind CSS
- **Icons**: Lucide React
- **Celebrations / Badges**: Canvas-Confetti
- **Authentication**: Firebase Authentication (Google Auth + Email/Password)
- **Primary Database**: Google Cloud Firestore (Enterprise Edition)
- **Security**: Granular Firestore Security Rules enforcing Role-Based Access Control (RBAC) and immutable audit ledgers

---

## 2. Key Modules & Portals

### Public Portal & Landing Page
- Hero section: *"Connecting Blood Donors to Those Who Need Them."*
- Real-time live network metrics directly queried from Firestore (Donors, Verified Hospitals, Active Requisitions, Critical Emergencies).
- Interactive ABO/Rh Compatibility Explorer & complete 8x8 transfusion grid.
- How LifeLink Works 4-step interactive flow.
- Transparent 100-Point operational ranking visualization.
- Clinical Disclaimer & Emergency Hotline.

### Donor Portal (`/donor`)
- Real-time blood group badge & profile completion.
- One-click Availability Switcher (`AVAILABLE` / `TEMPORARILY_UNAVAILABLE` / `UNAVAILABLE_UNTIL_DATE`).
- Targeted Match Request Inbox:
  - Hospital name, requested blood group, units, priority urgency (`NORMAL`, `URGENT`, `CRITICAL`).
  - Approximate Haversine distance in km.
  - Response deadline countdown timer.
  - 100-Point score breakdown (Compatibility, Availability, Distance, Eligibility, Reliability).
  - Accept and Decline (with structured reason) actions.
- Profile Editor with browser Geolocation GPS detection for real proximity calculations.
- Transfusion history with digital verifiable certificates.

### Hospital Portal (`/hospital`)
- Hospital registration with license number and compliance review status (`PENDING`, `VERIFIED`, `REJECTED`).
- Blood Requisition Creator with priority urgency, required units, deadline hours, and clinical notes.
- Automatic Outreach Wave 1 Dispatch (Top 5 suitable donors).
- Intelligent Match Console with Wave 2 / Wave 3 dispatchers.
- Request cancellation with automatic pending match termination and audit logging.
- Blood Inventory Management (8 ABO/Rh categories):
  - Stock levels (Normal >5, Low 3-5, Critical 0-2 units).
  - Adjust stock (intake, dispatch, disposal).
  - Reserve units and release reservations.
  - Immutable inventory transaction ledger.
- Arrival & Transfusion Confirmation:
  - Verifies unit drawn with attending clinical staff name.
  - Atomically credits hospital blood bank inventory.
  - Updates blood request fulfillment progress and donor profile.

### Emergency Radar (`/emergencies`)
- Triage dashboard for `URGENT` and `CRITICAL` blood requisitions across the regional network.
- Second-by-second live countdown timer to response deadlines.
- Regional emergency escalation trigger with audit logging.

### Admin Portal (`/admin`)
- Administrative metrics across the entire network.
- Hospital Facility Verification Queue: review state medical licenses, approve or reject applications with audit notes.
- Immutable Regulatory Audit Log Inspector.
- Global registry browser for all donors, hospitals, and requisitions.
- Network Database Seeder tool for demonstrations and testing.

---

## 3. Smart Matching Engine

### Preliminary ABO/Rh Compatibility Rules
- **O−** receives: O−
- **O+** receives: O−, O+
- **A−** receives: O−, A−
- **A+** receives: O−, O+, A−, A+
- **B−** receives: O−, B−
- **B+** receives: O−, O+, B−, B+
- **AB−** receives: O−, A−, B−, AB−
- **AB+** receives: all 8 groups (Universal Recipient)
- **O−** can donate to: all 8 groups (Universal Red-Cell Donor)

### 100-Point Operational Ranking Formula
1. **Compatibility (40 pts)**: 40 pts for identical match, 38 pts for universal O-, 35 pts for compatible alternative.
2. **Availability (20 pts)**: 20 pts for active AVAILABLE status, 0 for unavailable.
3. **Proximity / Distance (20 pts)**:
   - 0–5 km: 20 pts
   - >5–10 km: 16 pts
   - >10–20 km: 12 pts
   - >20–50 km: 8 pts
   - >50–100 km: 4 pts
   - >100 km: 0 pts
   - Missing coordinates: 0 pts (clearly flagged without inventing data).
4. **Preliminary Eligibility (10 pts)**: ≥90-day recovery window since prior donation.
5. **Reliability & History (10 pts)**: Track record of past verified donations.

### Outreach Waves
- **Wave 1**: Top 5 suitable candidates.
- **Wave 2**: Next 10 suitable candidates.
- **Wave 3**: Remaining eligible donor pool.

---

## 4. Evaluator Quick-Switch & Demo Mode

For quick evaluation during project review or judging, click the **Role: Visitor** dropdown in the navigation header to instantly switch between:
1. **Donor (Marcus Chen, O-)**: Experience pending emergency requests, response deadlines, and digital certificates.
2. **Hospital (St. Jude Trauma Center)**: Create requisitions, dispatch outreach waves, manage 8-group inventory, and confirm blood draw transfusions.
3. **System Administrator**: Verify pending hospital applications and inspect regulatory audit logs.

---

## 5. Clinical Safety & Medical Disclaimer

Operational Recommendation Only: LifeLink's matching engine utilizes preliminary ABO/Rh compatibility filters and proximity calculation. It does not make clinical eligibility decisions or replace qualified healthcare professional confirmation, laboratory cross-matching, or blood-bank serology screening.
