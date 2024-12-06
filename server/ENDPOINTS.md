# Documentacion API - Laboratios UEB

## 1. Autenticación

La autenticación se maneja mediante tokens JWT (JSON Web Tokens) que se almacenan en cookies para mantener la sesión del usuario. Ten en cuenta que dentro de la cookie de `accessToken` esta la id del usuario y id del rol, esto se hace para validar las acciones que pueda realizar según el rol.

### 1. Iniciar sesión

Este endpoint permite a los usuarios iniciar sesión en la aplicación proporcionando sus credenciales (correo electrónico y contraseña). Si las credenciales son válidas, el servidor devolverá un token de acceso para futuras solicitudes protegidas.

#### Endpoint `POST /api/auth/signin`

#### Parámetros de solicitud

```json
{
	"email": "string",
	"password": "string"
}
```

#### Respuestas

- **Respuesta exitosa (Código 200)**

  ```json
  {
  	"status": "success",
  	"code": 200,
  	"message": "Inicio de sesión exitoso.",
  	"data": {
  		"user": {
  			"id_user": "uuid",
  			"id_rol": "uuid"
  		},
  		"accessToken": "jwt"
  	}
  }
  ```

- **Respuesta de error (Código 403)**

  ```json
  {
  	"status": "error",
  	"code": 403,
  	"message": "Credenciales inválidas.",
  	"data": {}
  }
  ```

  ```json
  {
  	"status": "error",
  	"code": 403,
  	"message": "Tu cuenta está suspendida.",
  	"data": {}
  }
  ```

- **Respuesta de error (Código 400)**

  ```json
  {
  	"status": "error",
  	"code": 400,
  	"message": "Por favor, ingresa tus credenciales.",
  	"data": {}
  }
  ```

### 2. Cerrar sesión

Este endpoint permite a los usuarios cerrar sesión en la aplicación. Al invocar este endpoint, el servidor invalidará el token de acceso actual, lo que impide que el usuario acceda a recursos protegidos sin autenticación. Este proceso asegura que la sesión se termine correctamente en el servidor.

**Requisitos:** `autenticación`

#### Endpoint `POST /api/auth/logout`

#### Respuestas

- **Respuesta exitosa (Código 200)**

  ```json
  {
  	"status": "success",
  	"code": 403,
  	"message": "Sesión cerrada exitosamente.",
  	"data": {}
  }
  ```

- **Respuesta de error (Código 403)**

  ```json
  {
  	"status": "error",
  	"code": 403,
  	"message": "Credenciales inválidas o acceso no autorizado.",
  	"data": {}
  }
  ```

### 3. Refrescar el token

Este endpoint permite al usuario obtener un nuevo token de acceso utilizando el token de actualización. Es útil cuando el token de acceso ha expirado.

**Requisitos:** `autenticación`

#### Endpoint `POST /api/auth/refresh-token`

#### Respuestas

- **Respuesta exitosa (Código 200)**

  ```json
  {
  	"status": "success",
  	"code": 200,
  	"message": "Sesión extendida con éxito.",
  	"data": {
  		"accessToken": "jwt"
  	}
  }
  ```

- **Respuesta de error (Código 404)**

  ```json
  {
  	"status": "error",
  	"code": 404,
  	"message": "Usuario no encontrado.",
  	"data": {}
  }
  ```

- **Respuesta de error (Código 401)**

  ```json
  {
  	"status": "error",
  	"code": 404,
  	"message": "No hay token, inicia sesión nuevamente.",
  	"data": {}
  }
  ```

### 4. Solicitud de restablecimiento de contraseña

Este endpoint permite a los usuarios solicitar el restablecimiento de su contraseña proporcionando su correo electrónico. Si el correo es válido y el usuario está registrado, se enviará un correo electrónico con un enlace para restablecer la contraseña.

#### Endpoint `POST /api/auth/refresh-token`

#### Parámetros de solicitud

```json
{
	"email": "string"
}
```

#### Respuestas

- **Respuesta exitosa (Código 200)**

  ```json
  {
  	"status": "success",
  	"code": 200,
  	"message": "Correo enviado exitosamente.",
  	"data": {}
  }
  ```

- **Respuesta de error (Código 401)**

  ```json
  {
  	"status": "error",
  	"code": 401,
  	"message": "Por favor, ingresa tu email actual.",
  	"data": {}
  }
  ```

- **Respuesta de error (Código 404)**

  ```json
  {
  	"status": "error",
  	"code": 404,
  	"message": "Email no encontrado.",
  	"data": {}
  }
  ```

### 5. Restablecimiento de contraseña

