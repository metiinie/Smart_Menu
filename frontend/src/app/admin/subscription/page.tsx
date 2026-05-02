'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CreditCard,
  Check,
  X,
  Zap,
  Building2,
  Users,
  Star,
  ChevronLeft,
  Mail,
  Shield,
  BarChart3,
  Globe,
  Headphones,
  Lock,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { useAuthStore } from '@/stores/authStore';

// ── Plan Data ───────────────────────────────────────────────────────────────
const PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    emoji: '🌱',
    price: 'Free',
    period: '14-day trial',
    description: 'Perfect for a single-location restaurant getting started.',
    gradient: 'from-slate-500 to-slate-700',
    accentColor: 'brand-500',
    maxBranches: 1,
    maxStaff: 5,
    current: true,
    features: [
      { label: '1 Branch location', included: true },
      { label: 'Up to 5 staff accounts', included: true },
      { label: 'QR menu & ordering', included: true },
      { label: 'Real-time kitchen display', included: true },
      { label: 'Basic analytics (7 days)', included: true },
      { label: 'Multiple branches', included: false },
      { label: 'Custom domain', included: false },
      { label: 'Priority support', included: false },
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    emoji: '🚀',
    price: 'ETB 1,499',
    period: 'per month',
    description: 'For growing restaurants with multiple locations.',
    gradient: 'from-brand-500 to-indigo-600',
    accentColor: 'brand-500',
    maxBranches: 5,
    maxStaff: 25,
    current: false,
    popular: true,
    features: [
      { label: 'Up to 5 Branch locations', included: true },
      { label: 'Up to 25 staff accounts', included: true },
      { label: 'QR menu & ordering', included: true },
      { label: 'Real-time kitchen display', included: true },
      { label: 'Full analytics (90 days)', included: true },
      { label: 'Multiple branches', included: true },
      { label: 'Custom domain', included: false },
      { label: 'Priority support', included: false },
    ],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    emoji: '🏢',
    price: 'Custom',
    period: 'contact us',
    description: 'For restaurant chains and enterprise clients.',
    gradient: 'from-violet-500 to-purple-700',
    accentColor: 'violet-500',
    maxBranches: '∞',
    maxStaff: '∞',
    current: false,
    features: [
      { label: 'Unlimited branches', included: true },
      { label: 'Unlimited staff accounts', included: true },
      { label: 'QR menu & ordering', included: true },
      { label: 'Real-time kitchen display', included: true },
      { label: 'Full analytics (unlimited)', included: true },
      { label: 'Multiple branches', included: true },
      { label: 'Custom domain', included: true },
      { label: 'Dedicated support', included: true },
    ],
  },
];

// ── Contact Modal ────────────────────────────────────────────────────────────
function ContactModal({ planName, onClose }: { planName: string; onClose: () => void }) {
  return (
    <>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/60 z-50 backdrop-blur-sm"
      />
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-50 bg-white rounded-3xl p-7 shadow-2xl max-w-sm mx-auto text-center"
      >
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-400 to-indigo-500 flex items-center justify-center mx-auto mb-5 shadow-lg">
          <Mail size={28} className="text-white" />
        </div>
        <h3 className="font-black text-slate-900 text-xl mb-2">Upgrade to {planName}</h3>
        <p className="text-slate-500 text-sm mb-5 leading-relaxed">
          We&apos;ll set up your {planName} plan personally. Contact us and we&apos;ll get you upgraded within 24 hours.
        </p>
        <a
          href="mailto:hello@arifsmart.com?subject=Upgrade to ArifSmart Pro"
          className="block w-full py-3.5 rounded-2xl bg-gradient-to-r from-brand-500 to-indigo-500 text-white font-bold text-sm mb-3 shadow-md"
        >
          📧 hello@arifsmart.com
        </a>
        <a
          href="tel:+251912345678"
          className="block w-full py-3.5 rounded-2xl bg-slate-100 text-slate-700 font-bold text-sm mb-4"
        >
          📞 +251 91 234 5678
        </a>
        <button onClick={onClose} className="text-xs text-slate-400 hover:text-slate-600 transition-colors">
          Maybe later
        </button>
      </motion.div>
    </>
  );
}

