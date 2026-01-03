import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Sparkles, Shield, Truck, MessageCircle } from "lucide-react";
import type { HeroData } from "../libs/hero.server";

const trustBadges = [
  { icon: Shield, label: "Secure Checkout" },
  { icon: Truck, label: "Free Shipping" },
  { icon: MessageCircle, label: "24/7 Support" },
];

export default function Hero({ hero }: { hero: HeroData | null }) {
  if (!hero) return null;

  return (
    <section className="relative overflow-hidden">
      {/* Ambient Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-gradient-radial from-amber-500/8 via-transparent to-transparent blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-gradient-radial from-amber-400/6 via-transparent to-transparent blur-3xl" />
      </div>

      <div className="container relative z-10 py-16 md:py-24 lg:py-28">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          
          {/* Content Column */}
          <div className="order-2 lg:order-1 space-y-6 max-w-xl text-center lg:text-left mx-auto lg:mx-0">
            {/* Kicker */}
            <div 
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full animate-fade-in-up"
              style={{
                background: "rgba(var(--gold-rgb), 0.1)",
                border: "1px solid rgba(var(--gold-rgb), 0.2)",
                animationDelay: "0.1s",
              }}
            >
              <Sparkles size={14} style={{ color: "rgb(var(--gold-rgb))" }} />
              <span 
                className="text-xs font-semibold uppercase tracking-widest"
                style={{ color: "rgb(var(--gold-rgb))" }}
              >
                New Collection
              </span>
            </div>

            {/* Main Heading */}
            <h1 
              className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-display leading-[1.05] tracking-tight animate-fade-in-up"
              style={{ animationDelay: "0.2s" }}
            >
              <span className="block">{hero.title.split(' ').slice(0, 2).join(' ')}</span>
              <span 
                className="block bg-gradient-to-r from-amber-200 via-amber-400 to-amber-300 bg-clip-text text-transparent"
              >
                {hero.title.split(' ').slice(2).join(' ') || 'Elegance'}
              </span>
            </h1>

            {/* Subtitle */}
            <p 
              className="text-lg lg:text-xl leading-relaxed animate-fade-in-up"
              style={{ 
                color: "var(--muted)",
                animationDelay: "0.3s",
              }}
            >
              {hero.subtitle}
            </p>

            {/* CTA Buttons */}
            <div 
              className="flex flex-wrap items-center justify-center lg:justify-start gap-4 animate-fade-in-up"
              style={{ animationDelay: "0.4s" }}
            >
              <Link 
                href={hero.ctaLink} 
                className="group relative inline-flex items-center gap-3 px-8 py-4 rounded-2xl font-semibold text-black overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_20px_40px_rgba(212,175,55,0.3)] active:scale-[0.98]"
                style={{
                  background: "linear-gradient(135deg, rgb(var(--gold-rgb)), #f5c542)",
                }}
              >
                <span className="relative z-10">{hero.ctaLabel}</span>
                <ArrowRight size={18} className="relative z-10 transition-transform group-hover:translate-x-1" />
                <div className="absolute inset-0 bg-gradient-to-r from-amber-300 to-amber-400 opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
              
              <Link 
                href="/products"
                className="inline-flex items-center gap-2 px-6 py-4 rounded-2xl font-medium transition-all duration-300 hover:scale-[1.02]"
                style={{ 
                  color: "var(--fg)",
                  background: "var(--glass-hover)",
                  border: "1px solid var(--glass-hover)",
                }}
              >
                <span>View All</span>
                <ArrowRight size={16} className="opacity-70" />
              </Link>
            </div>

            {/* Trust Badges */}
            <div 
              className="flex flex-wrap items-center justify-center lg:justify-start gap-5 pt-4 animate-fade-in-up"
              style={{ animationDelay: "0.5s" }}
            >
              {trustBadges.map(({ icon: Icon, label }) => (
                <div 
                  key={label}
                  className="flex items-center gap-2 text-sm"
                  style={{ color: "var(--muted)" }}
                >
                  <div 
                    className="w-8 h-8 rounded-xl flex items-center justify-center"
                    style={{
                      background: "rgba(var(--gold-rgb), 0.12)",
                      border: "1px solid rgba(var(--gold-rgb), 0.2)",
                    }}
                  >
                    <Icon size={14} style={{ color: "rgb(var(--gold-rgb))" }} />
                  </div>
                  <span className="font-medium hidden sm:inline">{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Image Column */}
          <div className="order-1 lg:order-2 relative animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
            {/* Decorative Ring */}
            <div 
              className="absolute -inset-4 rounded-[32px] opacity-50"
              style={{
                background: "linear-gradient(135deg, rgba(var(--gold-rgb), 0.15), transparent 50%, rgba(var(--gold-rgb), 0.1))",
              }}
            />
            
            {/* Main Image Container */}
            <div className="relative rounded-3xl overflow-hidden shadow-2xl">
              {/* Gradient Overlay */}
              <div className="absolute inset-0 z-10 pointer-events-none bg-gradient-to-t from-black/20 via-transparent to-transparent" />
              
              {/* Image */}
              <div className="relative aspect-[4/5] lg:aspect-[3/4]">
                {hero.heroImage?.url && (
                  <Image
                    src={hero.heroImage.url}
                    alt={hero.title}
                    fill
                    priority
                    fetchPriority="high"
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    className="object-cover transition-transform duration-700 hover:scale-105"
                  />
                )}
              </div>

              {/* Floating Badge */}
              <div 
                className="absolute bottom-6 left-6 right-6 z-20 p-5 rounded-2xl backdrop-blur-xl"
                style={{
                  background: "rgba(0, 0, 0, 0.75)",
                  border: "1px solid rgba(255, 255, 255, 0.15)",
                  boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
                }}
              >
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p 
                      className="text-[10px] uppercase tracking-widest font-semibold"
                      style={{ color: "rgb(var(--gold-rgb))" }}
                    >
                      Featured
                    </p>
                    <p className="text-white font-bold text-lg mt-1">Limited Edition</p>
                  </div>
                  <Link
                    href={hero.ctaLink}
                    className="px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 hover:scale-105"
                    style={{
                      background: "rgb(var(--gold-rgb))",
                      color: "#000",
                    }}
                  >
                    Shop Now
                  </Link>
                </div>
              </div>
            </div>

            {/* Decorative Elements */}
            <div 
              className="absolute -top-8 -right-8 w-24 h-24 rounded-full blur-2xl opacity-40"
              style={{ background: "rgb(var(--gold-rgb))" }}
            />
            <div 
              className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full blur-3xl opacity-30"
              style={{ background: "rgb(var(--gold-rgb))" }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