Este endpoint permite a los usuarios restablecer su contraseña proporcionando un token válido y una nueva contraseña. El token se obtiene a través del proceso de solicitud de restablecimiento de contraseña.

#### Endpoint `PUT /api/auth/reset-password/:id`

#### Params `:id = ID del user`

#### Parámetros de solicitud

- **Params:** ID del user
- **Cuerpo:**

  ```json
  {
  	"token": "jwt",
  	"newPassword": "string",
  	"confirmPassword": "string"
  }
  ```

#### Respuestas

- **Respuesta exitosa (Código 200)**

  ```json
  {
  	"status": "success",
  	"code": 200,
  	"message": "Contraseña restablecida correctamente.",
  	"data": {}
  }
  ```

- **Respuesta de error (Código 400)**

  ```json
  {
  	"status": "error",
  	"code": 400,
  	"message": "Por favor, completa todos los campos.",
  	"data": {}
  }
  ```

- **Respuesta de error (Código 401)**

  ```json
  {
  	"status": "error",
  	"code": 401,
  	"message": "El código OTP ha expirado.",
  	"data": {}
  }
  ```

- **Respuesta de error (Código 402)**

  ```json
  {
  	"status": "error",
  	"code": 403,
  	"message": "No autorizado para realizar esta acción.",
  	"data": {}
  }
  ```

- **Respuesta de error (Código 404)**

  ```json
  {
  	"status": "error",
  	"code": 404,
  	"message": "Usuario no encontrado.",
  	"data": {}
  }
  ```

  ```json
  {
  	"status": "error",
  	"code": 400,
  	"message": "La contraseña no coincide.",
  	"data": {}
  }
  ```

## 2. Usuarios

### 1. Obtener todos los usuarios

**Requisitos:** `autenticación`

#### Endpoint `GET /api/user`

#### Respuestas

- **Respuesta exitosa (Código 200)**

  ```json
  {
  	"status": "success",
  	"code": 200,
  	"message": "Usuarios obtenidos exitosamente.",
  	"data": [
  		{
  			"id_user": "uuid",
  			"active": "boolean",
  			"full_name": "string",
  			"email": "string",
  			"phone": "string",
  			"identification_card": "string",
  			"password": "string",
  			"id_rol_fk": "uuid",
  			"createdAt": "date-ISO",
  			"updatedAt": "date-ISO",
  			"deletedAt": "date-ISO"
  		}
  	]
  }
  ```

- **Respuesta de error (Código 404)**

  ```json
  {
  	"status": "error",
  	"code": 404,
  	"message": "Usuarios no encontrados.",
  	"data": {}
  }
  ```

### 2. Obtener usuario

**Requisitos:** `autenticación`

#### Endpoint `GET /api/user/:id`

#### Parámetros de solicitud

- **Params:** ID del user

#### Respuestas

- **Respuesta exitosa (Código 200)**

  ```json
  {
  	"status": "success",
  	"code": 200,
  	"message": "Usuario obtenido exitosamente.",
  	"data": {
  		"id_user": "uuid",
  		"active": "boolen",
  		"full_name": "string",
  		"email": "string",
  		"phone": "string",
  		"identification_card": "string",
  		"password": "string",
  		"id_rol_fk": "uuid",
  		"createdAt": "date-ISO",
  		"updatedAt": "date-ISO",
  		"deletedAt": "date-ISO"
  	}
  }
  ```

- **Respuesta de error (Código 404)**

  ```json
  {
  	"status": "error",
  	"code": 404,
  	"message": "Usuario no encontrado.",
  	"data": {}
  }
  ```

### 3. Crear usuario

**Requisitos:** `autenticación` y rol `general_admin`

**Nota:** El campo de password no se solicita porque internamente se asigna la cédula como contraseña

#### Endpoint `POST /api/user`

#### Parámetros de solicitud

- **Cuerpo**

  ```json
  {
  	"full_name": "string",
  	"email": "string",
  	"phone": "string",
  	"identification_card": "string",
  	"id_rol_fk": "uuid"
  }
  ```

#### Respuestas

- **Respuesta exitosa (Código 200)**

  ```json
  {
  	"status": "success",
  	"code": 200,
  	"message": "Laboratorio creado exitosamente.",
  	"data": {
  		"id_lab": "uuid",
  		"active": "boolean",
  		"name": "string",
  		"location": "string",
  		"description": "string",
  		"id_supervisor_fk": "uuid",
  		"updatedAt": "date-ISO",
  		"createdAt": "date-ISO",
  		"deletedAt": "date-ISO"
  	}
  }
  ```

