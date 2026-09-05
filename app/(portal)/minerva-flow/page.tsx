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
  ArrowRight,
  ChevronRight,
  Clock,
  Flame,
  X,
  ShieldCheck,
  Check,
} from 'lucide-react';
import { triggerHaptic } from '@/lib/haptics';
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
  prepTime?: string;
  tags?: string[];
}

const SAMPLE_MENU: MenuItem[] = [
  {
    id: 'm1',
    name: 'Pizza Margherita Di Bufala',
    category: 'Pizzas Artisanales',
    description: 'Sauce tomate San Marzano DOP, mozzarella di bufala campana, basilic frais, huile d’olive extra vierge pressée à froid.',
    price: 19.0,
    popular: true,
    image: 'https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?w=600&auto=format&fit=crop&q=80',
    prepTime: '12-15 min',
    tags: ['Fait Maison', 'Végétarien'],
  },
  {
    id: 'm2',
    name: 'Tagliatelle al Tartufo & Funghi',
    category: 'Pâtes Fraîches',
    description: 'Pâtes fraîches maison, crème de truffe noire d’Alba, champignons sauvages sautés et parmesan Reggiano affiné 24 mois.',
    price: 24.5,
    popular: true,
    image: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=600&auto=format&fit=crop&q=80',
    prepTime: '15-18 min',
    tags: ['Signature', 'Truffe Noire'],
  },
  {
    id: 'm3',
    name: 'Burger Gorgonzola & Oignons Caramélisés',
    category: 'Burgers Gourmets',
    description: 'Bœuf Angus haché minute, crème de gorgonzola dolce, roquette poivrée, confit d’oignons rouges au vinaigre balsamique.',
    price: 21.0,
    popular: false,
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&auto=format&fit=crop&q=80',
    prepTime: '14-16 min',
    tags: ['Bœuf Angus'],
  },
  {
    id: 'm4',
    name: 'Carpaccio de Bœuf & Huile de Truffe',
    category: 'Entrées',
    description: 'Fines tranches de filet de bœuf mariné, câpres de Pantelleria, copeaux de parmesan et roquette poivrée.',
    price: 16.5,
    popular: false,
    image: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&auto=format&fit=crop&q=80',
    prepTime: '8-10 min',
    tags: ['Entrée Fraîche'],
  },
  {
    id: 'm5',
    name: 'Tiramisù Traditionnel au Mascarpone',
    category: 'Desserts',
    description: 'Biscuits savoiardi imbibés d’espresso italien, crème onctueuse au mascarpone frais et cacao amer Valrhona.',
    price: 9.5,
    popular: true,
    image: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=600&auto=format&fit=crop&q=80',
    prepTime: 'Immédiat',
    tags: ['Fait Maison'],
  },
  {
    id: 'm6',
    name: 'Cannoli Siciliani Croquants',
    category: 'Desserts',
    description: 'Rouleaux de pâte croustillante farcis à la ricotta sucrée de brebis, pépites de chocolat noir et éclats de pistaches de Bronte.',
    price: 8.0,
    popular: false,
    image: 'https://images.unsplash.com/photo-1551024601-bec78aea704b?w=600&auto=format&fit=crop&q=80',
    prepTime: 'Immédiat',
    tags: ['Pâtisserie'],
  },
];

