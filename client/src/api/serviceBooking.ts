// src/api/serviceBooking.ts
import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Fetch all services assigned to a nurse
export const getNurseAssignments = async (nurseId: number) => {
  const response = await axios.get(
    `${BASE_URL}/servicebooking/nurse/${nurseId}`
  );
  return response.data.data; // list of bookings
};

// Update status of a service booking
export const updateBookingStatus = async (
  bookingId: number,
  status: string
) => {
  const response = await axios.put(`${BASE_URL}/servicebooking/${bookingId}`, {
    status,
  });
  return response.data.data; // updated booking
};

// Get patient’s service history (completed bookings)
export const getPatientServiceHistory = async (patientId: number) => {
  const response = await axios.get(
    `${BASE_URL}/servicebooking/history/${patientId}`
  );
  return response.data.data; // { patient: {...}, service_history: [...] }
};

// Upload medication info (discharge counseling only)
export const uploadMedicationInfo = async (
  bookingId: number,
  medications: {
    name: string;
    dosage: string;
    frequency: string;
    duration: string;
  }[]
) => {
  const response = await axios.post(
    `${BASE_URL}/servicebooking/${bookingId}/medication-info`,
    {
      medications,
    }
  );
  return response.data.data;
};

// Upload home photos (home assessment only)
export const uploadHomePhotos = async (bookingId: number, files: File[]) => {
  const formData = new FormData();
  files.forEach((file) => formData.append("photos", file));

  const response = await axios.post(
    `${BASE_URL}/servicebooking/${bookingId}/home-photos`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );
  return response.data.data;
};
