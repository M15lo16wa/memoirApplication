// src/messaging/components/chatMessage.js
import React, { useState } from "react";
import signalingService from '../../services/signalingService';

export default function ChatMessage() {
  const [isLoading, setIsLoading] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [userId, setUserId] = useState(null);
  const [userRole, setUserRole] = useState('patient');

  const loadUserConversations = async () => {
    try {
      setIsLoading(true);
      const result = await signalingService.getUserConversations();
      if (result.success) {
        setConversations(result.conversations);
      } else {
        console.error('Erreur lors du chargement des conversations:', result.error);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des conversations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const createNewConversation = async (toUserId) => {
    try {
      const result = await signalingService.createConversation({
        patient_id: userRole === 'patient' ? userId : toUserId,
        professionnel_id: userRole === 'medecin' ? userId : toUserId
      });
      if (result.success) {
        await loadUserConversations();
        setSelectedConversation(result.conversation.id);
      }
    } catch (error) {
      console.error('Erreur lors de la création de conversation:', error);
    }
  };

  // Rendu minimal pour éviter les erreurs de compilation
  return (
    <div>
      {isLoading ? "Chargement..." : null}
      <ul>
        {conversations.map(conv => (
          <li key={conv.id}>{conv.nom || conv.id}</li>
        ))}
      </ul>
      {selectedConversation && (
        <div>Conversation sélectionnée : {selectedConversation}</div>
      )}
    </div>
  );
}