export default function MinervaFlowPage() {
  const searchParams = useSearchParams();
  const restoParam = searchParams.get('resto') || 'Trattoria Bella Napoli';

  const [cart, setCart] = useState<Record<string, number>>({
    m1: 2,
    m2: 1,
  });

  const [activeCategory, setActiveCategory] = useState('Tous');
  const [selectedDish, setSelectedDish] = useState<MenuItem | null>(null);
  const [sheetQuantity, setSheetQuantity] = useState<number>(1);
  const [testProtocolModalOpen, setTestProtocolModalOpen] = useState(false);
  const [orderSent, setOrderSent] = useState(false);

  const categories = useMemo(() => {
    return ['Tous', 'Pizzas Artisanales', 'Pâtes Fraîches', 'Burgers Gourmets', 'Entrées', 'Desserts'];
  }, []);

  const filteredMenu = useMemo(() => {
    if (activeCategory === 'Tous') return SAMPLE_MENU;
    return SAMPLE_MENU.filter((item) => item.category === activeCategory);
  }, [activeCategory]);

  const handleAddToCart = (id: string, qty = 1) => {
    triggerHaptic('light');
    setCart((prev) => ({ ...prev, [id]: (prev[id] || 0) + qty }));
  };

  const handleRemoveFromCart = (id: string) => {
    triggerHaptic('light');
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

  const handleOpenDishDetail = (dish: MenuItem) => {
    triggerHaptic('light');
    setSelectedDish(dish);
    setSheetQuantity(cart[dish.id] || 1);
  };

  const handleCloseDishDetail = () => {
    setSelectedDish(null);
  };

  const handleConfirmSheetAdd = () => {
    if (!selectedDish) return;
    triggerHaptic('medium');
    setCart((prev) => ({ ...prev, [selectedDish.id]: sheetQuantity }));
    setSelectedDish(null);
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
    const directSavings = uberCommission30;

    return {
      subtotal: subtotal.toFixed(2),
      totalItems,
      uberCommission30: uberCommission30.toFixed(2),
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
    <div className="min-h-screen bg-white text-[#08090a] font-sans antialiased pb-28">
      {/* ── 1. Top Bar: Minerva-Flow Brand & Protocol (Mintlify Paper White Standard) ── */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#f2f2f2] px-4 py-2.5">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 font-semibold text-xs tracking-wider uppercase text-[#0c8c5e]">
              <span className="w-2 h-2 rounded bg-[#0c8c5e]" />
              <span>Minerva Flow</span>
            </div>
            <span className="hidden sm:inline text-zinc-300">|</span>
            <span className="hidden sm:inline text-xs text-zinc-600">
              Commande Directe QR 0% Commission • <strong>{restoParam}</strong>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setTestProtocolModalOpen(true)}
              className="h-8 px-3 text-xs font-medium bg-[#08090a] hover:bg-zinc-800 text-white rounded shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-white" />
              <span>Protocole Test 5-Min</span>
            </button>
            <Link
              href="/academy"
              className="h-8 px-2.5 text-xs font-medium border border-[#f2f2f2] hover:border-[#dddddd] hover:bg-zinc-50 text-zinc-700 rounded transition-colors flex items-center gap-1"
            >
              <span>SOP Agence</span>
              <ChevronRight className="w-3 h-3 text-zinc-400" />
            </Link>
          </div>
        </div>
      </header>

      {/* ── 2. Live Savings Ribbon (Subtle Paper White Tint) ── */}
      <div className="bg-[#ecfdf5] border-b border-[#a7f3d0] py-2.5 px-4">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-[#0c8c5e] text-white flex items-center justify-center font-bold text-[10px]">
              %
            </div>
            <div>
              <span className="font-semibold text-[#0c8c5e]">
                Commande Directe Sans Intermédiaire :
              </span>{' '}
              <span className="text-zinc-700">
                0% de frais prélevés vs 30% chez les plateformes tierces. Vos données restent vôtres.
              </span>
            </div>
          </div>
          <div className="font-mono text-xs text-[#0c8c5e] font-semibold" style={MONO}>
            Économie estimée : +{cartSummary.directSavings} $
          </div>
        </div>
      </div>

      {/* ── 3. Hero Restaurant Card (Clean Neutral Container) ── */}
      <div className="max-w-6xl mx-auto px-4 pt-6 pb-2">
        <div className="bg-zinc-50 border border-[#f2f2f2] rounded-2xl p-5 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span
                className="text-[10px] font-mono uppercase tracking-wider text-[#0c8c5e] bg-[#ecfdf5] border border-[#a7f3d0] px-2 py-0.5 rounded font-medium"
                style={MONO}
              >
                TABLE TEST 04
              </span>
              <span className="text-xs text-zinc-400 font-mono" style={MONO}>
                QR Code Actif
              </span>
            </div>
            <h1 className="text-xl font-bold text-[#08090a] tracking-tight">{restoParam}</h1>
            <p className="text-xs text-zinc-500 leading-relaxed max-w-xl">
              Cuisine italienne authentique, pâtes fraîches maison et pizzas cuites au feu de bois. Commandez directement sans attente.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-3.5 py-2 rounded-xl bg-white border border-[#f2f2f2] text-xs">
              <div className="text-[10px] uppercase text-zinc-400 font-mono" style={MONO}>
                Préparation
              </div>
              <div className="font-semibold text-[#08090a] font-mono" style={MONO}>
                12 – 18 min
              </div>
            </div>
            <div className="px-3.5 py-2 rounded-xl bg-white border border-[#f2f2f2] text-xs">
              <div className="text-[10px] uppercase text-zinc-400 font-mono" style={MONO}>
                Frais de service
              </div>
              <div className="font-semibold text-[#0c8c5e] font-mono" style={MONO}>
                0.00 $ (0%)
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── 4. Main Menu & Interactive Cart (uxpeak E-Commerce Standard) ── */}
      <div className="max-w-6xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Menu Items */}
        <div className="lg:col-span-2 space-y-6">
          {/* Category Filter Buttons (Mintlify 4px Square Geometry, ZERO Pills) */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-[#f2f2f2]">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategory(cat)}
                className={cn(
                  'h-8 px-3 rounded text-xs font-medium transition-colors whitespace-nowrap cursor-pointer',
                  activeCategory === cat
                    ? 'bg-[#08090a] text-white shadow-2xs'
                    : 'bg-zinc-50 hover:bg-zinc-100 text-zinc-600 border border-[#f2f2f2]'
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
                  className="bg-white border border-[#f2f2f2] rounded-2xl overflow-hidden hover:border-[#dddddd] transition-all flex flex-col justify-between shadow-xs hover:shadow-sm group"
                >
                  {/* Image Container with Frosted Contrast Backplate on Overlaid Icons */}
                  <div
                    onClick={() => handleOpenDishDetail(item)}
                    className="aspect-video w-full relative overflow-hidden bg-zinc-100 cursor-pointer"
                  >
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                    />

                    {/* Overlaid Badge with Solid Frosted Backplate (uxpeak Icon/Badge Contrast Fix) */}
                    {item.popular && (
                      <div className="absolute top-2.5 left-2.5 bg-white/90 backdrop-blur-xs border border-white/80 px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider text-amber-800 flex items-center gap-1 shadow-2xs">
                        <Flame className="w-3 h-3 text-amber-600" />
                        <span>Signature</span>
                      </div>
                    )}

                    {/* Quick View Button on Hover */}
                    <div className="absolute bottom-2.5 right-2.5 bg-white/90 backdrop-blur-xs border border-white/80 px-2 py-0.5 rounded text-[10px] font-medium text-[#08090a] opacity-0 group-hover:opacity-100 transition-opacity shadow-2xs">
                      Détails ↗
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <h3
                          onClick={() => handleOpenDishDetail(item)}
                          className="font-semibold text-sm text-[#08090a] hover:text-black cursor-pointer leading-snug"
                        >
                          {item.name}
                        </h3>
                        <span className="font-mono font-semibold text-sm text-[#08090a] shrink-0" style={MONO}>
                          {item.price.toFixed(2)} $
                        </span>
                      </div>
                      <p className="text-xs text-zinc-500 mt-1.5 line-clamp-2 leading-relaxed">
                        {item.description}
                      </p>
                    </div>

                    {/* Purchase Action & Quantity Selector (Adjacent Alignment) */}
                    <div className="pt-3 flex items-center justify-between border-t border-[#f2f2f2]">
                      {qtyInCart > 0 ? (
                        <div className="flex items-center gap-1.5 bg-zinc-50 border border-[#f2f2f2] rounded p-0.5">
                          <button
                            type="button"
                            onClick={() => handleRemoveFromCart(item.id)}
                            className="w-6 h-6 rounded bg-white hover:bg-zinc-100 border border-[#f2f2f2] flex items-center justify-center text-zinc-700 cursor-pointer transition-colors"
                            aria-label="Diminuer la quantité"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-6 text-center font-mono text-xs font-semibold text-[#08090a]" style={MONO}>
                            {qtyInCart}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleAddToCart(item.id)}
                            className="w-6 h-6 rounded bg-[#08090a] hover:bg-zinc-800 text-white flex items-center justify-center cursor-pointer transition-colors"
                            aria-label="Augmenter la quantité"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleAddToCart(item.id)}
                          className="h-7 px-3 rounded bg-[#08090a] hover:bg-zinc-800 text-white text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Ajouter</span>
                        </button>
                      )}

                      <span className="text-[10.5px] text-zinc-400 font-mono" style={MONO}>
                        0% frais
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Live Direct Cart Summary (Desktop View) */}
        <div className="space-y-6">
          <div className="bg-white border border-[#f2f2f2] rounded-2xl p-5 space-y-4 sticky top-16 shadow-xs">
            <div className="flex items-center justify-between border-b border-[#f2f2f2] pb-3">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-[#0c8c5e]" />
                <h2 className="font-semibold text-sm text-[#08090a]">Votre Panier Direct</h2>
              </div>
              <span className="text-xs font-mono text-zinc-500" style={MONO}>
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
                      <div className="font-medium text-[#08090a] truncate">{item.name}</div>
                      <div className="text-[11px] text-zinc-400 font-mono" style={MONO}>
                        {qty} × {item.price.toFixed(2)} $
                      </div>
                    </div>
                    <div className="flex items-center gap-1 font-mono font-semibold text-[#08090a]" style={MONO}>
                      {(item.price * qty).toFixed(2)} $
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Comparison Box (Direct vs Delivery Apps) */}
            <div className="p-3.5 rounded-xl bg-[#ecfdf5] border border-[#a7f3d0] space-y-2 text-xs">
              <div className="text-[11px] font-semibold text-[#0c8c5e] flex items-center gap-1.5">
                <Percent className="w-3.5 h-3.5" />
                <span>Comparatif de rentabilité restaurateur :</span>
              </div>

              <div className="space-y-1 text-[11px] font-mono text-zinc-600" style={MONO}>
                <div className="flex justify-between text-zinc-500">
                  <span>Commission DoorDash/Uber (30%) :</span>
                  <span>- {cartSummary.uberCommission30} $</span>
                </div>
                <div className="flex justify-between text-[#0c8c5e] font-semibold">
                  <span>Commission Minerva Flow (0%) :</span>
                  <span>0.00 $</span>
                </div>
                <div className="pt-1.5 border-t border-[#a7f3d0] flex justify-between font-bold text-[#08090a] text-xs">
                  <span>Marge nette conservée :</span>
                  <span className="text-[#0c8c5e]">+{cartSummary.directSavings} $</span>
                </div>
              </div>
            </div>

            {/* Total */}
            <div className="pt-2 border-t border-[#f2f2f2] flex items-center justify-between">
              <div>
                <div className="text-[11px] text-zinc-400 font-mono uppercase" style={MONO}>Total commande</div>
                <div className="text-base font-bold font-mono text-[#08090a]" style={MONO}>
                  {cartSummary.subtotal} $
                </div>
              </div>

              {/* Primary Action Button with Dynamic Price (uxpeak Standard) */}
              <button
                type="button"
                onClick={() => setTestProtocolModalOpen(true)}
                className="h-9 px-4 rounded bg-[#08090a] hover:bg-zinc-800 text-white text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
              >
                <span>Commander • {cartSummary.subtotal} $</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── 5. Sticky Purchase Bar (uxpeak Masterclass: Global Bottom Bar on Mobile & Desktop) ── */}
      {cartSummary.totalItems > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-[#f2f2f2] px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom,34px))] shadow-xl">
          <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded bg-[#ecfdf5] border border-[#a7f3d0] flex items-center justify-center text-[#0c8c5e] shrink-0">
                <ShoppingBag className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-[#08090a]">
                    {cartSummary.totalItems} plat{cartSummary.totalItems > 1 ? 's' : ''} au panier
                  </span>
                  <span className="text-[10px] font-mono text-[#0c8c5e] bg-[#ecfdf5] border border-[#a7f3d0] px-1.5 py-0.2 rounded font-medium" style={MONO}>
                    0% commission
                  </span>
                </div>
                <div className="text-xs text-zinc-500 font-mono" style={MONO}>
                  Total : <strong className="text-[#08090a]">{cartSummary.subtotal} $</strong>
                </div>
              </div>
            </div>

            {/* Primary Action Button with Dynamic Price inside Button */}
            <button
              type="button"
              onClick={() => setTestProtocolModalOpen(true)}
              className="h-9 px-4 rounded bg-[#08090a] hover:bg-zinc-800 text-white text-xs font-medium transition-colors cursor-pointer flex items-center gap-2 shadow-xs"
            >
              <span>Finaliser la Commande • {cartSummary.subtotal} $</span>
              <ArrowRight className="w-3.5 h-3.5 text-white" />
            </button>
          </div>
        </div>
      )}

      {/* ── 6. Slide-Up Product Detail Sheet (uxpeak Masterclass: Scrollable Card Layout & Predefined Quantity Chips) ── */}
      {selectedDish && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="absolute inset-0" onClick={handleCloseDishDetail} />

          <div className="relative w-full max-w-lg bg-white border border-[#f2f2f2] rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden z-10 animate-in slide-in-from-bottom-4 duration-200 max-h-[90vh] flex flex-col">
            {/* Hero Image with Frosted Contrast Container */}
            <div className="relative aspect-video w-full bg-zinc-100 shrink-0">
              <img
                src={selectedDish.image}
                alt={selectedDish.name}
                className="w-full h-full object-cover"
              />

              {/* Contrast Backplate Close Button (uxpeak Fix) */}
              <button
                type="button"
                onClick={handleCloseDishDetail}
                className="absolute top-3 right-3 w-8 h-8 rounded bg-white/90 backdrop-blur-xs border border-white/80 text-[#08090a] flex items-center justify-center hover:bg-white transition-colors cursor-pointer shadow-2xs"
                aria-label="Fermer la fiche produit"
              >
                <X size={15} />
              </button>

              {/* Contrast Backplate Category Badge */}
              <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-xs border border-white/80 px-2.5 py-1 rounded text-[10px] font-mono uppercase tracking-wider text-[#08090a] shadow-2xs" style={MONO}>
                {selectedDish.category}
              </div>
            </div>

            {/* Scrollable Details Body */}
            <div className="p-5 space-y-4 overflow-y-auto flex-1">
              <div className="space-y-1">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-base font-bold text-[#08090a] tracking-tight">{selectedDish.name}</h3>
                  <span className="text-base font-mono font-bold text-[#08090a]" style={MONO}>
                    {selectedDish.price.toFixed(2)} $
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-zinc-400 font-mono" style={MONO}>
                  <Clock size={12} />
                  <span>Temps de préparation : {selectedDish.prepTime || '15 min'}</span>
                </div>
              </div>

              <p className="text-xs text-zinc-600 leading-relaxed">
                {selectedDish.description}
              </p>

              {/* Predefined Quantity Chips (uxpeak Masterclass Feature) */}
              <div className="space-y-2 pt-2 border-t border-[#f2f2f2]">
                <label className="text-[10.5px] font-mono uppercase tracking-wider text-zinc-400 block" style={MONO}>
                  QUANTITÉ RAPIDE (PORTIONS)
                </label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4].map((qty) => (
                    <button
                      key={qty}
                      type="button"
                      onClick={() => setSheetQuantity(qty)}
                      className={cn(
                        'h-8 flex-1 rounded text-xs font-medium transition-colors cursor-pointer border',
                        sheetQuantity === qty
                          ? 'bg-[#08090a] text-white border-[#08090a]'
                          : 'bg-zinc-50 hover:bg-zinc-100 text-zinc-700 border-[#f2f2f2]'
                      )}
                    >
                      {qty} {qty > 1 ? 'portions' : 'portion'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Sticky Purchase Bar Inside Sheet (Adjacent Quantity Selector + Dynamic Button) */}
            <div className="p-4 border-t border-[#f2f2f2] bg-zinc-50 flex items-center justify-between gap-3 shrink-0 pb-[max(1rem,env(safe-area-inset-bottom,34px))]">
              {/* Adjacent Quantity Selector */}
              <div className="flex items-center gap-1.5 bg-white border border-[#dddddd] rounded p-1">
                <button
                  type="button"
                  onClick={() => setSheetQuantity((q) => Math.max(1, q - 1))}
                  className="w-7 h-7 rounded bg-zinc-50 hover:bg-zinc-100 border border-[#f2f2f2] flex items-center justify-center text-zinc-700 cursor-pointer"
                >
                  <Minus size={13} />
                </button>
                <span className="w-8 text-center font-mono text-xs font-bold text-[#08090a]" style={MONO}>
                  {sheetQuantity}
                </span>
                <button
                  type="button"
                  onClick={() => setSheetQuantity((q) => q + 1)}
                  className="w-7 h-7 rounded bg-[#08090a] hover:bg-zinc-800 text-white flex items-center justify-center cursor-pointer"
                >
                  <Plus size={13} />
                </button>
              </div>

              {/* Primary Action Button with Dynamic Total Calculation */}
              <button
                type="button"
                onClick={handleConfirmSheetAdd}
                className="h-10 px-5 rounded bg-[#08090a] hover:bg-zinc-800 text-white text-xs font-medium transition-colors cursor-pointer flex-1 flex items-center justify-center gap-2 shadow-xs"
              >
                <ShoppingBag size={14} />
                <span>Ajouter au Panier • {(selectedDish.price * sheetQuantity).toFixed(2)} $</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 7. Test Protocol Modal (5 Minutes Zero Operational Risk) ── */}
      {testProtocolModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-[#f2f2f2] rounded-2xl shadow-2xl max-w-md w-full p-5 space-y-4 animate-in fade-in duration-150">
            <div className="flex items-center justify-between border-b border-[#f2f2f2] pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded bg-[#ecfdf5] border border-[#a7f3d0] text-[#0c8c5e] flex items-center justify-center">
                  <Printer className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-[#08090a]">Protocole Test 5-Minutes</h3>
                  <p className="text-[11px] text-zinc-500">Zéro risque opérationnel pendant le service</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setTestProtocolModalOpen(false)}
                className="w-7 h-7 rounded border border-[#f2f2f2] hover:bg-zinc-50 flex items-center justify-center text-zinc-400 hover:text-zinc-700 cursor-pointer"
              >
                <X size={14} />
              </button>
            </div>

            {orderSent ? (
              <div className="p-6 text-center space-y-2 bg-[#ecfdf5] border border-[#a7f3d0] rounded-xl">
                <CheckCircle2 className="w-8 h-8 text-[#0c8c5e] mx-auto animate-bounce" />
                <div className="font-semibold text-[#08090a] text-sm">Commande Test Envoyée !</div>
                <p className="text-xs text-zinc-600">
                  Le ticket de commande s&apos;imprime instantanément en cuisine sur l&apos;imprimante thermique de test.
                </p>
              </div>
            ) : (
              <>
                <div className="space-y-2 text-xs text-zinc-600">
                  <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-zinc-50 border border-[#f2f2f2]">
                    <span className="w-5 h-5 rounded bg-[#08090a] text-white text-[10.5px] font-mono flex items-center justify-center shrink-0">1</span>
                    <span>Connexion directe à votre imprimante thermique de caisse ou tablette existante.</span>
                  </div>
                  <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-zinc-50 border border-[#f2f2f2]">
                    <span className="w-5 h-5 rounded bg-[#08090a] text-white text-[10.5px] font-mono flex items-center justify-center shrink-0">2</span>
                    <span>Émission d&apos;une commande test en live pour valider la lisibilité du bon.</span>
                  </div>
                  <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-zinc-50 border border-[#f2f2f2]">
                    <span className="w-5 h-5 rounded bg-[#08090a] text-white text-[10.5px] font-mono flex items-center justify-center shrink-0">3</span>
                    <span>Si votre équipe hésite ou si le test prend plus de 5 minutes, <strong>on annule tout sans frais</strong>.</span>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-end gap-2 border-t border-[#f2f2f2]">
                  <button
                    type="button"
                    onClick={() => setTestProtocolModalOpen(false)}
                    className="h-8 px-3 text-xs text-zinc-600 hover:text-zinc-900 cursor-pointer"
                  >
                    Fermer
                  </button>
                  <button
                    type="button"
                    onClick={handleTriggerTestOrder}
                    className="h-8 px-3.5 rounded bg-[#08090a] hover:bg-zinc-800 text-white text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5 text-white" />
                    <span>Lancer la Commande Test</span>
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
