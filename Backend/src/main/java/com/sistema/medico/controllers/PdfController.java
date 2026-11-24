package com.sistema.medico.controllers;

import com.sistema.medico.services.AuditoriaService;
import com.sistema.medico.services.DocumentoPdfService;
import com.sistema.medico.services.PdfService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/** Documentos imprimibles. Solo Médico (SecurityConfig); cada descarga queda en la auditoría. */
@RestController
@RequestMapping("/api/pdf")
@RequiredArgsConstructor
public class PdfController {

    private final PdfService pdfService;
    private final DocumentoPdfService documentos;
    private final AuditoriaService auditoria;

    @GetMapping("/historia/{idPaciente}")
    public ResponseEntity<byte[]> historia(@PathVariable Integer idPaciente, HttpServletRequest http) throws Exception {
        byte[] pdf = pdfService.generarPdfHistoriaClinica(idPaciente);
        auditoria.registrar("PDF_DESCARGADO", "paciente=" + idPaciente, http);
        return pdf(pdf, "Historia_Clinica_" + idPaciente + ".pdf");
    }

    @GetMapping("/receta/{idConsulta}")
    public ResponseEntity<byte[]> receta(@PathVariable Integer idConsulta, HttpServletRequest http) throws Exception {
        byte[] pdf = documentos.receta(idConsulta);
        auditoria.registrar("RECETA_IMPRESA", "consulta=" + idConsulta, http);
        return pdf(pdf, "Receta_" + idConsulta + ".pdf");
    }

    @GetMapping("/certificado/{idCertificado}")
    public ResponseEntity<byte[]> certificado(@PathVariable Integer idCertificado, HttpServletRequest http) throws Exception {
        byte[] pdf = documentos.certificado(idCertificado);
        auditoria.registrar("CERTIFICADO_IMPRESO", "certificado=" + idCertificado, http);
        return pdf(pdf, "Certificado_" + idCertificado + ".pdf");
    }

    private static ResponseEntity<byte[]> pdf(byte[] contenido, String nombre) {
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header(HttpHeaders.CONTENT_DISPOSITION, ContentDisposition.inline().filename(nombre).build().toString())
                .header(HttpHeaders.CACHE_CONTROL, "no-store")
                .body(contenido);
    }
}
