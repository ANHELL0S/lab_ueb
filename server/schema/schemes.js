import { DataTypes } from 'sequelize'
import { db_main } from '../config/db.config.js'
import { DIRECTOR, SUPERVISOR, GENERAL_ADMIN, ACCESS_MANAGER, TECHNICAL_ANALYST } from '../const/roles.const.js'

/* ------------------------------- ROLES -----------------------------*/

export const rol_Schema = db_main.define(
	'roles',
	{
		id_rol: {
			type: DataTypes.UUID,
			defaultValue: DataTypes.UUIDV4,
			primaryKey: true,
		},
		type_rol: {
			type: DataTypes.STRING,
			allowNull: false,
			validate: {
				isIn: [[GENERAL_ADMIN, DIRECTOR, SUPERVISOR, TECHNICAL_ANALYST, ACCESS_MANAGER]],
			},
		},
	},
	{
		timestamps: true,
		tableName: 'roles',
	}
)

/* ------------------------------- USERS -----------------------------*/

export const user_Schema = db_main.define(
	'users',
	{
		id_user: {
			type: DataTypes.UUID,
			defaultValue: DataTypes.UUIDV4,
			primaryKey: true,
		},
		active: {
			type: DataTypes.BOOLEAN,
			allowNull: false,
			defaultValue: true,
		},
		full_name: {
			type: DataTypes.STRING,
			allowNull: false,
		},
		email: {
			type: DataTypes.STRING,
			allowNull: false,
		},
		phone: {
			type: DataTypes.STRING(10),
			allowNull: true,
			validate: {
				is: /^[0-9]+$/,
			},
		},
		identification_card: {
			type: DataTypes.STRING(10),
			allowNull: false,
		},
		password: {
			type: DataTypes.STRING,
			allowNull: false,
		},
		code: {
			type: DataTypes.STRING,
			allowNull: true,
		},
	},
	{
		timestamps: true,
		tableName: 'users',
	}
)

/* ------------------------------- USERS ROLE - INTERMEDIATE -----------------------------*/

export const user_role_main_Schema = db_main.define(
	'user_roles_intermediate',
	{
		id_user_role_intermediate: {
			type: DataTypes.UUID,
			defaultValue: DataTypes.UUIDV4,
			primaryKey: true,
		},
		id_user_fk: {
			type: DataTypes.UUID,
			allowNull: true,
			references: {
				model: 'users',
				key: 'id_user',
			},
		},
	},
	{
		timestamps: true,
		tableName: 'user_roles_intermediate',
	}
)

// Relación Uno a Uno (1:1)
// Un único registro de user_role_main_Schema está asociado a un único usuario en user_Schema.
user_role_main_Schema.belongsTo(user_Schema, {
	foreignKey: 'id_user_fk',
	sourceKey: 'id_user',
	onDelete: 'CASCADE',
})

// Relación Uno a Uno (1:1)
// Un usuario en user_Schema tiene un único registro en user_role_main_Schema.
user_Schema.hasOne(user_role_main_Schema, {
	foreignKey: 'id_user_fk',
	targetKey: 'id_user',
	onDelete: 'CASCADE',
})

/* ------------------------------- USERS ROLES -----------------------------*/

export const user_roles_Schema = db_main.define(
	'user_roles',
	{
		id_user_roles: {
			type: DataTypes.UUID,
			defaultValue: DataTypes.UUIDV4,
			primaryKey: true,
		},
		id_user_role_intermediate_fk: {
			type: DataTypes.UUID,
			allowNull: true,
			references: {
				model: 'user_roles_intermediate',
				key: 'id_user_role_intermediate',
			},
		},
		id_rol_fk: {
			type: DataTypes.UUID,
			allowNull: true,
			references: {
				model: 'roles',
				key: 'id_rol',
			},
		},
	},
	{
		timestamps: true,
		tableName: 'user_roles',
	}
)

