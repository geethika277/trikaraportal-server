export function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: 'Not authenticated' });
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }
    next();
  };
}

export const ROLES = {
  SUPERADMIN: 'superadmin',
  PM: 'project_manager',
  DEV: 'developer',
  TESTER: 'tester',
  BDE: 'bde',
  ACCOUNTING: 'accounting',
};

export const ALL_ROLES = Object.values(ROLES);
export const ADMIN_ROLES = [ROLES.SUPERADMIN, ROLES.PM];
export const CRM_ROLES = [ROLES.SUPERADMIN, ROLES.BDE];
export const PROJECT_ROLES = [ROLES.SUPERADMIN, ROLES.PM];
export const DEV_ROLES = [ROLES.SUPERADMIN, ROLES.PM, ROLES.DEV, ROLES.TESTER];
