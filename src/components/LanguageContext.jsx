import React, { createContext, useState, useContext, useEffect } from 'react';

const LanguageContext = createContext();

const translations = {
  fr: {
    // Navigation
    home: 'Accueil',
    discover: 'Découverte',
    social: 'Social',
    collection: 'Collection',
    online: 'En Ligne',
    profile: 'Profil',
    logOut: 'Déconnexion',
    logIn: 'Connexion',
    
    // Home Page
    heroTitle: 'Votre Communauté Puzzle Ultime',
    heroSubtitle: 'Connectez-vous avec des milliers de passionnés de puzzles, partagez vos créations et découvrez de nouveaux défis passionnants',
    startCollection: 'Commence Ta Collection',
    exploreCollection: 'Explorer la Collection',
    featuredPuzzles: 'Puzzles en Vedette',
    mostPlayed: 'Les Plus Joués',
    monthlyEvents: 'Événements Mensuels',
    communityFeed: 'Fil de la Communauté',
    viewAll: 'Voir Tout',
    
    // Collection Page
    puzzleCollection: 'Collection de Puzzles',
    explorePuzzles: 'Explorer {count} puzzles',
    searchPuzzles: 'Rechercher des puzzles...',
    filters: 'Filtres',
    all: 'Tout',
    nature: 'Nature',
    abstract: 'Abstrait',
    urban: 'Urbain',
    space: 'Espace',
    architecture: 'Architecture',
    vintage: 'Vintage',
    animals: 'Animaux',
    art: 'Art',
    pieceCount: 'Nombre de Pièces',
    difficulty: 'Difficulté',
    easy: 'Facile',
    medium: 'Moyen',
    hard: 'Difficile',
    clearAllFilters: 'Effacer Tous les Filtres',
    mostPopular: 'Plus Populaire',
    newest: 'Plus Récent',
    highestRated: 'Mieux Noté',
    piecesLowToHigh: 'Pièces: Bas à Haut',
    piecesHighToLow: 'Pièces: Haut à Bas',
    backToTop: 'Retour en Haut',
    sortBy: 'Trier par',
    
    // Social Page
    community: 'Communauté',
    trending: 'Tendances',
    latest: 'Récent',
    following: 'Abonnements',
    createPost: 'Créer une Publication',
    whatsOnYourMind: 'Quoi de neuf?',
    shareYourThoughts: 'Partagez vos pensées...',
    uploadImage: 'Télécharger une Image',
    completedPuzzle: 'Puzzle Complété?',
    puzzleName: 'Nom du Puzzle',
    brand: 'Marque',
    pieces: 'Pièces',
    post: 'Publier',
    posting: 'Publication...',
    logInToPost: 'Veuillez vous connecter pour créer des publications et interagir avec la communauté',
    noPosts: 'Aucune publication pour le moment. Soyez le premier à partager!',
    youveReachedEnd: 'Vous avez atteint la fin!',
    communityGuidelines: 'Règles de la Communauté',
    guidelinesText: 'Soyez respectueux, partagez votre passion et aidez les autres puzzleurs. Gardons cette communauté géniale! 🧩',
    communityStats: 'Statistiques de la Communauté',
    totalPosts: 'Total Publications',
    activeToday: 'Actif Aujourd\'hui',
    live: 'En Direct',
    
    // Profile Page
    welcomeProfile: 'Bienvenue sur PuzzleWorld',
    logInToViewProfile: 'Connectez-vous pour voir votre profil, suivre les puzzles complétés et gérer votre liste de souhaits',
    joined: 'Inscrit',
    completed: 'Complétés',
    hours: 'Heures',
    achievements: 'Succès',
    wishlist: 'Liste de Souhaits',
    level: 'Niveau',
    puzzleEnthusiast: 'Passionné de Puzzles',
    puzzleExpert: 'Expert en Puzzles',
    puzzleMaster: 'Maître des Puzzles',
    noAchievements: 'Aucun succès pour le moment',
    completeToUnlock: 'Complétez des puzzles pour débloquer des badges!',
    welcomeToDashboard: 'Bienvenue sur votre tableau de bord de puzzle! Suivez vos puzzles complétés et construisez votre liste de souhaits.',
    myEvents: 'Mes Événements',
    upcomingEvents: 'Événements à venir',
    noEvents: 'Aucun événement inscrit',
    
    // Online Puzzles Page
    onlinePuzzles: 'Puzzles En Ligne',
    playInBrowser: 'Jouez aux puzzles directement dans votre navigateur',
    searchGames: 'Rechercher des jeux...',
    web: 'Web',
    mobile: 'Mobile',
    crossPlatform: 'Multi-Plateforme',
    featured: 'En Vedette',
    playNow: 'Jouer Maintenant',
    players: 'joueurs',
    trendingNow: 'Tendances Actuelles',
    popularThisWeek: 'Jeux de puzzle les plus populaires cette semaine',
    allOnlineGames: 'Tous les Jeux En Ligne',
    browseCollection: 'Parcourir notre collection complète',
    wantToAddGame: 'Vous voulez ajouter un jeu?',
    addGameText: 'Connaissez-vous un jeu de puzzle en ligne incroyable qui devrait être présenté ici? Faites-le nous savoir et nous l\'examinerons!',
    suggestGame: 'Suggérer un Jeu',
    
    // Puzzle Detail Page
    backToCollection: 'Retour à la Collection',
    playOnline: 'Jouer En Ligne',
    download: 'Télécharger',
    overview: 'Aperçu',
    leaderboard: 'Classement',
    reviews: 'Avis',
    aboutPuzzle: 'À Propos de ce Puzzle',
    avgTime: 'Temps Moyen',
    bestTime: 'Meilleur Temps',
    createdBy: 'Créé par',
    followers: 'abonnés',
    follow: 'Suivre',
    viewProfile: 'Voir le Profil',
    reportPuzzle: 'Signaler ce puzzle',
    youMightLike: 'Vous Pourriez Aussi Aimer',
    viewMore: 'Voir Plus',
    foundHelpful: 'trouvé utile',
    
    // Friends & Messages
    friendsAndMessages: 'Amis & Messages',
    manageFriendsConversations: 'Gérez vos amis et vos conversations',
    friends: 'Amis',
    messages: 'Messages',
    received: 'Reçues',
    sent: 'Envoyées',
    findFriends: 'Rechercher',
    noFriendsYet: 'Vous n\'avez pas encore d\'amis',
    addFriendsToChatPrompt: 'Ajoutez des amis pour commencer à discuter',
    conversations: 'Conversations',
    startConversation: 'Commencez la conversation !',
    selectFriendToChat: 'Sélectionnez un ami pour discuter',
    writeMessage: 'Écrivez un message...',
    noPendingRequests: 'Aucune demande reçue en attente',
    noSentRequests: 'Aucune demande envoyée en attente',
    pendingResponse: 'En attente de réponse',
    searchByNameOrCode: 'Rechercher par nom ou code ami...',
    typeAtLeast2Chars: 'Tapez au moins 2 caractères pour rechercher',
    requestSent: 'Demande envoyée',
    requestAccepted: 'Demande acceptée',
    requestDeleted: 'Demande supprimée',
    friendRemoved: 'Ami supprimé',
    addFriend: 'Ajouter',
    friend: 'Ami',
    pending: 'En attente',
    cancel: 'Annuler',
    unregisterFromEvent: 'Se désinscrire',
    unregistering: 'Désinscription...',
    eventEnded: 'Terminé',
    pastEvents: 'Événements passés',
    registerForEventsPrompt: 'Inscrivez-vous à des événements pour les voir ici',
    accountSettings: 'Paramètres du compte',
    totalPiecesAssembled: 'pièces assemblées au total',
    puzzlesCompleted: 'terminés',
    followings: 'Abonnements',
    myCollection: 'Ma Collection',
    // Events Page
    eventsTitle: 'Événements',
    eventsSubtitle: 'Rejoignez notre communauté lors d\'événements exclusifs',
    sortEarliest: '📅 Du plus tôt au plus tard',
    sortLatest: '📅 Du plus tard au plus tôt',
    noEventsAvailable: 'Aucun événement disponible pour le moment',
    noEventsComingSoon: 'Revenez bientôt pour découvrir nos prochains événements !',
    // Profile hardcoded strings
    piecesAssembled: 'pièces assemblées au total',
    puzzlesCompletedLabel: 'terminés',
    myCollectionTab: 'Ma Collection',
    personalTab: 'Perso',
    pastEventsLabel: 'Événements passés',
    registerForEventsHint: 'Inscrivez-vous à des événements pour les voir ici',
    unregisterConfirm: 'Voulez-vous vraiment vous désinscrire de cet événement ?',
    unregisterError: 'Erreur lors de la désinscription',
    
    // Home Page hardcoded
    newPuzzlesDaily: 'Nouveaux puzzles chaque jour',
    newPuzzlesDailyLong: 'Nouveaux puzzles ajoutés chaque jour',
    scanPuzzle: 'Scanner',
    addPuzzle: 'Ajouter un puzzle',
    explore: 'Explorer',
    topPuzzles: 'Top 10 Puzzles',
    mostLiked: 'Les plus appréciés',
    mostLikedCommunity: 'Les plus appréciés de la communauté',
    latestArticles: 'Derniers articles',
    mustRead: 'À lire absolument',
    dontMissAnything: 'Ne manquez rien de la communauté',
    addYourPuzzle: 'Ajouter votre puzzle',
    scanOrAddManually: 'Scannez le code-barres ou ajoutez manuellement',
    discoverThousands: 'Découvrez des milliers de puzzles',
    noPuzzleAvailable: 'Aucun puzzle disponible',
    noArticleYet: 'Aucun article pour le moment',
    noEventAvailable: 'Aucun événement disponible',
    eventsInMaintenance: 'Événements en maintenance',
    eventsMaintenanceLong: 'Les événements sont temporairement en maintenance.',
    comingSoon: 'Revenez bientôt !',
    comingSoonLong: 'Revenez bientôt pour découvrir nos prochains événements !',
    seeAll: 'Voir tout',
    upcoming: 'À venir',
    
    // Collection Page hardcoded
    communityCollection: 'Collection Communautaire',
    communityPuzzlesCount: '{count} puzzles partagés par la communauté',
    discoverMode: 'Mode Découverte',
    globalCollection: 'Collection globale',
    sortNewest: 'Nouveautés',
    sortPopular: 'Populaires',
    piecesAsc: 'Pièces ↑',
    piecesDesc: 'Pièces ↓',
    piecesAscFull: 'Pièces (croissant)',
    piecesDescFull: 'Pièces (décroissant)',
    sortBy2: 'Trier par:',
    brandFilter: 'Marque',
    allBrands: 'Toutes',
    unknownBrand: '❓ Marque inconnue',
    multipleSelect: 'Sélection multiple',
    addToCollection: 'Ajouter',
    inBox: 'Dans sa boîte',
    completed2: 'Terminé',
    myBox: 'Ma boîte',
    noPuzzleFound: 'Aucun puzzle trouvé',
    beFirstToAdd: 'Soyez le premier à ajouter un puzzle à la communauté !',
    selected: 'sélectionné',
    selectedPlural: 'sélectionnés',
    deselectAll: 'Désélect.',
    selectAll: 'Tout',
    loginToAdd: 'Connectez-vous pour ajouter à votre collection',
    addedToStatus: '{count} puzzle ajouté en {status} !',
    addedToStatusPlural: '{count} puzzles ajoutés en {status} !',
    alreadyInCollection: 'Ces puzzles sont déjà dans votre collection',
    addError: "Erreur lors de l'ajout",
    minimum: 'Minimum',
    maximum: 'Maximum',

    // EventModal
    loginToRegister: 'Connectez-vous pour vous inscrire',
    alreadyRegistered: 'Vous êtes déjà inscrit à cet événement',
    eventFull: 'Cet événement est complet',
    registrationConfirmed: 'Inscription confirmée ! 🎉',
    registrationError: 'Erreur lors de l\'inscription',
    registering: 'Inscription...',
    alreadyRegisteredBtn: 'Déjà inscrit',
    eventFullBtn: 'Événement complet',
    loginToRegisterBtn: 'Connectez-vous pour vous inscrire',
    registerBtn: 'S\'inscrire',
    aboutEvent: 'À propos de l\'événement',
    moreInfoEvents: 'Plus d\'infos sur tous les événements',
    participants: 'participants',

    // EventCard
    full: 'Complet',

    // PostCard
    puzzleCompleted: 'Puzzle complété',
    viewDetails: '→ Voir détails',
    puzzleBrandLabel: 'Marque: ',
    puzzlePiecesLabel: 'Pièces: ',
    puzzleCategoryLabel: 'Catégorie: ',
    puzzleRefLabel: 'Réf: ',
    iLike: 'J\'aime',
    notLiked: 'Pas aimé',
    following2: 'Suivi',
    follow2: 'Suivre',
    loginToLike: 'Connectez-vous pour aimer les posts',
    loginToWishlist: 'Connectez-vous pour ajouter à la wishlist',
    loginToFollow: 'Connectez-vous pour suivre des utilisateurs',
    loginToLikePuzzle: 'Connectez-vous pour liker des puzzles',
    loginToDislikePuzzle: 'Connectez-vous pour disliker des puzzles',
    removedFromWishlist: 'Retiré de votre wishlist',
    addedToWishlist: 'Ajouté à votre wishlist!',
    wishlistUpdateFailed: 'Échec de la mise à jour de la wishlist',
    unfollowed: 'Suivi retiré',
    followedUser: 'Vous suivez cet utilisateur',
    followUpdateFailed: 'Échec de la mise à jour du suivi',
    dislikeRemoved: 'Dislike retiré',
    puzzleDisliked: 'Puzzle disliké',
    puzzleAddedToWishlist: '✨ Puzzle ajouté à votre wishlist !',
    puzzleRemovedFromWishlist: 'Puzzle retiré de votre wishlist',
    updateFailed: 'Échec de la mise à jour',
    likeUpdateFailed: 'Échec de la mise à jour du like',

    // CreatePostForm
    sharePuzzlePassion: 'Partagez votre passion pour les puzzles...',
    scanPuzzleBtn: 'Scanner Puzzle',
    scannedPuzzle: 'Puzzle scanné',
    puzzleBrandField: 'Marque: ',
    puzzlePiecesField: 'Pièces: ',
    puzzleRefField: 'Réf: ',
    addPersonalPhoto: 'Ajoutez votre photo personnelle du puzzle terminé',
    addMyPhoto: 'Ajouter ma photo',
    publishingBtn: 'Publication...',
    publishBtn: 'Publier',
    puzzleScanned: 'Puzzle scanné ! Ajoutez maintenant votre photo personnelle 📸',
    noContent: 'Veuillez ajouter du contenu',
    noPhoto: 'Veuillez ajouter une photo',
    missingFields: 'Champs manquants: ',
    postCreated: 'Post créé avec succès!',
    postFailed: 'Échec de la création du post. Veuillez réessayer.',

    // CollectionSection
    inBox2: 'Boîte',
    completedTab: 'Terminés',
    sortByBtn: 'Trier par',
    dateNewest: 'Date (Plus récent)',
    dateOldest: 'Date (Plus ancien)',
    piecesAscSort: 'Pièces (Croissant)',
    piecesDescSort: 'Pièces (Décroissant)',
    noInboxPuzzle: 'Aucun puzzle dans sa boîte',
    scanToAdd: 'Scannez vos puzzles pour les ajouter ici',
    noCompletedPuzzle: 'Aucun puzzle terminé',
    completeFirstPuzzle: 'Complétez vos premiers puzzles pour les voir ici',
    changeMyPhoto: 'Changer ma photo',
    addMyPhotoBtn: 'Ajouter ma photo',
    photoAdded: '📸 Photo ajoutée !',
    uploadError: 'Erreur lors de l\'upload',
    xpGained: '🎉 +100 XP ! Puzzle terminé !',
    puzzleBoxed: 'Puzzle mis dans sa boîte !',
    puzzleWishlisted: 'Puzzle mis en wishlist !',
    updateError: 'Erreur lors de la mise à jour',
    removeConfirm: 'Êtes-vous sûr de vouloir retirer ce puzzle de votre collection ?',
    removeSuccess: 'Puzzle retiré de votre collection',
    removeError: 'Erreur lors de la suppression',
    removeFromCollection: 'Retirer de ma collection',
    puzzlePiecesCount: 'pièces',
    puzzleRef: 'Réf: ',
    byBrand: 'par ',
    startedOn: 'Commencé le : ',
    completedOn: 'Terminé le : ',
    inTheBox: '📦 Dans la boîte',
    completedStatus: '✅ Terminé',

    // Common
    loading: 'Chargement...',
    save: 'Enregistrer',
    delete: 'Supprimer',
    edit: 'Modifier',
    share: 'Partager',
    like: 'J\'aime',
    comment: 'Commenter',
    comments: 'Commentaires',
    addComment: 'Ajouter un commentaire...',
    noComments: 'Aucun commentaire pour le moment',
    search: 'Rechercher',
    close: 'Fermer',
    more: 'Plus...',
    move: 'Déplacer',
    movedTo: 'Déplacé vers',
    moveError: 'Erreur lors du déplacement',
    features: 'Caractéristiques :',
    viewOnAmazon: 'Voir le produit sur Amazon',
    amazonDisclaimer: 'En tant que Partenaire Amazon, nous réalisons un bénéfice sur les achats qualifiés',
    loadError: 'Impossible de charger les détails',
    // EditProfileDialog
    editProfile: 'Modifier le profil',
    profilePhoto: 'Photo de profil',
    coverPhoto: 'Photo de couverture',
    uploading: 'Upload en cours...',
    chooseImage: 'Choisir une image',
    chooseBanner: 'Choisir une bannière',
    recommended: 'Recommandé',
    profileUpdated: 'Profil mis à jour',
    imageUploaded: 'Image uploadée !',
    selectImageError: 'Veuillez sélectionner une image',
    imageTooLarge: 'Image trop grande (max 5MB)',
    // StatsModal
    unlocked: 'Débloqué',
    locked: 'Non débloqué',
    emptyWishlist: 'Aucun puzzle en wishlist',
    // Layout
    reportIssue: 'Signaler un problème',
    report: 'Signaler',
    footerTagline: 'Votre communauté puzzle ultime',
    footerCopyright: '© 2026 PuzzleWorld. Tous droits réservés.',
    privacyPolicyLabel: 'Politique de confidentialité',
    termsLabel: 'CGU',
    // DeleteAccount
    dangerZone: 'Zone Danger',
    deleteAccountDesc: 'La suppression de votre compte est irréversible. Toutes vos données (collection, posts, statistiques) seront définitivement effacées.',
    deleteAccount: 'Supprimer mon compte',
    confirmDeletion: 'Confirmer la suppression',
    irreversibleAction: 'Cette action est',
    irreversibleWord: 'irréversible',
    dataToBeDeleted: 'Les données suivantes seront supprimées:',
    profileData: 'Votre profil et informations personnelles',
    puzzleCollectionData: 'Votre collection de puzzles',
    postsCommentsData: 'Vos posts et commentaires (anonymisés)',
    likesData: 'Vos likes et favoris',
    statsData: 'Vos statistiques et badges',
    subscriptionsData: 'Vos abonnements',
    deleting: 'Suppression...',
    confirmDelete: 'Confirmer la suppression',
    deletionInProgress: 'Suppression en cours...',
    accountDeleted: 'Compte supprimé avec succès',
    deletionError: 'Erreur lors de la suppression',
    // Profile bug report section
    reportIssueSubtitle: 'Un bug, une suggestion ou un contenu incorrect ? Faites-le nous savoir.',
    deletedUser: 'Utilisateur supprimé',
    deletedContent: '[Contenu supprimé par l\'utilisateur]',
  },
  en: {
    // Navigation
    
    // Home Page
    
    // Collection Page
    
    // Social Page
    
    // Profile Page
    
    // Online Puzzles Page
    
    // Puzzle Detail Page
    
    // Friends & Messages
    // Events Page
    // Profile hardcoded strings

    // Home Page hardcoded

    // Collection Page hardcoded

    // EventModal

    // EventCard

    // PostCard

    // CreatePostForm

    // CollectionSection

    // Common
    // EditProfileDialog
    // StatsModal
    // Layout
    // DeleteAccount
    // Profile bug report section
  }
};

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('language') || 'fr';
  });

  useEffect(() => {
    localStorage.setItem('language', language);
    // Trigger a custom event when language changes
    window.dispatchEvent(new CustomEvent('languageChange', { detail: language }));
  }, [language]);

  const t = (key, params = {}) => {
    let text = translations[language][key] || key;
    // Replace {param} placeholders
    Object.keys(params).forEach(param => {
      text = text.replace(`{${param}}`, params[param]);
    });
    return text;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}