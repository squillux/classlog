import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import Bars from './Bars'
import type { Step } from './steps'

function makeStep(extra: Partial<Step> = {}): Step {
  return {
    array: [3, 1, 2], comparing: [], settled: [], found: null,
    comparisons: 0, swaps: 0, caption: '자막', ...extra,
  }
}

describe('Bars', () => {
  it('숫자를 모두 보여준다', () => {
    render(<Bars step={makeStep()} />)
    expect(screen.getByText('3')).toBeInTheDocument()
    expect(screen.getByText('1')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
  })

  it('비교 중인 자리에 표시를 붙인다', () => {
    render(<Bars step={makeStep({ comparing: [0, 1] })} />)
    expect(screen.getByText('3').closest('li')).toHaveClass('bar--comparing')
    expect(screen.getByText('2').closest('li')).not.toHaveClass('bar--comparing')
  })

  it('자리 잡은 곳에 표시를 붙인다', () => {
    render(<Bars step={makeStep({ settled: [2] })} />)
    expect(screen.getByText('2').closest('li')).toHaveClass('bar--settled')
  })

  it('찾은 자리에 표시를 붙인다', () => {
    render(<Bars step={makeStep({ found: 1 })} />)
    expect(screen.getByText('1').closest('li')).toHaveClass('bar--found')
  })

  it('막대 높이를 값에 비례해 정한다', () => {
    render(<Bars step={makeStep()} />)
    expect(screen.getByText('3').closest('li')).toHaveStyle({ height: '100%' })
  })
})
