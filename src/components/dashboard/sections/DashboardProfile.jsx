import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { User, Shield, Ban, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function DashboardProfile() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userBadges, setUserBadges] = useState({});

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const allUsers = await base44.entities.User.list('-created_date', 100);
      setUsers(allUsers);
      
      // Charger les badges pour chaque utilisateur
      const badges = {};
      for (const user of allUsers) {
        const userBadgeList = await base44.entities.UserBadge.filter(
          { created_by: user.email },
          '-unlocked_at',
          1
        );
        if (userBadgeList.length > 0) {
          badges[user.email] = userBadgeList[0];
        }
      }
      setUserBadges(badges);
    } catch (error) {
      console.error('Error loading users:', error);
      toast.error('Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      await base44.entities.User.update(userId, { role: newRole });
      toast.success(`Rôle mis à jour en ${newRole}`);
      loadUsers();
    } catch (error) {
      console.error('Error updating role:', error);
      toast.error('Erreur lors de la mise à jour');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-orange-400 animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-white mb-2">Utilisateurs</h2>
        <p className="text-white/60">Gestion des utilisateurs et des rôles</p>
      </div>

      <div className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] rounded-xl p-6">
        <h3 className="text-xl font-semibold text-white mb-4">
          Liste des Utilisateurs ({users.length})
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06]">
                <th className="text-left py-3 px-4 text-white/70 font-medium">Utilisateur</th>
                <th className="text-left py-3 px-4 text-white/70 font-medium">Email</th>
                <th className="text-left py-3 px-4 text-white/70 font-medium">Rôle</th>
                <th className="text-left py-3 px-4 text-white/70 font-medium">Badge</th>
                <th className="text-left py-3 px-4 text-white/70 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b border-white/[0.06] hover:bg-white/[0.02] transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-white font-medium text-xs">
                        {user.full_name?.charAt(0) || user.email?.charAt(0).toUpperCase()}
                      </div>
                      <p className="text-white">{user.display_name || user.email?.split('@')[0]}</p>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-white/60">{user.email}</td>
                  <td className="py-3 px-4">
                    <span className={`text-xs px-2 py-1 rounded ${
                      user.role === 'admin'
                        ? 'bg-orange-500/20 text-orange-400'
                        : 'bg-white/10 text-white/70'
                    }`}>
                      {user.role === 'admin' ? 'Admin' : 'Utilisateur'}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    {userBadges[user.email] ? (
                      <span className="text-2xl">{userBadges[user.email].badge_name}</span>
                    ) : (
                      <span className="text-white/40 text-xs">Aucun badge</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    {user.role === 'user' ? (
                      <Button
                        onClick={() => handleRoleChange(user.id, 'admin')}
                        size="sm"
                        className="bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 text-xs"
                      >
                        <Shield className="w-3 h-3 mr-1" />
                        Admin
                      </Button>
                    ) : (
                      <Button
                        onClick={() => handleRoleChange(user.id, 'user')}
                        size="sm"
                        className="bg-white/10 hover:bg-white/20 text-white text-xs"
                      >
                        <User className="w-3 h-3 mr-1" />
                        User
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}