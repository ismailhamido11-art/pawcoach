import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export default function Terms() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b border-border px-4 pb-3 flex items-center gap-3" style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 0.75rem)" }}>
        <button aria-label="Retour" onClick={() => navigate(-1)} className="p-2 -ml-2">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <h1 className="text-lg font-bold text-foreground">Conditions d'utilisation</h1>
      </div>

      {/* Content */}
      <div className="px-5 py-6 max-w-prose mx-auto space-y-6" style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>

        <section className="space-y-2">
          <h2 className="text-base font-semibold text-foreground">1. Acceptation des conditions</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            En utilisant PawCoach, vous acceptez les présentes Conditions Générales d'Utilisation (CGU). Si vous n'acceptez pas ces conditions, veuillez ne pas utiliser l'application.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold text-foreground">2. Description du service</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            PawCoach est une application de coaching bien-être canin. Elle fournit des conseils personnalisés basés sur les données de votre chien. PawCoach n'est pas un service vétérinaire et ne se substitue en aucun cas à un vétérinaire qualifié.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold text-foreground">3. Compte utilisateur</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Un seul compte est autorisé par adresse email. Vous êtes responsable de la confidentialité de vos identifiants de connexion et de toutes les actions effectuées depuis votre compte.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold text-foreground">4. Abonnement Premium</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            L'abonnement Premium est proposé aux tarifs suivants :
          </p>
          <ul className="text-sm text-muted-foreground leading-relaxed list-disc pl-5 space-y-1">
            <li><strong>Mensuel</strong> : 7,99 EUR/mois</li>
            <li><strong>Annuel</strong> : 59,99 EUR/an</li>
          </ul>
          <p className="text-sm text-muted-foreground leading-relaxed">
            La facturation est gérée par Stripe, partenaire de paiement sécurisé. Renouvellement automatique activé par défaut. Vous pouvez résilier à tout moment depuis l'application (Profil &gt; Réglages &gt; Gérer mon abonnement), sans frais de résiliation.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold text-foreground">5. Essai gratuit</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Un essai gratuit de 7 jours est offert aux nouveaux utilisateurs. À la fin de la période d'essai, l'accès Premium expire et le compte revient en mode gratuit. Pour continuer à bénéficier de Premium, un abonnement doit être souscrit.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold text-foreground">6. Contenu généré par l'IA</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Les conseils et recommandations générés par l'IA de PawCoach sont fournis à titre informatif uniquement. Ils ne remplacent pas un diagnostic ou un avis vétérinaire professionnel. En cas de doute sur la santé de votre chien, consultez un vétérinaire.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold text-foreground">7. Propriété intellectuelle</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Le contenu, le design et les fonctionnalités de PawCoach sont protégés par les lois sur la propriété intellectuelle. Les données que vous saisissez dans l'application restent votre propriété. Vous nous accordez une licence limitée pour les traiter dans le cadre du service.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold text-foreground">8. Limitation de responsabilité</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            PawCoach ne peut être tenu responsable des décisions médicales ou de soins prises sur la base des conseils générés par l'application. L'utilisation des recommandations de PawCoach se fait sous votre entière responsabilité.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold text-foreground">9. Loi applicable</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Les présentes CGU sont soumises au droit français. En cas de litige, le tribunal compétent sera celui de Paris, sauf disposition légale contraire.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold text-foreground">10. Contact</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Pour toute question relative aux présentes CGU : <span className="text-primary">support@pawcoach.app</span>
          </p>
        </section>

      </div>
    </div>
  );
}
