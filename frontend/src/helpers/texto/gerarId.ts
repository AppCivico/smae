export default () => crypto?.randomUUID() || `${Date.now()}-${Math.random().toString(36).substring(2)}`;
