/**
 * Integração com a API pública ViaCEP (https://viacep.com.br).
 * Não usa Authorization (axios global poderia injetar token); chamamos via fetch nativo.
 */

import { unmask } from "../utils/masks";

export interface ViaCepAddress {
  zip: string;
  street: string;
  district: string;
  city: string;
  state: string;
}

export async function searchAddressByZip(
  cep: string
): Promise<ViaCepAddress | null> {
  const clean = unmask(cep);
  if (clean.length !== 8) return null;

  try {
    const res = await fetch(`https://viacep.com.br/ws/${clean}/json/`);
    if (!res.ok) return null;
    const data = await res.json();
    if (data?.erro) return null;
    return {
      zip: data.cep ?? "",
      street: data.logradouro ?? "",
      district: data.bairro ?? "",
      city: data.localidade ?? "",
      state: data.uf ?? "",
    };
  } catch {
    return null;
  }
}
