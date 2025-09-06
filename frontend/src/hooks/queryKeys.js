// Central key factory for React Query
export const keys = {
  users: {
    all: ['users'],
    list: (filters = {}) => ['users', 'list', { ...filters }],
    detail: (id) => ['users', 'detail', id],
  },
  patients: {
    all: ['patients'],
    list: (filters = {}) => ['patients', 'list', { ...filters }],
    detail: (id) => ['patients', 'detail', id],
  },
  plans: {
    all: ['plans'],
    list: (filters = {}) => ['plans', 'list', { ...filters }],
    detail: (id) => ['plans', 'detail', id],
  },
  sessions: {
    all: ['sessions'],
    list: (filters = {}) => ['sessions', 'list', { ...filters }],
    detail: (id) => ['sessions', 'detail', id],
  },
  reports: {
    all: ['reports'],
    list: (filters = {}) => ['reports', 'list', { ...filters }],
    detail: (id) => ['reports', 'detail', id],
  },
  notifications: {
    all: ['notifications'],
    list: (filters = {}) => ['notifications', 'list', { ...filters }],
    unreadCount: () => ['notifications', 'unreadCount'],
  },
};

export default keys;
