import React, { useState, useRef } from 'react';
import { Camera, Loader2, Upload, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { useLanguage } from '@/components/LanguageContext';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function EditProfileDialog({ user, onUpdate }) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploadingProfile, setUploadingProfile] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState(user?.profile_photo || '');
  const [coverPhoto, setCoverPhoto] = useState(user?.cover_photo || '');

  const handleProfileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error(t('selectImageError'));
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error(t('imageTooLarge'));
      return;
    }

    setUploadingProfile(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setProfilePhoto(file_url);
      toast.success(t('imageUploaded'));
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(t('uploadError'));
    } finally {
      setUploadingProfile(false);
    }
  };

  const handleCoverUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error(t('selectImageError'));
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error(t('imageTooLarge'));
      return;
    }

    setUploadingCover(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setCoverPhoto(file_url);
      toast.success(t('imageUploaded'));
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(t('uploadError'));
    } finally {
      setUploadingCover(false);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const currentUser = await base44.auth.me();
      
      // Update User entity
      await base44.auth.updateMe({
        profile_photo: profilePhoto,
        cover_photo: coverPhoto
      });
      
      // Update UserProfile entity
      const userProfiles = await base44.entities.UserProfile.filter({
        email: currentUser.email
      });
      
      if (userProfiles.length > 0) {
        await base44.entities.UserProfile.update(userProfiles[0].id, {
          profile_photo: profilePhoto
        });
      } else {
        await base44.entities.UserProfile.create({
          email: currentUser.email,
          profile_photo: profilePhoto
        });
      }
      
      toast.success(t('profileUpdated'));
      setOpen(false);
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error(t('updateError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          size="sm"
          variant="outline"
          className="border-white/20 text-white bg-transparent hover:bg-white/5"
        >
          <Camera className="w-4 h-4 mr-2" />
          {t('editProfile')}
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-[#0a0a2e] border-white/10 text-white">
        <DialogHeader>
          <DialogTitle className="text-white">{t('editProfile')}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {/* Profile Photo */}
          <div>
            <label className="text-white/70 text-sm mb-2 block">{t('profilePhoto')}</label>
            <div className="flex items-center gap-3">
              {profilePhoto && (
                <img
                  src={profilePhoto}
                  alt="Preview"
                  className="w-20 h-20 rounded-full object-cover border-2 border-white/10"
                />
              )}
              <div className="flex-1 space-y-2">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/jpg"
                  onChange={handleProfileUpload}
                  className="hidden"
                  id="profile-upload"
                />
                <Button
                  type="button"
                  onClick={() => document.getElementById('profile-upload').click()}
                  disabled={uploadingProfile}
                  variant="outline"
                  className="w-full border-white/20 text-white bg-transparent hover:bg-white/5"
                >
                  {uploadingProfile ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {t('uploading')}
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      {t('chooseImage')}
                    </>
                  )}
                </Button>
                <p className="text-xs text-white/40">JPG, PNG - Max 5MB</p>
              </div>
            </div>
          </div>

          {/* Cover Photo */}
          <div>
            <label className="text-white/70 text-sm mb-2 block">{t('coverPhoto')}</label>
            <div className="space-y-2">
              {coverPhoto && (
                <img
                  src={coverPhoto}
                  alt="Preview"
                  className="w-full h-32 rounded-lg object-cover border-2 border-white/10"
                />
              )}
              <input
                type="file"
                accept="image/jpeg,image/png,image/jpg"
                onChange={handleCoverUpload}
                className="hidden"
                id="cover-upload"
              />
              <Button
                type="button"
                onClick={() => document.getElementById('cover-upload').click()}
                disabled={uploadingCover}
                variant="outline"
                className="w-full border-white/20 text-white bg-transparent hover:bg-white/5"
              >
                {uploadingCover ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {t('uploading')}
                  </>
                ) : (
                  <>
                    <ImageIcon className="w-4 h-4 mr-2" />
                    {t('chooseBanner')}
                  </>
                )}
              </Button>
              <p className="text-xs text-white/40">JPG, PNG - Max 5MB - {t('recommended')}: 1200x400px</p>
            </div>
          </div>
          <Button
            onClick={handleSave}
            disabled={loading}
            className="w-full bg-orange-500 hover:bg-orange-600"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : t('save')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}