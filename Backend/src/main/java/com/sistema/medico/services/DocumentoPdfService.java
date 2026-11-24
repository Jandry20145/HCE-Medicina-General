package com.sistema.medico.services;

import com.lowagie.text.Document;
import com.lowagie.text.Element;
import com.lowagie.text.Font;
import com.lowagie.text.FontFactory;
import com.lowagie.text.PageSize;
import com.lowagie.text.Paragraph;
import com.lowagie.text.Rectangle;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import com.sistema.medico.models.*;
import com.sistema.medico.repositories.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.time.LocalDate;
import java.time.Period;
import java.time.format.DateTimeFormatter;
import java.util.List;

/** Receta y certificados imprimibles para firma manuscrita (firma electrónica: versión posterior). */
@Service
@RequiredArgsConstructor
public class DocumentoPdfService {

    private static final DateTimeFormatter FECHA = DateTimeFormatter.ofPattern("dd/MM/yyyy");
    private static final DateTimeFormatter FECHA_HORA = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");
    private static final Color TINTA = new Color(18, 26, 33);
    private static final Color GRIS = new Color(95, 106, 115);
    private static final Color ACENTO = new Color(15, 118, 110);

    private final ConfiguracionRepository configuracionRepository;
    private final ConsultaMedicaRepository consultaRepository;
    private final TratamientoRepository tratamientoRepository;
    private final DiagnosticoRepository diagnosticoRepository;
    private final CertificadoRepository certificadoRepository;
    private final UsuarioRepository usuarioRepository;

