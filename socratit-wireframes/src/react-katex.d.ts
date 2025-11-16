declare module 'react-katex' {
  import { ComponentType } from 'react';

  export interface MathProps {
    children?: string;
    math?: string;
    errorColor?: string;
    renderError?: (error: Error) => any;
  }

  export const BlockMath: ComponentType<MathProps>;
  export const InlineMath: ComponentType<MathProps>;
}
