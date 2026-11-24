package com.sistema.medico.services;

import com.lowagie.text.*;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import com.sistema.medico.models.*;
import com.sistema.medico.repositories.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Optional;

@Service
public class PdfService {

    @Autowired private PacienteRepository pacienteRepository;
    @Autowired private HistoriaClinicaRepository historiaClinicaRepository;
    @Autowired private AntecedenteRepository antecedenteRepository;
    @Autowired private ConsultaMedicaRepository consultaMedicaRepository;
    @Autowired private SignosVitalesRepository signosVitalesRepository;
    @Autowired private ExamenFisicoRepository examenFisicoRepository;
    @Autowired private DiagnosticoRepository diagnosticoRepository;
    @Autowired private TratamientoRepository tratamientoRepository;

    public byte[] generarPdfHistoriaClinica(Integer idPaciente) throws DocumentException {
        Optional<Paciente> pacienteOpt = pacienteRepository.findById(idPaciente);
        if (pacienteOpt.isEmpty()) throw new org.springframework.web.server.ResponseStatusException(org.springframework.http.HttpStatus.NOT_FOUND, "Paciente no encontrado");
        Paciente paciente = pacienteOpt.get();

        HistoriaClinica historia = historiaClinicaRepository.findByPaciente_IdPaciente(idPaciente)
                .orElseThrow(() -> new org.springframework.web.server.ResponseStatusException(org.springframework.http.HttpStatus.NOT_FOUND, "Historia clínica no encontrada"));

        Document document = new Document(PageSize.A4, 40, 40, 50, 50);
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        PdfWriter.getInstance(document, out);

        document.open();

        Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 22, Color.WHITE);
        Font sectionFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 14, new Color(0, 102, 204));
        Font headerFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12, Color.DARK_GRAY);
        Font textFont = FontFactory.getFont(FontFactory.HELVETICA, 11, Color.DARK_GRAY);
        Font boldTextFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 11, Color.BLACK);
        Font smallItalicFont = FontFactory.getFont(FontFactory.HELVETICA_OBLIQUE, 10, Color.GRAY);

        // Encabezado Principal
        PdfPTable headerTable = new PdfPTable(1);
        headerTable.setWidthPercentage(100);
        PdfPCell titleCell = new PdfPCell(new Paragraph("REPORTE MÉDICO OFICIAL", titleFont));
        titleCell.setBackgroundColor(new Color(0, 102, 204));
        titleCell.setHorizontalAlignment(Element.ALIGN_CENTER);
        titleCell.setPaddingTop(15);
        titleCell.setPaddingBottom(15);
        titleCell.setBorder(Rectangle.NO_BORDER);
        headerTable.addCell(titleCell);
        document.add(headerTable);
        document.add(new Paragraph("\n"));

        // 1. Datos del paciente en una tabla bonita
        PdfPTable patientTable = new PdfPTable(2);
        patientTable.setWidthPercentage(100);
        patientTable.setSpacingBefore(10f);
        patientTable.setSpacingAfter(10f);

        PdfPCell patientHeaderCell = new PdfPCell(new Paragraph("DATOS DEL PACIENTE", sectionFont));
        patientHeaderCell.setColspan(2);
        patientHeaderCell.setBorder(Rectangle.BOTTOM);
        patientHeaderCell.setBorderColorBottom(new Color(0, 102, 204));
        patientHeaderCell.setBorderWidthBottom(2f);
        patientHeaderCell.setPaddingBottom(8f);
        patientTable.addCell(patientHeaderCell);

        // Fila 1
        PdfPCell cell1 = new PdfPCell(new Paragraph("Nombres Completos:", headerFont));
        cell1.setBorder(Rectangle.NO_BORDER);
        cell1.setPaddingTop(8f);
        PdfPCell cell2 = new PdfPCell(new Paragraph(paciente.getNombresCompletos() + " " + paciente.getApellidosCompletos(), textFont));
        cell2.setBorder(Rectangle.NO_BORDER);
        cell2.setPaddingTop(8f);
        patientTable.addCell(cell1);
        patientTable.addCell(cell2);

        // Fila 2
        PdfPCell cell3 = new PdfPCell(new Paragraph("Cédula de Identidad:", headerFont));
        cell3.setBorder(Rectangle.NO_BORDER);
        PdfPCell cell4 = new PdfPCell(new Paragraph(paciente.getCedulaIdentidad(), textFont));
        cell4.setBorder(Rectangle.NO_BORDER);
        patientTable.addCell(cell3);
        patientTable.addCell(cell4);

        // Fila 3
        PdfPCell cell5 = new PdfPCell(new Paragraph("Historia N°:", headerFont));
        cell5.setBorder(Rectangle.NO_BORDER);
        PdfPCell cell6 = new PdfPCell(new Paragraph(paciente.getNumeroHistoriaClinica(), textFont));
        cell6.setBorder(Rectangle.NO_BORDER);
        patientTable.addCell(cell5);
        patientTable.addCell(cell6);

        // Fila 4
        PdfPCell cell7 = new PdfPCell(new Paragraph("Fecha de Nac. / Sexo:", headerFont));
        cell7.setBorder(Rectangle.NO_BORDER);
        PdfPCell cell8 = new PdfPCell(new Paragraph(paciente.getFechaNacimiento() + " (" + paciente.getSexo() + ")", textFont));
        cell8.setBorder(Rectangle.NO_BORDER);
        cell8.setPaddingBottom(10f);
        patientTable.addCell(cell7);
        patientTable.addCell(cell8);

        document.add(patientTable);

        // 2. Antecedentes
        PdfPTable antTable = new PdfPTable(1);
        antTable.setWidthPercentage(100);
        antTable.setSpacingBefore(10f);
        antTable.setSpacingAfter(10f);

        PdfPCell antHeaderCell = new PdfPCell(new Paragraph("ANTECEDENTES CLÍNICOS", sectionFont));
        antHeaderCell.setBorder(Rectangle.BOTTOM);
        antHeaderCell.setBorderColorBottom(new Color(0, 102, 204));
        antHeaderCell.setBorderWidthBottom(2f);
        antHeaderCell.setPaddingBottom(8f);
        antTable.addCell(antHeaderCell);

        List<Antecedente> antecedentes = antecedenteRepository.findByPaciente_IdPaciente(idPaciente);
        if (antecedentes.isEmpty()) {
            PdfPCell emptyCell = new PdfPCell(new Paragraph("No registra antecedentes.", smallItalicFont));
            emptyCell.setBorder(Rectangle.NO_BORDER);
            emptyCell.setPaddingTop(8f);
            antTable.addCell(emptyCell);
        } else {
            for (Antecedente ant : antecedentes) {
                String extra = ant.getDescripcionAdicional() != null && !ant.getDescripcionAdicional().trim().isEmpty() ? " - " + ant.getDescripcionAdicional() : "";
                PdfPCell item = new PdfPCell(new Paragraph("• " + ant.getTipoAntecedente() + ": " + ant.getEnfermedadAsociada() + extra, textFont));
                item.setBorder(Rectangle.NO_BORDER);
                item.setPaddingTop(4f);
                antTable.addCell(item);
            }
        }
        document.add(antTable);

        // 3. Consultas
        PdfPTable consTable = new PdfPTable(1);
        consTable.setWidthPercentage(100);
        consTable.setSpacingBefore(10f);
        
        PdfPCell consHeaderCell = new PdfPCell(new Paragraph("HISTORIAL DE CONSULTAS", sectionFont));
        consHeaderCell.setBorder(Rectangle.BOTTOM);
        consHeaderCell.setBorderColorBottom(new Color(0, 102, 204));
        consHeaderCell.setBorderWidthBottom(2f);
        consHeaderCell.setPaddingBottom(8f);
        consTable.addCell(consHeaderCell);
        document.add(consTable);

        List<ConsultaMedica> consultas = consultaMedicaRepository.findByHistoriaClinica_IdHistoriaClinicaOrderByFechaHoraAtencionDesc(historia.getIdHistoriaClinica());
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");

        if (consultas.isEmpty()) {
            document.add(new Paragraph("No registra consultas previas.", smallItalicFont));
        }

        for (ConsultaMedica consulta : consultas) {
            PdfPTable card = new PdfPTable(1);
            card.setWidthPercentage(100);
            card.setSpacingBefore(10f);
            card.setSpacingAfter(10f);

            // Cabecera Consulta
            PdfPCell cHead = new PdfPCell(new Paragraph("Fecha: " + consulta.getFechaHoraAtencion().format(formatter) + " | " + consulta.getEstadoConsulta() + " | Médico: " + (consulta.getMedico() != null ? consulta.getMedico().getNombresCompletos() : "—"), boldTextFont));
            cHead.setBackgroundColor(new Color(230, 240, 250));
            cHead.setPadding(8f);
            cHead.setBorderColor(new Color(200, 200, 200));
            card.addCell(cHead);

            // Cuerpo Consulta
            StringBuilder body = new StringBuilder();
            body.append("Motivo: ").append(consulta.getMotivoConsulta()).append("\n");
            body.append("Enfermedad Actual: ").append(consulta.getEnfermedadActual()).append("\n");

            Optional<SignosVitales> signosOpt = signosVitalesRepository.findByConsultaMedica_IdConsulta(consulta.getIdConsulta());
            if (signosOpt.isPresent()) {
                SignosVitales sv = signosOpt.get();
                body.append("\nSignos Vitales: PA: ").append(sv.getPresionArterial())
                    .append(" | Pulso: ").append(sv.getPulso())
                    .append(" | Temp: ").append(sv.getTemperatura()).append("°C\n");
            }

            PdfPCell cBody = new PdfPCell(new Paragraph(body.toString(), textFont));
            cBody.setPadding(8f);
            cBody.setBorderColor(new Color(200, 200, 200));
            cBody.setBorderWidthTop(0);
            card.addCell(cBody);

            document.add(card);

            // Examen Fisico, Diagnósticos, Tratamientos - Mini listas
            PdfPTable details = new PdfPTable(1);
            details.setWidthPercentage(95);
            details.setHorizontalAlignment(Element.ALIGN_RIGHT);

            List<ExamenFisico> examenes = examenFisicoRepository.findByConsultaMedica_IdConsulta(consulta.getIdConsulta());
            if (!examenes.isEmpty()) {
                details.addCell(createNoBorderCell("Examen Físico:", boldTextFont));
                for(ExamenFisico ex : examenes) {
                    details.addCell(createNoBorderCell("- " + ex.getRegionAnatomica() + ": " + ex.getHallazgos(), textFont));
                }
            }

            List<Diagnostico> diagnosticos = diagnosticoRepository.findByConsultaMedica_IdConsulta(consulta.getIdConsulta());
            if (!diagnosticos.isEmpty()) {
                details.addCell(createNoBorderCell("Diagnósticos:", boldTextFont));
                for(Diagnostico diag : diagnosticos) {
                    details.addCell(createNoBorderCell("- " + diag.getTipoDiagnostico() + " | CIE-10: " + diag.getCatalogoCie10().getCodigoCie() + " - " + diag.getCatalogoCie10().getNombreEnfermedad(), textFont));
                }
            }

            List<Tratamiento> tratamientos = tratamientoRepository.findByConsultaMedica_IdConsulta(consulta.getIdConsulta());
            if (!tratamientos.isEmpty()) {
                details.addCell(createNoBorderCell("Plan Terapéutico:", boldTextFont));
                for(Tratamiento trat : tratamientos) {
                    String nombreMed = trat.getMedicamento() != null ? trat.getMedicamento().getNombreGenerico() : trat.getNombreMedicamento();
                    details.addCell(createNoBorderCell("- " + nombreMed + " | Dosis: " + trat.getIndicacionesDosis(), textFont));
                }
            }
            
            if (!examenes.isEmpty() || !diagnosticos.isEmpty() || !tratamientos.isEmpty()) {
                 document.add(details);
            }
        }

        // Pie de pagina con fecha actual
        document.add(new Paragraph("\n"));
        Paragraph footer = new Paragraph("Reporte generado el " + java.time.LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm")), smallItalicFont);
        footer.setAlignment(Element.ALIGN_CENTER);
        document.add(footer);

        document.close();
        return out.toByteArray();
    }

    private PdfPCell createNoBorderCell(String text, Font font) {
        PdfPCell cell = new PdfPCell(new Paragraph(text, font));
        cell.setBorder(Rectangle.NO_BORDER);
        cell.setPaddingTop(2f);
        cell.setPaddingBottom(2f);
        return cell;
    }
}
