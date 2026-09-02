export function cn(...classes: (string | boolean | undefined | null)[]) {
  return classes.filter(Boolean).join(' ')
}

export async function pollTask<T>(taskId: string, maxWaitMs = 180000, intervalMs = 1000): Promise<T> {
  const t0 = Date.now()
  while (Date.now() - t0 < maxWaitMs) {
    await new Promise(r => setTimeout(r, intervalMs))
    const res = await fetch(`/api/tarea/${taskId}`)
    const data = await res.json()
    if (data.status === 'completado') return data.resultado as T
    if (data.status === 'error') throw new Error(data.error || 'Error en la ejecución')
  }
  throw new Error('Tiempo de espera agotado')
}
