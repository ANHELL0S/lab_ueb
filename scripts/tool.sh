#!/bin/bash

# Parámetros de la base de datos
DB_HOST=127.0.0.1
DB_PORT=5432
DB_NAME=lab_ueb_local
DB_USER=postgres
DB_PASSWORD=Shouko2022@

BACKUP_DIR="../backups/db"
LOG_DIR="../backups/logs"

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
CYAN='\033[0;36m'
BLUE='\033[1;38;5;37m'
NC='\033[0m' # Sin color

# Emojis
CHECK_MARK="✅"
CROSS_MARK="❌"
WARNING="🚨"
INFO="💡"
BACKUP="💾"
TRASH="🗑️"
TABLE="📊"
REFRESH="🔄"
LOCK="🔒"

# Crear los directorios de backups y logs si no existen
mkdir -p "$BACKUP_DIR"
mkdir -p "$LOG_DIR"

# Función para hacer backup de la base de datos con validaciones
backup_db() {
    # Verificar si la base de datos existe
    DB_EXISTS=$(PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -lqt | cut -d \| -f 1 | grep -w "$DB_NAME")

    if [[ -z "$DB_EXISTS" ]]; then
        echo -e "${RED}${CROSS_MARK} La base de datos '$DB_NAME' no existe.${NC}"
        read -p "Pulsa enter para regresar al menú..."
        return
    fi

    # Verificar si la base de datos tiene tablas
    TABLES=$(PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "SELECT tablename FROM pg_tables WHERE schemaname = 'public';")

    if [[ -z "$TABLES" ]]; then
        echo -e "${RED}${CROSS_MARK} No hay tablas en la base de datos '$DB_NAME'. No se puede realizar el backup.${NC}"
        read -p "Pulsa enter para regresar al menú..."
        return
    fi

    # Si pasa las validaciones, proceder con el backup
    local TIMESTAMP=$(date +%d-%m-%Y-%H:%M:%S)
    local BACKUP_FILE="$BACKUP_DIR/${DB_NAME}_${TIMESTAMP}.sql"
    local LOG_FILE="$LOG_DIR/${DB_NAME}_${TIMESTAMP}.log"
    
    echo -e "\n${YELLOW}${INFO} Iniciando backup de la base de datos...${NC}"
    
    # Ejecutar pg_dump y redirigir salida a log
    PGPASSWORD=$DB_PASSWORD pg_dump -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -F c -b -v -f "$BACKUP_FILE" > "$LOG_FILE" 2>&1
    
    if [[ $? -eq 0 ]]; then
        echo -e "${GREEN}${CHECK_MARK} Backup realizado exitosamente en: $BACKUP_FILE${NC}\n"
    else
        echo -e "${RED}${CROSS_MARK} Error al realizar el backup. Verifique los detalles en el archivo de log: $LOG_FILE${NC}\n"
    fi
    read -p "Pulsa enter para regresar al menú..."
}

