package com.sistema.medico.services;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class CedulaEcuatorianaTest {

    @Test
    void aceptaCedulasConDigitoVerificadorCorrecto() {
        assertThat(CedulaEcuatoriana.esValida("1710034065")).isTrue();
        assertThat(CedulaEcuatoriana.esValida("0102030400")).isTrue();
    }

    @Test
    void rechazaDigitoVerificadorErroneoFormatoYProvincia() {
        assertThat(CedulaEcuatoriana.esValida("1710034066")).isFalse();
        assertThat(CedulaEcuatoriana.esValida("171003406")).isFalse();
        assertThat(CedulaEcuatoriana.esValida("17100340651")).isFalse();
        assertThat(CedulaEcuatoriana.esValida("17A0034065")).isFalse();
        assertThat(CedulaEcuatoriana.esValida("2510034065")).isFalse();
        assertThat(CedulaEcuatoriana.esValida("1760034065")).isFalse();
        assertThat(CedulaEcuatoriana.esValida(null)).isFalse();
    }

    @Test
    void normalizaErratasDeCodigosCie10() {
        assertThat(Cie10LoaderService.normalizarCodigo("À69.8")).isEqualTo("A69.8");
        assertThat(Cie10LoaderService.normalizarCodigo("j00")).isEqualTo("J00");
    }

    @Test
    void cantidadEnLetrasParaLaReceta() {
        assertThat(DocumentoPdfService.enLetras("9")).isEqualTo("nueve");
        assertThat(DocumentoPdfService.enLetras("21")).isEqualTo("veintiuno");
        assertThat(DocumentoPdfService.enLetras("45")).isEqualTo("cuarenta y cinco");
        assertThat(DocumentoPdfService.enLetras("100")).isEqualTo("cien");
        assertThat(DocumentoPdfService.enLetras("115")).isEqualTo("ciento quince");
        assertThat(DocumentoPdfService.enLetras("2030")).isEqualTo("dos mil treinta");
    }

    @Test
    void reconoceHashesBcrypt() {
        assertThat(DatosIniciales.esBcrypt(new org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder().encode("x"))).isTrue();
        assertThat(DatosIniciales.esBcrypt("1234")).isFalse();
        assertThat(DatosIniciales.esBcrypt(null)).isFalse();
    }
}
