import React, { useState } from 'react';
import { Eye, EyeOff, Lock } from 'lucide-react';

interface PasswordInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    icon?: React.ReactNode;
}

export const PasswordInput: React.FC<PasswordInputProps> = ({
    label,
    icon = <Lock className="absolute left-3 top-2.5 text-slate-400 w-5 h-5" />,
    className = "",
    ...props
}) => {
    const [showPassword, setShowPassword] = useState(false);

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    return (
        <div className="w-full">
            {label && (
                <label className="block text-sm font-medium text-slate-700 mb-2">
                    {label}
                </label>
            )}
            <div className="relative">
                {icon}
                <input
                    {...props}
                    type={showPassword ? 'text' : 'password'}
                    className={`w-full pl-10 pr-12 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-slate-900 placeholder-slate-400 transition-all ${className}`}
                />
                <button
                    type="button"
                    onClick={togglePasswordVisibility}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-primary transition-colors focus:outline-none"
                    aria-label={showPassword ? 'Esconder senha' : 'Mostrar senha'}
                >
                    {showPassword ? (
                        <EyeOff className="w-5 h-5" />
                    ) : (
                        <Eye className="w-5 h-5" />
                    )}
                </button>
            </div>
        </div>
    );
};
