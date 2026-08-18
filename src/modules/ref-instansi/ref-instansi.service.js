import * as repository from "./ref-instansi.repository.js";

export const getAll = async (params) => {
  return repository.findAll(params);
};
