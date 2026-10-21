# Dev Pulse

Tableau de bord local pour suivre l’activité GitHub, les quotas Codex et les tâches récentes depuis un PC ou un Raspberry Pi.

## Démarrer sur Windows

Cliquez droit sur `start.ps1`, choisissez **Exécuter avec PowerShell**, puis ouvrez <http://localhost:8787>. Cette version locale active aussi le bridge privé de quota Codex, accessible uniquement depuis ce PC.

Ou depuis PowerShell :

```powershell
cd "C:\chemin\vers\dev-pulse"
.\start.ps1
```

## Connexion GitHub

Cliquez sur l’avatar **FX** puis renseignez un nom d’utilisateur GitHub. L’application charge les événements publics toutes les 60 secondes. Aucun mot de passe ni token n’est stocké.

## Raspberry Pi

Copiez le dossier sur le Pi puis lancez :

```bash
cd dev-pulse
python3 -m http.server 8787 --bind 0.0.0.0
```

Ouvrez ensuite Chromium sur `http://localhost:8787` et passez en plein écran. Pour le mode kiosque automatique :

```bash
chromium --kiosk --app=http://localhost:8787
```

## État des données

- **GitHub public** : réel et actualisé automatiquement après configuration.
- **Quotas Codex** : lus depuis `data/quota.json` par le bridge local. L’actualisation Codex met ce fichier à jour périodiquement.
- **Chats et tâches** : instantané local représentatif.
- **Historique** : interaction prête ; la persistance complète et l’accès aux dépôts privés nécessitent un petit service local de synchronisation, prévu pour la prochaine version.
