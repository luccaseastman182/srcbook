export function isSrcmdPath(path: string) {
  try {
    return path.endsWith('.src.md');
  } catch (error) {
    console.error('Error in isSrcmdPath:', error);
    return false;
  }
}
