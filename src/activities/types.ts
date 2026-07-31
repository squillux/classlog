import type { FC } from 'react'

export type ActivityProps = {
  onSubmit: (payload: unknown) => void | Promise<void>
}

export type Activity = {
  id: string
  title: string
  Component: FC<ActivityProps>
}
