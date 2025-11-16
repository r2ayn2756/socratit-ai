# Interactive Math Assignment System

Complete implementation of Interactive Math assignment creation and taking experience for Socratit.ai.

## Features Implemented

### 1. Assignment Type: INTERACTIVE_MATH

Added new assignment type alongside existing types (PRACTICE, QUIZ, TEST, HOMEWORK, CHALLENGE, ESSAY).

**Location**: `src/pages/teacher/CreateAssignment.tsx`

### 2. Interactive Math Settings

When creating an INTERACTIVE_MATH assignment, teachers can configure:

- **Enable Desmos Graphing Calculator**: Provides students with an interactive graphing calculator
- **Enable Basic Calculator**: Provides a simple arithmetic calculator
- **Enable Step-by-Step Hints**: Progressive hints that guide without giving away answers

**Location**: `src/pages/teacher/CreateAssignment.tsx` (lines 481-527)

### 3. Math Question Editor Component

A specialized question editor for math assignments with:

- **LaTeX Support**: Full LaTeX expression input and preview
- **Symbol Palette**: Quick insert common math symbols (π, √, ∫, ∑, fractions, etc.)
- **Question Types**:
  - `MATH_EXPRESSION`: Students enter math expressions in LaTeX
  - `MULTIPLE_CHOICE`: Traditional multiple choice with LaTeX support in options
  - `FREE_RESPONSE`: Open-ended math questions
- **Step-by-Step Hints**: Add progressive hints that guide students
- **Live Preview**: Real-time rendering of LaTeX expressions using KaTeX

**Location**: `src/components/teacher/MathQuestionEditor.tsx`

**Usage**:
```tsx
import { MathQuestionEditor } from '../../components/teacher/MathQuestionEditor';

<MathQuestionEditor
  question={question}
  index={0}
  onUpdate={handleUpdate}
  onRemove={handleRemove}
  isReadOnly={false}
/>
```

### 4. Math Input Component

LaTeX-enabled input field for students to enter math expressions:

- **LaTeX Input**: Students can type LaTeX notation directly
- **Symbol Palette**: Quick insert buttons for common symbols
- **Live Preview**: Real-time rendering of student's answer
- **Preview Toggle**: Students can show/hide the rendered preview
- **Help Text**: Built-in guidance for LaTeX syntax

**Location**: `src/components/student/MathInput.tsx`

**Usage**:
```tsx
import { MathInput } from '../../components/student/MathInput';

<MathInput
  value={answer}
  onChange={setAnswer}
  placeholder="Enter your answer..."
  showPreview={true}
/>
```

### 5. Basic Calculator Component

Simple arithmetic calculator for students:

- **Standard Operations**: +, -, ×, ÷, %
- **Scientific Functions**: √, x², ±, π
- **Decimal Support**: Full decimal number handling
- **Keyboard-like Interface**: Intuitive button layout
- **Memory Display**: Shows current operation being performed
- **Floating Window**: Can be positioned anywhere on screen

**Location**: `src/components/student/BasicCalculator.tsx`

**Usage**:
```tsx
import { BasicCalculator } from '../../components/student/BasicCalculator';

<BasicCalculator onClose={() => setShowCalc(false)} />
```

### 6. Interactive Math Player Component

Complete math assignment taking experience:

#### Features:

**Desmos Graphing Calculator Integration**:
- Embedded Desmos API v1.7
- Full-featured graphing calculator
- Modal overlay for full-screen experience
- Auto-loads question's LaTeX expression if present
- API Key: Uses Desmos public API

**Math Tools Sidebar**:
- Quick access to graphing calculator
- Quick access to basic calculator
- Clean, organized tool selection

**Progressive Hint System**:
- Hints revealed one at a time
- Shows hint count (e.g., "Hint 1 of 3")
- Prevents answer spoiling
- Animated reveal transitions

**Question Navigation**:
- Progress bar showing completion percentage
- Previous/Next navigation
- Final question shows "Submit" instead of "Next"
- Cannot proceed without answering current question

**Answer Input**:
- Math expressions use LaTeX input component
- Multiple choice with visual selection
- Free response with text area
- Answer validation before proceeding

**Location**: `src/components/student/InteractiveMathPlayer.tsx`

**Usage**:
```tsx
import { InteractiveMathPlayer } from '../../components/student';

<InteractiveMathPlayer
  questions={questions}
  settings={{
    enableGraphingCalculator: true,
    enableBasicCalculator: true,
    enableStepByStepHints: true
  }}
  onSubmitAnswer={(questionId, answer) => handleSubmit(questionId, answer)}
  onComplete={() => handleComplete()}
  showCorrectAnswers={false}
/>
```

