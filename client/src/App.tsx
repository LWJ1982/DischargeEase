// src/App.tsx
import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Profile from "./pages/Profile";

import PrivateRoute from "./components/PrivateRoute";
import AppLayout from "./components/layout/AppLayout";
import PageContainer from "./components/layout/PageContainer";

import PatientsPage from "./pages/PatientsPage";
import PatientDetailPage from "./pages/PatientDetailPage";
import AssignedServicesPage from "./pages/AssignedServicesPage";

function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Private routes */}
      <Route
        path="/patients"
        element={
          <PrivateRoute>
            <AppLayout>
              <PageContainer title="Patient Records">
                <PatientsPage />
              </PageContainer>
            </AppLayout>
          </PrivateRoute>
        }
      />

      <Route
        path="/patients/:id"
        element={
          <PrivateRoute>
            <AppLayout>
              <PageContainer title="Patient Details">
                <PatientDetailPage />
              </PageContainer>
            </AppLayout>
          </PrivateRoute>
        }
      />

      <Route
        path="/services"
        element={
          <PrivateRoute>
            <AppLayout>
              <PageContainer title="Assigned Services">
                <AssignedServicesPage />
              </PageContainer>
            </AppLayout>
          </PrivateRoute>
        }
      />

      <Route
        path="/profile"
        element={
          <PrivateRoute>
            <AppLayout>
              <PageContainer title="My Profile">
                <Profile />
              </PageContainer>
            </AppLayout>
          </PrivateRoute>
        }
      />
    </Routes>
  );
}

export default App;