// Relación Muchos a Uno (n:1)
// Muchos registros de user_roles_Schema están asociados a un único registro en user_role_main_Schema.
user_roles_Schema.belongsTo(user_role_main_Schema, {
	foreignKey: 'id_user_role_intermediate_fk',
	sourceKey: 'id_user_role_intermediate',
	onDelete: 'CASCADE',
})

// Relación Uno a Muchos (1:n)
// Un registro de user_role_main_Schema puede tener muchos registros asociados en user_roles_Schema.
user_role_main_Schema.hasMany(user_roles_Schema, {
	foreignKey: 'id_user_role_intermediate_fk',
	targetKey: 'id_user_role_intermediate',
	onDelete: 'CASCADE',
})

// Relación Muchos a Uno (n:1)
// Muchos registros de user_roles_Schema están asociados a un único registro de rol_Schema.
user_roles_Schema.belongsTo(rol_Schema, {
	foreignKey: 'id_rol_fk',
	sourceKey: 'id_rol',
})

// Relación Uno a Muchos (1:n)
// Un registro de rol_Schema puede tener muchos registros asociados en user_roles_Schema.
rol_Schema.hasMany(user_roles_Schema, {
	foreignKey: 'id_rol_fk',
	targetKey: 'id_rol',
})

// Relación Muchos a Uno (n:1)
// Muchos registros de user_roles_Schema están asociados a un único registro de user_Schema.
user_roles_Schema.belongsTo(user_Schema, {
	foreignKey: 'id_user_role_intermediate_fk',
	sourceKey: 'id_user_fk',
	onDelete: 'CASCADE',
})

// Relación Uno a Muchos (1:n)
// Un usuario en user_Schema puede tener muchos roles asociados en user_roles_Schema.
user_Schema.hasMany(user_roles_Schema, {
	foreignKey: 'id_user_role_intermediate_fk',
	targetKey: 'id_user_fk',
	onDelete: 'CASCADE',
})

/* ------------------------------- TOKEN -----------------------------*/

export const token_Schema = db_main.define(
	'tokens',
	{
		id_token: {
			type: DataTypes.UUID,
			defaultValue: DataTypes.UUIDV4,
			primaryKey: true,
		},
		id_user_fk: {
			type: DataTypes.UUID,
			allowNull: false,
			references: {
				model: 'users',
				key: 'id_user',
			},
		},
		token: {
			type: DataTypes.TEXT,
			allowNull: false,
		},
		used: {
			type: DataTypes.BOOLEAN,
			defaultValue: false,
		},
	},
	{
		tableName: 'tokens',
	}
)

// Relación Uno a Uno (1:1)
// Un usuario tiene un único token
user_Schema.hasOne(token_Schema, {
	foreignKey: 'id_user_fk',
	sourceKey: 'id_user',
})

/* ------------------------------- LABORATORY -----------------------------*/

export const laboratory_Schema = db_main.define(
	'laboratories',
	{
		id_lab: {
			type: DataTypes.UUID,
			defaultValue: DataTypes.UUIDV4,
			primaryKey: true,
		},
		active: {
			type: DataTypes.BOOLEAN,
			allowNull: false,
			defaultValue: true,
		},
		name: {
			type: DataTypes.STRING,
			allowNull: false,
		},
		location: {
			type: DataTypes.STRING,
			allowNull: false,
		},
		description: {
			type: DataTypes.STRING,
			allowNull: true,
		},
	},
	{
		timestamps: true,
		tableName: 'laboratories',
	}
)

/* ------------------------------- LABS <-> ANALYS -----------------------------*/

export const laboratory_analyst_Schema = db_main.define(
	'laboratory_analysts',
	{
		id_laboratory_analysts: {
			type: DataTypes.UUID,
			defaultValue: DataTypes.UUIDV4,
			primaryKey: true,
		},
		id_lab_fk: {
			type: DataTypes.UUID,
			allowNull: false,
			references: {
				model: 'laboratories',
				key: 'id_lab',
			},
		},
		id_analyst_fk: {
			type: DataTypes.UUID,
			allowNull: false,
			references: {
				model: 'users',
				key: 'id_user',
			},
		},
	},
	{
		timestamps: true,
		tableName: 'laboratory_analysts',
	}
)

