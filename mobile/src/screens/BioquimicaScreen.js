import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
} from 'react-native';
import theme from '../styles/theme';

export default function BioquimicaScreen() {
  const [selectedItem, setSelectedItem] = useState(3); // Por defecto: Yogur (Corte 4.50)

  const phScaleItems = [
    {
      id: 0,
      nombre: '🍋 Limón / Maracuyá',
      ph: 'pH 2.5 – 3.0',
      color: '#DC2626',
      bg: '#FEE2E2',
      tipo: 'Ácido Fuerte',
      desc: 'Ácidos orgánicos puros (cítrico y málico). Muy ácido para el consumo bacteriano láctico sin dilución.',
    },
    {
      id: 1,
      nombre: '🥤 Gaseosa / Vinagre',
      ph: 'pH 3.0 – 3.5',
      color: '#EA580C',
      bg: '#FFEDD5',
      tipo: 'Ácido',
      desc: 'Ácido fosfórico o ácido acético. Desnaturaliza de golpe cualquier caseína.',
    },
    {
      id: 2,
      nombre: '🍅 Tomate / Frutas',
      ph: 'pH 4.0 – 4.3',
      color: '#D97706',
      bg: '#FEF3C7',
      tipo: 'Ácido Moderado',
      desc: 'Zona de sobre-acidificación en lácteos. Provoca expulsión indeseada de suero (sinéresis).',
    },
    {
      id: 3,
      nombre: '🎯 Yogur Chivería (Corte)',
      ph: 'pH 4.50',
      color: '#15803D',
      bg: '#DCFCE7',
      tipo: '⭐ CORTE ÓPTIMO CONSTANTE',
      desc: 'Punto crítico constante indicado por el Dr. Stalin Santacruz. Reticulación tridimensional óptima de caseínas y máxima firmeza de gel (2639 mPa·s).',
      destacado: true,
    },
    {
      id: 4,
      nombre: '☕ Café / Cerveza',
      ph: 'pH 5.0 – 5.5',
      color: '#65A30D',
      bg: '#ECFCCB',
      tipo: 'Ligeramente Ácido',
      desc: 'Fase de transición en la fermentación láctea. El inóculo consume azúcares rápidamente.',
    },
    {
      id: 5,
      nombre: '🐄 Leche Fresca de Vaca',
      ph: 'pH 6.60 – 6.80',
      color: '#0284C7',
      bg: '#E0F2FE',
      tipo: 'Basal Lácteo',
      desc: 'pH inicial de la leche cruda pasteurizada. Las micelas de kappa-caseína se repelen electrostáticamente.',
    },
    {
      id: 6,
      nombre: '💧 Agua Pura Neutra',
      ph: 'pH 7.00',
      color: '#475569',
      bg: '#F1F5F9',
      tipo: 'Neutro',
      desc: 'Equilibrio exacto de protones e hidroxilos [H⁺] = [OH⁻].',
    },
    {
      id: 7,
      nombre: '🧼 Jabón / Bicarbonato',
      ph: 'pH 9.0 – 10.0',
      color: '#7C3AED',
      bg: '#EDE9FE',
      tipo: 'Alcalino',
      desc: 'Soluciones básicas. Rompen grasas y saponifican lípidos.',
    },
    {
      id: 8,
      nombre: '🧪 Lejía / Lavandina',
      ph: 'pH 12.0 – 13.0',
      color: '#9333EA',
      bg: '#F3E8FF',
      tipo: 'Alcalino Fuerte',
      desc: 'Agentes desinfectantes de laboratorio para mesas y pipetas.',
    },
  ];

  const itemActivo = phScaleItems[selectedItem] || phScaleItems[3];

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.eyebrow}>Facultad de Ciencias de la Vida — ULEAM</Text>
        <Text style={styles.title}>Bioquímica & Escala de pH</Text>
        <Text style={styles.subtitle}>
          Fundamentos biofísicos y metabólicos de la fermentación láctea explicados por el Dr. Stalin Santacruz Terán en cátedra.
        </Text>
      </View>

      {/* Tarjeta de las 3 Etapas Bioquímicas */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>🔬 Las 3 Etapas Bioquímicas de la Fermentación</Text>
        <Text style={styles.cardSubtitle}>
          Metabolismo de bacterias de Chivería (<em>Lactobacillus bulgaricus</em> y <em>Streptococcus thermophilus</em>):
        </Text>

        <View style={styles.etapasList}>
          {/* Etapa 1 */}
          <View style={[styles.etapaBox, { borderLeftColor: '#0284C7' }]}>
            <Text style={[styles.etapaTitle, { color: '#0369A1' }]}>
              1. Hidrólisis de Carbohidratos (Disacáridos)
            </Text>
            <Text style={styles.etapaTexto}>
              Las bacterias hidrolizan enzimáticamente los azúcares del medio para obtener energía:
            </Text>
            <View style={styles.codeBlock}>
              <Text style={styles.codeText}>🐄 Leche de Vaca: Lactosa ➔ Glucosa + Galactosa</Text>
              <Text style={styles.codeText}>🌱 Leche Vegetal (Chocho/Coco): Sacarosa ➔ Glucosa + Fructosa</Text>
            </View>
            <Text style={styles.etapaNota}>
              💡 Audio 2 Dr. Santacruz: Si se formula con Glucosa directa en leche vegetal, se omite el paso enzimático previo, acelerando la cinética un ~5%.
            </Text>
          </View>

          {/* Etapa 2 */}
          <View style={[styles.etapaBox, { borderLeftColor: '#059669' }]}>
            <Text style={[styles.etapaTitle, { color: '#047857' }]}>
              2. Cascada Glucolítica & Producción de Ácido Láctico
            </Text>
            <Text style={styles.etapaTexto}>
              La glucosa intracelular ingresa a la vía Embden-Meyerhof-Parnas y la enzima lactato deshidrogenasa (LDH) genera ácido láctico:
            </Text>
            <View style={[styles.codeBlock, { backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' }]}>
              <Text style={[styles.codeText, { color: '#15803D' }]}>
                Glucosa ➔ 2 Piruvato ➔ 2 Ácido Láctico + 2 H⁺
              </Text>
            </View>
            <Text style={styles.etapaNota}>
              La liberación continua de protones [H⁺] disminuye gradualmente el pH de 6.60 hacia el corte.
            </Text>
          </View>

          {/* Etapa 3 */}
          <View style={[styles.etapaBox, { borderLeftColor: '#DC2626' }]}>
            <Text style={[styles.etapaTitle, { color: '#B91C1C' }]}>
              3. Punto Isoeléctrico & Coagulación de Caseína (Corte 4.50)
            </Text>
            <Text style={styles.etapaTexto}>
              Al descender la carga negativa de las micelas de caseína, se anula la repulsión electrostática:
            </Text>
            <View style={[styles.codeBlock, { backgroundColor: '#FEF2F2', borderColor: '#FECACA' }]}>
              <Text style={[styles.codeText, { color: '#991B1B' }]}>
                pH 4.60 ➔ Neutralización eléctrica (Punto Isoeléctrico pI)
              </Text>
              <Text style={[styles.codeText, { color: '#991B1B', fontWeight: '800' }]}>
                pH 4.50 ➔ 🎯 CORTE CONSTANTE: Máxima firmeza de gel (2639 mPa·s)
              </Text>
            </View>
            <Text style={styles.etapaNota}>
              ⚠️ Regla Inviolable del Dr. Santacruz: Si se deja descender de 4.50, ocurre sinéresis (el gel se colapsa y expulsa suero ácido).
            </Text>
          </View>
        </View>
      </View>

      {/* Escala Universal de pH Interactiva */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>🧪 Escala Universal de pH y Referencias del Dr. Stalin Santacruz</Text>
        <Text style={styles.cardSubtitle}>
          Toca cualquier sustancia para compararla frente al punto de corte del yogur:
        </Text>

        {/* Barra de Espectro de pH */}
        <View style={styles.spectrumBar}>
          <Text style={styles.spectrumText}>0 ÁCIDO</Text>
          <Text style={[styles.spectrumText, { color: '#FEF08A', fontWeight: '800' }]}>4.50 CORTE</Text>
          <Text style={styles.spectrumText}>7.0 NEUTRO</Text>
          <Text style={styles.spectrumText}>14 ALCALINO</Text>
        </View>

        {/* Grid de Ítems de pH */}
        <View style={styles.phGrid}>
          {phScaleItems.map((item) => {
            const isSelected = selectedItem === item.id;
            return (
              <Pressable
                key={item.id}
                style={[
                  styles.phItemCard,
                  { borderLeftColor: item.color },
                  isSelected && { backgroundColor: item.bg, borderColor: item.color, borderWidth: 1.5 },
                ]}
                onPress={() => setSelectedItem(item.id)}
              >
                <View style={styles.phItemHeader}>
                  <Text style={[styles.phItemName, isSelected && { color: item.color, fontWeight: '800' }]}>
                    {item.nombre}
                  </Text>
                  <Text style={[styles.phItemBadge, { color: item.color, backgroundColor: item.bg }]}>
                    {item.ph}
                  </Text>
                </View>
                <Text style={styles.phItemTipo}>{item.tipo}</Text>
              </Pressable>
            );
          })}
        </View>

        {/* Ficha Detallada del Elemento Seleccionado */}
        <View style={[styles.detailCard, { borderLeftColor: itemActivo.color, backgroundColor: itemActivo.bg }]}>
          <Text style={[styles.detailTitle, { color: itemActivo.color }]}>
            {itemActivo.nombre} ({itemActivo.ph})
          </Text>
          <Text style={styles.detailDesc}>{itemActivo.desc}</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.xxl,
    maxWidth: 960,
    width: '100%',
    alignSelf: 'center',
  },
  header: {
    marginBottom: theme.spacing.lg,
  },
  eyebrow: {
    ...theme.typography.caption,
    color: theme.colors.primary,
    textTransform: 'uppercase',
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  title: {
    ...theme.typography.title,
    color: theme.colors.text,
    fontSize: 26,
    fontWeight: '800',
  },
  subtitle: {
    ...theme.typography.body,
    color: theme.colors.textMuted,
    marginTop: 2,
    lineHeight: 18,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radii.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.lg,
    ...theme.shadows.card,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 12,
    color: theme.colors.textMuted,
    marginBottom: 14,
    lineHeight: 16,
  },
  etapasList: {
    gap: 12,
  },
  etapaBox: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderLeftWidth: 4,
    borderRadius: 8,
    padding: 12,
  },
  etapaTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    marginBottom: 4,
  },
  etapaTexto: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 17,
  },
  codeBlock: {
    backgroundColor: '#F0F9FF',
    borderColor: '#BAE6FD',
    borderWidth: 1,
    borderRadius: 6,
    padding: 8,
    marginVertical: 6,
    gap: 2,
  },
  codeText: {
    fontFamily: 'monospace',
    fontSize: 11,
    color: '#0369A1',
    fontWeight: '600',
  },
  etapaNota: {
    fontSize: 11,
    color: '#64748B',
    fontStyle: 'italic',
    marginTop: 2,
  },
  spectrumBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#0F172A',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 14,
  },
  spectrumText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  phGrid: {
    gap: 8,
    marginBottom: 14,
  },
  phItemCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderLeftWidth: 4,
    borderRadius: 8,
    padding: 10,
  },
  phItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  phItemName: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#0F172A',
  },
  phItemBadge: {
    fontSize: 10.5,
    fontWeight: '800',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  phItemTipo: {
    fontSize: 10.5,
    color: '#64748B',
    marginTop: 2,
  },
  detailCard: {
    borderLeftWidth: 4,
    borderRadius: 8,
    padding: 12,
    marginTop: 4,
  },
  detailTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    marginBottom: 4,
  },
  detailDesc: {
    fontSize: 12,
    color: '#334155',
    lineHeight: 17,
  },
});
