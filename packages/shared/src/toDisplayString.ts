import { isString } from '.'

export const toDisplayString = (val: unknown): string => {
  return isString(val) ? val : val == null ? '' : String(val)
}
