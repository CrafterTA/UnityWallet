import React from 'react';

// ===== CARD COMPONENT =====
interface LightModeCardProps {
  variant?: 'default' | 'elevated' | 'outlined';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  children: React.ReactNode;
}

export const LightModeCard: React.FC<LightModeCardProps> = ({
  variant = 'default',
  size = 'md',
  className = '',
  children
}) => {
  const baseClasses = 'rounded-xl border transition-all duration-200';
  
  const variantClasses = {
    default: 'bg-white border-slate-200 shadow-sm hover:shadow-md',
    elevated: 'bg-white border-slate-200 shadow-lg hover:shadow-xl',
    outlined: 'bg-transparent border-slate-300 hover:border-slate-400'
  };
  
  const sizeClasses = {
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8'
  };

  return (
    <div className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}>
      {children}
    </div>
  );
};

// ===== BUTTON COMPONENT =====
interface LightModeButtonProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}

export const LightModeButton: React.FC<LightModeButtonProps> = ({
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  onClick,
  disabled = false
}) => {
  const baseClasses = 'inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variantClasses = {
    primary: 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-md hover:shadow-lg focus:ring-red-500',
    secondary: 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 focus:ring-slate-500',
    outline: 'bg-transparent border border-slate-300 text-slate-700 hover:bg-slate-50 focus:ring-slate-500',
    ghost: 'bg-transparent text-slate-700 hover:bg-slate-100 focus:ring-slate-500'
  };
  
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base'
  };

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
};

// ===== INPUT COMPONENT =====
interface LightModeInputProps {
  type?: string;
  placeholder?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  label?: string;
  helperText?: string;
  error?: string;
  className?: string;
}

export const LightModeInput: React.FC<LightModeInputProps> = ({
  type = 'text',
  placeholder,
  value,
  onChange,
  label,
  helperText,
  error,
  className = ''
}) => {
  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-slate-700">
          {label}
        </label>
      )}
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className={`w-full px-3 py-2 border rounded-lg text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-colors duration-200 ${
          error ? 'border-red-300' : 'border-slate-300'
        }`}
      />
      {helperText && !error && (
        <p className="text-sm text-slate-500">{helperText}</p>
      )}
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  );
};

// ===== BADGE COMPONENT =====
interface LightModeBadgeProps {
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  children: React.ReactNode;
}

export const LightModeBadge: React.FC<LightModeBadgeProps> = ({
  variant = 'default',
  size = 'md',
  className = '',
  children
}) => {
  const baseClasses = 'inline-flex items-center rounded-full font-medium';
  
  const variantClasses = {
    default: 'bg-slate-100 text-slate-800',
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    error: 'bg-red-100 text-red-800',
    info: 'bg-blue-100 text-blue-800'
  };
  
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
    lg: 'px-3 py-1.5 text-sm'
  };

  return (
    <span className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}>
      {children}
    </span>
  );
};

// ===== MODAL COMPONENT =====
interface LightModeModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  children: React.ReactNode;
}

export const LightModeModal: React.FC<LightModeModalProps> = ({
  isOpen,
  onClose,
  title,
  size = 'md',
  className = '',
  children
}) => {
  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl'
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className={`relative bg-white rounded-xl shadow-2xl ${sizeClasses[size]} ${className}`}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors duration-200"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {/* Content */}
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
};

// ===== TABLE COMPONENTS =====
export const LightModeTable: React.FC<{ children: React.ReactNode; className?: string }> = ({ 
  children, 
  className = '' 
}) => (
  <div className={`overflow-x-auto ${className}`}>
    <table className="w-full border-collapse">
      {children}
    </table>
  </div>
);

export const LightModeTableHeader: React.FC<{ children: React.ReactNode; className?: string }> = ({ 
  children, 
  className = '' 
}) => (
  <thead className={`bg-slate-50 ${className}`}>
    {children}
  </thead>
);

export const LightModeTableRow: React.FC<{ children: React.ReactNode; className?: string }> = ({ 
  children, 
  className = '' 
}) => (
  <tr className={`border-b border-slate-200 hover:bg-slate-50 transition-colors duration-200 ${className}`}>
    {children}
  </tr>
);

export const LightModeTableCell: React.FC<{ children: React.ReactNode; className?: string }> = ({ 
  children, 
  className = '' 
}) => (
  <td className={`px-4 py-3 text-slate-700 ${className}`}>
    {children}
  </td>
);

