import { Resource, Permission, UserRole } from '../types/auth.types';

/**
 * Tipo para la matriz de permisos
 */
type PermissionMatrix = {
  [role in UserRole]: {
    [resource in Resource]: Permission[]
  }
};

/**
 * Matriz de permisos basada en roles
 * Define los permisos que tiene cada rol sobre cada recurso del sistema
 */
export const rolePermissions: PermissionMatrix = {
  [UserRole.ADMIN]: {
    [Resource.USUARIOS]: [
      Permission.CREATE,
      Permission.READ,
      Permission.UPDATE,
      Permission.DELETE
    ],
    [Resource.PRODUCTOS]: [
      Permission.CREATE,
      Permission.READ,
      Permission.UPDATE,
      Permission.DELETE
    ],
    [Resource.CATEGORIAS]: [
      Permission.CREATE,
      Permission.READ,
      Permission.UPDATE,
      Permission.DELETE
    ],
    [Resource.INVENTARIO]: [
      Permission.CREATE,
      Permission.READ,
      Permission.UPDATE,
      Permission.DELETE
    ],
    [Resource.ASIGNACIONES]: [
      Permission.CREATE,
      Permission.READ,
      Permission.UPDATE,
      Permission.DELETE,
      Permission.ASSIGN,
      Permission.APPROVE
    ],
    [Resource.REPARACIONES]: [
      Permission.CREATE,
      Permission.READ,
      Permission.UPDATE,
      Permission.DELETE,
      Permission.REPAIR,
      Permission.APPROVE
    ],
    [Resource.REPORTES]: [
      Permission.CREATE,
      Permission.READ
    ]
  },

  [UserRole.USER]: {
    [Resource.USUARIOS]: [],
    [Resource.PRODUCTOS]: [
      Permission.READ
    ],
    [Resource.CATEGORIAS]: [
      Permission.READ
    ],
    [Resource.INVENTARIO]: [
      Permission.READ
    ],
    [Resource.ASIGNACIONES]: [
      Permission.READ
    ],
    [Resource.REPARACIONES]: [
      Permission.CREATE,
      Permission.READ
    ],
    [Resource.REPORTES]: []
  },
};

/**
 * Verifica si un rol tiene un permiso específico sobre un recurso
 * @param role Rol del usuario
 * @param resource Recurso a verificar
 * @param permission Permiso a verificar
 * @returns true si tiene permiso, false de lo contrario
 */
export const hasPermission = (
  role: string,
  resource: string,
  permission: string
): boolean => {
  // Verificar si el rol existe en la matriz de permisos
  if (!Object.values(UserRole).includes(role as UserRole)) {
    return false;
  }

  // Verificar si el recurso existe en la matriz de permisos
  if (!Object.values(Resource).includes(resource as Resource)) {
    return false;
  }

  // Verificar si el permiso existe en la matriz de permisos
  if (!Object.values(Permission).includes(permission as Permission)) {
    return false;
  }

  // Obtener los permisos del rol para el recurso
  const rolePerms = rolePermissions[role as UserRole][resource as Resource];
  
  // Verificar si el permiso está incluido en los permisos del rol
  return rolePerms && rolePerms.includes(permission as any);
};

/**
 * Obtiene todos los permisos de un rol en formato "recurso:operación"
 * @param role Rol del usuario
 * @returns Array de permisos en formato "recurso:operación"
 */
export const getRolePermissions = (role: string): string[] => {
  if (!Object.values(UserRole).includes(role as UserRole)) {
    return [];
  }

  const permissions: string[] = [];

  // Iterar sobre cada recurso en el rol
  Object.entries(rolePermissions[role as UserRole]).forEach(([resource, perms]) => {
    // Para cada permiso en el recurso, agregarlo al array
    perms.forEach(perm => {
      permissions.push(`${resource}:${perm}`);
    });
  });

  return permissions;
};
