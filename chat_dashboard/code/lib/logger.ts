export function logRequest(
  method: string,
  path: string,
  status: number,
  meta: { count?: number; cached?: boolean; duration: number }
) {
  const timestamp = new Date().toISOString();
  let logMsg = `[${timestamp}] ${method} ${path} — ${status}`;
  
  if (meta.count !== undefined) {
    const itemType = path.includes('messages') ? 'messages' : 'results';
    logMsg += ` (${meta.count} ${itemType}, cached: ${meta.cached ?? false}, ${meta.duration}ms)`;
  } else {
    logMsg += ` (${meta.duration}ms)`;
  }
  
  console.log(logMsg);
}
