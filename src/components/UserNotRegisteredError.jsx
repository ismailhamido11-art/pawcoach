import React from 'react';
import { base44 } from '@/api/base44Client';

const UserNotRegisteredError = () => {
  const handleLogout = async () => {
    try {
      await base44.auth.logout();
    } catch (e) {
      console.error('Logout error:', e);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-white to-muted">
      <div className="max-w-md w-full p-8 bg-white rounded-lg shadow-lg border border-border">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 mb-6 rounded-full bg-amber-100">
            <svg className="w-8 h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-4">Acces non autorise</h1>
          <p className="text-muted-foreground mb-8">
            Ton compte n'est pas inscrit sur cette application. Contacte l'administrateur pour obtenir un acces.
          </p>
          <div className="p-4 bg-muted rounded-md text-sm text-muted-foreground mb-6">
            <p>Si tu penses que c'est une erreur, tu peux :</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Verifier que tu es connecte avec le bon compte</li>
              <li>Contacter l'administrateur de l'application</li>
              <li>Te deconnecter puis te reconnecter</li>
            </ul>
          </div>
          <button
            onClick={handleLogout}
            className="w-full h-12 rounded-xl bg-foreground text-background font-semibold text-sm hover:opacity-90 transition-opacity"
          >
            Se deconnecter
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserNotRegisteredError;
