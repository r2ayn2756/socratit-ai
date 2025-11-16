import {
  BookOpen,
  Calculator,
  Microscope,
  TestTube,
  Globe,
  Palette,
  Music,
  Users,
  Code,
  Activity,
  Languages,
  Brain,
  Landmark,
  Binary,
  Dna,
  BookText,
  Lightbulb,
  LucideIcon
} from 'lucide-react';

/**
 * Maps subject names to appropriate icons from lucide-react
 * Returns a default BookOpen icon if subject is not recognized
 */
export const getSubjectIcon = (subject?: string): LucideIcon => {
  if (!subject) return BookOpen;

  const subjectLower = subject.toLowerCase().trim();

  // Mathematics
  if (subjectLower.includes('math') ||
      subjectLower.includes('algebra') ||
      subjectLower.includes('geometry') ||
      subjectLower.includes('calculus') ||
      subjectLower.includes('trigonometry')) {
    return Calculator;
  }

  // Chemistry
  if (subjectLower.includes('chemistry') || subjectLower.includes('chem')) {
    return TestTube;
  }

  // Biology
  if (subjectLower.includes('biology') ||
      subjectLower.includes('bio') ||
      subjectLower.includes('life science')) {
    return Dna;
  }

  // Physics
  if (subjectLower.includes('physics')) {
    return Binary;
  }

  // General Science
  if (subjectLower.includes('science')) {
    return Microscope;
  }

  // History
  if (subjectLower.includes('history') ||
      subjectLower.includes('social studies') ||
      subjectLower.includes('civics') ||
      subjectLower.includes('government')) {
    return Landmark;
  }

  // Geography
  if (subjectLower.includes('geography') ||
      subjectLower.includes('geo')) {
    return Globe;
  }

  // English/Language Arts
  if (subjectLower.includes('english') ||
      subjectLower.includes('language arts') ||
      subjectLower.includes('literature') ||
      subjectLower.includes('reading') ||
      subjectLower.includes('writing')) {
    return BookText;
  }

  // Foreign Languages
  if (subjectLower.includes('spanish') ||
      subjectLower.includes('french') ||
      subjectLower.includes('german') ||
      subjectLower.includes('chinese') ||
      subjectLower.includes('japanese') ||
      subjectLower.includes('language') ||
      subjectLower.includes('esl')) {
    return Languages;
  }

  // Art
  if (subjectLower.includes('art') ||
      subjectLower.includes('drawing') ||
      subjectLower.includes('painting') ||
      subjectLower.includes('visual')) {
    return Palette;
  }

  // Music
  if (subjectLower.includes('music') ||
      subjectLower.includes('band') ||
      subjectLower.includes('orchestra') ||
      subjectLower.includes('choir')) {
    return Music;
  }

  // Computer Science/Technology
  if (subjectLower.includes('computer') ||
      subjectLower.includes('programming') ||
      subjectLower.includes('coding') ||
      subjectLower.includes('technology') ||
      subjectLower.includes('cs') ||
      subjectLower.includes('it')) {
    return Code;
  }

  // Physical Education
  if (subjectLower.includes('physical education') ||
      subjectLower.includes('pe') ||
      subjectLower.includes('gym') ||
      subjectLower.includes('fitness') ||
      subjectLower.includes('health')) {
    return Activity;
  }

  // Psychology
  if (subjectLower.includes('psychology') ||
      subjectLower.includes('psych')) {
    return Brain;
  }

  // Philosophy
  if (subjectLower.includes('philosophy')) {
    return Lightbulb;
  }

  // Social Studies
  if (subjectLower.includes('social')) {
    return Users;
  }

  // Default fallback
  return BookOpen;
};

/**
 * Gets a subject icon as a React component with optional className
 */
export const SubjectIcon = ({
  subject,
  className = "w-6 h-6"
}: {
  subject?: string;
  className?: string;
}) => {
  const Icon = getSubjectIcon(subject);
  return <Icon className={className} />;
};
