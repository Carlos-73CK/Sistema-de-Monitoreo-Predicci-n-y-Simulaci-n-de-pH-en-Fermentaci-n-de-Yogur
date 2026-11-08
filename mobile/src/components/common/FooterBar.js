import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Linking,
} from 'react-native';

/**
 * Componente Institucional de Pie de Página (Footer ULEAM)
 * Diseñado conforme a la identidad visual de la Universidad Laica Eloy Alfaro de Manabí (ULEAM)
 * Ancho completo (100% estirado de izquierda a derecha), diseño horizontal en 3 columnas.
 */
export default function FooterBar() {
  const handleOpenLink = (url) => {
    Linking.openURL(url).catch(() => {});
  };

  return (
    <View style={styles.footerContainer}>
      {/* CUERPO PRINCIPAL DEL FOOTER (COLOR CARBÓN OSCURO - 3 COLUMNAS HORIZONTALES) */}
      <View style={styles.mainSection}>
        
        {/* COLUMNA 1: IDENTIDAD INSTITUCIONAL ULEAM */}
        <View style={styles.columnLeft}>
          <View style={styles.brandRow}>
            <View style={styles.sealBadge}>
              <Text style={styles.sealText}>U</Text>
            </View>
            <View style={styles.brandTextContainer}>
              <Text style={styles.brandTitle}>Uleam</Text>
              <Text style={styles.brandSubtitle}>UNIVERSIDAD LAICA</Text>
              <Text style={styles.brandSubtitle}>ELOY ALFARO DE MANABÍ</Text>
            </View>
          </View>
          <Text style={styles.facultyText}>
            Facultad de Ciencias de la Vida y Tecnologías
          </Text>
          <Text style={styles.subFacultyText}>
            Maestría en Alimentos & Laboratorio de Bromatología
          </Text>
          <View style={styles.tagBadge}>
            <Text style={styles.tagBadgeText}>🔬 Cátedra de Química de Alimentos</Text>
          </View>
        </View>

        {/* COLUMNA 2: EQUIPO DE DESARROLLO (ESTUDIANTES & DIRECCIÓN) */}
        <View style={styles.columnCenter}>
          <Text style={styles.columnHeaderRed}>Equipo de Desarrollo</Text>
          <Text style={styles.teamDescription}>
            Plataforma desarrollada como proyecto de titulación e investigación tecnológica:
          </Text>

          <View style={styles.membersList}>
            <View style={styles.memberItem}>
              <Text style={styles.memberBullet}>•</Text>
              <View>
                <Text style={styles.memberName}>Carlos Delgado</Text>
                <Text style={styles.memberRole}>Director de Proyecto / Desarrollo Móvil & Universal</Text>
              </View>
            </View>

            <View style={styles.memberItem}>
              <Text style={styles.memberBullet}>•</Text>
              <View>
                <Text style={styles.memberName}>Alex Patiño</Text>
                <Text style={styles.memberRole}>Base de Datos (PostgreSQL & SQLite)</Text>
              </View>
            </View>

            <View style={styles.memberItem}>
              <Text style={styles.memberBullet}>•</Text>
              <View>
                <Text style={styles.memberName}>Juan Murillo</Text>
                <Text style={styles.memberRole}>Arquitectura Backend (Node.js & Express)</Text>
              </View>
            </View>

            <View style={styles.memberItem}>
              <Text style={styles.memberBullet}>•</Text>
              <View>
                <Text style={styles.memberName}>Jordan Meza</Text>
                <Text style={styles.memberRole}>API REST & Servicios Bioestadísticos</Text>
              </View>
            </View>

            <View style={styles.memberItem}>
              <Text style={styles.memberBullet}>•</Text>
              <View>
                <Text style={styles.memberName}>Ginger Pérez</Text>
                <Text style={styles.memberRole}>Frontend & Visualización de Datos Cinéticos</Text>
              </View>
            </View>
          </View>

          <View style={styles.advisorBox}>
            <Text style={styles.advisorLabel}>Dirección Científica y Metodológica:</Text>
            <Text style={styles.advisorName}>Dr. Stalin Gustavo Santacruz Terán</Text>
            <Text style={styles.advisorSub}>Docente Investigador ULEAM</Text>
          </View>
        </View>

        {/* COLUMNA 3: CONTACTA Y SÍGUENOS */}
        <View style={styles.columnRight}>
          <Text style={styles.columnHeaderRed}>Contacta</Text>
          <Text style={styles.contactItemText}>📍 Av. Circunvalación Vía a San Mateo</Text>
          <Text style={styles.contactItemText}>🏢 Campus Matriz Manta - Manabí - Ecuador</Text>
          
          <Pressable
            onPress={() => handleOpenLink('mailto:e1312274663@live.uleam.edu.ec')}
            style={styles.emailRow}
          >
            <Text style={styles.emailIcon}>✉</Text>
            <Text style={styles.emailText}>Correo: e1312274663@live.uleam.edu.ec</Text>
          </Pressable>
          <Text style={styles.supportText}>Soporte DIIT: incidencias.diit@uleam.edu.ec</Text>

          <Text style={[styles.columnHeaderRed, { marginTop: 18 }]}>Síguenos</Text>
          <View style={styles.socialRow}>
            <Pressable
              style={[styles.socialButton, styles.fbBg]}
              onPress={() => handleOpenLink('https://www.facebook.com/UleamEcuador/')}
            >
              <Text style={styles.socialButtonText}>f</Text>
            </Pressable>

            <Pressable
              style={[styles.socialButton, styles.twBg]}
              onPress={() => handleOpenLink('https://twitter.com/UleamEcuador')}
            >
              <Text style={styles.socialButtonText}>t</Text>
            </Pressable>

            <Pressable
              style={[styles.socialButton, styles.webBg]}
              onPress={() => handleOpenLink('https://www.uleam.edu.ec')}
            >
              <Text style={styles.socialButtonText}>🌐</Text>
            </Pressable>
          </View>
        </View>

      </View>

      {/* BARRA INFERIOR DE COPYRIGHT (NEGRO COMPLETO) */}
      <View style={styles.copyrightBar}>
        <View style={styles.copyrightContent}>
          <Text style={styles.copyrightText}>
            Copyright © 2026, Todos los derechos reservados <Text style={styles.copyrightHighlight}>Uleam</Text> | Plataforma implementada por el Equipo de Titulación & Cátedra de Alimentos
          </Text>
          <View style={styles.helpButton}>
            <Text style={styles.helpButtonText}>?</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  footerContainer: {
    backgroundColor: '#1E232A',
    width: '100%',
    marginTop: 48,
    borderTopWidth: 4,
    borderTopColor: '#DC2626', // Rojo institucional ULEAM
  },
  mainSection: {
    paddingVertical: 36,
    paddingHorizontal: 32,
    maxWidth: 1320,
    alignSelf: 'center',
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 32,
  },
  columnLeft: {
    flex: 1,
    minWidth: 260,
    maxWidth: 380,
  },
  columnCenter: {
    flex: 1.4,
    minWidth: 290,
    maxWidth: 480,
  },
  columnRight: {
    flex: 1,
    minWidth: 250,
    maxWidth: 340,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sealBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#DC2626',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  sealText: {
    fontSize: 26,
    fontWeight: '900',
    color: '#1E3A8A',
  },
  brandTextContainer: {
    flexDirection: 'column',
  },
  brandTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  brandSubtitle: {
    fontSize: 9,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 0.8,
  },
  facultyText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#E2E8F0',
    marginTop: 8,
    marginBottom: 4,
  },
  subFacultyText: {
    fontSize: 11,
    color: '#94A3B8',
    marginBottom: 12,
  },
  tagBadge: {
    backgroundColor: '#0F172A',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    borderLeftWidth: 3,
    borderLeftColor: '#38BDF8',
    alignSelf: 'flex-start',
  },
  tagBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#38BDF8',
  },
  columnHeaderRed: {
    fontSize: 18,
    fontWeight: '800',
    color: '#EF4444', // Rojo ULEAM vibrante
    marginBottom: 12,
    letterSpacing: 0.3,
  },
  teamDescription: {
    fontSize: 12,
    color: '#CBD5E1',
    marginBottom: 12,
    lineHeight: 18,
  },
  membersList: {
    gap: 8,
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  memberBullet: {
    color: '#EF4444',
    fontSize: 16,
    lineHeight: 18,
    marginRight: 8,
  },
  memberName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  memberRole: {
    fontSize: 11,
    color: '#94A3B8',
  },
  advisorBox: {
    marginTop: 14,
    padding: 10,
    backgroundColor: '#111827',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#10B981',
  },
  advisorLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#A7F3D0',
    textTransform: 'uppercase',
  },
  advisorName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 2,
  },
  advisorSub: {
    fontSize: 10,
    color: '#94A3B8',
  },
  contactItemText: {
    fontSize: 12,
    color: '#CBD5E1',
    marginBottom: 6,
    lineHeight: 18,
  },
  emailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  emailIcon: {
    fontSize: 14,
    color: '#EF4444',
    marginRight: 6,
  },
  emailText: {
    fontSize: 12,
    color: '#60A5FA',
    textDecorationLine: 'underline',
  },
  supportText: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 2,
  },
  socialRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  socialButton: {
    width: 38,
    height: 38,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fbBg: {
    backgroundColor: '#3B5998',
  },
  twBg: {
    backgroundColor: '#0284C7',
  },
  webBg: {
    backgroundColor: '#059669',
  },
  socialButtonText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 18,
  },
  copyrightBar: {
    backgroundColor: '#0F1115',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderTopWidth: 1,
    borderTopColor: '#262C36',
    width: '100%',
  },
  copyrightContent: {
    maxWidth: 1320,
    alignSelf: 'center',
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  copyrightText: {
    fontSize: 11,
    color: '#94A3B8',
    flex: 1,
    marginRight: 12,
    lineHeight: 16,
  },
  copyrightHighlight: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  helpButton: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
  },
  helpButtonText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 13,
  },
});
