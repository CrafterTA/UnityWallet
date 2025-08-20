import React from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  Wallet,
  LineChart,
  Shield,
  Sparkles,
  Rocket,
  Lock,
  TrendingUp,
  LayoutDashboard,
  Coins,
  Users,
  Send,
  Repeat,
  Activity,
  ArrowRight,
} from "lucide-react";


const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

const stagger = {
  show: { transition: { staggerChildren: 0.08 } },
};

const StatCard = ({ icon: Icon, label, value, sub }: any) => (
  <motion.div
    variants={fadeUp}
    className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl shadow-[0_10px_30px_-10px_rgba(0,0,0,0.4)] ring-1 ring-inset ring-white/5"
  >
    <div className="flex items-center gap-3">
      <div className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-red-500/30 to-yellow-400/30 text-red-200">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-sm text-white/70">{label}</p>
        <p className="mt-0.5 text-xl font-semibold tracking-tight text-white">{value}</p>
      </div>
    </div>
    {sub && <p className="mt-3 text-xs text-white/60">{sub}</p>}
  </motion.div>
);

const Feature = ({ icon: Icon, title, desc }: any) => (
  <motion.div
    variants={fadeUp}
    className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl transition-all hover:-translate-y-0.5 hover:bg-white/7.5"
  >
    <div className="mb-3 flex items-center gap-3">
      <div className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-red-500/30 to-yellow-400/30 text-red-200">
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="text-lg font-semibold text-white">{title}</h3>
    </div>
    <p className="text-sm leading-6 text-white/70">{desc}</p>
    <div className="pointer-events-none absolute right-0 top-0 h-28 w-28 -translate-y-8 translate-x-6 rounded-full bg-gradient-to-tr from-white/10 to-transparent blur-xl transition-opacity group-hover:opacity-100 opacity-0"></div>
  </motion.div>
);

const TokenRow = ({ name, symbol, price, change, mcap }: any) => (
  <div className="grid grid-cols-12 items-center gap-3 rounded-xl px-3 py-2 hover:bg-white/5">
    <div className="col-span-5 flex items-center gap-3">
      <div className="h-8 w-8 rounded-lg bg-white/10" />
      <div>
        <p className="text-sm font-medium text-white">{name}</p>
        <p className="text-xs text-white/60">{symbol}</p>
      </div>
    </div>
    <div className="col-span-2 text-sm text-white">${price}</div>
    <div className={`col-span-2 text-sm ${change.startsWith("-") ? "text-red-400" : "text-emerald-400"}`}>{change}</div>
    <div className="col-span-3 text-right text-sm text-white/80">${mcap}</div>
  </div>
);

