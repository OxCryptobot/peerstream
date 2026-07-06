import React, { useState, useEffect } from 'react'
import styled from 'styled-components'
import { useCeramic } from '../../contexts/Ceramic'
import { useMultiWallet } from '../../contexts/MultiWallet'

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 40px 20px;
`

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 40px;

  h1 {
    font-size: 32px;
    font-weight: 700;
    background: linear-gradient(135deg, #1e40af 0%, #7c3aed 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    margin: 0;
  }

  @media (max-width: 768px) {
    flex-direction: column;
    gap: 16px;
    align-items: flex-start;
  }
`

const Stats = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 40px;
`

const StatCard = styled.div`
  background: white;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border-left: 4px solid #7c3aed;

  .label {
    font-size: 13px;
    color: #6b7280;
    font-weight: 600;
    text-transform: uppercase;
    margin-bottom: 8px;
  }

  .value {
    font-size: 28px;
    font-weight: 700;
    color: #1e40af;
  }

  .change {
    font-size: 12px;
    color: #10b981;
    margin-top: 8px;
  }
`

const TabsContainer = styled.div`
  display: flex;
  gap: 8px;
  margin-bottom: 24px;
  border-bottom: 2px solid #e5e7eb;
`

const Tab = styled.button`
  background: none;
  border: none;
  padding: 12px 24px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  color: ${(props) => (props.active ? '#1e40af' : '#6b7280')};
  border-bottom: 3px solid ${(props) => (props.active ? '#1e40af' : 'transparent')};
  transition: all 0.3s ease;

  &:hover {
    color: #1e40af;
  }
`

const StreamingTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  background: white;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);

  thead {
    background: linear-gradient(135deg, #1e40af 0%, #7c3aed 100%);
    color: white;

    th {
      padding: 16px;
      text-align: left;
      font-weight: 600;
      font-size: 13px;
      text-transform: uppercase;
    }
  }

  tbody {
    tr {
      border-top: 1px solid #e5e7eb;
      transition: background 0.2s ease;

      &:hover {
        background: #f9fafb;
      }

      td {
        padding: 16px;
        font-size: 14px;
        color: #1f2937;
      }
    }
  }
`

const StatusBadge = styled.span`
  display: inline-block;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;

  ${(props) => {
    switch (props.status) {
      case 'active':
        return `
          background: #d1fae5;
          color: #065f46;
        `
      case 'completed':
        return `
          background: #dbeafe;
          color: #1e40af;
        `
      case 'pending':
        return `
          background: #fef3c7;
          color: #92400e;
        `
      case 'cancelled':
        return `
          background: #fee2e2;
          color: #991b1b;
        `
      default:
        return `
          background: #e5e7eb;
          color: #374151;
        `
    }
  }};
`

const ActionButton = styled.button`
  background: linear-gradient(135deg, #7c3aed 0%, #06b6d4 100%);
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(124, 58, 237, 0.3);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`

const EmptyState = styled.div`
  text-align: center;
  padding: 60px 20px;
  color: #6b7280;

  .icon {
    font-size: 48px;
    margin-bottom: 16px;
  }

  h3 {
    font-size: 18px;
    font-weight: 600;
    color: #1f2937;
    margin-bottom: 8px;
  }

  p {
    margin: 0;
  }
`

const FilterBar = styled.div`
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
  flex-wrap: wrap;

  @media (max-width: 768px) {
    flex-direction: column;
  }
`

const FilterSelect = styled.select`
  padding: 10px 16px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 14px;
  background: white;
  cursor: pointer;
  transition: border 0.3s ease;

  &:hover {
    border-color: #9ca3af;
  }

  &:focus {
    outline: none;
    border-color: #1e40af;
    box-shadow: 0 0 0 3px rgba(30, 64, 175, 0.1);
  }
`

/**
 * Payment History Dashboard
 * Display user's payment streams and history
 */
