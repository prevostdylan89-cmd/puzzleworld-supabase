import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';

export default function PostAuthorAvatar({ authorEmail, authorName, authorInitials }) {
  const [profilePhoto, setProfilePhoto] = useState(null);

  useEffect(() => {
    const searchName = authorName || authorEmail;
    if (!searchName) return;

    const fetchPhoto = async () => {
      try {
        // Search by display_name first (the pseudo shown next to avatar)
        let profiles = await base44.entities.UserProfile.filter({ display_name: searchName });
        if (profiles.length > 0 && profiles[0].profile_photo) {
          setProfilePhoto(profiles[0].profile_photo);
          return;
        }
        // Fallback: try by email
        profiles = await base44.entities.UserProfile.filter({ email: authorEmail });
        if (profiles.length > 0 && profiles[0].profile_photo) {
          setProfilePhoto(profiles[0].profile_photo);
        }
      } catch (error) {
        console.error('Error fetching profile photo:', error);
      }
    };

    fetchPhoto();
  }, [authorName, authorEmail]);

  return (
    <div className="h-10 w-10 rounded-full ring-2 ring-orange-500/20 overflow-hidden bg-gradient-to-br from-orange-500 to-orange-600 flex-shrink-0">
      {profilePhoto ?
      <img src={profilePhoto} alt={authorEmail} className="w-full h-full object-cover" /> :

      <div className="text-white text-sm font-medium opacity-100 w-full h-full flex items-center justify-center">
          {authorInitials}
        </div>
      }
    </div>);

}