export default function Web3ModernLayout() {
  const navigate = useNavigate();

  return (
    <div className="relative">
      {/* HERO */}
      <section className="relative mx-auto max-w-7xl px-4 pb-10 pt-16 sm:pt-20">
        <motion.div
          initial="hidden"
          animate="show"
          variants={stagger}
          className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2"
        >
          <motion.div variants={fadeUp}>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70">
              <Sparkles className="h-3.5 w-3.5" />
              Powering the digital future
            </div>
            <h1 className="mt-4 text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
              Your unified <span className="bg-gradient-to-r from-red-300 via-yellow-300 to-red-300 bg-clip-text text-transparent">digital wallet</span> experience
            </h1>
            <p className="mt-4 max-w-xl text-base leading-7 text-white/70">
              Send, receive, swap, and manage your digital assets across multiple networks with real‑time insights, secure transactions, and seamless user experience.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <a
                href="/pay"
                className="rounded-xl bg-gradient-to-r from-red-500 to-yellow-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-red-500/20"
              >
                Start Trading
              </a>
              <a
                href="/activity"
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white/90 hover:bg-white/10"
              >
                View Activity
              </a>
            </div>
            <div className="mt-6 flex items-center gap-4 text-xs text-white/60">
              <div className="flex items-center gap-1"><Shield className="h-3.5 w-3.5"/> Bank Grade Security</div>
              <div className="flex items-center gap-1"><Lock className="h-3.5 w-3.5"/> Multi-Sig Protection</div>
              <div className="flex items-center gap-1"><Users className="h-3.5 w-3.5"/> 50k+ users</div>
            </div>
          </motion.div>
          <motion.div variants={fadeUp} className="relative">
            {/* dashboard preview card */}
            <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl shadow-[0_20px_60px_-20px_rgba(0,0,0,0.6)] ring-1 ring-inset ring-white/5">
              <div className="flex items-center justify-between rounded-2xl bg-white/5 px-4 py-3">
                <div className="flex items-center gap-2 text-sm text-white/80">
                  <LayoutDashboard className="h-4 w-4"/> Portfolio Overview
                </div>
                <div className="flex items-center gap-2 text-xs text-white/60">
                  <span className="rounded-full bg-emerald-400/15 px-2 py-0.5 text-emerald-300">Net +12.8%</span>
                  <span className="rounded-full bg-white/10 px-2 py-0.5">30d</span>
                </div>
              </div>
              <div className="grid gap-4 p-4 lg:grid-cols-3">
                <div className="lg:col-span-2">
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="mb-3 flex items-center justify-between text-sm text-white/70">
                      <span>Total Balance</span>
                      <span className="flex items-center gap-1 text-emerald-300"><TrendingUp className="h-4 w-4"/> +8.2%</span>
                    </div>
                    <p className="text-3xl font-bold tracking-tight text-white">$24,856.42</p>
                    {/* tiny sparkline */}
                    <svg viewBox="0 0 200 60" className="mt-4 h-16 w-full">
                      <polyline fill="none" stroke="currentColor" strokeOpacity="0.35" strokeWidth="2" points="0,40 20,30 40,35 60,28 80,32 100,22 120,26 140,18 160,22 180,14 200,20" />
                    </svg>
                  </div>
                  <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-3">
                    <div className="grid grid-cols-12 px-3 pb-2 pt-1 text-xs text-white/50">
                      <div className="col-span-5">Asset</div>
                      <div className="col-span-2">Price</div>
                      <div className="col-span-2">24h</div>
                      <div className="col-span-3 text-right">Holdings</div>
                    </div>
                    <TokenRow name="Bitcoin" symbol="BTC" price="64,230" change="+1.8%" mcap="0.25 BTC" />
                    <TokenRow name="Ethereum" symbol="ETH" price="3,210" change="+0.7%" mcap="2.5 ETH" />
                    <TokenRow name="USDC" symbol="USDC" price="1.00" change="+0.1%" mcap="5,420 USDC" />
                  </div>
                </div>
                <div className="grid gap-4">
                  <StatCard icon={Coins} label="Rewards" value="$342" sub="Earned this month" />
                  <StatCard icon={Shield} label="Security" value="Active" sub="Multi-sig protection" />
                  <StatCard icon={LineChart} label="Growth" value="12.8%" sub="Portfolio performance" />
                </div>
              </div>
            </div>

            {/* glow */}
            <div className="pointer-events-none absolute -inset-8 -z-10 rounded-[2rem] bg-gradient-to-tr from-red-500/20 via-yellow-500/20 to-red-500/20 blur-2xl"/>
          </motion.div>
        </motion.div>
      </section>

      {/* STATS BELT */}
      <section className="mx-auto max-w-7xl px-4 pb-6">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-50px" }}
          variants={stagger}
          className="grid grid-cols-2 gap-3 sm:grid-cols-4"
        >
          <StatCard icon={Users} label="Active Users" value="50,384" sub="Growing monthly" />
          <StatCard icon={Rocket} label="Networks" value="8" sub="Multi-chain support" />
          <StatCard icon={Lock} label="Security Score" value="A+" sub="Bank-grade protection" />
          <StatCard icon={TrendingUp} label="Volume" value="$12.4M" sub="Monthly transactions" />
        </motion.div>
      </section>

      {/* FEATURES */}
      <section id="products" className="mx-auto max-w-7xl px-4 py-10">
        <motion.div initial="hidden" whileInView="show" viewport={{ once: true, margin: "-50px" }} variants={stagger}>
          <div className="mb-6 flex items-center gap-2">
            <div className="h-1.5 w-6 rounded-full bg-gradient-to-r from-red-400 to-yellow-400" />
            <h2 className="text-xl font-bold tracking-tight">What you can do</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <Feature
              icon={Coins}
              title="Send & Receive"
              desc="Transfer digital assets instantly across multiple networks with low fees and real-time confirmations."
            />
            <Feature
              icon={LineChart}
              title="Swap & Trade"
              desc="Exchange cryptocurrencies at the best rates with our integrated DEX aggregator and liquidity pools."
            />
            <Feature
              icon={Shield}
              title="Secure Storage"
              desc="Bank-grade security with multi-signature protection, biometric authentication, and encrypted key management."
            />
          </div>
        </motion.div>
      </section>

      {/* CTA */}
      <section id="app" className="relative mx-auto max-w-7xl px-4 py-12">
        <div className="overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-white/10 to-white/5 p-6 backdrop-blur-xl">
          <div className="grid items-center gap-6 md:grid-cols-2">
            <div>
              <h3 className="text-2xl font-bold tracking-tight">Ready to start your digital journey?</h3>
              <p className="mt-2 text-sm text-white/70">
                Join thousands of users managing their digital assets with UnityWallet. Secure, fast, and user-friendly.
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <button 
                  onClick={() => window.location.href = "/pay"}
                  className="rounded-xl bg-gradient-to-r from-red-500 to-yellow-500 px-4 py-2 text-sm font-semibold shadow-lg shadow-red-500/20"
                >
                  Get Started
                </button>
                <a href="/activity" className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white/90 hover:bg-white/10">
                  Learn More
                </a>
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="grid grid-cols-3 gap-3">
                {["Wallet", "DeFi", "Staking", "NFTs", "Swap", "Bridge", "Security", "Analytics", "Mobile"].map((t) => (
                  <div key={t} className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-center text-xs text-white/80">
                    {t}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Additional Content Section for Scroll Testing */}
      <section className="relative mx-auto max-w-7xl px-4 py-20">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          variants={stagger}
          className="text-center space-y-12"
        >
          <motion.div variants={fadeUp}>
            <h2 className="text-4xl font-bold text-white mb-4">
              Why Choose <span className="bg-gradient-to-r from-red-400 to-yellow-400 bg-clip-text text-transparent">UnityWallet?</span>
            </h2>
            <p className="text-white/70 text-lg max-w-2xl mx-auto">
              Experience the next generation of digital finance with cutting-edge security and seamless user experience.
            </p>
          </motion.div>

          <motion.div 
            variants={stagger}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
          >
            {[
              { icon: Shield, title: "Bank-Grade Security", desc: "Multi-signature protection and cold storage" },
              { icon: Rocket, title: "Lightning Fast", desc: "Instant transactions across multiple networks" },
              { icon: Lock, title: "Full Control", desc: "Your keys, your crypto, your choice" },
              { icon: Users, title: "24/7 Support", desc: "Expert help whenever you need it" }
            ].map((feature, index) => (
              <motion.div
                key={index}
                variants={fadeUp}
                className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:border-white/20 transition-all duration-300"
              >
                <feature.icon className="w-12 h-12 text-red-400 mx-auto mb-4" />
                <h3 className="text-white font-semibold mb-2">{feature.title}</h3>
                <p className="text-white/60 text-sm">{feature.desc}</p>
              </motion.div>
            ))}
          </motion.div>

          <motion.div variants={fadeUp} className="pt-8">
            <button 
              onClick={() => navigate('/pay')}
              className="bg-gradient-to-r from-red-500 to-yellow-400 hover:from-red-600 hover:to-yellow-500 text-white font-semibold py-4 px-8 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg"
            >
              Start Your Journey Today
            </button>
          </motion.div>
        </motion.div>
      </section>

      {/* FOOTER */}
      <footer className="mx-auto max-w-7xl px-4 pb-20 md:pb-12 pt-8">
        <div className="grid gap-4 sm:gap-6 grid-cols-2 md:grid-cols-4">
          <div className="col-span-2 md:col-span-1">
            <div className="mb-3 flex items-center gap-2 text-white/80">
              <Wallet className="h-4 w-4" /> UnityWallet
            </div>
            <p className="text-sm text-white/60">Secure, fast, and delightful digital wallet experience.</p>
          </div>
          <div>
            <p className="mb-2 text-sm font-semibold text-white/80">Features</p>
            <ul className="space-y-1 text-sm text-white/60">
              <li><a href="/pay" className="hover:text-white transition-colors">Send & Receive</a></li>
              <li><a href="/swap" className="hover:text-white transition-colors">Swap Assets</a></li>
              <li><a href="/activity" className="hover:text-white transition-colors">Transaction History</a></li>
              <li><a href="/insights" className="hover:text-white transition-colors">Analytics</a></li>
            </ul>
          </div>
          <div>
            <p className="mb-2 text-sm font-semibold text-white/80">Security</p>
            <ul className="space-y-1 text-sm text-white/60">
              <li><a href="#" className="hover:text-white transition-colors">Multi-Sig</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Encryption</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Audit Reports</a></li>
            </ul>
          </div>
          <div>
            <p className="mb-2 text-sm font-semibold text-white/80">Support</p>
            <ul className="space-y-1 text-sm text-white/60">
              <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Contact Us</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Community</a></li>
            </ul>
          </div>
        </div>
        <div className="mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between border-t border-white/10 pt-4 text-xs text-white/50 gap-2">
          <span>© {new Date().getFullYear()} UnityWallet Labs</span>
          <div className="flex items-center gap-3">
            <a href="#" className="hover:text-white transition-colors">Privacy</a>
            <a href="#" className="hover:text-white transition-colors">Terms</a>
          </div>
        </div>
      </footer>

      {/* tiny helper styles for Safari/Firefox edge cases */}
      <style>{`
        @supports not (backdrop-filter: blur(12px)) {
          .backdrop-blur-xl { background-color: rgba(255,255,255,0.06); }
        }
      `}</style>
    </div>
  );
}
