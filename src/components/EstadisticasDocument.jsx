import {
  Document,
  Page,
  View,
  Text,
  Image,
  StyleSheet,
} from '@react-pdf/renderer';
import { BRANDING } from '../config/branding';

const styles = StyleSheet.create({
  page: { padding: 24, fontSize: 10, fontFamily: 'Helvetica' },
  header: {
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 2,
    borderBottomColor: '#e5e7eb',
    paddingBottom: 12,
  },
  headerText: { flex: 1 },
  logo: { width: 50, height: 50, objectFit: 'contain' },
  title: { fontSize: 18, fontWeight: 'bold', marginBottom: 4 },
  subtitle: { fontSize: 10, marginTop: 4, marginBottom: 2, color: '#374151' },
  small: { fontSize: 9, color: '#6b7280' },

  section: { marginBottom: 16 },
  sectionTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#1f2937',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    paddingBottom: 4,
  },

  kpiRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    gap: 8,
  },
  kpiCard: {
    flex: 1,
    padding: 10,
    backgroundColor: '#f9fafb',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  kpiLabel: { fontSize: 9, color: '#6b7280', marginBottom: 4 },
  kpiValue: { fontSize: 16, fontWeight: 'bold', color: '#1f2937' },
  kpiSubtitle: { fontSize: 8, color: '#9ca3af', marginTop: 2 },

  table: { marginTop: 8 },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    padding: 6,
    borderRadius: 4,
    marginBottom: 4,
  },
  tableRow: {
    flexDirection: 'row',
    padding: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  tableCell: { flex: 1, fontSize: 9 },
  tableCellBold: { flex: 1, fontSize: 9, fontWeight: 'bold' },

  filterInfo: {
    fontSize: 9,
    color: '#6b7280',
    marginTop: 4,
    padding: 8,
    backgroundColor: '#f9fafb',
    borderRadius: 4,
  },
});

