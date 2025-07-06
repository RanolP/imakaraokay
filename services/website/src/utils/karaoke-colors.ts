import type { KaraokeMachine } from '../styles/karaokeColors';

/**
 * Get the background color class for a karaoke machine chip
 */
export const getKaraokeChipBgColor = (machine: KaraokeMachine): string => {
  switch (machine) {
    case 'tj':
      return 'bg-tj-50';
    case 'ky':
      return 'bg-ky-50';
    case 'ebo':
      return 'bg-ebo-50';
    case 'joysound':
      return 'bg-joysound-50';
    default:
      return 'bg-gray-50';
  }
};

/**
 * Get the text color class for a karaoke machine chip
 */
export const getKaraokeChipTextColor = (machine: KaraokeMachine): string => {
  switch (machine) {
    case 'tj':
      return 'text-tj-800';
    case 'ky':
      return 'text-ky-800';
    case 'ebo':
      return 'text-ebo-800';
    case 'joysound':
      return 'text-joysound-800';
    default:
      return 'text-gray-800';
  }
};

/**
 * Get the button/action color classes for a karaoke machine
 */
export const getKaraokeButtonColors = (
  machine: KaraokeMachine
): { bg: string; hover: string; text: string } => {
  switch (machine) {
    case 'tj':
      return {
        bg: 'bg-tj-600',
        hover: 'hover:bg-tj-700',
        text: 'text-white',
      };
    case 'ky':
      return {
        bg: 'bg-ky-600',
        hover: 'hover:bg-ky-700',
        text: 'text-white',
      };
    case 'ebo':
      return {
        bg: 'bg-ebo-600',
        hover: 'hover:bg-ebo-700',
        text: 'text-white',
      };
    case 'joysound':
      return {
        bg: 'bg-joysound-600',
        hover: 'hover:bg-joysound-700',
        text: 'text-white',
      };
    default:
      return {
        bg: 'bg-gray-600',
        hover: 'hover:bg-gray-700',
        text: 'text-white',
      };
  }
};

/**
 * Get the machine display name
 */
export const getKaraokeMachineName = (machine: KaraokeMachine): string => {
  switch (machine) {
    case 'tj':
      return 'TJ Media';
    case 'ky':
      return 'Kumyoung';
    case 'ebo':
      return 'EBO';
    case 'joysound':
      return 'Joysound';
    default:
      return 'Unknown';
  }
};

/**
 * Get all color classes for a karaoke machine in one object
 */
export const getKaraokeColors = (machine: KaraokeMachine) => {
  return {
    chipBg: getKaraokeChipBgColor(machine),
    chipText: getKaraokeChipTextColor(machine),
    button: getKaraokeButtonColors(machine),
    machineName: getKaraokeMachineName(machine),
  };
};