- **Respuesta de error (Código 400)**

  ```json
  {
  	"status": "error",
  	"code": 400,
  	"message": "Ya existe un laboratorio con el mismo nombre.",
  	"data": {}
  }
  ```

- **Respuesta de error (Código 400)**

  ```json
  {
  	"status": "error",
  	"code": 400,
  	"message": "message", --validaciones
  	"data": {}
  }
  ```

### 4. Actualizar usuario

**Requisitos:** `autenticación` y rol `general_admin`

#### Endpoint `PUT /api/user/:id`

#### Parámetros de solicitud

- **Params:** ID del user

- **Cuerpo:**

  ```json
  {
  	"full_name": "string",
  	"email": "string",
  	"phone": "string",
  	"identification_card": "string",
  	"active": "boolean",
  	"id_rol_fk": "uuid"
  }
  ```

#### Respuestas

- **Respuesta exitosa (Código 200)**

  ```json
  {
  	"status": "success",
  	"code": 200,
  	"message": "Laboratorio actualizado exitosamente.",
  	"data": {
  		"id_lab": "uuid",
  		"id_supervisor_fk": "uuid",
  		"active": "boolean",
  		"name": "string",
  		"location": "string",
  		"description": "string",
  		"createdAt": "date-ISO",
  		"updatedAt": "date-ISO",
  		"deletedAt": "date-ISO"
  	}
  }
  ```

- **Respuesta de error (Código 404)**

  ```json
  {
  	"status": "error",
  	"code": 404,
  	"message": "Laboratorio no econtrado.",
  	"data": {}
  }
  ```

- **Respuesta de error (Código 400)**

  ```json
  {
  	"status": "error",
  	"code": 400,
  	"message": "message", --validaciones
  	"data": {}
  }
  ```

### 5. Eliminar usuario

**Requisitos:** `autenticación` y rol `general_admin`

#### Endpoint `DELETE /api/user/:id`

#### Parámetros de solicitud

- **Params:** ID del user

#### Respuestas

- **Respuesta exitosa (Código 200)**

  ```json
  {
  	"status": "success",
  	"code": 200,
  	"message": "Usuario eliminado exitosamente.",
  	"data": {
  		"id_user": "uuid",
  		"active": "boolean",
  		"full_name": "string",
  		"email": "string",
  		"phone": "string",
  		"identification_card": "string",
  		"password": "string",
  		"id_rol_fk": "uuid",
  		"updatedAt": "date-ISO",
  		"createdAt": "date-ISO",
  		"deletedAt": "date-ISO"
  	}
  }
  ```

- **Respuesta de error (Código 404)**

  ```json
  {
  	"status": "error",
  	"code": 404,
  	"message": "usuario no encontrado.",
  	"data": {}
  }
  ```

## 3. Laboratorios

### 1. Obtener todos los laboratorios

**Requisitos:** `autenticación`

#### Endpoint `GET /api/lab`

#### Respuestas

- **Respuesta exitosa (Código 200)**

  ```json
  {
  	"status": "success",
  	"code": 200,
  	"message": "Laboratorios obtenidos exitosamente.",
  	"data": [
  		{
  			"id_lab": "uuid",
  			"id_supervisor_fk": "uuid",
  			"active": true,
  			"name": "string",
  			"location": "string",
  			"description": "string",
  			"createdAt": "date-ISO",
  			"updatedAt": "date-ISO",
  			"deletedAt": "date-ISO"
  		}
  	]
  }
  ```

- **Respuesta de error (Código 404)**

  ```json
  {
  	"status": "error",
  	"code": 404,
  	"message": "Laboratorios no encontrados.",
  	"data": {}
  }
  ```

### 2. Obtener laboratorio

**Requisitos:** `autenticación`

#### Endpoint `GET /api/lab/:id`

- **Params:** ID del laboratorio

#### Respuestas

- **Respuesta exitosa (Código 200)**

  ```json
  {
  	"status": "success",
  	"code": 200,
  	"message": "Laboratorios obtenido exitosamente.",
  	"data": {
  		"id_lab": "uuid",
  		"id_supervisor_fk": "uuid",
  		"active": "boolean",
  		"name": "string",
  		"location": "string",
  		"description": "string",
  		"createdAt": "date-ISO",
  		"updatedAt": "date-ISO",
  		"deletedAt": "date-ISO" -showed only after delete
  	}
  }
  ```

- **Respuesta de error (Código 404)**

  ```json
  {
  	"status": "error",
  	"code": 404,
  	"message": "Laboratorio no encontrado.",
  	"data": {}
  }
  ```

