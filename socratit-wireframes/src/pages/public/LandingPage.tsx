// ============================================================================
// LANDING PAGE
// Marketing homepage for Socratit.ai - converts teachers and admins to sign up
// ============================================================================

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button, Card, Badge } from '../../components/common';
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
  Star
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();

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
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src="/logo.svg" alt="Socratit.ai" className="h-16 w-auto" />
            </div>

            <nav className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-slate-700 hover:text-brand-blue transition-colors font-medium">
                Features
              </a>
              <a href="#how-it-works" className="text-slate-700 hover:text-brand-blue transition-colors font-medium">
                How It Works
              </a>
              <a href="#pricing" className="text-slate-700 hover:text-brand-blue transition-colors font-medium">
                Pricing
              </a>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/login')}
              >
                Login
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => navigate('/signup')}
              >
                Start Free Trial
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
                  AI-Powered Teaching Assistant
                </Badge>
              </motion.div>

              <motion.h1
                variants={fadeInUp}
                className="text-5xl md:text-6xl font-bold text-slate-900 mb-6 leading-tight"
              >
                Teaching Shouldn't Feel Like{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-blue to-brand-purple">
                  Two Full-Time Jobs
                </span>
              </motion.h1>

              <motion.p
                variants={fadeInUp}
                className="text-xl text-slate-600 mb-8 leading-relaxed"
              >
                Socratit.ai gives you back 15+ hours per week by automating grading,
                generating personalized feedback, and proactively identifying struggling students—all
                while helping students learn through Socratic questioning.
              </motion.p>

              <motion.div
                variants={fadeInUp}
                className="flex flex-col sm:flex-row gap-4"
              >
                <Button
                  variant="primary"
                  size="lg"
                  onClick={() => navigate('/signup')}
                  rightIcon={<Sparkles className="w-5 h-5" />}
                >
                  Start Free Trial
                </Button>
                <Button
                  variant="ghost"
                  size="lg"
                  onClick={() => {}}
                >
                  Watch Demo
                </Button>
              </motion.div>

              <motion.div
                variants={fadeInUp}
                className="mt-8 flex items-center gap-6 text-sm text-slate-600"
              >
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-success" />
                  <span>No credit card required</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-success" />
                  <span>14-day free trial</span>
                </div>
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
                  <div className="relative bg-gradient-to-b from-slate-950 to-slate-900 rounded-[2.5rem] overflow-hidden h-[600px]">
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
                        <div className="text-lg font-light opacity-70">Monday, October 20</div>
                      </div>

                      {/* Notification 1 */}
                      <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className="glass rounded-2xl p-3 shadow-lg"
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-blue to-brand-purple flex items-center justify-center flex-shrink-0">
                            <Brain className="w-4 h-4 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-semibold text-white">Socratit.ai</span>
                              <span className="text-xs text-white/60">6:00 AM</span>
                            </div>
                            <div className="text-sm text-white font-medium mb-0.5">
                              ✓ Submitted attendance reports
                            </div>
                            <div className="text-xs text-white/70">
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
                        className="glass rounded-2xl p-3 shadow-lg"
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-blue to-brand-purple flex items-center justify-center flex-shrink-0">
                            <MessageSquare className="w-4 h-4 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-semibold text-white">Socratit.ai</span>
                              <span className="text-xs text-white/60">6:15 AM</span>
                            </div>
                            <div className="text-sm text-white font-medium mb-0.5">
                              Sent feedback to 24 students
                            </div>
                            <div className="text-xs text-white/70">
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
                        className="glass rounded-2xl p-3 shadow-lg"
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-orange to-red-500 flex items-center justify-center flex-shrink-0">
                            <TrendingUp className="w-4 h-4 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-semibold text-white">Socratit.ai</span>
                              <span className="text-xs text-white/60">6:30 AM</span>
                            </div>
                            <div className="text-sm text-white font-medium mb-0.5">
                              ⚠️ 18 students struggling with Triangle Proofs
                            </div>
                            <div className="text-xs text-white/70 mb-2">
                              Suggested: Re-format tomorrow's lesson
                            </div>
                            <div className="flex gap-2">
                              <button className="flex-1 px-3 py-1.5 bg-brand-blue text-white rounded-lg text-xs font-semibold">
                                View Details
                              </button>
                              <button className="flex-1 px-3 py-1.5 bg-white/20 text-white rounded-lg text-xs font-semibold">
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
              Teachers Are Overwhelmed
            </motion.h2>
            <motion.p variants={fadeInUp} className="text-xl text-slate-600 max-w-3xl mx-auto">
              The average teacher spends 50+ hours per week on lesson planning, grading,
              parent communication, and individualized student support.
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
              { icon: Clock, title: '15 hours/week', desc: 'Spent on grading and feedback' },
              { icon: MessageSquare, title: '47 emails/day', desc: 'From students and parents' },
              { icon: Users, title: '30+ students', desc: 'Need individual attention' },
            ].map((item, idx) => (
              <motion.div key={idx} variants={fadeInUp}>
                <Card variant="neumorphism" padding="lg" className="text-center">
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

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="py-20 bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="text-center mb-16"
          >
            <motion.h2 variants={fadeInUp} className="text-4xl font-bold text-slate-900 mb-4">
              How Socratit.ai Works
            </motion.h2>
            <motion.p variants={fadeInUp} className="text-xl text-slate-600">
              Three simple steps to transform your teaching workflow
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
              {
                step: '1',
                title: 'Create Assignments',
                desc: 'Generate assignments in seconds using AI or upload your existing worksheets',
                icon: Zap,
              },
              {
                step: '2',
                title: 'Students Learn',
                desc: 'AI Teaching Assistant guides students through Socratic questioning—never giving answers',
                icon: Brain,
              },
              {
                step: '3',
                title: 'Get Your Morning Briefing',
                desc: 'Wake up to completed tasks, insights on struggling students, and actionable recommendations',
                icon: TrendingUp,
              },
            ].map((item, idx) => (
              <motion.div key={idx} variants={fadeInUp}>
                <Card variant="glass" padding="lg" className="h-full">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-brand-blue to-brand-purple text-white font-bold text-xl flex items-center justify-center flex-shrink-0">
                      {item.step}
                    </div>
                    <item.icon className="w-8 h-8 text-brand-blue" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900 mb-3">{item.title}</h3>
                  <p className="text-slate-600 leading-relaxed">{item.desc}</p>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* FEATURES GRID */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="text-center mb-16"
          >
            <motion.h2 variants={fadeInUp} className="text-4xl font-bold text-slate-900 mb-4">
              Features That Save Time
            </motion.h2>
            <motion.p variants={fadeInUp} className="text-xl text-slate-600">
              Everything you need to teach smarter, not harder
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
              { icon: Brain, title: 'AI Teaching Assistant', desc: 'Socratic tutoring for every student, 24/7' },
              { icon: Zap, title: 'Auto-Generate Assignments', desc: 'Create homework, quizzes, and tests in seconds' },
              { icon: CheckCircle, title: 'Instant Grading', desc: 'Automated grading with personalized feedback' },
              { icon: TrendingUp, title: 'Proactive Insights', desc: 'Daily briefings with actionable recommendations' },
              { icon: BarChart3, title: 'Real-Time Analytics', desc: 'Track mastery, struggles, and engagement' },
              { icon: MessageSquare, title: 'Smart Communications', desc: 'AI-drafted emails to students and parents' },
            ].map((feature, idx) => (
              <motion.div key={idx} variants={fadeInUp}>
                <Card variant="elevated" padding="lg" hover>
                  <feature.icon className="w-10 h-10 text-brand-blue mb-4" />
                  <h3 className="text-xl font-bold text-slate-900 mb-2">{feature.title}</h3>
                  <p className="text-slate-600">{feature.desc}</p>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* SOCIAL PROOF */}
      <section className="py-20 bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="text-center mb-16"
          >
            <motion.h2 variants={fadeInUp} className="text-4xl font-bold text-slate-900 mb-4">
              Loved by Teachers Everywhere
            </motion.h2>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="grid md:grid-cols-3 gap-8"
          >
            {[
              { stat: '15+ hours', label: 'Saved per week' },
              { stat: '94%', label: 'Teacher satisfaction' },
              { stat: '10,000+', label: 'Students helped' },
            ].map((item, idx) => (
              <motion.div key={idx} variants={fadeInUp}>
                <Card variant="glass" padding="lg" className="text-center">
                  <div className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-brand-blue to-brand-purple mb-2">
                    {item.stat}
                  </div>
                  <div className="text-slate-600 text-lg">{item.label}</div>
                </Card>
              </motion.div>
            ))}
          </motion.div>

          {/* Testimonials */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="mt-16 grid md:grid-cols-2 gap-8"
          >
            {[
              {
                quote: "Socratit.ai gave me my evenings back. I actually have time for my family now.",
                author: "Sarah Martinez",
                role: "8th Grade Math Teacher",
              },
              {
                quote: "The AI TA helps my struggling students without me having to stay after school every day.",
                author: "James Chen",
                role: "High School Science Teacher",
              },
            ].map((testimonial, idx) => (
              <motion.div key={idx} variants={fadeInUp}>
                <Card variant="elevated" padding="lg">
                  <div className="flex gap-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 fill-warning text-warning" />
                    ))}
                  </div>
                  <p className="text-slate-700 text-lg mb-4 leading-relaxed italic">
                    "{testimonial.quote}"
                  </p>
                  <div className="font-semibold text-slate-900">{testimonial.author}</div>
                  <div className="text-slate-600 text-sm">{testimonial.role}</div>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ADMIN APPEAL */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <Badge variant="primary" size="md" className="mb-4">
                <Shield className="w-3 h-3 mr-1" />
                For Administrators
              </Badge>
              <h2 className="text-4xl font-bold text-slate-900 mb-6">
                ROI That Speaks for Itself
              </h2>
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="w-6 h-6 text-success" />
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900 mb-1">Reduce Teacher Burnout</div>
                    <div className="text-slate-600">38% improvement in teacher retention rates</div>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="w-6 h-6 text-success" />
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900 mb-1">Improve Student Outcomes</div>
                    <div className="text-slate-600">22% increase in standardized test scores</div>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="w-6 h-6 text-success" />
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900 mb-1">District-Wide Analytics</div>
                    <div className="text-slate-600">Real-time insights across all schools</div>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <Card variant="neumorphism" padding="lg">
                <div className="text-center mb-6">
                  <div className="text-5xl font-bold text-slate-900 mb-2">$47</div>
                  <div className="text-slate-600">per teacher/month</div>
                  <div className="text-sm text-slate-500 mt-1">District pricing available</div>
                </div>
                <div className="space-y-3 mb-6">
                  {[
                    'Unlimited classes and students',
                    'AI Teaching Assistant',
                    'Auto-grading & feedback',
                    'Real-time analytics',
                    'Priority support',
                    'FERPA & COPPA compliant',
                  ].map((feature, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-success flex-shrink-0" />
                      <span className="text-slate-700">{feature}</span>
                    </div>
                  ))}
                </div>
                <Button
                  variant="primary"
                  size="lg"
                  fullWidth
                  onClick={() => navigate('/signup')}
                >
                  Request Demo
                </Button>
              </Card>
            </motion.div>
          </div>
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
              Ready to Transform Your Teaching?
            </motion.h2>
            <motion.p variants={fadeInUp} className="text-xl text-white/90 mb-8">
              Join thousands of teachers who've reclaimed their time and improved student outcomes.
            </motion.p>
            <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                variant="secondary"
                size="lg"
                onClick={() => navigate('/signup')}
                className="bg-white text-brand-blue hover:bg-slate-50"
              >
                Start Free Trial
              </Button>
              <Button
                variant="ghost"
                size="lg"
                className="border-white text-white hover:bg-white/10"
              >
                Schedule Demo
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
                AI-powered teaching assistant that gives teachers their time back.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><a href="#" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Demo</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Legal</h3>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><a href="#" className="hover:text-white transition-colors">Privacy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Security</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-800 mt-12 pt-8 text-center text-sm text-slate-400">
            © 2025 Socratit.ai. All rights reserved.
          </div>
        </div>
      </footer>

    </div>
  );
};
