export const API_URL = 'http://localhost:8080/api';

export const buscarCie10 = async (query) => {
  try {
    const response = await fetch(`${API_URL}/catalogos/cie10/buscar?q=${encodeURIComponent(query)}`);
    if (!response.ok) throw new Error('Network response was not ok');
    return await response.json();
  } catch (error) {
    console.error("Error fetching CIE10 data:", error);
    return [];
  }
};
export const getAntecedentesPaciente = async (idPaciente) => {
  try {
    const response = await fetch(`${API_URL}/antecedentes/paciente/${idPaciente}`);
    if (!response.ok) throw new Error('Error al obtener antecedentes');
    return await response.json();
  } catch (error) {
    console.error(error);
    return [];
  }
};

export const saveAntecedente = async (antecedenteDTO) => {
  const response = await fetch(`${API_URL}/antecedentes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(antecedenteDTO)
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || 'Error al guardar antecedente');
  }
  return await response.json();
};