export default function PaymentHistory() {
  const { account } = useMultiWallet()
  const { getMyProfile } = useCeramic()

  const [activeTab, setActiveTab] = useState('active')
  const [filter, setFilter] = useState('all')
  const [streams, setStreams] = useState([])
  const [loading, setLoading] = useState(true)

  // Mock data for demonstration
  const mockStreams = {
    active: [
      {
        id: '1',
        recipient: 'alice.eth',
        token: 'USDC',
        amount: '1000',
        rate: '$41.67/day',
        startDate: '2026-07-01',
        endDate: '2026-09-01',
        streamed: '500',
        remaining: '500',
        status: 'active'
      },
      {
        id: '2',
        recipient: 'bob.eth',
        token: 'ETH',
        amount: '2',
        rate: '$0.083/day',
        startDate: '2026-06-15',
        endDate: '2026-12-15',
        streamed: '0.5',
        remaining: '1.5',
        status: 'active'
      }
    ],
    completed: [
      {
        id: '3',
        recipient: 'charlie.eth',
        token: 'DAI',
        amount: '5000',
        rate: '$166.67/day',
        startDate: '2026-06-01',
        endDate: '2026-06-30',
        streamed: '5000',
        remaining: '0',
        status: 'completed'
      }
    ],
    pending: [
      {
        id: '4',
        recipient: 'dave.eth',
        token: 'USDT',
        amount: '2000',
        rate: '$66.67/day',
        startDate: '2026-07-15',
        endDate: '2026-08-15',
        streamed: '0',
        remaining: '2000',
        status: 'pending'
      }
    ]
  }

  useEffect(() => {
    if (!account) return

    setLoading(true)
    setTimeout(() => {
      setStreams(mockStreams[activeTab] || [])
      setLoading(false)
    }, 500)
  }, [activeTab, account])

  if (!account) {
    return (
      <Container>
        <EmptyState>
          <div className="icon">🔐</div>
          <h3>Connect Your Wallet</h3>
          <p>Please connect your wallet to view payment history</p>
        </EmptyState>
      </Container>
    )
  }

  const totalStreaming = mockStreams.active.reduce(
    (sum, s) => sum + parseFloat(s.amount),
    0
  )
  const totalCompleted = mockStreams.completed.reduce(
    (sum, s) => sum + parseFloat(s.amount),
    0
  )
  const totalPending = mockStreams.pending.reduce(
    (sum, s) => sum + parseFloat(s.amount),
    0
  )

  return (
    <Container>
      <Header>
        <h1>Payment History</h1>
        <ActionButton>Create New Stream</ActionButton>
      </Header>

      <Stats>
        <StatCard>
          <div className="label">Active Streams</div>
          <div className="value">{mockStreams.active.length}</div>
          <div className="change">${totalStreaming.toFixed(2)} streaming</div>
        </StatCard>

        <StatCard>
          <div className="label">Completed</div>
          <div className="value">${totalCompleted.toFixed(2)}</div>
          <div className="change">{mockStreams.completed.length} payments</div>
        </StatCard>

        <StatCard>
          <div className="label">Pending</div>
          <div className="value">{mockStreams.pending.length}</div>
          <div className="change">${totalPending.toFixed(2)} waiting</div>
        </StatCard>
      </Stats>

      <TabsContainer>
        <Tab
          active={activeTab === 'active'}
          onClick={() => setActiveTab('active')}
        >
          Active Streams ({mockStreams.active.length})
        </Tab>
        <Tab
          active={activeTab === 'completed'}
          onClick={() => setActiveTab('completed')}
        >
          Completed ({mockStreams.completed.length})
        </Tab>
        <Tab
          active={activeTab === 'pending'}
          onClick={() => setActiveTab('pending')}
        >
          Pending ({mockStreams.pending.length})
        </Tab>
      </TabsContainer>

      <FilterBar>
        <FilterSelect value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="all">All Tokens</option>
          <option value="usdc">USDC</option>
          <option value="eth">ETH</option>
          <option value="dai">DAI</option>
          <option value="usdt">USDT</option>
        </FilterSelect>
      </FilterBar>

      {loading ? (
        <EmptyState>
          <div className="icon">⏳</div>
          <h3>Loading...</h3>
        </EmptyState>
      ) : streams.length === 0 ? (
        <EmptyState>
          <div className="icon">📊</div>
          <h3>No {activeTab} streams</h3>
          <p>Start creating payment streams to see them here</p>
        </EmptyState>
      ) : (
        <StreamingTable>
          <thead>
            <tr>
              <th>Recipient</th>
              <th>Token</th>
              <th>Amount</th>
              <th>Rate</th>
              <th>Streamed</th>
              <th>Duration</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {streams.map((stream) => (
              <tr key={stream.id}>
                <td>
                  <strong>{stream.recipient}</strong>
                </td>
                <td>{stream.token}</td>
                <td>${parseFloat(stream.amount).toFixed(2)}</td>
                <td>{stream.rate}</td>
                <td>
                  {stream.streamed} / {stream.amount}
                </td>
                <td>
                  {stream.startDate} to {stream.endDate}
                </td>
                <td>
                  <StatusBadge status={stream.status}>
                    {stream.status.charAt(0).toUpperCase() + stream.status.slice(1)}
                  </StatusBadge>
                </td>
                <td>
                  <ActionButton
                    disabled={stream.status === 'completed'}
                  >
                    {stream.status === 'active' ? 'Withdraw' : 'View'}
                  </ActionButton>
                </td>
              </tr>
            ))}
          </tbody>
        </StreamingTable>
      )}
    </Container>
  )
}
