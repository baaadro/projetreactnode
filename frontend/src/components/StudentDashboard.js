import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

const StudentDashboard = () => {
    const [stages, setStages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({
        entreprise: '',
        sujet: '',
        date_debut: '',
        date_fin: ''
    });
    const [message, setMessage] = useState('');
    
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        fetchStages();
    }, []);

    const fetchStages = async () => {
        try {
            const response = await axios.get('/api/stages/mes-stages');
            setStages(response.data);
        } catch (error) {
            console.error('Erreur:', error);
            if (error.response?.status === 401) {
                logout();
            }
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        try {
            await axios.post('/api/stages', formData);
            setFormData({
                entreprise: '',
                sujet: '',
                date_debut: '',
                date_fin: ''
            });
            setMessage('✅ Stage déclaré avec succès !');
            fetchStages();
            
            // Effacer le message après 3 secondes
            setTimeout(() => setMessage(''), 3000);
        } catch (error) {
            console.error('Erreur:', error);
            setMessage('❌ Erreur lors de la déclaration du stage');
            setTimeout(() => setMessage(''), 3000);
        }
    };

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const getStatusBadge = (statut) => {
        const badges = {
            'en_attente': 'warning',
            'valide': 'success',
            'refuse': 'danger'
        };
        
        const texts = {
            'en_attente': 'En attente',
            'valide': 'Validé',
            'refuse': 'Refusé'
        };
        
        return (
            <span className={`badge bg-${badges[statut]}`}>
                {texts[statut]}
            </span>
        );
    };

    const handleLogout = () => {
        logout();
    };

    if (loading) {
        return (
            <div className="container mt-5">
                <div className="text-center">
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Chargement...</span>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="container mt-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h1 className="mb-0">Tableau de bord Étudiant</h1>
                    <p className="text-muted mb-0">Bonjour, {user?.nom}</p>
                </div>
                <button onClick={handleLogout} className="btn btn-outline-danger">
                    Déconnexion
                </button>
            </div>

            {message && (
                <div className={`alert ${message.includes('✅') ? 'alert-success' : 'alert-danger'} alert-dismissible fade show`}>
                    {message}
                    <button type="button" className="btn-close" onClick={() => setMessage('')}></button>
                </div>
            )}

            <div className="row">
                <div className="col-lg-6 mb-4">
                    <div className="card shadow">
                        <div className="card-header bg-primary text-white">
                            <h5 className="mb-0">Déclarer un nouveau stage</h5>
                        </div>
                        <div className="card-body">
                            <form onSubmit={handleSubmit}>
                                <div className="mb-3">
                                    <label className="form-label">Entreprise *</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        name="entreprise"
                                        value={formData.entreprise}
                                        onChange={handleChange}
                                        required
                                        placeholder="Nom de l'entreprise"
                                    />
                                </div>
                                
                                <div className="mb-3">
                                    <label className="form-label">Sujet du stage *</label>
                                    <textarea
                                        className="form-control"
                                        name="sujet"
                                        value={formData.sujet}
                                        onChange={handleChange}
                                        rows="3"
                                        required
                                        placeholder="Description du stage"
                                    />
                                </div>
                                
                                <div className="row mb-3">
                                    <div className="col-md-6">
                                        <label className="form-label">Date de début *</label>
                                        <input
                                            type="date"
                                            className="form-control"
                                            name="date_debut"
                                            value={formData.date_debut}
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label">Date de fin *</label>
                                        <input
                                            type="date"
                                            className="form-control"
                                            name="date_fin"
                                            value={formData.date_fin}
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>
                                </div>
                                
                                <button type="submit" className="btn btn-primary w-100">
                                    Déclarer le stage
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
                
                <div className="col-lg-6">
                    <div className="card shadow">
                        <div className="card-header bg-primary text-white">
                            <h5 className="mb-0">Mes stages déclarés</h5>
                        </div>
                        <div className="card-body">
                            {stages.length === 0 ? (
                                <div className="text-center py-4">
                                    <p className="text-muted">Aucun stage déclaré pour le moment.</p>
                                    <p className="text-muted small">Utilisez le formulaire à gauche pour déclarer votre premier stage.</p>
                                </div>
                            ) : (
                                <div className="list-group">
                                    {stages.map((stage) => (
                                        <div key={stage.id} className="list-group-item list-group-item-action">
                                            <div className="d-flex justify-content-between align-items-start">
                                                <div className="flex-grow-1">
                                                    <h6 className="mb-1">{stage.entreprise}</h6>
                                                    <p className="mb-1 small">{stage.sujet}</p>
                                                    <small className="text-muted">
                                                        Du {new Date(stage.date_debut).toLocaleDateString('fr-FR')} 
                                                        au {new Date(stage.date_fin).toLocaleDateString('fr-FR')}
                                                    </small>
                                                </div>
                                                <div className="ms-3">
                                                    {getStatusBadge(stage.statut)}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StudentDashboard;