// Un laboratorio tiene un único analista (relación 1:1)
laboratory_Schema.hasOne(laboratory_analyst_Schema, {
	foreignKey: 'id_lab_fk',
})

// Un analista pertenece a un único laboratorio (relación 1:1)
laboratory_analyst_Schema.belongsTo(laboratory_Schema, {
	foreignKey: 'id_lab_fk',
})

// Un analista se refiere a un usuario (relación 1:1)
laboratory_analyst_Schema.belongsTo(user_Schema, {
	foreignKey: 'id_analyst_fk',
})

// Un usuario puede ser asignado a un único laboratorio a través de la tabla intermedia (relación 1:1)
user_Schema.hasOne(laboratory_analyst_Schema, {
	foreignKey: 'id_analyst_fk',
})

/* ------------------------------- REGISTER ACCESS LABS -----------------------------*/

export const access_lab_Scheme = db_main.define(
	'access_labs',
	{
		id_access_lab: {
			type: DataTypes.UUID,
			defaultValue: DataTypes.UUIDV4,
			primaryKey: true,
		},
		full_name: {
			type: DataTypes.STRING,
			allowNull: false,
		},
		identification_card: {
			type: DataTypes.STRING(10),
			allowNull: false,
		},
		type_access: {
			type: DataTypes.STRING(),
			allowNull: false,
		},
		id_lab_fk: {
			type: DataTypes.UUID,
			allowNull: false,
			references: {
				model: 'laboratories',
				key: 'id_lab',
			},
		},
		id_access_manager_fk: {
			type: DataTypes.UUID,
			allowNull: false,
			references: {
				model: 'users',
				key: 'id_user',
			},
		},
	},
	{
		timestamps: true,
		tableName: 'access_labs',
	}
)

// Relación Uno a Muchos (1:n)
// Un supervisor de accesos pueden ser responsables de varios accesos.
user_Schema.hasMany(access_lab_Scheme, {
	foreignKey: 'id_access_manager_fk',
	targetKey: 'id_user',
})

// Relación Muchos a Uno (n:1)
// Varios accesos pueden ser responsables de un unico supervisor de accesos.
access_lab_Scheme.belongsTo(user_Schema, {
	foreignKey: 'id_access_manager_fk',
	targetKey: 'id_user',
})

/* ------------------------------- ACCESS LABS STATUS -----------------------------*/

export const access_lab_status_Schema = db_main.define(
	'access_lab_status',
	{
		id_access_lab_status: {
			type: DataTypes.UUID,
			defaultValue: DataTypes.UUIDV4,
			primaryKey: true,
		},
		id_access_lab_fk: {
			type: DataTypes.UUID,
			allowNull: false,
			references: {
				model: 'access_labs',
				key: 'id_access_lab',
			},
		},
		status: {
			type: DataTypes.STRING,
			allowNull: false,
			defaultValue: 'pending',
			validate: {
				isIn: [['pending', 'approved', 'rejected']],
			},
		},
	},
	{
		timestamps: true,
		tableName: 'access_lab_status',
	}
)

// Relación Uno a Uno (1:1)
// Un estado de acceso está asociado a un único acceso a laboratorio.
access_lab_status_Schema.belongsTo(access_lab_Scheme, {
	foreignKey: 'id_access_lab_fk',
	targetKey: 'id_access_lab',
})

// Relación Uno a Uno (1:1)
// Un acceso a laboratorio está asociado a un único estado de acceso.
access_lab_Scheme.hasOne(access_lab_status_Schema, {
	foreignKey: 'id_access_lab_fk',
	sourceKey: 'id_access_lab',
})

