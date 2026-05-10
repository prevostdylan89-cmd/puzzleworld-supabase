import React, { useState, useEffect } from 'react';
import { supabase } from '@/api/supabaseClient';

export default function PostAuthorAvatar({ authorEmail, authorName, authorInitials }) {
  const [profilePhoto, setProfilePhoto] = useState(null);

  useEffect(() => {
    if (!authorEmail) return;
    const fetchPhoto = async () => {
      try {
        const { data } = await supabase
          .from('user_profiles')
          .select('profile_photo')
          .eq('created_by', authorEmail)
          .maybeSingle();
        if (data?.profile_photo) setProfilePhoto(data.profile_photo);
      } catch (error) {
        console.error('Error fetching profile photo:', error);
      }
    };
    fetchPhoto();
  }, [authorEmail]);

  return (
    <div className="h-10 w-10 rounded-full ring-2 ring-orange-500/20 overflow-hidden bg-gradient-to-br from-orange-500 to-orange-600 flex-shrink-0">
      {profilePhoto ? (
        <img src={profilePhoto} alt={authorEmail} className="w-full h-full object-cover" />
      ) : (
        <div className="text-white text-sm font-medium opacity-100 w-full h-full flex items-center justify-center">
          {authorInitials}
        </div>
      )}
    </div>
  );
}
