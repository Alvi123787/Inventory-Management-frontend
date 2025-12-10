import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import Register from '../pages/Register.jsx'

vi.mock('../services/authService', () => ({
  register: vi.fn(),
}))

vi.mock('../api/api', () => ({
  default: {
    post: vi.fn(() => Promise.resolve({ data: { success: true } })),
  },
}))

const { register } = await import('../services/authService')

describe('Register page modal triggers', () => {
  beforeEach(() => {
    localStorage.setItem('token', 't')
    localStorage.setItem('role', 'admin')
  })

  it('shows modal when admin creates regular user', async () => {
    register.mockResolvedValue({ message: 'ok', userId: 99, created_role: 'user', showPageAssignModal: true })
    render(<Register />)
    fireEvent.change(screen.getByLabelText('Full Name'), { target: { value: 'User A' } })
    fireEvent.change(screen.getByLabelText('Email Address'), { target: { value: 'a@example.com' } })
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'Aa1!aa' } })
    fireEvent.change(screen.getByLabelText('Confirm Password'), { target: { value: 'Aa1!aa' } })
    fireEvent.click(screen.getByText('Create User'))
    await waitFor(() => expect(screen.getByText('Assign Page Access')).toBeInTheDocument())
  })

  it('does not show modal when creating admin', async () => {
    register.mockResolvedValue({ message: 'ok', userId: 100, created_role: 'admin', showPageAssignModal: false })
    render(<Register />)
    fireEvent.change(screen.getByLabelText('Full Name'), { target: { value: 'Admin B' } })
    fireEvent.change(screen.getByLabelText('Email Address'), { target: { value: 'b@example.com' } })
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'Aa1!aa' } })
    fireEvent.change(screen.getByLabelText('Confirm Password'), { target: { value: 'Aa1!aa' } })
    fireEvent.change(screen.getByLabelText('User Role'), { target: { value: 'admin' } })
    fireEvent.click(screen.getByText('Create User'))
    await waitFor(() => expect(screen.queryByText('Assign Page Access')).not.toBeInTheDocument())
  })

  it('does not show modal on error', async () => {
    register.mockRejectedValue({ response: { data: { message: 'fail' } } })
    render(<Register />)
    fireEvent.change(screen.getByLabelText('Full Name'), { target: { value: 'User C' } })
    fireEvent.change(screen.getByLabelText('Email Address'), { target: { value: 'c@example.com' } })
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'Aa1!aa' } })
    fireEvent.change(screen.getByLabelText('Confirm Password'), { target: { value: 'Aa1!aa' } })
    fireEvent.click(screen.getByText('Create User'))
    await waitFor(() => expect(screen.queryByText('Assign Page Access')).not.toBeInTheDocument())
  })

  it('allows assigning more than 3 pages', async () => {
    register.mockResolvedValue({ message: 'ok', userId: 200, created_role: 'user', showPageAssignModal: true })
    const { default: api } = await import('../api/api')
    render(<Register />)
    fireEvent.change(screen.getByLabelText('Full Name'), { target: { value: 'User F' } })
    fireEvent.change(screen.getByLabelText('Email Address'), { target: { value: 'f@example.com' } })
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'Aa1!aa' } })
    fireEvent.change(screen.getByLabelText('Confirm Password'), { target: { value: 'Aa1!aa' } })
    fireEvent.click(screen.getByText('Create User'))
    await waitFor(() => expect(screen.getByText('Assign Page Access')).toBeInTheDocument())
    // select 4 pages
    for (const f of ['products','orders','reports','dashboard']) {
      fireEvent.click(screen.getByText(f))
    }
    fireEvent.click(screen.getByText('Assign & Save'))
    expect(api.post).toHaveBeenCalled()
    const payload = api.post.mock.calls[0][1]
    expect(Array.isArray(payload.feature_roles)).toBe(true)
    expect(payload.feature_roles.length).toBeGreaterThan(3)
  })

  it('rejects assignment when selecting 0 pages', async () => {
    register.mockResolvedValue({ message: 'ok', userId: 201, created_role: 'user', showPageAssignModal: true })
    const { default: api } = await import('../api/api')
    render(<Register />)
    fireEvent.change(screen.getByLabelText('Full Name'), { target: { value: 'User G' } })
    fireEvent.change(screen.getByLabelText('Email Address'), { target: { value: 'g@example.com' } })
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'Aa1!aa' } })
    fireEvent.change(screen.getByLabelText('Confirm Password'), { target: { value: 'Aa1!aa' } })
    fireEvent.click(screen.getByText('Create User'))
    await waitFor(() => expect(screen.getByText('Assign Page Access')).toBeInTheDocument())
    fireEvent.click(screen.getByText('Assign & Save'))
    expect(screen.getByText('Select at least 1 page')).toBeInTheDocument()
    expect(api.post).not.toHaveBeenCalled()
  })
})
