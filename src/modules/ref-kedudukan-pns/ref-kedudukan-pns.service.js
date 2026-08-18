import * as repository from "./ref-kedudukan-pns.repository.js";
import AppError from "../../utils/AppError.js";

export const getAll = async (params) => {
  return repository.findAll(params);
};

export const getById = async (id) => {
  const data = await repository.findById(id);
  if (!data) throw new AppError("Kedudukan PNS tidak ditemukan", 404);
  return data;
};

export const create = async (data) => {
  return repository.create(data);
};

export const update = async (id, data) => {
  await getById(id);
  return repository.update(id, data);
};

export const deleteById = async (id) => {
  await getById(id);
  return repository.softDelete(id);
};
