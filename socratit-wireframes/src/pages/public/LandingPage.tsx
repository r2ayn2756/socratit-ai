// ============================================================================
// LANDING PAGE
// Marketing homepage for Socratit.ai - converts teachers and admins to sign up
// ============================================================================

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button, Badge, LanguageSelector } from '../../components/common';
import { useLanguage } from '../../contexts/LanguageContext';
import {
  CheckCircle,
  BarChart3,
  Upload,
  FileText,
  ChevronRight,
  Star,
  Layers,
  Zap
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900">

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
                className="text-white hover:bg-white/10"
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
                <Badge variant="purple" size="md" className="mb-4 glass">
                  <Zap className="w-3 h-3 mr-1" />
                  Your PDF → Quiz Pipeline
                </Badge>
              </motion.div>

              <motion.h1
                variants={fadeInUp}
                className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight"
              >
                Any Curriculum into{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
                  easy measurable assessments
                </span>
              </motion.h1>

              <motion.p
                variants={fadeInUp}
                className="text-xl text-white/80 mb-8 leading-relaxed"
              >
                Upload your curriculum. AI breaks it into units. Generate quizzes with one click.
                Track every outcome. Whether you're training employees or teaching students.
              </motion.p>

              <motion.div
                variants={fadeInUp}
                className="flex flex-col sm:flex-row gap-4"
              >
                <Button
                  variant="primary"
                  size="lg"
                  onClick={() => navigate('/signup')}
                  className="shadow-2xl shadow-blue-500/50"
                >
                  Try Digitizing Your Curriculum →
                </Button>
                <Button
                  variant="secondary"
                  size="lg"
                  onClick={() => window.open('https://calendly.com/cc283-rice/30min?month=2025-10', '_blank')}
                  className="glass border-2 border-white/20 text-white hover:bg-white/10"
                >
                  Book a Demo
                </Button>
              </motion.div>

              {/* Trust Signals */}
              <motion.div
                variants={fadeInUp}
                className="flex flex-col sm:flex-row gap-6 mt-8 text-sm text-white/60"
              >
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span>500+ educators</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span>10,000+ PDFs processed</span>
                </div>
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-yellow-400 fill-current" />
                  <span>4.9/5 stars</span>
                </div>
              </motion.div>
            </motion.div>

            {/* Right: PDF to Quiz Workflow Animation */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative"
            >
              <div className="relative rounded-3xl p-8 shadow-2xl border border-white/30 bg-slate-900/90 backdrop-blur-xl">
                <div className="mb-6 text-center">
                  <h3 className="text-lg font-bold text-white">
                    The Complete Workflow
                  </h3>
                  <p className="text-sm text-white/80">PDF Upload to Results Tracking</p>
                </div>

                {/* Workflow Steps */}
                <div className="space-y-6">
                  {/* Step 1: PDF Upload */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="relative"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex-shrink-0">
                        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                          <Upload className="w-8 h-8 text-white" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="rounded-lg p-4 border border-blue-400/40 bg-blue-950/80 backdrop-blur-sm">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-bold text-white">Training_Manual.pdf</span>
                            <Badge variant="info" size="sm">47 pages</Badge>
                          </div>
                          <div className="w-full bg-blue-900/60 rounded-full h-2">
                            <motion.div
                              className="bg-gradient-to-r from-blue-400 to-blue-500 h-2 rounded-full shadow-lg shadow-blue-500/50"
                              initial={{ width: 0 }}
                              animate={{ width: '100%' }}
                              transition={{ delay: 0.5, duration: 1.5 }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                    {/* Arrow */}
                    <div className="flex justify-center my-2">
                      <ChevronRight className="w-6 h-6 text-blue-400 transform rotate-90" />
                    </div>
                  </motion.div>

                  {/* Step 2: AI Processing */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 }}
                    className="relative"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex-shrink-0">
                        <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                          <Layers className="w-8 h-8 text-white" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="rounded-lg p-4 border border-purple-400/40 bg-purple-950/80 backdrop-blur-sm">
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-semibold text-purple-200">Chapter 1: Safety Basics</span>
                              <CheckCircle className="w-4 h-4 text-purple-300" />
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-semibold text-purple-200">Chapter 2: Equipment</span>
                              <CheckCircle className="w-4 h-4 text-purple-300" />
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-semibold text-purple-200">Chapter 3: Procedures</span>
                              <CheckCircle className="w-4 h-4 text-purple-300" />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    {/* Arrow */}
                    <div className="flex justify-center my-2">
                      <ChevronRight className="w-6 h-6 text-purple-400 transform rotate-90" />
                    </div>
                  </motion.div>

                  {/* Step 3: Quiz Generation */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.3 }}
                    className="relative"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex-shrink-0">
                        <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-pink-600 rounded-xl flex items-center justify-center shadow-lg">
                          <FileText className="w-8 h-8 text-white" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="rounded-lg p-4 border border-pink-400/40 bg-pink-950/80 backdrop-blur-sm">
                          <div className="grid grid-cols-3 gap-2">
                            <div className="rounded p-2 text-center border border-pink-400/40 bg-pink-900/60">
                              <div className="text-xl font-bold text-pink-300">15</div>
                              <div className="text-[10px] text-white/80">Multiple Choice</div>
                            </div>
                            <div className="rounded p-2 text-center border border-pink-400/40 bg-pink-900/60">
                              <div className="text-xl font-bold text-pink-300">8</div>
                              <div className="text-[10px] text-white/80">Short Answer</div>
                            </div>
                            <div className="rounded p-2 text-center border border-pink-400/40 bg-pink-900/60">
                              <div className="text-xl font-bold text-pink-300">3</div>
                              <div className="text-[10px] text-white/80">Scenarios</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    {/* Arrow */}
                    <div className="flex justify-center my-2">
                      <ChevronRight className="w-6 h-6 text-pink-400 transform rotate-90" />
                    </div>
                  </motion.div>

                  {/* Step 4: Results & Analytics */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.8 }}
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex-shrink-0">
                        <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg">
                          <BarChart3 className="w-8 h-8 text-white" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="rounded-lg p-4 border border-orange-400/40 bg-orange-950/80 backdrop-blur-sm">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-bold text-white">Team Performance</span>
                            <Badge variant="warning" size="sm">Live</Badge>
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-white/90">Avg Score:</span>
                              <span className="font-bold text-orange-300">87%</span>
                            </div>
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-white/90">Completion:</span>
                              <span className="font-bold text-orange-300">23/25</span>
                            </div>
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-white/90">Struggling Area:</span>
                              <span className="font-bold text-red-300">Ch. 2.3</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </div>

                {/* Bottom Stats */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 2.3 }}
                  className="mt-6 pt-6 border-t border-white/10"
                >
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-blue-300">
                        3min
                      </div>
                      <div className="text-xs text-white/80">Setup Time</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-purple-300">
                        1 click
                      </div>
                      <div className="text-xs text-white/80">To Generate</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-pink-300">
                        100%
                      </div>
                      <div className="text-xs text-white/80">Visibility</div>
                    </div>
                  </div>
                </motion.div>
              </div>
            </motion.div>

          </div>
        </div>
      </section>

      {/* VALUE PROPOSITION SECTION */}
      <section className="py-20 border-t border-white/10">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="text-center mb-16"
          >
            <motion.h2 variants={fadeInUp} className="text-4xl font-bold text-white mb-4">
              Four Steps. Zero Quiz-Writing. Full Visibility.
            </motion.h2>
            <motion.p variants={fadeInUp} className="text-xl text-white/70 max-w-3xl mx-auto">
              Whether you're training employees or teaching students, prove they actually learned something.
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="grid md:grid-cols-4 gap-6 mb-16"
          >
            {/* Step 1 */}
            <motion.div variants={fadeInUp}>
              <div className="rounded-2xl p-6 h-full border border-white/30 hover:border-blue-400/60 transition-all bg-slate-900/80 backdrop-blur-xl">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center mb-4 shadow-lg shadow-blue-500/30">
                  <Upload className="w-8 h-8 text-white" />
                </div>
                <div className="text-sm font-semibold text-blue-300 mb-2">STEP 1</div>
                <h3 className="text-xl font-bold mb-3 text-white">Drop Your PDF</h3>
                <p className="text-white/80 text-sm">
                  Training manual, textbook, curriculum guide—whatever. We speak PDF.
                </p>
              </div>
            </motion.div>

            {/* Step 2 */}
            <motion.div variants={fadeInUp}>
              <div className="rounded-2xl p-6 h-full border border-white/30 hover:border-purple-400/60 transition-all bg-slate-900/80 backdrop-blur-xl">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mb-4 shadow-lg shadow-purple-500/30">
                  <Layers className="w-8 h-8 text-white" />
                </div>
                <div className="text-sm font-semibold text-purple-300 mb-2">STEP 2</div>
                <h3 className="text-xl font-bold mb-3 text-white">Auto-Organize Content</h3>
                <p className="text-white/80 text-sm">
                  We chunk it into logical units and sub-units. You review, edit, approve.
                </p>
              </div>
            </motion.div>

            {/* Step 3 */}
            <motion.div variants={fadeInUp}>
              <div className="rounded-2xl p-6 h-full border border-white/30 hover:border-pink-400/60 transition-all bg-slate-900/80 backdrop-blur-xl">
                <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-orange-500 rounded-xl flex items-center justify-center mb-4 shadow-lg shadow-pink-500/30">
                  <FileText className="w-8 h-8 text-white" />
                </div>
                <div className="text-sm font-semibold text-pink-300 mb-2">STEP 3</div>
                <h3 className="text-xl font-bold mb-3 text-white">Generate Quizzes</h3>
                <p className="text-white/80 text-sm">
                  One click. Quiz appears. Multiple choice, short answer, scenarios—all aligned.
                </p>
              </div>
            </motion.div>

            {/* Step 4 */}
            <motion.div variants={fadeInUp}>
              <div className="rounded-2xl p-6 h-full border border-white/30 hover:border-orange-400/60 transition-all bg-slate-900/80 backdrop-blur-xl">
                <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center mb-4 shadow-lg shadow-orange-500/30">
                  <BarChart3 className="w-8 h-8 text-white" />
                </div>
                <div className="text-sm font-semibold text-orange-300 mb-2">STEP 4</div>
                <h3 className="text-xl font-bold mb-3 text-white">Track Outcomes</h3>
                <p className="text-white/80 text-sm">
                  Real-time dashboards show gaps, strengths, and who needs help. Per person. Per topic.
                </p>
              </div>
            </motion.div>
          </motion.div>

          {/* Final CTA */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="text-center"
          >
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                variant="primary"
                size="lg"
                onClick={() => navigate('/signup')}
                className="shadow-2xl shadow-blue-500/50"
              >
                Try Digitizing Your Curriculum
              </Button>
              <Button
                variant="secondary"
                size="lg"
                onClick={() => window.open('https://calendly.com/cc283-rice/30min?month=2025-10', '_blank')}
                className="border-2 border-white/30 text-white hover:bg-white/10 backdrop-blur-xl bg-slate-900/40"
              >
                Book a Demo
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-white/10 py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <img src="/logo.svg" alt="Socratit.ai" className="h-8 w-auto mb-4 brightness-0 invert" />
              <p className="text-white/60 text-sm">
                Making PDFs useful since 2024
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4 text-white">{t('footer.product')}</h3>
              <ul className="space-y-2 text-sm text-white/60">
                <li><button onClick={() => navigate('/signup')} className="hover:text-white transition-colors">{t('footer.features')}</button></li>
                <li><button onClick={() => window.open('https://calendly.com/cc283-rice/30min?month=2025-10', '_blank')} className="hover:text-white transition-colors">{t('footer.demo')}</button></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4 text-white">{t('footer.company')}</h3>
              <ul className="space-y-2 text-sm text-white/60">
                <li><button onClick={() => navigate('/signup')} className="hover:text-white transition-colors">{t('footer.about')}</button></li>
                <li><button onClick={() => navigate('/signup')} className="hover:text-white transition-colors">{t('footer.contact')}</button></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4 text-white">{t('footer.legal')}</h3>
              <ul className="space-y-2 text-sm text-white/60">
                <li><button onClick={() => navigate('/signup')} className="hover:text-white transition-colors">{t('footer.privacy')}</button></li>
                <li><button onClick={() => navigate('/signup')} className="hover:text-white transition-colors">{t('footer.terms')}</button></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/10 mt-12 pt-8 text-center text-sm text-white/60">
            {t('footer.copyright')}
          </div>
        </div>
      </footer>

    </div>
  );
};
