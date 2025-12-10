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
    expect(screen.getByText('Assign Page Access (min 1)')).toBeInTheDocument()
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
    expect(screen.queryByText('Assign Page Access (min 1)')).not.toBeInTheDocument()
  })

  it('allows assigning more than 3 pages for sub-admin flow', async () => {
    localStorage.setItem('role', 'sub_admin')
    const { default: api } = await import('../api/api')
    // mock api.post for account users creation
    vi.spyOn(api, 'post').mockResolvedValue({ data: { success: true } })
    render(<UserManagement />)
    fireEvent.click(screen.getByText('Add New User'))
    fireEvent.change(screen.getByLabelText('Full Name'), { target: { value: 'User H' } })
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'h@example.com' } })
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'Aa1!aa' } })
    fireEvent.click(screen.getByText('Create User'))
    expect(screen.getByText('Assign Page Access (min 1)')).toBeInTheDocument()
    for (const f of ['products','orders','reports','dashboard']) {
      fireEvent.click(screen.getByLabelText(f))
    }
    fireEvent.click(screen.getByText('Assign & Create'))
    expect(api.post).toHaveBeenCalled()
    const payload = api.post.mock.calls[0][1]
    expect(Array.isArray(payload.feature_roles)).toBe(true)
    expect(payload.feature_roles.length).toBeGreaterThan(3)
  })

  it('rejects creation when selecting 0 pages in sub-admin flow', async () => {
    localStorage.setItem('role', 'sub_admin')
    const { default: api } = await import('../api/api')
    vi.spyOn(api, 'post').mockResolvedValue({ data: { success: true } })
    render(<UserManagement />)
    fireEvent.click(screen.getByText('Add New User'))
    fireEvent.change(screen.getByLabelText('Full Name'), { target: { value: 'User I' } })
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'i@example.com' } })
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'Aa1!aa' } })
    fireEvent.click(screen.getByText('Create User'))
    expect(screen.getByText('Assign Page Access (min 1)')).toBeInTheDocument()
    fireEvent.click(screen.getByText('Assign & Create'))
    expect(screen.getByText('Select at least 1 page')).toBeInTheDocument()
    // Ensure the post was not called
    expect(api.post).not.toHaveBeenCalled()
  })
})