### 3. Crear laboratorio

**Requisitos:** `autenticación` y rol `general_admin`

#### Endpoint `POST /api/lab`

#### Parámetros de solicitud

```json
{
	"name": "string",
	"location": "string",
	"description": "string", --optinal
	"id_supervisor_fk": "uuid"
}
```

#### Respuestas

- **Respuesta exitosa (Código 200)**

  ```json
  {
  	"status": "success",
  	"code": 200,
  	"message": "Laboratorio creado exitosamente.",
  	"data": {
  		"id_lab": "uuid",
  		"active": "boolean",
  		"name": "string",
  		"location": "string",
  		"description": "string",
  		"id_supervisor_fk": "uuid",
  		"updatedAt": "date-ISO",
  		"createdAt": "date-ISO",
  		"deletedAt": "date-ISO"
  	}
  }
  ```

- **Respuesta de error (Código 400)**

  ```json
  {
  	"status": "error",
  	"code": 400,
  	"message": "Ya existe un laboratorio con el mismo nombre.",
  	"data": {}
  }
  ```

- **Respuesta de error (Código 400)**

  ```json
  {
  	"status": "error",
  	"code": 400,
  	"message": "message", --validaciones
  	"data": {}
  }
  ```

### 4. Actualizar laboratorio

**Requisitos:** `autenticación` y rol `general_admin`

#### Endpoint `PUT /api/lab/:id`

#### Parámetros de solicitud

- **Params:** ID del laboratorio

- **Cuerpo:**

```json
{
	"name": "string",
	"location": "string",
	"description": "string", --optinal
	"active": "boolean",
	"id_supervisor_fk": "uuid"
}
```

#### Respuestas

- **Respuesta exitosa (Código 200)**

  ```json
  {
  	"status": "success",
  	"code": 200,
  	"message": "Laboratorio actualizado exitosamente.",
  	"data": {
  		"id_lab": "uuid",
  		"id_supervisor_fk": "uuid",
  		"active": "boolean",
  		"name": "string",
  		"location": "string",
  		"description": "string",
  		"createdAt": "date-ISO",
  		"updatedAt": "date-ISO",
  		"deletedAt": "date-ISO"
  	}
  }
  ```

- **Respuesta de error (Código 404)**

  ```json
  {
  	"status": "error",
  	"code": 404,
  	"message": "Laboratorio no econtrado.",
  	"data": {}
  }
  ```

- **Respuesta de error (Código 400)**

  ```json
  {
  	"status": "error",
  	"code": 400,
  	"message": "message", --validaciones
  	"data": {}
  }
  ```

### 5. Eliminar laboratorios

**Requisitos:** `autenticación` y rol `general_admin`

#### Endpoint `DELETE /api/lab/:id`

#### Parámetros de solicitud

- **Params:** ID del laboratorio

#### Respuestas

- **Respuesta exitosa (Código 200)**

  ```json
  {
  	"status": "success",
  	"code": 200,
  	"message": "Laboratorio eliminado exitosamente.",
  	"data": {
  		"id_lab": "uuid",
  		"id_supervisor_fk": "uuid",
  		"active": "boolean",
  		"name": "string",
  		"location": "string",
  		"description": "string",
  		"createdAt": "date-ISO",
  		"updatedAt": "date-ISO",
  		"deletedAt": "date-ISO"
  	}
  }
  ```

- **Respuesta de error (Código 404)**

  ```json
  {
  	"status": "error",
  	"code": 404,
  	"message": "Laboratorio no encontrado.",
  	"data": {}
  }
  ```

```

```

## 4. Acceso a laboratorios

### 1. Obtener todos los accesos a laboratorios

**Requisitos:** `autenticación`

#### Endpoint `GET /api/access-lab`

#### Respuestas

- **Respuesta exitosa (Código 200)**

  ```json
  {
  	"status": "success",
  	"code": 200,
  	"message": "Accesos a los laboratorios obtenidos exitosamente.",
  	"data": [
  		{
  			"id_access_lab": "uuid",
  			"full_name": "string",
  			"identification_card": "string",
  			"type_access": "string",
  			"id_access_manager_fk": "uuid",
  			"id_lab_fk": "uuid",
  			"createdAt": "date-ISO",
  			"updatedAt": "date-ISO",
  			"deletedAt": "date-ISO"
  		}
  	]
  }
  ```

- **Respuesta de error (Código 404)**

  ```json
  {
  	"status": "error",
  	"code": 404,
  	"message": "Accesos a los laboratorios no encontrados.",
  	"data": {}
  }
  ```

