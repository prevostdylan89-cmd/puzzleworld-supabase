import React, { useState, useEffect } from 'react';
import { supabase } from '@/api/supabaseClient';
import { User, Shield, Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function DashboardProfile() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadUsers(); }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      // Use user_profiles table which stores public user data
      const { data: profiles } = await supabase
        .from('user_profiles')
        .select('*')
        .order('created_date', { ascending: false })
        .limit(200);
      setUsers(profiles || []);
    } catch (error) {
      console.error('Error loading users:', error);
      toast.error('Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  // Role management via user_metadata requires admin API - show info instead
  const handleRoleChange = async (userEmail, newRole) => {
    try {
      // Update role in user_profiles table
      await supabase
        .from('user_profiles')
        .update({ role: newRole })
        .eq('created_by', userEmail);
      toast.success(`Rôle mis à jour en ${newRole}. Reconnexion requise pour l'utilisateur.`);
      loadUsers();
    } catch (error) {
      toast.error('Erreur lors de la mise à jour');
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="w-8 h-8 text-orange-400 animate-spin" />
    </div>
  );

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">Utilisateurs</h2>
          <p className="text-white/60">Gestion des utilisateurs et des rôles ({users.length} profils)</p>
        </div>
        <Button onClick={loadUsers} variant="outline" size="sm" className="border-white/10 text-white/60 hover:text-white gap-2">
          <RefreshCw className="w-4 h-4" /> Actualiser
        </Button>
      </div>

      <div className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] rounded-xl p-6">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06]">
                <th className="text-left py-3 px-4 text-white/70 font-medium">Utilisateur</th>
                <th className="text-left py-3 px-4 text-white/70 font-medium">Email</th>
                <th className="text-left py-3 px-4 text-white/70 font-medium">Code ami</th>
                <th className="text-left py-3 px-4 text-white/70 font-medium">Rôle</th>
                <th className="text-left py-3 px-4 text-white/70 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => {
                const isAdmin = user.role === 'admin';
                return (
                  <tr key={user.id} className="border-b border-white/[0.06] hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        {user.profile_photo ? (
                          <img src={user.profile_photo} alt="" className="w-8 h-8 rounded-full object-cover" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-white font-medium text-xs">
                            {(user.display_name || user.email || '?').charAt(0).toUpperCase()}
                          </div>
                        )}
                        <p className="text-white">{user.display_name || user.email?.split('@')[0]}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-white/60 text-xs">{user.created_by}</td>
                    <td className="py-3 px-4 text-orange-400/70 text-xs font-mono">
                      {user.friend_code ? `@${user.friend_code}` : '—'}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`text-xs px-2 py-1 rounded ${isAdmin ? 'bg-orange-500/20 text-orange-400' : 'bg-white/10 text-white/70'}`}>
                        {isAdmin ? '👑 Admin' : 'Utilisateur'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {!isAdmin ? (
                        <Button onClick={() => handleRoleChange(user.created_by, 'admin')} size="sm"
                          className="bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 text-xs">
                          <Shield className="w-3 h-3 mr-1" /> Passer Admin
                        </Button>
                      ) : (
                        <Button onClick={() => handleRoleChange(user.created_by, 'user')} size="sm"
                          className="bg-white/10 hover:bg-white/20 text-white text-xs">
                          <User className="w-3 h-3 mr-1" /> Retirer Admin
                        </Button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {users.length === 0 && (
            <p className="text-white/40 text-center py-12">Aucun profil utilisateur trouvé</p>
          )}
        </div>
      </div>
    </div>
  );
}
