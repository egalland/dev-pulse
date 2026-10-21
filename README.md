# Dev Pulse

Dev Pulse est un tableau de bord web pensé pour un écran de suivi sur PC ou Raspberry Pi. Il réunit l’activité GitHub, les statistiques quotidiennes de code, les quotas Codex et un aperçu des tâches en cours.

## Fonctionnalités

- flux public GitHub actualisé automatiquement ;
- sélection d’une date et calcul des commits, lignes ajoutées et supprimées ;
- affichage du quota Codex avec dernière valeur connue et état en ligne/hors ligne ;
- interface plein écran adaptée à un écran de supervision ;
- bridge local et version hébergée compatibles avec la même interface.

## Démo

La version personnelle est publiée sur [Dev Pulse](https://dev-pulse-fox.emmanuel-galland117.chatgpt.site). Les données de quota restent privées et ne font pas partie de ce dépôt.

## Démarrage local

Sous Windows, lancez `start.ps1`, puis ouvrez <http://localhost:8787>. Le serveur utilise uniquement les modules intégrés à Node.js et écoute sur la machine locale.

```powershell
.\start.ps1
```

Copiez `data/quota.example.json` vers `data/quota.json` si vous voulez alimenter manuellement la carte de quota. Le vrai fichier est volontairement ignoré par Git.

Pour les statistiques GitHub privées, définissez éventuellement `GITHUB_TOKEN` avant de lancer le serveur. Le mode public ne demande aucun jeton.

## Version hébergée

Le Worker dans `worker/index.js` sert l’interface, les statistiques GitHub quotidiennes et deux outils MCP pour lire ou mettre à jour le quota Codex. Les snapshots sont stockés dans une petite base D1 ; après vingt minutes sans signal du PC, l’interface conserve la dernière valeur et affiche « hors ligne ».

Le script local `scripts/sync-quota.ps1` peut envoyer les mesures sans plugin personnel. Ses clés sont chiffrées pour l’utilisateur Windows courant dans des fichiers `data/*.dpapi`, toujours ignorés par Git.

Construisez l’artefact publiable avec :

```powershell
node scripts/build-worker.mjs
node scripts/validate-artifact.mjs
```

Le manifeste public ne contient aucun identifiant de projet. La plateforme d’hébergement ajoute l’identifiant propre à chaque déploiement.

## Données et confidentialité

L’identifiant GitHub sert uniquement à interroger les événements publics. Aucun mot de passe ou jeton GitHub n’est enregistré dans le navigateur. Les snapshots réels de quota et les identifiants de déploiement sont ignorés par Git.

## Licence

Projet personnel publié pour être repris et adapté librement.
