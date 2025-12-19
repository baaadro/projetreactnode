#  Plateforme de Déclaration & Suivi de Stages Étudiants

Une application web complète permettant aux étudiants de déclarer leurs stages et aux administrateurs de les valider ou refuser.

## Fonctionnalités

### Pour les étudiants :
-  Création de compte étudiant
-  Déclaration de stage (entreprise, sujet, dates)
-  Consultation du statut (en attente/validé/refusé)

### Pour l'administration :
-  Connexion avec compte administrateur
-  Liste de tous les stages déclarés
-  Validation ou refus des stages
-  Vue détaillée des informations étudiantes

## Technologies utilisées

### Backend :
- **Node.js** avec **Express.js** - Serveur API
- **MySQL** - Base de données
- **bcryptjs** - Hash des mots de passe
- **JSON Web Tokens (JWT)** - Authentification
- **CORS** - Communication cross-origin

### Frontend :
- **React.js** - Interface utilisateur
- **React Router** - Navigation
- **Axios** - Communication API
- **Bootstrap 5** - Design responsive
- **Context API** - Gestion d'état

## Prérequis

Avant de commencer, assurez-vous d'avoir installé :

1. **Node.js** (v14 ou supérieur) - [Télécharger](https://nodejs.org/)
2. **MySQL** (v5.7 ou supérieur) - [Télécharger](https://dev.mysql.com/downloads/)
3. **Git** (optionnel) - [Télécharger](https://git-scm.com/)
4. **npm** (inclus avec Node.js)

## ⚙️ Installation

### Étape 1 : Cloner le projet ou Télécharger code raw

git clone https://github.com/VOTRE_NOM/plateforme-stages-etudiants.git
cd plateforme-stages-etudiants

### Étape 2 : Connecter au MySQL

mysql -u root -p (vote password)

le script server.js le moment ou le backend est started, crée cette database utilisant ce script
mais vous pouvez la créer manuellement.
```
CREATE DATABASE stage_platform;
USE stage_platform;

-- Créer la table users
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nom VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('etudiant', 'admin') DEFAULT 'etudiant',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Créer la table stages
CREATE TABLE stages (
    id INT PRIMARY KEY AUTO_INCREMENT,
    id_etudiant INT NOT NULL,
    entreprise VARCHAR(200) NOT NULL,
    sujet TEXT NOT NULL,
    date_debut DATE NOT NULL,
    date_fin DATE NOT NULL,
    statut ENUM('en_attente', 'valide', 'refuse') DEFAULT 'en_attente',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_etudiant) REFERENCES users(id) ON DELETE CASCADE
);

-- Insérer l'administrateur (mot de passe: admin123)
INSERT INTO users (nom, email, password, role) 
VALUES ('Administrateur', 'admin@example.com', '$2a$10$Bn55mvJqio2lK2ULeEClAOUHwjp/iF21OVEdNg7i9EUD41.eoJolu', 'admin');
```


### Étape 3 : Configurer le backend
```
cd backend
npm install
```
Modifier backend\server.js 
```
// Configuration MySQL - MODIFIEZ CES INFORMATIONS
const dbConfig = {
    host: 'localhost',
    user: 'root',      // Votre utilisateur MySQL
    password: '123456',      // Votre mot de passe MySQL
    database: 'stage_platform'
};
```

### Étape 4 : Configurer le frontend
```
cd frontend
npm install
```
### Étape 5 : Start the backend and frontend

# in projetreactnode\backend 

```npm start ```

# in projetreactnode\frontend 

```npm start ```

Frontend: http://localhost:3000
Backend:  http://localhost:5000/api/test


 
