Perfect — let's break this into a clean, scalable **feature plan** for the `/patients` module tailored for the **Nurse workflow** based on your backend (`medicalRecords.js`) and your UML.

---

## ✅ Goal Recap (from UML and routes)

As a **Nurse**, the user should be able to:
1. View a **list of assigned patient records**
2. View **detailed medical info** of a single patient
3. Submit **Erratum** (error correction) for a record

---

## 🧠 Architecture Plan

### 📁 `src/api/medicalRecords.ts`
Centralized API layer:
- `getAllPatientRecords()` – `GET /medical-records/`
- `getPatientRecord(id)` – `GET /medical-records/:id`
- `getErrataForPatient(id)` – `GET /medical-records/:id/errata`
- `submitErratum(id, payload)` – `POST /medical-records/:id/erratum`

> Wrap all `axios` calls here to keep pages/components clean.

---

### 📄 `src/pages/PatientsPage.tsx`
**Purpose**: Page at `/patients` — show **all patient records** assigned to the nurse.

- Fetch using `getAllPatientRecords()` (for now, even though this gets all patients)
- Render each as a `PatientCard` or `List.Item`
- Link to `/patients/:id` on click

---

### 📄 `src/pages/PatientDetailPage.tsx`
**Purpose**: Page at `/patients/:id`

- Shows:
  - Patient name, ward, medical history
  - Optional: drawings (displayed if any)
- Embed:
  - `ErratumList` – shows errata via `getErrataForPatient(id)`
  - `ErratumForm` – submit new correction via `submitErratum(id, payload)`

---

### 🧩 Components Structure

#### 🧱 `src/components/patients/PatientCard.tsx`
- Compact display of patient (name, ward, email)
- Used in the list on `/patients`

#### 🧱 `src/components/patients/ErratumList.tsx`
- List past erratum submissions
- Includes:
  - who submitted it
  - content
  - timestamp

#### 🧱 `src/components/patients/ErratumForm.tsx`
- TextArea + Submit button
- Posts correction to `POST /:id/erratum`
- Appears only if nurse has access

---

## 🧭 Navigation Flow

1. Nurse logs in → `/patients`
2. Sees list of patients (`PatientCard`)
3. Clicks patient → navigates to `/patients/:id`
4. Views record info
5. Below that:
   - See past errata
   - Add new correction

---

## 🛡️ Permissions / Visibility Considerations

| Action | Who Can Do It | Route |
|--------|----------------|-------|
| View all records | nurse | `/medical-records/` |
| View single record | nurse | `/medical-records/:id` |
| View errata | nurse | `/medical-records/:id/errata` |
| Submit erratum | ❌ not nurse by default — _but_ **you want to allow it** | Update backend logic |

> 🔧 If nurse should be allowed to submit erratum, the backend `POST /:id/erratum` route must be updated — currently it checks for `doctor` or `admin` only.

---

## ✅ Suggested Development Order

1. ✅ Create `medicalRecords.ts` API layer
2. ✅ Build `PatientsPage.tsx` with `PatientCard`
3. ✅ Build `PatientDetailPage.tsx`
   - Include patient info
   - Include `ErratumList`
   - Include `ErratumForm`
4. 🔧 Update backend to let **nurses** submit errata (unless you restrict this)
5. ✅ Add route in `App.tsx`:
   ```tsx
   <Route path="/patients" element={<PatientsPage />} />
   <Route path="/patients/:id" element={<PatientDetailPage />} />
   ```

---

Would you like me to generate **Step 1: `src/api/medicalRecords.ts`** for you now?