import {
  Document,
  Page,
  View,
  Text,
  Image,
  StyleSheet,
} from '@react-pdf/renderer';
import { BRANDING } from '../config/branding';
import { getStudentName } from '../utils/studentName';
import { getCaseStatus, getCaseStatusLabel } from '../utils/caseStatus';

const styles = StyleSheet.create({
  page: { padding: 24, fontSize: 10, fontFamily: 'Helvetica' },
  header: {
    marginBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 2,
    borderBottomColor: '#1f2937',
    paddingBottom: 12,
  },
  headerText: { flex: 1 },
  logo: { width: 50, height: 50, objectFit: 'contain' },
  mainTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
    color: '#1f2937',
  },
  subtitle: { fontSize: 10, marginTop: 2, marginBottom: 2, color: '#374151' },
  emissionDate: { fontSize: 9, color: '#6b7280', marginTop: 4 },

  section: { marginBottom: 16 },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#1f2937',
    backgroundColor: '#f3f4f6',
    padding: 6,
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
  },

  infoBox: {
    padding: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 5,
    alignItems: 'flex-start',
  },
  label: {
    width: 140,
    fontSize: 9,
    fontWeight: 'bold',
    color: '#374151',
  },
  value: {
    flex: 1,
    fontSize: 9,
    color: '#1f2937',
  },

  descriptionBox: {
    padding: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    lineHeight: 1.5,
  },

  timelineItem: {
    padding: 12,
    backgroundColor: '#ffffff',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
    marginBottom: 10,
  },
  timelineDate: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 6,
  },
  timelineMeta: {
    fontSize: 8,
    color: '#6b7280',
    marginBottom: 2,
  },
  timelineDescription: {
    fontSize: 9,
    color: '#374151',
    lineHeight: 1.4,
    marginTop: 4,
  },
  evidenceList: {
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  evidenceItem: {
    fontSize: 8,
    color: '#6b7280',
    marginBottom: 2,
  },

  closureBox: {
    padding: 14,
    backgroundColor: '#ecfdf5',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#10b981',
    borderLeftWidth: 4,
    borderLeftColor: '#10b981',
    lineHeight: 1.5,
  },
  closureTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#065f46',
    marginBottom: 6,
  },
  closureText: {
    fontSize: 9,
    color: '#047857',
    marginBottom: 3,
  },

  signatureRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 32,
    gap: 24,
  },
  signatureBox: {
    flex: 1,
    alignItems: 'center',
  },
  signatureLine: {
    width: '100%',
    borderTopWidth: 1,
    borderTopColor: '#374151',
    paddingTop: 8,
    textAlign: 'center',
    fontSize: 9,
    color: '#6b7280',
  },

  footer: {
    marginTop: 24,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  footerText: {
    fontSize: 8,
    color: '#9ca3af',
    textAlign: 'center',
  },
});

function formatDate(value) {
  if (!value) return '—';
  const d = new Date(value);
  if (isNaN(d.getTime())) return value;
  return d.toLocaleDateString('es-CL');
}

function getCaseNumberOrShortId(caso) {
  const caseNumber = caso?.legacy_case_number;
  if (caseNumber) return caseNumber;
  const uuid = caso?.id || '';
  return uuid.slice(-8) || 'N/A';
}

