export function cleanEnvVar(value?: string | undefined): string {
  return (value || '').trim().replace(/^"+|"+$/g, '');
}
