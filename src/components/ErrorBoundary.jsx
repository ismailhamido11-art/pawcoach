import { Component } from 'react';

/**
 * ErrorBoundary — isole les crashs React par page.
 * Doit rester un class component (componentDidCatch n'existe pas en hooks).
 *
 * Props :
 *   fallback   — JSX custom à afficher en cas d'erreur (optionnel)
 *   onError    — callback(error, errorInfo) appelé lors du crash (optionnel)
 *   children
 */
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
    this.handleRetry = this.handleRetry.bind(this);
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[PawCoach] Erreur capturée par ErrorBoundary :', error, errorInfo);
    if (typeof this.props.onError === 'function') {
      this.props.onError(error, errorInfo);
    }
  }

  handleRetry() {
    // Tenter une reprise douce : reset de l'état d'erreur.
    // Si l'erreur persiste, React re-plantera et on restera sur le fallback.
    this.setState({ hasError: false, error: null });
  }

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    // Fallback custom fourni par le parent
    if (this.props.fallback) {
      return this.props.fallback;
    }

    // Fallback par défaut — style Nature Premium PawCoach
    return (
      <div
        style={{
          minHeight: '100dvh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem',
          backgroundColor: 'hsl(37, 33%, 95%)', // cream
          textAlign: 'center',
          gap: '1.5rem',
        }}
      >
        {/* Icône patte SVG */}
        <svg
          viewBox="0 0 24 28"
          style={{ width: '56px', height: '56px', color: '#1A4D3E', opacity: 0.35 }}
          fill="currentColor"
          aria-hidden="true"
        >
          <ellipse cx="6.5" cy="4.5" rx="3" ry="3.5" />
          <ellipse cx="12" cy="2.5" rx="2.8" ry="3" />
          <ellipse cx="17.5" cy="4.5" rx="3" ry="3.5" />
          <ellipse cx="12" cy="16" rx="6.5" ry="7" />
          <ellipse cx="4" cy="10.5" rx="2.5" ry="3" />
          <ellipse cx="20" cy="10.5" rx="2.5" ry="3" />
        </svg>

        <div style={{ maxWidth: '280px' }}>
          <p
            style={{
              fontWeight: 700,
              fontSize: '1.125rem',
              color: '#1A4D3E', // forest green
              marginBottom: '0.5rem',
              lineHeight: 1.35,
            }}
          >
            Quelque chose s'est mal passé
          </p>
          <p
            style={{
              fontSize: '0.875rem',
              color: '#4a5568',
              lineHeight: 1.5,
            }}
          >
            Cette section a rencontré une erreur. Le reste de l'app fonctionne normalement.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          {/* Bouton principal : réessayer sans recharger */}
          <button
            onClick={this.handleRetry}
            style={{
              backgroundColor: '#2D9F82', // emerald
              color: '#ffffff',
              border: 'none',
              borderRadius: '9999px',
              padding: '0.625rem 1.5rem',
              fontSize: '0.9rem',
              fontWeight: 600,
              cursor: 'pointer',
              minHeight: '44px', // tap target WCAG
            }}
          >
            Réessayer
          </button>

          {/* Bouton secondaire : retour à l'accueil */}
          <button
            onClick={() => { window.location.href = '/'; }}
            style={{
              backgroundColor: 'transparent',
              color: '#1A4D3E',
              border: '1.5px solid #1A4D3E',
              borderRadius: '9999px',
              padding: '0.625rem 1.5rem',
              fontSize: '0.9rem',
              fontWeight: 600,
              cursor: 'pointer',
              minHeight: '44px',
            }}
          >
            Retour à l'accueil
          </button>
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;
