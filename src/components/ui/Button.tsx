// ui/Button.tsx
import { FiLoader } from 'react-icons/fi';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'ghost';
    isLoading?: boolean;
}

export function Button({
    variant = 'primary',
    isLoading = false,
    children,
    className = '',
    ...props
}: ButtonProps) {
    const baseClasses = `
    px-4 py-2.5 rounded-lg font-medium 
    transition-all duration-200 
    flex items-center justify-center gap-2
    disabled:opacity-50 disabled:cursor-not-allowed
    focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900
    ${className}
  `;

    const variantClasses = {
        primary: `
      bg-purple-600 hover:bg-purple-500 
      text-white 
      focus:ring-purple-500
      shadow-lg shadow-purple-500/20
    `,
        secondary: `
      bg-slate-700 hover:bg-slate-600 
      text-white 
      focus:ring-slate-500
      border border-slate-600
    `,
        ghost: `
      text-slate-300 hover:text-white 
      hover:bg-slate-700/50
      focus:ring-slate-500
    `
    };

    return (
        <button
            className={`${baseClasses} ${variantClasses[variant]}`}
            disabled={isLoading || props.disabled}
            {...props}
        >
            {isLoading ? (
                <>
                    <FiLoader className="animate-spin" />
                    Processing...
                </>
            ) : (
                children
            )}
        </button>
    );
}


