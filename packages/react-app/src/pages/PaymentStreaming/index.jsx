import React, { useState } from 'react'
import styled from 'styled-components'
import { useMultiWallet } from '../../contexts/MultiWallet'

const Container = styled.div`
  max-width: 900px;
  margin: 0 auto;
  padding: 40px 20px;
`

const Header = styled.div`
  text-align: center;
  margin-bottom: 40px;

  h1 {
    font-size: 32px;
    font-weight: 700;
    background: linear-gradient(135deg, #1e40af 0%, #7c3aed 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    margin: 0 0 8px 0;
  }

  p {
    color: #6b7280;
    margin: 0;
  }
`

const FormCard = styled.div`
  background: white;
  border-radius: 16px;
  padding: 32px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  border: 1px solid #e5e7eb;
`

const FormGroup = styled.div`
  margin-bottom: 24px;

  label {
    display: block;
    font-size: 14px;
    font-weight: 600;
    color: #1f2937;
    margin-bottom: 8px;
  }

  small {
    display: block;
    color: #6b7280;
    font-size: 12px;
    margin-top: 4px;
  }
`

const Input = styled.input`
  width: 100%;
  padding: 12px 16px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 14px;
  font-family: 'Inter', sans-serif;
  transition: all 0.3s ease;

  &:focus {
    outline: none;
    border-color: #1e40af;
    box-shadow: 0 0 0 3px rgba(30, 64, 175, 0.1);
  }

  &:disabled {
    background: #f3f4f6;
    cursor: not-allowed;
  }
`

const Select = styled.select`
  width: 100%;
  padding: 12px 16px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 14px;
  font-family: 'Inter', sans-serif;
  background: white;
  cursor: pointer;
  transition: all 0.3s ease;

  &:focus {
    outline: none;
    border-color: #1e40af;
    box-shadow: 0 0 0 3px rgba(30, 64, 175, 0.1);
  }
`

const FormRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`

const Summary = styled.div`
  background: linear-gradient(135deg, #f0f9ff 0%, #f5f3ff 100%);
  border: 1px solid #dbeafe;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 24px;

  .summary-row {
    display: flex;
    justify-content: space-between;
    margin-bottom: 12px;
    font-size: 14px;

    &:last-child {
      margin-bottom: 0;
      padding-top: 12px;
      border-top: 1px solid #dbeafe;
      font-weight: 600;
      color: #1e40af;
    }

    .label {
      color: #6b7280;
    }

    .value {
      color: #1f2937;
      font-weight: 600;
    }
  }
`

const ButtonGroup = styled.div`
  display: flex;
  gap: 12px;
  justify-content: center;

  @media (max-width: 768px) {
    flex-direction: column;
  }
`

const Button = styled.button`
  flex: 1;
  padding: 14px 32px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  font-family: 'Inter', sans-serif;
  cursor: pointer;
  transition: all 0.3s ease;

  ${(props) =>
    props.primary
      ? `
    background: linear-gradient(135deg, #1e40af 0%, #7c3aed 100%);
    color: white;

    &:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 8px 16px rgba(30, 64, 175, 0.3);
    }
  `
      : `
    background: white;
    border: 1px solid #d1d5db;
    color: #374151;

    &:hover {
      border-color: #9ca3af;
      background: #f9fafb;
    }
  `};

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`

const ErrorMessage = styled.div`
  background: #fee2e2;
  border: 1px solid #fecaca;
  border-radius: 8px;
  padding: 12px 16px;
  color: #991b1b;
  font-size: 14px;
  margin-bottom: 20px;
`

const SuccessMessage = styled.div`
  background: #d1fae5;
  border: 1px solid #a7f3d0;
  border-radius: 8px;
  padding: 12px 16px;
  color: #065f46;
  font-size: 14px;
  margin-bottom: 20px;
`

const LoadingSpinner = styled.span`
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
`

/**
 * Payment Streaming Component
 * Create new payment streams for expert services
 */
export default function PaymentStreaming() {
  const { account, isConnected } = useMultiWallet()
  const [formData, setFormData] = useState({
    recipient: '',
    token: 'USDC',
    amount: '',
    duration: '30',
    durationUnit: 'days'
  })
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    setError(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)

    if (!isConnected) {
      setError('Please connect your wallet first')
      return
    }

    if (!formData.recipient) {
      setError('Recipient address is required')
      return
    }

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      setError('Amount must be greater than 0')
      return
    }

    if (!formData.duration || parseInt(formData.duration) <= 0) {
      setError('Duration must be greater than 0')
      return
    }

    setLoading(true)

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000))

      console.log('Creating payment stream:', {
        sender: account,
        ...formData
      })

      setSuccess(true)
      setFormData({
        recipient: '',
        token: 'USDC',
        amount: '',
        duration: '30',
        durationUnit: 'days'
      })

      setTimeout(() => setSuccess(false), 5000)
    } catch (err) {
      setError(err.message || 'Failed to create payment stream')
    } finally {
      setLoading(false)
    }
  }

  // Calculate streaming rate
  const calculateRate = () => {
    if (!formData.amount || !formData.duration) return '0'

    const amount = parseFloat(formData.amount)
    const duration = parseInt(formData.duration)

    let totalSeconds = 0
    if (formData.durationUnit === 'days') {
      totalSeconds = duration * 24 * 60 * 60
    } else if (formData.durationUnit === 'weeks') {
      totalSeconds = duration * 7 * 24 * 60 * 60
    } else if (formData.durationUnit === 'months') {
      totalSeconds = duration * 30 * 24 * 60 * 60
    }

    return ((amount / totalSeconds) * 60).toFixed(4)
  }

  if (!isConnected) {
    return (
      <Container>
        <Header>
          <h1>Create Payment Stream</h1>
          <p>Set up automatic payments for expert services</p>
        </Header>

        <FormCard>
          <ErrorMessage>🔐 Please connect your wallet to create payment streams</ErrorMessage>
        </FormCard>
      </Container>
    )
  }

  return (
    <Container>
      <Header>
        <h1>Create Payment Stream</h1>
        <p>Set up automatic payments for expert services</p>
      </Header>

      <FormCard>
        {error && <ErrorMessage>{error}</ErrorMessage>}
        {success && (
          <SuccessMessage>✓ Payment stream created successfully!</SuccessMessage>
        )}

        <form onSubmit={handleSubmit}>
          <FormGroup>
            <label>Your Address</label>
            <Input value={account || ''} disabled />
            <small>Your connected wallet address</small>
          </FormGroup>

          <FormGroup>
            <label>Recipient Address *</label>
            <Input
              type="text"
              name="recipient"
              placeholder="0x..."
              value={formData.recipient}
              onChange={handleChange}
              disabled={loading}
            />
            <small>Expert's wallet address</small>
          </FormGroup>

          <FormRow>
            <FormGroup>
              <label>Token *</label>
              <Select
                name="token"
                value={formData.token}
                onChange={handleChange}
                disabled={loading}
              >
                <option value="USDC">USDC - USD Coin</option>
                <option value="USDT">USDT - Tether</option>
                <option value="DAI">DAI - Decentralized USD</option>
                <option value="ETH">ETH - Ethereum</option>
              </Select>
            </FormGroup>

            <FormGroup>
              <label>Amount *</label>
              <Input
                type="number"
                name="amount"
                placeholder="Enter amount"
                value={formData.amount}
                onChange={handleChange}
                disabled={loading}
                step="0.01"
                min="0"
              />
            </FormGroup>
          </FormRow>

          <FormRow>
            <FormGroup>
              <label>Duration *</label>
              <Input
                type="number"
                name="duration"
                placeholder="Enter duration"
                value={formData.duration}
                onChange={handleChange}
                disabled={loading}
                min="1"
              />
            </FormGroup>

            <FormGroup>
              <label>Time Unit</label>
              <Select
                name="durationUnit"
                value={formData.durationUnit}
                onChange={handleChange}
                disabled={loading}
              >
                <option value="days">Days</option>
                <option value="weeks">Weeks</option>
                <option value="months">Months</option>
              </Select>
            </FormGroup>
          </FormRow>

          <Summary>
            <div className="summary-row">
              <span className="label">Streaming Rate (per minute)</span>
              <span className="value">{calculateRate()} {formData.token}</span>
            </div>
            <div className="summary-row">
              <span className="label">Total Amount</span>
              <span className="value">{formData.amount || '0'} {formData.token}</span>
            </div>
            <div className="summary-row">
              <span className="label">Duration</span>
              <span className="value">{formData.duration} {formData.durationUnit}</span>
            </div>
            <div className="summary-row">
              <span>Estimated Cost</span>
              <span>{formData.amount || '0'} {formData.token}</span>
            </div>
          </Summary>

          <ButtonGroup>
            <Button type="button">Cancel</Button>
            <Button type="submit" primary disabled={loading}>
              {loading ? (
                <>
                  <LoadingSpinner /> Creating Stream...
                </>
              ) : (
                '💰 Create Payment Stream'
              )}
            </Button>
          </ButtonGroup>
        </form>
      </FormCard>
    </Container>
  )
}
