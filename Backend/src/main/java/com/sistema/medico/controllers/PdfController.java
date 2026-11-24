package com.sistema.medico.controllers;

import com.sistema.medico.services.AuditoriaService;
import com.sistema.medico.services.PdfService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/pdf")
@RequiredArgsConstructor
public class PdfController {

    private final PdfService pdfService;
    private final AuditoriaService auditoria;

    @GetMapping("/historia/{idPaciente}")
    public ResponseEntity<byte[]> descargarHistoriaClinica(@PathVariable Integer idPaciente, HttpServletRequest http)
            throws Exception {
        byte[] pdf = pdfService.generarPdfHistoriaClinica(idPaciente);
        auditoria.registrar("PDF_DESCARGADO", "paciente=" + idPaciente, http);
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        ContentDisposition.attachment().filename("Historia_Clinica_" + idPaciente + ".pdf").build().toString())
                .header(HttpHeaders.CACHE_CONTROL, "no-store")
                .body(pdf);
    }
}
