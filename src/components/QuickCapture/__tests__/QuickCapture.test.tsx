import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QuickCapture } from '../QuickCapture'

describe('QuickCapture', () => {
  it('submits on Enter', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined)
    const user = userEvent.setup()

    render(<QuickCapture onSubmit={onSubmit} />)

    const input = screen.getByPlaceholderText('What do you need to remember?')
    await user.type(input, 'Follow up with Rahul tomorrow')
    await user.keyboard('{Enter}')

    expect(onSubmit).toHaveBeenCalledWith('Follow up with Rahul tomorrow')
  })
})