### 2. Obtener acceso a laboratorio

**Requisitos:** `autenticación`

#### Endpoint `GET /api/access-lab/:id`

#### Parámetros de solicitud

- **Params:** ID del acceso laboratorio

- **Cuerpo:**

#### Respuestas

- **Respuesta exitosa (Código 200)**

  ```json
  {
  	"status": "success",
  	"code": 200,
  	"message": "Acceso al laboratorio obtenido exitosamente.",
  	"data": {
  		"id_access_lab": "uui",
  		"full_name": "string",
  		"identification_card": "string",
  		"type_access": "string",
  		"id_access_manager_fk": "uuid",
  		"id_lab_fk": "uuid",
  		"createdAt": "date-ISO",
  		"updatedAt": "date-ISO",
  		"deletedAt": "date-ISO"
  	}
  }
  ```

- **Respuesta de error (Código 404)**

  ```json
  {
  	"status": "error",
  	"code": 404,
  	"message": "Acceso al laboratorio no encontrado.",
  	"data": {}
  }
  ```

### 3. Crear acceso al laboratorio

**Requisitos:** `autenticación` y rol `access_manager`

#### Endpoint `POST /api/access-lab`

#### Parámetros de solicitud

```json
{
	"full_name": "string",
	"identification_card": "string",
	"type_access": "string",
	"id_lab_fk": "uuid"
}
```

#### Respuestas

- **Respuesta exitosa (Código 200)**

  ```json
  {
  	"status": "success",
  	"code": 200,
  	"message": "Acceso al al laboratorio creado exitosamente.",
  	"data": {
  		"id_access_lab": "uuid",
  		"full_name": "string",
  		"identification_card": "string",
  		"type_access": "string",
  		"id_lab_fk": "uuid",
  		"id_access_manager_fk": "uuid",
  		"updatedAt": "date-ISO",
  		"createdAt": "date-ISO",
  		"deletedAt": "date-ISO"
  	}
  }
  ```

- **Respuesta de error (Código 400)**

  ```json
  {
  	"status": "error",
  	"code": 400,
  	"message": "message", --validaciones
  	"data": {}
  }
  ```

### 4. Actualizar acceso al laboratorio

**Requisitos:** `autenticación` y rol `access_manager`

#### Endpoint `PUT /api/access-lab/:id`

#### Parámetros de solicitud

- **Params:** ID del acceso al laboratorio

- **Cuerpo:**

```json
{
	"full_name": "string",
	"identification_card": "string",
	"type_access": "string",
	"id_lab_fk": "uuid"
}
```

#### Respuestas

- **Respuesta exitosa (Código 200)**

  ```json
  {
  	"status": "success",
  	"code": 200,
  	"message": "Acceso la laboratorio actualizado exitosamente.",
  	"data": {
  		"id_access_lab": "uuid",
  		"full_name": "string",
  		"identification_card": "string",
  		"type_access": "string",
  		"id_access_manager_fk": "uuid",
  		"id_lab_fk": "uuid",
  		"createdAt": "date-ISO",
  		"updatedAt": "date-ISO",
  		"deletedAt": "date-ISO"
  	}
  }
  ```

- **Respuesta de error (Código 404)**

  ```json
  {
  	"status": "error",
  	"code": 404,
  	"message": "Acceso al laboratorio no econtrado.",
  	"data": {}
  }
  ```

- **Respuesta de error (Código 400)**

  ```json
  {
  	"status": "error",
  	"code": 400,
  	"message": "message", --validaciones
  	"data": {}
  }
  ```

### 5. Eliminar laboratorios

**Requisitos:** `autenticación` y rol `access_manager`

#### Endpoint `DELETE /api/access-lab/:id`

#### Parámetros de solicitud

- **Params:** ID del acceso al laboratorio

#### Respuestas

- **Respuesta exitosa (Código 200)**

  ```json
  {
  	"status": "success",
  	"code": 200,
  	"message": "Acceso la laboratorio eliminado exitosamente.",
  	"data": {
  		"id_access_lab": "uuid",
  		"full_name": "string",
  		"identification_card": "string",
  		"type_access": "string",
  		"id_access_manager_fk": "uuid",
  		"id_lab_fk": "uuid",
  		"createdAt": "date-ISO",
  		"updatedAt": "date-ISO",
  		"deletedAt": "date-ISO"
  	}
  }
  ```

- **Respuesta de error (Código 404)**

  ```json
  {
  	"status": "error",
  	"code": 404,
  	"message": "Acceso la laboratorio no encontrado.",
  	"data": {}
  }
  ```
