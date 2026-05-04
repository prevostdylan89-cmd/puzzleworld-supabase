import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { X, Upload, Loader2, Calendar, MapPin, Users, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function EventForm({ event, onClose, onSave }) {
  const [formData, setFormData] = useState({
    title: event?.title || '',
    short_description: event?.short_description || '',
    full_description: event?.full_description || '',
    event_date: event?.event_date || '',
    event_time: event?.event_time || '',
    location: event?.location || '',
    max_capacity: event?.max_capacity || '',
    image: event?.image || ''
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(event?.image || '');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef(null);

  const compressImage = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          
          // Resize if too large (max 1920px width)
          const maxWidth = 1920;
          if (width > maxWidth) {
            height = (height / width) * maxWidth;
            width = maxWidth;
          }
          
          canvas.width = width;
          canvas.height = height;
          
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          
          canvas.toBlob((blob) => {
            resolve(new File([blob], file.name, { type: 'image/jpeg' }));
          }, 'image/jpeg', 0.85);
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleImageChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast.error('Format non supporté. Utilisez JPG, PNG ou WEBP');
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image trop volumineuse (max 5 MB)');
      return;
    }

    // Create preview
    const previewUrl = URL.createObjectURL(file);
    setImagePreview(previewUrl);

    // Compress if needed
    let processedFile = file;
    if (file.size > 1 * 1024 * 1024) {
      toast.info('Compression de l\'image...');
      processedFile = await compressImage(file);
    }

    setImageFile(processedFile);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      let imageUrl = formData.image;

      // Upload new image if selected
      if (imageFile) {
        setUploading(true);
        toast.info('Upload de l\'image...');

        const { file_url } = await base44.integrations.Core.UploadFile({
          file: imageFile
        });

        imageUrl = file_url;
        setUploading(false);
      }

      const eventData = {
        ...formData,
        image: imageUrl,
        max_capacity: parseInt(formData.max_capacity) || 0,
        current_participants: event?.current_participants || 0
      };

      if (event?.id) {
        await base44.entities.Event.update(event.id, eventData);
        toast.success('Événement mis à jour !');
      } else {
        await base44.entities.Event.create(eventData);
        toast.success('Événement créé !');
      }

      onSave();
      onClose();
    } catch (error) {
      console.error('Error saving event:', error);
      toast.error('Erreur lors de l\'enregistrement');
    } finally {
      setSaving(false);
      setUploading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-[#0a0a2e] rounded-2xl border border-white/10 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="sticky top-0 bg-[#0a0a2e] border-b border-white/10 p-6 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">
            {event?.id ? 'Modifier l\'événement' : 'Nouvel événement'}
          </h2>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Image Upload */}
          <div>
            <label className="text-sm text-white/70 mb-2 block">Image de l'événement *</label>
            
            {imagePreview ? (
              <div className="relative group">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-full h-48 object-cover rounded-lg"
                />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                  <Button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-white/20 hover:bg-white/30 backdrop-blur-sm"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Changer la photo
                  </Button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-48 border-2 border-dashed border-white/20 rounded-lg bg-white/5 hover:bg-white/10 transition-colors flex flex-col items-center justify-center gap-3"
              >
                <ImageIcon className="w-12 h-12 text-white/40" />
                <div className="text-center">
                  <p className="text-white/70 text-sm font-medium">Cliquer pour ajouter une image</p>
                  <p className="text-white/40 text-xs mt-1">JPG, PNG ou WEBP • Max 5 MB</p>
                </div>
              </button>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleImageChange}
              className="hidden"
            />
          </div>

          {/* Title */}
          <div>
            <label className="text-sm text-white/70 mb-2 block">Titre *</label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Ex: Speed Puzzle Challenge"
              className="bg-white/5 border-white/10 text-white"
              required
            />
          </div>

          {/* Short Description */}
          <div>
            <label className="text-sm text-white/70 mb-2 block">Description courte *</label>
            <Input
              value={formData.short_description}
              onChange={(e) => setFormData({ ...formData, short_description: e.target.value })}
              placeholder="Une phrase d'accroche"
              className="bg-white/5 border-white/10 text-white"
              required
            />
          </div>

          {/* Full Description */}
          <div>
            <label className="text-sm text-white/70 mb-2 block">Description complète</label>
            <Textarea
              value={formData.full_description}
              onChange={(e) => setFormData({ ...formData, full_description: e.target.value })}
              placeholder="Détails de l'événement..."
              className="bg-white/5 border-white/10 text-white min-h-[100px]"
            />
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-white/70 mb-2 block flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Date *
              </label>
              <Input
                type="date"
                value={formData.event_date}
                onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
                className="bg-white/5 border-white/10 text-white"
                required
              />
            </div>
            <div>
              <label className="text-sm text-white/70 mb-2 block">Heure</label>
              <Input
                type="time"
                value={formData.event_time}
                onChange={(e) => setFormData({ ...formData, event_time: e.target.value })}
                className="bg-white/5 border-white/10 text-white"
              />
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="text-sm text-white/70 mb-2 block flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Lieu
            </label>
            <Input
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="Ex: Paris, France"
              className="bg-white/5 border-white/10 text-white"
            />
          </div>

          {/* Capacity */}
          <div>
            <label className="text-sm text-white/70 mb-2 block flex items-center gap-2">
              <Users className="w-4 h-4" />
              Capacité maximale *
            </label>
            <Input
              type="number"
              value={formData.max_capacity}
              onChange={(e) => setFormData({ ...formData, max_capacity: e.target.value })}
              placeholder="100"
              min="1"
              className="bg-white/5 border-white/10 text-white"
              required
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              onClick={onClose}
              variant="outline"
              className="flex-1 border-white/20 text-white hover:bg-white/5"
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={saving || uploading}
              className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white"
            >
              {saving || uploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {uploading ? 'Upload...' : 'Enregistrement...'}
                </>
              ) : (
                event?.id ? 'Mettre à jour' : 'Créer l\'événement'
              )}
            </Button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}