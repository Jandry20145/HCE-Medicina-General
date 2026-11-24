import { describe, expect, it } from 'vitest';
import { alertasSignos, calcularEdad, calcularImc, cedulaValida, clasificarImc, signosParaApi } from './clinica';

describe('calcularEdad', () => {
  const hoy = new Date(2026, 10, 23); // 23 nov 2026
  it('cuenta años cumplidos, no el año de nacimiento', () => {
    expect(calcularEdad('1990-11-23', hoy)).toBe(36);
    expect(calcularEdad('1990-11-24', hoy)).toBe(35);
    expect(calcularEdad('1990-12-01', hoy)).toBe(35);
  });
  it('devuelve null sin fecha o con fecha futura', () => {
    expect(calcularEdad('', hoy)).toBeNull();
    expect(calcularEdad('2030-01-01', hoy)).toBeNull();
  });
});

describe('IMC', () => {
  it('calcula y clasifica según la OMS', () => {
    expect(calcularImc(70, 175)).toBe(22.9);
    expect(clasificarImc(22.9).etiqueta).toBe('Normal');
    expect(clasificarImc(17).etiqueta).toBe('Bajo peso');
    expect(clasificarImc(27).etiqueta).toBe('Sobrepeso');
    expect(clasificarImc(32).nivel).toBe('critico');
  });
  it('sin peso o talla no inventa un valor', () => {
    expect(calcularImc('', 170)).toBeNull();
    expect(calcularImc(70, 0)).toBeNull();
    expect(clasificarImc(null)).toBeNull();
  });
});

describe('alertasSignos', () => {
  it('no avisa con signos normales o vacíos', () => {
    expect(alertasSignos({ temperatura: '36.6', pulso: '72', presionArterial: '118/76', saturacionOxigeno: '98' })).toEqual([]);
    expect(alertasSignos({})).toEqual([]);
  });
  it('marca fiebre, taquicardia, desaturación y crisis hipertensiva', () => {
    const textos = alertasSignos({ temperatura: 39.8, pulso: 110, saturacionOxigeno: 88, presionArterial: '185/110' });
    expect(textos.map((a) => a.nivel)).toEqual(['critico', 'alerta', 'critico', 'critico']);
  });
});

describe('signosParaApi', () => {
  it('convierte vacíos en null en vez de 0 y usa los nombres de la API', () => {
    expect(signosParaApi({ pulso: '', temperatura: '37.2', pesoKg: '70', tallaCm: '', presionArterial: ' ' })).toEqual({
      presionArterial: null, pulso: null, temperatura: 37.2, frecuenciaRespiratoria: null,
      saturacionOxigeno: null, pesoKg: 70, tallaCm: null, grupoSanguineo: null,
    });
  });
});

describe('cedulaValida', () => {
  it('coincide con la validación del servidor', () => {
    expect(cedulaValida('1710034065')).toBe(true);
    expect(cedulaValida('0102030400')).toBe(true);
    expect(cedulaValida('1710034066')).toBe(false);
    expect(cedulaValida('2510034065')).toBe(false);
    expect(cedulaValida('12345')).toBe(false);
  });
});