/* ------------------------------- REACTIVES -----------------------------*/

export const reactive_Schema = db_main.define(
	'reactives',
	{
		id_reactive: {
			type: DataTypes.UUID,
			defaultValue: DataTypes.UUIDV4,
			primaryKey: true,
		},
		name: {
			type: DataTypes.STRING,
			allowNull: false,
		},
		code: {
			type: DataTypes.STRING,
			allowNull: false,
		},
		number_of_containers: {
			type: DataTypes.INTEGER,
			allowNull: false,
		},
		initial_quantity: {
			type: DataTypes.FLOAT,
			allowNull: false,
		},
		current_quantity: {
			type: DataTypes.FLOAT,
			allowNull: false,
		},
		unit: {
			type: DataTypes.ENUM('g', 'mg', 'kg', 'l', 'ml', 'units'),
			allowNull: false,
		},
		cas: {
			type: DataTypes.STRING,
			allowNull: true,
		},
		entry_date: {
			type: DataTypes.DATE,
			allowNull: false,
		},
		expiration_date: {
			type: DataTypes.DATE,
			allowNull: true,
		},
		is_controlled: {
			type: DataTypes.BOOLEAN,
			allowNull: false,
			defaultValue: false,
		},
	},
	{
		timestamps: true,
		tableName: 'reactives',
	}
)

/* ------------------------------- REACTIVES CONSUMPTION -----------------------------*/

export const reactiveConsumption_Schema = db_main.define(
	'reactive_consumptions',
	{
		id_consumption: {
			type: DataTypes.UUID,
			defaultValue: DataTypes.UUIDV4,
			primaryKey: true,
		},
		id_reactive_fk: {
			type: DataTypes.UUID,
			allowNull: false,
			references: {
				model: 'reactives',
				key: 'id_reactive',
			},
		},
		name_analyst: {
			type: DataTypes.STRING,
			allowNull: false,
		},
		name_experiment: {
			type: DataTypes.STRING,
			allowNull: false,
		},
		quantity_consumed: {
			type: DataTypes.FLOAT,
			allowNull: false,
		},
		unit: {
			type: DataTypes.ENUM('g', 'mg', 'kg', 'l', 'ml', 'units'),
			allowNull: false,
		},
	},
	{
		timestamps: true,
		tableName: 'reactive_consumptions',
	}
)

// Relación Muchos a Uno (n:1)
// Varios consumos de reactivos pueden estár asociados a un único reactivo.
reactiveConsumption_Schema.belongsTo(reactive_Schema, {
	foreignKey: 'id_reactive_fk',
	targetKey: 'id_reactive',
	onDelete: 'CASCADE',
})

// Relación Muchos a Uno (1:n)
// Un reactivos pueden estár asociado a un varios comsumos .
reactive_Schema.hasMany(reactiveConsumption_Schema, {
	foreignKey: 'id_reactive_fk',
	targetKey: 'id_reactive',
	onDelete: 'CASCADE',
})

/* ------------------------------- REQUEST_REACTIVE -----------------------------*/

export const request_reactive_Schema = db_main.define(
	'requests_reactives',
	{
		id_request_reactive: {
			type: DataTypes.UUID,
			defaultValue: DataTypes.UUIDV4,
			primaryKey: true,
		},
		id_reactive_fk: {
			type: DataTypes.UUID,
			allowNull: false,
			references: {
				model: 'reactives',
				key: 'id_reactive',
			},
		},
		id_supervisor_fk: {
			type: DataTypes.UUID,
			allowNull: false,
			references: {
				model: 'users',
				key: 'id_user',
			},
		},
		description: {
			type: DataTypes.STRING,
			allowNull: false,
		},
		amount_request: {
			type: DataTypes.INTEGER,
			allowNull: false,
		},
		status: {
			type: DataTypes.STRING,
			allowNull: false,
			defaultValue: 'pending',
			validate: {
				isIn: [['pending', 'approved', 'rejected']],
			},
		},
	},
	{
		timestamps: true,
		tableName: 'requests_reactives',
	}
)

