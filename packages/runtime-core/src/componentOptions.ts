import { reactive } from '@vue/reactivity'

export function applyOptions(instance: any) {
  const options = resolveMergedOptions(instance)

  const { data: dataOptions } = options
  if (dataOptions) {
    const data = dataOptions()
    instance.data = reactive(data)
  }
}

export function resolveMergedOptions(instance: any) {
  const base = instance.type
  return base
}
