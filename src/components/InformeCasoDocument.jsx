import React from 'react'
import {
  Document,
  Page,
  View,
  Text,
  Image,
  StyleSheet,
} from '@react-pdf/renderer'
import logoColegio from '../assets/generic_logo.png'

const TIPOS_COLORS = {
  'Leve': '#10b981',
  'Grave': '#eab308',
  'Muy Grave': '#8b5cf6',
  'Gravísima': '#ef4444',
}

const styles = StyleSheet.create({
  page: { padding: 24, fontSize: 10, fontFamily: 'Helvetica' },
  header: {
    marginBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 2,
    borderBottomColor: '#1f2937',
    paddingBottom: 12
  },
  headerText: { flex: 1 },
  logo: { width: 50, height: 50, objectFit: 'contain' },
  mainTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 2, color: '#1f2937' },
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
    borderLeftColor: '#3b82f6'
  },

  infoBox: {
    padding: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginBottom: 8
  },
  row: {
    flexDirection: 'row',
    marginBottom: 5,
    alignItems: 'flex-start'
  },
  label: {
    width: 140,
    fontSize: 9,
    fontWeight: 'bold',
    color: '#374151'
  },
  value: {
    flex: 1,
    fontSize: 9,
    color: '#1f2937'
  },

  descriptionBox: {
    padding: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    lineHeight: 1.5
  },

  timelineItem: {
    padding: 12,
    backgroundColor: '#ffffff',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
    marginBottom: 10
  },
  timelineDate: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 6
  },
  timelineMeta: {
    fontSize: 8,
    color: '#6b7280',
    marginBottom: 2
  },
  timelineDescription: {
    fontSize: 9,
    color: '#374151',
    lineHeight: 1.4,
    marginTop: 4
  },
  evidenceList: {
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb'
  },
  evidenceItem: {
    fontSize: 8,
    color: '#6b7280',
    marginBottom: 2
  },

  closureBox: {
    padding: 14,
    backgroundColor: '#ecfdf5',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#10b981',
    borderLeftWidth: 4,
    borderLeftColor: '#10b981',
    lineHeight: 1.5
  },
  closureTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#065f46',
    marginBottom: 6
  },
  closureText: {
    fontSize: 9,
    color: '#047857',
    marginBottom: 3
  },

  signatureRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 32,
    gap: 24
  },
  signatureBox: {
    flex: 1,
    alignItems: 'center'
  },
  signatureLine: {
    width: '100%',
    borderTopWidth: 1,
    borderTopColor: '#374151',
    paddingTop: 8,
    textAlign: 'center',
    fontSize: 9,
    color: '#6b7280'
  },

  footer: {
    marginTop: 24,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb'
  },
  footerText: {
    fontSize: 8,
    color: '#9ca3af',
    textAlign: 'center'
  }
})

function formatDate(value) {
  if (!value) return '—'
  const d = new Date(value)
  if (isNaN(d.getTime())) return value
  return d.toLocaleDateString('es-CL')
}

function getLegacyOrShortId(caso) {
  const legacy = caso?._supabaseData?.legacy_case_number
  if (legacy) return legacy
  const uuid = caso?.id || ''
  return uuid.slice(-8) || 'N/A'
}