## NPM Packages Installed

```json
{
  "katex": "^0.16.25",
  "react-katex": "^3.1.0",
  "@types/katex": "latest"
}
```

## Type Definitions Updated

### Assignment Service Types

**File**: `src/services/assignment.service.ts`

#### New Assignment Type:
```typescript
type: 'PRACTICE' | 'QUIZ' | 'TEST' | 'HOMEWORK' | 'CHALLENGE' | 'ESSAY' | 'INTERACTIVE_MATH'
```

#### New Question Type:
```typescript
type: 'MULTIPLE_CHOICE' | 'FREE_RESPONSE' | 'MATH_EXPRESSION'
```

#### Interactive Math Settings (added to Assignment):
```typescript
enableGraphingCalculator?: boolean;
enableBasicCalculator?: boolean;
enableStepByStepHints?: boolean;
```

#### Math-Specific Question Fields:
```typescript
latexExpression?: string;  // LaTeX equation to display
hints?: string[];          // Progressive hints array
imageUrl?: string;         // Optional diagram/graph image
```

## Desmos API Integration

### Implementation Details:

**API Version**: Desmos API v1.7
**Documentation**: https://www.desmos.com/api/v1.7/docs/index.html

**Script Loading**:
```javascript
const script = document.createElement('script');
script.src = 'https://www.desmos.com/api/v1.7/calculator.js?apiKey=dcb31709b452b1cf9dc26972add0fda6';
```

**Initialization**:
```javascript
const calculator = window.Desmos.GraphingCalculator(containerElement, {
  expressionsCollapsed: true,
  settingsMenu: false,
  zoomButtons: true,
  expressionsTopbar: true,
});
```

**Adding Expressions**:
```javascript
calculator.setExpression({
  id: 'question-expr',
  latex: 'f(x) = x^2 + 2x + 1'
});
```

### Features Used:
- Interactive graphing
- Zoom controls
- Expression input
- Multiple expression support
- Graph persistence during session

## LaTeX Rendering Solution

### KaTeX Implementation:

**Library**: KaTeX v0.16.25 (fast, synchronous math rendering)
**React Component**: react-katex v3.1.0

**Why KaTeX over MathJax**:
- Faster rendering (synchronous, no reflow)
- Smaller bundle size
- Better React integration
- Active maintenance in 2025

**Usage Examples**:

```tsx
import { InlineMath, BlockMath } from 'react-katex';
import 'katex/dist/katex.min.css';

// Inline math
<InlineMath math="x = \frac{-b \pm \sqrt{b^2-4ac}}{2a}" />

// Block/display math
<BlockMath math="f(x) = x^2 + 2x + 1" />
```

**Error Handling**:
```tsx
const renderLatex = (latex: string) => {
  try {
    return <BlockMath math={latex} />;
  } catch (error) {
    return <div className="text-red-500">Invalid LaTeX syntax</div>;
  }
};
```

## Files Created/Modified

### Created Files:
1. `src/components/teacher/MathQuestionEditor.tsx` - Math question editor with LaTeX support
2. `src/components/student/InteractiveMathPlayer.tsx` - Complete math assignment player
3. `src/components/student/MathInput.tsx` - LaTeX input component for students
4. `src/components/student/BasicCalculator.tsx` - Arithmetic calculator widget
5. `src/components/student/index.ts` - Student components exports
6. `src/components/teacher/index.ts` - Teacher components exports

### Modified Files:
1. `src/pages/teacher/CreateAssignment.tsx`:
   - Added INTERACTIVE_MATH type option
   - Added Interactive Math settings section
   - Imported MathQuestionEditor component

2. `src/services/assignment.service.ts`:
   - Added INTERACTIVE_MATH to assignment types
   - Added MATH_EXPRESSION to question types
   - Added math settings fields (enableGraphingCalculator, etc.)
   - Added math-specific question fields (latexExpression, hints, imageUrl)

## Accessibility Features

### Math Input:
- Keyboard navigation support
- Symbol palette for users who can't type LaTeX
- Clear visual feedback for selections
- Preview toggle for different preferences

### Calculator:
- Large, clickable buttons
- Clear visual feedback on button press
- Keyboard shortcuts supported
- Screen reader friendly labels

### Hints:
- Progressive disclosure prevents overwhelming users
- Clear indication of hint progress
- Optional feature (teacher controlled)

## Mobile-Friendly Design

All components are responsive and mobile-friendly:

- **Math Input**: Touch-friendly symbol buttons, responsive layout
- **Calculator**: Large buttons optimized for touch
- **Desmos**: Full modal on mobile for better usability
- **Question Navigation**: Stacked layout on small screens

