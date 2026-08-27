/**
 * FONCTION À AJOUTER dans functions/index.js (celui déjà utilisé pour
 * subscribeTopic / GAZ ALERTE). Cette fonction envoie automatiquement
 * un message de sécurité toutes les 10 minutes, à tous les utilisateurs
 * abonnés au topic "securite-gaz" — même si leur application est fermée.
 *
 * INSTALLATION :
 * 1. Ouvre ton dossier "functions" (celui utilisé pour déployer les
 *    fonctions Firebase de GAZ ALERTE).
 * 2. Ouvre index.js et colle ce bloc à la fin du fichier
 *    (garde tes fonctions existantes, ne les supprime pas).
 * 3. Dans le terminal, à la racine du projet Firebase :
 *      firebase deploy --only functions:sendSafetyReminder
 *
 * Nécessite le plan Firebase "Blaze" (Cloud Scheduler = payant à l'usage,
 * mais le coût pour ce volume est quasi nul, quelques centimes par mois).
 */

const functions = require("firebase-functions");
const admin = require("firebase-admin");
// Si admin.initializeApp() est déjà appelé ailleurs dans ton index.js,
// NE LE RÉPÈTE PAS ici (une seule initialisation par fichier).
if (!admin.apps.length) {
  admin.initializeApp();
}

const SAFETY_MESSAGES = [
  "Pensez à bien fermer le robinet de votre bouteille de gaz après utilisation.",
  "Vérifiez qu'il n'y a pas d'odeur de gaz autour de votre bouteille.",
  "N'utilisez jamais une bouteille de gaz qui présente une fuite ou une odeur suspecte.",
  "Éloignez toute flamme ou source de chaleur de votre bouteille de gaz.",
  "Après la cuisson, fermez le robinet du gaz avant de fermer le feu.",
  "Rangez votre bouteille de gaz debout, dans un endroit aéré, loin de la chaleur.",
  "En cas d'odeur de gaz, fermez le robinet, ouvrez les fenêtres et sortez immédiatement.",
  "Faites vérifier régulièrement le tuyau et le détendeur de votre installation de gaz."
];

// Se déclenche automatiquement toutes les 10 minutes (production).
exports.sendSafetyReminder = functions.pubsub
  .schedule("every 10 minutes")
  .timeZone("Africa/Abidjan")
  .onRun(async () => {
    const index = Math.floor(Date.now() / (10 * 60 * 1000)) % SAFETY_MESSAGES.length;
    const message = SAFETY_MESSAGES[index];

    const payload = {
      notification: {
        title: "GAZ ALERTE — Sécurité",
        body: message
      },
      topic: "securite-gaz"
    };

    try {
      await admin.messaging().send(payload);
      console.log("Rappel sécurité envoyé :", message);
    } catch (err) {
      console.error("Erreur envoi rappel sécurité :", err);
    }

    return null;
  });

/**
 * FONCTION DE TEST — à utiliser une seule fois pour vérifier que tout
 * fonctionne, sans attendre 10 minutes. Cloud Scheduler ne permet pas
 * de descendre sous 1 minute, donc pour un test rapide, on déclenche
 * l'envoi manuellement via une simple URL ouverte dans le navigateur.
 *
 * UTILISATION :
 * 1. Déploie : firebase deploy --only functions:testSafetyReminder
 * 2. Ouvre l'URL affichée dans le terminal après le déploiement
 *    (ressemble à : https://us-central1-gaz-alerte.cloudfunctions.net/testSafetyReminder)
 * 3. Tu dois recevoir la notification presque immédiatement sur les
 *    appareils abonnés au topic "securite-gaz".
 * 4. Une fois le test validé, tu peux supprimer cette fonction
 *    (elle n'est utile que pour les tests, pas pour la production).
 */
exports.testSafetyReminder = functions.https.onRequest(async (req, res) => {
  const message = SAFETY_MESSAGES[0];
  try {
    await admin.messaging().send({
      notification: {
        title: "GAZ ALERTE — Test",
        body: message
      },
      topic: "securite-gaz"
    });
    res.send("✅ Message de test envoyé au topic securite-gaz : " + message);
  } catch (err) {
    res.status(500).send("❌ Erreur : " + err.message);
  }
});
