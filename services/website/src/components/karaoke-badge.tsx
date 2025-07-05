import { Component, createSignal, Show } from 'solid-js';
import { isServer } from 'solid-js/web';


export type KaraokeMachine = 'tj'|'ky'|'ebo'|'joysound';

interface KaraokeBadgeProps {
  machine: KaraokeMachine;
  id: string;
  size?: 'sm' | 'md' | 'lg';
  showCopyFeedback?: boolean;
}

const KaraokeBadge: Component<KaraokeBadgeProps> = (props) => {
  const [copied, setCopied] = createSignal(false);
  
  const getMachineColors = (machine: KaraokeMachine) => {
    switch (machine) {
      case 'tj':
        return {
          bg: 'bg-tj-500',
          bgLight: 'bg-tj-50',
          text: 'text-white',
          textDark: 'text-tj-800',
          name: 'TJ Media'
        };
      case 'ky':
        return {
          bg: 'bg-ky-500',
          bgLight: 'bg-ky-50',
          text: 'text-white',
          textDark: 'text-ky-800',
          name: 'Kumyoung'
        };
      case 'joysound':
        return {
          bg: 'bg-joysound-500',
          bgLight: 'bg-joysound-50',
          text: 'text-white',
          textDark: 'text-joysound-800',
          name: 'Joysound'
        };
      case 'ebo':
        return {
          bg: 'bg-ebo-500',
          bgLight: 'bg-ebo-50',
          text: 'text-white',
          textDark: 'text-ebo-800',
          name: 'EBO'
        };
      default:
        return {
          bg: 'bg-gray-600',
          bgLight: 'bg-gray-50',
          text: 'text-white',
          textDark: 'text-gray-800',
          name: 'Unknown'
        };
    }
  };
  
  const getSizeClasses = () => {
    switch (props.size || 'md') {
      case 'sm':
        return 'text-xs h-5';
      case 'lg':
        return 'text-sm h-7';
      default:
        return 'text-xs h-6';
    }
  };

  const copyToClipboard = async (event: Event) => {
    event.preventDefault();
    event.stopPropagation();
    
    if (isServer) return;
    
    try {
      await navigator.clipboard.writeText(props.id);
      
      if (props.showCopyFeedback !== false) {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  const colors = getMachineColors(props.machine);

  console.log(colors)

  return (
    <button
      onClick={copyToClipboard}
      class={`
        inline-flex items-center font-mono transition-all duration-200 
        ${getSizeClasses()} rounded-md overflow-hidden cursor-pointer
        hover:scale-105 hover:shadow-lg active:scale-95 border border-gray-200
        ${copied() ? 'animate-pulse' : ''}
      `}
      title={`Click to copy ${colors.name} ID: ${props.id}`}
    >
      {/* Left side - Machine name */}
      <div class={`
        px-2 flex items-center justify-center font-semibold
        ${colors.bg} ${colors.text}
        transition-colors duration-200
      `}>
        {colors.name}
      </div>
      
      {/* Right side - ID */}
      <div class={`
        px-2 flex items-center justify-center font-mono
        ${colors.bgLight} ${colors.textDark} border-l border-white/30
        transition-colors duration-200
      `}>
        {copied() ? '✓ Copied!' : props.id}
      </div>
    </button>
  );
};

export default KaraokeBadge; 
