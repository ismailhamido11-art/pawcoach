import { useLocation } from 'react-router-dom';

export default function PageNotFound() {
    const location = useLocation();
    const pageName = location.pathname.substring(1);

    return (
        <div className="min-h-screen flex items-center justify-center p-6" style={{ background: 'linear-gradient(160deg, #f0fdf4, #ecfdf5, #f8faf9)' }}>
            <div className="max-w-md w-full">
                <div className="text-center space-y-6">
                    <div className="text-6xl mb-2">🐾</div>

                    <div className="space-y-2">
                        <h1 className="text-6xl font-light" style={{ color: '#2d8a70' }}>404</h1>
                        <div className="h-0.5 w-16 mx-auto" style={{ backgroundColor: '#2d8a7040' }}></div>
                    </div>

                    <div className="space-y-3">
                        <h2 className="text-2xl font-semibold text-slate-800">
                            Page introuvable
                        </h2>
                        <p className="text-slate-500 leading-relaxed text-sm">
                            La page <span className="font-medium text-slate-700">"{pageName}"</span> n'existe pas ou a été déplacée.
                        </p>
                    </div>

                    <div className="pt-4">
                        <button
                            onClick={() => window.location.href = '/Home'}
                            className="inline-flex items-center px-5 py-2.5 text-sm font-semibold text-white rounded-xl shadow-md transition-all duration-200 hover:shadow-lg active:scale-95"
                            style={{ background: 'linear-gradient(135deg, #2d8a70, #1a6b52)' }}
                        >
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                            </svg>
                            Retour à l'accueil
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}