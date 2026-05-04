import React from 'react';
import { Shield, Lock, Eye, UserCheck, Database, Mail } from 'lucide-react';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen px-4 lg:px-8 py-12">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-orange-500/10 mb-4">
            <Shield className="w-8 h-8 text-orange-500" />
          </div>
          <h1 className="text-3xl lg:text-4xl font-bold text-white mb-4">
            Politique de Confidentialité
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
              Bienvenue sur PuzzleWorld. Nous respectons votre vie privée et nous nous engageons à protéger vos données personnelles. 
              Cette politique de confidentialité vous informe sur la manière dont nous collectons, utilisons et protégeons vos informations.
            </p>
          </section>

          {/* Data Collection */}
          <section className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <Database className="w-6 h-6 text-orange-500" />
              <h2 className="text-xl font-bold text-white">Données Collectées</h2>
            </div>
            <div className="space-y-4 text-white/70">
              <div>
                <h3 className="text-white font-semibold mb-2">Informations de compte</h3>
                <p>Nom, adresse e-mail, photo de profil (optionnelle)</p>
              </div>
              <div>
                <h3 className="text-white font-semibold mb-2">Données d'utilisation</h3>
                <p>Puzzles complétés, interactions sociales, préférences de contenu</p>
              </div>
              <div>
                <h3 className="text-white font-semibold mb-2">Données techniques</h3>
                <p>Adresse IP, type de navigateur, système d'exploitation</p>
              </div>
            </div>
          </section>

          {/* Data Usage */}
          <section className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <Eye className="w-6 h-6 text-orange-500" />
              <h2 className="text-xl font-bold text-white">Utilisation des Données</h2>
            </div>
            <ul className="space-y-2 text-white/70">
              <li className="flex items-start gap-2">
                <span className="text-orange-500 mt-1">•</span>
                <span>Fournir et améliorer nos services</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-orange-500 mt-1">•</span>
                <span>Personnaliser votre expérience utilisateur</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-orange-500 mt-1">•</span>
                <span>Communiquer avec vous sur les mises à jour du service</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-orange-500 mt-1">•</span>
                <span>Analyser l'utilisation pour améliorer la plateforme</span>
              </li>
            </ul>
          </section>

          {/* Data Protection */}
          <section className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <Lock className="w-6 h-6 text-orange-500" />
              <h2 className="text-xl font-bold text-white">Protection des Données</h2>
            </div>
            <p className="text-white/70 leading-relaxed">
              Nous mettons en œuvre des mesures de sécurité appropriées pour protéger vos données contre 
              tout accès non autorisé, altération, divulgation ou destruction. Vos données sont cryptées 
              en transit et au repos.
            </p>
          </section>

          {/* User Rights */}
          <section className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <UserCheck className="w-6 h-6 text-orange-500" />
              <h2 className="text-xl font-bold text-white">Vos Droits</h2>
            </div>
            <ul className="space-y-2 text-white/70">
              <li className="flex items-start gap-2">
                <span className="text-orange-500 mt-1">•</span>
                <span><strong>Accès :</strong> Vous pouvez demander une copie de vos données</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-orange-500 mt-1">•</span>
                <span><strong>Rectification :</strong> Vous pouvez corriger vos informations</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-orange-500 mt-1">•</span>
                <span><strong>Suppression :</strong> Vous pouvez supprimer votre compte à tout moment</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-orange-500 mt-1">•</span>
                <span><strong>Opposition :</strong> Vous pouvez vous opposer au traitement de vos données</span>
              </li>
            </ul>
          </section>

          {/* Cookies */}
          <section className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] rounded-xl p-6">
            <h2 className="text-xl font-bold text-white mb-4">Cookies</h2>
            <p className="text-white/70 leading-relaxed">
              Nous utilisons des cookies essentiels pour assurer le bon fonctionnement de notre site. 
              Nous n'utilisons pas de cookies de suivi publicitaire tiers.
            </p>
          </section>

          {/* Amazon Affiliate */}
          <section className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-6">
            <h2 className="text-xl font-bold text-white mb-4">Programme d'Affiliation Amazon</h2>
            <p className="text-white/70 leading-relaxed">
              En tant que Partenaire Amazon, nous réalisons un bénéfice sur les achats remplissant les 
              conditions requises. Les liens vers Amazon présents sur notre site peuvent générer une 
              commission pour nous, sans coût supplémentaire pour vous.
            </p>
          </section>

          {/* Contact */}
          <section className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <Mail className="w-6 h-6 text-orange-500" />
              <h2 className="text-xl font-bold text-white">Contact</h2>
            </div>
            <p className="text-white/70">
              Pour toute question concernant cette politique de confidentialité, contactez-nous à :{' '}
              <a href="mailto:privacy@puzzleworld.app" className="text-orange-400 hover:text-orange-300">
                privacy@puzzleworld.app
              </a>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}