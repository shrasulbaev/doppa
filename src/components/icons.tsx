// Иконки Doppa: пиала (серия), гранат (жизни), абрикос (опыт) и служебные значки.
import { SvgXml } from 'react-native-svg';

type Props = { size?: number; color?: string };

const stroke = (d: string, w = 2.4) => (c: string) =>
  `<svg viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;

const xml = {
  piala: '<svg viewBox="0 0 24 24"><path d="M9 8q-1.6-2 0-4M13 8q-1.6-2 0-4" fill="none" stroke="#8A9AAB" stroke-width="1.6" stroke-linecap="round"/><path d="M2.5 10h19a9.5 8 0 0 1-19 0z" fill="#1872B8"/><path d="M4 12.5h16" stroke="#FFFFFF" stroke-width="1.4" stroke-dasharray="1.5 2"/><rect x="9" y="18.6" width="6" height="2.4" rx="1.2" fill="#105A94"/></svg>',
  pomegranate: '<svg viewBox="0 0 24 24"><path d="M8.5 6.8L9.6 3l2.4 2.2L14.4 3l1.1 3.8z" fill="#8F2333"/><circle cx="12" cy="14" r="8.2" fill="#C8384A"/><circle cx="9" cy="11" r="2.2" fill="#FFFFFF" opacity=".35"/></svg>',
  apricot: '<svg viewBox="0 0 24 24"><circle cx="12" cy="14" r="8" fill="#F4A23C"/><path d="M12 6.5q-3.2 7.5 0 15.3" fill="none" stroke="#D9822B" stroke-width="1.5"/><path d="M12 6q3-3.5 7-2.5q-2.5 3.5-7 2.5z" fill="#57B36F"/><circle cx="8.6" cy="11.5" r="1.8" fill="#FFFFFF" opacity=".4"/></svg>',
  logo: '<svg viewBox="0 0 30 30"><rect x="0.75" y="0.75" width="28.5" height="28.5" rx="8" fill="#4FA0DC" stroke="#FFFFFF" stroke-width="1.5"/><circle cx="12.5" cy="15" r="8" fill="#FFFFFF"/><circle cx="15.2" cy="15" r="6.7" fill="#4FA0DC"/><polygon points="21.6,11.6 22.4,13.9 24.8,13.9 22.9,15.4 23.6,17.8 21.6,16.4 19.6,17.8 20.3,15.4 18.4,13.9 20.8,13.9" fill="#FFFFFF"/></svg>',
  star: (c: string) => `<svg viewBox="0 0 24 24"><path d="M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4l-5.9 3.1 1.2-6.5L2.5 9.4l6.6-.9z" fill="${c}"/></svg>`,
  close: stroke('<path d="M6 6l12 12M18 6L6 18"/>', 2.6),
  back: stroke('<path d="M15 5l-7 7 7 7"/>', 2.6),
  check: stroke('<path d="M5 12.5l4.5 4.5L19 7.5"/>', 3),
  lock: stroke('<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>'),
  speaker: (c: string) => `<svg viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9v6h4l5 4V5L8 9z" fill="${c}"/><path d="M16.5 8.5a5 5 0 0 1 0 7"/><path d="M19.5 5.5a9 9 0 0 1 0 13"/></svg>`,
  book: stroke('<path d="M2 4h7a3 3 0 0 1 3 3v13a2 2 0 0 0-2-2H2z"/><path d="M22 4h-7a3 3 0 0 0-3 3v13a2 2 0 0 1 2-2h8z"/>', 2.2),
  path: stroke('<circle cx="6" cy="19" r="2"/><circle cx="18" cy="5" r="2"/><path d="M8 19h7a3.5 3.5 0 0 0 0-7H9a3.5 3.5 0 0 1 0-7h7"/>', 2.2),
  chat: stroke('<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/>', 2.2),
};

const fixed = (key: 'piala' | 'pomegranate' | 'apricot' | 'logo') =>
  function FixedIcon({ size = 22 }: Props) {
    return <SvgXml xml={xml[key]} width={size} height={size} />;
  };
const tinted = (key: 'star' | 'close' | 'back' | 'check' | 'lock' | 'speaker' | 'book' | 'path' | 'chat') =>
  function TintedIcon({ size = 24, color = '#172636' }: Props) {
    return <SvgXml xml={xml[key](color)} width={size} height={size} />;
  };

export const PialaIcon = fixed('piala');
export const PomegranateIcon = fixed('pomegranate');
export const ApricotIcon = fixed('apricot');
export const LogoIcon = fixed('logo');
export const StarIcon = tinted('star');
export const CloseIcon = tinted('close');
export const BackIcon = tinted('back');
export const CheckIcon = tinted('check');
export const LockIcon = tinted('lock');
export const SpeakerIcon = tinted('speaker');
export const BookIcon = tinted('book');
export const PathIcon = tinted('path');
export const ChatIcon = tinted('chat');
