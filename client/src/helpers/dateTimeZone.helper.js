import moment from 'moment-timezone'

export const currentDate = moment().tz('America/Guayaquil').format('YYYY-MM-DD_HH-mm')
