import React, { createContext, useState, useContext, useCallback } from 'react';
import PasswordPrompt from '../components/PasswordPrompt';
import api from '../utils/api';
import useJournalPasswordStore from '../stores/journalPasswordStore';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from 'react-query';
import toast from 'react-hot-toast';

const PasswordPromptContext = createContext();

export const usePasswordPrompt = () => useContext(PasswordPromptContext);

export const PasswordPromptProvider = ({ children }) => {
  const [promptState, setPromptState] = useState({ isOpen: false, journalId: null, action: null });
  const { addPassword } = useJournalPasswordStore();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Remove the separate delete mutation as it's now handled in verifyPasswordMutation

  const verifyPasswordMutation = useMutation(
    ({ journalId, password, action }) => api.post(`/journal/${journalId}/verify-password`, { password, action }),
    {
      onSuccess: (data, variables) => {
        const { journalId, action, password } = variables;
        addPassword(journalId, password);
        
        if (data.data.deleted) {
          toast.success('Journal entry deleted successfully!');
          queryClient.invalidateQueries('journals');
          queryClient.removeQueries(['journal', journalId]);
          navigate('/journal');
        } else {
          toast.success('Password verified!');
          
          switch (action) {
            case 'view':
              navigate(`/journal/${journalId}`);
              break;
            case 'edit':
              navigate(`/journal/${journalId}/edit`);
              break;
            default:
              break;
          }
        }
        closePrompt();
      },
      onError: (error) => {
        const errorData = error.response?.data;
        if (errorData?.attemptsExceeded) {
          toast.error(errorData.message, { duration: 6000 });
          // Log out user after 3 failed attempts
          setTimeout(() => {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
          }, 3000); // Give user time to read the message
        } else if (errorData?.remainingAttempts !== undefined) {
          toast.error(errorData.message, { duration: 4000 });
          // Keep the modal open for retry
        } else {
          toast.error(errorData?.message || 'Invalid password.');
        }
      },
    }
  );

  const promptForPassword = useCallback((journalId, action) => {
    setPromptState({ isOpen: true, journalId, action });
  }, []);

  const closePrompt = () => {
    setPromptState({ isOpen: false, journalId: null, action: null });
  };

  const handleVerify = (password) => {
    if (promptState.journalId) {
      verifyPasswordMutation.mutate({ 
        journalId: promptState.journalId, 
        action: promptState.action, 
        password 
      });
    }
  };

  return (
    <PasswordPromptContext.Provider value={{ promptForPassword }}>
      {children}
      <PasswordPrompt
        isOpen={promptState.isOpen}
        onClose={closePrompt}
        onSubmit={handleVerify}
        isLoading={verifyPasswordMutation.isLoading}
        title={`Password Required - ${promptState.action ? promptState.action.charAt(0).toUpperCase() + promptState.action.slice(1) : 'Access'}`}
        message={`Enter the password to ${promptState.action || 'access'} this protected journal entry.`}
      />
    </PasswordPromptContext.Provider>
  );
};
