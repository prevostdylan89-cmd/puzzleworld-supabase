import React from 'react';
import { FileText, AlertCircle, Scale, CheckCircle } from 'lucide-react';

export default function Terms() {
  return (
    <div className="min-h-screen px-4 lg:px-8 py-12">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-orange-500/10 mb-4">
            <FileText className="w-8 h-8 text-orange-500" />
          </div>
          <h1 className="text-3xl lg:text-4xl font-bold text-white mb-4">
            Conditions Générales d'Utilisation
          </h1>
          <p className="text-white/60">
            Dernière mise à jour : {new Date().toLocaleDateString('fr-FR')}
          </p>
        </div>

        {/* Content */}
        <div className="space-y-8">
          {/* Introduction */}
          <section className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] rounded-xl p-6">
            <p className="text-white/70 leading-relaxed">
              En accédant et en utilisant PuzzleWorld, vous acceptez d'être lié par les présentes 
              conditions générales d'utilisation. Si vous n'acceptez pas ces conditions, 
              veuillez ne pas utiliser notre service.
            </p>
          </section>

          {/* Service Description */}
          <section className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <CheckCircle className="w-6 h-6 text-orange-500" />
              <h2 className="text-xl font-bold text-white">Description du Service</h2>
            </div>
            <p className="text-white/70 leading-relaxed mb-4">
              PuzzleWorld est une plateforme communautaire permettant aux passionnés de puzzles de :
            </p>
            <ul className="space-y-2 text-white/70">
              <li className="flex items-start gap-2">
                <span className="text-orange-500 mt-1">•</span>
                <span>Découvrir et cataloguer des puzzles</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-orange-500 mt-1">•</span>
                <span>Partager leurs créations avec la communauté</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-orange-500 mt-1">•</span>
                <span>Participer à des événements et défis</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-orange-500 mt-1">•</span>
                <span>Gérer leur collection personnelle</span>
              </li>
            </ul>
          </section>

          {/* User Obligations */}
          <section className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <Scale className="w-6 h-6 text-orange-500" />
              <h2 className="text-xl font-bold text-white">Obligations de l'Utilisateur</h2>
            </div>
            <div className="space-y-4 text-white/70">
              <div>
                <h3 className="text-white font-semibold mb-2">Compte Utilisateur</h3>
                <p>Vous êtes responsable de maintenir la confidentialité de votre compte et de votre mot de passe.</p>
              </div>
              <div>
                <h3 className="text-white font-semibold mb-2">Contenu</h3>
                <p>Vous vous engagez à ne pas publier de contenu illégal, offensant, diffamatoire ou violant les droits d'autrui.</p>
              </div>
              <div>
                <h3 className="text-white font-semibold mb-2">Utilisation Acceptable</h3>
                <p>Vous ne devez pas utiliser le service de manière à nuire à la plateforme ou aux autres utilisateurs.</p>
              </div>
            </div>
          </section>

          {/* Intellectual Property */}
          <section className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] rounded-xl p-6">
            <h2 className="text-xl font-bold text-white mb-4">Propriété Intellectuelle</h2>
            <p className="text-white/70 leading-relaxed mb-4">
              Tout le contenu présent sur PuzzleWorld (textes, images, logos, code) est protégé par 
              les droits de propriété intellectuelle. Le contenu que vous publiez reste votre propriété, 
              mais vous nous accordez une licence pour l'afficher sur notre plateforme.
            </p>
          </section>

          {/* Liability */}
          <section className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] rounded-xl p-6">
            <h2 className="text-xl font-bold text-white mb-4">Limitation de Responsabilité</h2>
            <p className="text-white/70 leading-relaxed">
              PuzzleWorld est fourni "tel quel" sans garantie d'aucune sorte. Nous ne sommes pas 
              responsables des dommages résultant de l'utilisation ou de l'impossibilité d'utiliser 
              notre service.
            </p>
          </section>

          {/* Amazon Disclaimer */}
          <section className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-6">
            <h2 className="text-xl font-bold text-white mb-4">Liens d'Affiliation</h2>
            <p className="text-white/70 leading-relaxed">
              Certains liens présents sur PuzzleWorld sont des liens d'affiliation Amazon. 
              En tant que Partenaire Amazon, nous réalisons un bénéfice sur les achats remplissant 
              les conditions requises. Les prix des produits ne sont pas affectés par ces liens.
            </p>
          </section>

          {/* Account Termination */}
          <section className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <AlertCircle className="w-6 h-6 text-orange-500" />
              <h2 className="text-xl font-bold text-white">Résiliation</h2>
            </div>
            <p className="text-white/70 leading-relaxed">
              Vous pouvez supprimer votre compte à tout moment depuis vos paramètres de profil. 
              Nous nous réservons le droit de suspendre ou de résilier votre compte en cas de 
              violation de ces conditions.
            </p>
          </section>

          {/* Changes to Terms */}
          <section className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] rounded-xl p-6">
            <h2 className="text-xl font-bold text-white mb-4">Modifications des CGU</h2>
            <p className="text-white/70 leading-relaxed">
              Nous nous réservons le droit de modifier ces conditions à tout moment. 
              Les modifications seront effectives dès leur publication sur cette page. 
              Votre utilisation continue du service après la publication des modifications 
              constitue votre acceptation des nouvelles conditions.
            </p>
          </section>

          {/* Governing Law */}
          <section className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] rounded-xl p-6">
            <h2 className="text-xl font-bold text-white mb-4">Droit Applicable</h2>
            <p className="text-white/70 leading-relaxed">
              Ces conditions sont régies par le droit français. Tout litige sera soumis aux 
              tribunaux compétents.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}