// Relación Muchos a Uno (n:1)
// Varias peticiones de reactivos estan asociadas a un reactivo
request_reactive_Schema.belongsTo(reactive_Schema, {
	foreignKey: 'id_reactive_fk',
	targetKey: 'id_reactive',
})

// Relación Uno a Muchos (1:n)
// Una reactivo puede tener varias peticiones de reactivos
reactive_Schema.hasMany(request_reactive_Schema, {
	foreignKey: 'id_reactive_fk',
	sourceKey: 'id_reactive',
})

// Relación Muchos a Uno (n:1)
// Varias peticiones de reactivos son realizadas por un supervisor
request_reactive_Schema.belongsTo(user_Schema, {
	foreignKey: 'id_supervisor_fk',
	targetKey: 'id_user',
})

// Relación Uno a Muchos (1:n)
// Una supervisor puede realizar varias peticiones de reactivos
user_Schema.hasMany(request_reactive_Schema, {
	foreignKey: 'id_supervisor_fk',
	sourceKey: 'id_user',
})

/* ------------------------------- KARDEX -----------------------------*/

export const kardex_Schema = db_main.define(
	'kardex',
	{
		id_kardex: {
			type: DataTypes.UUID,
			defaultValue: DataTypes.UUIDV4,
			primaryKey: true,
		},
		id_reactive: {
			type: DataTypes.UUID,
			allowNull: false,
			references: {
				model: 'reactives',
				key: 'id_reactive',
			},
		},
		action_type: {
			type: DataTypes.ENUM('consumption', 'adjustment', 'entry', 'return'),
			allowNull: false,
		},
		id_responsible: {
			type: DataTypes.UUID,
			allowNull: false,
			references: {
				model: 'users',
				key: 'id_user',
			},
		},
		quantity: {
			type: DataTypes.FLOAT,
			allowNull: false,
		},
		unit: {
			type: DataTypes.ENUM('g', 'mg', 'kg', 'l', 'ml', 'units'),
			allowNull: false,
		},
		balance_after_action: {
			type: DataTypes.FLOAT,
			allowNull: false,
		},
		action_date: {
			type: DataTypes.DATE,
			allowNull: false,
			defaultValue: DataTypes.NOW,
		},
		notes: {
			type: DataTypes.STRING,
			allowNull: true,
		},
	},
	{
		timestamps: true,
		tableName: 'kardex',
	}
)

// Relación Muchos a Uno (n:1)
// Varios kardex de reactivos de reactivos pueden estár asociados a un único reactivo.
kardex_Schema.belongsTo(reactive_Schema, {
	foreignKey: 'id_reactive',
	targetKey: 'id_reactive',
})

// Relación Muchos a Uno (n:1)
// Varios kardex de reactivos de reactivos pueden estár asociados a un único usuario.
kardex_Schema.belongsTo(user_Schema, {
	foreignKey: 'id_responsible',
	targetKey: 'id_user',
})

/* ------------------------------- SAMPLES -----------------------------*/

