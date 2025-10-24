import { db } from "../../db/db";
import { student } from "../../db/schemas/Student";
import { eq } from "drizzle-orm";

export type LoginInput = {
  username: string;
  password: string;
};

export type RegisterInput = {
  username: string;
  password: string;
};

export type AuthUser = {
  studentId: number;
  name: string;
  email: string;
};

/**
 * Registra un nuevo usuario en la bdgit 
 */
export async function registerUser(data: RegisterInput): Promise<{ success: boolean; error?: string; user?: AuthUser }> {
  try {
    // Verificar si el usuario ya existe
    const existingUser = await db
      .select()
      .from(student)
      .where(eq(student.name, data.username.trim()))
      .limit(1);

    if (existingUser.length > 0) {
      return {
        success: false,
        error: 'Este nombre de usuario ya está en uso',
      };
    }

    // Crear el nuevo usuario
    await db.insert(student).values({
      name: data.username.trim(),
      email: `${data.username.trim().toLowerCase()}@focustrack.local`,
      password: data.password, // TODO: En producción hashear la contraseña
    });

    // Obtener el usuario recién creado
    const newUser = await db
      .select()
      .from(student)
      .where(eq(student.name, data.username.trim()))
      .limit(1);

    if (newUser.length === 0) {
      return {
        success: false,
        error: 'Error al crear el usuario',
      };
    }

    return {
      success: true,
      user: {
        studentId: newUser[0].studentId!,
        name: newUser[0].name!,
        email: newUser[0].email!,
      },
    };
  } catch (error) {
    console.error('Error en registerUser:', error);
    return {
      success: false,
      error: 'Error al registrar usuario',
    };
  }
}

/**
 * Inicia sesión de un usuario
 */
export async function loginUser(data: LoginInput): Promise<{ success: boolean; error?: string; user?: AuthUser }> {
  try {
    const users = await db
      .select()
      .from(student)
      .where(eq(student.name, data.username.trim()))
      .limit(1);

    if (users.length === 0) {
      return {
        success: false,
        error: 'Usuario no encontrado',
      };
    }

    const user = users[0];

    // Verificar contraseña (TODO: comparar hash en producción)
    if (user.password !== data.password) {
      return {
        success: false,
        error: 'Contraseña incorrecta',
      };
    }

    return {
      success: true,
      user: {
        studentId: user.studentId!,
        name: user.name!,
        email: user.email!,
      },
    };
  } catch (error) {
    console.error('Error en loginUser:', error);
    return {
      success: false,
      error: 'Error al iniciar sesión',
    };
  }
}

/**
 * Obtiene un usuario por su ID
 */
export async function getUserById(studentId: number): Promise<AuthUser | null> {
  try {
    const users = await db
      .select()
      .from(student)
      .where(eq(student.studentId, studentId))
      .limit(1);

    if (users.length === 0) return null;

    const user = users[0];
    return {
      studentId: user.studentId!,
      name: user.name!,
      email: user.email!,
    };
  } catch (error) {
    console.error('Error en getUserById:', error);
    return null;
  }
}