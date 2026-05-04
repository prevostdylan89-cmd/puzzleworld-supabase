import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Edit2, Save, X, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export default function DashboardBadges() {
  const [badges, setBadges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    loadBadges();
  }, []);

  const loadBadges = async () => {
    try {
      const data = await base44.entities.Badge.list();
      setBadges(data);
      setLoading(false);
    } catch (error) {
      toast.error('Erreur lors du chargement des badges');
      setLoading(false);
    }
  };

  const handleEdit = (badge) => {
    setEditingId(badge.id);
    setEditData({
      name: badge.name,
      description: badge.description,
      icon: badge.icon,
      color: badge.color,
      level: badge.level
    });
  };

  const handleSave = async () => {
    if (!editData.name || !editData.icon) {
      toast.error('Le nom et l\'icône sont obligatoires');
      return;
    }

    try {
      await base44.entities.Badge.update(editingId, editData);
      toast.success('Badge mis à jour');
      setEditingId(null);
      loadBadges();
    } catch (error) {
      toast.error('Erreur lors de la mise à jour');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Supprimer ce badge?')) return;
    
    try {
      await base44.entities.Badge.delete(id);
      toast.success('Badge supprimé');
      loadBadges();
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    }
  };

  const handleCreate = async () => {
    if (!editData.name || !editData.icon || !editData.level) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }

    try {
      await base44.entities.Badge.create(editData);
      toast.success('Badge créé');
      setShowForm(false);
      setEditData({});
      loadBadges();
    } catch (error) {
      toast.error('Erreur lors de la création');
    }
  };

  if (loading) return <div className="p-6 text-white/50">Chargement...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Gestion des Badges</h2>
        <Button
          onClick={() => {
            setShowForm(!showForm);
            setEditData({});
          }}
          className="bg-orange-500 hover:bg-orange-600"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nouveau Badge
        </Button>
      </div>

      {showForm && (
        <div className="bg-white/5 border border-white/10 rounded-lg p-6 space-y-4">
          <h3 className="text-white font-semibold">Créer un nouveau badge</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              placeholder="Nom du badge"
              value={editData.name || ''}
              onChange={(e) => setEditData({...editData, name: e.target.value})}
              className="bg-white/10 border-white/20 text-white"
            />
            <Input
              placeholder="Icône (emoji)"
              value={editData.icon || ''}
              onChange={(e) => setEditData({...editData, icon: e.target.value})}
              className="bg-white/10 border-white/20 text-white"
            />
            <Input
              placeholder="Niveau (1-6)"
              type="number"
              min="1"
              max="6"
              value={editData.level || ''}
              onChange={(e) => setEditData({...editData, level: parseInt(e.target.value)})}
              className="bg-white/10 border-white/20 text-white"
            />
            <Input
              placeholder="Couleur (hex)"
              type="color"
              value={editData.color || '#ff6b35'}
              onChange={(e) => setEditData({...editData, color: e.target.value})}
              className="bg-white/10 border-white/20 h-10"
            />
          </div>
          <Textarea
            placeholder="Description"
            value={editData.description || ''}
            onChange={(e) => setEditData({...editData, description: e.target.value})}
            className="bg-white/10 border-white/20 text-white"
          />
          <div className="flex gap-2">
            <Button onClick={handleCreate} className="bg-green-600 hover:bg-green-700">
              <Save className="w-4 h-4 mr-2" />
              Créer
            </Button>
            <Button onClick={() => setShowForm(false)} variant="outline">
              Annuler
            </Button>
          </div>
        </div>
      )}

      <div className="grid gap-4">
        {badges.map((badge) => (
          <div
            key={badge.id}
            className="bg-white/5 border border-white/10 rounded-lg p-4"
          >
            {editingId === badge.id ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    placeholder="Nom"
                    value={editData.name || ''}
                    onChange={(e) => setEditData({...editData, name: e.target.value})}
                    className="bg-white/10 border-white/20 text-white"
                  />
                  <Input
                    placeholder="Icône"
                    value={editData.icon || ''}
                    onChange={(e) => setEditData({...editData, icon: e.target.value})}
                    className="bg-white/10 border-white/20 text-white"
                  />
                  <Input
                    placeholder="Couleur"
                    type="color"
                    value={editData.color || '#ff6b35'}
                    onChange={(e) => setEditData({...editData, color: e.target.value})}
                    className="bg-white/10 border-white/20 h-10"
                  />
                  <Input
                    placeholder="Niveau"
                    type="number"
                    min="1"
                    max="6"
                    value={editData.level || ''}
                    onChange={(e) => setEditData({...editData, level: parseInt(e.target.value)})}
                    className="bg-white/10 border-white/20 text-white"
                  />
                </div>
                <Textarea
                  placeholder="Description"
                  value={editData.description || ''}
                  onChange={(e) => setEditData({...editData, description: e.target.value})}
                  className="bg-white/10 border-white/20 text-white"
                />
                <div className="flex gap-2">
                  <Button onClick={handleSave} className="bg-green-600 hover:bg-green-700">
                    <Save className="w-4 h-4 mr-2" />
                    Enregistrer
                  </Button>
                  <Button onClick={() => setEditingId(null)} variant="outline">
                    Annuler
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 flex-1">
                  <span className="text-3xl">{badge.icon}</span>
                  <div>
                    <h3 className="text-white font-semibold">{badge.name}</h3>
                    <p className="text-white/50 text-sm">{badge.description}</p>
                    <span className="text-xs text-white/40">Niveau {badge.level}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleEdit(badge)}
                    variant="outline"
                    size="icon"
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button
                    onClick={() => handleDelete(badge.id)}
                    variant="outline"
                    size="icon"
                    className="text-red-400 hover:text-red-300"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}