    private final Font titulo = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 18, TINTA);
    private final Font etiqueta = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 8, GRIS);
    private final Font texto = FontFactory.getFont(FontFactory.HELVETICA, 10.5f, TINTA);
    private final Font negrita = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10.5f, TINTA);
    private final Font pequena = FontFactory.getFont(FontFactory.HELVETICA, 8.5f, GRIS);

    @Transactional(readOnly = true)
    public byte[] receta(Integer idConsulta) throws Exception {
        ConsultaMedica consulta = firmada(idConsulta);
        List<Tratamiento> items = tratamientoRepository.findByConsultaMedica_IdConsulta(idConsulta);
        if (items.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "La consulta no tiene medicamentos prescritos");
        }
        return documento("RECETA MÉDICA", consulta, doc -> {
            List<Diagnostico> dx = diagnosticoRepository.findByConsultaMedica_IdConsulta(idConsulta);
            if (!dx.isEmpty()) {
                doc.add(campo("Diagnóstico (CIE-10)", dx.stream()
                        .map(d -> d.getCatalogoCie10().getCodigoCie() + " " + d.getCatalogoCie10().getNombreEnfermedad())
                        .reduce((a, b) -> a + " · " + b).orElse("")));
            }
            int n = 1;
            for (Tratamiento t : items) {
                Paragraph p = new Paragraph();
                p.setSpacingBefore(10);
                p.add(new Paragraph(n++ + ". " + t.getNombreMedicamento().toUpperCase()
                        + "  " + nn(t.getFormaFarmaceutica()) + "  " + nn(t.getConcentracion()), negrita));
                if (t.getDosis() != null) {
                    p.add(new Paragraph(String.join(" · ", t.getDosis(), "vía " + nn(t.getVia()).toLowerCase(),
                            nn(t.getFrecuencia()).toLowerCase(), "por " + nn(t.getDuracion())), texto));
                    p.add(new Paragraph("Cantidad: " + t.getCantidad() + " (" + enLetras(t.getCantidad()) + ")", texto));
                }
                // Indicaciones solo si el médico escribió algo distinto del resumen automático.
                if (t.getDosis() == null || !t.getIndicacionesDosis().startsWith(t.getDosis() + " vía ")) {
                    p.add(new Paragraph("Indicaciones: " + t.getIndicacionesDosis(), texto));
                }
                doc.add(p);
            }
            if (consulta.getRecomendaciones() != null && !consulta.getRecomendaciones().isBlank()) {
                doc.add(espacio());
                doc.add(campo("Recomendaciones", consulta.getRecomendaciones()));
            }
        });
    }

    @Transactional(readOnly = true)
    public byte[] certificado(Integer idCertificado) throws Exception {
        Certificado c = certificadoRepository.findById(idCertificado)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Certificado no encontrado"));
        ConsultaMedica consulta = c.getConsultaMedica();
        Paciente p = consulta.getHistoriaClinica().getPaciente();
        String nombre = p.getNombresCompletos() + " " + p.getApellidosCompletos();
        String cuerpo = switch (c.getTipo()) {
            case "Reposo" -> "Certifico que " + nombre + ", con cédula " + p.getCedulaIdentidad()
                    + ", fue atendido(a) en esta consulta el " + consulta.getFechaHoraAtencion().format(FECHA)
                    + " y requiere reposo de " + c.getDiasReposo() + " día(s), desde el " + c.getDesde().format(FECHA)
                    + " hasta el " + c.getHasta().format(FECHA) + " inclusive.";
            case "Salud" -> "Certifico que " + nombre + ", con cédula " + p.getCedulaIdentidad()
                    + ", fue evaluado(a) el " + consulta.getFechaHoraAtencion().format(FECHA)
                    + " y a la fecha no presenta hallazgos que contraindiquen sus actividades habituales.";
            default -> "Certifico que " + nombre + ", con cédula " + p.getCedulaIdentidad()
                    + ", asistió a consulta de medicina general el " + consulta.getFechaHoraAtencion().format(FECHA_HORA) + ".";
        };
        String tituloDoc = switch (c.getTipo()) {
            case "Reposo" -> "CERTIFICADO MÉDICO DE REPOSO";
            case "Salud" -> "CERTIFICADO DE SALUD";
            default -> "CERTIFICADO DE ASISTENCIA";
        };
        return documento(tituloDoc, consulta, doc -> {
            Paragraph p1 = new Paragraph(cuerpo, texto);
            p1.setLeading(16);
            p1.setSpacingBefore(12);
            doc.add(p1);
            if (c.getObservaciones() != null) {
                doc.add(espacio());
                doc.add(campo("Observaciones", c.getObservaciones()));
            }
            doc.add(espacio());
            doc.add(new Paragraph("Emitido el " + c.getEmitidoEn().format(FECHA_HORA) + " · N.º " + c.getIdCertificado(), pequena));
        });
    }

    // ------------------------------------------------------------ estructura común

    private interface Contenido {
        void escribir(Document doc) throws Exception;
    }

    private byte[] documento(String tituloDoc, ConsultaMedica consulta, Contenido contenido) throws Exception {
        Configuracion conf = configuracionRepository.findById(1).orElseThrow();
        Paciente p = consulta.getHistoriaClinica().getPaciente();
        Usuario medico = consulta.getMedico();

        Document doc = new Document(PageSize.A5, 36, 36, 36, 36);
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        PdfWriter.getInstance(doc, out);
        doc.open();

        doc.add(new Paragraph(conf.getNombreEstablecimiento(), negrita));
        String contacto = String.join(" · ", List.of(nn(conf.getDireccion()), nn(conf.getTelefono())).stream()
                .filter(s -> !s.isBlank()).toList());
        if (!contacto.isBlank()) {
            doc.add(new Paragraph(contacto, pequena));
        }
        Paragraph t = new Paragraph(tituloDoc, titulo);
        t.setSpacingBefore(14);
        t.setSpacingAfter(6);
        doc.add(t);
        doc.add(linea());

        PdfPTable datos = new PdfPTable(new float[]{3, 2, 1.4f});
        datos.setWidthPercentage(100);
        datos.setSpacingBefore(6);
        datos.addCell(celda("Paciente", p.getNombresCompletos() + " " + p.getApellidosCompletos()));
        datos.addCell(celda("Cédula", p.getCedulaIdentidad()));
        datos.addCell(celda("Edad", edad(p.getFechaNacimiento()) + " años"));
        datos.addCell(celda("Historia clínica", p.getNumeroHistoriaClinica()));
        datos.addCell(celda("Fecha", consulta.getFechaHoraAtencion().format(FECHA)));
        datos.addCell(celda("", ""));
        doc.add(datos);

        contenido.escribir(doc);

        Paragraph firma = new Paragraph();
        firma.setSpacingBefore(46);
        firma.setAlignment(Element.ALIGN_CENTER);
        firma.add(new Paragraph("______________________________", texto));
        Paragraph nombre = new Paragraph(medico != null ? medico.getNombresCompletos() : "", negrita);
        nombre.setAlignment(Element.ALIGN_CENTER);
        Paragraph registro = new Paragraph("Médico general · Reg. " + (medico != null ? nn(medico.getRegistroProfesional()) : ""), pequena);
        registro.setAlignment(Element.ALIGN_CENTER);
        firma.setAlignment(Element.ALIGN_CENTER);
        doc.add(firma);
        doc.add(nombre);
        doc.add(registro);

        if (conf.getPieDocumentos() != null && !conf.getPieDocumentos().isBlank()) {
            Paragraph pie = new Paragraph(conf.getPieDocumentos(), pequena);
            pie.setSpacingBefore(18);
            doc.add(pie);
        }
        doc.close();
        return out.toByteArray();
    }

    private ConsultaMedica firmada(Integer id) {
        ConsultaMedica c = consultaRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Consulta no encontrada"));
        if (!ConsultaMedica.FIRMADA.equals(c.getEstadoConsulta())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Firme la consulta antes de imprimir la receta");
        }
        return c;
    }

    private Paragraph campo(String nombre, String valor) {
        Paragraph p = new Paragraph();
        p.setSpacingBefore(8);
        p.add(new Paragraph(nombre.toUpperCase(), etiqueta));
        p.add(new Paragraph(valor, texto));
        return p;
    }

    private PdfPCell celda(String nombre, String valor) {
        PdfPCell c = new PdfPCell();
        c.setBorder(Rectangle.NO_BORDER);
        c.setPaddingBottom(5);
        c.addElement(new Paragraph(nombre.toUpperCase(), etiqueta));
        c.addElement(new Paragraph(valor, texto));
        return c;
    }

    private PdfPTable linea() {
        PdfPTable l = new PdfPTable(1);
        l.setWidthPercentage(100);
        PdfPCell c = new PdfPCell();
        c.setBorder(Rectangle.BOTTOM);
        c.setBorderColor(ACENTO);
        c.setBorderWidth(1.2f);
        c.setFixedHeight(2);
        l.addCell(c);
        return l;
    }

    private static final String[] UNIDADES = {"cero", "uno", "dos", "tres", "cuatro", "cinco", "seis", "siete", "ocho", "nueve",
            "diez", "once", "doce", "trece", "catorce", "quince", "dieciséis", "diecisiete", "dieciocho", "diecinueve",
            "veinte", "veintiuno", "veintidós", "veintitrés", "veinticuatro", "veinticinco", "veintiséis", "veintisiete",
            "veintiocho", "veintinueve"};
    private static final String[] DECENAS = {"", "", "", "treinta", "cuarenta", "cincuenta", "sesenta", "setenta", "ochenta", "noventa"};
    private static final String[] CENTENAS = {"", "ciento", "doscientos", "trescientos", "cuatrocientos", "quinientos",
            "seiscientos", "setecientos", "ochocientos", "novecientos"};

    /** Cantidad en letras para la receta (1-9999). Fuera de rango devuelve el número tal cual. */
    static String enLetras(String cantidad) {
        int n;
        try {
            n = Integer.parseInt(cantidad.trim());
        } catch (NumberFormatException e) {
            return cantidad;
        }
        if (n < 0 || n > 9999) {
            return cantidad;
        }
        return letras(n);
    }

    private static String letras(int n) {
        if (n < 30) {
            return UNIDADES[n];
        }
        if (n < 100) {
            return DECENAS[n / 10] + (n % 10 == 0 ? "" : " y " + UNIDADES[n % 10]);
        }
        if (n == 100) {
            return "cien";
        }
        if (n < 1000) {
            return CENTENAS[n / 100] + (n % 100 == 0 ? "" : " " + letras(n % 100));
        }
        String miles = n / 1000 == 1 ? "mil" : letras(n / 1000) + " mil";
        return miles + (n % 1000 == 0 ? "" : " " + letras(n % 1000));
    }

    private static Paragraph espacio() {
        return new Paragraph(" ");
    }

    private static int edad(LocalDate nacimiento) {
        return Period.between(nacimiento, LocalDate.now()).getYears();
    }

    private static String nn(String s) {
        return s == null ? "" : s;
    }
}