export default function InformeCasoDocument({ caso, seguimientos = [] }) {
  // Ordenar seguimientos por fecha (descendente: primero -> último)
  const seguimientosOrdenados = [...seguimientos].sort((a, b) => {
    const dateA = a.action_date || a.created_at || '';
    const dateB = b.action_date || b.created_at || '';
    return new Date(dateA).getTime() - new Date(dateB).getTime();
  });

  const esCerrado = getCaseStatus(caso, '') === 'cerrado';
  // Preferir cierre formal de debido proceso si existe
  const fechaCierre = caso?.due_process_closed_at || caso?.closed_at;

  const rutEstudiante = caso?.students?.rut || 'N/A';

  const medidaFinal = caso?.final_disciplinary_measure || null;
  const resolucionFinal = caso?.final_resolution_text || null;
  const cierrePor = caso?.closed_by_name || caso?.responsible || null;
  const cierrePorRol = caso?.closed_by_role || caso?.responsible_role || null;
  const ultimoSeguimiento =
    seguimientosOrdenados[seguimientosOrdenados.length - 1];

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* ENCABEZADO PRINCIPAL */}
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.mainTitle}>
              INFORME DE GESTIÓN DE CONVIVENCIA ESCOLAR
            </Text>
            <Text style={styles.subtitle}>{BRANDING.schoolName}</Text>
            <Text style={styles.emissionDate}>
              Fecha de emisión del informe: {formatDate(new Date())}
            </Text>
          </View>
          <Image src={BRANDING.logoPdf} style={styles.logo} />
        </View>

        {/* 1. IDENTIFICACIÓN DEL CASO */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. IDENTIFICACIÓN DEL CASO</Text>
          <View style={styles.infoBox}>
            <View style={styles.row}>
              <Text style={styles.label}>ID del Caso:</Text>
              <Text style={styles.value}>{getCaseNumberOrShortId(caso)}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Estudiante:</Text>
              <Text style={styles.value}>
                {getStudentName(caso?.students, 'N/A')}
              </Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>RUT estudiante:</Text>
              <Text style={styles.value}>{rutEstudiante || 'N/A'}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Curso:</Text>
              <Text style={styles.value}>{caso?.course_incident || 'N/A'}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Tipo de falta / Tipificación:</Text>
              <Text style={styles.value}>{caso?.conduct_type || 'N/A'}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Categoría:</Text>
              <Text style={styles.value}>
                {caso?.conduct_category || 'N/A'}
              </Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Fecha del incidente:</Text>
              <Text style={styles.value}>
                {formatDate(caso?.incident_date)}
              </Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Hora del incidente:</Text>
              <Text style={styles.value}>{caso?.incident_time || 'N/A'}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Estado del caso:</Text>
              <Text style={styles.value}>
                {getCaseStatusLabel(caso, 'N/A')}
              </Text>
            </View>
            {fechaCierre && (
              <View style={styles.row}>
                <Text style={styles.label}>Fecha de cierre:</Text>
                <Text style={styles.value}>{formatDate(fechaCierre)}</Text>
              </View>
            )}
          </View>
        </View>

        {/* 2. DESCRIPCIÓN DEL HECHO */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. DESCRIPCIÓN DEL HECHO</Text>
          <View style={styles.descriptionBox}>
            <Text>
              {caso?.short_description || 'Sin descripción registrada.'}
            </Text>
          </View>
        </View>

        {/* 3. LÍNEA DE TIEMPO DE ACTUACIONES */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            3. LÍNEA DE TIEMPO DE ACTUACIONES Y DEBIDO PROCESO
          </Text>
          {seguimientosOrdenados.length === 0 ? (
            <View style={styles.infoBox}>
              <Text style={{ fontSize: 9, color: '#6b7280' }}>
                No se registraron actuaciones para este caso.
              </Text>
            </View>
          ) : (
            seguimientosOrdenados.map((seg, i) => {
              const fecha = seg.action_date || '—';
              const etapa = seg.process_stage || '—';
              const tipo = seg.action_type || 'Actuación';
              const responsable = seg.responsible || '—';
              const descripcion =
                seg.detail || seg.description || 'Sin descripción';
              const plazo = seg.due_date;
              // stage_status eliminado - cada followup representa una acción completada
              const estadoEtapa = 'Completada';

              return (
                <View key={seg.id || i} style={styles.timelineItem}>
                  <Text style={styles.timelineDate}>
                    {formatDate(fecha)} · {tipo}
                  </Text>

                  <Text style={styles.timelineMeta}>
                    Etapa: {etapa} | Responsable: {responsable} | Estado:{' '}
                    {estadoEtapa}
                  </Text>

                  {plazo && (
                    <Text style={styles.timelineMeta}>
                      Plazo: {formatDate(plazo)}
                    </Text>
                  )}

                  <Text style={styles.timelineDescription}>{descripcion}</Text>

                  {/* EVIDENCIAS (si existen) */}
                  {seg.evidence_files && seg.evidence_files.length > 0 && (
                    <View style={styles.evidenceList}>
                      <Text
                        style={{
                          fontSize: 8,
                          fontWeight: 'bold',
                          color: '#6b7280',
                          marginBottom: 3,
                        }}
                      >
                        Evidencias adjuntas:
                      </Text>
                      {seg.evidence_files.map((ev, idx) => (
                        <Text key={idx} style={styles.evidenceItem}>
                          •{' '}
                          {ev.file_name ||
                            ev.storage_path ||
                            'Archivo sin nombre'}
                        </Text>
                      ))}
                    </View>
                  )}
                </View>
              );
            })
          )}
        </View>

        {/* 4. CIERRE DEL CASO (solo si está cerrado) */}
        {esCerrado && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>4. CIERRE DEL CASO</Text>
            <View style={styles.closureBox}>
              <Text style={styles.closureTitle}>Cierre formal del caso</Text>
              <Text style={styles.closureText}>
                Fecha de cierre: {formatDate(fechaCierre)}
              </Text>
              {cierrePor && (
                <Text style={styles.closureText}>
                  Responsable del cierre: {cierrePor}
                  {cierrePorRol ? ` (${cierrePorRol})` : ''}
                </Text>
              )}
              {medidaFinal && (
                <Text style={styles.closureText}>
                  Medida disciplinaria final: {medidaFinal}
                </Text>
              )}
              {resolucionFinal && (
                <Text style={[styles.closureText, { marginTop: 4 }]}>
                  Descripción final: {resolucionFinal}
                </Text>
              )}
              {ultimoSeguimiento && (
                <>
                  <Text style={styles.closureText}>
                    Última actuación:{' '}
                    {ultimoSeguimiento.action_type || 'Cierre del caso'}
                  </Text>
                  <Text style={styles.closureText}>
                    {ultimoSeguimiento.detail ||
                      ultimoSeguimiento.description ||
                      ''}
                  </Text>
                </>
              )}
              <Text style={{ fontSize: 9, color: '#047857', marginTop: 6 }}>
                El caso fue cerrado conforme al debido proceso establecido en el
                reglamento interno de convivencia escolar.
              </Text>
            </View>
          </View>
        )}

        {/* FIRMAS */}
        <View style={styles.signatureRow}>
          <View style={styles.signatureBox}>
            <Text style={styles.signatureLine}>Dirección</Text>
          </View>
          <View style={styles.signatureBox}>
            <Text style={styles.signatureLine}>
              Encargado(a) de Convivencia Escolar
            </Text>
          </View>
        </View>

        {/* FOOTER */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Informe generado automáticamente por el Sistema de Convivencia
            Escolar · Documento con valor de respaldo ante fiscalización
          </Text>
        </View>
      </Page>
    </Document>
  );
}
