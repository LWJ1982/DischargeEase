# 🧑‍⚕️ DischargeEase – Nurse Workflow Summary (Hi-Fi Prototype)

This document summarizes the current functional scope completed for the **Nurse** user in the DischargeEase platform, based on the original UML design and frontend/backend integration.

---

## ✅ Nurse Role Capabilities

### 1. 📄 View Patient Medical Records
- **Route**: `/patients`
- **Component**: `PatientsPage.tsx`, `PatientDetailPage.tsx`
- **Functionality**:
  - List and inspect all patients under care.
  - View medical history, ward info, and attached drawings per patient.
  - Integrated with: `GET /api/v1/medicalrecords` and `GET /:id`

---

### 2. 📝 Submit Erratum to Patient Records
- **Available From**: Patient detail view
- **Functionality**:
  - Nurse can **submit correction suggestions** tied to a patient record.
  - Erratum includes details and timestamp.
- **Backend**: `POST /api/v1/medicalrecords/:id/erratum`

---

### 3. 📅 View Assigned Services
- **Route**: `/services`
- **Component**: `AssignedServicesPage.tsx`, `AssignedServiceCard.tsx`
- **Functionality**:
  - Display all service bookings auto-assigned to the nurse.
  - Shows patient name, ward, time, and service type.
  - Supports clean empty-state UX using `<Empty />`.

---

### 4. 🔁 Update Service Status
- **Component**: `ServiceStatusUpdater.tsx`
- **Functionality**:
  - Allows nurses to update service status (e.g., from `scheduled` to `in progress` or `completed`).
  - Changes synced to backend via `PUT /api/v1/servicebooking/:bookingId`.

---

## 🧩 Technical Scope

- **Authentication**: Nurse context is preserved via `AuthContext.tsx`
- **API Layer**: Abstracted via `src/api/serviceBooking.ts`
- **Routing**: Protected using `PrivateRoute.tsx`
- **UI/UX**: Built using Ant Design components with consistent layout and feedback

---

## 📝 Future Enhancements (Optional)
> These are supported by the backend and reserved for future iterations:

- Upload or view home photos and medication info (based on service type)
- View past service history per patient (`/service-booking/history/:patientId`)
- Trigger notifications on certain updates

---

## 📁 Project Structure

```bash
src/
├── api/
│   ├── auth.ts
│   ├── medicalRecords.ts
│   ├── profile.ts
│   └── serviceBooking.ts
├── assets/
├── components/
│   ├── common/
│   │   └── GlobalLoader.tsx
│   ├── layout/
│   │   ├── AppLayout.tsx
│   │   ├── Navbar.tsx
│   │   ├── PageContainer.tsx
│   │   ├── Sidebar.tsx
│   │   └── PrivateRoute.tsx
│   ├── AssignedServiceCard.tsx
│   ├── ServiceStatusUpdater.tsx
│   ├── LoginForm.tsx
│   ├── RegisterForm.tsx
│   └── ProfileCard.tsx
├── contexts/
│   └── AuthContext.tsx
├── pages/
│   ├── AssignedServicesPage.tsx
│   ├── Login.tsx
│   ├── PatientDetailPage.tsx
│   ├── PatientsPage.tsx
│   ├── Profile.tsx
│   └── Register.tsx
├── App.tsx
├── index.css
├── App.css
├── main.tsx
└── vite-env.d.ts
```
