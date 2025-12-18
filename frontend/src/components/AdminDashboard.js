import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

const AdminDashboard = () => {
    const [stages, setStages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState('');
    
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        fetchStages();
    }, []);

    const fetchStages = async () => {
        try {
            const response = await axios.get('/api/admin/stages');
            setStages(response.data);
        } catch (error) {
            console.error('Erreur:', error);
            if (error.response?.status === 401 || error.response?.status === 403) {
                logout();
            }
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = async (stageId, newStatus) => {
        try {
            await axios.put(`/api/admin/stages/${stageId}`, { statut: newStatus });
            setMessage(`✅ Stage ${newStatus === 'valide' ? 'validé' : 'refusé'} avec succès`);
            fetchStages();
            
            setTimeout(() => setMessage(''), 3000);
        } catch (error) {
            console.error('Erreur:', error);
            setMessage('❌ Erreur lors de la mise à jour du statut');
            setTimeout(() => setMessage(''), 3000);
        }
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
                    <h1 className="mb-0">Tableau de bord Administrateur</h1>
                    <p className="text-muted mb-0">Connecté en tant que {user?.nom}</p>
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

            <div className="card shadow">
                <div className="card-header bg-primary text-white">
                    <h5 className="mb-0">Tous les stages déclarés</h5>
                </div>
                <div className="card-body">
                    {stages.length === 0 ? (
                        <div className="text-center py-5">
                            <p className="text-muted">Aucun stage déclaré pour le moment.</p>
                        </div>
                    ) : (
                        <div className="table-responsive">
                            <table className="table table-hover">
                                <thead>
                                    <tr>
                                        <th>Étudiant</th>
                                        <th>Email</th>
                                        <th>Entreprise</th>
                                        <th>Sujet</th>
                                        <th>Dates</th>
                                        <th>Statut</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {stages.map((stage) => (
                                        <tr key={stage.id}>
                                            <td>{stage.etudiant_nom}</td>
                                            <td>{stage.etudiant_email}</td>
                                            <td>{stage.entreprise}</td>
                                            <td className="text-truncate" style={{maxWidth: '200px'}} 
                                                title={stage.sujet}>
                                                {stage.sujet.length > 50 ? stage.sujet.substring(0, 50) + '...' : stage.sujet}
                                            </td>
                                            <td>
                                                <small>
                                                    {new Date(stage.date_debut).toLocaleDateString('fr-FR')} <br/>
                                                    {new Date(stage.date_fin).toLocaleDateString('fr-FR')}
                                                </small>
                                            </td>
                                            <td>{getStatusBadge(stage.statut)}</td>
                                            <td>
                                                {stage.statut === 'en_attente' && (
                                                    <div className="btn-group btn-group-sm">
                                                        <button
                                                            className="btn btn-success"
                                                            onClick={() => handleStatusChange(stage.id, 'valide')}
                                                            title="Valider"
                                                        >
                                                            ✓ Valider
                                                        </button>
                                                        <button
                                                            className="btn btn-danger"
                                                            onClick={() => handleStatusChange(stage.id, 'refuse')}
                                                            title="Refuser"
                                                        >
                                                            ✗ Refuser
                                                        </button>
                                                    </div>
                                                )}
                                                {(stage.statut === 'valide' || stage.statut === 'refuse') && (
                                                    <small className="text-muted">Décision prise</small>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;