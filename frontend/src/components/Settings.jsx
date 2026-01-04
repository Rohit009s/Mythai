import { useState, useEffect } from 'react'
import { WavyBackground } from './ui/wavy-background'
import { SaveStardustButton, CompactStardustButton } from './ui/stardust-button'
import { Edit, Save, X, LogOut } from 'lucide-react'
import './Settings.css'

const Settings = ({ user, onUpdateUser, onLogout, apiUrl }) => {
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    dateOfBirth: user?.dateOfBirth || '',
    religion: user?.religion || '',
    language: user?.language || 'en'
  })
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        dateOfBirth: user.dateOfBirth || '',
        religion: user.religion || '',
        language: user.language || 'en'
      })
    }
  }, [user])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSave = async () => {
    setLoading(true)
    setMessage('')
    
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${apiUrl}/api/auth/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        const data = await response.json()
        onUpdateUser(data.user)
        setIsEditing(false)
        setMessage('Profile updated successfully!')
      } else {
        const error = await response.json()
        setMessage(error.message || 'Failed to update profile')
      }
    } catch (error) {
      console.error('Update error:', error)
      setMessage('Failed to update profile')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    setFormData({
      name: user?.name || '',
      email: user?.email || '',
      dateOfBirth: user?.dateOfBirth || '',
      religion: user?.religion || '',
      language: user?.language || 'en'
    })
    setIsEditing(false)
    setMessage('')
  }

  return (
    <WavyBackground
      className="max-w-4xl mx-auto pb-40"
      containerClassName="settings-wavy-bg"
      colors={[
        "#38bdf8", // Sky blue
        "#818cf8", // Indigo
        "#c084fc", // Purple
        "#e879f9", // Pink
        "#22d3ee", // Cyan
      ]}
      waveWidth={60}
      backgroundFill="black"
      blur={15}
      speed="slow"
      waveOpacity={0.4}
    >
      <div className="settings-container">
        <div className="settings-card">
          <div className="settings-header">
            <h1>Settings</h1>
            <p>Manage your personal information and preferences</p>
          </div>

          {message && (
            <div className={`message ${message.includes('success') ? 'success' : 'error'}`}>
              {message}
            </div>
          )}

          <div className="settings-form">
            <div className="form-group">
              <label htmlFor="name">Full Name</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                disabled={!isEditing}
                placeholder="Enter your full name"
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                disabled={!isEditing}
                placeholder="Enter your email"
              />
            </div>

            <div className="form-group">
              <label htmlFor="dateOfBirth">Date of Birth</label>
              <input
                type="date"
                id="dateOfBirth"
                name="dateOfBirth"
                value={formData.dateOfBirth}
                onChange={handleInputChange}
                disabled={!isEditing}
              />
            </div>

            <div className="form-group">
              <label htmlFor="religion">Religion/Belief System</label>
              <select
                id="religion"
                name="religion"
                value={formData.religion}
                onChange={handleInputChange}
                disabled={!isEditing}
              >
                <option value="">Select your religion</option>
                <option value="hinduism">Hinduism</option>
                <option value="christianity">Christianity</option>
                <option value="islam">Islam</option>
                <option value="buddhism">Buddhism</option>
                <option value="sikhism">Sikhism</option>
                <option value="jainism">Jainism</option>
                <option value="greek">Greek Mythology</option>
                <option value="norse">Norse Mythology</option>
                <option value="egyptian">Egyptian Mythology</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="language">Preferred Language</label>
              <select
                id="language"
                name="language"
                value={formData.language}
                onChange={handleInputChange}
                disabled={!isEditing}
              >
                <option value="en">English</option>
                <option value="hi">Hindi</option>
                <option value="te">Telugu</option>
                <option value="ta">Tamil</option>
                <option value="kn">Kannada</option>
                <option value="ml">Malayalam</option>
              </select>
            </div>

            <div className="form-actions">
              {!isEditing ? (
                <CompactStardustButton 
                  className="edit-profile-btn"
                  onClick={() => setIsEditing(true)}
                  icon={Edit}
                >
                  Edit Profile
                </CompactStardustButton>
              ) : (
                <div className="edit-actions">
                  <CompactStardustButton 
                    className="cancel-btn"
                    onClick={handleCancel}
                    disabled={loading}
                    icon={X}
                    variant="voice"
                  >
                    Cancel
                  </CompactStardustButton>
                  <SaveStardustButton 
                    className="save-btn"
                    onClick={handleSave}
                    disabled={loading}
                    icon={Save}
                  >
                    {loading ? 'Saving...' : 'Save Changes'}
                  </SaveStardustButton>
                </div>
              )}
            </div>

            <div className="danger-zone">
              <h3>Account Actions</h3>
              <CompactStardustButton 
                className="logout-btn"
                onClick={onLogout}
                icon={LogOut}
                variant="voice"
              >
                Logout
              </CompactStardustButton>
            </div>
          </div>
        </div>
      </div>
    </WavyBackground>
  )
}

export default Settings