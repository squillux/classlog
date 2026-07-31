import type { Step } from './steps'

export default function Bars({ step }: { step: Step }) {
  const max = Math.max(...step.array)

  return (
    <ul className="plain-list bars">
      {step.array.map((value, i) => {
        // 한 막대가 여러 상태에 걸릴 수 있다. 찾음 → 비교 중 → 자리 잡음
        // 순으로 하나만 고른다. 정해 두지 않으면 색이 들쭉날쭉해진다.
        const classes = ['bar']
        if (step.found === i) classes.push('bar--found')
        else if (step.comparing.includes(i)) classes.push('bar--comparing')
        else if (step.settled.includes(i)) classes.push('bar--settled')

        return (
          <li
            key={i}
            className={classes.join(' ')}
            style={{ height: `${(value / max) * 100}%` }}
          >
            <span className="bar__value">{value}</span>
          </li>
        )
      })}
    </ul>
  )
}
