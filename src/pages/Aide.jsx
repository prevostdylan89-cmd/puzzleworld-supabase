import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { 
  LifeBuoy, 
  BookOpen, 
  MessageCircle, 
  HelpCircle,
  Scan,
  Heart,
  Trophy,
  Calendar,
  ArrowRight
} from 'lucide-react';

export default function Aide() {
  const helpCategories = [
    {
      icon: Scan,
      title: "Ajouter des puzzles",
      description: "Apprenez à scanner et ajouter des puzzles à votre collection",
      items: [
        "Scanner un code-barres",
        "Ajouter manuellement",
        "Importer depuis une image"
      ]
    },
    {
      icon: Heart,
      title: "Gérer sa collection",
      description: "Organisez et suivez vos puzzles facilement",
      items: [
        "Marquer comme terminé",
        "Ajouter à la wishlist",
        "Échanger avec la communauté"
      ]
    },
    {
      icon: Trophy,
      title: "Badges et niveaux",
      description: "Débloquez des récompenses en progressant",
      items: [
        "Comment gagner des badges",
        "Système de niveaux",
        "Gagner de l'XP"
      ]
    },
    {
      icon: Calendar,
      title: "Événements",
      description: "Participez aux événements communautaires",
      items: [
        "S'inscrire à un événement",
        "Voir mes événements",
        "Annuler une inscription"
      ]
    }
  ];

  const quickLinks = [
    { icon: HelpCircle, title: "FAQ", link: "FAQ" },
    { icon: MessageCircle, title: "Contact", link: "Contact" },
    { icon: BookOpen, title: "Conditions d'utilisation", link: "Terms" }
  ];

  return (
    <div className="min-h-screen bg-[#000019] py-8 px-4 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center mx-auto mb-4">
            <LifeBuoy className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">Centre d'aide</h1>
          <p className="text-white/60 text-lg">
            Tout ce dont vous avez besoin pour utiliser PuzzleWorld
          </p>
        </motion.div>

        {/* Help Categories */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="grid md:grid-cols-2 gap-6 mb-12"
        >
          {helpCategories.map((category, index) => (
            <div
              key={index}
              className="bg-white/5 border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-colors"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-lg bg-orange-500/20 flex items-center justify-center flex-shrink-0">
                  <category.icon className="w-6 h-6 text-orange-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-white mb-2">
                    {category.title}
                  </h3>
                  <p className="text-white/60 text-sm mb-4">
                    {category.description}
                  </p>
                  <ul className="space-y-2">
                    {category.items.map((item, i) => (
                      <li key={i} className="flex items-center gap-2 text-white/80 text-sm">
                        <ArrowRight className="w-4 h-4 text-orange-400 flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </motion.div>

        {/* Quick Links */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <h2 className="text-2xl font-bold text-white mb-6">Liens rapides</h2>
          <div className="grid md:grid-cols-3 gap-4">
            {quickLinks.map((link, index) => (
              <Link
                key={index}
                to={createPageUrl(link.link)}
                className="bg-white/5 border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-colors group"
              >
                <link.icon className="w-8 h-8 text-orange-400 mb-3" />
                <h3 className="text-lg font-semibold text-white group-hover:text-orange-400 transition-colors">
                  {link.title}
                </h3>
              </Link>
            ))}
          </div>
        </motion.div>

        {/* Contact Section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-12 text-center"
        >
          <div className="bg-gradient-to-br from-orange-500/20 to-orange-600/20 border border-orange-500/20 rounded-xl p-8">
            <h2 className="text-2xl font-semibold text-white mb-2">
              Besoin d'aide supplémentaire ?
            </h2>
            <p className="text-white/60 mb-6">
              Notre équipe est disponible pour répondre à toutes vos questions
            </p>
            <Link
              to={createPageUrl('Contact')}
              className="inline-block px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-lg transition-all"
            >
              Contactez-nous
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}