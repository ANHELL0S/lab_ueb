#!/bin/bash

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
CYAN='\033[0;36m'
BLUE='\033[1;38;5;37m'
RESET='\033[0m'

# Display the script header
show_art() {
    echo -e " _____   _    _  _____"
    echo -e "|  __ \ | |  | ||_   _|"
    echo -e "| |__) || |  | |  | |"
    echo -e "|  ___/ | |  | |  | |"
    echo -e "| |     | |__| | _| |_"
    echo -e "|_|      \____/ |_____|"
    echo -e "\t\t\tᵇʸ ᴬⁿᵍᵉˡᵒ\n"
}

# Function to display help information
show_help() {
    echo -e "${YELLOW}  Status    - Check PostgreSQL status and the installation of concurrently"
    echo "  Start     - Start the project (checks and starts PostgreSQL and concurrently)"
    echo "  Stop      - Stop PostgreSQL service"
    echo "  Restart   - Restart PostgreSQL service and start the project"
    echo "  Exit      - Exit the script"
    echo "  Help      - Display this help message"
    wait_for_user
}

# Function to check PostgreSQL status
check_postgresql_status() {
    echo -e "${YELLOW}\nChecking PostgreSQL status..."
    if systemctl is-active --quiet postgresql.service; then
        echo -e "${GREEN}✅ PostgreSQL is running${RESET}"
    else
        echo -e "${RED}❌ PostgreSQL is not running${RESET}"
    fi
}

# Function to verify the installation of concurrently
verify_concurrently() {
    echo -e "${YELLOW}\nVerifying concurrently installation..."
    if ! command -v concurrently &> /dev/null; then
        echo -e "${RED}❌ Concurrently is not installed${RESET}"
    else
        echo -e "${GREEN}✅ Concurrently is installed${RESET}"
    fi
}

# Function to install concurrently
install_concurrently() {
    echo -e "${YELLOW}\nInstalling concurrently..."
    sudo npm install -g concurrently
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Concurrently installed successfully${RESET}"
    else
        echo -e "${RED}❌ Error installing concurrently${RESET}"
        exit 1
    fi
}

# Function to start PostgreSQL service
start_postgresql() {
    echo -e "${YELLOW}\nStarting PostgreSQL service..."
    systemctl start postgresql.service
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ PostgreSQL started successfully${RESET}"
    else
        echo -e "${RED}❌ Error starting PostgreSQL${RESET}"
        exit 1
    fi
}

# Function to start the project
start_project() {
    echo -e "${YELLOW}\nStarting the project..."
    concurrently "cd ../server && npm run dev" "cd ../client && npm run dev"
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Project started${RESET}"
    else
        echo -e "${RED}❌ Error starting the project${RESET}"
        exit 1
    fi
}

# Function to stop PostgreSQL service
stop_postgresql() {
    echo -e "${YELLOW}\nStopping PostgreSQL service..."
    sudo systemctl stop postgresql.service
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ PostgreSQL stopped${RESET}"
    else
        echo -e "${RED}❌ Error stopping PostgreSQL${RESET}"
        exit 1
    fi
}

# Function to restart PostgreSQL service
restart_postgresql() {
    echo -e "${YELLOW}\nRestarting PostgreSQL service..."
    sudo systemctl restart postgresql.service
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ PostgreSQL restarted${RESET}"
    else
        echo -e "${RED}❌ Error restarting PostgreSQL${RESET}"
        exit 1
    fi
}

# Function to wait for user input
wait_for_user() {
    echo -e "${RESET}\nPress enter to return to the menu..."
    read -n 1
}

# Function to handle the 'status' option
handle_status() {
    check_postgresql_status
    verify_concurrently
    wait_for_user
}

# Function to handle the 'start' option
handle_start() {
    check_postgresql_status
    if ! command -v concurrently &> /dev/null; then
        install_concurrently
    fi
    start_postgresql
    start_project
    wait_for_user
}

# Function to handle the 'stop' option
handle_stop() {
    stop_postgresql
    wait_for_user
}

# Function to handle the 'restart' option
handle_restart() {
    restart_postgresql
    start_project
    wait_for_user
}

# Main menu loop
while true; do
    clear
    show_art
    echo -e "${YELLOW}1) Status"
    echo "2) Start"
    echo "3) Stop"
    echo "4) Restart"
    echo "5) Exit"
    echo -e "6) Help ${RESET}"
    echo

    read -p "-> Qué quieres hacer: " choice
    echo

    case "$choice" in
        1)
            handle_status
            ;;
        2)
            handle_start
            ;;
        3)
            handle_stop
            ;;
        4)
            handle_restart
            ;;
        5)
            echo -e "${CYAN}Exiting the script. Goodbye!${RESET}"
            exit 0
            ;;
        6)
            show_help
            ;;
        *)
            echo -e "${RED}Invalid option. Please select a number between 1 and 6.${RESET}"
            wait_for_user
            ;;
    esac
done
