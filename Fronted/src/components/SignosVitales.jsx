import { AvisosSignos, Campo } from './ui';
import { alertasSignos, calcularImc, clasificarImc } from '../utils/clinica';

const CAMPOS = [
  { k: 'presionArterial', label: 'Presión arterial', unidad: 'mmHg', ph: '120/80', tipo: 'text' },
  { k: 'pulso', label: 'Frecuencia cardiaca', unidad: 'lpm', ph: '72' },
  { k: 'frecuenciaRespiratoria', label: 'Frecuencia respiratoria', unidad: 'rpm', ph: '16' },
  { k: 'temperatura', label: 'Temperatura', unidad: '°C', ph: '36.5', step: '0.1' },
  { k: 'saturacionOxigeno', label: 'Saturación O₂', unidad: '%', ph: '98' },
  { k: 'pesoKg', label: 'Peso', unidad: 'kg', ph: '70', step: '0.1' },
  { k: 'tallaCm', label: 'Talla', unidad: 'cm', ph: '165', step: '0.1' },
];
const NIVEL = { normal: 'pill-ok', alerta: 'pill-alerta', critico: 'pill-critico' };


/** Captura de signos con IMC y avisos en vivo. Los avisos orientan; no bloquean. */
export function SignosVitales({ valor, onChange, soloLectura = false }) {
  const imc = calcularImc(valor.pesoKg, valor.tallaCm);
  const clase = clasificarImc(imc);
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {CAMPOS.map((c) => (
          <Campo key={c.k} etiqueta={`${c.label} (${c.unidad})`}>
            <input className="input num" disabled={soloLectura} type={c.tipo || 'number'} step={c.step} inputMode={c.tipo ? 'text' : 'decimal'}
              placeholder={c.ph} value={valor[c.k] ?? ''} onChange={(e) => onChange({ ...valor, [c.k]: e.target.value })} />
          </Campo>
        ))}
        <Campo etiqueta="Grupo sanguíneo">
          <select className="input" disabled={soloLectura} value={valor.grupoSanguineo ?? ''} onChange={(e) => onChange({ ...valor, grupoSanguineo: e.target.value })}>
            <option value="">—</option>
            {['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'].map((g) => <option key={g}>{g}</option>)}
          </select>
        </Campo>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <span className="etiqueta mr-1">IMC</span>
        {imc == null ? <span className="tenue text-sm">Ingrese peso y talla</span>
          : <span className={`pill ${NIVEL[clase.nivel]}`}>{imc} kg/m² · {clase.etiqueta}</span>}
      </div>
      <AvisosSignos avisos={alertasSignos(valor)} />
    </div>
  );
}
