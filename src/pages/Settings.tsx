import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import {
  CogIcon,
  UserIcon,
  BellIcon,
  ShieldCheckIcon,
  PaintBrushIcon,
  GlobeAltIcon,
} from '@heroicons/react/24/outline'

interface SettingItem {
  id: string
  name: string
  description: string
  icon: any
  type: 'toggle' | 'select' | 'button'
  value?: boolean | string
  options?: { label: string; value: string }[]
}

const Settings = () => {
  const { user } = useAuth()
  const [settings, setSettings] = useState<SettingItem[]>([
    {
      id: 'notifications',
      name: 'Email Notifications',
      description: 'Receive notifications about attendance updates',
      icon: BellIcon,
      type: 'toggle',
      value: true,
    },
    {
      id: 'darkMode',
      name: 'Dark Mode',
      description: 'Use dark theme for the interface',
      icon: PaintBrushIcon,
      type: 'toggle',
      value: false,
    },
    {
      id: 'language',
      name: 'Language',
      description: 'Choose your preferred language',
      icon: GlobeAltIcon,
      type: 'select',
      value: 'en',
      options: [
        { label: 'English', value: 'en' },
        { label: 'Spanish', value: 'es' },
        { label: 'French', value: 'fr' },
      ],
    },
    {
      id: 'autoBackup',
      name: 'Auto Backup',
      description: 'Automatically backup attendance data',
      icon: ShieldCheckIcon,
      type: 'toggle',
      value: true,
    },
  ])

  const handleToggle = (id: string) => {
    setSettings(settings.map(setting => 
      setting.id === id 
        ? { ...setting, value: !setting.value }
        : setting
    ))
  }

  const handleSelect = (id: string, value: string) => {
    setSettings(settings.map(setting => 
      setting.id === id 
        ? { ...setting, value }
        : setting
    ))
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Settings</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Manage your account settings and preferences
        </p>
      </div>

      {/* Profile Section */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
        <div className="flex items-center space-x-4 mb-4">
          <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900 rounded-full flex items-center justify-center">
            <UserIcon className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {user?.name || 'User'}
            </h2>
            <p className="text-gray-600 dark:text-gray-400">{user?.email}</p>
            <span className="inline-block px-2 py-1 text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 rounded-full mt-1">
              {user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'User'}
            </span>
          </div>
        </div>
        <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
          Edit Profile
        </button>
      </div>

      {/* Settings Options */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
            <CogIcon className="w-5 h-5 mr-2" />
            Preferences
          </h3>
        </div>
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {settings.map((setting) => (
            <div key={setting.id} className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-start space-x-3">
                  <setting.icon className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                      {setting.name}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {setting.description}
                    </p>
                  </div>
                </div>
                
                {setting.type === 'toggle' && (
                  <button
                    onClick={() => handleToggle(setting.id)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      setting.value
                        ? 'bg-indigo-600'
                        : 'bg-gray-200 dark:bg-gray-600'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        setting.value ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                )}
                
                {setting.type === 'select' && (
                  <select
                    value={setting.value as string}
                    onChange={(e) => handleSelect(setting.id, e.target.value)}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                  >
                    {setting.options?.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-red-200 dark:border-red-800 mt-6">
        <div className="p-6 border-b border-red-200 dark:border-red-800">
          <h3 className="text-lg font-semibold text-red-600 dark:text-red-400">Danger Zone</h3>
        </div>
        <div className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                Delete Account
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Permanently delete your account and all associated data
              </p>
            </div>
            <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
              Delete Account
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Settings
