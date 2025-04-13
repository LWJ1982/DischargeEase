// src/api/medicalRecords.ts
import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

export interface PatientRecord {
  id: number;
  patient_id: number;
  name: string;
  ward: string;
  medical_history: string;
  drawings: string[]; // array of image URLs
  patient?: {
    id: number;
    name: string;
    email: string;
  };
}

export interface Erratum {
  id: number;
  correction_details: string;
  timestamp: string;
  SubmittedBy: {
    id: number;
    name: string;
    role: string;
  };
}

/**
 * Get all patient records (for doctors and nurses)
 */
export const getAllPatientRecords = async (): Promise<PatientRecord[]> => {
  const res = await axios.get(`${BASE_URL}/medicalrecords`);
  return res.data.data;
};

/**
 * Get a single patient record by ID
 */
export const getPatientRecordById = async (
  id: number
): Promise<PatientRecord> => {
  const res = await axios.get(`${BASE_URL}/medicalrecords/${id}`);
  return res.data.data;
};

/**
 * Get all errata for a given patient record
 */
export const getErrataForPatient = async (id: number): Promise<Erratum[]> => {
  const res = await axios.get(`${BASE_URL}/medicalrecords/${id}/errata`);
  return res.data.data;
};