// ── Plan Card ────────────────────────────────────────────────────────────────
function PlanCard({ plan, index, onUpgrade }: { plan: typeof PLANS[0]; index: number; onUpgrade: (name: string) => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05 * index, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className={`relative bg-white rounded-3xl shadow-sm border overflow-hidden ${plan.current ? 'border-brand-300 ring-2 ring-brand-500/20' : 'border-slate-100'}`}
    >
      {/* Popular badge */}
      {plan.popular && (
        <div className="absolute top-4 right-4">
          <span className="flex items-center gap-1 bg-gradient-to-r from-brand-500 to-indigo-500 text-white text-[9px] font-black uppercase tracking-wider rounded-full px-2.5 py-1 shadow-md">
            <Star size={8} fill="white" /> Most Popular
          </span>
        </div>
      )}

      {/* Current badge */}
      {plan.current && (
        <div className="absolute top-4 right-4">
          <span className="flex items-center gap-1 bg-emerald-100 text-emerald-600 text-[9px] font-black uppercase tracking-wider rounded-full px-2.5 py-1">
            <Check size={8} /> Current Plan
          </span>
        </div>
      )}

      {/* Gradient header */}
      <div className={`bg-gradient-to-br ${plan.gradient} p-5 pb-6`}>
        <div className="text-3xl mb-2">{plan.emoji}</div>
        <h3 className="text-white font-black text-xl">{plan.name}</h3>
        <p className="text-white/70 text-xs mt-0.5">{plan.description}</p>
        <div className="mt-4">
          <span className="text-white font-black text-3xl">{plan.price}</span>
          <span className="text-white/60 text-sm ml-2">/ {plan.period}</span>
        </div>
      </div>

      {/* Body */}
      <div className="p-5">
        {/* Limits */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          <div className="bg-slate-50 rounded-xl p-3 text-center">
            <Building2 size={16} className="text-slate-400 mx-auto mb-1" />
            <p className="font-black text-slate-900 text-lg">{plan.maxBranches}</p>
            <p className="text-[10px] text-slate-400 font-medium">Branch{typeof plan.maxBranches === 'number' && plan.maxBranches > 1 ? 'es' : ''}</p>
          </div>
          <div className="bg-slate-50 rounded-xl p-3 text-center">
            <Users size={16} className="text-slate-400 mx-auto mb-1" />
            <p className="font-black text-slate-900 text-lg">{plan.maxStaff}</p>
            <p className="text-[10px] text-slate-400 font-medium">Staff</p>
          </div>
        </div>

        {/* Features */}
        <ul className="space-y-2.5 mb-5">
          {plan.features.map((f, i) => (
            <li key={i} className="flex items-center gap-2.5">
              <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${f.included ? 'bg-emerald-100' : 'bg-slate-100'}`}>
                {f.included
                  ? <Check size={11} className="text-emerald-600" />
                  : <X size={11} className="text-slate-300" />}
              </div>
              <span className={`text-xs ${f.included ? 'text-slate-700 font-medium' : 'text-slate-300'}`}>{f.label}</span>
            </li>
          ))}
        </ul>

        {/* CTA */}
        {plan.current ? (
          <div className="w-full py-3 rounded-2xl bg-slate-100 text-slate-400 font-semibold text-sm text-center">
            ✓ Your Current Plan
          </div>
        ) : (
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => onUpgrade(plan.name)}
            className={`w-full py-3 rounded-2xl font-bold text-sm text-white shadow-md bg-gradient-to-r ${plan.gradient}`}
          >
            {plan.id === 'enterprise' ? 'Contact Sales →' : `Upgrade to ${plan.name} →`}
          </motion.button>
        )}
      </div>
    </motion.div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────
export default function SubscriptionPage() {
  const { logout } = useAuthStore();
  const router = useRouter();
  const [contactModal, setContactModal] = useState<string | null>(null);

  return (
    <>
      <AdminHeader title="Subscription" onLogout={logout}>
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => router.back()}
          className="w-8 h-8 rounded-full bg-surface-100 flex items-center justify-center"
        >
          <ChevronLeft size={16} className="text-white/60" />
        </motion.button>
      </AdminHeader>

      <main className="p-4 pb-14 space-y-5">
        {/* Trial Banner */}
        <motion.div
          initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden bg-gradient-to-r from-amber-400 to-orange-500 rounded-2xl p-4 shadow-md"
        >
          <div className="absolute -right-4 -top-4 w-24 h-24 rounded-full bg-white/10" />
          <div className="relative flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
              <Zap size={20} className="text-white" />
            </div>
            <div>
              <p className="text-white font-black text-sm">Free Trial Active</p>
              <p className="text-white/80 text-[11px]">Explore all Starter features — upgrade anytime</p>
            </div>
          </div>
        </motion.div>

        {/* Heading */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="text-center px-2">
          <h2 className="font-black text-slate-900 text-2xl leading-tight">Choose Your Plan</h2>
          <p className="text-slate-500 text-sm mt-1">Scale as your restaurant grows</p>
        </motion.div>

        {/* Plan Cards */}
        <div className="space-y-4">
          {PLANS.map((plan, i) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              index={i}
              onUpgrade={(name) => setContactModal(name)}
            />
          ))}
        </div>

        {/* Trust Badges */}
        <motion.div
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="bg-slate-50 border border-slate-200 rounded-2xl p-5"
        >
          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider text-center mb-4">Why ArifSmart</p>
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: Shield,       label: 'Secure & Reliable',     sub: '99.9% uptime SLA' },
              { icon: BarChart3,    label: 'Real-time Analytics',   sub: 'Live order tracking' },
              { icon: Globe,        label: 'Multi-Language',        sub: 'AM, EN, OR support' },
              { icon: Headphones,   label: 'Local Support',         sub: 'Addis Ababa team' },
              { icon: Lock,         label: 'Data Privacy',          sub: 'Your data, your rules' },
              { icon: Zap,          label: 'Instant Setup',         sub: 'Live in under 1 hour' },
            ].map((item, i) => {
              const Icon = item.icon;
              return (
                <div key={i} className="flex items-start gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-slate-200/50 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Icon size={14} className="text-slate-500" />
                  </div>
                  <div>
                    <p className="text-slate-700 text-xs font-semibold leading-tight">{item.label}</p>
                    <p className="text-slate-400 text-[10px] mt-0.5">{item.sub}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Footer note */}
        <p className="text-center text-slate-400 text-[10px] pb-2">
          All plans include a 14-day free trial. No credit card required to start.
        </p>
      </main>

      {/* Contact Modal */}
      <AnimatePresence>
        {contactModal && (
          <ContactModal planName={contactModal} onClose={() => setContactModal(null)} />
        )}
      </AnimatePresence>
    </>
  );
}
