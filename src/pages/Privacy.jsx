import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export default function Privacy() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b border-border px-4 py-3 flex items-center gap-3">
        <button aria-label="Retour" onClick={() => navigate(-1)} className="p-2 -ml-2">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <h1 className="text-base font-bold text-foreground">Politique de confidentialité</h1>
      </div>

      {/* Content */}
      <div className="px-5 py-6 max-w-prose mx-auto space-y-6" style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-foreground">1. Responsable du traitement</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            PawCoach est le responsable du traitement de vos données personnelles. Pour toute question relative à vos données, contactez-nous à : <span className="text-primary">support@pawcoach.app</span>
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-foreground">2. Données collectées</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Nous collectons les données suivantes :
          </p>
          <ul className="text-sm text-muted-foreground leading-relaxed list-disc pl-5 space-y-1">
            <li>Informations de compte : adresse email, prénom</li>
            <li>Données de votre chien : race, poids, âge, état de santé, photos de profil</li>
            <li>Journaux quotidiens : repas, activités, symptômes, bien-être</li>
            <li>Scans alimentaires : photos et analyses nutritionnelles</li>
            <li>Checkins bien-être : humeur, comportement, signaux observés</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-foreground">3. Finalité du traitement</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Vos données sont utilisées pour :
          </p>
          <ul className="text-sm text-muted-foreground leading-relaxed list-disc pl-5 space-y-1">
            <li>Personnaliser les conseils IA de bien-être canin</li>
            <li>Assurer le suivi de santé de votre chien dans le temps</li>
            <li>Gérer votre abonnement et la facturation via Stripe</li>
            <li>Vous envoyer des rappels et notifications utiles</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-foreground">4. Durée de conservation</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Vos données sont conservées aussi longtemps que votre compte est actif. En cas de suppression de compte, toutes vos données sont effacées définitivement sous 30 jours. Vous pouvez demander la suppression à tout moment depuis Réglages ou en contactant <span className="text-primary">support@pawcoach.app</span>.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-foreground">5. Vos droits</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Conformément au RGPD, vous disposez des droits suivants :
          </p>
          <ul className="text-sm text-muted-foreground leading-relaxed list-disc pl-5 space-y-1">
            <li><strong>Accès</strong> : obtenir une copie de vos données</li>
            <li><strong>Rectification</strong> : corriger vos données inexactes</li>
            <li><strong>Effacement</strong> : supprimer votre compte et toutes vos données</li>
            <li><strong>Portabilité</strong> : exporter vos données au format JSON (disponible dans Réglages)</li>
            <li><strong>Opposition</strong> : vous opposer à certains traitements</li>
          </ul>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Pour exercer vos droits : <span className="text-primary">support@pawcoach.app</span>
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-foreground">6. Cookies et analytics</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            PawCoach n'utilise pas de cookies tiers à des fins publicitaires ou de tracking. Les événements d'utilisation sont stockés localement sur votre appareil (localStorage) et ne sont pas transmis à des tiers.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-foreground">7. Hébergement et sécurité</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Vos données sont hébergées sur les serveurs Base44 (infrastructure Supabase/AWS). Toutes les données sont chiffrées en transit (HTTPS/TLS) et au repos. Nous appliquons des mesures de sécurité techniques et organisationnelles conformes aux standards du secteur.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-foreground">8. Mise à jour</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Dernière mise à jour : 27 mars 2026. En cas de modification substantielle, vous serez informé par email ou notification dans l'application.
          </p>
        </section>

      </div>
    </div>
  );
}
