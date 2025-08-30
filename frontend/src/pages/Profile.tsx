import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Camera, 
  Edit3, 
  Save, 
  X, 
  Shield, 
  Bell, 
  Globe, 
  CreditCard,
  Key,
  Trash2,
  ArrowLeft
} from 'lucide-react';
import { useAuthStore } from '@/store/session';
import { useThemeStore } from '@/store/theme';

const Profile: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, updateUser } = useAuthStore();
  const { isDark } = useThemeStore();
  
  const [isEditing, setIsEditing] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    location: user?.location || '',
    bio: user?.bio || ''
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = () => {
    // Here you would typically call an API to update user data
    updateUser({ ...user, ...formData });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setFormData({
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
      location: user?.location || '',
      bio: user?.bio || ''
    });
    setIsEditing(false);
  };

  const handleAvatarUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setIsUploadingAvatar(true);
      // Simulate upload
      setTimeout(() => {
        const reader = new FileReader();
        reader.onload = (e) => {
          updateUser({ ...user, avatar: e.target?.result as string });
          setIsUploadingAvatar(false);
        };
        reader.readAsDataURL(file);
      }, 1000);
    }
  };

  const profileSections = [
    {
      title: t('profile.security', 'Security'),
      icon: Shield,
      items: [
        { label: t('profile.changePassword', 'Change Password'), icon: Key, action: () => {} },
        { label: t('profile.twoFactor', 'Two-Factor Authentication'), icon: Shield, action: () => {} },
        { label: t('profile.loginHistory', 'Login History'), icon: Bell, action: () => {} }
      ]
    },
    {
      title: t('profile.preferences', 'Preferences'),
      icon: Bell,
      items: [
        { label: t('profile.notifications', 'Notifications'), icon: Bell, action: () => {} },
        { label: t('profile.language', 'Language'), icon: Globe, action: () => {} },
        { label: t('profile.timezone', 'Timezone'), icon: Globe, action: () => {} }
      ]
    },
    {
      title: t('profile.payment', 'Payment'),
      icon: CreditCard,
      items: [
        { label: t('profile.paymentMethods', 'Payment Methods'), icon: CreditCard, action: () => {} },
        { label: t('profile.billingHistory', 'Billing History'), icon: CreditCard, action: () => {} }
      ]
    }
  ];

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900' : 'bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40'}`}>
      {/* Header */}
      <div className={`sticky top-0 z-40 border-b ${isDark ? 'border-white/10' : 'border-slate-200/50'}`}>
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className={`p-2 rounded-xl transition-colors ${isDark ? 'bg-white/5 hover:bg-white/10' : 'bg-slate-100 hover:bg-slate-200'}`}
            >
              <ArrowLeft className={`h-5 w-5 ${isDark ? 'text-white' : 'text-slate-700'}`} />
            </button>
            <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{t('profile.title', 'Profile')}</h1>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Profile Header */}
        <div className={`${isDark ? 'bg-white/5 border-white/10' : 'bg-white/80 border-slate-200/50'} backdrop-blur-xl rounded-3xl border p-8 mb-8`}>
          <div className="flex flex-col lg:flex-row items-start lg:items-center gap-6">
            {/* Avatar Section */}
            <div className="relative group">
              <div className="relative">
                {user?.avatar ? (
                  <img 
                    src={user.avatar} 
                    alt={user.name} 
                    className="h-24 w-24 rounded-full object-cover ring-4 ring-white/10 shadow-2xl"
                  />
                ) : (
                  <div className="h-24 w-24 rounded-full bg-gradient-to-br from-red-500 to-yellow-500 flex items-center justify-center text-white text-2xl font-bold shadow-2xl">
                    {(user?.name?.[0] || 'U').toUpperCase()}
                  </div>
                )}
                
                {/* Upload Overlay */}
                <div className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarUpload}
                      className="hidden"
                    />
                    <Camera className="h-6 w-6 text-white" />
                  </label>
                </div>
                
                {/* Upload Loading */}
                {isUploadingAvatar && (
                  <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                  </div>
                )}
              </div>
            </div>

            {/* User Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-2">
                <h2 className={`text-2xl font-bold truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      className={`border rounded-lg px-3 py-1 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500/50 ${isDark ? 'bg-white/10 border-white/20 text-white placeholder-white/50' : 'bg-white border-slate-300 text-slate-900'}`}
                      placeholder={t('profile.namePlaceholder', 'Enter your name')}
                    />
                  ) : (
                    formData.name || user?.name || 'User'
                  )}
                </h2>
                
                {isEditing ? (
                  <div className="flex gap-2">
                    <button
                      onClick={handleSave}
                      className="p-2 rounded-lg bg-green-500/20 hover:bg-green-500/30 transition-colors"
                    >
                      <Save className="h-4 w-4 text-green-400" />
                    </button>
                    <button
                      onClick={handleCancel}
                      className="p-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 transition-colors"
                    >
                      <X className="h-4 w-4 text-red-400" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setIsEditing(true)}
                    className={`p-2 rounded-lg transition-colors ${isDark ? 'bg-white/5 hover:bg-white/10' : 'bg-slate-100 hover:bg-slate-200'}`}
                  >
                    <Edit3 className={`h-4 w-4 ${isDark ? 'text-white/70' : 'text-slate-600'}`} />
                  </button>
                )}
              </div>
              
              <p className={`text-sm mb-4 ${isDark ? 'text-white/60' : 'text-slate-600'}`}>
                {isEditing ? (
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className={`border rounded-lg px-3 py-1 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500/50 w-full ${isDark ? 'bg-white/10 border-white/20 text-white/60 placeholder-white/30' : 'bg-white border-slate-300 text-slate-700'}`}
                    placeholder={t('profile.emailPlaceholder', 'Enter your email')}
                  />
                ) : (
                  formData.email || user?.email || 'user@example.com'
                )}
              </p>

              {/* Bio */}
              <div className="mb-4">
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-white/80' : 'text-slate-700'}`}>
                  {t('profile.bio', 'Bio')}
                </label>
                {isEditing ? (
                  <textarea
                    value={formData.bio}
                    onChange={(e) => handleInputChange('bio', e.target.value)}
                    rows={3}
                    className={`w-full border rounded-lg px-3 py-2 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500/50 resize-none ${isDark ? 'bg-white/10 border-white/20 text-white placeholder-white/30' : 'bg-white border-slate-300 text-slate-700'}`}
                    placeholder={t('profile.bioPlaceholder', 'Tell us about yourself...')}
                  />
                ) : (
                  <p className={`text-sm ${isDark ? 'text-white/70' : 'text-slate-600'}`}>
                    {formData.bio || t('profile.noBio', 'No bio added yet.')}
                  </p>
                )}
              </div>

              {/* Contact Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <Phone className={`h-4 w-4 ${isDark ? 'text-white/50' : 'text-slate-500'}`} />
                  <span className={`text-sm ${isDark ? 'text-white/70' : 'text-slate-600'}`}>
                    {isEditing ? (
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        className={`border rounded-lg px-2 py-1 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500/50 text-sm ${isDark ? 'bg-white/10 border-white/20 text-white/70 placeholder-white/30' : 'bg-white border-slate-300 text-slate-700'}`}
                        placeholder={t('profile.phonePlaceholder', 'Phone number')}
                      />
                    ) : (
                      formData.phone || t('profile.noPhone', 'No phone number')
                    )}
                  </span>
                </div>
                
                <div className="flex items-center gap-3">
                  <MapPin className={`h-4 w-4 ${isDark ? 'text-white/50' : 'text-slate-500'}`} />
                  <span className={`text-sm ${isDark ? 'text-white/70' : 'text-slate-600'}`}>
                    {isEditing ? (
                      <input
                        type="text"
                        value={formData.location}
                        onChange={(e) => handleInputChange('location', e.target.value)}
                        className={`border rounded-lg px-2 py-1 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500/50 text-sm ${isDark ? 'bg-white/10 border-white/20 text-white/70 placeholder-white/30' : 'bg-white border-slate-300 text-slate-700'}`}
                        placeholder={t('profile.locationPlaceholder', 'Location')}
                      />
                    ) : (
                      formData.location || t('profile.noLocation', 'No location set')
                    )}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Sections */}
        <div className="space-y-6">
          {profileSections.map((section, sectionIndex) => (
            <div key={sectionIndex} className={`${isDark ? 'bg-white/5 border-white/10' : 'bg-white/80 border-slate-200/50'} backdrop-blur-xl rounded-2xl border overflow-hidden`}>
              <div className={`p-6 border-b ${isDark ? 'border-white/10' : 'border-slate-200/50'}`}>
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${isDark ? 'bg-white/10' : 'bg-slate-100'}`}>
                    <section.icon className={`h-5 w-5 ${isDark ? 'text-white' : 'text-slate-700'}`} />
                  </div>
                  <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{section.title}</h3>
                </div>
              </div>
              
              <div className="p-2">
                {section.items.map((item, itemIndex) => (
                  <button
                    key={itemIndex}
                    onClick={item.action}
                    className={`flex w-full items-center gap-3 px-4 py-3 rounded-xl text-left transition-all duration-200 group ${isDark ? 'text-white/80 hover:bg-white/10 hover:text-white' : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'}`}
                  >
                    <div className={`p-1.5 rounded-lg transition-colors ${isDark ? 'bg-white/5 group-hover:bg-white/10' : 'bg-slate-100 group-hover:bg-slate-200'}`}>
                      <item.icon className={`h-4 w-4 ${isDark ? 'text-white/70' : 'text-slate-600'}`} />
                    </div>
                    <span className="font-medium">{item.label}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}

          {/* Danger Zone */}
          <div className={`${isDark ? 'bg-red-500/5 border-red-500/20' : 'bg-red-50/80 border-red-200/50'} backdrop-blur-xl rounded-2xl border overflow-hidden`}>
            <div className={`p-6 border-b ${isDark ? 'border-red-500/20' : 'border-red-200/50'}`}>
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${isDark ? 'bg-red-500/20' : 'bg-red-100'}`}>
                  <Trash2 className="h-5 w-5 text-red-400" />
                </div>
                <h3 className="text-lg font-semibold text-red-400">{t('profile.dangerZone', 'Danger Zone')}</h3>
              </div>
            </div>
            
            <div className="p-2">
              <button className={`flex w-full items-center gap-3 px-4 py-3 rounded-xl text-left text-red-400 transition-all duration-200 group ${isDark ? 'hover:bg-red-500/10' : 'hover:bg-red-100'}`}>
                <div className={`p-1.5 rounded-lg transition-colors ${isDark ? 'bg-red-500/10 group-hover:bg-red-500/20' : 'bg-red-100 group-hover:bg-red-200'}`}>
                  <Trash2 className="h-4 w-4" />
                </div>
                <span className="font-medium">{t('profile.deleteAccount', 'Delete Account')}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
