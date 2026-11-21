export function createRegistry(commands) {
  const map = new Map();
  for (const cmd of commands) {
    if (!cmd.name || typeof cmd.execute !== 'function') throw new Error('Comando inválido');
    for (const alias of [cmd.name, ...(cmd.aliases || [])]) {
      if (map.has(alias)) throw new Error(`Comando duplicado: ${alias}`);
      map.set(alias, cmd);
    }
  }
  return { get: name => map.get(name), list: () => commands };
}
