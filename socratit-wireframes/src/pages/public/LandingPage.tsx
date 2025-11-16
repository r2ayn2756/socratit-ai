// ============================================================================
// LANDING PAGE
// Marketing homepage for Socratit.ai - converts teachers and admins to sign up
// ============================================================================

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button, Card, Badge, LanguageSelector } from '../../components/common';
import { useLanguage } from '../../contexts/LanguageContext';
import {
  Sparkles,
  Clock,
  Brain,
  TrendingUp,
  CheckCircle,
  MessageSquare,
  BarChart3,
  Users,
  Zap,
  Shield,
  Star,
  Layers,
  CalendarX,
  Calendar,
  FileText,
  AlertCircle,
  Link
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  // Animation variants
  const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">

      {/* HEADER / NAVIGATION */}
      <motion.header
        className="sticky top-0 z-50 glass border-b border-white/20"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="max-w-7xl mx-auto px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src="/logo.svg" alt="Socratit.ai" className="h-20 w-auto" />
            </div>

            <nav className="hidden md:flex items-center gap-4">
              <LanguageSelector />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/login')}
              >
                {t('nav.login')}
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => navigate('/signup')}
              >
                {t('nav.getStarted')}
              </Button>
            </nav>
          </div>
        </div>
      </motion.header>

      {/* HERO SECTION */}
      <section className="relative overflow-hidden py-20 md:py-32">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-12 items-center">

            {/* Left: Headline & CTA */}
            <motion.div
              initial="hidden"
              animate="visible"
              variants={staggerContainer}
            >
              <motion.div variants={fadeInUp}>
                <Badge variant="purple" size="md" className="mb-4">
                  <Sparkles className="w-3 h-3 mr-1" />
                  {t('hero.badge')}
                </Badge>
              </motion.div>

              <motion.h1
                variants={fadeInUp}
                className="text-5xl md:text-6xl font-bold text-slate-900 mb-6 leading-tight"
              >
                {t('hero.headline')}{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-blue to-brand-purple">
                  {t('hero.headlineHighlight')}
                </span>
              </motion.h1>

              <motion.p
                variants={fadeInUp}
                className="text-xl text-slate-600 mb-8 leading-relaxed"
              >
                {t('hero.description')}
              </motion.p>

              <motion.div
                variants={fadeInUp}
                className="flex flex-col sm:flex-row gap-4"
              >
                <Button
                  variant="primary"
                  size="lg"
                  onClick={() => navigate('/signup')}
                  icon={<Sparkles className="w-5 h-5" />}
                  iconPosition="right"
                >
                  {t('hero.cta')}
                </Button>
              </motion.div>
            </motion.div>

            {/* Right: Screenshot/Visual */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative"
            >
              {/* iPhone Mockup */}
              <div className="relative mx-auto w-[340px]">
                {/* Phone Frame */}
                <div className="relative bg-slate-900 rounded-[3rem] p-3 shadow-2xl border-8 border-slate-800">
                  {/* Notch */}
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-7 bg-slate-900 rounded-b-3xl z-10"></div>

                  {/* Screen */}
                  <div className="relative bg-gradient-to-br from-blue-600 via-blue-700 to-purple-700 rounded-[2.5rem] overflow-hidden h-[600px]">
                    {/* Status Bar */}
                    <div className="absolute top-0 left-0 right-0 h-12 flex items-center justify-between px-8 text-white text-xs z-20">
                      <span className="font-semibold">9:41</span>
                      <div className="flex items-center gap-1">
                        <div className="w-4 h-3 border border-white rounded-sm"></div>
                        <div className="w-1 h-2 bg-white rounded-sm"></div>
                      </div>
                    </div>

                    {/* Lock Screen with Notifications */}
                    <div className="pt-16 px-4 space-y-3">
                      {/* Time Display */}
                      <div className="text-center text-white mb-8">
                        <div className="text-6xl font-light mb-1">9:41</div>
                        <div className="text-lg font-light opacity-90">Monday, October 20</div>
                      </div>

                      {/* Notification 1 */}
                      <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className="bg-white/95 backdrop-blur rounded-2xl p-3 shadow-lg"
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-blue to-brand-purple flex items-center justify-center flex-shrink-0">
                            <Brain className="w-4 h-4 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-semibold text-slate-900">Socratit.ai</span>
                              <span className="text-xs text-slate-600">6:00 AM</span>
                            </div>
                            <div className="text-sm text-slate-900 font-medium mb-0.5">
                              ✓ Submitted attendance reports
                            </div>
                            <div className="text-xs text-slate-600">
                              All 5 classes marked complete
                            </div>
                          </div>
                        </div>
                      </motion.div>

                      {/* Notification 2 */}
                      <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.7 }}
                        className="bg-white/95 backdrop-blur rounded-2xl p-3 shadow-lg"
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-blue to-brand-purple flex items-center justify-center flex-shrink-0">
                            <MessageSquare className="w-4 h-4 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-semibold text-slate-900">Socratit.ai</span>
                              <span className="text-xs text-slate-600">6:15 AM</span>
                            </div>
                            <div className="text-sm text-slate-900 font-medium mb-0.5">
                              Sent feedback to 24 students
                            </div>
                            <div className="text-xs text-slate-600">
                              Personalized comments on last week's quiz
                            </div>
                          </div>
                        </div>
                      </motion.div>

                      {/* Notification 3 - Action Required */}
                      <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.9 }}
                        className="bg-white/95 backdrop-blur rounded-2xl p-3 shadow-lg"
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-orange to-red-500 flex items-center justify-center flex-shrink-0">
                            <TrendingUp className="w-4 h-4 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-semibold text-slate-900">Socratit.ai</span>
                              <span className="text-xs text-slate-600">6:30 AM</span>
                            </div>
                            <div className="text-sm text-slate-900 font-medium mb-0.5">
                              ⚠️ 18 students struggling with Triangle Proofs
                            </div>
                            <div className="text-xs text-slate-600 mb-2">
                              Suggested: Re-format tomorrow's lesson
                            </div>
                            <div className="flex gap-2">
                              <button className="flex-1 px-3 py-1.5 bg-brand-blue text-white rounded-lg text-xs font-semibold hover:bg-blue-700 transition-colors">
                                View Details
                              </button>
                              <button className="flex-1 px-3 py-1.5 bg-slate-200 text-slate-900 rounded-lg text-xs font-semibold hover:bg-slate-300 transition-colors">
                                Edit Lesson
                              </button>
                            </div>
                          </div>
                        </div>
                      </motion.div>

                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

          </div>
        </div>
      </section>

      {/* PROBLEM STATEMENT */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="text-center mb-16"
          >
            <motion.h2 variants={fadeInUp} className="text-4xl font-bold text-slate-900 mb-4">
              {t('problem.title')}
            </motion.h2>
            <motion.p variants={fadeInUp} className="text-xl text-slate-600 max-w-3xl mx-auto">
              {t('problem.description')}
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="grid md:grid-cols-3 gap-8"
          >
            {[
              { icon: Clock, title: t('problem.stat1.title'), desc: t('problem.stat1.desc') },
              { icon: MessageSquare, title: t('problem.stat2.title'), desc: t('problem.stat2.desc') },
              { icon: Users, title: t('problem.stat3.title'), desc: t('problem.stat3.desc') },
            ].map((item, idx) => (
              <motion.div key={idx} variants={fadeInUp}>
                <Card variant="elevated" padding="lg" className="text-center">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-brand-blue to-brand-purple rounded-2xl flex items-center justify-center">
                    <item.icon className="w-8 h-8 text-white" />
                  </div>
                  <div className="text-3xl font-bold text-slate-900 mb-2">{item.title}</div>
                  <div className="text-slate-600">{item.desc}</div>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>


      {/* TEACHER STRUGGLES SECTION */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="text-center mb-16"
          >
            <motion.h2 variants={fadeInUp} className="text-4xl font-bold text-slate-900 mb-4">
              {t('struggles.title')}
            </motion.h2>
            <motion.p variants={fadeInUp} className="text-xl text-slate-600">
              {t('struggles.description')}
            </motion.p>
          </motion.div>

          {/* Struggle Testimonials */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="grid md:grid-cols-3 gap-6 mb-12"
          >
            {[
              {
                icon: Layers,
                quote: t('struggles.quote1'),
                role: t('struggles.role1'),
              },
              {
                icon: FileText,
                quote: t('struggles.quote2'),
                role: t('struggles.role2'),
              },
              {
                icon: Clock,
                quote: t('struggles.quote3'),
                role: t('struggles.role3'),
              },
              {
                icon: CalendarX,
                quote: t('struggles.quote4'),
                role: t('struggles.role4'),
              },
              {
                icon: AlertCircle,
                quote: t('struggles.quote5'),
                role: t('struggles.role5'),
              },
              {
                icon: MessageSquare,
                quote: t('struggles.quote6'),
                role: t('struggles.role6'),
              },
            ].map((struggle, idx) => (
              <motion.div
                key={idx}
                variants={fadeInUp}
              >
                <Card padding="lg" className="h-full bg-white border border-slate-200 shadow-none">
                  <struggle.icon className="w-8 h-8 text-slate-600 mb-4" />
                  <p className="text-slate-700 text-base mb-4 leading-relaxed italic">
                    "{struggle.quote}"
                  </p>
                  <div className="text-slate-500 text-sm">— {struggle.role}</div>
                </Card>
              </motion.div>
            ))}
          </motion.div>

          {/* Supporting Text & CTA */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="text-center max-w-3xl mx-auto"
          >
            <motion.p variants={fadeInUp} className="text-lg text-slate-700 mb-8">
              {t('struggles.cta.description')}
            </motion.p>
            <motion.div variants={fadeInUp}>
              <Button
                variant="primary"
                size="lg"
                onClick={() => window.open('https://calendly.com/cc283-rice/30min?month=2025-10', '_blank')}
                icon={<Calendar className="w-5 h-5" />}
                iconPosition="right"
              >
                {t('struggles.cta.button')}
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* HOW SOCRATIT.AI HELPS */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="text-center mb-12"
          >
            <motion.h2 variants={fadeInUp} className="text-4xl font-bold text-slate-900 mb-4">
              {t('solutions.title')}
            </motion.h2>
            <motion.p variants={fadeInUp} className="text-xl text-slate-600">
              {t('solutions.description')}
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {[
              {
                icon: Link,
                title: t('solutions.item1.title'),
                desc: t('solutions.item1.desc'),
              },
              {
                icon: CheckCircle,
                title: t('solutions.item2.title'),
                desc: t('solutions.item2.desc'),
              },
              {
                icon: Brain,
                title: t('solutions.item3.title'),
                desc: t('solutions.item3.desc'),
              },
              {
                icon: TrendingUp,
                title: t('solutions.item4.title'),
                desc: t('solutions.item4.desc'),
              },
              {
                icon: BarChart3,
                title: t('solutions.item5.title'),
                desc: t('solutions.item5.desc'),
              },
              {
                icon: MessageSquare,
                title: t('solutions.item6.title'),
                desc: t('solutions.item6.desc'),
              },
            ].map((solution, idx) => (
              <motion.div key={idx} variants={fadeInUp}>
                <Card padding="lg" className="h-full bg-gradient-to-br from-blue-50 to-purple-50 border border-slate-100">
                  <solution.icon className="w-8 h-8 text-brand-blue mb-3" />
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">{solution.title}</h3>
                  <p className="text-slate-600 text-sm leading-relaxed">{solution.desc}</p>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="py-20 bg-gradient-to-br from-brand-blue to-brand-purple text-white">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            <motion.h2 variants={fadeInUp} className="text-4xl md:text-5xl font-bold mb-6">
              {t('finalCta.title')}
            </motion.h2>
            <motion.p variants={fadeInUp} className="text-xl text-white/90 mb-8">
              {t('finalCta.description')}
            </motion.p>
            <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                variant="secondary"
                size="lg"
                onClick={() => navigate('/signup')}
                className="bg-white text-brand-blue hover:bg-slate-100 font-semibold shadow-lg"
              >
                {t('finalCta.button1')}
              </Button>
              <Button
                variant="ghost"
                size="lg"
                className="border-2 border-white text-white hover:bg-white hover:text-brand-blue font-semibold transition-all"
              >
                {t('finalCta.button2')}
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-slate-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <img src="/logo.svg" alt="Socratit.ai" className="h-8 w-auto mb-4 brightness-0 invert" />
              <p className="text-slate-400 text-sm">
                {t('footer.tagline')}
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">{t('footer.product')}</h3>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><a href="#" className="hover:text-white transition-colors">{t('footer.features')}</a></li>
                <li><a href="#" className="hover:text-white transition-colors">{t('footer.demo')}</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">{t('footer.company')}</h3>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><a href="#" className="hover:text-white transition-colors">{t('footer.about')}</a></li>
                <li><a href="#" className="hover:text-white transition-colors">{t('footer.careers')}</a></li>
                <li><a href="#" className="hover:text-white transition-colors">{t('footer.contact')}</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">{t('footer.legal')}</h3>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><a href="#" className="hover:text-white transition-colors">{t('footer.privacy')}</a></li>
                <li><a href="#" className="hover:text-white transition-colors">{t('footer.terms')}</a></li>
                <li><a href="#" className="hover:text-white transition-colors">{t('footer.security')}</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-800 mt-12 pt-8 text-center text-sm text-slate-400">
            {t('footer.copyright')}
          </div>
        </div>
      </footer>

    </div>
  );
};