export default function InformeCasoDocument({ caso, seguimientos = [] }) {
  // Ordenar seguimientos por fecha
  const seguimientosOrdenados = [...seguimientos].sort((a, b) => {
    const dateA = a.fields?.Fecha_Seguimiento || a.fields?.Fecha || a._supabaseData?.action_date || a._supabaseData?.created_at || ''
    const dateB = b.fields?.Fecha_Seguimiento || b.fields?.Fecha || b._supabaseData?.action_date || b._supabaseData?.created_at || ''
    return new Date(dateA) - new Date(dateB)
  })

  const esCerrado = caso?.fields?.Estado === 'Cerrado'
  const fechaCierre = caso?.fields?.Fecha_Cierre
  const ultimoSeguimiento = seguimientosOrdenados[seguimientosOrdenados.length - 1]

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* ENCABEZADO PRINCIPAL */}
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.mainTitle}>INFORME DE GESTIÓN DE CONVIVENCIA ESCOLAR</Text>
            <Text style={styles.subtitle}>Colegio de Prueba</Text>
            <Text style={styles.emissionDate}>Fecha de emisión del informe: {formatDate(new Date())}</Text>
          </View>
          <Image src={logoColegio} style={styles.logo} />
        </View>

        {/* 1. IDENTIFICACIÓN DEL CASO */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. IDENTIFICACIÓN DEL CASO</Text>
          <View style={styles.infoBox}>
            <View style={styles.row}>
              <Text style={styles.label}>ID del Caso:</Text>
              <Text style={styles.value}>{getLegacyOrShortId(caso)}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Estudiante:</Text>
              <Text style={styles.value}>{caso?.fields?.Estudiante_Responsable || 'N/A'}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Curso:</Text>
              <Text style={styles.value}>{caso?.fields?.Curso_Incidente || 'N/A'}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Tipo de falta / Tipificación:</Text>
              <Text style={styles.value}>{caso?.fields?.Tipificacion_Conducta || 'N/A'}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Categoría:</Text>
              <Text style={styles.value}>{caso?.fields?.Categoria || 'N/A'}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Fecha del incidente:</Text>
              <Text style={styles.value}>{formatDate(caso?.fields?.Fecha_Incidente)}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Hora del incidente:</Text>
              <Text style={styles.value}>{caso?.fields?.Hora_Incidente || 'N/A'}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Estado del caso:</Text>
              <Text style={styles.value}>{caso?.fields?.Estado || 'N/A'}</Text>
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
            <Text>{caso?.fields?.Descripcion || 'Sin descripción registrada.'}</Text>
          </View>
        </View>

        {/* 3. LÍNEA DE TIEMPO DE ACTUACIONES */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. LÍNEA DE TIEMPO DE ACTUACIONES Y DEBIDO PROCESO</Text>
          {seguimientosOrdenados.length === 0 ? (
            <View style={styles.infoBox}>
              <Text style={{ fontSize: 9, color: '#6b7280' }}>No se registraron actuaciones para este caso.</Text>
            </View>
          ) : (
            seguimientosOrdenados.map((seg, i) => {
              const fecha = seg.fields?.Fecha_Seguimiento || seg.fields?.Fecha || '—'
              const etapa = seg.fields?.Etapa_Debido_Proceso || '—'
              const tipo = seg.fields?.Tipo_Accion || 'Actuación'
              const responsable = seg.fields?.Responsable || '—'
              const descripcion = seg.fields?.Detalle || seg.fields?.Descripcion || 'Sin descripción'
              const plazo = seg.fields?.Fecha_Plazo
              const estadoEtapa = seg.fields?.Estado_Etapa || '—'

              return (
                <View key={seg.id || i} style={styles.timelineItem}>
                  <Text style={styles.timelineDate}>
                    {formatDate(fecha)} · {tipo}
                  </Text>

                  <Text style={styles.timelineMeta}>
                    Etapa: {etapa} | Responsable: {responsable} | Estado: {estadoEtapa}
                  </Text>

                  {plazo && (
                    <Text style={styles.timelineMeta}>
                      Plazo: {formatDate(plazo)}
                    </Text>
                  )}

                  <Text style={styles.timelineDescription}>
                    {descripcion}
                  </Text>

                  {/* EVIDENCIAS (si existen) */}
                  {seg._evidencias && seg._evidencias.length > 0 && (
                    <View style={styles.evidenceList}>
                      <Text style={{ fontSize: 8, fontWeight: 'bold', color: '#6b7280', marginBottom: 3 }}>
                        Evidencias adjuntas:
                      </Text>
                      {seg._evidencias.map((ev, idx) => (
                        <Text key={idx} style={styles.evidenceItem}>
                          • {ev.file_name || ev.storage_path || 'Archivo sin nombre'}
                        </Text>
                      ))}
                    </View>
                  )}
                </View>
              )
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
              {ultimoSeguimiento && (
                <>
                  <Text style={styles.closureText}>
                    Última actuación: {ultimoSeguimiento.fields?.Tipo_Accion || 'Cierre del caso'}
                  </Text>
                  <Text style={styles.closureText}>
                    {ultimoSeguimiento.fields?.Detalle || ultimoSeguimiento.fields?.Descripcion || ''}
                  </Text>
                </>
              )}
              <Text style={{ fontSize: 9, color: '#047857', marginTop: 6 }}>
                El caso fue cerrado conforme al debido proceso establecido en el reglamento interno de convivencia escolar.
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
            <Text style={styles.signatureLine}>Encargado(a) de Convivencia Escolar</Text>
          </View>
        </View>

        {/* FOOTER */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Informe generado automáticamente por el Sistema de Convivencia Escolar · Documento con valor de respaldo ante fiscalización
          </Text>
        </View>
      </Page>
    </Document>
  )
}
