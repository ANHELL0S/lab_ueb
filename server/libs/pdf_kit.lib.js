import fs from 'fs'
import path from 'path'
import PDFDocument from 'pdfkit-table'

const __dirname = path.dirname(new URL(import.meta.url).pathname)

async function generatePdfTable({ title, header, title_rows, rows, filename, institutionData }, res = null) {
	const doc = new PDFDocument({ margin: 30, size: 'A4' })

	if (res) {
		res.setHeader('Content-Disposition', `attachment; filename=${filename}`)
		res.setHeader('Content-Type', 'application/pdf')
		doc.pipe(res)
	}

	const logoPath = path.join(__dirname, '../assets/images/UEB.png')

	try {
		if (fs.existsSync(logoPath)) {
			doc.image(logoPath, { width: 160, align: 'left' })
			doc.moveDown(4.5)
		}

		if (institutionData) {
			doc.fontSize(12).text(institutionData.name, { align: 'left' })
			doc.moveDown(0.5)
			doc.fontSize(10).text(institutionData.address, { align: 'left' })
			doc.moveDown(0.5)
			doc.fontSize(10).text(institutionData.contact, { align: 'left' })
			doc.moveDown(2)
		}

		doc.moveTo(30, doc.y).lineTo(550, doc.y).stroke()
		doc.moveDown(2)

		if (title) {
			doc.fontSize(15).text(`${title}`, { align: 'left' })
			doc.moveDown(0.8)
		}

		if (header) {
			Object.entries(header).forEach(([key, value]) => {
				doc.fontSize(10).text(`${value}`, { align: 'left' })
				doc.moveDown(0.5)
			})
			doc.moveDown(1.5)
		}

		const table = {
			headers: title_rows,
			rows,
		}

		await doc.table(table, {
			prepareHeader: () => doc.font('Helvetica-Bold').fontSize(9),
			prepareRow: (row, i) => doc.font('Helvetica').fontSize(9),
		})
	} catch (error) {
		console.error('Error generating PDF:', error)
	} finally {
		doc.end()
	}
}

export { generatePdfTable }