export const LightModeTableHeaderCell: React.FC<{ children: React.ReactNode; className?: string }> = ({ 
  children, 
  className = '' 
}) => (
  <th className={`px-4 py-3 text-left text-sm font-semibold text-slate-900 uppercase tracking-wider ${className}`}>
    {children}
  </th>
);

// ===== ALERT COMPONENT =====
interface LightModeAlertProps {
  type: 'success' | 'error' | 'warning' | 'info';
  title?: string;
  children: React.ReactNode;
  onClose?: () => void;
  className?: string;
}

export const LightModeAlert: React.FC<LightModeAlertProps> = ({
  type,
  title,
  children,
  onClose,
  className = ''
}) => {
  const typeClasses = {
    success: 'bg-green-50 border-green-200 text-green-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800'
  };

  const iconClasses = {
    success: 'text-green-400',
    error: 'text-red-400',
    warning: 'text-yellow-400',
    info: 'text-blue-400'
  };

  return (
    <div className={`border rounded-lg p-4 ${typeClasses[type]} ${className}`}>
      <div className="flex">
        <div className="flex-shrink-0">
          {/* Icon based on type */}
          <svg className={`h-5 w-5 ${iconClasses[type]}`} viewBox="0 0 20 20" fill="currentColor">
            {type === 'success' && (
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            )}
            {type === 'error' && (
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            )}
            {type === 'warning' && (
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            )}
            {type === 'info' && (
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            )}
          </svg>
        </div>
        <div className="ml-3 flex-1">
          {title && (
            <h3 className="text-sm font-medium">{title}</h3>
          )}
          <div className="text-sm">{children}</div>
        </div>
        {onClose && (
          <div className="ml-auto pl-3">
            <button
              onClick={onClose}
              className="inline-flex text-slate-400 hover:text-slate-600 transition-colors duration-200"
            >
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// ===== TOOLTIP COMPONENT =====
interface LightModeTooltipProps {
  content: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  children: React.ReactNode;
  className?: string;
}

export const LightModeTooltip: React.FC<LightModeTooltipProps> = ({
  content,
  position = 'top',
  children,
  className = ''
}) => {
  const positionClasses = {
    top: 'bottom-full left-1/2 transform -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 transform -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 transform -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 transform -translate-y-1/2 ml-2'
  };

  return (
    <div className={`relative group ${className}`}>
      {children}
      <div className={`absolute ${positionClasses[position]} z-50 px-2 py-1 text-xs text-white bg-slate-900 rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap`}>
        {content}
        <div className={`absolute ${position === 'top' ? 'top-full' : position === 'bottom' ? 'bottom-full' : position === 'left' ? 'left-full' : 'right-full'} left-1/2 transform -translate-x-1/2 w-0 h-0 border-4 border-transparent ${
          position === 'top' ? 'border-t-slate-900' : 
          position === 'bottom' ? 'border-b-slate-900' : 
          position === 'left' ? 'border-l-slate-900' : 
          'border-r-slate-900'
        }`} />
      </div>
    </div>
  );
};

// ===== DROPDOWN COMPONENT =====
interface LightModeDropdownProps {
  options: Array<{ value: string; label: string }>;
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export const LightModeDropdown: React.FC<LightModeDropdownProps> = ({
  options,
  value,
  onChange,
  placeholder = 'Select an option',
  className = ''
}) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const selectedOption = options.find(option => option.value === value);

  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3 py-2 text-left bg-white border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-colors duration-200"
      >
        <span className={selectedOption ? 'text-slate-900' : 'text-slate-500'}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <svg className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      
      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-slate-300 rounded-lg shadow-lg">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
              className="w-full px-3 py-2 text-left text-slate-700 hover:bg-slate-50 focus:bg-slate-50 focus:outline-none transition-colors duration-200"
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// ===== PROGRESS COMPONENT =====
interface LightModeProgressProps {
  value: number;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'success' | 'warning' | 'error';
  showLabel?: boolean;
  className?: string;
}

export const LightModeProgress: React.FC<LightModeProgressProps> = ({
  value,
  max = 100,
  size = 'md',
  variant = 'default',
  showLabel = false,
  className = ''
}) => {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
  
  const sizeClasses = {
    sm: 'h-2',
    md: 'h-3',
    lg: 'h-4'
  };
  
  const variantClasses = {
    default: 'bg-red-500',
    success: 'bg-green-500',
    warning: 'bg-yellow-500',
    error: 'bg-red-600'
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {showLabel && (
        <div className="flex justify-between text-sm">
          <span className="text-slate-700">Progress</span>
          <span className="text-slate-500">{Math.round(percentage)}%</span>
        </div>
      )}
      <div className={`w-full bg-slate-200 rounded-full overflow-hidden ${sizeClasses[size]}`}>
        <div
          className={`h-full rounded-full transition-all duration-300 ease-out ${variantClasses[variant]}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

// ===== SKELETON COMPONENTS =====
export const LightModeSkeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`animate-pulse bg-slate-200 rounded ${className}`} />
);

export const LightModeSkeletonText: React.FC<{ lines?: number; className?: string }> = ({ 
  lines = 3, 
  className = '' 
}) => (
  <div className={`space-y-2 ${className}`}>
    {Array.from({ length: lines }).map((_, i) => (
      <LightModeSkeleton
        key={i}
        className={`h-4 ${i === lines - 1 ? 'w-3/4' : 'w-full'}`}
      />
    ))}
  </div>
);

export const LightModeSkeletonAvatar: React.FC<{ size?: 'sm' | 'md' | 'lg'; className?: string }> = ({ 
  size = 'md', 
  className = '' 
}) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16'
  };
  
  return (
    <LightModeSkeleton className={`rounded-full ${sizeClasses[size]} ${className}`} />
  );
};

export const LightModeSkeletonCard: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`p-6 space-y-4 ${className}`}>
    <div className="flex items-center space-x-4">
      <LightModeSkeletonAvatar size="md" />
      <div className="space-y-2 flex-1">
        <LightModeSkeleton className="h-4 w-1/3" />
        <LightModeSkeleton className="h-3 w-1/2" />
      </div>
    </div>
    <LightModeSkeletonText lines={2} />
    <div className="flex space-x-2">
      <LightModeSkeleton className="h-8 w-20" />
      <LightModeSkeleton className="h-8 w-24" />
    </div>
  </div>
);

export const LightModeSkeletonTable: React.FC<{ rows?: number; columns?: number; className?: string }> = ({ 
  rows = 5, 
  columns = 4, 
  className = '' 
}) => (
  <div className={`space-y-3 ${className}`}>
    {/* Header */}
    <div className="flex space-x-4">
      {Array.from({ length: columns }).map((_, i) => (
        <LightModeSkeleton key={i} className="h-4 flex-1" />
      ))}
    </div>
    {/* Rows */}
    {Array.from({ length: rows }).map((_, rowIndex) => (
      <div key={rowIndex} className="flex space-x-4">
        {Array.from({ length: columns }).map((_, colIndex) => (
          <LightModeSkeleton key={colIndex} className="h-4 flex-1" />
        ))}
      </div>
    ))}
  </div>
);

// ===== ACCORDION COMPONENTS =====
interface LightModeAccordionProps {
  items: Array<{ title: string; content: React.ReactNode }>;
  className?: string;
}

export const LightModeAccordion: React.FC<LightModeAccordionProps> = ({ 
  items, 
  className = '' 
}) => {
  const [openIndex, setOpenIndex] = React.useState<number | null>(null);

  return (
    <div className={`space-y-2 ${className}`}>
      {items.map((item, index) => (
        <LightModeAccordionItem
          key={index}
          title={item.title}
          content={item.content}
          isOpen={openIndex === index}
          onToggle={() => setOpenIndex(openIndex === index ? null : index)}
        />
      ))}
    </div>
  );
};

interface LightModeAccordionItemProps {
  title: string;
  content: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
}

const LightModeAccordionItem: React.FC<LightModeAccordionItemProps> = ({
  title,
  content,
  isOpen,
  onToggle
}) => (
  <div className="border border-slate-200 rounded-lg">
    <button
      onClick={onToggle}
      className="w-full px-4 py-3 text-left flex items-center justify-between hover:bg-slate-50 transition-colors duration-200"
    >
      <span className="font-medium text-slate-900">{title}</span>
      <svg
        className={`w-5 h-5 text-slate-500 transform transition-transform duration-200 ${
          isOpen ? 'rotate-180' : ''
        }`}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    </button>
    {isOpen && (
      <div className="px-4 pb-3 text-slate-600">
        {content}
      </div>
    )}
  </div>
);

// ===== TABS COMPONENT =====
interface LightModeTabsProps {
  tabs: Array<{ id: string; label: string; content: React.ReactNode }>;
  variant?: 'default' | 'pills' | 'underline';
  className?: string;
}

export const LightModeTabs: React.FC<LightModeTabsProps> = ({ 
  tabs, 
  variant = 'default', 
  className = '' 
}) => {
  const [activeTab, setActiveTab] = React.useState(tabs[0]?.id);

  const variantClasses = {
    default: 'border-b border-slate-200',
    pills: 'space-x-1',
    underline: 'border-b border-slate-200'
  };

  const tabClasses = {
    default: 'px-4 py-2 border-b-2 font-medium text-sm transition-colors duration-200',
    pills: 'px-3 py-2 rounded-lg font-medium text-sm transition-colors duration-200',
    underline: 'px-4 py-2 border-b-2 font-medium text-sm transition-colors duration-200'
  };

  const activeClasses = {
    default: 'border-red-500 text-red-600',
    pills: 'bg-red-500 text-white',
    underline: 'border-red-500 text-red-600'
  };

  const inactiveClasses = {
    default: 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300',
    pills: 'text-slate-500 hover:text-slate-700 hover:bg-slate-100',
    underline: 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
  };

  return (
    <div className={className}>
      <div className={`flex ${variantClasses[variant]}`}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`${tabClasses[variant]} ${
              activeTab === tab.id ? activeClasses[variant] : inactiveClasses[variant]
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="mt-4">
        {tabs.find(tab => tab.id === activeTab)?.content}
      </div>
    </div>
  );
};

// ===== BREADCRUMB COMPONENT =====
interface LightModeBreadcrumbProps {
  items: Array<{ label: string; href?: string }>;
  showHome?: boolean;
  className?: string;
}

export const LightModeBreadcrumb: React.FC<LightModeBreadcrumbProps> = ({ 
  items, 
  showHome = true, 
  className = '' 
}) => {
  const allItems = showHome 
    ? [{ label: 'Home', href: '/' }, ...items]
    : items;

  return (
    <nav className={`flex ${className}`} aria-label="Breadcrumb">
      <ol className="flex items-center space-x-2">
        {allItems.map((item, index) => (
          <li key={index} className="flex items-center">
            {index > 0 && (
              <svg className="w-4 h-4 text-slate-400 mx-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            )}
            {item.href ? (
              <a
                href={item.href}
                className="text-sm text-slate-500 hover:text-red-500 transition-colors duration-200"
              >
                {item.label}
              </a>
            ) : (
              <span className="text-sm text-slate-900 font-medium">
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
};

// ===== PAGINATION COMPONENT =====
interface LightModePaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  showPageNumbers?: boolean;
  className?: string;
}

export const LightModePagination: React.FC<LightModePaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  showPageNumbers = true,
  className = ''
}) => {
  const getVisiblePages = () => {
    const delta = 2;
    const range = [];
    const rangeWithDots = [];

    for (let i = Math.max(2, currentPage - delta); i <= Math.min(totalPages - 1, currentPage + delta); i++) {
      range.push(i);
    }

    if (currentPage - delta > 2) {
      rangeWithDots.push(1, '...');
    } else {
      rangeWithDots.push(1);
    }

    rangeWithDots.push(...range);

    if (currentPage + delta < totalPages - 1) {
      rangeWithDots.push('...', totalPages);
    } else {
      rangeWithDots.push(totalPages);
    }

    return rangeWithDots;
  };

  return (
    <div className={`flex items-center justify-center space-x-1 ${className}`}>
      {/* Previous Button */}
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="px-3 py-2 text-sm font-medium text-slate-500 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 hover:text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
      >
        Previous
      </button>

      {/* Page Numbers */}
      {showPageNumbers && (
        <div className="flex space-x-1">
          {getVisiblePages().map((page, index) => (
            <button
              key={index}
              onClick={() => typeof page === 'number' && onPageChange(page)}
              disabled={page === '...'}
              className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
                page === currentPage
                  ? 'bg-red-500 text-white border border-red-500'
                  : page === '...'
                  ? 'text-slate-400 cursor-default'
                  : 'text-slate-700 bg-white border border-slate-300 hover:bg-slate-50'
              }`}
            >
              {page}
            </button>
          ))}
        </div>
      )}

      {/* Next Button */}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="px-3 py-2 text-sm font-medium text-slate-500 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 hover:text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
      >
        Next
      </button>
    </div>
  );
};
