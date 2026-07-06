import React, { useState } from 'react'
import styled from 'styled-components'
import { useWeb3React } from '@web3-react/core'
import { useCeramic } from '../../contexts/Ceramic'
import ProfileForm from '../../components/ProfileForm'

const PageContainer = styled.div`
  position: relative;
  width: 100%;
  min-height: 100vh;
  padding: 3rem 2rem;
  background: linear-gradient(135deg, #F9FAFB 0%, #F3F4F6 100%);
  display: flex;
  flex-direction: column;
  gap: 2rem;
`

const Header = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  max-width: 600px;
`

const Title = styled.h1`
  font-size: 2.75rem;
  margin: 0;
  color: #1F2937;
  font-weight: 800;
  letter-spacing: -1px;
  background: linear-gradient(135deg, #1E40AF 0%, #7C3AED 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
`

const Subtitle = styled.p`
  font-size: 1.15rem;
  margin: 0;
  color: #6B7280;
  font-weight: 500;
`

const WalletNotConnected = styled.div`
  background: linear-gradient(135deg, #FEE2E2 0%, #FCE7F3 100%);
  border: 1px solid #FECACA;
  border-radius: 1rem;
  padding: 2rem;
  text-align: center;
  max-width: 600px;

  h2 {
    color: #7F1D1D;
    margin: 0 0 0.5rem 0;
  }

  p {
    color: #9F1239;
    margin: 0;
    font-size: 0.95rem;
  }
`

const ContentContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2rem;
  max-width: 600px;
`

const ProfilePreviewCard = styled.div`
  background: white;
  border: 1px solid #E5E7EB;
  border-radius: 1rem;
  padding: 2rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
`

const PreviewSection = styled.div`
  margin-bottom: 1.5rem;

  &:last-child {
    margin-bottom: 0;
  }
`

const PreviewLabel = styled.h3`
  font-size: 0.85rem;
  font-weight: 600;
  color: #6B7280;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin: 0 0 0.5rem 0;
`

const PreviewValue = styled.p`
  font-size: 1rem;
  color: #1F2937;
  margin: 0;
  line-height: 1.5;
`

const TagContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
`

const Tag = styled.span`
  background: linear-gradient(135deg, #F0F4FF 0%, #F5EBFF 100%);
  color: #1E40AF;
  padding: 0.4rem 0.75rem;
  border-radius: 0.5rem;
  font-size: 0.8rem;
  font-weight: 500;
  border: 1px solid #E0E7FF;
`

const ActionButtons = styled.div`
  display: flex;
  gap: 1rem;
  margin-top: 2rem;

  @media (max-width: 600px) {
    flex-direction: column;
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

const DangerButton = styled(Button)`
  background: #FEE2E2;
  color: #DC2626;
  border: 1px solid #FECACA;

  &:hover:not(:disabled) {
    background: #FECACA;
  }
`

const EmptyState = styled.div`
  background: white;
  border: 2px dashed #E5E7EB;
  border-radius: 1rem;
  padding: 3rem 2rem;
  text-align: center;

  h3 {
    font-size: 1.25rem;
    color: #1F2937;
    margin: 0 0 0.5rem 0;
  }

  p {
    color: #6B7280;
    margin: 0 0 1.5rem 0;
  }
`

const Modal = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
`

const ModalContent = styled.div`
  background: #F9FAFB;
  border-radius: 1rem;
  max-height: 90vh;
  overflow-y: auto;
  animation: slideUp 0.3s ease-out;

  @keyframes slideUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`

const ModalHeader = styled.div`
  padding: 2rem 2rem 1rem;
  border-bottom: 1px solid #E5E7EB;
  display: flex;
  justify-content: space-between;
  align-items: center;

  h2 {
    margin: 0;
    color: #1F2937;
    font-size: 1.5rem;
  }

  button {
    background: none;
    border: none;
    font-size: 1.5rem;
    cursor: pointer;
    color: #6B7280;

    &:hover {
      color: #1F2937;
    }
  }
`

const ModalBody = styled.div`
  padding: 2rem;
`

const LoadingMessage = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  font-size: 1.1rem;
  color: #6B7280;
  font-weight: 500;
`

export function MyProfile() {
  const { account } = useWeb3React()
  const { getMyProfile, deleteProfile, loading } = useCeramic()
  const [isEditMode, setIsEditMode] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const profile = getMyProfile()

  if (!account) {
    return (
      <PageContainer>
        <Header>
          <Title>My Profile</Title>
          <Subtitle>Manage your expert profile</Subtitle>
        </Header>
        <WalletNotConnected>
          <h2>Wallet Not Connected</h2>
          <p>Please connect your wallet to view and manage your profile</p>
        </WalletNotConnected>
      </PageContainer>
    )
  }

  if (loading) {
    return (
      <PageContainer>
        <Header>
          <Title>My Profile</Title>
        </Header>
        <LoadingMessage>Loading your profile...</LoadingMessage>
      </PageContainer>
    )
  }

  const handleDeleteProfile = async () => {
    try {
      await deleteProfile()
      setShowDeleteConfirm(false)
    } catch (err) {
      console.error('Failed to delete profile:', err)
    }
  }

  return (
    <PageContainer>
      <Header>
        <Title>My Profile</Title>
        <Subtitle>Manage your expert profile and earnings</Subtitle>
      </Header>

      <ContentContainer>
        {!profile ? (
          <>
            <EmptyState>
              <h3>No Profile Yet</h3>
              <p>Create your expert profile to get discovered and start earning</p>
              <PrimaryButton onClick={() => setIsEditMode(true)}>Create Profile</PrimaryButton>
            </EmptyState>

            {isEditMode && (
              <Modal onClick={() => setIsEditMode(false)}>
                <ModalContent onClick={(e) => e.stopPropagation()}>
                  <ModalHeader>
                    <h2>Create Your Profile</h2>
                    <button onClick={() => setIsEditMode(false)}>×</button>
                  </ModalHeader>
                  <ModalBody>
                    <ProfileForm onSuccess={() => setIsEditMode(false)} onCancel={() => setIsEditMode(false)} isLoading={loading} />
                  </ModalBody>
                </ModalContent>
              </Modal>
            )}
          </>
        ) : (
          <>
            <ProfilePreviewCard>
              <PreviewSection>
                <PreviewLabel>Name</PreviewLabel>
                <PreviewValue>{profile.name}</PreviewValue>
              </PreviewSection>

              <PreviewSection>
                <PreviewLabel>Bio</PreviewLabel>
                <PreviewValue>{profile.bio}</PreviewValue>
              </PreviewSection>

              {profile.expertise && profile.expertise.length > 0 && (
                <PreviewSection>
                  <PreviewLabel>Expertise</PreviewLabel>
                  <TagContainer>
                    {profile.expertise.map((skill) => (
                      <Tag key={skill}>{skill}</Tag>
                    ))}
                  </TagContainer>
                </PreviewSection>
              )}

              <PreviewSection>
                <PreviewLabel>Hourly Rate</PreviewLabel>
                <PreviewValue style={{ fontSize: '1.25rem', fontWeight: 600, color: '#1E40AF' }}>${profile.hourlyRate}/hr</PreviewValue>
              </PreviewSection>

              {(profile.social?.github || profile.social?.twitter || profile.social?.website) && (
                <PreviewSection>
                  <PreviewLabel>Social Links</PreviewLabel>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {profile.social?.github && (
                      <a href={`https://github.com/${profile.social.github}`} target="_blank" rel="noopener noreferrer" style={{ color: '#1E40AF' }}>
                        GitHub
                      </a>
                    )}
                    {profile.social?.twitter && (
                      <a href={`https://twitter.com/${profile.social.twitter}`} target="_blank" rel="noopener noreferrer" style={{ color: '#1E40AF' }}>
                        Twitter
                      </a>
                    )}
                    {profile.social?.website && (
                      <a href={profile.social.website} target="_blank" rel="noopener noreferrer" style={{ color: '#1E40AF' }}>
                        Website
                      </a>
                    )}
                  </div>
                </PreviewSection>
              )}

              <ActionButtons>
                <PrimaryButton onClick={() => setIsEditMode(true)}>Edit Profile</PrimaryButton>
                <DangerButton onClick={() => setShowDeleteConfirm(true)}>Delete Profile</DangerButton>
              </ActionButtons>
            </ProfilePreviewCard>

            {isEditMode && (
              <Modal onClick={() => setIsEditMode(false)}>
                <ModalContent onClick={(e) => e.stopPropagation()}>
                  <ModalHeader>
                    <h2>Edit Your Profile</h2>
                    <button onClick={() => setIsEditMode(false)}>×</button>
                  </ModalHeader>
                  <ModalBody>
                    <ProfileForm initialData={profile} onSuccess={() => setIsEditMode(false)} onCancel={() => setIsEditMode(false)} isLoading={loading} />
                  </ModalBody>
                </ModalContent>
              </Modal>
            )}

            {showDeleteConfirm && (
              <Modal onClick={() => setShowDeleteConfirm(false)}>
                <ModalContent onClick={(e) => e.stopPropagation()}>
                  <ModalHeader>
                    <h2>Delete Profile</h2>
                  </ModalHeader>
                  <ModalBody>
                    <p>Are you sure you want to delete your profile? This action cannot be undone.</p>
                    <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', justifyContent: 'flex-end' }}>
                      <Button onClick={() => setShowDeleteConfirm(false)} style={{ background: '#F3F4F6', color: '#6B7280' }}>
                        Cancel
                      </Button>
                      <DangerButton onClick={handleDeleteProfile} disabled={loading}>
                        {loading ? 'Deleting...' : 'Delete'}
                      </DangerButton>
                    </div>
                  </ModalBody>
                </ModalContent>
              </Modal>
            )}
          </>
        )}
      </ContentContainer>
    </PageContainer>
  )
}
