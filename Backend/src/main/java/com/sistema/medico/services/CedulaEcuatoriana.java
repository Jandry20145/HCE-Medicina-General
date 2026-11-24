package com.sistema.medico.services;

/** Validación del dígito verificador de la cédula ecuatoriana de persona natural (módulo 10). */
public final class CedulaEcuatoriana {

    private CedulaEcuatoriana() {
    }

    public static boolean esValida(String cedula) {
        if (cedula == null || !cedula.matches("\\d{10}")) {
            return false;
        }
        int provincia = Integer.parseInt(cedula.substring(0, 2));
        // 01-24 provincias, 30 ecuatorianos registrados en el exterior.
        if ((provincia < 1 || provincia > 24) && provincia != 30) {
            return false;
        }
        if (Character.getNumericValue(cedula.charAt(2)) >= 6) {
            return false;
        }
        int suma = 0;
        for (int i = 0; i < 9; i++) {
            int digito = Character.getNumericValue(cedula.charAt(i));
            if (i % 2 == 0) {
                digito *= 2;
                if (digito > 9) {
                    digito -= 9;
                }
            }
            suma += digito;
        }
        int verificador = (10 - suma % 10) % 10;
        return verificador == Character.getNumericValue(cedula.charAt(9));
    }
}