export default function EstadisticasDocument({
  kpi,
  cumplimientoPlazo,
  fueraDePlazo,
  seguimientosConPlazo,
  reincidencia,
  cargaPorResponsable,
  tiempoPromedioEtapas,
  dataTipo,
  dataCursos,
  filtros,
}) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* ENCABEZADO */}
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.title}>INFORME ESTADÍSTICO</Text>
            <Text style={styles.subtitle}>{BRANDING.schoolName}</Text>
            <Text style={styles.small}>
              Fecha de emisión: {new Date().toLocaleDateString('es-CL')}
            </Text>
          </View>
          <Image src={BRANDING.logoPdf} style={styles.logo} />
        </View>

        {/* FILTROS APLICADOS */}
        <Text style={styles.filterInfo}>
          Período: {filtros.desde} a {filtros.hasta} |
          {filtros.semestre !== 'Todos'
            ? ` Semestre ${filtros.semestre} |`
            : ''}
          {filtros.curso ? ` Curso: ${filtros.curso}` : ' Todos los cursos'}
        </Text>

        {/* KPIs OPERATIVOS */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. Indicadores Operativos</Text>
          <View style={styles.kpiRow}>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>Total de casos</Text>
              <Text style={styles.kpiValue}>{kpi.total}</Text>
            </View>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>Casos abiertos</Text>
              <Text style={styles.kpiValue}>{kpi.abiertos}</Text>
            </View>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>Casos cerrados</Text>
              <Text style={styles.kpiValue}>{kpi.cerrados}</Text>
            </View>
          </View>
          <View style={styles.kpiRow}>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>Tiempo promedio de resolución</Text>
              <Text style={styles.kpiValue}>
                {kpi?.promedio !== null && kpi?.promedio !== undefined
                  ? `${kpi.promedio} días`
                  : 'N/A'}
              </Text>
            </View>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>Cumplimiento de plazos</Text>
              <Text style={styles.kpiValue}>{cumplimientoPlazo || 0}%</Text>
              <Text style={styles.kpiSubtitle}>
                {fueraDePlazo?.length || 0} de{' '}
                {seguimientosConPlazo?.length || 0} fuera de plazo
              </Text>
            </View>
          </View>
        </View>

        {/* CASOS POR TIPIFICACIÓN */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. Casos por Tipificación</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={styles.tableCellBold}>Tipificación</Text>
              <Text style={[styles.tableCellBold, { textAlign: 'right' }]}>
                Cantidad
              </Text>
            </View>
            {(dataTipo || []).slice(0, 10).map((item, index) => (
              <View key={index} style={styles.tableRow}>
                <Text style={styles.tableCell}>{item.name}</Text>
                <Text style={[styles.tableCell, { textAlign: 'right' }]}>
                  {item.value}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* CASOS POR CURSO */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. Casos por Curso (Top 10)</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={styles.tableCellBold}>Curso</Text>
              <Text style={[styles.tableCellBold, { textAlign: 'right' }]}>
                Total
              </Text>
            </View>
            {[...(dataCursos || [])]
              .sort((a, b) => b.total - a.total)
              .slice(0, 10)
              .map((item, index) => (
                <View key={index} style={styles.tableRow}>
                  <Text style={styles.tableCell}>{item.curso}</Text>
                  <Text style={[styles.tableCell, { textAlign: 'right' }]}>
                    {item.total}
                  </Text>
                </View>
              ))}
          </View>
        </View>

        {/* REINCIDENCIA */}
        {(reincidencia || []).length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              4. Estudiantes con Reincidencia
            </Text>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={styles.tableCellBold}>Estudiante</Text>
                <Text style={[styles.tableCellBold, { textAlign: 'right' }]}>
                  Casos
                </Text>
              </View>
              {(reincidencia || []).slice(0, 10).map((item, index) => (
                <View key={index} style={styles.tableRow}>
                  <Text style={styles.tableCell}>{item.estudiante}</Text>
                  <Text style={[styles.tableCell, { textAlign: 'right' }]}>
                    {item.total}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* CARGA POR RESPONSABLE */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            5. Carga de Trabajo por Responsable
          </Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={styles.tableCellBold}>Responsable</Text>
              <Text style={[styles.tableCellBold, { textAlign: 'right' }]}>
                Seguimientos
              </Text>
            </View>
            {(cargaPorResponsable || []).slice(0, 8).map((item, index) => (
              <View key={index} style={styles.tableRow}>
                <Text style={styles.tableCell}>{item.responsable}</Text>
                <Text style={[styles.tableCell, { textAlign: 'right' }]}>
                  {item.total}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* TIEMPO POR ETAPA */}
        {(tiempoPromedioEtapas || []).length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              6. Tiempo Promedio por Etapa
            </Text>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={styles.tableCellBold}>Etapa</Text>
                <Text style={[styles.tableCellBold, { textAlign: 'right' }]}>
                  Días
                </Text>
                <Text style={[styles.tableCellBold, { textAlign: 'right' }]}>
                  Total
                </Text>
              </View>
              {(tiempoPromedioEtapas || []).map((item, index) => (
                <View key={index} style={styles.tableRow}>
                  <Text style={styles.tableCell}>{item.etapa}</Text>
                  <Text style={[styles.tableCell, { textAlign: 'right' }]}>
                    {item.promedio}
                  </Text>
                  <Text style={[styles.tableCell, { textAlign: 'right' }]}>
                    {item.total}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* FOOTER */}
        <View
          style={{
            marginTop: 24,
            paddingTop: 12,
            borderTopWidth: 1,
            borderTopColor: '#e5e7eb',
          }}
        >
          <Text style={{ fontSize: 8, color: '#9ca3af', textAlign: 'center' }}>
            Informe generado automáticamente por el Sistema de Convivencia
            Escolar
          </Text>
        </View>
      </Page>
    </Document>
  );
}
