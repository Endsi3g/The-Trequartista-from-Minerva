import { calculateInvoiceTotals, TPS_RATE, TVQ_RATE } from '../lib/services/invoicing.js';

console.log('=== TEST UNITAIRE CALCUL DES TAXES QUÉBÉCOISES ===');
const sampleItems = [
  { description: 'Développement Extranet & Portals', quantity: 1, unit_price_cad: 3500 },
  { description: 'Configuration Stripe & Facturation', quantity: 1, unit_price_cad: 1000 },
];

const totals = calculateInvoiceTotals(sampleItems, true);
console.log('Sous-total HT :', totals.subtotal_cad, 'CAD');
console.log('TPS (5%) :', totals.tax_tps_cad, 'CAD');
console.log('TVQ (9.975%) :', totals.tax_tvq_cad, 'CAD');
console.log('Total TTC :', totals.total_cad, 'CAD');

if (totals.subtotal_cad === 4500 && totals.tax_tps_cad === 225 && totals.tax_tvq_cad === 448.88 && totals.total_cad === 5173.88) {
  console.log('✅ TEST REUSSI : Calculs des taxes québécoises et totaux conformes aux centimes près !');
} else {
  console.error('❌ TEST ECHOUE : Valeurs attendues non conformes');
  process.exit(1);
}
