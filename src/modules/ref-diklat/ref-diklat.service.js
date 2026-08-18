import * as repository from "./ref-diklat.repository.js";
import AppError from "../../utils/AppError.js";
import { v4 as uuidv4 } from "uuid";

// --- JENIS DIKLAT ---

export const getAllJenis = async (params) => {
  return repository.findAllJenis(params);
};

export const getJenisById = async (id) => {
  const jenis = await repository.findJenisById(id);
  if (!jenis) throw new AppError("Jenis diklat tidak ditemukan", 404);
  return jenis;
};

export const createJenis = async (data) => {
  const payload = {
    ...data,
    id: uuidv4(),
  };
  return repository.createJenis(payload);
};

export const updateJenis = async (id, data) => {
  await getJenisById(id);
  return repository.updateJenis(id, data);
};

export const deleteJenis = async (id) => {
  await getJenisById(id);
  return repository.softDeleteJenis(id);
};

// --- JENJANG DIKLAT ---

export const getAllJenjang = async (params) => {
  return repository.findAllJenjang(params);
};

export const getJenjangById = async (id) => {
  const jenjang = await repository.findJenjangById(id);
  if (!jenjang) throw new AppError("Jenjang diklat tidak ditemukan", 404);
  return jenjang;
};

export const createJenjang = async (data) => {
  // Verify if jenis diklat exists
  await getJenisById(data.jnsDiklat_id);
  
  const payload = {
    ...data,
    id: uuidv4(),
  };
  return repository.createJenjang(payload);
};

export const updateJenjang = async (id, data) => {
  await getJenjangById(id);
  if (data.jnsDiklat_id) {
    await getJenisById(data.jnsDiklat_id);
  }
  return repository.updateJenjang(id, data);
};

export const deleteJenjang = async (id) => {
  await getJenjangById(id);
  return repository.softDeleteJenjang(id);
};
