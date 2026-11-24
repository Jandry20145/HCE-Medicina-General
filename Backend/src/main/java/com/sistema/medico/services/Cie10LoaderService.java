package com.sistema.medico.services;

import com.sistema.medico.models.CatalogoCie10;
import com.sistema.medico.repositories.CatalogoCie10Repository;
import lombok.RequiredArgsConstructor;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.ss.usermodel.WorkbookFactory;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Service;

import java.io.File;
import java.io.FileInputStream;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

/** Importa el catálogo CIE-10 desde el Excel la primera vez (tabla vacía). Columnas: B = código, C = nombre. */
@Service
@Order(2)
@RequiredArgsConstructor
public class Cie10LoaderService implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(Cie10LoaderService.class);

    private final CatalogoCie10Repository catalogoCie10Repository;

    @Value("${hce.cie10.archivo}")
    private String archivo;

    @Override
    public void run(String... args) {
        if (catalogoCie10Repository.count() > 0) {
            return;
        }
        File file = new File(archivo);
        if (!file.exists()) {
            log.warn("No se encontró {}: el buscador CIE-10 estará vacío", file.getAbsolutePath());
            return;
        }
        try (FileInputStream fis = new FileInputStream(file); Workbook workbook = WorkbookFactory.create(fis)) {
            Sheet sheet = workbook.getSheetAt(0);
            List<CatalogoCie10> lote = new ArrayList<>();
            Set<String> vistos = new HashSet<>();
            for (Row row : sheet) {
                if (row.getRowNum() == 0) {
                    continue; // encabezados
                }
                String codigo = normalizarCodigo(texto(row.getCell(1)));
                String nombre = texto(row.getCell(2));
                if (codigo == null || nombre == null || !vistos.add(codigo)) {
                    continue;
                }
                CatalogoCie10 cie = new CatalogoCie10();
                cie.setCodigoCie(codigo);
                cie.setNombreEnfermedad(nombre.length() > 255 ? nombre.substring(0, 255) : nombre);
                lote.add(cie);
            }
            catalogoCie10Repository.saveAll(lote);
            log.info("Catálogo CIE-10 importado: {} códigos", lote.size());
        } catch (Exception e) {
            // El catálogo es auxiliar: la aplicación arranca igual y se reintenta en el próximo arranque.
            log.error("No se pudo importar {}", file.getAbsolutePath(), e);
        }
    }

    /**
     * Los códigos CIE-10 son ASCII. El Excel trae erratas como "À69.8", que MySQL (sin
     * distinguir acentos) toma por el mismo "A69.8" y rechaza como duplicado.
     */
    static String normalizarCodigo(String codigo) {
        if (codigo == null) {
            return null;
        }
        return java.text.Normalizer.normalize(codigo, java.text.Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "").toUpperCase(java.util.Locale.ROOT);
    }

    private static String texto(Cell cell) {
        if (cell == null) {
            return null;
        }
        String valor = switch (cell.getCellType()) {
            case STRING -> cell.getStringCellValue();
            case NUMERIC -> String.valueOf((long) cell.getNumericCellValue());
            default -> null;
        };
        return valor == null || valor.isBlank() ? null : valor.trim();
    }
}
