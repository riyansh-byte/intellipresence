"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from "recharts";
import {
  Shield, Brain, Zap, BarChart3, FileText, Bell, Users,
  CheckCircle, ArrowRight, Star, ChevronDown, Globe, Lock, Database, Cloud, Cpu,
  CalendarCheck, TrendingUp, Award, Building2,
} from "lucide-react";
import { useRef } from "react";

// ─────────────────────────────────────────
// Mock chart data for preview
// ─────────────────────────────────────────

const chartData = Array.from({ length: 14 }, (_, i) => ({
  day: `Day ${i + 1}`,
  present: Math.floor(Math.random() * 30) + 140,
  absent: Math.floor(Math.random() * 20) + 15,
}));

// ─────────────────────────────────────────
// Section components
// ─────────────────────────────────────────

function FadeIn({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

const features = [
  { icon: <Brain className="w-5 h-5" />, title: "AI-Powered Intelligence", desc: "Machine learning models detect anomalies, predict at-risk students, and surface actionable insights automatically.", color: "bg-brand-500/10 text-brand-500" },
  { icon: <CalendarCheck className="w-5 h-5" />, title: "Smart Attendance Tracking", desc: "Manual, QR, and facial recognition modes. Capture attendance in seconds — not minutes.", color: "bg-success/10 text-success" },
  { icon: <BarChart3 className="w-5 h-5" />, title: "Real-time Analytics", desc: "Live dashboards with department comparisons, trends, risk scoring, and custom report generation.", color: "bg-emerald-500/10 text-emerald-600" },
  { icon: <Zap className="w-5 h-5" />, title: "Workflow Automation", desc: "Connect to n8n for zero-touch automation — notifications, reports, and escalations triggered automatically.", color: "bg-warning/10 text-warning" },
  { icon: <Shield className="w-5 h-5" />, title: "Enterprise Security", desc: "Row Level Security, JWT auth, encrypted storage, audit logs, and GDPR-compliant data handling.", color: "bg-danger/10 text-danger" },
  { icon: <Cloud className="w-5 h-5" />, title: "Cloud-Native Architecture", desc: "Built on Supabase + AWS S3. Scales to millions of records with zero maintenance overhead.", color: "bg-info/10 text-info" },
];

const steps = [
  { num: "01", title: "Register Your Organization", desc: "Set up in under 5 minutes. Add your departments, import students via CSV, and invite teachers." },
  { num: "02", title: "Configure Attendance Rules", desc: "Define working hours, grace periods, thresholds, and notification preferences for your organization." },
  { num: "03", title: "Start Taking Attendance", desc: "Teachers mark attendance via the web or mobile app. The system automatically generates analytics." },
  { num: "04", title: "Get AI-Powered Reports", desc: "Download reports, share with stakeholders, or let n8n automation send them on schedule." },
];

const plans = [
  {
    name: "Starter",
    price: "$29",
    period: "/month",
    desc: "Perfect for small schools & institutions",
    features: ["Up to 200 students", "5 teachers", "Basic analytics", "CSV export", "Email support"],
    cta: "Start Free Trial",
    highlighted: false,
  },
  {
    name: "Pro",
    price: "$89",
    period: "/month",
    desc: "For growing institutions with advanced needs",
    features: ["Up to 2,000 students", "Unlimited teachers", "Advanced analytics", "AI insights", "API access", "Priority support", "Custom reports"],
    cta: "Get Pro",
    highlighted: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    desc: "For universities & large enterprises",
    features: ["Unlimited students", "Face recognition", "n8n workflows", "AWS Rekognition", "SLA guarantee", "Dedicated support", "Custom integrations"],
    cta: "Contact Sales",
    highlighted: false,
  },
];

const testimonials = [
  { name: "Dr. Ramesh Iyer", role: "Principal, KV Engineering College", text: "IntelliPresence reduced our attendance marking time by 80%. The analytics dashboard gives us insights we never had before.", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Ramesh" },
  { name: "Sarah Chen", role: "HR Director, TechCorp India", text: "We track 3,000 employees across 5 offices. IntelliPresence's workflow automation means zero manual follow-up.", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah" },
  { name: "Prof. Anand Krishnan", role: "Dean, National University", text: "The role-based access is exactly what we needed. Each department sees only their own data.", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Anand" },
];

const faqs = [
  { q: "Does IntelliPresence work offline?", a: "IntelliPresence requires an internet connection for real-time sync. Offline mode is on our roadmap for Q2." },
  { q: "How is facial recognition handled?", a: "Face recognition uses AWS Rekognition. Face data is stored in AWS, never in our database. You control deletion." },
  { q: "Can we import existing student data?", a: "Yes. You can import students, teachers, and departments via CSV or connect to your existing SIS via API." },
  { q: "Is there a mobile app?", a: "A React Native mobile app is currently in development. The web app is fully responsive in the meantime." },
  { q: "What about GDPR compliance?", a: "IntelliPresence is GDPR-ready. Data is stored in EU-region Supabase instances by default, with full audit logs." },
];

// ─────────────────────────────────────────
// Page
// ─────────────────────────────────────────

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background font-sans">

      {/* ── Navbar ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 h-16 border-b border-border/50 bg-background/90 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 h-full flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg gradient-brand flex items-center justify-center shadow-brand-sm">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-bold gradient-text">IntelliPresence</span>
          </Link>
          <div className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
            <Link href="#features" className="hover:text-foreground transition-colors">Features</Link>
            <Link href="#how-it-works" className="hover:text-foreground transition-colors">How it works</Link>
            <Link href="#pricing" className="hover:text-foreground transition-colors">Pricing</Link>
            <Link href="#faq" className="hover:text-foreground transition-colors">FAQ</Link>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/login">
              <Button variant="ghost" size="sm">Log in</Button>
            </Link>
            <Link href="/register">
              <Button size="sm" className="btn-brand">Get started free</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative pt-32 pb-24 px-6 overflow-hidden">
        {/* Gradient mesh bg */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl" />
          <div className="absolute top-20 right-1/4 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-1/2 w-64 h-64 bg-success/5 rounded-full blur-3xl" />
        </div>

        <div className="max-w-5xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Badge className="mb-6 px-4 py-1.5 text-xs font-medium bg-brand-50 text-brand-600 border-brand-200">
              <Zap className="w-3 h-3 mr-1.5" />
              Now with AI-Powered Insights — Enter the future of attendance
            </Badge>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.1] text-balance mb-6"
          >
            Attendance Intelligence
            <br />
            <span className="gradient-text">Built for Scale</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg text-muted-foreground max-w-2xl mx-auto mb-10 text-balance"
          >
            IntelliPresence replaces manual registers with a cloud-native platform that automates tracking,
            generates real-time analytics, and connects your entire attendance workflow — from classroom to boardroom.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex items-center justify-center gap-3 flex-wrap"
          >
            <Link href="/register">
              <Button size="lg" className="btn-brand h-12 px-8 text-base">
                Start for free <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <Link href="/admin">
              <Button size="lg" variant="outline" className="h-12 px-8 text-base">
                View live demo
              </Button>
            </Link>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-xs text-muted-foreground mt-4"
          >
            No credit card required · Free 14-day trial · Cancel anytime
          </motion.p>
        </div>

        {/* ── Dashboard preview ── */}
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-5xl mx-auto mt-16"
        >
          <div className="rounded-2xl border border-border shadow-2xl bg-card overflow-hidden">
            {/* Browser chrome */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-muted/30">
              <div className="w-3 h-3 rounded-full bg-danger/70" />
              <div className="w-3 h-3 rounded-full bg-warning/70" />
              <div className="w-3 h-3 rounded-full bg-success/70" />
              <div className="flex-1 ml-3 bg-background rounded px-3 py-1 text-xs text-muted-foreground border border-border max-w-xs">
                app.IntelliPresence.com/admin
              </div>
            </div>
            {/* Mock dashboard */}
            <div className="p-5 bg-background">
              {/* Stats row */}
              <div className="grid grid-cols-4 gap-3 mb-5">
                {[
                  { label: "Present", value: "472", color: "stat-card-success" },
                  { label: "Absent", value: "61", color: "stat-card-danger" },
                  { label: "Late", value: "35", color: "stat-card-warning" },
                  { label: "Avg Rate", value: "83%", color: "stat-card-primary" },
                ].map((s) => (
                  <div key={s.label} className={`rounded-xl border p-4 ${s.color}`}>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{s.label}</p>
                    <p className="text-2xl font-bold mt-1">{s.value}</p>
                  </div>
                ))}
              </div>
              {/* Chart */}
              <div className="rounded-xl border bg-card p-4">
                <p className="text-xs font-semibold mb-3">Attendance Trend — Last 14 days</p>
                <ResponsiveContainer width="100%" height={140}>
                  <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="lp-present" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(160,84%,39%)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(160,84%,39%)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="day" tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                    <Area type="monotone" dataKey="present" stroke="hsl(160,84%,39%)" strokeWidth={2} fill="url(#lp-present)" dot={false} />
                    <Area type="monotone" dataKey="absent" stroke="hsl(347,77%,50%)" strokeWidth={1.5} fill="none" dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ── Trusted by ── */}
      <section className="py-12 border-y border-border overflow-hidden">
        <div className="max-w-6xl mx-auto px-6">
          <p className="text-center text-xs text-muted-foreground uppercase tracking-widest mb-8">
            Trusted by leading institutions worldwide
          </p>
          <div className="flex items-center gap-12 justify-center flex-wrap opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
            {["Harvard Extension", "IIT Bombay", "TechCorp Global", "Oxford Online", "MIT OpenEd", "BITS Pilani"].map((name) => (
              <div key={name} className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                <Building2 className="w-4 h-4" />
                {name}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <FadeIn className="text-center mb-16">
            <Badge className="mb-4 bg-brand-50 text-brand-600 border-brand-200">Features</Badge>
            <h2 className="text-4xl font-bold tracking-tight mb-4">
              Everything you need to run{" "}
              <span className="gradient-text">smarter attendance</span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Built for schools, colleges, and enterprises. IntelliPresence brings the power of enterprise software to institutions of every size.
            </p>
          </FadeIn>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f, i) => (
              <FadeIn key={f.title} delay={i * 0.06}>
                <div className="rounded-xl border bg-card p-6 hover:shadow-card-hover transition-all duration-300 h-full">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${f.color}`}>
                    {f.icon}
                  </div>
                  <h3 className="text-base font-semibold mb-2">{f.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section id="how-it-works" className="py-24 px-6 bg-muted/30">
        <div className="max-w-5xl mx-auto">
          <FadeIn className="text-center mb-16">
            <Badge className="mb-4 bg-success/10 text-success border-success/20">How It Works</Badge>
            <h2 className="text-4xl font-bold tracking-tight mb-4">
              Up and running in <span className="gradient-text">minutes</span>
            </h2>
          </FadeIn>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {steps.map((step, i) => (
              <FadeIn key={step.num} delay={i * 0.08}>
                <div className="flex gap-5 p-6 rounded-xl border bg-card">
                  <div className="text-3xl font-black gradient-text shrink-0">{step.num}</div>
                  <div>
                    <h3 className="font-semibold mb-1">{step.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── Security ── */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <FadeIn className="text-center mb-12">
            <Badge className="mb-4 bg-danger/10 text-danger border-danger/20">Security</Badge>
            <h2 className="text-4xl font-bold tracking-tight mb-4">
              Enterprise-grade <span className="gradient-text">security by default</span>
            </h2>
          </FadeIn>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: <Lock className="w-5 h-5" />, label: "JWT Auth", desc: "Supabase-powered" },
              { icon: <Database className="w-5 h-5" />, label: "Row Level Security", desc: "Per-org isolation" },
              { icon: <Shield className="w-5 h-5" />, label: "Audit Logs", desc: "Every action tracked" },
              { icon: <Cloud className="w-5 h-5" />, label: "Encrypted Storage", desc: "AWS S3 + AES-256" },
            ].map((item, i) => (
              <FadeIn key={item.label} delay={i * 0.06}>
                <div className="rounded-xl border bg-card p-5 text-center hover:shadow-card-hover transition-all">
                  <div className="w-10 h-10 rounded-xl bg-brand-500/10 text-brand-500 flex items-center justify-center mx-auto mb-3">
                    {item.icon}
                  </div>
                  <p className="text-sm font-semibold">{item.label}</p>
                  <p className="text-xs text-muted-foreground mt-1">{item.desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" className="py-24 px-6 bg-muted/30">
        <div className="max-w-5xl mx-auto">
          <FadeIn className="text-center mb-16">
            <Badge className="mb-4 bg-emerald-500/10 text-emerald-700 border-emerald-200">Pricing</Badge>
            <h2 className="text-4xl font-bold tracking-tight mb-4">
              Simple, transparent <span className="gradient-text">pricing</span>
            </h2>
            <p className="text-muted-foreground">No hidden fees. Cancel anytime.</p>
          </FadeIn>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {plans.map((plan, i) => (
              <FadeIn key={plan.name} delay={i * 0.07}>
                <div className={`rounded-2xl border p-7 flex flex-col h-full relative ${plan.highlighted ? "border-primary shadow-brand bg-brand-50/50 dark:bg-brand-950/30" : "bg-card"}`}>
                  {plan.highlighted && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge className="btn-brand text-white px-4">Most Popular</Badge>
                    </div>
                  )}
                  <div className="mb-6">
                    <h3 className="text-lg font-bold">{plan.name}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{plan.desc}</p>
                    <div className="flex items-baseline gap-1 mt-4">
                      <span className="text-4xl font-extrabold">{plan.price}</span>
                      <span className="text-muted-foreground">{plan.period}</span>
                    </div>
                  </div>
                  <ul className="space-y-2.5 flex-1 mb-6">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-sm">
                        <CheckCircle className="w-4 h-4 text-success shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Link href="/register">
                    <Button className={`w-full ${plan.highlighted ? "btn-brand" : ""}`} variant={plan.highlighted ? "default" : "outline"}>
                      {plan.cta}
                    </Button>
                  </Link>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <FadeIn className="text-center mb-16">
            <Badge className="mb-4 bg-warning/10 text-warning border-warning/20">Testimonials</Badge>
            <h2 className="text-4xl font-bold tracking-tight">
              Loved by <span className="gradient-text">educators & admins</span>
            </h2>
          </FadeIn>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {testimonials.map((t, i) => (
              <FadeIn key={t.name} delay={i * 0.08}>
                <div className="rounded-xl border bg-card p-6 h-full flex flex-col">
                  <div className="flex mb-3">
                    {Array.from({ length: 5 }).map((_, j) => (
                      <Star key={j} className="w-3.5 h-3.5 text-warning fill-warning" />
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed flex-1">"{t.text}"</p>
                  <div className="flex items-center gap-3 mt-5 pt-4 border-t border-border">
                    <img src={t.avatar} alt={t.name} className="w-9 h-9 rounded-full bg-muted" />
                    <div>
                      <p className="text-sm font-semibold">{t.name}</p>
                      <p className="text-xs text-muted-foreground">{t.role}</p>
                    </div>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" className="py-24 px-6 bg-muted/30">
        <div className="max-w-3xl mx-auto">
          <FadeIn className="text-center mb-16">
            <Badge className="mb-4">FAQ</Badge>
            <h2 className="text-4xl font-bold tracking-tight">
              Frequently asked <span className="gradient-text">questions</span>
            </h2>
          </FadeIn>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <FadeIn key={faq.q} delay={i * 0.04}>
                <details className="rounded-xl border bg-card p-5 group cursor-pointer">
                  <summary className="flex items-center justify-between font-medium text-sm list-none">
                    {faq.q}
                    <ChevronDown className="w-4 h-4 text-muted-foreground transition-transform group-open:rotate-180" />
                  </summary>
                  <p className="text-sm text-muted-foreground mt-3 leading-relaxed">{faq.a}</p>
                </details>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-24 px-6">
        <FadeIn>
          <div className="max-w-4xl mx-auto rounded-2xl gradient-brand p-12 text-center text-white relative overflow-hidden">
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-white blur-3xl" />
              <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full bg-white blur-3xl" />
            </div>
            <h2 className="text-4xl font-extrabold tracking-tight mb-4 relative">
              Ready to transform your attendance?
            </h2>
            <p className="text-white/80 mb-8 text-lg relative">
              Join thousands of institutions already using IntelliPresence. Get started in minutes.
            </p>
            <div className="flex items-center justify-center gap-3 flex-wrap relative">
              <Link href="/register">
                <Button size="lg" className="bg-white text-brand-600 hover:bg-white/90 h-12 px-8 font-semibold">
                  Start Free Trial <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
              <Link href="/admin">
                <Button size="lg" variant="ghost" className="text-white border-white/30 border hover:bg-white/10 h-12 px-8">
                  View Demo
                </Button>
              </Link>
            </div>
          </div>
        </FadeIn>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-border py-12 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-8">
            <div className="col-span-2">
              <Link href="/" className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-lg gradient-brand flex items-center justify-center">
                  <Shield className="w-3.5 h-3.5 text-white" />
                </div>
                <span className="font-bold gradient-text">IntelliPresence</span>
              </Link>
              <p className="text-xs text-muted-foreground max-w-xs leading-relaxed">
                The intelligent attendance platform built for modern organizations. Cloud-native, AI-powered, enterprise-ready.
              </p>
              <div className="flex items-center gap-3 mt-4">
                <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                </a>
                <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                  </svg>
                </a>
                <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764 0-.973.784-1.762 1.75-1.762s1.75.789 1.75 1.762c0 .974-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" clipRule="evenodd" />
                  </svg>
                </a>
              </div>
            </div>
            {[
              { title: "Product", links: ["Features", "Pricing", "Changelog", "Roadmap"] },
              { title: "Company", links: ["About", "Blog", "Careers", "Contact"] },
              { title: "Legal", links: ["Privacy", "Terms", "Security", "Cookies"] },
            ].map((col) => (
              <div key={col.title}>
                <h4 className="text-xs font-semibold uppercase tracking-widest mb-3">{col.title}</h4>
                <ul className="space-y-2">
                  {col.links.map((l) => (
                    <li key={l}><a href="#" className="text-xs text-muted-foreground hover:text-foreground transition-colors">{l}</a></li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
            <p>© 2024 IntelliPresence. All rights reserved.</p>
            <p>Built with Next.js · Supabase · AWS · n8n</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
