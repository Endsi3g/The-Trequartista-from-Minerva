'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  Utensils,
  ShoppingBag,
  Plus,
  Minus,
  Sparkles,
  Percent,
  CheckCircle2,
  Printer,
  ShieldCheck,
  Zap,
  ArrowRight,
  TrendingUp,
  Share2,
  ExternalLink,
  ChevronRight,
  Clock,
  MapPin,
  Phone,
  Flame,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const MONO: React.CSSProperties = { fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums' };

interface MenuItem {
  id: string;
  name: string;
  category: string;
  description: string;
  price: number;
  popular?: boolean;
  image: string;
}

const SAMPLE_MENU: MenuItem[] = [
  {
    id: 'm1',
    name: 'Pizza Margherita Di Bufala',
    category: 'Pizzas Artisanales',
    description: 'Sauce tomate San Marzano DOP, mozzarella di bufala campana, basilic frais, huile d’olive extra vierge.',
    price: 19.0,
    popular: true,
    image: 'https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 'm2',
    name: 'Tagliatelle al Tartufo & Funghi',
    category: 'Pâtes Fraîches',
    description: 'Pâtes fraîches maison, crème de truffe noire d’Alba, champignons sauvages et parmesan Reggiano 24 mois.',
    price: 24.5,
    popular: true,
    image: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 'm3',
    name: 'Burger Gorgonzola & Oignons Caramélisés',
    category: 'Burgers Gourmets',
    description: 'Bœuf Angus haché minute, crème de gorgonzola dolce, roquette, confit d’oignons au vinaigre balsamique.',
    price: 21.0,
    popular: false,
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 'm4',
    name: 'Carpaccio de Bœuf & Huile de Truffe',
    category: 'Entrées',
    description: 'Fines tranches de filet de bœuf, câpres de Pantelleria, copeaux de parmesan et roquette poivrée.',
    price: 16.5,
    popular: false,
    image: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 'm5',
    name: 'Tiramisù Traditionnel au Mascarpone',
    category: 'Desserts',
    description: 'Biscuits savoiardi imbibés d’espresso italien, crème onctueuse au mascarpone et cacao amer Valrhona.',
    price: 9.5,
    popular: true,
    image: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 'm6',
    name: 'Cannoli Siciliani Croquants',
    category: 'Desserts',
    description: 'Rouleaux de pâte croustillante farcis à la ricotta sucrée, pépites de chocolat noir et pistaches de Bronte.',
    price: 8.0,
    popular: false,
    image: 'https://images.unsplash.com/photo-1551024601-bec78aea704b?w=600&auto=format&fit=crop&q=80',
  },
];

export default function MinervaFlowPage() {
  const searchParams = useSearchParams();
  const restoParam = searchParams.get('resto') || 'Trattoria Bella Napoli';
  const signatureParam = searchParams.get('dish') || 'Pizza Margherita Di Bufala';

  const [cart, setCart] = useState<Record<string, number>>({
    m1: 2,
    m2: 1,
  });

  const [activeCategory, setActiveCategory] = useState('Tous');
  const [testProtocolModalOpen, setTestProtocolModalOpen] = useState(false);
  const [orderSent, setOrderSent] = useState(false);

  const categories = useMemo(() => {
    return ['Tous', 'Pizzas Artisanales', 'Pâtes Fraîches', 'Burgers Gourmets', 'Entrées', 'Desserts'];
  }, []);

  const filteredMenu = useMemo(() => {
    if (activeCategory === 'Tous') return SAMPLE_MENU;
    return SAMPLE_MENU.filter((item) => item.category === activeCategory);
  }, [activeCategory]);

  const handleAddToCart = (id: string) => {
    setCart((prev) => ({ ...prev, [id]: (prev[id] || 0) + 1 }));
  };

  const handleRemoveFromCart = (id: string) => {
    setCart((prev) => {
      const next = { ...prev };
      if (next[id] > 1) {
        next[id] -= 1;
      } else {
        delete next[id];
      }
      return next;
    });
  };

  // Cart Calculations
  const cartSummary = useMemo(() => {
    let subtotal = 0;
    let totalItems = 0;
    Object.entries(cart).forEach(([id, qty]) => {
      const item = SAMPLE_MENU.find((m) => m.id === id);
      if (item) {
        subtotal += item.price * qty;
        totalItems += qty;
      }
    });

    const uberCommission30 = subtotal * 0.3;
    const minervaCommission = 0; // 0%
    const directSavings = uberCommission30;

    return {
      subtotal: subtotal.toFixed(2),
      totalItems,
      uberCommission30: uberCommission30.toFixed(2),
      minervaCommission: minervaCommission.toFixed(2),
      directSavings: directSavings.toFixed(2),
    };
  }, [cart]);

  const handleTriggerTestOrder = () => {
    setOrderSent(true);
    setTimeout(() => {
      setOrderSent(false);
      setTestProtocolModalOpen(false);
    }, 2500);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans antialiased">
      {/* ── 1. Top Bar: Minerva-Flow Brand & Demo Notice ── */}
      <header className="sticky top-0 z-40 bg-zinc-900/90 backdrop-blur-md border-b border-zinc-800 px-4 py-2.5">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 font-semibold text-xs tracking-wider uppercase text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Minerva-Flow</span>
            </div>
            <span className="hidden sm:inline text-zinc-600">|</span>
            <span className="hidden sm:inline text-xs text-zinc-400">
              Démo de Commande Directe & 0 % Commission pour <strong>{restoParam}</strong>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setTestProtocolModalOpen(true)}
              className="h-7 px-2.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-md flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Protocole Test 5-Min</span>
            </button>
            <Link
              href="/academy"
              className="h-7 px-2.5 text-xs font-medium border border-zinc-700 hover:bg-zinc-800 text-zinc-300 rounded-md transition-colors flex items-center gap-1"
            >
              <span>SOP Agence</span>
              <ChevronRight className="w-3 h-3 text-zinc-500" />
            </Link>
          </div>
        </div>
      </header>

      {/* ── 2. Live Savings Hero Ribbon ── */}
      <div className="bg-gradient-to-r from-emerald-950/60 via-zinc-900 to-emerald-950/40 border-b border-emerald-800/40 py-3 px-4">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
              %
            </div>
            <div>
              <span className="font-semibold text-emerald-300">
                Commande Directe Sans Intermédiaire :
              </span>{' '}
              <span className="text-zinc-300">
                0% de frais de plateforme prélevés vs 30% chez Uber Eats ou DoorDash.
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono" style={MONO}>
            <div className="text-zinc-400">
              Sur votre panier actuel :{' '}
              <span className="text-emerald-400 font-bold text-sm">
                +{cartSummary.directSavings} $ conservés
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── 3. Restaurant Header (Hero Banner) ── */}
      <div className="relative bg-zinc-900 border-b border-zinc-800 py-8 px-4">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-2 py-0.5 rounded-full bg-zinc-800 border border-zinc-700 text-[11px] text-zinc-300">
              <MapPin className="w-3 h-3 text-emerald-400" />
              <span>Commande en ligne & Click & Collect direct</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              {restoParam}
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 max-w-xl">
              Cuisine italienne artisanale, pâtes fraîches maison et pizzas cuites au feu de bois. Vos plats préférés préparés à la minute.
            </p>
          </div>

          <div className="flex flex-wrap gap-2 text-xs">
            <div className="px-3 py-2 rounded-lg bg-zinc-950/80 border border-zinc-800 space-y-0.5">
              <div className="text-[10px] uppercase text-zinc-500 font-mono" style={MONO}>
                Délai de préparation
              </div>
              <div className="font-bold text-emerald-400">15 – 25 min</div>
            </div>
            <div className="px-3 py-2 rounded-lg bg-zinc-950/80 border border-zinc-800 space-y-0.5">
              <div className="text-[10px] uppercase text-zinc-500 font-mono" style={MONO}>
                Frais de service
              </div>
              <div className="font-bold text-emerald-400">0.00 $ (0%)</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── 4. Main Menu & Interactive Cart ── */}
      <div className="max-w-6xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Menu Items */}
        <div className="lg:col-span-2 space-y-6">
          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-zinc-800">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={cn(
                  'px-3 py-1.5 rounded-full text-xs font-medium transition-colors whitespace-nowrap cursor-pointer',
                  activeCategory === cat
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
                )}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Menu Items Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filteredMenu.map((item) => {
              const qtyInCart = cart[item.id] || 0;
              return (
                <div
                  key={item.id}
                  className="bg-zinc-900/70 border border-zinc-800/80 rounded-xl overflow-hidden hover:border-zinc-700 transition-all flex flex-col justify-between"
                >
                  <div className="aspect-video w-full relative overflow-hidden bg-zinc-950">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    {item.popular && (
                      <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-amber-500/90 text-zinc-950 font-bold text-[10px] uppercase tracking-wider flex items-center gap-1 shadow-sm">
                        <Flame className="w-3 h-3" />
                        Signature
                      </span>
                    )}
                  </div>

                  <div className="p-4 space-y-2 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-semibold text-sm text-zinc-100">{item.name}</h3>
                        <span className="font-mono font-bold text-sm text-emerald-400" style={MONO}>
                          {item.price.toFixed(2)} $
                        </span>
                      </div>
                      <p className="text-xs text-zinc-400 mt-1 line-clamp-2">{item.description}</p>
                    </div>

                    <div className="pt-3 flex items-center justify-between border-t border-zinc-800/60 mt-3">
                      {qtyInCart > 0 ? (
                        <div className="flex items-center gap-2 bg-zinc-800 rounded-lg p-1">
                          <button
                            onClick={() => handleRemoveFromCart(item.id)}
                            className="w-6 h-6 rounded bg-zinc-700 hover:bg-zinc-600 flex items-center justify-center text-zinc-200 cursor-pointer"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-5 text-center font-mono text-xs font-bold" style={MONO}>
                            {qtyInCart}
                          </span>
                          <button
                            onClick={() => handleAddToCart(item.id)}
                            className="w-6 h-6 rounded bg-emerald-600 hover:bg-emerald-500 flex items-center justify-center text-white cursor-pointer"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleAddToCart(item.id)}
                          className="h-7 px-3 rounded-lg bg-zinc-800 hover:bg-emerald-600 hover:text-white text-zinc-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Ajouter</span>
                        </button>
                      )}

                      <span className="text-[10.5px] text-zinc-500 font-mono" style={MONO}>
                        0 % commission
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Live Direct Cart & Savings Breakdown */}
        <div className="space-y-6">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-4 sticky top-16">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-emerald-400" />
                <h2 className="font-bold text-sm text-white">Votre Panier Direct</h2>
              </div>
              <span className="text-xs font-mono text-zinc-400" style={MONO}>
                {cartSummary.totalItems} article{cartSummary.totalItems > 1 ? 's' : ''}
              </span>
            </div>

            {/* Cart Items List */}
            <div className="space-y-2.5 max-h-60 overflow-y-auto text-xs">
              {Object.entries(cart).map(([id, qty]) => {
                const item = SAMPLE_MENU.find((m) => m.id === id);
                if (!item) return null;
                return (
                  <div key={id} className="flex items-center justify-between gap-2 py-1">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-zinc-200 truncate">{item.name}</div>
                      <div className="text-[11px] text-zinc-500 font-mono" style={MONO}>
                        {qty} × {item.price.toFixed(2)} $
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-semibold text-zinc-200" style={MONO}>
                        {(item.price * qty).toFixed(2)} $
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Comparison Box (Direct vs Delivery Apps) */}
            <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-800/60 space-y-2 text-xs">
              <div className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1.5">
                <Percent className="w-3.5 h-3.5" />
                <span>Comparatif de rentabilité restaurateur :</span>
              </div>

              <div className="space-y-1 text-[11px] font-mono text-zinc-300" style={MONO}>
                <div className="flex justify-between text-rose-400">
                  <span>Commission Uber Eats (30%) :</span>
                  <span>- {cartSummary.uberCommission30} $</span>
                </div>
                <div className="flex justify-between text-emerald-400 font-bold">
                  <span>Commission Minerva-Flow (0%) :</span>
                  <span>0.00 $</span>
                </div>
                <div className="pt-1 border-t border-emerald-800/40 flex justify-between font-bold text-white text-xs">
                  <span>Marge nette conservée :</span>
                  <span className="text-emerald-400">+{cartSummary.directSavings} $</span>
                </div>
              </div>
            </div>

            {/* Total */}
            <div className="pt-2 border-t border-zinc-800 flex items-center justify-between">
              <div>
                <div className="text-xs text-zinc-400">Total de la commande</div>
                <div className="text-lg font-bold font-mono text-white" style={MONO}>
                  {cartSummary.subtotal} $
                </div>
              </div>

              <button
                onClick={() => setTestProtocolModalOpen(true)}
                className="h-9 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm"
              >
                <span>Commander (Test 5 min)</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Agency Upsell Gateway */}
            <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800 text-xs space-y-2">
              <div className="font-semibold text-zinc-200 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>La Passerelle vers l’Agence Minerva :</span>
              </div>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                Avoir un système de commande à 0% est la première étape. L'étape 2 est d'orienter vos clients réguliers dessus grâce au <strong>SEO Local Google Maps</strong> et aux <strong>campagnes QR Codes</strong>.
              </p>
              <Link
                href="/academy"
                className="text-[11px] text-emerald-400 hover:underline inline-flex items-center gap-1 font-medium"
              >
                <span>Voir la stratégie d’acquisition pour restaurants →</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* ── 5. Test Protocol Modal (5 Minutes Zero Operational Risk) ── */}
      {testProtocolModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl max-w-md w-full p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded bg-emerald-950 border border-emerald-700 text-emerald-400 flex items-center justify-center">
                  <Printer className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Protocole Test 5-Minutes</h3>
                  <p className="text-[11px] text-zinc-400">Zéro risque opérationnel pendant le service</p>
                </div>
              </div>
              <button
                onClick={() => setTestProtocolModalOpen(false)}
                className="text-zinc-500 hover:text-zinc-200 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {orderSent ? (
              <div className="p-6 text-center space-y-2 bg-emerald-950/40 border border-emerald-800/60 rounded-lg">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto animate-bounce" />
                <div className="font-bold text-white text-sm">Commande Test Envoyée !</div>
                <p className="text-xs text-zinc-300">
                  Le ticket de commande s'imprime instantanément en cuisine sur l'imprimante thermique de test.
                </p>
              </div>
            ) : (
              <>
                <div className="space-y-2.5 text-xs text-zinc-300">
                  <div className="flex items-start gap-2">
                    <span className="w-4 h-4 rounded-full bg-zinc-800 border border-zinc-700 text-[10px] font-mono flex items-center justify-center shrink-0">1</span>
                    <span>On connecte la commande directement à votre imprimante/tablette existante.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="w-4 h-4 rounded-full bg-zinc-800 border border-zinc-700 text-[10px] font-mono flex items-center justify-center shrink-0">2</span>
                    <span>Vous recevez une commande test en live pour voir la lisibilité du bon.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="w-4 h-4 rounded-full bg-zinc-800 border border-zinc-700 text-[10px] font-mono flex items-center justify-center shrink-0">3</span>
                    <span>Si votre équipe hésite ou si cela prend plus de 5 minutes, <strong>on annule tout</strong>.</span>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-end gap-2 border-t border-zinc-800">
                  <button
                    onClick={() => setTestProtocolModalOpen(false)}
                    className="h-8 px-3 text-xs text-zinc-400 hover:text-zinc-200 cursor-pointer"
                  >
                    Fermer
                  </button>
                  <button
                    onClick={handleTriggerTestOrder}
                    className="h-8 px-3.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Lancer la Commande Test (Simulée)</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
