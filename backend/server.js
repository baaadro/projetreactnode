const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');  // CHANGÉ ICI
const jwt = require('jsonwebtoken');

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Configuration MySQL - MODIFIEZ CES INFORMATIONS
const dbConfig = {
    host: 'localhost',
    user: 'root',      // Votre utilisateur MySQL
    password: '123456',      // Votre mot de passe MySQL
    database: 'stage_platform'
};

let db;
let dbInitialized = false;

// Connexion à MySQL
async function connectDB() {
    try {
        const connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: '123456'
        });

        console.log('✅ Connecté à MySQL');
        
        // créer la database
        await connection.execute(`CREATE DATABASE IF NOT EXISTS stage_platform`);
        await connection.end();

        db = await mysql.createConnection(dbConfig);
        console.log('✅ Connecté à MySQL & base créée');
        // Créer les tables si elles n'existent pas
        await initDatabase();
    } catch (error) {
        console.error('❌ Erreur MySQL:', error.message);
        console.log('⚠️  Assurez-vous que MySQL est installé et démarré');
        console.log('📌 Vous pouvez installer XAMPP ou WAMP pour avoir MySQL facilement');
    }
}

// Initialisation de la base de données
async function initDatabase() {
    if (dbInitialized) return;
    try {
        // Créer la table users
        await db.execute(`
            CREATE TABLE IF NOT EXISTS users (
                id INT PRIMARY KEY AUTO_INCREMENT,
                nom VARCHAR(100) NOT NULL,
                email VARCHAR(100) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                role ENUM('etudiant', 'admin') DEFAULT 'etudiant',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        
        // Créer la table stages
        await db.execute(`
            CREATE TABLE IF NOT EXISTS stages (
                id INT PRIMARY KEY AUTO_INCREMENT,
                id_etudiant INT NOT NULL,
                entreprise VARCHAR(200) NOT NULL,
                sujet TEXT NOT NULL,
                date_debut DATE NOT NULL,
                date_fin DATE NOT NULL,
                statut ENUM('en_attente', 'valide', 'refuse') DEFAULT 'en_attente',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (id_etudiant) REFERENCES users(id) ON DELETE CASCADE
            )
        `);
        
        // Créer un admin par défaut si aucun utilisateur n'existe
        const [users] = await db.execute('SELECT * FROM users LIMIT 1');
        if (users.length === 0) {
            const hashedPassword = await bcrypt.hash('admin123', 10);
            await db.execute(
                'INSERT INTO users (nom, email, password, role) VALUES (?, ?, ?, ?)',
                ['Administrateur', 'admin@example.com', "$2a$10$Bn55mvJqio2lK2ULeEClAOUHwjp/iF21OVEdNg7i9EUD41.eoJolu", 'admin']
            );
            console.log('✅ Admin créé: admin@example.com / admin123');
        }
        
        console.log('✅ Base de données initialisée');
        dbInitialized = true;
    } catch (error) {
        console.error('❌ Erreur d\'initialisation:', error.message);
    }
}

// Middleware d'authentification
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) return res.status(401).json({ error: 'Accès non autorisé' });
    
    jwt.verify(token, 'stage_platform_secret_key', (err, user) => {
        if (err) return res.status(403).json({ error: 'Token invalide' });
        req.user = user;
        next();
    });
};

// Middleware admin
const isAdmin = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Accès réservé aux administrateurs' });
    }
    next();
};

// ===== ROUTES =====

// 1. Test
app.get('/api/test', (req, res) => {
    res.json({ message: 'API fonctionnelle!', timestamp: new Date() });
});

// 2. Authentification
app.post('/api/register', async (req, res) => {
    try {
        const { nom, email, password } = req.body;
        
        if (!nom || !email || !password) {
            return res.status(400).json({ error: 'Tous les champs sont requis' });
        }
        
        // Vérifier si l'email existe
        const [existing] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
        if (existing.length > 0) {
            return res.status(400).json({ error: 'Cet email est déjà utilisé' });
        }
        
        // Hacher le mot de passe
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Créer l'utilisateur
        await db.execute(
            'INSERT INTO users (nom, email, password, role) VALUES (?, ?, ?, ?)',
            [nom, email, hashedPassword, 'etudiant']
        );
        
        res.status(201).json({ message: 'Compte étudiant créé avec succès' });
    } catch (error) {
        console.error('Erreur inscription:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        if (!email || !password) {
            return res.status(400).json({ error: 'Email et mot de passe requis' });
        }
        
        // Trouver l'utilisateur
        const [users] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
        if (users.length === 0) {
            return res.status(401).json({ error: 'Identifiants incorrects' });
        }
        
        const user = users[0];
        
        // Vérifier le mot de passe
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({ error: 'Identifiants incorrects' });
        }
        
        // Créer le token JWT
        const token = jwt.sign(
            {
                id: user.id,
                email: user.email,
                nom: user.nom,
                role: user.role
            },
            'stage_platform_secret_key',
            { expiresIn: '24h' }
        );
        
        res.json({
            token,
            user: {
                id: user.id,
                nom: user.nom,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Erreur connexion:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// 3. Routes Étudiant
app.post('/api/stages', authenticateToken, async (req, res) => {
    try {
        const { entreprise, sujet, date_debut, date_fin } = req.body;
        
        if (!entreprise || !sujet || !date_debut || !date_fin) {
            return res.status(400).json({ error: 'Tous les champs sont requis' });
        }
        
        await db.execute(
            'INSERT INTO stages (id_etudiant, entreprise, sujet, date_debut, date_fin) VALUES (?, ?, ?, ?, ?)',
            [req.user.id, entreprise, sujet, date_debut, date_fin]
        );
        
        res.status(201).json({ message: 'Stage déclaré avec succès' });
    } catch (error) {
        console.error('Erreur déclaration stage:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

app.get('/api/stages/mes-stages', authenticateToken, async (req, res) => {
    try {
        const [stages] = await db.execute(
            'SELECT * FROM stages WHERE id_etudiant = ? ORDER BY created_at DESC',
            [req.user.id]
        );
        
        res.json(stages);
    } catch (error) {
        console.error('Erreur récupération stages:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// 4. Routes Admin
app.get('/api/admin/stages', authenticateToken, isAdmin, async (req, res) => {
    try {
        const [stages] = await db.execute(`
            SELECT s.*, u.nom as etudiant_nom, u.email as etudiant_email 
            FROM stages s 
            JOIN users u ON s.id_etudiant = u.id 
            ORDER BY s.created_at DESC
        `);
        
        res.json(stages);
    } catch (error) {
        console.error('Erreur récupération stages admin:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

app.put('/api/admin/stages/:id', authenticateToken, isAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { statut } = req.body;
        
        if (!['en_attente', 'valide', 'refuse'].includes(statut)) {
            return res.status(400).json({ error: 'Statut invalide' });
        }
        
        await db.execute(
            'UPDATE stages SET statut = ? WHERE id = ?',
            [statut, id]
        );
        
        res.json({ message: 'Statut mis à jour' });
    } catch (error) {
        console.error('Erreur mise à jour statut:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// Démarrer le serveur
connectDB().then(() => {
    app.listen(PORT, () => {
        console.log(`🚀 Serveur backend démarré sur http://localhost:${PORT}`);
        console.log(`🔗 Testez l'API: http://localhost:${PORT}/api/test`);
    });
});