export const sample_Schema = db_main.define(
	'samples',
	{
		id_sample: {
			type: DataTypes.UUID,
			defaultValue: DataTypes.UUIDV4,
			primaryKey: true,
		},
		number: {
			type: DataTypes.INTEGER,
			allowNull: false,
		},
		date_received: {
			type: DataTypes.DATE,
			allowNull: false,
		},
		applicant_name: {
			type: DataTypes.STRING,
			allowNull: false,
		},
		identification_card: {
			type: DataTypes.STRING,
			allowNull: false,
		},
		phone: {
			type: DataTypes.STRING,
			allowNull: false,
		},
		email: {
			type: DataTypes.STRING,
			allowNull: false,
		},
		address: {
			type: DataTypes.STRING,
			allowNull: false,
		},
		sample_code: {
			type: DataTypes.STRING,
			allowNull: false,
		},
		sample_name: {
			type: DataTypes.STRING,
			allowNull: false,
		},
		quantity: {
			type: DataTypes.STRING,
			allowNull: false,
		},
		container: {
			type: DataTypes.STRING,
			allowNull: false,
		},
		state: {
			type: DataTypes.ENUM('líquido', 'sólido', 'gaseoso'),
			allowNull: false,
		},
		required_analysis: {
			type: DataTypes.STRING,
			allowNull: false,
		},
		type: {
			type: DataTypes.ENUM('thesis', 'project', 'external'),
			allowNull: false,
		},
		id_analyst_fk: {
			type: DataTypes.UUID,
			allowNull: false,
			references: {
				model: 'users',
				key: 'id_user',
			},
		},
		report_number: {
			type: DataTypes.STRING,
			allowNull: false,
		},
	},
	{
		timestamps: true,
		tableName: 'samples',
	}
)

// Relación Uno a Muchos (1:n)
// Un analista puede recibir varios muestras.
user_Schema.hasMany(sample_Schema, {
	foreignKey: 'id_analyst_fk',
	sourceKey: 'id_user',
})

// Relación Muchos a Uno (n:1)
// Varios muetras pueden estár asociado a un mismo analista.
sample_Schema.belongsTo(user_Schema, {
	foreignKey: 'id_analyst_fk',
	targetKey: 'id_user',
})

/* ------------------------------- SAMPLES QUOTATIONS -----------------------------*/

export const sample_quotations_Schema = db_main.define(
	'sample_quotations',
	{
		id_sample_quotation: {
			type: DataTypes.UUID,
			defaultValue: DataTypes.UUIDV4,
			primaryKey: true,
		},
		request_date: {
			type: DataTypes.DATE,
			allowNull: false,
			defaultValue: DataTypes.NOW,
		},
		applicant_identification_card: {
			type: DataTypes.STRING,
			allowNull: false,
		},
		id_access_manager_fk: {
			type: DataTypes.UUID,
			allowNull: false,
			references: {
				model: 'users',
				key: 'id_user',
			},
		},
		id_lab_fk: {
			type: DataTypes.UUID,
			allowNull: false,
			references: {
				model: 'laboratories',
				key: 'id_lab',
			},
		},
		status: {
			type: DataTypes.ENUM('pending', 'approved', 'rejected'),
			allowNull: false,
			defaultValue: 'pending',
		},
		notes: {
			type: DataTypes.STRING,
			allowNull: true,
		},
	},
	{
		timestamps: true,
		tableName: 'sample_quotations',
	}
)

// Relación Uno a Muchos (1:n)
// Una adminstrador de acceso puede registrar peticiones de accesos accesos
user_Schema.hasMany(sample_quotations_Schema, {
	foreignKey: 'id_approver_fk',
	sourceKey: 'id_user',
})

// Relación Uno a Muchos (n:1)
// Una adminstrador de acceso puede registrar peticiones de accesos accesos
sample_quotations_Schema.belongsTo(user_Schema, {
	foreignKey: 'id_approver_fk',
	targetKey: 'id_user',
})

// Relación Uno a Muchos (1:n)
// Un laboratorio puede recivir varias peticiones
laboratory_Schema.hasMany(sample_quotations_Schema, {
	foreignKey: 'id_lab_fk',
	sourceKey: 'id_lab',
})

// Relación Muchos a Uno (n:1)
// Vasias peticiones puede recivir un laboratorio
sample_quotations_Schema.belongsTo(laboratory_Schema, {
	foreignKey: 'id_lab_fk',
	targetKey: 'id_lab',
})

/* ------------------------------- SAMPLE REPORT -----------------------------*/

