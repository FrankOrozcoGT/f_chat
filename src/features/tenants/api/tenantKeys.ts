export const tenantKeys = {
  all: ['tenants'] as const,
  mine: () => [...tenantKeys.all, 'mine'] as const,
  members: (tenantId: string) => [...tenantKeys.all, tenantId, 'members'] as const,
};