# Función para mostrar los backups en formato de tabla con fecha en formato personalizado
show_backups() {
    echo -e "\n${YELLOW}${INFO} Lista de backups disponibles${NC}"
    echo -e "\n${CYAN}+------------------+---------------------+--------------------------------+${NC}"    
    # Mostrar encabezados en formato de tabla ASCII
    echo -e "${CYAN}| Size             | Date                | Name                           |${NC}"
    echo -e "${CYAN}+------------------+---------------------+--------------------------------+${NC}"
    
    # Listar archivos con detalles
    for FILE in "$BACKUP_DIR"/*; do
        if [[ -f "$FILE" ]]; then
            # Extraer detalles del archivo
            FILE_NAME=$(basename "$FILE")
            FILE_SIZE_KB=$(awk "BEGIN {printf \"%.2f KB\", $(stat -c %s "$FILE")/1024}")
            
            # Obtener la fecha de modificación del archivo en formato personalizado
            FILE_DATE=$(date -r "$FILE" "+%d-%m-%Y %H:%M:%S")
            
            # Imprimir detalles formateados
            printf "${CYAN}| ${NC}%-16s ${CYAN}| ${NC}%-19s ${CYAN}| ${NC}%-23s ${CYAN}|\n" "$FILE_SIZE_KB" "$FILE_DATE" "$FILE_NAME"
        fi
    done
    
    echo -e "${CYAN}+------------------+---------------------+--------------------------------+${NC}\n"
    read -p "Pulsa enter para regresar al menú..."
}

# Función para eliminar backups
delete_backups() {
    show_backups
    read -p "Ingresa los nombres de los archivos de backup a eliminar (separados por espacios): " -a BACKUP_FILES
    if [[ ${#BACKUP_FILES[@]} -eq 0 ]]; then
        echo -e "${RED}${CROSS_MARK} No se ingresaron archivos para eliminar.${NC}"
        read -p "Pulsa enter para regresar al menú..."
        return
    fi
    for FILE in "${BACKUP_FILES[@]}"; do
        FILE_PATH="$BACKUP_DIR/$FILE"
        if [[ -f "$FILE_PATH" ]]; then
            rm "$FILE_PATH"
            echo -e "${GREEN}${CHECK_MARK} Backup $FILE eliminado exitosamente.${NC}"
        else
            echo -e "${RED}${CROSS_MARK} El archivo de backup $FILE no existe.${NC}"
        fi
    done
    read -p "Pulsa enter para regresar al menú..."
}

# Función para restaurar la base de datos desde un backup
restore_db() {
    show_backups
    read -p "Ingresa el nombre del archivo de backup a restaurar (con extensión): " BACKUP_FILE
    BACKUP_FILE_PATH="$BACKUP_DIR/$BACKUP_FILE"
    if [[ -f "$BACKUP_FILE_PATH" ]]; then
        echo -e "${YELLOW}${INFO} Restaurando la base de datos desde $BACKUP_FILE_PATH...${NC}"
        PGPASSWORD=$DB_PASSWORD pg_restore -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -v "$BACKUP_FILE_PATH"
        if [[ $? -eq 0 ]]; then
            echo -e "${GREEN}${CHECK_MARK} Restauración completada exitosamente.${NC}"
        else
            echo -e "${RED}${CROSS_MARK} Error al restaurar la base de datos.${NC}"
        fi
    else
        echo -e "${RED}${CROSS_MARK} El archivo de backup no existe.${NC}"
    fi
    read -p "Pulsa enter para regresar al menú..."
}

# Función para eliminar todos los registros de la base de datos
delete_all_records() {
    echo -e "${YELLOW}${WARNING} Eliminando todos los registros de la base de datos...${NC}"
    TABLES=$(psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "SELECT tablename FROM pg_tables WHERE schemaname = 'public'")
    if [[ -z "$TABLES" ]]; then
        echo -e "${RED}${CROSS_MARK} No hay tablas disponibles en la base de datos.${NC}"
        read -p "Pulsa enter para regresar al menú..."
        return
    fi
    for TABLE in $TABLES; do
        PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "TRUNCATE TABLE $TABLE RESTART IDENTITY CASCADE;"
    done
    if [[ $? -eq 0 ]]; then
        echo -e "${GREEN}${CHECK_MARK} Todos los registros han sido eliminados exitosamente.${NC}"
    else
        echo -e "${RED}${CROSS_MARK} Error al eliminar los registros.${NC}"
    fi
    read -p "Pulsa enter para regresar al menú..."
}

# Función para eliminar toda la base de datos
delete_db() {
    read -p "¿Estás seguro de que deseas eliminar toda la base de datos? (S/N): " CONFIRM
    if [[ "$CONFIRM" == "S" || "$CONFIRM" == "s" ]]; then
        echo -e "${YELLOW}${WARNING} Eliminando toda la base de datos...${NC}"
        PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
        if [[ $? -eq 0 ]]; then
            echo -e "${GREEN}${CHECK_MARK} Base de datos eliminada exitosamente.${NC}"
        else
            echo -e "${RED}${CROSS_MARK} Error al eliminar la base de datos.${NC}"
        fi
    else
        echo -e "${RED}${CROSS_MARK} Operación cancelada.${NC}"
    fi
    read -p "Pulsa enter para regresar al menú..."
}

# Función para mostrar las tablas en la base de datos
show_tables() {
    echo -e "\n${YELLOW}${INFO} Tablas de la base datos${NC}\n"
    PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "\dt"
    read -p "Pulsa enter para regresar al menú..."
}

# Función para mostrar los registros de una tabla específica
show_records() {
    show_tables
    read -p "Ingresa el nombre de la tabla para mostrar los registros: " TABLE_NAME
    if [[ -z "$TABLE_NAME" ]]; then
        echo -e "${RED}${CROSS_MARK} No se ingresó un nombre de tabla. Operación cancelada.${NC}"
        read -p "Pulsa enter para regresar al menú..."
        return
    fi
    echo -e "\n${YELLOW}${INFO} Registros de la tabla${NC}\n"
    PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "SELECT * FROM $TABLE_NAME;"
    read -p "Pulsa enter para regresar al menú..."
}

# Función para refrescar la collation de la base de datos
refresh_collation() {
    echo -e "\n${YELLOW}${REFRESH} Refrescando la collation de la base de datos...${NC}"
    PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "UPDATE pg_collation SET collname = 'en_US.UTF-8' WHERE collname = 'C';"
    if [[ $? -eq 0 ]]; then
        echo -e "${GREEN}${CHECK_MARK} Collation actualizada exitosamente.${NC}\n"
    else
        echo -e "${RED}${CROSS_MARK} Error al actualizar la collation.${NC}\n"
    fi
    read -p "Pulsa enter para regresar al menú..."
}

# Menú principal
while true; do
    clear
    echo -e " _____   _    _  _____"
    echo -e "|  __ \ | |  | ||_   _|"
    echo -e "| |__) || |  | |  | |"
    echo -e "|  ___/ | |  | |  | |"
    echo -e "| |     | |__| | _| |_"
    echo -e "|_|      \____/ |_____|"
    echo -e "\t\t\tᵇʸ ᴬⁿᵍᵉˡᵒ\n"

    echo -e "${YELLOW}1) Backup de la base de datos ${NC}"
    echo -e "${YELLOW}2) Mostrar backups ${NC}"
    echo -e "${YELLOW}3) Eliminar backups ${NC}"
    echo -e "${YELLOW}4) Restaurar base de datos ${NC}"
    echo -e "${YELLOW}5) Eliminar todos los registros ${NC}"
    echo -e "${YELLOW}6) Eliminar base de datos ${NC}"
    echo -e "${YELLOW}7) Mostrar tablas ${NC}"
    echo -e "${YELLOW}8) Mostrar registros de una tabla ${NC}"
    echo -e "${YELLOW}9) Refrescar collation ${NC}"
    echo -e "${YELLOW}0) Salir ${NC}\n"
    read -p "-> Qué quieres hacer: " option
    case $option in
        1) backup_db ;;
        2) show_backups ;;
        3) delete_backups ;;
        4) restore_db ;;
        5) delete_all_records ;;
        6) delete_db ;;
        7) show_tables ;;
        8) show_records ;;
        9) refresh_collation ;;
        0) exit 0 ;;
        *) echo -e "${RED}${CROSS_MARK} Opción inválida. Intenta de nuevo.${NC}" ;;
    esac
done
