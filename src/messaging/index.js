// src/messaging/index.js
// Point d'entrée unifié pour tous les composants de messagerie

// Composants principaux
export { default as MessagingButton } from './components/MessagingButton';
export { default as MessagingWidget } from './components/MessagingWidget';
export { default as ChatMessage } from './components/chatMessage';

// Service de signalisation supprimé - WebRTC géré côté serveur

// Types et utilitaires (si nécessaire)
export const MESSAGING_TYPES = {
  PATIENT_MEDECIN: 'patient_medecin',
  PRIVATE: 'private',
  GROUP: 'group'
};

export const MESSAGE_TYPES = {
  TEXT: 'texte',
  IMAGE: 'image',
  FILE: 'file',
  AUDIO: 'audio'
};
