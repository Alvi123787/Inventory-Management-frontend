import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import UserManagement from '../pages/UserManagement.jsx'
vi.mock('../services/authService', () => ({
  register: vi.fn(),
}))
const { register } = await import('../services/authService')

describe('UserManagement modal triggers', () => {
  beforeEach(() => {
    localStorage.setItem('token', 't')
    localStorage.setItem('role', 'sub_admin')
  })

  it('shows modal when sub-admin starts creating regular user', async () => {
    render(<UserManagement />)
    fireEvent.click(screen.getByText('Add New User'))
    fireEvent.change(screen.getByLabelText('Full Name'), { target: { value: 'User D' } })
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'd@example.com' } })
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'Aa1!aa' } })
    fireEvent.click(screen.getByText('Create User'))
    expect(screen.getByText('Select Roles (min 1, max 2)')).toBeInTheDocument()
  })

  it('does not show modal when admin creates another admin', async () => {
    localStorage.setItem('role', 'admin')
    register.mockResolvedValue({ message: 'ok', userId: 101, created_role: 'admin', showPageAssignModal: false })
    render(<UserManagement />)
    fireEvent.click(screen.getByText('Add New User'))
    fireEvent.change(screen.getByLabelText('Full Name'), { target: { value: 'Admin E' } })
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'e@example.com' } })
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'Aa1!aa' } })
    fireEvent.change(screen.getByLabelText('Role'), { target: { value: 'admin' } })
    fireEvent.click(screen.getByText('Create User'))
    // Modal text should not be present
    expect(screen.queryByText('Select Roles (min 1, max 2)')).not.toBeInTheDocument()
  })
})
