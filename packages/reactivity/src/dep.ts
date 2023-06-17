import { ReactiveEffect } from './effect'

export type Dep = Set<ReactiveEffect>

export function createDep(effects?: ReactiveEffect[]): Dep {
  const dep = new Set<ReactiveEffect>(effects) as Dep
  return dep
}
