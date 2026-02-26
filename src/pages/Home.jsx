import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import WellnessBanner from "../components/WellnessBanner";
import BottomNav from "../components/BottomNav";
import { BookHeart, ChevronRight, Activity, Stethoscope, UserCircle } from "lucide-react";

export default function Home() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [dog, setDog] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const u = await base44.auth.me();
        setUser(u);
        const dogs = await base44.entities.Dog.filter({ owner: u.email });
        if (dogs && dogs.length > 0) {
          setDog(dogs[0]);
        } else {
          // Si pas de chien, on renvoie vers l'onboarding
          navigate(createPageUrl("Onboarding"));
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary/40 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24 relative">
      <WellnessBanner />
      
      {/* Bouton Profil en haut à droite */}
      <Link 
        to={createPageUrl("Profile")} 
        className="absolute top-16 right-6 p-2 rounded-full bg-white shadow-sm border border-border text-muted-foreground hover:text-primary transition-colors z-10"
      >
        <UserCircle className="w-6 h-6" />
      </Link>

      <div className="pt-24 px-6">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">
            Bonjour, {user?.full_name?.split(" ")[0] || "l'ami"} 👋
          </h1>
          <p className="text-muted-foreground mt-1">
            Voici le tableau de bord de {dog?.name || "votre chien"}
          </p>
        </header>

        {dog && (
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-border/50 mb-8 flex items-center gap-6 relative overflow-hidden">
            {/* Arrière-plan stylisé */}
            <div className="absolute -right-6 -top-6 w-32 h-32 bg-primary/5 rounded-full blur-2xl" />
            
            <div className="w-24 h-24 rounded-full overflow-hidden bg-secondary flex-shrink-0 border-4 border-white shadow-md z-10">
              {dog.photo ? (
                <img src={dog.photo} alt={dog.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-4xl">🐶</div>
              )}
            </div>
            <div className="z-10">
              <h2 className="text-2xl font-bold text-foreground">{dog.name}</h2>
              <div className="flex flex-wrap gap-2 mt-2">
                {dog.breed && (
                  <span className="px-3 py-1 bg-secondary text-secondary-foreground text-xs font-semibold rounded-full">
                    {dog.breed}
                  </span>
                )}
                {dog.weight && (
                  <span className="px-3 py-1 bg-accent/20 text-accent-foreground text-xs font-semibold rounded-full">
                    {dog.weight} kg
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="space-y-4">
          <h3 className="font-bold text-lg text-foreground px-2">Accès rapide</h3>
          
          <Link 
            to={createPageUrl("Notebook")}
            className="w-full bg-white rounded-2xl p-4 shadow-sm border border-border/50 flex items-center gap-4 tap-scale group hover:border-primary/30 transition-all"
          >
             <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 text-red-500 group-hover:scale-110 transition-transform">
                <BookHeart className="w-6 h-6" />
             </div>
             <div className="text-left flex-1">
                <p className="font-bold text-foreground">Carnet de santé</p>
                <p className="text-sm text-muted-foreground">Vaccins, poids, suivi vétérinaire</p>
             </div>
             <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
          </Link>

          <div className="grid grid-cols-2 gap-4">
            <Link 
              to={createPageUrl("Scan")}
              className="bg-white rounded-2xl p-4 shadow-sm border border-border/50 flex flex-col items-center justify-center gap-3 tap-scale group hover:border-primary/30 transition-all text-center"
            >
               <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center text-orange-500 group-hover:scale-110 transition-transform mx-auto">
                  <Activity className="w-6 h-6" />
               </div>
               <div>
                  <p className="font-bold text-foreground text-sm">Scanner d'aliment</p>
               </div>
            </Link>
            
            <Link 
              to={createPageUrl("Chat")}
              className="bg-white rounded-2xl p-4 shadow-sm border border-border/50 flex flex-col items-center justify-center gap-3 tap-scale group hover:border-primary/30 transition-all text-center"
            >
               <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-500 group-hover:scale-110 transition-transform mx-auto">
                  <Stethoscope className="w-6 h-6" />
               </div>
               <div>
                  <p className="font-bold text-foreground text-sm">Chat IA Santé</p>
               </div>
            </Link>
          </div>
        </div>
      </div>
      
      <BottomNav currentPage="Home" />
    </div>
  );
}