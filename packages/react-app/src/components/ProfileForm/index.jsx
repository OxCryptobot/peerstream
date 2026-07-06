import React, { useState, useEffect } from 'react'
import styled from 'styled-components'
import { useCeramic } from '../../contexts/Ceramic'
import { validateProfile, hasErrors } from '../../utils/profileValidation'

const FormContainer = styled.div`
  background: white;
  border-radius: 1rem;
  padding: 2rem;
  box-shadow: 0 4px 12px rgba(30, 64, 175, 0.1);
  max-width: 600px;
`

const FormGroup = styled.div`
  margin-bottom: 1.5rem;

  &:last-child {
    margin-bottom: 0;
  }
`

const Label = styled.label`
  display: block;
  font-weight: 600;
  color: #1F2937;
  margin-bottom: 0.5rem;
  font-size: 0.95rem;

  span {
    color: #EF4444;
  }
`

const Input = styled.input`
  width: 100%;
  padding: 0.75rem;
  border: 1px solid ${(props) => (props.error ? '#EF4444' : '#E5E7EB')};
  border-radius: 0.5rem;
  font-size: 0.95rem;
  transition: all 0.2s ease;

  &:focus {
    outline: none;
    border-color: #1E40AF;
    box-shadow: 0 0 0 3px rgba(30, 64, 175, 0.1);
  }

  &:disabled {
    background-color: #F9FAFB;
    color: #9CA3AF;
  }
`

const TextArea = styled.textarea`
  width: 100%;
  padding: 0.75rem;
  border: 1px solid ${(props) => (props.error ? '#EF4444' : '#E5E7EB')};
  border-radius: 0.5rem;
  font-size: 0.95rem;
  font-family: inherit;
  resize: vertical;
  min-height: 100px;
  transition: all 0.2s ease;

  &:focus {
    outline: none;
    border-color: #1E40AF;
    box-shadow: 0 0 0 3px rgba(30, 64, 175, 0.1);
  }

  &:disabled {
    background-color: #F9FAFB;
    color: #9CA3AF;
  }
`

const ErrorMessage = styled.p`
  color: #EF4444;
  font-size: 0.8rem;
  margin-top: 0.25rem;
  margin-bottom: 0;
`

const ExpertiseContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.75rem;
`

const ExpertiseTag = styled.div`
  background: linear-gradient(135deg, #F0F4FF 0%, #F5EBFF 100%);
  color: #1E40AF;
  padding: 0.5rem 0.75rem;
  border-radius: 0.5rem;
  border: 1px solid #E0E7FF;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.85rem;
  font-weight: 500;

  button {
    background: none;
    border: none;
    color: #1E40AF;
    cursor: pointer;
    font-size: 1rem;
    padding: 0;
    display: flex;
    align-items: center;

    &:hover {
      color: #7C3AED;
    }
  }
`

const ExpertiseInput = styled.div`
  display: flex;
  gap: 0.5rem;
  align-items: center;

  input {
    flex: 1;
  }

  button {
    padding: 0.75rem 1rem;
    background: linear-gradient(135deg, #1E40AF 0%, #7C3AED 100%);
    color: white;
    border: none;
    border-radius: 0.5rem;
    cursor: pointer;
    font-weight: 500;
    transition: all 0.2s ease;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(30, 64, 175, 0.3);
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      transform: none;
    }
  }
`

const SocialInputs = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;

  @media (max-width: 600px) {
    grid-template-columns: 1fr;
  }
`

const ButtonGroup = styled.div`
  display: flex;
  gap: 1rem;
  margin-top: 2rem;
  justify-content: flex-end;

  @media (max-width: 600px) {
    flex-direction: column-reverse;
  }
`

const Button = styled.button`
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
  font-size: 0.95rem;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`

const PrimaryButton = styled(Button)`
  background: linear-gradient(135deg, #1E40AF 0%, #7C3AED 100%);
  color: white;

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(30, 64, 175, 0.3);
  }
`

const SecondaryButton = styled(Button)`
  background: #F3F4F6;
  color: #6B7280;

  &:hover:not(:disabled) {
    background: #E5E7EB;
  }
`

const SuccessMessage = styled.div`
  background: linear-gradient(135deg, #D1FAE5 0%, #A7F3D0 100%);
  color: #065F46;
  padding: 1rem;
  border-radius: 0.5rem;
  margin-bottom: 1.5rem;
  border-left: 4px solid #10B981;
`

const CharacterCount = styled.span`
  font-size: 0.8rem;
  color: #9CA3AF;
  display: block;
  margin-top: 0.25rem;
`

export default function ProfileForm({ initialData = null, onSuccess, onCancel, isLoading: externalLoading = false }) {
  const { updateProfile, saveProfile } = useCeramic()
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    bio: initialData?.bio || '',
    expertise: initialData?.expertise || [],
    hourlyRate: initialData?.hourlyRate || '',
    social: initialData?.social || { github: '', twitter: '', website: '' }
  })

  const [errors, setErrors] = useState({})
  const [expertiseInput, setExpertiseInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const isEditing = !!initialData

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }))
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: null
      }))
    }
  }

  const handleSocialChange = (type, value) => {
    setFormData((prev) => ({
      ...prev,
      social: {
        ...prev.social,
        [type]: value
      }
    }))
    if (errors[type]) {
      setErrors((prev) => ({
        ...prev,
        [type]: null
      }))
    }
  }

  const addExpertise = () => {
    if (!expertiseInput.trim()) return
    if (formData.expertise.includes(expertiseInput.trim())) {
      setErrors((prev) => ({
        ...prev,
        expertise: 'This skill is already added'
      }))
      return
    }
    setFormData((prev) => ({
      ...prev,
      expertise: [...prev.expertise, expertiseInput.trim()]
    }))
    setExpertiseInput('')
    if (errors.expertise) {
      setErrors((prev) => ({
        ...prev,
        expertise: null
      }))
    }
  }

  const removeExpertise = (index) => {
    setFormData((prev) => ({
      ...prev,
      expertise: prev.expertise.filter((_, i) => i !== index)
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Validate form
    const validationErrors = validateProfile(formData)
    if (hasErrors(validationErrors)) {
      setErrors(validationErrors)
      return
    }

    try {
      setLoading(true)
      const method = isEditing ? updateProfile : saveProfile
      await method(formData)
      setSuccess(true)
      setTimeout(() => {
        setSuccess(false)
        onSuccess && onSuccess()
      }, 1500)
    } catch (err) {
      setErrors({ submit: err.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <FormContainer>
      {success && <SuccessMessage>✓ Profile saved successfully!</SuccessMessage>}

      <form onSubmit={handleSubmit}>
        {/* Full Name */}
        <FormGroup>
          <Label>
            Full Name <span>*</span>
          </Label>
          <Input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            placeholder="e.g. Alice Chen"
            disabled={loading || externalLoading}
            error={errors.name}
          />
          {errors.name && <ErrorMessage>{errors.name}</ErrorMessage>}
        </FormGroup>

        {/* Bio */}
        <FormGroup>
          <Label>
            Bio <span>*</span>
          </Label>
          <TextArea
            name="bio"
            value={formData.bio}
            onChange={handleInputChange}
            placeholder="Describe your expertise and experience..."
            disabled={loading || externalLoading}
            error={errors.bio}
          />
          {errors.bio && <ErrorMessage>{errors.bio}</ErrorMessage>}
          <CharacterCount>{formData.bio.length}/500 characters</CharacterCount>
        </FormGroup>

        {/* Expertise */}
        <FormGroup>
          <Label>
            Expertise <span>*</span>
          </Label>
          <ExpertiseInput>
            <Input
              type="text"
              value={expertiseInput}
              onChange={(e) => setExpertiseInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addExpertise())}
              placeholder="Add a skill, then click Add"
              disabled={loading || externalLoading}
            />
            <button type="button" onClick={addExpertise} disabled={loading || externalLoading || !expertiseInput.trim()}>
              Add
            </button>
          </ExpertiseInput>
          {formData.expertise.length > 0 && (
            <ExpertiseContainer>
              {formData.expertise.map((skill, index) => (
                <ExpertiseTag key={index}>
                  {skill}
                  <button
                    type="button"
                    onClick={() => removeExpertise(index)}
                    disabled={loading || externalLoading}
                    title="Remove"
                  >
                    ×
                  </button>
                </ExpertiseTag>
              ))}
            </ExpertiseContainer>
          )}
          {errors.expertise && <ErrorMessage>{errors.expertise}</ErrorMessage>}
        </FormGroup>

        {/* Hourly Rate */}
        <FormGroup>
          <Label>
            Hourly Rate (USD) <span>*</span>
          </Label>
          <Input
            type="number"
            name="hourlyRate"
            value={formData.hourlyRate}
            onChange={handleInputChange}
            placeholder="e.g. 150"
            min="10"
            max="1000"
            disabled={loading || externalLoading}
            error={errors.hourlyRate}
          />
          {errors.hourlyRate && <ErrorMessage>{errors.hourlyRate}</ErrorMessage>}
        </FormGroup>

        {/* Social Links */}
        <FormGroup>
          <Label>Social Links</Label>
          <SocialInputs>
            <div>
              <Input
                type="text"
                placeholder="GitHub username"
                value={formData.social?.github || ''}
                onChange={(e) => handleSocialChange('github', e.target.value)}
                disabled={loading || externalLoading}
                error={errors.github}
              />
              {errors.github && <ErrorMessage>{errors.github}</ErrorMessage>}
            </div>
            <div>
              <Input
                type="text"
                placeholder="Twitter handle"
                value={formData.social?.twitter || ''}
                onChange={(e) => handleSocialChange('twitter', e.target.value)}
                disabled={loading || externalLoading}
                error={errors.twitter}
              />
              {errors.twitter && <ErrorMessage>{errors.twitter}</ErrorMessage>}
            </div>
            <div style={{ gridColumn: 'span 2' }}>
              <Input
                type="url"
                placeholder="Website URL"
                value={formData.social?.website || ''}
                onChange={(e) => handleSocialChange('website', e.target.value)}
                disabled={loading || externalLoading}
                error={errors.website}
              />
              {errors.website && <ErrorMessage>{errors.website}</ErrorMessage>}
            </div>
          </SocialInputs>
        </FormGroup>

        {/* Submit Error */}
        {errors.submit && <ErrorMessage style={{ marginTop: '1rem' }}>{errors.submit}</ErrorMessage>}

        {/* Buttons */}
        <ButtonGroup>
          <SecondaryButton type="button" onClick={onCancel} disabled={loading || externalLoading}>
            Cancel
          </SecondaryButton>
          <PrimaryButton type="submit" disabled={loading || externalLoading}>
            {loading || externalLoading ? 'Saving...' : isEditing ? 'Update Profile' : 'Create Profile'}
          </PrimaryButton>
        </ButtonGroup>
      </form>
    </FormContainer>
  )
}