## Testing Recommendations

### Unit Tests:
1. Test LaTeX rendering with various expressions
2. Test calculator operations and edge cases
3. Test hint reveal logic
4. Test answer validation

### Integration Tests:
1. Complete assignment flow from start to submission
2. Desmos API loading and initialization
3. Calculator tool switching
4. Navigation between questions

### E2E Tests:
1. Teacher creates INTERACTIVE_MATH assignment
2. Student takes assignment with all tools
3. Progressive hint usage
4. Answer submission and validation

## Future Enhancements

Potential improvements for future iterations:

1. **Equation Editor**: Visual equation builder for students unfamiliar with LaTeX
2. **Graph Capture**: Allow students to capture and submit graphs from Desmos
3. **Work Shown**: Students can show step-by-step work
4. **Math Grading**: AI-powered math expression equivalence checking
5. **Formula Sheet**: Teacher-provided reference formulas
6. **Unit Conversion**: Built-in unit converter
7. **Matrix Calculator**: For linear algebra problems
8. **Geometric Tools**: Protractor, ruler, compass for geometry
9. **Offline Mode**: Download assignments for offline work
10. **Collaboration**: Live collaborative problem solving

## Backend Integration Notes

To fully integrate this system, the backend needs:

### Database Schema Updates:
```prisma
enum AssignmentType {
  PRACTICE
  QUIZ
  TEST
  HOMEWORK
  CHALLENGE
  ESSAY
  INTERACTIVE_MATH
}

enum QuestionType {
  MULTIPLE_CHOICE
  FREE_RESPONSE
  MATH_EXPRESSION
}

model Assignment {
  // ... existing fields ...
  enableGraphingCalculator Boolean @default(false)
  enableBasicCalculator    Boolean @default(false)
  enableStepByStepHints    Boolean @default(false)
}

model Question {
  // ... existing fields ...
  latexExpression String?
  hints           String[] @default([])
  imageUrl        String?
}
```

### API Endpoints:
- Accept INTERACTIVE_MATH type in assignment creation
- Store math settings (calculator toggles, hints)
- Store and retrieve LaTeX expressions
- Handle MATH_EXPRESSION question types
- Validate math expressions (optional)

### Math Answer Validation:
Consider integrating a math expression parser for automatic grading:
- SymPy (Python) for symbolic math
- Mathjs (JavaScript) for numerical comparison
- Custom LaTeX parser for exact match

## Usage Example - Complete Flow

### Teacher Creates Assignment:

```tsx
// 1. Select INTERACTIVE_MATH type
// 2. Enable desired tools (Desmos, calculator, hints)
// 3. Add math questions using MathQuestionEditor
// 4. Add LaTeX expressions and hints
// 5. Set correct answers
// 6. Publish assignment
```

### Student Takes Assignment:

```tsx
// 1. Start assignment
// 2. See question with rendered LaTeX
// 3. Use graphing calculator if needed
// 4. Use basic calculator for arithmetic
// 5. Request hints progressively
// 6. Enter answer using math input
// 7. Navigate through questions
// 8. Submit assignment
```

## Support & Troubleshooting

### Common Issues:

**LaTeX not rendering**:
- Ensure `katex/dist/katex.min.css` is imported
- Check for LaTeX syntax errors
- Verify react-katex is installed

**Desmos not loading**:
- Check internet connection (CDN required)
- Verify API key is valid
- Check browser console for errors

**Calculator not appearing**:
- Check math settings are enabled
- Verify component is imported correctly
- Check z-index conflicts

## Performance Considerations

### LaTeX Rendering:
- KaTeX is very fast (renders synchronously)
- Use React.memo for question components
- Debounce live preview updates

### Desmos Loading:
- Lazy load Desmos API only when needed
- Destroy calculator instance when modal closes
- Limit simultaneous calculator instances

### Calculator:
- Lightweight component, minimal performance impact
- Use CSS transforms for animations
- Optimize button rendering with React.memo

## Security Considerations

### LaTeX Input:
- KaTeX automatically sanitizes LaTeX expressions
- No code execution risk (unlike MathJax with some configs)
- Server-side validation recommended for submissions

### Desmos API:
- Uses public CDN (trusted source)
- No sensitive data sent to Desmos
- Calculator state stored locally only

## License & Attribution

- **KaTeX**: MIT License
- **Desmos API**: Free for non-commercial educational use
- **React-KaTeX**: MIT License

## Documentation Links

- KaTeX: https://katex.org/
- Desmos API: https://www.desmos.com/api
- React-KaTeX: https://github.com/MatejBransky/react-katex
