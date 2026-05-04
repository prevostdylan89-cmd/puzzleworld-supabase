import React from 'react';
import { motion } from 'framer-motion';
import { HelpCircle, ChevronDown } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export default function FAQ() {
  const faqs = [
    {
      question: "Comment ajouter un puzzle à ma collection ?",
      answer: "Utilisez le bouton Scan en bas de l'écran pour scanner le code-barres de votre puzzle, ou ajoutez-le manuellement depuis la page Collection."
    },
    {
      question: "Comment suivre le temps passé sur un puzzle ?",
      answer: "Dans votre collection, cliquez sur un puzzle en cours et utilisez le chronomètre intégré pour suivre votre temps."
    },
    {
      question: "Qu'est-ce que le score de popularité ?",
      answer: "Le score de popularité est calculé en fonction des likes, dislikes et ajouts en wishlist des autres utilisateurs."
    },
    {
      question: "Comment participer aux événements ?",
      answer: "Rendez-vous dans la section Events pour voir les événements à venir et vous y inscrire directement."
    },
    {
      question: "Puis-je échanger mes puzzles avec d'autres utilisateurs ?",
      answer: "Oui ! Marquez vos puzzles comme 'À échanger' dans votre collection pour les rendre visibles aux autres."
    },
    {
      question: "Comment débloquer des badges ?",
      answer: "Les badges se débloquent automatiquement en complétant des puzzles, en participant à la communauté et en atteignant certains objectifs."
    },
    {
      question: "Les liens Amazon sont-ils des liens affiliés ?",
      answer: "Oui, en tant que Partenaire Amazon, nous réalisons un bénéfice sur les achats remplissant les conditions requises. Cela nous aide à maintenir l'application gratuite."
    },
    {
      question: "Comment supprimer mon compte ?",
      answer: "Vous pouvez supprimer votre compte depuis la page Profil, dans les paramètres de compte."
    }
  ];

  return (
    <div className="min-h-screen bg-[#000019] py-8 px-4 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center mx-auto mb-4">
            <HelpCircle className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">FAQ</h1>
          <p className="text-white/60 text-lg">
            Questions fréquemment posées
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem 
                key={index} 
                value={`item-${index}`}
                className="bg-white/5 border border-white/10 rounded-xl px-6 overflow-hidden"
              >
                <AccordionTrigger className="text-white hover:text-orange-400 text-left py-6">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-white/70 pb-6">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-12 text-center"
        >
          <div className="bg-white/5 border border-white/10 rounded-xl p-8">
            <h2 className="text-xl font-semibold text-white mb-2">
              Vous ne trouvez pas de réponse ?
            </h2>
            <p className="text-white/60 mb-4">
              Notre équipe est là pour vous aider
            </p>
            <a 
              href="mailto:contact@puzzleworld.app"
              className="inline-block px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-lg transition-all"
            >
              Contactez-nous
            </a>
          </div>
        </motion.div>
      </div>
    </div>
  );
}