export const report_Schema = db_main.define(
	'sample_reports',
	{
		id_sample_report: {
			type: DataTypes.UUID,
			defaultValue: DataTypes.UUIDV4,
			primaryKey: true,
		},
		number: {
			type: DataTypes.INTEGER,
			allowNull: false,
		},
		issue_date: {
			type: DataTypes.DATE,
			allowNull: false,
		},
		analyst_abbreviation: {
			type: DataTypes.STRING,
			allowNull: false,
		},
		report_code: {
			type: DataTypes.STRING,
			allowNull: false,
		},
		id_sample_fk: {
			type: DataTypes.UUID,
			allowNull: false,
			references: {
				model: 'samples',
				key: 'id_sample',
			},
		},
		id_analyst_fk: {
			type: DataTypes.UUID,
			allowNull: false,
			references: {
				model: 'users',
				key: 'id_user',
			},
		},
	},
	{
		timestamps: true,
		tableName: 'sample_reports',
	}
)

// Relación Muchos a Uno (n:1)
// Varios reportes puden estas asociados a una muestra
report_Schema.belongsTo(sample_Schema, {
	foreignKey: 'id_sample_fk',
	targetKey: 'id_sample',
})

// Relación Uno a Muchos (1:n)
// Una mustra puede tener varios reportes
sample_Schema.hasMany(report_Schema, {
	foreignKey: 'id_sample_fk',
	sourceKey: 'id_sample',
})

// Relación Muchos a Uno (n:1)
// Varios reportes puden ser realizados por un analista
report_Schema.belongsTo(user_Schema, {
	foreignKey: 'id_analyst_fk',
	targetKey: 'id_user',
})

// Relación Uno a Muchos (1:n)
// Un analista puede realizar varios reportes
user_Schema.hasMany(report_Schema, {
	foreignKey: 'id_analyst_fk',
	sourceKey: 'id_user',
})

/* ------------------------------- QUOTATIONS -----------------------------*/

export const quotation_Schema = db_main.define(
	'quotations',
	{
		id_quotation: {
			type: DataTypes.UUID,
			defaultValue: DataTypes.UUIDV4,
			primaryKey: true,
		},
		id_request_reactive_fk: {
			type: DataTypes.UUID,
			allowNull: false,
			references: {
				model: 'requests_reactives',
				key: 'id_request_reactive',
			},
		},
		status: {
			type: DataTypes.STRING,
			allowNull: false,
			defaultValue: 'pending',
			validate: {
				isIn: [['pending', 'accepted', 'rejected']],
			},
		},
		issue_date: {
			type: DataTypes.DATE,
			allowNull: false,
			defaultValue: DataTypes.NOW,
		},
	},
	{
		timestamps: true,
		tableName: 'quotations',
	}
)

// Relación Muchos a Uno (n:1)
// Varias cotizaciones son aprobadas por un director
quotation_Schema.belongsTo(request_reactive_Schema, {
	foreignKey: 'id_request_reactive_fk',
	targetKey: 'id_request_reactive',
})

/* ------------------------------- LOGS -----------------------------*/

export const logs_Schema = db_main.define(
	'logs',
	{
		id_log: {
			type: DataTypes.UUID,
			defaultValue: DataTypes.UUIDV4,
			primaryKey: true,
		},
		level: {
			type: DataTypes.STRING,
			allowNull: false,
		},
		user_fk: {
			type: DataTypes.UUID,
			allowNull: true,
		},
		message: {
			type: DataTypes.TEXT,
			allowNull: false,
		},
		httpMethod: {
			type: DataTypes.TEXT,
			allowNull: false,
		},
		action: {
			type: DataTypes.TEXT,
			allowNull: false,
		},
		meta: {
			type: DataTypes.JSON,
			allowNull: true,
		},
		ipAddress: {
			type: DataTypes.STRING,
			allowNull: true,
		},
		endpoint: {
			type: DataTypes.STRING,
			allowNull: true,
		},
	},
	{
		timestamps: true,
		timestamps: true,
		tableName: 'logs',
	}
)
