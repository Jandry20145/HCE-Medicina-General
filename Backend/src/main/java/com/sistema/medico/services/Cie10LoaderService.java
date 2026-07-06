package com.sistema.medico.services;

import com.sistema.medico.models.CatalogoCie10;
import com.sistema.medico.repositories.CatalogoCie10Repository;
import org.apache.poi.ss.usermodel.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Service;

import java.io.File;
import java.io.FileInputStream;
import java.util.ArrayList;
import java.util.List;

@Service
public class Cie10LoaderService implements CommandLineRunner {

    @Autowired
    private CatalogoCie10Repository catalogoCie10Repository;

    @Override
    public void run(String... args) throws Exception {
        if (catalogoCie10Repository.count() == 0) {
            System.out.println("Iniciando carga del Catálogo CIE-10...");
            
            // Buscar en el directorio padre o en el actual
            File file = new File("../CIE10.xls");
            if (!file.exists()) {
                file = new File("CIE10.xls");
            }
            
            if (file.exists()) {
                try (FileInputStream fis = new FileInputStream(file);
                     Workbook workbook = WorkbookFactory.create(fis)) {
                    
                    Sheet sheet = workbook.getSheetAt(0);
                    int agregados = 0;
                    
                    for (Row row : sheet) {
                        // Asumiendo que la fila 0 podría ser encabezados, la saltamos si los valores no son códigos
                        if (row.getRowNum() == 0) continue;
                        
                        Cell cellCodigo = row.getCell(1);
                        Cell cellNombre = row.getCell(2);
                        
                        if (cellCodigo != null && cellNombre != null) {
                            String codigo = getCellValueAsString(cellCodigo);
                            String nombre = getCellValueAsString(cellNombre);
                            
                            if (codigo != null && !codigo.trim().isEmpty() && nombre != null && !nombre.trim().isEmpty()) {
                                String cleanCodigo = codigo.trim();
                                
                                CatalogoCie10 cie10 = new CatalogoCie10();
                                cie10.setCodigoCie(cleanCodigo);
                                // Limitar la longitud a 255 si es muy largo
                                cie10.setNombreEnfermedad(nombre.trim().length() > 255 ? nombre.trim().substring(0, 255) : nombre.trim());
                                
                                try {
                                    catalogoCie10Repository.save(cie10);
                                    agregados++;
                                } catch (Exception e) {
                                    // Ignore duplicate or constraint violation
                                }
                            }
                        }
                    }
                    
                    System.out.println("Carga de CIE-10 completada exitosamente. Registros: " + agregados);
                    
                } catch (Exception e) {
                    System.err.println("Error al cargar CIE10.xls: " + e.getMessage());
                    e.printStackTrace();
                }
            } else {
                System.out.println("No se encontró el archivo CIE10.xls para cargar los datos iniciales.");
            }
        } else {
            System.out.println("El catálogo CIE-10 ya contiene datos. Se omite la carga.");
        }
    }
    
    private String getCellValueAsString(Cell cell) {
        if (cell.getCellType() == CellType.STRING) {
            return cell.getStringCellValue();
        } else if (cell.getCellType() == CellType.NUMERIC) {
            return String.valueOf((int) cell.getNumericCellValue());
        }
        return null;
    }
}
