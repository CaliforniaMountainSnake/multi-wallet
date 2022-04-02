#!make
include .env
export
.DEFAULT_GOAL := help

#-------------------------------------------------------------------------------
# Main commands:
#-------------------------------------------------------------------------------
help: ## Show this help
	@awk 'BEGIN {FS = ":.*?## "} /^[^-][0-9a-zA-Z_-]+:.*?## / {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}' $(MAKEFILE_LIST)

#---------------------------------------
start: --assert-prerequisites --up ## Start   project

stop: --down ## Stop    project

restart: stop start ## Restart project

#---------------------------------------
it-nginx: ## Get into the "nginx" container terminal
	docker exec -it ${CONTAINER_NAME_NGINX} bash

#-------------------------------------------------------------------------------
# Docker commands:
#-------------------------------------------------------------------------------
docker-ps-short: ## Show all running docker containers in short form
	clear && docker ps -a --format "table {{.ID}}\t{{.Names}}\t{{.Image}}\t{{.Status}}"

docker-remove-all-containers: ## WARNING! Stop and remove ALL docker containers
	clear && docker stop `docker ps -a -q` && docker rm `docker ps -a -q` && docker ps -a

docker-remove-all-images: ## WARNING! Remove ALL docker images
	clear && docker rmi `docker images -q`

docker-prune-force: ## WARNING! Force prune old docker containers, networks, images, build cache
	docker system prune --force

#-------------------------------------------------------------------------------
# Hidden commands:
#-------------------------------------------------------------------------------
--up: ## Only up   containers
	docker-compose up -d --build

--down: ## Only down containers
	docker-compose down


#-------------------------------------------------------------------------------
--assert-prerequisites:--assert-env-file-exists ## Assert all prerequisites to run

--assert-env-file-exists: ## Assert .env file exists
	@if [ ! -f .env ]; then \
		echo '".env" file not found! Create the ".env" file before running the application!'; \
		return 1; \
	fi
