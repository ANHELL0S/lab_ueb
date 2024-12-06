import { transporter, defaultFromEmail } from '../config/mailer.config.js'
import { env } from '../config/env.config.js'

const send_email_with_info_sigup = async (full_name, email, identification_card) => {
	return new Promise((resolve, reject) => {
		const subject = 'Bienvenid@'
		const html = `
		<!DOCTYPE html>
			<html lang="es">
			<head>
					<meta charset="UTF-8">
					<meta name="viewport" content="width=device-width, initial-scale=1.0">
					<style>
							body {
									font-family: Arial, sans-serif;
									color: #333;
									margin: 0;
									padding: 0;
									background-color: #f4f4f4;
							}
							.container {
									max-width: 600px;
									margin: auto;
									padding: 20px;
									background-color: #fff;
									border-radius: 8px;
									box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
							}
							.header {
									text-align: center;
									padding: 20px 0;
							}
							.header img {
									width: 200px;
							}
							.content {
									text-align: left;
									padding: 20px;
							}
							.content h2 {
									color: #3b444d;
									font-size: 18px;
									margin-bottom: 10px;
							}
							.content p {
									color: #666;
									font-size: 16px;
									line-height: 1.5;
							}
							.content .important {
									color: #3b4552;
									font-weight: bold;
							}
							.footer {
									text-align: center;
									margin-top: 20px;
									color: #999;
									font-size: 12px;
							}
					</style>
			</head>
			
			<body>
					<div class="container">
						<div class="content">
								<h2>¡Hola ${full_name}! 👋</h2>
								<p>Bienvenid@ al sistema de gestión de laboratorios - UEB.</p>
								<p>Para iniciar sesión en el sistema, utiliza el siguiente enlace: <a href="${env.URL_MAIN}" target="_blank">${env.URL_MAIN}</a></p>
								<p>Tus credenciales para poder ingresar son:</p>
								<p><strong>Email:</strong> ${email}</p>
								<p><strong><strong>Contraseña:</strong> ${identification_card}</p>
								<p>Por favor, no compartas tus crendenciales con nadie y guardalas en un lugar seguro.</p>
								<p>Si necesitas asistencia o tienes alguna pregunta, no dudes en contactarnos a través de nuestro <a href="https://wa.me/0980868530" target="_blank">soporte</a>:</p>
						</div>
					</div>
			</body>
			</html>
		`
		const mailOptions = {
			from: ` UEB - SGL <${defaultFromEmail}>`,
			to: email,
			subject: subject,
			html: html,
		}

		transporter.sendMail(mailOptions, (error, info) => {
			if (error) {
				console.log('Error al enviar correo:', error)
				reject(error)
			} else {
				console.log('Correo enviado:', info.response)
				resolve(true)
			}
		})
	})
}

const sendCodeResetPassword = async (email, token) => {
	const resetLink = `${env.URL_MAIN}/restablecer-contraseña/${token}`

	const mailOptions = {
		from: defaultFromEmail,
		to: email,
		subject: 'Restablecer contraseña',
		text: `Utiliza el siguiente enlace para restablecer tu contraseña: ${resetLink}`,
		html: `
					<p>Utiliza el siguiente enlace para restablecer tu contraseña: <a href="${resetLink}">Restablecer contraseña</a></p>
					<p>Este enlace es válido solo por 5 minutos. Asegúrate de usarlo antes de que expire.</p>
			`,
	}

	return new Promise((resolve, reject) => {
		transporter.sendMail(mailOptions, (error, info) => {
			if (error) {
				reject(error)
			} else {
				resolve(resetLink)
			}
		})
	})
}

const sendCodeResetPasswordForClient = async (email, token) => {
	const resetLink = `${env.URL_MAIN}/restablecer-contraseña/${token}`

	const mailOptions = {
		from: defaultFromEmail,
		to: email,
		subject: 'Solicitud para restablecer su contraseña',
		text: `Ha solicitado restablecer su contraseña. Por favor, utilice el siguiente enlace para completar el proceso: ${resetLink}. Recuerde que el enlace estará activo solo por 5 minutos.`,
		html: `
        <p>Estimado/a usuario,</p>
        <p>Hemos recibido una solicitud para restablecer la contraseña de su cuenta. Para continuar, por favor haga clic en el siguiente enlace:</p>
        <p><a href="${resetLink}" style="color: #007bff; text-decoration: none;">Restablecer contraseña</a></p>
        <p>Este enlace estará activo solo durante los próximos 5 minutos. Si no solicitó este cambio, puede ignorar este mensaje y su contraseña permanecerá segura.</p>
        <p>Atentamente,<br>El equipo de soporte</p>
    `,
	}

	transporter.sendMail(mailOptions, (error, info) => {
		if (error) {
			console.log('Error al enviar correo:', error)
		} else {
			console.log('Correo enviado:', info.response)
			console.log(resetLink)
		}
	})
}

export { send_email_with_info_sigup, sendCodeResetPassword, sendCodeResetPasswordForClient }
