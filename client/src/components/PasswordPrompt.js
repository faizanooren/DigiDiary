import React, { useState } from 'react';
import { Lock, Eye, EyeOff, Loader2 } from 'lucide-react';
import './PasswordPrompt.css';

const PasswordPrompt = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  title = "Enter Password", 
  message = "This journal is password protected. Please enter the password to continue.",
  isLoading = false 
}) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (password.trim()) {
      onSubmit(password);
    }
  };

  const handleClose = () => {
    setPassword('');
    setShowPassword(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="password-prompt-overlay">
      <div className="password-prompt-modal">
        <div className="password-prompt-header">
          <div className="password-prompt-icon">
            <Lock size={24} />
          </div>
          <h3>{title}</h3>
          <button 
            className="close-button" 
            onClick={handleClose}
            disabled={isLoading}
          >
            ×
          </button>
        </div>

        <div className="password-prompt-body">
          <p>{message}</p>
          
          <form onSubmit={handleSubmit} className="password-form">
            <div className="password-input-group">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="password-input"
                disabled={isLoading}
                autoFocus
              />
              <button
                type="button"
                className="toggle-password"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isLoading}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            <div className="password-prompt-actions">
              <button
                type="button"
                className="cancel-button"
                onClick={handleClose}
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="submit-button"
                disabled={!password.trim() || isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="loading-spinner" size={16} />
                    Verifying...
                  </>
                ) : (
                  'Access'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PasswordPrompt;
