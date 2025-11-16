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

            <nav className="hidden md:flex items-center gap-8">
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
                Get Started
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
                We're dedicated to saving teachers time by automating grading,
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
                  icon={<Sparkles className="w-5 h-5" />}
                  iconPosition="right"
                >
                  Try It Now
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
              We Want to Hear What You Struggle With
            </motion.h2>
            <motion.p variants={fadeInUp} className="text-xl text-slate-600">
              You're not alone. These are the challenges teachers face every day.
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
                quote: "In one day, I toggle between Schoology for lessons, TAC for grades, Outlook for communication, Review360 for behavior tracking, and Frontline for absences. None of them sync. That fragmentation is one of the biggest time-wasters in my job.",
                role: "High School Teacher",
              },
              {
                icon: FileText,
                quote: "Grading is endless. District policy requires at least two grades per week per student—about 90-130 students total. I create, review, and input each manually. Paper assignments pile up. Students don't write their names, so tracking submissions becomes detective work.",
                role: "Middle School English Teacher",
              },
              {
                icon: Clock,
                quote: "Tutorials were supposed to help students, but they became overwhelming. Students drop in unannounced, sometimes several at once, all needing help with different assignments. 30-minute sessions always stretch much longer. And I have to track who came and what they worked on.",
                role: "7th Grade Math Teacher",
              },
              {
                icon: CalendarX,
                quote: "Every day's content is prescribed. There's no time to pause or reteach. Tutorials are the only option, but attendance depends on students showing up. Those who miss class need to make up multiple lessons at once, creating even more back-tracking for me.",
                role: "French Language Teacher",
              },
              {
                icon: AlertCircle,
                quote: "Between passes, student arrivals, behavior issues, fire drills, active shooter drills, lockdowns, and announcements—there are constant disruptions. Each one breaks teaching flow. I have to restart attention, re-explain material, or pause grading. It makes consistency impossible.",
                role: "High School Science Teacher",
              },
              {
                icon: MessageSquare,
                quote: "Some parents don't respond to emails or calls; others don't speak English. I use Outlook for emails but have to look up parent info in TAC. Sometimes there's no email listed, only a phone number. Communication often stops there. A multilingual parent-communication system integrated with grades would save significant time.",
                role: "Elementary School Teacher",
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
              These challenges are exactly why we built Socratit.ai. Let's show you how we can help.
            </motion.p>
            <motion.div variants={fadeInUp}>
              <Button
                variant="primary"
                size="lg"
                onClick={() => window.open('https://calendly.com/cc283-rice/30min?month=2025-10', '_blank')}
                icon={<Calendar className="w-5 h-5" />}
                iconPosition="right"
              >
                Book a Demo - Let's Solve These Together
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
              How Socratit.ai Solves These Challenges
            </motion.h2>
            <motion.p variants={fadeInUp} className="text-xl text-slate-600">
              One unified platform that addresses your biggest pain points
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
                title: 'One Unified Platform',
                desc: 'All tools in one place: lessons, grades, attendance, behavior tracking, and parent communication—fully integrated',
              },
              {
                icon: CheckCircle,
                title: 'AI-Powered Auto-Grading',
                desc: 'Instant grading with personalized feedback for every student. No more detective work tracking submissions',
              },
              {
                icon: Brain,
                title: '24/7 AI Teaching Assistant',
                desc: 'Students get help anytime through Socratic questioning—reducing tutorial chaos and makeup work',
              },
              {
                icon: TrendingUp,
                title: 'Adaptive Learning Paths',
                desc: 'Automatically identifies gaps and pushes personalized review materials to students who need it',
              },
              {
                icon: BarChart3,
                title: 'Proactive Daily Insights',
                desc: 'Morning briefings with actionable recommendations—no more chasing data across multiple systems',
              },
              {
                icon: MessageSquare,
                title: 'Smart Parent Communication',
                desc: 'AI-drafted emails in multiple languages, integrated with grades and attendance. One click to update parents',
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
              Ready to Help Your Students Succeed?
            </motion.h2>
            <motion.p variants={fadeInUp} className="text-xl text-white/90 mb-8">
              Join teachers using Socratit.ai to support every student in their classroom.
            </motion.p>
            <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                variant="secondary"
                size="lg"
                onClick={() => navigate('/signup')}
                className="bg-white text-brand-blue hover:bg-slate-100 font-semibold shadow-lg"
              >
                Get Started Free
              </Button>
              <Button
                variant="ghost"
                size="lg"
                className="border-2 border-white text-white hover:bg-white hover:text-brand-blue font-semibold transition-all"
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
                Free AI-powered platform built to help teachers support every student.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><a href="#" className="hover:text-white transition-colors">Features</a></li>
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
