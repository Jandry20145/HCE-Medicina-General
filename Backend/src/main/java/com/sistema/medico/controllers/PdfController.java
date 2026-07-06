package com.sistema.medico.controllers;

import com.sistema.medico.services.PdfService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/pdf")
@CrossOrigin(origins = "*")
public class PdfController {

    @Autowired
    private PdfService pdfService;

    @GetMapping("/historia/{idPaciente}")
    public ResponseEntity<byte[]> descargarHistoriaClinica(@PathVariable Integer idPaciente) {
        try {
            byte[] pdfBytes = pdfService.generarPdfHistoriaClinica(idPaciente);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_PDF);
            headers.setContentDispositionFormData("attachment", "Historia_Clinica_" + idPaciente + ".pdf");
            headers.setCacheControl("must-revalidate, post-check=0, pre-check=0");

            return new ResponseEntity<>(pdfBytes, headers, HttpStatus.OK);

        } catch (Exception e) {
            e.printStackTrace();
            return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}
