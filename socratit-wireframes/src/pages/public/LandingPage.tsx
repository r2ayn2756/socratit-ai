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
  AlertCircle,
  Link,
  Upload,
  FileCheck,
  Target,
  Globe,
  GraduationCap,
  Briefcase,
  BookOpen,
  Award,
  ChevronRight
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [benefitsTab, setBenefitsTab] = React.useState<'employers' | 'teachers'>('employers');

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
                  Your PDF → Quiz Pipeline
                </Badge>
              </motion.div>

              <motion.h1
                variants={fadeInUp}
                className="text-5xl md:text-6xl font-bold text-slate-900 mb-6 leading-tight"
              >
                Turn Any PDF Into a{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-blue to-brand-purple">
                  Smart Assessment System
                </span>
              </motion.h1>

              <motion.p
                variants={fadeInUp}
                className="text-xl text-slate-600 mb-8 leading-relaxed"
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
                  icon={<Sparkles className="w-5 h-5" />}
                  iconPosition="right"
                >
                  Upload Your First PDF →
                </Button>
                <Button
                  variant="secondary"
                  size="lg"
                  onClick={() => window.scrollTo({ top: 800, behavior: 'smooth' })}
                >
                  See How It Works
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

      {/* 4-STEP WORKFLOW SECTION */}
      <section className="py-20 bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900 text-white">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="text-center mb-16"
          >
            <motion.h2 variants={fadeInUp} className="text-4xl font-bold mb-4">
              How It Works (Seriously, It's This Simple)
            </motion.h2>
            <motion.p variants={fadeInUp} className="text-xl text-white/80 max-w-3xl mx-auto">
              Four steps. Zero quiz-writing. Full visibility into what everyone actually knows.
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="grid md:grid-cols-4 gap-8 mb-12"
          >
            {/* Step 1 */}
            <motion.div variants={fadeInUp} className="relative">
              <div className="bg-white/10 backdrop-blur rounded-2xl p-6 h-full border border-white/20">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center mb-4">
                  <Upload className="w-8 h-8 text-white" />
                </div>
                <div className="text-sm font-semibold text-blue-300 mb-2">STEP 1</div>
                <h3 className="text-xl font-bold mb-3">Drop Your PDF</h3>
                <p className="text-white/70 mb-3">
                  Training manual, textbook, curriculum guide—whatever. We speak PDF.
                </p>
                <div className="text-sm font-medium text-blue-300">Drag, drop, done.</div>
              </div>
              {/* Arrow */}
              <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2 z-10">
                <ChevronRight className="w-8 h-8 text-blue-400" />
              </div>
            </motion.div>

            {/* Step 2 */}
            <motion.div variants={fadeInUp} className="relative">
              <div className="bg-white/10 backdrop-blur rounded-2xl p-6 h-full border border-white/20">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mb-4">
                  <Brain className="w-8 h-8 text-white" />
                </div>
                <div className="text-sm font-semibold text-purple-300 mb-2">STEP 2</div>
                <h3 className="text-xl font-bold mb-3">AI Reads It (So They Don't Have To)</h3>
                <p className="text-white/70 mb-3">
                  We chunk it into logical units and sub-units. You review, edit, approve.
                </p>
                <div className="text-sm font-medium text-purple-300">We're smart. You're smarter.</div>
              </div>
              <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2 z-10">
                <ChevronRight className="w-8 h-8 text-purple-400" />
              </div>
            </motion.div>

            {/* Step 3 */}
            <motion.div variants={fadeInUp} className="relative">
              <div className="bg-white/10 backdrop-blur rounded-2xl p-6 h-full border border-white/20">
                <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-orange-500 rounded-xl flex items-center justify-center mb-4">
                  <Zap className="w-8 h-8 text-white" />
                </div>
                <div className="text-sm font-semibold text-pink-300 mb-2">STEP 3</div>
                <h3 className="text-xl font-bold mb-3">Generate Assessments Instantly</h3>
                <p className="text-white/70 mb-3">
                  Click. Quiz appears. Multiple choice, short answer, scenario-based—aligned to your content.
                </p>
                <div className="text-sm font-medium text-pink-300">Yes, it's actually one click.</div>
              </div>
              <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2 z-10">
                <ChevronRight className="w-8 h-8 text-pink-400" />
              </div>
            </motion.div>

            {/* Step 4 */}
            <motion.div variants={fadeInUp}>
              <div className="bg-white/10 backdrop-blur rounded-2xl p-6 h-full border border-white/20">
                <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center mb-4">
                  <BarChart3 className="w-8 h-8 text-white" />
                </div>
                <div className="text-sm font-semibold text-orange-300 mb-2">STEP 4</div>
                <h3 className="text-xl font-bold mb-3">See Who Knows What</h3>
                <p className="text-white/70 mb-3">
                  Real-time dashboards show gaps, strengths, and who needs intervention. Per person. Per topic. Per unit.
                </p>
                <div className="text-sm font-medium text-orange-300">Data that makes sense.</div>
              </div>
            </motion.div>
          </motion.div>

          {/* Bottom CTA */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="text-center"
          >
            <div className="inline-flex items-center gap-4 bg-white/10 backdrop-blur rounded-full px-6 py-3 border border-white/20">
              <Clock className="w-5 h-5 text-blue-300" />
              <span className="text-sm font-semibold">From upload to first quiz: ~3 minutes</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* SPLIT PROBLEM STATEMENT - EMPLOYERS VS TEACHERS */}
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
              Two Industries. One Headache.
            </motion.h2>
            <motion.p variants={fadeInUp} className="text-xl text-slate-600 max-w-3xl mx-auto">
              Whether you're training employees or teaching students, proving they actually learned something is harder than it should be.
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="grid md:grid-cols-2 gap-12"
          >
            {/* EMPLOYERS & TRAINING MANAGERS */}
            <motion.div variants={fadeInUp}>
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl mb-4">
                  <Briefcase className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-2">Employers & Training Managers</h3>
                <p className="text-slate-600">Compliance Training That Actually Sticks</p>
              </div>

              <div className="space-y-4">
                <Card padding="lg" className="border-l-4 border-blue-500">
                  <h4 className="font-bold text-lg text-slate-900 mb-2">"Death by PDF"</h4>
                  <p className="text-slate-600">
                    Your safety manual is 47 pages. Your team retains about 3.
                  </p>
                </Card>
                <Card padding="lg" className="border-l-4 border-blue-500">
                  <h4 className="font-bold text-lg text-slate-900 mb-2">"Checkbox Culture"</h4>
                  <p className="text-slate-600">
                    Employees click 'I understand' without reading. You have no idea who knows what.
                  </p>
                </Card>
                <Card padding="lg" className="border-l-4 border-blue-500">
                  <h4 className="font-bold text-lg text-slate-900 mb-2">"Audit Anxiety"</h4>
                  <p className="text-slate-600">
                    When regulators ask 'How do you verify knowledge?' you show them... attendance sheets?
                  </p>
                </Card>
              </div>
            </motion.div>

            {/* TEACHERS & EDUCATORS */}
            <motion.div variants={fadeInUp}>
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl mb-4">
                  <GraduationCap className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-2">Teachers & Educators</h3>
                <p className="text-slate-600">Curriculum You Can Actually Track</p>
              </div>

              <div className="space-y-4">
                <Card padding="lg" className="border-l-4 border-purple-500">
                  <h4 className="font-bold text-lg text-slate-900 mb-2">"Quiz Creation Hell"</h4>
                  <p className="text-slate-600">
                    You've read the chapter 8 times. Now write 20 questions testing different Bloom's levels. Due tomorrow.
                  </p>
                </Card>
                <Card padding="lg" className="border-l-4 border-purple-500">
                  <h4 className="font-bold text-lg text-slate-900 mb-2">"The Mystery Gap"</h4>
                  <p className="text-slate-600">
                    80% failed the test. Which concept? When did they lose the thread? No clue.
                  </p>
                </Card>
                <Card padding="lg" className="border-l-4 border-purple-500">
                  <h4 className="font-bold text-lg text-slate-900 mb-2">"Manual Tracking Madness"</h4>
                  <p className="text-slate-600">
                    Standards, sub-standards, learning objectives across 120 students. Your spreadsheet has a spreadsheet.
                  </p>
                </Card>
              </div>
            </motion.div>
          </motion.div>

          {/* Bottom CTA */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="text-center mt-12"
          >
            <Button
              variant="primary"
              size="lg"
              onClick={() => navigate('/signup')}
            >
              Sound Familiar? We Fixed This →
            </Button>
          </motion.div>
        </div>
      </section>


      {/* USE CASES SECTION */}
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
              What Can You Actually Do With This?
            </motion.h2>
            <motion.p variants={fadeInUp} className="text-xl text-slate-600">
              Real scenarios from real users
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="grid md:grid-cols-3 gap-6"
          >
            {[
              {
                icon: Users,
                title: "Onboard New Employees",
                desc: "Upload employee handbook → Quiz on policies → Track completion",
                color: "from-blue-500 to-blue-600"
              },
              {
                icon: Shield,
                title: "Certify Field Teams",
                desc: "Upload safety manuals → Unit-by-unit assessments → Export compliance reports",
                color: "from-green-500 to-green-600"
              },
              {
                icon: BookOpen,
                title: "Flip Your Classroom",
                desc: "Upload chapter PDFs → Students take pre-quizzes → You see gaps before class",
                color: "from-purple-500 to-purple-600"
              },
              {
                icon: Award,
                title: "Professional Development",
                desc: "Upload training materials → Staff self-assess → Identify who needs coaching",
                color: "from-orange-500 to-orange-600"
              },
              {
                icon: Target,
                title: "AP/IB/Standardized Test Prep",
                desc: "Upload study guides → Generate practice tests → Track mastery by standard",
                color: "from-pink-500 to-pink-600"
              },
              {
                icon: Briefcase,
                title: "Client Training Programs",
                desc: "Upload product documentation → Quiz customers → Certify partners",
                color: "from-indigo-500 to-indigo-600"
              },
            ].map((useCase, idx) => (
              <motion.div key={idx} variants={fadeInUp}>
                <Card padding="lg" className="h-full bg-white hover:shadow-lg transition-shadow">
                  <div className={`w-12 h-12 bg-gradient-to-br ${useCase.color} rounded-xl flex items-center justify-center mb-4`}>
                    <useCase.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">{useCase.title}</h3>
                  <p className="text-slate-600 text-sm leading-relaxed">{useCase.desc}</p>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* SPLIT BENEFITS SECTION WITH TABS */}
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
              Why People Love This Thing
            </motion.h2>
            <motion.p variants={fadeInUp} className="text-xl text-slate-600">
              Choose your role to see what matters to you
            </motion.p>
          </motion.div>

          {/* Tab Selector */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="flex justify-center mb-12"
          >
            <div className="inline-flex rounded-lg bg-slate-100 p-1">
              <button
                onClick={() => setBenefitsTab('employers')}
                className={`px-8 py-3 rounded-md font-semibold transition-all ${
                  benefitsTab === 'employers'
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Briefcase className="w-5 h-5 inline-block mr-2" />
                For Employers
              </button>
              <button
                onClick={() => setBenefitsTab('teachers')}
                className={`px-8 py-3 rounded-md font-semibold transition-all ${
                  benefitsTab === 'teachers'
                    ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-md'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <GraduationCap className="w-5 h-5 inline-block mr-2" />
                For Teachers
              </button>
            </div>
          </motion.div>

          {/* Employers Benefits */}
          {benefitsTab === 'employers' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <div className="text-center mb-8">
                <p className="text-lg text-slate-600">Training that proves itself</p>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[
                  {
                    icon: Shield,
                    title: "Audit-Ready Reports",
                    desc: "Export proof of knowledge by employee, by topic, by date. Regulators love us."
                  },
                  {
                    icon: AlertCircle,
                    title: "Spot Knowledge Gaps Early",
                    desc: "See who's struggling before they make costly mistakes in the field."
                  },
                  {
                    icon: Zap,
                    title: "Onboard in Days, Not Weeks",
                    desc: "New hire? Upload their role's docs. They're assessed and ready faster."
                  },
                  {
                    icon: Globe,
                    title: "Multilingual Support",
                    desc: "Train teams in English, Spanish, French—same content, instant translation."
                  },
                  {
                    icon: FileCheck,
                    title: "Compliance Made Boring (In a Good Way)",
                    desc: "Automate recertification. Set reminders. Track completion. Sleep well."
                  },
                  {
                    icon: TrendingUp,
                    title: "ROI You Can Actually Measure",
                    desc: "Incidents down. Certification rates up. We show you the numbers."
                  },
                ].map((benefit, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                  >
                    <Card padding="lg" className="h-full bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200">
                      <benefit.icon className="w-8 h-8 text-blue-600 mb-3" />
                      <h3 className="text-lg font-semibold text-slate-900 mb-2">{benefit.title}</h3>
                      <p className="text-slate-600 text-sm leading-relaxed">{benefit.desc}</p>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Teachers Benefits */}
          {benefitsTab === 'teachers' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <div className="text-center mb-8">
                <p className="text-lg text-slate-600">Curriculum management that doesn't suck</p>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[
                  {
                    icon: Target,
                    title: "Standards-Aligned Automatically",
                    desc: "Tag questions to learning objectives. We track mastery per standard."
                  },
                  {
                    icon: Users,
                    title: "Differentiation Without Exhaustion",
                    desc: "AI suggests personalized review materials for students who need it."
                  },
                  {
                    icon: BarChart3,
                    title: "Formative + Summative in One",
                    desc: "Generate quick checks for understanding or full unit exams. Same source."
                  },
                  {
                    icon: MessageSquare,
                    title: "Parent Communication That Writes Itself",
                    desc: "Click a student's struggle area. We draft the email. You edit and send."
                  },
                  {
                    icon: Brain,
                    title: "24/7 AI Tutor for Students",
                    desc: "Students get Socratic help on homework. You get less 'I don't get it' at 11 PM."
                  },
                  {
                    icon: Link,
                    title: "Gradebook Integration",
                    desc: "Syncs with your LMS. No double-entry. No CSV gymnastics."
                  },
                ].map((benefit, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                  >
                    <Card padding="lg" className="h-full bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200">
                      <benefit.icon className="w-8 h-8 text-purple-600 mb-3" />
                      <h3 className="text-lg font-semibold text-slate-900 mb-2">{benefit.title}</h3>
                      <p className="text-slate-600 text-sm leading-relaxed">{benefit.desc}</p>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </section>

      {/* TESTIMONIALS SECTION */}
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
              Don't Take Our Word For It
            </motion.h2>
            <motion.p variants={fadeInUp} className="text-xl text-slate-600">
              Real results from real people
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="grid md:grid-cols-3 gap-8"
          >
            {/* Employer Testimonial */}
            <motion.div variants={fadeInUp}>
              <Card padding="lg" className="h-full bg-white border-2 border-blue-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                    <Briefcase className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-900">Marcus Chen</div>
                    <div className="text-sm text-slate-600">Training Director, Industrial HVAC Co.</div>
                  </div>
                </div>
                <p className="text-slate-700 italic leading-relaxed">
                  "We used to spend 6 weeks training new technicians. Now it's 10 days.
                  Socratit.ai showed us exactly where people were getting stuck—
                  we fixed the manual and the assessments. Game changer."
                </p>
              </Card>
            </motion.div>

            {/* Teacher Testimonial */}
            <motion.div variants={fadeInUp}>
              <Card padding="lg" className="h-full bg-white border-2 border-purple-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center">
                    <GraduationCap className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-900">Sarah Martinez</div>
                    <div className="text-sm text-slate-600">AP Biology Teacher, Austin ISD</div>
                  </div>
                </div>
                <p className="text-slate-700 italic leading-relaxed">
                  "I uploaded my AP Bio textbook PDFs. It generated 200+ quiz questions
                  aligned to the curriculum framework. I've been tweaking and using them
                  all year. I'd cry if I had to go back to writing these by hand."
                </p>
              </Card>
            </motion.div>

            {/* Compliance Testimonial */}
            <motion.div variants={fadeInUp}>
              <Card padding="lg" className="h-full bg-white border-2 border-green-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center">
                    <Shield className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-900">Jamal Williams</div>
                    <div className="text-sm text-slate-600">Safety Compliance Manager</div>
                  </div>
                </div>
                <p className="text-slate-700 italic leading-relaxed">
                  "Auditor asked for proof our warehouse team knew forklift safety protocols.
                  I pulled a report showing test scores by topic by employee.
                  Took 30 seconds. Auditor was... suspicious it was that easy."
                </p>
              </Card>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* FAQ SECTION */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-6">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="text-center mb-16"
          >
            <motion.h2 variants={fadeInUp} className="text-4xl font-bold text-slate-900 mb-4">
              Questions We Get A Lot
            </motion.h2>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="space-y-6"
          >
            {[
              {
                q: "Does it work with handwritten notes or only typed PDFs?",
                a: "Typed PDFs work best. Handwritten notes... let's just say our AI went to school for OCR, not calligraphy."
              },
              {
                q: "Can I edit the questions it generates?",
                a: "Absolutely. We're smart, not bossy. Edit, delete, add your own. Full control."
              },
              {
                q: "What if my content is super niche?",
                a: "We've handled welding certifications, AP Calculus, OSHA compliance, and Middle English literature. Try us."
              },
              {
                q: "How long does the AI breakdown take?",
                a: "For a 50-page PDF? About 2 minutes. For War and Peace? Maybe grab a coffee."
              },
              {
                q: "Is my data private?",
                a: "Yes. We're SOC 2 compliant. Your PDFs stay yours. We don't train our AI on your content."
              },
              {
                q: "Yes, even that PDF. The 200-page one.",
                a: "We're not scared. Upload it."
              }
            ].map((faq, idx) => (
              <motion.div key={idx} variants={fadeInUp}>
                <Card padding="lg" className="border-l-4 border-brand-blue">
                  <h4 className="font-bold text-lg text-slate-900 mb-2">{faq.q}</h4>
                  <p className="text-slate-600 leading-relaxed">{faq.a}</p>
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
              Ready to Stop Writing Quizzes?
            </motion.h2>
            <motion.p variants={fadeInUp} className="text-xl text-white/90 mb-8">
              Upload a PDF. See the magic. If you're not impressed in 3 minutes,
              we'll personally write your next quiz by hand. (Just kidding. We won't.)
            </motion.p>
            <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <Button
                variant="secondary"
                size="lg"
                onClick={() => navigate('/signup')}
                className="bg-white text-brand-blue hover:bg-slate-100 font-semibold shadow-lg"
              >
                Try It Free - No Credit Card
              </Button>
              <Button
                variant="ghost"
                size="lg"
                onClick={() => window.open('https://calendly.com/cc283-rice/30min?month=2025-10', '_blank')}
                className="border-2 border-white text-white hover:bg-white hover:text-brand-blue font-semibold transition-all"
              >
                Book a Demo
              </Button>
            </motion.div>
            <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row gap-6 justify-center items-center text-sm text-white/80">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                <span>500+ teachers & training managers</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                <span>10,000+ PDFs processed</span>
              </div>
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 fill-current" />
                <span>4.9/5 stars</span>
              </div>
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
                Making PDFs useful since 2024
              </p>
              <p className="text-slate-500 text-xs mt-2">
                (We write the questions. You drink the coffee.)
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
