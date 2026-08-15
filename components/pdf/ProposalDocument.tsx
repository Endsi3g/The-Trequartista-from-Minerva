import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import type { AuditWithFindings } from '@/lib/types';

// Uses react-pdf's built-in Helvetica rather than fetching a webfont at
// request time -- this runs synchronously during proposal generation for
// a real prospect, so reliability wins over an exact Sora/Inter brand
// match. Revisit if real font files get bundled into the repo.
const styles = StyleSheet.create({
  page: { padding: 40, fontFamily: 'Helvetica', fontSize: 10, color: '#1a1f1c' },
  header: { marginBottom: 24, borderBottom: '2 solid #1E4B33', paddingBottom: 12 },
  brand: { fontSize: 18, fontFamily: 'Helvetica-Bold', color: '#1E4B33' },
  tagline: { fontSize: 9, color: '#6b6f63', marginTop: 2 },
  h1: { fontSize: 16, fontFamily: 'Helvetica-Bold', marginTop: 20, marginBottom: 4 },
  h2: { fontSize: 12, fontFamily: 'Helvetica-Bold', marginTop: 16, marginBottom: 8, color: '#1E4B33' },
  para: { fontSize: 10, lineHeight: 1.5, marginBottom: 6 },
  quote: { fontSize: 9, fontStyle: 'italic', color: '#6b6f63', marginBottom: 4, paddingLeft: 8, borderLeft: '2 solid #dfff5f' },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottom: '0.5 solid #e5e3da' },
  rowLabel: { fontSize: 9, color: '#6b6f63' },
  rowValue: { fontSize: 9, fontFamily: 'Helvetica-Bold' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: 10, marginTop: 4 },
  totalLabel: { fontSize: 11, fontFamily: 'Helvetica-Bold' },
  totalValue: { fontSize: 14, fontFamily: 'Helvetica-Bold', color: '#1E4B33' },
  initiative: { marginBottom: 8, padding: 8, backgroundColor: '#f7f6f0' },
  initiativeTitle: { fontSize: 10, fontFamily: 'Helvetica-Bold' },
  badges: { flexDirection: 'row', gap: 6, marginTop: 4 },
  badge: { fontSize: 8, backgroundColor: '#dfff5f', color: '#1a1f1c', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  footer: { position: 'absolute', bottom: 30, left: 40, right: 40, fontSize: 8, color: '#a8ab9f', textAlign: 'center', borderTop: '0.5 solid #e5e3da', paddingTop: 8 },
  cta: { marginTop: 24, padding: 14, backgroundColor: '#1E4B33', color: '#ffffff', textAlign: 'center' },
  ctaText: { fontSize: 11, fontFamily: 'Helvetica-Bold', color: '#ffffff' },
});

export function ProposalDocument({ audit, calendlyLink }: { audit: AuditWithFindings; calendlyLink?: string | null }) {
  const totalAnnualCost = audit.cost_items.reduce((acc, c) => acc + (c.annual_cost_cad || 0), 0);
  const generatedDate = new Date().toLocaleDateString('fr-CA', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <Document title={`Proposition Minerva — ${audit.prospect_name}`}>
      <Page size="LETTER" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.brand}>MINERVA</Text>
          <Text style={styles.tagline}>Proposition d'automatisation IA — {generatedDate}</Text>
        </View>

        <Text style={styles.h1}>Diagnostic pour {audit.prospect_name}</Text>
        <Text style={styles.para}>
          Suite à notre appel de diagnostic, voici un résumé des opportunités identifiées pour {audit.prospect_name}, basé directement sur ce qui a été discuté.
        </Text>

        {audit.process_steps.filter((s) => s.is_bottleneck || s.is_duplicate_entry).length > 0 && (
          <>
            <Text style={styles.h2}>Points de friction identifiés</Text>
            {audit.process_steps.filter((s) => s.is_bottleneck || s.is_duplicate_entry).map((step) => (
              <View key={step.id} style={{ marginBottom: 8 }}>
                <Text style={{ fontSize: 10, fontFamily: 'Helvetica-Bold' }}>{step.title}</Text>
                {step.description && <Text style={styles.para}>{step.description}</Text>}
                {step.source_quote && <Text style={styles.quote}>« {step.source_quote} »</Text>}
              </View>
            ))}
          </>
        )}

        {audit.cost_items.length > 0 && (
          <>
            <Text style={styles.h2}>Coûts cachés estimés</Text>
            {audit.cost_items.map((item) => (
              <View key={item.id} style={styles.row}>
                <Text style={styles.rowLabel}>{item.task_description} ({item.role_name}, {item.hours_wasted_per_week}h/sem)</Text>
                <Text style={styles.rowValue}>{item.annual_cost_cad ? `${item.annual_cost_cad.toLocaleString('fr-CA')} $/an` : 'N/D'}</Text>
              </View>
            ))}
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Coût annuel total estimé</Text>
              <Text style={styles.totalValue}>{totalAnnualCost.toLocaleString('fr-CA')} $</Text>
            </View>
          </>
        )}

        {audit.initiatives.length > 0 && (
          <>
            <Text style={styles.h2}>Initiatives IA recommandées</Text>
            {[...audit.initiatives].sort((a, b) => (b.impact_score - b.effort_score) - (a.impact_score - a.effort_score)).map((init) => (
              <View key={init.id} style={styles.initiative}>
                <Text style={styles.initiativeTitle}>{init.title}</Text>
                {init.description && <Text style={styles.para}>{init.description}</Text>}
                <View style={styles.badges}>
                  <Text style={styles.badge}>Impact {init.impact_score}/10</Text>
                  <Text style={styles.badge}>Effort {init.effort_score}/10</Text>
                </View>
              </View>
            ))}
          </>
        )}

        {calendlyLink && (
          <View style={styles.cta}>
            <Text style={styles.ctaText}>Prêt à passer à l'étape suivante ?</Text>
            <Text style={{ fontSize: 9, color: '#ffffff', marginTop: 4 }}>Réservez votre second appel : {calendlyLink}</Text>
          </View>
        )}

        <Text style={styles.footer} fixed>
          Minerva — Proposition confidentielle préparée pour {audit.prospect_name}
        </Text>
      </Page>
    </Document>
  );
}
