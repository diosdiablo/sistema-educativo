# Plantillas Personalizadas para Exportación

Este directorio contiene las plantillas de Excel que el sistema usará como base para exportar datos.

## Ubicación
```
public/templates/
```

## Plantillas Disponibles

| Archivo | Uso |
|---------|-----|
| `asistencia.xlsx` | Exportar registro de asistencia |
| `registro_auxiliar.xlsx` | Exportar registro auxiliar de calificaciones |
| `reporte_final.xlsx` | Exportar reporte final oficial |
| `instrumentos.xlsx` | Exportar calificaciones por instrumento |
| `lista_estudiantes.xlsx` | Exportar lista de estudiantes |

## Cómo crear una plantilla

1. **Abre Excel** y crea un nuevo archivo

2. **Configura los encabezados** en la primera fila (o fila 2-3 según el tipo):
   ```
   Estudiante | DNI | Fecha de Nacimiento | ...
   ```

3. **Encabezados requeridos según tipo**:
   
   **Para asistencia:**
   - `Estudiante`
   - `Fecha` (fechas específicas) o el sistema agregará las fechas automáticamente
   
   **Para registro auxiliar:**
   - `Estudiante`
   - Nombres de competencias (ej: "Resuelve problemas de cantidad")
   
   **Para reporte final:**
   - `N°` o `Nro`
   - `Estudiante`
   - Nombres de competencias
   - `Conclusión Descriptiva`
   
   **Para lista de estudiantes:**
   - `N°` o `Nro`
   - `Estudiante`
   - `DNI`
   - `Fecha de Nacimiento`
   - `Nombre del Apoderado`
   - `Teléfono`
   
   **Para instrumentos:**
   - `N°` o `Nro`
   - `Estudiante`
   - `Instrumento`
   - `Actividad`
   - `Puntaje`
   - `Nivel`
   - `Bimestre`

4. **Dale formato** según las necesidades de tu institución (colores, fuentes, bordes, etc.)

5. **Guarda el archivo** en esta carpeta con el nombre correspondiente

## Ejemplo de estructura

```
    A              B              C              D
1  N°           Estudiante      DNI        Fecha Nac.
2  1         Juan Pérez        12345678    01/01/2010
3  2         María García      87654321    15/03/2010
```

## Notas importantes

- El sistema buscará los encabezados para saber dónde colocar cada dato
- Los encabezados son **case-insensitive** (no importa mayúsculas/minúsculas)
- Los datos comienzan a escribirse **desde la fila siguiente** a los encabezados
- Si no existe la plantilla, el sistema generará el formato automáticamente
- Mantén el formato simple para evitar errores

## Soporte

Si tienes dudas sobre el formato de las plantillas, exporta primero un archivo sin plantilla para ver la estructura que genera el sistema.
