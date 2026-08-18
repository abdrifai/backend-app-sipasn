import * as repository from "./ref-jns-mutasi.repository.js";
import AppError from "../../utils/AppError.js";
import { v4 as uuidv4 } from "uuid";

export const getAll = async (params) => {
  return repository.findAll(params);
};

export const getById = async (id) => {
  const data = await repository.findById(id);
  if (!data) throw new AppError("Jenis Mutasi tidak ditemukan", 404);
  return data;
};

export const create = async (data) => {
  return repository.create({
    id: uuidv4(),
    ...data
  });
};

export const update = async (id, data) => {
  await getById(id);
  return repository.update(id, data);
};

export const deleteById = async (id) => {
  await getById(id);
  return repository.softDelete(id);
};
